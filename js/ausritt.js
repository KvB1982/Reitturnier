// ============================================================
//  AUSRITT  -  frei durch eine große Landschaft: Wiesen, Wälder
//  mit geschwungenen Wegen bergauf und bergab, Felder mit Traktor,
//  Bach, Landstraße, Dorf und Windmühle, Berge am Horizont.
//  Man kann überall absteigen, das Pferd führen oder zu Fuß gehen,
//  das Pferd wechseln, Tiere beobachten und kleine Spiele spielen.
//  Norden (z klein) ist der Pferdehof, nach Süden (z groß) geht es hinaus.
// ============================================================
WELTEN.ausritt = (function () {
  'use strict';
  var WASSER = -0.35, SEE = [-42, 30, 30], START = [0, -104], MITTE = [0, 170], HALB = 320;
  var RAND = { x0: -302, x1: 302, z0: -127, z1: 472 };
  // Die Orte: [Kennung, Name, x, z, was die Freundin dazu sagt]
  var ORTE = [
    ['eiche', '🌳 Die alte Eiche', 38, -34, 'Die Eiche ist schon 300 Jahre alt!'],
    ['huette', '🏠 Die Waldhütte', 82, 8, 'Hier wohnt im Sommer der Förster.'],
    ['berg', '⛰️ Der Aussichtshügel', 58, 78, 'Von hier oben sieht man bis zum Hof!'],
    ['picknick', '🧺 Der Picknickplatz', -8, 50, 'Pause! Die Pferde dürfen grasen.'],
    ['see', '🌊 Der See', -30, 30, 'Komm, wir reiten ins Wasser!'],
    ['wiese', '🌸 Die Blumenwiese', -72, -48, 'So viele Blumen! Jetzt ein Galopp?'],
    ['muehle', '🌬️ Die Windmühle', 226, 24, 'Hör mal, wie die Flügel knarren!'],
    ['bruecke', '🌉 Die Holzbrücke', -153, 141, 'Schön langsam über die Brücke. Siehst du die Störche?'],
    ['stroh', '🌾 Die Strohburg', -240, 256, 'Der Bauer hat eine Burg aus Stroh gebaut!'],
    ['dorf', '🏘️ Das Dorf', -205, 380, 'Im Dorf gibt es das beste Eis weit und breit.'],
    ['lichtung', '🦌 Die Waldlichtung', 116, 368, 'Pssst! Hier wohnt der große Hirsch.'],
    ['kreuz', '🏔️ Das Gipfelkreuz', 215, 330, 'Geschafft! Höher geht es nicht. Was für eine Aussicht!']
  ];
  var WEGE = {
    runde: [[0, -104], [10, -70], [38, -40], [66, -12], [80, 14], [70, 50], [58, 74], [30, 62], [0, 44], [-22, 32], [-48, -4], [-70, -44], [-40, -80]],
    tor: [[0, -130], [0, -104]],
    sued: [[0, 44], [5, 82], [0, 117], [0, 150]],
    wald: [[0, 150], [40, 165], [75, 150], [110, 175], [140, 215], [175, 225], [205, 260], [222, 298], [215, 330], [190, 354], [160, 340], [120, 365], [80, 330], [60, 290], [85, 250], [60, 210], [20, 190], [0, 150]],
    feld: [[0, 150], [-60, 178], [-120, 200], [-180, 225], [-235, 260], [-250, 320], [-205, 372], [-130, 362], [-70, 320], [-40, 260], [-30, 200], [0, 150]],
    bach: [[-70, -44], [-110, -10], [-140, 40], [-150, 90], [-153, 141], [-160, 185], [-120, 200]],
    muehle: [[80, 14], [130, 10], [180, 25], [224, 23]],
    spur: [[-40, -80], [-75, -92], [-104, -88]]
  };
  var STRASSE = [[-330, 112], [-230, 120], [-165, 108], [-110, 100], [-40, 112], [40, 120], [130, 112], [220, 122], [330, 110]];
  var FLUSS = [[-58, 44], [-85, 66], [-112, 95], [-128, 125], [-150, 141], [-185, 150], [-240, 172], [-330, 186]];
  // Felder: [x0, z0, x1, z1, Farbe, Art]
  var FELDER = [[-115, 205, -45, 312, 0xf0d848, 'raps'], [-225, 236, -125, 350, 0xe2c570, 'weizen'], [-300, 200, -244, 330, 0x9a744a, 'acker'], [-300, 346, -236, 440, 0x86b552, 'sonne'], [-100, 352, -45, 425, 0x8fd060, 'weide']];
  var SPRUECHE = ['Wollen wir ein Stück traben?', 'Hörst du die Vögel?', 'Ausreiten ist das Schönste!', 'Schau mal, wie die Ohren spielen.', 'Hier riecht es nach Wald.', 'Im großen Wald im Süden geht es richtig bergauf!', 'Bei den Feldern fährt der Bauer mit dem Traktor.', 'Auf der Wiese westlich vom Start stehen Slalomstangen!', 'An der Windmühle hängen Ringe zum Ringstechen.', 'Wenn du anhältst, kannst du absteigen und dein Pferd führen.'];
  var TIERNAMEN = { reh: '🦌 Rehe', hirsch: '🦌 Der große Hirsch', hase: '🐇 Feldhasen', fuchs: '🦊 Ein Fuchs', schaf: '🐑 Die Schafherde', kuh: '🐄 Kühe', storch: '🦢 Störche', ente: '🦆 Enten' };

  var gebaut = false, szene, kamera, sonne, himmel, opt = {};
  var meins, freund, fohlenTier, M = null, F = null, ich, freundin, I, B, FO;
  var modus = 'aus', zeit = 0, dauer = 0, kamW = 0, aktuell = null, zweitListe = [];
  var mitPferd = true, mitFreundin = true, fuehrt = false, mein = null, ihr = null, startId = null, alle = [];
  var gefunden = {}, gesehen = {}, getan = {}, muenzen = 0, apfelZahl = 0, blumenZahl = 0, pilzZahl = 0, hufeisenZahl = 0, nass = 0, kalt = false;
  var redeZeit = 0, naechsteRede = 25, hinweisAlt = null, tippZeit = 0;
  var linien = {}, strasse, fluss, baumRaster = {}, kreise = [], stuecke = [], bruecken = [], staemme = [];
  var marken = [], aepfel = [], enten = [], herden = [], pilze = [], hufeisen = [], ringe = [], wasserRinge = [], tore = [];
  var STEG, SITZE = [], stein, schwimmer, fisch, angel = null, entenRuf = 0, strick, zielFahne, traktoren = [], schafe = null, fallBaum = null, muehlRad = null;
  var rennen = null, rennPause = 70, slalom = null, ringSerie = null, schreck = 0;
  var d3 = new THREE.Object3D(), kamZiel = new THREE.Vector3(), kamBlick = new THREE.Vector3(), hv = new THREE.Vector3();

  function glatt(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function winkel(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

  // ---------- Linien (Wege, Straße, Bach): geglättet, mit schneller Abstandsmessung ----------
  function linie(punkte, zu) {
    var n = punkte.length, p = [], i, k;
    function pt(j) { return zu ? punkte[(j + n) % n] : punkte[Math.max(0, Math.min(n - 1, j))]; }
    for (i = 0; i < (zu ? n : n - 1); i++) {
      var a = pt(i - 1), b = pt(i), c = pt(i + 1), e = pt(i + 2), m = Math.max(2, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) / 5));
      for (k = 0; k < m; k++) {
        var t = k / m, t2 = t * t, t3 = t2 * t;
        p.push([0.5 * (2 * b[0] + (c[0] - a[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - e[0]) * t2 + (3 * b[0] - a[0] - 3 * c[0] + e[0]) * t3),
          0.5 * (2 * b[1] + (c[1] - a[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - e[1]) * t2 + (3 * b[1] - a[1] - 3 * c[1] + e[1]) * t3)]);
      }
    }
    p.push(zu ? p[0].slice() : punkte[n - 1].slice());
    var kisten = [];
    for (i = 0; i < p.length - 1; i += 8) {
      var x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (k = i; k <= Math.min(p.length - 1, i + 8); k++) { x0 = Math.min(x0, p[k][0]); x1 = Math.max(x1, p[k][0]); z0 = Math.min(z0, p[k][1]); z1 = Math.max(z1, p[k][1]); }
      kisten.push([x0, z0, x1, z1, i]);
    }
    var L = { p: p, zu: !!zu };
    // Abstand zum nächsten Punkt der Linie (höchstens "bis"); merkt sich in L.nr den Abschnitt
    L.abstand = function (x, z, bis) {
      var m = bis || 60, m2 = m * m;
      for (var q = 0; q < kisten.length; q++) {
        var K = kisten[q];
        if (x < K[0] - m || x > K[2] + m || z < K[1] - m || z > K[3] + m) continue;
        for (var j = K[4]; j < Math.min(p.length - 1, K[4] + 8); j++) {
          var a = p[j], b = p[j + 1], dx = b[0] - a[0], dz = b[1] - a[1];
          var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
          var ex = x - a[0] - dx * t, ez = z - a[1] - dz * t, e2 = ex * ex + ez * ez;
          if (e2 < m2) { m2 = e2; m = Math.sqrt(e2); L.nr = j; }
        }
      }
      return m;
    };
    return L;
  }
  function wegAbstand(x, z, bis) {
    var m = bis || 60;
    for (var k in linien) { var e = linien[k].abstand(x, z, m); if (e < m) { m = e; wegAbstand.linie = linien[k]; wegAbstand.nr = linien[k].nr; } }
    return m;
  }

  // ---------- Gelände ----------
  function buckel(x, z, mx, mz, hoch, breit) { var dx = x - mx, dz = z - mz; return hoch * Math.exp(-(dx * dx + dz * dz) / breit); }
  function inFeld(x, z, rand) {
    for (var i = 0; i < FELDER.length; i++) { var f = FELDER[i]; if (x > f[0] - rand && x < f[2] + rand && z > f[1] - rand && z < f[3] + rand) return f; }
    return null;
  }
  function boden(x, z) {
    var h = 1.6 + 1.8 * Math.sin(x * 0.031 - 0.5) * Math.cos(z * 0.027 - 0.3) + 0.9 * Math.sin(x * 0.067 - z * 0.049);
    h += buckel(x, z, 58, 78, 9, 900) + buckel(x, z, 232, 18, 7, 1500);                          // Aussichtshügel, Mühlenhügel
    h += buckel(x, z, 150, 232, 14, 5200) + buckel(x, z, 215, 330, 25, 5200) + buckel(x, z, 96, 300, 8, 2600) + buckel(x, z, 250, 180, 9, 3000);   // die Waldberge
    h += buckel(x, z, -220, 10, 6, 2800);
    h = Math.max(0.35, h);
    var flach = glatt(-30, -70, x) * glatt(170, 205, z) * glatt(470, 440, z);                    // die Felder sind fast eben
    h = h * (1 - flach * 0.8) + 1.1 * flach * 0.8;
    var eben = glatt(34, 16, Math.hypot(x - START[0], z - START[1]));                            // ebene Wiese am Start
    h = h * (1 - eben) + 0.8 * eben;
    var see = glatt(SEE[2] + 9, SEE[2] - 12, Math.hypot(x - SEE[0], (z - SEE[1]) * 1.25));       // Mulde für den See
    h = h * (1 - see) + -1.15 * see;
    if (fluss) { var tal = glatt(9.5, 2.5, fluss.abstand(x, z, 10)); h = h * (1 - tal) + Math.min(h, -0.8) * tal; }   // Bachbett
    var rand = glatt(HALB - 22, HALB, Math.max(Math.abs(x - MITTE[0]), Math.abs(z - MITTE[1])));
    return h * (1 - rand) + 0.5 * rand;
  }
  // Brücken und Steg: dort steht man höher als der Boden
  function aufBruecke(x, z) {
    for (var i = 0; i < bruecken.length; i++) {
      var b = bruecken[i], dx = x - b.x, dz = z - b.z, l = dx * b.rx + dz * b.rz, q = -dx * b.rz + dz * b.rx;
      if (Math.abs(l) < b.lang / 2 && Math.abs(q) < b.breit / 2) return b;
    }
    return null;
  }
  function hoehe(x, z) { var b = aufBruecke(x, z), h = boden(x, z); return b ? Math.max(h, b.y) : h; }
  function wald(x, z) {                // wie dicht stehen hier Bäume? 0 = Wiese, 1 = dichter Wald
    if (x > 14 && x < 140 && z > -72 && z < 104) return 1;
    if (x > 40 && z > 128) return Math.hypot(x - 116, z - 372) < 26 ? 0 : 1;
    if (Math.hypot((x + 245) / 62, (z - 5) / 70) < 1) return 0.9;
    if (z > 448 || x > 262) return 0.8;
    return 0;
  }

  // Band entlang einer Linie, das sich an den Boden schmiegt (Wege, Straße, Bach)
  function band(L, breit, farbe, hoch, o) {
    o = o || {};
    var p = L.p, pos = [], idx = [], i, q = o.quer || 2;
    for (i = 0; i < p.length; i++) {
      var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      for (var k = 0; k <= q; k++) { var s = (k / q - 0.5) * breit, x = p[i][0] + nx * s, z = p[i][1] + nz * s; pos.push(x, o.fest !== undefined ? o.fest : hoehe(x, z) + hoch, z); }
      if (i < p.length - 1 && !(o.striche && i % 2)) for (k = 0; k < q; k++) { var v = i * (q + 1) + k; idx.push(v, v + 1, v + q + 1, v + 1, v + q + 2, v + q + 1); }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    var m = new THREE.Mesh(geo, o.material || new THREE.MeshStandardMaterial({ color: farbe, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 - (o.vorn || 0), polygonOffsetUnits: -2 - (o.vorn || 0) * 2 }));
    m.receiveShadow = true; szene.add(m);
    return m;
  }
  function sperre(x, z, r) { kreise.push([x, z, r]); }
  function baum(x, z, r) { var k = Math.floor(x / 8) + ',' + Math.floor(z / 8); (baumRaster[k] = baumRaster[k] || []).push([x, z, r]); }
  function frei(x, z, r) {              // steht hier schon etwas?
    for (var i = 0; i < kreise.length; i++) if (Math.hypot(x - kreise[i][0], z - kreise[i][1]) < kreise[i][2] + r) return false;
    return true;
  }

  function baue() {
    var i, k, zf = 11;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 42, nebelNah: 120, nebelFern: 430, himmel: 0xa9d8f2 });
    kamera = REITEN.neueKamera(); kamera.far = 3400; kamera.updateProjectionMatrix();
    fluss = linie(FLUSS); strasse = linie(STRASSE);
    for (k in WEGE) linien[k] = linie(WEGE[k], k === 'runde');
    // Brücken: Holzbrücke am Bachweg, Straßenbrücke
    [[linien.bach, 3.4, 20, 'holz'], [strasse, 9, 24, 'stein']].forEach(function (e) {
      var best = 1e9, nr = 0;
      e[0].p.forEach(function (q, j) { var a = fluss.abstand(q[0], q[1], 40); if (a < best) { best = a; nr = j; } });
      var a = e[0].p[nr - 1], b = e[0].p[nr + 1], q = e[0].p[nr], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      bruecken.push({ x: q[0], z: q[1], rx: (b[0] - a[0]) / l, rz: (b[1] - a[1]) / l, lang: e[2], breit: e[1], y: 0, art: e[3] });
    });
    bruecken.forEach(function (b) { b.y = 0; b.y = Math.max(0.55, (boden(b.x + b.rx * b.lang / 2, b.z + b.rz * b.lang / 2) + boden(b.x - b.rx * b.lang / 2, b.z - b.rz * b.lang / 2)) / 2); });

    // ----- der Boden mit Farben: Wiese, Waldboden, Felder, Wege, Ufer -----
    var N = 256, geo = new THREE.PlaneGeometry(HALB * 2, HALB * 2, N, N);
    geo.rotateX(-Math.PI / 2); geo.translate(MITTE[0], 0, MITTE[1]);
    var pos = geo.attributes.position, farben = new Float32Array(pos.count * 3), c = new THREE.Color(), weg = new THREE.Color(0xc9b386), f2 = new THREE.Color();
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), h = boden(x, z), w = wald(x, z), fe = inFeld(x, z, 0);
      pos.setY(i, h);
      if (h < WASSER + 0.2) c.setHex(0xcdbb8a);
      else if (h < WASSER + 0.55) c.setHex(0xa9c070);
      else {
        c.setHex(0x78c456).lerp(f2.setHex(0x4f9a3e), Math.max(0, Math.min(1, (h - 1.5) / 9)));
        if (w) c.lerp(f2.setHex(0x4a7f38), 0.55 * w);
        if (fe) { c.setHex(fe[4]); if (fe[5] === 'acker' || fe[5] === 'weizen') c.multiplyScalar(0.9 + 0.1 * Math.sin(x * 2.4)); }
        c.lerp(weg, glatt(3.0, 1.2, wegAbstand(x, z, 4)));
        c.lerp(f2.setHex(0x8f9198), glatt(6.5, 4.6, strasse.abstand(x, z, 8)));
      }
      c.multiplyScalar(0.9 + HERDE.rausch(x * 0.15, 3, z * 0.15, 6) * 0.2);
      farben[i * 3] = c.r; farben[i * 3 + 1] = c.g; farben[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    geo.computeVertexNormals();
    var land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    land.receiveShadow = true; szene.add(land);
    // rundherum geht die Wiese weiter (vier Streifen, damit See und Bach frei bleiben)
    [[0, -1, 7000, 3180], [0, 1, 7000, 3180], [-1, 0, 3180, 640], [1, 0, 3180, 640]].forEach(function (e) {
      var fern = BAU.netz(new THREE.PlaneGeometry(e[2], e[3]), 0x74bd55, szene, MITTE[0] + e[0] * (HALB + e[2] / 2), 0.5, MITTE[1] + e[1] * (HALB + e[3] / 2));
      fern.rotation.x = -Math.PI / 2; fern.castShadow = false;
    });
    NATUR.berge(szene, MITTE[0], MITTE[1], 1250, 4);
    himmel = NATUR.himmel(szene, { wolken: 18, voegel: 4, hoch: 22 });
    // Wasser: See und Bach
    var wm = new THREE.MeshStandardMaterial({ color: 0x3f97d6, transparent: true, opacity: 0.8, roughness: 0.15 });
    var wasser = new THREE.Mesh(new THREE.CircleGeometry(SEE[2] + 12, 40), wm);
    wasser.rotation.x = -Math.PI / 2; wasser.position.set(SEE[0], WASSER, SEE[1]); szene.add(wasser);
    band(fluss, 17, 0, 0, { fest: WASSER, material: wm, quer: 1 });
    // Wege und Straße
    for (k in linien) band(linien[k], k === 'tor' ? 4 : 2.6, 0xd2bd8e, 0.07);
    band(strasse, 8.4, 0x7d8088, 0.09, { quer: 4, vorn: 1 });
    band(strasse, 0.3, 0xffffff, 0.12, { quer: 1, striche: true, vorn: 2 });
    bruecken.forEach(function (b) {
      var g = new THREE.Group(); g.position.set(b.x, b.y, b.z); g.rotation.y = Math.atan2(b.rx, b.rz); szene.add(g);
      var holz = b.art === 'holz';
      BAU.kasten(b.breit, 0.3, b.lang, holz ? 0x9a6b3f : 0x9a9488, g, 0, -0.17, 0);
      [-1, 1].forEach(function (s) {
        BAU.kasten(0.14, 0.12, b.lang, holz ? 0x7a4a2a : 0xb9b2a4, g, s * (b.breit / 2 - 0.08), 1.0, 0);
        for (var j = 0; j <= 6; j++) BAU.kasten(0.14, 1.0, 0.14, holz ? 0x7a4a2a : 0xb9b2a4, g, s * (b.breit / 2 - 0.08), 0.5, -b.lang / 2 + j * b.lang / 6);
        if (!holz) BAU.kasten(0.3, 2.2, b.lang * 0.55, 0x8a857a, g, s * (b.breit / 2 - 0.3), -1.3, 0);
      });
      if (holz) for (var j = 0; j < 3; j++) [-1, 1].forEach(function (s) { BAU.walze(0.16, 0.16, 2.4, 0x6b4a2a, g, s * (b.breit / 2 - 0.2), -1.2, (j - 1) * b.lang * 0.3, 7); });
    });

    baueOrte(zuf);
    baueFelder(zuf);
    baueSpiele(zuf);

    // ----- Bäume: dichte Wälder, lichte Baumgruppen auf den Wiesen. Wege, Wasser, Felder und Plätze bleiben frei. -----
    var liste = [];
    for (i = 0; i < 9000 && liste.length < 1250; i++) {
      var bx = RAND.x0 - 14 + zuf() * (RAND.x1 - RAND.x0 + 28), bz = RAND.z0 + zuf() * (RAND.z1 - RAND.z0 + 14), dicht = wald(bx, bz);
      if (zuf() > (dicht ? dicht * 0.6 : 0.045)) continue;
      var hh = boden(bx, bz), fr = wegAbstand(bx, bz, 12);
      if (hh < 0.5 || fr < (dicht ? 3.6 : 9) || strasse.abstand(bx, bz, 9) < 8.5 || fluss.abstand(bx, bz, 12) < 11 || inFeld(bx, bz, 4)) continue;
      if (Math.hypot(bx - START[0], bz - START[1]) < 24 || Math.hypot(bx + 72, bz + 48) < 27 || (bx < -95 && bx > -200 && bz < -70 && bz > -106) || !frei(bx, bz, 2.2)) continue;
      var gr = (dicht ? 1.05 : 0.9) + zuf() * (dicht ? 1.5 : 1.1);
      liste.push([bx, hh - 0.1, bz, gr, zuf() < (dicht ? (bz > 120 ? 0.62 : 0.5) : 0.2) ? 1 : 0]);
      baum(bx, bz, 0.34 * gr);
    }
    liste.push([41, boden(41, -37) - 0.2, -37, 3.6, 0]); baum(41, -37, 1.3);      // die alte Eiche
    // in Stücke teilen: so zeichnet der Rechner nur die Bäume, die man gerade sieht
    var teile = {};
    liste.forEach(function (b) { var key = Math.floor(b[0] / 96) + ',' + Math.floor(b[2] / 96); (teile[key] = teile[key] || []).push(b); });
    for (k in teile) {
      var g = BAU.wald(teile[k], { fern: true }), mx = 0, mz = 0;
      teile[k].forEach(function (b) { mx += b[0]; mz += b[2]; });
      szene.add(g); stuecke.push({ g: g, x: mx / teile[k].length, z: mz / teile[k].length });
    }
    // Felsen und Büsche
    var felsen = [], buesche = [];
    for (i = 0; i < 1400 && (felsen.length < 26 || buesche.length < 120); i++) {
      var qx = RAND.x0 + zuf() * (RAND.x1 - RAND.x0), qz = RAND.z0 + zuf() * (RAND.z1 - RAND.z0), qh = boden(qx, qz), qf = wegAbstand(qx, qz, 50), qg = zuf();
      if (qh < 0.5 || qf < 4.5 || qf > 46 || strasse.abstand(qx, qz, 8) < 7 || inFeld(qx, qz, 2) || Math.hypot(qx - START[0], qz - START[1]) < 16 || !frei(qx, qz, 2.5) || (qx < -95 && qx > -200 && qz < -70 && qz > -106)) continue;
      var nah = (baumRaster[Math.floor(qx / 8) + ',' + Math.floor(qz / 8)] || []).some(function (b) { return Math.hypot(b[0] - qx, b[1] - qz) < 2.2; });
      if (nah) continue;
      if (i % 5 === 0 && felsen.length < 26) { felsen.push([qx, qh - 0.25, qz, 0.7 + qg * 1.5, 0, qg * 6]); baum(qx, qz, 0.5 + qg * 0.9); }
      else if (buesche.length < 120) { buesche.push([qx, qh - 0.1, qz, 0.75 + qg * 0.7, 0, qg * 6]); baum(qx, qz, 0.55); }
    }
    MODELLE3D.streue('felsen', szene, felsen, 1.5); MODELLE3D.streue('busch', szene, buesche, 1.4);
    if (MODELLE3D.aus()) buesche.forEach(function (b) { BAU.netz(new THREE.IcosahedronGeometry(0.8 * b[3], 0), 0x3f8f3a, szene, b[0], b[1] + 0.5, b[2]); });

    // ----- Schilder und Sterne über den Orten -----
    ORTE.forEach(function (o) {
      var y = Math.max(WASSER, hoehe(o[2], o[3]));
      var s = BAU.schwebeText(o[1], 0.8, { schrift: 44 }); s.position.set(o[2], y + 7.4, o[3]); szene.add(s);
      var stern = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xffd23c }));
      stern.position.set(o[2], y + 4.6, o[3]); szene.add(stern);
      marken.push({ id: o[0], schild: s, stern: stern, y: y + 4.6 });
    });
    [[4.5, -96, '🌊 See · 🌳 Wald · 🌾 Felder'], [-44, -84, '🏇 Slalomwiese'], [6, 156, '🌲 Großer Wald'], [-10, 157, '🌾 Felder · 🏘️ Dorf'], [90, 8, '🌬️ Zur Windmühle'], [-76, -38, '🌉 Zum Bach'], [5, 108, '🚜 Achtung, Straße!'], [-4, 132, '🏡 Zum Pferdehof']].forEach(function (e, n) {
      var w = BAU.wegweiser(e[2], { hoehe: 0.55, fuss: 1.7 }); w.position.set(e[0], hoehe(e[0], e[1]), e[1]); w.rotation.y = n * 0.9; szene.add(w); sperre(e[0], e[1], 0.5);
    });

    // ----- Äpfel am Weg, Hufeisen und Pilze -----
    var ag = new THREE.SphereGeometry(0.22, 8, 6), am = new THREE.MeshStandardMaterial({ color: 0xd11f3a, roughness: 0.5 });
    ['runde', 'sued', 'wald', 'feld', 'bach', 'muehle'].forEach(function (name) {
      var p = linien[name].p;
      for (var j = 6; j < p.length - 4; j += 9 + Math.floor(zuf() * 6)) {
        var ax = p[j][0] + (zuf() - 0.5) * 4, az = p[j][1] + (zuf() - 0.5) * 4;
        if (boden(ax, az) < 0.2 || strasse.abstand(ax, az, 8) < 7) continue;
        var m = new THREE.Mesh(ag, am); m.castShadow = true; szene.add(m);
        aepfel.push({ netz: m, x: ax, z: az, y: hoehe(ax, az) + 1.0, da: true });
      }
    });
    var hg = new THREE.TorusGeometry(0.2, 0.055, 6, 14, Math.PI * 1.4), hm2 = new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0x8a6a10, roughness: 0.3, metalness: 0.6 });
    [[52, 96], [-190, -40], [262, 190], [-268, 152], [150, 440], [-20, 300]].forEach(function (e) {
      var m = new THREE.Mesh(hg, hm2); m.rotation.z = Math.PI * 0.8; szene.add(m);
      hufeisen.push({ netz: m, x: e[0], z: e[1], y: boden(e[0], e[1]) + 0.9, da: true });
    });
    for (i = 0; i < 300 && pilze.length < 12; i++) {
      var px = 20 + zuf() * 250, pz = -60 + zuf() * 500;
      if (!wald(px, pz) || wegAbstand(px, pz, 16) > 13 || wegAbstand(px, pz, 16) < 2.5 || boden(px, pz) < 0.5) continue;
      var pg = new THREE.Group(); pg.position.set(px, boden(px, pz), pz); szene.add(pg);
      BAU.walze(0.05, 0.06, 0.16, 0xf4efe2, pg, 0, 0.08, 0, 7);
      BAU.netz(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), pilze.length % 3 ? 0xa9432f : 0xb98a55, pg, 0, 0.14, 0);
      pilze.push({ g: pg, x: px, z: pz, da: true });
    }

    // ----- Pferde und Menschen -----
    meins = HERDE.bauePferd({ fell: 'brauner', saat: 4 }); szene.add(meins.wurzel);
    freund = HERDE.bauePferd({ fell: 'fuchs', saat: 31 }); szene.add(freund.wurzel);
    fohlenTier = HERDE.bauePferd({ fell: 'fuchs', saat: 23 }); fohlenTier.setzeSattel(false); fohlenTier.setzeZaum(false); szene.add(fohlenTier.wurzel);
    M = REITEN.neu(meins, { hoehe: hoehe, grenze: grenze, herde: true, drehung: 1.7, beschleunigung: 3.5 });
    F = REITEN.neu(freund, { hoehe: hoehe, grenze: grenze, herde: true, drehung: 2.2, laut: 0.4, beschleunigung: 4.5 });
    ich = baueFigur(KERN.spieler().outfit, { helm: true }); szene.add(ich.wurzel);
    freundin = baueFigur({ jacke: '#c0392b', hose: '#f4f1e8', stiefel: '#2a1c12', haare: '#5a3a1e', helm: '#1c1c1c', frisur: 'zoepfe', art: 'maedchen' }, { helm: true }); szene.add(freundin.wurzel);
    I = { x: 0, z: 0, kurs: 0, phase: 0, tempo: 0, sitzt: null, pose: null, poseZeit: 0 };
    B = { x: 0, z: 0, kurs: 0, phase: 0 };
    FO = { x: 0, z: 0, kurs: 0, tempo: 0, phase: 0, ziel: [0, 0], warte: 0, sprung: -1 };
    strick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x3a2a1c }));
    strick.frustumCulled = false; strick.visible = false; szene.add(strick);
    gebaut = true;
  }

  // ---------- Die Orte bauen ----------
  function baueOrte(zuf) {
    var i;
    // Blumenwiese
    var bl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), 460), bf = [0xff6fae, 0xffe36b, 0xffffff, 0xb07cff, 0xff8a3c];
    for (i = 0; i < 460; i++) {
      var w = zuf() * 6.283, e = Math.sqrt(zuf()) * 25, fx = -72 + Math.sin(w) * e, fz = -48 + Math.cos(w) * e;
      d3.position.set(fx, boden(fx, fz) + 0.18, fz); d3.rotation.set(0, 0, 0); d3.scale.setScalar(0.7 + zuf() * 0.8); d3.updateMatrix();
      bl.setMatrixAt(i, d3.matrix); bl.setColorAt(i, new THREE.Color(bf[i % 5]));
    }
    bl.frustumCulled = false; szene.add(bl);
    // Waldhütte
    var hu = new THREE.Group(); hu.position.set(88, boden(88, 12), 12); hu.rotation.y = -2.2; szene.add(hu);
    BAU.kasten(4.2, 2.4, 3.4, 0x8a5a33, hu, 0, 1.2, 0); BAU.kasten(0.9, 1.7, 0.1, 0x5a3a1e, hu, 0.6, 0.85, 1.72); BAU.kasten(0.9, 0.8, 0.1, 0xcfe6f5, hu, -1.0, 1.4, 1.72);
    var hd = BAU.netz(new THREE.ConeGeometry(3.6, 1.7, 4), 0x6b3a24, hu, 0, 3.25, 0); hd.rotation.y = Math.PI / 4; hd.scale.set(1.05, 1, 0.85);
    MODELLE3D.setze('huette', hu, { breite: 5.6, statt: hu.children.slice() }); sperre(88, 12, 3.1);
    // Picknickplatz: Decke, Korb
    var pk = new THREE.Group(); pk.position.set(-8, boden(-8, 52), 52); szene.add(pk);
    BAU.kasten(2.6, 0.04, 2.0, 0xe5412d, pk, 0, 0.06, 0).castShadow = false;
    for (i = 0; i < 4; i++) BAU.kasten(0.6, 0.045, 2.0, 0xffffff, pk, -0.98 + i * 0.66, 0.065, 0).castShadow = false;
    BAU.kasten(0.6, 0.4, 0.42, 0xb9843c, pk, 0.5, 0.26, 0.3); BAU.netz(new THREE.SphereGeometry(0.12, 8, 6), 0xd11f3a, pk, -0.4, 0.2, -0.2);
    BAU.netz(new THREE.SphereGeometry(0.12, 8, 6), 0x7cc35a, pk, -0.65, 0.2, 0.1);
    MODELLE3D.setze('picknickkorb', pk, { x: 0.45, y: 0.05, z: 0.3, dreh: 0.5, hoehe: 0.6, statt: pk.children.slice(-3) });
    // Aussichtshügel: Bank und Fahne. Gipfelkreuz auf dem höchsten Waldberg.
    var gp = new THREE.Group(); gp.position.set(58, boden(58, 80), 80); szene.add(gp);
    BAU.kasten(2.0, 0.1, 0.5, 0x9a6b3f, gp, 2.4, 0.5, 0); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, gp, 1.6, 0.25, 0); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, gp, 3.2, 0.25, 0);
    MODELLE3D.setze('bank', gp, { x: 2.4, z: -0.12, breite: 2.1, statt: gp.children.slice() });
    var fl = BAU.flagge(0xe84393, 4.5); fl.position.set(-2, 0, 0); gp.add(fl); sperre(60.4, 80, 0.9);
    var kz = new THREE.Group(); kz.position.set(219, boden(219, 334), 334); szene.add(kz);
    BAU.kasten(0.28, 5.2, 0.28, 0x6b4a2a, kz, 0, 2.6, 0); BAU.kasten(2.4, 0.28, 0.28, 0x6b4a2a, kz, 0, 4.0, 0);
    for (i = 0; i < 5; i++) BAU.netz(new THREE.DodecahedronGeometry(0.5 + (i % 3) * 0.2, 0), 0x8d9299, kz, Math.sin(i * 1.3) * 0.9, 0.2, Math.cos(i * 1.3) * 0.9);
    var bk = BAU.kasten(2.0, 0.1, 0.5, 0x9a6b3f, kz, -3.4, 0.5, 0.6); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, kz, -4.2, 0.25, 0.6); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, kz, -2.6, 0.25, 0.6);
    sperre(219, 334, 1.4);
    // Steg am See, Boot, Enten
    var ux = 0.8, uz = 0.6, kk = 31 / Math.hypot(ux, uz * 1.25);
    STEG = { x: SEE[0] + ux * kk, z: SEE[1] + uz * kk, w: Math.atan2(-ux, -uz) };
    var sg = new THREE.Group(); sg.position.set(STEG.x, 0, STEG.z); sg.rotation.y = STEG.w; szene.add(sg);
    BAU.kasten(1.6, 0.14, 9.6, 0x9a6b3f, sg, 0, 0.05, 4.3);
    for (i = 0; i < 4; i++) { BAU.walze(0.1, 0.1, 1.6, 0x7a4a2a, sg, -0.7, -0.5, 1 + i * 2.4, 6); BAU.walze(0.1, 0.1, 1.6, 0x7a4a2a, sg, 0.7, -0.5, 1 + i * 2.4, 6); }
    for (i = 0; i < 4; i++) {
      var en = new THREE.Group();
      BAU.netz(new THREE.SphereGeometry(0.28, 8, 6), i ? 0xffffff : 0x8a6a3c, en).scale.set(1, 0.7, 1.5);
      BAU.netz(new THREE.SphereGeometry(0.14, 8, 6), i ? 0xffffff : 0x2f7d3a, en, 0, 0.26, 0.3);
      BAU.netz(new THREE.ConeGeometry(0.05, 0.16, 5), 0xf08a24, en, 0, 0.24, 0.47).rotation.x = Math.PI / 2;
      MODELLE3D.setze('ente', en, { y: -0.1, hoehe: 0.52, statt: en.children.slice(), schatten: false });
      szene.add(en); enten.push({ g: en, w: i * 1.6, r: 5 + i * 2.2 });
    }
    var bp = stegPunkt(3.2, 5.5), boot = new THREE.Group(); boot.position.set(bp[0], WASSER + 0.12, bp[1]); boot.rotation.y = STEG.w + 0.4; szene.add(boot);
    BAU.kasten(1.2, 0.4, 3.2, 0x2d8fd0, boot, 0, 0, 0); BAU.kasten(1.0, 0.1, 2.9, 0xb9843c, boot, 0, 0.12, 0); BAU.kasten(1.1, 0.08, 0.3, 0x9a6b3f, boot, 0, 0.26, 0.2);
    MODELLE3D.setze('boot', boot, { y: -0.42, dreh: Math.PI / 2, breite: 3.6, statt: boot.children.slice() });
    SITZE = [{ x: -7.5, z: 52.4, pose: 'sitzen', kurs: 1.2, fx: 1.2, fz: -0.6, text: '🧺 Auf die Picknickdecke setzen', decke: true },
      { x: 60.4, z: 80.25, pose: 'bank', kurs: 0, fx: 0.75, fz: 0, text: '🪑 Auf die Bank setzen' }, { x: 215.6, z: 334.85, pose: 'bank', kurs: 0, fx: 0.75, fz: 0, text: '🪑 Auf die Gipfelbank setzen' }];
    // Steine, Wasserringe, Schwimmer und Fisch für die Spiele am See
    stein = BAU.netz(new THREE.SphereGeometry(0.09, 7, 5), 0x7d7f86, szene); stein.scale.y = 0.45; stein.visible = false;
    for (i = 0; i < 8; i++) {
      var rg = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      rg.rotation.x = -Math.PI / 2; rg.visible = false; szene.add(rg); wasserRinge.push({ g: rg, t: 9 });
    }
    schwimmer = new THREE.Group(); schwimmer.visible = false; szene.add(schwimmer);
    BAU.netz(new THREE.SphereGeometry(0.1, 8, 6), 0xe5412d, schwimmer, 0, 0.05, 0); BAU.netz(new THREE.SphereGeometry(0.085, 8, 6), 0xffffff, schwimmer, 0, -0.03, 0);
    fisch = BAU.netz(new THREE.SphereGeometry(0.2, 8, 6), 0xf39c12, szene); fisch.scale.set(0.45, 0.8, 1.6); fisch.visible = false;
    BAU.netz(new THREE.ConeGeometry(0.16, 0.22, 4), 0xf39c12, fisch, 0, 0, -0.26).rotation.x = -Math.PI / 2;
    // Schilf am See und am Bach
    var schilf = [];
    for (i = 0; i < 44; i++) {
      var sw = i / 44 * 6.283 + zuf() * 0.1, sr = SEE[2] + 12;
      while (sr > 6 && boden(SEE[0] + Math.sin(sw) * sr, SEE[1] + Math.cos(sw) * sr) > WASSER - 0.12) sr -= 0.4;
      var sx = SEE[0] + Math.sin(sw) * sr, sz = SEE[1] + Math.cos(sw) * sr;
      if (sr <= 6 || Math.hypot(sx - STEG.x, sz - STEG.z) < 11 || wegAbstand(sx, sz, 6) < 5 || i % 4 === 3) continue;
      schilf.push([sx, WASSER - 0.15, sz, 0.8 + zuf() * 0.6, 0, zuf() * 6]);
    }
    fluss.p.forEach(function (q, j) { if (j % 3 === 1 && wegAbstand(q[0], q[1], 14) > 12 && strasse.abstand(q[0], q[1], 14) > 12) schilf.push([q[0] + (j % 2 ? 4.4 : -4.4), WASSER - 0.15, q[1] + 1.5, 0.8 + zuf() * 0.6, 0, zuf() * 6]); });
    MODELLE3D.streue('schilf', szene, schilf, 1.9);
    // Windmühle
    var mu = new THREE.Group(); mu.position.set(238, boden(238, 15), 15); szene.add(mu);
    BAU.walze(3.2, 5, 16, 0xf3ead8, mu, 0, 8, 0, 10); BAU.netz(new THREE.ConeGeometry(4, 4, 10), 0x8a3324, mu, 0, 18, 0);
    muehlRad = new THREE.Group(); muehlRad.position.set(0, 15, 4.2); mu.add(muehlRad);
    for (i = 0; i < 4; i++) { var fg = new THREE.Group(); fg.rotation.z = i * Math.PI / 2; muehlRad.add(fg); BAU.kasten(0.4, 12, 0.2, 0x7a4a2a, fg, 0, 6.5, 0); BAU.kasten(2.6, 9, 0.1, 0xffffff, fg, 1.2, 7.6, 0); }
    mu.rotation.y = -1.9;
    MODELLE3D.setze('windmuehle', mu, { dreh: -Math.PI / 4, hoehe: 22, statt: mu.children.slice(), fertig: function () { muehlRad = null; } }); sperre(238, 15, 6.5);
    // Dorf mit Kirche und Eisdiele
    var hausFarben = [0xfff3d6, 0xf7d9c4, 0xe9e4da, 0xffe9a8, 0xdfeaf5], dachFarben = [0xa9432f, 0x8a3324, 0x5b6f8f, 0x6b4a2a];
    [[-228, 392, 0.3], [-232, 416, 1.4], [-208, 428, 2.9], [-182, 420, -1.5], [-176, 396, -0.4], [-196, 446, 3.1], [-222, 444, 2.2]].forEach(function (e, n) {
      var b = 9 + (n % 3) * 1.5, t = 7 + (n % 2) * 2, h = 5 + (n % 3), hg = new THREE.Group(); hg.position.set(e[0], boden(e[0], e[1]) - 0.1, e[1]); hg.rotation.y = e[2]; szene.add(hg);
      BAU.kasten(b, h, t, hausFarben[n % 5], hg, 0, h / 2, 0);
      var dc = BAU.netz(new THREE.ConeGeometry(0.72, 1, 4), dachFarben[n % 4], hg, 0, h + 1.9, 0); dc.rotation.y = Math.PI / 4; dc.scale.set(b * 1.08, 3.8, t * 1.08);
      BAU.kasten(1.2, 2.2, 0.1, 0x6b4a2a, hg, 0, 1.1, t / 2 + 0.03);
      MODELLE3D.setze('dorfhaus', hg, { dreh: (n % 3) * Math.PI / 2, hoehe: h + 4.5, statt: hg.children.slice() }); sperre(e[0], e[1], 6.2);
    });
    var ki = new THREE.Group(); ki.position.set(-204, boden(-204, 404), 404); szene.add(ki);
    BAU.kasten(8, 8, 14, 0xf3ead8, ki, 0, 4, 2); BAU.kasten(5, 18, 5, 0xf3ead8, ki, 0, 9, -6); BAU.netz(new THREE.ConeGeometry(3.8, 8, 4), 0x5b6f8f, ki, 0, 22, -6).rotation.y = Math.PI / 4;
    MODELLE3D.setze('kirche', ki, { dreh: Math.PI, hoehe: 24, statt: ki.children.slice() }); sperre(-204, 404, 7.5);
    var eis = new THREE.Group(); eis.position.set(-200, boden(-200, 384), 384); eis.rotation.y = 2.6; szene.add(eis);
    BAU.kasten(2.2, 1.0, 1.1, 0xfff3d6, eis, 0, 0.5, 0); BAU.kasten(2.4, 0.08, 1.3, 0xff8fc0, eis, 0, 1.04, 0);
    [-1, 1].forEach(function (s) { BAU.walze(0.04, 0.04, 2.3, 0xffffff, eis, s * 1.05, 1.15, -0.5, 6); });
    var schirm = BAU.netz(new THREE.ConeGeometry(1.9, 0.7, 8), 0xff6fae, eis, 0, 2.6, 0);
    [0xff8fc0, 0xfff3c4, 0x8a5a33].forEach(function (f, n) { BAU.netz(new THREE.SphereGeometry(0.14, 8, 6), f, eis, -0.5 + n * 0.5, 1.2, 0.1); });
    var et = BAU.tafel('🍦 Eis', 0.5, { farbe: '#c2185b' }); et.position.set(0, 3.3, 0); eis.add(et); var et2 = et.clone(); et2.rotation.y = Math.PI; eis.add(et2);
    var eisfrau = baueFigur({ jacke: '#ffffff', hose: '#ff8fc0', stiefel: '#2a1c12', haare: '#d9a55a', frisur: 'dutt', art: 'frau' }, { helm: false });
    eisfrau.wurzel.position.set(0, 0, -0.9); eis.add(eisfrau.wurzel); eisfrau.setzePose('winken', true);
    sperre(-200, 384, 1.6);
    // der Pferdehof im Norden: Tor, Zaun und dahinter Stall und Wohnhaus
    var st = new THREE.Group(); st.position.set(0, boden(0, -124), -124); szene.add(st);
    BAU.walze(0.18, 0.2, 4, 0x7a4a2a, st, -2.6, 2, 0); BAU.walze(0.18, 0.2, 4, 0x7a4a2a, st, 2.6, 2, 0); BAU.kasten(6.2, 1.0, 0.2, 0x2f7d3a, st, 0, 4, 0);
    var ts = BAU.tafel('🏡 Zum Pferdehof', 0.6, { grund: null, farbe: '#ffffff', schrift: 60 }); ts.position.set(0, 4, 0.12); st.add(ts);
    szene.add(BAU.zaun([[-120, -126], [-3, -126]], { farbe: 0x8a5a33, boden: boden })); szene.add(BAU.zaun([[3, -126], [120, -126]], { farbe: 0x8a5a33, boden: boden }));
    var stallAlt = [BAU.kasten(21, 3, 14, 0xe9dcc3, szene, -8, 2, -152), BAU.kasten(22, 2.4, 15, 0xa9432f, szene, -8, 4.6, -152)];
    MODELLE3D.setze('stall', szene, { x: -8, y: 0.4, z: -152, masse: [21.8, 6.8, 16.4], statt: stallAlt });
    MODELLE3D.setze('wohnhaus', szene, { x: 24, y: 0.4, z: -166, dreh: -Math.PI / 2, masse: [9.9, 6.6, 10.2] });
  }

  // ---------- Felder, Traktoren, Kühe, Schafe und die wilden Tiere ----------
  function herde(art, x, z, zahl, scheu, streu) {
    var H = { art: art, x: x, z: z, x0: x, z0: z, scheu: scheu, tiere: [], flucht: 0 };
    for (var i = 0; i < zahl; i++) {
      var T = NATUR.tier(art), w = i * 2.4, r = i ? (streu || 3) * (0.5 + (i % 3) * 0.3) : 0;
      T.dx = Math.sin(w) * r; T.dz = Math.cos(w) * r; T.x = x + T.dx; T.z = z + T.dz; T.kurs = i * 1.7; T.v = 0; T.pause = i * 2;
      if (i && (art === 'reh' || art === 'schaf')) T.g.scale.setScalar(0.8 + (i % 3) * 0.1);
      szene.add(T.g); H.tiere.push(T);
    }
    herden.push(H);
    return H;
  }
  function baueFelder(zuf) {
    var i;
    // Sonnenblumen
    var sf = FELDER[3], n = 520, stiel = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.04, 1.5, 5), BAU.mat(0x4f9a3e), n), kopf = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 9), BAU.mat(0xf6c915), n), kern = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 8), BAU.mat(0x5a3a1e), n);
    for (i = 0; i < n; i++) {
      var x = sf[0] + 2 + (i % 26) * (sf[2] - sf[0] - 4) / 25 + (zuf() - 0.5) * 0.8, z = sf[1] + 2 + Math.floor(i / 26) * (sf[3] - sf[1] - 4) / 19 + (zuf() - 0.5) * 0.8, y = boden(x, z), gr = 0.85 + zuf() * 0.4;
      d3.scale.setScalar(gr); d3.rotation.set(0, 0, 0); d3.position.set(x, y + 0.75 * gr, z); d3.updateMatrix(); stiel.setMatrixAt(i, d3.matrix);
      d3.rotation.set(Math.PI / 2 - 0.35, 0, 0); d3.position.set(x, y + 1.52 * gr, z + 0.05); d3.updateMatrix(); kopf.setMatrixAt(i, d3.matrix);
      d3.position.set(x, y + 1.53 * gr, z + 0.08); d3.updateMatrix(); kern.setMatrixAt(i, d3.matrix);
    }
    [stiel, kopf, kern].forEach(function (m) { m.frustumCulled = false; m.castShadow = false; szene.add(m); });
    // Raps: gelbe Tupfen
    var rf = FELDER[0], raps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 5, 3), new THREE.MeshBasicMaterial({ color: 0xffe94d }), 700);
    for (i = 0; i < 700; i++) { var rx = rf[0] + zuf() * (rf[2] - rf[0]), rz = rf[1] + zuf() * (rf[3] - rf[1]); d3.rotation.set(0, 0, 0); d3.scale.set(1, 0.6, 1); d3.position.set(rx, boden(rx, rz) + 0.35, rz); d3.updateMatrix(); raps.setMatrixAt(i, d3.matrix); }
    raps.frustumCulled = false; szene.add(raps);
    // Strohballen auf dem Weizenfeld und die Strohburg
    var wf = FELDER[1], ballen = [], eckig = [];
    for (i = 0; i < 9; i++) { var bx = wf[0] + 8 + zuf() * (wf[2] - wf[0] - 16), bz = wf[1] + 8 + zuf() * (wf[3] - wf[1] - 16); if (wegAbstand(bx, bz, 8) < 6) continue; ballen.push([bx, boden(bx, bz), bz, 1, 0, zuf() * 3]); sperre(bx, bz, 1.3); }
    MODELLE3D.streue('heurund', szene, ballen, 2.4);
    if (MODELLE3D.aus()) ballen.forEach(function (b) { var hb = BAU.walze(1.2, 1.2, 1.5, 0xd9c060, szene, b[0], b[1] + 1.2, b[2], 12); hb.rotation.z = Math.PI / 2; hb.rotation.y = b[5]; });
    var sbx = -246, sbz = 250, sby = boden(sbx, sbz);
    [[0, 0, 0], [1.5, 0, 0], [3, 0, 0], [0, 0, 1.1], [1.5, 0, 1.1], [3, 0, 1.1], [0.75, 0.95, 0.5], [2.25, 0.95, 0.5], [1.5, 1.9, 0.5]].forEach(function (e, n2) {
      var kl = BAU.kasten(1.45, 0.92, 1.05, n2 % 2 ? 0xd3bb55 : 0xc9b24e, szene, sbx + e[0], sby + 0.47 + e[1], sbz + e[2]);
      MODELLE3D.setze('heueckig', szene, { x: sbx + e[0], y: sby + e[1], z: sbz + e[2], masse: [1.45, 0.95, 1.05], statt: [kl] });
    });
    var sfl = BAU.flagge(0xe5412d, 2.2); sfl.position.set(sbx + 1.5, sby + 2.85, sbz + 0.5); szene.add(sfl); sperre(sbx + 1.5, sbz + 0.5, 2.4);
    // Kuhweide mit Zaun
    var kf = FELDER[4];
    szene.add(BAU.zaun([[kf[0], kf[1]], [kf[2], kf[1]], [kf[2], kf[3]], [kf[0], kf[3]], [kf[0], kf[1]]], { farbe: 0x8a5a33, boden: boden, schatten: false }));
    herde('kuh', (kf[0] + kf[2]) / 2, (kf[1] + kf[3]) / 2 - 12, 5, 0, 16);
    // wilde Tiere
    herde('reh', 20, -50, 3, 18, 4); herde('reh', 150, 290, 3, 18, 4); herde('hirsch', 112, 376, 1, 13, 0);
    herde('hase', -150, 222, 3, 11, 5); herde('hase', -30, -62, 2, 11, 4); herde('fuchs', 70, 262, 1, 14, 0);
    herde('storch', -160, 152, 2, 0, 5); herde('storch', -64, 62, 1, 0, 0);
    schafe = herde('schaf', -96, 176, 9, 0, 7); schafe.zustand = 'links';
    // Traktoren: einer pflügt den Acker, einer fährt auf der Landstraße
    [0, 1].forEach(function (nr) {
      var g = new THREE.Group(), rot = nr ? 0x2f7d3a : 0xd0352b; szene.add(g);
      BAU.kasten(1.5, 1.0, 3.0, rot, g, 0, 1.3, 0.3); BAU.kasten(1.4, 1.3, 1.5, rot, g, 0, 2.3, -0.6); BAU.kasten(1.3, 0.8, 1.3, 0xbfe3f7, g, 0, 2.4, -0.55);
      [[-0.95, -0.8, 0.95], [0.95, -0.8, 0.95], [-0.85, 1.4, 0.55], [0.85, 1.4, 0.55]].forEach(function (r) { var rad = BAU.walze(r[2], r[2], 0.45, 0x222222, g, r[0], r[2], r[1], 14); rad.rotation.z = Math.PI / 2; });
      BAU.walze(0.08, 0.08, 1.1, 0x3a3a3a, g, 0.5, 2.3, 1.1, 6);
      MODELLE3D.setze('traktor', g, { dreh: Math.PI / 2, laenge: 5.2, statt: g.children.slice() });
      var bauer = baueFigur({ jacke: nr ? '#d4a017' : '#2f6fb5', hose: '#3d4046', stiefel: '#2a1c12', haare: '#7a4a2a', frisur: 'kurz', helm: '#5a7a2a', art: 'mann' }, { helm: true });
      bauer.setzePose('bank', true); bauer.wurzel.position.set(0, 1.55, -0.55); bauer.wurzel.scale.setScalar(0.95); g.add(bauer.wurzel);
      if (!nr) { for (var j = 0; j < 5; j++) BAU.kasten(0.1, 0.7, 0.5, 0x6b6f76, g, -1.2 + j * 0.6, 0.3, -2.6); BAU.kasten(2.8, 0.12, 0.12, 0x6b6f76, g, 0, 0.75, -2.5); }
      traktoren.push({ g: g, bauer: bauer, nr: nr, s: nr ? 30 : 0, x: 0, z: 0, kurs: 0, hin: 1, spur: 0, gruss: 0 });
    });
  }

  // ---------- Geschicklichkeit: Baumstämme, Slalom, Ringstechen ----------
  function stammAuf(L, nr, lang) {
    var p = L.p, q = p[nr], a = p[nr - 1], b = p[nr + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    var g = new THREE.Group(); g.position.set(q[0], hoehe(q[0], q[1]), q[1]); g.rotation.y = Math.atan2(tx, tz) + Math.PI / 2; szene.add(g);
    var w = BAU.walze(0.38, 0.42, lang * 2, 0x6b4a2a, g, 0, 0.4, 0, 9); w.rotation.x = Math.PI / 2;
    MODELLE3D.setze('baumstamm', g, { y: -0.05, masse: [0.85, 0.8, lang * 2], statt: [w] });
    var S = { x: q[0], z: q[1], tx: tx, tz: tz, lang: lang, g: g, da: true, gesprungen: false };
    staemme.push(S);
    return S;
  }
  function baueSpiele(zuf) {
    var i, W = linien.wald.p;
    [0.3, 0.52, 0.8].forEach(function (t) { stammAuf(linien.wald, Math.round(W.length * t), 2.6); });
    stammAuf(linien.runde, 22, 2.6); stammAuf(linien.bach, 9, 2.6);
    // der Baum, der vor den Augen umfällt (wird erst dann zum Hindernis)
    var nr = Math.round(W.length * 0.115), S = stammAuf(linien.wald, nr, 2.8);
    S.da = false; S.g.visible = false;
    var fb = new THREE.Group(), fx = S.x + S.tz * 4.2, fz = S.z - S.tx * 4.2; fb.position.set(fx, hoehe(fx, fz), fz); szene.add(fb);
    BAU.walze(0.3, 0.42, 7, 0x6b4a2a, fb, 0, 3.5, 0, 8); BAU.netz(new THREE.IcosahedronGeometry(2.3, 1), new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 1, flatShading: true }), fb, 0, 7.6, 0);
    fb.rotation.y = Math.atan2(-S.tz, S.tx) + Math.PI / 2;
    fallBaum = { g: fb, stamm: S, t: -1, x: S.x, z: S.z }; baum(fx, fz, 0.5);
    // Slalom auf der Wiese westlich vom Start: acht Tore
    for (i = 0; i < 8; i++) {
      var tx = -114 - i * 10.5, tz = -88 + (i % 2 ? 5.5 : -5.5) * (i === 0 || i === 7 ? 0 : 1), g = new THREE.Group(); g.position.set(tx, boden(tx, tz), tz); szene.add(g);
      var f1 = BAU.flagge(i === 0 ? 0x27ae60 : i === 7 ? 0x1c1c1c : 0xe5412d, 2.5), f2 = BAU.flagge(i === 0 ? 0x27ae60 : i === 7 ? 0x1c1c1c : 0xffffff, 2.5);
      f1.position.set(0, 0, -2.3); f2.position.set(0, 0, 2.3); g.add(f1); g.add(f2);
      var pf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f })); pf.rotation.x = Math.PI; pf.position.y = 4.2; pf.visible = false; g.add(pf);
      tore.push({ x: tx, z: tz, g: g, pfeil: pf });
    }
    var sl = BAU.wegweiser('🏇 Slalom: Reite durch das grüne Tor!', { hoehe: 0.55, fuss: 1.7 }); sl.position.set(-106, boden(-106, -94), -94); sl.rotation.y = Math.PI / 2; szene.add(sl); sperre(-106, -94, 0.6);
    // Ringstechen am Weg zur Windmühle: sechs Ringe an Galgen
    var Mp = linien.muehle.p, rm = new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0x7a5a00, roughness: 0.3, metalness: 0.5 });
    for (i = 0; i < 6; i++) {
      var j = 9 + i * 2, q = Mp[j], a = Mp[j - 1], b = Mp[j + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, s = i % 2 ? 1 : -1;
      var px = q[0] + nx * s * 3.0, pz = q[1] + nz * s * 3.0, rx = q[0] + nx * s * 1.25, rz = q[1] + nz * s * 1.25, y = hoehe(q[0], q[1]);
      BAU.walze(0.08, 0.1, 3.6, 0x7a4a2a, szene, px, hoehe(px, pz) + 1.8, pz, 7);
      var arm = BAU.kasten(0.1, 0.1, 2.0, 0x7a4a2a, szene, (px + rx) / 2, y + 3.5, (pz + rz) / 2); arm.lookAt(rx, y + 3.5, rz);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 18), rm); ring.position.set(rx, y + 2.75, rz); ring.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2; szene.add(ring);
      ringe.push({ netz: ring, x: rx, z: rz, da: true }); baum(px, pz, 0.25);
    }
    var rs = BAU.wegweiser('💍 Ringstechen: im Trab oder Galopp!', { hoehe: 0.55, fuss: 1.7 }); rs.position.set(Mp[6][0] + 3, hoehe(Mp[6][0] + 3, Mp[6][1] + 3), Mp[6][1] + 3); rs.rotation.y = 0.4; szene.add(rs);
    // Zielfahne für das Wettreiten
    zielFahne = new THREE.Group(); szene.add(zielFahne); zielFahne.visible = false;
    var zf1 = BAU.flagge(0x1c1c1c, 4.4), zf2 = BAU.flagge(0xffffff, 4.4); zf1.position.x = -3; zf2.position.x = 3; zielFahne.add(zf1); zielFahne.add(zf2);
    var zt = BAU.schwebeText('🏁 Ziel', 0.9, { schrift: 50 }); zt.position.y = 5.4; zielFahne.add(zt);
  }

  // ---------- Grenzen: Rand, Bäume, Häuser, Baumstämme ----------
  function grenze(r) {
    r.x = Math.max(RAND.x0, Math.min(RAND.x1, r.x)); r.z = Math.max(RAND.z0 + (Math.abs(r.x) < 2.6 ? -3 : 0), Math.min(RAND.z1, r.z));
    var cx = Math.floor(r.x / 8), cz = Math.floor(r.z / 8), i, t, dx, dz, e, min, rad = r.radius || 0.55;
    for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
      var zelle = baumRaster[(cx + a) + ',' + (cz + b)];
      if (!zelle) continue;
      for (i = 0; i < zelle.length; i++) { t = zelle[i]; dx = r.x - t[0]; dz = r.z - t[1]; e = Math.hypot(dx, dz); min = t[2] + rad; if (e < min && e > 0.001) { r.x = t[0] + dx / e * min; r.z = t[1] + dz / e * min; } }
    }
    for (i = 0; i < kreise.length; i++) { t = kreise[i]; dx = r.x - t[0]; dz = r.z - t[1]; e = Math.hypot(dx, dz); min = t[2] + rad; if (e < min && e > 0.001) { r.x = t[0] + dx / e * min; r.z = t[1] + dz / e * min; } }
    var kf = FELDER[4];                                  // Zaun der Kuhweide
    if (r.x > kf[0] - rad && r.x < kf[2] + rad && r.z > kf[1] - rad && r.z < kf[3] + rad) {
      var li = r.x - kf[0] + rad, re = kf[2] + rad - r.x, ob = r.z - kf[1] + rad, un = kf[3] + rad - r.z, m = Math.min(li, re, ob, un);
      if (m === li) r.x = kf[0] - rad; else if (m === re) r.x = kf[2] + rad; else if (m === ob) r.z = kf[1] - rad; else r.z = kf[3] + rad;
    }
    // Traktoren und Schafe weichen nicht aus
    traktoren.forEach(function (T) { dx = r.x - T.x; dz = r.z - T.z; e = Math.hypot(dx, dz); if (e < 2.6 + rad && e > 0.01) { r.x = T.x + dx / e * (2.6 + rad); r.z = T.z + dz / e * (2.6 + rad); } });
    // Baumstämme: im Trab oder Galopp springt das Pferd, sonst ist hier Schluss
    if (r.schritt) for (i = 0; i < staemme.length; i++) {
      var S = staemme[i];
      if (!S.da) continue;
      dx = r.x - S.x; dz = r.z - S.z;
      var laengs = dx * S.tx + dz * S.tz, quer = -dx * S.tz + dz * S.tx;
      if (Math.abs(quer) > S.lang + 0.4 || Math.abs(laengs) > 4.4) continue;
      var vor = Math.sin(r.kurs) * S.tx + Math.cos(r.kurs) * S.tz, hin = vor * laengs < 0;
      var weit = 4.4 + r.tempo * 0.32;
      if (!r.sprung && hin && Math.abs(vor) > 0.45 && r.tempo >= 1.6 && Math.abs(laengs) < weit / 2 + 0.15) {
        r.springe(weit, 1.2);
        if (r === M && modus === 'ritt') { KERN.ton(300, 0.1, 'triangle', 0.12); if (!S.gesprungen) { S.gesprungen = true; lohn(2, '🪵 Hopp! Über den Baumstamm'); } }
      } else if (!r.sprung && Math.abs(laengs) < 0.95) {
        var seite = laengs >= 0 ? 1 : -1; r.x = S.x + S.tx * 0.95 * seite - S.tz * quer; r.z = S.z + S.tz * 0.95 * seite + S.tx * quer;
        if (r === M && modus === 'ritt') { r.tempo = Math.min(r.tempo, 0.6); M.eigen = Math.min(M.eigen, 1.2); tipp('🪵 Ein Baumstamm! Mit etwas Schwung springt dein Pferd von allein drüber. Oder reite außen herum.'); }
      }
    }
  }
  function fussGrenze(o) {
    grenze(o);
    for (var i = 0; i < staemme.length; i++) {          // zu Fuß steigt man einfach außen herum
      var S = staemme[i]; if (!S.da) continue;
      var dx = o.x - S.x, dz = o.z - S.z, laengs = dx * S.tx + dz * S.tz, quer = -dx * S.tz + dz * S.tx;
      if (Math.abs(quer) < S.lang && Math.abs(laengs) < 0.6) { var s = laengs >= 0 ? 1 : -1; o.x = S.x + S.tx * 0.6 * s - S.tz * quer; o.z = S.z + S.tz * 0.6 * s + S.tx * quer; }
    }
  }

  // ---------- Reden, Hinweise, Lohn ----------
  function sage(text, sek) { if (!mitFreundin) return; redeZeit = sek || 5; setzeHinweis('Lotte: „' + text + '“'); }
  function tipp(text, sek) { if (redeZeit > 0 && tippZeit <= 0) return; tippZeit = sek || 3.5; redeZeit = Math.max(redeZeit, 0.01); setzeHinweis(text); }
  function setzeHinweis(text) {
    if (text === hinweisAlt) return;
    hinweisAlt = text;
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }
  function lohn(n, text) { muenzen += n; STAND.daten.muenzen += n; STAND.speichere(); KERN.meldung(text + '  +' + n + ' 🪙', 'perfekt'); KERN.klang('gut'); }
  function stegPunkt(lx, lz) { var c = Math.cos(STEG.w), s2 = Math.sin(STEG.w); return [STEG.x + lx * c + lz * s2, STEG.z - lx * s2 + lz * c]; }
  function aufSteg(x, z) {
    var dx = x - STEG.x, dz = z - STEG.z, c = Math.cos(STEG.w), s2 = Math.sin(STEG.w), lx = dx * c - dz * s2, lz = dx * s2 + dz * c;
    return Math.abs(lx) < 0.85 && lz > -0.8 && lz < 9.2 ? lz : null;
  }
  function fussHoehe(x, z) { return aufSteg(x, z) !== null ? Math.max(0.12, boden(x, z)) : hoehe(x, z); }

  // ---------- Aufsteigen, Absteigen, Führen, Pferd wechseln ----------
  function setzAuf(fig, tier) {
    if (fig.wurzel.parent) fig.wurzel.parent.remove(fig.wurzel);
    fig.gehe(0, 0); fig.setzeHoehe(0, true); fig.setzePose('reiten', true);
    fig.wurzel.position.set(0, 1.66, 0.02); fig.wurzel.rotation.set(0, 0, 0); fig.wurzel.visible = true;
    tier.koerper.add(fig.wurzel);
  }
  function setzAb(fig, P, R) {
    if (fig.wurzel.parent) fig.wurzel.parent.remove(fig.wurzel);
    szene.add(fig.wurzel);
    fig.setzeHoehe(0.8, true); fig.setzePose('steh', true);
    P.x = R.x + Math.cos(R.kurs) * 1.3; P.z = R.z - Math.sin(R.kurs) * 1.3; P.kurs = R.kurs;
  }
  function steigeAb(still) {
    if (modus !== 'ritt') return;
    if (rennen) beendeRennen(null);
    modus = 'fuss'; fuehrt = false;
    M.eigen = 0; M.wunsch = 0;
    setzAb(ich, I, M); I.sitzt = null; I.pose = null; I.tempo = 0; I.poseZeit = 0;
    kamW = M.kurs + Math.PI;
    if (mitFreundin) { setzAb(freundin, B, F); freund.setzeKopfTief(1); }
    meins.setzeKopfTief(1);
    if (!still) { KERN.ton(520, 0.1, 'triangle', 0.14); sage('Gute Idee, ich steige auch ab. Die Pferde dürfen grasen.', 5); }
  }
  function steigeAuf() {
    if (!mitPferd) return;
    modus = 'ritt'; fuehrt = false; I.sitzt = null; strick.visible = false;
    setzAuf(ich, meins); meins.setzeKopfTief(0);
    if (mitFreundin) { setzAuf(freundin, freund); freund.setzeKopfTief(0); }
    if (schwimmer) schwimmer.visible = false; angel = null;
    kamera.userData.sprung = false;
    KERN.ton(660, 0.1, 'triangle', 0.14);
    sage('Weiter geht’s!', 3);
  }
  function fuehre(an) {
    fuehrt = an; meins.setzeKopfTief(an ? 0 : 1); if (mitFreundin) freund.setzeKopfTief(an ? 0 : 1);
    KERN.ton(an ? 600 : 440, 0.08, 'triangle', 0.12);
    KERN.meldung(an ? '🐴 ' + mein.name + ' kommt am Strick mit' : '🌿 ' + mein.name + ' darf grasen', 'gut');
  }
  function zeigePferde() {
    meins.setzeFell(mein.fell); meins.setzeAusruestung(mein.ausruestung || {}); meins.setzeSchmutz(mein.schmutz || 0);
    meins.setzeSattel(true, (mein.ausruestung || {}).decke); meins.setzeZaum(true, true);
    freund.setzeFell(ihr.fell); freund.setzeAusruestung(ihr.ausruestung || {}); freund.setzeSchmutz(0); freund.setzeSattel(true, (ihr.ausruestung || {}).decke);
  }
  // mit Lotte die Pferde tauschen: Die beiden Pferde tauschen den Platz, jede reitet das andere weiter
  function tausche() {
    var t = mein; mein = ihr; ihr = t;
    var x = M.x, z = M.z, k = M.kurs; M.setze(F.x, F.z, F.kurs); F.setze(x, z, k);
    zeigePferde();
    KERN.klang('gut'); KERN.meldung('🔄 Du reitest jetzt ' + mein.name + ', Lotte nimmt ' + ihr.name + '.', 'perfekt');
    sage('Na klar, tauschen wir! Pass gut auf ' + mein.name + ' auf.', 5);
  }
  function waehlePferd() {
    var alt = modus; modus = 'karte';
    function zu() { KERN.schliesseKarte(); modus = alt; }
    var html = '<h2>🐴 Pferd wechseln</h2><div class="details">Welches Pferd möchtest du jetzt reiten? ' + (opt.hof ? 'Mia bringt es dir vom Hof und nimmt ' + KERN.esc(mein.name) + ' mit nach Hause.' : '') + '</div><div class="liste" id="pferdListe"></div>';
    KERN.zeigeKarte('mitte', html, [{ text: 'Doch nicht', klasse: 'zweit', aktion: zu }]);
    var liste = document.getElementById('pferdListe');
    function zeile(bild, text, knopf, tun, aktiv) {
      var z = document.createElement('div'); z.className = 'eintrag';
      z.innerHTML = '<div class="bild">' + bild + '</div><div class="text">' + text + '</div>';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = aktiv ? '✔ reitest du' : knopf; b.disabled = !!aktiv; if (aktiv) b.className = 'an';
      b.addEventListener('click', tun); z.appendChild(b); liste.appendChild(z);
    }
    if (mitFreundin) zeile('🔄', 'Mit Lotte tauschen: <b>' + KERN.esc(ihr.name) + '</b>', 'Tauschen', function () { zu(); tausche(); });
    alle.forEach(function (p) {
      if (p.id === ihr.id) return;
      zeile('🐴', '<b>' + KERN.esc(p.name) + '</b><br><small>' + KERN.esc(p.def.art) + '</small>', 'Nehmen', function () {
        zu(); mein = p; zeigePferde();
        KERN.klang('perfekt'); KERN.meldung('🐴 ' + p.name + ' ist da!', 'perfekt');
      }, p.id === mein.id);
    });
  }

  // ---------- der Ablauf ----------
  function beginne() {
    KERN.schliesseKarte();
    modus = 'ritt';
    document.body.className = 'im-welt welt-ausritt mit-lenken mit-tempo';
    sage('Los geht’s! Folge einfach dem Weg, ich bleibe bei dir.', 6);
    if (opt.zuFuss || !mitPferd) { steigeAb(true); if (mitPferd) { fuehrt = true; meins.setzeKopfTief(0); if (mitFreundin) freund.setzeKopfTief(0); } }
    if (!mitPferd) tipp('🥾 Du bist zu Fuß unterwegs. Mit einem Pferd vom Hof kommst du viel weiter!', 6);
    else if (opt.vomHof) sage(opt.reitet ? 'Warte, ich komme mit! Hier draußen dürfen wir traben und galoppieren.' : 'Warte, ich komme mit! Steig auf, wann du willst.', 6);
  }

  function entdecke(x, z) {
    ORTE.forEach(function (o) {
      if (gefunden[o[0]] || Math.hypot(x - o[2], z - o[3]) > 10) return;
      gefunden[o[0]] = true;
      var n = Object.keys(gefunden).length;
      muenzen += 3; STAND.daten.muenzen += 3;
      STAND.merke('ausritt', n);
      KERN.meldung('Entdeckt: ' + o[1] + '  +3 🪙', 'perfekt'); KERN.klang('perfekt');
      if (o[0] === 'dorf') SOUND.spiel('glocke', 0.6, 1, 0.8);
      sage(o[4], 6);
      if (n === ORTE.length) { muenzen += 20; STAND.daten.muenzen += 20; setTimeout(function () { KERN.meldung('Alle Orte entdeckt!  +20 🪙', 'perfekt'); KERN.klang('fanfare'); }, 1600); }
      STAND.speichere();
    });
    aepfel.forEach(function (a) {
      if (!a.da || Math.hypot(x - a.x, z - a.z) > 1.8) return;
      a.da = false; a.netz.visible = false; apfelZahl++; muenzen++; STAND.daten.muenzen++;
      KERN.meldung('🍎 Mmmh!  +1 🪙', 'gut'); SOUND.spiel('apfel', 0.7); KERN.ton(880, 0.1, 'triangle', 0.16); KERN.ton(1320, 0.14, 'triangle', 0.14, 0.08);
    });
    hufeisen.forEach(function (a) {
      if (!a.da || Math.hypot(x - a.x, z - a.z) > 2) return;
      a.da = false; a.netz.visible = false; hufeisenZahl++;
      lohn(4, '🍀 Ein Glückshufeisen! (' + hufeisenZahl + ' von ' + hufeisen.length + ')');
    });
  }

  function reite(dt) {
    dauer += dt;
    var lenk = REITEN.lenkung();
    M.eigen = Math.max(0, Math.min(9.6, (M.eigen || 0) + REITEN.gas() * 4.5 * dt));
    var tief = aufBruecke(M.x, M.z) ? 0 : Math.max(0, WASSER - boden(M.x, M.z));
    M.wunsch = M.eigen * (tief > 0.5 ? 0.4 : tief > 0.08 ? 0.7 : 1);
    if (rennen && rennen.phase === 'start') M.wunsch = 0;
    if (tief > 0.08 && M.tempo > 0.5) { nass += dt; if (nass > 0.28) { nass = 0; KERN.huf(0.1, 2600 + Math.random() * 900); } }
    if (schreck > 0) { schreck -= dt; lenk += Math.sin(zeit * 17) * 0.9; }
    entdecke(M.x, M.z);
    // ab und zu sagt die Freundin etwas
    naechsteRede -= dt;
    if (naechsteRede <= 0 && redeZeit <= 0 && !rennen) { naechsteRede = 30 + Math.random() * 25; sage(WETTER.regnet() ? 'Brr, es regnet. Macht nichts, wir sind nicht aus Zucker!' : SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)], 5); }
    spieleZuPferd(dt);
    var amTor = M.z < -116 && Math.abs(M.x) < 9 && dauer > 8;
    aktuell = rennen && rennen.phase === 'frage' ? { text: '🏁 Wettreiten!', tun: starteRennen } : amTor ? { text: '🏡 Nach Hause reiten', tun: nachHause } : null;
    zweitListe = M.tempo < 0.7 && tief < 0.3 && !rennen ? [{ text: '🥾 Absteigen', tun: function () { steigeAb(); } }] : [];
    return lenk;
  }

  // ---------- Wettreiten, Slalom, Ringstechen ----------
  function spieleZuPferd(dt) {
    var i;
    // Lotte fordert spontan zum Wettreiten heraus, wenn man auf einem Weg unterwegs ist
    if (mitFreundin && !rennen && !slalom) {
      rennPause -= dt * (M.tempo > 2 ? 1 : 0.2);
      if (rennPause <= 0) {
        rennPause = 20;
        var ab = wegAbstand(M.x, M.z, 5), L = wegAbstand.linie, nr = wegAbstand.nr;
        if (ab < 4 && L && L !== linien.tor && L !== linien.spur) {
          var p = L.p, vor = (p[Math.min(p.length - 1, nr + 1)][0] - p[nr][0]) * Math.sin(M.kurs) + (p[Math.min(p.length - 1, nr + 1)][1] - p[nr][1]) * Math.cos(M.kurs) > 0 ? 1 : -1, zi = nr + vor * 26;
          if (L.zu) zi = (zi + p.length - 1) % (p.length - 1);
          if (zi > 1 && zi < p.length - 1) {
            var gut = true;
            for (i = 1; i <= 26; i++) { var q = p[L.zu ? (nr + vor * i + (p.length - 1) * 4) % (p.length - 1) : nr + vor * i]; if (boden(q[0], q[1]) < WASSER + 0.1 || strasse.abstand(q[0], q[1], 12) < 10 || aufBruecke(q[0], q[1])) gut = false; }
            if (gut) {
              rennen = { phase: 'frage', t: 10, L: L, nr: nr, vor: vor, ziel: zi, i: nr };
              var zp = p[zi], za = p[zi - vor] || zp;
              zielFahne.position.set(zp[0], hoehe(zp[0], zp[1]), zp[1]); zielFahne.rotation.y = Math.atan2(zp[0] - za[0], zp[1] - za[1]); zielFahne.visible = true;
              sage('Wettreiten? Wer zuerst an der Zielfahne ist! Drück auf den Knopf, wenn du dich traust.', 9);
              KERN.ton(660, 0.1, 'triangle', 0.14); KERN.ton(880, 0.14, 'triangle', 0.14, 0.12);
            }
          }
        }
      }
    }
    if (rennen) {
      rennen.t -= dt;
      var zp2 = rennen.L.p[rennen.ziel];
      if (rennen.phase === 'frage' && rennen.t <= 0) { sage('Na gut, dann eben nächstes Mal.', 3); beendeRennen(null); }
      else if (rennen.phase === 'start' && rennen.t <= 0) { rennen.phase = 'lauf'; rennen.t = 90; KERN.klang('los'); KERN.meldung('Los!', 'perfekt'); M.eigen = Math.max(M.eigen, 4); }
      else if (rennen.phase === 'lauf') {
        if (Math.hypot(M.x - zp2[0], M.z - zp2[1]) < 7) beendeRennen(true);
        else if (Math.hypot(F.x - zp2[0], F.z - zp2[1]) < 5 || rennen.t <= 0) beendeRennen(false);
      }
    }
    // Slalom: durch das grüne Tor reiten startet die Zeit
    if (!slalom && !rennen && Math.hypot(M.x - tore[0].x, M.z - tore[0].z) < 2.4 && M.tempo > 1) {
      slalom = { nr: 1, t: 0 }; KERN.klang('los'); KERN.meldung('🏇 Slalom! Immer zum rosa Pfeil', 'perfekt');
    }
    if (slalom) {
      slalom.t += dt;
      var T = tore[slalom.nr];
      if (Math.hypot(M.x - T.x, M.z - T.z) < 2.6) {
        slalom.nr++; KERN.ton(700 + slalom.nr * 70, 0.1, 'triangle', 0.15);
        if (slalom.nr >= tore.length) {
          var zeitS = slalom.t, best = STAND.daten.leistung.slalom; slalom = null;
          STAND.merke('slalom', Math.round(zeitS * 10) / 10, true);
          lohn(zeitS < 24 ? 10 : zeitS < 32 ? 6 : 3, '🏁 Slalom in ' + zeitS.toFixed(1) + ' s' + (best === undefined || zeitS < best ? ' · neue Bestzeit!' : ''));
          sage(zeitS < 24 ? 'Wow, wie der Blitz!' : 'Toll gemacht! Schaffst du es noch schneller?', 5);
        }
      } else if (slalom.t > 80 || Math.hypot(M.x - T.x, M.z - T.z) > 70) { slalom = null; KERN.meldung('Slalom abgebrochen', 'knapp'); }
    }
    tore.forEach(function (t, n) { t.pfeil.visible = !!slalom && slalom.nr === n; t.pfeil.position.y = 4.2 + Math.sin(zeit * 6) * 0.3; t.pfeil.rotation.y = zeit * 3; });
    // Ringstechen
    for (i = 0; i < ringe.length; i++) {
      var R = ringe[i];
      if (!R.da || Math.hypot(M.x - R.x, M.z - R.z) > 1.15) continue;
      if (M.tempo < 2.6) { tipp('💍 Zu langsam! Die Ringe schnappst du nur im Trab oder Galopp.'); continue; }
      R.da = false; R.netz.visible = false;
      if (!ringSerie) ringSerie = { n: 0, t: 30 };
      ringSerie.n++; muenzen++; STAND.daten.muenzen++;
      KERN.ton(1200 + ringSerie.n * 120, 0.12, 'triangle', 0.16); KERN.meldung('💍 Ring ' + ringSerie.n + ' von 6!  +1 🪙', 'gut');
      if (ringSerie.n === 6) { lohn(6, '💍 Alle sechs Ringe! Meisterlich'); sage('Alle Ringe! Du könntest beim Ritterturnier mitmachen.', 5); ringSerie.t = 0.01; }
    }
    if (ringSerie) { ringSerie.t -= dt; if (ringSerie.t <= 0 && Math.hypot(M.x - ringe[0].x, M.z - ringe[0].z) > 45 && Math.hypot(M.x - ringe[5].x, M.z - ringe[5].z) > 45) { ringSerie = null; ringe.forEach(function (r) { r.da = true; r.netz.visible = true; }); } }
  }
  function starteRennen() {
    if (!rennen || rennen.phase !== 'frage') return;
    rennen.phase = 'start'; rennen.t = 2.4; M.eigen = 0;
    sage('Auf die Plätze … fertig …', 2.4);
    KERN.klang('zaehler'); setTimeout(function () { if (rennen) KERN.klang('zaehler'); }, 1100);
  }
  function beendeRennen(sieg) {
    zielFahne.visible = false;
    if (sieg === true) { lohn(8, '🏁 Gewonnen!'); sage('Du warst schneller! ' + mein.name + ' ist ja ein Rennpferd!', 6); getan.rennen = (getan.rennen || 0) + 1; }
    else if (sieg === false) { lohn(2, '🏁 Knapp verloren. Eine Trostmöhre'); sage('Erste! Aber du warst dicht hinter mir.', 6); }
    rennen = null; rennPause = 75 + Math.random() * 50;
  }

  // ---------- die Freundin: reitet nebenher, läuft mit, reitet um die Wette ----------
  function bewegeFreundin(dt) {
    if (!mitFreundin) return;
    var vx = Math.sin(M.kurs), vz = Math.cos(M.kurs), zx, zz, dx, dz, dist, df;
    if (modus === 'fuss') {
      if (fuehrt) {              // Lotte führt ihr Pferd auch
        zx = B.x - Math.sin(B.kurs) * 2.0 - Math.cos(B.kurs) * 0.9; zz = B.z - Math.cos(B.kurs) * 2.0 + Math.sin(B.kurs) * 0.9;
        dx = zx - F.x; dz = zz - F.z; dist = Math.hypot(dx, dz);
        df = winkel(Math.atan2(dx, dz) - F.kurs);
        F.wunsch = dist > 1.2 ? Math.min(5.5, dist * 1.6) : 0;
        F.schritt(dt, dist > 1.2 ? Math.max(-1, Math.min(1, df * 2.2)) : 0, zeit);
      } else { F.wunsch = 0; F.schritt(dt, 0, zeit); }
      return;
    }
    if (rennen && rennen.phase === 'lauf') {       // sie folgt dem Weg bis zur Zielfahne
      var p = rennen.L.p, n = p.length - 1, ziel = p[rennen.i];
      while (rennen.i !== rennen.ziel && Math.hypot(ziel[0] - F.x, ziel[1] - F.z) < 9) { rennen.i += rennen.vor; if (rennen.L.zu) rennen.i = (rennen.i + n) % n; ziel = p[rennen.i]; }
      df = winkel(Math.atan2(ziel[0] - F.x, ziel[1] - F.z) - F.kurs);
      var vorn = (F.x - M.x) * vx + (F.z - M.z) * vz;
      F.wunsch = 8.7 + (vorn > 14 ? -1.3 : vorn < -8 ? 0.7 : 0) + Math.sin(zeit * 0.7) * 0.3;
      F.schritt(dt, Math.max(-1, Math.min(1, df * 2.4)), zeit);
    } else if (rennen && rennen.phase === 'start') { F.wunsch = 0; F.schritt(dt, 0, zeit); }
    else {
      zx = M.x - vx * 1.2 + vz * 2.6; zz = M.z - vz * 1.2 - vx * 2.6;
      dx = zx - F.x; dz = zz - F.z; dist = Math.hypot(dx, dz);
      var zielKurs = dist > 1.2 ? Math.atan2(dx, dz) : M.kurs;
      df = winkel(zielKurs - F.kurs);
      var v2 = dx * Math.sin(F.kurs) + dz * Math.cos(F.kurs);
      F.wunsch = Math.max(0, Math.min(11, M.tempo + v2 * 0.9));
      if (dist < 0.8 && M.tempo < 0.3) F.wunsch = 0;
      if (dist > 70) F.setze(zx, zz, M.kurs);
      F.schritt(dt, Math.max(-1, Math.min(1, df * 2.2)), zeit);
    }
    freundin.huefte.position.y = F.gang === 'trab' ? Math.abs(Math.sin(F.phase)) * 0.06 : 0;
  }

  // ---------- das Fohlen tobt frei nebenher ----------
  function bewegeFohlen(dt) {
    if (!fohlenTier.wurzel.visible) return;
    var mx = modus === 'fuss' ? I.x : M.x, mz = modus === 'fuss' ? I.z : M.z, tm = modus === 'fuss' ? I.tempo : M.tempo;
    FO.warte -= dt;
    if (FO.warte <= 0) { FO.warte = 2 + Math.random() * 4; var w = Math.random() * 6.283, r = 5 + Math.random() * 12; FO.ziel = [Math.sin(w) * r, Math.cos(w) * r]; if (Math.random() < 0.5 && FO.sprung < 0) FO.sprung = 0; }
    var zx = mx + FO.ziel[0], zz = mz + FO.ziel[1], dx = zx - FO.x, dz = zz - FO.z, dist = Math.hypot(dx, dz);
    if (dist > 90) { FO.x = mx + 4; FO.z = mz + 4; }
    var soll = dist < 1.2 ? 0 : Math.min(10.5, 1.5 + dist * 0.7 + tm * 0.6);
    FO.tempo += (soll - FO.tempo) * Math.min(1, dt * 3);
    if (dist > 0.6) FO.kurs += winkel(Math.atan2(dx, dz) - FO.kurs) * Math.min(1, dt * 3.5);
    var alt = { x: FO.x, z: FO.z };
    FO.x += Math.sin(FO.kurs) * FO.tempo * dt; FO.z += Math.cos(FO.kurs) * FO.tempo * dt;
    FO.radius = 0.4; grenze(FO);
    if (boden(FO.x, FO.z) < WASSER - 0.3) { FO.x = alt.x; FO.z = alt.z; FO.warte = 0; }
    var gang = FO.tempo < 0.15 ? 'steh' : FO.tempo < 2.2 ? 'schritt' : FO.tempo < 4.6 ? 'trab' : 'galopp', gr = fohlenTier.wurzel.scale.x;
    FO.phase += FO.tempo * dt * Math.PI * 2 / ((gang === 'galopp' ? 4.19 : gang === 'trab' ? 2.9 : 1.9) * gr);
    if (FO.sprung >= 0) { FO.sprung += dt * 1.5; if (FO.sprung >= 1) FO.sprung = -1; }      // übermütige Bocksprünge
    var luft = FO.sprung >= 0 ? Math.sin(FO.sprung * Math.PI) * 0.75 * gr : 0;
    fohlenTier.wurzel.position.set(FO.x, hoehe(FO.x, FO.z) + luft, FO.z); fohlenTier.wurzel.rotation.y = FO.kurs;
    fohlenTier.koerper.rotation.x = FO.sprung >= 0 ? Math.sin(FO.sprung * Math.PI * 2) * -0.3 : 0;
    fohlenTier.setzeKopfTief(gang === 'steh' ? 0.9 : 0);
    fohlenTier.bewege(gang, FO.phase, 1, FO.sprung, dt);
  }

  // ---------- Tiere, Traktoren, Schafe, der fallende Baum ----------
  function sieh(art) {
    if (gesehen[art]) return;
    gesehen[art] = true;
    var n = Object.keys(gesehen).length, alleT = Object.keys(TIERNAMEN).length;
    lohn(2, TIERNAMEN[art] + ' entdeckt! (' + n + ' von ' + alleT + ' Tieren)');
    if (n === alleT) setTimeout(function () { lohn(12, '🔭 Alle Tiere beobachtet!'); KERN.klang('fanfare'); }, 1800);
    var spruch = { reh: 'Rehe! Ganz leise, im Schritt kommen wir näher ran.', hirsch: 'Der Hirsch! Schau dir das Geweih an!', hase: 'Schau, wie die Hasen Haken schlagen!', fuchs: 'Ein Fuchs! Der hat es aber eilig.', schaf: 'Schafe auf dem Weg! Warten wir kurz, bis sie drüben sind.', kuh: 'Muuuh! Die Kühe schauen uns nach.', storch: 'Störche! Die suchen Frösche am Bach.', ente: 'Die Enten kannst du vom Steg aus füttern.' }[art];
    if (spruch) sage(spruch, 6);
  }
  function bewegeWelt(dt) {
    var px = modus === 'fuss' ? I.x : M.x, pz = modus === 'fuss' ? I.z : M.z, pt = modus === 'fuss' ? I.tempo : M.tempo, i;
    var bachWeit = fluss.abstand(px, pz, 34);
    if (bachWeit < 34) SOUND.schleife('bach', Math.pow(1 - bachWeit / 34, 1.5) * 0.6);
    herden.forEach(function (H) {
      var e = Math.hypot(px - H.x, pz - H.z);
      if (e > 260) { H.tiere.forEach(function (T) { T.g.visible = false; }); return; }
      if (e < 30 && H.art !== 'schaf') sieh(H.art);
      if (e < 26 && (H.art === 'kuh' || H.art === 'schaf')) SOUND.spiel(H.art, 0.45, 0.92 + Math.random() * 0.16, 0, { pause: 9 + Math.random() * 6 });
      if (H.scheu && H.flucht <= 0 && e < (pt > 3 ? H.scheu * 1.5 : pt > 0.4 ? H.scheu * 0.55 : 3)) {      // weglaufen: im Schritt kommt man näher heran
        H.flucht = 5; var w = Math.atan2(H.x - px, H.z - pz) + (Math.random() - 0.5), nx = H.x + Math.sin(w) * 46, nz = H.z + Math.cos(w) * 46;
        if (boden(nx, nz) > 0.4 && nx > RAND.x0 && nx < RAND.x1 && nz > RAND.z0 && nz < RAND.z1) { H.x = nx; H.z = nz; }
        if (H.art === 'reh' || H.art === 'hirsch') KERN.ton(160, 0.05, 'square', 0.05);
      } else if (H.scheu && e > 150 && (H.x !== H.x0 || H.z !== H.z0)) { H.x = H.x0; H.z = H.z0; H.tiere.forEach(function (T) { T.x = H.x + T.dx; T.z = H.z + T.dz; }); }
      H.flucht -= dt;
      H.tiere.forEach(function (T, n) {
        T.g.visible = true;
        var zx = H.x + T.dx, zz = H.z + T.dz, dx = zx - T.x, dz = zz - T.z, a = Math.hypot(dx, dz);
        T.pause -= dt;
        if (a < 0.5 && H.flucht <= 0 && T.pause <= 0 && !H.fest) { T.pause = 4 + Math.random() * 9; var w2 = Math.random() * 6.283, r2 = Math.random() * (H.art === 'kuh' ? 16 : 5); T.dx = Math.sin(w2) * r2; T.dz = Math.cos(w2) * r2; }
        var schnell = H.flucht > 0 || a > 9, soll = a < 0.4 ? 0 : schnell ? (H.art === 'schaf' || H.art === 'kuh' ? 2.2 : 8.5) : H.art === 'storch' ? 0.5 : 1.1;
        T.v += (soll - T.v) * Math.min(1, dt * 4);
        if (a > 0.3) { T.kurs += winkel(Math.atan2(dx, dz) - T.kurs) * Math.min(1, dt * 5); T.x += Math.sin(T.kurs) * T.v * dt; T.z += Math.cos(T.kurs) * T.v * dt; }
        T.g.position.set(T.x, hoehe(T.x, T.z), T.z); T.g.rotation.y = T.kurs;
        T.schritt(dt, zeit, T.v, T.v < 0.1 && ((zeit * 0.13 + n * 0.37) % 1) < 0.6);
      });
    });
    // Schafherde: zieht über den Feldweg, wenn man näher kommt
    if (schafe) {
      var es = Math.hypot(px - (-106), pz - 195);
      if (es < 42 && !getan.schafe) { getan.schafe = true; schafe.zustand = 'rueber'; schafe.x = -116; schafe.z = 214; sieh('schaf'); for (i = 0; i < 5; i++) { if (!SOUND.spiel('schaf', 0.5, 0.9 + Math.random() * 0.25, i * 0.7)) KERN.ton(330 + (i % 2) * 60, 0.25, 'sawtooth', 0.05, i * 0.45); } }
      schafe.fest = Math.hypot(schafe.tiere[0].x - schafe.x, schafe.tiere[0].z - schafe.z) > 3;
      if (modus === 'ritt') schafe.tiere.forEach(function (T) { var dx = M.x - T.x, dz = M.z - T.z, e = Math.hypot(dx, dz); if (e < 1.5 && e > 0.01) { M.x = T.x + dx / e * 1.5; M.z = T.z + dz / e * 1.5; M.tempo = Math.min(M.tempo, 1.5); } });
    }
    // Traktoren
    traktoren.forEach(function (T) {
      var alt = [T.x, T.z];
      if (T.nr) {              // auf der Landstraße hin und her
        var p = strasse.p, n = p.length - 1;
        T.s += dt * 7.5 * T.hin / 5;
        if (T.s > n - 6) { T.s = n - 6; T.hin = -1; } else if (T.s < 6) { T.s = 6; T.hin = 1; }
        var j = Math.floor(T.s), t = T.s - j, a = p[j], b = p[Math.min(n, j + 1)], nx = -(b[1] - a[1]), nz = b[0] - a[0], l = Math.hypot(nx, nz) || 1;
        T.x = a[0] + (b[0] - a[0]) * t - nx / l * 2 * T.hin; T.z = a[1] + (b[1] - a[1]) * t - nz / l * 2 * T.hin;
        T.kurs = Math.atan2((b[0] - a[0]) * T.hin, (b[1] - a[1]) * T.hin);
      } else {                 // Bahn für Bahn über den Acker
        var f = FELDER[2];
        T.s += dt * 3.2 * T.hin;
        if (T.s > f[3] - f[1] - 12) { T.s = f[3] - f[1] - 12; T.hin = -1; T.spur = (T.spur + 1) % 8; } else if (T.s < 0) { T.s = 0; T.hin = 1; T.spur = (T.spur + 1) % 8; }
        T.x = f[0] + 7 + T.spur * 6; T.z = f[1] + 6 + T.s; T.kurs = T.hin > 0 ? 0 : Math.PI;
      }
      var y = hoehe(T.x, T.z);
      T.g.position.set(T.x, y, T.z); T.g.rotation.y += winkel(T.kurs - T.g.rotation.y) * Math.min(1, dt * 3);
      T.g.rotation.x = -Math.atan((hoehe(T.x + Math.sin(T.kurs) * 1.5, T.z + Math.cos(T.kurs) * 1.5) - hoehe(T.x - Math.sin(T.kurs) * 1.5, T.z - Math.cos(T.kurs) * 1.5)) / 3);
      var e = Math.hypot(px - T.x, pz - T.z);
      T.gruss -= dt;
      if (e < 70) { SOUND.schleife('traktor', Math.pow(1 - e / 70, 1.6) * 0.8); if (!SOUND.bereit()) { T.ton = (T.ton || 0) - dt; if (T.ton <= 0) { T.ton = 0.16; KERN.ton(52 + Math.random() * 8, 0.12, 'sawtooth', Math.max(0.01, 0.07 * (1 - e / 60))); } } }
      if (e < 13 && T.gruss <= 0) {
        T.gruss = 14;
        if (modus === 'ritt' && M.tempo > 2.6) { schreck = 1.1; M.eigen = Math.min(M.eigen, 2); KERN.meldung('😳 ' + mein.name + ' erschrickt vor dem Traktor!', 'knapp'); SOUND.spiel('wiehern', 0.8); sage('Hoppla! Am Traktor reiten wir besser im Schritt vorbei.', 5); KERN.ton(900, 0.3, 'sawtooth', 0.08); }
        else { T.bauer.setzePose('winken'); setTimeout(function () { T.bauer.setzePose('bank'); }, 2500); if (!getan['bauer' + T.nr]) { getan['bauer' + T.nr] = true; lohn(1, '🚜 Der Bauer winkt dir zu'); } else KERN.meldung('🚜 Der Bauer winkt', 'gut'); }
      }
      T.bauer.bewege(dt);
    });
    // der Baum fällt um
    if (fallBaum && fallBaum.t < 0 && modus === 'ritt' && Math.hypot(px - fallBaum.x, pz - fallBaum.z) < 34) {
      fallBaum.t = 0; if (!SOUND.spiel('baum', 0.8)) { KERN.ton(140, 0.5, 'sawtooth', 0.14); KERN.ton(90, 0.6, 'sawtooth', 0.14, 0.3); }
      sage('Vorsicht! Der Baum da vorne fällt um!', 4); M.eigen = Math.min(M.eigen, 2.5);
    }
    if (fallBaum && fallBaum.t >= 0 && fallBaum.t < 1) {
      fallBaum.t = Math.min(1, fallBaum.t + dt / 1.7);
      fallBaum.g.rotation.x = Math.pow(fallBaum.t, 2.2) * 1.52;
      if (fallBaum.t >= 1) { fallBaum.stamm.da = true; KERN.ton(60, 0.4, 'square', 0.2); KERN.huf(0.3, 120); lohn(2, '🌳 Rumms! Ein Baum liegt auf dem Weg'); setTimeout(function () { sage('Puh! Spring drüber oder reite außen herum.', 6); }, 600); }
    }
    if (muehlRad) muehlRad.rotation.z += dt * 0.5;
    // Sterne, Äpfel, Hufeisen, Enten
    marken.forEach(function (m) { m.stern.visible = !gefunden[m.id]; m.stern.rotation.y = zeit * 2; m.stern.position.y = m.y + Math.sin(zeit * 3 + m.y) * 0.3; });
    aepfel.forEach(function (a, n) { if (a.da) { a.netz.position.set(a.x, a.y + Math.sin(zeit * 2.5 + n) * 0.15, a.z); a.netz.rotation.y = zeit; } });
    hufeisen.forEach(function (a, n) { if (a.da) { a.netz.position.set(a.x, a.y + Math.sin(zeit * 2 + n) * 0.15, a.z); a.netz.rotation.y = zeit * 1.5; } });
    entenRuf = Math.max(0, entenRuf - dt);
    if (Math.hypot(px - SEE[0], pz - SEE[1]) < 55) sieh('ente');
    enten.forEach(function (e, n) {
      var zx2, zz2;
      if (entenRuf > 0) { var sp = stegPunkt(0.9 + (n % 2) * 0.5 + 1.2, 5.5 + n * 1.2); zx2 = sp[0]; zz2 = sp[1]; }
      else { e.w += dt * 0.12; zx2 = SEE[0] + Math.sin(e.w) * e.r; zz2 = SEE[1] + Math.cos(e.w) * e.r * 0.7; }
      if (e.x === undefined) { e.x = zx2; e.z = zz2; }
      var ex = zx2 - e.x, ez = zz2 - e.z, el = Math.hypot(ex, ez), ev = Math.min(el, (entenRuf > 0 ? 2.6 : 1.2) * dt);
      if (el > 0.05) { e.x += ex / el * ev; e.z += ez / el * ev; e.g.rotation.y = Math.atan2(ex, ez); }
      e.g.position.set(e.x, WASSER + 0.08 + Math.sin(zeit * (entenRuf > 0 ? 9 : 2) + e.r) * (entenRuf > 0 && el < 0.3 ? 0.05 : 0.02), e.z);
    });
    // nur die Waldstücke in der Nähe zeichnen
    stuecke.forEach(function (s) {
      s.g.visible = Math.hypot(s.x - kamera.position.x, s.z - kamera.position.z) < szene.fog.far + 20;
      if (s.fertig || !s.g.visible) return;
      s.zahl = 0; s.g.traverse(function (t) { if (t.isInstancedMesh) { s.zahl++; if (!t.userData.knapp) { t.userData.knapp = true; t.computeBoundingSphere(); t.frustumCulled = true; } } });
      if (s.zahl > 6 || MODELLE3D.aus() || zeit - (s.t0 = s.t0 || zeit) > 30) s.fertig = true;
    });
  }

  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    var lenk = 0;
    aktuell = null; zweitListe = [];
    if (modus === 'ritt') lenk = reite(dt);
    else if (modus === 'fuss') zuFuss(dt);
    else { M.wunsch = 0; M.eigen = 0; }
    if (tippZeit > 0) tippZeit -= dt;
    if (redeZeit > 0) { redeZeit -= dt; if (redeZeit <= 0 && tippZeit <= 0) setzeHinweis(null); }
    KERN.setzeAktion(aktuell ? aktuell.text : null);
    REITEN.zweit(modus === 'ritt' || modus === 'fuss' ? zweitListe : null);
    if (mitPferd) {
      if (modus === 'fuss' && fuehrt) {            // das Pferd folgt am Strick
        var zx = I.x - Math.sin(I.kurs) * 1.9 + Math.cos(I.kurs) * 0.9, zz = I.z - Math.cos(I.kurs) * 1.9 - Math.sin(I.kurs) * 0.9, dx = zx - M.x, dz = zz - M.z, dist = Math.hypot(dx, dz);
        M.wunsch = dist > 1.1 ? Math.min(5.5, dist * 1.7) : 0;
        lenk = dist > 1.1 ? Math.max(-1, Math.min(1, winkel(Math.atan2(dx, dz) - M.kurs) * 2.2)) : 0;
        if (dist > 40) M.setze(zx, zz, I.kurs);
      } else if (modus === 'fuss') M.wunsch = 0;
      M.laut = modus === 'ritt' ? 1 : 0.4;
      M.schritt(dt, lenk, zeit);
      if (modus === 'ritt') ich.huefte.position.y = M.gang === 'trab' ? Math.abs(Math.sin(M.phase)) * 0.06 : 0;
    }
    bewegeFreundin(dt);
    bewegeFohlen(dt);
    spieleAmSee(dt);
    bewegeWelt(dt);
    // Strick
    if (modus === 'fuss' && fuehrt && mitPferd) {
      var kopf = meins.knochen.jaw001 || meins.knochen.skull, pos = strick.geometry.attributes.position;
      if (kopf) { kopf.getWorldPosition(hv); pos.setXYZ(0, I.x + Math.sin(I.kurs + 0.9) * -0.25, ich.wurzel.position.y + 0.95, I.z + Math.cos(I.kurs + 0.9) * -0.25); pos.setXYZ(1, hv.x, hv.y - 0.05, hv.z); pos.needsUpdate = true; strick.visible = true; }
    } else strick.visible = false;
    // Kamera
    if (modus === 'fuss') {
      var c = Math.cos(0.5), kd = I.sitzt ? 5.5 : 7.5, iy = ich.wurzel.position.y;
      kamW += winkel(I.kurs + Math.PI - kamW) * Math.min(1, dt * (I.tempo > 1 ? 0.9 : 0));        // die Kamera dreht sich langsam hinter die Spielerin
      kamZiel.set(I.x + Math.sin(kamW) * c * kd, iy + 1 + Math.sin(0.5) * kd, I.z + Math.cos(kamW) * c * kd);
      kamZiel.y = Math.max(kamZiel.y, hoehe(kamZiel.x, kamZiel.z) + 1.2);
      kamera.position.lerp(kamZiel, 1 - Math.exp(-4 * dt));
      kamBlick.lerp(hv.set(I.x, iy + 1.1, I.z), 1 - Math.exp(-6 * dt));
      kamera.lookAt(kamBlick);
      sonne.folge(I.x, iy, I.z);
    } else {
      REITEN.folge(kamera, M, dt, { boden: hoehe, hinten: 9, hoch: 4.4 });
      kamBlick.set(M.x, M.y + 1.5, M.z);
      sonne.folge(M.x, M.y, M.z);
    }
    himmel.schritt(dt, zeit, kamera, modus === 'fuss' ? I.x : M.x, modus === 'fuss' ? I.z : M.z);
    // Anzeige oben: Entdeckungen, Tiere, Gangart, Richtung zum Hof
    var px = modus === 'fuss' ? I.x : M.x, pz = modus === 'fuss' ? I.z : M.z, hofWeit = Math.hypot(px, pz + 124);
    var blick = modus === 'fuss' ? kamW + Math.PI : M.kurs, rel = Math.round(winkel(Math.atan2(-px, -124 - pz) - blick) / (Math.PI / 4));
    var pfeil = { '0': '⬆️', '1': '↖️', '2': '⬅️', '3': '↙️', '4': '⬇️', '-4': '⬇️', '-1': '↗️', '-2': '➡️', '-3': '↘️' }[rel];
    KERN.setzeHud(REITEN.kachel('Entdeckt', '⭐ ' + Object.keys(gefunden).length + ' / ' + ORTE.length) + REITEN.kachel('Tiere', '🔭 ' + Object.keys(gesehen).length + ' / ' + Object.keys(TIERNAMEN).length) +
      REITEN.kachel(modus === 'fuss' ? 'Unterwegs' : mein ? KERN.esc(mein.name) : 'Gang', modus === 'fuss' ? (fuehrt ? '🐴 führen' : '🥾 zu Fuß') : REITEN.GANG_NAME[M.gang]) +
      (slalom ? REITEN.kachel('Slalom', slalom.t.toFixed(1) + ' s') : REITEN.kachel('Zum Hof', pfeil + ' ' + Math.round(hofWeit / 10) * 10 + ' m')) + REITEN.kachel(WETTER.uhr() + ' Uhr', WETTER.text()));
    bewegeSturm(dt);
    if (radar) { radar.el.style.display = modus === 'ritt' || modus === 'fuss' ? 'block' : 'none'; radarZeit -= dt; if (radarZeit <= 0 && (modus === 'ritt' || modus === 'fuss')) { radarZeit = 0.12; zeichneRadar(); } }
  }

  // ---------- Spiele am See ----------
  function setzen(s) {
    I.sitzt = s; I.x = s.x; I.z = s.z; I.kurs = s.kurs; I.tempo = 0;
    ich.setzePose(s.pose);
    KERN.ton(440, 0.1, 'triangle', 0.12);
    sage(s.decke ? 'Ich habe Apfelkuchen und Saft dabei!' : 'Schau mal, wie weit man sehen kann!', 5);
  }
  function aufstehen() {
    var decke = I.sitzt && I.sitzt.decke;
    I.sitzt = null; ich.setzePose('steh'); ich.setzeHoehe(0.8); freundin.setzePose('steh'); freundin.setzeHoehe(0.8);
    // von der Decke richtig aufstehen (aufgenommene Bewegung)
    if (decke && ich.spiele('aufstehen', { tempo: 1.7 })) { freundin.spiele('aufstehen', { tempo: 1.55 }); I.pose = 'auf'; I.poseZeit = 2.5; }
  }
  function picknick() {
    ich.setzePose('essen'); freundin.setzePose('essen'); I.poseZeit = 2.2; I.pose = 'sitzt';
    [0, 0.5, 1.0].forEach(function (t) { KERN.ton(190, 0.06, 'square', 0.05, t); KERN.ton(150, 0.06, 'square', 0.05, t + 0.15); });
    if (!getan.picknick) { getan.picknick = true; lohn(3, '🍰 Mmmh, Apfelkuchen!'); } else KERN.meldung(['🧃 Lecker Saft!', '🍎 Ein Apfel!', '🥪 Ein Käsebrot!'][Math.floor(Math.random() * 3)], 'gut');
  }
  function pose(name, sek) { ich.setzePose(name); I.pose = name; I.poseZeit = sek; }
  function ring(x, z, gross) {
    var r = wasserRinge.sort(function (a, b) { return b.t - a.t; })[0];
    r.t = 0; r.gross = gross || 1; r.g.position.set(x, WASSER + 0.03, z); r.g.visible = true;
    KERN.ton(900 + Math.random() * 500, 0.06, 'sine', 0.1);
  }
  function wirfStein(wx, wz) {
    var l = Math.hypot(wx, wz);
    I.kurs = Math.atan2(wx, wz);
    pose('werfen', 0.6);
    var z = Math.random(), n = z < 0.12 ? 1 : z < 0.4 ? 2 : z < 0.65 ? 3 : z < 0.82 ? 4 : z < 0.93 ? 5 : 7;
    stein.fl = { x: I.x, z: I.z, dx: wx / l, dz: wz / l, n: n, i: -1, t: 0, weit: 0, y0: ich.wurzel.position.y + 1.3, start: 0.25 };
    KERN.ton(300, 0.08, 'triangle', 0.1);
  }
  function fuettereEnten() {
    pose('werfen', 0.7); entenRuf = 9;
    for (var i = 0; i < 6; i++) { var qv = 0.5 + i * 0.28 + Math.random() * 0.1; if (!SOUND.spiel('ente', 0.5, 0.9 + Math.random() * 0.3, qv)) KERN.ton(i % 2 ? 560 : 480, 0.09, 'sawtooth', 0.07, qv); }
    if (!getan.enten) { getan.enten = true; lohn(2, '🦆 Quak! Die Enten freuen sich'); } else KERN.meldung('🦆 Quak, quak!', 'gut');
    sage('Schau, da kommen sie alle angeschwommen!', 4);
  }
  function angle() {
    if (!angel) {
      var p = stegPunkt(0, 12.5);
      angel = { phase: 'warten', t: 2.5 + Math.random() * 4, x: p[0], z: p[1] };
      schwimmer.position.set(p[0], WASSER + 0.03, p[1]); schwimmer.visible = true;
      I.kurs = Math.atan2(p[0] - I.x, p[1] - I.z);
      ich.setzePose('angeln'); I.pose = 'angeln'; I.poseZeit = 99;
      ring(p[0], p[1]); KERN.meldung('🎣 Warte, bis es zuckt …', 'gut');
    } else if (angel.phase === 'biss') {
      var gross = Math.random() < 0.25;
      fisch.fl = { t: 0, x: angel.x, z: angel.z }; fisch.scale.set(0.45, 0.8, 1.6).multiplyScalar(gross ? 1.7 : 1);
      schwimmer.visible = false; angel = null; I.poseZeit = 0.8;
      getan.fische = (getan.fische || 0) + 1;
      lohn(gross ? 4 : 2, gross ? '🐟 Ein riesiger Fisch! Du lässt ihn wieder frei.' : '🐟 Gefangen! Du lässt ihn wieder schwimmen.');
    } else { KERN.meldung('Zu früh! Der Fisch ist weg.', 'knapp'); schwimmer.visible = false; angel = null; I.poseZeit = 0; }
  }
  function pfluecke() {
    pose('pfluecken', 0.9);
    blumenZahl++;
    KERN.ton(700 + (blumenZahl % 5) * 80, 0.1, 'triangle', 0.12);
    if (blumenZahl % 5 === 0) { lohn(3, '💐 Ein Blumenkranz für dein Pferd!'); sage('Der Kranz ist wunderschön geworden!', 4); }
    else KERN.meldung('🌸 ' + (blumenZahl % 5) + ' von 5 Blumen', 'gut');
  }
  function sammlePilz(p) {
    pose('pfluecken', 0.9); p.da = false; p.g.visible = false; pilzZahl++;
    KERN.ton(520 + pilzZahl * 40, 0.1, 'triangle', 0.12);
    if (pilzZahl % 4 === 0) { lohn(4, '🍄 Ein Korb voller Pilze!'); sage('Das gibt heute Abend eine leckere Pilzpfanne!', 5); } else KERN.meldung('🍄 ' + (pilzZahl % 4) + ' von 4 Pilzen', 'gut');
  }
  function kaufeEis() {
    if (!STAND.zahle(2)) { KERN.meldung('Ein Eis kostet 2 🪙', 'knapp'); return; }
    pose('essen', 2.4); getan.eis = (getan.eis || 0) + 1;
    [0, 0.4, 0.8].forEach(function (t) { KERN.ton(880 + t * 300, 0.1, 'triangle', 0.1, t); });
    KERN.meldung(['🍦 Erdbeere! Lecker', '🍦 Schokolade! Mmmh', '🍦 Vanille mit Streuseln!'][getan.eis % 3], 'perfekt');
    sage('Für mich Zitrone, bitte! Danke, du bist die Beste.', 5);
  }
  function spieleAmSee(dt) {
    wasserRinge.forEach(function (r) {
      if (!r.g.visible) return;
      r.t += dt;
      var g = (0.3 + r.t * 1.6) * r.gross; r.g.scale.set(g, g, 1); r.g.material.opacity = Math.max(0, 0.7 - r.t * 0.6);
      if (r.t > 1.2) r.g.visible = false;
    });
    var s = stein.fl;
    if (s) {
      if (s.start > 0) { s.start -= dt; if (s.start <= 0) { stein.visible = true; s.i = 0; s.lang = 5; s.t = 0; } }
      else {
        var dau = 0.25 + s.lang * 0.06;
        s.t += dt / dau;
        var p = Math.min(1, s.t), ex = s.x + s.dx * (s.weit + s.lang * p), ez = s.z + s.dz * (s.weit + s.lang * p);
        var y = s.i === 0 ? s.y0 + (WASSER - s.y0) * p + Math.sin(p * Math.PI) * 0.4 : WASSER + Math.sin(p * Math.PI) * s.lang * 0.22;
        stein.position.set(ex, y, ez); stein.rotation.y += dt * 20;
        if (s.t >= 1) {
          s.weit += s.lang; s.i++; s.t = 0; s.lang = Math.max(0.5, 3.4 * Math.pow(0.72, s.i));
          ring(ex, ez, s.i > s.n ? 1.6 : 0.8);
          if (boden(ex, ez) > WASSER) { s.n = 0; s.i = 99; }
          if (s.i > s.n) {
            stein.visible = false; stein.fl = null;
            var h = Math.max(0, s.n);
            if (s.i === 99) KERN.meldung('Plumps! Daneben.', 'knapp');
            else if (h >= 5) { lohn(h >= 7 ? 4 : 2, '🪨 ' + h + ' Hüpfer! Wahnsinn!'); sage('Wow, wie machst du das?', 4); }
            else KERN.meldung(h <= 1 ? 'Plumps! Nur 1 Hüpfer.' : '🪨 ' + h + ' Hüpfer!', h >= 3 ? 'gut' : 'knapp');
            getan.steine = Math.max(getan.steine || 0, h);
          }
        }
      }
    }
    if (angel) {
      angel.t -= dt;
      if (angel.phase === 'warten') {
        schwimmer.position.y = WASSER + 0.03 + Math.sin(zeit * 2.5) * 0.02;
        if (angel.t <= 0) { angel.phase = 'biss'; angel.t = 1.4; ring(angel.x, angel.z, 1.2); KERN.ton(880, 0.08, 'square', 0.1); KERN.ton(1100, 0.1, 'square', 0.1, 0.1); KERN.meldung('❗ Es zuckt! Schnell ziehen!', 'perfekt'); }
      } else {
        schwimmer.position.y = WASSER - 0.08 + Math.sin(zeit * 30) * 0.05;
        if (angel.t <= 0) { KERN.meldung('Zu langsam, der Fisch ist weg.', 'knapp'); schwimmer.visible = false; angel = null; I.poseZeit = 0; }
      }
    }
    if (fisch.fl) {
      var f = fisch.fl; f.t += dt;
      var q = f.t / 1.1;
      fisch.visible = q < 1; fisch.position.set(f.x, WASSER + Math.sin(q * Math.PI) * 1.8, f.z); fisch.rotation.x = -1.2 + q * 2.6;
      if (q >= 1) { ring(f.x, f.z, 1.6); fisch.fl = null; }
    }
  }

  // ---------- zu Fuß gehen ----------
  function zuFuss(dt) {
    dauer += dt;
    var t = KERN.taste, w = KERN.wisch, i;
    var sx = (t.rechts ? 1 : 0) - (t.links ? 1 : 0) - w.lenk, sz = (t.langsamer ? 1 : 0) - (t.schneller ? 1 : 0) - w.hoch;
    var kc = Math.cos(kamW), ks = Math.sin(kamW), ex = sx * kc + sz * ks, ez = -sx * ks + sz * kc, st = Math.min(1, Math.hypot(ex, ez));
    if (I.poseZeit > 0) { I.poseZeit -= dt; if (I.poseZeit <= 0) { if (I.sitzt) { ich.setzePose(I.sitzt.pose); freundin.setzePose(I.sitzt.pose); } else { ich.setzePose('steh'); ich.setzeHoehe(0.8); } I.pose = null; } }
    if (I.sitzt || I.pose === 'pfluecken' || I.pose === 'werfen' || I.pose === 'essen' || I.pose === 'auf') st = 0;
    if (st > 0.05 && angel) { schwimmer.visible = false; angel = null; I.pose = null; I.poseZeit = 0; ich.setzePose('steh'); }
    I.tempo += (st * (fuehrt ? 3.4 : 4.6) - I.tempo) * Math.min(1, dt * 10);
    var steg = aufSteg(I.x, I.z), bruecke = aufBruecke(I.x, I.z), wasserTief = WASSER - boden(I.x, I.z), imWasser = wasserTief > 0.05 && steg === null && !bruecke;
    if (st > 0.05) {
      var ziel = Math.atan2(ex, ez);
      I.kurs += winkel(ziel - I.kurs) * Math.min(1, dt * 12);
      var v = I.tempo * (imWasser ? 0.55 : 1) * dt, nx = I.x + ex / st * v * Math.min(1, st * 1.2), nz = I.z + ez / st * v * Math.min(1, st * 1.2);
      // nicht zu tief ins Wasser (außer auf dem Steg und auf Brücken)
      if (aufSteg(nx, nz) !== null || aufBruecke(nx, nz) || boden(nx, nz) > WASSER - 0.55) { I.x = nx; I.z = nz; }
      I.radius = 0.35; fussGrenze(I);
      I.phase += I.tempo * dt * 4.2;
      if (imWasser) { nass += dt; if (nass > 0.3) { nass = 0; KERN.huf(0.07, 2800 + Math.random() * 900); } if (!kalt) { kalt = true; KERN.meldung('💦 Huch, ist das kalt!', 'gut'); sage('Hihi, Schuhe aus und rein!', 4); } }
    }
    var iy = fussHoehe(I.x, I.z);
    ich.gehe(I.phase, Math.min(1, I.tempo / 3.5));
    if (!I.pose && !I.sitzt) ich.setzePose(fuehrt ? 'fuehren' : 'steh');
    ich.bewege(dt);
    ich.wurzel.position.set(I.x, iy, I.z); ich.wurzel.rotation.y = I.kurs;
    entdecke(I.x, I.z);
    // die Freundin geht mit und setzt sich dazu
    if (mitFreundin) {
      var zx = I.x - Math.sin(I.kurs) * 1.1 - Math.cos(I.kurs) * 1.1, zz = I.z - Math.cos(I.kurs) * 1.1 + Math.sin(I.kurs) * 1.1, sitzB = false;
      if (I.sitzt) { zx = I.sitzt.x + I.sitzt.fx; zz = I.sitzt.z + I.sitzt.fz; }
      if (Math.hypot(zx - B.x, zz - B.z) > 30) { B.x = zx; B.z = zz; }
      var bx = zx - B.x, bz = zz - B.z, bl = Math.hypot(bx, bz), bv = 0;
      if (bl > (I.sitzt ? 0.12 : 0.7)) {
        bv = Math.min(5, bl * 2.5); B.kurs = Math.atan2(bx, bz);
        var ax = B.x + bx / bl * bv * dt, az = B.z + bz / bl * bv * dt;
        if (aufSteg(ax, az) !== null || aufBruecke(ax, az) || boden(ax, az) > WASSER - 0.3 || I.sitzt) { B.x = ax; B.z = az; } else bv = 0;
        B.phase += bv * dt * 4.2;
        if (!I.pose) freundin.setzePose(fuehrt ? 'fuehren' : 'steh');
      } else if (I.sitzt) { sitzB = true; B.kurs = I.sitzt.decke ? Math.atan2(I.x - B.x, I.z - B.z) : I.sitzt.kurs; if (!I.pose) freundin.setzePose(I.sitzt.pose); }
      if (!sitzB && !I.sitzt) freundin.setzeHoehe(0.8);
      freundin.gehe(B.phase, Math.min(1, bv / 3.5)); freundin.bewege(dt);
      freundin.wurzel.position.set(B.x, fussHoehe(B.x, B.z), B.z); freundin.wurzel.rotation.y = B.kurs;
    }

    // Was kann man hier tun?
    var amPferd = mitPferd && Math.hypot(I.x - M.x, I.z - M.z) < 2.7, amAnderen = mitFreundin && Math.hypot(I.x - F.x, I.z - F.z) < 2.6;
    var zumSee = [SEE[0] - I.x, SEE[1] - I.z], ul = Math.hypot(zumSee[0], zumSee[1]) || 1, ufer = boden(I.x + zumSee[0] / ul * 4, I.z + zumSee[1] / ul * 4) < WASSER - 0.05 && ul < 60;
    var amBach = !ufer && fluss.abstand(I.x, I.z, 9) < 8 && !bruecke;
    if (I.sitzt) aktuell = I.sitzt.decke && I.poseZeit <= 0 && !getan.satt ? { text: '🍰 Picknick essen', tun: function () { picknick(); getan.essen = (getan.essen || 0) + 1; if (getan.essen >= 3) getan.satt = true; } } : I.poseZeit <= 0 ? { text: '🧍 Aufstehen', tun: aufstehen } : null;
    else if (I.poseZeit > 0 && I.pose !== 'angeln') aktuell = null;
    else if (angel) aktuell = { text: angel.phase === 'biss' ? '🎣 Ziehen!' : '🎣 Angel einholen', tun: angle };
    else if (I.z < -116 && Math.abs(I.x) < 9 && dauer > 8) aktuell = { text: '🏡 Nach Hause gehen', tun: nachHause };
    else if (amPferd && !imWasser) aktuell = { text: '🐴 Auf ' + mein.name + ' steigen', tun: steigeAuf };
    else if (amAnderen && mitPferd) aktuell = { text: '🔄 Auf ' + ihr.name + ' umsteigen', tun: function () { tausche(); steigeAuf(); } };
    else {
      for (i = 0; i < SITZE.length; i++) if (Math.hypot(I.x - SITZE[i].x, I.z - SITZE[i].z) < 2.4) aktuell = { text: SITZE[i].text, tun: (function (s) { return function () { setzen(s); }; })(SITZE[i]) };
      if (!aktuell && steg !== null) aktuell = steg > 6.3 ? { text: '🎣 Angeln', tun: angle } : steg > 1 ? { text: '🦆 Enten füttern', tun: fuettereEnten } : null;
      if (!aktuell && Math.hypot(I.x + 200, I.z - 384) < 4.2) aktuell = { text: '🍦 Ein Eis kaufen (2 🪙)', tun: kaufeEis };
      if (!aktuell) for (i = 0; i < pilze.length; i++) if (pilze[i].da && Math.hypot(I.x - pilze[i].x, I.z - pilze[i].z) < 1.8) aktuell = { text: '🍄 Pilz sammeln', tun: (function (p) { return function () { sammlePilz(p); }; })(pilze[i]) };
      if (!aktuell && (ufer || amBach) && !stein.fl) aktuell = { text: '🪨 Stein flitschen lassen', tun: function () { if (ufer) wirfStein(zumSee[0], zumSee[1]); else { fluss.abstand(I.x, I.z, 12); var q = fluss.p[fluss.nr]; wirfStein(q[0] - I.x + 0.01, q[1] - I.z); } } };
      if (!aktuell && Math.hypot(I.x + 72, I.z + 48) < 24) aktuell = { text: '🌸 Blume pflücken', tun: pfluecke };
    }
    if (mitPferd && !I.sitzt && !angel) {
      if (amPferd && !(aktuell && aktuell.tun === steigeAuf)) zweitListe.push({ text: '🐴 Aufsteigen', tun: steigeAuf });      // neben dem Pferd kann man immer aufsteigen
      zweitListe.push(fuehrt ? { text: '🌿 Grasen lassen', tun: function () { fuehre(false); } } : { text: '🐴 Pferd führen', tun: function () { if (Math.hypot(I.x - M.x, I.z - M.z) > 14) { KERN.meldung('Geh erst zu ' + mein.name + ' zurück.', 'knapp'); return; } fuehre(true); } });
      zweitListe.push({ text: '🔄 Pferd wechseln', tun: waehlePferd });
    }
    if (redeZeit <= 0 && tippZeit <= 0) setzeHinweis(mitPferd && !fuehrt && Math.hypot(I.x - M.x, I.z - M.z) > 30 ? mein.name + ' wartet auf dich. Geh zurück, um aufzusteigen oder ' + mein.name + ' zu führen.' : null);
  }

  function nachHause() {
    if (modus !== 'ritt' && modus !== 'fuss') return;
    var alt = modus;
    if (rennen) beendeRennen(null);
    modus = 'fertig';
    KERN.setzeAktion(null); REITEN.zweit(null); setzeHinweis(null);
    var n = Object.keys(gefunden).length, tiere = Object.keys(gesehen).length, id = mein && mein.def ? mein.id : startId;
    if (sturmLauf && WETTER.gewitter()) { STAND.daten.wetterRest = 75; if (sturmLauf.t < 170 && !sturmLauf.lohn) { sturmLauf.lohn = true; lohn(6, '⛈️ Rechtzeitig vor dem Unwetter am Hof!'); } }
    STAND.speichere();
    KERN.klang('ziel');
    KERN.zeigeKarte('mitte', '<div class="klein">' + (mitPferd ? 'Ausritt' + (mitFreundin ? ' mit Lotte' : '') : 'Spaziergang') + '</div><h2>Das war schön!</h2>' +
      '<div class="details">Entdeckte Orte: <b>⭐ ' + n + ' von ' + ORTE.length + '</b><br>Beobachtete Tiere: <b>🔭 ' + tiere + ' von ' + Object.keys(TIERNAMEN).length + '</b><br>Gesammelte Äpfel: <b>🍎 ' + apfelZahl + '</b>' +
      (hufeisenZahl ? '<br>Glückshufeisen: <b>🍀 ' + hufeisenZahl + '</b>' : '') + (getan.rennen ? '<br>Gewonnene Wettrennen: <b>🏁 ' + getan.rennen + '</b>' : '') + '</div>' +
      (muenzen ? '<div class="lohn">+' + muenzen + ' 🪙 Münzen <small>(unterwegs gesammelt)</small></div>' : '') +
      (opt.hof && mitPferd ? '<div class="details"><small>Tipp: Am <b>🚿 Putzplatz</b> auf dem Hof kannst du ' + KERN.esc(mein.name) + ' abspritzen, bevor es in den Stall geht.</small></div>' : ''),
      [{ text: mitPferd ? 'Weiter reiten' : 'Weiter spazieren', aktion: function () { KERN.schliesseKarte(); modus = alt; dauer = 0; } },
       { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { var o = opt; raeumeAuf(); REITEN.heim(o, mitPferd ? { art: 'ausritt', orte: n, pferdId: id } : null); } }]);
  }
  function raeumeAuf() {
    if (modus === 'fuss' || ich.wurzel.parent !== szene) { if (ich.wurzel.parent) ich.wurzel.parent.remove(ich.wurzel); szene.add(ich.wurzel); }
    modus = 'aus'; setzeHinweis(null); REITEN.zweit(null); if (radar) radar.el.style.display = 'none';
    if (WETTER.gewitter() && !opt.hof) WETTER.setze(null, 'regen');          // ohne Hof gibt es keinen Stall zum Unterstellen
    sturmLauf = null; rennen = null; slalom = null; if (zielFahne) zielFahne.visible = false;
  }

  // ---------- Radar oben in der Ecke und die große Landkarte ----------
  var karteBild = null, radar = null, radarZeit = 0, KARTE_PX = 512, HOF_ORT = [0, -128];
  function kx(x) { return (x - MITTE[0] + HALB) / (HALB * 2) * KARTE_PX; }
  function kz(z) { return (z - MITTE[1] + HALB) / (HALB * 2) * KARTE_PX; }
  function maleKarte() {
    if (karteBild) return karteBild;
    var N = 128, klein = document.createElement('canvas'); klein.width = klein.height = N;
    var g = klein.getContext('2d'), bild = g.createImageData(N, N), c = new THREE.Color(), f2 = new THREE.Color(), i = 0;
    for (var py = 0; py < N; py++) for (var px = 0; px < N; px++) {
      var x = MITTE[0] - HALB + (px + 0.5) / N * HALB * 2, z = MITTE[1] - HALB + (py + 0.5) / N * HALB * 2, h = boden(x, z), fe = inFeld(x, z, 0), w = wald(x, z);
      if (h < WASSER) c.setHex(0x5aa9e0);
      else if (fe) c.setHex(fe[4]);
      else { c.setHex(0x9bd66f).lerp(f2.setHex(0x6fae4f), Math.max(0, Math.min(1, (h - 1.5) / 14))); if (w) c.lerp(f2.setHex(0x2f7a3a), 0.75 * Math.min(1, w)); if (h > 17) c.lerp(f2.setHex(0xb9b6a8), Math.min(1, (h - 17) / 9)); }
      c.convertLinearToSRGB();
      bild.data[i++] = c.r * 255; bild.data[i++] = c.g * 255; bild.data[i++] = c.b * 255; bild.data[i++] = 255;
    }
    g.putImageData(bild, 0, 0);
    karteBild = document.createElement('canvas'); karteBild.width = karteBild.height = KARTE_PX;
    g = karteBild.getContext('2d');
    g.imageSmoothingEnabled = true; g.drawImage(klein, 0, 0, KARTE_PX, KARTE_PX);
    function zug(L, farbe, breit) { g.strokeStyle = farbe; g.lineWidth = breit; g.lineJoin = g.lineCap = 'round'; g.beginPath(); L.p.forEach(function (q, j) { if (j) g.lineTo(kx(q[0]), kz(q[1])); else g.moveTo(kx(q[0]), kz(q[1])); }); g.stroke(); }
    zug(fluss, '#5aa9e0', 7);
    zug(strasse, '#ffffff', 8); zug(strasse, '#8d9098', 5.5);
    for (var k in linien) { zug(linien[k], '#8a6a3a', 4.2); zug(linien[k], '#f1dfae', 2.6); }
    // der Hof im Norden
    g.fillStyle = '#b5482f'; g.fillRect(kx(-14), kz(-146), 22, 12); g.fillStyle = '#7a3b12'; g.fillRect(kx(-2.5), kz(-131), 4, 6);
    return karteBild;
  }
  function baueRadar() {
    if (radar) return;
    var el = document.createElement('div'); el.id = 'radar';
    el.innerHTML = '<canvas width="264" height="264"></canvas><span>🗺️ Karte</span>';
    document.body.appendChild(el);
    el.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); zeigeLandkarte(); });
    radar = { el: el, g: el.firstChild.getContext('2d') };
  }
  function ichOrt() { return modus === 'fuss' ? [I.x, I.z, kamW + Math.PI] : [M.x, M.z, M.kurs]; }
  function pfeilAuf(g, x, y, kurs, gr, farbe) {
    g.save(); g.translate(x, y); g.rotate(-kurs);            // Kurs 0 = nach Süden = auf der Karte nach unten
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, gr * 1.35); g.lineTo(gr * 0.95, -gr); g.lineTo(0, -gr * 0.45); g.lineTo(-gr * 0.95, -gr); g.closePath(); g.fill();
    g.fillStyle = farbe; g.beginPath(); g.moveTo(0, gr); g.lineTo(gr * 0.65, -gr * 0.7); g.lineTo(0, -gr * 0.3); g.lineTo(-gr * 0.65, -gr * 0.7); g.closePath(); g.fill();
    g.restore();
  }
  function zeichneRadar() {
    var g = radar.g, G = 264, m = G / 2, WEIT = 125, o = ichOrt(), ma = (m - 6) / WEIT, bild = maleKarte(), jeM = KARTE_PX / (HALB * 2);
    g.clearRect(0, 0, G, G);
    g.save(); g.beginPath(); g.arc(m, m, m - 6, 0, 6.2832); g.clip();
    g.fillStyle = '#9bd66f'; g.fillRect(0, 0, G, G);
    g.translate(m, m); g.scale(ma / jeM, ma / jeM); g.translate(-kx(o[0]), -kz(o[1]));
    g.drawImage(bild, 0, 0);
    g.restore();
    function punkt(x, z) { return [m + (x - o[0]) * ma, m + (z - o[1]) * ma]; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // goldene Sterne für Orte, die noch fehlen
    ORTE.forEach(function (O) { var q = punkt(O[2], O[3]); if (Math.hypot(q[0] - m, q[1] - m) > m - 16) return; g.font = '22px sans-serif'; g.fillText(gefunden[O[0]] ? O[1].split(' ')[0] : '⭐', q[0], q[1]); });
    if (mitFreundin) { var qf = modus === 'fuss' ? punkt(B.x, B.z) : punkt(F.x, F.z); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(qf[0], qf[1], 8, 0, 6.2832); g.fill(); g.fillStyle = '#e84393'; g.beginPath(); g.arc(qf[0], qf[1], 5.5, 0, 6.2832); g.fill(); }
    // nach Hause: das Haus, am Rand wenn der Hof weiter weg ist
    var qh = punkt(HOF_ORT[0], HOF_ORT[1]), dh = Math.hypot(qh[0] - m, qh[1] - m), rand = m - 24;
    if (dh > rand) { qh = [m + (qh[0] - m) / dh * rand, m + (qh[1] - m) / dh * rand]; g.strokeStyle = '#e8413c'; g.lineWidth = 5; g.setLineDash([3, 9]); g.beginPath(); g.moveTo(m, m); g.lineTo(qh[0], qh[1]); g.stroke(); g.setLineDash([]); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(qh[0], qh[1], 19, 0, 6.2832); g.fill(); g.strokeStyle = '#e8413c'; g.lineWidth = 3.5; g.stroke();
    g.font = '24px sans-serif'; g.fillText('🏡', qh[0], qh[1] + 1);
    pfeilAuf(g, m, m, o[2], 13, '#2a6fd6');
    var sturm = WETTER.gewitter();
    g.strokeStyle = sturm && Math.sin(zeit * 7) > 0 ? '#e8413c' : '#fffaf0'; g.lineWidth = 7; g.beginPath(); g.arc(m, m, m - 5, 0, 6.2832); g.stroke();
    g.fillStyle = '#7a3b12'; g.font = 'bold 22px sans-serif'; g.fillText('N', m, 22);
  }
  function zeigeLandkarte() {
    if (modus !== 'ritt' && modus !== 'fuss') return;
    var alt = modus; modus = 'karte';
    M.eigen = 0; M.wunsch = 0;
    var n = Object.keys(gefunden).length;
    KERN.zeigeKarte('mitte', '<h2>🗺️ Landkarte</h2><canvas id="landkarte" width="720" height="720" style="width:100%;max-width:min(560px,62vh);border-radius:14px;display:block;margin:0 auto"></canvas>' +
      '<div class="klein" style="margin-top:6px">🔵 du · 🏡 der Hof, dort geht es nach Hause · ⭐ noch nicht entdeckt (' + n + ' von ' + ORTE.length + ' gefunden) · oben ist Norden</div>',
      [{ text: 'Weiter', aktion: function () { KERN.schliesseKarte(); modus = alt; } }]);
    var c = document.getElementById('landkarte'), g = c.getContext('2d'), ma = 720 / KARTE_PX, o = alt === 'fuss' ? [I.x, I.z, kamW + Math.PI] : [M.x, M.z, M.kurs];
    g.drawImage(maleKarte(), 0, 0, 720, 720);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    function schrift(text, x, y, gr) { g.font = 'bold ' + gr + 'px sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(255,250,240,0.92)'; g.strokeText(text, x, y); g.fillStyle = '#5a2c0c'; g.fillText(text, x, y); }
    ORTE.forEach(function (O) {
      var x = kx(O[2]) * ma, y = kz(O[3]) * ma, da = gefunden[O[0]], teile = O[1].split(' ');
      g.font = '26px sans-serif'; g.fillText(da ? teile[0] : '⭐', x, y);
      schrift(da ? teile.slice(1).join(' ').replace(/^(Der|Die|Das) /, '') : '?', Math.max(60, Math.min(660, x)), y + 22, da ? 15 : 17);
    });
    var hx = kx(HOF_ORT[0]) * ma, hy = kz(HOF_ORT[1]) * ma;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(hx, hy, 19, 0, 6.2832); g.fill(); g.strokeStyle = '#e8413c'; g.lineWidth = 3; g.stroke();
    g.font = '26px sans-serif'; g.fillText('🏡', hx, hy + 1); schrift('Pferdehof', hx + 68, hy, 16);
    if (mitFreundin) { var fx = kx(alt === 'fuss' ? B.x : F.x) * ma, fy = kz(alt === 'fuss' ? B.z : F.z) * ma; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(fx, fy, 8, 0, 6.2832); g.fill(); g.fillStyle = '#e84393'; g.beginPath(); g.arc(fx, fy, 5.5, 0, 6.2832); g.fill(); }
    var px = kx(o[0]) * ma, py = kz(o[1]) * ma;
    g.strokeStyle = '#2a6fd6'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 22, 0, 6.2832); g.stroke();
    pfeilAuf(g, px, py, o[2], 13, '#2a6fd6'); schrift('Du', px, py - 32, 16);
    schrift('N', 700, 20, 20); schrift('▲', 700, 40, 14);
  }

  // ---------- Gewitter unterwegs: schnell nach Hause! ----------
  var sturmIn = 1e9, sturmLauf = null, blitzHoerer = false;
  function bewegeSturm(dt) {
    if (modus !== 'ritt' && modus !== 'fuss') return;
    if (!sturmLauf) {
      sturmIn -= dt;
      if (sturmIn > 0 || rennen || slalom || WETTER.gewitter() || WETTER.istNacht()) return;
      sturmIn = 1e9; sturmLauf = { t: 0, ruf: 14 };
      WETTER.setze(null, 'gewitter'); STAND.daten.wetterRest = 400;
      KERN.meldung('⛈️ Ein Gewitter zieht auf! Schnell nach Hause!', 'rot'); STURM.donner(0.5, 0.8);
      sage('Oh nein, da kommt ein Gewitter! Schnell nach Hause. Schau auf den Radar oben rechts: Das 🏡 zeigt den Weg.', 9);
      return;
    }
    sturmLauf.t += dt; sturmLauf.ruf -= dt;
    if (sturmLauf.ruf <= 0 && WETTER.gewitter()) { sturmLauf.ruf = 22; tipp('⛈️ Gewitter! Reite schnell nach Hause. Der Radar oben rechts zeigt dir, wo der Hof 🏡 ist.', 7); }
    if (sturmLauf.t > 260 && WETTER.gewitter()) { WETTER.setze(null, 'wolken'); sturmLauf = null; KERN.meldung('🌦️ Das Gewitter ist vorbeigezogen.', 'gut'); }
  }
  function beiBlitz(x, z) {
    if (KERN.welt() !== API || modus !== 'ritt' || !mitPferd || M.tempo < 1 || Math.random() < 0.45) return;
    if (Math.hypot(x - M.x, z - M.z) > 190) return;
    schreck = 0.8; KERN.meldung('😳 ' + mein.name + ' erschrickt vor dem Donner!', 'knapp'); SOUND.spiel('wiehern', 0.6, 1, 0.5);
  }

  var API = {
    name: '🌳 Ausritt',
    text: 'Ein Ausritt ins Grüne: Mit deiner Freundin Lotte reitest du frei durch Wiesen, Wälder und Felder, an den See und hinauf zum Gipfelkreuz. Zwölf Orte warten auf dich, dazu Tiere, Slalom, Ringstechen und Wettrennen. Du kannst überall absteigen, dein Pferd führen und das Pferd wechseln.',
    knopf: '🌳 Zum Ausritt',
    klasse: 'welt-ausritt', mitSturm: true,
    start: function (o) {
      opt = o || {};
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      mitPferd = !opt.ohnePferd; mitFreundin = mitPferd;
      // alle Hofpferde stehen zur Wahl; geritten wird das mitgebrachte (oder das zuletzt gewählte)
      alle = HOF_PFERDE.map(function (def) { var st = STAND.pferd(def.id); return { id: def.id, name: def.name, fell: def.fell, def: def, ausruestung: st.ausruestung, schmutz: st.schmutz }; });
      var wunsch = opt.pferd ? opt.pferd.id : STAND.daten.gewaehlt;
      mein = alle.filter(function (p) { return p.id === wunsch; })[0] || alle[0];
      startId = mein.id;
      // wenn das Fohlen groß ist, reitet die Freundin darauf. Als Jährling läuft es frei nebenher.
      var fo = STAND.daten.fohlen, gross = fo && fo.wuchs >= 1;
      ihr = { id: 'freund', name: gross ? (fo.name || 'dein großes Fohlen') : 'Wirbelwind', fell: 'fuchs', ausruestung: { gamaschen: '#f5f5f5' } };
      zeigePferde();
      var mitFohlen = mitPferd && fo && fo.wuchs >= 0.34 && fo.wuchs < 1;
      fohlenTier.wurzel.visible = !!mitFohlen;
      if (mitFohlen) fohlenTier.wurzel.scale.setScalar(0.46 + 0.54 * fo.wuchs);
      getan = {}; gefunden = {}; gesehen = {}; blumenZahl = 0; pilzZahl = 0; hufeisenZahl = 0; kalt = false; entenRuf = 0; aktuell = null; angel = null; fuehrt = false;
      apfelZahl = 0; muenzen = 0; dauer = 0; nass = 0; redeZeit = 0; tippZeit = 0; naechsteRede = 25; rennen = null; rennPause = 55; slalom = null; ringSerie = null; schreck = 0;
      aepfel.concat(hufeisen).forEach(function (a) { a.da = true; a.netz.visible = true; });
      pilze.forEach(function (p) { p.da = true; p.g.visible = true; }); ringe.forEach(function (r) { r.da = true; r.netz.visible = true; });
      staemme.forEach(function (s) { s.gesprungen = false; });
      baueRadar(); radarZeit = 0;
      if (WETTER.gewitter()) WETTER.setze(null, 'wolken');
      sturmLauf = null; sturmIn = Math.random() < 0.4 ? 110 + Math.random() * 200 : 1e9;
      if (!blitzHoerer) { blitzHoerer = true; STURM.beiBlitz(beiBlitz); }
      if (fallBaum) { fallBaum.t = -1; fallBaum.g.rotation.x = 0; fallBaum.stamm.da = false; }
      if (schafe) { schafe.zustand = 'links'; schafe.x = schafe.x0; schafe.z = schafe.z0; schafe.tiere.forEach(function (T) { T.x = schafe.x + T.dx; T.z = schafe.z + T.dz; }); }
      var sz = opt.vomHof ? -121 : START[1];
      M.setze(START[0], sz, 0); M.eigen = 0; F.setze(START[0] - 2.6, sz - 1.2, 0);
      FO.x = 5; FO.z = sz - 3; FO.tempo = 0;
      I.x = 0; I.z = sz; I.kurs = 0; I.sitzt = null; I.pose = null; I.poseZeit = 0; I.tempo = 0; kamW = Math.PI;
      meins.wurzel.visible = mitPferd; freund.wurzel.visible = mitFreundin; freundin.wurzel.visible = mitFreundin;
      if (!mitPferd) { M.setze(0, -400, 0); F.setze(4, -400, 0); }
      ich.setzeOutfit(KERN.spieler().outfit); ich.setzeHelm(true);
      setzAuf(ich, meins); if (mitFreundin) setzAuf(freundin, freund);
      meins.setzeKopfTief(0); freund.setzeKopfTief(0);
      kamera.userData.sprung = true;
      KERN.betrete(API);
      setzeHinweis(null);
      schritt(0.001, zeit);
      if (opt.vomHof) { modus = 'ritt'; beginne(); kamera.userData.sprung = true; return; }
      modus = 'karte';
      KERN.zeigeKarte('mitte', '<div class="klein">Ausritt zu zweit</div><h2>🌳 Ab ins Grüne!</h2><div class="details" style="text-align:left">' +
        'Du reitest <b>' + KERN.esc(mein.name) + '</b>, Lotte kommt auf <b>' + KERN.esc(ihr.name) + '</b> mit.' + (mitFohlen ? ' Dein Fohlen <b>' + KERN.esc(fo.name || '') + '</b> tobt frei nebenher!' : '') + '<br>' +
        '• <b>↑ ↓</b> schneller und langsamer (Schritt, Trab, Galopp), <b>← →</b> lenken. Auf dem iPad: Finger auflegen und ziehen.<br>' +
        '• Die Landschaft ist groß: See, Wälder mit Bergen, Felder, ein Bach, ein Dorf und eine Windmühle. Über zwölf Orten schwebt ein <b>goldener Stern</b>.<br>' +
        '• Unterwegs: <b>Tiere beobachten</b> (im Schritt kommst du näher), über <b>Baumstämme springen</b>, <b>Slalom</b>, <b>Ringstechen</b> und <b>Wettreiten</b> mit Lotte.<br>' +
        '• Wenn du anhältst, kannst du <b>absteigen</b> (Knopf rechts unten): dein Pferd <b>führen</b> oder grasen lassen, picknicken, angeln, Pilze sammeln, im Dorf ein Eis kaufen. Zu Fuß kannst du auch das <b>Pferd wechseln</b>.<br>' +
        '• Oben rechts ist der <b>Radar</b>: Das 🏡 zeigt immer, wo es nach Hause geht. Tippst du darauf, geht die <b>🗺️ Landkarte</b> auf (auch mit Taste K).<br>' +
        '• Zieht ein <b>⛈️ Gewitter</b> auf, heißt es: schnell nach Hause und die Pferde in den Stall!</div>',
        [{ text: 'Losreiten', aktion: beginne }, { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { var o2 = opt; raeumeAuf(); REITEN.heim(o2, null); } }]);
    },
    schritt: schritt, mitNacht: false,
    aktion: function () { if ((modus === 'ritt' || modus === 'fuss') && aktuell) aktuell.tun(); }, tipp: function () {},
    zurueck: function () { if ((modus === 'ritt' || modus === 'fuss') && dauer > 5) nachHause(); else { var o = opt; raeumeAuf(); REITEN.heim(o, null); } },
    verlaesst: function () { raeumeAuf(); },
    landkarte: zeigeLandkarte, tasteGedrueckt: function (code) { if (code === 'KeyK') zeigeLandkarte(); }, sturm: function (sek) { sturmIn = sek; return sturmLauf; },
    zustand: function () { return { M: M, F: F, I: I, B: B, FO: FO, aktuell: aktuell, zweit: zweitListe, getan: getan, steg: STEG, gefunden: gefunden, gesehen: gesehen, modus: modus, orte: ORTE, aepfel: aepfel, linien: linien, boden: boden, hoehe: hoehe, herden: herden, traktoren: traktoren, tore: tore, ringe: ringe, staemme: staemme, rennen: rennen, fuehrt: fuehrt, mein: mein, ihr: ihr, stuecke: stuecke, fallBaum: fallBaum, setze: function (m) { for (var k in m) { if (k === 'rennPause') rennPause = m[k]; } } }; },
    steigeAb: steigeAb, steigeAuf: steigeAuf, fuehre: fuehre, tausche: tausche
  };
  return API;
})();
