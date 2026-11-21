// ============================================================
//  NATUR  -  Himmel, Wolken, Sonne, Vögel, Berge und wilde Tiere
//  für den Ausritt und den Pferdehof.
// ============================================================
var NATUR = (function () {
  'use strict';
  var weiss = new THREE.Color(0xffffff), hf = new THREE.Vector3();

  // ---------- Himmel: Kuppel mit Farbverlauf, Sonne, ziehende Wolken, Vogelschwärme ----------
  // opt: { wolken: Anzahl, voegel: Anzahl der Schwärme, hoch: Flughöhe der Vögel }
  function himmel(szene, opt) {
    opt = opt || {};
    var H = { wolken: [], voegel: [], ruf: 6 }, i, k;
    // Kuppel: am Horizont hell, oben kräftig blau. Die Grundfarbe kommt vom Wetter (szene.background).
    var geo = new THREE.SphereGeometry(1500, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), pos = geo.attributes.position, farben = new Float32Array(pos.count * 3);
    for (i = 0; i < pos.count; i++) {
      var t = Math.max(0, Math.min(1, pos.getY(i) / 1500)), u = Math.pow(t, 0.55);
      farben[i * 3] = 1.22 - 0.72 * u; farben[i * 3 + 1] = 1.12 - 0.42 * u; farben[i * 3 + 2] = 1.04 - 0.02 * u;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    H.kuppel = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    H.kuppel.renderOrder = -10; H.kuppel.frustumCulled = false; szene.add(H.kuppel);
    // Sonne (und nachts der Mond) als leuchtende Scheibe
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), v = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(0.22, 'rgba(255,250,215,1)'); v.addColorStop(0.3, 'rgba(255,240,170,0.5)'); v.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = v; g.fillRect(0, 0, 128, 128);
    H.sonne = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false, depthWrite: false, transparent: true }));
    H.sonne.scale.setScalar(330); H.sonne.renderOrder = -9; szene.add(H.sonne);
    // Wolken: flache Haufen aus Kugeln
    H.wolkenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    var kugel = new THREE.SphereGeometry(1, 9, 6), zf = 5;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (i = 0; i < (opt.wolken === undefined ? 16 : opt.wolken); i++) {
      var w = new THREE.Group(), n = 4 + Math.floor(zuf() * 4), gr = 38 + zuf() * 50;
      for (k = 0; k < n; k++) {
        var b = new THREE.Mesh(kugel, H.wolkenMat);
        b.position.set((k - n / 2) * gr * 0.62 + zuf() * 10, zuf() * gr * 0.16, (zuf() - 0.5) * gr * 0.7);
        b.scale.set(gr * (0.6 + zuf() * 0.5), gr * (0.3 + zuf() * 0.16), gr * (0.5 + zuf() * 0.4));
        w.add(b);
      }
      w.userData = { x: (zuf() - 0.5) * 2400, z: (zuf() - 0.5) * 2400, y: 230 + zuf() * 190, v: 2.5 + zuf() * 3 };
      szene.add(w); H.wolken.push(w);
    }
    // Vögel: kleine Schwärme, die über der Landschaft kreisen
    var fluegel = new THREE.BufferGeometry();
    fluegel.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.16, 0, 0, -0.16, 0.75, 0, -0.1]), 3));
    fluegel.computeVertexNormals();
    var vm = new THREE.MeshBasicMaterial({ color: 0x2b2b33, side: THREE.DoubleSide });
    for (i = 0; i < (opt.voegel === undefined ? 3 : opt.voegel); i++) {
      var sch = { w: zuf() * 6.28, r: 26 + zuf() * 30, y: (opt.hoch || 24) + zuf() * 16, dx: (zuf() - 0.5) * 120, dz: (zuf() - 0.5) * 120, v: 0.22 + zuf() * 0.12, tiere: [] };
      for (k = 0; k < 5 + Math.floor(zuf() * 4); k++) {
        var vg = new THREE.Group(), l = new THREE.Mesh(fluegel, vm), r = new THREE.Mesh(fluegel, vm);
        r.scale.x = -1; vg.add(l); vg.add(r);
        var rumpf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), vm); rumpf.scale.set(0.8, 0.8, 2.4); vg.add(rumpf);
        vg.userData = { l: l, r: r, vx: -Math.abs(k - 3) * 1.1 - zuf(), vz: (k - 3) * 1.3, takt: 7 + zuf() * 3, p: zuf() * 6 };
        vg.scale.setScalar(1.25);
        szene.add(vg); sch.tiere.push(vg);
      }
      H.voegel.push(sch);
    }
    // jedes Bild: (dt, Zeit, Kamera, Mittelpunkt für die Vögel)
    H.schritt = function (dt, zeit, kamera, mx, mz) {
      var L = szene.userData.licht, hell = L ? Math.max(0.16, Math.min(1, L.hemi.intensity / 1.5)) : 1, kp = kamera.position;
      H.kuppel.position.set(kp.x, -30, kp.z);
      H.kuppel.material.color.copy(szene.background);
      H.wolkenMat.color.copy(szene.background).lerp(weiss, 0.8).multiplyScalar(0.35 + 0.65 * hell);
      if (L) {
        hf.copy(L.ri).normalize();
        H.sonne.position.set(kp.x + hf.x * 1300, kp.y + hf.y * 1300, kp.z + hf.z * 1300);
        var nacht = hell < 0.5, trueb = typeof WETTER !== 'undefined' && STAND.daten.wetter !== 'sonne';
        H.sonne.material.opacity = trueb ? 0.25 : 1; H.sonne.scale.setScalar(nacht ? 150 : 330);
        H.sonne.material.color.setHex(nacht ? 0xdfe8ff : 0xffffff);
      }
      H.wolken.forEach(function (w) {
        var u = w.userData;
        u.x += u.v * dt; if (u.x > 1200) u.x -= 2400;
        w.position.set(kp.x * 0.6 + u.x, u.y, kp.z * 0.6 + u.z);
      });
      H.voegel.forEach(function (s) {
        s.w += s.v * dt;
        var cx = (mx === undefined ? kp.x : mx) + s.dx + Math.sin(s.w) * s.r, cz = (mz === undefined ? kp.z : mz) + s.dz + Math.cos(s.w) * s.r, kurs = s.w + Math.PI / 2;
        s.tiere.forEach(function (t) {
          var d = t.userData, sk = Math.sin(kurs), ck = Math.cos(kurs), f = Math.sin(zeit * d.takt + d.p);
          t.position.set(cx + sk * d.vx + ck * d.vz, s.y + Math.sin(zeit * 0.7 + d.p) * 1.2 + f * 0.1, cz + ck * d.vx - sk * d.vz);
          t.rotation.y = kurs - Math.PI / 2; t.rotation.z = 0.25;
          d.l.rotation.z = f * 0.7; d.r.rotation.z = -f * 0.7;
          t.visible = hell > 0.5;
        });
      });
      // Vogelgezwitscher
      H.ruf -= dt;
      if (H.ruf <= 0 && hell > 0.6) {
        H.ruf = 5 + Math.random() * 9;
        var f0 = 2300 + Math.random() * 1200, m = 2 + Math.floor(Math.random() * 3);
        for (var q = 0; q < m; q++) KERN.ton(f0 + (q % 2) * 420, 0.07, 'sine', 0.035, q * 0.11);
      }
    };
    return H;
  }

  // ---------- Berge am Horizont ----------
  function berge(szene, mx, mz, radius, saat) {
    var zf = saat || 9, i, g = new THREE.Group();
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    function mat(farbe) { return new THREE.MeshStandardMaterial({ color: farbe, roughness: 1, flatShading: true, fog: false }); }
    var fels = [mat(0x7b8ea6), mat(0x8497ae), mat(0x6f8299)], schnee = mat(0xffffff), wald = [mat(0x5f9a58), mat(0x6aa860), mat(0x558f52)];
    // vorne: sanfte, bewaldete Hügel. Dahinter: hohe Berge mit Schnee.
    for (i = 0; i < 26; i++) {
      var hw = i / 26 * 6.283 + zuf() * 0.2, hr = radius * (0.7 + zuf() * 0.12), gr = 130 + zuf() * 120;
      var hm = new THREE.Mesh(new THREE.SphereGeometry(gr, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), wald[i % 3]);
      hm.position.set(mx + Math.sin(hw) * hr, -8, mz + Math.cos(hw) * hr); hm.scale.y = 0.3 + zuf() * 0.3; g.add(hm);
    }
    for (i = 0; i < 30; i++) {
      var bw = i / 30 * 6.283 + zuf() * 0.14, br = radius * (1 + zuf() * 0.22), bh = 190 + zuf() * 250, bb = 150 + zuf() * 110;
      var b = new THREE.Mesh(new THREE.ConeGeometry(bb, bh, 6 + (i % 3)), fels[i % 3]);
      b.position.set(mx + Math.sin(bw) * br, bh / 2 - 12, mz + Math.cos(bw) * br); b.rotation.y = zuf() * 3; g.add(b);
      if (bh > 250) {
        var sh = bh * (0.2 + zuf() * 0.12), s = new THREE.Mesh(new THREE.ConeGeometry(bb * sh / bh * 1.04, sh, 6 + (i % 3)), schnee);
        s.position.set(b.position.x, bh - sh / 2 - 11.5, b.position.z); s.rotation.y = b.rotation.y; g.add(s);
      }
    }
    szene.add(g);
    return g;
  }

  // ---------- Tiere aus einfachen Formen ----------
  // art: reh | hirsch | hase | fuchs | schaf | kuh | storch
  var ARTEN = {
    reh: { lang: 0.95, hoch: 0.78, dick: 0.2, farbe: 0xb9824c, bauch: 0xe9d9b8, hals: 0.42, kopf: 0.14, ohr: 0.11, schwanz: 0.07, spiegel: true },
    hirsch: { lang: 1.5, hoch: 1.25, dick: 0.32, farbe: 0x8f6238, bauch: 0xcdb48c, hals: 0.62, kopf: 0.2, ohr: 0.13, schwanz: 0.1, geweih: true, spiegel: true },
    hase: { lang: 0.36, hoch: 0.17, dick: 0.11, farbe: 0xa98b66, bauch: 0xe6dccb, hals: 0.06, kopf: 0.085, ohr: 0.17, schwanz: 0.05, puschel: true, kurz: true },
    fuchs: { lang: 0.7, hoch: 0.36, dick: 0.13, farbe: 0xd8692a, bauch: 0xf6efe4, hals: 0.14, kopf: 0.12, ohr: 0.09, schwanz: 0.5, schnauze: true },
    schaf: { lang: 0.8, hoch: 0.5, dick: 0.3, farbe: 0xf2efe6, bauch: 0xf2efe6, hals: 0.12, kopf: 0.13, ohr: 0.07, schwanz: 0.05, beine: 0x2c2622, gesicht: 0x2c2622, wolle: true },
    kuh: { lang: 1.7, hoch: 1.0, dick: 0.42, farbe: 0xf4f1ea, bauch: 0xf4f1ea, hals: 0.3, kopf: 0.24, ohr: 0.12, schwanz: 0.6, flecken: 0x2e2a28, schnauze: true, tief: true },
    storch: { vogel: true }
  };
  function tier(art) {
    var A = ARTEN[art], g = new THREE.Group(), T = { g: g, art: art, beine: [], phase: Math.random() * 6 }, i;
    if (A.vogel) {            // Storch: steht auf langen roten Beinen
      BAU.netz(new THREE.SphereGeometry(0.2, 8, 6), 0xffffff, g, 0, 0.85, 0).scale.set(0.8, 0.8, 1.7);
      BAU.netz(new THREE.SphereGeometry(0.14, 6, 5), 0x1c1c1c, g, 0, 0.84, -0.26).scale.set(0.7, 0.6, 1.2);
      T.kopf = new THREE.Group(); T.kopf.position.set(0, 0.95, 0.26); g.add(T.kopf);
      BAU.walze(0.035, 0.05, 0.45, 0xffffff, T.kopf, 0, 0.2, 0.04, 6).rotation.x = 0.2;
      BAU.netz(new THREE.SphereGeometry(0.07, 7, 5), 0xffffff, T.kopf, 0, 0.44, 0.09);
      BAU.netz(new THREE.ConeGeometry(0.025, 0.3, 5), 0xe5412d, T.kopf, 0, 0.42, 0.28).rotation.x = Math.PI / 2 + 0.2;
      for (i = -1; i <= 1; i += 2) T.beine.push(BAU.walze(0.014, 0.014, 0.72, 0xe5412d, g, i * 0.07, 0.36, 0, 5));
      T.schritt = function (dt, zeit) { T.kopf.rotation.x = Math.max(0, Math.sin(zeit * 0.6 + T.phase)) * 0.9; };
      return T;
    }
    var rumpf = new THREE.Group(); rumpf.position.y = A.hoch; g.add(rumpf); T.rumpf = rumpf;
    var koerper = BAU.netz(new THREE.SphereGeometry(1, 10, 8), A.farbe, rumpf); koerper.scale.set(A.dick, A.dick * (A.wolle ? 1.05 : 0.95), A.lang / 2);
    if (A.bauch !== A.farbe) BAU.netz(new THREE.SphereGeometry(1, 8, 6), A.bauch, rumpf, 0, -A.dick * 0.25, 0).scale.set(A.dick * 0.85, A.dick * 0.75, A.lang * 0.42);
    if (A.flecken) [[0.6, 0.3, 0.2], [-0.5, 0.4, -0.3], [0.2, 0.55, -0.55]].forEach(function (f) { BAU.netz(new THREE.SphereGeometry(A.dick * 0.5, 6, 5), A.flecken, rumpf, f[0] * A.dick, f[1] * A.dick, f[2] * A.lang / 2).scale.set(0.9, 0.7, 1.3); });
    if (A.spiegel) BAU.netz(new THREE.SphereGeometry(A.dick * 0.55, 6, 5), 0xffffff, rumpf, 0, A.dick * 0.1, -A.lang / 2 + A.dick * 0.25);
    // Hals und Kopf
    T.hals = new THREE.Group(); T.hals.position.set(0, A.dick * 0.4, A.lang / 2 - A.dick * 0.5); rumpf.add(T.hals);
    var neig = A.tief ? 1.25 : A.kurz ? 0.9 : 0.55;
    T.hals.rotation.x = neig;
    BAU.walze(A.dick * 0.42, A.dick * 0.6, A.hals, A.farbe, T.hals, 0, A.hals / 2, 0, 7);
    var kopf = new THREE.Group(); kopf.position.set(0, A.hals + A.kopf * 0.5, 0); kopf.rotation.x = -neig + 0.25; T.hals.add(kopf); T.kopf = kopf;
    BAU.netz(new THREE.SphereGeometry(A.kopf, 8, 6), A.gesicht || A.farbe, kopf).scale.set(0.85, 0.85, 1.25);
    if (A.schnauze) BAU.netz(new THREE.ConeGeometry(A.kopf * 0.55, A.kopf * 1.3, 6), art === 'kuh' ? 0xf0b9a8 : A.bauch, kopf, 0, -A.kopf * 0.2, A.kopf * 1.2).rotation.x = Math.PI / 2;
    BAU.netz(new THREE.SphereGeometry(A.kopf * 0.22, 5, 4), 0x1a1410, kopf, 0, -A.kopf * 0.1, A.kopf * (A.schnauze ? 1.85 : 1.2));
    for (i = -1; i <= 1; i += 2) {
      var ohr = BAU.netz(new THREE.ConeGeometry(A.ohr * 0.35, A.ohr * (art === 'hase' ? 2 : 1.2), 5), A.gesicht || A.farbe, kopf, i * A.kopf * 0.6, A.kopf * 0.85 + (art === 'hase' ? A.ohr * 0.6 : 0), -A.kopf * 0.3);
      ohr.rotation.z = -i * (art === 'hase' ? 0.15 : 0.6);
      BAU.netz(new THREE.SphereGeometry(A.kopf * 0.14, 5, 4), 0x1a1410, kopf, i * A.kopf * 0.62, A.kopf * 0.25, A.kopf * 0.75);
      if (A.geweih) {
        var st = BAU.walze(0.02, 0.03, 0.55, 0xe8dcc0, kopf, i * 0.1, A.kopf + 0.22, -0.05, 5); st.rotation.z = -i * 0.45;
        for (var z = 0; z < 3; z++) BAU.walze(0.012, 0.018, 0.22, 0xe8dcc0, kopf, i * (0.16 + z * 0.07), A.kopf + 0.22 + z * 0.14, 0.03, 4).rotation.x = 0.7;
      }
    }
    // Schwanz
    T.schwanz = new THREE.Group(); T.schwanz.position.set(0, A.dick * 0.3, -A.lang / 2 + 0.02); rumpf.add(T.schwanz);
    if (A.puschel) BAU.netz(new THREE.SphereGeometry(A.schwanz, 6, 5), 0xffffff, T.schwanz, 0, 0, -0.02);
    else if (art === 'fuchs') { var sw = BAU.netz(new THREE.ConeGeometry(0.09, A.schwanz, 6), A.farbe, T.schwanz, 0, -0.05, -A.schwanz / 2); sw.rotation.x = -Math.PI / 2 - 0.25; BAU.netz(new THREE.SphereGeometry(0.05, 5, 4), 0xffffff, T.schwanz, 0, -0.17, -A.schwanz + 0.02); }
    else BAU.walze(0.018, 0.024, A.schwanz, art === 'kuh' ? 0x2e2a28 : A.farbe, T.schwanz, 0, -A.schwanz / 2, -0.02, 5);
    // Beine
    var bh = A.hoch - A.dick * 0.5;
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (p) {
      var b = new THREE.Group(); b.position.set(p[0] * A.dick * 0.55, -A.dick * 0.4, p[1] * (A.lang / 2 - A.dick * 0.6)); rumpf.add(b);
      BAU.walze(A.dick * 0.2, A.dick * 0.13, bh, A.beine || A.farbe, b, 0, -bh / 2, 0, 6);
      T.beine.push(b);
    });
    // tempo in m/s: 0 steht (frisst ab und zu), sonst laufen oder hüpfen
    T.schritt = function (dt, zeit, tempo, frisst) {
      var huepf = art === 'hase' || art === 'reh' || art === 'hirsch';
      T.phase += dt * (tempo > 0.1 ? 4 + tempo * 2.2 : 0);
      var s = tempo > 0.1 ? Math.sin(T.phase) : 0, a = Math.min(0.9, 0.25 + tempo * 0.12);
      if (huepf && tempo > 2.5) {         // Sprunglauf: Vorder- und Hinterbeine zusammen
        T.beine[0].rotation.x = T.beine[1].rotation.x = s * a * 1.3; T.beine[2].rotation.x = T.beine[3].rotation.x = -s * a * 1.3;
        rumpf.position.y = A.hoch + Math.max(0, s) * A.hoch * 0.45; rumpf.rotation.x = -Math.cos(T.phase) * 0.22;
      } else {
        T.beine[0].rotation.x = T.beine[3].rotation.x = s * a; T.beine[1].rotation.x = T.beine[2].rotation.x = -s * a;
        rumpf.position.y = A.hoch + Math.abs(s) * 0.02; rumpf.rotation.x = 0;
      }
      var tief = frisst ? 1 : 0;
      T.tief = (T.tief || 0) + (tief - (T.tief || 0)) * Math.min(1, dt * 3);
      T.hals.rotation.x = neig + T.tief * (A.tief ? 0.5 : 1.35) + (frisst ? Math.sin(zeit * 6 + T.phase) * 0.05 : 0);
      T.schwanz.rotation.x = Math.sin(zeit * 3 + T.phase) * 0.25;
    };
    T.schritt(0, 0, 0, false);
    return T;
  }

  return { himmel: himmel, berge: berge, tier: tier };
})();
