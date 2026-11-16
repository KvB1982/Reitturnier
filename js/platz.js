// ============================================================
//  REITPLATZ UND HINDERNISSE
// ============================================================

function baueReitplatz(szene) {
  var B = PLATZ.breite, T = PLATZ.tiefe;

  // Wiese
  var wiese = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ color: 0x6fb04a }));
  wiese.rotation.x = -Math.PI / 2;
  wiese.position.y = -0.02;
  wiese.receiveShadow = true;
  szene.add(wiese);

  // Sandplatz
  var sand = new THREE.Mesh(new THREE.PlaneGeometry(B, T), new THREE.MeshLambertMaterial({ color: 0xe3cf9f }));
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  szene.add(sand);

  // Zaun
  var weiss = new THREE.MeshLambertMaterial({ color: 0xffffff });
  var pfostenGeo = new THREE.BoxGeometry(0.16, 1.3, 0.16);
  function pfosten(x, z) {
    var p = new THREE.Mesh(pfostenGeo, weiss);
    p.position.set(x, 0.65, z);
    p.castShadow = true;
    szene.add(p);
  }
  function latte(x, z, laenge, quer) {
    for (var h = 0.55; h < 1.3; h += 0.5) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(quer ? 0.08 : laenge, 0.12, quer ? laenge : 0.08), weiss);
      l.position.set(x, h, z);
      l.castShadow = true;
      szene.add(l);
    }
  }
  var x, z;
  for (x = -B / 2; x <= B / 2 + 0.01; x += 4) { pfosten(x, -T / 2); pfosten(x, T / 2); }
  for (z = -T / 2 + 4; z < T / 2 - 0.01; z += 4) { pfosten(-B / 2, z); pfosten(B / 2, z); }
  latte(0, -T / 2, B, false); latte(0, T / 2, B, false);
  latte(-B / 2, 0, T, true); latte(B / 2, 0, T, true);

  // Baeume rundherum (immer gleich verteilt)
  var saat = 7;
  function zufall() { saat = (saat * 16807) % 2147483647; return saat / 2147483647; }
  var stammMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
  var laubMat = [0x2f7d32, 0x3f9142, 0x4c9a3a].map(function (c) { return new THREE.MeshLambertMaterial({ color: c }); });
  for (var i = 0; i < 90; i++) {
    var w = zufall() * Math.PI * 2;
    var r = 0.75 + zufall() * 0.9;
    var bx = Math.cos(w) * B * r, bz = Math.sin(w) * T * (r + 0.25);
    if (Math.abs(bx) < B / 2 + 17 && Math.abs(bz) < T / 2 + 17) continue;
    var g = 1 + zufall() * 1.2;
    var stamm = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * g, 0.35 * g, 2.2 * g, 7), stammMat);
    stamm.position.set(bx, 1.1 * g, bz);
    stamm.castShadow = true;
    szene.add(stamm);
    var laub;
    if (zufall() > 0.5) {
      laub = new THREE.Mesh(new THREE.ConeGeometry(1.7 * g, 4.6 * g, 8), laubMat[i % 3]);
      laub.position.set(bx, 4.1 * g, bz);
    } else {
      laub = new THREE.Mesh(new THREE.SphereGeometry(2.0 * g, 9, 7), laubMat[i % 3]);
      laub.position.set(bx, 3.6 * g, bz);
    }
    laub.castShadow = true;
    szene.add(laub);
  }

  // Wolken
  var wolkeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  for (i = 0; i < 9; i++) {
    var wolke = new THREE.Group();
    for (var k = 0; k < 4; k++) {
      var ball = new THREE.Mesh(new THREE.SphereGeometry(5 + zufall() * 4, 8, 6), wolkeMat);
      ball.position.set(k * 6 - 9, zufall() * 2, zufall() * 4);
      ball.scale.y = 0.55;
      wolke.add(ball);
    }
    wolke.position.set((zufall() - 0.5) * 420, 55 + zufall() * 25, (zufall() - 0.5) * 420);
    szene.add(wolke);
  }

  // kleines Richterhaeuschen
  var haus = new THREE.Group();
  var wand = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), new THREE.MeshLambertMaterial({ color: 0xf4e9d4 }));
  wand.position.y = 1.5; wand.castShadow = true; haus.add(wand);
  var dach = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2, 4), new THREE.MeshLambertMaterial({ color: 0xb5432e }));
  dach.position.y = 4; dach.rotation.y = Math.PI / 4; dach.castShadow = true; haus.add(dach);
  var fenster = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x4a6a8a }));
  fenster.position.set(0, 1.9, 2.01); haus.add(fenster);
  haus.position.set(0, 0, -T / 2 - 5);
  szene.add(haus);

  var stadion = baueStadion();
  szene.add(stadion.gruppe);
  return { stadion: stadion, haus: haus };
}

// ============================================================
//  STADION: vier Tribuenen mit Zuschauern rund um den Platz
// ============================================================
function baueStadion() {
  var B = PLATZ.breite, T = PLATZ.tiefe;
  var gruppe = new THREE.Group();
  var REIHEN = 6, STUFE = 0.55, TIEFE = 1.0;
  var beton = [new THREE.MeshLambertMaterial({ color: 0xb9b4aa }), new THREE.MeshLambertMaterial({ color: 0xa9a49a })];
  var dachMat = new THREE.MeshLambertMaterial({ color: 0xb5432e, side: THREE.DoubleSide });
  var pfostenMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });

  // Werbebande
  var c = document.createElement('canvas');
  c.width = 1024; c.height = 64;
  var g = c.getContext('2d');
  var felder = [['#1f3a93', 'REITTURNIER'], ['#ffffff', 'PONYHOF SONNENTAL'], ['#27ae60', 'HAFER & HEU'], ['#f1c40f', 'SATTLEREI STERN']];
  felder.forEach(function (f, i) {
    g.fillStyle = f[0]; g.fillRect(i * 256, 0, 256, 64);
    g.fillStyle = (f[0] === '#ffffff' || f[0] === '#f1c40f') ? '#222222' : '#ffffff';
    g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(f[1], i * 256 + 128, 34);
  });
  var bandeTex = new THREE.CanvasTexture(c);
  bandeTex.colorSpace = THREE.SRGBColorSpace;
  bandeTex.wrapS = THREE.RepeatWrapping;

  var koerperGeo = new THREE.CapsuleGeometry(0.2, 0.42, 3, 8);
  var kopfGeo = new THREE.SphereGeometry(0.15, 8, 6);
  var kleider = [0xe74c3c, 0x2980b9, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xe84393, 0xffffff, 0x34495e, 0xe67e22, 0x16a085];
  var hautToene = [0xf2c6a0, 0xe0ac86, 0xc68c5e, 0x8d5a3a, 0xf7d7bd];
  var saat = 99;
  function zufall() { saat = (saat * 16807) % 2147483647; return saat / 2147483647; }
  var bloecke = [];     // fuer das Jubeln

  function tribuene(laenge, x, z, drehung) {
    var t = new THREE.Group();
    t.position.set(x, 0, z);
    t.rotation.y = drehung;
    gruppe.add(t);
    var r, i;
    for (r = 0; r < REIHEN; r++) {
      var h = 0.9 + r * STUFE;
      var stufe = new THREE.Mesh(new THREE.BoxGeometry(laenge, h, TIEFE), beton[r % 2]);
      stufe.position.set(0, h / 2, r * TIEFE + TIEFE / 2);
      stufe.receiveShadow = true;
      t.add(stufe);
    }
    // Rueckwand, Dach und Stuetzen
    var hoch = 0.9 + REIHEN * STUFE + 2.6;
    var wand = new THREE.Mesh(new THREE.BoxGeometry(laenge, hoch, 0.25), beton[1]);
    wand.position.set(0, hoch / 2, REIHEN * TIEFE + 0.12);
    wand.castShadow = true;
    t.add(wand);
    var dach = new THREE.Mesh(new THREE.BoxGeometry(laenge + 1, 0.15, REIHEN * TIEFE * 0.8), dachMat);
    dach.position.set(0, hoch + 0.25, REIHEN * TIEFE * 0.62);
    dach.rotation.x = -0.1;
    dach.castShadow = true;
    t.add(dach);
    for (i = -1; i <= 1; i++) {
      var stuetze = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, hoch + 0.5, 6), pfostenMat);
      stuetze.position.set(i * (laenge / 2 - 0.5), (hoch + 0.5) / 2, REIHEN * TIEFE - 0.3);
      t.add(stuetze);
      // Fahne
      var fahne = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshLambertMaterial({ color: kleider[(i + 4) % kleider.length], side: THREE.DoubleSide }));
      fahne.position.set(i * (laenge / 2 - 0.5) + 0.65, hoch + 1.6, REIHEN * TIEFE + 0.1);
      t.add(fahne);
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5), pfostenMat);
      mast.position.set(i * (laenge / 2 - 0.5), hoch + 1.1, REIHEN * TIEFE + 0.1);
      t.add(mast);
    }
    // Werbebande vorne
    var tex = bandeTex.clone();
    tex.needsUpdate = true;
    tex.repeat.x = Math.max(1, Math.round(laenge / 24));
    var bande = new THREE.Mesh(new THREE.PlaneGeometry(laenge, 0.9), new THREE.MeshLambertMaterial({ map: tex }));
    bande.position.set(0, 0.45, -0.01);
    bande.rotation.y = Math.PI;
    t.add(bande);

    // Zuschauer
    var plaetze = [];
    for (r = 0; r < REIHEN; r++) {
      for (var sx = -laenge / 2 + 0.5; sx < laenge / 2 - 0.4; sx += 0.62) {
        if (zufall() < 0.12) continue;      // ein paar Plaetze bleiben leer
        plaetze.push({ x: sx + (zufall() - 0.5) * 0.12, y: 0.9 + r * STUFE, z: r * TIEFE + 0.55, ph: zufall() * 6.28, g: 0.85 + zufall() * 0.3 });
      }
    }
    var koerper = new THREE.InstancedMesh(koerperGeo, new THREE.MeshLambertMaterial(), plaetze.length);
    var koepfe = new THREE.InstancedMesh(kopfGeo, new THREE.MeshLambertMaterial(), plaetze.length);
    var farbe = new THREE.Color();
    for (i = 0; i < plaetze.length; i++) {
      koerper.setColorAt(i, farbe.setHex(kleider[Math.floor(zufall() * kleider.length)]));
      koepfe.setColorAt(i, farbe.setHex(hautToene[Math.floor(zufall() * hautToene.length)]));
    }
    koerper.frustumCulled = false; koepfe.frustumCulled = false;
    t.add(koerper); t.add(koepfe);
    var block = { plaetze: plaetze, koerper: koerper, koepfe: koepfe };
    bloecke.push(block);
    setzeZuschauer(block, 0, 0);
  }

  var m = new THREE.Matrix4();
  function setzeZuschauer(block, staerke, zeit) {
    for (var i = 0; i < block.plaetze.length; i++) {
      var p = block.plaetze[i];
      var huepf = staerke > 0 ? Math.abs(Math.sin(zeit * 9 + p.ph)) * 0.28 * staerke : 0;
      m.makeScale(p.g, p.g, p.g);
      m.setPosition(p.x, p.y + 0.38 * p.g + huepf, p.z);
      block.koerper.setMatrixAt(i, m);
      m.setPosition(p.x, p.y + 0.86 * p.g + huepf, p.z);
      block.koepfe.setMatrixAt(i, m);
    }
    block.koerper.instanceMatrix.needsUpdate = true;
    block.koepfe.instanceMatrix.needsUpdate = true;
  }

  var ab = 3.2;   // Abstand der Tribuene vom Zaun
  tribuene(B - 2, 0, T / 2 + ab, 0);
  tribuene(B - 2, 0, -T / 2 - ab, Math.PI);
  tribuene(T - 4, B / 2 + ab, 0, Math.PI / 2);
  tribuene(T - 4, -B / 2 - ab, 0, -Math.PI / 2);

  var jubelZeit = 0, jubelStaerke = 0, ruhig = true;
  return {
    gruppe: gruppe,
    jubel: function (staerke, dauer) { jubelStaerke = staerke; jubelZeit = dauer || 1.6; },
    bewege: function (dt, zeit) {
      if (!gruppe.visible) return;
      if (jubelZeit > 0) {
        jubelZeit -= dt;
        var s = jubelStaerke * Math.min(1, jubelZeit * 2);
        for (var i = 0; i < bloecke.length; i++) setzeZuschauer(bloecke[i], Math.max(0, s), zeit);
        ruhig = false;
      } else if (!ruhig) {
        for (var k = 0; k < bloecke.length; k++) setzeZuschauer(bloecke[k], 0, zeit);
        ruhig = true;
      }
    }
  };
}

// ---------- Streifen-Textur fuer Stangen ----------
var _stangenTexturen = {};
function stangenMaterial(farbe) {
  if (!_stangenTexturen[farbe]) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 8;
    var g = c.getContext('2d');
    for (var i = 0; i < 8; i++) {
      g.fillStyle = i % 2 === 0 ? farbe : '#ffffff';
      g.fillRect(i * 32, 0, 32, 8);
    }
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    _stangenTexturen[farbe] = t;
  }
  return new THREE.MeshLambertMaterial({ map: _stangenTexturen[farbe], transparent: true });
}

function nummernSchild(nr) {
  var c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  var g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
  g.lineWidth = 8; g.strokeStyle = '#c0392b'; g.stroke();
  g.fillStyle = '#222'; g.font = 'bold 76px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(nr), 64, 70);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(0.9, 0.9, 1);
  return s;
}

var STANGEN_FARBEN = ['#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e84393', '#16a085'];

// ============================================================
//  HINDERNISSE AUS DEM 3D-MODELL (Staender, Stangen, Flaggen)
// ============================================================
var HINDERNIS_TEILE = null;
var STANGEN_LAENGE = 3.0;      // die Stangen des Modells sind 3 Meter lang

// Zerlegt das geladene Modell in einzelne Bauteile, die man frei aufstellen kann.
function bereiteHindernisTeile(gltf) {
  var teile = {};
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(function (o) {
    if (!o.isMesh || !o.parent) return;
    var geo = o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);          // in Meter, Y nach oben
    geo.computeBoundingBox();
    var b = geo.boundingBox, lang = b.max.x - b.min.x;
    var name = o.parent.name;
    // Mitte auf 0 schieben; Staender stehen mit der Unterkante auf dem Boden
    var istStange = name === 'Pole';
    geo.translate(-(b.min.x + b.max.x) / 2, istStange ? -(b.min.y + b.max.y) / 2 : -b.min.y, -(b.min.z + b.max.z) / 2);
    geo.computeBoundingBox();
    teile[name] = { geo: geo, mat: o.material, breite: lang, hoehe: geo.boundingBox.max.y };
  });
  if (teile.Pole && teile.HalfBarrier1Every3D && teile.HalfBarrier2Every3D && teile.HalfBarrier1 && teile.HalfBarrier2) HINDERNIS_TEILE = teile;
  return !!HINDERNIS_TEILE;
}

function baueModellHindernis(art, hoehe, nr) {
  var T = HINDERNIS_TEILE;
  var gruppe = new THREE.Group();
  var fallTeile = [], mats = [];
  var farbe = STANGEN_FARBEN[(nr - 1) % STANGEN_FARBEN.length];
  var halb = STANGEN_LAENGE / 2;

  function material(vorlage, toenung) {
    var m = vorlage.clone();
    m.transparent = true;
    m.metalness = 0; m.metalnessMap = null; m.roughness = 0.85; m.roughnessMap = null;   // sonst wirken die Teile ohne Spiegelung dunkel
    if (toenung) m.color.set(toenung);
    mats.push(m);
    return m;
  }
  var matWeiss = material(T.HalfBarrier1Every3D.mat), matBlau = material(T.HalfBarrier1.mat);
  var matStange = material(T.Pole.mat, farbe), matStangeHell = material(T.Pole.mat);

  function teil(name, mat, x, y, z) {
    var m = new THREE.Mesh(T[name].geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    gruppe.add(m);
    return m;
  }
  // Seitenteile: 'fluegel' = breite weisse Fluegel, 'pfosten' = schmale blaue Staender
  function staender(artStaender, z) {
    if (artStaender === 'fluegel') {
      teil('HalfBarrier1Every3D', matWeiss, -halb - T.HalfBarrier1Every3D.breite / 2 + 0.03, 0, z);
      teil('HalfBarrier2Every3D', matWeiss, halb + T.HalfBarrier2Every3D.breite / 2 - 0.03, 0, z);
    } else {
      teil('HalfBarrier2', matBlau, -halb - T.HalfBarrier2.breite / 2 + 0.2, 0, z);
      teil('HalfBarrier1', matBlau, halb + T.HalfBarrier1.breite / 2 - 0.2, 0, z);
    }
  }
  function stange(y, z, faellt, neigung, hell) {
    var st = teil('Pole', hell ? matStangeHell : matStange, 0, y, z);
    st.rotation.z = neigung || 0;
    st.userData.ruheZ = 0;
    if (faellt) fallTeile.push(st);
    return st;
  }
  function flaggen(z, y) {
    if (!T.FlagRed || !T.FlagWhite) return;
    teil('FlagWhite', matBlau, -halb - 0.08, y, z);
    teil('FlagRed', matBlau, halb + 0.08, y, z);
  }
  function steilsprung(z, h, artStaender) {
    staender(artStaender, z);
    stange(h, z, true);
    var k = 0;
    for (var y = h - 0.3; y > 0.25; y -= 0.3) stange(y, z, false, 0, (k++) % 2 === 0);
  }

  var tiefe = 0.2;
  if (art === 'kreuz') {
    staender('fluegel', 0);
    var n = Math.atan2(hoehe + 0.25 - 0.15, STANGEN_LAENGE);
    stange((hoehe + 0.4) / 2, -0.07, true, n);
    stange((hoehe + 0.4) / 2, 0.07, true, -n, true);
    flaggen(0, hoehe + 0.75);
  } else if (art === 'oxer') {
    steilsprung(-0.55, hoehe - 0.1, 'pfosten');
    steilsprung(0.55, hoehe, 'fluegel');
    flaggen(0.55, Math.max(hoehe + 0.3, 1.85));
    tiefe = 1.3;
  } else if (art === 'mauer') {
    var steinMat = new THREE.MeshLambertMaterial({ color: 0xb5553c, transparent: true });
    var fugeMat = new THREE.MeshLambertMaterial({ color: 0xe9dcc6, transparent: true });
    mats.push(steinMat, fugeMat);
    var breite = STANGEN_LAENGE;
    var reihen = Math.max(2, Math.round((hoehe - 0.08) / 0.2));
    var rh = (hoehe - 0.08) / reihen;
    for (var r = 0; r < reihen; r++) {
      for (var k2 = 0; k2 < 4; k2++) {
        var stein = new THREE.Mesh(new THREE.BoxGeometry(breite / 4 - 0.04, rh - 0.03, 0.5), steinMat);
        stein.position.set(-breite / 2 + (k2 + 0.5) * breite / 4, rh * (r + 0.5), 0);
        stein.castShadow = true;
        gruppe.add(stein);
      }
    }
    var kern = new THREE.Mesh(new THREE.BoxGeometry(breite - 0.06, hoehe - 0.1, 0.46), fugeMat);
    kern.position.y = (hoehe - 0.1) / 2;
    gruppe.add(kern);
    for (k2 = 0; k2 < 3; k2++) {
      var deck = new THREE.Mesh(new THREE.BoxGeometry(breite / 3 - 0.05, 0.12, 0.54), fugeMat);
      deck.position.set(-breite / 2 + (k2 + 0.5) * breite / 3, hoehe - 0.02, 0);
      deck.castShadow = true;
      deck.userData.ruheZ = 0;
      gruppe.add(deck);
      fallTeile.push(deck);
    }
    staender('fluegel', 0);
    flaggen(0, 1.85);
    tiefe = 0.5;
  } else {
    steilsprung(0, hoehe, 'fluegel');
    flaggen(0, Math.max(hoehe + 0.3, 1.85));
  }

  var schild = nummernSchild(nr);
  schild.position.set(halb + 0.5, 2.35, 0);
  gruppe.add(schild);
  mats.push(schild.material);

  return { gruppe: gruppe, fallTeile: fallTeile, hoehe: hoehe, tiefe: tiefe, mats: mats };
}

// Baut ein Hindernis. Die Gruppe schaut mit +Z in Reitrichtung.
// Rueckgabe: { gruppe, fallTeile: [...], hoehe, tiefe }
function baueHindernis(art, hoehe, nr) {
  if (HINDERNIS_TEILE) return baueModellHindernis(art, hoehe, nr);
  var gruppe = new THREE.Group();
  var fallTeile = [];
  var mats = [];
  var farbe = STANGEN_FARBEN[(nr - 1) % STANGEN_FARBEN.length];
  var breite = 4.0;
  var staenderMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true });
  mats.push(staenderMat);

  function staender(z, h) {
    for (var s = -1; s <= 1; s += 2) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), staenderMat);
      p.position.set(s * (breite / 2 + 0.08), h / 2, z);
      p.castShadow = true;
      gruppe.add(p);
      var fuss = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.9), staenderMat);
      fuss.position.set(s * (breite / 2 + 0.08), 0.05, z);
      gruppe.add(fuss);
    }
  }
  function stange(y, z, faellt, neigung) {
    var m = stangenMaterial(farbe);
    mats.push(m);
    var st = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, breite, 10), m);
    st.rotation.z = Math.PI / 2 + (neigung || 0);
    st.position.set(0, y, z);
    st.castShadow = true;
    gruppe.add(st);
    if (faellt) fallTeile.push(st);
    return st;
  }
  function steilsprung(z, h) {
    staender(z, h + 0.45);
    stange(h, z, true);
    for (var y = h - 0.32; y > 0.25; y -= 0.32) stange(y, z, false);
  }

  var tiefe = 0.2;
  if (art === 'kreuz') {
    staender(0, hoehe + 0.6);
    var n = Math.atan2(hoehe + 0.25 - 0.15, breite);
    stange((hoehe + 0.4) / 2, -0.06, true, n);
    stange((hoehe + 0.4) / 2, 0.06, true, -n);
  } else if (art === 'oxer') {
    steilsprung(-0.55, hoehe - 0.1);
    steilsprung(0.55, hoehe);
    tiefe = 1.3;
  } else if (art === 'mauer') {
    var steinMat = new THREE.MeshLambertMaterial({ color: 0xb5553c, transparent: true });
    var fugeMat = new THREE.MeshLambertMaterial({ color: 0xe9dcc6, transparent: true });
    mats.push(steinMat, fugeMat);
    var reihen = Math.max(2, Math.round((hoehe - 0.08) / 0.2));
    var rh = (hoehe - 0.08) / reihen;
    for (var r = 0; r < reihen; r++) {
      for (var k = 0; k < 5; k++) {
        var stein = new THREE.Mesh(new THREE.BoxGeometry(breite / 5 - 0.04, rh - 0.03, 0.5), steinMat);
        var vers = (r % 2) * 0.2 - 0.1;
        stein.position.set(-breite / 2 + (k + 0.5) * breite / 5 + vers * 0, rh * (r + 0.5), 0);
        stein.castShadow = true;
        gruppe.add(stein);
      }
    }
    var kern = new THREE.Mesh(new THREE.BoxGeometry(breite - 0.06, hoehe - 0.1, 0.46), fugeMat);
    kern.position.y = (hoehe - 0.1) / 2;
    gruppe.add(kern);
    // obere Steine koennen herunterfallen
    for (k = 0; k < 4; k++) {
      var deck = new THREE.Mesh(new THREE.BoxGeometry(breite / 4 - 0.05, 0.12, 0.54), fugeMat);
      deck.position.set(-breite / 2 + (k + 0.5) * breite / 4, hoehe - 0.02, 0);
      deck.castShadow = true;
      gruppe.add(deck);
      fallTeile.push(deck);
    }
    staender(0, hoehe + 0.6);
    tiefe = 0.5;
  } else {
    steilsprung(0, hoehe);
  }

  // Nummer
  var schild = nummernSchild(nr);
  schild.position.set(breite / 2 + 0.08, hoehe + 1.25, 0);
  gruppe.add(schild);
  mats.push(schild.material);

  // Blumenkaesten als Schmuck
  var kastenMat = new THREE.MeshLambertMaterial({ color: 0x3f8f3f, transparent: true });
  var bluteMat = new THREE.MeshLambertMaterial({ color: farbe, transparent: true });
  mats.push(kastenMat, bluteMat);
  for (var s2 = -1; s2 <= 1; s2 += 2) {
    var busch = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), kastenMat);
    busch.position.set(s2 * (breite / 2 + 0.6), 0.28, 0);
    busch.castShadow = true;
    gruppe.add(busch);
    for (var b = 0; b < 4; b++) {
      var blute = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), bluteMat);
      blute.position.set(s2 * (breite / 2 + 0.6) + Math.cos(b * 1.6) * 0.2, 0.52, Math.sin(b * 1.6) * 0.2);
      gruppe.add(blute);
    }
  }

  return { gruppe: gruppe, fallTeile: fallTeile, hoehe: hoehe, tiefe: tiefe, mats: mats };
}

// Start- und Zielflaggen
function baueFlaggen(farbe) {
  var g = new THREE.Group();
  for (var s = -1; s <= 1; s += 2) {
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    mast.position.set(s * 2.6, 1.2, 0);
    g.add(mast);
    var fahne = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshLambertMaterial({ color: s < 0 ? 0xffffff : farbe, side: THREE.DoubleSide }));
    fahne.position.set(s * 2.6 + 0.4, 2.1, 0);
    g.add(fahne);
  }
  return g;
}
