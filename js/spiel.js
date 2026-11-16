// ============================================================
//  SPIEL  -  Ablauf, Steuerung, Punkte, Turnier, Kamera
// ============================================================
(function () {
  'use strict';

  // ---------- Grundgeruest ----------
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('buehne').appendChild(renderer.domElement);

  var szene = new THREE.Scene();
  szene.background = new THREE.Color(0x9fd4f5);
  szene.fog = new THREE.Fog(0x9fd4f5, 90, 330);

  var kamera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);

  szene.add(new THREE.HemisphereLight(0xffffff, 0x8aa86a, 1.5));
  var sonne = new THREE.DirectionalLight(0xfff3d6, 2.2);
  sonne.position.set(30, 55, 25);
  sonne.castShadow = true;
  sonne.shadow.mapSize.set(2048, 2048);
  sonne.shadow.camera.left = -50; sonne.shadow.camera.right = 50;
  sonne.shadow.camera.top = 40; sonne.shadow.camera.bottom = -40;
  sonne.shadow.camera.far = 150;
  sonne.shadow.bias = -0.0005;
  szene.add(sonne);

  var platz = baueReitplatz(szene);

  var pferd = bauePferdMitReiterin();
  szene.add(pferd.wurzel);

  // Farbring unter dem Pferd
  var ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  var ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.75, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  ring.visible = false;
  pferd.wurzel.add(ring);

  // ---------- Hilfen ----------
  var el = function (id) { return document.getElementById(id); };
  function lade(name, ersatz) {
    try { var v = localStorage.getItem(name); return v ? JSON.parse(v) : ersatz; } catch (e) { return ersatz; }
  }
  function speichere(name, wert) {
    try { localStorage.setItem(name, JSON.stringify(wert)); } catch (e) { /* egal */ }
  }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kopie(o) { var n = {}; for (var k in o) n[k] = o[k]; return n; }
  function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.73; }

  // ---------- Spieler (jeder hat sein eigenes Outfit) ----------
  function volleOutfit(o) {
    var n = {};
    for (var k in START_OUTFIT) n[k] = (o && o[k]) || START_OUTFIT[k];
    return n;
  }
  var spieler = lade('reitturnier_spieler', null);
  if (!spieler || !spieler.length) spieler = [{ name: 'Spieler 1', outfit: lade('reitturnier_outfit', {}), siege: 0 }];
  spieler.forEach(function (s) { s.outfit = volleOutfit(s.outfit); s.siege = s.siege || 0; });
  var aktiv = 0;
  function speichereSpieler() { speichere('reitturnier_spieler', spieler); }

  var bestwerte = lade('reitturnier_best', {});
  var parcoursNr = Math.min(lade('reitturnier_parcours', 0), PARCOURS.length - 1);
  var gegnerAnzahl = lade('reitturnier_gegner', 2);
  var gegnerStufe = lade('reitturnier_stufe', 'leicht');
  var steuerung = lade('reitturnier_steuerung', 'auto');
  var stadionAn = lade('reitturnier_stadion', true);
  function zeigeStadion() { platz.stadion.gruppe.visible = stadionAn; platz.haus.visible = !stadionAn; }
  zeigeStadion();
  var taste = { links: false, rechts: false, schneller: false, langsamer: false };
  // halbe Breite, in der man ein Hindernis anreiten muss (Modell-Hindernisse sind schmaler)
  function halbeBreite() { return HINDERNIS_TEILE ? 1.5 : 2.2; }

  // ---------- Timing-Zonen ----------
  var FARBE = { perfekt: 0x1faa3c, gut: 0x9be05a, knapp: 0xffd23c, rot: 0xe5412d, neutral: 0xffffff };
  function zone(d) {
    if (d > TIMING.frueh || d < TIMING.spaet) return { punkte: 0, farbe: FARBE.rot };
    var e = Math.abs(d - TIMING.ideal);
    if (e <= TIMING.perfekt) return { punkte: 3, farbe: FARBE.perfekt };
    if (e <= TIMING.gut) return { punkte: 2, farbe: FARBE.gut };
    return { punkte: 1, farbe: FARBE.knapp };
  }

  // ---------- Parcours aufbauen ----------
  var weg = null;            // { laenge, posBei(s), richtungBei(s) }
  var hindernisse = [];
  var parcoursGruppe = null;
  var linie = null, pfeil = null, zielPos = new THREE.Vector3();

  function baueWeg(punkte) {
    var pts = punkte.map(function (p) { return new THREE.Vector3(p[0], 0, p[1]); });
    var kurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    var N = 3000, i;
    var P = [], L = [0];
    for (i = 0; i <= N; i++) {
      P.push(kurve.getPoint(i / N));
      if (i > 0) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
    }
    function posBei(s, ziel) {
      ziel = ziel || new THREE.Vector3();
      if (s <= 0) return ziel.copy(P[0]);
      if (s >= L[N]) return ziel.copy(P[N]);
      var lo = 0, hi = N;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
      var f = (s - L[lo]) / (L[hi] - L[lo] || 1);
      return ziel.copy(P[lo]).lerp(P[hi], f);
    }
    var a = new THREE.Vector3(), b = new THREE.Vector3();
    function richtungBei(s, ziel) {
      ziel = ziel || new THREE.Vector3();
      var s1 = Math.max(0, Math.min(L[N] - 1, s - 0.5));
      posBei(s1, a); posBei(s1 + 1, b);
      return ziel.copy(b).sub(a).normalize();
    }
    return {
      laenge: L[N], posBei: posBei, richtungBei: richtungBei,
      sVonPunkt: function (index) { return L[Math.round(index / (pts.length - 1) * N)]; }
    };
  }

  function baueParcours(nr) {
    if (parcoursGruppe) szene.remove(parcoursGruppe);
    parcoursGruppe = new THREE.Group();
    szene.add(parcoursGruppe);
    hindernisse = [];
    var p = PARCOURS[nr];
    weg = baueWeg(p.weg);

    var zonenGeo = new THREE.BoxGeometry(HINDERNIS_TEILE ? 2.3 : 2.6, 0.02, 0.27);
    var zonenMat = {};
    function matFuer(farbe) {
      if (!zonenMat[farbe]) zonenMat[farbe] = new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: 0.8, depthWrite: false });
      return zonenMat[farbe];
    }
    var pos = new THREE.Vector3(), dir = new THREE.Vector3();
    var nummer = 0;
    p.weg.forEach(function (punkt, index) {
      if (!punkt[2]) return;
      nummer++;
      var s = weg.sVonPunkt(index);
      var h = baueHindernis(punkt[2], punkt[3] || 0.8, nummer);
      weg.posBei(s, pos); weg.richtungBei(s, dir);
      h.gruppe.position.copy(pos);
      h.gruppe.rotation.y = Math.atan2(dir.x, dir.z);
      parcoursGruppe.add(h.gruppe);
      h.s = s;
      h.nr = nummer;
      h.pos = pos.clone();
      h.fx = dir.x; h.fz = dir.z;
      // Farbzone auf dem Boden vor dem Hindernis
      h.zonen = [];
      for (var d = TIMING.verweigern + 0.15; d <= TIMING.anzeige; d += 0.3) {
        var z = new THREE.Mesh(zonenGeo, matFuer(zone(d).farbe));
        weg.posBei(s - d, pos); weg.richtungBei(s - d, dir);
        z.position.set(pos.x, 0.02, pos.z);
        z.rotation.y = Math.atan2(dir.x, dir.z);
        parcoursGruppe.add(z);
        h.zonen.push(z);
      }
      hindernisse.push(h);
    });

    // Flaggen an Start und Ziel
    var start = baueFlaggen(0xe5412d);
    weg.posBei(5, pos); weg.richtungBei(5, dir);
    start.position.copy(pos); start.rotation.y = Math.atan2(dir.x, dir.z);
    parcoursGruppe.add(start);
    var ziel = baueFlaggen(0x1faa3c);
    weg.posBei(weg.laenge - 3, pos); weg.richtungBei(weg.laenge - 3, dir);
    ziel.position.copy(pos); ziel.rotation.y = Math.atan2(dir.x, dir.z);
    parcoursGruppe.add(ziel);
    zielPos.copy(pos);

    // Hilfslinie auf dem Boden (nur wenn man selbst lenkt)
    linie = new THREE.Group();
    var punktGeo = new THREE.CircleGeometry(0.16, 8);
    var punktMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false });
    for (var ls = 2; ls < weg.laenge - 3; ls += 1.6) {
      var pkt = new THREE.Mesh(punktGeo, punktMat);
      weg.posBei(ls, pos);
      pkt.position.set(pos.x, 0.015, pos.z);
      pkt.rotation.x = -Math.PI / 2;
      linie.add(pkt);
    }
    linie.visible = false;
    parcoursGruppe.add(linie);
    // Pfeil ueber dem naechsten Hindernis
    pfeil = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f }));
    pfeil.rotation.x = Math.PI;
    pfeil.visible = false;
    parcoursGruppe.add(pfeil);
  }

  // ---------- Ton (einfache Piepser, keine Dateien noetig) ----------
  var audio = null, tonAn = lade('reitturnier_ton', true);
  function ton(freq, dauer, art, laut, verz) {
    if (!tonAn) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime + (verz || 0);
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = art || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(laut || 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dauer + 0.02);
    } catch (e) { /* kein Ton moeglich */ }
  }
  // Hufschlag: kurzes dumpfes Klopfen aus Rauschen + tiefem Ton
  var rauschen = null;
  function rauschQuelle() {
    if (!rauschen) {
      rauschen = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      var daten = rauschen.getChannelData(0);
      for (var i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
    }
    var q = audio.createBufferSource();
    q.buffer = rauschen;
    q.loop = true;
    return q;
  }
  function huf(laut, hoehe) {
    if (!tonAn) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var q = rauschQuelle(), f = audio.createBiquadFilter(), g = audio.createGain();
      f.type = 'bandpass'; f.frequency.value = hoehe; f.Q.value = 1.2;
      g.gain.setValueAtTime(laut, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      q.connect(f); f.connect(g); g.connect(audio.destination);
      q.start(t, Math.random() * 0.8); q.stop(t + 0.09);
      var o = audio.createOscillator(), g2 = audio.createGain();
      o.frequency.setValueAtTime(hoehe * 0.42, t);
      o.frequency.exponentialRampToValueAtTime(hoehe * 0.2, t + 0.07);
      g2.gain.setValueAtTime(laut * 0.9, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g2); g2.connect(audio.destination);
      o.start(t); o.stop(t + 0.1);
    } catch (e) { /* kein Ton moeglich */ }
  }
  // Galopp ist ein Dreitakt: da-da-damm, dann kurz Stille (Schwebephase)
  var GALOPP_TAKT = [[0.0, 0.16, 230], [0.17, 0.26, 180], [0.34, 0.2, 260]];
  function galoppTon(altePhase, neuePhase, staerke) {
    var a = (altePhase / (Math.PI * 2)) % 1, b = (neuePhase / (Math.PI * 2)) % 1;
    for (var i = 0; i < 3; i++) {
      var s = GALOPP_TAKT[i][0];
      if ((a <= s && b > s) || (b < a && (s >= a || s < b))) huf(GALOPP_TAKT[i][1] * staerke, GALOPP_TAKT[i][2]);
    }
  }
  // Applaus vom Publikum (nur mit Stadion)
  function applaus(dauer, laut) {
    if (!tonAn || !stadionAn) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var q = rauschQuelle(), f = audio.createBiquadFilter(), g = audio.createGain();
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.5;
      g.gain.setValueAtTime(0.001, t);
      for (var x = 0.03; x < dauer; x += 0.03) {
        var huelle = Math.min(1, x * 6) * Math.min(1, (dauer - x) * 2);
        g.gain.linearRampToValueAtTime(laut * huelle * (0.55 + Math.random() * 0.45), t + x);
      }
      g.gain.linearRampToValueAtTime(0.001, t + dauer);
      q.connect(f); f.connect(g); g.connect(audio.destination);
      q.start(t); q.stop(t + dauer + 0.05);
    } catch (e) { /* kein Ton moeglich */ }
  }

  function klang(name) {
    if (name === 'perfekt') { ton(660, 0.12, 'triangle', 0.2); ton(880, 0.12, 'triangle', 0.2, 0.1); ton(1320, 0.25, 'triangle', 0.2, 0.2); }
    else if (name === 'gut') { ton(660, 0.12, 'triangle', 0.2); ton(880, 0.2, 'triangle', 0.2, 0.1); }
    else if (name === 'knapp') { ton(520, 0.2, 'triangle', 0.2); }
    else if (name === 'abwurf') { ton(140, 0.25, 'square', 0.18); ton(95, 0.3, 'square', 0.18, 0.12); }
    else if (name === 'verweigert') { ton(300, 0.2, 'sawtooth', 0.12); ton(210, 0.35, 'sawtooth', 0.12, 0.18); }
    else if (name === 'jubel') { applaus(1.8, 0.16); }
    else if (name === 'klatschen') { applaus(0.9, 0.08); }
    else if (name === 'oh') { ton(310, 0.5, 'sawtooth', 0.035); ton(233, 0.6, 'sawtooth', 0.035, 0.05); ton(196, 0.7, 'triangle', 0.05, 0.1); }
    else if (name === 'zaehler') { ton(440, 0.15, 'sine', 0.2); }
    else if (name === 'los') { ton(880, 0.4, 'sine', 0.2); }
    else if (name === 'ziel') { [523, 659, 784, 1047].forEach(function (f, i) { ton(f, 0.3, 'triangle', 0.2, i * 0.14); }); }
    else if (name === 'fanfare') { [523, 523, 523, 659, 784, 659, 784, 1047].forEach(function (f, i) { ton(f, i === 7 ? 0.7 : 0.2, 'triangle', 0.2, i * 0.17); }); }
  }

  // ---------- Spielzustand ----------
  var Z = {
    modus: 'menue',       // menue | warten | countdown | ritt | ziel | fertig | ehrung
    s: 0, tempo: 0, phase: 0, zeit: 0, uhr: 0,
    pferdModus: 'lauf',   // lauf | sprung | verweigert
    sprung: null, verweigertZeit: 0,
    naechstes: 0, punkte: 0, abwuerfe: 0, verweigerungen: 0, perfekte: 0, abweichung: 0,
    countdown: 0, gedrueckt: false,
    reiter: null, opt: null, rittId: 0,
    frei: false, mitTempo: false, px: 0, pz: 0, kurs: 0, wunschTempo: 0, lenkGlatt: 0
  };
  var T = null;           // laufendes Turnier (oder null)

  var meldungTimer = null;
  function meldung(text, klasse) {
    var m = el('meldung');
    m.textContent = text;
    m.className = 'meldung ' + (klasse || '');
    void m.offsetWidth;                 // Animation neu starten
    m.classList.add('zeigen');
    clearTimeout(meldungTimer);
    meldungTimer = setTimeout(function () { m.classList.remove('zeigen'); }, 1100);
  }

  function zeigeHud() {
    el('punkte').textContent = Z.punkte;
    el('hindernisNr').textContent = Math.min(Z.naechstes + 1, hindernisse.length) + ' / ' + hindernisse.length;
    el('uhr').textContent = Z.uhr.toFixed(1) + ' s';
  }

  function setzeModus(modus, klasse) {
    Z.modus = modus;
    document.body.className = klasse;
    groesse();
  }

  function zurueckSetzen() {
    baueParcours(parcoursNr);
    Z.s = 0; Z.tempo = 0; Z.phase = 0; Z.uhr = 0;
    Z.pferdModus = 'lauf'; Z.sprung = null;
    Z.naechstes = 0; Z.punkte = 0; Z.abwuerfe = 0; Z.verweigerungen = 0; Z.perfekte = 0; Z.abweichung = 0;
    Z.gedrueckt = false;
    Z.frei = false; Z.mitTempo = false; Z.lenkGlatt = 0;
    pferd.koerper.rotation.z = 0;
    Z.rittId++;
    pferd.kopfGerade();
    pferd.koerper.position.y = 0;
    pferd.koerper.rotation.x = 0;
    ring.visible = false;
    setzePferd();
    zeigeHud();
  }

  // ---------- Karten (Fenster ueber dem Spiel) ----------
  // art: 'mitte' (abgedunkelt), 'unten' (kleine Karte unten), 'seite' (rechts wie das Menue)
  function zeigeKarte(art, html, knoepfe) {
    var k = el('karte');
    k.className = 'offen ' + art;
    el('karteInhalt').innerHTML = html;
    var leiste = el('karteKnoepfe');
    leiste.innerHTML = '';
    knoepfe.forEach(function (kn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = kn.klasse || 'gross';
      b.textContent = kn.text;
      b.addEventListener('click', kn.aktion);
      leiste.appendChild(b);
    });
  }
  function schliesseKarte() { el('karte').className = ''; }

  // ---------- Ein Ritt ----------
  // reiter: { name, outfit, ki }   ki = Zeile aus GEGNER_STUFEN oder null fuer Menschen
  // opt:    { tempoFaktor, fertig(ergebnis), zuSchlagen, titel }
  function starteRitt(reiter, opt) {
    Z.reiter = reiter;
    Z.opt = opt || {};
    zurueckSetzen();
    pferd.setzeOutfit(reiter.outfit);
    pferd.setzeAuszeichnung(false);
    Z.countdown = 3.2;
    Z.letzteZahl = 4;
    schliesseKarte();
    el('reiterName').textContent = reiter.name;
    el('zielKachel').style.display = Z.opt.zuSchlagen === undefined ? 'none' : '';
    el('zielPunkte').textContent = Z.opt.zuSchlagen === null || Z.opt.zuSchlagen === undefined ? '–' : Z.opt.zuSchlagen;
    el('ueberspringen').style.display = reiter.ki ? '' : 'none';
    el('springen').style.visibility = reiter.ki ? 'hidden' : 'visible';
    // Selbst lenken? (Computergegner reiten immer automatisch)
    Z.frei = !reiter.ki && steuerung !== 'auto';
    Z.mitTempo = Z.frei && steuerung === 'tempo';
    Z.wunschTempo = PARCOURS[parcoursNr].tempo * (Z.opt.tempoFaktor || 1);
    weg.posBei(0, pos); weg.richtungBei(0, dir);
    Z.px = pos.x; Z.pz = pos.z; Z.kurs = Math.atan2(dir.x, dir.z);
    linie.visible = Z.frei;
    el('tempoKachel').style.display = Z.mitTempo ? '' : 'none';
    setzeModus('countdown', 'im-spiel' + (Z.frei ? ' frei' : '') + (Z.mitTempo ? ' mit-tempo' : ''));
    kameraSprung = true;
  }

  function ergebnisJetzt() {
    return { punkte: Z.punkte, abwuerfe: Z.abwuerfe, verweigerungen: Z.verweigerungen, perfekte: Z.perfekte, abweichung: Z.abweichung, zeit: Z.uhr };
  }

  function rittFertig() {
    if (Z.modus === 'fertig') return;
    Z.modus = 'fertig';
    Z.rittId++;
    el('countdown').textContent = '';
    if (Z.opt.fertig) Z.opt.fertig(ergebnisJetzt());
  }

  // Computergegner: bei welchem Abstand drueckt er? (-1 = gar nicht -> Verweigerung)
  function kiAbsprung(stufe) {
    if (Math.random() < stufe[3]) return -1;
    var d = TIMING.ideal + gauss() * stufe[2];
    return Math.max(TIMING.verweigern + 0.2, Math.min(TIMING.anzeige - 0.1, d));
  }

  // Rest des Ritts eines Computergegners sofort ausrechnen
  function ueberspringe() {
    if (!Z.reiter || !Z.reiter.ki || (Z.modus !== 'ritt' && Z.modus !== 'countdown')) return;
    for (var i = Z.naechstes; i < hindernisse.length; i++) {
      var h = hindernisse[i];
      if (h.ergebnis !== undefined) continue;
      var d = h.kiZiel !== undefined ? h.kiZiel : kiAbsprung(Z.reiter.ki);
      if (d < 0) { Z.verweigerungen++; Z.abweichung += 4; Z.uhr += 1.3; continue; }
      var z = zone(d);
      Z.punkte += z.punkte;
      if (z.punkte === 3) Z.perfekte++;
      if (z.punkte === 0) { Z.abwuerfe++; Z.abweichung += 3; } else Z.abweichung += Math.abs(d - TIMING.ideal);
    }
    Z.uhr += Math.max(0, weg.laenge - 3 - Z.s) / (PARCOURS[parcoursNr].tempo * (Z.opt.tempoFaktor || 1));
    rittFertig();
  }

  // ---------- Pferd auf den Weg setzen ----------
  var pos = new THREE.Vector3(), dir = new THREE.Vector3();
  function setzePferd() {
    if (Z.frei) {
      pferd.wurzel.position.set(Z.px, 0, Z.pz);
      pferd.wurzel.rotation.y = Z.kurs;
      return;
    }
    weg.posBei(Z.s, pos); weg.richtungBei(Z.s, dir);
    pferd.wurzel.position.copy(pos);
    pferd.wurzel.rotation.y = Math.atan2(dir.x, dir.z);
  }
  // Blickrichtung des Pferdes
  function richtung(ziel) {
    if (Z.frei) return ziel.set(Math.sin(Z.kurs), 0, Math.cos(Z.kurs));
    return weg.richtungBei(Z.s, ziel);
  }

  function wirfAb(h) {
    h.abgeworfen = true;
    h.fallTeile.forEach(function (t) {
      t.userData.faellt = true;
      t.userData.vy = 1.2 + Math.random();
      t.userData.vz = Z.tempo * (0.3 + Math.random() * 0.15);
      t.userData.dreh = (Math.random() - 0.5) * 3;
    });
    Z.abwuerfe++;
    klang('abwurf');
    klang('oh');
  }

  function bewegeFallTeile(dt) {
    for (var i = 0; i < hindernisse.length; i++) {
      var h = hindernisse[i];
      if (!h.abgeworfen) continue;
      for (var j = 0; j < h.fallTeile.length; j++) {
        var t = h.fallTeile[j], u = t.userData;
        if (!u.faellt) continue;
        u.vy -= 12 * dt;
        t.position.y += u.vy * dt;
        t.position.z += u.vz * dt;
        t.rotation.y += u.dreh * dt;
        if (t.position.y <= 0.07) {
          t.position.y = 0.07;
          if (Math.abs(u.vy) > 1.5) { u.vy = -u.vy * 0.3; u.vz *= 0.5; u.dreh *= 0.5; }
          else { u.faellt = false; if (u.ruheZ !== undefined) t.rotation.z = u.ruheZ; else if (t.geometry.type === 'CylinderGeometry') t.rotation.z = Math.PI / 2; }
        }
      }
    }
  }

  function verweigere(h, text) {
    h.ergebnis = -1;
    Z.pferdModus = 'verweigert';
    Z.verweigertZeit = 0;
    Z.verweigerungen++;
    Z.abweichung += 4;
    if (!Z.frei) Z.s = h.s - TIMING.verweigern;
    meldung(text, 'rot');
    klang('verweigert');
    klang('oh');
    h.mats.forEach(function (m) { m.opacity = 0.25; });
    h.zonen.forEach(function (m) { m.visible = false; });
  }

  // ---------- Ein Bild weiterrechnen ----------
  function schritt(dt) {
    Z.zeit += dt;

    if (Z.modus === 'menue' || Z.modus === 'warten' || Z.modus === 'ehrung') {
      pferd.bewege(0, 0, -1, Z.zeit);
      return;
    }

    if (Z.modus === 'countdown') {
      Z.countdown -= dt;
      var zahl = Math.ceil(Z.countdown);
      if (zahl !== Z.letzteZahl) {
        Z.letzteZahl = zahl;
        if (zahl > 0) { el('countdown').textContent = zahl; klang('zaehler'); }
        else { el('countdown').textContent = 'Los!'; klang('los'); Z.modus = 'ritt'; setTimeout(function () { el('countdown').textContent = ''; }, 700); }
      }
      Z.gedrueckt = false;
      pferd.bewege(0, 0, -1, Z.zeit);
      return;
    }

    var zielTempo = PARCOURS[parcoursNr].tempo * (Z.opt.tempoFaktor || 1);
    if (Z.mitTempo && Z.modus === 'ritt') {
      if (taste.schneller) Z.wunschTempo = Math.min(LENKEN.tempoMax, Z.wunschTempo + 5 * dt);
      if (taste.langsamer) Z.wunschTempo = Math.max(LENKEN.tempoMin, Z.wunschTempo - 6 * dt);
      zielTempo = Z.wunschTempo;
    }
    if (Z.modus === 'ziel' || Z.modus === 'fertig') zielTempo = 0;

    // ----- Verweigerung: Pferd steht und schuettelt den Kopf -----
    if (Z.pferdModus === 'verweigert') {
      Z.verweigertZeit += dt;
      Z.tempo = 0;
      pferd.bewege(0, 0, -1, Z.zeit);
      pferd.schuettle(Z.verweigertZeit / 1.3);
      if (Z.verweigertZeit > 1.3) {
        Z.pferdModus = 'lauf';
        pferd.kopfGerade();
        Z.naechstes++;
      }
      Z.gedrueckt = false;
      Z.uhr += dt;
      zeigeHud();
      return;
    }

    // Tempo anpassen
    if (Z.tempo < zielTempo) Z.tempo = Math.min(zielTempo, Z.tempo + 7 * dt);
    else Z.tempo = Math.max(zielTempo, Z.tempo - 9 * dt);

    var strecke = Z.tempo * dt;
    Z.s += strecke;
    var altePhase = Z.phase;
    Z.phase += strecke * 1.5;
    if (Z.pferdModus === 'lauf' && Z.tempo > 1) galoppTon(altePhase, Z.phase, Math.min(1, Z.tempo / 7));

    // Selbst lenken
    if (Z.frei) {
      var lenk = Z.modus === 'ritt' ? (taste.links ? 1 : 0) - (taste.rechts ? 1 : 0) : 0;
      Z.lenkGlatt += (lenk - Z.lenkGlatt) * Math.min(1, dt * 8);
      var dreh = LENKEN.drehung * Math.min(1, 7.5 / Math.max(Z.tempo, 1));   // schneller = groessere Boegen
      Z.kurs += Z.lenkGlatt * dreh * dt * (Z.pferdModus === 'sprung' ? 0.25 : 1);
      Z.px += Math.sin(Z.kurs) * strecke;
      Z.pz += Math.cos(Z.kurs) * strecke;
      var gx = PLATZ.breite / 2 - 1.3, gz = PLATZ.tiefe / 2 - 1.3;       // am Zaun entlang rutschen
      Z.px = Math.max(-gx, Math.min(gx, Z.px));
      Z.pz = Math.max(-gz, Math.min(gz, Z.pz));
      pferd.koerper.rotation.z = -Z.lenkGlatt * 0.13 * Math.min(1, Z.tempo / 7);
    }

    var bereit = true, d = 0;
    if (Z.modus === 'ritt') {
      Z.uhr += dt;
      var h = hindernisse[Z.naechstes];
      var gewertet = false;
      if (h) {
        var seitlich = 0;
        if (Z.frei) {
          var rx = Z.px - h.pos.x, rz = Z.pz - h.pos.z;
          d = -(rx * h.fx + rz * h.fz);                 // Abstand vor dem Hindernis
          seitlich = Math.abs(rx * h.fz - rz * h.fx);   // Abstand von der Mitte
          var gleich = Math.sin(Z.kurs) * h.fx + Math.cos(Z.kurs) * h.fz;
          var hb = halbeBreite();
          bereit = seitlich < hb && gleich > 0.5;
          // am Hindernis vorbeigeritten?
          if (h.ergebnis === undefined && h.altD !== undefined && h.altD > 0 && d <= 0 && seitlich >= hb && seitlich < 9 && gleich > 0) {
            h.ergebnis = -1;
            Z.verweigerungen++;
            Z.abweichung += 4;
            meldung('Vorbeigeritten!', 'rot');
            klang('verweigert');
            h.mats.forEach(function (m) { m.opacity = 0.25; });
            h.zonen.forEach(function (m) { m.visible = false; });
            Z.naechstes++;
          }
          h.altD = d;
        } else {
          d = h.s - Z.s;
        }

        // Computergegner drueckt selbst
        if (Z.reiter.ki) {
          if (h.kiZiel === undefined) h.kiZiel = kiAbsprung(Z.reiter.ki);
          Z.gedrueckt = h.kiZiel > 0 && d <= h.kiZiel;
        }

        // Knopf gedrueckt -> Absprung
        if (Z.gedrueckt && Z.pferdModus === 'lauf' && h.ergebnis === undefined && bereit && d <= TIMING.anzeige && d > 0) {
          gewertet = true;
          var z = zone(d);
          var zuLangsam = Z.mitTempo && Z.tempo < LENKEN.zuLangsam;
          var zuSchnell = Z.mitTempo && Z.tempo > LENKEN.zuSchnell && z.punkte > 0 && z.punkte < 3;
          if (zuLangsam) {
            verweigere(h, 'Zu langsam!');
          } else {
            if (zuSchnell) z = { punkte: 0 };
            h.ergebnis = z.punkte;
            h.zonen.forEach(function (m) { m.visible = false; });
            if (z.punkte > 0) {
              Z.sprung = { s0: Z.s, L: Math.max(4.5, Math.min(8, 2 * d)), H: h.hoehe + 0.75 };
              Z.punkte += z.punkte;
              Z.abweichung += Math.abs(d - TIMING.ideal);
              if (z.punkte === 3) { Z.perfekte++; meldung('Perfekt!  +3', 'perfekt'); klang('perfekt'); klang('jubel'); platz.stadion.jubel(1, 1.8); }
              else if (z.punkte === 2) { meldung('Gut!  +2', 'gut'); klang('gut'); klang('klatschen'); platz.stadion.jubel(0.5, 1.0); }
              else { meldung('Knapp!  +1', 'knapp'); klang('knapp'); }
            } else {
              Z.sprung = { s0: Z.s, L: 6.4, H: h.hoehe + 0.4 };
              Z.abweichung += 3;
              h.grund = zuSchnell ? 'Zu schnell!' : (d > TIMING.ideal ? 'Zu früh!' : 'Zu spät!');
            }
            Z.pferdModus = 'sprung';
          }
        }

        // kein Knopf gedrueckt -> Verweigerung
        if (Z.pferdModus === 'lauf' && h.ergebnis === undefined && bereit && d <= TIMING.verweigern && d > -0.6) {
          verweigere(h, 'Verweigert!');
        }

        // Abwurf, wenn das Pferd das Hindernis trifft
        if (h.ergebnis === 0 && !h.abgeworfen && d <= 0.5 && seitlich < halbeBreite() + 0.5) {
          wirfAb(h);
          meldung('Abwurf!  ' + h.grund, 'rot');
        }

        // Hindernis geschafft / vorbei
        if (h.ergebnis !== undefined && h.ergebnis >= 0 && Z.pferdModus !== 'verweigert' && hindernisse[Z.naechstes] === h) {
          if (d < -1.2 || (Z.frei && Z.pferdModus === 'lauf' && seitlich >= halbeBreite() + 0.5)) Z.naechstes++;
        } else if (!Z.frei && d < -1.2 && Z.pferdModus !== 'verweigert' && hindernisse[Z.naechstes] === h) {
          Z.naechstes++;
        }
      }

      // Beim Selbstlenken darf man auch einfach so huepfen
      if (Z.frei && Z.gedrueckt && !gewertet && Z.pferdModus === 'lauf') {
        Z.sprung = { s0: Z.s, L: 5, H: 1.0 };
        Z.pferdModus = 'sprung';
      }

      // Ziel erreicht
      var imZiel = Z.frei
        ? (Z.naechstes >= hindernisse.length && Math.hypot(Z.px - zielPos.x, Z.pz - zielPos.z) < 4.5)
        : Z.s >= weg.laenge - 3;
      if (imZiel && Z.pferdModus === 'lauf') {
        Z.modus = 'ziel';
        klang('ziel');
        klang('jubel');
        platz.stadion.jubel(1, 2.5);
        var id = Z.rittId;
        setTimeout(function () { if (Z.rittId === id) rittFertig(); }, 900);
      }
    }
    Z.gedrueckt = false;

    // Sprungkurve
    var y = 0, neigung = Math.sin(Z.phase) * 0.035 * Math.min(1, Z.tempo / 5), sp = -1;
    if (Z.pferdModus === 'sprung') {
      sp = (Z.s - Z.sprung.s0) / Z.sprung.L;
      if (sp >= 1) { Z.pferdModus = 'lauf'; sp = -1; ton(80, 0.08, 'square', 0.1); }
      else {
        y = Z.sprung.H * 4 * sp * (1 - sp);
        neigung = -Math.atan(Z.sprung.H * 4 * (1 - 2 * sp) / Z.sprung.L) * 0.75;
      }
    }
    pferd.koerper.position.y = y + Math.abs(Math.sin(Z.phase * 0.5)) * 0.06 * (sp < 0 ? Z.tempo / 9 : 0);
    pferd.koerper.rotation.x = neigung;
    pferd.bewege(Z.phase, Math.min(1, Z.tempo / 7), sp, Z.zeit);
    setzePferd();

    // Farbring unter dem Pferd
    var hn = hindernisse[Z.naechstes];
    if (Z.modus === 'ritt' && hn && hn.ergebnis === undefined && Z.pferdModus === 'lauf' && d > 0 && d < TIMING.anzeige + 6) {
      var farbig = bereit && d <= TIMING.anzeige;
      ring.visible = true;
      ringMat.color.setHex(farbig ? zone(d).farbe : FARBE.neutral);
      var puls = farbig && zone(d).punkte === 3 ? 1.12 + Math.sin(Z.zeit * 30) * 0.05 : 1;
      ring.scale.set(puls, puls, 1);
    } else {
      ring.visible = false;
    }

    // Pfeil zeigt beim Selbstlenken das naechste Hindernis (oder das Ziel)
    if (Z.frei && Z.modus === 'ritt') {
      pfeil.visible = true;
      var py = 3.4 + Math.sin(Z.zeit * 5) * 0.25;
      if (hn) pfeil.position.set(hn.pos.x, hn.hoehe + py - 0.6, hn.pos.z);
      else pfeil.position.set(zielPos.x, py, zielPos.z);
      pfeil.rotation.y = Z.zeit * 2;
    } else if (pfeil) {
      pfeil.visible = false;
    }

    if (Z.mitTempo) {
      var gang = Z.tempo < 4 ? 'Schritt' : Z.tempo < 6 ? 'Trab' : Z.tempo <= LENKEN.zuSchnell ? 'Galopp' : 'Renngalopp';
      el('tempo').textContent = gang;
      el('tempoKachel').className = 'kachel' + (Z.tempo < LENKEN.zuLangsam || Z.tempo > LENKEN.zuSchnell ? ' warn' : '');
      el('tempoBalken').style.width = Math.round((Z.tempo - LENKEN.tempoMin) / (LENKEN.tempoMax - LENKEN.tempoMin) * 100) + '%';
    }

    zeigeHud();
  }

  // ============================================================
  //  TRAINING (ein einzelner Ritt ohne Gegner)
  // ============================================================
  function starteTraining() {
    T = null;
    var s = spieler[aktiv];
    starteRitt({ name: s.name, outfit: s.outfit, ki: null }, { fertig: zeigeTrainingsErgebnis });
  }

  function zeigeTrainingsErgebnis(e) {
    var max = hindernisse.length * 3;
    var anteil = e.punkte / max;
    var sterne = anteil >= 0.85 ? 3 : anteil >= 0.5 ? 2 : anteil > 0 ? 1 : 0;
    var titel = ['Weiter üben!', 'Geschafft!', 'Toll geritten!', 'Super Ritt!'][sterne];
    var schluessel = PARCOURS[parcoursNr].name;
    var alt = bestwerte[schluessel], rekord = '';
    if (alt === undefined || e.punkte > alt) {
      bestwerte[schluessel] = e.punkte;
      speichere('reitturnier_best', bestwerte);
      rekord = alt === undefined ? '' : 'Neuer Rekord!';
    } else {
      rekord = 'Dein Rekord: ' + alt + ' Punkte';
    }
    zeigeKarte('mitte',
      '<h2>' + titel + '</h2>' +
      '<div class="sterne">' + '★★★'.slice(0, sterne) + '☆☆☆'.slice(0, 3 - sterne) + '</div>' +
      '<div class="grossPunkte">' + e.punkte + ' von ' + max + ' Punkten</div>' + detailsHtml(e) +
      '<div class="rekord">' + rekord + '</div>',
      [{ text: 'Nochmal reiten', aktion: starteTraining }, { text: 'Zurück zum Menü', klasse: 'zweit', aktion: insMenue }]);
  }

  function detailsHtml(e) {
    return '<div class="details">Perfekte Sprünge: <b>' + e.perfekte + '</b> · Abwürfe: <b>' + e.abwuerfe +
      '</b> · Verweigerungen: <b>' + e.verweigerungen + '</b></div>';
  }

  // ============================================================
  //  TURNIER  (mehrere Spieler + Computergegner, Stechen, Siegerehrung)
  // ============================================================
  function zufallsOutfit() {
    var o = {};
    AUSWAHL.forEach(function (a) {
      var liste = a.farben || a.werte.map(function (w) { return w[0]; });
      o[a.key] = liste[Math.floor(Math.random() * liste.length)];
    });
    return o;
  }

  function starteTurnier() {
    var stufe = GEGNER_STUFEN.filter(function (s) { return s[0] === gegnerStufe; })[0] || GEGNER_STUFEN[1];
    var teilnehmer = spieler.map(function (s, i) {
      return { name: s.name, outfit: kopie(s.outfit), ki: null, spielerNr: i, erg: null, stech: null };
    });
    var namen = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; });
    var anzahl = gegnerAnzahl;
    if (teilnehmer.length + anzahl < 2) anzahl = 1;      // allein kann man kein Turnier reiten
    for (var i = 0; i < anzahl; i++) {
      teilnehmer.push({ name: namen[i], outfit: zufallsOutfit(), ki: stufe, erg: null, stech: null });
    }
    T = { teilnehmer: teilnehmer, liste: teilnehmer.map(function (t, k) { return k; }), pos: 0, stechen: false };
    naechsterReiter();
  }

  // Sortierung: mehr Punkte ist besser, bei Gleichstand zaehlt die Genauigkeit
  // (wenn man selbst lenkt: die schnellere Zeit)
  function besser(a, b) { return b.punkte - a.punkte || (steuerung !== 'auto' ? a.zeit - b.zeit : a.abweichung - b.abweichung); }
  function rangliste() {
    return T.teilnehmer.slice().sort(function (a, b) {
      if (a.stech && b.stech) return besser(a.stech, b.stech);
      if (a.stech || b.stech) return a.stech ? -1 : 1;
      if (!a.erg || !b.erg) return a.erg ? -1 : b.erg ? 1 : 0;
      if (T.stechen && a.erg.punkte === b.erg.punkte) return 0;
      return besser(a.erg, b.erg);
    });
  }

  function tabelleHtml(mitMedaillen) {
    var zeilen = rangliste().map(function (t, i) {
      var platz = mitMedaillen ? (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') : (t.erg ? (i + 1) + '.' : '');
      var punkte = t.erg ? t.erg.punkte : '–';
      var stech = T.stechen ? '<td>' + (t.stech ? t.stech.punkte : (T.liste.indexOf(T.teilnehmer.indexOf(t)) >= 0 ? '…' : '')) + '</td>' : '';
      return '<tr class="' + (t.ki ? 'ki' : 'mensch') + '"><td>' + platz + '</td><td class="links">' + esc(t.name) + (t.ki ? ' <small>(Computer)</small>' : '') +
        '</td><td>' + punkte + '</td>' + stech + '</tr>';
    }).join('');
    return '<table class="tabelle"><tr><th></th><th class="links">Reiter</th><th>Punkte</th>' + (T.stechen ? '<th>Stechen</th>' : '') + '</tr>' + zeilen + '</table>';
  }

  var wartenTimer = null;
  function naechsterReiter() {
    clearTimeout(wartenTimer);
    if (!T) return;
    if (T.pos >= T.liste.length) { rundeFertig(); return; }
    var t = T.teilnehmer[T.liste[T.pos]];
    zurueckSetzen();
    pferd.setzeOutfit(t.outfit);
    pferd.setzeAuszeichnung(false);
    setzeModus('warten', 'im-warten');
    // Wie viele Punkte muss man schlagen?
    var beste = null;
    T.liste.forEach(function (nr) {
      var e = T.stechen ? T.teilnehmer[nr].stech : T.teilnehmer[nr].erg;
      if (e && (beste === null || e.punkte > beste)) beste = e.punkte;
    });
    function los() {
      clearTimeout(wartenTimer);
      starteRitt(t, {
        tempoFaktor: T.stechen ? STECHEN.tempoFaktor : 1,
        zuSchlagen: beste,
        fertig: function (e) {
          if (!T) return;
          if (T.stechen) t.stech = e; else t.erg = e;
          T.pos++;
          zeigeKarte('mitte',
            '<div class="klein">' + (T.stechen ? 'Stechen' : 'Ergebnis') + '</div><h2>' + esc(t.name) + '</h2>' +
            '<div class="grossPunkte">' + e.punkte + ' Punkte</div>' + detailsHtml(e) + tabelleHtml(false),
            [{ text: 'Weiter', aktion: naechsterReiter }]);
        }
      });
    }
    zeigeKarte('unten',
      '<div class="klein">' + (T.stechen ? '⚡ Stechen' : 'Reiter ' + (T.pos + 1) + ' von ' + T.liste.length) + '</div>' +
      '<h2>' + esc(t.name) + '</h2>' +
      '<div class="details">' + (t.ki ? 'Computergegner (' + t.ki[1] + ') reitet gleich los …' : 'Du bist dran! Bereit?') +
      (beste !== null ? '<br>Zu schlagen: <b>' + beste + ' Punkte</b>' : '') + '</div>',
      [{ text: t.ki ? 'Zuschauen' : 'Start!', aktion: los }]);
    if (t.ki) wartenTimer = setTimeout(los, 2200);
  }

  function rundeFertig() {
    if (!T.stechen) {
      var max = -1;
      T.teilnehmer.forEach(function (t) { if (t.erg.punkte > max) max = t.erg.punkte; });
      var vorn = [];
      T.teilnehmer.forEach(function (t, i) { if (t.erg.punkte === max) vorn.push(i); });
      if (vorn.length >= 2) {
        T.stechen = true;
        T.liste = vorn;
        T.pos = 0;
        setzeModus('warten', 'im-warten');
        zeigeKarte('mitte',
          '<h2>⚡ Gleichstand!</h2><div class="details">' + vorn.map(function (i) { return '<b>' + esc(T.teilnehmer[i].name) + '</b>'; }).join(' und ') +
          ' haben ' + (vorn.length === 2 ? 'beide ' : 'alle ') + max + ' Punkte.<br>Jetzt entscheidet das <b>Stechen</b>: Es wird schneller geritten!<br>' +
          'Bei gleichen Punkten gewinnt, wer ' + (steuerung !== 'auto' ? 'schneller war' : 'genauer abgesprungen ist') + '.</div>' + tabelleHtml(false),
          [{ text: 'Zum Stechen', aktion: naechsterReiter }]);
        return;
      }
    }
    siegerehrung();
  }

  function siegerehrung() {
    var rang = rangliste();
    var sieger = rang[0];
    if (sieger.spielerNr !== undefined && spieler[sieger.spielerNr]) {
      spieler[sieger.spielerNr].siege++;
      speichereSpieler();
    }
    zurueckSetzen();
    pferd.setzeOutfit(sieger.outfit);
    pferd.setzeAuszeichnung(true);
    setzeModus('ehrung', 'im-ehrung');
    klang('fanfare');
    klang('jubel');
    platz.stadion.jubel(1, 4);
    var html = '<div class="klein">Siegerehrung</div><h2>🏆 ' + esc(sieger.name) + ' gewinnt!</h2>' +
      '<div class="details">' + (sieger.ki ? 'Diesmal hat der Computer gewonnen. Gleich nochmal versuchen!' :
        'Die Reiterin bekommt die <b>Goldmedaille</b> 🥇<br>und das Pferd eine <b>Siegerschleife</b> 🏵️ ans Zaumzeug!') + '</div>' +
      tabelleHtml(true);
    zeigeKarte('seite', html, [
      { text: 'Neues Turnier', aktion: starteTurnier },
      { text: 'Zurück zum Menü', klasse: 'zweit', aktion: insMenue }
    ]);
  }

  // ---------- Menue ----------
  function insMenue() {
    clearTimeout(wartenTimer);
    T = null;
    schliesseKarte();
    el('countdown').textContent = '';
    zurueckSetzen();
    baueMenue();
    setzeModus('menue', 'im-menue');
  }

  function zeigeAktivenSpieler() {
    pferd.setzeOutfit(spieler[aktiv].outfit);
    pferd.setzeAuszeichnung(spieler[aktiv].siege > 0);
  }

  function knopfReihe(kasten, eintraege, istAktiv, beiKlick) {
    kasten.innerHTML = '';
    eintraege.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wahl' + (istAktiv(e) ? ' aktiv' : '');
      b.textContent = e[1];
      b.addEventListener('click', function () { beiKlick(e); });
      kasten.appendChild(b);
    });
  }

  function baueMenue() {
    if (aktiv >= spieler.length) aktiv = 0;
    // --- Spieler-Reiter ---
    var tabs = el('spielerTabs');
    tabs.innerHTML = '';
    spieler.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wahl' + (i === aktiv ? ' aktiv' : '');
      b.textContent = s.name + (s.siege > 0 ? '  🥇' + s.siege : '');
      b.addEventListener('click', function () { aktiv = i; baueMenue(); });
      tabs.appendChild(b);
    });
    if (spieler.length < 4) {
      var plus = document.createElement('button');
      plus.type = 'button'; plus.className = 'wahl'; plus.textContent = '+ Mitspieler';
      plus.addEventListener('click', function () {
        spieler.push({ name: 'Spieler ' + (spieler.length + 1), outfit: zufallsOutfit(), siege: 0 });
        aktiv = spieler.length - 1;
        speichereSpieler(); baueMenue();
      });
      tabs.appendChild(plus);
    }
    if (spieler.length > 1) {
      var minus = document.createElement('button');
      minus.type = 'button'; minus.className = 'wahl'; minus.textContent = '✕ entfernen';
      minus.addEventListener('click', function () {
        spieler.splice(aktiv, 1);
        aktiv = 0;
        speichereSpieler(); baueMenue();
      });
      tabs.appendChild(minus);
    }
    var eingabe = el('spielerName');
    eingabe.value = spieler[aktiv].name;
    eingabe.oninput = function () {
      spieler[aktiv].name = eingabe.value.trim().slice(0, 16) || 'Spieler ' + (aktiv + 1);
      speichereSpieler();
      tabs.children[aktiv].textContent = spieler[aktiv].name + (spieler[aktiv].siege > 0 ? '  🥇' + spieler[aktiv].siege : '');
    };

    // --- Outfit ---
    var outfit = spieler[aktiv].outfit;
    var kasten = el('auswahl');
    kasten.innerHTML = '';
    AUSWAHL.forEach(function (a) {
      if (a.key === 'gesicht' && pferd.hatModell()) return;   // das Modellpferd hat keine Abzeichen
      var zeile = document.createElement('div');
      zeile.className = 'zeile';
      var name = document.createElement('div');
      name.className = 'zeilenName';
      name.textContent = (a.key === 'decke' && pferd.hatModell()) ? 'Sattel' : a.name;
      zeile.appendChild(name);
      var knoepfe = document.createElement('div');
      knoepfe.className = 'knoepfe';
      var liste = a.farben ? a.farben.map(function (f) { return [f, null]; }) : a.werte;
      liste.forEach(function (eintrag) {
        var b = document.createElement('button');
        b.type = 'button';
        if (a.farben) { b.className = 'farbe'; b.style.background = eintrag[0]; b.setAttribute('aria-label', a.name + ' ' + eintrag[0]); }
        else { b.className = 'wahl'; b.textContent = eintrag[1]; }
        if (outfit[a.key] === eintrag[0]) b.classList.add('aktiv');
        b.addEventListener('click', function () {
          outfit[a.key] = eintrag[0];
          pferd.setzeOutfit(outfit);
          speichereSpieler();
          Array.prototype.forEach.call(knoepfe.children, function (c) { c.classList.remove('aktiv'); });
          b.classList.add('aktiv');
        });
        knoepfe.appendChild(b);
      });
      zeile.appendChild(knoepfe);
      kasten.appendChild(zeile);
    });

    // --- Parcours ---
    knopfReihe(el('parcoursWahl'),
      PARCOURS.map(function (p, i) { return [i, p.name + (bestwerte[p.name] !== undefined ? '  ·  Rekord ' + bestwerte[p.name] : '')]; }),
      function (e) { return e[0] === parcoursNr; },
      function (e) { parcoursNr = e[0]; speichere('reitturnier_parcours', parcoursNr); zurueckSetzen(); baueMenue(); });

    // --- Computergegner ---
    knopfReihe(el('gegnerZahl'), [[0, 'Keine'], [1, '1'], [2, '2'], [3, '3']],
      function (e) { return e[0] === gegnerAnzahl; },
      function (e) { gegnerAnzahl = e[0]; speichere('reitturnier_gegner', gegnerAnzahl); baueMenue(); });
    knopfReihe(el('gegnerStufe'), GEGNER_STUFEN.map(function (s) { return [s[0], s[1]]; }),
      function (e) { return e[0] === gegnerStufe; },
      function (e) { gegnerStufe = e[0]; speichere('reitturnier_stufe', gegnerStufe); baueMenue(); });

    knopfReihe(el('steuerungWahl'), STEUERUNG,
      function (e) { return e[0] === steuerung; },
      function (e) { steuerung = e[0]; speichere('reitturnier_steuerung', steuerung); baueMenue(); });
    knopfReihe(el('stadionWahl'), [[true, 'Mit Zuschauern'], [false, 'Ohne']],
      function (e) { return e[0] === stadionAn; },
      function (e) { stadionAn = e[0]; speichere('reitturnier_stadion', stadionAn); zeigeStadion(); baueMenue(); });
    el('hilfeText').innerHTML = steuerung === 'auto'
      ? 'Drücke die <b>Leertaste</b> (oder tippe auf den Bildschirm), wenn der Ring unter dem Pferd <b class="g">grün</b> ist.'
      : steuerung === 'lenken'
        ? 'Lenke mit <b>← →</b> (oder A / D) der Reihe nach zu den Hindernissen und springe mit der <b>Leertaste</b>, wenn der Ring <b class="g">grün</b> ist. Der rosa Pfeil zeigt das nächste Hindernis.'
        : 'Lenke mit <b>← →</b>, bestimme mit <b>↑ ↓</b> das Tempo und springe mit der <b>Leertaste</b>. Zu langsam: Das Pferd verweigert. Zu schnell: Nur perfekte Absprünge gelingen. Bei Gleichstand gewinnt die schnellere Zeit.';

    zeigeAktivenSpieler();
  }

  // ---------- Kamera ----------
  var kamZiel = new THREE.Vector3(), kamBlick = new THREE.Vector3(), blickJetzt = new THREE.Vector3();
  var kameraSprung = true;
  function bewegeKamera(dt) {
    var p = pferd.wurzel.position;
    if (Z.modus === 'menue' || Z.modus === 'warten' || Z.modus === 'ehrung') {
      var w = pferd.wurzel.rotation.y + 0.75 + Math.sin(Z.zeit * 0.35) * 0.75;
      var abstand = window.innerWidth > 760 ? 5.6 : 9.5;
      kamera.position.set(p.x + Math.sin(w) * abstand, 2.3, p.z + Math.cos(w) * abstand);
      blickJetzt.set(p.x, 1.45, p.z);
      kamera.lookAt(blickJetzt);
      kameraSprung = true;
      return;
    }
    richtung(dir);
    kamZiel.set(p.x - dir.x * 8.5, 4.4, p.z - dir.z * 8.5);
    kamBlick.set(p.x + dir.x * 5, 1.3, p.z + dir.z * 5);
    if (kameraSprung) {
      kamera.position.copy(kamZiel); blickJetzt.copy(kamBlick); kameraSprung = false;
    } else {
      kamera.position.lerp(kamZiel, 1 - Math.exp(-3.2 * dt));
      blickJetzt.lerp(kamBlick, 1 - Math.exp(-6 * dt));
    }
    kamera.lookAt(blickJetzt);
  }

  // ---------- Fenstergroesse ----------
  function groesse() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    kamera.aspect = w / h;
    if (Z.modus === 'menue' || Z.modus === 'ehrung') {
      // Pferd neben das Menue ruecken (nach links, auf dem Handy nach oben)
      if (w > 760) kamera.setViewOffset(w, h, 200, 0, w, h);
      else kamera.setViewOffset(w, h, 0, h * 0.27, w, h);
    } else if (Z.modus === 'warten') {
      kamera.setViewOffset(w, h, 0, h * 0.1, w, h);
    } else {
      kamera.clearViewOffset();
    }
    kamera.updateProjectionMatrix();
  }
  window.addEventListener('resize', groesse);

  // ---------- Steuerung ----------
  function springen(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (Z.modus === 'ritt' && Z.reiter && !Z.reiter.ki) Z.gedrueckt = true;
  }
  var TASTEN = { ArrowLeft: 'links', KeyA: 'links', ArrowRight: 'rechts', KeyD: 'rechts', ArrowUp: 'schneller', KeyW: 'schneller', ArrowDown: 'langsamer', KeyS: 'langsamer' };
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    var imRitt = Z.modus === 'ritt' || Z.modus === 'countdown';
    if (TASTEN[e.code] && imRitt && Z.frei) { taste[TASTEN[e.code]] = true; e.preventDefault(); return; }
    if (e.code === 'Space' || (e.code === 'ArrowUp' && !Z.frei)) {
      if (imRitt) {
        e.preventDefault();
        if (!e.repeat) springen();
      }
    }
  });
  window.addEventListener('keyup', function (e) { if (TASTEN[e.code]) taste[TASTEN[e.code]] = false; });
  window.addEventListener('blur', function () { for (var k in taste) taste[k] = false; });
  renderer.domElement.addEventListener('pointerdown', function (e) { if (!Z.frei) springen(e); });
  el('springen').addEventListener('pointerdown', springen);
  // Knoepfe auf dem Bildschirm (fuer Tablet und Handy)
  ['links', 'rechts', 'schneller', 'langsamer'].forEach(function (name) {
    var b = el('knopf-' + name);
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); taste[name] = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { taste[name] = false; }); });
  });

  el('turnier').addEventListener('click', starteTurnier);
  el('training').addEventListener('click', starteTraining);
  el('zumMenue').addEventListener('click', insMenue);
  el('ueberspringen').addEventListener('click', ueberspringe);
  function zeigeTon() { el('ton').textContent = tonAn ? '🔊' : '🔇'; }
  el('ton').addEventListener('click', function () { tonAn = !tonAn; speichere('reitturnier_ton', tonAn); zeigeTon(); });
  zeigeTon();

  // ---------- 3D-Modelle laden (wenn vorhanden), dann starten ----------
  function textZuPuffer(text) {
    var roh = atob(text), feld = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) feld[i] = roh.charCodeAt(i);
    return feld.buffer;
  }
  function ladeModelle(fertig) {
    var offen = 1;
    function eins(text, einbauen) {
      if (typeof text !== 'string' || !THREE.GLTFLoader) return;
      offen++;
      function weiter() { if (--offen === 0) fertig(); }
      try {
        new THREE.GLTFLoader().parse(textZuPuffer(text), '', function (g) {
          try { einbauen(g); } catch (e) { console.warn('Modell konnte nicht eingebaut werden', e); }
          weiter();
        }, function (e) { console.warn('Modell konnte nicht geladen werden', e); weiter(); });
      } catch (e) { console.warn(e); weiter(); }
    }
    eins(window.MODELL_PFERD, pferd.nutzeModell);
    eins(window.MODELL_HINDERNISSE, bereiteHindernisTeile);
    if (--offen === 0) fertig();
  }
  // erst einmal ohne Modelle anzeigen, damit sofort etwas zu sehen ist
  insMenue();
  ladeModelle(function () { insMenue(); el('laden').style.display = 'none'; });

  var letzte = performance.now();
  function bild(jetzt) {
    var dt = Math.min(0.05, (jetzt - letzte) / 1000);
    letzte = jetzt;
    schritt(dt);
    bewegeFallTeile(dt);
    platz.stadion.bewege(dt, Z.zeit);
    bewegeKamera(dt);
    renderer.render(szene, kamera);
    requestAnimationFrame(bild);
  }
  requestAnimationFrame(bild);

  // fuer Tests und zum Ausprobieren in der Konsole
  window.SPIEL = {
    zustand: Z, hindernisse: function () { return hindernisse; }, springen: springen, timing: TIMING,
    turnier: function () { return T; }, taste: taste, ueberspringe: ueberspringe, pferd: pferd
  };
})();
