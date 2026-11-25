// ============================================================
//  MODE  -  Reitkappen, Frisuren, Oberteile und Extras
//  Wird von beiden Reiterinnen benutzt: der Figur zu Fuss (figur.js)
//  und der Reiterin auf dem Turnierpferd (pferd.js).
//  Was es gibt und was es kostet, steht in js/config.js (LADEN).
// ============================================================
var MODE = (function () {
  'use strict';
  function mat(farbe, rau, metall) { return new THREE.MeshStandardMaterial({ color: farbe, roughness: rau === undefined ? 0.8 : rau, metalness: metall || 0 }); }
  var GOLD = mat(0xf2c230, 0.3, 0.5), WEISS = mat(0xffffff, 0.7), ROSA = mat(0xff6fae, 0.7), DUNKEL = mat(0x1c1c22, 0.3);
  function netz(geo, m, eltern, x, y, z) {
    var n = new THREE.Mesh(geo, m);
    n.position.set(x || 0, y || 0, z || 0);
    n.castShadow = true;
    eltern.add(n);
    return n;
  }
  // Alte Teile wegnehmen und ihre Formen freigeben (sonst bleiben sie für immer auf der Grafikkarte liegen)
  function leere(g) {
    g.traverse(function (o) { if (o !== g && o.geometry) o.geometry.dispose(); });
    while (g.children.length) g.remove(g.children[0]);
  }
  function kapsel(r, lang) { return new THREE.CapsuleGeometry(r, Math.max(0.001, lang - 2 * r), 4, 8); }
  function sternForm(aussen, innen, zacken) {
    var s = new THREE.Shape();
    for (var i = 0; i < zacken * 2; i++) {
      var r = i % 2 ? innen : aussen, w = i * Math.PI / zacken;
      if (i) s.lineTo(Math.sin(w) * r, Math.cos(w) * r); else s.moveTo(Math.sin(w) * r, Math.cos(w) * r);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: aussen * 0.25, bevelEnabled: false });
  }
  function herzForm(g) {
    var s = new THREE.Shape();
    s.moveTo(0, -g); s.bezierCurveTo(g * 1.5, -g * 0.1, g * 0.8, g * 1.1, 0, g * 0.35); s.bezierCurveTo(-g * 0.8, g * 1.1, -g * 1.5, -g * 0.1, 0, -g);
    return new THREE.ExtrudeGeometry(s, { depth: g * 0.3, bevelEnabled: false });
  }
  function schleife(eltern, m, x, y, z, g) {
    var s = new THREE.Group(); s.position.set(x, y, z); eltern.add(s);
    netz(new THREE.SphereGeometry(g, 8, 6), m, s, -g * 1.05, 0, 0).scale.set(1, 0.75, 0.4);
    netz(new THREE.SphereGeometry(g, 8, 6), m, s, g * 1.05, 0, 0).scale.set(1, 0.75, 0.4);
    netz(new THREE.SphereGeometry(g * 0.42, 8, 6), m, s);
    return s;
  }

  // ---------- Reitkappen: Schmuck auf dem Helm ----------
  // hy = Mitte der Helmkugel, hr = ihr Radius
  function kappe(g, o, hy, hr) {
    var art = o.kappe || 'klassisch', k = art + '/' + o.helm;
    if (g.userData.art === k) return;
    g.userData.art = k;
    leere(g);
    var helm = mat(o.helm || '#111111', 0.4), i, w;
    if (art === 'schleife') schleife(g, ROSA, 0, hy + hr * 0.35, -hr * 1.02, hr * 0.42).rotation.x = -0.3;
    else if (art === 'ohren') {
      for (i = -1; i <= 1; i += 2) {
        netz(new THREE.ConeGeometry(hr * 0.3, hr * 0.5, 4), helm, g, i * hr * 0.55, hy + hr * 0.98, 0).rotation.z = -i * 0.35;
        netz(new THREE.ConeGeometry(hr * 0.17, hr * 0.3, 4), ROSA, g, i * hr * 0.55, hy + hr * 0.96, hr * 0.07).rotation.z = -i * 0.35;
      }
    } else if (art === 'krone') {
      netz(new THREE.CylinderGeometry(hr * 0.5, hr * 0.5, hr * 0.16, 12, 1, true), GOLD, g, 0, hy + hr * 0.98, 0).material.side = THREE.DoubleSide;
      for (i = 0; i < 6; i++) { w = i * Math.PI / 3; netz(new THREE.ConeGeometry(hr * 0.12, hr * 0.32, 4), GOLD, g, Math.sin(w) * hr * 0.5, hy + hr * 1.2, Math.cos(w) * hr * 0.5); }
      netz(new THREE.SphereGeometry(hr * 0.1, 8, 6), ROSA, g, 0, hy + hr * 1.0, hr * 0.52);
    } else if (art === 'einhorn') {
      var horn = netz(new THREE.ConeGeometry(hr * 0.2, hr * 1.2, 8), GOLD, g, 0, hy + hr * 1.25, hr * 0.5);
      horn.rotation.x = 0.45;
      for (i = 0; i < 3; i++) netz(new THREE.TorusGeometry(hr * (0.17 - i * 0.045), hr * 0.03, 5, 10), [ROSA, WEISS, ROSA][i], horn, 0, -hr * 0.42 + i * hr * 0.3, 0).rotation.x = Math.PI / 2;
    } else if (art === 'bommel') {
      netz(new THREE.SphereGeometry(hr * 0.36, 10, 8), WEISS, g, 0, hy + hr * 1.25, 0);
      netz(new THREE.TorusGeometry(hr * 0.98, hr * 0.09, 6, 20), ROSA, g, 0, hy + hr * 0.12, 0).rotation.x = Math.PI / 2;
    } else if (art === 'glitzer') {
      for (i = 0; i < 12; i++) {
        w = i * 2.4; var e = 0.25 + (i % 4) * 0.28;
        netz(new THREE.OctahedronGeometry(hr * 0.09, 0), i % 2 ? GOLD : WEISS, g, Math.sin(w) * Math.sin(e) * hr * 1.03, hy + Math.cos(e) * hr * 1.08, Math.cos(w) * Math.sin(e) * hr * 1.08);
      }
    } else if (art === 'cowboy') {
      var braun = mat(0x9a6b3f, 0.9);
      var krempe = netz(new THREE.CylinderGeometry(hr * 1.75, hr * 1.75, hr * 0.07, 20), braun, g, 0, hy + hr * 0.55, 0);
      krempe.scale.z = 1.15;
      netz(new THREE.CylinderGeometry(hr * 0.86, hr * 1.02, hr * 0.75, 14), braun, g, 0, hy + hr * 0.9, 0).scale.z = 1.08;
      netz(new THREE.CylinderGeometry(hr * 1.04, hr * 1.04, hr * 0.14, 14), ROSA, g, 0, hy + hr * 0.66, 0).scale.z = 1.08;
    } else if (art === 'blumen') {
      var bf = [ROSA, WEISS, mat(0xffe36b), mat(0xb07cff)];
      for (i = 0; i < 10; i++) { w = i * Math.PI / 5; netz(new THREE.SphereGeometry(hr * 0.16, 7, 5), bf[i % 4], g, Math.sin(w) * hr * 0.98, hy + hr * 0.2, Math.cos(w) * hr * 1.04); }
    }
  }

  // ---------- Frisuren ----------
  // ky = Mitte des Kopfes. Gibt false zurueck, wenn die Frisur hier nicht bekannt ist.
  function frisur(art, g, m, ky, band) {
    var z, i;
    band = band || ROSA;
    if (art === 'lang') {
      z = new THREE.Group(); z.position.set(0, ky - 0.02, -0.07); z.name = 'wackel'; z.userData.basis = 0.12; g.add(z);
      netz(kapsel(0.075, 0.46), m, z, 0, -0.19, -0.02).scale.set(1.35, 1, 0.42);
      for (i = -1; i <= 1; i += 2) netz(kapsel(0.03, 0.26), m, g, i * 0.092, ky - 0.1, 0.012);
    } else if (art === 'dutt') {
      netz(new THREE.SphereGeometry(0.052, 10, 8), m, g, 0, ky - 0.035, -0.118);
      netz(new THREE.TorusGeometry(0.036, 0.011, 6, 12), band, g, 0, ky - 0.03, -0.098).rotation.x = 0.25;
    } else if (art === 'flecht') {
      z = new THREE.Group(); z.position.set(0, ky - 0.04, -0.1); z.name = 'wackel'; z.userData.basis = 0.3; g.add(z);
      for (i = 0; i < 9; i++) netz(new THREE.SphereGeometry(0.034 - i * 0.0018, 8, 6), m, z, i % 2 ? 0.008 : -0.008, -i * 0.045, 0);
      schleife(z, band, 0, -0.41, 0, 0.03);
      netz(new THREE.SphereGeometry(0.022, 8, 6), m, z, 0, -0.45, 0).scale.y = 1.6;
    } else if (art === 'locken') {
      for (i = 0; i < 18; i++) {
        var w = Math.PI * 0.42 + (i % 9) * Math.PI * 1.16 / 8, tief = Math.floor(i / 9);
        netz(new THREE.SphereGeometry(0.04, 7, 5), m, g, Math.sin(w) * 0.105, ky - 0.045 - tief * 0.06 - (i % 2) * 0.012, Math.cos(w) * 0.105 - 0.01);
      }
    } else if (art === 'hoch') {
      z = new THREE.Group(); z.position.set(0, ky + 0.0, -0.115); z.name = 'wackel'; z.userData.basis = 0.75; g.add(z);
      netz(kapsel(0.045, 0.36), m, z, 0, -0.16, 0).scale.set(1.1, 1, 0.8);
      schleife(g, band, 0, ky + 0.0, -0.118, 0.034);
    } else return false;
    return true;
  }

  // ---------- Oberteile und Extras am Rumpf ----------
  // c = { y: Brusthoehe, b: halbe Breite, t: halbe Tiefe, hals: Hoehe des Halses }
  function koerper(g, o, c) {
    var k = (o.oberteil || 'jacke') + '/' + (o.extra || 'ohne');
    if (g.userData.art === k) return;
    g.userData.art = k;
    leere(g);
    var ob = o.oberteil || 'jacke', ex = o.extra || 'ohne', i, n;
    function ring(y, m, hoch, dick) {
      n = netz(new THREE.CylinderGeometry(1, 1, hoch, 18, 1, true), m, g, 0, y, 0);
      n.scale.set(c.b * (dick || 1.06), 1, c.t * (dick || 1.06) * 1.04);
      n.material.side = THREE.DoubleSide;
      return n;
    }
    if (ob === 'stern') { n = netz(sternForm(0.06, 0.026, 5), GOLD, g, 0, c.y + 0.03, c.t * 0.98); }
    else if (ob === 'herz') { netz(herzForm(0.045), mat(0xff3d7f, 0.6), g, 0, c.y + 0.03, c.t * 0.98); }
    else if (ob === 'streifen') { for (i = -1; i <= 1; i++) ring(c.y + i * 0.075, mat(0xffffff, 0.8), 0.036); }
    else if (ob === 'regenbogen') { [0xe5412d, 0xf39c12, 0xf1c40f, 0x27ae60, 0x1f6fd0, 0x8e44ad].forEach(function (f, j) { ring(c.y + 0.1 - j * 0.04, mat(f, 0.8), 0.04); }); }
    else if (ob === 'turnier') {
      netz(new THREE.SphereGeometry(0.05, 10, 8), WEISS, g, 0, c.hals - 0.03, c.t * 0.55).scale.set(1.3, 0.8, 1);
      for (i = 0; i < 3; i++) netz(new THREE.SphereGeometry(0.014, 8, 6), GOLD, g, 0, c.y + 0.07 - i * 0.07, c.t * 1.03);
      ring(c.y - 0.16, GOLD, 0.02, 1.08);
    } else if (ob === 'weste') {
      ring(c.y - 0.01, mat(0xff5fa2, 0.95), 0.3, 1.14);
      for (i = -1; i <= 1; i++) ring(c.y - 0.01 + i * 0.09, mat(0xe84393, 0.95), 0.012, 1.17);
    } else if (ob === 'nummer') {
      [1, -1].forEach(function (v) {
        var t = BAU.tafel('7', 0.15, { grund: '#ffffff', farbe: '#222222', schrift: 90 });
        t.position.set(0, c.y, v * c.t * 1.12); if (v < 0) t.rotation.y = Math.PI; g.add(t);
      });
    }
    if (ex === 'schal') {
      var rot = mat(0xd11f3a, 0.95);
      netz(new THREE.TorusGeometry(0.06, 0.03, 8, 14), rot, g, 0, c.hals, 0).rotation.x = Math.PI / 2;
      netz(new THREE.BoxGeometry(0.05, 0.2, 0.025), rot, g, 0.045, c.hals - 0.11, c.t * 0.95);
    } else if (ex === 'rucksack') {
      var blau = mat(0x2d8fd0, 0.9);
      netz(new THREE.BoxGeometry(c.b * 1.5, 0.26, 0.11), blau, g, 0, c.y, -c.t - 0.05);
      netz(new THREE.BoxGeometry(c.b * 1.1, 0.1, 0.03), mat(0xf1c40f, 0.9), g, 0, c.y - 0.04, -c.t - 0.115);
      for (i = -1; i <= 1; i += 2) netz(new THREE.BoxGeometry(0.03, 0.3, 0.012), blau, g, i * c.b * 0.6, c.y + 0.02, c.t * 1.02);
    } else if (ex === 'fluegel') {
      var fm = new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.7, roughness: 0.2, side: THREE.DoubleSide, emissive: 0x6fa8d8, emissiveIntensity: 0.35 });
      for (i = -1; i <= 1; i += 2) {
        var fl = new THREE.Group(); fl.position.set(i * 0.03, c.y + 0.06, -c.t - 0.02); fl.rotation.y = i * 0.5; fl.name = 'fluegel'; fl.userData.seite = i; g.add(fl);
        netz(new THREE.CircleGeometry(0.2, 14), fm, fl, i * 0.17, 0.1, 0).scale.set(0.8, 1.15, 1);
        netz(new THREE.CircleGeometry(0.13, 12), fm, fl, i * 0.12, -0.13, 0).scale.set(0.8, 1.1, 1);
      }
    } else if (ex === 'umhang') {
      var um = netz(new THREE.PlaneGeometry(c.b * 2.5, 0.62, 1, 4), new THREE.MeshStandardMaterial({ color: 0x8e44ad, roughness: 0.9, side: THREE.DoubleSide }), g, 0, c.hals - 0.36, -c.t - 0.06);
      um.rotation.x = 0.16; um.name = 'umhang';
      netz(new THREE.SphereGeometry(0.02, 8, 6), GOLD, g, 0, c.hals - 0.05, c.t * 0.9);
      ring(c.hals - 0.06, um.material, 0.04, 1.02).scale.set(c.b * 0.75, 1, c.t * 1.0);
    } else if (ex === 'schaerpe') {
      n = netz(new THREE.TorusGeometry(0.2, 0.022, 6, 20), GOLD, g, 0, c.y, 0);
      n.rotation.set(Math.PI / 2 - 0.25, 0.75, 0); n.scale.set(c.b / 0.17, c.t / 0.11, 1);
    }
  }

  // ---------- Extras am Kopf ----------
  function kopf(g, o, ky) {
    var ex = o.extra || 'ohne';
    if (g.userData.art === ex) return;
    g.userData.art = ex;
    leere(g);
    if (ex === 'brille') {
      for (var i = -1; i <= 1; i += 2) netz(new THREE.SphereGeometry(0.026, 10, 8), DUNKEL, g, i * 0.037, ky + 0.008, 0.094).scale.set(1.15, 0.85, 0.35);
      netz(new THREE.BoxGeometry(0.03, 0.006, 0.006), DUNKEL, g, 0, ky + 0.012, 0.102);
    }
  }

  // alle Frisuren mit Namen (die ersten drei hat jede)
  var FRISUREN = [['zopf', 'Pferdeschwanz'], ['zoepfe', 'Zwei Zöpfe'], ['kurz', 'Kurz'], ['lang', 'Lang und offen'], ['dutt', 'Dutt'], ['flecht', 'Langer Flechtzopf'], ['locken', 'Locken'], ['hoch', 'Hoher Zopf mit Schleife']];
  return { kappe: kappe, frisur: frisur, koerper: koerper, kopf: kopf, FRISUREN: FRISUREN };
})();
