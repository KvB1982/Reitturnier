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
  try { AUS = localStorage.getItem('reitturnier_menschen') === 'false' || localStorage.getItem('reitturnier_modelle') === 'false' || /[?&]ohnemenschen/.test(location.search); } catch (e) { /* egal */ }

  // Welcher Koerper passt zu welcher Person? (outfit.art)
  // Welche Frisur aus dem Spiel ist welche Datei? (modelle/menschen/haar_<name>.js)
  var FRISUR = { zopf: 'zopf', hoch: 'zopf', zoepfe: 'zoepfe', kurz: 'kurz', lang: 'lang', dutt: 'dutt', flecht: 'flecht', locken: 'locken' };
  var ARTEN = { maedchen: 'maedchen', junge: 'junge', frau: 'frau', mann: 'mann' };
  var HUEFT_HOEHE = 0.78;      // so hoch sitzen die Hueftgelenke der Kloetzchen-Figur (Meter)
  var KOPF = { mal: 1.25, hoch: -0.038, vor: 0.004 };      // Helm, Frisur und Schmuck am Kopf: Groesse und Verschiebung zum Nachstellen
  var GROESSE = { maedchen: 1, junge: 1, frau: 1.12, mann: 1.2 };      // Erwachsene sind groesser als die Kinder

  function puffer(text) {
    var roh = atob(text), feld = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) feld[i] = roh.charCodeAt(i);
    return feld.buffer;
  }
  function kurz(n) { return n.replace(/^mixamorig:?_?/, ''); }

  // ---------- Datei laden (einmal je Koerper und je Frisur) ----------
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
        fertig[name] = name.indexOf('haar_') === 0 ? haarVorlage(g.scene) : vorlage(g.scene, name);
        wartend[name].forEach(function (f) { f(fertig[name]); });
        wartend[name] = null;
      }, function (f) { if (window.console) console.warn('Mensch ' + name + ' laesst sich nicht laden:', f && f.message || f); });
    };
    s.onerror = function () { /* Datei fehlt: Kloetzchen bleiben */ };
    document.head.appendChild(s);
  }
  function ausschneiden(m) {
    // Haare, Brauen und Wimpern sind Bilder mit Loechern: hart ausschneiden, sonst flimmern sie
    if (m.transparent || m.alphaTest > 0) { m.transparent = false; m.alphaTest = 0.35; m.depthWrite = true; m.side = THREE.DoubleSide; }
    m.metalness = 0;
  }
  // Frisuren sind eigene Dateien ohne Knochen. Sie sitzen fest am Kopf-Gelenk und passen deshalb auf jeden Koerper.
  function haarVorlage(szene) {
    var V = { szene: szene, kopf: new THREE.Vector3(), kopfhoch: 0.2 };
    szene.traverse(function (o) {
      if (o.userData && o.userData.kopf) { V.kopf.fromArray(o.userData.kopf); V.kopfhoch = o.userData.kopfhoch || 0.2; }
      if (o.isMesh) { ausschneiden(o.material); o.material.roughness = 0.9; o.castShadow = true; }
    });
    return V;
  }

  // Aus der geladenen Datei alles ausrechnen, was fuer jede Kopie gleich ist
  function vorlage(szene, name) {
    szene.updateMatrixWorld(true);
    var netze = [], knochen = [], K = {};
    szene.traverse(function (o) {
      if (o.isSkinnedMesh) {
        netze.push(o);
        ausschneiden(o.material); o.material.roughness = 0.88;
      }
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
    // Wie hoch ist der Mensch? (mit den Knochen gerechnet: In der Datei stehen die Punkte verkleinert, erst die Knochen bringen sie auf ihre Groesse)
    var boden = Infinity, kopfHoch = -Infinity;
    netze.forEach(function (m) {
      m.computeBoundingBox();
      var k = m.boundingBox.clone().applyMatrix4(m.matrixWorld);
      boden = Math.min(boden, k.min.y); kopfHoch = Math.max(kopfHoch, k.max.y);
    });
    var hueftY = (ort.LeftUpLeg.y + ort.RightUpLeg.y) / 2 - boden;
    var mass = HUEFT_HOEHE / hueftY;
    // Die Arme der Kloetzchen-Figur haengen in Ruhe gerade herunter, die von MakeHuman stehen schraeg ab.
    // "aus" dreht jeden Arm-Knochen so, dass er in Ruhe ebenfalls herunterhaengt.
    var UNTEN = new THREE.Vector3(0, -1, 0), aus = {};
    ['Left', 'Right'].forEach(function (S) {
      aus[S + 'Arm'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'ForeArm'].clone().sub(ort[S + 'Arm']).normalize(), UNTEN);
      aus[S + 'ForeArm'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'Hand'].clone().sub(ort[S + 'ForeArm']).normalize(), UNTEN);
      // auch die Beine stehen bei MakeHuman etwas breit: gerade nach unten drehen
      aus[S + 'UpLeg'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'Leg'].clone().sub(ort[S + 'UpLeg']).normalize(), UNTEN);
      aus[S + 'Leg'] = new THREE.Quaternion().setFromUnitVectors(ort[S + 'Foot'].clone().sub(ort[S + 'Leg']).normalize(), UNTEN);
    });
    function p(n) { return ort[n].clone().multiplyScalar(mass); }
    var mitte = p('LeftUpLeg').add(p('RightUpLeg')).multiplyScalar(0.5);      // hier sitzt das Gelenk "huefte" der Kloetzchen-Figur
    function rel(a, b) { return p(a).sub(b ? p(b) : mitte); }
    function lang(a, b) { return ort[a].distanceTo(ort[b]) * mass; }
    return {
      name: name, szene: szene, mass: mass, ankerInv: ankerInv, ankerQ: ankerQ, ruhe: ruhe, aus: aus,
      hueftOrt: rel('Hips'),                      // Knochen "Hips" gegenueber dem Gelenk "huefte"
      // wohin die Gelenke der Kloetzchen-Figur rutschen, damit Haende, Kopf und Fuesse genau auf dem Menschen sitzen
      gelenk: {
        rumpf: rel('Spine'),      // um diesen Punkt beugt sich der Oberkoerper
        kopf: rel('Head', 'Spine'),
        armL: rel('LeftArm', 'Spine'), armR: rel('RightArm', 'Spine'),
        ellL: lang('LeftArm', 'LeftForeArm'), ellR: lang('RightArm', 'RightForeArm'),
        handL: lang('LeftForeArm', 'LeftHand') + 0.06, handR: lang('RightForeArm', 'RightHand') + 0.06,
        beinL: rel('LeftUpLeg'), beinR: rel('RightUpLeg'),
        knieL: lang('LeftUpLeg', 'LeftLeg'), knieR: lang('RightUpLeg', 'RightLeg')
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
    var zustand = { da: false, folge: function () {}, farben: function () {}, weg: function () { zustand.fort = true; }, art: null };
    if (AUS) return zustand;
    var art = ARTEN[(outfit && outfit.art) || (F.opt && F.opt.art)] || 'maedchen';
    zustand.art = art;
    lade(art, function (V) {
      if (zustand.fort) return;
      var k = kopie(V), halter = new THREE.Group();
      var gs = GROESSE[art] || 1;      // Erwachsene: die ganze Figur waechst mit
      halter.scale.setScalar(V.mass * gs);
      F.G.ganz.scale.setScalar(gs);
      halter.add(k.wurzel);
      F.wurzel.add(halter);
      F.teile.forEach(function (t) { t.visible = false; });
      var G = F.G, gl = V.gelenk;
      // Gelenke der Kloetzchen-Figur auf den Menschen schieben
      G.rumpf.position.copy(gl.rumpf);
      G.kopf.position.copy(gl.kopf);
      G.armL.position.copy(gl.armL); G.armR.position.copy(gl.armR);
      G.ellL.position.set(0, -gl.ellL, 0); G.ellR.position.set(0, -gl.ellR, 0);
      G.handL.position.set(0, -gl.handL, 0); G.handR.position.set(0, -gl.handR, 0);
      G.beinL.position.copy(gl.beinL); G.beinR.position.copy(gl.beinR);
      G.knieL.position.set(0, -gl.knieL, 0); G.knieR.position.set(0, -gl.knieR, 0);
      if (F.passe) F.passe(V);

      // Knochen heraussuchen: wer macht welches Gelenk nach?
      var B = {}, liste = [];
      k.wurzel.traverse(function (o) { if (o.isBone) B[kurz(o.name)] = o; });
      // Der Ruecken beugt sich nur an einer Stelle (Spine) und der Kopf nur am Kopf-Gelenk - genau wie bei der Kloetzchen-Figur.
      // So sitzen Helm, Haare und alles, was die Haende halten, immer genau richtig.
      var FOLGT = { Hips: 'huefte', Spine: 'rumpf', Head: 'kopf', LeftArm: 'armL', RightArm: 'armR', LeftForeArm: 'ellL', RightForeArm: 'ellR', LeftUpLeg: 'beinL', RightUpLeg: 'beinR', LeftLeg: 'knieL', RightLeg: 'knieR' };
      // Reihenfolge von der Huefte nach aussen; dazwischen liegende Knochen (Schulter, Spine2) laufen einfach mit
      (function sammle(b, elter) {
        var n = kurz(b.name), braucht = !!FOLGT[n] || n === 'Spine1' || n === 'Spine2' || n === 'Neck' || n === 'LeftShoulder' || n === 'RightShoulder';
        var e = braucht ? { b: b, n: n, elter: elter, folgt: FOLGT[n] || null, ref: new THREE.Quaternion(), lokal: b.quaternion.clone(), w: new THREE.Quaternion() } : null;
        if (e) {
          // ref = Ruhe-Drehung im Rahmen des Ankers, bei den Armen vorher heruntergedreht
          e.ref.copy(V.ankerQ).invert().multiply(V.aus[n] ? V.aus[n].clone().multiply(V.ruhe[n]) : V.ruhe[n]);
          liste.push(e);
        }
        b.children.forEach(function (c) { if (c.isBone) sammle(c, e || elter); });
      })(B.Hips, null);

      var Q = {}, aq = V.ankerQ, aqi = aq.clone().invert(), t = new THREE.Quaternion(), v = new THREE.Vector3(), EINS = new THREE.Quaternion();
      ['ganz', 'huefte', 'rumpf', 'kopf', 'armL', 'armR', 'ellL', 'ellR', 'beinL', 'beinR', 'knieL', 'knieR'].forEach(function (n) { Q[n] = new THREE.Quaternion(); });
      zustand.folge = function () {
        // Drehung jedes Gelenks, gesehen von der Wurzel der Figur
        Q.ganz.copy(G.ganz.quaternion);
        Q.huefte.copy(Q.ganz).multiply(F.huefte.quaternion);
        Q.rumpf.copy(Q.huefte).multiply(G.rumpf.quaternion);
        Q.kopf.copy(Q.rumpf).multiply(G.kopf.quaternion);
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
        v.add(t3.copy(F.huefte.position).applyQuaternion(Q.ganz)).add(t3.copy(G.ganz.position).divideScalar(gs));
        B.Hips.position.copy(v.divideScalar(V.mass).applyMatrix4(V.ankerInv));
      };
      var t3 = new THREE.Vector3();

      // Farben: Jacke, Hose, Stiefel und Haare bekommen die Farbe aus dem Outfit
      var FARBE = { oberteil: 'jacke', hose: 'hose', schuhe: 'stiefel', haare: 'haare', brauen: 'haare' };
      var haar = new THREE.Group(), haarName = null, haarMat = null;
      G.kopf.add(haar);
      F.frisur.visible = false;      // die Frisur aus Kloetzen bleibt weg, der Mensch hat echte Haare
      function setzeHaar(name, farbe) {
        if (name !== haarName) {
          haarName = name;
          lade('haar_' + name, function (H) {
            if (haarName !== name) return;
            while (haar.children.length) haar.remove(haar.children[0]);
            var kopie = H.szene.clone(true);
            kopie.position.copy(H.kopf).negate();
            haar.add(kopie);
            haar.scale.setScalar(V.kopfHoehe / H.kopfhoch);      // auf die Groesse dieses Kopfes bringen
            kopie.traverse(function (o) { if (o.isMesh) { o.material = haarMat = o.material.clone(); } });
            if (zustand.haarFarbe) haarMat.color.set(zustand.haarFarbe);
          });
        }
        zustand.haarFarbe = farbe;
        if (haarMat && farbe) haarMat.color.set(farbe);
      }
      zustand.farben = function (o) {
        k.netze.forEach(function (m) {
          var teil = (m.material.name || '').split('_')[0], schluessel = FARBE[teil];
          if (schluessel && o[schluessel]) { m.material.color.set(o[schluessel]); if (teil === 'brauen') m.material.color.multiplyScalar(0.55); }
        });
        setzeHaar(art === 'junge' || art === 'mann' ? 'kurzj' : FRISUR[o.frisur] || 'kurz', o.haare);
      };
      zustand.weg = function () { zustand.fort = true; F.wurzel.remove(halter); G.kopf.remove(haar); zustand.folge = zustand.farben = function () {}; };
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
