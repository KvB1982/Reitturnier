// ============================================================
//  MENSCH  -  echte Menschen statt Figuren aus Kloetzen
//  Die Koerper kommen aus MakeHuman (frei, CC0): Gesicht, Haut,
//  Haare und Kleidung. Sie liegen als Text verpackt in
//  modelle/menschen/<name>.js und werden erst geladen, wenn sie
//  gebraucht werden. Bis dahin sieht man die Figur aus Kloetzen.
//
//  Der Trick: Die Figur aus Kloetzen bleibt unsichtbar bestehen
//  und ist das "Geruest". Der Mensch macht jede Bewegung ihrer
//  Gelenke nach. So gehen alle Posen, das Reiten und die
//  aufgenommenen Bewegungen (Motion Capture) weiter wie bisher.
//  Wie die Dateien entstehen: tools/figur/LIESMICH.md
// ============================================================
var MENSCHEN = { daten: {} };
var MENSCH = (function () {
  'use strict';
  var AUS = false, fertig = {}, wartend = {};
  try { AUS = localStorage.getItem('reitturnier_menschen') === 'false' || /[?&]ohnemenschen/.test(location.search); } catch (e) { /* egal */ }

  // Welcher Koerper passt zu welcher Person? (outfit.art)
  var ARTEN = { maedchen: 'maedchen', junge: 'junge', frau: 'frau', mann: 'mann' };
  var HUEFT_HOEHE = 0.78;      // so hoch sitzen die Hueftgelenke der Kloetzchen-Figur (Meter)
  var KOPF = { mal: 1, hoch: 0, vor: 0 };      // Helm, Frisur und Schmuck am Kopf: Groesse und Verschiebung zum Nachstellen
  var GROESSE = { maedchen: 1, junge: 1, frau: 1.1, mann: 1.16 };      // Erwachsene sind groesser als die Kinder

  function puffer(text) {
    var roh = atob(text), feld = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) feld[i] = roh.charCodeAt(i);
    return feld.buffer;
  }
  function kurz(n) { return n.replace(/^mixamorig:?_?/, ''); }

  // ---------- Vorlage laden (einmal je Koerper) ----------
  function lade(name, cb) {
    if (AUS || !THREE.GLTFLoader) return;
    if (fertig[name]) { cb(fertig[name]); return; }
    if (wartend[name]) { wartend[name].push(cb); return; }
    wartend[name] = [cb];
    var s = document.createElement('script');
    s.src = 'modelle/menschen/' + name + '.js';
    s.onload = function () {
      if (!MENSCHEN.daten[name]) return;
      new THREE.GLTFLoader().parse(puffer(MENSCHEN.daten[name]), '', function (g) {
        MENSCHEN.daten[name] = null;
        fertig[name] = vorlage(g.scene, name);
        wartend[name].forEach(function (f) { f(fertig[name]); });
        wartend[name] = null;
      }, function () { /* Datei kaputt: Kloetzchen bleiben */ });
    };
    s.onerror = function () { /* Datei fehlt: Kloetzchen bleiben */ };
    document.head.appendChild(s);
  }

  // Aus der geladenen Datei alles ausrechnen, was fuer jede Kopie gleich ist
  function vorlage(szene, name) {
    szene.updateMatrixWorld(true);
    var netze = [], knochen = [], K = {};
    szene.traverse(function (o) {
      if (o.isSkinnedMesh) netze.push(o);
      if (o.isBone) { knochen.push(o); K[kurz(o.name)] = o; }
    });
    var anker = K.Hips.parent;                      // der Knoten, an dem das Geruest haengt
    var ankerWelt = anker.matrixWorld.clone(), ankerInv = ankerWelt.clone().invert();
    var ankerQ = anker.getWorldQuaternion(new THREE.Quaternion());
    var ort = {}, ruhe = {};
    knochen.forEach(function (b) {
      var n = kurz(b.name);
      ort[n] = b.getWorldPosition(new THREE.Vector3());
      ruhe[n] = b.getWorldQuaternion(new THREE.Quaternion());
    });
    // Massstab: Hueftgelenke auf die Hoehe der Kloetzchen-Figur bringen
    var boden = Infinity;
    netze.forEach(function (m) { m.geometry.computeBoundingBox(); boden = Math.min(boden, m.geometry.boundingBox.min.clone().applyMatrix4(m.matrixWorld).y, m.geometry.boundingBox.max.clone().applyMatrix4(m.matrixWorld).y); });
    var hueftY = (ort.LeftUpLeg.y + ort.RightUpLeg.y) / 2 - boden;
    var mass = HUEFT_HOEHE * (GROESSE[name] || 1) / hueftY;
    // Die Arme der Kloetzchen-Figur haengen in Ruhe gerade herunter, die von MakeHuman stehen schraeg ab.
    // "aus" dreht jeden Arm-Knochen so, dass er in Ruhe ebenfalls herunterhaengt.
    var UNTEN = new THREE.Vector3(0, -1, 0), aus = {};
    ['Left', 'Right'].forEach(function (S) {
      aus[S + 'Arm'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'ForeArm'].clone().sub(ort[S + 'Arm']).normalize(), UNTEN);
      aus[S + 'ForeArm'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'Hand'].clone().sub(ort[S + 'ForeArm']).normalize(), UNTEN);
    });
    function p(n) { return ort[n].clone().multiplyScalar(mass); }
    var mitte = p('LeftUpLeg').add(p('RightUpLeg')).multiplyScalar(0.5);      // hier sitzt das Gelenk "huefte" der Kloetzchen-Figur
    function rel(a, b) { return p(a).sub(b ? p(b) : mitte); }
    function lang(a, b) { return ort[a].distanceTo(ort[b]) * mass; }
    var kopfHoch = -Infinity;
    netze.forEach(function (m) { kopfHoch = Math.max(kopfHoch, m.geometry.boundingBox.max.clone().applyMatrix4(m.matrixWorld).y, m.geometry.boundingBox.min.clone().applyMatrix4(m.matrixWorld).y); });
    return {
      name: name, szene: szene, mass: mass, ankerInv: ankerInv, ankerQ: ankerQ, ruhe: ruhe, aus: aus,
      hueftOrt: rel('Hips'),                      // Knochen "Hips" gegenueber dem Gelenk "huefte"
      // wohin die Gelenke der Kloetzchen-Figur rutschen, damit Haende, Kopf und Fuesse genau auf dem Menschen sitzen
      gelenk: {
        kopf: rel('Head'),
        armL: rel('LeftArm'), armR: rel('RightArm'),
        ellL: lang('LeftArm', 'LeftForeArm'), ellR: lang('RightArm', 'RightForeArm'),
        handL: lang('LeftForeArm', 'LeftHand') + 0.06, handR: lang('RightForeArm', 'RightHand') + 0.06,
        beinL: rel('LeftUpLeg'), beinR: rel('RightUpLeg'),
        knieL: rel('LeftLeg', 'LeftUpLeg'), knieR: rel('RightLeg', 'RightUpLeg')
      },
      kopfHoehe: (kopfHoch - ort.Head.y) * mass,      // vom Kopf-Gelenk bis zum Scheitel
      gross: (kopfHoch - boden) * mass
    };
  }

  // ---------- eine Kopie fuer eine Figur ----------
  // Geometrie und Bilder werden geteilt, nur Knochen und Farben gehoeren jeder Figur allein.
  function kopie(V) {
    var alt = [], neu = [], paar = {};
    var wurzel = V.szene.clone(true);      // kopiert Knoten und Knochen, die Netze haengen danach noch am alten Geruest
    V.szene.traverse(function (o) { alt.push(o); });
    wurzel.traverse(function (o) { neu.push(o); });
    alt.forEach(function (o, i) { paar[o.uuid] = neu[i]; });
    var netze = [];
    alt.forEach(function (o, i) {
      if (!o.isSkinnedMesh) return;
      var n = neu[i];
      n.material = o.material.clone();
      n.skeleton = new THREE.Skeleton(o.skeleton.bones.map(function (b) { return paar[b.uuid]; }), o.skeleton.boneInverses);
      n.bind(n.skeleton, o.bindMatrix);
      n.frustumCulled = false; n.castShadow = true;
      netze.push(n);
    });
    return { wurzel: wurzel, netze: netze };
  }

  // ---------- an eine Figur haengen ----------
  // F = { wurzel, huefte, G (Gelenke), teile (Netze aus Kloetzen), frisur, helm, opt }
  function haenge(F, outfit) {
    var zustand = { da: false, folge: function () {}, farben: function () {}, art: null };
    if (AUS) return zustand;
    var art = ARTEN[(outfit && outfit.art) || (F.opt && F.opt.art)] || 'maedchen';
    zustand.art = art;
    lade(art, function (V) {
      var k = kopie(V), halter = new THREE.Group();
      halter.scale.setScalar(V.mass);
      halter.add(k.wurzel);
      F.wurzel.add(halter);
      F.teile.forEach(function (t) { t.visible = false; });
      var G = F.G, gl = V.gelenk;
      // Gelenke der Kloetzchen-Figur auf den Menschen schieben
      G.kopf.position.copy(gl.kopf);
      G.armL.position.copy(gl.armL); G.armR.position.copy(gl.armR);
      G.ellL.position.set(0, -gl.ellL, 0); G.ellR.position.set(0, -gl.ellR, 0);
      G.handL.position.set(0, -gl.handL, 0); G.handR.position.set(0, -gl.handR, 0);
      G.beinL.position.copy(gl.beinL); G.beinR.position.copy(gl.beinR);
      G.knieL.position.copy(gl.knieL); G.knieR.position.copy(gl.knieR);
      if (F.passe) F.passe(V);

      // Knochen heraussuchen: wer macht welches Gelenk nach?
      var B = {}, liste = [];
      k.wurzel.traverse(function (o) { if (o.isBone) B[kurz(o.name)] = o; });
      var FOLGT = { Hips: 'huefte', Spine: 'rumpfH', Spine1: 'rumpf', Neck: 'kopfH', Head: 'kopf', LeftArm: 'armL', RightArm: 'armR', LeftForeArm: 'ellL', RightForeArm: 'ellR', LeftUpLeg: 'beinL', RightUpLeg: 'beinR', LeftLeg: 'knieL', RightLeg: 'knieR' };
      // Reihenfolge von der Huefte nach aussen; dazwischen liegende Knochen (Schulter, Spine2) laufen einfach mit
      (function sammle(b, elter) {
        var n = kurz(b.name), braucht = !!FOLGT[n] || n === 'Spine2' || n === 'LeftShoulder' || n === 'RightShoulder';
        var e = braucht ? { b: b, n: n, elter: elter, folgt: FOLGT[n] || null, ref: new THREE.Quaternion(), lokal: b.quaternion.clone(), w: new THREE.Quaternion() } : null;
        if (e) {
          // ref = Ruhe-Drehung im Rahmen des Ankers, bei den Armen vorher heruntergedreht
          e.ref.copy(V.ankerQ).invert().multiply(V.aus[n] ? V.aus[n].clone().multiply(V.ruhe[n]) : V.ruhe[n]);
          liste.push(e);
        }
        b.children.forEach(function (c) { if (c.isBone) sammle(c, e || elter); });
      })(B.Hips, null);

      var Q = {}, aq = V.ankerQ, aqi = aq.clone().invert(), t = new THREE.Quaternion(), v = new THREE.Vector3(), EINS = new THREE.Quaternion();
      ['ganz', 'huefte', 'rumpf', 'rumpfH', 'kopf', 'kopfH', 'armL', 'armR', 'ellL', 'ellR', 'beinL', 'beinR', 'knieL', 'knieR'].forEach(function (n) { Q[n] = new THREE.Quaternion(); });
      zustand.folge = function () {
        // Drehung jedes Gelenks, gesehen von der Wurzel der Figur
        Q.ganz.copy(G.ganz.quaternion);
        Q.huefte.copy(Q.ganz).multiply(F.huefte.quaternion);
        Q.rumpf.copy(Q.huefte).multiply(G.rumpf.quaternion);
        Q['rumpfH'].copy(Q.huefte).slerp(Q.rumpf, 0.5);
        Q.kopf.copy(Q.rumpf).multiply(G.kopf.quaternion);
        Q['kopfH'].copy(Q.rumpf).slerp(Q.kopf, 0.5);
        Q.armL.copy(Q.rumpf).multiply(G.armL.quaternion); Q.ellL.copy(Q.armL).multiply(G.ellL.quaternion);
        Q.armR.copy(Q.rumpf).multiply(G.armR.quaternion); Q.ellR.copy(Q.armR).multiply(G.ellR.quaternion);
        Q.beinL.copy(Q.huefte).multiply(G.beinL.quaternion); Q.knieL.copy(Q.beinL).multiply(G.knieL.quaternion);
        Q.beinR.copy(Q.huefte).multiply(G.beinR.quaternion); Q.knieR.copy(Q.beinR).multiply(G.knieR.quaternion);
        for (var i = 0; i < liste.length; i++) {
          var e = liste[i], ew = e.elter ? e.elter.w : EINS;
          if (e.folgt) e.w.copy(aqi).multiply(Q[e.folgt]).multiply(aq).multiply(e.ref);      // Drehung im Raum = Drehung des Gelenks mal Ruhe-Drehung
          else e.w.copy(ew).multiply(e.lokal);
          e.b.quaternion.copy(t.copy(ew).invert()).multiply(e.w);
        }
        // Ort der Huefte
        v.copy(V.hueftOrt).applyQuaternion(Q.huefte);
        v.add(t3.copy(F.huefte.position).applyQuaternion(Q.ganz)).add(G.ganz.position);
        B.Hips.position.copy(v.divideScalar(V.mass).applyMatrix4(V.ankerInv));
      };
      var t3 = new THREE.Vector3();

      // Farben: Jacke, Hose, Stiefel und Haare bekommen die Farbe aus dem Outfit
      var FARBE = { oberteil: 'jacke', hose: 'hose', schuhe: 'stiefel', haare: 'haare', brauen: 'haare' };
      zustand.farben = function (o) {
        k.netze.forEach(function (m) {
          var teil = (m.material.name || '').split('_')[0], schluessel = FARBE[teil];
          if (schluessel && o[schluessel]) { m.material.color.set(o[schluessel]); if (teil === 'brauen') m.material.color.multiplyScalar(0.6); }
          if (teil === 'haare') m.visible = !(F.eigeneFrisur && F.eigeneFrisur());
        });
      };
      zustand.netze = k.netze; zustand.halter = halter; zustand.V = V;
      zustand.da = true;
      if (F.outfit()) zustand.farben(F.outfit());
      // Jedes Bild, kurz bevor gemalt wird: der Mensch nimmt die Haltung der Gelenke an
      halter.updateMatrixWorld = function (zwang) {
        if (F.wurzel.visible) zustand.folge();
        THREE.Group.prototype.updateMatrixWorld.call(this, zwang);
      };
    });
    return zustand;
  }

  return { haenge: haenge, lade: lade, aus: function () { return AUS; }, ARTEN: ARTEN, KOPF: KOPF };
})();
