// ============================================================
//  DRESSUR  -  Hufschlagfiguren im Viereck 20 x 40 m
//  Bahnpunkte wie im echten Dressurviereck: A K E H C M B F, Mitte X.
//  Jede Lektion bekommt eine Note von 0 bis 10 (wie bei den Richtern):
//  wie genau die Linie geritten wurde und ob die Gangart stimmte.
// ============================================================
WELTEN.dressur = (function () {
  'use strict';
  var PUNKTE = { A: [0, 20], K: [-10, 14], E: [-10, 0], H: [-10, -14], C: [0, -20], M: [10, -14], B: [10, 0], F: [10, 14], X: [0, 0] };
  var GANG = ['steh', 'schritt', 'trab', 'galopp'], GANG_TEMPO = [0, 1.7, 3.7, 6.2], GANG_TEXT = ['Halt', 'Schritt', 'Trab', 'Galopp'];
  var PI = Math.PI;

  // ---------- Linien bauen ----------
  function linie(x0, z0, x1, z1) {
    var p = [], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5));
    for (var i = 0; i <= n; i++) p.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]);
    return p;
  }
  // Bogen um (cx, cz): Winkel 0 = suedlich der Mitte, PI/2 = oestlich, PI = noerdlich
  function bogen(cx, cz, r, w0, w1) {
    var p = [], n = Math.max(2, Math.round(Math.abs(w1 - w0) * r / 0.5));
    for (var i = 0; i <= n; i++) { var w = w0 + (w1 - w0) * i / n; p.push([cx + Math.sin(w) * r, cz + Math.cos(w) * r]); }
    return p;
  }
  function kette() {
    var p = [];
    for (var i = 0; i < arguments.length; i++) { var t = arguments[i]; if (p.length) t = t.slice(1); p = p.concat(t); }
    return p;
  }
  // Die Lektionen. gang: 1 Schritt, 2 Trab, 3 Galopp; halt = anhalten und gruessen
  var L = {
    einreiten: { text: 'A – X: Einreiten im Trab auf der Mittellinie', gang: 2, weg: linie(0, 27, 0, 0) },
    gruss1: { text: 'X: Halten und Grüßen', halt: true },
    linkeHand: { text: 'Im Trab anreiten. C: linke Hand, ganze Bahn bis A', gang: 2, weg: kette(linie(0, 0, 0, -16), bogen(-3, -16, 3, PI / 2, PI), linie(-3, -19, -6, -19), bogen(-6, -16, 3, PI, PI * 1.5), linie(-9, -16, -9, 16), bogen(-6, 16, 3, PI * 1.5, PI * 2), linie(-6, 19, 0, 19)) },
    zirkelLinks: { text: 'A: Zirkel links (20 Meter) im Trab', gang: 2, weg: bogen(0, 10, 9, 0, PI * 2) },
    wechsel: { text: 'F – X – H: Durch die ganze Bahn wechseln', gang: 2, weg: kette(linie(0, 19, 6, 19), bogen(6, 16, 3, 0, PI / 2), linie(9, 16, 9, 14), linie(9, 14, -9, -14)) },
    schritt: { text: 'H – C: Im Schritt', gang: 1, weg: kette(linie(-9, -14, -9, -16), bogen(-6, -16, 3, PI * 1.5, PI), linie(-6, -19, 0, -19)) },
    galopp: { text: 'C: Angaloppieren, ganze Bahn bis A', gang: 3, weg: kette(linie(0, -19, 6, -19), bogen(6, -16, 3, PI, PI / 2), linie(9, -16, 9, 16), bogen(6, 16, 3, PI / 2, 0), linie(6, 19, 0, 19)) },
    zirkelRechts: { text: 'A: Zirkel rechts (20 Meter) im Galopp', gang: 3, weg: bogen(0, 10, 9, PI * 2, 0) },
    schlangen: { text: 'A – C: Schlangenlinie durch die ganze Bahn, 3 Bögen, im Trab', gang: 2, weg: kette(bogen(0, 12.667, 6.333, 0, -PI), bogen(0, 0, 6.333, 0, PI), bogen(0, -12.667, 6.333, 0, -PI)) },
    aufMitte: { text: 'C – M – B – F im Trab, bei A auf die Mittellinie', gang: 2, weg: kette(linie(0, -19, 6, -19), bogen(6, -16, 3, PI, PI / 2), linie(9, -16, 9, 16), bogen(6, 16, 3, PI / 2, 0), linie(6, 19, 3, 19), bogen(3, 16, 3, 0, -PI / 2)) },
    mittellinie: { text: 'A – X: Mittellinie im Trab', gang: 2, weg: linie(0, 16, 0, 0) },
    gruss2: { text: 'X: Halten und Grüßen', halt: true }
  };
  var AUFGABEN = [
    { name: 'Aufgabe 1 (leicht)', text: 'Trab, Zirkel, Handwechsel und Schritt', teile: ['einreiten', 'gruss1', 'linkeHand', 'zirkelLinks', 'wechsel', 'schritt', 'aufMitte', 'mittellinie', 'gruss2'] },
    { name: 'Aufgabe 2 (mittel)', text: 'mit Galopp, Galoppzirkel und Schlangenlinie', teile: ['einreiten', 'gruss1', 'linkeHand', 'zirkelLinks', 'wechsel', 'schritt', 'galopp', 'zirkelRechts', 'schlangen', 'aufMitte', 'mittellinie', 'gruss2'] }
  ];
  // Ergebnisse der Computergegner in Prozent [von, bis]: wer selbst lenkt, hat es schwerer als mit Automatik
  var KI_PROZENT = { sehrleicht: [45, 58], leicht: [52, 66], mittel: [60, 74], schwer: [68, 82] };
  var KI_PROZENT_AUTO = { sehrleicht: [60, 75], leicht: [68, 82], mittel: [76, 89], schwer: [84, 95] };

  var gebaut = false, szene, kamera, sonne, opt = {}, R = null, punkte = null, ende = null;
  var modus = 'aus', aufgabe = null, nr = 0, lek = null, sLek = 0, laengen = [], stufe = 0, noten = [], steuerung = 'lenken';
  var mess = { summe: 0, n: 0, richtig: 0 }, haltZeit = 0, zeit = 0, altHoch = 0, altTaste = { s: false, l: false }, stopp = null, gruss = 0;

  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 32, nebelNah: 80, nebelFern: 260 });
    kamera = REITEN.neueKamera();
    var wiese = BAU.netz(new THREE.PlaneGeometry(300, 300), 0x7cc35a, szene); wiese.rotation.x = -PI / 2; wiese.castShadow = false;
    var sand = BAU.netz(new THREE.PlaneGeometry(20, 40), 0xe6d3a3, szene, 0, 0.02, 0); sand.rotation.x = -PI / 2; sand.castShadow = false;
    var vor = BAU.netz(new THREE.PlaneGeometry(6, 10), 0xe6d3a3, szene, 0, 0.015, 25); vor.rotation.x = -PI / 2; vor.castShadow = false;
    // niedrige weisse Einfassung, bei A offen
    szene.add(BAU.zaun([[-1.6, 20], [-10, 20], [-10, -20], [10, -20], [10, 20], [1.6, 20]], { hoehe: 0.4, latten: 1, abstand: 2 }));
    // Bahnbuchstaben
    for (var b in PUNKTE) {
      if (b === 'X') continue;
      var p = PUNKTE[b], aus = b === 'A' ? [2.6, 21.3] : b === 'C' ? [0, -21.6] : [p[0] + (p[0] > 0 ? 1.5 : -1.5), p[1]];
      BAU.kasten(0.8, 0.9, 0.8, 0xffffff, szene, aus[0], 0.45, aus[1]);
      for (var s = 0; s < 4; s++) {
        var t = BAU.tafel(b, 0.7, { grund: null, farbe: '#1c1c1c', schrift: 80 });
        t.position.set(aus[0] + Math.sin(s * PI / 2) * 0.41, 0.48, aus[1] + Math.cos(s * PI / 2) * 0.41); t.rotation.y = s * PI / 2;
        szene.add(t);
      }
      var blume = BAU.netz(new THREE.SphereGeometry(0.28, 8, 6), [0xff6fae, 0xffe36b, 0xb07cff][b.charCodeAt(0) % 3], szene, aus[0], 1.05, aus[1]);
      blume.scale.y = 0.7;
    }
    // Richterhaeuschen bei C
    var haus = new THREE.Group(); haus.position.set(0, 0, -25.5); szene.add(haus);
    BAU.kasten(5, 0.3, 3, 0x9a6b3f, haus, 0, 0.6, 0); BAU.kasten(5, 1.0, 0.15, 0xf4f1e8, haus, 0, 1.25, 1.4);
    [-2.4, 2.4].forEach(function (x) { BAU.kasten(0.15, 2.4, 0.15, 0xf4f1e8, haus, x, 1.95, 1.4); BAU.kasten(0.15, 2.4, 0.15, 0xf4f1e8, haus, x, 1.95, -1.4); });
    var dach = BAU.netz(new THREE.ConeGeometry(4.2, 1.5, 4), 0xa9432f, haus, 0, 3.9, 0); dach.rotation.y = PI / 4;
    for (var r = 0; r < 3; r++) {
      var richter = baueFigur(KERN.zufallsOutfit(), { helm: false });
      richter.setzePose({ beinL: [-1.5, 0, 0], beinR: [-1.5, 0, 0], knieL: [1.5, 0, 0], knieR: [1.5, 0, 0], armL: [-0.7, 0, 0], armR: [-0.7, 0, 0], ellL: [-1.0, 0, 0], ellR: [-1.0, 0, 0], hoch: 0.55 }, true);
      richter.wurzel.position.set(-1.5 + r * 1.5, 0.75, 0.4); haus.add(richter.wurzel);
    }
    var schild = BAU.tafel('Richter', 0.45, { farbe: '#7a3b12' }); schild.position.set(0, 1.25, 1.49); haus.add(schild);
    // Zuschauerbank, Baeume
    var baeume = [], zf = 9;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (var bn = 0; bn < 70; bn++) { var w = zuf() * PI * 2, e = 34 + zuf() * 60; baeume.push([Math.sin(w) * e, 0, Math.cos(w) * e * 1.1, 0.9 + zuf(), zuf() < 0.3 ? 1 : 0]); }
    szene.add(BAU.wald(baeume.filter(function (b2) { return !(Math.abs(b2[0]) < 12 && b2[2] > 18); })));
    szene.add(BAU.zaun([[-22, 34], [-22, -32], [22, -32], [22, 34]], { farbe: 0x8a5a33 }));
    // Linie der aktuellen Lektion (Punkte am Boden) und Ziel-Kegel
    punkte = new THREE.InstancedMesh(new THREE.CircleGeometry(0.14, 8), new THREE.MeshBasicMaterial({ color: 0xff3d7f, transparent: true, opacity: 0.85, depthWrite: false }), 260);
    punkte.frustumCulled = false;
    szene.add(punkte);
    ende = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f }));
    ende.rotation.x = PI;
    szene.add(ende);
    R = REITEN.neu(KERN.pferd, { drehung: 2.4, beschleunigung: 3.5, bremsen: 5, grenze: function (r2) {
      var drin = r2.z < 19.6;
      if (drin || Math.abs(r2.x) > 1.4) { r2.x = Math.max(-9.6, Math.min(9.6, r2.x)); r2.z = Math.max(-19.6, Math.min(Math.abs(r2.x) < 1.4 ? 28 : 19.6, r2.z)); }
      else { r2.x = Math.max(-1.4, Math.min(1.4, r2.x)); r2.z = Math.min(28, r2.z); }
    } });
    gebaut = true;
  }

  function zeigeLinie(weg) {
    var d = new THREE.Object3D(), n = 0;
    d.rotation.x = -PI / 2;
    if (weg) for (var i = 0; i < weg.length && n < 260; i += 2) { d.position.set(weg[i][0], 0.04, weg[i][1]); d.updateMatrix(); punkte.setMatrixAt(n++, d.matrix); }
    punkte.count = n;
    punkte.instanceMatrix.needsUpdate = true;
  }

  function waehleAufgabe() {
    modus = 'wahl';
    document.body.className = 'im-welt welt-dressur';
    R.setze(0, 27, PI); R.zeichne(0, 0);
    kamera.userData.sprung = true;
    zeigeLinie(null); ende.visible = false;
    KERN.zeigeKarte('mitte', '<div class="klein">' + (opt.turnier ? 'Dressurprüfung' : 'Dressur üben') + '</div><h2>🎩 Welche Aufgabe?</h2>' +
      '<div class="details" style="text-align:left">Reite die <b>rosa Linie</b> so genau wie möglich in der richtigen <b>Gangart</b>. ' +
      'Mit <b>↑ ↓</b> wechselst du die Gangart (Halt, Schritt, Trab, Galopp)' + (steuerung === 'auto' ? ', das Pferd findet den Weg allein.' : ', mit <b>← →</b> lenkst du.') +
      ' Auf dem iPad: hoch / runter und links / rechts wischen.<br>Die Richter geben für jede Lektion eine Note von 0 bis 10.</div>',
      AUFGABEN.map(function (a, i) { return { text: a.name, aktion: function () { starte(i); } }; }).concat([{ text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, null); } }]));
  }

  function starte(i) {
    KERN.schliesseKarte();
    aufgabe = AUFGABEN[i];
    nr = -1; noten = []; stufe = 0;
    R.setze(0, 27, PI);
    kamera.userData.sprung = true;
    modus = 'start';
    document.body.className = 'im-welt welt-dressur mit-tempo' + (steuerung !== 'auto' ? ' mit-lenken' : '');
    if (stopp) stopp();
    stopp = REITEN.countdown(function () { modus = 'ritt'; naechste(); });
  }

  function naechste() {
    nr++;
    if (nr >= aufgabe.teile.length) { fertig(); return; }
    lek = L[aufgabe.teile[nr]];
    mess = { summe: 0, n: 0, richtig: 0 };
    sLek = 0; haltZeit = 0; iNah = 0;
    KERN.setzeAktion(null);
    if (lek.halt) { zeigeLinie(null); ende.position.set(0, 2.6, 0); ende.visible = true; }
    else {
      laengen = [0];
      for (var i = 1; i < lek.weg.length; i++) laengen.push(laengen[i - 1] + Math.hypot(lek.weg[i][0] - lek.weg[i - 1][0], lek.weg[i][1] - lek.weg[i - 1][1]));
      zeigeLinie(lek.weg);
      var e = lek.weg[lek.weg.length - 1];
      ende.position.set(e[0], 2.6, e[1]); ende.visible = true;
    }
    setzeHinweis(lek.text);
  }
  function setzeHinweis(text) {
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }

  function note(n) { return (Math.round(n * 2) / 2).toFixed(1).replace('.', ','); }
  function bewerte(n) {
    n = Math.max(0, Math.min(10, n));
    noten.push({ text: lek.text, note: n });
    KERN.meldung('Note ' + note(n), n >= 8 ? 'perfekt' : n >= 6.5 ? 'gut' : n >= 5 ? 'knapp' : 'rot');
    KERN.klang(n >= 8 ? 'perfekt' : n >= 6.5 ? 'gut' : n >= 5 ? 'knapp' : 'oh');
    naechste();
  }

  var iNah = 0;
  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    var lenk = 0;
    if (modus === 'ritt' && lek) {
      // Gangart wechseln: Tasten, Knoepfe oder hoch / runter wischen
      var t = KERN.taste, hoch = KERN.wisch.hoch;
      var rauf = (t.schneller && !altTaste.s) || (hoch > 0.6 && altHoch <= 0.6), runter = (t.langsamer && !altTaste.l) || (hoch < -0.6 && altHoch >= -0.6);
      altTaste.s = t.schneller; altTaste.l = t.langsamer; altHoch = hoch;
      if (rauf && stufe < 3) { stufe++; KERN.ton(500 + stufe * 120, 0.08, 'triangle', 0.14); }
      if (runter && stufe > 0) { stufe--; KERN.ton(500 + stufe * 120, 0.08, 'triangle', 0.14); }
      R.wunsch = GANG_TEMPO[stufe];
      R.festerGang = stufe ? GANG[stufe] : null;
      if (lek.halt) {
        var dx = Math.hypot(R.x, R.z);
        if (R.tempo < 0.15 && dx < 4) { haltZeit += dt; if (haltZeit > 0.8) KERN.setzeAktion('🎩 Grüßen'); }
        else { haltZeit = 0; KERN.setzeAktion(null); }
        if (steuerung === 'auto' && dx > 0.5) { var zw = Math.atan2(-R.x, -R.z), df = Math.atan2(Math.sin(zw - R.kurs), Math.cos(zw - R.kurs)); lenk = Math.abs(df) < 1.6 ? Math.max(-1, Math.min(1, df * 2)) : 0; }
        else if (steuerung !== 'auto') lenk = REITEN.lenkung();
      } else {
        // naechsten Punkt der Linie suchen (nur ein Stueck voraus, damit man nicht abkuerzen kann)
        var w = lek.weg, best = 1e9, bi = iNah;
        for (var i = iNah; i < w.length && laengen[i] < laengen[iNah] + 4; i++) {
          var d = Math.hypot(w[i][0] - R.x, w[i][1] - R.z);
          if (d < best) { best = d; bi = i; }
        }
        if (best < 4.5) iNah = bi;
        sLek = laengen[iNah];
        if (R.tempo > 0.3) { mess.summe += Math.min(best, 4) * dt; mess.n += dt; if (stufe === lek.gang) mess.richtig += dt; }
        else mess.n += dt * 0.5;                    // Herumstehen zaehlt als falsche Gangart
        if (steuerung === 'auto') {
          var vorn = Math.min(w.length - 1, iNah + Math.max(3, Math.round(R.tempo * 0.9)));
          var zw2 = Math.atan2(w[vorn][0] - R.x, w[vorn][1] - R.z), df2 = Math.atan2(Math.sin(zw2 - R.kurs), Math.cos(zw2 - R.kurs));
          lenk = Math.max(-1, Math.min(1, df2 * 2.6));
        } else lenk = REITEN.lenkung();
        if (iNah >= w.length - 2) {
          var abw = mess.n > 0 ? mess.summe / mess.n : 4, anteil = mess.n > 0 ? mess.richtig / mess.n : 0;
          iNah = 0;
          bewerte((10.4 - abw * 4.5) * (0.3 + 0.7 * anteil * anteil));
        }
      }
    } else if (modus !== 'ritt') { R.wunsch = 0; R.festerGang = null; }
    if (gruss > 0) gruss -= dt;
    R.schritt(dt, lenk, zeit);
    REITEN.folge(kamera, R, dt, { hinten: 7.5, hoch: 5.2, vor: 4 });
    sonne.folge(R.x, 0, R.z);
    if (ende.visible) { ende.position.y = 2.6 + Math.sin(zeit * 5) * 0.2; ende.rotation.y = zeit * 2; }
    if (modus === 'ritt' || modus === 'start') {
      var richtig = lek && !lek.halt ? stufe === lek.gang : lek ? stufe === 0 : true;
      KERN.setzeHud(REITEN.kachel('Lektion', (Math.max(0, nr) + 1) + ' / ' + (aufgabe ? aufgabe.teile.length : 1)) +
        REITEN.kachel('Gangart', GANG_TEXT[stufe], 'gross2' + (richtig ? '' : ' warn')) +
        (lek ? REITEN.kachel('Verlangt', lek.halt ? 'Halt bei X' : GANG_TEXT[lek.gang]) : '') +
        (noten.length ? REITEN.kachel('Letzte Note', note(noten[noten.length - 1].note)) : ''));
    }
  }

  function gruesse() {
    if (modus !== 'ritt' || !lek || !lek.halt || haltZeit < 0.8) return;
    var d = Math.hypot(R.x, R.z);
    gruss = 1.2;
    KERN.klang('klatschen'); KERN.applaus(1.2, 0.08);
    KERN.setzeAktion(null);
    bewerte(10 - d * 2.2);
  }

  function fertig() {
    modus = 'fertig';
    lek = null;
    zeigeLinie(null); ende.visible = false; setzeHinweis(null);
    KERN.setzeAktion(null);
    var summe = 0;
    noten.forEach(function (n) { summe += n.note; });
    var prozent = summe / noten.length * 10;
    var zeilen = noten.map(function (n) { return '<tr><td class="links" style="font-size:13px">' + KERN.esc(n.text) + '</td><td><b>' + note(n.note) + '</b></td></tr>'; }).join('');
    var html = '<div class="klein">' + aufgabe.name + '</div><h2>' + (prozent >= 75 ? 'Wunderschön geritten!' : prozent >= 60 ? 'Gut geritten!' : 'Weiter üben!') + '</h2><div class="note">' + prozent.toFixed(1).replace('.', ',') + ' %</div>';
    var platz = 0, lohn = '';
    if (opt.turnier) {
      var tabelleKi = steuerung === 'auto' ? KI_PROZENT_AUTO : KI_PROZENT, b = tabelleKi[KERN.gegnerStufe()] || tabelleKi.leicht;
      var rang = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4).map(function (name) { return { name: name, p: b[0] + Math.random() * (b[1] - b[0]) }; });
      rang.push({ name: KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : ''), p: prozent, ich: true });
      rang.sort(function (a, c) { return c.p - a.p; });
      rang.forEach(function (r2, i) { r2.wert = r2.p.toFixed(1).replace('.', ',') + ' %'; if (r2.ich) platz = i + 1; });
      lohn = STAND.belohne(PREISGELD.dressur[platz - 1] || 4, 'Dressurprüfung');
      html += '<div class="grossPunkte">' + (platz === 1 ? '🏆 1. Platz!' : platz + '. Platz') + '</div>' + REITEN.tabelle(rang, 'Ergebnis');
      if (platz === 1) KERN.klang('fanfare');
    } else lohn = STAND.belohne(prozent >= 75 ? 6 : prozent >= 60 ? 3 : 1, 'Dressurtraining');
    html += '<table class="tabelle"><tr><th class="links">Lektion</th><th>Note</th></tr>' + zeilen + '</table>' + lohn;
    KERN.zeigeKarte('mitte', html, [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); waehleAufgabe(); } },
      { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'dressur', platz: platz, prozent: prozent }); } }]);
  }

  var API = {
    name: '🎩 Dressur',
    text: 'Dressur im Viereck 20 × 40 Meter mit den Bahnpunkten A, K, E, H, C, M, B, F und X. Reite Hufschlagfiguren wie Zirkel, „durch die ganze Bahn wechseln“ und Schlangenlinien in Schritt, Trab und Galopp. Die Richter geben Noten von 0 bis 10.',
    knopf: '🎩 Zur Dressurprüfung',
    start: function (o) {
      opt = o || {};
      if (!opt.hof) opt.turnier = true;
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      steuerung = KERN.steuerung();
      KERN.pferd.setzeOutfit(REITEN.outfitMit(opt.pferd));
      KERN.pferd.setzeAuszeichnung(false);
      KERN.pferd.setzeReiterin(true);
      szene.add(KERN.pferd.wurzel);
      KERN.betrete(API);
      waehleAufgabe();
    },
    schritt: schritt, aktion: gruesse, tipp: gruesse,
    zurueck: function () { if (stopp) stopp(); modus = 'aus'; setzeHinweis(null); REITEN.heim(opt, null); },
    verlaesst: function () { if (stopp) stopp(); modus = 'aus'; setzeHinweis(null); R.festerGang = null; KERN.pferd.koerper.rotation.set(0, 0, 0); KERN.pferd.koerper.position.y = 0; },
    zustand: function () { return { modus: modus, R: R, nr: nr, noten: noten, stufe: stufe, lek: lek, setzeStufe: function (s) { stufe = s; } }; }
  };
  return API;
})();
