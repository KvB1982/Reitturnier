// ============================================================
//  STUBEN  -  Einrichtung für Vorratsraum und Reitladen im Stall
//  Regale, Fässer, Sättel, Sessel, Teppich, Lichterkette …
//  Alles ist aus einfachen Formen gebaut. Damit das Spiel schnell
//  bleibt, werden alle Formen eines Raums zu einer einzigen Form
//  zusammengeklebt (der "Sammler" unten macht das).
// ============================================================
var STUBEN = (function () {
  'use strict';
  var HOLZ = 0x9a6b3f, HOLZ_D = 0x7a4a2a, HOLZ_H = 0xc9a06a, LEDER = 0x6b3d1e, LEDER_D = 0x4a2a14, EISEN = 0x3a3a3a, SILBER = 0xbfc5cc;
  var BUNT = [0xe84393, 0x1f6fd0, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xe67e22];
  var WARM = [0xffd27a, 0xffb347, 0xfff1b8, 0xff9d6b];

  // ---------- Sammler: klebt viele Formen zu einer zusammen ----------
  function Sammler() {
    var pos = [], nor = [], col = [];
    var basis = new THREE.Matrix4(), m = new THREE.Matrix4(), nm = new THREE.Matrix3();
    var v = new THREE.Vector3(), c = new THREE.Color(), q = new THREE.Quaternion(), e = new THREE.Euler();
    var S = {};
    // Ab jetzt wird an dieser Stelle gebaut: x, z = Ort am Boden, dreh = wohin "vorn" (+z) zeigt
    S.ort = function (x, z, dreh) { basis.makeRotationY(dreh || 0); basis.setPosition(x, 0, z); return S; };
    // Eine Form dazunehmen. o = { rx, ry, rz (drehen), sx, sy, sz (strecken) }
    S.nimm = function (geo, farbe, x, y, z, o) {
      o = o || {};
      var g = geo.index ? geo.toNonIndexed() : geo;
      e.set(o.rx || 0, o.ry || 0, o.rz || 0); q.setFromEuler(e);
      m.compose(v.set(x, y, z), q, new THREE.Vector3(o.sx || 1, o.sy || 1, o.sz || 1)).premultiply(basis);
      nm.getNormalMatrix(m);
      var p = g.attributes.position, n = g.attributes.normal;
      c.set(farbe);
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c.r, c.g, c.b);
      }
      if (g !== geo) g.dispose();
      geo.dispose();
      return S;
    };
    S.K = function (b, h, t, farbe, x, y, z, o) { return S.nimm(new THREE.BoxGeometry(b, h, t), farbe, x, y, z, o); };                        // Kiste
    S.W = function (r1, r2, h, farbe, x, y, z, o, seg) { return S.nimm(new THREE.CylinderGeometry(r1, r2, h, seg || 10), farbe, x, y, z, o); };   // Walze
    S.Ku = function (r, farbe, x, y, z, o) { return S.nimm(new THREE.SphereGeometry(r, 8, 6), farbe, x, y, z, o); };                           // Kugel
    S.R = function (r, dick, farbe, x, y, z, o) { return S.nimm(new THREE.TorusGeometry(r, dick, 5, 12), farbe, x, y, z, o); };                // Ring
    // Alles Gesammelte als eine Form in die Szene stellen
    S.fertig = function (szene, material) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      var netz = new THREE.Mesh(geo, material);
      netz.castShadow = true; netz.receiveShadow = true;
      szene.add(netz);
      return netz;
    };
    return S;
  }

  // ---------- gemalte Bilder: Dielenboden, Teppich, Fenster ----------
  function bild(b, h, male) {
    var c = document.createElement('canvas'); c.width = b; c.height = h;
    male(c.getContext('2d'), b, h);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  function dielen(hell, dunkel) {
    var t = bild(256, 256, function (g, b, h) {
      g.fillStyle = hell; g.fillRect(0, 0, b, h);
      for (var i = 0; i < 8; i++) {
        g.fillStyle = 'rgba(60,35,10,' + (0.04 + ((i * 7) % 5) * 0.025) + ')'; g.fillRect(0, i * 32, b, 32);   // jede Diele etwas anders
        g.fillStyle = dunkel; g.fillRect(0, i * 32, b, 2);                                                     // Fuge zwischen den Dielen
        g.fillRect((i * 97) % 256, i * 32, 2, 32);                                                             // Stoß am Ende eines Bretts
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
    return t;
  }
  // Boden und Teppich liegen knapp über dem Stallboden. "polygonOffset" sagt der Grafikkarte, dass sie vorn liegen – dann flackert nichts.
  function boden(szene, x, z, b, t, textur) {
    var mat = new THREE.MeshStandardMaterial({ map: textur, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    var n = new THREE.Mesh(new THREE.PlaneGeometry(b, t), mat);
    n.rotation.x = -Math.PI / 2; n.position.set(x, 0.045, z); n.receiveShadow = true; szene.add(n);
  }
  function teppich(szene, x, z, r, farben) {
    var t = bild(256, 256, function (g) {
      for (var i = 0; i < farben.length; i++) { g.fillStyle = farben[i]; g.beginPath(); g.arc(128, 128, 128 * (1 - i / farben.length), 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.setLineDash([6, 8]);
      g.beginPath(); g.arc(128, 128, 116, 0, 7); g.stroke();                                                   // heller Zickzack-Rand
    });
    var mat = new THREE.MeshStandardMaterial({ map: t, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    var n = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat);
    n.rotation.x = -Math.PI / 2; n.position.set(x, 0.06, z); n.receiveShadow = true; szene.add(n);
  }
  var fensterBild = null;
  // Fenster mit Blick ins Grüne, Vorhängen und Blumentopf. Gebaut wird an der Stelle, die mit S.ort gewählt ist.
  function fenster(szene, S, wx, wy, wz, dreh, lx, stoff) {
    if (!fensterBild) fensterBild = bild(128, 96, function (g, b, h) {
      var himmel = g.createLinearGradient(0, 0, 0, h); himmel.addColorStop(0, '#8fc9f2'); himmel.addColorStop(1, '#dff1fb');
      g.fillStyle = himmel; g.fillRect(0, 0, b, h);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(30, 24, 10, 0, 7); g.arc(44, 22, 13, 0, 7); g.arc(58, 26, 9, 0, 7); g.fill();
      g.fillStyle = '#7cc35a'; g.beginPath(); g.arc(40, 130, 70, 0, 7); g.fill();
      g.fillStyle = '#5faa46'; g.beginPath(); g.arc(110, 135, 62, 0, 7); g.fill();
    });
    var n = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: fensterBild, roughness: 0.3, emissive: 0xffffff, emissiveMap: fensterBild, emissiveIntensity: 0.25 }));
    n.position.set(wx, wy, wz); n.rotation.y = dreh; szene.add(n);
    var y = wy;
    S.K(1.36, 0.08, 0.08, 0xffffff, lx, y + 0.49, 0.03).K(1.36, 0.08, 0.08, 0xffffff, lx, y - 0.49, 0.03);       // Rahmen oben und unten
    S.K(0.08, 1.0, 0.08, 0xffffff, lx - 0.64, y, 0.03).K(0.08, 1.0, 0.08, 0xffffff, lx + 0.64, y, 0.03);         // Rahmen links und rechts
    S.K(0.04, 0.9, 0.05, 0xffffff, lx, y, 0.03).K(1.2, 0.04, 0.05, 0xffffff, lx, y, 0.03);                       // Fensterkreuz
    S.K(1.6, 0.05, 0.22, HOLZ_H, lx, y - 0.55, 0.11);                                                            // Fensterbrett
    S.W(0.015, 0.015, 1.8, HOLZ_D, lx, y + 0.66, 0.1, { rz: Math.PI / 2 }, 6);                                   // Vorhangstange
    [-1, 1].forEach(function (v) {
      for (var i = 0; i < 3; i++) S.K(0.11, 1.2, 0.05, i % 2 ? 0xfffaf0 : stoff, lx + v * (0.62 + i * 0.1), y + 0.05, 0.09 + (i % 2) * 0.02);   // Vorhang in Falten
    });
    S.W(0.09, 0.07, 0.14, 0xc56a3a, lx - 0.5, y - 0.45, 0.11);                                                    // Blumentopf …
    S.Ku(0.1, 0x4f9a3f, lx - 0.5, y - 0.33, 0.11);
    S.Ku(0.045, 0xe84393, lx - 0.55, y - 0.25, 0.13).Ku(0.045, 0xf1c40f, lx - 0.45, y - 0.24, 0.09).Ku(0.045, 0xffffff, lx - 0.5, y - 0.22, 0.14);   // … mit Blumen
  }

  // ---------- Bausteine (alle stehen auf dem Boden, vorn ist +z) ----------
  // Lichterkette: hängt leicht durch, die Lämpchen leuchten
  function lichterkette(S, L, x0, x1, y, z, zahl, durch) {
    var alt = null;
    for (var i = 0; i < zahl; i++) {
      var t = i / (zahl - 1), p = [x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * durch];
      if (alt) S.K(Math.hypot(p[0] - alt[0], p[1] - alt[1]) + 0.01, 0.012, 0.012, 0x2e2a26, (p[0] + alt[0]) / 2, (p[1] + alt[1]) / 2 + 0.05, z, { rz: Math.atan2(p[1] - alt[1], p[0] - alt[0]) });
      L.Ku(0.045, WARM[i % WARM.length], p[0], p[1], z, { sy: 1.25 });
      alt = p;
    }
  }
  // Wimpelkette quer durch den Raum
  function wimpelkette(S, x0, x1, y, z, zahl, durch) {
    var alt = null;
    for (var i = 0; i < zahl; i++) {
      var t = i / (zahl - 1), p = [x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * durch];
      if (alt) S.K(Math.hypot(p[0] - alt[0], p[1] - alt[1]) + 0.01, 0.012, 0.012, 0xfffaf0, (p[0] + alt[0]) / 2, (p[1] + alt[1]) / 2, z, { rz: Math.atan2(p[1] - alt[1], p[0] - alt[0]) });
      if (i && i < zahl - 1) S.nimm(new THREE.ConeGeometry(0.12, 0.26, 3), BUNT[i % BUNT.length], p[0], p[1] - 0.13, z, { rx: Math.PI, sz: 0.15 });
      alt = p;
    }
  }
  // Laterne, die an einer Kette vom Balken hängt
  function haengeLaterne(S, L, x, yOben, z) {
    S.K(0.015, 0.5, 0.015, EISEN, x, yOben - 0.25, z);
    var y = yOben - 0.63;
    S.W(0.03, 0.12, 0.08, EISEN, x, y + 0.17, z, null, 6).K(0.2, 0.03, 0.2, EISEN, x, y - 0.13, z).K(0.2, 0.03, 0.2, EISEN, x, y + 0.12, z);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (e) { S.K(0.02, 0.24, 0.02, EISEN, x + e[0] * 0.09, y, z + e[1] * 0.09); });
    L.K(0.14, 0.2, 0.14, 0xffd27a, x, y, z);
  }
  function tonne(S, x, z, farbe) {
    S.W(0.3, 0.26, 0.8, farbe, x, 0.4, z, null, 12).W(0.32, 0.32, 0.05, HOLZ_D, x, 0.825, z, null, 12).W(0.05, 0.05, 0.06, HOLZ_D, x, 0.87, z, null, 6);
    S.W(0.31, 0.3, 0.04, EISEN, x, 0.6, z, null, 12).W(0.285, 0.275, 0.04, EISEN, x, 0.2, z, null, 12);
  }
  function eimer(S, x, y, z, farbe) {
    S.W(0.16, 0.12, 0.26, farbe, x, y + 0.13, z).R(0.15, 0.01, SILBER, x, y + 0.3, z, { sy: 0.8 });
  }
  function sack(S, x, z, kipp) {
    S.nimm(new THREE.CapsuleGeometry(0.24, 0.36, 3, 8), 0xd8c08a, x, 0.42, z, { rz: kipp, rx: -0.12 });
    S.W(0.07, 0.11, 0.1, 0xc9b078, x - kipp * 0.4, 0.86, z - 0.05, { rz: kipp }, 6).R(0.075, 0.012, 0xb5452e, x - kipp * 0.38, 0.82, z - 0.05, { rx: Math.PI / 2, rz: kipp });
  }
  // Holzkiste mit Obst oder Gemüse (Kugeln obenauf)
  function kiste(S, x, z, farben, y) {
    y = y || 0;
    S.K(0.72, 0.1, 0.5, HOLZ, x, y + 0.05, z);
    [-1, 1].forEach(function (v) {
      S.K(0.72, 0.1, 0.04, HOLZ_H, x, y + 0.17, z + v * 0.23).K(0.72, 0.1, 0.04, HOLZ_H, x, y + 0.31, z + v * 0.23);
      S.K(0.04, 0.3, 0.5, HOLZ_H, x + v * 0.34, y + 0.24, z);
    });
    for (var i = 0; i < 12; i++) S.Ku(0.085, farben[i % farben.length], x - 0.24 + (i % 4) * 0.16, y + 0.33 + ((i * 5) % 3) * 0.02, z - 0.14 + Math.floor(i / 4) * 0.14);
  }
  function hocker(S, x, z, farbe) {
    S.W(0.2, 0.2, 0.05, HOLZ_H, x, 0.46, z, null, 12).W(0.19, 0.19, 0.04, farbe, x, 0.5, z, null, 12);
    for (var i = 0; i < 3; i++) S.W(0.022, 0.022, 0.46, HOLZ_D, x + Math.sin(i * 2.1) * 0.13, 0.22, z + Math.cos(i * 2.1) * 0.13, null, 6);
  }
  function pflanze(S, x, z, gr) {
    S.W(0.2 * gr, 0.14 * gr, 0.34 * gr, 0xc56a3a, x, 0.17 * gr, z).W(0.22 * gr, 0.22 * gr, 0.05 * gr, 0xb55a2e, x, 0.34 * gr, z);
    [[0, 0.75, 0, 0.3], [-0.16, 0.6, 0.08, 0.22], [0.17, 0.62, -0.06, 0.22], [0.03, 0.98, 0.05, 0.2], [-0.05, 0.55, -0.16, 0.18]].forEach(function (b, i) {
      S.Ku(b[3] * gr, i % 2 ? 0x4f9a3f : 0x3f8a3a, x + b[0] * gr, b[1] * gr, z + b[2] * gr, { sy: 1.15 });
    });
  }
  // Sattel auf einem Halter an der Wand, darunter die bunte Schabracke (Satteldecke)
  function sattel(S, x, y, decke) {
    S.K(0.09, 0.09, 0.6, HOLZ_D, x, y, 0.3).K(0.3, 0.3, 0.04, HOLZ_D, x, y, 0.02);                                // Halter
    S.K(0.6, 0.04, 0.52, decke, x, y + 0.07, 0.32);
    [-1, 1].forEach(function (v) {
      S.K(0.04, 0.4, 0.5, decke, x + v * 0.31, y - 0.1, 0.32, { rz: v * 0.2 });                                    // Decke hängt links und rechts herunter
      S.K(0.05, 0.36, 0.34, LEDER, x + v * 0.3, y - 0.04, 0.33, { rz: v * 0.24 });                                 // Sattelblatt
      S.K(0.015, 0.32, 0.015, LEDER_D, x + v * 0.36, y - 0.3, 0.33).R(0.06, 0.012, SILBER, x + v * 0.36, y - 0.5, 0.33, { ry: Math.PI / 2 });   // Steigbügel
    });
    S.Ku(0.26, LEDER, x, y + 0.13, 0.32, { sx: 0.95, sy: 0.38 });                                                  // Sitz
    S.Ku(0.09, LEDER_D, x, y + 0.2, 0.11).Ku(0.14, LEDER_D, x, y + 0.2, 0.53, { sy: 0.75, sz: 0.5 });              // vorn und hinten hoch
  }
  // Trense (Zaumzeug) am Haken
  function trense(S, x, y, farbe) {
    S.K(0.04, 0.04, 0.1, EISEN, x, y + 0.24, 0.05);
    S.R(0.16, 0.014, farbe, x, y, 0.07, { sy: 1.45 }).R(0.11, 0.012, farbe, x, y - 0.06, 0.09, { sy: 1.2 });
    S.R(0.2, 0.01, LEDER_D, x + 0.03, y - 0.14, 0.11, { sy: 1.5, rz: 0.15 });                                      // Zügel
    S.W(0.012, 0.012, 0.2, SILBER, x, y - 0.24, 0.09, { rz: Math.PI / 2 }, 6);                                    // Gebiss
  }
  function schleife(S, x, y, farbe) {
    S.W(0.1, 0.1, 0.02, farbe, x, y, 0.05, { rx: Math.PI / 2 }, 12).W(0.055, 0.055, 0.03, 0xf2c230, x, y, 0.06, { rx: Math.PI / 2 }, 10);
    S.K(0.05, 0.22, 0.01, farbe, x - 0.045, y - 0.17, 0.05, { rz: -0.15 }).K(0.05, 0.22, 0.01, farbe, x + 0.045, y - 0.17, 0.05, { rz: 0.15 });
  }
  function stiefel(S, x, z, farbe) {
    [-0.09, 0.09].forEach(function (v) { S.W(0.065, 0.075, 0.42, farbe, x + v, 0.29, z, null, 8).K(0.12, 0.1, 0.24, farbe, x + v, 0.05, z + 0.05); });
  }
  function kappe(S, x, y, z, farbe) {
    S.Ku(0.14, farbe, x, y + 0.02, z, { sy: 0.8 }).K(0.2, 0.025, 0.12, 0x222222, x, y + 0.01, z + 0.14);
  }
  function tafel(szene, text, hoehe, x, y, z, dreh, opt) {
    var t = BAU.tafel(text, hoehe, opt); t.position.set(x, y, z); t.rotation.y = dreh; szene.add(t);
    return t.userData.breite;
  }

  // ---------- Vorratsraum (Futterraum): x 0…8, z −6,5…−1,5, hinten ist Norden ----------
  function vorratsraum(szene, S, L) {
    boden(szene, 4, -4, 7.82, 4.82, dielen('#b98d5c', 'rgba(70,40,15,0.55)'));
    teppich(szene, 4, -3.4, 1.15, ['#8a5a3a', '#d9b98a', '#a8623a', '#e8d2a8']);
    // Balken unter dem Dach: daran hängen Laterne, Kräuter und Möhren zum Trocknen
    S.ort(4, -3.6, 0).K(7.82, 0.16, 0.16, HOLZ_D, 0, 2.82, 0);
    haengeLaterne(S, L, 0, 2.74, 0);
    [-2.3, -1.9, -1.5].forEach(function (x, i) {                                                                    // Kräuterbündel
      S.K(0.012, 0.16, 0.012, 0xd8c08a, x, 2.66, 0).nimm(new THREE.ConeGeometry(0.11, 0.34, 6), i % 2 ? 0x7da04a : 0x5f8f3f, x, 2.42, 0, { rx: Math.PI });
    });
    [1.5, 1.72, 1.94, 2.16].forEach(function (x, i) {                                                               // Möhren mit Grün
      S.K(0.012, 0.12, 0.012, 0xd8c08a, x, 2.68, 0).Ku(0.05, 0x4f9a3f, x, 2.6, 0).nimm(new THREE.ConeGeometry(0.045, 0.3, 6), 0xf08a24, x, 2.42 - (i % 2) * 0.03, 0, { rx: Math.PI });
    });
    // Rückwand: langes Brett mit Gläsern, Eimer, Korb – darüber die Lichterkette
    S.ort(4, -6.41, 0).K(7.3, 0.05, 0.3, HOLZ, 0, 2.3, 0.15);
    [-3.3, -1.1, 1.1, 3.3].forEach(function (x) { S.K(0.05, 0.2, 0.26, HOLZ_D, x, 2.18, 0.13); });
    [[-3.2, 0xf2c879], [-2.92, 0xd96a4a], [-2.64, 0x9bc46a], [2.5, 0xe8b04a], [2.78, 0xb5d6e8], [3.06, 0xd96a8a]].forEach(function (g) {   // Gläser mit Leckerli
      S.W(0.09, 0.09, 0.22, g[1], g[0], 2.435, 0.15).W(0.095, 0.095, 0.04, 0xfffaf0, g[0], 2.565, 0.15);
    });
    eimer(S, -1.9, 2.325, 0.15, 0x4a90d9); eimer(S, 1.75, 2.325, 0.15, 0xd9534a);
    S.W(0.22, 0.16, 0.18, 0xc9a25e, -0.5, 2.415, 0.15).R(0.2, 0.015, 0xb08a4a, -0.5, 2.5, 0.15, { rx: Math.PI / 2 });                   // Korb …
    S.Ku(0.07, 0xd83a2e, -0.58, 2.52, 0.13).Ku(0.07, 0x8fbf3a, -0.44, 2.52, 0.19).Ku(0.07, 0xd83a2e, -0.5, 2.55, 0.1);                 // … mit Äpfeln
    S.K(0.3, 0.05, 0.22, 0xe84393, 0.6, 2.35, 0.15).K(0.3, 0.05, 0.22, 0x1f6fd0, 0.6, 2.4, 0.15).K(0.3, 0.05, 0.22, 0xf1c40f, 0.6, 2.45, 0.15);   // gefaltete Tücher
    lichterkette(S, L, -3.8, 3.8, 2.74, 0.07, 15, 0.1);
    S.K(0.7, 0.36, 0.5, HOLZ, -1.45, 0.18, 0.5);                                                                    // Kiste mit Salzleckstein
    S.K(0.26, 0.2, 0.2, 0xf3eee4, -1.45, 0.46, 0.5).K(0.02, 0.5, 0.02, EISEN, -0.9, 0.25, 0.6);
    sack(S, 1.35, 0.5, 0.1); sack(S, 1.8, 0.52, -0.14);                                                             // noch zwei Hafersäcke
    // Westwand: Futtertonnen, Eimer, Besen und Heugabel, darüber der Futterplan
    S.ort(0.09, -3.9, Math.PI / 2);
    tonne(S, 1.0, 0.42, 0x4f7fb8); tonne(S, 0.25, 0.42, 0x5b9a5b);
    S.W(0.09, 0.06, 0.12, SILBER, 0.25, 0.94, 0.4).K(0.04, 0.03, 0.24, HOLZ_D, 0.25, 0.97, 0.56);                   // Futterschaufel auf der Tonne
    eimer(S, -0.55, 0, 0.36, 0xd9534a); eimer(S, -0.55, 0.09, 0.36, 0xf1c40f); eimer(S, -0.55, 0.18, 0.36, 0x4a90d9);
    eimer(S, -1.0, 0, 0.42, 0x27ae60);
    S.W(0.02, 0.02, 1.7, HOLZ_H, -1.75, 0.86, 0.2, { rx: -0.14 }, 6).K(0.36, 0.14, 0.09, 0xd9b45a, -1.75, 0.07, 0.33);                 // Besen
    S.W(0.02, 0.02, 1.6, HOLZ_H, -2.05, 0.8, 0.2, { rx: -0.14 }, 6).K(0.26, 0.03, 0.03, EISEN, -2.05, 1.58, 0.09);                     // Heugabel
    [-0.11, 0, 0.11].forEach(function (v) { S.K(0.02, 0.3, 0.02, EISEN, -2.05 + v, 1.74, 0.07, { rx: -0.14 }); });
    var br = tafel(szene, 'Futterplan\n🌾 Hafer: morgens und abends\n🌿 Heu: so viel sie mögen\n🥕 Möhren: zur Belohnung', 0.85, 0.15, 1.8, -3.5, Math.PI / 2, { grund: '#2f4a3a', farbe: '#ffffff', schrift: 34, rund: 4 });
    S.K(br + 0.14, 0.99, 0.04, HOLZ_H, -0.4, 1.8, 0.02);                                                            // Holzrahmen um die Tafel
    // Ostwand: Fenster, darunter die Werkbank mit Waage, daneben Kisten mit Äpfeln und Rüben
    S.ort(7.91, -3.6, -Math.PI / 2);
    fenster(szene, S, 7.9, 1.8, -4.0, -Math.PI / 2, -0.4, 0xd96a4a);
    S.K(1.8, 0.06, 0.7, HOLZ, -0.4, 0.8, 0.4);
    [[-1.2, 0.1], [0.4, 0.1], [-1.2, 0.66], [0.4, 0.66]].forEach(function (b) { S.K(0.07, 0.78, 0.07, HOLZ_D, b[0], 0.39, b[1]); });
    S.K(1.6, 0.04, 0.5, HOLZ_D, -0.4, 0.25, 0.4);                                                                   // Ablage unten …
    S.K(0.4, 0.26, 0.34, 0x8fb7d9, -0.9, 0.4, 0.4).K(0.4, 0.26, 0.34, 0xe8b04a, -0.2, 0.4, 0.4);                    // … mit zwei Futterkisten
    S.K(0.36, 0.1, 0.26, 0xb5452e, -1.0, 0.88, 0.4).W(0.02, 0.02, 0.12, EISEN, -1.0, 0.99, 0.4, null, 6).W(0.17, 0.12, 0.06, SILBER, -1.0, 1.07, 0.4);   // Waage
    S.Ku(0.06, 0xd9b96a, -1.0, 1.1, 0.4, { sy: 0.6 });
    S.W(0.16, 0.1, 0.1, 0x6fa8dc, -0.2, 0.88, 0.42).Ku(0.065, 0xd83a2e, -0.25, 0.95, 0.4).Ku(0.065, 0x8fbf3a, -0.14, 0.95, 0.45).Ku(0.065, 0xd83a2e, -0.2, 0.98, 0.36);   // Schale mit Äpfeln
    S.W(0.07, 0.07, 0.16, 0xf2c879, 0.25, 0.91, 0.3).W(0.075, 0.075, 0.03, 0xfffaf0, 0.25, 1.0, 0.3);
    hocker(S, -0.4, 0.98, 0xd96a4a);
    kiste(S, 1.25, 0.4, [0xd83a2e, 0xd83a2e, 0x8fbf3a]); kiste(S, 1.3, 0.42, [0x8a3a6a, 0xa8507a], 0.42);
    S.W(0.18, 0.2, 0.5, SILBER, -1.45, 0.25, 0.3, null, 12).W(0.1, 0.18, 0.14, SILBER, -1.45, 0.57, 0.3, null, 12).W(0.11, 0.11, 0.03, 0x9aa0a8, -1.45, 0.65, 0.3, null, 12);   // Milchkanne
    // Fußmatte an der Tür
    S.ort(4, -2.0, 0).K(1.2, 0.025, 0.6, 0x7a5a3a, 0, 0.058, 0).K(1.0, 0.027, 0.42, 0xa8804a, 0, 0.058, 0);
  }

  // ---------- Reitladen: x 0…8, z 1,5…6,5, die Theke steht hinten im Süden ----------
  function reitladen(szene, S, L) {
    boden(szene, 4, 4, 7.82, 4.82, dielen('#c99a64', 'rgba(80,45,15,0.5)'));
    teppich(szene, 4, 3.6, 1.5, ['#b5452e', '#f3dfc0', '#d98aa0', '#f3dfc0', '#7a9ac9']);
    // Balken mit Laterne, davor die Wimpelkette
    S.ort(4, 3.7, 0).K(7.82, 0.16, 0.16, HOLZ_D, 0, 2.82, 0);
    haengeLaterne(S, L, -1.6, 2.74, 0); haengeLaterne(S, L, 1.6, 2.74, 0);
    wimpelkette(S, -3.9, 3.9, 2.7, -0.75, 19, 0.22);
    // Wand zur Stallgasse, links von der Tür: Sessel mit Decke, Tischchen, darüber die Turnierschleifen
    S.ort(1.6, 1.59, 0);
    S.K(1.9, 1.0, 0.04, HOLZ_H, 0, 1.95, 0.02).K(2.0, 0.06, 0.06, HOLZ_D, 0, 2.47, 0.03).K(2.0, 0.06, 0.06, HOLZ_D, 0, 1.43, 0.03);
    [0xe84393, 0x1f6fd0, 0xf1c40f, 0x27ae60, 0xd9534a].forEach(function (f, i) { schleife(S, -0.72 + i * 0.36, 2.2 - (i % 2) * 0.12, f); });
    tafel(szene, '🐴', 0.34, 1.02, 1.72, 1.64, 0, { grund: '#fdf3d8', schrift: 80, rund: 4 }); tafel(szene, '🏆', 0.34, 2.18, 1.72, 1.64, 0, { grund: '#fdf3d8', schrift: 80, rund: 4 });
    lichterkette(S, L, -1.45, 1.4, 2.72, 0.07, 8, 0.08);
    S.W(0.26, 0.26, 0.04, HOLZ_H, 1.0, 0.52, 0.45, null, 12).W(0.04, 0.04, 0.5, HOLZ_D, 1.0, 0.26, 0.45, null, 6).W(0.16, 0.16, 0.03, HOLZ_D, 1.0, 0.015, 0.45, null, 10);   // Tischchen
    S.W(0.05, 0.04, 0.08, 0xfffaf0, 0.92, 0.58, 0.5).W(0.07, 0.07, 0.01, 0xe84393, 0.92, 0.545, 0.5);                // Tasse Kakao
    S.K(0.2, 0.03, 0.15, 0x1f6fd0, 1.1, 0.555, 0.4, { ry: 0.3 }).K(0.19, 0.03, 0.14, 0xd9534a, 1.1, 0.585, 0.4, { ry: -0.2 });   // Pferdebücher
    S.ort(0.95, 2.4, Math.PI / 4);                                                                                  // Sessel schräg in der Ecke
    S.K(0.86, 0.3, 0.8, 0xc9566a, 0, 0.27, 0).K(0.86, 0.62, 0.2, 0xc9566a, 0, 0.72, -0.32, { rx: -0.12 });
    S.K(0.16, 0.3, 0.8, 0xb5455a, -0.44, 0.52, 0).K(0.16, 0.3, 0.8, 0xb5455a, 0.44, 0.52, 0);
    S.K(0.56, 0.12, 0.56, 0xf3dfc0, 0, 0.47, 0.06).K(0.36, 0.34, 0.12, 0xf1c40f, 0.02, 0.7, -0.18, { rx: -0.25, rz: 0.2 });   // Sitzkissen und Kuschelkissen
    S.K(0.2, 0.34, 0.6, 0x7a9ac9, 0.44, 0.56, 0.05).K(0.2, 0.02, 0.6, 0xfffaf0, 0.44, 0.62, 0.05);                  // Decke über der Lehne
    [[-0.36, -0.32], [0.36, -0.32], [-0.36, 0.32], [0.36, 0.32]].forEach(function (b) { S.W(0.035, 0.03, 0.12, HOLZ_D, b[0], 0.06, b[1], null, 6); });
    // Rechts von der Tür: Regal mit Decken, Kappen, Stiefeln und Pokalen
    S.ort(6.45, 1.59, 0);
    S.K(2.1, 2.2, 0.04, HOLZ_D, 0, 1.1, 0.02).K(0.06, 2.2, 0.42, HOLZ, -1.05, 1.1, 0.21).K(0.06, 2.2, 0.42, HOLZ, 1.05, 1.1, 0.21);
    [0.12, 0.62, 1.12, 1.62, 2.17].forEach(function (y) { S.K(2.1, 0.05, 0.42, HOLZ, 0, y, 0.21); });
    stiefel(S, -0.7, 0.2, 0x222222); stiefel(S, -0.2, 0.2, 0x5a3a22); stiefel(S, 0.3, 0.2, 0x222222);
    S.K(0.4, 0.3, 0.3, 0x8fb7d9, 0.76, 0.3, 0.22);
    BUNT.forEach(function (f, i) { S.K(0.42, 0.07, 0.32, f, -0.72 + (i % 3) * 0.5, 0.68 + Math.floor(i / 3) * 0.075, 0.22); });   // Schabracken, ordentlich gefaltet
    S.K(0.42, 0.07, 0.32, 0xfffaf0, -0.22, 0.83, 0.22).K(0.3, 0.2, 0.26, 0xd9534a, 0.82, 0.75, 0.22);
    kappe(S, -0.7, 1.26, 0.2, 0x222222); kappe(S, -0.25, 1.26, 0.2, 0x1f6fd0); kappe(S, 0.2, 1.26, 0.2, 0xe84393); kappe(S, 0.65, 1.26, 0.2, 0x6b3d1e);
    [-0.6, 0, 0.6].forEach(function (x, i) {                                                                        // Pokale
      var f = [0xf2c230, SILBER, 0xc98a4a][i];
      S.K(0.14, 0.05, 0.14, EISEN, x, 1.67, 0.22).W(0.02, 0.03, 0.1, f, x, 1.74, 0.22, null, 6).W(0.09, 0.04, 0.16, f, x, 1.87, 0.22);
    });
    S.K(0.26, 0.2, 0.03, 0xfdf3d8, -0.3, 1.77, 0.08).K(0.26, 0.2, 0.03, 0xfdf3d8, 0.3, 1.77, 0.08);
    lichterkette(S, L, -1.3, 1.3, 2.4, 0.3, 8, 0.07);
    // Westwand: drei Sättel auf Haltern, darüber die Trensen
    S.ort(0.09, 4.3, Math.PI / 2);
    S.K(3.0, 0.14, 0.04, HOLZ_D, 0, 2.3, 0.02);
    [[-1.0, 0xe84393], [0, 0x1f6fd0], [1.0, 0x27ae60]].forEach(function (s, i) { sattel(S, s[0], 1.15, s[1]); trense(S, s[0], 2.02, i === 1 ? LEDER_D : LEDER); });
    // Ostwand: Kleiderstange mit Jacken, Fenster, darunter die Sitzbank mit Kissen
    S.ort(7.91, 4.0, -Math.PI / 2);
    S.W(0.02, 0.02, 1.7, SILBER, -0.9, 1.72, 0.32, { rz: Math.PI / 2 }, 6).K(0.04, 0.04, 0.34, EISEN, -1.72, 1.72, 0.17).K(0.04, 0.04, 0.34, EISEN, -0.08, 1.72, 0.17);
    [0xe84393, 0x1f3a6a, 0x27ae60, 0xf5f5f5, 0x8e44ad, 0xd9534a, 0x1f6fd0].forEach(function (f, i) {                // Jacken auf Bügeln
      var x = -1.56 + i * 0.22;
      S.K(0.07, 0.62, 0.44, f, x, 1.34, 0.32).K(0.08, 0.12, 0.56, f, x, 1.6, 0.32).K(0.015, 0.08, 0.015, SILBER, x, 1.69, 0.32);
    });
    S.K(1.7, 0.04, 0.3, HOLZ, -0.9, 2.1, 0.15);
    kappe(S, -1.4, 2.24, 0.16, 0x222222); kappe(S, -0.9, 2.24, 0.16, 0x8e44ad); kappe(S, -0.4, 2.24, 0.16, 0x27ae60);
    stiefel(S, -1.4, 0.24, 0x222222); stiefel(S, -0.95, 0.24, 0x5a3a22); stiefel(S, -0.5, 0.24, 0xe84393);
    fenster(szene, S, 7.9, 1.85, 5.4, -Math.PI / 2, 1.4, 0xe8a0b4);
    S.K(1.7, 0.1, 0.55, HOLZ, 1.4, 0.42, 0.3).K(0.1, 0.4, 0.5, HOLZ_D, 0.65, 0.2, 0.3).K(0.1, 0.4, 0.5, HOLZ_D, 2.15, 0.2, 0.3);   // Bank
    S.K(0.5, 0.1, 0.46, 0xe84393, 0.85, 0.52, 0.3).K(0.5, 0.1, 0.46, 0xf3dfc0, 1.4, 0.52, 0.3).K(0.5, 0.1, 0.46, 0x7a9ac9, 1.95, 0.52, 0.3);
    S.K(0.34, 0.34, 0.12, 0xf1c40f, 1.95, 0.72, 0.14, { rx: -0.3 });
    lichterkette(S, L, 0.5, 2.3, 2.62, 0.07, 6, 0.07);
    // Ecke links neben der Theke: große Pflanze und ein Fass mit Gerten
    S.ort(0, 0, 0);
    pflanze(S, 0.6, 5.95, 1.25);
    S.W(0.2, 0.17, 0.5, HOLZ, 1.3, 0.25, 5.9, null, 10).W(0.205, 0.205, 0.04, EISEN, 1.3, 0.4, 5.9, null, 10);
    [0xe84393, 0x222222, 0x1f6fd0, 0x5a3a22].forEach(function (f, i) { S.W(0.012, 0.012, 1.0, f, 1.24 + (i % 2) * 0.12, 0.85, 5.84 + Math.floor(i / 2) * 0.12, { rz: (i - 1.5) * 0.06 }, 5); });
    pflanze(S, 7.45, 2.35, 0.8);
    // Fußmatte an der Tür
    S.ort(4, 2.0, 0).K(1.2, 0.025, 0.6, 0x7a3b4a, 0, 0.058, 0).K(1.0, 0.027, 0.42, 0xd98aa0, 0, 0.058, 0);
    tafel(szene, 'Schön, dass du da bist! 💕', 0.26, 4, 2.62, 1.62, 0, { grund: '#fdf3d8', farbe: '#7a3b12', schrift: 44 });
  }

  // szene = die Hof-Szene, waende und kreise = Listen der Hindernisse (damit man nicht durch die Möbel läuft)
  function baue(szene, waende, kreise) {
    var S = new Sammler(), L = new Sammler();
    vorratsraum(szene, S, L);
    reitladen(szene, S, L);
    S.fertig(szene, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    var licht = L.fertig(szene, new THREE.MeshBasicMaterial({ vertexColors: true }));       // Lämpchen leuchten von selbst
    licht.castShadow = false; licht.receiveShadow = false;
    waende.push([0.09, -5.3, 1.0, -1.6], [6.75, -5.3, 7.91, -1.9]);                         // Vorratsraum: Westwand, Ostwand
    waende.push([0.09, 2.9, 0.85, 5.3], [0.09, 5.2, 1.7, 6.5], [7.25, 1.6, 7.91, 6.5], [5.3, 1.59, 7.91, 2.08]);   // Reitladen
    kreise.push([0.95, 2.4, 0.62, 0, 0], [2.6, 2.04, 0.3, 0, 0]);                           // Sessel und Tischchen
  }
  return { baue: baue };
})();
