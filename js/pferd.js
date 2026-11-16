// ============================================================
//  PFERD UND REITERIN
//  Die Koerper werden aus "Ringen" geformt (wie Scheiben, die
//  hintereinander liegen und mit Haut ueberzogen werden).
//  Das Pferd schaut in Richtung +Z, die Hufe stehen auf y = 0.
// ============================================================

function dunkler(hex, faktor) {
  var c = new THREE.Color(hex);
  c.multiplyScalar(faktor);
  return c;
}

// Formt einen glatten Koerper aus Ringen.
// Jeder Ring: { y, z, rx, rd, rd2 }  -> Mittelpunkt (y,z), halbe Breite rx,
// rd = Ausdehnung zur einen Seite, rd2 = zur anderen (wenn weggelassen: wie rd)
// opt.von / opt.bis: nur ein Teil des Umfangs (z.B. fuer die Satteldecke)
// opt.plus: alles um so viel dicker machen
function loft(ringe, opt) {
  opt = opt || {};
  var seg = opt.seg || 18;
  var offen = opt.von !== undefined;
  var a0 = offen ? opt.von : 0, a1 = offen ? opt.bis : Math.PI * 2;
  var plus = opt.plus || 0;
  var n = ringe.length, spalten = offen ? seg + 1 : seg;
  var pos = [], idx = [], i, j;
  for (i = 0; i < n; i++) {
    var r = ringe[i], p = ringe[Math.max(0, i - 1)], q = ringe[Math.min(n - 1, i + 1)];
    var ty = q.y - p.y, tz = q.z - p.z, l = Math.sqrt(ty * ty + tz * tz) || 1;
    ty /= l; tz /= l;
    var ny = tz, nz = -ty;
    for (j = 0; j < spalten; j++) {
      var a = a0 + (a1 - a0) * j / seg, c = Math.cos(a), s = Math.sin(a);
      var D = (s >= 0 ? r.rd : (r.rd2 === undefined ? r.rd : r.rd2)) + plus;
      pos.push((r.rx + plus) * c, r.y + ny * D * s, r.z + nz * D * s);
    }
  }
  for (i = 0; i < n - 1; i++) {
    for (j = 0; j < seg; j++) {
      var j2 = offen ? j + 1 : (j + 1) % seg;
      var A = i * spalten + j, B = i * spalten + j2, C = (i + 1) * spalten + j, Dd = (i + 1) * spalten + j2;
      idx.push(A, B, C, B, Dd, C);
    }
  }
  if (!offen) {
    var m0 = pos.length / 3; pos.push(0, ringe[0].y, ringe[0].z);
    var m1 = m0 + 1; pos.push(0, ringe[n - 1].y, ringe[n - 1].z);
    for (j = 0; j < seg; j++) {
      idx.push(m0, (j + 1) % seg, j);
      idx.push(m1, (n - 1) * seg + j, (n - 1) * seg + (j + 1) % seg);
    }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Punkte auf der "Oberkante" einer Ring-Form (fuer Maehne, Blesse ...)
function oberkante(ringe, abstand) {
  var out = [];
  for (var i = 0; i < ringe.length; i++) {
    var r = ringe[i], p = ringe[Math.max(0, i - 1)], q = ringe[Math.min(ringe.length - 1, i + 1)];
    var ty = q.y - p.y, tz = q.z - p.z, l = Math.sqrt(ty * ty + tz * tz) || 1;
    out.push({ y: r.y + tz / l * (r.rd + abstand), z: r.z - ty / l * (r.rd + abstand), rx: r.rx, rd: r.rd });
  }
  return out;
}

function netz(geo, mat, eltern, x, y, z) {
  var m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true;
  eltern.add(m);
  return m;
}

// Stab zwischen zwei Punkten (Arm, Bein, Riemen ...)
function stab(a, b, ra, rb, mat, eltern) {
  var va = new THREE.Vector3(a[0], a[1], a[2]), vb = new THREE.Vector3(b[0], b[1], b[2]);
  var m = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, va.distanceTo(vb), 10), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  m.castShadow = true;
  eltern.add(m);
  return m;
}

function bauePferdMitReiterin() {
  var wurzel = new THREE.Group();   // steht auf dem Boden, folgt dem Weg
  var koerper = new THREE.Group();  // alles was huepft und sich neigt
  wurzel.add(koerper);

  function mat(farbe, rau) { return new THREE.MeshStandardMaterial({ color: farbe === undefined ? 0xffffff : farbe, roughness: rau === undefined ? 0.8 : rau, metalness: 0 }); }
  var M = {
    fell: mat(), bein: mat(), maehne: mat(undefined, 0.95),
    huf: mat(0x2a2018, 0.5), leder: mat(0x4a2c17, 0.55), zaum: mat(0x24160c, 0.6),
    decke: mat(undefined, 0.9), auge: mat(0x0a0806, 0.15), weiss: mat(0xf7f4ec, 0.85),
    nase: mat(0x3a2a24, 0.7), metall: new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.35, metalness: 0.2 }),
    haut: mat(0xf0c4a2, 0.75), lippe: mat(0xc86a66, 0.6),
    jacke: mat(undefined, 0.85), hose: mat(undefined, 0.85), helm: mat(undefined, 0.4),
    stiefel: mat(undefined, 0.35), haare: mat(undefined, 0.9), handschuh: mat(0x2a1c12, 0.7),
    gold: new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.35, metalness: 0.15 }),
    band: mat(0xd11f3a, 0.7), bandBlau: mat(0x2456c8, 0.7)
  };
  M.decke.side = THREE.DoubleSide;
  M.haare.side = THREE.DoubleSide;
  M.leder.side = THREE.DoubleSide;
  M.zaum.side = THREE.DoubleSide;

  // ======================= PFERD =======================
  var pferd = new THREE.Group();
  koerper.add(pferd);

  // ---- Rumpf: Ringe von der Kruppe (hinten) bis zur Brust (vorne) ----
  var RUMPF = [
    { z: -1.10, y: 1.43, rx: 0.05, rd: 0.05 },
    { z: -1.04, y: 1.41, rx: 0.23, rd: 0.19, rd2: 0.27 },
    { z: -0.88, y: 1.37, rx: 0.37, rd: 0.29, rd2: 0.40 },
    { z: -0.62, y: 1.33, rx: 0.43, rd: 0.33, rd2: 0.43 },
    { z: -0.30, y: 1.29, rx: 0.44, rd: 0.31, rd2: 0.44 },
    { z: 0.05, y: 1.28, rx: 0.43, rd: 0.30, rd2: 0.46 },
    { z: 0.38, y: 1.30, rx: 0.41, rd: 0.33, rd2: 0.47 },
    { z: 0.64, y: 1.34, rx: 0.37, rd: 0.37, rd2: 0.45 },
    { z: 0.84, y: 1.37, rx: 0.31, rd: 0.33, rd2: 0.40 },
    { z: 0.98, y: 1.38, rx: 0.21, rd: 0.24, rd2: 0.30 },
    { z: 1.05, y: 1.39, rx: 0.06, rd: 0.08 }
  ];
  netz(loft(RUMPF, { seg: 22 }), M.fell, pferd);

  // ---- Hals ----
  var hals = new THREE.Group();
  hals.position.set(0, 1.42, 0.8);
  pferd.add(hals);
  var HALS = [
    { y: -0.24, z: -0.16, rx: 0.27, rd: 0.36, rd2: 0.34 },
    { y: 0.03, z: 0.08, rx: 0.22, rd: 0.29, rd2: 0.29 },
    { y: 0.29, z: 0.27, rx: 0.17, rd: 0.235, rd2: 0.22 },
    { y: 0.53, z: 0.44, rx: 0.135, rd: 0.19, rd2: 0.175 },
    { y: 0.73, z: 0.58, rx: 0.112, rd: 0.15, rd2: 0.145 },
    { y: 0.86, z: 0.67, rx: 0.09, rd: 0.11, rd2: 0.11 }
  ];
  netz(loft(HALS, { seg: 16 }), M.fell, hals);
  // Maehne auf dem Halskamm
  var kamm = oberkante(HALS, -0.02).slice(1).map(function (p, i) {
    return { y: p.y, z: p.z, rx: 0.04, rd: 0.085 - i * 0.006, rd2: 0.02 };
  });
  netz(loft(kamm, { seg: 8 }), M.maehne, hals);
  // Maehne haengt auf einer Seite herunter
  for (var mi = 0; mi < 7; mi++) {
    var f = (mi + 0.5) / 7, pA = kamm[0], pB = kamm[kamm.length - 1];
    var hy = pA.y + (pB.y - pA.y) * f, hz = pA.z + (pB.z - pA.z) * f;
    var straehne = netz(new THREE.SphereGeometry(0.08, 8, 6), M.maehne, hals, -0.06, hy - 0.02, hz - 0.03);
    straehne.scale.set(0.55, 1.7 - f * 0.5, 1.0);
    straehne.rotation.x = 0.66;
  }

  // ---- Kopf ----
  var kopf = new THREE.Group();          // dreht sich beim Kopfschuetteln
  kopf.position.set(0, 0.88, 0.68);
  hals.add(kopf);
  var kopfForm = new THREE.Group();
  kopfForm.scale.setScalar(0.82);
  kopf.add(kopfForm);
  var KOPF = [
    { y: 0.07, z: -0.12, rx: 0.085, rd: 0.09, rd2: 0.11 },
    { y: 0.01, z: 0.0, rx: 0.125, rd: 0.115, rd2: 0.20 },
    { y: -0.12, z: 0.14, rx: 0.122, rd: 0.105, rd2: 0.20 },
    { y: -0.27, z: 0.28, rx: 0.098, rd: 0.085, rd2: 0.135 },
    { y: -0.41, z: 0.41, rx: 0.082, rd: 0.075, rd2: 0.095 },
    { y: -0.50, z: 0.49, rx: 0.084, rd: 0.078, rd2: 0.092 },
    { y: -0.555, z: 0.545, rx: 0.055, rd: 0.05, rd2: 0.06 }
  ];
  netz(loft(KOPF, { seg: 16 }), M.fell, kopfForm);
  var KOPF_OBEN = oberkante(KOPF, 0);
  // Maul / Nuestern (dunkler)
  var maul = netz(new THREE.SphereGeometry(0.083, 12, 10), M.nase, kopfForm, 0, -0.525, 0.515);
  maul.scale.set(1.0, 0.95, 0.9);
  netz(new THREE.SphereGeometry(0.02, 8, 6), M.auge, kopfForm, -0.05, -0.5, 0.585).scale.set(1, 1.5, 0.7);
  netz(new THREE.SphereGeometry(0.02, 8, 6), M.auge, kopfForm, 0.05, -0.5, 0.585).scale.set(1, 1.5, 0.7);
  // Augen (mit kleinem Glanzpunkt)
  for (var as = -1; as <= 1; as += 2) {
    netz(new THREE.SphereGeometry(0.03, 10, 8), M.auge, kopfForm, as * 0.112, -0.055, 0.16);
    netz(new THREE.SphereGeometry(0.008, 6, 6), M.weiss, kopfForm, as * 0.138, -0.045, 0.172);
    // Ohren
    var ohr = netz(new THREE.ConeGeometry(0.045, 0.17, 8), M.fell, kopfForm, as * 0.07, 0.19, -0.03);
    ohr.scale.set(1, 1, 0.6);
    ohr.rotation.set(-0.25, 0, -as * 0.22);
  }
  // Schopf
  var schopf = netz(new THREE.SphereGeometry(0.06, 8, 8), M.maehne, kopfForm, 0, 0.09, 0.07);
  schopf.scale.set(0.9, 0.6, 1.9);
  schopf.rotation.x = 0.75;

  // Abzeichen im Gesicht (wird je nach Auswahl gebaut)
  var gesicht = new THREE.Group();
  kopfForm.add(gesicht);
  function baueGesicht(art) {
    while (gesicht.children.length) gesicht.remove(gesicht.children[0]);
    var i;
    if (art === 'blesse') {
      var streifen = oberkante(KOPF, -0.012).slice(1, 6).map(function (p, k) {
        return { y: p.y, z: p.z, rx: [0.03, 0.04, 0.035, 0.035, 0.045][k], rd: 0.018, rd2: 0.0 };
      });
      netz(loft(streifen, { seg: 8 }), M.weiss, gesicht);
    } else if (art === 'stern') {
      var p = KOPF_OBEN[1], q = KOPF_OBEN[2];
      var st = netz(new THREE.SphereGeometry(0.05, 10, 8), M.weiss, gesicht, 0, (p.y + q.y) / 2 - 0.028, (p.z + q.z) / 2 - 0.028);
      st.scale.set(1, 0.9, 0.9);
    } else if (art === 'sprenkel') {
      // helle Tupfen auf Nasenruecken und Schnauze
      var tupfen = [[3, 0.0, 1], [3, 0.6, 0.8], [3, -0.6, 0.9], [4, 0.3, 1], [4, -0.35, 0.8], [4, 0.85, 0.7], [4, -0.9, 0.7], [5, 0.0, 0.9], [5, 0.55, 0.8], [5, -0.6, 1], [2, 0.3, 0.7], [2, -0.3, 0.8]];
      for (i = 0; i < tupfen.length; i++) {
        var t = tupfen[i], r = KOPF[t[0]], o = KOPF_OBEN[t[0]];
        var w = Math.PI / 2 + t[1];
        // Punkt auf der Oberflaeche des Rings beim Winkel w
        var cy = r.y + (o.y - r.y) * Math.sin(w), cz = r.z + (o.z - r.z) * Math.sin(w);
        netz(new THREE.SphereGeometry(0.016 * t[2], 6, 5), M.weiss, gesicht, r.rx * Math.cos(w) * 0.97, cy - 0.006, cz - 0.006);
      }
    }
  }

  // ---- Zaumzeug ----
  function riemenRing(ringNr, verschiebung) {
    var r = KOPF[ringNr], r2 = KOPF[ringNr + 1], f = verschiebung || 0;
    var a = { y: r.y + (r2.y - r.y) * f, z: r.z + (r2.z - r.z) * f, rx: r.rx + (r2.rx - r.rx) * f, rd: r.rd + (r2.rd - r.rd) * f, rd2: r.rd2 + (r2.rd2 - r.rd2) * f };
    var dy = (r2.y - r.y), dz = (r2.z - r.z), l = Math.sqrt(dy * dy + dz * dz);
    var b = { y: a.y + dy / l * 0.03, z: a.z + dz / l * 0.03, rx: a.rx, rd: a.rd, rd2: a.rd2 };
    var g = loft([a, b], { seg: 16, plus: 0.008, von: 0, bis: Math.PI * 2 });
    return netz(g, M.zaum, kopfForm);
  }
  riemenRing(3, 0.55);   // Nasenriemen
  riemenRing(1, 0.05);   // Genickstueck / Kehlriemen
  for (var zs = -1; zs <= 1; zs += 2) {
    stab([zs * 0.128, -0.02, 0.03], [zs * 0.092, -0.36, 0.36], 0.008, 0.008, M.zaum, kopfForm);   // Backenstueck
    netz(new THREE.TorusGeometry(0.025, 0.006, 6, 12), M.metall, kopfForm, zs * 0.092, -0.42, 0.395).rotation.y = Math.PI / 2; // Gebissring
  }
  stab([-0.12, 0.02, 0.06], [0.12, 0.02, 0.06], 0.009, 0.009, M.zaum, kopfForm).position.y += 0.07; // Stirnriemen

  // Schleife (Abzeichen fuer das Siegerpferd) am Zaumzeug
  var schleife = new THREE.Group();
  for (var ss = -1; ss <= 1; ss += 2) {
    var ros = new THREE.Group();
    ros.position.set(ss * 0.135, -0.0, 0.06);
    ros.rotation.y = ss * Math.PI / 2;
    var aussen = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 14), M.gold);
    aussen.rotation.x = Math.PI / 2; ros.add(aussen);
    var mitte = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 14), M.band);
    mitte.rotation.x = Math.PI / 2; ros.add(mitte);
    var kern = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.028, 10), M.gold);
    kern.rotation.x = Math.PI / 2; ros.add(kern);
    for (var b = -1; b <= 1; b += 2) {
      var bandTeil = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.006), b < 0 ? M.band : M.bandBlau);
      bandTeil.position.set(b * 0.025, -0.13, 0);
      bandTeil.rotation.z = b * 0.18;
      ros.add(bandTeil);
    }
    schleife.add(ros);
  }
  schleife.visible = false;
  kopfForm.add(schleife);

  // ---- Schweif ----
  var schweif = new THREE.Group();
  schweif.position.set(0, 1.5, -1.05);
  pferd.add(schweif);
  netz(loft([
    { y: 0.02, z: 0.06, rx: 0.045, rd: 0.045 },
    { y: -0.02, z: -0.1, rx: 0.07, rd: 0.07 },
    { y: -0.25, z: -0.26, rx: 0.1, rd: 0.09 },
    { y: -0.6, z: -0.33, rx: 0.115, rd: 0.1 },
    { y: -0.92, z: -0.34, rx: 0.09, rd: 0.08 },
    { y: -1.12, z: -0.32, rx: 0.03, rd: 0.03 }
  ], { seg: 10 }), M.maehne, schweif);

  // ---- Beine: Oberbein (dreht an Schulter/Huefte) und Unterbein (Knie) ----
  var beine = [];
  function baueBein(x, z, vorne) {
    var oben = new THREE.Group();
    oben.position.set(x, 1.165, z);
    pferd.add(oben);
    var knieZ = vorne ? 0 : -0.1;
    if (vorne) {
      netz(loft([
        { y: 0.24, z: 0.02, rx: 0.07, rd: 0.12 },
        { y: 0.05, z: 0.01, rx: 0.105, rd: 0.16 },
        { y: -0.22, z: 0, rx: 0.085, rd: 0.105 },
        { y: -0.46, z: 0, rx: 0.06, rd: 0.07 },
        { y: -0.545, z: 0.005, rx: 0.066, rd: 0.078 },
        { y: -0.6, z: 0, rx: 0.055, rd: 0.062 }
      ], { seg: 10 }), M.fell, oben);
    } else {
      netz(loft([
        { y: 0.3, z: 0.05, rx: 0.08, rd: 0.16 },
        { y: 0.1, z: 0.03, rx: 0.13, rd: 0.25 },
        { y: -0.15, z: 0.0, rx: 0.115, rd: 0.17 },
        { y: -0.38, z: -0.06, rx: 0.07, rd: 0.09 },
        { y: -0.53, z: -0.1, rx: 0.062, rd: 0.085, rd2: 0.07 },
        { y: -0.6, z: -0.1, rx: 0.052, rd: 0.062 }
      ], { seg: 10 }), M.fell, oben);
    }
    var unten = new THREE.Group();
    unten.position.set(0, -0.56, knieZ);
    oben.add(unten);
    netz(loft([
      { y: 0.03, z: 0, rx: 0.052, rd: 0.06 },
      { y: -0.1, z: 0, rx: 0.042, rd: 0.05 },
      { y: -0.36, z: 0, rx: 0.04, rd: 0.048 },
      { y: -0.44, z: 0.005, rx: 0.054, rd: 0.062 },
      { y: -0.5, z: 0.02, rx: 0.048, rd: 0.052 },
      { y: -0.54, z: 0.03, rx: 0.05, rd: 0.055 }
    ], { seg: 10 }), M.bein, unten);
    var huf = netz(new THREE.CylinderGeometry(0.058, 0.078, 0.1, 12), M.huf, unten, 0, -0.555, 0.04);
    huf.scale.z = 1.15;
    beine.push({ oben: oben, unten: unten, vorne: vorne });
  }
  baueBein(-0.2, 0.66, true);
  baueBein(0.2, 0.66, true);
  baueBein(-0.22, -0.74, false);
  baueBein(0.22, -0.74, false);

  // ---- Satteldecke, Sattel, Gurt ----
  function rumpfStueck(z0, z1) {
    // Ringe des Rumpfs zwischen z0 und z1 (linear dazwischen gerechnet)
    function bei(z) {
      for (var i = 0; i < RUMPF.length - 1; i++) {
        var a = RUMPF[i], b = RUMPF[i + 1];
        if (z >= a.z && z <= b.z) {
          var f = (z - a.z) / (b.z - a.z);
          return { z: z, y: a.y + (b.y - a.y) * f, rx: a.rx + (b.rx - a.rx) * f, rd: a.rd + (b.rd - a.rd) * f, rd2: (a.rd2 || a.rd) + ((b.rd2 || b.rd) - (a.rd2 || a.rd)) * f };
        }
      }
    }
    var out = [];
    for (var k = 0; k <= 6; k++) out.push(bei(z0 + (z1 - z0) * k / 6));
    return out;
  }
  netz(loft(rumpfStueck(-0.34, 0.4), { seg: 20, plus: 0.012, von: -0.45, bis: Math.PI + 0.45 }), M.decke, pferd);
  netz(loft(rumpfStueck(-0.2, 0.33), { seg: 20, plus: 0.028, von: -0.25, bis: Math.PI + 0.25 }), M.leder, pferd);   // Sattelblaetter
  netz(loft(rumpfStueck(0.12, 0.2), { seg: 20, plus: 0.018, von: Math.PI - 0.1, bis: Math.PI * 2 + 0.1 }), M.zaum, pferd); // Gurt
  var sitz = netz(new THREE.SphereGeometry(0.2, 14, 10), M.leder, pferd, 0, 1.6, 0.02);
  sitz.scale.set(1.0, 0.32, 1.45);
  var hinterzwiesel = netz(new THREE.SphereGeometry(0.15, 12, 8), M.leder, pferd, 0, 1.645, -0.22);
  hinterzwiesel.scale.set(1.2, 0.45, 0.5);
  var vorderzwiesel = netz(new THREE.SphereGeometry(0.1, 10, 8), M.leder, pferd, 0, 1.655, 0.3);
  vorderzwiesel.scale.set(1.0, 0.6, 0.6);

  // ======================= REITERIN =======================
  var SITZ_Y = 1.635;
  var reiterin = new THREE.Group();
  var RG = 1.12;                       // Groesse der Reiterin
  reiterin.position.set(0, SITZ_Y, 0.02);
  reiterin.scale.setScalar(RG);
  koerper.add(reiterin);
  var oberkoerper = new THREE.Group();   // neigt sich beim Sprung nach vorne
  reiterin.add(oberkoerper);

  // Rumpf (Jacke): von der Huefte bis zu den Schultern
  netz(loft([
    { y: -0.03, z: 0, rx: 0.1, rd: 0.07, rd2: 0.07 },
    { y: 0.03, z: 0, rx: 0.15, rd: 0.105, rd2: 0.1 },
    { y: 0.15, z: 0, rx: 0.122, rd: 0.085, rd2: 0.085 },
    { y: 0.3, z: 0, rx: 0.143, rd: 0.09, rd2: 0.105 },
    { y: 0.41, z: 0, rx: 0.163, rd: 0.085, rd2: 0.09 },
    { y: 0.47, z: 0, rx: 0.11, rd: 0.065, rd2: 0.065 },
    { y: 0.5, z: 0, rx: 0.045, rd: 0.045 }
  ], { seg: 16 }), M.jacke, oberkoerper);
  // Jackenschoss hinten
  var schoss = netz(new THREE.SphereGeometry(0.15, 12, 8), M.jacke, oberkoerper, 0, -0.01, -0.07);
  schoss.scale.set(1.0, 0.45, 0.8);
  // weisser Kragen (Plastron)
  netz(new THREE.SphereGeometry(0.05, 10, 8), M.weiss, oberkoerper, 0, 0.475, 0.035).scale.set(1.1, 0.7, 0.9);
  // Hals
  netz(new THREE.CylinderGeometry(0.036, 0.042, 0.1, 10), M.haut, oberkoerper, 0, 0.53, 0);

  // Kopf
  var rkopf = new THREE.Group();
  rkopf.position.set(0, 0.66, 0.01);
  oberkoerper.add(rkopf);
  var schaedel = netz(new THREE.SphereGeometry(0.1, 18, 14), M.haut, rkopf);
  schaedel.scale.set(0.9, 1.1, 1.0);
  netz(new THREE.SphereGeometry(0.06, 12, 10), M.haut, rkopf, 0, -0.06, 0.035).scale.set(0.95, 0.9, 0.95); // Kinn
  netz(new THREE.SphereGeometry(0.014, 8, 6), M.haut, rkopf, 0, -0.022, 0.1);                               // Nase
  for (var es = -1; es <= 1; es += 2) {
    netz(new THREE.SphereGeometry(0.015, 8, 6), M.weiss, rkopf, es * 0.034, 0.005, 0.086).scale.set(1.2, 0.8, 0.6);
    netz(new THREE.SphereGeometry(0.0085, 8, 6), M.auge, rkopf, es * 0.034, 0.005, 0.093);
    netz(new THREE.BoxGeometry(0.03, 0.005, 0.006), M.haare, rkopf, es * 0.034, 0.028, 0.09).rotation.z = -es * 0.12; // Augenbraue
    netz(new THREE.SphereGeometry(0.018, 6, 6), M.haut, rkopf, es * 0.09, -0.005, 0.0).scale.set(0.5, 1, 0.8);     // Ohr
  }
  var mund = netz(new THREE.TorusGeometry(0.022, 0.0045, 6, 10, Math.PI), M.lippe, rkopf, 0, -0.05, 0.088);
  mund.rotation.z = Math.PI;
  mund.castShadow = false;
  // Helm
  var helm = netz(new THREE.SphereGeometry(0.108, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), M.helm, rkopf, 0, 0.022, -0.004);
  helm.scale.set(0.95, 1.05, 1.06);
  var schirm = netz(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 14, 1, false, -Math.PI / 2, Math.PI), M.helm, rkopf, 0, 0.032, 0.085);
  schirm.scale.set(1, 1, 0.9);
  schirm.rotation.x = 0.12;
  netz(new THREE.SphereGeometry(0.014, 8, 6), M.helm, rkopf, 0, 0.138, -0.004);
  for (var ks = -1; ks <= 1; ks += 2) stab([ks * 0.092, 0.02, 0.0], [ks * 0.03, -0.108, 0.04], 0.004, 0.004, M.zaum, rkopf); // Kinnriemen
  // Haare
  var frisur = new THREE.Group();
  rkopf.add(frisur);
  var kappeDeko = new THREE.Group(), kopfDeko = new THREE.Group(), rumpfDeko = new THREE.Group();
  rkopf.add(kappeDeko); rkopf.add(kopfDeko); oberkoerper.add(rumpfDeko);

  var zuegelEigen = [];
  // Arme: Schulter -> Ellbogen -> Hand am Zuegel
  for (var arm = -1; arm <= 1; arm += 2) {
    var schulter = [arm * 0.165, 0.41, 0.0], ellbogen = [arm * 0.19, 0.2, 0.06], hand = [arm * 0.085, 0.17, 0.34];
    netz(new THREE.SphereGeometry(0.052, 10, 8), M.jacke, oberkoerper, schulter[0], schulter[1], schulter[2]);
    stab(schulter, ellbogen, 0.05, 0.04, M.jacke, oberkoerper);
    netz(new THREE.SphereGeometry(0.041, 8, 8), M.jacke, oberkoerper, ellbogen[0], ellbogen[1], ellbogen[2]);
    stab(ellbogen, hand, 0.04, 0.03, M.jacke, oberkoerper);
    netz(new THREE.SphereGeometry(0.036, 8, 8), M.handschuh, oberkoerper, hand[0], hand[1] - 0.005, hand[2] + 0.03).scale.set(0.9, 1.1, 1.1);
    // Zuegel von der Hand zum Gebiss
    zuegelEigen.push(stab([hand[0] * RG, SITZ_Y + hand[1] * RG, (hand[2] + 0.06) * RG + 0.02], [arm * 0.085, 1.955, 1.8], 0.006, 0.006, M.zaum, koerper));
  }

  // Beine: Huefte -> Knie -> Knoechel -> Fussspitze
  for (var bs = -1; bs <= 1; bs += 2) {
    var huefte = [bs * 0.1, 0.02, 0.0], knie = [bs * 0.4, -0.13, 0.3], knoechel = [bs * 0.445, -0.56, 0.1], spitze = [bs * 0.46, -0.6, 0.27];
    stab(huefte, knie, 0.095, 0.07, M.hose, reiterin);
    netz(new THREE.SphereGeometry(0.072, 10, 8), M.hose, reiterin, knie[0], knie[1], knie[2]);
    stab([knie[0], knie[1] - 0.03, knie[2] - 0.01], knoechel, 0.068, 0.045, M.stiefel, reiterin);
    netz(new THREE.SphereGeometry(0.047, 8, 8), M.stiefel, reiterin, knoechel[0], knoechel[1] - 0.01, knoechel[2]);
    var fuss = stab(knoechel, spitze, 0.045, 0.036, M.stiefel, reiterin);
    netz(new THREE.SphereGeometry(0.037, 8, 6), M.stiefel, reiterin, spitze[0], spitze[1], spitze[2]);
    // Steigbuegel
    stab([bs * 0.4, -0.02, 0.14], [bs * 0.455, -0.6, 0.2], 0.008, 0.008, M.zaum, reiterin);
    var buegel = netz(new THREE.TorusGeometry(0.058, 0.008, 6, 14), M.metall, reiterin, bs * 0.458, -0.6, 0.21);
    buegel.rotation.y = Math.PI / 2;
    buegel.scale.y = 1.1;
  }
  netz(new THREE.SphereGeometry(0.15, 12, 8), M.hose, reiterin, 0, 0.0, -0.01).scale.set(1.1, 0.6, 0.95); // Gesaess

  // Medaille (fuer die Siegerin)
  var medaille = new THREE.Group();
  var scheibe = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.012, 18), M.gold);
  scheibe.rotation.x = Math.PI / 2;
  scheibe.position.set(0, 0.27, 0.118);
  medaille.add(scheibe);
  var stern = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.018, 5), M.gold);
  stern.rotation.x = Math.PI / 2;
  stern.position.set(0, 0.27, 0.12);
  medaille.add(stern);
  stab([-0.06, 0.47, 0.06], [-0.005, 0.3, 0.115], 0.009, 0.009, M.band, medaille);
  stab([0.06, 0.47, 0.06], [0.005, 0.3, 0.115], 0.009, 0.009, M.bandBlau, medaille);
  medaille.visible = false;
  oberkoerper.add(medaille);

  // ---------------- Frisuren ----------------
  function baueFrisur(art) {
    while (frisur.children.length) frisur.remove(frisur.children[0]);
    // Haare unter dem Helm am Hinterkopf und an den Schlaefen
    var hinten = netz(new THREE.SphereGeometry(0.104, 14, 10, Math.PI * 0.9, Math.PI * 1.2, Math.PI * 0.42, Math.PI * 0.3), M.haare, frisur, 0, 0.012, -0.012);
    hinten.scale.set(0.97, 1.1, 1.02);
    if (art === 'zopf') {
      var z1 = new THREE.Group();
      z1.position.set(0, -0.03, -0.1);
      z1.name = 'wackel';
      z1.userData.basis = 0.5;
      frisur.add(z1);
      netz(loft([
        { y: 0.0, z: 0, rx: 0.025, rd: 0.025 }, { y: -0.06, z: 0, rx: 0.04, rd: 0.04 },
        { y: -0.2, z: 0, rx: 0.036, rd: 0.036 }, { y: -0.3, z: 0, rx: 0.012, rd: 0.012 }
      ], { seg: 8 }), M.haare, z1);
      netz(new THREE.TorusGeometry(0.026, 0.009, 6, 10), M.band, frisur, 0, -0.035, -0.105).rotation.x = 1.1;
    } else if (art === 'zoepfe') {
      for (var s = -1; s <= 1; s += 2) {
        var z2 = new THREE.Group();
        z2.position.set(s * 0.075, -0.05, -0.03);
        z2.name = 'wackel';
        z2.userData.basis = 0.05;
        z2.rotation.z = s * 0.1;
        frisur.add(z2);
        for (var k = 0; k < 6; k++) {
          netz(new THREE.SphereGeometry(0.027 - k * 0.002, 8, 6), M.haare, z2, (k % 2 ? 0.006 : -0.006), -0.02 - k * 0.04, 0);
        }
        netz(new THREE.TorusGeometry(0.018, 0.007, 6, 10), M.band, z2, 0, -0.235, 0).rotation.x = Math.PI / 2;
        netz(new THREE.SphereGeometry(0.024, 8, 6), M.haare, z2, 0, -0.27, 0).scale.set(1, 1.5, 1);
      }
    } else if (!MODE.frisur(art, frisur, M.haare, 0, M.band)) {
      var bob = netz(new THREE.SphereGeometry(0.106, 14, 10, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.42, Math.PI * 0.26), M.haare, frisur, 0, 0.0, -0.008);
      bob.scale.set(1.02, 1.3, 1.04);
    }
  }

  // ---------------- Outfit setzen ----------------
  function setzeOutfit(o) {
    letzteFarben = o;
    var fellHex = (typeof o.fell === 'string' && o.fell.charAt(0) === '#') ? o.fell : HERDE.fellAus(o.fell).koerper;
    M.jacke.color.set(o.jacke);
    M.hose.color.set(o.hose);
    M.helm.color.set(o.helm);
    M.stiefel.color.set(o.stiefel);
    M.haare.color.set(o.haare);
    M.fell.color.set(fellHex);
    M.decke.color.set(o.decke);
    // Maehne und Beine passend zur Fellfarbe
    var f = new THREE.Color(fellHex);
    var hell = (f.r + f.g + f.b) / 3;
    if (hell > 0.8) { M.maehne.color.set(0xd8d2c4); M.bein.color.set(0xcfc9bb); M.nase.color.set(0x6b5a55); }       // Schimmel
    else if (o.fell === '#d9a55a') { M.maehne.color.set(0xf3ead2); M.bein.color.copy(f); M.nase.color.set(0x4a342a); } // Palomino
    else if (o.fell === '#9a9a9a') { M.maehne.color.set(0x3a3a3a); M.bein.color.set(0x4a4a4a); M.nase.color.set(0x2a2626); } // Grauer
    else if (o.fell === '#8b5a2b') { M.maehne.color.set(0x17100a); M.bein.color.set(0x21160e); M.nase.color.set(0x2a1c16); } // Brauner mit schwarzen Beinen
    else { M.maehne.color.copy(dunkler(fellHex, 0.35)); M.bein.color.copy(dunkler(fellHex, 0.75)); M.nase.color.copy(dunkler(fellHex, 0.5)); }
    if (modell) {
      if (anstr) { anstr.setzeFell(o.fell); anstr.setzeSchmutz(o.schmutz || 0); } else modellMat.fell.color.set(fellHex);
      modellMat.sattel.color.set(o.decke);
      if (ausr) ausr.setze(o.ausruestung);
    }
    if (frisur.userData.art !== o.frisur) { baueFrisur(o.frisur); frisur.userData.art = o.frisur; }
    MODE.kappe(kappeDeko, o, 0.022, 0.112);
    MODE.kopf(kopfDeko, o, 0);
    MODE.koerper(rumpfDeko, o, { y: 0.3, b: 0.143, t: 0.092, hals: 0.5 });
    var g = o.gesicht || 'blesse';
    if (gesicht.userData.art !== g) { baueGesicht(g); gesicht.userData.art = g; }
  }

  function setzeAuszeichnung(an) {
    medaille.visible = !!an;
    schleife.visible = !!an;
    schleifeModell.visible = !!an && !!modell;
  }

  // ======================= FERTIGES 3D-MODELL =======================
  // Wenn ein Pferdemodell geladen wurde, ersetzt es das selbstgebaute Pferd.
  // Die Reiterin bleibt und sitzt auf dem Sattel des Modells.
  var modell = null, mixer = null, galoppDauer = 1;
  var gangAkt = {}, gangName = 'galopp', anstr = null, ausr = null;
  var GANG_VOLL = { galopp: 1, trab: 0.8, schritt: 0.5 };
  var modellMat = { fell: null, sattel: null };
  var rueckenKnochen = null, kopfKnochen = null;
  var rueckenRuhe = new THREE.Vector3(), hilf = new THREE.Vector3();
  var letzteFarben = null;
  var MODELL_HOEHE = 2.5;          // Hoehe bis zu den Ohrenspitzen in Metern
  var SITZ_MODELL = { y: 1.73, z: 0.03 };

  // Siegerschleife fuer das Modellpferd (haengt seitlich am Kopf)
  var schleifeModell = new THREE.Group();
  (function () {
    var aussen = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.014, 14), M.gold);
    aussen.rotation.z = Math.PI / 2; schleifeModell.add(aussen);
    var mitte = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.024, 14), M.band);
    mitte.rotation.z = Math.PI / 2; schleifeModell.add(mitte);
    var kern = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.032, 10), M.gold);
    kern.rotation.z = Math.PI / 2; schleifeModell.add(kern);
    for (var b = -1; b <= 1; b += 2) {
      var bandTeil = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.2, 0.04), b < 0 ? M.band : M.bandBlau);
      bandTeil.position.set(0, -0.15, b * 0.03);
      bandTeil.rotation.x = -b * 0.18;
      schleifeModell.add(bandTeil);
    }
  })();
  schleifeModell.visible = false;
  koerper.add(schleifeModell);

  function nutzeModell(gltf) {
    var szene = gltf.scene;
    szene.updateMatrixWorld(true);
    // Groesse ausmessen
    var kasten = new THREE.Box3();
    szene.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      o.computeBoundingBox();
      kasten.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
      o.castShadow = true;
      o.frustumCulled = false;
      var m = o.material;
      m.roughness = 0.8;
      if (m.name === 'Material.001') modellMat.fell = m;        // Koerper, Maehne, Schweif
      else if (m.name === 'Material') modellMat.sattel = m;     // Sattel
      else if (m.name === 'Material.008') o.visible = false;    // Satteltasche (stoert am Bein der Reiterin)
    });
    if (!modellMat.fell || !modellMat.sattel) return;           // unbekanntes Modell: lieber das eigene Pferd behalten
    var faktor = MODELL_HOEHE / (kasten.max.y - kasten.min.y);
    var halter = new THREE.Group();
    szene.position.set(0, -kasten.min.y, 0);
    var dreher = new THREE.Group();
    dreher.add(szene);
    dreher.rotation.y = Math.PI / 2;      // das Modell schaut nach -X, im Spiel ist vorne +Z
    dreher.scale.setScalar(faktor);
    halter.add(dreher);
    koerper.add(halter);

    // Gangarten (Galopp aus dem Modell, Schritt und Trab daraus abgeleitet, siehe herde.js)
    var gaenge = HERDE.gangarten();
    if (gaenge) {
      galoppDauer = gaenge.dauer;
      mixer = new THREE.AnimationMixer(szene);
      ['galopp', 'trab', 'schritt'].forEach(function (g) {
        gangAkt[g] = mixer.clipAction(gaenge[g]);
        gangAkt[g].play();
        gangAkt[g].setEffectiveWeight(0);
      });
    }
    if (HERDE.bereit()) { anstr = HERDE.anstrich(szene, 1); ausr = HERDE.baueAusruestung(szene); }
    szene.traverse(function (o) {
      if (o.isBone && o.name.indexOf('spine009') === 0) rueckenKnochen = o;
      if (o.isBone && o.name.indexOf('skull') === 0) kopfKnochen = o;
    });

    modell = halter;
    pferd.visible = false;                       // das selbstgebaute Pferd ausblenden
    zuegelEigen.forEach(function (z) { z.visible = false; });
    reiterin.position.set(0, SITZ_MODELL.y, SITZ_MODELL.z);
    wurzel.updateMatrixWorld(true);
    if (rueckenKnochen) koerper.worldToLocal(rueckenKnochen.getWorldPosition(rueckenRuhe));
    if (letzteFarben) setzeOutfit(letzteFarben);
    return true;
  }

  // Modell bewegen: Galopp-Animation passend zur Strecke, Reiterin folgt dem Ruecken
  function bewegeModell(phase, staerke, sprung) {
    if (mixer) {
      var u, g;
      if (sprung >= 0) {
        u = 0.62 + sprung * 0.38;                           // Absprung -> Beine anziehen -> Landung
        for (g in gangAkt) gangAkt[g].setEffectiveWeight(g === 'galopp' ? 1 : 0);
      } else {
        u = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
        for (g in gangAkt) gangAkt[g].setEffectiveWeight(g === gangName ? GANG_VOLL[g] * Math.min(1, staerke * 1.3) : 0);
      }
      for (g in gangAkt) gangAkt[g].time = u * galoppDauer;
      mixer.update(0);
    }
    wurzel.updateMatrixWorld(true);
    var dy = 0, dz = 0;
    if (rueckenKnochen) {
      koerper.worldToLocal(rueckenKnochen.getWorldPosition(hilf));
      dy = hilf.y - rueckenRuhe.y; dz = hilf.z - rueckenRuhe.z;
    }
    reiterin.position.set(0, SITZ_MODELL.y + dy * 0.85, SITZ_MODELL.z + dz * 0.5);
    if (kopfKnochen && schleifeModell.visible) {
      koerper.worldToLocal(kopfKnochen.getWorldPosition(hilf));
      schleifeModell.position.set(0.17, hilf.y - 0.2, hilf.z + 0.06);
    }
  }

  // ---------------- Bewegung ----------------
  // phase: laeuft mit der Strecke mit (ein Galoppsprung = 2*PI)
  // staerke: 0 = stehen, 1 = voller Galopp
  // sprung: 0..1 waehrend eines Sprungs, sonst -1
  function bewege(phase, staerke, sprung, zeit) {
    var i, b;
    if (sprung >= 0) {
      var auf = Math.sin(sprung * Math.PI);          // 0 -> 1 -> 0
      for (i = 0; i < 4; i++) {
        b = beine[i];
        if (b.vorne) {
          b.oben.rotation.x = -1.15 * auf + (sprung > 0.75 ? -(sprung - 0.75) * 2.2 : 0);
          b.unten.rotation.x = 2.0 * auf * (sprung < 0.8 ? 1 : (1 - sprung) * 5);
        } else {
          b.oben.rotation.x = sprung < 0.5 ? 0.85 * auf : 0.85 * auf - (sprung - 0.5) * 1.6 * auf;
          b.unten.rotation.x = sprung < 0.45 ? 0.1 : 1.3 * auf;
        }
      }
      hals.rotation.x = 0.3 * auf;
      schweif.rotation.x = -0.9 * auf;
      oberkoerper.rotation.x = 0.6 * auf;
      reiterin.position.y = SITZ_Y + 0.07 * auf;
    } else {
      var versatz = [0.0, 0.5, 2.4, 2.9];
      for (i = 0; i < 4; i++) {
        b = beine[i];
        var p = phase + versatz[i];
        b.oben.rotation.x = Math.sin(p) * 0.7 * staerke;
        var beuge = Math.max(0, Math.sin(p - 1.3));
        b.unten.rotation.x = (b.vorne ? 1.5 : 1.1) * beuge * staerke;
      }
      hals.rotation.x = Math.sin(phase + 0.6) * 0.09 * staerke + Math.sin(zeit * 1.3) * 0.03 * (1 - staerke);
      schweif.rotation.x = -0.35 * staerke + Math.sin(phase) * 0.12 * staerke + Math.sin(zeit * 2) * 0.05;
      schweif.rotation.z = Math.sin(zeit * 1.7) * 0.14 * (1 - staerke);
      oberkoerper.rotation.x = 0.14 * staerke + Math.sin(phase) * 0.04 * staerke;
      reiterin.position.y = SITZ_Y + Math.abs(Math.sin(phase * 0.5 + 0.4)) * 0.04 * staerke;
    }
    if (modell) bewegeModell(phase, staerke, sprung);
    for (i = 0; i < frisur.children.length; i++) {
      var h = frisur.children[i];
      if (h.name === 'wackel') {
        h.rotation.x = h.userData.basis + Math.sin(phase + 1) * 0.25 * staerke + (sprung >= 0 ? 0.6 * Math.sin(sprung * Math.PI) : 0);
      }
    }
  }

  // Kopfschuetteln bei Verweigerung
  function schuettle(t) {
    if (modell) modell.rotation.y = Math.sin(t * 14) * 0.05 * Math.max(0, 1 - t);
    kopf.rotation.y = Math.sin(t * 14) * 0.35 * Math.max(0, 1 - t);
    hals.rotation.x = -0.2 * Math.max(0, 1 - t * 0.8);
  }
  function kopfGerade() { kopf.rotation.y = 0; if (modell) modell.rotation.y = 0; }

  return {
    wurzel: wurzel,
    koerper: koerper,
    setzeOutfit: setzeOutfit,
    setzeAuszeichnung: setzeAuszeichnung,
    nutzeModell: nutzeModell,
    hatModell: function () { return !!modell; },
    bewege: bewege,
    schuettle: schuettle,
    kopfGerade: kopfGerade,
    setzeGang: function (g) { gangName = g; },
    setzeReiterin: function (an) { reiterin.visible = !!an; },
    reiterin: reiterin,
    rueckenHoehe: function () { return reiterin.position.y; }
  };
}
