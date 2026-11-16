// ============================================================
//  BAU + REITEN  -  gemeinsame Helfer fuer alle Welten
//  BAU:    Licht, Baeume, Zaeune, Schilder, einfache Bauteile
//  REITEN: ein Pferd frei steuern (Gangarten, Gelaende, Spruenge), Kamera
// ============================================================
var BAU = (function () {
  'use strict';
  var matten = {};
  function mat(farbe, rau) {
    var k = farbe + '/' + (rau === undefined ? 0.9 : rau);
    if (!matten[k]) matten[k] = new THREE.MeshStandardMaterial({ color: farbe, roughness: rau === undefined ? 0.9 : rau });
    return matten[k];
  }
  function netz(geo, m, eltern, x, y, z) {
    var n = new THREE.Mesh(geo, typeof m === 'number' || typeof m === 'string' ? mat(m) : m);
    n.position.set(x || 0, y || 0, z || 0);
    n.castShadow = true; n.receiveShadow = true;
    if (eltern) eltern.add(n);
    return n;
  }
  function kasten(b, h, t, m, eltern, x, y, z) { return netz(new THREE.BoxGeometry(b, h, t), m, eltern, x, y, z); }
  function walze(r1, r2, h, m, eltern, x, y, z, seg) { return netz(new THREE.CylinderGeometry(r1, r2, h, seg || 12), m, eltern, x, y, z); }

  function licht(szene, opt) {
    opt = opt || {};
    szene.background = new THREE.Color(opt.himmel || 0x9fd4f5);
    szene.fog = new THREE.Fog(opt.himmel || 0x9fd4f5, opt.nebelNah || 90, opt.nebelFern || 330);
    szene.add(new THREE.HemisphereLight(0xffffff, opt.bodenLicht || 0x8aa86a, opt.hell || 1.5));
    var sonne = new THREE.DirectionalLight(0xfff3d6, opt.sonne || 2.2);
    sonne.castShadow = true;
    var gr = opt.schatten || 40;
    sonne.shadow.mapSize.set(2048, 2048);
    sonne.shadow.camera.left = -gr; sonne.shadow.camera.right = gr;
    sonne.shadow.camera.top = gr; sonne.shadow.camera.bottom = -gr;
    sonne.shadow.camera.far = 220;
    sonne.shadow.bias = -0.0006;
    szene.add(sonne); szene.add(sonne.target);
    function folge(x, y, z) {
      sonne.position.set(x + 30, y + 55, z + 25);
      sonne.target.position.set(x, y, z);
    }
    folge(0, 0, 0);
    return { sonne: sonne, folge: folge };
  }

  // Text auf einer Tafel oder als schwebendes Schild
  function textBild(text, opt) {
    opt = opt || {};
    var zeilen = String(text).split('\n');
    var gr = opt.schrift || 44, rand = opt.rand === undefined ? 14 : opt.rand;
    var c = document.createElement('canvas'), g = c.getContext('2d');
    var schrift = (opt.fett === false ? '' : 'bold ') + gr + 'px "Trebuchet MS", "Segoe UI", Arial, sans-serif';
    g.font = schrift;
    var breit = 0;
    zeilen.forEach(function (z) { breit = Math.max(breit, g.measureText(z).width); });
    c.width = Math.ceil(breit + rand * 2); c.height = Math.ceil(zeilen.length * gr * 1.2 + rand * 2);
    g = c.getContext('2d');
    if (opt.grund) {
      g.fillStyle = opt.grund;
      var r = opt.rund === undefined ? 14 : opt.rund;
      g.beginPath(); g.moveTo(r, 0); g.arcTo(c.width, 0, c.width, c.height, r); g.arcTo(c.width, c.height, 0, c.height, r); g.arcTo(0, c.height, 0, 0, r); g.arcTo(0, 0, c.width, 0, r); g.fill();
    }
    g.font = schrift; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = opt.farbe || '#3a2a1c';
    zeilen.forEach(function (z, i) { g.fillText(z, c.width / 2, rand + gr * 0.6 + i * gr * 1.2); });
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { textur: t, seiten: c.width / c.height };
  }
  // schwebt und schaut immer zur Kamera
  function schwebeText(text, hoehe, opt) {
    opt = opt || {};
    if (opt.grund === undefined) opt.grund = 'rgba(255,250,240,0.92)';
    var b = textBild(text, opt);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: b.textur, depthTest: opt.immerSichtbar ? false : true, transparent: true }));
    s.scale.set(hoehe * b.seiten, hoehe, 1);
    return s;
  }
  // feste Tafel (z.B. an einer Wand oder auf zwei Pfosten)
  function tafel(text, hoehe, opt) {
    opt = opt || {};
    if (opt.grund === undefined) opt.grund = '#fffaf0';
    var b = textBild(text, opt);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(hoehe * b.seiten, hoehe), new THREE.MeshBasicMaterial({ map: b.textur, side: THREE.DoubleSide, transparent: true }));
    m.userData.breite = hoehe * b.seiten;
    return m;
  }
  // Wegweiser: Tafel auf zwei Pfosten, beidseitig lesbar
  function wegweiser(text, opt) {
    opt = opt || {};
    var g = new THREE.Group(), h = opt.hoehe || 1.0;
    var t = tafel(text, h, { grund: opt.grund || '#fffaf0', farbe: opt.farbe || '#7a3b12', schrift: 56 });
    var b = t.userData.breite, y = (opt.fuss || 2.2) + h / 2;
    t.position.y = y; g.add(t);
    var hinten = t.clone(); hinten.rotation.y = Math.PI; hinten.position.z = -0.02; g.add(hinten);
    kasten(b + 0.3, h + 0.24, 0.08, opt.rahmen || 0x7a4a2a, g, 0, y, -0.01);
    t.position.z = 0.04; hinten.position.z = -0.06;
    walze(0.09, 0.09, y + h / 2, opt.rahmen || 0x7a4a2a, g, -b / 2 - 0.05, (y + h / 2) / 2, 0, 8);
    walze(0.09, 0.09, y + h / 2, opt.rahmen || 0x7a4a2a, g, b / 2 + 0.05, (y + h / 2) / 2, 0, 8);
    return g;
  }

  // Zaun entlang einer Punktliste [[x,z],...]  (alle Pfosten und Latten zusammen nur zwei Zeichenaufrufe)
  function zaun(punkte, opt) {
    opt = opt || {};
    var g = new THREE.Group(), h = opt.hoehe || 1.25, farbe = opt.farbe === undefined ? 0xf4f1e8 : opt.farbe;
    var m = mat(farbe, 0.8), abstand = opt.abstand || 3, latten = opt.latten || 2;
    var hoeheFn = opt.boden || function () { return 0; };
    var pfosten = [], stuecke = [], d = new THREE.Object3D();
    for (var i = 0; i < punkte.length - 1; i++) {
      var a = punkte[i], b = punkte[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      var n = Math.max(1, Math.round(L / abstand));
      for (var k = 0; k <= n; k++) {
        if (k === n && i < punkte.length - 2) continue;
        pfosten.push([a[0] + dx * k / n, a[1] + dz * k / n]);
      }
      for (var k2 = 0; k2 < n; k2++) stuecke.push([a[0] + dx * k2 / n, a[1] + dz * k2 / n, a[0] + dx * (k2 + 1) / n, a[1] + dz * (k2 + 1) / n]);
    }
    var pf = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, h + 0.1, 0.14), m, pfosten.length);
    pfosten.forEach(function (p, nr) { d.position.set(p[0], hoeheFn(p[0], p[1]) + (h + 0.1) / 2, p[1]); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); pf.setMatrixAt(nr, d.matrix); });
    var la = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.13, 1), m, stuecke.length * latten);
    stuecke.forEach(function (st, nr) {
      var y0 = hoeheFn(st[0], st[1]), y1 = hoeheFn(st[2], st[3]), l = Math.hypot(st[2] - st[0], st[3] - st[1], y1 - y0);
      for (var r = 0; r < latten; r++) {
        var yy = h - 0.15 - r * (h * 0.42);
        d.position.set((st[0] + st[2]) / 2, (y0 + y1) / 2 + yy, (st[1] + st[3]) / 2);
        d.lookAt(st[2], y1 + yy, st[3]);
        d.scale.set(1, 1, l);
        d.updateMatrix(); la.setMatrixAt(nr * latten + r, d.matrix);
      }
    });
    pf.castShadow = la.castShadow = opt.schatten !== false;
    pf.frustumCulled = la.frustumCulled = false;
    g.add(pf); g.add(la);
    return g;
  }

  // Baeume als InstancedMesh: liste = [[x, y, z, groesse, art], ...]  art: 0 Laubbaum, 1 Tanne
  function wald(liste) {
    var g = new THREE.Group();
    var laub = liste.filter(function (b) { return !b[4]; }), tanne = liste.filter(function (b) { return b[4]; });
    var d = new THREE.Object3D();
    function teil(geo, material, daten, fn) {
      if (!daten.length) return;
      var im = new THREE.InstancedMesh(geo, material, daten.length);
      daten.forEach(function (b, i) { fn(b, i); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
      im.castShadow = true; im.receiveShadow = true;
      im.frustumCulled = false;
      g.add(im);
      return im;
    }
    var gruen = [0x3f8f3a, 0x4a9c40, 0x357a33, 0x5aa648];
    teil(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 7), mat(0x6b4a2a), laub, function (b) { d.position.set(b[0], b[1] + 1.2 * b[3], b[2]); d.scale.setScalar(b[3]); d.rotation.set(0, 0, 0); });
    var krone = teil(new THREE.IcosahedronGeometry(1.9, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), laub, function (b, i) {
      d.position.set(b[0], b[1] + 3.6 * b[3], b[2]); d.scale.set(b[3] * (0.9 + (i % 3) * 0.12), b[3] * (0.85 + (i % 4) * 0.08), b[3]); d.rotation.set(0, i * 1.7, 0);
    });
    if (krone) laub.forEach(function (b, i) { krone.setColorAt(i, new THREE.Color(gruen[i % 4])); });
    teil(new THREE.CylinderGeometry(0.16, 0.26, 1.6, 6), mat(0x5a3d22), tanne, function (b) { d.position.set(b[0], b[1] + 0.8 * b[3], b[2]); d.scale.setScalar(b[3]); d.rotation.set(0, 0, 0); });
    var nadeln = new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 1, flatShading: true });
    [[1.7, 3.0, 2.4], [1.3, 2.6, 4.0], [0.9, 2.2, 5.5]].forEach(function (e) {
      teil(new THREE.ConeGeometry(e[0], e[1], 8), nadeln, tanne, function (b, i) { d.position.set(b[0], b[1] + e[2] * b[3], b[2]); d.scale.setScalar(b[3]); d.rotation.set(0, i, 0); });
    });
    return g;
  }

  // rot-weisse oder gruene Flagge an einer Stange
  function flagge(farbe, hoehe) {
    var g = new THREE.Group();
    hoehe = hoehe || 2.4;
    walze(0.04, 0.04, hoehe, 0xf4f1e8, g, 0, hoehe / 2, 0, 6);
    var f = netz(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshStandardMaterial({ color: farbe, side: THREE.DoubleSide, roughness: 0.9 }), g, 0.37, hoehe - 0.26, 0);
    f.castShadow = false;
    return g;
  }

  return { mat: mat, netz: netz, kasten: kasten, walze: walze, licht: licht, textBild: textBild, schwebeText: schwebeText, tafel: tafel, wegweiser: wegweiser, zaun: zaun, wald: wald, flagge: flagge };
})();

var REITEN = (function () {
  'use strict';
  var SCHRITT_LAENGE = { schritt: 1.9, trab: 2.9, galopp: 4.19 };
  function gangFuer(tempo, alt) {
    if (tempo < 0.12) return 'steh';
    if (tempo < (alt === 'schritt' ? 2.9 : 2.5)) return 'schritt';
    if (tempo < (alt === 'galopp' ? 5.0 : 5.8)) return 'trab';
    return 'galopp';
  }
  var GANG_NAME = { steh: 'Halt', schritt: 'Schritt', trab: 'Trab', galopp: 'Galopp' };

  // tier: KERN.pferd (mit Reiterin) oder ein Pferd aus HERDE.bauePferd (opt.herde = true)
  function neu(tier, opt) {
    opt = opt || {};
    var hoehe = opt.hoehe || function () { return 0; };
    var R = {
      x: 0, z: 0, kurs: 0, tempo: 0, wunsch: 0, phase: 0, gang: 'steh', sprung: null, strecke: 0,
      lenkGlatt: 0, y: 0, luft: 0, tier: tier, laut: opt.laut === undefined ? 1 : opt.laut, festerGang: null
    };
    R.setze = function (x, z, kurs) {
      R.x = x; R.z = z; R.kurs = kurs; R.tempo = 0; R.wunsch = 0; R.sprung = null; R.lenkGlatt = 0; R.strecke = 0; R.luft = 0;
      R.zeichne(0, 0);
    };
    R.springe = function (L, H) {
      if (R.sprung) return false;
      R.sprung = { s0: R.strecke, L: L || 5, H: H || 1.0 };
      return true;
    };
    // lenk: -1 (rechts) .. +1 (links)
    R.schritt = function (dt, lenk, zeit) {
      var beschl = opt.beschleunigung || 5, brems = opt.bremsen || 7;
      if (R.tempo < R.wunsch) R.tempo = Math.min(R.wunsch, R.tempo + beschl * dt);
      else R.tempo = Math.max(R.wunsch, R.tempo - brems * dt);
      var weg = R.tempo * dt;
      R.strecke += weg;
      R.gang = R.festerGang && R.tempo > 0.12 ? R.festerGang : gangFuer(R.tempo, R.gang);
      var alt = R.phase;
      if (R.gang !== 'steh') R.phase += weg * Math.PI * 2 / SCHRITT_LAENGE[R.gang];
      R.lenkGlatt += (lenk - R.lenkGlatt) * Math.min(1, dt * 8);
      var dreh = (opt.drehung || 1.5) * Math.min(1, 7.5 / Math.max(R.tempo, 1)) * (R.tempo < 0.3 ? R.tempo / 0.3 : 1);
      R.kurs += R.lenkGlatt * dreh * dt * (R.sprung ? 0.25 : 1);
      R.x += Math.sin(R.kurs) * weg; R.z += Math.cos(R.kurs) * weg;
      if (opt.grenze) opt.grenze(R);
      // Hufschlag
      if (R.laut > 0 && !R.sprung && R.tempo > 0.5 && typeof KERN !== 'undefined') {
        if (R.gang === 'galopp') KERN.galoppTon(alt, R.phase, Math.min(1, R.tempo / 7) * R.laut);
        else {
          var takte = R.gang === 'trab' ? 2 : 4, a = Math.floor(alt / (Math.PI * 2) * takte), b = Math.floor(R.phase / (Math.PI * 2) * takte);
          if (a !== b) KERN.huf((R.gang === 'trab' ? 0.14 : 0.08) * R.laut, 200 + (b % 2) * 40);
        }
      }
      R.zeichne(dt, zeit || 0);
    };
    R.zeichne = function (dt, zeit) {
      var boden = hoehe(R.x, R.z);
      var vx = Math.sin(R.kurs), vz = Math.cos(R.kurs);
      var neig = -Math.atan((hoehe(R.x + vx * 1.0, R.z + vz * 1.0) - hoehe(R.x - vx * 1.0, R.z - vz * 1.0)) / 2.0);
      var sp = -1, luft = 0;
      if (R.sprung) {
        sp = (R.strecke - R.sprung.s0) / R.sprung.L;
        if (sp >= 1) { R.sprung = null; sp = -1; if (R.laut > 0 && typeof KERN !== 'undefined') KERN.ton(80, 0.08, 'square', 0.1); }
        else { luft = R.sprung.H * 4 * sp * (1 - sp); neig = -Math.atan(R.sprung.H * 4 * (1 - 2 * sp) / R.sprung.L) * 0.75; }
      }
      R.luft = luft; R.y = boden;
      var w = tier.wurzel, k = tier.koerper;
      w.position.set(R.x, boden, R.z);
      w.rotation.y = R.kurs;
      var st = R.gang === 'steh' ? 0 : R.gang === 'galopp' ? Math.min(1, R.tempo / 7) : 1;
      k.position.y = luft + (R.gang === 'galopp' && sp < 0 ? Math.abs(Math.sin(R.phase * 0.5)) * 0.06 * R.tempo / 9 : 0);
      k.rotation.x += (neig - k.rotation.x) * (dt ? Math.min(1, dt * 10) : 1);
      k.rotation.z = -R.lenkGlatt * 0.13 * Math.min(1, R.tempo / 7);
      if (opt.herde) tier.bewege(R.gang, R.phase, st, sp, dt || 1);
      else { tier.setzeGang(R.gang === 'steh' ? 'galopp' : R.gang); tier.bewege(R.phase, st, sp, zeit); }
    };
    return R;
  }

  // Kamera hinter dem Pferd
  var ziel = new THREE.Vector3(), blick = new THREE.Vector3();
  function neueKamera() {
    var k = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 900);
    k.userData.blick = new THREE.Vector3(); k.userData.sprung = true;
    return k;
  }
  function folge(kamera, R, dt, opt) {
    opt = opt || {};
    var vx = Math.sin(R.kurs), vz = Math.cos(R.kurs), h = opt.hinten || 8.5;
    ziel.set(R.x - vx * h, R.y + (opt.hoch || 4.4), R.z - vz * h);
    if (opt.boden) ziel.y = Math.max(ziel.y, opt.boden(ziel.x, ziel.z) + 1.6);
    blick.set(R.x + vx * (opt.vor || 5), R.y + (opt.blickHoch || 1.3) + R.luft * 0.3, R.z + vz * (opt.vor || 5));
    var b = kamera.userData.blick;
    if (kamera.userData.sprung) { kamera.position.copy(ziel); b.copy(blick); kamera.userData.sprung = false; }
    else { kamera.position.lerp(ziel, 1 - Math.exp(-3.2 * dt)); b.lerp(blick, 1 - Math.exp(-6 * dt)); }
    kamera.lookAt(b);
  }

  // Eingabe: Tasten und Wischen zusammen
  function lenkung() {
    var t = KERN.taste;
    return Math.max(-1, Math.min(1, (t.links ? 1 : 0) - (t.rechts ? 1 : 0) + KERN.wisch.lenk));
  }
  function gas() {
    var t = KERN.taste;
    return Math.max(-1, Math.min(1, (t.schneller ? 1 : 0) - (t.langsamer ? 1 : 0) + KERN.wisch.hoch));
  }

  // Reiter-Outfit fuer eine Welt: eigenes Outfit + Fell und Ausruestung des Hofpferdes
  function outfitMit(pferd) {
    var o = KERN.kopie(KERN.spieler().outfit);
    if (pferd) {
      o.fell = pferd.fell; o.ausruestung = pferd.ausruestung || {};
      if (o.ausruestung.decke) o.decke = o.ausruestung.decke;
    }
    return o;
  }

  // Countdown 3-2-1-Los; ruft fertig() auf
  function countdown(fertig) {
    var z = 3, el = KERN.el('countdown'), abgebrochen = false;
    function tick() {
      if (abgebrochen) return;
      if (z > 0) { el.textContent = z; KERN.klang('zaehler'); z--; setTimeout(tick, 800); }
      else { el.textContent = 'Los!'; KERN.klang('los'); fertig(); setTimeout(function () { if (!abgebrochen) el.textContent = ''; }, 700); }
    }
    tick();
    return function () { abgebrochen = true; el.textContent = ''; };
  }

  function messer(wert, gutIstHoch) {
    var w = Math.max(0, Math.min(1, wert)), gut = gutIstHoch === false ? 1 - w : w;
    return '<span class="messer' + (gut < 0.34 ? ' schlecht' : gut < 0.67 ? ' mittel' : '') + '"><i style="width:' + Math.round(w * 100) + '%"></i></span>';
  }
  function kachel(titel, wert, klasse) { return '<div class="kachel ' + (klasse || '') + '"><span class="klein">' + titel + '</span>' + wert + '</div>'; }

  // Nach einem Ritt: zurueck zum Hof (wenn man von dort kam) oder ins Menue
  function heim(opt, erg) { if (opt && opt.zurueck) opt.zurueck(erg); else KERN.insMenue(); }
  function heimText(opt) { return opt && opt.zurueck ? 'Zurück zum Hof' : 'Zurück zum Menü'; }
  // eine einfache Reiterin auf ein Pferd aus der Herde setzen
  function reiterAuf(tier, outfit, pose) {
    var f = baueFigur(outfit, { helm: true });
    f.setzeHoehe(0, true);
    f.setzePose(pose || 'reiten', true);
    f.wurzel.position.set(0, 1.66, 0.02);
    tier.koerper.add(f.wurzel);
    return f;
  }
  // Rangliste als Tabelle: zeilen = [{ name, wert, ich }]
  function tabelle(zeilen, kopf) {
    return '<table class="tabelle"><tr><th></th><th class="links">Reiter</th><th>' + kopf + '</th></tr>' + zeilen.map(function (z, i) {
      return '<tr class="' + (z.ich ? 'mensch' : 'ki') + '"><td>' + (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + '</td><td class="links">' + KERN.esc(z.name) + '</td><td>' + z.wert + '</td></tr>';
    }).join('') + '</table>';
  }
  function pferdName(opt) { return opt && opt.pferd ? opt.pferd.name : 'dein Pferd'; }

  return { heim: heim, heimText: heimText, reiterAuf: reiterAuf, tabelle: tabelle, pferdName: pferdName, neu: neu, neueKamera: neueKamera, folge: folge, lenkung: lenkung, gas: gas, outfitMit: outfitMit, countdown: countdown, GANG_NAME: GANG_NAME, messer: messer, kachel: kachel };
})();
