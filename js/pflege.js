// ============================================================
//  PFLEGE  -  in der Box: abspritzen, striegeln, Hufe auskratzen,
//  ausmisten, einstreuen, schmuecken, Halfter anlegen
// ============================================================
var PFLEGE = (function () {
  'use strict';
  var hof = null, P = null, box = null, werkzeug = null, knoepfe = {};
  var strahl = null, spritzer = null, hufRinge = [], halme = [];
  var strahlTon = 0;
  var zeigerUnten = false, zx = 0, zy = 0, altX = 0, altY = 0;
  var wurf = new THREE.Raycaster(), maus = new THREE.Vector2(), v = new THREE.Vector3(), v2 = new THREE.Vector3();
  var warSchmutzig = false, warMistig = false, warHufe = false, warStroh = false, hudZeit = 0, aussen = false, drehZiel = null, seiteGesagt = false;
  var HINWEIS = {
    schlauch: '🚿 Halte den Finger (oder die Maus) auf das Pferd und spritze den Schlamm ab. Mit 🔄 dreht sich das Pferd um: Die andere Seite muss auch sauber werden!',
    striegel: '🧽 Reibe mit dem Striegel über das Fell, bis es glänzt. Mit 🔄 kommt die andere Seite dran.',
    hufe: '🦶 Kratze jeden Huf aus: Reibe über die roten Kreise an den Hufen.',
    mist: '🧹 Tippe die Mistäpfel an, um sie in die Schubkarre zu werfen.',
    stroh: '🌾 Tippe auf den Boxenboden, um frisches Stroh zu verteilen.'
  };

  function bild(welt) {
    v.copy(welt).project(hof.kamera);
    return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight, vorn: v.z < 1 };
  }
  function trefferFell(x, y) {
    maus.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    wurf.setFromCamera(maus, hof.kamera);
    var t = wurf.intersectObject(P.tier.farbe.netz, false);
    return t.length ? t[0] : null;
  }
  function bodenPunkt(x, y) {
    maus.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    wurf.setFromCamera(maus, hof.kamera);
    var r = wurf.ray;
    if (r.direction.y > -0.01) return null;
    var t = -r.origin.y / r.direction.y;
    return v2.copy(r.direction).multiplyScalar(t).add(r.origin);
  }

  function sichtSeite() { return box.v * Math.sin(P.kurs) >= 0 ? 1 : -1; }      // welche Seite des Pferdes schaut zur Kamera?
  function start(h, pferd, platz) {
    hof = h; P = pferd; box = platz || P.box; aussen = !!platz; drehZiel = null; seiteGesagt = false;
    hof.setzeModus('pflege');
    var S = hof.spielerin();
    S.x = box.xc + 1.55; S.z = P.z + box.v * 0.75; S.kurs = box.v > 0 ? Math.PI : 0; S.tempo = 0;
    if (box.front) box.front.visible = false;
    P.versteckt = true; if (P.schild) P.schild.visible = false;
    stelleKamera();
    warSchmutzig = P.st.schmutz > 0.12; warMistig = P.st.mist > 0.1; warHufe = P.st.hufe > 0.2; warStroh = P.st.stroh < 0.7;
    P.tier.setzeSchmutz(P.st.schmutz);
    // Wasserstrahl
    if (!strahl) {
      strahl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.012, 1, 8), new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.75 }));
      strahl.geometry.translate(0, 0.5, 0);
      spritzer = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd8f1ff, transparent: true, opacity: 0.6 }));
    }
    hof.szene.add(strahl); hof.szene.add(spritzer);
    strahl.visible = false; spritzer.visible = false;
    // Hufe: Kreise, die man auskratzen muss
    hufRinge.forEach(function (r) { hof.szene.remove(r.netz); });
    hufRinge = [];
    var schmutzig = Math.round(Math.min(1, P.st.hufe) * 4);
    ['f_toeL', 'f_toeR', 'r_toeL', 'r_toeR'].forEach(function (name, i) {
      var netz = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.17, 20), new THREE.MeshBasicMaterial({ color: 0xe5412d, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthTest: false }));
      netz.renderOrder = 6;
      hof.szene.add(netz);
      hufRinge.push({ netz: netz, knochen: P.tier.knochen[name], rest: i < schmutzig ? 6 : 0 });
    });
    werkzeug = null;
    baueLeiste();
    waehle('schlauch');
    if (P.st.schmutz < 0.1) waehle(P.st.hufe > 0.2 ? 'hufe' : aussen ? 'striegel' : P.st.mist > 0.1 ? 'mist' : P.st.stroh < 0.7 ? 'stroh' : 'striegel');
  }
  function stelleKamera() {
    var hochkant = window.innerWidth < window.innerHeight;
    var ab = hochkant ? 2.6 : 1.5;
    hof.setzeKamera({
      pos: new THREE.Vector3(box.xc, hochkant ? 2.9 : 2.3, box.zVorn - box.v * ab),
      blick: new THREE.Vector3(box.xc, 0.85, P.z - box.v * 0.5)
    });
  }

  function baueLeiste() {
    knoepfe = {};
    var liste = [
      { id: 'schlauch', bild: '🚿', text: 'Abspritzen' }, { id: 'striegel', bild: '🧽', text: 'Striegeln' }, { id: 'wenden', bild: '🔄', text: 'Andere Seite' }, { id: 'hufe', bild: '🦶', text: 'Hufe' },
      { id: 'mist', bild: '🧹', text: 'Ausmisten' }, { id: 'stroh', bild: '🌾', text: 'Einstreuen' },
      { id: 'schmuck', bild: '🎀', text: 'Schmücken' }, { id: 'halfter', bild: '🐴', text: 'Mitnehmen', klasse: 'los' }, { id: 'ende', bild: '✔️', text: 'Fertig' }
    ];
    if (aussen) liste = liste.filter(function (w) { return w.id !== 'mist' && w.id !== 'stroh' && w.id !== 'ende'; });
    liste.forEach(function (w) {
      w.tun = function () {
        if (w.id === 'ende') ende();
        else if (w.id === 'wenden') wende();
        else if (w.id === 'halfter') { var pferd = P, drau = aussen; ende(); if (!drau) hof.nimm(pferd); }
        else if (w.id === 'schmuck') hof.zeigeSchmuck(P);
        else waehle(w.id);
      };
    });
    hof.zeigeWerkzeug(liste);
    liste.forEach(function (w) { knoepfe[w.id] = w.knopf; });
    zeigeFertig();
  }
  // das Pferd dreht sich um, damit man die andere Seite putzen kann
  function wende() {
    if (drehZiel !== null) return;
    drehZiel = P.kurs + Math.PI;
    if (knoepfe.wenden) knoepfe.wenden.classList.remove('blink');
    KERN.huf(0.1, 220); KERN.huf(0.1, 240, 0.25); KERN.huf(0.1, 220, 0.5);
    KERN.meldung('Komm, dreh dich um!', 'gut');
  }
  function waehle(id) {
    werkzeug = id;
    for (var k in knoepfe) knoepfe[k].classList.toggle('aktiv', k === id);
    hof.setzeHinweis(HINWEIS[id] || null);
    hof.spielerin().figur.setzePose(id === 'mist' || id === 'stroh' ? 'schaufeln' : 'putzen');
  }
  function zeigeFertig() {
    if (!P) return;
    var sauber = P.st.schmutz < 0.05;
    if (knoepfe.schlauch) knoepfe.schlauch.classList.toggle('fertig', sauber);
    if (knoepfe.striegel) knoepfe.striegel.classList.toggle('fertig', sauber);
    if (knoepfe.hufe) knoepfe.hufe.classList.toggle('fertig', P.st.hufe < 0.05);
    if (knoepfe.mist) knoepfe.mist.classList.toggle('fertig', P.st.mist < 0.05);
    if (knoepfe.stroh) knoepfe.stroh.classList.toggle('fertig', P.st.stroh > 0.95);
  }
  function lohn(anzahl, text) {
    STAND.daten.muenzen += anzahl; STAND.speichere();
    KERN.meldung(text + '  +' + anzahl + ' 🪙', 'perfekt');
    KERN.klang('perfekt');
    zeigeFertig();
  }

  function putze(x, y, staerke, radius, grenze) {
    var t = trefferFell(x, y);
    if (!t) return null;
    var turbo = STAND.daten.besitz.putz_turbo ? 2 : 1;
    var weg = P.tier.farbe.putze(t.face.a, radius, staerke * turbo, grenze);
    if (weg > 0) {
      P.st.schmutz = P.tier.farbe.schmutzGrad();
      if (P.st.schmutz < 0.035) {
        P.st.schmutz = 0; P.tier.setzeSchmutz(0);
        if (warSchmutzig) { warSchmutzig = false; lohn(3, 'Blitzblank von beiden Seiten!'); HOFTAG.zaehle('putzen', 1); STAND.merke('sauber', 1); }
        if (knoepfe.wenden) knoepfe.wenden.classList.remove('blink');
      } else if (!seiteGesagt && P.tier.farbe.schmutzSeite(sichtSeite()) < 0.03 && P.tier.farbe.schmutzSeite(-sichtSeite()) > 0.05) {
        seiteGesagt = true;
        KERN.meldung('Diese Seite glänzt! Jetzt die andere: 🔄', 'gut'); KERN.klang('gut');
        if (knoepfe.wenden) knoepfe.wenden.classList.add('blink');
      }
    }
    return t;
  }

  function zeiger(typ, e) {
    if (!P) return;
    if (typ === 'start') {
      zeigerUnten = true; zx = altX = e.clientX; zy = altY = e.clientY;
      tippe(zx, zy);
    } else if (typ === 'zug') {
      zx = e.clientX; zy = e.clientY;
      var weg = Math.hypot(zx - altX, zy - altY);
      if (weg < 6) return;
      if (werkzeug === 'striegel' && zeigerUnten) {
        if (putze(zx, zy, Math.min(0.5, weg / 60), 0.27)) { if (Math.random() < 0.3) KERN.huf(0.03, 1800); }
      } else if (werkzeug === 'hufe' && zeigerUnten) kratze(zx, zy);
      altX = zx; altY = zy;
    } else { zeigerUnten = false; strahl.visible = false; spritzer.visible = false; }
  }
  function kratze(x, y) {
    var beste = null, bd = 60;
    hufRinge.forEach(function (r) {
      if (r.rest <= 0) return;
      var b = bild(r.netz.position), d = Math.hypot(b.x - x, b.y - y);
      if (d < bd) { bd = d; beste = r; }
    });
    if (!beste) return;
    beste.rest--;
    KERN.huf(0.06, 900 + Math.random() * 500);
    if (beste.rest <= 0) {
      KERN.klang('gut');
      var offen = hufRinge.filter(function (r) { return r.rest > 0; }).length;
      P.st.hufe = offen / 4;
      if (!offen && warHufe) { warHufe = false; lohn(2, 'Alle Hufe sauber!'); HOFTAG.zaehle('hufe', 1); STAND.merke('hufe', 1); }
      zeigeFertig();
    }
  }
  function tippe(x, y) {
    if (werkzeug === 'hufe') kratze(x, y);
    else if (werkzeug === 'mist') {
      var beste = -1, bd = 55;
      box.mist.forEach(function (m, i) { var b = bild(m.position), d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; beste = i; } });
      if (beste < 0) return;
      var m = box.mist.splice(beste, 1)[0];
      hof.szene.remove(m);
      P.st.mist = box.mist.length / 8;
      KERN.ton(200, 0.08, 'square', 0.08); KERN.ton(140, 0.1, 'square', 0.08, 0.07);
      if (!box.mist.length) { P.st.mist = 0; if (warMistig) { warMistig = false; lohn(2, 'Box ausgemistet!'); HOFTAG.zaehle('box', 1); } }
      zeigeFertig();
    } else if (werkzeug === 'stroh') {
      if (P.st.mist > 0.3) { KERN.meldung('Erst ausmisten!', 'knapp'); return; }
      var p = bodenPunkt(x, y);
      if (!p || Math.abs(p.x - box.xc) > 1.9 || (p.z - box.zVorn) * box.v < 0 || (p.z - box.zHinten) * box.v > 0) return;
      for (var i = 0; i < 9; i++) {
        var halm = BAU.kasten(0.5 + Math.random() * 0.3, 0.025, 0.05, i % 2 ? 0xf0d878 : 0xe6c85a, hof.szene, p.x + (Math.random() - 0.5) * 1.1, 0.07 + Math.random() * 0.03, p.z + (Math.random() - 0.5) * 1.1);
        halm.rotation.y = Math.random() * Math.PI; halm.castShadow = false;
        halme.push(halm);
      }
      KERN.huf(0.04, 2400);
      var alt = P.st.stroh;
      P.st.stroh = Math.min(1, P.st.stroh + 0.13);
      if (P.st.stroh >= 1 && alt < 1 && warStroh) { warStroh = false; lohn(2, 'Frisch eingestreut!'); HOFTAG.zaehle('stroh', 1); }
      hof.zeigeZustand(P);
      zeigeFertig();
    }
  }

  function schritt(dt, zeit) {
    if (!P) return;
    if (drehZiel !== null) {
      P.kurs = Math.min(drehZiel, P.kurs + dt * 2.6);
      P.tier.wurzel.rotation.y = P.kurs;
      if (P.kurs >= drehZiel) { P.kurs = Math.atan2(Math.sin(drehZiel), Math.cos(drehZiel)); drehZiel = null; seiteGesagt = false; }
    }
    // Wasserstrahl, solange der Finger auf dem Pferd liegt
    if (werkzeug === 'schlauch' && zeigerUnten) {
      var t = putze(zx, zy, 2.4 * dt, 0.36, 0.28);
      maus.set(zx / window.innerWidth * 2 - 1, -(zy / window.innerHeight) * 2 + 1);
      wurf.setFromCamera(maus, hof.kamera);
      var ende = t ? t.point : v2.copy(wurf.ray.direction).multiplyScalar(5).add(wurf.ray.origin);
      v.set(0.45, -0.5, -0.9).applyMatrix4(hof.kamera.matrixWorld);
      strahl.position.copy(v);
      strahl.lookAt(ende); strahl.rotateX(Math.PI / 2);
      strahl.scale.set(1, v.distanceTo(ende), 1);
      strahl.visible = true;
      spritzer.visible = !!t;
      if (t) { spritzer.position.copy(t.point); spritzer.scale.setScalar(0.8 + Math.sin(zeit * 40) * 0.3); }
      strahlTon -= dt;
      if (strahlTon <= 0) { strahlTon = 0.07; KERN.huf(0.02, 3000 + Math.random() * 1500); }
    } else if (strahl.visible) { strahl.visible = false; spritzer.visible = false; }
    // Hufkreise folgen den Hufen
    hufRinge.forEach(function (r) {
      r.netz.visible = werkzeug === 'hufe';
      if (!r.netz.visible || !r.knochen) return;
      r.knochen.getWorldPosition(r.netz.position);
      r.netz.position.y = 0.12;
      r.netz.quaternion.copy(hof.kamera.quaternion);
      r.netz.material.color.setHex(r.rest > 0 ? 0xe5412d : 0x1faa3c);
      r.netz.scale.setScalar(r.rest > 0 ? 1 + Math.sin(zeit * 6) * 0.1 : 0.8);
    });
    hof.spielerin().figur.gelenke.rumpf.rotation.y = zeigerUnten ? Math.sin(zeit * 9) * 0.2 : 0;
    hudZeit -= dt;
    if (hudZeit <= 0) {
      hudZeit = 0.3;
      KERN.setzeHud(REITEN.kachel('Münzen', '🪙 ' + STAND.daten.muenzen) +
        REITEN.kachel(P.def.name, 'Sauber ' + REITEN.messer(1 - P.st.schmutz) + ' &nbsp;Hufe ' + REITEN.messer(1 - P.st.hufe) + (aussen ? '' : ' &nbsp;Box ' + REITEN.messer((1 - P.st.mist) * 0.5 + P.st.stroh * 0.5))));
    }
  }

  function ende(still) {
    if (!P) return;
    var pferd = P;
    P = null;
    pferd.versteckt = false;
    if (drehZiel !== null) { pferd.kurs = Math.atan2(Math.sin(drehZiel), Math.cos(drehZiel)); drehZiel = null; }
    if (box.front) box.front.visible = true;
    hof.szene.remove(strahl); hof.szene.remove(spritzer);
    hufRinge.forEach(function (r) { hof.szene.remove(r.netz); });
    hufRinge = [];
    halme.forEach(function (h2) { hof.szene.remove(h2); });
    halme = [];
    zeigerUnten = false;
    hof.setzeKamera(null);
    hof.zeigeWerkzeug(null);
    hof.setzeHinweis(null);
    hof.setzeModus('frei');
    var S = hof.spielerin();
    S.x = box.xc; S.z = box.zVorn + box.v * 0.8;
    if (box.fertig) box.fertig(pferd);
    STAND.speichere();
    hof.zeigeZustand(pferd);
  }

  return { start: start, schritt: schritt, zeiger: zeiger, ende: ende, pferd: function () { return P; }, waehle: waehle };
})();
