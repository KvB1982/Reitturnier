// ============================================================
//  VOLTIGIEREN  -  Turnen auf dem galoppierenden Pferd an der Longe
//  Pflichtuebungen wie im echten Sport: Aufsprung, Grundsitz, Fahne,
//  Muehle, Schere, Stehen und Abgang. Jede Uebung beginnt man im
//  Galopptakt (Ring) und haelt sie dann im Gleichgewicht (Balken).
//  Die Richter geben fuer jede Uebung eine Note von 0 bis 10.
// ============================================================
WELTEN.voltigieren = (function () {
  'use strict';
  var PI = Math.PI, RADIUS = 7, TEMPO = 4.8, SPRUNG = 4.19, TAKT = SPRUNG / TEMPO;
  var SITZ_Y = 1.58, SITZ_Z = 0.0;

  // Posen: Beine/Arme haengen nach unten, x < 0 = nach vorne. "hoch" = Hoehe der Huefte ueber dem Pferderuecken
  var POSE = {
    lauf: { hoch: 0.8 },
    griff: { hoch: 0, beinL: [-0.35, 0, 0.45], beinR: [-0.35, 0, -0.45], knieL: [0.35, 0, 0], knieR: [0.35, 0, 0], armL: [-0.75, 0, 0.1], armR: [-0.75, 0, -0.1], ellL: [-0.5, 0, 0], ellR: [-0.5, 0, 0], rumpf: [0.08, 0, 0] },
    grundsitz: { hoch: 0, beinL: [-0.3, 0, 0.45], beinR: [-0.3, 0, -0.45], knieL: [0.3, 0, 0], knieR: [0.3, 0, 0], armL: [0, 0, 1.5], armR: [0, 0, -1.5] },
    fahne: { hoch: 0.45, rumpf: [1.15, 0, 0], kopf: [-0.9, 0, 0], beinR: [0, 0, 0], knieR: [1.5, 0, 0], beinL: [1.5, 0, 0], armL: [-1.15, 0, 0], armR: [-2.72, 0, 0] },
    quer: { hoch: 0, beinL: [-1.3, 0, 0.12], beinR: [-1.3, 0, -0.12], knieL: [1.3, 0, 0], knieR: [1.3, 0, 0], armL: [0.5, 0, 0.5], armR: [0.5, 0, -0.5] },
    schere: { hoch: 0.25, rumpf: [1.2, 0, 0], kopf: [-0.6, 0, 0], beinL: [2.0, 0, 0.5], beinR: [2.0, 0, -0.5], armL: [-1.3, 0, 0], armR: [-1.3, 0, 0] },
    stehen: { hoch: 0.83, beinL: [-0.12, 0, 0.06], beinR: [-0.12, 0, -0.06], knieL: [0.24, 0, 0], knieR: [0.24, 0, 0], armL: [0, 0, 1.5], armR: [0, 0, -1.5] },
    flug: { hoch: 0.4, rumpf: [0.3, 0, 0], beinL: [0.5, 0, 0.5], beinR: [0.5, 0, -0.5], armL: [0, 0, 2.4], armR: [0, 0, -2.4] },
    jubel: { hoch: 0.8, armL: [0, 0, 2.7], armR: [0, 0, -2.7] },
    sturz: { hoch: 0.3, rumpf: [1.2, 0, 0], beinL: [-1.2, 0, 0.3], beinR: [-1.2, 0, -0.3], knieL: [1.0, 0, 0], knieR: [1.0, 0, 0], armL: [-1.4, 0, 0.4], armR: [-1.4, 0, -0.4] }
  };
  function mitDrehung(pose, viertel) { var p = JSON.parse(JSON.stringify(POSE[pose])); p.ganz = [0, viertel * PI / 2, 0]; return p; }

  // Die Uebungen. stufen: Posen nacheinander (je ein Druck im Takt), halten: Sekunden im Gleichgewicht, wackel: wie schwer
  var U = {
    aufsprung: { name: 'Aufsprung', text: 'Lauf neben dem Pferd her und spring im Galopptakt auf!', stufen: ['auf'], halten: 1.6, wackel: 0.5 },
    grundsitz: { name: 'Grundsitz', text: 'Gerade sitzen und die Arme zur Seite strecken.', stufen: [POSE.grundsitz], halten: 3.4, wackel: 0.7 },
    fahne: { name: 'Fahne', text: 'Knien, ein Bein nach hinten und einen Arm nach vorne strecken.', stufen: [POSE.fahne], halten: 3.4, wackel: 1.0 },
    muehle: { name: 'Mühle', text: 'Einmal ganz herumdrehen: 4 Vierteldrehungen, jede im Takt.', stufen: [mitDrehung('quer', 1), mitDrehung('griff', 2), mitDrehung('quer', 3), mitDrehung('griff', 4)], halten: 1.4, wackel: 0.9 },
    schere: { name: 'Schere', text: 'Beine hochschwingen und umdrehen, dann wieder zurück.', stufen: [mitDrehung('griff', 2), mitDrehung('griff', 4)], schwung: true, halten: 1.4, wackel: 1.0 },
    stehen: { name: 'Stehen', text: 'Frei auf dem Pferderücken stehen. Halte gut das Gleichgewicht!', stufen: [POSE.stehen], halten: 3.6, wackel: 1.2 },
    abgang: { name: 'Abgang', text: 'Zum Schluss mit Schwung nach innen abspringen.', stufen: ['ab'], halten: 0, wackel: 0 }
  };
  var PROGRAMME = [
    { name: 'Kleine Pflicht (leicht)', text: 'Aufsprung, Grundsitz, Fahne, Stehen, Abgang', teile: ['aufsprung', 'grundsitz', 'fahne', 'stehen', 'abgang'], schwer: 0.8 },
    { name: 'Große Pflicht (mittel)', text: 'mit Mühle und Schere, das Pferd schaukelt mehr', teile: ['aufsprung', 'grundsitz', 'fahne', 'muehle', 'schere', 'stehen', 'abgang'], schwer: 1.0 }
  ];
  var KI_NOTE = { sehrleicht: [4.5, 6.0], leicht: [5.3, 6.8], mittel: [6.2, 7.6], schwer: [7.2, 8.6] };

  var gebaut = false, szene, kamera, licht, opt = {}, tier = null, turner = null, longe = null, fuehrer = null, leine = null, bein = null, beinRuheY = 0;
  var modus = 'aus', programm = null, nr = 0, ueb = null, stufe = 0, noten = [], stopp = null;
  var winkel = 0, phase = 0, zeit = 0, taktGuete = [], sperre = 0;
  var bal = 0, balZeit = 0, balGut = 0, rausch = [0, 0, 0];
  var flug = null, ort = 'unten', schwung = 0, lohnText = '';
  var elTakt = null, elBal = null;
  var v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), sitz = new THREE.Vector3(), kamZiel = new THREE.Vector3(), kamBlick = new THREE.Vector3();

  function baueAnzeige() {
    if (elTakt) return;
    elTakt = document.createElement('div'); elTakt.id = 'takt';
    elTakt.innerHTML = '<div class="ziel"></div><div class="ring"></div><span></span>';
    elBal = document.createElement('div'); elBal.id = 'balance';
    elBal.innerHTML = '<div class="zone" style="left:35%;width:30%"></div><div class="marke"></div>';
    document.body.appendChild(elTakt); document.body.appendChild(elBal);
  }

  function baue() {
    szene = new THREE.Scene();
    licht = BAU.licht(szene, { schatten: 22, nebelNah: 70, nebelFern: 240 });
    kamera = REITEN.neueKamera();
    kamera.fov = 38; kamera.updateProjectionMatrix();
    var wiese = BAU.netz(new THREE.PlaneGeometry(300, 300), 0x7cc35a, szene); wiese.rotation.x = -PI / 2; wiese.castShadow = false;
    var sand = BAU.netz(new THREE.CircleGeometry(10, 48), 0xe6d3a3, szene, 0, 0.02, 0); sand.rotation.x = -PI / 2; sand.castShadow = false;
    var spur = BAU.netz(new THREE.RingGeometry(RADIUS - 0.6, RADIUS + 0.6, 48), 0xd9c38e, szene, 0, 0.03, 0); spur.rotation.x = -PI / 2; spur.castShadow = false;
    var rand = [], i;
    for (i = 0; i <= 28; i++) rand.push([Math.sin(i / 28 * PI * 2) * 10, Math.cos(i / 28 * PI * 2) * 10]);
    szene.add(BAU.zaun(rand, { abstand: 2.2 }));
    // Richtertisch und Zuschauer hinter dem Zaun
    var tisch = new THREE.Group(); tisch.position.set(0, 0, -12.2); szene.add(tisch);
    BAU.kasten(3.2, 0.8, 0.9, 0xf4f1e8, tisch, 0, 0.4, 0);
    var schild = BAU.tafel('Richter', 0.4, { farbe: '#7a3b12' }); schild.position.set(0, 0.42, 0.46); tisch.add(schild);
    for (i = 0; i < 2; i++) {
      var r = baueFigur(KERN.zufallsOutfit(), { helm: false });
      r.setzePose({ beinL: [-1.5, 0, 0], beinR: [-1.5, 0, 0], knieL: [1.5, 0, 0], knieR: [1.5, 0, 0], armL: [-0.7, 0, 0], armR: [-0.7, 0, 0], ellL: [-1.0, 0, 0], ellR: [-1.0, 0, 0], hoch: 0.55 }, true);
      r.wurzel.position.set(-0.7 + i * 1.4, 0, -0.7); tisch.add(r.wurzel);
    }
    for (i = 0; i < 9; i++) {
      var w = 0.7 + i * 0.6 + (i > 4 ? 0.9 : 0), z = baueFigur(KERN.zufallsOutfit(), { helm: false });
      z.setzePose(i % 3 === 0 ? 'winken' : 'steh', true);
      z.wurzel.position.set(Math.sin(w) * 11, 0, Math.cos(w) * 11); z.wurzel.rotation.y = w + PI;
      z.wurzel.scale.setScalar(0.85 + (i % 4) * 0.06);
      szene.add(z.wurzel);
    }
    var baeume = [], zf = 5;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (i = 0; i < 60; i++) { var bw = zuf() * PI * 2, e = 20 + zuf() * 60; baeume.push([Math.sin(bw) * e, 0, Math.cos(bw) * e, 0.9 + zuf(), zuf() < 0.3 ? 1 : 0]); }
    szene.add(BAU.wald(baeume));
    for (i = 0; i < 6; i++) { var f = BAU.flagge([0xff6fae, 0xffe36b, 0x6fb8ff][i % 3], 3.2); f.position.set(Math.sin(i / 6 * PI * 2 + 0.3) * 10.4, 0, Math.cos(i / 6 * PI * 2 + 0.3) * 10.4); szene.add(f); }

    // Pferd mit Voltigiergurt
    tier = HERDE.bauePferd({ saat: 7 });
    tier.setzeSattel(false); tier.setzeZaum(true, false);
    var gurt = new THREE.Group(); gurt.position.set(0, 1.2, 0.33); tier.koerper.add(gurt);
    var ring = BAU.netz(new THREE.TorusGeometry(0.335, 0.035, 8, 22), 0x7a3b12, gurt); ring.scale.set(0.92, 1.22, 1);
    var polster = BAU.netz(new THREE.BoxGeometry(0.5, 0.06, 0.9), 0xe84393, tier.koerper, 0, SITZ_Y - 0.06, -0.12); polster.castShadow = false;
    [-1, 1].forEach(function (s) { var g = BAU.netz(new THREE.TorusGeometry(0.07, 0.016, 6, 12, PI), 0xf4f1e8, gurt, s * 0.15, 0.4, 0); g.rotation.y = PI / 2; });
    szene.add(tier.wurzel);
    // der Knochen unter dem Sitz: damit schaukelt die Turnerin mit dem Ruecken mit
    tier.wurzel.position.set(0, 0, 0); tier.wurzel.rotation.y = 0;
    tier.bewege('steh', 0, 0, -1);
    tier.wurzel.updateMatrixWorld(true);
    var beste = 1e9;
    for (var name in tier.knochen) {
      tier.knochen[name].getWorldPosition(v1);
      var d = Math.hypot(v1.x, v1.y - 1.35, v1.z - SITZ_Z);
      if (d < beste) { beste = d; bein = tier.knochen[name]; beinRuheY = v1.y; }
    }

    // Longenfuehrerin in der Mitte
    fuehrer = baueFigur({ jacke: '#3a7bd5', hose: '#f4f1e8', stiefel: '#2a1c12', haare: '#5a3a1e', frisur: 'zopf' }, { helm: false });
    fuehrer.setzePose('longe', true);
    szene.add(fuehrer.wurzel);
    leine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
    leine.frustumCulled = false;
    szene.add(leine);

    // Turnerin
    turner = baueFigur(KERN.spieler().outfit, { helm: false });
    longe = new THREE.Group(); longe.add(turner.wurzel); szene.add(longe);
    baueAnzeige();
    gebaut = true;
  }

  function setzeHinweis(text) {
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }
  function setzeKlasse(extra) {
    var c = document.body.classList;
    c.toggle('zeig-takt', extra === 'zeig-takt'); c.toggle('zeig-balance', extra === 'zeig-balance');
  }
  function note(n) { return (Math.round(n * 2) / 2).toFixed(1).replace('.', ','); }
  function zeigeHud() {
    var letzte = noten.length ? note(noten[noten.length - 1].note) : '–';
    KERN.setzeHud(REITEN.kachel('Übung', (Math.max(0, Math.min(nr, programm.teile.length - 1)) + 1) + ' / ' + programm.teile.length) + REITEN.kachel('Letzte Note', letzte));
  }

  function waehleProgramm() {
    modus = 'wahl';
    setzeHinweis(null); setzeKlasse('');
    KERN.setzeAktion(null); KERN.setzeHud('');
    ort = 'unten'; flug = null; schwung = 0;
    turner.setzePose(POSE.lauf, true);
    KERN.zeigeKarte('mitte', '<div class="klein">' + (opt.turnier ? 'Voltigierturnier' : 'Voltigieren üben') + '</div><h2>🤸 Welche Pflicht?</h2>' +
      '<div class="details" style="text-align:left">Dein Pferd galoppiert an der Longe im Kreis und du turnst darauf.<br>' +
      '<b>1.</b> Wenn der rosa Ring den weißen Kreis trifft: <b>Leertaste</b> drücken oder <b>tippen</b>. Das ist der Galopptakt.<br>' +
      '<b>2.</b> Dann die Übung halten: Schiebe den rosa Punkt mit <b>← →</b> (oder nach links / rechts wischen) in die grüne Mitte.<br>' +
      'Die Richter geben für jede Übung eine Note von 0 bis 10.</div>',
      PROGRAMME.map(function (p, i) { return { text: p.name, aktion: function () { starte(i); } }; }).concat([{ text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, null); } }]));
  }

  function starte(i) {
    KERN.schliesseKarte();
    programm = PROGRAMME[i];
    nr = -1; noten = [];
    modus = 'anlauf';
    zeigeHud();
    setzeHinweis('Gleich geht es los. Lauf neben ' + REITEN.pferdName(opt) + ' her!');
    stopp = REITEN.countdown(function () { stopp = null; naechste(); });
  }

  function naechste() {
    nr++;
    if (nr >= programm.teile.length) { fertig(); return; }
    ueb = U[programm.teile[nr]];
    stufe = 0; taktGuete = []; sperre = 0.5;
    modus = 'takt';
    zeigeHud();
    setzeHinweis(ueb.name + ': ' + ueb.text);
    setzeKlasse('zeig-takt');
    elTakt.className = '';
    elTakt.lastChild.textContent = ueb.stufen.length > 1 ? 'Drücke ' + ueb.stufen.length + ' mal im Takt' : 'Drücke im Takt';
    KERN.setzeAktion('🤸 ' + ueb.name + '!');
  }

  // Abstand zum naechsten Galopptakt in Sekunden (0 = genau drauf)
  function taktAbstand() {
    var u = ((phase / (PI * 2)) % 1 + 1) % 1;
    return Math.min(u, 1 - u) * TAKT;
  }

  function druecke() {
    if (modus !== 'takt' || sperre > 0) return;
    var d = taktAbstand(), g, wort;
    if (d < 0.07) { g = 1; wort = 'Perfekt!'; KERN.klang('perfekt'); }
    else if (d < 0.14) { g = 0.8; wort = 'Gut!'; KERN.klang('gut'); }
    else if (d < 0.22) { g = 0.55; wort = 'Knapp'; KERN.klang('knapp'); }
    else { g = 0.25; wort = 'Nicht im Takt'; KERN.klang('knapp'); }
    taktGuete.push(g);
    KERN.meldung(wort, g >= 0.8 ? 'gut' : 'knapp');
    elTakt.className = g >= 0.8 ? 'gut' : '';
    var s = ueb.stufen[stufe];
    if (s === 'auf') {
      flug = { t: 0, dauer: 0.55, von: 'unten', nach: 'oben', hoch: 0.7 };
      turner.setzePose(POSE.flug);
      turner.gehe(0, 0);
    } else if (s === 'ab') {
      var wz = winkel + 0.5;
      flug = { t: 0, dauer: 0.75, von: 'oben', nach: 'welt', hoch: 1.0, ziel: [Math.sin(wz) * (RADIUS - 2.6), Math.cos(wz) * (RADIUS - 2.6)], kurs: wz + PI };
      turner.setzePose(POSE.flug);
    } else {
      turner.setzePose(s);
      if (ueb.schwung) schwung = 1;
    }
    stufe++;
    sperre = TAKT * 0.55;
    if (stufe >= ueb.stufen.length) {
      KERN.setzeAktion(null);
      if (s === 'ab') { modus = 'abgang'; setzeKlasse(''); }
      else beginneHalten();
    } else elTakt.lastChild.textContent = 'Noch ' + (ueb.stufen.length - stufe) + ' mal';
  }

  function beginneHalten() {
    modus = 'halten';
    bal = (Math.random() - 0.5) * 0.3; balZeit = 0; balGut = 0;
    rausch = [Math.random() * 9, Math.random() * 9, Math.random() * 9];
    setzeKlasse('zeig-balance');
    elBal.className = '';
  }

  function werte(sturz) {
    var t = 0;
    taktGuete.forEach(function (g) { t += g; });
    t = taktGuete.length ? t / taktGuete.length : 0;
    var b = ueb.halten > 0 ? Math.min(1, (balZeit > 0 ? balGut / balZeit : 0) * 1.12) : t;
    var n = Math.max(0, Math.min(10, 10 * (0.4 * t + 0.6 * b)));
    if (sturz) n = Math.min(n * 0.5, 3);
    noten.push({ text: ueb.name, note: n });
    KERN.meldung(ueb.name + ': Note ' + note(n), n >= 7 ? 'gut' : 'knapp');
    if (n >= 8) KERN.klang('klatschen');
    zeigeHud();
  }

  function falle() {
    werte(true);
    modus = 'sturz';
    setzeKlasse('');
    KERN.klang('oh');
    setzeHinweis('Hoppla, runtergerutscht! Nichts passiert, gleich geht es weiter.');
    var wz = winkel + 0.35;
    flug = { t: 0, dauer: 0.6, von: 'oben', nach: 'welt', hoch: 0.3, ziel: [Math.sin(wz) * (RADIUS - 1.6), Math.cos(wz) * (RADIUS - 1.6)], kurs: wz + PI, sturz: true };
    turner.setzePose(POSE.sturz);
    zeit = 0;
  }

  function fertig() {
    modus = 'fertig';
    setzeHinweis(null); setzeKlasse('');
    KERN.setzeAktion(null);
    var summe = 0;
    noten.forEach(function (n) { summe += n.note; });
    var schnitt = summe / noten.length;
    var zeilen = noten.map(function (n) { return '<tr><td class="links">' + KERN.esc(n.text) + '</td><td><b>' + note(n.note) + '</b></td></tr>'; }).join('');
    var html = '<div class="klein">' + programm.name + '</div><h2>' + (schnitt >= 7.5 ? 'Traumhaft geturnt!' : schnitt >= 6 ? 'Gut geturnt!' : 'Weiter üben!') + '</h2><div class="note">' + schnitt.toFixed(1).replace('.', ',') + '</div>';
    var platz = 0;
    STAND.merke('volti', schnitt);
    if (opt.turnier) {
      var b = KI_NOTE[KERN.gegnerStufe()] || KI_NOTE.leicht;
      var rang = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4).map(function (name) { return { name: name, p: b[0] + Math.random() * (b[1] - b[0]) }; });
      rang.push({ name: KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : ''), p: schnitt, ich: true });
      rang.sort(function (a, c) { return c.p - a.p; });
      rang.forEach(function (r, i) { r.wert = r.p.toFixed(1).replace('.', ','); if (r.ich) platz = i + 1; });
      lohnText = STAND.belohne(PREISGELD.voltigieren[platz - 1] || 4, 'Voltigierturnier');
      html += '<div class="grossPunkte">' + (platz === 1 ? '🏆 1. Platz!' : platz + '. Platz') + '</div>' + REITEN.tabelle(rang, 'Note');
      if (platz === 1) KERN.klang('fanfare'); else KERN.klang('jubel');
    } else { lohnText = STAND.belohne(schnitt >= 7.5 ? 6 : schnitt >= 6 ? 3 : 1, 'Voltigiertraining'); KERN.klang('jubel'); }
    html += '<table class="tabelle"><tr><th class="links">Übung</th><th>Note</th></tr>' + zeilen + '</table>' + lohnText;
    KERN.zeigeKarte('mitte', html, [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); waehleProgramm(); } },
      { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'voltigieren', platz: platz, note: schnitt }); } }]);
  }

  // Wo ist die Turnerin? 'oben' auf dem Ruecken, 'unten' laeuft innen nebenher, 'welt' steht im Zirkel
  function punkt(wo, aus) {
    var px = tier.wurzel.position.x, pz = tier.wurzel.position.z, k = tier.wurzel.rotation.y;
    if (wo === 'oben') return aus.set(px + Math.sin(k) * SITZ_Z, sitz.y, pz + Math.cos(k) * SITZ_Z);
    // innen = links vom Pferd
    return aus.set(px + Math.cos(k) * 1.0 + Math.sin(k) * 0.2, 0, pz - Math.sin(k) * 1.0 + Math.cos(k) * 0.2);
  }

  function schritt(dt) {
    if (modus === 'aus') return;
    zeit += dt;
    if (sperre > 0) sperre -= dt;
    // Pferd im Kreis
    var alt = phase;
    winkel += TEMPO / RADIUS * dt;
    phase += TEMPO * dt / SPRUNG * PI * 2;
    tier.wurzel.position.set(Math.sin(winkel) * RADIUS, 0, Math.cos(winkel) * RADIUS);
    tier.wurzel.rotation.y = winkel + PI / 2;
    tier.koerper.rotation.z = -0.07;
    tier.bewege('galopp', phase, 0.8, -1, dt);
    KERN.galoppTon(alt, phase, 0.55);
    if (modus === 'takt' && Math.floor(alt / (PI * 2)) !== Math.floor(phase / (PI * 2))) KERN.ton(990, 0.06, 'sine', 0.12);
    tier.wurzel.updateMatrixWorld(true);
    bein.getWorldPosition(v1);
    sitz.y = SITZ_Y + (v1.y - beinRuheY);
    // Longenfuehrerin dreht sich mit
    fuehrer.wurzel.rotation.y = winkel + 0.25;
    fuehrer.bewege(dt);
    fuehrer.gelenke.handR.getWorldPosition(v1);
    var pos = leine.geometry.attributes.position, kurs = tier.wurzel.rotation.y;
    pos.setXYZ(0, v1.x, v1.y, v1.z);
    pos.setXYZ(1, tier.wurzel.position.x + Math.sin(kurs) * 1.25, 1.55, tier.wurzel.position.z + Math.cos(kurs) * 1.25);
    pos.needsUpdate = true;

    // Gleichgewicht halten
    if (modus === 'halten') {
      var w = ueb.wackel * programm.schwer;
      var stoss = (Math.sin(zeit * 1.3 + rausch[0]) + Math.sin(zeit * 2.3 + rausch[1]) * 0.7 + Math.sin(zeit * 3.7 + rausch[2]) * 0.4) * 0.6 * w;
      bal += (stoss + bal * 0.6 * w - REITEN.lenkung() * 1.7) * dt;
      balZeit += dt;
      if (Math.abs(bal) < 0.3) balGut += dt;
      elBal.lastChild.style.left = (50 + Math.max(-1, Math.min(1, bal)) * 50) + '%';
      elBal.className = Math.abs(bal) > 0.62 ? 'schlecht' : '';
      if (Math.abs(bal) >= 1) falle();
      else if (balZeit >= ueb.halten) {
        werte(false);
        // nach einer ganzen Drehung steht "ganz" auf 360 Grad: unsichtbar auf 0 zurueckstellen
        turner.setzePose(POSE.griff, ueb.stufen.length > 1);
        modus = 'pause'; zeit = 0;
        setzeKlasse('');
      }
    } else if (modus === 'pause' && zeit > 0.9) naechste();
    else if (modus === 'abgang' && !flug && zeit > 1.6) naechste();
    else if (modus === 'sturz' && !flug && zeit > 2.0) {
      // wieder aufsteigen
      flug = { t: 0, dauer: 0.6, von: 'welt', nach: 'oben', hoch: 0.8 };
      turner.setzePose(POSE.griff);
      modus = 'pause'; zeit = -0.4;
    }

    // Turnerin setzen
    var kippe = 0;
    if (flug) {
      flug.t += dt / flug.dauer;
      var t = Math.min(1, flug.t), weich = t * t * (3 - 2 * t);
      if (flug.von === 'welt') v1.copy(longe.userData.fest || longe.position); else punkt(flug.von, v1);
      if (flug.nach === 'welt') v2.set(flug.ziel[0], 0, flug.ziel[1]); else punkt(flug.nach, v2);
      longe.position.lerpVectors(v1, v2, weich);
      longe.position.y += Math.sin(t * PI) * flug.hoch;
      if (flug.nach === 'welt') longe.rotation.y = flug.kurs; else longe.rotation.y = kurs;
      if (t >= 1) {
        ort = flug.nach;
        if (ort === 'welt') {
          longe.userData.fest = longe.position.clone();
          if (flug.sturz) turner.setzePose({ hoch: 0.8, armL: [-0.4, 0, 0.3], armR: [-0.4, 0, -0.3] });
          else { turner.setzePose(POSE.jubel); KERN.klang('klatschen'); werte(false); zeit = 0; }
        } else if (ort === 'oben' && modus !== 'pause') turner.setzePose(POSE.griff);
        flug = null;
      }
    } else if (ort === 'oben') {
      punkt('oben', longe.position); longe.rotation.y = kurs;
      kippe = modus === 'halten' ? bal * 0.45 : 0;
    } else if (ort === 'unten') {
      punkt('unten', longe.position); longe.rotation.y = kurs;
      turner.gehe(phase * 2, 1);
    } else { longe.position.copy(longe.userData.fest); turner.gehe(0, 0); }
    if (ort !== 'unten' || flug) turner.gehe(0, 0);
    turner.bewege(dt);
    // Wackeln beim Balancieren und Schwung bei der Schere
    turner.gelenke.ganz.rotation.z += -kippe;
    if (schwung > 0) { schwung = Math.max(0, schwung - dt * 1.6); turner.gelenke.ganz.rotation.x += Math.sin(schwung * PI) * 0.9; turner.gelenke.beinL.rotation.x += Math.sin(schwung * PI) * 1.2; turner.gelenke.beinR.rotation.x += Math.sin(schwung * PI) * 1.2; }

    // Takt-Ring: schrumpft bis zum naechsten Galopptakt auf den weissen Kreis
    if (modus === 'takt') {
      var u = ((phase / (PI * 2)) % 1 + 1) % 1;
      elTakt.children[1].style.transform = 'scale(' + (1 + (1 - u) * 1.3).toFixed(3) + ')';
      elTakt.children[1].style.opacity = (0.35 + u * 0.65).toFixed(2);
    }

    // Kamera: von der Mitte aus, dreht mit dem Pferd (im Hochformat weiter aufgezogen)
    var fov = kamera.aspect < 1.2 ? Math.min(68, 38 * 1.2 / kamera.aspect) : 38;
    if (Math.abs(kamera.fov - fov) > 0.5) { kamera.fov = fov; kamera.updateProjectionMatrix(); }
    var kw = winkel - 0.12;
    kamZiel.set(Math.sin(kw + PI) * 2.4 + Math.cos(kw) * 2.0, 2.6, Math.cos(kw + PI) * 2.4 - Math.sin(kw) * 2.0);
    kamBlick.set(Math.sin(winkel) * (RADIUS - 0.6), 2.35, Math.cos(winkel) * (RADIUS - 0.6));
    var b = kamera.userData.blick;
    if (kamera.userData.sprung) { kamera.position.copy(kamZiel); b.copy(kamBlick); kamera.userData.sprung = false; }
    else { kamera.position.lerp(kamZiel, 1 - Math.exp(-5 * dt)); b.lerp(kamBlick, 1 - Math.exp(-8 * dt)); }
    kamera.lookAt(b);
    licht.folge(0, 0, 0);
  }

  function raeume() {
    if (stopp) { stopp(); stopp = null; }
    modus = 'aus';
    setzeHinweis(null);
    document.body.classList.remove('zeig-takt', 'zeig-balance');
  }

  var API = {
    name: '🤸 Voltigieren',
    text: 'Turnen auf dem galoppierenden Pferd an der Longe. Zeige die Pflichtübungen Aufsprung, Grundsitz, Fahne, Mühle, Schere, Stehen und Abgang: im Galopptakt beginnen und dann das Gleichgewicht halten. Die Richter geben Noten von 0 bis 10.',
    knopf: '🤸 Zum Voltigieren',
    klasse: 'welt-volti',
    start: function (o) {
      opt = o || {};
      if (!opt.hof) opt.turnier = true;
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      var aus = REITEN.outfitMit(opt.pferd);
      tier.setzeFell(aus.fell);
      tier.setzeSchmutz(0);
      turner.setzeOutfit(KERN.spieler().outfit);
      winkel = PI; phase = 0; zeit = 0; flug = null; ort = 'unten'; schwung = 0;
      longe.userData.fest = null;
      kamera.userData.sprung = true;
      KERN.betrete(API);
      waehleProgramm();
      schritt(0.001);
    },
    schritt: schritt, aktion: druecke, tipp: druecke,
    fotoZiel: function () { return v2.set(tier.wurzel.position.x, 1.9, tier.wurzel.position.z); },
    zurueck: function () { raeume(); REITEN.heim(opt, null); },
    verlaesst: raeume,
    zustand: function () { return { modus: modus, nr: nr, noten: noten, bal: bal, ort: ort, taktAbstand: taktAbstand, setzeBal: function (x) { bal = x; } }; }
  };
  return API;
})();
