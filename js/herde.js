// ============================================================
//  HERDE  -  Pferde aus dem 3D-Modell: beliebig viele Kopien,
//  Fellfarben mit Abzeichen, Schmutz, Gangarten, Ausruestung
// ============================================================
var HERDE = (function () {
  'use strict';

  var HOEHE = 2.5;                 // Hoehe bis zu den Ohrenspitzen in Metern
  var gltf = null, faktor = 1, bodenY = 0;
  var gang = null;                 // { galopp, trab, schritt } als AnimationClip
  var ruhe = null;                 // Ruhelage jedes Fellpunkts im Pferde-Mass (x seitlich, y hoch, z vorne)
  var klasse = null;               // 0 Koerper, 1 Maehne, 2 Schweif, 3 Unterbein, 4 Huf, 5 Maul, 6 Stirn/Nasenruecken
  var bein = null;                 // zu welchem Bein ein Punkt gehoert: 0 keins, 1 VL, 2 VR, 3 HL, 4 HR
  var fellName = 'Material.001';
  var ZAUM = { 'Material.005': 1, 'Material.006': 1, 'Material.004': 1, 'Material.003': 1 };
  var ZUEGEL = 'Material.002', SATTEL = 'Material', TASCHE = 'Material.008';

  // ---------- Fellfarben ----------
  // koerper, maehne, beine (Unterbeine), socken (wie viele weisse Beine), blesse, muster
  var FELLE = {
    brauner: { name: 'Brauner', koerper: '#7d4a24', maehne: '#17110c', beine: '#1d1510', socken: 1, blesse: 'stern' },
    fuchs: { name: 'Fuchs', koerper: '#a8582a', maehne: '#b96d38', beine: '#a8582a', socken: 2, blesse: 'blesse' },
    rappe: { name: 'Rappe', koerper: '#221e1c', maehne: '#0e0c0b', beine: '#161312', socken: 0, blesse: 'ohne' },
    schimmel: { name: 'Schimmel', koerper: '#ece7dc', maehne: '#d6d0c2', beine: '#d2ccbe', socken: 0, blesse: 'ohne', maul: '#6b5a55' },
    palomino: { name: 'Palomino', koerper: '#d7a257', maehne: '#f4ecd6', beine: '#d7a257', socken: 4, blesse: 'blesse' },
    apfel: { name: 'Apfelschimmel', koerper: '#a2a2a2', maehne: '#3a3a3a', beine: '#4a4a4a', socken: 0, blesse: 'ohne', muster: 'apfel' },
    schecke: { name: 'Schecke', koerper: '#6e4424', maehne: '#f1ece2', beine: '#f1ece2', socken: 4, blesse: 'blesse', muster: 'schecke' },
    dunkel: { name: 'Dunkelbrauner', koerper: '#3d2616', maehne: '#120d09', beine: '#17100b', socken: 2, blesse: 'stern' },
    falbe: { name: 'Falbe', koerper: '#c9a56a', maehne: '#231a12', beine: '#2a1f15', socken: 0, blesse: 'ohne' }
  };
  // Farbe aus dem Ankleide-Menue -> passendes Fell
  var AUS_FARBE = { '#8b5a2b': 'brauner', '#3b2416': 'dunkel', '#1c1c1c': 'rappe', '#f1ece2': 'schimmel', '#d9a55a': 'palomino', '#9a9a9a': 'apfel' };
  function fellAus(wert) {
    if (!wert) return FELLE.brauner;
    if (typeof wert === 'object') return wert;
    if (FELLE[wert]) return FELLE[wert];
    if (AUS_FARBE[wert]) return FELLE[AUS_FARBE[wert]];
    return { koerper: wert, maehne: '#1a1410', beine: wert, socken: 0, blesse: 'ohne' };
  }

  // ---------- einfaches Rauschen (fuer Flecken und Schmutz) ----------
  function zufall3(x, y, z, s) {
    var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 53.3) * 43758.5453;
    return n - Math.floor(n);
  }
  function rausch(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf); zf = zf * zf * (3 - 2 * zf);
    function e(a, b, c) { return zufall3(xi + a, yi + b, zi + c, s); }
    var a = e(0, 0, 0) + (e(1, 0, 0) - e(0, 0, 0)) * xf, b = e(0, 1, 0) + (e(1, 1, 0) - e(0, 1, 0)) * xf;
    var c = e(0, 0, 1) + (e(1, 0, 1) - e(0, 0, 1)) * xf, d = e(0, 1, 1) + (e(1, 1, 1) - e(0, 1, 1)) * xf;
    var u = a + (b - a) * yf, v = c + (d - c) * yf;
    return u + (v - u) * zf;
  }

  function fellNetz(wurzel) {
    var m = null;
    wurzel.traverse(function (o) { if (o.isSkinnedMesh && o.material.name === fellName) m = o; });
    return m;
  }

  // ---------- einmalige Vorbereitung ----------
  function vorbereiten(g) {
    var szene = g.scene;
    szene.updateMatrixWorld(true);
    var netz = fellNetz(szene);
    if (!netz) return false;
    var kasten = new THREE.Box3();
    szene.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      o.computeBoundingBox();
      kasten.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
    });
    faktor = HOEHE / (kasten.max.y - kasten.min.y);
    bodenY = kasten.min.y;

    // Ruhelage und Klasse jedes Fellpunkts
    var geo = netz.geometry, n = geo.attributes.position.count;
    var si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, nor = geo.attributes.normal;
    ruhe = new Float32Array(n * 3); klasse = new Uint8Array(n); bein = new Uint8Array(n);
    var v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(netz.matrixWorld);
    for (var i = 0; i < n; i++) {
      netz.getVertexPosition(i, v).applyMatrix4(netz.matrixWorld);
      var x = v.z * faktor, y = (v.y - bodenY) * faktor, z = -v.x * faktor;
      ruhe[i * 3] = x; ruhe[i * 3 + 1] = y; ruhe[i * 3 + 2] = z;
      var best = 0, bw = -1;
      for (var k = 0; k < 4; k++) { var w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      var name = netz.skeleton.bones[best].name, kl = 0;
      if (/^hair_/.test(name)) kl = 1;
      else if (/^spine(00[1-4])?_/.test(name)) kl = 2;
      else if (/^(skull|jaw|nose)/.test(name)) {
        nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        var vorn = -nv.x * 0.75 + nv.y * 0.65;            // zeigt nach vorne oben = Nasenruecken und Stirn
        if (z > 1.86 && y < 1.82) kl = 5;                 // Maul
        if (vorn > 0.55 && Math.abs(x) < 0.085) kl = 6;
      }
      klasse[i] = kl;
      var be = /^(shoulder|upper_arm|forearm|hand|f_toe)L/.test(name) ? 1 : /^(shoulder|upper_arm|forearm|hand|f_toe)R/.test(name) ? 2 :
        /^(thigh|shin|foot|r_toe)L/.test(name) ? 3 : /^(thigh|shin|foot|r_toe)R/.test(name) ? 4 : 0;
      bein[i] = be;
      if (be > 0 && y < 0.8 && kl === 0) klasse[i] = y < 0.1 ? 4 : 3;
    }
    gltf = g;
    gang = baueGangarten(g);
    return true;
  }

  // ---------- Gangarten ----------
  // Das Modell bringt nur einen Galopp mit. Schritt und Trab entstehen daraus,
  // indem die Bewegung jedes Beins zeitlich verschoben wird (Schritt: Viertakt, Trab: diagonale Beinpaare).
  var BEIN_KNOCHEN = [
    /^(shoulder|upper_arm|forearm|hand|f_toe)L/, /^(shoulder|upper_arm|forearm|hand|f_toe)R/,
    /^(pelvisL|thighL|shinL|footL|r_toeL)/, /^(pelvisR|thighR|shinR|footR|r_toeR)/
  ];
  var ZEHEN = [/^f_toeL/, /^f_toeR/, /^r_toeL/, /^r_toeR/];
  function baueGangarten(g) {
    var clip = g.animations[0];
    if (!clip) return null;
    var galopp = THREE.AnimationUtils.subclip(clip, 'galopp', 7, 25, 24);
    var D = galopp.duration + 0.09;
    galopp.tracks.forEach(function (t) {          // weicher Uebergang vom Ende zurueck zum Anfang
      var n = t.getValueSize();
      var zeiten = new Float32Array(t.times.length + 1), werte = new Float32Array(t.values.length + n);
      zeiten.set(t.times); zeiten[t.times.length] = D;
      werte.set(t.values);
      for (var i = 0; i < n; i++) werte[t.values.length + i] = t.values[i];
      t.times = zeiten; t.values = werte;
    });
    galopp.duration = D;

    // Wann ist welches Bein am weitesten vorne? (einmal mit dem Original ausmessen)
    var N = 36, szene = g.scene, mixer = new THREE.AnimationMixer(szene), akt = mixer.clipAction(galopp);
    akt.play();
    var zehen = [null, null, null, null], knoten = {};
    szene.traverse(function (o) {
      knoten[o.name] = o;
      for (var b = 0; b < 4; b++) if (o.isBone && ZEHEN[b].test(o.name)) zehen[b] = o;
    });
    var re = [0, 0, 0, 0], im = [0, 0, 0, 0], v = new THREE.Vector3(), i, b;
    for (i = 0; i < N; i++) {
      mixer.setTime(i / N * D);
      szene.updateMatrixWorld(true);
      for (b = 0; b < 4; b++) {
        if (!zehen[b]) continue;
        var vorne = -zehen[b].getWorldPosition(v).x;
        re[b] += vorne * Math.cos(i / N * Math.PI * 2); im[b] += vorne * Math.sin(i / N * Math.PI * 2);
      }
    }
    akt.stop(); mixer.uncacheRoot(szene);
    szene.traverse(function (o) { if (o.isBone && ruheLage[o.name]) { o.position.copy(ruheLage[o.name].p); o.quaternion.copy(ruheLage[o.name].q); o.scale.copy(ruheLage[o.name].s); } });
    var beinPhase = re.map(function (r, k) { return (Math.atan2(im[k], r) / (Math.PI * 2) + 1) % 1; });

    function verschoben(name, ziel, takt, koerper) {
      // ziel[b]: wann (0..1) das Bein b vorne sein soll; takt: wie oft der Koerper pro Schritt wippt
      var spuren = [];
      galopp.tracks.forEach(function (t) {
        var knochen = t.name.split('.')[0], b = -1;
        for (var k = 0; k < 4; k++) if (BEIN_KNOCHEN[k].test(knochen)) b = k;
        var groesse = t.getValueSize(), istQ = /quaternion$/.test(t.name);
        var interp = t.createInterpolant();
        var zeiten = new Float32Array(N + 1), werte = new Float32Array((N + 1) * groesse);
        var r = ruheLage[knochen];
        var ruheWert = r ? (istQ ? r.q.toArray() : /position$/.test(t.name) ? r.p.toArray() : r.s.toArray()) : null;
        var q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
        for (var i = 0; i <= N; i++) {
          var u = i / N, quelle;
          if (b >= 0) quelle = u - ziel[b] + beinPhase[b];
          else quelle = u * takt;
          quelle = ((quelle % 1) + 1) % 1;
          var wert = interp.evaluate(quelle * D);
          zeiten[i] = u * D;
          for (var c = 0; c < groesse; c++) werte[i * groesse + c] = wert[c];
          if (b < 0 && ruheWert) {                       // Koerper, Hals, Schweif: nur ein wenig mitbewegen
            if (istQ) {
              q0.fromArray(ruheWert); q1.fromArray(wert); q0.slerp(q1, koerper); q0.toArray(werte, i * groesse);
            } else {
              for (c = 0; c < groesse; c++) werte[i * groesse + c] = ruheWert[c] + (wert[c] - ruheWert[c]) * koerper;
            }
          }
        }
        var Typ = istQ ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
        spuren.push(new Typ(t.name, zeiten, werte));
      });
      return new THREE.AnimationClip(name, D, spuren);
    }
    return {
      dauer: D,
      galopp: galopp,
      // Reihenfolge der Beine: vorne links, vorne rechts, hinten links, hinten rechts
      schritt: verschoben('schritt', [0.25, 0.75, 0.0, 0.5], 2, 0.25),
      trab: verschoben('trab', [0.0, 0.5, 0.5, 0.0], 2, 0.4)
    };
  }
  var ruheLage = {};
  function merkeRuhe(g) {
    g.scene.traverse(function (o) { if (o.isBone) ruheLage[o.name] = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }; });
  }

  // ---------- Kopie des Modells mit eigenem Skelett ----------
  function klon() {
    var quelle = gltf.scene, paare = new Map();
    var kopie = quelle.clone(true);
    (function paar(a, b) { paare.set(a, b); for (var i = 0; i < a.children.length; i++) paar(a.children[i], b.children[i]); })(quelle, kopie);
    quelle.traverse(function (q) {
      if (!q.isSkinnedMesh) return;
      var k = paare.get(q);
      k.skeleton = new THREE.Skeleton(q.skeleton.bones.map(function (b) { return paare.get(b); }), q.skeleton.boneInverses);
      k.bindMatrix.copy(q.bindMatrix);
      k.bindMatrixInverse.copy(q.bindMatrixInverse);
      k.material = q.material.clone();
      k.material.name = q.material.name;
    });
    return kopie;
  }

  // ---------- Anstrich: Fellfarbe, Abzeichen und Schmutz als Farbe pro Punkt ----------
  function anstrich(wurzel, saat) {
    var netz = fellNetz(wurzel);
    var n = klasse.length;
    var geo = new THREE.BufferGeometry();
    for (var a in netz.geometry.attributes) geo.setAttribute(a, netz.geometry.attributes[a]);
    geo.setIndex(netz.geometry.index);
    geo.boundingBox = netz.geometry.boundingBox; geo.boundingSphere = netz.geometry.boundingSphere;
    var farben = new Float32Array(n * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    netz.geometry = geo;
    netz.material = netz.material.clone();
    netz.material.name = fellName;
    netz.material.color.set(0xffffff);
    netz.material.vertexColors = true;
    netz.material.roughness = 0.8;
    netz.material.needsUpdate = true;
    var basis = new Float32Array(n * 3), schmutz = new Float32Array(n);
    var c = new THREE.Color(), matsch = new THREE.Color();
    saat = saat || 1;

    function setzeFell(wert) {
      var f = fellAus(wert);
      var K = new THREE.Color(f.koerper), M = new THREE.Color(f.maehne), B = new THREE.Color(f.beine);
      var W = new THREE.Color(0xf4f0e6), H = new THREE.Color(0x2a2018), HH = new THREE.Color(0xd8c9a8);
      var MAUL = new THREE.Color(f.maul || 0x000000);
      if (!f.maul) MAUL.copy(K).multiplyScalar(0.55);
      for (var i = 0; i < n; i++) {
        var x = ruhe[i * 3], y = ruhe[i * 3 + 1], z = ruhe[i * 3 + 2], kl = klasse[i], be = bein[i];
        c.copy(K);
        // etwas Leben im Fell: Bauch heller, Ruecken dunkler
        var schatt = 0.9 + 0.16 * Math.min(1, Math.max(0, (1.75 - y) / 1.0)) + (rausch(x * 6, y * 6, z * 6, saat) - 0.5) * 0.07;
        c.multiplyScalar(schatt);
        if (f.muster === 'apfel') {
          var ap = rausch(x * 9, y * 9, z * 9, saat + 3);
          c.multiplyScalar(0.82 + 0.36 * Math.max(0, Math.min(1, (ap - 0.35) * 3)));
        } else if (f.muster === 'schecke') {
          if (rausch(x * 1.9 + 3, y * 1.9, z * 1.5, saat + 7) > 0.5) c.copy(W).multiplyScalar(schatt);
        }
        if (kl === 1 || kl === 2) c.copy(M).multiplyScalar(0.9 + rausch(x * 20, y * 5, z * 20, saat) * 0.2);
        else if (kl === 3 || kl === 4) {
          var weiss = be > 0 && be <= f.socken;
          var hoch = be > 2 ? 0.62 : 0.5;          // wie weit die schwarzen Beine hinaufgehen
          if (y < hoch) {
            var uebergang = Math.min(1, (hoch - y) / 0.12);
            c.lerp(B, uebergang);
          }
          if (weiss && y < 0.34 + zufall3(be, 1, 2, saat) * 0.14) c.copy(W);
          if (kl === 4) c.copy(weiss ? HH : H);
        } else if (kl === 5) c.lerp(MAUL, 0.75);
        if (kl === 6 || kl === 5) {
          if (f.blesse === 'blesse' && Math.abs(x) < 0.05 && y > 1.62 && (kl === 6)) c.copy(W);
          if (f.blesse === 'stern' && Math.abs(x) < 0.05 && y > 2.0 && y < 2.14 && kl === 6) c.copy(W);
        }
        basis[i * 3] = c.r; basis[i * 3 + 1] = c.g; basis[i * 3 + 2] = c.b;
      }
      male();
    }
    function male() {
      for (var i = 0; i < n; i++) {
        var s = schmutz[i];
        if (s > 0.001) {
          var t = zufall3(i, 2, 3, saat);
          matsch.setRGB(0.15 + t * 0.05, 0.095 + t * 0.03, 0.045 + t * 0.02);
          var k = Math.min(1, s) * 0.92;
          farben[i * 3] = basis[i * 3] + (matsch.r - basis[i * 3]) * k;
          farben[i * 3 + 1] = basis[i * 3 + 1] + (matsch.g - basis[i * 3 + 1]) * k;
          farben[i * 3 + 2] = basis[i * 3 + 2] + (matsch.b - basis[i * 3 + 2]) * k;
        } else {
          farben[i * 3] = basis[i * 3]; farben[i * 3 + 1] = basis[i * 3 + 1]; farben[i * 3 + 2] = basis[i * 3 + 2];
        }
      }
      geo.attributes.color.needsUpdate = true;
    }
    // Schmutz als Flecken verteilen: grad 0 (sauber) bis 1 (sehr schmutzig)
    var roh = null, sortiert = null;
    function setzeSchmutz(grad) {
      var i;
      if (!roh) {
        roh = new Float32Array(n);
        for (i = 0; i < n; i++) {
          var x = ruhe[i * 3], y = ruhe[i * 3 + 1], z = ruhe[i * 3 + 2];
          roh[i] = rausch(x * 4.5, y * 4.5, z * 3.5, saat + 11) * 0.7 + rausch(x * 11, y * 11, z * 11, saat + 5) * 0.3 +
            Math.max(0, 1 - y / 1.1) * 0.3;                  // Beine und Bauch sind schneller schmutzig
        }
        sortiert = Float32Array.from(roh).sort();
      }
      var anteil = Math.min(0.97, grad * 0.8);
      var schwelle = sortiert[Math.floor((1 - anteil) * (n - 1))];
      for (i = 0; i < n; i++) schmutz[i] = grad <= 0.01 || klasse[i] === 4 ? 0 : Math.max(0, Math.min(1, (roh[i] - schwelle) * 9 + 0.2));
      male();
    }
    // Wie schmutzig ist das Pferd gerade? (0..1, passend zu setzeSchmutz)
    function schmutzGrad() {
      var summe = 0;
      for (var i = 0; i < n; i += 3) summe += schmutz[i];
      return Math.min(1, summe / (n / 3) / 0.76);
    }
    // Putzen: rund um einen Fellpunkt Schmutz wegnehmen. Gibt zurueck, wie viel weg ging.
    function putze(punktNr, radius, staerke, grenze) {
      grenze = grenze || 0;
      var px = ruhe[punktNr * 3], py = ruhe[punktNr * 3 + 1], pz = ruhe[punktNr * 3 + 2], weg = 0, r2 = radius * radius;
      for (var i = 0; i < n; i++) {
        if (schmutz[i] <= grenze) continue;
        var dx = ruhe[i * 3] - px, dy = ruhe[i * 3 + 1] - py, dz = ruhe[i * 3 + 2] - pz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > r2) continue;
        var ab = Math.min(schmutz[i] - grenze, staerke * (1 - d2 / r2));
        schmutz[i] -= ab; weg += ab;
      }
      if (weg > 0) male();
      return weg;
    }
    return { netz: netz, setzeFell: setzeFell, setzeSchmutz: setzeSchmutz, schmutzGrad: schmutzGrad, putze: putze };
  }

  // ---------- Ausruestung, die an Knochen haengt ----------
  // art: gamaschen (4 Beine), ohren (Fliegenhaube), decke (Abschwitzdecke), schleife (Maehnenschleifen)
  function baueAusruestung(wurzel) {
    var knochen = {};
    wurzel.traverse(function (o) { if (o.isBone) knochen[o.name.replace(/_\d+$/, '')] = o; });
    wurzel.updateWorldMatrix(true, true);
    var teile = {}, hv = new THREE.Vector3();
    function mass(b) { return 1 / b.getWorldScale(hv).x; }
    function mat(farbe) { return new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.85 }); }
    function anKnochen(name, netz) { if (knochen[name]) knochen[name].add(netz); return netz; }
    var M = { gamaschen: mat(0xffffff), ohren: mat(0xffffff), decke: mat(0xffffff), schleife: mat(0xffffff), glitzer: new THREE.MeshStandardMaterial({ color: 0xffe9a8, roughness: 0.25, metalness: 0.3 }) };
    M.decke.side = THREE.DoubleSide;
    teile.gamaschen = [];
    ['forearmL', 'forearmR', 'footL', 'footR'].forEach(function (name, i) {
      var b = knochen[name];
      if (!b || !b.children[0]) return;
      var lang = b.children[0].position.length(), s = mass(b);
      var g = new THREE.Mesh(new THREE.CylinderGeometry((i < 2 ? 0.058 : 0.066) * s, (i < 2 ? 0.054 : 0.058) * s, lang * 0.62, 12), M.gamaschen);
      g.position.copy(b.children[0].position).multiplyScalar(0.6);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.children[0].position.clone().normalize());
      g.castShadow = true;
      b.add(g); teile.gamaschen.push(g);
    });
    // Fliegenhaube: zwei Ohrentueten und ein Stirnstueck
    teile.ohren = [];
    ['earL', 'earR'].forEach(function (name) {
      var b = knochen[name];
      if (!b || !b.children[0]) return;
      var lang = b.children[0].position.length() * 2.1, s = mass(b);
      var o = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, lang, 10), M.ohren);
      o.position.copy(b.children[0].position).multiplyScalar(1.0);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.children[0].position.clone().normalize());
      b.add(o); teile.ohren.push(o);
    });
    // Maehnenschleifen
    teile.schleife = [];
    ['hair_top04', 'hair_top05', 'hair_top01'].forEach(function (name) {
      var b = knochen[name];
      if (!b) return;
      var k = new THREE.Mesh(new THREE.SphereGeometry(0.045 * mass(b), 8, 6), M.schleife);
      k.scale.set(1.5, 0.8, 1);
      b.add(k); teile.schleife.push(k);
    });
    function setze(a) {
      a = a || {};
      ['gamaschen', 'ohren', 'schleife'].forEach(function (art) {
        teile[art].forEach(function (t) { t.visible = !!a[art]; });
        if (a[art]) M[art].color.set(a[art]);
      });
    }
    setze({});
    return { setze: setze };
  }

  // ---------- ein Pferd ----------
  // opt: { fell, saat, sattel (true/false), zaum (true/false) }
  function bauePferd(opt) {
    opt = opt || {};
    var wurzel = new THREE.Group(), koerper = new THREE.Group();
    wurzel.add(koerper);
    var szene = klon();
    szene.position.set(0, -bodenY, 0);
    var dreher = new THREE.Group();
    dreher.add(szene);
    dreher.rotation.y = Math.PI / 2;
    dreher.scale.setScalar(faktor);
    koerper.add(dreher);
    var sattelTeile = [], zaumTeile = [], zuegelTeile = [], sattelMat = null;
    szene.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      o.material.roughness = 0.8;
      var name = o.material.name;
      if (name === SATTEL) { sattelTeile.push(o); sattelMat = o.material; }
      else if (name === TASCHE) o.visible = false;
      else if (name === ZUEGEL) zuegelTeile.push(o);
      else if (ZAUM[name]) zaumTeile.push(o);
    });
    var farbe = anstrich(szene, opt.saat);
    farbe.setzeFell(opt.fell);
    var ausruestung = baueAusruestung(szene);
    var knochen = {};
    szene.traverse(function (o) { if (o.isBone) knochen[o.name.replace(/_\d+$/, '')] = o; });

    var mixer = new THREE.AnimationMixer(szene), akt = {};
    ['galopp', 'trab', 'schritt'].forEach(function (g) { akt[g] = mixer.clipAction(gang[g]); akt[g].play(); akt[g].setEffectiveWeight(0); });
    var gewicht = { galopp: 0, trab: 0, schritt: 0 };
    var VOLL = { galopp: 1, trab: 0.8, schritt: 0.5 };
    var halsRuhe = {}, kopfTief = 0;
    ['spine011', 'spine012', 'spine014', 'spine016'].forEach(function (k) { if (knochen[k]) halsRuhe[k] = knochen[k].quaternion.clone(); });

    // gangart: 'schritt' | 'trab' | 'galopp' | 'steh';  phase: 0..2PI pro Bewegungsablauf;  sprung: 0..1 oder -1
    function bewege(gangart, phase, staerke, sprung, dt) {
      var k = dt === undefined ? 1 : Math.min(1, dt * 7);
      for (var g in gewicht) {
        var ziel = (g === gangart ? VOLL[g] * (staerke === undefined ? 1 : staerke) : 0);
        gewicht[g] += (ziel - gewicht[g]) * k;
        akt[g].setEffectiveWeight(gewicht[g]);
      }
      var u = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
      if (sprung >= 0) { u = 0.62 + sprung * 0.38; akt.galopp.setEffectiveWeight(1); akt.trab.setEffectiveWeight(0); akt.schritt.setEffectiveWeight(0); }
      for (g in akt) akt[g].time = u * gang.dauer;
      mixer.update(0);
      if (kopfTief > 0.001) {
        // Kopf senken (fressen): Halsknochen nach unten drehen
        for (var name in halsRuhe) {
          var b = knochen[name];
          b.quaternion.multiply(hq.setFromAxisAngle(achse, kopfTief * (name === 'spine016' ? -0.5 : name === 'spine014' ? 0.3 : 0.62)));
        }
      }
    }
    var hq = new THREE.Quaternion(), achse = new THREE.Vector3(1, 0, 0);

    return {
      wurzel: wurzel, koerper: koerper, szene: szene, knochen: knochen, farbe: farbe,
      setzeFell: farbe.setzeFell, setzeSchmutz: farbe.setzeSchmutz,
      setzeSattel: function (an, f) { sattelTeile.forEach(function (t) { t.visible = !!an; }); if (f && sattelMat) sattelMat.color.set(f); },
      setzeZaum: function (an, zuegel) { zaumTeile.forEach(function (t) { t.visible = !!an; }); zuegelTeile.forEach(function (t) { t.visible = !!an && zuegel !== false; }); },
      setzeAusruestung: ausruestung.setze,
      setzeKopfTief: function (a) { kopfTief = a; },
      bewege: bewege
    };
  }

  return {
    FELLE: FELLE, fellAus: fellAus,
    bereit: function () { return !!gltf; },
    vorbereiten: function (g) { merkeRuhe(g); return vorbereiten(g); },
    gangarten: function () { return gang; },
    anstrich: anstrich, baueAusruestung: baueAusruestung,
    bauePferd: bauePferd, rausch: rausch,
    mass: function () { return { faktor: faktor, bodenY: bodenY }; }
  };
})();
