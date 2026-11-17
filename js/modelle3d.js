// ============================================================
//  MODELLE3D  -  3D-Modelle für Gebäude, Bäume, Möbel und Tiere
//  Jedes Modell liegt als Text verpackt in modelle/umwelt/<name>.js
//  und wird erst geladen, wenn es gebraucht wird. Bis dahin (oder
//  wenn die Datei fehlt) bleibt die einfache Form aus Klötzen stehen.
// ============================================================
var MODELLE3D = (function () {
  'use strict';
  var daten = {}, fertig = {}, wartend = {}, AUS = false;
  try { AUS = localStorage.getItem('reitturnier_modelle') === 'false'; } catch (e) { /* egal */ }

  function puffer(text) {
    var roh = atob(text), feld = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) feld[i] = roh.charCodeAt(i);
    return feld.buffer;
  }
  // Modell holen: cb(vorlage) mit vorlage = { szene, masse: Vector3 }. Die Vorlage steht mit der Unterkante auf y = 0, Mitte auf x = z = 0.
  function lade(name, cb) {
    if (AUS || !THREE.GLTFLoader) return;
    if (fertig[name]) { cb(fertig[name]); return; }
    if (wartend[name]) { wartend[name].push(cb); return; }
    wartend[name] = [cb];
    var s = document.createElement('script');
    s.src = 'modelle/umwelt/' + name + '.js';
    s.onload = function () {
      if (!daten[name]) return;
      new THREE.GLTFLoader().parse(puffer(daten[name]), '', function (g) {
        daten[name] = null;
        var kiste = new THREE.Box3().setFromObject(g.scene), mitte = kiste.getCenter(new THREE.Vector3()), masse = kiste.getSize(new THREE.Vector3());
        g.scene.position.set(-mitte.x, -kiste.min.y, -mitte.z);
        g.scene.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        var huelle = new THREE.Group(); huelle.add(g.scene);
        fertig[name] = { szene: huelle, masse: masse };
        wartend[name].forEach(function (f) { f(fertig[name]); });
        wartend[name] = null;
      }, function () { /* Modell kaputt: einfache Form bleibt */ });
    };
    s.onerror = function () { /* Datei fehlt: einfache Form bleibt */ };
    document.head.appendChild(s);
  }
  // Modell aufstellen. o = { x, y, z, dreh, vordreh (Modell vorher gerade drehen), hoehe | breite | laenge | masse: [b, h, t], statt: [Netze, die dann verschwinden], fertig(gruppe) }
  // breite = Ausdehnung in x, laenge = in z (vor dem Drehen). Gibt sofort eine Gruppe zurück, die sich später füllt.
  function setze(name, eltern, o) {
    o = o || {};
    var g = new THREE.Group();
    g.position.set(o.x || 0, o.y || 0, o.z || 0);
    g.rotation.y = o.dreh || 0;
    if (eltern) eltern.add(g);
    lade(name, function (v) {
      var k = v.szene.clone(), m = v.masse;
      if (o.vordreh) { var h = new THREE.Group(); k.rotation.y = o.vordreh; h.add(k); k = h; m = new THREE.Box3().setFromObject(h, true).getSize(new THREE.Vector3()); }
      if (o.masse) k.scale.set(o.masse[0] / m.x, o.masse[1] / m.y, o.masse[2] / m.z);
      else k.scale.setScalar(o.hoehe ? o.hoehe / m.y : o.breite ? o.breite / m.x : o.laenge ? o.laenge / m.z : 1);
      if (o.schatten === false) k.traverse(function (t) { if (t.isMesh) t.castShadow = false; });
      g.add(k);
      (o.statt || []).forEach(function (n) { if (n) n.visible = false; });
      if (o.fertig) o.fertig(g, k);
    });
    return g;
  }
  // viele gleiche Modelle auf einmal (Bäume): liste = [[x, y, z, groesse, (frei), dreh], ...]; hoehe = Höhe bei groesse 1
  function streue(name, eltern, liste, hoehe, fertigCb) {
    lade(name, function (v) {
      v.szene.updateMatrixWorld(true);
      var d = new THREE.Object3D(), gruppe = new THREE.Group();
      v.szene.traverse(function (t) {
        if (!t.isMesh) return;
        var geo = t.geometry.clone(); geo.applyMatrix4(t.matrixWorld);
        var im = new THREE.InstancedMesh(geo, t.material, liste.length);
        liste.forEach(function (b, i) {
          var s = hoehe * b[3] / v.masse.y;
          d.position.set(b[0], b[1], b[2]); d.scale.setScalar(s); d.rotation.set(0, b[5] !== undefined ? b[5] : i * 1.7, 0); d.updateMatrix();
          im.setMatrixAt(i, d.matrix);
        });
        im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
        gruppe.add(im);
      });
      eltern.add(gruppe);
      if (fertigCb) fertigCb(gruppe);
    });
  }
  return { daten: daten, lade: lade, setze: setze, streue: streue, aus: function () { return AUS; } };
})();
