// ============================================================
//  PFERDEHOF  -  Stall mit Boxen, Vorratsraum, Reitladen, Weide,
//  Schrittmaschine, Longierzirkel und die Wege zu allen Reitplaetzen
// ============================================================
//  Himmelsrichtungen: x = Osten, z = Sueden.  Die Kamera schaut immer nach Norden.
WELTEN.hof = (function () {
  'use strict';
  var gebaut = false, szene, kamera, sonne;
  var S = null;                 // Spielerin: { x, z, kurs, phase, tempo, traegt, fuehrt, figur }
  var pferde = [];              // alle Pferde des Hofs
  var maedchen = [];            // die anderen Reitmaedchen
  var waende = [], kreise = []; // woran man nicht vorbeikommt
  var dach, suedWand, boxen = [], orte = {};
  var modus = 'frei';           // frei | pflege | longe | karte
  var zeit = 0, drinnen = 0;

  var STALL = { x0: -12, x1: 8, z0: -6.5, z1: 6.5, gang: 1.5 };
  var ORT = {
    start: [12, 3],
    training: { tor: [-20.5, 22], platz: [-52, 12, -22, 32] },
    turnier: { tor: [20.5, 22], platz: [22, 12, 52, 32] },
    longe: { tor: [-10, 24.6], mitte: [-10, 34], r: 8 },
    maschine: { tor: [12, 26.8], mitte: [12, 34], r: 6 },
    rennbahn: { tor: [-34, 44] },
    gelaende: { tor: [36, 44] },
    weide: { tor: [-17, -2], platz: [-48, -14, -18, 6] },
    futter: { hafer: [1.2, -5.6], heu: [4, -5.6], moehre: [6.8, -5.6] },
    laden: [4, 5.2], mist: [-16, -9],
    putzplatz: { mitte: [-9, 14.3] }, ausritt: { tor: [0, 46.5] }
  };

  // ---------- Bauen ----------
  function wand(x0, z0, x1, z1, h, farbe, eltern, ohneStoss) {
    var b = Math.max(0.18, Math.abs(x1 - x0)), t = Math.max(0.18, Math.abs(z1 - z0));
    var m = BAU.kasten(b, h, t, farbe, eltern || szene, (x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    if (!ohneStoss) waende.push([Math.min(x0, x1) - 0.09, Math.min(z0, z1) - 0.09, Math.max(x0, x1) + 0.09, Math.max(z0, z1) + 0.09]);
    return m;
  }
  function zaunRechteck(r, tor, farbe) {
    // r = [x0, z0, x1, z1], tor = { seite: 'o'|'w'|'n'|'s', bei, breit }
    var x0 = r[0], z0 = r[1], x1 = r[2], z1 = r[3], teile = [];
    function seite(a, b, name) {
      if (tor && tor.seite === name) {
        var laengs = name === 'n' || name === 's';
        var m1 = laengs ? [tor.bei - tor.breit / 2, a[1]] : [a[0], tor.bei - tor.breit / 2];
        var m2 = laengs ? [tor.bei + tor.breit / 2, a[1]] : [a[0], tor.bei + tor.breit / 2];
        teile.push([a, m1], [m2, b]);
      } else teile.push([a, b]);
    }
    seite([x0, z0], [x1, z0], 'n'); seite([x0, z1], [x1, z1], 's'); seite([x0, z0], [x0, z1], 'w'); seite([x1, z0], [x1, z1], 'o');
    teile.forEach(function (t) {
      szene.add(BAU.zaun(t, { farbe: farbe }));
      waende.push([Math.min(t[0][0], t[1][0]) - 0.12, Math.min(t[0][1], t[1][1]) - 0.12, Math.max(t[0][0], t[1][0]) + 0.12, Math.max(t[0][1], t[1][1]) + 0.12]);
    });
  }
  function rundZaun(mx, mz, r, torWinkel, farbe) {
    var pkt = [], n = 28, luecke = 2.4 / r;
    for (var i = 0; i <= n; i++) {
      var w = torWinkel + luecke / 2 + (Math.PI * 2 - luecke) * i / n;
      pkt.push([mx + Math.sin(w) * r, mz + Math.cos(w) * r]);
    }
    szene.add(BAU.zaun(pkt, { farbe: farbe, abstand: 2 }));
    kreise.push([mx, mz, r, torWinkel, luecke]);
  }

  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 34, nebelNah: 70, nebelFern: 260 });
    kamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.3, 1600);

    // Boden
    var wiese = BAU.netz(new THREE.PlaneGeometry(1600, 1600), 0x7cc35a, szene, 0, 0, 10);
    wiese.rotation.x = -Math.PI / 2; wiese.castShadow = false;
    function flaeche(x0, z0, x1, z1, farbe, y) {
      var f = BAU.netz(new THREE.PlaneGeometry(x1 - x0, z1 - z0), farbe, szene, (x0 + x1) / 2, y || 0.02, (z0 + z1) / 2);
      f.rotation.x = -Math.PI / 2; f.castShadow = false;
      return f;
    }
    flaeche(-16, -9, 18, 11, 0xd9c9a3);                       // Hofplatz rund um den Stall
    flaeche(-3, 11, 3, 78, 0xd9c9a3);                         // Weg nach Sueden, durch das Tor hinaus ins Gruene
    flaeche(-22, 20, 22, 24, 0xd9c9a3);                       // Querweg zu den Plaetzen
    flaeche(-36, 42, 38, 46, 0xd9c9a3);                       // Weg zu Rennbahn und Gelaende
    flaeche(STALL.x0, STALL.z0, STALL.x1, STALL.z1, 0xb9a98a, 0.03);   // Stallboden

    baueStall();
    baueAussen();

    // Spielerin
    S = { x: ORT.start[0], z: ORT.start[1], kurs: -Math.PI / 2, phase: 0, tempo: 0, traegt: null, fuehrt: null };
    S.figur = baueFigur(KERN.spieler().outfit, { helm: false });
    szene.add(S.figur.wurzel);
    S.last = new THREE.Group(); S.figur.gelenke.rumpf.add(S.last); S.last.position.set(0, 0.2, 0.3);
    S.strick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x3a2a1c }));
    S.strick.frustumCulled = false; S.strick.visible = false;
    szene.add(S.strick);

    // Markierung fuer die naechste Aktion
    orte.zeiger = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f }));
    orte.zeiger.rotation.x = Math.PI; orte.zeiger.visible = false;
    szene.add(orte.zeiger);

    bauePferde();
    zeigeMeins();
    baueMaedchen();
    var ctx = { szene: szene, waende: waende, kreise: kreise, ORT: ORT, S: S, pferde: pferde, karte: karte, zeigeZustand: zeigeZustand,
      frei: function () { KERN.schliesseKarte(); modus = 'frei'; }, setzeModus: function (m) { modus = m; },
      inBoxVon: inBoxVon, boxen: boxen, fuettereWagen: fuettereWagen, mistModell: function () { return orte.mistModell; }, setzeKamera: function (k) { kamFest = k; kamSprung = true; }, bringeHeim: bringeHeim };
    HOFLEBEN.baue(ctx);
    STURM.baueHof(ctx);
    HOFTAG.baue(ctx);
    gebaut = true;
  }

  function baueStall() {
    var HOLZ = 0x9a6b3f, HOLZ_D = 0x7a4a2a, WAND = 0xe9dcc3, H = 2.9;
    var g = STALL.gang;
    // Aussenwaende
    wand(STALL.x0, STALL.z0, STALL.x1, STALL.z0, H, WAND);
    wand(STALL.x0, STALL.z1, STALL.x1, STALL.z1, 1.2, WAND);
    suedWand = wand(STALL.x0, STALL.z1, STALL.x1, STALL.z1, H - 1.2, WAND, null, true);
    suedWand.position.y = 1.2 + (H - 1.2) / 2;
    [STALL.x0, STALL.x1].forEach(function (x) {
      wand(x, STALL.z0, x, -g, H, WAND); wand(x, g, x, STALL.z1, H, WAND);
      BAU.kasten(0.3, 0.3, 2 * g + 0.4, HOLZ_D, szene, x, H - 0.15, 0);       // Sturz ueber dem Tor
    });
    // Boxen: 3 im Norden, 3 im Sueden
    for (var i = 0; i < 6; i++) {
      var nord = i < 3, xc = -10 + 4 * (i % 3), v = nord ? -1 : 1;
      var zVorn = v * g, zHinten = nord ? STALL.z0 : STALL.z1;
      var front = new THREE.Group(); szene.add(front);      // wird beim Pflegen ausgeblendet
      wand(xc - 2, zVorn, xc - 0.8, zVorn, 1.4, HOLZ, front);
      wand(xc + 0.8, zVorn, xc + 2, zVorn, 1.4, HOLZ, front);
      // Gitter oben
      for (var s = 0; s < 2; s++) {
        var gx0 = s ? xc + 0.8 : xc - 2;
        for (var k = 0; k < 5; k++) BAU.walze(0.02, 0.02, 0.7, 0x555555, front, gx0 + 0.12 + k * 0.24, 1.75, zVorn, 6);
        BAU.kasten(1.2, 0.06, 0.08, HOLZ_D, front, gx0 + 0.6, 2.12, zVorn);
      }
      if (i % 3 < 2) wand(xc + 2, zVorn, xc + 2, zHinten, 1.7, HOLZ);
      // Trog (links hinten) und Heuraufe (rechts hinten)
      var zt = zHinten - v * 0.55;
      var trog = new THREE.Group(); trog.position.set(xc - 1.4, 0, zt); szene.add(trog);
      BAU.kasten(0.9, 0.3, 0.5, 0x6b6f76, trog, 0, 0.75, 0);
      BAU.kasten(0.1, 0.6, 0.1, 0x55595f, trog, -0.35, 0.3, 0); BAU.kasten(0.1, 0.6, 0.1, 0x55595f, trog, 0.35, 0.3, 0);
      var hafer = BAU.kasten(0.78, 0.06, 0.4, 0xd9b96a, trog, 0, 0.9, 0); hafer.visible = false;
      var raufe = new THREE.Group(); raufe.position.set(xc + 1.4, 0, zHinten - v * 0.3); szene.add(raufe);
      for (var st = 0; st < 6; st++) { var stange = BAU.walze(0.02, 0.02, 0.9, 0x55595f, raufe, -0.4 + st * 0.16, 1.5, -v * 0.18, 6); stange.rotation.x = v * 0.35; }
      BAU.kasten(0.95, 0.05, 0.05, 0x55595f, raufe, 0, 1.92, -v * 0.33);
      var heu = BAU.netz(new THREE.DodecahedronGeometry(0.42, 0), 0xcdb65a, raufe, 0, 1.55, -v * 0.05); heu.scale.set(1.05, 0.9, 0.5); heu.visible = false;
      // Einstreu: ein Strohteppich, der mit dem Zustand dicker oder duenner wird
      var stroh = BAU.netz(new THREE.PlaneGeometry(3.7, 4.7), 0xe2c96a, szene, xc, 0.05, (zVorn + zHinten) / 2);
      stroh.rotation.x = -Math.PI / 2; stroh.castShadow = false;
      boxen.push({ nr: i, xc: xc, v: v, zVorn: zVorn, zHinten: zHinten, zc: (zVorn + zHinten) / 2, pferd: null, front: front, hafer: hafer, heu: heu, stroh: stroh, mist: [],
        trog: [xc - 1.4, zt], raufe: [xc + 1.4, zHinten - v * 0.5] });
    }
    // Trennwand zu den Raeumen und die Raeume selbst
    wand(0, STALL.z0, 0, -g, H, WAND); wand(0, g, 0, STALL.z1, H, WAND);
    [-1, 1].forEach(function (v) {
      wand(0, v * g, 3.1, v * g, H, WAND); wand(4.9, v * g, STALL.x1, v * g, H, WAND);
      BAU.kasten(1.8, 0.5, 0.2, WAND, szene, 4, H - 0.25, v * g);
    });
    var t1 = BAU.tafel('Vorratsraum', 0.38, { farbe: '#7a3b12' }); t1.position.set(4, 2.3, -g + 0.12); szene.add(t1);
    var t2 = BAU.tafel('Reitladen', 0.38, { farbe: '#7a3b12' }); t2.position.set(4, 2.3, g - 0.12); t2.rotation.y = Math.PI; szene.add(t2);
    // Vorratsraum: Hafersaecke, Heuballen, Moehrenkiste
    var F = ORT.futter;
    for (var sa = 0; sa < 3; sa++) { var sack = BAU.netz(new THREE.CapsuleGeometry(0.28, 0.4, 4, 8), 0xd8c08a, szene, F.hafer[0] - 0.35 + sa * 0.38, 0.45 + (sa === 1 ? 0.05 : 0), F.hafer[1] - 0.2); sack.rotation.z = (sa - 1) * 0.12; }
    var heuA = BAU.kasten(1.3, 0.6, 0.8, 0xd3bb55, szene, F.heu[0], 0.3, F.heu[1] - 0.2), heuB = BAU.kasten(1.3, 0.6, 0.8, 0xc9b24e, szene, F.heu[0] + 0.1, 0.9, F.heu[1] - 0.25);
    MODELLE3D.setze('heueckig', szene, { x: F.heu[0], z: F.heu[1] - 0.2, masse: [1.4, 1.2, 0.9], statt: [heuA, heuB] });
    BAU.kasten(1.0, 0.5, 0.7, 0x9a6b3f, szene, F.moehre[0], 0.25, F.moehre[1] - 0.2);
    for (var mo = 0; mo < 7; mo++) { var moe = BAU.netz(new THREE.ConeGeometry(0.06, 0.32, 6), 0xf08a24, szene, F.moehre[0] - 0.35 + mo * 0.12, 0.56, F.moehre[1] - 0.2 + (mo % 2) * 0.12); moe.rotation.z = Math.PI / 2 + mo; }
    waende.push([0.2, STALL.z0, STALL.x1, -5.3]);
    [['🌾 Hafer', F.hafer], ['Heu', F.heu], ['🥕 Möhren', F.moehre]].forEach(function (e) {
      var t = BAU.tafel(e[0], 0.3, { farbe: '#7a3b12' }); t.position.set(e[1][0], 1.9, STALL.z0 + 0.12); szene.add(t);
    });
    // Reitladen: Theke, Regal mit bunten Sachen
    var thekeAlt = [BAU.kasten(4.5, 1.0, 0.6, 0x9a6b3f, szene, 4, 0.5, 5.6)];
    waende.push([1.7, 5.2, 6.3, STALL.z1]);
    ['#e84393', '#1f6fd0', '#27ae60', '#f1c40f', '#8e44ad', '#f5f5f5'].forEach(function (f, k) {
      thekeAlt.push(BAU.kasten(0.45, 0.3, 0.3, f, szene, 2.2 + k * 0.72, 1.17, 5.7));
    });
    MODELLE3D.setze('theke', szene, { x: 4, z: 5.78, dreh: Math.PI / 2, masse: [1.3, 2.3, 4.3], statt: thekeAlt, schatten: false });
    // Dach (wird ausgeblendet, wenn man im Stall ist)
    dach = new THREE.Group(); szene.add(dach);
    var breit = STALL.x1 - STALL.x0 + 1.2, tief = (STALL.z1 - STALL.z0) / 2 + 0.7, hoch = 2.4;
    var schraeg = Math.hypot(tief, hoch);
    [-1, 1].forEach(function (v) {
      var d = BAU.kasten(breit, 0.14, schraeg, 0xa9432f, dach, (STALL.x0 + STALL.x1) / 2, H + hoch / 2, v * tief / 2);
      d.rotation.x = v * Math.atan2(hoch, tief);
    });
    [STALL.x0, STALL.x1].forEach(function (x) {
      var giebel = new THREE.Shape(); giebel.moveTo(-tief + 0.6, 0); giebel.lineTo(tief - 0.6, 0); giebel.lineTo(0, hoch - 0.2); giebel.closePath();
      var gm = BAU.netz(new THREE.ShapeGeometry(giebel), new THREE.MeshStandardMaterial({ color: WAND, side: THREE.DoubleSide, roughness: 0.9 }), dach, x, H, 0);
      gm.rotation.y = Math.PI / 2;
    });
    var dachAlt = dach.children.slice();
    var schild = BAU.tafel('🐴 Stall', 0.7, { farbe: '#7a3b12' }); schild.position.set(STALL.x1 + 0.12, 3.6, 0); schild.rotation.y = Math.PI / 2; dach.add(schild);
    // Stall von aussen als 3D-Modell (nur sichtbar, solange man draussen ist)
    MODELLE3D.setze('stall', dach, { x: (STALL.x0 + STALL.x1) / 2, z: 0, masse: [21.8, 6.8, 16.4], statt: dachAlt, fertig: function (gr, k) {
      schild.position.set(STALL.x1 + 0.9, 4.3, 0);
      // Das Modell hat nur an einer Seite ein Tor: die Osthälfte gespiegelt noch einmal als Westhälfte nehmen
      var mitte = (STALL.x0 + STALL.x1) / 2, k2 = k.clone(); k2.scale.x = -k.scale.x; gr.add(k2);
      function halb(o, ebene) { o.traverse(function (t) { if (t.isMesh) { t.material = t.material.clone(); t.material.clippingPlanes = [ebene]; t.material.clipShadows = true; } }); }
      halb(k, new THREE.Plane(new THREE.Vector3(1, 0, 0), -mitte)); halb(k2, new THREE.Plane(new THREE.Vector3(-1, 0, 0), mitte));
    } });
    waende.push([STALL.x0, STALL.z0 - 0.75, STALL.x1, STALL.z0], [STALL.x0, STALL.z1, STALL.x1, STALL.z1 + 0.75]);
  }

  function baueAussen() {
    var SAND = 0xe3cf9c;
    function sandPlatz(r) {
      var f = BAU.netz(new THREE.PlaneGeometry(r[2] - r[0], r[3] - r[1]), SAND, szene, (r[0] + r[2]) / 2, 0.025, (r[1] + r[3]) / 2);
      f.rotation.x = -Math.PI / 2; f.castShadow = false;
    }
    // Trainingsplatz (Westen) und Turnierplatz (Osten)
    sandPlatz(ORT.training.platz); zaunRechteck(ORT.training.platz, { seite: 'o', bei: 22, breit: 4 });
    sandPlatz(ORT.turnier.platz); zaunRechteck(ORT.turnier.platz, { seite: 'w', bei: 22, breit: 4 });
    var w1 = BAU.wegweiser('Trainingsplatz'); w1.position.set(-26, 0, 11.6); szene.add(w1);
    var w2 = BAU.wegweiser('🏆 Turnierplatz', { grund: '#fff3c4' }); w2.position.set(26.5, 0, 11.6); szene.add(w2);
    if (typeof baueHindernis === 'function') {
      [[-44, 17, 'steil', 0.7, 0.4], [-33, 26, 'kreuz', 0.6, -0.3], [-40, 28, 'oxer', 0.8, 1.2], [30, 17, 'steil', 0.9, 0.2], [42, 20, 'oxer', 0.9, 1.4], [36, 28, 'mauer', 0.9, -0.2], [46, 28, 'kreuz', 0.8, 0.8]].forEach(function (h, i) {
        try { var hd = baueHindernis(h[2], h[3], i + 1); hd.gruppe.position.set(h[0], 0, h[1]); hd.gruppe.rotation.y = h[4]; szene.add(hd.gruppe); } catch (e) { /* ohne Deko */ }
      });
    }
    // kleine Tribuene und Fahnen am Turnierplatz
    var tribAlt = [];
    for (var st = 0; st < 3; st++) tribAlt.push(BAU.kasten(18, 0.5, 1.2, 0xb9b2a4, szene, 37, 0.25 + st * 0.5, 34.2 + st * 1.2));
    waende.push([28, 33.6, 46, 38.6]);
    [31, 37, 43].forEach(function (tx, i) { MODELLE3D.setze('tribuene', szene, { x: tx, z: 36.1, dreh: Math.PI / 2, masse: [5.0, 4.2, 5.9], statt: i ? [] : tribAlt }); });
    [[25.5, 34.6, Math.PI / 2], [48.5, 34.6, Math.PI / 2], [54.2, 17, Math.PI], [54.2, 27, Math.PI]].forEach(function (z) { MODELLE3D.setze('zuschauer', szene, { x: z[0], z: z[1], dreh: z[2], hoehe: 1.75 }); });
    MODELLE3D.setze('richter', szene, { x: 54.6, z: 22, dreh: -Math.PI / 2, hoehe: 3.0 }); kreise.push([54.6, 22, 1.3, 0, 0]);
    ['#e5412d', '#f1c40f', '#1f6fd0', '#27ae60', '#e84393'].forEach(function (f, i) { var fl = BAU.flagge(f, 3.4); fl.position.set(24 + i * 6.5, 0, 11.4); szene.add(fl); });

    // Longierzirkel und Schrittmaschine
    var L = ORT.longe, M = ORT.maschine;
    [[L, 0xe3cf9c], [M, 0xd6c79e]].forEach(function (e) {
      var k = BAU.netz(new THREE.CircleGeometry(e[0].r, 40), e[1], szene, e[0].mitte[0], 0.03, e[0].mitte[1]); k.rotation.x = -Math.PI / 2; k.castShadow = false;
      rundZaun(e[0].mitte[0], e[0].mitte[1], e[0].r, Math.PI, e === undefined ? 0 : 0x8a5a33);
    });
    var w3 = BAU.wegweiser('Longierzirkel', { hoehe: 0.7, fuss: 1.9 }); w3.position.set(L.mitte[0] - 4.5, 0, L.tor[1] - 0.2); szene.add(w3);
    var w4 = BAU.wegweiser('Schrittmaschine', { hoehe: 0.7, fuss: 1.9 }); w4.position.set(M.mitte[0] + 4.8, 0, M.tor[1] - 0.2); szene.add(w4);
    orte.karussell = new THREE.Group(); orte.karussell.position.set(M.mitte[0], 0, M.mitte[1]); szene.add(orte.karussell);
    BAU.walze(0.25, 0.3, 3.2, 0x6b6f76, szene, M.mitte[0], 1.6, M.mitte[1]);
    for (var a = 0; a < 4; a++) {
      var arm = new THREE.Group(); arm.rotation.y = a * Math.PI / 2; orte.karussell.add(arm);
      BAU.kasten(0.1, 0.1, M.r - 0.6, 0x8a8f96, arm, 0, 3.0, (M.r - 0.6) / 2);
      BAU.kasten(0.06, 2.1, 2.0, 0x9aa0a8, arm, 0, 1.9, M.r - 2.2).material = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, transparent: true, opacity: 0.55 });
    }
    var huetchen = BAU.netz(new THREE.ConeGeometry(1.2, 0.7, 12), 0xa9432f, szene, M.mitte[0], 3.5, M.mitte[1]);
    huetchen.castShadow = true;

    // Weide
    zaunRechteck(ORT.weide.platz, { seite: 'o', bei: -2, breit: 3 }, 0x8a5a33);
    var w5 = BAU.wegweiser('Weide', { hoehe: 0.7, fuss: 1.9 }); w5.position.set(-20.5, 0, -14.4); szene.add(w5);
    // Misthaufen und Schubkarren-Platz
    var mist = BAU.netz(new THREE.SphereGeometry(2.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x6b4a2a, szene, ORT.mist[0], 0, ORT.mist[1]); mist.scale.set(1, 0.55, 0.8);
    MODELLE3D.setze('misthaufen', szene, { x: ORT.mist[0], z: ORT.mist[1], masse: [4.3, 2.7, 3.7], statt: [mist], fertig: function (g) { orte.mistModell = g; } });
    kreise.push([ORT.mist[0], ORT.mist[1], 1.9, 0, 0]);

    // Tore zur Rennbahn und ins Gelaende
    function torbogen(x, z, text, farbe) {
      var g = new THREE.Group(); g.position.set(x, 0, z); szene.add(g);
      BAU.walze(0.18, 0.2, 4.2, 0x7a4a2a, g, -2.6, 2.1, 0); BAU.walze(0.18, 0.2, 4.2, 0x7a4a2a, g, 2.6, 2.1, 0);
      BAU.kasten(6.2, 1.1, 0.2, farbe, g, 0, 4.2, 0);
      var t = BAU.tafel(text, 0.7, { grund: null, farbe: '#ffffff', schrift: 60 }); t.position.set(0, 4.2, -0.12); t.rotation.y = Math.PI; g.add(t);
      var t2 = t.clone(); t2.position.z = 0.12; t2.rotation.y = 0; g.add(t2);
      waende.push([x - 2.8, z - 0.2, x - 2.4, z + 0.2], [x + 2.4, z - 0.2, x + 2.8, z + 0.2]);
    }
    torbogen(ORT.rennbahn.tor[0], ORT.rennbahn.tor[1] + 2.5, '🏁 Galopprennbahn', 0x2f6fb5);
    torbogen(ORT.gelaende.tor[0], ORT.gelaende.tor[1] + 2.5, '🌲 Geländestrecke', 0x2f7d3a);
    szene.add(BAU.zaun([[-60, 47], [-37, 47]], { farbe: 0x8a5a33 })); szene.add(BAU.zaun([[-31, 47], [-3.4, 47]], { farbe: 0x8a5a33 })); szene.add(BAU.zaun([[3.4, 47], [33, 47]], { farbe: 0x8a5a33 })); szene.add(BAU.zaun([[39, 47], [62, 47]], { farbe: 0x8a5a33 }));
    waende.push([-60, 46.8, -36.8, 47.2], [-31.2, 46.8, -3.2, 47.2], [3.2, 46.8, 33.2, 47.2], [38.8, 46.8, 62, 47.2]);
    torbogen(0, 47, '🌳 Ausritt ins Grüne', 0x6a9a2a);
    szene.add(BAU.zaun([[-3.4, 47], [-3.4, 56]], { farbe: 0x8a5a33 })); szene.add(BAU.zaun([[3.4, 47], [3.4, 56]], { farbe: 0x8a5a33 }));
    bauePutzplatz();

    // Baeume rundherum, Blumen, Baenke, Heuballen
    var baeume = [], zf = 3;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (var b = 0; b < 90; b++) {
      var bx = -78 + zuf() * 156, bz = -42 + zuf() * 118;
      var imHof = bx > -56 && bx < 58 && bz > -18 && bz < 50;
      if (imHof) continue;
      if ((bz < -27 && bz > -40) || (bx > 6 && bx < 24 && bz < -12) || (bz > 47 && (Math.abs(bx + 34) < 5 || Math.abs(bx - 36) < 5)) || (bz > 62 && bx < 2)) continue;
      baeume.push([bx, 0, bz, 0.9 + zuf() * 0.9, zuf() < 0.35 ? 1 : 0]);
    }
    [[15, -7], [0, -12], [-6, -12], [5, -13], [-7, 49.5], [8, 49.5], [-50, 38], [52, 38], [-56, 8], [56, 6], [-24, -18], [25.5, -16]].forEach(function (p, i) { baeume.push([p[0], 0, p[1], 0.8 + (i % 3) * 0.15, i % 5 === 4 ? 1 : 0]); kreise.push([p[0], p[1], 0.45, 0, 0]); });
    szene.add(BAU.wald(baeume));
    var blumenFarben = [0xff6fae, 0xffe36b, 0xffffff, 0xb07cff];
    var blGeo = new THREE.SphereGeometry(0.09, 6, 4), blumen = new THREE.InstancedMesh(blGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 160), d = new THREE.Object3D();
    for (var f = 0; f < 160; f++) {
      var fx, fz;
      do { fx = -58 + zuf() * 116; fz = -16 + zuf() * 64; } while ((fx > -17 && fx < 19 && fz > -10 && fz < 12) || (Math.abs(fz - 22) < 11 && Math.abs(fx) > 21) || (fz > 24 && fz < 43 && fx > -19 && fx < 19) || (fx < -17 && fz < 7) || (fx > 17 && fx < 34 && fz > -11 && fz < 11));
      d.position.set(fx, 0.12, fz); d.updateMatrix(); blumen.setMatrixAt(f, d.matrix); blumen.setColorAt(f, new THREE.Color(blumenFarben[f % 4]));
    }
    szene.add(blumen);
    // Bank und Heuballen am Hofplatz, Wassertrog
    var bankAlt = [BAU.kasten(2.0, 0.1, 0.5, 0x9a6b3f, szene, 12, 0.5, 8.6), BAU.kasten(2.0, 0.5, 0.08, 0x9a6b3f, szene, 12, 0.8, 8.85),
      BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, szene, 11.2, 0.25, 8.6), BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, szene, 12.8, 0.25, 8.6)];
    waende.push([11, 8.3, 13, 9]);
    MODELLE3D.setze('bank', szene, { x: 12, z: 8.65, dreh: Math.PI, breite: 2.1, statt: bankAlt });
    var ballen = BAU.walze(0.7, 0.7, 1.2, 0xd3bb55, szene, -14, 0.7, 4.5, 14); ballen.rotation.z = Math.PI / 2; kreise.push([-14, 4.5, 0.9, 0, 0]);
    MODELLE3D.setze('heurund', szene, { x: -14, z: 4.5, hoehe: 1.45, statt: [ballen] });
    MODELLE3D.setze('heueckig', szene, { x: -14.2, z: 6.6, dreh: 0.3, hoehe: 0.9 }); kreise.push([-14.2, 6.6, 0.8, 0, 0]);
    var trogAlt = [BAU.kasten(2.2, 0.6, 0.8, 0x6b6f76, szene, 13.5, 0.3, -3), BAU.kasten(2.0, 0.05, 0.6, 0x4aa3df, szene, 13.5, 0.58, -3)]; waende.push([12.4, -3.4, 14.6, -2.6]);
    MODELLE3D.setze('wassertrog', szene, { x: 13.5, z: -3, dreh: Math.PI / 2, masse: [1.0, 0.75, 2.3], statt: trogAlt });
    // Sattelbock und Putzkiste vor dem Stalltor, Apfelbaeume am Wohnhaus
    MODELLE3D.setze('sattelbock', szene, { x: 9.3, z: 4.2, hoehe: 1.25 }); MODELLE3D.setze('putzkiste', szene, { x: 9.2, z: 5.6, dreh: -Math.PI / 2, hoehe: 0.75 });
    waende.push([8.6, 3.4, 9.9, 6.2]);
    [[19.6, -19.5, 4.6], [6.6, -18.6, 4.2], [23.4, -13.6, 3.9]].forEach(function (a, i) { MODELLE3D.setze('apfelbaum', szene, { x: a[0], z: a[1], dreh: i * 2.1, hoehe: a[2] }); kreise.push([a[0], a[1], 0.45, 0, 0]); });
  }

  // Putzplatz draussen: Anbindebalken, Wasserschlauch, Putzkiste
  function bauePutzplatz() {
    var m = ORT.putzplatz.mitte, x = m[0], z = m[1], HOLZ = 0x7a4a2a;
    var f = BAU.netz(new THREE.PlaneGeometry(8, 6), 0xb9b2a4, szene, x, 0.022, z + 0.4); f.rotation.x = -Math.PI / 2; f.castShadow = false;
    for (var i = 0; i < 5; i++) { var fu = BAU.netz(new THREE.PlaneGeometry(8, 0.05), 0x9a9488, szene, x, 0.026, z - 2.2 + i * 1.3); fu.rotation.x = -Math.PI / 2; fu.castShadow = false; }
    [-2.6, 2.6].forEach(function (dx) { BAU.walze(0.09, 0.1, 1.3, HOLZ, szene, x + dx, 0.65, z - 2.1, 8); });
    var balken = BAU.walze(0.07, 0.07, 5.6, HOLZ, szene, x, 1.2, z - 2.1, 8); balken.rotation.z = Math.PI / 2;
    waende.push([x - 2.8, z - 2.25, x + 2.8, z - 1.95]);
    // Schlauch an einem Pfosten, Eimer, Putzkiste
    BAU.walze(0.07, 0.08, 1.5, 0x6b6f76, szene, x - 3.5, 0.75, z - 2.1, 8);
    var rolle = BAU.netz(new THREE.TorusGeometry(0.26, 0.07, 8, 16), 0x2e9e5b, szene, x - 3.5, 1.05, z - 1.98);
    BAU.kasten(0.12, 0.1, 0.1, 0xd4a017, szene, x - 3.5, 1.42, z - 2.0);
    BAU.walze(0.2, 0.16, 0.34, 0x2f6fb5, szene, x + 3.4, 0.17, z - 1.6, 10);
    var kisteAlt = BAU.kasten(0.7, 0.4, 0.45, 0xc0392b, szene, x + 3.3, 0.2, z - 0.4);
    MODELLE3D.setze('putzkiste', szene, { x: x + 3.3, z: z - 0.4, dreh: -Math.PI / 2, hoehe: 0.7, statt: [kisteAlt] });
    kreise.push([x - 3.5, z - 2.1, 0.3, 0, 0], [x + 3.35, z - 1.0, 0.75, 0, 0]);
    var w = BAU.wegweiser('🚿 Putzplatz', { hoehe: 0.7, fuss: 1.9 }); w.position.set(x - 5.4, 0, z - 2.4); szene.add(w);
  }
  var PUTZ = null;
  function putzeDraussen(P) {
    var m = ORT.putzplatz.mitte;
    if (S.reitet) steigeAb(true);
    S.fuehrt = null;
    P.ort = 'putzplatz'; P.x = m[0]; P.z = m[1] - 0.6; P.kurs = Math.PI / 2; P.tempo = 0; P.gang = 'steh';
    P.tier.setzeSattel(false); P.tier.setzeZaum(true, false);
    PUTZ = { xc: m[0], v: -1, zVorn: P.z + 3.4, zHinten: P.z - 1.4, mist: [], aussen: true, fertig: function (pf) { P.ort = 'hand'; S.fuehrt = P; P.tempo = 0; } };
    PFLEGE.start(API, P, PUTZ);
  }

  // ---------- Pferde ----------
  function bauePferde() {
    HOF_PFERDE.forEach(function (def, i) {
      var st = STAND.pferd(def.id);
      var tier = HERDE.bauePferd({ fell: def.fell, saat: i + 2 });
      tier.setzeSattel(false); tier.setzeZaum(false);
      szene.add(tier.wurzel);
      var P = { def: def, st: st, tier: tier, ort: 'box', box: boxen[i], x: 0, z: 0, kurs: 0, phase: i, tempo: 0, frisst: 0, blick: 0, winkel: 0, gang: 'steh', schildText: '' };
      boxen[i].pferd = P;
      P.schild = null;
      inBox(P);
      zeigeZustand(P, true);
      pferde.push(P);
    });
  }
  // ---------- dein eigenes Pferd: goldene Box, Stern über dem Pferd ----------
  var meinZeichen = null, meinStern = null;
  function meinPferd() { return pferde.filter(function (P) { return STAND.istMeins(P.def.id); })[0] || pferde[0]; }
  function zeigeMeins() {
    var P = meinPferd(), b = P.box, i;
    if (!meinZeichen) {
      meinZeichen = new THREE.Group(); szene.add(meinZeichen);
      var GOLD = new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0xf2a500, emissiveIntensity: 0.35, roughness: 0.4 });
      // goldener Rahmen um die Tür, goldene Schwelle, Wimpel
      [-0.86, 0.86].forEach(function (x) { BAU.kasten(0.1, 2.25, 0.1, GOLD, meinZeichen, x, 1.12, 0.06).castShadow = false; });
      BAU.kasten(1.82, 0.1, 0.1, GOLD, meinZeichen, 0, 2.25, 0.06).castShadow = false;
      var sw = BAU.netz(new THREE.PlaneGeometry(1.9, 0.9), GOLD, meinZeichen, 0, 0.03, 0.5); sw.rotation.x = -Math.PI / 2; sw.castShadow = false;
      for (i = 0; i < 9; i++) { var w = BAU.netz(new THREE.ConeGeometry(0.11, 0.24, 3), [0xe84393, 0xf2c230, 0x3f8fd6][i % 3], meinZeichen, -1.76 + i * 0.44, 2.36 - Math.sin(i / 8 * Math.PI) * 0.12, 0.1); w.rotation.x = Math.PI; w.scale.z = 0.15; w.castShadow = false; }
      meinZeichen.userData.stern = BAU.netz(new THREE.OctahedronGeometry(0.2), GOLD, meinZeichen, 0, 2.62, 0.1); meinZeichen.userData.stern.scale.z = 0.35; meinZeichen.userData.stern.castShadow = false;
      meinStern = BAU.schwebeText('⭐', 0.42, { grund: null, schrift: 90 }); szene.add(meinStern);
    }
    meinZeichen.position.set(b.xc, 0, b.zVorn); meinZeichen.rotation.y = b.v < 0 ? 0 : Math.PI;
  }
  function frageMeins(B) {
    var alt = meinPferd();
    karte('<h2>⭐ ' + B.def.name + ' soll dein Pferd sein?</h2><div class="details">Dann kümmerst du dich ab jetzt um <b>' + B.def.name + '</b> und um diese Box: füttern, putzen, ausmisten.<br>Um <b>' + alt.def.name + '</b> kümmert sich dann ' + STAND.betreuer(alt.def.id) + '.</div>',
      [{ text: '⭐ Ja, ' + B.def.name + ' ist jetzt mein Pferd', aktion: function () {
        STAND.daten.meins = B.def.id; STAND.versorge(alt.st); STAND.speichere();
        pferde.forEach(function (Q) { zeigeZustand(Q, true); }); zeigeMeins();
        KERN.schliesseKarte(); modus = 'frei'; KERN.klang('perfekt'); KERN.meldung('⭐ ' + B.def.name + ' ist jetzt dein Pferd!', 'perfekt');
      } }]);
  }
  function inBox(P) {
    var b = P.box;
    P.ort = 'box'; P.x = b.xc; P.z = b.zc + b.v * 0.9; P.kurs = Math.PI / 2; P.tempo = 0; P.gang = 'steh';
    P.tier.setzeSattel(false); P.tier.setzeZaum(false);
  }
  // Fell, Ausruestung, Box und Schild an den gespeicherten Zustand anpassen
  function zeigeZustand(P, alles) {
    var st = P.st, b = P.box;
    if (alles) { P.tier.setzeSchmutz(st.schmutz); P.tier.setzeAusruestung(st.ausruestung); }
    b.stroh.material = BAU.mat(st.stroh > 0.66 ? 0xe8cf6e : st.stroh > 0.33 ? 0xcdb565 : 0xa8956a);
    b.hafer.visible = (st.hafer || 0) > 0; b.heu.visible = (st.heu || 0) > 0;
    // Mistaepfel in der Box
    var soll = Math.round(st.mist * 8);
    while (b.mist.length < soll) {
      var k = b.mist.length;
      var m = BAU.netz(new THREE.DodecahedronGeometry(0.16, 0), 0x4a3320, szene, b.xc - 1.5 + ((k * 37) % 30) / 10, 0.13, b.zc - b.v * (0.2 + ((k * 53) % 17) / 10));
      m.scale.y = 0.6; b.mist.push(m);
    }
    while (b.mist.length > soll) szene.remove(b.mist.pop());
    var sauber = Math.round((1 - st.schmutz) * 100), satt = Math.round((1 - st.hunger) * 100);
    var mein = STAND.istMeins(P.def.id);
    var text = mein ? '⭐ Dein Pferd ⭐\n' + P.def.name + HOFLEBEN.zeichen(P) + '\n🧽 ' + sauber + '%  🍎 ' + satt + '%' : P.def.name + '\n' + STAND.betreuer(P.def.id) + ' kümmert sich';
    if (text !== P.schildText) {
      P.schildText = text;
      if (P.schild) { szene.remove(P.schild); P.schild.material.map.dispose(); P.schild.material.dispose(); }
      P.schild = BAU.schwebeText(text, mein ? 0.95 : 0.5, mein ? { schrift: 40, grund: 'rgba(255,236,160,0.96)' } : { schrift: 36 });
      P.schild.position.set(b.xc, mein ? 2.95 : 2.7, b.zVorn);
      szene.add(P.schild);
    }
    P.schild.visible = !P.versteckt;
  }
  function pferdDaten(P) {
    return { id: P.def.id, name: P.def.name, fell: P.def.fell, def: P.def, ausruestung: P.st.ausruestung, laune: STAND.laune(P.def.id), schmutz: P.st.schmutz };
  }

  function bewegePferde(dt) {
    pferde.forEach(function (P) {
      var t = P.tier, alt = { x: P.x, z: P.z };
      if (P.ort === 'box') {
        P.frisst = Math.max(0, P.frisst - dt);
        var tief = P.frisst > 0 ? 0.85 + Math.sin(zeit * 6) * 0.08 : P.st.krank ? 0.5 : 0;
        P.blick += (tief - P.blick) * Math.min(1, dt * 3);
        t.setzeKopfTief(P.blick);
        P.gang = 'steh';
      } else if (P.ort === 'hand') {
        // folgt der Spielerin am Strick
        var dx = S.x - P.x, dz = S.z - P.z, dist = Math.hypot(dx, dz);
        var soll = Math.max(0, Math.min(5.5, (dist - 1.9) * 3));
        P.tempo += (soll - P.tempo) * Math.min(1, dt * 6);
        if (dist > 0.3) {
          var ziel = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(ziel - P.kurs), Math.cos(ziel - P.kurs));
          P.kurs += diff * Math.min(1, dt * (P.tempo > 0.2 ? 4 : 0.6));
        }
        P.x += Math.sin(P.kurs) * P.tempo * dt; P.z += Math.cos(P.kurs) * P.tempo * dt;
        P.gang = P.tempo < 0.15 ? 'steh' : P.tempo < 2.7 ? 'schritt' : 'trab';
        t.setzeKopfTief(0);
      } else if (P.ort === 'putzplatz') {
        P.gang = 'steh'; t.setzeKopfTief(0);
      } else if (P.ort === 'geritten') {
        P.gang = P.tempo < 0.15 ? 'steh' : 'schritt'; t.setzeKopfTief(0);
      } else if (P.ort === 'maschine' || P.ort === 'longe') {
        var O = P.ort === 'maschine' ? ORT.maschine : ORT.longe, r = P.ort === 'maschine' ? O.r - 1.6 : O.r - 1.8;
        var v = P.ort === 'maschine' ? 1.5 : P.longeTempo || 1.5;
        P.tempo += (v - P.tempo) * Math.min(1, dt * 2);
        P.winkel += P.tempo / r * dt;
        P.x = O.mitte[0] + Math.sin(P.winkel) * r; P.z = O.mitte[1] + Math.cos(P.winkel) * r;
        P.kurs = P.winkel + Math.PI / 2;
        P.gang = P.tempo < 0.15 ? 'steh' : P.tempo < 2.7 ? 'schritt' : P.tempo < 5.4 ? 'trab' : 'galopp';
        P.st.fit = Math.min(1, (P.st.fit || 0) + dt * (P.ort === 'longe' ? 0.004 : 0.002) * (P.tempo / 1.5));
        P.st.hunger = Math.min(1, P.st.hunger + dt * 0.0008);
      } else if (P.ort === 'weide') {
        // gemuetlich grasen und ab und zu ein Stueck weitergehen
        var W = ORT.weide.platz;
        if (!P.ziel || P.warte <= 0 && Math.hypot(P.ziel[0] - P.x, P.ziel[1] - P.z) < 0.6) {
          if (P.ziel) P.warte = 6 + Math.random() * 9;
          P.ziel = [W[0] + 3 + Math.random() * (W[2] - W[0] - 6), W[1] + 3 + Math.random() * (W[3] - W[1] - 6)];
        }
        P.warte = (P.warte || 0) - dt;
        var gehen = P.warte <= 0;
        P.tempo += ((gehen ? 1.3 : 0) - P.tempo) * Math.min(1, dt * 3);
        if (gehen) {
          var zw = Math.atan2(P.ziel[0] - P.x, P.ziel[1] - P.z), df = Math.atan2(Math.sin(zw - P.kurs), Math.cos(zw - P.kurs));
          P.kurs += df * Math.min(1, dt * 2);
        }
        P.x += Math.sin(P.kurs) * P.tempo * dt; P.z += Math.cos(P.kurs) * P.tempo * dt;
        P.blick += ((gehen ? 0 : 1) - P.blick) * Math.min(1, dt * 2);
        t.setzeKopfTief(P.blick);
        P.gang = P.tempo < 0.15 ? 'steh' : 'schritt';
        P.st.hunger = Math.max(0, P.st.hunger - dt * 0.004);
        P.st.schmutz = Math.min(1, P.st.schmutz + dt * 0.0006);
      }
      if (P.ort !== 'box' && WETTER.regnet()) P.st.schmutz = Math.min(1, P.st.schmutz + dt * 0.003);
      var weg = Math.hypot(P.x - alt.x, P.z - alt.z);
      if (P.ort === 'geritten') { weg = P.reitWeg || 0; P.reitWeg = 0; }      // beim Reiten wurde das Pferd schon vorher bewegt
      P.phase += weg * Math.PI * 2 / (P.gang === 'galopp' ? 4.19 : P.gang === 'trab' ? 2.9 : 1.9);
      t.wurzel.position.set(P.x, 0, P.z);
      t.wurzel.rotation.y = P.kurs;
      t.bewege(P.gang, P.phase, 1, -1, dt);
    });
    if (orte.karussell) orte.karussell.rotation.y += dt * 1.5 / (ORT.maschine.r - 1.6);
  }

  // ---------- Die anderen Reitmaedchen ----------
  var SPRUECHE = ['Hallo!', 'Schönes Wetter zum Reiten!', 'Vergiss die Hufe nicht!', 'Hast du schon gefüttert?', 'Viel Glück beim Turnier!', 'Auf der Weide ist es am schönsten.', 'Im Reitladen gibt es neue Gamaschen!', 'Das Fohlen auf der Weide ist so süß!', 'Warst du schon mit Lotte am See?', 'Am Schwarzen Brett hängen die Reitabzeichen.'];
  function baueMaedchen() {
    var namen = ['Lotte', 'Mia', 'Emma'];
    var wege = [
      // Lotte: holt Heu, bringt es zu einer Box, putzt, macht Pause auf dem Hof
      [['geh', 4, 0], ['geh', 4, -4.2], ['pose', 'schaufeln', 2.5], ['trage', 'heu'], ['geh', 4, 0], ['geh', -2, 0], ['geh', -2, 3.6], ['pose', 'putzen', 3], ['trage', null], ['pose', 'putzen', 7, 'buerste'], ['geh', -2, 0], ['geh', 10, 0], ['geh', 10.5, 7.6], ['pose', 'winken', 2.5], ['turn', 'hampelmann', 5], ['pose', 'steh', 4], ['turn', 'kniebeuge', 5.6], ['pose', 'steh', 3], ['geh', 10, 0]],
      // Mia: faehrt Mist mit der Schubkarre zum Misthaufen
      [['karre', true], ['geh', -6, 0.6], ['pose', 'schaufeln', 5], ['geh', -13.5, 0.6], ['geh', -14.5, -6.5], ['pose', 'schaufeln', 4], ['geh', -13.5, 0.6], ['geh', -10, 0.6], ['pose', 'schaufeln', 5], ['geh', -13.5, 0.6], ['geh', -14.5, -6.5], ['pose', 'schaufeln', 4], ['geh', -13.5, 0.6]],
      // Emma: reitet auf dem Trainingsplatz
      null
    ];
    namen.forEach(function (name, i) {
      var o = KERN.zufallsOutfit('maedchen');
      var f = baueFigur(o, { helm: i === 2 });
      var M = { name: name, figur: f, weg: wege[i], schritt: 0, warte: 0, x: i === 0 ? 6 : -8, z: i === 0 ? 0 : 0.6, kurs: 0, phase: 0, gruss: 0, tempo: 0 };
      M.last = new THREE.Group(); f.gelenke.rumpf.add(M.last); M.last.position.set(0, 0.2, 0.3);
      M.schild = BAU.schwebeText(name, 0.3, { schrift: 40 }); M.schild.position.y = 1.95; f.wurzel.add(M.schild);
      szene.add(f.wurzel);
      if (i === 1) {
        M.karre = new THREE.Group();
        BAU.kasten(0.7, 0.35, 0.95, 0x3e8f4a, M.karre, 0, 0.5, 0.85); BAU.netz(new THREE.SphereGeometry(0.34, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x4a3320, M.karre, 0, 0.66, 0.85);
        var rad = BAU.walze(0.2, 0.2, 0.08, 0x222222, M.karre, 0, 0.2, 1.4, 12); rad.rotation.z = Math.PI / 2;
        BAU.kasten(0.04, 0.04, 0.8, 0x8a8f96, M.karre, -0.28, 0.6, 0.25); BAU.kasten(0.04, 0.04, 0.8, 0x8a8f96, M.karre, 0.28, 0.6, 0.25);
        f.wurzel.add(M.karre);
      }
      if (i === 2) {
        // Reitpferd fuer Emma
        var tier = HERDE.bauePferd({ fell: 'fuchs', saat: 9 });
        tier.setzeAusruestung({ gamaschen: '#f5f5f5' });
        szene.add(tier.wurzel);
        f.setzePose('reiten', true); f.setzeHoehe(0, true);
        f.wurzel.position.set(0, 1.66, 0.02);
        tier.koerper.add(f.wurzel);
        M.schild.position.y = 1.1;
        M.tier = tier; M.s = 0;
      }
      maedchen.push(M);
    });
  }
  // Emmas Reitweg: ein Oval auf dem Trainingsplatz
  function ovalPunkt(s, ziel) {
    var P = ORT.training.platz, mx = (P[0] + P[2]) / 2, mz = (P[1] + P[3]) / 2, a = (P[2] - P[0]) / 2 - 3.5, b = (P[3] - P[1]) / 2 - 3;
    ziel.x = mx + Math.cos(s) * a; ziel.z = mz + Math.sin(s) * b;
  }
  var op = { x: 0, z: 0 }, op2 = { x: 0, z: 0 };
  function bewegeMaedchen(dt) {
    maedchen.forEach(function (M, nr) {
      var f = M.figur;
      if (M.tier) {
        var schnell = Math.sin(zeit * 0.11 + 1) > 0.3;
        M.tempo += ((schnell ? 6.2 : 3.6) - M.tempo) * Math.min(1, dt);
        ovalPunkt(M.s, op);
        ovalPunkt(M.s + 0.01, op2);
        var ds = Math.hypot(op2.x - op.x, op2.z - op.z) / 0.01;
        M.s += M.tempo * dt / ds;
        var gang = M.tempo > 5.2 ? 'galopp' : 'trab';
        M.phase += M.tempo * dt * Math.PI * 2 / (gang === 'galopp' ? 4.19 : 2.9);
        M.tier.wurzel.position.set(op.x, 0, op.z);
        M.tier.wurzel.rotation.y = Math.atan2(op2.x - op.x, op2.z - op.z);
        M.tier.bewege(gang, M.phase, 1, -1, dt);
        f.huefte.position.y = Math.abs(Math.sin(M.phase)) * (gang === 'trab' ? 0.06 : 0.03);
        f.bewege(dt);
        M.x = op.x; M.z = op.z;
        return;
      }
      var s = M.weg[M.schritt % M.weg.length], laeuft = 0;
      if (s[0] === 'geh') {
        var dx = s[1] - M.x, dz = s[2] - M.z, dist = Math.hypot(dx, dz);
        if (dist < 0.15) M.schritt++;
        else {
          var v = M.karre ? 1.3 : 1.6;
          M.kurs = Math.atan2(dx, dz);
          M.x += dx / dist * v * dt; M.z += dz / dist * v * dt;
          M.phase += v * dt * 4.2; laeuft = 0.8;
        }
        if (M.gruss <= 0) f.setzePose(M.traegt || M.karre ? 'tragen' : 'steh');
      } else if (s[0] === 'turn') {
        // Gymnastik in der Pause (aufgenommene Bewegung)
        if (M.warte <= 0) { M.warte = s[2]; f.setzePose('steh'); if (!f.spiele(s[1])) M.warte = 0.01; }
        M.warte -= dt;
        if (M.warte <= 0 || M.gruss > 0) { f.spiele(null); M.schritt++; M.warte = 0; }
      } else if (s[0] === 'pose') {
        if (M.warte <= 0) { M.warte = s[2]; f.setzePose(s[1]); }
        M.warte -= dt;
        if (s[1] === 'putzen' || s[1] === 'schaufeln') f.gelenke.rumpf.rotation.y = Math.sin(zeit * 5 + nr) * 0.25;
        if (M.warte <= 0) { M.schritt++; M.warte = 0; }
      } else if (s[0] === 'trage') {
        while (M.last.children.length) M.last.remove(M.last.children[0]);
        M.traegt = s[1];
        if (s[1] === 'heu') BAU.kasten(0.5, 0.3, 0.35, 0xd3bb55, M.last, 0, 0, 0);
        M.schritt++;
      } else M.schritt++;
      // Gruss, wenn die Spielerin in der Naehe ist
      var nah = Math.hypot(S.x - M.x, S.z - M.z) < 2.6;
      if (nah && M.gruss <= -6 && modus === 'frei') {
        M.gruss = 3;
        var spruch = HOFTAG.tipp() || HOFLEBEN.tipp() || hofTipp() || SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)];
        if (M.blase) { f.wurzel.remove(M.blase); M.blase.material.map.dispose(); }
        M.blase = BAU.schwebeText(spruch, 0.34, { schrift: 36, immerSichtbar: true }); M.blase.position.y = 2.45; M.blase.renderOrder = 5; f.wurzel.add(M.blase);
        if (!M.karre && !M.traegt) f.setzePose('winken');
      }
      M.gruss -= dt;
      if (M.blase) M.blase.visible = M.gruss > 0;
      f.gehe(M.phase, laeuft);
      f.bewege(dt);
      f.wurzel.position.set(M.x, 0, M.z);
      f.wurzel.rotation.y = M.kurs;
    });
  }
  // Ein Maedchen gibt einen Tipp, welches Pferd gerade etwas braucht
  function hofTipp() {
    if (Math.random() < 0.4) return null;
    var schlimm = null, wert = 0.55, was = '';
    pferde.forEach(function (P) {
      if (P.st.hunger > wert) { wert = P.st.hunger; schlimm = P; was = ' hat Hunger!'; }
      if (P.st.schmutz > wert) { wert = P.st.schmutz; schlimm = P; was = ' ist ganz schmutzig!'; }
      if (P.st.mist > wert + 0.1) { wert = P.st.mist; schlimm = P; was = ': Die Box muss gemistet werden!'; }
    });
    return schlimm ? schlimm.def.name + was : null;
  }

  // ---------- Bewegung der Spielerin ----------
  function stoss(o, r) {
    var i, w;
    for (i = 0; i < waende.length; i++) {
      w = waende[i];
      var nx = Math.max(w[0], Math.min(w[2], o.x)), nz = Math.max(w[1], Math.min(w[3], o.z));
      var dx = o.x - nx, dz = o.z - nz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) { var d = Math.sqrt(d2); o.x = nx + dx / d * r; o.z = nz + dz / d * r; }
        else {            // steckt drin: zur naechsten Kante hinaus
          var l = o.x - w[0], re = w[2] - o.x, ob = o.z - w[1], un = w[3] - o.z, m = Math.min(l, re, ob, un);
          if (m === l) o.x = w[0] - r; else if (m === re) o.x = w[2] + r; else if (m === ob) o.z = w[1] - r; else o.z = w[3] + r;
        }
      }
    }
    for (i = 0; i < kreise.length; i++) {
      var k = kreise[i], ex = o.x - k[0], ez = o.z - k[1], e = Math.hypot(ex, ez);
      if (k[4]) {                           // runder Zaun mit Tor
        var win = Math.atan2(ex, ez), abw = Math.abs(Math.atan2(Math.sin(win - k[3]), Math.cos(win - k[3])));
        if (abw < k[4] / 2) continue;
        if (Math.abs(e - k[2]) < r) { var soll = e < k[2] ? k[2] - r : k[2] + r; o.x = k[0] + ex / e * soll; o.z = k[1] + ez / e * soll; }
      } else if (e < k[2] + r && e > 0.001) { o.x = k[0] + ex / e * (k[2] + r); o.z = k[1] + ez / e * (k[2] + r); }
    }
    o.x = Math.max(-62, Math.min(62, o.x)); o.z = Math.max(-26, Math.min(Math.abs(o.x) < 2.7 ? 60 : 46.5, o.z));
  }

  // ---------- Reiten auf dem Hof: nur im Schritt ----------
  var reitMeldung = 0;
  // neben einem Pferd kann man immer aufsteigen: das geführte oder eins, das draußen steht (Weide)
  function aufsteigPferd() {
    if (modus !== 'frei' || S.reitet) return null;
    if (S.fuehrt) return S.fuehrt;
    var best = null, bd = 2.6;
    pferde.forEach(function (P) { if (P.ort !== 'weide') return; var e = Math.hypot(P.x - S.x, P.z - S.z); if (e < bd) { bd = e; best = P; } });
    return best;
  }
  function imStall() { return (S.x > STALL.x0 - 1 && S.x < STALL.x1 + 1 && S.z > STALL.z0 - 1 && S.z < STALL.z1 + 1) || HOFTAG.imHaus(S.x, S.z); }
  function darfAufsteigen() { return !!aufsteigPferd(); }
  function steigeAuf() {
    var P = aufsteigPferd();
    if (!P) return;
    if (imStall()) { KERN.meldung('Im Stall wird nicht aufgestiegen. Führe ' + P.def.name + ' erst nach draußen.', 'knapp'); return; }
    if (!S.fuehrt) nimm(P);
    if (HOFLEBEN.krank(P)) { KERN.meldung(P.def.name + ' ist krank und kann nicht geritten werden.', 'knapp'); return; }
    S.fuehrt = null; S.reitet = P; P.ort = 'geritten'; P.tempo = 0;
    P.tier.setzeSattel(true, P.st.ausruestung.decke); P.tier.setzeZaum(true, true);
    var f = S.figur;
    szene.remove(f.wurzel); P.tier.koerper.add(f.wurzel);
    f.wurzel.position.set(0, 1.66, 0.02); f.wurzel.rotation.set(0, 0, 0);
    f.gehe(0, 0); f.setzeHoehe(0, true); f.setzePose('reiten', true); f.setzeHelm(true);
    S.x = P.x; S.z = P.z; S.kurs = P.kurs;
    KERN.ton(660, 0.1, 'triangle', 0.14); KERN.meldung('Hü! Auf dem Hof nur im Schritt.', 'gut');
  }
  function steigeAb(still) {
    var P = S.reitet;
    if (!P) return;
    S.reitet = null; P.ort = 'hand'; P.tempo = 0; S.fuehrt = P;
    P.tier.setzeZaum(true, false);
    var f = S.figur;
    P.tier.koerper.remove(f.wurzel); szene.add(f.wurzel);
    f.setzeHoehe(0.8, true); f.setzePose('steh', true); f.setzeOutfit(KERN.spieler().outfit);
    S.x = P.x + Math.cos(P.kurs) * 1.25; S.z = P.z - Math.sin(P.kurs) * 1.25; S.kurs = P.kurs; S.tempo = 0;
    stoss(S, 0.35);
    if (!still) KERN.ton(520, 0.1, 'triangle', 0.14);
  }
  function reiteAufHof(dt, ex, ez, st) {
    var P = S.reitet, alt = { x: P.x, z: P.z };
    P.tempo += (st * 1.8 - P.tempo) * Math.min(1, dt * 3);
    if (st > 0.05) {
      var ziel = Math.atan2(ex, ez), diff = Math.atan2(Math.sin(ziel - P.kurs), Math.cos(ziel - P.kurs));
      P.kurs += Math.max(-1, Math.min(1, diff * 2)) * 2.0 * dt;
    }
    P.x += Math.sin(P.kurs) * P.tempo * dt; P.z += Math.cos(P.kurs) * P.tempo * dt;
    P.reitWeg = (P.reitWeg || 0) + P.tempo * dt;
    reitMeldung -= dt;
    if ((P.x > STALL.x0 - 1.1 && P.x < STALL.x1 + 1.1 && P.z > STALL.z0 - 1 && P.z < STALL.z1 + 1) || HOFTAG.imHaus(P.x, P.z)) {
      P.x = alt.x; P.z = alt.z; P.tempo = 0;
      if (reitMeldung <= 0) { reitMeldung = 4; KERN.meldung('Im Stall wird nicht geritten. Steig vorher ab.', 'knapp'); }
    }
    stoss(P, 0.8);
    S.x = P.x; S.z = P.z; S.kurs = P.kurs; S.tempo = P.tempo;
    S.figur.bewege(dt);
    S.strick.visible = false;
  }
  // durch das Tor im Sueden hinaus ins Gruene: dort geht es im Ausritt weiter
  function gehInsGruene() {
    var P = S.reitet || S.fuehrt, ritt = !!S.reitet;
    if (HOFTAG.nacht()) { S.z = 48.5; if (S.reitet) S.reitet.z = 48.5; KERN.meldung('🌙 Nachts bleibt das Tor zu.', 'knapp'); return; }
    if (WETTER.gewitter()) { S.z = 48.5; if (S.reitet) S.reitet.z = 48.5; KERN.meldung('⛈️ Bei Gewitter bleibt das Tor zu. Ab in den Stall!', 'knapp'); return; }
    HOFTAG.loslassen(); STURM.loslassen(); trage(null);
    if (P && HOFLEBEN.krank(P)) { S.z = 48.5; KERN.meldung(P.def.name + ' ist krank und bleibt besser auf dem Hof.', 'knapp'); return; }
    if (ritt) steigeAb(true);
    if (P) losreiten('ausritt', 'ausritt', { extra: { vomHof: true, reitet: ritt, zuFuss: !ritt } });
    else WELTEN.ausritt.start({ ohnePferd: true, vomHof: true, hof: true, zurueck: function () { HOFTAG.vergeht(0.5); API.start({ zurueckVon: 'ausritt' }); } });
  }
  function bewegeSpielerin(dt) {
    var t = KERN.taste, w = KERN.wisch;
    var sx = (t.rechts ? 1 : 0) - (t.links ? 1 : 0) - w.lenk, sz = (t.langsamer ? 1 : 0) - (t.schneller ? 1 : 0) - w.hoch;
    // "oben" auf dem Bildschirm ist immer von der Kamera weg, egal wie sie gedreht ist
    var kc = Math.cos(kam.w), ks = Math.sin(kam.w);
    var ex = sx * kc + sz * ks, ez = -sx * ks + sz * kc;
    var st = Math.min(1, Math.hypot(ex, ez));
    if (modus !== 'frei') st = 0;
    if (S.reitet) { reiteAufHof(dt, st > 0.05 ? ex / st : 0, st > 0.05 ? ez / st : 0, st); if (S.z > 51 && modus === 'frei') gehInsGruene(); return; }
    var tempo = st * (S.fuehrt ? 3.0 : HOFTAG.schiebt() ? 3.1 : 4.2);
    S.tempo += (tempo - S.tempo) * Math.min(1, dt * 10);
    if (st > 0.05) {
      var ziel = Math.atan2(ex, ez), diff = Math.atan2(Math.sin(ziel - S.kurs), Math.cos(ziel - S.kurs));
      S.kurs += diff * Math.min(1, dt * 12);
      S.x += ex / Math.max(st, 0.001) * S.tempo * dt * Math.min(1, st * 1.2);
      S.z += ez / Math.max(st, 0.001) * S.tempo * dt * Math.min(1, st * 1.2);
      // Pferde in den Boxen stehen im Weg
      for (var i = 0; i < pferde.length; i++) {
        var P = pferde[i];
        if (P.ort !== 'box') continue;
        var dx = S.x - P.x, dz = S.z - P.z, vorn = dx, seit = dz;      // Pferd steht laengs zur x-Achse
        if (Math.abs(vorn) < 1.5 && Math.abs(seit) < 0.75) { S.z = P.z + (seit >= 0 ? 0.75 : -0.75); }
      }
      stoss(S, 0.35);
      S.phase += S.tempo * dt * 4.2;
    }
    var f = S.figur;
    f.gehe(S.phase, Math.min(1, S.tempo / 3.5));
    if (modus === 'frei') f.setzePose(STURM.pose() || HOFTAG.pose() || (S.traegt ? 'tragen' : S.fuehrt ? 'fuehren' : 'steh'));
    f.bewege(dt);
    f.wurzel.position.set(S.x, 0, S.z);
    f.wurzel.rotation.y = S.kurs;
    if (S.z > 51 && modus === 'frei') { gehInsGruene(); return; }
    // Strick zum gefuehrten Pferd
    if (S.fuehrt && S.fuehrt.ort === 'hand') {
      var P2 = S.fuehrt, pos = S.strick.geometry.attributes.position;
      var kopf = P2.tier.knochen.jaw001 || P2.tier.knochen.skull;
      kopf.getWorldPosition(hv);
      pos.setXYZ(0, S.x + Math.sin(S.kurs + 0.9) * -0.25, 0.95, S.z + Math.cos(S.kurs + 0.9) * -0.25);
      pos.setXYZ(1, hv.x, hv.y - 0.05, hv.z);
      pos.needsUpdate = true;
      S.strick.visible = true;
    } else S.strick.visible = false;
  }
  var hv = new THREE.Vector3();

  function trage(was) {
    S.traegt = was;
    while (S.last.children.length) S.last.remove(S.last.children[0]);
    if (was === 'hafer') { BAU.walze(0.17, 0.13, 0.28, 0x2f6fb5, S.last, 0, 0, 0); BAU.walze(0.155, 0.155, 0.02, 0xd9b96a, S.last, 0, 0.135, 0); }
    else if (was === 'heu') BAU.kasten(0.55, 0.32, 0.38, 0xd3bb55, S.last, 0, 0, 0);
    else if (was === 'moehre') { var m = BAU.netz(new THREE.ConeGeometry(0.05, 0.3, 6), 0xf08a24, S.last, 0, 0.05, 0.05); m.rotation.x = Math.PI / 2; }
  }

  // ---------- Was kann man hier gerade tun? ----------
  function inBoxVon(x, z) {
    for (var i = 0; i < boxen.length; i++) {
      var b = boxen[i];
      if (Math.abs(x - b.xc) < 2 && (z - b.zVorn) * b.v > 0.1 && (z - b.zHinten) * b.v < 0) return b;
    }
    return null;
  }
  function findeAktion() {
    var beste = null, bd = 1e9;
    function vor(x, z, r, text, tun, hinweis) {
      var d = Math.hypot(S.x - x, S.z - z);
      if (d < r && d < bd) { bd = d; beste = { x: x, z: z, text: text, tun: tun, hinweis: hinweis }; }
    }
    var b = inBoxVon(S.x, S.z), F = ORT.futter, P = S.fuehrt;
    function tor(o, r, text, tun) {
      if (P || S.reitet) vor(o[0], o[1], r, text, tun);
      else vor(o[0], o[1], r, null, null, 'Hol zuerst ein Pferd aus dem Stall und führe es hierher.');
    }
    if (S.reitet) {                    // im Sattel: nur die Plaetze und der Putzplatz
      tor(ORT.training.tor, 3, '🏇 Auf den Trainingsplatz', function () { waehlePlatz('training'); });
      tor(ORT.turnier.tor, 3, '🏆 Auf den Turnierplatz', function () { waehlePlatz('turnier'); });
      tor(ORT.rennbahn.tor, 3.5, '🏁 Zur Galopprennbahn', function () { waehlePlatz('rennbahn'); });
      tor(ORT.gelaende.tor, 3.5, '🌲 Ins Gelände reiten', function () { waehlePlatz('gelaende'); });
      tor(ORT.longe.tor, 3, '⭕ In den Longierzirkel', function () { waehlePlatz('longe'); });
      vor(ORT.putzplatz.mitte[0], ORT.putzplatz.mitte[1], 3.4, '🚿 ' + S.reitet.def.name + ' am Putzplatz putzen', function () { putzeDraussen(S.reitet); });
      return beste;
    }
    if (P) vor(ORT.putzplatz.mitte[0], ORT.putzplatz.mitte[1], 3.4, '🚿 ' + P.def.name + ' am Putzplatz putzen', function () { putzeDraussen(P); });
    else vor(ORT.putzplatz.mitte[0], ORT.putzplatz.mitte[1], 2.6, null, null, 'Am Putzplatz kannst du ein Pferd draußen abspritzen und putzen, zum Beispiel nach dem Ausritt. Führe ein Pferd hierher.');
    if (Math.abs(S.x) < 5 && S.z > 42) vor(S.x, S.z, 9, null, null, P ? 'Durch dieses Tor geht es ins Grüne. Draußen darfst du traben und galoppieren. Steig ruhig schon auf!' : 'Durch dieses Tor geht es ins Grüne. Mit einem Pferd macht es am meisten Spaß.');
    if (b) {
      var B = b.pferd;
      if (P && P.box === b) vor(S.x, S.z, 9, '🏠 ' + P.def.name + ' in die Box stellen', function () { stelleAb(P, 'box'); });
      else if (B && B.ort === 'box') {
        if (S.traegt === 'hafer') vor(b.trog[0], b.trog[1], 9, '🌾 Hafer in den Trog füllen', function () { fuettere(B, 'hafer'); });
        else if (S.traegt === 'heu') vor(b.raufe[0], b.raufe[1], 9, 'Heu in die Raufe legen', function () { fuettere(B, 'heu'); });
        else if (S.traegt === 'moehre') vor(B.x, B.z, 9, '🥕 ' + B.def.name + ' eine Möhre geben', function () { fuettere(B, 'moehre'); });
        else if (!P && !HOFTAG.schiebt() && !HOFTAG.hatGabel()) vor(B.x, B.z, 9, '🧽 ' + B.def.name + ' pflegen', function () { PFLEGE.start(API, B); });
      }
    } else if (P && Math.abs(S.z) < STALL.gang && S.x > STALL.x0 && S.x < 0) {
      vor(P.box.xc, P.box.zVorn, 2.2, null, null, P.def.name + ' wohnt in dieser Box. Geh hinein, um ' + P.def.name + ' abzustellen.');
    }
    // Vorratsraum
    if (S.z < -STALL.gang && S.z > STALL.z0 && S.x > 0 && S.x < STALL.x1 && !HOFTAG.schiebt() && !HOFTAG.hatGabel()) {
      if (S.traegt) vor(S.x, S.z, 9, 'Zurücklegen', function () { trage(null); });
      else {
        vor(F.hafer[0], F.hafer[1] + 1, 1.6, '🌾 Eimer Hafer holen', function () { trage('hafer'); KERN.ton(500, 0.08, 'triangle', 0.12); });
        vor(F.heu[0], F.heu[1] + 1, 1.6, 'Heu holen', function () { trage('heu'); KERN.ton(420, 0.08, 'triangle', 0.12); });
        vor(F.moehre[0], F.moehre[1] + 1, 1.6, '🥕 Möhre holen', function () { trage('moehre'); KERN.ton(600, 0.08, 'triangle', 0.12); });
      }
    }
    vor(ORT.laden[0], ORT.laden[1] - 1.2, 2.6, '🛍️ Reitladen', zeigeLaden);
    // Plaetze: nur mit Pferd
    tor(ORT.training.tor, 3, '🏇 Auf den Trainingsplatz', function () { waehlePlatz('training'); });
    tor(ORT.turnier.tor, 3, '🏆 Auf den Turnierplatz', function () { waehlePlatz('turnier'); });
    tor(ORT.rennbahn.tor, 3.5, '🏁 Zur Galopprennbahn', function () { waehlePlatz('rennbahn'); });
    tor(ORT.gelaende.tor, 3.5, '🌲 Ins Gelände reiten', function () { waehlePlatz('gelaende'); });
    var frei;
    frei = pferde.filter(function (p) { return p.ort === 'longe'; })[0];
    if (frei && !P) vor(ORT.longe.tor[0], ORT.longe.tor[1], 3, frei.def.name + ' abholen', function () { nimm(frei); });
    else tor(ORT.longe.tor, 3, '⭕ In den Longierzirkel', function () { waehlePlatz('longe'); });
    frei = pferde.filter(function (p) { return p.ort === 'maschine'; })[0];
    if (frei && !P) vor(ORT.maschine.tor[0], ORT.maschine.tor[1], 3, frei.def.name + ' aus der Schrittmaschine holen', function () { nimm(frei); });
    else if (frei) vor(ORT.maschine.tor[0], ORT.maschine.tor[1], 3, null, null, 'Die Schrittmaschine ist gerade besetzt.');
    else tor(ORT.maschine.tor, 3, 'In die Schrittmaschine stellen', function () { stelleAb(P, 'maschine'); });
    var aufWeide = pferde.filter(function (p) { return p.ort === 'weide'; });
    if (P) vor(ORT.weide.tor[0], ORT.weide.tor[1], 3, '🌿 ' + P.def.name + ' auf die Weide lassen', function () { stelleAb(P, 'weide'); });
    else if (aufWeide.length) {
      var naechstes = aufWeide.sort(function (a, c) { return Math.hypot(a.x - S.x, a.z - S.z) - Math.hypot(c.x - S.x, c.z - S.z); })[0];
      vor(naechstes.x, naechstes.z, 2.6, naechstes.def.name + ' von der Weide holen', function () { nimm(naechstes); });
      vor(ORT.weide.tor[0], ORT.weide.tor[1], 3, null, null, 'Geh auf die Weide zu einem Pferd, um es wieder mitzunehmen.');
    } else vor(ORT.weide.tor[0], ORT.weide.tor[1], 3, null, null, 'Hier wohnt das Fohlen. Große Pferde können hier auch grasen.');
    HOFLEBEN.aktionen(vor, S, P);
    HOFTAG.aktionen(vor, S, P, function () { return beste; });
    STURM.aktionenHof(vor);
    return beste;
  }

  // ---------- Pferd nehmen und abstellen ----------
  function nimm(P) {
    if (S.fuehrt) return;
    HOFTAG.loslassen();
    STURM.loslassen();
    P.ort = 'hand'; P.tempo = 0;
    P.tier.setzeZaum(true, false);
    P.tier.setzeKopfTief(0); P.blick = 0;
    S.fuehrt = P;
    trage(null);
    STAND.daten.gewaehlt = P.def.id; STAND.speichere();
    KERN.ton(660, 0.1, 'triangle', 0.15);
  }
  function stelleAb(P, wohin) {
    S.fuehrt = null;
    if (wohin === 'box') { inBox(P); S.x = P.box.xc; S.z = P.box.zVorn + P.box.v * 0.7; KERN.meldung(P.def.name + ' ist zu Hause', 'gut'); }
    else {
      P.ort = wohin; P.tier.setzeZaum(false);
      if (wohin === 'maschine') { P.winkel = Math.PI; KERN.meldung('Schritt für Schritt …', 'gut'); }
      HOFTAG.zaehle(wohin, 1);
      if (wohin === 'weide') { P.x = ORT.weide.tor[0] - 3; P.z = ORT.weide.tor[1]; P.ziel = null; P.warte = 0; KERN.meldung(P.def.name + ' freut sich!', 'perfekt'); SOUND.spiel('wiehern', 0.6, 1, 0.3); }
    }
    STAND.speichere();
    KERN.ton(520, 0.1, 'triangle', 0.15);
  }
  function fuettere(P, was) {
    var st = P.st;
    STAND.merke('gefuettert', 1);
    HOFTAG.zaehle(was === 'moehre' ? 'moehre' : 'fuettern', 1);
    if (was === 'hafer') { st.hunger = Math.max(0, st.hunger - 0.5); st.hafer = 1; }
    else if (was === 'heu') { st.hunger = Math.max(0, st.hunger - 0.35); st.heu = 1; }
    else { st.hunger = Math.max(0, st.hunger - 0.12); }
    P.frisst = was === 'moehre' ? 0 : 9;
    if (was === 'moehre') KERN.meldung('Mmmh, lecker!', 'perfekt'); else KERN.meldung(P.def.name + ' frisst', 'gut');
    trage(null);
    KERN.klang('gut');
    var lohn = was === 'moehre' ? 0 : 1;
    if (lohn && st.hunger < 0.6) { STAND.daten.muenzen += lohn; }
    STAND.speichere();
    zeigeZustand(P);
    setTimeout(function () { st.hafer = 0; st.heu = 0; zeigeZustand(P); STAND.speichere(); }, 60000);
  }

  // Futter aus dem Futterwagen: Hafer und Heu auf einmal
  function fuettereWagen(P) {
    var st = P.st, hungrig = st.hunger > 0.25;
    STAND.merke('gefuettert', 1);
    HOFTAG.zaehle('fuettern', 1);
    st.hunger = Math.max(0, st.hunger - 0.75); st.hafer = 1; st.heu = 1;
    P.frisst = 10;
    if (hungrig) STAND.daten.muenzen += 2;
    KERN.meldung(P.def.name + ' frisst' + (hungrig ? '  +2 🪙' : ''), 'gut'); KERN.klang('gut'); SOUND.spiel('fressen', 0.8, 1, 0.35);
    STAND.speichere();
    zeigeZustand(P);
    setTimeout(function () { st.hafer = 0; st.heu = 0; zeigeZustand(P); STAND.speichere(); }, 60000);
  }

  // ---------- Karten: Plaetze und Laden ----------
  function karte(html, knoepfe, ohneNein) {
    modus = 'karte';
    if (!ohneNein) knoepfe.push({ text: 'Doch nicht', klasse: 'zweit', aktion: function () { KERN.schliesseKarte(); modus = 'frei'; } });
    KERN.zeigeKarte('mitte', html, knoepfe);
  }
  function pferdZeile(P) {
    var d = P.def, st = P.st;
    function sterne(n) { return '★★★★★'.slice(0, n) + '<span style="color:#d9cbb0">' + '★★★★★'.slice(n) + '</span>'; }
    return '<div class="details"><b>' + d.name + '</b>, ' + d.art + '<br>Tempo ' + sterne(d.tempo) + ' · Springen ' + sterne(d.sprung) + ' · Ausdauer ' + sterne(d.ausdauer) +
      '<br>Laune ' + REITEN.messer(STAND.laune(d.id)) + (STAND.laune(d.id) < 0.5 ? '<br><small>' + d.name + ' ist nicht gut gelaunt. Putzen und Füttern hilft!</small>' : '') + '</div>';
  }
  function losreiten(welt, ort, opt) {
    if (S.reitet) steigeAb(true);
    var P = S.fuehrt;
    KERN.schliesseKarte(); modus = 'frei';
    var daten = pferdDaten(P);
    function zurueck(erg) {
      // unterwegs das Pferd gewechselt? Dann kommt das andere mit nach Hause.
      var Q = erg && erg.pferdId ? pferde.filter(function (p) { return p.def.id === erg.pferdId; })[0] : null;
      if (Q && Q !== P) { inBox(P); P = Q; P.ort = 'hand'; P.tempo = 0; P.tier.setzeZaum(true, false); S.fuehrt = P; }
      // nach dem Reiten: Pferd ist etwas schmutziger, hungriger und fitter
      P.st.schmutz = Math.min(1, P.st.schmutz + 0.22); P.st.hunger = Math.min(1, P.st.hunger + 0.18); P.st.hufe = Math.min(1, P.st.hufe + 0.3);
      P.st.fit = Math.min(1, (P.st.fit || 0) + 0.05);
      HOFTAG.vergeht(1); HOFTAG.zaehle('ritt', 1);
      STAND.speichere();
      API.start({ zurueckVon: ort });
      HOFLEBEN.nachRitt(P);
      zeigeZustand(P, true);
    }
    if (welt === 'springen') KERN.springen({ turnier: !!opt.turnier, pferd: daten, zurueck: zurueck });
    else {
      var o = { pferd: daten, zurueck: zurueck, turnier: !!opt.turnier, hof: true, pferde: pferde.map(pferdDaten) };
      for (var k in (opt.extra || {})) o[k] = opt.extra[k];
      WELTEN[welt].start(o);
    }
  }
  function waehlePlatz(ort) {
    var P = S.fuehrt || S.reitet;
    if (!P) return;
    if (HOFLEBEN.krank(P) && ort !== 'weide') {
      karte('<h2>🤒 ' + P.def.name + ' ist krank</h2><div class="details">' + P.def.name + ' ' + HOFLEBEN.krank(P).zeichen + ' und kann heute nicht arbeiten. Die <b>Tierärztin</b> steht östlich vom Stall.</div>', []);
      return;
    }
    if (WETTER.gewitter() && ort !== 'weide') {
      karte('<h2>⛈️ Gewitter!</h2><div class="details">Bei Blitz und Donner wird nicht geritten. Bring ' + P.def.name + ' schnell in die Box im Stall, dort ist es sicher.</div>', []);
      return;
    }
    if (HOFTAG.nacht()) {
      karte('<h2>🌙 Es ist schon Nacht</h2><div class="details">Im Dunkeln wird nicht mehr geritten, die Plätze sind geschlossen. Bring ' + P.def.name + ' in die Box und geh ins <b>Bett</b>. Dein Zimmer ist im Haus nördlich vom Stall. Oder fahr mit dem <b>🚲 Fahrrad</b> nach Hause.</div>', [{ text: 'Alles klar', aktion: function () { KERN.schliesseKarte(); modus = 'frei'; } }], true);
      return;
    }
    var kopf = pferdZeile(P);
    if (ort === 'training') karte('<h2>Trainingsplatz</h2>' + kopf, [
      { text: '🏇 Springen üben', aktion: function () { losreiten('springen', ort, {}); } },
      { text: '🎩 Dressur üben', aktion: function () { losreiten('dressur', ort, {}); } }]);
    else if (ort === 'turnier') karte('<h2>🏆 Turnierplatz</h2>' + kopf, [
      { text: '🏆 Springturnier', aktion: function () { losreiten('springen', ort, { turnier: true }); } },
      { text: '🎩 Dressurprüfung', aktion: function () { losreiten('dressur', ort, { turnier: true }); } }]);
    else if (ort === 'rennbahn') karte('<h2>🏁 Galopprennbahn</h2>' + kopf, [{ text: '🏁 Rennen starten', aktion: function () { losreiten('rennen', ort, { turnier: true }); } }]);
    else if (ort === 'gelaende') karte('<h2>🌲 Ins Gelände</h2>' + kopf, [{ text: '🌲 Geländeritt starten', aktion: function () { losreiten('gelaende', ort, { turnier: true }); } },
      { text: '🌳 Ausritt mit Lotte', aktion: function () { losreiten('ausritt', ort, {}); } }]);
    else if (ort === 'longe') karte('<h2>⭕ Longierzirkel</h2>' + kopf, [
      { text: '⭕ Longieren', aktion: starteLonge },
      { text: '🤸 Voltigieren', aktion: function () { losreiten('voltigieren', ort, { turnier: true }); } }]);
  }

  // nachts kommen alle Pferde in ihre Boxen; gibt die Namen zurueck
  function bringeHeim() {
    var namen = [];
    if (S.reitet) steigeAb(true);
    pferde.forEach(function (P) { if (P.ort !== 'box') { namen.push(P.def.name); inBox(P); } });
    S.fuehrt = null; orte.longePferd = null;
    return namen;
  }
  // Longieren: das Pferd laeuft an der langen Leine im Kreis, man bestimmt die Gangart
  var LONGE_TEMPO = [0, 1.5, 3.8, 6.5], LONGE_NAME = ['Halt', 'Schritt', 'Trab', 'Galopp'];
  function starteLonge() {
    var P = S.fuehrt;
    KERN.schliesseKarte();
    S.fuehrt = null;
    P.ort = 'longe'; P.winkel = Math.PI; P.longeStufe = 1; P.longeTempo = LONGE_TEMPO[1];
    S.x = ORT.longe.mitte[0]; S.z = ORT.longe.mitte[1];
    modus = 'longe';
    orte.longePferd = P;
    S.figur.setzePose('longe');
    zeigeWerkzeug([
      { bild: '⬆️', text: 'Schneller', tun: function () { P.longeStufe = Math.min(3, P.longeStufe + 1); P.longeTempo = LONGE_TEMPO[P.longeStufe]; KERN.meldung(LONGE_NAME[P.longeStufe], 'gut'); } },
      { bild: '⬇️', text: 'Langsamer', tun: function () { P.longeStufe = Math.max(0, P.longeStufe - 1); P.longeTempo = LONGE_TEMPO[P.longeStufe]; KERN.meldung(LONGE_NAME[P.longeStufe], 'knapp'); } },
      { bild: '✔️', text: 'Fertig', klasse: 'los', tun: function () {
        zeigeWerkzeug(null); modus = 'frei'; orte.longePferd = null;
        S.x = ORT.longe.tor[0]; S.z = ORT.longe.tor[1] + 0.5;
        P.ort = 'hand'; P.x = S.x; P.z = S.z + 2.2; S.fuehrt = P; P.tier.setzeZaum(true, false);
        var lohn = Math.round((P.longeZeit || 0) / 20);
        P.longeZeit = 0;
        if (lohn > 0) HOFTAG.zaehle('longe', 1);
        if (lohn > 0) { STAND.daten.muenzen += Math.min(5, lohn); STAND.speichere(); KERN.meldung('+' + Math.min(5, lohn) + ' 🪙 fürs Longieren', 'perfekt'); }
      } }
    ]);
  }

  // Werkzeugleiste unten (Longieren, Pflege)
  function zeigeWerkzeug(liste) {
    var kasten = KERN.el('werkzeuge');
    kasten.innerHTML = '';
    document.body.classList.toggle('mit-werkzeug', !!liste);
    if (!liste) return;
    liste.forEach(function (w) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = w.klasse || '';
      b.innerHTML = '<b>' + w.bild + '</b>' + w.text;
      b.addEventListener('click', function () { w.tun(b); });
      w.knopf = b;
      kasten.appendChild(b);
    });
  }

  // Reitladen
  var ART_BILD = { gamaschen: '🦵', ohren: '🎀', schleife: '🎗️', decke: '🪑', putz: '✨', kappe: '🪖', frisur: '💇', oberteil: '👕', extra: '🎒', farben: '🎨', zimmer: '🛋️' };
  var EXTRA_BILD = { k_cowboy: '🤠', k_krone: '👑', k_einhorn: '🦄', k_ohren: '🐱', k_blumen: '🌸', k_schleife: '🎀', k_bommel: '🧶', k_glitzer: '✨', x_schal: '🧣', x_brille: '🕶️', x_fluegel: '🧚', x_umhang: '🦸', x_schaerpe: '🏅',
    o_stern: '⭐', o_herz: '💗', o_regenbogen: '🌈', o_weste: '🦺', o_turnier: '🥇', z_teppich: '🧶', z_poster: '🖼️', z_pflanze: '🪴', z_lichter: '💡', z_kuschel: '🧸', z_bett: '🛏️', z_korb: '🐱' };
  var ladenTab = 'ich';
  function zeigeLaden() {
    modus = 'karte';
    var d = STAND.daten, o = KERN.spieler().outfit;
    var hilfe = { pferd: 'Gekaufte Sachen kannst du jedem Pferd in seiner Box anziehen (Pflegen, dann „Schmücken“).', ich: 'Reitkappen, Frisuren und schicke Kleidung. Umziehen kannst du dich auch am <b>Kleiderschrank</b> in deinem Zimmer.', zimmer: 'Mach dein Zimmer im Wohnhaus gemütlich!' };
    var html = '<h2>🛍️ Reitladen</h2><div class="grossPunkte">🪙 ' + d.muenzen + ' Münzen</div><div class="tabs" id="ladenTabs"></div>' +
      '<div class="details">' + hilfe[ladenTab] + '</div><div class="liste" id="ladenListe"></div>';
    KERN.zeigeKarte('mitte', html, [{ text: 'Fertig', aktion: function () { KERN.schliesseKarte(); modus = 'frei'; } }]);
    var tabs = document.getElementById('ladenTabs');
    [['ich', '👧 Für dich'], ['pferd', '🐴 Fürs Pferd'], ['zimmer', '🛋️ Fürs Zimmer']].forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t[1]; b.className = 'wahl' + (ladenTab === t[0] ? ' aktiv' : '');
      b.addEventListener('click', function () { ladenTab = t[0]; zeigeLaden(); });
      tabs.appendChild(b);
    });
    var liste = document.getElementById('ladenListe');
    LADEN.filter(function (w) { return (w.kat || 'pferd') === ladenTab; }).forEach(function (w) {
      var z = document.createElement('div');
      z.className = 'eintrag';
      z.innerHTML = '<div class="bild">' + (EXTRA_BILD[w.id] || ART_BILD[w.art]) + '</div><div class="text">' + (w.farbe ? '<span class="farbtupfer" style="background:' + w.farbe + '"></span>' : '') + w.name + '</div>';
      var b = document.createElement('button');
      b.type = 'button';
      if (d.besitz[w.id]) {
        if (w.kat === 'ich' && w.wert) {
          var an = o[w.art] === w.wert;
          b.textContent = an ? '✔ angezogen' : 'Anziehen'; b.className = an ? 'an' : '';
          b.addEventListener('click', function () {
            o[w.art] = an ? (w.art === 'frisur' ? 'zopf' : w.art === 'kappe' ? 'klassisch' : w.art === 'oberteil' ? 'jacke' : 'ohne') : w.wert;
            if (w.art === 'kappe' && !an) o.kappeAuf = true;
            S.figur.setzeOutfit(o); KERN.speichereSpieler(); KERN.ton(700, 0.06, 'triangle', 0.1);
            zeigeLaden();
          });
        } else { b.textContent = '✔ gekauft'; b.disabled = true; }
      } else {
        b.textContent = w.preis + ' 🪙'; b.className = 'kauf'; b.disabled = d.muenzen < w.preis;
        b.addEventListener('click', function () {
          if (!STAND.zahle(w.preis)) return;
          d.besitz[w.id] = true; STAND.speichere();
          KERN.klang('perfekt');
          if (w.kat === 'zimmer') { HOFTAG.zeigeZimmer(); KERN.meldung('Steht jetzt in deinem Zimmer!', 'gut'); }
          if (w.art === 'farben') KERN.meldung('Neue Farben im Kleiderschrank!', 'gut');
          var oben = liste.parentNode.parentNode.scrollTop;
          zeigeLaden();
          var k = document.getElementById('ladenListe'); if (k) k.parentNode.parentNode.scrollTop = oben;
        });
      }
      z.appendChild(b);
      liste.appendChild(z);
    });
  }
  // Schmuecken: gekaufte Sachen einem Pferd anziehen
  function zeigeSchmuck(P, fertig) {
    var d = STAND.daten, a = P.st.ausruestung;
    var eigene = LADEN.filter(function (w) { return d.besitz[w.id] && w.farbe && !w.kat; });
    var html = '<h2>🎀 ' + P.def.name + ' schmücken</h2>' + (eigene.length ? '' : '<div class="details">Du hast noch keine Ausrüstung. Im <b>Reitladen</b> im Stall kannst du mit deinen Münzen einkaufen. Münzen gibt es für Siege und fürs Pflegen.</div>') + '<div class="liste" id="schmuckListe"></div>' +
      '<div class="details" style="margin-top:10px">Wie soll dein Pferd heißen?<br><input id="pferdName" type="text" maxlength="14" value="' + KERN.esc(P.def.name) + '" style="font:inherit;padding:6px 10px;border-radius:10px;border:2px solid #d9cbb0;width:60%;text-align:center"> <button type="button" id="pferdNameOk" class="zweit" style="display:inline-block;width:auto;padding:6px 14px">Umbenennen</button></div>';
    KERN.zeigeKarte('mitte', html, [{ text: 'Fertig', aktion: function () { KERN.schliesseKarte(); if (fertig) fertig(); } }]);
    document.getElementById('pferdNameOk').addEventListener('click', function () {
      var neu = STAND.benenne(P.def, document.getElementById('pferdName').value);
      zeigeZustand(P);
      KERN.meldung('Ich heiße jetzt ' + neu + '!', 'gut'); KERN.klang('gut');
      zeigeSchmuck(P, fertig);
    });
    var liste = document.getElementById('schmuckListe');
    eigene.forEach(function (w) {
      var z = document.createElement('div');
      z.className = 'eintrag';
      z.innerHTML = '<div class="bild">' + ART_BILD[w.art] + '</div><div class="text"><span class="farbtupfer" style="background:' + w.farbe + '"></span>' + w.name + '</div>';
      var b = document.createElement('button');
      b.type = 'button';
      var an = a[w.art] === w.farbe;
      b.textContent = an ? '✔ angezogen' : 'Anziehen'; b.className = an ? 'an' : '';
      b.addEventListener('click', function () {
        if (an) delete a[w.art]; else a[w.art] = w.farbe;
        STAND.speichere();
        P.tier.setzeAusruestung(a);
        zeigeSchmuck(P, fertig);
      });
      z.appendChild(b);
      liste.appendChild(z);
    });
  }

  // ---------- Kamera ----------
  var kamZiel = new THREE.Vector3(), kamBlick = new THREE.Vector3(), blickJetzt = new THREE.Vector3(), kamSprung = true;
  var kamFest = null;       // { pos, blick } wenn die Pflege die Kamera uebernimmt
  // Freie Kamera: w = Drehung um die Spielerin (0 = von Sueden), e = Neigung (0 flach .. 1.5 von oben), d = Abstand
  var KAM_START = { w: 0, e: 0.785, d: 18.4 }, KAM_WEIT = { e: 1.0, d: 150 };
  var kam = { w: 0, e: KAM_START.e, d: KAM_START.d, zw: 0, ze: KAM_START.e, zd: KAM_START.d, taste: null, zeiger: {}, rechts: null };
  function kamGrenzen() {
    kam.ze = Math.max(0.06, Math.min(1.5, kam.ze)); kam.zd = Math.max(5, Math.min(230, kam.zd));
  }
  function kamKnoepfe() {
    if (KERN.el('kamKnoepfe')) return;
    var k = document.createElement('div'); k.id = 'kamKnoepfe';
    [['aufgaben', '📋', 'Aufgaben für heute'], ['karte', '🗺️', 'Übersicht'], ['links', '⟲', 'Kamera nach links drehen'], ['rechts', '⟳', 'Kamera nach rechts drehen'], ['nah', '＋', 'näher'], ['fern', '－', 'weiter weg'], ['hoch', '▲', 'Kamera höher, mehr von oben'], ['flach', '▼', 'Kamera flacher, mehr von der Seite']].forEach(function (e) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = e[1]; b.title = e[2]; b.setAttribute('aria-label', e[2]);
      if (e[0] === 'aufgaben') b.addEventListener('click', function () { if (modus === 'frei') HOFTAG.zeigeAufgaben(); });
      else if (e[0] === 'karte') b.addEventListener('click', function () {
        var weit = kam.zd > 60;
        kam.zd = weit ? KAM_START.d : KAM_WEIT.d; kam.ze = weit ? KAM_START.e : KAM_WEIT.e;
        if (weit) kam.zw = Math.round(kam.zw / (Math.PI * 2)) * Math.PI * 2;
      });
      else {
        b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); kam.taste = e[0]; });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, function () { kam.taste = null; }); });
        b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
      }
      k.appendChild(b);
    });
    document.body.appendChild(k);
  }
  // Maus: rechte Taste ziehen dreht und neigt. Finger: mit zwei Fingern drehen, neigen und zoomen.
  function kamZeiger(typ, e) {
    var z = kam.zeiger;
    if (typ === 'start') {
      z[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (e.button === 2) kam.rechts = e.pointerId;
      if (kam.rechts !== null || Object.keys(z).length >= 2) { API.ohneKnueppel = true; KERN.stoppeFinger(); }
    } else if (typ === 'zug' && z[e.pointerId]) {
      var p = z[e.pointerId], ids = Object.keys(z), dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (kam.rechts === e.pointerId) { kam.zw -= dx * 0.008; kam.ze += dy * 0.006; kam.w = kam.zw; kam.e = kam.ze; }
      else if (ids.length >= 2) {
        var o = z[ids[0] == e.pointerId ? ids[1] : ids[0]];
        var alt = Math.hypot(p.x - o.x, p.y - o.y), neu = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        if (alt > 8 && neu > 8) kam.zd *= alt / neu;
        kam.zw -= dx * 0.004; kam.ze += dy * 0.003;
        kam.w = kam.zw; kam.e = kam.ze; kam.d = kam.zd;
      }
      p.x = e.clientX; p.y = e.clientY;
      kamGrenzen();
    } else if (typ === 'ende') {
      delete z[e.pointerId];
      if (kam.rechts === e.pointerId) kam.rechts = null;
      if (kam.rechts === null && Object.keys(z).length < 2 && modus !== 'pflege') API.ohneKnueppel = false;
    }
  }
  function bewegeKamera(dt) {
    var imStall = (S.x > STALL.x0 - 0.5 && S.x < STALL.x1 + 0.5 && S.z > STALL.z0 && S.z < STALL.z1) || HOFTAG.imHaus(S.x, S.z);
    drinnen += ((imStall ? 1 : 0) - drinnen) * Math.min(1, dt * 4);
    SOUND.setzeDrinnen(drinnen);
    // Knoepfe und Tasten
    if (kam.taste === 'links') kam.zw += dt * 1.6; else if (kam.taste === 'rechts') kam.zw -= dt * 1.6;
    else if (kam.taste === 'nah') kam.zd *= Math.exp(-dt * 1.4); else if (kam.taste === 'fern') kam.zd *= Math.exp(dt * 1.4);
    else if (kam.taste === 'hoch') kam.ze += dt * 0.9; else if (kam.taste === 'flach') kam.ze -= dt * 0.9;
    kamGrenzen();
    var k = Math.min(1, dt * 8);
    kam.w += (kam.zw - kam.w) * k; kam.e += (kam.ze - kam.e) * k; kam.d += (kam.zd - kam.d) * k;
    var weit = kam.d > 45;
    dach.visible = (drinnen < 0.5 || weit) && !kamFest;
    HOFTAG.zeigeDach(dach.visible);
    szene.userData.unterDach = !dach.visible;
    suedWand.visible = dach.visible;
    if (kamFest) { kamZiel.copy(kamFest.pos); kamBlick.copy(kamFest.blick); }
    else if (modus === 'longe') {
      kamZiel.set(ORT.longe.mitte[0], 9, ORT.longe.mitte[1] + 15); kamBlick.set(ORT.longe.mitte[0], 1, ORT.longe.mitte[1]);
    } else {
      var schmal = window.innerWidth < window.innerHeight ? 1.35 : 1;
      // drinnen schaut die Kamera steiler und naeher, damit die Waende nicht im Weg sind
      var e = weit ? kam.e : kam.e + (Math.max(kam.e, 1.08) - kam.e) * drinnen;
      var d = (weit ? kam.d : kam.d + (Math.min(kam.d, 13.6) - kam.d) * drinnen) * schmal;
      var c = Math.cos(e);
      kamZiel.set(S.x + Math.sin(kam.w) * c * d, 0.5 + Math.sin(e) * d, S.z + Math.cos(kam.w) * c * d);
      kamBlick.set(S.x, 0.5 + Math.max(0, 0.6 - e) * 2.2, S.z);      // flache Kamera schaut etwas höher, sonst sieht man nur Boden
    }
    if (kamSprung) { kamera.position.copy(kamZiel); blickJetzt.copy(kamBlick); kamSprung = false; }
    else { kamera.position.lerp(kamZiel, 1 - Math.exp(-6 * dt)); blickJetzt.lerp(kamBlick, 1 - Math.exp(-6 * dt)); }
    kamera.lookAt(blickJetzt);
    sonne.folge(blickJetzt.x, 0, blickJetzt.z);
    // beim Rauszoomen weicht der Dunst zurueck, damit man die Umgebung sieht
    sonne.basis.nah = 70 + kam.d * 2; sonne.basis.fern = 260 + kam.d * 5;
  }

  // ---------- Ablauf ----------
  var aktion = null, hudZeit = 0, zustandZeit = 0;
  function schritt(dt, z) {
    zeit = z;
    bewegeSpielerin(dt);
    bewegePferde(dt);
    bewegeMaedchen(dt);
    if (modus === 'pflege') PFLEGE.schritt(dt, zeit);
    HOFLEBEN.schritt(dt, zeit);
    STURM.schrittHof(dt, zeit);
    HOFTAG.schritt(dt, zeit);
    if (modus === 'longe' && orte.longePferd) {
      var P = orte.longePferd;
      S.kurs = Math.atan2(P.x - S.x, P.z - S.z) + 0.5;
      P.longeZeit = (P.longeZeit || 0) + dt * (P.tempo > 0.5 ? 1 : 0);
    }
    bewegeKamera(dt);
    // Aktion in der Naehe
    aktion = modus === 'frei' ? findeAktion() : null;
    KERN.setzeAktion(aktion && aktion.text ? aktion.text : null);
    var zw = [];
    if (modus === 'frei') {
      if (S.reitet) zw.push({ text: '🥾 Absteigen', tun: function () { steigeAb(); } });
      else if (darfAufsteigen()) zw.push({ text: '🐴 Aufsteigen', tun: steigeAuf });
      zw = zw.concat(HOFTAG.zweit());
      var mb = !S.fuehrt && !S.reitet && zw.length < 3 ? inBoxVon(S.x, S.z) : null;
      if (mb && mb.pferd && mb.pferd.ort === 'box' && !STAND.istMeins(mb.pferd.def.id)) zw.push({ text: '⭐ Zu meinem Pferd machen', tun: (function (B) { return function () { frageMeins(B); }; })(mb.pferd) });
    }
    if (meinStern) {
      var MP = meinPferd();
      meinStern.visible = MP.ort !== 'box' && !MP.versteckt && modus !== 'pflege';
      meinStern.position.set(MP.x, (MP.ort === 'geritten' ? 3.5 : 2.75) + Math.sin(zeit * 3) * 0.08, MP.z);
      meinZeichen.userData.stern.rotation.y = zeit * 1.5;
    }
    REITEN.zweit(zw);
    var hinweis = aktion && aktion.hinweis ? aktion.hinweis : (modus === 'longe' ? 'Longieren: Wähle unten die Gangart. Das macht dein Pferd fit.' : modus === 'frei' ? STURM.hinweisHof() || HOFTAG.hinweis() || (S.reitet ? '🐴 Auf dem Hof geht es nur im Schritt. Durch das Tor im Süden reitest du ins Grüne: dort darfst du traben und galoppieren.' : null) : null);
    if (modus !== 'pflege') setzeHinweis(hinweis);
    orte.zeiger.visible = !!(aktion && aktion.text);
    if (orte.zeiger.visible) { orte.zeiger.position.set(aktion.x, 2.9 + Math.sin(zeit * 5) * 0.15, aktion.z); orte.zeiger.rotation.y = zeit * 2; }
    // Anzeige oben
    hudZeit -= dt;
    if (hudZeit <= 0 && modus !== 'pflege') {
      hudZeit = 0.4;
      var P2 = S.fuehrt || S.reitet || orte.longePferd || (modus === 'pflege' ? PFLEGE.pferd() : null);
      var b = !P2 && inBoxVon(S.x, S.z);
      if (b && b.pferd && b.pferd.ort === 'box') P2 = b.pferd;
      var html = REITEN.kachel('Münzen', '🪙 ' + STAND.daten.muenzen) + REITEN.kachel(WETTER.uhr() + ' Uhr', WETTER.text()) + HOFTAG.kachel();
      if (P2) html += REITEN.kachel(P2.def.name, 'Sauber ' + REITEN.messer(1 - P2.st.schmutz) + ' &nbsp;Satt ' + REITEN.messer(1 - P2.st.hunger) + ' &nbsp;Fit ' + REITEN.messer(P2.st.fit || 0));
      KERN.setzeHud(html);
    }
    zustandZeit -= dt;
    if (zustandZeit <= 0) { zustandZeit = 5; pferde.forEach(function (P3) { STAND.pferd(P3.def.id); zeigeZustand(P3); }); STAND.speichere(); }
  }
  var hinweisText = null, fotoPunkt = new THREE.Vector3();
  function setzeHinweis(text) {
    if (text === hinweisText) return;
    hinweisText = text;
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }

  var API = {
    name: '🏡 Pferdehof',
    text: 'Das Leben auf dem Pferdehof: Such dir im Stall ein Pferd aus, putze und füttere es und führe es zum Trainingsplatz, zum Turnier, zur Rennbahn oder ins Gelände. Für Siege gibt es Münzen für den Reitladen.',
    knopf: '🏡 Zum Pferdehof',
    klasse: 'welt-hof', mitSturm: true,
    start: function (opt) {
      opt = opt || {};
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      S.figur.setzeOutfit(KERN.spieler().outfit);
      KERN.betrete(API);
      modus = 'frei'; kamFest = null; kamSprung = true;
      kamKnoepfe(); kam.zeiger = {}; kam.rechts = null; kam.taste = null; API.ohneKnueppel = false;
      zeigeWerkzeug(null);
      if (opt.zurueckVon && ORT[opt.zurueckVon] && (S.fuehrt || opt.zurueckVon === 'ausritt')) {
        var t = ORT[opt.zurueckVon].tor;
        S.x = t[0]; S.z = t[1] - (opt.zurueckVon === 'rennbahn' || opt.zurueckVon === 'gelaende' || opt.zurueckVon === 'ausritt' ? 1.5 : 0);
        if (opt.zurueckVon === 'ausritt') S.kurs = Math.PI;
        if (S.fuehrt) { S.fuehrt.x = S.x + 1.2; S.fuehrt.z = S.z + 1.8; }
      }
      if (STAND.daten.begruesst && !STAND.daten.neuigkeiten6) {
        STAND.daten.neuigkeiten2 = true; STAND.daten.neuigkeiten3 = true; STAND.daten.neuigkeiten4 = true; STAND.daten.neuigkeiten5 = true; STAND.daten.neuigkeiten6 = true; STAND.speichere();
        modus = 'karte';
        KERN.zeigeKarte('mitte', '<h2>✨ Neu auf dem Pferdehof!</h2><div class="details" style="text-align:left">' +
          '• <b>⛈️ Gewitter:</b> Manchmal zieht ein Unwetter auf, auf dem Hof oder beim Ausritt. Dann schnell nach Hause und die Pferde in den Stall! Schlägt der Blitz in die Strohballen ein, holst du den <b>🚒 Löschschlauch</b> am Putzplatz und löschst das Feuer.<br>' +
          '• <b>🗺️ Radar und Landkarte:</b> Beim Ausritt zeigt der Radar oben rechts mit dem 🏡, wo es nach Hause geht. Antippen öffnet die Landkarte.<br>' +
          '• <b>⭐ Dein Pferd:</b> Du kümmerst dich jetzt nur noch um <b>' + meinPferd().def.name + '</b>. Die Box hat einen <b>goldenen Rahmen</b> und ein gelbes Schild. Die anderen Pferde versorgen die anderen Kinder vom Hof. Reiten darfst du trotzdem alle. In einer anderen Box kannst du mit dem Knopf ⭐ ein anderes Pferd zu deinem machen. Krank werden Pferde jetzt nur noch selten.<br>' +
          '• <b>Ausritt:</b> Im Süden ist ein neues <b>Tor ins Grüne</b>. Dahinter liegt eine riesige Landschaft mit Wäldern, Bergen, Feldern, einem Bach, einem Dorf und einer Windmühle. Unterwegs: Tiere, Slalom, Ringstechen, Wettreiten mit Lotte.<br>' +
          '• <b>Aufsteigen:</b> Mit einem Pferd an der Hand kannst du draußen aufsteigen (Knopf rechts unten). Auf dem Hof geht es im Schritt, draußen auch im Trab und Galopp. Unterwegs kannst du absteigen, führen und das <b>Pferd wechseln</b>.<br>' +
          '• <b>Mistgabel:</b> Sie lehnt westlich am Stall. Damit gabelst du Pferdeäpfel auf, wirfst sie in die Schubkarre und kippst sie am Misthaufen aus.<br>' +
          '• <b>Futterwagen:</b> Er steht in der Stallgasse. Im Vorratsraum beladen, dann alle Pferde nacheinander füttern.<br>' +
          '• <b>Putzen:</b> Pferde müssen jetzt von <b>beiden Seiten</b> sauber werden (🔄). Draußen gibt es einen <b>Putzplatz</b>, zum Beispiel für nach dem Ausritt.<br>' +
          '• <b>Dein Zimmer</b> ist viel gemütlicher: Bücher, Spieluhr und neue Sachen im Reitladen.<br>' +
          '• Das <b>Fohlen</b> siehst du beim Versorgen jetzt ganz nah. Und es tobt über die Weide!</div>',
          [{ text: 'Toll!', aktion: function () { KERN.schliesseKarte(); modus = 'frei'; } }]);
      }
      if (!STAND.daten.begruesst) {
        STAND.daten.begruesst = true; STAND.daten.neuigkeiten2 = true; STAND.daten.neuigkeiten3 = true; STAND.daten.neuigkeiten4 = true; STAND.daten.neuigkeiten5 = true; STAND.daten.neuigkeiten6 = true; STAND.speichere();
        modus = 'karte';
        KERN.zeigeKarte('mitte', '<h2>🏡 Willkommen auf dem Pferdehof!</h2><div class="details" style="text-align:left">' +
          '• Lauf mit den <b>Pfeiltasten</b> (oder WASD). Auf dem iPad: <b>Finger auflegen und ziehen</b>.<br>' +
          '• Im <b>Stall</b> wohnen sechs Pferde. <b>⭐ ' + meinPferd().def.name + '</b> ist dein Pferd, in der Box mit dem <b>goldenen Rahmen</b>. Geh hinein und <b>pflege</b> dein Pferd: abspritzen, striegeln, Hufe auskratzen, ausmisten, einstreuen. Um die anderen Pferde kümmern sich die anderen Kinder.<br>' +
          '• Im <b>Vorratsraum</b> gibt es Hafer, Heu und Möhren.<br>' +
          '• Leg deinem Pferd das <b>Halfter</b> an und führe es zum Trainingsplatz, Turnierplatz, zur Rennbahn, ins Gelände, in die Schrittmaschine, den Longierzirkel oder auf die Weide.<br>' +
          '• Für Siege und gute Pflege gibt es <b>Münzen</b> 🪙 für den <b>Reitladen</b>.<br>' +
          '• Auf der <b>Weide</b> wohnt ein <b>Fohlen</b>, östlich vom Stall sind <b>Tierärztin</b> und <b>Hufschmied</b>, am <b>Schwarzen Brett</b> gibt es Reitabzeichen.<br>' +
          '• Rechts sind die Knöpfe für die <b>Kamera</b> (drehen, zoomen, 🗺️ Übersicht) und die <b>📋 Aufgaben</b> für heute.<br>' +
          '• <b>Dein Zimmer</b> ist im Haus nördlich vom Stall. Wenn es Nacht wird, gehst du dort ins <b>Bett</b>.<br>' +
          '• Durch das <b>Tor im Süden</b> geht es ins Grüne: Mit einem Pferd an der Hand kannst du draußen <b>aufsteigen</b> (Knopf rechts unten) und losreiten.</div>',
          [{ text: 'Los geht\'s', aktion: function () { KERN.schliesseKarte(); modus = 'frei'; } }]);
      }
    },
    schritt: schritt,
    aktion: function () { if (modus === 'frei' && aktion && aktion.tun) aktion.tun(); },
    tipp: function (e) { if (modus === 'frei' && aktion && aktion.tun) aktion.tun(); },
    zeiger: function (typ, e) { if (modus === 'pflege') PFLEGE.zeiger(typ, e); else kamZeiger(typ, e); },
    rad: function (delta) { if (modus !== 'pflege') { kam.zd *= delta > 0 ? 1.12 : 0.89; kamGrenzen(); } },
    tasteGedrueckt: function (code) {
      if (code === 'KeyQ') kam.zw += Math.PI / 8; else if (code === 'KeyR') kam.zw -= Math.PI / 8;
      else if (code === 'NumpadAdd' || code === 'BracketRight' || code === 'KeyT') kam.zd *= 0.8;
      else if (code === 'NumpadSubtract' || code === 'Slash' || code === 'KeyG') kam.zd *= 1.25;
      else if (code === 'KeyM') { var w = kam.zd > 60; kam.zd = w ? KAM_START.d : KAM_WEIT.d; kam.ze = w ? KAM_START.e : KAM_WEIT.e; }
      kamGrenzen();
    },
    kamera3: function () { return kam; },
    zurueck: function () {
      if (modus === 'pflege') { PFLEGE.ende(); return; }
      STAND.speichere(); KERN.insMenue();
    },
    verlaesst: function () { zeigeWerkzeug(null); setzeHinweis(null); if (modus === 'pflege') PFLEGE.ende(true); if (S.reitet) steigeAb(true); STAND.speichere(); },
    // fuer die Pflege
    setzeModus: function (m) { modus = m; API.ohneKnueppel = m === 'pflege'; },
    setzeKamera: function (k) { kamFest = k; },
    zeigeWerkzeug: zeigeWerkzeug, setzeHinweis: setzeHinweis, zeigeZustand: zeigeZustand, zeigeSchmuck: zeigeSchmuck, nimm: nimm,
    steigeAuf: steigeAuf, steigeAb: steigeAb,
    fotoZiel: function () { var P = S.fuehrt || S.reitet || (modus === 'pflege' ? PFLEGE.pferd() : null); return fotoPunkt.set(P ? (P.x + S.x) / 2 : S.x, 1.3, P ? (P.z + S.z) / 2 : S.z); },
    spielerin: function () { return S; }, kam: function () { return kam; }, pferde: function () { return pferde; }, boxen: function () { return boxen; }, orte: ORT
  };
  return API;
})();
