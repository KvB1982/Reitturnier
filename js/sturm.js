// ============================================================
//  STURM  -  Gewitter: Wind, fliegende Blätter, Blitz und Donner.
//  Auf dem Pferdehof müssen die Pferde in den Stall. Schlägt ein
//  Blitz in die Strohballen ein, brennt es: Schlauch am Putzplatz
//  holen und löschen.
//  Das Wetter selbst (dunkler Himmel, Regen) macht wetter.js.
// ============================================================
var STURM = (function () {
  'use strict';
  var d = STAND.daten;
  var staerke = 0, uhr = 0, naechsterBlitz = 6, hoerer = [];
  var BLAETTER = 110, FARBEN = [0xc9772a, 0xd9a62a, 0x8a5a2a, 0x7fa83a, 0xb8442a, 0xe0c060];
  var vor = new THREE.Vector3(), obj = new THREE.Object3D();

  function gewitter() { return d.wetter === 'gewitter'; }

  // ---------- Donner: gefiltertes Rauschen ----------
  function donner(laut, verz) {
    try {
      if (!SOUND.an()) return;
      var ctx = SOUND.kontext(), dauer = 2.6, n = Math.floor(ctx.sampleRate * dauer), puf = ctx.createBuffer(1, n, ctx.sampleRate), daten = puf.getChannelData(0), wert = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n, huelle = Math.pow(1 - t, 1.6) * (0.55 + 0.45 * Math.sin(t * 31) * Math.sin(t * 7.3));
        wert = wert * 0.965 + (Math.random() * 2 - 1) * 0.035;                // tiefes Grollen
        daten[i] = (wert * 9 + (t < 0.04 ? (Math.random() * 2 - 1) * (1 - t / 0.04) * 0.5 : 0)) * huelle;
      }
      var q = ctx.createBufferSource(), g = ctx.createGain();
      q.buffer = puf; g.gain.value = Math.min(1, laut);
      q.connect(g); g.connect(SOUND.ausgang());
      q.start(ctx.currentTime + (verz || 0));
    } catch (e) { /* ohne Ton geht es auch */ }
  }

  // ---------- Blätter und Blitz für eine Szene ----------
  function baue(szene) {
    var geo = new THREE.PlaneGeometry(0.2, 0.12), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    var im = new THREE.InstancedMesh(geo, mat, BLAETTER), daten = [], c = new THREE.Color();
    for (var i = 0; i < BLAETTER; i++) {
      daten.push({ x: (Math.random() - 0.5) * 50, y: Math.random() * 7, z: (Math.random() - 0.5) * 50, p: Math.random() * 6.28, v: 0.7 + Math.random() * 0.7, r: Math.random() * 6.28 });
      im.setColorAt(i, c.setHex(FARBEN[i % FARBEN.length]));
    }
    im.frustumCulled = false; im.visible = false; im.castShadow = false;
    szene.add(im);
    var bm = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true });
    var blitz = new THREE.Group(); blitz.visible = false; szene.add(blitz);
    return { blaetter: im, daten: daten, blitz: blitz, blitzMat: bm, blitzZeit: 0 };
  }
  function zeichneBlitz(E, x, z, hoch) {
    while (E.blitz.children.length) { var a = E.blitz.children[0]; E.blitz.remove(a); a.geometry.dispose(); }
    var px = x + (Math.random() - 0.5) * 30, py = hoch, pz = z + (Math.random() - 0.5) * 30, teile = 9;
    for (var i = 0; i < teile; i++) {
      var t = (i + 1) / teile, nx = i === teile - 1 ? x : x + (px - x) * (1 - t) + (Math.random() - 0.5) * 9 * (1 - t), ny = hoch * (1 - t), nz = i === teile - 1 ? z : z + (pz - z) * (1 - t) + (Math.random() - 0.5) * 9 * (1 - t);
      var l = Math.hypot(nx - px, ny - py, nz - pz), s = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, l, 5), E.blitzMat);
      s.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2);
      s.lookAt(nx, ny, nz); s.rotateX(Math.PI / 2);
      s.castShadow = false; E.blitz.add(s);
      px = nx; py = ny; pz = nz;
    }
    E.blitz.visible = true; E.blitzZeit = 0.28;
  }
  var wunsch = null;       // Einschlag an einer bestimmten Stelle
  function schlagEin(x, z) { wunsch = [x, z]; }

  // jedes Bild, für die Welt, die gerade läuft (von wetter.js aufgerufen)
  function effekte(dt, welt) {
    var szene = welt.szene, kamera = welt.kamera;
    if (!szene || !kamera) return;
    var an = gewitter() && !!welt.mitSturm;
    staerke = Math.max(0, Math.min(1, staerke + (an ? dt / 14 : -dt / 8)));
    uhr += dt;
    var E = szene.userData.sturm;
    if (staerke <= 0 && !E) return;
    if (!E) E = szene.userData.sturm = baue(szene);
    if (staerke > 0.02) SOUND.schleife('wind', 0.25 + 0.75 * staerke);
    // Blätter wirbeln mit dem Wind an der Kamera vorbei
    var im = E.blaetter, n = Math.round(BLAETTER * staerke);
    im.visible = n > 0 && !szene.userData.unterDach;
    if (im.visible) {
      kamera.getWorldDirection(vor);
      var mx = kamera.position.x + vor.x * 13, mz = kamera.position.z + vor.z * 13, wx = 12 * staerke, wz = 4 * staerke, by = Math.max(0, kamera.position.y - 9);
      for (var i = 0; i < n; i++) {
        var b = E.daten[i];
        b.p += dt * 5 * b.v; b.r += dt * 9 * b.v;
        b.x += (wx * b.v + Math.sin(b.p) * 3) * dt; b.z += (wz * b.v + Math.cos(b.p * 0.8) * 3) * dt; b.y += Math.sin(b.p * 1.3) * 2.2 * dt;
        if (b.x > 25) b.x -= 50; if (b.x < -25) b.x += 50; if (b.z > 25) b.z -= 50; if (b.z < -25) b.z += 50;
        if (b.y < 0.15) b.y = 0.15; if (b.y > 8) b.y = 0.4;
        obj.position.set(mx + b.x, by + b.y, mz + b.z); obj.rotation.set(b.r, b.p, b.r * 0.7); obj.updateMatrix();
        im.setMatrixAt(i, obj.matrix);
      }
      im.count = n; im.instanceMatrix.needsUpdate = true;
    }
    // Blitz und Donner
    if (E.blitzZeit > 0) { E.blitzZeit -= dt; E.blitzMat.opacity = Math.max(0, E.blitzZeit / 0.28) * (Math.sin(uhr * 90) > -0.3 ? 1 : 0.3); if (E.blitzZeit <= 0) E.blitz.visible = false; }
    if (an && (staerke > 0.55 || wunsch)) {
      naechsterBlitz -= dt;
      if (naechsterBlitz <= 0 || wunsch) {
        naechsterBlitz = 5 + Math.random() * 9;
        var w = Math.random() * 6.283, weit = 90 + Math.random() * 140, x = wunsch ? wunsch[0] : kamera.position.x + Math.sin(w) * weit, z = wunsch ? wunsch[1] : kamera.position.z + Math.cos(w) * weit;
        var nah = Math.hypot(x - kamera.position.x, z - kamera.position.z);
        zeichneBlitz(E, x, z, 150);
        WETTER.blitz(wunsch ? 1 : 0.75);
        donner(wunsch ? 1 : Math.max(0.35, 1 - nah / 300), wunsch ? 0.05 : Math.min(1.6, nah / 150));
        var treffer = wunsch; wunsch = null;
        hoerer.forEach(function (f) { f(x, z, !!treffer); });
      }
    }
  }

  // ============================================================
  //  Auf dem Pferdehof: Pferde in den Stall, Feuer löschen
  // ============================================================
  var H = null, lauf = null, ballen = [], feuer = null, schlauch = null, kohle = new THREE.Color(0x3a2a1c), stroh = new THREE.Color(0xe2c75a);
  var BALLEN_ORTE = [[7, 15.5], [-17, 16], [17, 25.5]];
  function baueHof(ctx) {
    H = ctx; ballen = []; feuer = null; lauf = null;
    var szene = H.szene, m = H.ORT.putzplatz.mitte;
    // Strohballen-Stapel auf dem Hof
    BALLEN_ORTE.forEach(function (o, nr) {
      var g = new THREE.Group(); g.position.set(o[0], 0, o[1]); g.rotation.y = nr * 0.9; szene.add(g);
      var mat = new THREE.MeshStandardMaterial({ color: 0xe2c75a, roughness: 1 });
      [[-0.55, 0.3, 0], [0.55, 0.3, 0], [0, 0.9, 0], [0.1, 0.3, 0.75]].forEach(function (p, i) {
        var b = BAU.netz(new THREE.BoxGeometry(1.05, 0.58, 0.62), mat, g, p[0], p[1], p[2]); b.rotation.y = i === 3 ? 0.4 : 0;
        [-0.3, 0.3].forEach(function (s) { BAU.kasten(0.03, 0.6, 0.64, 0xb5773c, b, s, 0, 0).castShadow = false; });
      });
      H.kreise.push([o[0], o[1], 1.15, 0, 0]);
      // Flammen, Rauch und Feuerschein (unsichtbar, bis es brennt)
      var f = new THREE.Group(); f.visible = false; g.add(f);
      var flammen = [], rauch = [];
      for (var i = 0; i < 9; i++) {
        var fm = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffe36b : i % 3 === 1 ? 0xff9a2a : 0xff5a1a, transparent: true, opacity: 0.9 });
        var fl = BAU.netz(new THREE.ConeGeometry(0.28 + (i % 3) * 0.08, 1.1 + (i % 4) * 0.3, 6), fm, f, Math.sin(i * 2.4) * 0.6, 1.0, Math.cos(i * 2.4) * 0.45);
        fl.castShadow = false; flammen.push(fl);
      }
      for (i = 0; i < 7; i++) {
        var rm = new THREE.MeshBasicMaterial({ color: 0x55585c, transparent: true, opacity: 0.5 });
        var r = BAU.netz(new THREE.SphereGeometry(0.4, 7, 5), rm, f, 0, 2, 0); r.castShadow = false; rauch.push(r);
      }
      var licht = new THREE.PointLight(0xff8a2a, 0, 26, 1.6); licht.position.set(0, 1.8, 0); f.add(licht);
      ballen.push({ x: o[0], z: o[1], g: g, mat: mat, f: f, flammen: flammen, rauch: rauch, licht: licht });
    });
    // der Löschschlauch hängt am Pfosten vom Putzplatz
    var rolle = [m[0] - 3.5, m[1] - 2.0];
    var duese = new THREE.Group(); duese.visible = false; szene.add(duese);
    BAU.walze(0.035, 0.05, 0.34, 0xd4a017, duese, 0, 0, 0.17, 8).rotation.x = Math.PI / 2;
    BAU.walze(0.05, 0.05, 0.16, 0x2e9e5b, duese, 0, 0, -0.06, 8).rotation.x = Math.PI / 2;
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    var linie = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x2e9e5b })); linie.frustumCulled = false; linie.visible = false; szene.add(linie);
    var wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
    var wasser = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xbfe6ff, size: 0.22, transparent: true, opacity: 0.9 })); wasser.frustumCulled = false; wasser.visible = false; szene.add(wasser);
    var schild = BAU.schwebeText('🚒 Löschschlauch', 0.32, { schrift: 40 }); schild.position.set(rolle[0], 2.0, rolle[1]); szene.add(schild);
    schlauch = { rolle: rolle, duese: duese, linie: linie, wasser: wasser, inHand: false, spritzt: 0, schild: schild };
  }
  function draussen() { return H.pferde.filter(function (P) { return P.ort !== 'box'; }); }
  function zuende(B, wer) {
    B.f.visible = false; B.licht.intensity = 0;
    feuer = null;
    if (wer === 'ich') {
      d.muenzen += 10; STAND.merke('feuer', (d.leistung.feuer || 0) + 1); STAND.speichere();
      KERN.meldung('🚒 Feuer gelöscht! Du bist eine Heldin!  +10 🪙', 'perfekt'); KERN.klang('fanfare');
    } else KERN.meldung('🚒 Mia hat das Feuer gelöscht. Nächstes Mal schaffst du es selbst!', 'gut');
    if (schlauch.inHand) haengeAuf(true);
  }
  function nimmSchlauch() {
    if (H.S.fuehrt || H.S.reitet) { KERN.meldung('Bring erst dein Pferd in den Stall, dann hast du die Hände frei.', 'knapp'); return; }
    HOFTAG.loslassen();
    schlauch.inHand = true; schlauch.duese.visible = true; schlauch.linie.visible = true;
    KERN.ton(520, 0.08, 'triangle', 0.14); KERN.meldung(feuer ? '🚒 Schnell zum Feuer!' : '🚿 Schlauch genommen', 'gut');
  }
  function haengeAuf(still) {
    schlauch.inHand = false; schlauch.duese.visible = false; schlauch.linie.visible = false; schlauch.wasser.visible = false; schlauch.spritzt = 0;
    if (!still) KERN.ton(420, 0.08, 'triangle', 0.12);
  }
  function loesche() {
    if (!feuer || schlauch.spritzt > 0.25) return;
    schlauch.spritzt = 1.1;
    feuer.kraft = Math.max(0, feuer.kraft - 0.22);
    var S = H.S; S.kurs = Math.atan2(feuer.B.x - S.x, feuer.B.z - S.z);
    if (!SOUND.spiel('platsch', 0.4)) KERN.huf(0.08, 3000);
    if (feuer.kraft <= 0.02) zuende(feuer.B, 'ich');
  }
  // Was kann man tun? (hof.js fragt jedes Bild)
  function aktionenHof(vorFn) {
    if (!H) return;
    var S = H.S;
    if (schlauch.inHand) {
      if (feuer) {
        var e = Math.hypot(S.x - feuer.B.x, S.z - feuer.B.z);
        if (e < 7.5) vorFn(S.x, S.z, 9, '💦 Feuer löschen!', loesche);
        else vorFn(S.x, S.z, 9, null, null, '🔥 Lauf mit dem Schlauch zu den brennenden Strohballen!');
      } else vorFn(schlauch.rolle[0], schlauch.rolle[1] + 0.8, 2.2, '🚿 Schlauch zurückhängen', function () { haengeAuf(); });
    } else if (feuer || Math.hypot(S.x - schlauch.rolle[0], S.z - schlauch.rolle[1] - 0.8) < 1.4) {
      vorFn(schlauch.rolle[0], schlauch.rolle[1] + 0.8, feuer ? 2.6 : 1.4, feuer ? '🚒 Löschschlauch nehmen' : null, feuer ? nimmSchlauch : null, feuer ? null : 'Der Löschschlauch: Den brauchst du, wenn es einmal brennt.');
    }
  }
  function hinweisHof() {
    if (!H) return null;
    if (feuer) return schlauch.inHand ? '🔥 Lauf zu den brennenden Strohballen und drück dort immer wieder auf „Feuer löschen“!' : '🔥 Der Blitz hat eingeschlagen, die Strohballen brennen! Hol den 🚒 Löschschlauch am Putzplatz (westlich vor dem Stall).';
    if (lauf && gewitter()) {
      var n = draussen().length;
      if (n) return '⛈️ Gewitter! ' + (n === 1 ? draussen()[0].def.name + ' ist noch draußen' : n + ' Pferde sind noch draußen') + '. Schnell in den Stall, in die Box!';
    }
    return null;
  }
  function schrittHof(dt, zeit) {
    if (!H) return;
    var S = H.S, i;
    // Beginn und Ende des Gewitters
    if (gewitter() && !lauf) {
      lauf = { t: 0, start: draussen().length, feuerBei: Math.random() < 0.75 ? 30 + Math.random() * 18 : 1e9, belohnt: false, schreck: 6 };
      KERN.meldung('⛈️ Ein Gewitter zieht auf! Bring die Pferde in den Stall.', 'rot');
      KERN.ton(180, 0.5, 'sawtooth', 0.1); donner(0.5, 0.6);
      ballen.forEach(function (B) { B.mat.color.copy(stroh); });
    } else if (!gewitter() && lauf) {
      var rest = draussen();
      if (rest.length) { rest.forEach(function (P) { P.st.schmutz = Math.min(1, P.st.schmutz + 0.25); H.zeigeZustand(P, true); }); KERN.meldung('🌦️ Das Gewitter ist vorbei. ' + rest[0].def.name + ' ist ganz nass und aufgeregt.', 'knapp'); }
      else KERN.meldung('🌦️ Das Gewitter ist vorbei. Alle Pferde sind trocken geblieben.', 'gut');
      lauf = null;
    }
    if (lauf) {
      lauf.t += dt;
      var dr = draussen();
      if (!lauf.belohnt && !dr.length && lauf.t > 3) {
        lauf.belohnt = true;
        if (lauf.start > 0) { d.muenzen += 5; STAND.speichere(); KERN.meldung('🏠 Alle Pferde sind sicher im Stall!  +5 🪙', 'perfekt'); KERN.klang('gut'); }
      }
      // Pferde draußen haben Angst vor dem Donner
      lauf.schreck -= dt;
      if (lauf.schreck <= 0 && dr.length && staerke > 0.6) { lauf.schreck = 9 + Math.random() * 6; if (!SOUND.spiel('wiehern', 0.7)) KERN.ton(900, 0.3, 'sawtooth', 0.08); }
      if (!feuer && lauf.t > lauf.feuerBei && staerke > 0.8) {
        lauf.feuerBei = 1e9;
        var B = ballen[Math.floor(Math.random() * ballen.length)];
        schlagEin(B.x, B.z);
        feuer = { B: B, kraft: 1, t: 0 };
        B.f.visible = true;
        KERN.meldung('⚡ Der Blitz hat eingeschlagen! Es brennt!', 'rot');
      }
    }
    // Feuer
    if (feuer) {
      var B2 = feuer.B, k = feuer.kraft;
      feuer.t += dt;
      B2.flammen.forEach(function (f, j) { var fl = 0.75 + Math.sin(zeit * (9 + j) + j * 2) * 0.25; f.scale.set(k * fl + 0.05, k * (0.7 + fl * 0.6) + 0.05, k * fl + 0.05); f.position.y = 0.9 + f.scale.y * 0.5; f.rotation.z = Math.sin(zeit * 6 + j) * 0.15 + 0.25 * staerke; });
      B2.rauch.forEach(function (r, j) { var a = ((zeit * 0.35 + j / 7) % 1); r.position.set(a * 3.5 * (0.4 + staerke), 1.6 + a * 6, Math.sin(j * 2 + zeit) * 0.4); r.scale.setScalar(0.6 + a * 2.2); r.material.opacity = 0.5 * (1 - a) * (0.4 + k * 0.6); });
      B2.licht.intensity = (10 + Math.sin(zeit * 17) * 3) * k;
      B2.mat.color.lerp(kohle, dt * 0.05);
      if (Math.floor(feuer.t * 3) !== Math.floor((feuer.t - dt) * 3) && Math.hypot(S.x - B2.x, S.z - B2.z) < 30) KERN.huf(0.05 * k, 900 + Math.random() * 1500);   // Knistern
      if (feuer.t > 110) zuende(B2, 'mia');
    }
    // Schlauch in der Hand: Düse, Leitung und Wasserstrahl
    if (schlauch.inHand) {
      var hx = S.x + Math.sin(S.kurs) * 0.45, hz = S.z + Math.cos(S.kurs) * 0.45, hy = 1.08;
      schlauch.duese.position.set(hx, hy, hz); schlauch.duese.rotation.set(-0.35, S.kurs, 0);
      var lp = schlauch.linie.geometry.attributes.position.array, rx = schlauch.rolle[0], rz = schlauch.rolle[1], weit = Math.hypot(hx - rx, hz - rz);
      for (i = 0; i < 16; i++) { var t = i / 15; lp[i * 3] = rx + (hx - rx) * t; lp[i * 3 + 1] = Math.max(0.05, 1.05 - Math.sin(t * Math.PI) * Math.min(1.0, weit * 0.3) - (1.05 - hy) * t); lp[i * 3 + 2] = rz + (hz - rz) * t; }
      schlauch.linie.geometry.attributes.position.needsUpdate = true;
      if (weit > 55) { KERN.meldung('Der Schlauch ist zu kurz!', 'knapp'); S.x = rx + (S.x - rx) / weit * 54; S.z = rz + (S.z - rz) / weit * 54; }
      schlauch.wasser.visible = schlauch.spritzt > 0;
      if (schlauch.spritzt > 0) {
        schlauch.spritzt -= dt; SOUND.schleife('wasser', 0.6);
        var zx = feuer ? feuer.B.x : hx + Math.sin(S.kurs) * 5, zz = feuer ? feuer.B.z : hz + Math.cos(S.kurs) * 5, wp = schlauch.wasser.geometry.attributes.position.array;
        for (i = 0; i < 40; i++) { var a = ((i / 40 + zeit * 2.2) % 1); wp[i * 3] = hx + (zx - hx) * a + Math.sin(i * 7.1) * 0.12 * a; wp[i * 3 + 1] = hy + (1.0 - hy) * a + Math.sin(a * Math.PI) * 1.3 + Math.cos(i * 3.3) * 0.1 * a; wp[i * 3 + 2] = hz + (zz - hz) * a + Math.cos(i * 5.3) * 0.12 * a; }
        schlauch.wasser.geometry.attributes.position.needsUpdate = true;
      }
    }
    schlauch.schild.visible = !!feuer && !schlauch.inHand;
  }

  return {
    effekte: effekte, schlagEin: schlagEin, donner: donner,
    staerke: function () { return staerke; },
    wehen: function () { return staerke > 0.02 ? staerke * (0.55 + 0.3 * Math.sin(uhr * 11) + 0.15 * Math.sin(uhr * 23)) : 0; },
    beiBlitz: function (f) { hoerer.push(f); },
    baueHof: baueHof, aktionenHof: aktionenHof, schrittHof: schrittHof, hinweisHof: hinweisHof,
    hatSchlauch: function () { return !!(schlauch && schlauch.inHand); }, loslassen: function () { if (schlauch && schlauch.inHand) haengeAuf(true); },
    pose: function () { return schlauch && schlauch.inHand ? 'flasche' : null; },
    zustand: function () { return { lauf: lauf, feuer: feuer, ballen: ballen, schlauch: schlauch, staerke: staerke, setze: function (v) { staerke = v; } }; }
  };
})();
