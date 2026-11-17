// ============================================================
//  MILITARY / GELAENDERITT  -  auf Zeit durchs Gelaende:
//  Baumstaemme, Hecken, Mauern, ein Bach zum Ueberspringen, eine Furt,
//  eine Bruecke, Huegel und ein Wald.  Fehler kosten Strafsekunden.
// ============================================================
WELTEN.gelaende = (function () {
  'use strict';
  var WASSER = -1.1, BRUECKE_X = 55, BRUECKE_Y = 0.6;
  // Strecke: [x, z, art, hoehe]   art: start | stamm | hecke | mauer | bach | furt | bruecke | tor | ziel
  var STRECKE = [
    [0, 92, 'start'], [0, 62, 'stamm', 0.8], [-22, 38, 'hecke', 0.9], [-42, 20, 'tor'], [-54, 0, 'tor'],
    [-50, -32, 'furt'], [-38, -58, 'mauer', 0.8], [-12, -76, 'tor'], [16, -72, 'stamm', 0.9], [44, -52, 'bach'],
    [55, -30, 'tor'], [55, -8, 'bruecke'], [58, 24, 'mauer', 0.9], [38, 56, 'hecke', 1.0], [14, 84, 'ziel']
  ];
  var STRAFE = { verweigert: 8, angeschlagen: 3, nass: 5, baum: 2 };
  var gebaut = false, szene, kamera, sonne, opt = {}, R = null, weg = null, tore = [], baeume = [];
  var modus = 'aus', uhr = 0, strafe = 0, naechstes = 0, stopp = null, zeit = 0, aufBruecke = false, steuerung = 'lenken';
  var pfeil = null, verweigert = 0, imWasser = 0, fehler = { verweigert: 0, angeschlagen: 0, nass: 0, baum: 0 }, baumPause = 0;

  function glatt(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function flussZ(x) { return -20 + 12 * Math.sin(x * 0.03); }
  function boden(x, z) {
    var h = 2.6 * Math.sin(x * 0.033 + 0.8) * Math.cos(z * 0.029 - 0.4) + 1.2 * Math.sin(x * 0.071 + z * 0.053) +
      7 * Math.exp(-((x + 30) * (x + 30) + (z + 66) * (z + 66)) / 1100) + 1.0;
    // Start und Ziel liegen auf einer ebenen Wiese
    var eben = glatt(40, 22, Math.hypot(x - 7, z - 90));
    h = h * (1 - eben) + 0.8 * eben;
    var d = Math.abs(z - flussZ(x));
    // an der Bruecke sind beide Ufer gleich hoch
    var fb = glatt(16, 7, Math.abs(x - BRUECKE_X)) * glatt(30, 22, d);
    h = h * (1 - fb) + BRUECKE_Y * fb;
    // Flussbett; an der Furt (x = -50) ist das Wasser flach
    var f = glatt(15, 6, d);
    var bett = -1.75 + 0.42 * Math.exp(-(x + 50) * (x + 50) / 60);
    h = h * (1 - f) + bett * f;
    // der Bach zum Ueberspringen (bei Tor 'bach'): schmale Rinne quer zur Strecke
    var bx = x - 44, bz = z + 52, laengs = bx * 0.809 + bz * 0.588, quer = -bx * 0.588 + bz * 0.809;
    var rinne = glatt(1.7, 0.7, Math.abs(laengs)) * glatt(16, 9, Math.abs(quer));
    h = h * (1 - rinne) + Math.min(h, -1.45) * rinne;
    return h;
  }
  function hoehe(x, z) {
    if (aufBruecke) return BRUECKE_Y;
    return boden(x, z);
  }

  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 40, nebelNah: 90, nebelFern: 330, himmel: 0xa9d8f2 });
    kamera = REITEN.neueKamera();
    // Gelaende mit Farben je nach Hoehe
    var G = 300, N = 150, geo = new THREE.PlaneGeometry(G, G, N, N);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position, farben = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), h = boden(x, z);
      pos.setY(i, h);
      if (h < WASSER + 0.25) c.setHex(0xb9a57a);
      else if (h < WASSER + 0.7) c.setHex(0x9fb86a);
      else c.setHex(0x6fbb50).lerp(new THREE.Color(0x4f9a3e), Math.max(0, Math.min(1, (h - 1) / 7)));
      var fleck = HERDE.rausch(x * 0.15, 3, z * 0.15, 4);
      c.multiplyScalar(0.9 + fleck * 0.2);
      farben[i * 3] = c.r; farben[i * 3 + 1] = c.g; farben[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    geo.computeVertexNormals();
    var land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    land.receiveShadow = true;
    szene.add(land);
    var wasser = new THREE.Mesh(new THREE.PlaneGeometry(G, G), new THREE.MeshStandardMaterial({ color: 0x3f97d6, transparent: true, opacity: 0.78, roughness: 0.2 }));
    wasser.rotation.x = -Math.PI / 2; wasser.position.y = WASSER;
    szene.add(wasser);

    // Weg durch alle Tore
    weg = KERN.baueWeg(STRECKE.map(function (s) { return [s[0], s[1]]; }));
    var v = new THREE.Vector3(), r = new THREE.Vector3();
    STRECKE.forEach(function (s, nr) {
      var sWeg = weg.sVonPunkt(nr);
      weg.posBei(sWeg, v); weg.richtungBei(sWeg, r);
      if (s[2] === 'bruecke') { r.set(0, 0, 1); v.x = BRUECKE_X; }
      var t = { nr: nr, art: s[2], hoch: s[3] || 0, x: v.x, z: v.z, fx: r.x, fz: r.z, s: sWeg, breit: s[2] === 'bruecke' ? 2.6 : 5.5, versuche: 0, fertig: false, gruppe: new THREE.Group() };
      var y = boden(t.x, t.z);
      t.y = y;
      t.gruppe.position.set(t.x, 0, t.z);
      t.gruppe.rotation.y = Math.atan2(r.x, r.z);
      szene.add(t.gruppe);
      // Flaggen: rot rechts, weiss links (wie im echten Gelaenderitt)
      [-1, 1].forEach(function (seite) {
        var fx = t.x - r.z * seite * (t.breit / 2 + 0.4) * -1, fz = t.z + r.x * seite * (t.breit / 2 + 0.4) * -1;
        var fl = BAU.flagge(seite > 0 ? 0xe5412d : 0xffffff, t.art === 'start' || t.art === 'ziel' ? 4 : 2.6);
        fl.position.set(fx, t.art === 'bruecke' ? BRUECKE_Y : boden(fx, fz), fz); fl.rotation.y = Math.atan2(r.x, r.z) + Math.PI / 2;
        szene.add(fl);
      });
      var g = t.gruppe;
      var vorher = g.children.length;
      if (t.art === 'stamm') {
        var stamm = BAU.walze(0.45, 0.5, t.breit, 0x7a5230, g, 0, y + 0.42, 0, 10); stamm.rotation.z = Math.PI / 2;
        BAU.walze(0.4, 0.45, t.breit * 0.8, 0x6b4526, g, 0, y + 0.42 + (t.hoch > 0.85 ? 0.55 : -9), 0.1, 10).rotation.z = Math.PI / 2;
        BAU.walze(0.13, 0.15, 0.7, 0x6b4526, g, 1.2, y + 0.9, 0.3, 6).rotation.x = 0.5;
        MODELLE3D.setze('baumstamm', g, { y: y - 0.05, vordreh: Math.PI / 4, masse: [t.breit, t.hoch + 0.25, 1.5], statt: g.children.slice(vorher) });
      } else if (t.art === 'hecke') {
        BAU.kasten(t.breit, t.hoch, 0.9, 0x2f7d3a, g, 0, y + t.hoch / 2, 0);
        for (var b = 0; b < 7; b++) BAU.netz(new THREE.IcosahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: b % 2 ? 0x3a8f45 : 0x2f7d3a, flatShading: true, roughness: 1 }), g, -t.breit / 2 + 0.4 + b * (t.breit - 0.8) / 6, y + t.hoch, 0);
      } else if (t.art === 'mauer') {
        BAU.kasten(t.breit, t.hoch, 0.7, 0x9a9a92, g, 0, y + t.hoch / 2, 0);
        for (var st = 0; st < 9; st++) BAU.kasten(0.55, 0.22, 0.75, st % 2 ? 0x8a8a82 : 0xaaaaa2, g, -t.breit / 2 + 0.35 + st * (t.breit - 0.7) / 8, y + t.hoch + 0.08, 0);
      } else if (t.art === 'start' || t.art === 'ziel') {
        var banner = BAU.tafel(t.art === 'start' ? 'START' : 'ZIEL', 0.9, { grund: t.art === 'start' ? '#27ae60' : '#e5412d', farbe: '#ffffff' });
        banner.position.set(0, y + 4.3, 0); banner.rotation.y = Math.PI; g.add(banner);
        var hinten = banner.clone(); hinten.rotation.y = 0; hinten.position.z = 0.02; g.add(hinten);
      } else if (t.art === 'bruecke') {
        // Holzbruecke ueber den Fluss
        var lang = 26, mitteZ = flussZ(BRUECKE_X) - t.z;
        BAU.kasten(3.4, 0.25, lang, 0x9a6b3f, g, 0, BRUECKE_Y - 0.13, mitteZ);
        for (var pl = 0; pl < 13; pl++) BAU.kasten(3.4, 0.04, 0.12, 0x7a4a2a, g, 0, BRUECKE_Y + 0.01, mitteZ - lang / 2 + 1 + pl * 2);
        [-1.6, 1.6].forEach(function (sx) {
          BAU.kasten(0.12, 0.12, lang, 0x7a4a2a, g, sx, BRUECKE_Y + 1.0, mitteZ);
          for (var pf = 0; pf < 7; pf++) BAU.kasten(0.16, 1.1 + (pf > 0 && pf < 6 ? 2.2 : 0), 0.16, 0x7a4a2a, g, sx, BRUECKE_Y + 0.5 - (pf > 0 && pf < 6 ? 1.1 : 0), mitteZ - lang / 2 + pf * lang / 6);
        });
        t.z0 = flussZ(BRUECKE_X) - lang / 2; t.z1 = flussZ(BRUECKE_X) + lang / 2;
      }
      tore.push(t);
    });
    // Punkte am Boden zeigen den Weg
    var n = Math.floor(weg.laenge / 4), punkte = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), n), d = new THREE.Object3D();
    for (var k = 0; k < n; k++) { weg.posBei(k * 4 + 2, v); var by = Math.abs(v.x - BRUECKE_X) < 2.5 && Math.abs(v.z - flussZ(v.x)) < 13 ? BRUECKE_Y : Math.max(WASSER, boden(v.x, v.z)); d.position.set(v.x, by + 0.12, v.z); d.updateMatrix(); punkte.setMatrixAt(k, d.matrix); }
    szene.add(punkte);
    pfeil = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f }));
    pfeil.rotation.x = Math.PI;
    szene.add(pfeil);

    // Baeume: dichter Wald im Westen, sonst verstreut. Der Weg bleibt frei.
    var zf = 5, liste = [];
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    var wegPunkte = [];
    for (var ws = 0; ws < weg.laenge; ws += 2.5) { weg.posBei(ws, v); wegPunkte.push([v.x, v.z]); }
    function abstandWeg(x, z) { var m = 1e9; for (var q = 0; q < wegPunkte.length; q++) { var dd = Math.hypot(wegPunkte[q][0] - x, wegPunkte[q][1] - z); if (dd < m) m = dd; } return m; }
    for (var bn = 0; bn < 900 && liste.length < 330; bn++) {
      var imWald = bn < 420;
      var bx = imWald ? -78 + zuf() * 62 : -140 + zuf() * 280, bz = imWald ? -12 + zuf() * 56 : -140 + zuf() * 280;
      var hh = boden(bx, bz), frei = abstandWeg(bx, bz);
      if (hh < WASSER + 0.5 || frei < (imWald ? 3.6 : 9) || Math.hypot(bx - 7, bz - 90) < 22) continue;
      var gr = 0.9 + zuf() * 1.0, art = zuf() < (imWald ? 0.55 : 0.3) ? 1 : 0;
      liste.push([bx, hh - 0.1, bz, gr, art]);
      if (frei < 30) baeume.push([bx, bz, 0.34 * gr]);
    }
    szene.add(BAU.wald(liste));
    // Steine und Schilf am Fluss
    var steine = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.7, 0), new THREE.MeshStandardMaterial({ color: 0x8f8f88, flatShading: true, roughness: 1 }), 50);
    for (var sn = 0; sn < 50; sn++) { var sx = -140 + zuf() * 280, sz = flussZ(sx) + (zuf() - 0.5) * 22; d.position.set(sx, boden(sx, sz) + 0.1, sz); d.scale.set(0.6 + zuf(), 0.4 + zuf() * 0.5, 0.6 + zuf()); d.rotation.set(0, zuf() * 6, 0); d.updateMatrix(); steine.setMatrixAt(sn, d.matrix); }
    steine.castShadow = true; szene.add(steine);

    R = REITEN.neu(KERN.pferd, { hoehe: hoehe, grenze: grenze, drehung: 1.6 });
    gebaut = true;
  }

  // Baeume, Bruecke und Kartenrand
  function grenze(r) {
    r.x = Math.max(-135, Math.min(135, r.x)); r.z = Math.max(-135, Math.min(135, r.z));
    var d = Math.abs(r.z - flussZ(r.x)), b = tore[11];
    if (aufBruecke) {
      r.x = Math.max(BRUECKE_X - 1.15, Math.min(BRUECKE_X + 1.15, r.x));
      if (r.z < b.z0 - 0.5 || r.z > b.z1 + 0.5) aufBruecke = false;
    } else if (Math.abs(r.x - BRUECKE_X) < 1.5 && r.z > b.z0 - 0.5 && r.z < b.z1 + 0.5 && (r.z < b.z0 + 1.5 || r.z > b.z1 - 1.5)) aufBruecke = true;
    else if (Math.abs(r.x - BRUECKE_X) < 2.3 && r.z > b.z0 + 1 && r.z < b.z1 - 1) r.x = BRUECKE_X + (r.x > BRUECKE_X ? 2.3 : -2.3);
    for (var i = 0; i < baeume.length; i++) {
      var t = baeume[i], dx = r.x - t[0], dz = r.z - t[1], e = Math.hypot(dx, dz), min = t[2] + 0.55;
      if (e < min && e > 0.001) {
        r.x = t[0] + dx / e * min; r.z = t[1] + dz / e * min;
        if (r.tempo > 4 && baumPause <= 0 && modus === 'ritt') { r.tempo *= 0.4; baumPause = 1.5; fehler.baum++; strafe += STRAFE.baum; KERN.meldung('Baum gestreift! +' + STRAFE.baum + ' s', 'rot'); KERN.klang('abwurf'); }
      }
    }
  }

  function neuerRitt() {
    steuerung = KERN.steuerung();
    KERN.pferd.setzeOutfit(REITEN.outfitMit(opt.pferd));
    KERN.pferd.setzeAuszeichnung(false);
    KERN.pferd.setzeReiterin(true);
    szene.add(KERN.pferd.wurzel);
    tore.forEach(function (t) { t.fertig = false; t.versuche = 0; t.altD = undefined; });
    aufBruecke = false;
    var a = tore[0];
    R.setze(a.x - a.fx * 5, a.z - a.fz * 5, Math.atan2(a.fx, a.fz));
    R.sWeg = Math.max(0, a.s - 5);
    uhr = 0; strafe = 0; naechstes = 0; verweigert = 0; imWasser = 0; baumPause = 0;
    fehler = { verweigert: 0, angeschlagen: 0, nass: 0, baum: 0 };
    kamera.userData.sprung = true;
    modus = 'start';
    if (stopp) stopp();
    stopp = REITEN.countdown(function () { modus = 'ritt'; R.wunsch = 9; });
    document.body.className = 'im-welt welt-gelaende' + (steuerung !== 'auto' ? ' mit-lenken' : '') + (steuerung === 'tempo' ? ' mit-tempo' : '');
    KERN.setzeAktion('SPRINGEN');
  }

  var v3 = new THREE.Vector3(), r3 = new THREE.Vector3();
  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    baumPause -= dt;
    var lenk = 0;
    if (modus === 'ritt') {
      uhr += dt;
      // Tempo: bergauf langsamer, im Wasser viel langsamer
      var vx = Math.sin(R.kurs), vz = Math.cos(R.kurs);
      var steigung = (hoehe(R.x + vx * 2, R.z + vz * 2) - hoehe(R.x - vx * 2, R.z - vz * 2)) / 4;
      var tief = aufBruecke || R.luft > 0.2 ? 0 : Math.max(0, WASSER - boden(R.x, R.z));
      var basis = 9.5;
      if (steuerung === 'tempo') { R.eigen = Math.max(3, Math.min(13, (R.eigen || 9.5) + REITEN.gas() * 6 * dt)); basis = R.eigen; }
      var faktor = (1 - Math.max(-0.15, Math.min(0.4, steigung * 1.3))) * (tief > 0.05 ? (tief > 0.45 ? 0.3 : 0.62) : 1);
      if (opt.pferd) faktor *= 0.94 + 0.06 * opt.pferd.laune;
      R.wunsch = verweigert > 0 ? 0 : basis * faktor;
      if (tief > 0.05) { imWasser += dt; if (imWasser > 0.25) { imWasser = 0; KERN.huf(0.12, 2600 + Math.random() * 900); } }
      if (verweigert > 0) { verweigert -= dt; KERN.pferd.schuettle(1 - verweigert / 1.4); if (verweigert <= 0) KERN.pferd.kopfGerade(); }
      // Lenken: von allein dem Weg nach oder selbst
      if (steuerung === 'auto') {
        R.sWeg += R.tempo * dt;
        weg.posBei(R.sWeg + 3.5, v3);
        var ziel = Math.atan2(v3.x - R.x, v3.z - R.z), diff = Math.atan2(Math.sin(ziel - R.kurs), Math.cos(ziel - R.kurs));
        lenk = Math.max(-1, Math.min(1, diff * 2.2));
      } else lenk = REITEN.lenkung();
      pruefeTor();
    } else if (modus === 'ziel' || modus === 'fertig') R.wunsch = 0;
    R.schritt(dt, lenk, zeit);
    REITEN.folge(kamera, R, dt, { boden: boden, hinten: 9, hoch: 4.6 });
    sonne.folge(R.x, R.y, R.z);
    // Pfeil ueber dem naechsten Tor
    var t = tore[naechstes];
    pfeil.visible = modus === 'ritt' && !!t;
    if (pfeil.visible) { pfeil.position.set(t.x, (t.art === 'bruecke' ? BRUECKE_Y : t.y) + 4.2 + Math.sin(zeit * 5) * 0.3, t.z); pfeil.rotation.y = zeit * 2; }
    KERN.setzeHud(REITEN.kachel('Zeit', uhr.toFixed(1) + ' s', 'gross2') + REITEN.kachel('Strafe', '+' + strafe + ' s', strafe ? 'warn' : '') +
      REITEN.kachel('Tor', Math.min(naechstes + 1, tore.length) + ' / ' + tore.length) + REITEN.kachel('Gang', REITEN.GANG_NAME[R.gang]));
  }

  function pruefeTor() {
    var t = tore[naechstes];
    if (!t) return;
    var rx = R.x - t.x, rz = R.z - t.z;
    var d = -(rx * t.fx + rz * t.fz), seit = Math.abs(rx * t.fz - rz * t.fx);
    var imTor = seit < t.breit / 2 + 0.6;
    var sprungArt = t.art === 'stamm' || t.art === 'hecke' || t.art === 'mauer';
    // Verweigerung: ohne Sprung vor einem festen Hindernis
    if (sprungArt && imTor && d < 1.4 && d > -0.5 && !R.sprung && t.versuche < 2 && verweigert <= 0) {
      t.versuche++; fehler.verweigert++; strafe += STRAFE.verweigert;
      verweigert = 1.4; R.tempo = 0;
      R.x -= t.fx * 3.5; R.z -= t.fz * 3.5;
      if (steuerung === 'auto') R.sWeg = t.s - 5;
      KERN.meldung('Verweigert! +' + STRAFE.verweigert + ' s', 'rot'); KERN.klang('verweigert');
      if (t.versuche >= 2) { t.gruppe.visible = false; KERN.meldung('Hindernis abgebaut', 'knapp'); }
      t.altD = undefined;
      return;
    }
    if (t.altD !== undefined && t.altD > 0 && d <= 0 && imTor) {
      // Tor durchritten
      if (sprungArt && t.gruppe.visible) {
        if (R.luft >= t.hoch * 0.75) { KERN.meldung('Super!', 'perfekt'); KERN.klang('perfekt'); }
        else { fehler.angeschlagen++; strafe += STRAFE.angeschlagen; KERN.meldung('Angeschlagen! +' + STRAFE.angeschlagen + ' s', 'rot'); KERN.klang('abwurf'); }
      } else if (t.art === 'bach') {
        if (R.luft > 0.3) { KERN.meldung('Drüber!', 'perfekt'); KERN.klang('perfekt'); }
        else { fehler.nass++; strafe += STRAFE.nass; R.tempo *= 0.3; KERN.meldung('Platsch! +' + STRAFE.nass + ' s', 'rot'); KERN.klang('oh'); }
      } else if (t.art === 'furt') { KERN.meldung('Durch die Furt!', 'gut'); }
      else if (t.art === 'bruecke') { KERN.meldung('Über die Brücke!', 'gut'); }
      else if (t.art !== 'start' && t.art !== 'ziel') KERN.klang('knapp');
      t.fertig = true;
      naechstes++;
      if (t.art === 'ziel') { modus = 'ziel'; KERN.klang('ziel'); KERN.applaus(2.5, 0.15); setTimeout(zeigeErgebnis, 1400); }
      return;
    }
    t.altD = d;
  }

  function springe() {
    if (modus !== 'ritt' || R.sprung || R.tempo < 3 || aufBruecke) return;
    var t = tore[naechstes], H = 1.0, Lg = Math.max(5, R.tempo * 0.6);
    if (t) {
      var d = -((R.x - t.x) * t.fx + (R.z - t.z) * t.fz);
      if (d > 0 && d < 9 && t.hoch) H = t.hoch + 0.75;
      if (t.art === 'bach' && d > 0 && d < 9) { H = 1.1; Lg = Math.max(6.5, R.tempo * 0.75); }
    }
    R.springe(Lg, H);
  }

  function zeigeErgebnis() {
    if (modus !== 'ziel') return;
    modus = 'fertig';
    var gesamt = uhr + strafe;
    var soll = weg.laenge / 8.3;                          // so schnell ist ein guter, fehlerfreier Ritt
    var stufe = { sehrleicht: 0.3, leicht: 0.2, mittel: 0.1, schwer: 0.02 }[KERN.gegnerStufe()] || 0.15;
    var zeilen = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4).map(function (name) {
      var fehlerZahl = Math.random() < stufe * 2.2 ? 1 + (Math.random() < 0.3 ? 1 : 0) : 0;
      return { name: name, zeit: soll * (0.98 + stufe + Math.random() * 0.12) + fehlerZahl * 8 };
    });
    zeilen.push({ name: KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : ''), zeit: gesamt, ich: true });
    zeilen.sort(function (a, b) { return a.zeit - b.zeit; });
    var platz = 1;
    zeilen.forEach(function (z2, i) { z2.wert = z2.zeit.toFixed(1) + ' s'; if (z2.ich) platz = i + 1; });
    STAND.merke('gelaende', platz, true);
    var lohn = STAND.belohne(PREISGELD.gelaende[platz - 1] || 5, 'Geländeritt');
    if (platz === 1) KERN.klang('fanfare');
    KERN.setzeAktion(null);
    var teile = [];
    if (fehler.verweigert) teile.push('Verweigerungen: <b>' + fehler.verweigert + '</b>');
    if (fehler.angeschlagen) teile.push('angeschlagen: <b>' + fehler.angeschlagen + '</b>');
    if (fehler.nass) teile.push('im Bach gelandet: <b>' + fehler.nass + '</b>');
    if (fehler.baum) teile.push('Bäume gestreift: <b>' + fehler.baum + '</b>');
    KERN.zeigeKarte('mitte', '<div class="klein">Geländeritt</div><h2>' + (platz === 1 ? '🏆 Gewonnen!' : platz + '. Platz') + '</h2>' +
      '<div class="grossPunkte">' + gesamt.toFixed(1) + ' s</div><div class="details">Reitzeit ' + uhr.toFixed(1) + ' s + Strafe ' + strafe + ' s<br>' +
      (teile.length ? teile.join(' · ') : 'Fehlerfrei! 🌟') + '</div>' + REITEN.tabelle(zeilen, 'Zeit') + lohn,
      [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); neuerRitt(); } },
       { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'gelaende', platz: platz }); } }]);
  }

  var API = {
    name: '🌲 Military',
    text: 'Geländeritt auf Zeit: über Baumstämme, Hecken und Mauern springen, über den Bach setzen, durch die Furt und über die Brücke, durch den Wald und über die Hügel. Fehler kosten Strafsekunden.<br>Die Steuerung stellst du bei „Springen“ ein: <b>Automatisch</b> (nur springen), <b>Selbst lenken</b> oder <b>Lenken + Tempo</b>.',
    knopf: '🌲 Geländeritt starten',
    start: function (o) {
      opt = o || {};
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      KERN.betrete(API);
      neuerRitt();
    },
    schritt: schritt, aktion: springe, tipp: springe,
    zurueck: function () { if (stopp) stopp(); modus = 'aus'; REITEN.heim(opt, null); },
    verlaesst: function () { if (stopp) stopp(); modus = 'aus'; KERN.pferd.kopfGerade(); KERN.pferd.koerper.rotation.set(0, 0, 0); KERN.pferd.koerper.position.y = 0; },
    zustand: function () { return { laenge: weg.laenge, modus: modus, R: R, naechstes: naechstes, strafe: strafe, uhr: uhr, tore: tore, fehler: fehler }; }
  };
  return API;
})();
