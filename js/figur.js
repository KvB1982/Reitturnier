// ============================================================
//  FIGUR  -  ein Maedchen mit beweglichen Gelenken
//  (zu Fuss im Stall, als Reiterin der anderen Pferde, beim Voltigieren)
// ============================================================
// Gelenke und Drehrichtung:  x < 0 = nach vorne, x > 0 = nach hinten
//   rumpf, kopf, armL, armR, ellL, ellR, beinL, beinR, knieL, knieR, ganz
var FIGUR_POSEN = {
  steh: {},
  reiten: { beinL: [-1.0, 0, 0.5], beinR: [-1.0, 0, -0.5], knieL: [1.25, 0, 0], knieR: [1.25, 0, 0], armL: [-0.45, 0, 0.12], armR: [-0.45, 0, -0.12], ellL: [-1.0, 0, 0], ellR: [-1.0, 0, 0], rumpf: [0.06, 0, 0] },
  rennsitz: { beinL: [-1.35, 0, 0.45], beinR: [-1.35, 0, -0.45], knieL: [1.9, 0, 0], knieR: [1.9, 0, 0], armL: [-1.0, 0, 0.1], armR: [-1.0, 0, -0.1], ellL: [-0.5, 0, 0], ellR: [-0.5, 0, 0], rumpf: [0.75, 0, 0], kopf: [-0.6, 0, 0] },
  fuehren: { armR: [-0.9, 0, -0.5], ellR: [-0.5, 0, 0] },
  putzen: { armR: [-1.5, 0, -0.1], ellR: [-0.4, 0, 0], armL: [-0.5, 0, 0.1], rumpf: [0.12, 0, 0] },
  schaufeln: { armR: [-0.9, 0, -0.1], armL: [-1.1, 0, 0.2], ellL: [-0.6, 0, 0], ellR: [-0.3, 0, 0], rumpf: [0.45, 0, 0], beinL: [-0.3, 0, 0], knieL: [0.3, 0, 0] },
  tragen: { armR: [-0.75, 0, -0.1], armL: [-0.75, 0, 0.1], ellL: [-1.0, 0, 0], ellR: [-1.0, 0, 0] },
  winken: { armR: [0, 0, -2.6], ellR: [0, 0, -0.5] },
  jubel: { armR: [0, 0, -2.7], armL: [0, 0, 2.7] },
  sitzen: { beinL: [-1.45, 0, 0.14], beinR: [-1.45, 0, -0.14], knieL: [0.3, 0, 0], knieR: [0.3, 0, 0], armL: [0.4, 0, 0.3], armR: [0.4, 0, -0.3], rumpf: [-0.1, 0, 0], hoch: 0.22 },
  bank: { beinL: [-1.5, 0, 0.08], beinR: [-1.5, 0, -0.08], knieL: [1.5, 0, 0], knieR: [1.5, 0, 0], armL: [-0.3, 0, 0.1], armR: [-0.3, 0, -0.1], hoch: 0.66 },
  essen: { beinL: [-1.45, 0, 0.14], beinR: [-1.45, 0, -0.14], knieL: [0.3, 0, 0], knieR: [0.3, 0, 0], armL: [0.4, 0, 0.3], armR: [-1.0, 0, -0.1], ellR: [-1.9, 0, 0], rumpf: [-0.1, 0, 0], hoch: 0.22 },
  werfen: { armR: [-2.4, 0, -0.3], ellR: [-0.4, 0, 0], rumpf: [0.15, 0.3, 0] },
  angeln: { armR: [-1.2, 0, -0.1], armL: [-1.0, 0, 0.2], ellL: [-0.5, 0, 0], ellR: [-0.3, 0, 0] },
  pfluecken: { armR: [-1.3, 0, -0.1], ellR: [-0.3, 0, 0], rumpf: [0.8, 0, 0], beinL: [-0.5, 0, 0], knieL: [0.6, 0, 0], beinR: [-0.4, 0, 0], knieR: [0.5, 0, 0], hoch: 0.72 },
  gabel: { armR: [-0.75, 0, -0.12], ellR: [-0.55, 0, 0], armL: [-0.2, 0, 0.1] },
  schieben: { armR: [-0.55, 0, -0.12], armL: [-0.55, 0, 0.12], ellL: [-0.5, 0, 0], ellR: [-0.5, 0, 0], rumpf: [0.18, 0, 0] },
  flasche: { armR: [-1.25, 0, -0.25], ellR: [-0.5, 0, 0], armL: [-0.6, 0, 0.3], ellL: [-0.7, 0, 0], rumpf: [0.2, 0, 0] },
  streicheln: { armR: [-1.15, 0, -0.2], ellR: [-0.35, 0, 0], rumpf: [0.22, 0, 0], kopf: [0.1, 0, 0] },
  lesen: { beinL: [-1.5, 0, 0.08], beinR: [-1.5, 0, -0.08], knieL: [1.5, 0, 0], knieR: [1.5, 0, 0], armL: [-0.8, 0, -0.25], armR: [-0.8, 0, 0.25], ellL: [-1.5, 0, 0], ellR: [-1.5, 0, 0], kopf: [0.35, 0, 0], hoch: 0.62 },
  liegen: { ganz: [-1.5, 0, 0], armL: [0, 0, 0.3], armR: [0, 0, -0.3], hoch: 0.75 },
  longe: { armR: [-1.2, 0, -0.9], ellR: [-0.2, 0, 0], armL: [-0.5, 0, 0.9], ellL: [-0.3, 0, 0] }
};

function baueFigur(outfit, opt) {
  'use strict';
  opt = opt || {};
  function mat(farbe, rau) { return new THREE.MeshStandardMaterial({ color: farbe === undefined ? 0xffffff : farbe, roughness: rau === undefined ? 0.85 : rau }); }
  var M = { jacke: mat(), hose: mat(), stiefel: mat(undefined, 0.4), haare: mat(undefined, 0.95), helm: mat(undefined, 0.4), haut: mat(0xf0c4a2, 0.75), auge: mat(0x1a1410, 0.3), mund: mat(0xc86a66) };
  function netz(geo, m, eltern, x, y, z) {
    var n = new THREE.Mesh(geo, m);
    n.position.set(x || 0, y || 0, z || 0);
    n.castShadow = true;
    eltern.add(n);
    return n;
  }
  function kapsel(r, lang) { return new THREE.CapsuleGeometry(r, Math.max(0.001, lang - 2 * r), 4, 10); }
  function gelenk(eltern, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); eltern.add(g); return g; }

  var wurzel = new THREE.Group();
  var ganz = gelenk(wurzel, 0, 0, 0);          // kippt die ganze Figur (Voltigieren)
  var huefte = gelenk(ganz, 0, 0.8, 0);
  var G = { ganz: ganz };

  // Rumpf
  G.rumpf = gelenk(huefte, 0, 0, 0);
  netz(kapsel(0.115, 0.46), M.jacke, G.rumpf, 0, 0.24, 0).scale.set(1.25, 1, 0.85);
  netz(new THREE.SphereGeometry(0.135, 12, 8), M.hose, huefte, 0, 0.0, 0).scale.set(1.1, 0.75, 0.85);
  netz(new THREE.CylinderGeometry(0.04, 0.045, 0.09, 10), M.haut, G.rumpf, 0, 0.5, 0);
  // Kopf
  G.kopf = gelenk(G.rumpf, 0, 0.55, 0);
  netz(new THREE.SphereGeometry(0.105, 16, 12), M.haut, G.kopf, 0, 0.09, 0.005).scale.set(0.92, 1.08, 1);
  for (var s = -1; s <= 1; s += 2) {
    netz(new THREE.SphereGeometry(0.014, 8, 6), M.auge, G.kopf, s * 0.037, 0.1, 0.097).castShadow = false;
  }
  netz(new THREE.SphereGeometry(0.013, 8, 6), M.haut, G.kopf, 0, 0.07, 0.106);
  var mund = netz(new THREE.TorusGeometry(0.022, 0.005, 6, 10, Math.PI), M.mund, G.kopf, 0, 0.045, 0.094);
  mund.rotation.z = Math.PI; mund.castShadow = false;
  var frisur = new THREE.Group();
  G.kopf.add(frisur);
  var helm = new THREE.Group();
  G.kopf.add(helm);
  netz(new THREE.SphereGeometry(0.115, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), M.helm, helm, 0, 0.115, -0.002).scale.set(0.96, 1.05, 1.06);
  var schirm = netz(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 14, 1, false, -Math.PI / 2, Math.PI), M.helm, helm, 0, 0.125, 0.09);
  schirm.rotation.x = 0.12;
  helm.visible = opt.helm !== false;
  var kappeDeko = new THREE.Group(), kopfDeko = new THREE.Group(), rumpfDeko = new THREE.Group();
  helm.add(kappeDeko); G.kopf.add(kopfDeko); G.rumpf.add(rumpfDeko);

  function baueFrisur(art) {
    while (frisur.children.length) frisur.remove(frisur.children[0]);
    var haube = netz(new THREE.SphereGeometry(0.111, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), M.haare, frisur, 0, 0.1, -0.012);
    haube.scale.set(0.97, 1.08, 1.04);
    haube.rotation.x = -0.35;
    if (art === 'zopf') {
      var z = gelenk(frisur, 0, 0.14, -0.1); z.name = 'wackel';
      netz(kapsel(0.04, 0.3), M.haare, z, 0, -0.13, -0.03).rotation.x = 0.25;
    } else if (art === 'zoepfe') {
      for (var k = -1; k <= 1; k += 2) {
        var zz = gelenk(frisur, k * 0.085, 0.06, -0.05); zz.name = 'wackel';
        netz(kapsel(0.03, 0.26), M.haare, zz, 0, -0.12, 0);
      }
    } else if (!MODE.frisur(art, frisur, M.haare, 0.09)) {
      netz(new THREE.SphereGeometry(0.1, 12, 8), M.haare, frisur, 0, 0.06, -0.035).scale.set(1.02, 0.9, 0.9);
    }
  }

  // Arme
  ['L', 'R'].forEach(function (seite) {
    var v = seite === 'L' ? 1 : -1;
    var arm = G['arm' + seite] = gelenk(G.rumpf, v * 0.175, 0.43, 0);
    netz(new THREE.SphereGeometry(0.055, 10, 8), M.jacke, arm);
    netz(kapsel(0.045, 0.27), M.jacke, arm, 0, -0.125, 0);
    var ell = G['ell' + seite] = gelenk(arm, 0, -0.25, 0);
    netz(kapsel(0.038, 0.25), M.jacke, ell, 0, -0.11, 0);
    netz(new THREE.SphereGeometry(0.04, 8, 8), M.haut, ell, 0, -0.25, 0);
    G['hand' + seite] = gelenk(ell, 0, -0.26, 0);
    // Beine
    var bein = G['bein' + seite] = gelenk(huefte, v * 0.085, -0.02, 0);
    netz(kapsel(0.075, 0.42), M.hose, bein, 0, -0.19, 0);
    var knie = G['knie' + seite] = gelenk(bein, 0, -0.39, 0);
    netz(kapsel(0.058, 0.4), M.stiefel, knie, 0, -0.18, 0);
    netz(kapsel(0.048, 0.2), M.stiefel, knie, 0, -0.375, 0.05).rotation.x = Math.PI / 2;
  });

  function setzeOutfit(o) {
    M.jacke.color.set(o.jacke); M.hose.color.set(o.hose); M.stiefel.color.set(o.stiefel);
    M.haare.color.set(o.haare); M.helm.color.set(o.helm || '#111111');
    if (frisur.userData.art !== o.frisur) { baueFrisur(o.frisur); frisur.userData.art = o.frisur; }
    MODE.kappe(kappeDeko, o, 0.115, 0.118);
    MODE.kopf(kopfDeko, o, 0.09);
    MODE.koerper(rumpfDeko, o, { y: 0.27, b: 0.144, t: 0.098, hals: 0.5 });
    if (opt.helm === false) helm.visible = !!o.kappeAuf;
  }
  if (outfit) setzeOutfit(outfit);

  // ---------- Bewegung ----------
  var NAMEN = ['rumpf', 'kopf', 'armL', 'armR', 'ellL', 'ellR', 'beinL', 'beinR', 'knieL', 'knieR', 'ganz'];
  var ziel = {}, ist = {}, hoeheZiel = 0.8, hoeheIst = 0.8;
  NAMEN.forEach(function (n) { ziel[n] = [0, 0, 0]; ist[n] = [0, 0, 0]; });
  function setzePose(pose, sofort) {
    if (typeof pose === 'string') pose = FIGUR_POSEN[pose] || {};
    NAMEN.forEach(function (n) {
      var p = pose[n] || [0, 0, 0];
      ziel[n][0] = p[0]; ziel[n][1] = p[1]; ziel[n][2] = p[2];
      if (sofort) { ist[n][0] = p[0]; ist[n][1] = p[1]; ist[n][2] = p[2]; G[n].rotation.set(p[0], p[1], p[2]); }
    });
    hoeheZiel = pose.hoch === undefined ? hoeheZiel : pose.hoch;
    if (sofort) { hoeheIst = hoeheZiel; huefte.position.y = hoeheZiel; }
  }
  // Gehen: phase laeuft mit der Strecke, staerke 0..1 (1 = laufen)
  var gehStaerke = 0, gehPhase = 0, flatter = 0;
  function gehe(phase, staerke) { gehPhase = phase; gehStaerke = staerke; }
  function bewege(dt) {
    var k = Math.min(1, dt * 9), i, n;
    for (i = 0; i < NAMEN.length; i++) {
      n = NAMEN[i];
      var r = ist[n], z = ziel[n];
      r[0] += (z[0] - r[0]) * k; r[1] += (z[1] - r[1]) * k; r[2] += (z[2] - r[2]) * k;
      G[n].rotation.set(r[0], r[1], r[2]);
    }
    hoeheIst += (hoeheZiel - hoeheIst) * k;
    huefte.position.y = hoeheIst;
    if (gehStaerke > 0.01) {
      var s = Math.sin(gehPhase), c = Math.cos(gehPhase), a = 0.55 * gehStaerke;
      G.beinL.rotation.x += -s * a; G.beinR.rotation.x += s * a;
      G.knieL.rotation.x += Math.max(0, c) * a * 1.5; G.knieR.rotation.x += Math.max(0, -c) * a * 1.5;
      if (Math.abs(ziel.armL[0]) < 0.3) G.armL.rotation.x += s * a * 0.8;
      if (Math.abs(ziel.armR[0]) < 0.3) G.armR.rotation.x += -s * a * 0.8;
      huefte.position.y += Math.abs(c) * 0.025 * gehStaerke;
    }
    for (i = 0; i < frisur.children.length; i++) {
      var h = frisur.children[i];
      if (h.name === 'wackel') h.rotation.x = Math.sin(gehPhase * 2) * 0.15 * gehStaerke;
    }
    flatter += dt;
    for (i = 0; i < rumpfDeko.children.length; i++) {
      var fl = rumpfDeko.children[i];
      if (fl.name === 'fluegel') fl.rotation.y = fl.userData.seite * (0.5 + Math.sin(flatter * 7) * 0.3);
      else if (fl.name === 'umhang') fl.rotation.x = 0.16 + gehStaerke * 0.35 + Math.sin(flatter * 5) * 0.05 * gehStaerke;
    }
  }
  return {
    wurzel: wurzel, huefte: huefte, gelenke: G, material: M,
    setzeOutfit: setzeOutfit, setzePose: setzePose, gehe: gehe, bewege: bewege,
    setzeHelm: function (an) { helm.visible = !!an; },
    setzeHoehe: function (y, sofort) { hoeheZiel = y; if (sofort) { hoeheIst = y; huefte.position.y = y; } }
  };
}
