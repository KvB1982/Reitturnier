// ============================================================
//  AUSRITT  -  gemuetlich zu zweit durch Wald und Wiesen an den See.
//  Kein Wettkampf: Man reitet frei herum, eine Freundin reitet mit.
//  Unterwegs gibt es sechs Orte zu entdecken und Aepfel zu sammeln.
// ============================================================
WELTEN.ausritt = (function () {
  'use strict';
  var WASSER = -0.35, SEE = [42, -30, 30], START = [0, 104];
  // Die Orte: [Kennung, Name, x, z, was die Freundin dazu sagt]
  var ORTE = [
    ['eiche', '🌳 Die alte Eiche', -38, 34, 'Die Eiche ist schon 300 Jahre alt!'],
    ['huette', '🏠 Die Waldhütte', -82, -8, 'Hier wohnt im Sommer der Förster.'],
    ['berg', '⛰️ Der Aussichtshügel', -58, -78, 'Von hier oben sieht man bis zum Hof!'],
    ['picknick', '🧺 Der Picknickplatz', 2, -40, 'Pause! Die Pferde dürfen grasen.'],
    ['see', '🌊 Der See', 30, -30, 'Komm, wir reiten ins Wasser!'],
    ['wiese', '🌸 Die Blumenwiese', 72, 48, 'So viele Blumen! Jetzt ein Galopp?']
  ];
  var PFAD = [[0, 104], [-10, 70], [-38, 40], [-66, 12], [-80, -14], [-70, -50], [-58, -74], [-30, -62], [0, -44], [22, -32], [48, 4], [70, 44], [40, 80], [0, 104]];
  var SPRUECHE = ['Wollen wir ein Stück traben?', 'Hörst du die Vögel?', 'Ausreiten ist das Schönste!', 'Schau mal, wie die Ohren spielen.', 'Bleib ruhig nah bei mir.', 'Hier riecht es nach Wald.'];

  var gebaut = false, szene, kamera, sonne, opt = {}, R = null, F = null, freund = null, freundin = null;
  var modus = 'aus', zeit = 0, gefunden = {}, aepfel = [], apfelZahl = 0, muenzen = 0, baeume = [], marken = [], enten = [];
  var redeZeit = 0, redeText = null, naechsteRede = 25, nass = 0, dauer = 0, freundName = 'Lotte', freundPferd = 'Wirbelwind';
  var d3 = new THREE.Object3D();

  function glatt(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function pfadAbstand(x, z) {
    var m = 1e9;
    for (var i = 1; i < PFAD.length; i++) {
      var a = PFAD[i - 1], b = PFAD[i], dx = b[0] - a[0], dz = b[1] - a[1];
      var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      var e = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
      if (e < m) m = e;
    }
    return m;
  }
  function boden(x, z) {
    var h = 1.6 + 1.8 * Math.sin(x * 0.031 + 0.5) * Math.cos(z * 0.027 + 0.3) + 0.9 * Math.sin(x * 0.067 - z * 0.049);
    h += 9 * Math.exp(-((x + 58) * (x + 58) + (z + 78) * (z + 78)) / 900);           // Aussichtshuegel
    h = Math.max(0.35, h);
    var eben = glatt(34, 16, Math.hypot(x - START[0], z - START[1]));                 // ebene Wiese am Start
    h = h * (1 - eben) + 0.8 * eben;
    var see = glatt(SEE[2] + 9, SEE[2] - 12, Math.hypot(x - SEE[0], (z - SEE[1]) * 1.25));   // Mulde fuer den See
    return h * (1 - see) + -1.15 * see;
  }

  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 40, nebelNah: 90, nebelFern: 330, himmel: 0xa9d8f2 });
    kamera = REITEN.neueKamera();
    var G = 300, N = 150, geo = new THREE.PlaneGeometry(G, G, N, N);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position, farben = new Float32Array(pos.count * 3), c = new THREE.Color(), weg = new THREE.Color(0xc9b386), i;
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), h = boden(x, z);
      pos.setY(i, h);
      if (h < WASSER + 0.2) c.setHex(0xcdbb8a);
      else if (h < WASSER + 0.55) c.setHex(0xa9c070);
      else {
        c.setHex(0x74c054).lerp(new THREE.Color(0x4f9a3e), Math.max(0, Math.min(1, (h - 1.5) / 7)));
        if (x < -18 && z < 60) c.lerp(new THREE.Color(0x4c8a3c), 0.5);                // Waldboden dunkler
        c.lerp(weg, glatt(2.6, 1.0, pfadAbstand(x, z)));
      }
      c.multiplyScalar(0.9 + HERDE.rausch(x * 0.15, 3, z * 0.15, 6) * 0.2);
      farben[i * 3] = c.r; farben[i * 3 + 1] = c.g; farben[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    geo.computeVertexNormals();
    var land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    land.receiveShadow = true; szene.add(land);
    var wasser = new THREE.Mesh(new THREE.CircleGeometry(SEE[2] + 12, 40), new THREE.MeshStandardMaterial({ color: 0x3f97d6, transparent: true, opacity: 0.8, roughness: 0.15 }));
    wasser.rotation.x = -Math.PI / 2; wasser.position.set(SEE[0], WASSER, SEE[1]); szene.add(wasser);

    // Baeume: dichter Wald im Westen, Baumgruppen sonst. Pfad, See, Wiese und Start bleiben frei.
    var zf = 11, liste = [];
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (i = 0; i < 1500 && liste.length < 380; i++) {
      var imWald = i < 900;
      var bx = imWald ? -135 + zuf() * 125 : -140 + zuf() * 280, bz = imWald ? -110 + zuf() * 175 : -140 + zuf() * 280;
      var hh = boden(bx, bz), frei = pfadAbstand(bx, bz);
      if (hh < 0.5 || frei < (imWald ? 3.8 : 10) || Math.hypot(bx - START[0], bz - START[1]) < 24) continue;
      if (Math.hypot(bx - 72, bz - 48) < 26 || Math.hypot(bx + 58, bz + 78) < 9 || Math.hypot(bx - 2, bz + 40) < 9 || Math.hypot(bx + 82, bz + 8) < 8) continue;
      var gr = 0.9 + zuf() * 1.1;
      liste.push([bx, hh - 0.1, bz, gr, zuf() < (imWald ? 0.55 : 0.25) ? 1 : 0]);
      if (frei < 40) baeume.push([bx, bz, 0.34 * gr]);
    }
    liste.push([-41, boden(-41, 37) - 0.2, 37, 3.6, 0]);                              // die alte Eiche
    baeume.push([-41, 37, 1.3]);
    szene.add(BAU.wald(liste));

    // Blumenwiese
    var bl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), 420), bf = [0xff6fae, 0xffe36b, 0xffffff, 0xb07cff, 0xff8a3c];
    for (i = 0; i < 420; i++) {
      var w = zuf() * 6.283, e = Math.sqrt(zuf()) * 24, fx = 72 + Math.sin(w) * e, fz = 48 + Math.cos(w) * e;
      d3.position.set(fx, boden(fx, fz) + 0.18, fz); d3.scale.setScalar(0.7 + zuf() * 0.8); d3.updateMatrix();
      bl.setMatrixAt(i, d3.matrix); bl.setColorAt(i, new THREE.Color(bf[i % 5]));
    }
    szene.add(bl);
    // Waldhuette
    var hy = boden(-86, -10), hu = new THREE.Group(); hu.position.set(-86, hy, -10); hu.rotation.y = 0.9; szene.add(hu);
    BAU.kasten(4.2, 2.4, 3.4, 0x8a5a33, hu, 0, 1.2, 0); BAU.kasten(0.9, 1.7, 0.1, 0x5a3a1e, hu, 0.6, 0.85, 1.72); BAU.kasten(0.9, 0.8, 0.1, 0xcfe6f5, hu, -1.0, 1.4, 1.72);
    var hd = BAU.netz(new THREE.ConeGeometry(3.6, 1.7, 4), 0x6b3a24, hu, 0, 3.25, 0); hd.rotation.y = Math.PI / 4; hd.scale.set(1.05, 1, 0.85);
    baeume.push([-86, -10, 2.6]);
    // Picknickplatz: Decke, Korb, Bank
    var py = boden(2, -44), pk = new THREE.Group(); pk.position.set(2, py, -44); szene.add(pk);
    BAU.kasten(2.6, 0.04, 2.0, 0xe5412d, pk, 0, 0.06, 0).castShadow = false;
    for (i = 0; i < 4; i++) BAU.kasten(0.6, 0.045, 2.0, 0xffffff, pk, -0.98 + i * 0.66, 0.065, 0).castShadow = false;
    BAU.kasten(0.6, 0.4, 0.42, 0xb9843c, pk, 0.5, 0.26, 0.3); BAU.netz(new THREE.SphereGeometry(0.12, 8, 6), 0xd11f3a, pk, -0.4, 0.2, -0.2);
    BAU.netz(new THREE.SphereGeometry(0.12, 8, 6), 0x7cc35a, pk, -0.65, 0.2, 0.1);
    // Gipfel: Bank und Fahne
    var gy = boden(-58, -78), gp = new THREE.Group(); gp.position.set(-58, gy, -78); szene.add(gp);
    BAU.kasten(2.0, 0.1, 0.5, 0x9a6b3f, gp, 2.4, 0.5, 0); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, gp, 1.6, 0.25, 0); BAU.kasten(0.1, 0.5, 0.4, 0x7a4a2a, gp, 3.2, 0.25, 0);
    var fl = BAU.flagge(0xe84393, 4.5); fl.position.set(-2, 0, 0); gp.add(fl);
    // Steg am See und Enten
    var sg = new THREE.Group(); sg.position.set(SEE[0] - 21, 0, SEE[1] + 8); sg.rotation.y = -1.2; szene.add(sg);
    BAU.kasten(1.6, 0.14, 9, 0x9a6b3f, sg, 0, 0.05, 4);
    for (i = 0; i < 4; i++) { BAU.walze(0.1, 0.1, 1.6, 0x7a4a2a, sg, -0.7, -0.5, 1 + i * 2.4, 6); BAU.walze(0.1, 0.1, 1.6, 0x7a4a2a, sg, 0.7, -0.5, 1 + i * 2.4, 6); }
    for (i = 0; i < 4; i++) {
      var en = new THREE.Group();
      BAU.netz(new THREE.SphereGeometry(0.28, 8, 6), i ? 0xffffff : 0x8a6a3c, en).scale.set(1, 0.7, 1.5);
      BAU.netz(new THREE.SphereGeometry(0.14, 8, 6), i ? 0xffffff : 0x2f7d3a, en, 0, 0.26, 0.3);
      BAU.netz(new THREE.ConeGeometry(0.05, 0.16, 5), 0xf08a24, en, 0, 0.24, 0.47).rotation.x = Math.PI / 2;
      szene.add(en); enten.push({ g: en, w: i * 1.6, r: 5 + i * 2.2 });
    }
    // Schilder ueber den Orten
    ORTE.forEach(function (o) {
      var y = Math.max(WASSER, boden(o[2], o[3]));
      var s = BAU.schwebeText(o[1], 0.8, { schrift: 44 }); s.position.set(o[2], y + 7.4, o[3]); szene.add(s);
      var stern = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xffd23c }));
      stern.position.set(o[2], y + 4.6, o[3]); szene.add(stern);
      marken.push({ id: o[0], schild: s, stern: stern, y: y + 4.6 });
    });
    // Start: Tor mit Schild
    var st = new THREE.Group(); st.position.set(START[0], boden(START[0], START[1] + 17), START[1] + 17); szene.add(st);
    BAU.walze(0.18, 0.2, 4, 0x7a4a2a, st, -2.6, 2, 0); BAU.walze(0.18, 0.2, 4, 0x7a4a2a, st, 2.6, 2, 0); BAU.kasten(6.2, 1.0, 0.2, 0x2f7d3a, st, 0, 4, 0);
    var ts = BAU.tafel('🏡 Zum Pferdehof', 0.6, { grund: null, farbe: '#ffffff', schrift: 60 }); ts.position.set(0, 4, -0.12); ts.rotation.y = Math.PI; st.add(ts);
    // Aepfel zum Einsammeln entlang des Pfads
    var ag = new THREE.SphereGeometry(0.22, 8, 6), am = new THREE.MeshStandardMaterial({ color: 0xd11f3a, roughness: 0.5 });
    for (i = 0; i < 16; i++) {
      var a = PFAD[1 + (i % (PFAD.length - 2))], b = PFAD[2 + (i % (PFAD.length - 2))], t = 0.2 + zuf() * 0.6;
      var ax = a[0] + (b[0] - a[0]) * t + (zuf() - 0.5) * 5, az = a[1] + (b[1] - a[1]) * t + (zuf() - 0.5) * 5;
      if (boden(ax, az) < 0.2) continue;
      var m = new THREE.Mesh(ag, am); m.castShadow = true; szene.add(m);
      aepfel.push({ netz: m, x: ax, z: az, y: boden(ax, az) + 1.0, da: true });
    }

    R = REITEN.neu(KERN.pferd, { hoehe: boden, grenze: grenze, drehung: 1.7, beschleunigung: 3.5 });
    // die Freundin auf ihrem Pferd
    freund = HERDE.bauePferd({ fell: 'fuchs', saat: 31 });
    freund.setzeAusruestung({ gamaschen: '#f5f5f5' });
    freundin = REITEN.reiterAuf(freund, { jacke: '#c0392b', hose: '#f4f1e8', stiefel: '#2a1c12', haare: '#5a3a1e', helm: '#1c1c1c', frisur: 'zoepfe' });
    szene.add(freund.wurzel);
    F = REITEN.neu(freund, { hoehe: boden, herde: true, drehung: 2.2, laut: 0.4, beschleunigung: 4.5 });
    gebaut = true;
  }

  function grenze(r) {
    r.x = Math.max(-135, Math.min(135, r.x)); r.z = Math.max(-135, Math.min(START[1] + 5, r.z));
    for (var i = 0; i < baeume.length; i++) {
      var t = baeume[i], dx = r.x - t[0], dz = r.z - t[1], e = Math.hypot(dx, dz), min = t[2] + 0.55;
      if (e < min && e > 0.001) { r.x = t[0] + dx / e * min; r.z = t[1] + dz / e * min; }
    }
  }

  function sage(text, sek) { redeText = freundName + ': „' + text + '“'; redeZeit = sek || 5; setzeHinweis(redeText); }
  var hinweisAlt = null;
  function setzeHinweis(text) {
    if (text === hinweisAlt) return;
    hinweisAlt = text;
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }

  function beginne() {
    KERN.schliesseKarte();
    modus = 'ritt';
    document.body.className = 'im-welt welt-ausritt mit-lenken mit-tempo';
    sage('Los geht’s! Folge einfach dem Weg, ich bleibe bei dir.', 6);
  }

  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    var lenk = 0;
    if (modus === 'ritt') {
      dauer += dt;
      lenk = REITEN.lenkung();
      R.eigen = Math.max(0, Math.min(9, (R.eigen || 0) + REITEN.gas() * 4.5 * dt));
      var tief = Math.max(0, WASSER - boden(R.x, R.z));
      R.wunsch = R.eigen * (tief > 0.5 ? 0.4 : tief > 0.08 ? 0.7 : 1);
      if (tief > 0.08 && R.tempo > 0.5) { nass += dt; if (nass > 0.28) { nass = 0; KERN.huf(0.1, 2600 + Math.random() * 900); } }
      // Orte entdecken
      ORTE.forEach(function (o, i) {
        if (gefunden[o[0]] || Math.hypot(R.x - o[2], R.z - o[3]) > 9) return;
        gefunden[o[0]] = true;
        muenzen += 3; STAND.daten.muenzen += 3;
        STAND.merke('ausritt', Object.keys(gefunden).length);
        KERN.meldung('Entdeckt: ' + o[1] + '  +3 🪙', 'perfekt'); KERN.klang('perfekt');
        sage(o[4], 6);
        if (Object.keys(gefunden).length === ORTE.length) { muenzen += 10; STAND.daten.muenzen += 10; setTimeout(function () { KERN.meldung('Alle Orte entdeckt!  +10 🪙', 'perfekt'); KERN.klang('fanfare'); }, 1600); }
        STAND.speichere();
      });
      aepfel.forEach(function (a) {
        if (!a.da || Math.hypot(R.x - a.x, R.z - a.z) > 1.7) return;
        a.da = false; a.netz.visible = false; apfelZahl++; muenzen++; STAND.daten.muenzen++;
        KERN.meldung('🍎 Mmmh!  +1 🪙', 'gut'); KERN.ton(880, 0.1, 'triangle', 0.16); KERN.ton(1320, 0.14, 'triangle', 0.14, 0.08);
      });
      // ab und zu sagt die Freundin etwas
      naechsteRede -= dt;
      if (naechsteRede <= 0 && redeZeit <= 0) { naechsteRede = 30 + Math.random() * 25; sage(WETTER.regnet() ? 'Brr, es regnet. Macht nichts, wir sind nicht aus Zucker!' : SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)], 5); }
      var amTor = Math.hypot(R.x - START[0], R.z - START[1]) < 10 && dauer > 15;
      KERN.setzeAktion(amTor ? '🏡 Nach Hause reiten' : null);
    } else R.wunsch = 0;
    if (redeZeit > 0) { redeZeit -= dt; if (redeZeit <= 0) setzeHinweis(null); }
    R.schritt(dt, lenk, zeit);

    // die Freundin reitet links neben uns her
    var vx = Math.sin(R.kurs), vz = Math.cos(R.kurs);
    var zx = R.x - vx * 1.2 + vz * 2.6, zz = R.z - vz * 1.2 - vx * 2.6;
    var dx = zx - F.x, dz = zz - F.z, dist = Math.hypot(dx, dz);
    var zielKurs = dist > 1.2 ? Math.atan2(dx, dz) : R.kurs;
    var df = Math.atan2(Math.sin(zielKurs - F.kurs), Math.cos(zielKurs - F.kurs));
    var vorn = dx * Math.sin(F.kurs) + dz * Math.cos(F.kurs);
    F.wunsch = Math.max(0, Math.min(10.5, R.tempo + vorn * 0.9));
    if (dist < 0.8 && R.tempo < 0.3) F.wunsch = 0;
    if (dist > 60) F.setze(zx, zz, R.kurs);
    F.schritt(dt, Math.max(-1, Math.min(1, df * 2.2)), zeit);
    freundin.huefte.position.y = F.gang === 'trab' ? Math.abs(Math.sin(F.phase)) * 0.06 : 0;

    marken.forEach(function (m) {
      m.stern.visible = !gefunden[m.id];
      m.stern.rotation.y = zeit * 2; m.stern.position.y = m.y + Math.sin(zeit * 3 + m.y) * 0.3;
    });
    aepfel.forEach(function (a, i) { if (a.da) { a.netz.position.set(a.x, a.y + Math.sin(zeit * 2.5 + i) * 0.15, a.z); a.netz.rotation.y = zeit; } });
    enten.forEach(function (e) {
      e.w += dt * 0.12;
      e.g.position.set(SEE[0] + Math.sin(e.w) * e.r, WASSER + 0.08 + Math.sin(zeit * 2 + e.r) * 0.02, SEE[1] + Math.cos(e.w) * e.r * 0.7);
      e.g.rotation.y = e.w + Math.PI / 2;
    });
    REITEN.folge(kamera, R, dt, { boden: boden, hinten: 9, hoch: 4.4 });
    sonne.folge(R.x, R.y, R.z);
    KERN.setzeHud(REITEN.kachel('Entdeckt', Object.keys(gefunden).length + ' / ' + ORTE.length) + REITEN.kachel('Äpfel', '🍎 ' + apfelZahl) +
      REITEN.kachel('Gang', REITEN.GANG_NAME[R.gang]) + REITEN.kachel(WETTER.uhr() + ' Uhr', WETTER.text()));
  }

  function nachHause() {
    if (modus !== 'ritt') return;
    modus = 'fertig';
    KERN.setzeAktion(null); setzeHinweis(null);
    var n = Object.keys(gefunden).length;
    STAND.speichere();
    KERN.klang('ziel');
    KERN.zeigeKarte('mitte', '<div class="klein">Ausritt mit ' + KERN.esc(freundName) + '</div><h2>Das war schön!</h2>' +
      '<div class="details">Entdeckte Orte: <b>' + n + ' von ' + ORTE.length + '</b><br>Gesammelte Äpfel: <b>🍎 ' + apfelZahl + '</b></div>' +
      (muenzen ? '<div class="lohn">+' + muenzen + ' 🪙 Münzen <small>(unterwegs gesammelt)</small></div>' : ''),
      [{ text: 'Weiter reiten', aktion: function () { KERN.schliesseKarte(); modus = 'ritt'; dauer = 0; } },
       { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'ausritt', orte: n }); } }]);
  }

  var API = {
    name: '🌳 Ausritt',
    text: 'Ein gemütlicher Ausritt zu zweit: Mit einer Freundin reitest du frei durch den Wald, über die Blumenwiese und an den See. Entdecke sechs Orte und sammle Äpfel. Hier gibt es keine Zeit und keine Gegner.',
    knopf: '🌳 Zum Ausritt',
    klasse: 'welt-ausritt',
    start: function (o) {
      opt = o || {};
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      KERN.pferd.setzeOutfit(REITEN.outfitMit(opt.pferd));
      KERN.pferd.setzeAuszeichnung(false);
      KERN.pferd.setzeReiterin(true);
      szene.add(KERN.pferd.wurzel);
      // wenn das Fohlen gross ist, reitet die Freundin darauf
      var b = typeof HOFLEBEN !== 'undefined' && STAND.daten.fohlen && STAND.daten.fohlen.wuchs >= 1 ? STAND.daten.fohlen : null;
      freundPferd = b ? (b.name || 'dein großes Fohlen') : 'Wirbelwind';
      gefunden = {}; apfelZahl = 0; muenzen = 0; dauer = 0; nass = 0; redeZeit = 0; naechsteRede = 25;
      aepfel.forEach(function (a) { a.da = true; a.netz.visible = true; });
      R.setze(START[0], START[1], Math.PI); R.eigen = 0;
      F.setze(START[0] + 2.6, START[1] + 1.2, Math.PI);
      kamera.userData.sprung = true;
      KERN.betrete(API);
      modus = 'karte';
      setzeHinweis(null);
      KERN.zeigeKarte('mitte', '<div class="klein">Ausritt zu zweit</div><h2>🌳 Ab ins Grüne!</h2><div class="details" style="text-align:left">' +
        KERN.esc(freundName) + ' reitet auf <b>' + KERN.esc(freundPferd) + '</b> mit dir aus.<br>' +
        '• <b>↑ ↓</b> schneller und langsamer (Schritt, Trab, Galopp), <b>← →</b> lenken. Auf dem iPad: Finger auflegen und ziehen.<br>' +
        '• Folge dem hellen Weg. Über sechs Orten schwebt ein <b>goldener Stern</b>: Reite hin und entdecke sie.<br>' +
        '• Im See dürfen die Pferde planschen. Äpfel am Weg schmecken deinem Pferd.<br>' +
        '• Am Tor geht es wieder nach Hause.</div>',
        [{ text: 'Losreiten', aktion: beginne }, { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, null); } }]);
      schritt(0.001, zeit);
    },
    schritt: schritt, aktion: function () { if (KERN.el('springen').textContent.indexOf('Hause') >= 0) nachHause(); }, tipp: function () {},
    zurueck: function () { if (modus === 'ritt' && dauer > 5) nachHause(); else { modus = 'aus'; setzeHinweis(null); REITEN.heim(opt, null); } },
    verlaesst: function () { modus = 'aus'; setzeHinweis(null); KERN.pferd.koerper.rotation.set(0, 0, 0); KERN.pferd.koerper.position.y = 0; },
    zustand: function () { return { R: R, F: F, gefunden: gefunden, modus: modus, orte: ORTE, aepfel: aepfel }; }
  };
  return API;
})();
