// ============================================================
//  HOFTAG  -  der Tag auf dem Pferdehof
//  Wohnhaus mit eigenem Zimmer (Bett, Kleiderschrank, Aufgabenbuch),
//  Tag und Nacht mit Schlafen, Aufgaben für jeden Tag, Schubkarre,
//  Fahrrad nach Hause, Hofkatze Minka und die Landschaft rundherum.
// ============================================================
var HOFTAG = (function () {
  'use strict';
  var d = STAND.daten, C = null, szene = null, S = null;
  var HAUS = { x0: 9, x1: 17, z0: -21, z1: -14, tuer: 13 };
  var BETT = [10.6, -20.1], SCHRANK = [15.9, -20.4], TISCH = [16.35, -17], REGAL = [9.45, -16.6], RAD = [20.5, -11.5], KARRE_PLATZ = [-13.3, -3.4], FUTTER_PLATZ = [7.2, 0.95];
  var KARRE_MAX = 10;
  var hausDach, fenster = [], lampen = [], zimmerTeile = {}, muehle, ballon, katze, misthaufen;
  var schlaeft = false, schaufelZeit = 0, letzteStunde = null, zeit = 0;

  if (typeof d.stunde !== 'number' || isNaN(d.stunde) || d.stunde < 6.5) d.stunde = 7;
  d.tag = d.tag || 1;
  d.sterne = d.sterne || 0;

  function imHaus(x, z) { return x > HAUS.x0 - 0.3 && x < HAUS.x1 + 0.3 && z > HAUS.z0 - 0.3 && z < HAUS.z1 + 0.3; }
  function nacht() { return d.stunde >= 21; }

  // ---------- Aufgaben für den Tag ----------
  function neueAufgaben() {
    var pool = TAGESAUFGABEN.filter(function (a) { return !(a[0] === 'fohlen' && d.fohlen && d.fohlen.wuchs >= 1); });
    function nimm(id) { for (var i = 0; i < pool.length; i++) if (pool[i][0] === id) return pool.splice(i, 1)[0]; }
    var wahl = [nimm('fuettern'), nimm(Math.random() < 0.5 ? 'box' : 'mist'), nimm('fohlenRein')];       // das Fohlen muss jeden Abend in seine Box
    while (wahl.length < 5 && pool.length) wahl.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    d.aufgaben = { tag: d.tag, bonus: false, liste: wahl.map(function (a) {
      var ziel = a[2] + Math.floor(Math.random() * (a[3] - a[2] + 1));
      return { id: a[0], text: a[1].replace('#', ziel), ziel: ziel, ist: 0, lohn: a[4] };
    }) };
    STAND.speichere();
  }
  if (!d.aufgaben || d.aufgaben.tag !== d.tag) neueAufgaben();
  function geschafft() { return d.aufgaben.liste.filter(function (a) { return a.ist >= a.ziel; }).length; }
  function zaehle(id, n) {
    var A = d.aufgaben, neu = false;
    A.liste.forEach(function (a) {
      if (a.id !== id || a.ist >= a.ziel) return;
      a.ist = Math.min(a.ziel, a.ist + (n || 1));
      if (a.ist >= a.ziel) {
        neu = true; d.muenzen += a.lohn;
        setTimeout(function () { KERN.meldung('✔ Aufgabe geschafft!  +' + a.lohn + ' 🪙', 'perfekt'); KERN.klang('perfekt'); }, 900);
      }
    });
    if (neu && !A.bonus && geschafft() === A.liste.length) {
      A.bonus = true; d.muenzen += 15; d.sterne++;
      setTimeout(function () { KERN.meldung('⭐ Alle Aufgaben für heute geschafft!  +15 🪙', 'perfekt'); KERN.klang('fanfare'); }, 2400);
    }
    if (neu) STAND.speichere();
  }
  function aufgabenHtml() {
    return '<div class="liste">' + d.aufgaben.liste.map(function (a) {
      var ok = a.ist >= a.ziel;
      return '<div class="eintrag' + (ok ? ' erledigt' : '') + '"><div class="bild">' + (ok ? '✅' : '⬜') + '</div><div class="text">' + a.text +
        (a.ziel > 1 && !ok ? ' <small>(' + a.ist + ' von ' + a.ziel + ')</small>' : '') + '</div><div class="lohnKlein">' + a.lohn + ' 🪙</div></div>';
    }).join('') + '</div>';
  }
  function zeigeAufgaben() {
    if (!C || schlaeft) return;
    var alle = geschafft() === d.aufgaben.liste.length;
    C.karte('<div class="klein">' + KALENDER.text() + ' · ' + WETTER.uhr() + ' Uhr</div><h2>📋 Aufgaben für heute</h2>' + aufgabenHtml() +
      '<div class="details">' + (alle ? '⭐ Alles geschafft! Morgen früh gibt es neue Aufgaben.' : 'Wenn du alle schaffst, gibt es <b>15 🪙</b> extra und einen <b>Tagesstern ⭐</b>. Morgen früh gibt es neue Aufgaben.') +
      '<br>Deine Tagessterne: <b>⭐ ' + d.sterne + '</b></div>', [{ text: 'Alles klar', aktion: C.frei }], true);
  }

  // ---------- Schlafen und der neue Tag ----------
  function blende(text, an) {
    var n = KERN.el('nacht');
    if (!n) { n = document.createElement('div'); n.id = 'nacht'; document.body.appendChild(n); }
    if (text) n.innerHTML = '<div>' + text + '</div>';
    void n.offsetWidth;
    n.classList.toggle('an', !!an);
  }
  function schlafe(art) {
    if (schlaeft) return;
    schlaeft = true;
    KERN.schliesseKarte(); C.setzeModus('karte');
    stelleKarreAb(true);
    var frueh = d.stunde >= 18 && d.stunde < 22 && art !== 'muede';
    blende(art === 'rad' ? '🚲<br>Du fährst nach Hause …' : art === 'muede' ? '😴<br>Dir fallen die Augen zu.<br><small>Lotte bringt dich ins Bett.</small>' : '🌙<br>Gute Nacht!<br><small>💤 💤 💤</small>', true);
    [392, 330, 262].forEach(function (f, i) { KERN.ton(f, 0.5, 'sine', 0.12, i * 0.35); });
    setTimeout(function () {
      var gestern = geschafft(), anzahl = d.aufgaben.liste.length, heim = C.bringeHeim();
      // über Nacht: die Pferde bekommen Hunger, die Boxen werden schmutzig
      C.pferde.forEach(function (P) {
        var st = P.st;
        if (!STAND.istMeins(P.def.id)) { STAND.versorge(st); st.hafer = 1; st.heu = 1; C.zeigeZustand(P, true); return; }     // die anderen Pferde versorgen die Hofkinder
        st.hunger = Math.min(1, st.hunger + 0.3); st.mist = Math.min(1, st.mist + 0.38); st.stroh = Math.max(0, st.stroh - 0.25);
        st.schmutz = Math.min(1, st.schmutz + 0.12); st.hufe = Math.min(1, st.hufe + 0.2); st.hafer = 0; st.heu = 0;
        C.zeigeZustand(P, true);
      });
      d.tag++; d.stunde = 7; d.hofMist = Math.min(HOFMIST_ORTE.length, (d.hofMist || 0) + 2); zeigeHofMist();
      var w = Math.random();
      WETTER.setze(7, w < 0.5 ? 'sonne' : w < 0.72 ? 'wolken' : w < 0.88 ? 'nebel' : 'regen');
      if (frueh) d.muenzen += 3;
      neueAufgaben();
      if (art === 'rad') { S.x = RAD[0] - 1.2; S.z = RAD[1] + 1.5; S.kurs = Math.PI; } else { S.x = BETT[0] + 0.4; S.z = BETT[1] + 1.3; S.kurs = 0; }
      letzteStunde = 7;
      STAND.speichere();
      blende(null, false);
      if (!SOUND.spiel('hahn', 0.6, 1, 0.4)) [523, 659, 784].forEach(function (f, i) { KERN.ton(f, 0.3, 'triangle', 0.14, 0.4 + i * 0.16); });
      setTimeout(function () {
        schlaeft = false;
        C.karte('<div class="klein">' + KALENDER.text() + ' · 7:00 Uhr · ' + WETTER.NAME[d.wetter] + '</div><h2>☀️ Guten Morgen!</h2>' +
          '<div class="details">' + (art === 'rad' ? 'Du bist wieder auf dem Hof.' : 'Du hast gut geschlafen.') + ' Gestern hast du <b>' + gestern + ' von ' + anzahl + '</b> Aufgaben geschafft.' +
          (heim.length ? '<br>Lotte hat ' + heim.join(' und ') + ' in den Stall gebracht.' : '') + (frueh ? '<br><b>+3 🪙</b> fürs frühe Schlafengehen.' : '') +
          '<br>Die Pferde haben Hunger, und die Boxen müssen gemistet werden.</div><h3 style="margin:8px 0 0;color:#7a3b12">📋 Deine Aufgaben heute</h3>' + aufgabenHtml(),
          [{ text: 'Auf geht’s!', aktion: C.frei }], true);
      }, 1300);
    }, 2300);
  }
  function fragSchlafen(art) {
    if (S.fuehrt) { KERN.meldung('Bring erst ' + S.fuehrt.def.name + ' in die Box!', 'knapp'); return; }
    if (HOFLEBEN.fuehrtFohlen()) { KERN.meldung('Bring erst das Fohlen in seine Box!', 'knapp'); return; }
    var offen = d.aufgaben.liste.length - geschafft();
    if (art === 'bett' && d.stunde < 18) {
      C.karte('<h2>🛏️ Dein Bett</h2><div class="details">Es ist erst ' + WETTER.uhr() + ' Uhr, du bist noch gar nicht müde. Schlafen kannst du ab 18 Uhr.' +
        (offen ? '<br>Heute sind noch <b>' + offen + '</b> Aufgaben offen.' : '') + '</div>', [{ text: '😴 Trotzdem bis morgen schlafen', klasse: 'zweit', aktion: function () { schlafe('bett'); } }]);
      return;
    }
    var html = art === 'rad' ? '<h2>🚲 Nach Hause fahren</h2><div class="details">Feierabend für heute? Du fährst nach Hause und kommst morgen früh wieder.'
      : '<h2>🛏️ Schlafen gehen</h2><div class="details">Es ist ' + WETTER.uhr() + ' Uhr. Morgen früh um 7 Uhr geht es weiter.';
    html += (offen ? '<br>Heute sind noch <b>' + offen + '</b> Aufgaben offen.' : '<br>⭐ Du hast heute alles geschafft!') + '</div>';
    C.karte(html, [{ text: art === 'rad' ? '🚲 Nach Hause' : '🌙 Gute Nacht', aktion: function () { schlafe(art); } }]);
  }

  // ---------- Kleiderschrank ----------
  var SCHRANK_ZEILEN = [['kappe', 'Reitkappe', 'klassisch', 'Klassisch'], ['frisur', 'Frisur'], ['oberteil', 'Oberteil', 'jacke', 'Reitjacke'], ['extra', 'Extras', 'ohne', 'Ohne']];
  function zeigeSchrank() {
    var o = KERN.spieler().outfit, schmal = window.innerWidth < 700;
    C.setzeModus('karte');
    S.x = SCHRANK[0] - 0.6; S.z = SCHRANK[1] + 1.7; S.kurs = 0;
    C.setzeKamera({ pos: new THREE.Vector3(S.x + (schmal ? 0 : 0.9), 1.35, S.z + 3.3), blick: new THREE.Vector3(S.x + (schmal ? 0 : 0.9), schmal ? 0.35 : 0.95, S.z) });
    S.figur.setzeHelm(true);
    KERN.zeigeKarte('seite', '<h2>👗 Kleiderschrank</h2><div class="details">Neue Kappen, Frisuren und Kleider gibt es im <b>Reitladen</b> im Stall.</div><div id="schrank" style="text-align:left"></div>',
      [{ text: 'Fertig', aktion: function () { KERN.schliesseKarte(); C.setzeKamera(null); S.figur.setzeOutfit(o); C.frei(); } }]);
    var kasten = document.getElementById('schrank');
    function zeile(name, eintraege, key, farben) {
      var z = document.createElement('div'); z.className = 'zeile';
      z.innerHTML = '<div class="zeilenName">' + name + '</div>';
      var kn = document.createElement('div'); kn.className = 'knoepfe';
      eintraege.forEach(function (e) {
        var b = document.createElement('button'); b.type = 'button';
        if (farben) { b.className = 'farbe'; b.style.background = e[0]; b.setAttribute('aria-label', name + ' ' + e[0]); } else { b.className = 'wahl'; b.textContent = e[1]; }
        if ((o[key] || eintraege[0][0]) === e[0]) b.classList.add('aktiv');
        b.addEventListener('click', function () {
          o[key] = e[0];
          S.figur.setzeOutfit(o); S.figur.setzeHelm(true);
          KERN.speichereSpieler(); KERN.ton(700, 0.06, 'triangle', 0.1);
          Array.prototype.forEach.call(kn.children, function (c) { c.classList.remove('aktiv'); });
          b.classList.add('aktiv');
        });
        kn.appendChild(b);
      });
      z.appendChild(kn); kasten.appendChild(z);
    }
    SCHRANK_ZEILEN.forEach(function (zl) {
      var liste = zl[0] === 'frisur' ? MODE.FRISUREN.slice(0, 3) : [[zl[2], zl[3]]];
      LADEN.forEach(function (w) { if (w.art === zl[0] && d.besitz[w.id]) liste.push([w.wert, w.name.replace(/^Frisur: /, '').replace(/^Reitkappe mit /, 'Mit ')]); });
      zeile(zl[1], liste, zl[0]);
    });
    zeile('Kappe auch zu Fuß auf dem Hof tragen', [[false, 'Nein'], [true, 'Ja']], 'kappeAuf');
    AUSWAHL.forEach(function (a) {
      if (['jacke', 'hose', 'helm', 'stiefel', 'haare'].indexOf(a.key) < 0) return;
      var farben = a.farben.slice();
      Object.keys(FARBPAKETE).forEach(function (id) { if (d.besitz[id] && FARBPAKETE[id][a.key]) farben = farben.concat(FARBPAKETE[id][a.key]); });
      zeile(a.key === 'helm' ? 'Farbe der Kappe' : a.name, farben.map(function (f) { return [f]; }), a.key, true);
    });
  }
  function zeigeRegal() {
    var abz = Object.keys(d.abzeichen || {}).length, L = d.leistung || {};
    function platz(n) { return n ? n + '. Platz' : 'noch nicht geritten'; }
    C.karte('<h2>🏆 Dein Pokalregal</h2><div class="details" style="text-align:left">' +
      '⭐ Tagessterne: <b>' + d.sterne + '</b><br>🎖️ Reitabzeichen: <b>' + abz + '</b><br>🏵️ Siegerschleifen: <b>' + (d.schleifen || 0) + '</b><br>' +
      '🏇 Springturnier: <b>' + platz(L.springTurnier) + '</b><br>🏁 Galopprennen: <b>' + platz(L.rennen) + '</b><br>🌲 Geländeritt: <b>' + platz(L.gelaende) + '</b><br>' +
      '📅 Du bist seit <b>' + d.tag + '</b> ' + (d.tag === 1 ? 'Tag' : 'Tagen') + ' auf dem Hof.</div>', []);
  }

  // ---------- Schubkarren und Mistgabel ----------
  // Zwei Karren: die Mistkarre (grün, westlich am Stall) und der Futterwagen (blau, in der Stallgasse).
  // Mist wird mit der Mistgabel aufgegabelt und in die Mistkarre geworfen, die man dann am Misthaufen auskippt.
  var karren = {}, gabel = null, flieger = [], hofMist = [];
  var HOFMIST_ORTE = [[6, 9.6], [-6.5, 10], [14.6, 1.6], [0.8, 16.5], [-9, -8], [15.5, -8.2]];
  function baueKarre(art, platz, kurs, farbe, dunkel) {
    var g = new THREE.Group(), kipp = new THREE.Group(), in2 = new THREE.Group();
    kipp.position.set(0, 0.21, 1.42); in2.position.set(0, -0.21, -1.42); g.add(kipp); kipp.add(in2);
    BAU.kasten(0.72, 0.36, 0.98, farbe, in2, 0, 0.5, 0.85);
    BAU.kasten(0.6, 0.02, 0.86, dunkel, in2, 0, 0.69, 0.85);
    var rad = BAU.walze(0.21, 0.21, 0.09, 0x222222, in2, 0, 0.21, 1.42, 14); rad.rotation.z = Math.PI / 2;
    for (var i = -1; i <= 1; i += 2) { BAU.kasten(0.04, 0.04, 0.9, 0x8a8f96, in2, i * 0.3, 0.6, 0.2); BAU.kasten(0.04, 0.42, 0.04, 0x8a8f96, in2, i * 0.3, 0.21, 0.5); }
    var statt = in2.children.slice(), last = new THREE.Group(); last.position.set(0, 0.62, 0.85); in2.add(last);
    var K = { art: art, g: g, kipp: kipp, last: last, platz: platz, kurs0: kurs, x: platz[0], z: platz[1], kurs: kurs, ladung: 0, geschoben: false, kippZeit: 0 };
    if (art === 'mist') {
      K.haufen = BAU.netz(new THREE.SphereGeometry(0.36, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x4a3320, last, 0, 0.02, 0);
      MODELLE3D.setze('schubkarre', in2, { z: 0.72, dreh: -Math.PI / 2, breite: 1.9, statt: statt });
    } else {
      // Futterwagen: blauer Kasten mit Hafersäcken, Heu und Möhren
      K.teile = [];
      for (i = 0; i < 6; i++) {
        var t = new THREE.Group(); last.add(t); K.teile.push(t);
        t.position.set(-0.17 + (i % 2) * 0.34, 0.1 + Math.floor(i / 2) * 0.17, -0.26 + Math.floor(i / 2) * 0.24);
        if (i % 2) BAU.kasten(0.3, 0.2, 0.26, i === 3 ? 0xc9b24e : 0xd3bb55, t, 0, 0, 0).rotation.y = i * 0.4;
        else { BAU.netz(new THREE.CapsuleGeometry(0.11, 0.14, 3, 8), 0xd8c08a, t, 0, 0, 0).rotation.z = Math.PI / 2; BAU.kasten(0.12, 0.02, 0.12, 0x2f6fb5, t, 0, 0.115, 0); }
      }
      for (i = 0; i < 3; i++) BAU.netz(new THREE.ConeGeometry(0.035, 0.2, 6), 0xf08a24, K.teile[0], -0.02 + i * 0.05, 0.12, 0.2).rotation.x = Math.PI / 2 + i * 0.3;
      var sch = BAU.kasten(0.5, 0.2, 0.02, 0xfff3c4, in2, 0, 0.5, 1.345); sch.castShadow = false;
      var tx = BAU.tafel('🌾 Futter', 0.16, { grund: null, farbe: '#7a3b12', schrift: 50 }); tx.position.set(0, 0.5, 1.36); in2.add(tx);
    }
    K.schild = BAU.schwebeText(art === 'mist' ? '🛒 Mistkarre' : '🌾 Futterwagen', 0.26, { schrift: 38 }); K.schild.position.set(0, 1.5, 0.8); g.add(K.schild);
    szene.add(g);
    g.position.set(K.x, 0, K.z); g.rotation.y = kurs;
    karren[art] = K;
    zeigeLadung(K);
    return K;
  }
  function baueGabel() {
    var g = new THREE.Group(), holz = 0xb98a55, eisen = 0x6b6f76;
    BAU.walze(0.018, 0.018, 1.25, holz, g, 0, 0.1, 0, 6);
    BAU.kasten(0.24, 0.02, 0.02, eisen, g, 0, -0.53, 0);
    for (var i = -1; i <= 1; i++) BAU.kasten(0.016, 0.3, 0.016, eisen, g, i * 0.11, -0.68, 0).rotation.x = 0.12;
    var klump = BAU.netz(new THREE.DodecahedronGeometry(0.15, 0), 0x4a3320, g, 0, -0.74, 0.05); klump.scale.set(1.3, 0.7, 1); klump.visible = false;
    szene.add(g);
    gabel = { g: g, klump: klump, platz: [STALL_W - 0.42, -2.5], inHand: false, aufKarre: false, voll: 0 };
    legeGabel();
    // Flugbahn für geworfenen Mist und Futter
    for (i = 0; i < 5; i++) { var f = BAU.netz(new THREE.DodecahedronGeometry(0.13, 0), 0x4a3320, szene); f.visible = false; flieger.push({ m: f, t: 9 }); }
    // Pferdeäpfel auf dem Hof
    HOFMIST_ORTE.forEach(function (o) { var m = BAU.netz(new THREE.DodecahedronGeometry(0.17, 0), 0x4a3320, szene, o[0], 0.12, o[1]); m.scale.y = 0.6; m.visible = false; hofMist.push(m); });
    if (typeof d.hofMist !== 'number') d.hofMist = 2;
    zeigeHofMist();
  }
  var STALL_W = -12;
  function zeigeHofMist() { hofMist.forEach(function (m, i) { m.visible = i < d.hofMist; }); }
  function legeGabel() {             // die Gabel dorthin, wo sie gerade hingehört
    var G = gabel, g = G.g, hand = S.figur.gelenke.handR;
    if (g.parent) g.parent.remove(g);
    if (G.inHand) { hand.add(g); g.position.set(0, 0, 0.02); g.rotation.set(1.25, 0, 0); }
    else if (G.aufKarre) { karren.mist.last.parent.add(g); g.position.set(0.33, 0.78, 0.55); g.rotation.set(1.62, 0, 0.1); }
    else { szene.add(g); g.position.set(G.platz[0], 0.78, G.platz[1]); g.rotation.set(0, 0, -0.28); }
    G.klump.visible = G.voll > 0;
  }
  function nimmGabel() { loslassen(); gabel.inHand = true; gabel.aufKarre = false; legeGabel(); KERN.ton(480, 0.07, 'triangle', 0.14); KERN.meldung('🔱 Mistgabel!', 'gut'); }
  function stelleGabelWeg(still) {
    if (!gabel || (!gabel.inHand && !gabel.aufKarre)) return;
    gabel.inHand = false; gabel.aufKarre = false; gabel.voll = 0; legeGabel();
    if (!still) { KERN.ton(360, 0.07, 'triangle', 0.12); KERN.meldung('Die Mistgabel lehnt wieder an der Stallwand.', 'gut'); }
  }
  function zeigeLadung(K) {
    if (K.art === 'mist') {
      K.haufen.visible = K.ladung > 0;
      var s = 0.35 + 0.65 * K.ladung / KARRE_MAX;
      K.haufen.scale.set(0.9, s * 1.1, 1.2);
    } else K.teile.forEach(function (t, i) { t.visible = i < K.ladung; });
  }
  function schiebt() { return karren.mist && karren.mist.geschoben ? karren.mist : karren.futter && karren.futter.geschoben ? karren.futter : null; }
  function nimmKarre(K) {
    loslassen();
    if (K.art === 'futter') stelleGabelWeg(true);
    else if (gabel.inHand && !gabel.voll) { gabel.inHand = false; gabel.aufKarre = true; legeGabel(); }
    K.geschoben = true; K.schild.visible = false;
    KERN.ton(420, 0.08, 'triangle', 0.14); KERN.meldung(K.art === 'mist' ? '🛒 Mistkarre!' : '🌾 Futterwagen!', 'gut');
  }
  function stelleKarreAb(heim) {
    ['mist', 'futter'].forEach(function (art) {
      var K = karren[art];
      if (!K) return;
      if (heim) { K.x = K.platz[0]; K.z = K.platz[1]; K.kurs = K.kurs0; K.g.position.set(K.x, 0, K.z); K.g.rotation.y = K.kurs; }
      else if (K.geschoben) KERN.ton(360, 0.08, 'triangle', 0.12);
      if (K.geschoben && art === 'mist' && gabel.aufKarre && !heim) { gabel.aufKarre = false; gabel.inHand = true; legeGabel(); }
      K.geschoben = false; K.schild.visible = true;
    });
    if (heim) stelleGabelWeg(true);
  }
  function loslassen() { stelleKarreAb(); }
  function wirf(von, nach, farbe, gross, fertig) {
    var f = flieger.sort(function (a, b) { return b.t - a.t; })[0];
    f.t = 0; f.von = von; f.nach = nach; f.fertig = fertig; f.m.material = BAU.mat(farbe); f.m.scale.setScalar(gross || 1); f.m.visible = true;
  }
  function handPunkt() { return [S.x + Math.sin(S.kurs) * 0.6, 0.5, S.z + Math.cos(S.kurs) * 0.6]; }
  function karrenPunkt(K) { return [K.x + Math.sin(K.kurs) * 0.85, 0.75, K.z + Math.cos(K.kurs) * 0.85]; }
  // Mist in der Nähe: [Abstand, Box oder null, Netz, Nummer]
  function naherMist() {
    var beste = null;
    function pruefe(m, box, nr) { var e = Math.hypot(S.x - m.position.x, S.z - m.position.z); if (e < 1.45 && (!beste || e < beste.e)) beste = { e: e, box: box, m: m, nr: nr }; }
    C.boxen.forEach(function (b) { b.mist.forEach(function (m, i) { pruefe(m, b, i); }); });
    hofMist.forEach(function (m, i) { if (i < d.hofMist) pruefe(m, null, i); });
    return beste;
  }
  function gabelAuf(ziel) {
    var n = 0, K = karren.mist, mx = ziel.m.position.x, mz = ziel.m.position.z;
    S.kurs = Math.atan2(mx - S.x, mz - S.z);
    if (ziel.box) {
      var b = ziel.box, rest = [];
      b.mist.forEach(function (m) { if (n < 2 && Math.hypot(m.position.x - mx, m.position.z - mz) < 0.75) { szene.remove(m); n++; } else rest.push(m); });
      b.mist.length = 0; rest.forEach(function (m) { b.mist.push(m); });
      if (b.pferd) {
        b.pferd.st.mist = b.mist.length / 8;
        if (!b.mist.length) { d.muenzen += 2; setTimeout(function () { KERN.meldung('Box ausgemistet!  +2 🪙', 'perfekt'); KERN.klang('gut'); }, 500); zaehle('box', 1); }
      }
    } else { n = 1; d.hofMist = Math.max(0, d.hofMist - 1); var letzter = hofMist[d.hofMist]; ziel.m.position.x = letzter.position.x; ziel.m.position.z = letzter.position.z; letzter.position.set(mx, 0.12, mz); zeigeHofMist(); }
    gabel.voll = n; gabel.klump.visible = true; schaufelZeit = 0.5;
    if (!SOUND.spiel('gabel', 0.8)) { KERN.ton(240, 0.07, 'triangle', 0.16); KERN.ton(180, 0.09, 'triangle', 0.14, 0.12); }
    // steht die Mistkarre gleich daneben, fliegt der Mist sofort hinein
    if (!K.geschoben && K.ladung < KARRE_MAX && Math.hypot(S.x - K.x, S.z - K.z) < 4.6) setTimeout(function () { if (gabel.voll) wirfInKarre(); }, 380);
    STAND.speichere();
  }
  function wirfInKarre() {
    var K = karren.mist, n = Math.min(gabel.voll, KARRE_MAX - K.ladung);
    if (n <= 0) { KERN.meldung('Die Schubkarre ist voll! Kipp sie am Misthaufen aus.', 'knapp'); return; }
    gabel.voll -= n; gabel.klump.visible = gabel.voll > 0; schaufelZeit = 0.45;
    S.kurs = Math.atan2(K.x - S.x, K.z - S.z);
    wirf(handPunkt(), karrenPunkt(K), 0x4a3320, 1, function () { K.ladung += n; zeigeLadung(K); if (!SOUND.spiel('schaufel', 0.6)) KERN.ton(150, 0.08, 'square', 0.1); if (K.ladung >= KARRE_MAX) KERN.meldung('Die Schubkarre ist voll!', 'knapp'); });
  }
  function wirfAufHaufen() {
    var n = gabel.voll, M = C.ORT.mist;
    gabel.voll = 0; gabel.klump.visible = false; schaufelZeit = 0.45;
    S.kurs = Math.atan2(M[0] - S.x, M[1] - S.z);
    wirf(handPunkt(), [M[0], 0.9, M[1]], 0x4a3320, 1, function () { bucheMist(n, true); });
  }
  function bucheMist(n, still) {
    var lohn = Math.ceil(n / 2);
    d.muenzen += lohn; d.misthaufen = (d.misthaufen || 0) + n;
    if (!still) { KERN.meldung('Mist abgeladen!  +' + lohn + ' 🪙', 'perfekt'); KERN.klang('gut'); } else if (!SOUND.spiel('schaufel', 0.6)) KERN.ton(150, 0.08, 'square', 0.1);
    zaehle('mist', n);
    if (d.misthaufen >= 60) {
      d.misthaufen = 0; d.muenzen += 12;
      setTimeout(function () { KERN.meldung('🚜 Der Bauer holt den Mist für sein Feld.  +12 🪙', 'perfekt'); }, 1800);
    }
    zeigeHaufen();
    STAND.speichere();
  }
  function ladeAb() {
    var K = karren.mist, n = K.ladung;
    K.kippZeit = 1.1; schaufelZeit = 0.9;
    setTimeout(function () { K.ladung = 0; zeigeLadung(K); bucheMist(n); }, 450);
  }
  function beladeFutter() {
    var K = karren.futter;
    K.ladung = 6; zeigeLadung(K); schaufelZeit = 0.6;
    KERN.ton(420, 0.08, 'triangle', 0.12); KERN.ton(520, 0.08, 'triangle', 0.12, 0.12);
    KERN.meldung('🌾 Hafer, Heu und Möhren für sechs Pferde aufgeladen!', 'gut');
  }
  function fuettereAusWagen(P) {
    var K = karren.futter, b = P.box;
    K.ladung--; zeigeLadung(K); schaufelZeit = 0.5;
    wirf(karrenPunkt(K), [b.raufe[0], 1.5, b.raufe[1]], 0xd3bb55, 1.5, null);
    setTimeout(function () { wirf(karrenPunkt(K), [b.trog[0], 0.9, b.trog[1]], 0xd9b96a, 1, function () { C.fuettereWagen(P); }); }, 200);
    if (!K.ladung) setTimeout(function () { KERN.meldung('Der Futterwagen ist leer.', 'knapp'); }, 1600);
  }
  // Box, vor deren Tür (oder in der) man gerade steht
  function boxInDerNaehe() {
    var b = C.inBoxVon(S.x, S.z), bd = 2.7;
    if (b) return b;
    C.boxen.forEach(function (k) { var e = Math.hypot(S.x - k.xc, S.z - k.zVorn); if (e < bd) { bd = e; b = k; } });
    return b;
  }
  function zeigeHaufen() {
    if (!misthaufen) return;
    var s = 0.25 + Math.min(1, (d.misthaufen || 0) / 60) * 0.9, m = C.mistModell && C.mistModell();
    misthaufen.scale.set(s, s * 0.75, s);
    if (m) { misthaufen.visible = false; m.scale.setScalar(0.72 + s * 0.4); }
  }

  // ---------- Bauen ----------
  function wand(x0, z0, x1, z1, h, farbe, eltern, y) {
    var b = Math.max(0.2, Math.abs(x1 - x0)), t = Math.max(0.2, Math.abs(z1 - z0));
    var m = BAU.kasten(b, h, t, farbe, eltern || szene, (x0 + x1) / 2, (y || 0) + h / 2, (z0 + z1) / 2);
    if (!eltern) C.waende.push([Math.min(x0, x1) - 0.1, Math.min(z0, z1) - 0.1, Math.max(x0, x1) + 0.1, Math.max(z0, z1) + 0.1]);
    return m;
  }
  function flaeche(x0, z0, x1, z1, farbe, y) {
    var f = BAU.netz(new THREE.PlaneGeometry(x1 - x0, z1 - z0), farbe, szene, (x0 + x1) / 2, y || 0.012, (z0 + z1) / 2);
    f.rotation.x = -Math.PI / 2; f.castShadow = false;
    return f;
  }
  function leucht(farbe) { return new THREE.MeshStandardMaterial({ color: farbe, emissive: farbe, emissiveIntensity: 0, roughness: 0.6 }); }

  function baueHaus() {
    var H = HAUS, W = 0xf3ead8, HOEHE = 2.8, t = H.tuer, i;
    flaeche(H.x0, H.z0, H.x1, H.z1, 0xc79a63, 0.035);                      // Holzboden
    flaeche(t - 1.6, H.z1, t + 1.6, -9, 0xd9c9a3);                         // Weg zur Tür
    wand(H.x0, H.z0, H.x1, H.z0, HOEHE, W); wand(H.x0, H.z0, H.x0, H.z1, HOEHE, W); wand(H.x1, H.z0, H.x1, H.z1, HOEHE, W);
    wand(H.x0, H.z1, t - 0.9, H.z1, 1.1, W); wand(t + 0.9, H.z1, H.x1, H.z1, 1.1, W);
    hausDach = new THREE.Group(); szene.add(hausDach);
    wand(H.x0, H.z1, t - 0.9, H.z1, HOEHE - 1.1, W, hausDach, 1.1); wand(t + 0.9, H.z1, H.x1, H.z1, HOEHE - 1.1, W, hausDach, 1.1);
    BAU.kasten(1.8, 0.7, 0.2, W, hausDach, t, HOEHE - 0.35, H.z1);
    var breit = H.x1 - H.x0 + 1.0, tief = (H.z1 - H.z0) / 2 + 0.6, hoch = 2.2, mz = (H.z0 + H.z1) / 2, mx = (H.x0 + H.x1) / 2;
    [-1, 1].forEach(function (v) {
      var dd = BAU.kasten(breit, 0.14, Math.hypot(tief, hoch), 0x5b6f8f, hausDach, mx, HOEHE + hoch / 2, mz + v * tief / 2);
      dd.rotation.x = v * Math.atan2(hoch, tief);
    });
    [H.x0, H.x1].forEach(function (x) {
      var gs = new THREE.Shape(); gs.moveTo(-tief + 0.5, 0); gs.lineTo(tief - 0.5, 0); gs.lineTo(0, hoch - 0.2); gs.closePath();
      var gm = BAU.netz(new THREE.ShapeGeometry(gs), new THREE.MeshStandardMaterial({ color: W, side: THREE.DoubleSide, roughness: 0.9 }), hausDach, x, HOEHE, mz);
      gm.rotation.y = Math.PI / 2;
    });
    BAU.kasten(0.7, 1.6, 0.7, 0xa9432f, hausDach, H.x1 - 1.6, HOEHE + 1.6, mz - 1);
    var hausAlt = hausDach.children.slice();
    var schild = BAU.tafel('🏠 Dein Zimmer', 0.5, { farbe: '#7a3b12' }); schild.position.set(t, 2.45, H.z1 + 0.13); hausDach.add(schild);
    // das Haus von aussen als 3D-Modell (verschwindet wie das Dach, wenn man drinnen ist)
    MODELLE3D.setze('wohnhaus', hausDach, { x: mx - 0.5, z: mz + 0.15, dreh: -Math.PI / 2, masse: [9.9, 6.6, 10.2], fertig: function () {
      hausAlt.forEach(function (a) { a.visible = false; }); schild.position.set(t, 3.0, H.z1 + 1.0);
    } });
    // Fenster (leuchten nachts) und Lampe über der Tür
    var glas = leucht(0xffe9a8); glas.color.set(0xbfe3f7);
    [[H.x0 + 1.8, H.z1 + 0.11], [H.x1 - 1.8, H.z1 + 0.11]].forEach(function (p) { BAU.kasten(1.2, 0.9, 0.06, glas, hausDach, p[0], 1.85, p[1]); });
    BAU.kasten(1.6, 1.0, 0.06, glas, szene, mx, 1.7, H.z0 + 0.12);
    BAU.kasten(0.06, 1.0, 1.4, glas, szene, H.x0 - 0.11, 1.7, mz); BAU.kasten(0.06, 1.0, 1.4, glas, szene, H.x1 + 0.11, 1.7, mz);
    fenster.push(glas);
    function laterne(x, z, hoehe) {
      BAU.walze(0.05, 0.07, hoehe, 0x3a3a3a, szene, x, hoehe / 2, z, 8);
      var m = leucht(0xffd98a); BAU.netz(new THREE.SphereGeometry(0.2, 10, 8), m, szene, x, hoehe + 0.15, z).castShadow = false;
      var l = new THREE.PointLight(0xffc977, 0, 22, 1.6); l.position.set(x, hoehe + 0.1, z); szene.add(l);
      lampen.push({ m: m, l: l }); C.kreise.push([x, z, 0.15, 0, 0]);
    }
    laterne(t + 2.2, -12.6, 2.6); laterne(9.6, 4.2, 2.8); laterne(-13.6, -1.9, 2.8);

    // --- Möbel ---
    var HOLZ = 0x9a6b3f, bx = BETT[0], bz = BETT[1], ab = szene.children.length;
    function modell(name, o) { o.statt = szene.children.slice(ab); o.schatten = false; MODELLE3D.setze(name, szene, o); ab = szene.children.length; }   // ersetzt die Klötze seit dem letzten Aufruf
    BAU.kasten(2.1, 0.35, 1.1, HOLZ, szene, bx, 0.2, bz); BAU.kasten(2.0, 0.16, 1.0, 0xffffff, szene, bx, 0.45, bz);
    BAU.kasten(1.35, 0.1, 1.04, 0xff8fc0, szene, bx + 0.33, 0.56, bz); BAU.kasten(0.45, 0.12, 0.7, 0xfff3c4, szene, bx - 0.72, 0.58, bz);
    BAU.kasten(0.12, 0.9, 1.1, HOLZ, szene, bx - 1.05, 0.45, bz);
    C.waende.push([bx - 1.1, bz - 0.6, bx + 1.1, bz + 0.6]);
    modell('bett', { x: bx, z: bz, dreh: Math.PI / 2, masse: [1.2, 1.0, 2.2] });
    BAU.kasten(1.7, 2.1, 0.6, 0xb98a55, szene, SCHRANK[0], 1.05, SCHRANK[1]); BAU.kasten(0.03, 1.9, 0.02, 0x6b4a2a, szene, SCHRANK[0], 1.05, SCHRANK[1] + 0.31);
    for (i = -1; i <= 1; i += 2) BAU.netz(new THREE.SphereGeometry(0.04, 8, 6), 0xf2c230, szene, SCHRANK[0] + i * 0.1, 1.05, SCHRANK[1] + 0.33);
    C.waende.push([SCHRANK[0] - 0.9, SCHRANK[1] - 0.4, SCHRANK[0] + 0.9, SCHRANK[1] + 0.35]);
    modell('schrank', { x: SCHRANK[0], z: SCHRANK[1], dreh: -Math.PI / 2, masse: [0.75, 2.15, 1.7] });
    BAU.kasten(0.7, 0.06, 1.5, HOLZ, szene, TISCH[0], 0.75, TISCH[1]);
    [[-0.28, -0.65], [0.28, -0.65], [-0.28, 0.65], [0.28, 0.65]].forEach(function (p) { BAU.kasten(0.06, 0.75, 0.06, 0x7a4a2a, szene, TISCH[0] + p[0], 0.37, TISCH[1] + p[1]); });
    BAU.kasten(0.34, 0.05, 0.46, 0xe84393, szene, TISCH[0], 0.81, TISCH[1]).rotation.y = 0.2;
    BAU.kasten(0.3, 0.02, 0.42, 0xffffff, szene, TISCH[0], 0.845, TISCH[1]).rotation.y = 0.2;
    BAU.kasten(0.4, 0.45, 0.4, 0xb98a55, szene, TISCH[0] - 0.75, 0.22, TISCH[1]);
    C.waende.push([TISCH[0] - 0.4, TISCH[1] - 0.8, TISCH[0] + 0.4, TISCH[1] + 0.8]);
    modell('schreibtisch', { x: TISCH[0] - 0.25, z: TISCH[1], dreh: Math.PI, masse: [1.45, 1.3, 1.5] });
    BAU.kasten(0.35, 1.5, 1.5, HOLZ, szene, REGAL[0], 0.75, REGAL[1]);
    [0.55, 1.05, 1.52].forEach(function (y, k) {
      for (i = 0; i < 3; i++) {
        var p = BAU.netz(new THREE.CylinderGeometry(0.07, 0.035, 0.16, 8), k === 1 ? 0xc8ccd2 : 0xf2c230, szene, REGAL[0] + 0.19, y + 0.02, REGAL[1] - 0.45 + i * 0.45);
        p.visible = k * 3 + i < 2 + d.sterne;
        zimmerTeile['pokal' + (k * 3 + i)] = p;
      }
    });
    C.waende.push([REGAL[0] - 0.25, REGAL[1] - 0.8, REGAL[0] + 0.25, REGAL[1] + 0.8]);
    modell('pokalregal', { x: REGAL[0] - 0.05, z: REGAL[1], masse: [0.6, 1.8, 1.5], fertig: function () { zimmerTeile.regalModell = true; zeigeZimmer(); } });

    // --- Sachen aus dem Reitladen ---
    function teil(id) { var g = new THREE.Group(); szene.add(g); zimmerTeile[id] = g; return g; }
    var g = teil('z_teppich');
    var tp = BAU.netz(new THREE.CircleGeometry(1.6, 28), 0xffb3d1, g, 13, 0.05, -17.4); tp.rotation.x = -Math.PI / 2; tp.castShadow = false;
    var tp2 = BAU.netz(new THREE.RingGeometry(1.25, 1.42, 28), 0xffffff, g, 13, 0.055, -17.4); tp2.rotation.x = -Math.PI / 2; tp2.castShadow = false;
    g = teil('z_poster');
    var po = BAU.tafel('🐴', 1.0, { grund: '#bfe3f7', schrift: 110 }); po.position.set(11.2, 1.75, H.z0 + 0.13); g.add(po);
    var po2 = BAU.tafel('🦄', 0.8, { grund: '#ffe3f0', schrift: 110 }); po2.position.set(15.0, 2.45, H.z0 + 0.13); g.add(po2);
    g = teil('z_pflanze');
    BAU.walze(0.22, 0.16, 0.36, 0xc0623a, g, 16.4, 0.18, -14.7, 10);
    for (i = 0; i < 6; i++) { var bl = BAU.netz(new THREE.SphereGeometry(0.2, 7, 5), 0x3f9a46, g, 16.4 + Math.sin(i * 1.05) * 0.2, 0.62 + (i % 2) * 0.22, -14.7 + Math.cos(i * 1.05) * 0.2); bl.scale.set(0.6, 1.3, 0.6); }
    g = teil('z_lichter');
    var lf = [0xffe36b, 0xff6fae, 0x7ad7ff, 0x9cf08a];
    zimmerTeile.lichterMat = lf.map(leucht);
    for (i = 0; i < 16; i++) BAU.netz(new THREE.SphereGeometry(0.06, 6, 5), zimmerTeile.lichterMat[i % 4], g, H.x0 + 0.5 + i * 0.47, 2.45 - Math.abs(Math.sin(i * 0.8)) * 0.18, H.z0 + 0.16).castShadow = false;
    g = teil('z_kuschel');
    BAU.netz(new THREE.SphereGeometry(0.14, 8, 6), 0xd9a55a, g, bx + 0.2, 0.74, bz + 0.1).scale.set(1, 0.8, 1.5);
    BAU.netz(new THREE.SphereGeometry(0.09, 8, 6), 0xd9a55a, g, bx + 0.2, 0.9, bz + 0.32).scale.set(0.8, 0.9, 1.3);
    BAU.kasten(0.03, 0.14, 0.2, 0xffffff, g, bx + 0.2, 0.9, bz + 0.16);
    g = teil('z_sitzsack');
    BAU.netz(new THREE.SphereGeometry(0.55, 12, 8), 0x8e6fd8, g, 10.3, 0.3, -15.2).scale.set(1, 0.6, 1);
    C.kreise.push([10.3, -15.2, 0.01, 0, 0]);
    g = teil('z_bett');
    [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(function (p) { BAU.walze(0.035, 0.035, 2.0, 0xffffff, g, bx + p[0], 1.0, bz + p[1], 6); });
    BAU.kasten(2.15, 0.05, 1.15, 0xffc7de, g, bx, 2.0, bz);
    var vh = new THREE.MeshStandardMaterial({ color: 0xffd9e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 1 });
    BAU.netz(new THREE.PlaneGeometry(2.1, 1.4), vh, g, bx, 1.3, bz - 0.52).castShadow = false;
    var vs = BAU.netz(new THREE.PlaneGeometry(1.05, 1.4), vh, g, bx - 1.0, 1.3, bz); vs.rotation.y = Math.PI / 2; vs.castShadow = false;
    g = teil('z_korb');
    BAU.walze(0.4, 0.32, 0.2, 0xb9843c, g, 12, 0.1, -14.9, 12); BAU.walze(0.33, 0.33, 0.06, 0xff8fc0, g, 12, 0.2, -14.9, 12);
    baueGemuetlich();
    zeigeZimmer();
  }
  // ---------- gemütliche Einrichtung: steht von Anfang an im Zimmer ----------
  var FAKTEN = [
    'Pferde können im Stehen schlafen. Zum Träumen legen sie sich aber hin.',
    'Ein Pferd sieht fast rundherum, nur direkt hinter sich nicht. Darum spricht man es von hinten immer an.',
    'An den Ohren erkennst du die Laune: nach vorn heißt neugierig, flach nach hinten heißt „Lass mich!“.',
    'Fohlen stehen schon in der ersten Stunde nach der Geburt auf eigenen Beinen.',
    'Pferde trinken an einem Tag 30 bis 60 Liter Wasser. Das sind drei bis sechs Putzeimer!',
    'Ein Hufeisen bringt Glück, sagt man. Aber nur, wenn die Öffnung nach oben zeigt.',
    'Die Größe von Pferden misst man am Widerrist, dem höchsten Punkt des Rückens.',
    'Ponys sind nicht einfach kleine Pferde: Sie sind oft besonders stark und ganz schön schlau.',
    'Pferde begrüßen ihre Freunde mit einem leisen Brummeln. Das heißt „Schön, dass du da bist!“.',
    'Beim Galopp gibt es einen Moment, in dem alle vier Hufe in der Luft sind.',
    'Pferde können nicht durch den Mund atmen, nur durch die Nüstern.',
    'Vor dem Reiten immer die Hufe auskratzen: Ein Steinchen im Huf drückt wie ein Stein im Schuh.'
  ];
  var gemuetlich = { fische: [], schaukel: null, schubs: 0, uhr: null, buch: 0, futter: 0, musik: 0 };
  function baueGemuetlich() {
    var H = HAUS, i, HOLZ = 0x9a6b3f, HELL = 0xc79a63, bx = BETT[0], bz = BETT[1];
    function tk(b, h, t, f, x, y, z, e) { var m = BAU.kasten(b, h, t, f, e || szene, x, y, z); m.castShadow = false; return m; }
    // Wandsockel in warmem Ton mit weißer Leiste
    tk(H.x1 - H.x0 - 0.2, 1.0, 0.02, 0xf6d7c0, (H.x0 + H.x1) / 2, 0.5, H.z0 + 0.115); tk(H.x1 - H.x0 - 0.2, 0.05, 0.035, 0xffffff, (H.x0 + H.x1) / 2, 1.02, H.z0 + 0.12);
    [H.x0 + 0.115, H.x1 - 0.115].forEach(function (x) { tk(0.02, 1.0, H.z1 - H.z0 - 0.2, 0xf6d7c0, x, 0.5, (H.z0 + H.z1) / 2); tk(0.035, 0.05, H.z1 - H.z0 - 0.2, 0xffffff, x, 1.02, (H.z0 + H.z1) / 2); });
    // Vorhänge am Nordfenster und am Ostfenster
    var stoff = new THREE.MeshStandardMaterial({ color: 0xe9607f, roughness: 1 });
    tk(2.3, 0.04, 0.04, 0x7a4a2a, 13, 2.32, H.z0 + 0.17);
    [-1, 1].forEach(function (v) { for (i = 0; i < 3; i++) tk(0.13, 1.25, 0.05 + (i % 2) * 0.03, i % 2 ? 0xf7a3b5 : stoff, 13 + v * (0.86 + i * 0.12), 1.68, H.z0 + 0.17); });
    tk(0.04, 0.04, 2.1, 0x7a4a2a, H.x1 - 0.17, 2.32, -17.5);
    [-1, 1].forEach(function (v) { for (i = 0; i < 3; i++) tk(0.05 + (i % 2) * 0.03, 1.25, 0.13, i % 2 ? 0xf7a3b5 : stoff, H.x1 - 0.17, 1.68, -17.5 + v * (0.76 + i * 0.12)); });
    // Blumentopf auf der Fensterbank
    tk(1.5, 0.05, 0.22, 0xffffff, 13, 1.17, H.z0 + 0.22);
    BAU.walze(0.09, 0.07, 0.14, 0xc0623a, szene, 13.4, 1.27, H.z0 + 0.24, 8).castShadow = false;
    [0xff6fae, 0xffd23f, 0xff6fae].forEach(function (f, k) { BAU.netz(new THREE.SphereGeometry(0.06, 6, 5), f, szene, 13.34 + k * 0.06, 1.42 + (k % 2) * 0.05, H.z0 + 0.24).castShadow = false; });
    // Nachttisch mit Lampe (leuchtet abends)
    BAU.kasten(0.5, 0.5, 0.45, HOLZ, szene, 12.05, 0.25, -20.6); tk(0.42, 0.02, 0.02, 0x6b4a2a, 12.05, 0.32, -20.37);
    BAU.walze(0.03, 0.08, 0.22, 0xffffff, szene, 12.05, 0.61, -20.6, 8).castShadow = false;
    var schirm = leucht(0xffd98a); schirm.emissiveIntensity = 0.25;
    BAU.netz(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 10), schirm, szene, 12.05, 0.8, -20.6).castShadow = false;
    var nl = new THREE.PointLight(0xffc977, 0, 9, 1.8); nl.position.set(12.05, 1.2, -20.2); szene.add(nl);
    lampen.push({ m: schirm, l: nl });
    C.waende.push([11.8, -20.85, 12.3, -20.35]);
    // Bücherregal unter dem Fenster
    BAU.kasten(1.4, 1.0, 0.36, HOLZ, szene, 13.6, 0.5, -20.72);
    tk(1.3, 0.38, 0.02, 0x5a3a20, 13.6, 0.27, -20.53); tk(1.3, 0.38, 0.02, 0x5a3a20, 13.6, 0.73, -20.53);
    var bunt = [0xe84393, 0x3f8fd6, 0xf2c230, 0x45b36b, 0x8e6fd8, 0xe8603c, 0x37b5b0];
    [0.25, 0.71].forEach(function (y, r) { for (i = 0; i < 11; i++) tk(0.085, 0.24 + ((i * 7 + r * 3) % 5) * 0.022, 0.04, bunt[(i + r * 3) % 7], 13.05 + i * 0.105, y + ((i * 7 + r * 3) % 5) * 0.011, -20.52); });
    BAU.netz(new THREE.SphereGeometry(0.14, 12, 9), 0x4aa3df, szene, 14.05, 1.22, -20.72).castShadow = false;                      // Globus
    BAU.walze(0.07, 0.1, 0.08, 0x7a4a2a, szene, 14.05, 1.04, -20.72, 8).castShadow = false;
    tk(0.26, 0.2, 0.03, 0xffffff, 13.1, 1.11, -20.74).rotation.x = -0.2; tk(0.2, 0.14, 0.035, 0x9bd0f5, 13.1, 1.11, -20.735).rotation.x = -0.2;   // Fotorahmen
    C.waende.push([12.9, -20.9, 14.3, -20.5]);
    // Kommode an der Westwand mit Spieluhr
    BAU.kasten(0.5, 0.8, 0.9, HELL, szene, 9.42, 0.4, -18.6);
    [0.2, 0.45, 0.68].forEach(function (y) { tk(0.02, 0.2, 0.8, 0xdcb98a, 9.68, y, -18.6); BAU.netz(new THREE.SphereGeometry(0.03, 6, 5), 0xf2c230, szene, 9.7, y, -18.6).castShadow = false; });
    var su = new THREE.Group(); su.position.set(9.4, 0.8, -18.3); szene.add(su); gemuetlich.uhr = su;
    tk(0.2, 0.1, 0.2, 0xff8fc0, 0, 0.05, 0, su); var tz = BAU.netz(new THREE.ConeGeometry(0.05, 0.14, 6), 0xffffff, su, 0, 0.17, 0); tz.castShadow = false; gemuetlich.taenzer = tz;
    C.waende.push([9.15, -19.07, 9.7, -18.13]);
    // Bilder und Siegerschleifen an den Wänden
    [['🐴', '#fde7c7', -19.0], ['🌅', '#cfe9ff', -18.2]].forEach(function (e, k) { var b = BAU.tafel(e[0], 0.5, { grund: e[1], schrift: 110 }); b.position.set(H.x0 + 0.13, 1.9 - k * 0.25, e[2]); b.rotation.y = Math.PI / 2; szene.add(b); });
    [0xe8413c, 0x3f8fd6, 0xf2c230].forEach(function (f, k) {
      var x = 14.75 + k * 0.0, y = 2.3 - k * 0.0; x = 12.15 + k * 0.28; y = 2.25;
      var r = BAU.netz(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12), f, szene, x, y, H.z0 + 0.14); r.rotation.x = Math.PI / 2; r.castShadow = false;
      tk(0.035, 0.2, 0.012, f, x - 0.03, y - 0.15, H.z0 + 0.135).rotation.z = -0.15; tk(0.035, 0.2, 0.012, f, x + 0.03, y - 0.15, H.z0 + 0.135).rotation.z = 0.15;
    });
    // Wimpelkette an der Ostwand
    for (i = 0; i < 11; i++) { var wi = BAU.netz(new THREE.ConeGeometry(0.11, 0.24, 3), bunt[i % 7], szene, H.x1 - 0.14, 2.52 - Math.sin(i / 10 * Math.PI) * 0.16, -20.3 + i * 0.56); wi.rotation.set(Math.PI, 0, 0); wi.scale.x = 0.15; wi.castShadow = false; }
    // Wanduhr
    var uhr = BAU.netz(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), 0xffffff, szene, 14.6, 2.3, H.z0 + 0.14); uhr.rotation.x = Math.PI / 2; uhr.castShadow = false;
    var ur = BAU.netz(new THREE.TorusGeometry(0.2, 0.025, 6, 20), 0xe84393, szene, 14.6, 2.3, H.z0 + 0.15); ur.castShadow = false;
    gemuetlich.zeiger = [tk(0.02, 0.13, 0.01, 0x333333, 0, 0.065, 0, new THREE.Group()), tk(0.014, 0.17, 0.01, 0x333333, 0, 0.085, 0, new THREE.Group())].map(function (m) { var g2 = m.parent; g2.position.set(14.6, 2.3, H.z0 + 0.17); szene.add(g2); return g2; });
    // Bettvorleger, Kissen und Kuscheldecke
    var vl = BAU.netz(new THREE.CircleGeometry(0.75, 20), 0xf6e3b4, szene, 10.9, 0.045, -19.1); vl.rotation.x = -Math.PI / 2; vl.scale.set(1.5, 0.75, 1); vl.castShadow = false;
    var vl2 = BAU.netz(new THREE.RingGeometry(0.5, 0.6, 20), 0xe9607f, szene, 10.9, 0.05, -19.1); vl2.rotation.x = -Math.PI / 2; vl2.scale.set(1.5, 0.75, 1); vl2.castShadow = false;
    tk(0.5, 0.09, 1.0, 0x8fd1c9, bx + 0.72, 0.66, bz).rotation.z = 0.03;
    [[0xffd23f, 0.2, -0.28], [0x8e6fd8, 0.24, 0.22]].forEach(function (e) { var ki = BAU.netz(new THREE.SphereGeometry(0.17, 8, 6), e[0], szene, bx - 0.62, 0.72, bz + e[2]); ki.scale.set(1, 0.55, 1); ki.castShadow = false; });
    // Hausschuhe, Reitstiefel, Rucksack, Steckenpferd
    [[10.35, -19.25], [10.55, -19.2]].forEach(function (q) { tk(0.11, 0.07, 0.24, 0xff8fc0, q[0], 0.08, q[1]).rotation.y = 0.3; });
    [14.72, 14.92].forEach(function (x) { BAU.walze(0.07, 0.08, 0.45, 0x3a2a20, szene, x, 0.23, -20.6, 8).castShadow = false; tk(0.13, 0.08, 0.26, 0x3a2a20, x, 0.04, -20.52); });
    BAU.netz(new THREE.SphereGeometry(0.2, 8, 6), 0x3f8fd6, szene, 15.55, 0.2, -16.05).scale.set(1, 1, 0.7);
    var sp = new THREE.Group(); sp.position.set(9.3, 0, -15.6); sp.rotation.z = -0.12; szene.add(sp);
    BAU.walze(0.025, 0.025, 1.3, 0xd9b27a, sp, 0, 0.65, 0, 6).castShadow = false; tk(0.12, 0.2, 0.34, 0xb5773c, 0, 1.36, 0.08, sp).rotation.x = 0.5; tk(0.03, 0.24, 0.2, 0x3a2a20, 0, 1.44, -0.04, sp);
    // kleiner Flickenteppich vor der Tür
    var ft = BAU.netz(new THREE.PlaneGeometry(1.3, 0.7), 0x7cc0a8, szene, H.tuer, 0.045, H.z1 - 0.55); ft.rotation.x = -Math.PI / 2; ft.castShadow = false;
    for (i = 0; i < 4; i++) { var fs = BAU.netz(new THREE.PlaneGeometry(0.1, 0.7), i % 2 ? 0xffe9a8 : 0xe9607f, szene, H.tuer - 0.45 + i * 0.3, 0.05, H.z1 - 0.55); fs.rotation.x = -Math.PI / 2; fs.castShadow = false; }

    // --- neue Sachen aus dem Reitladen ---
    function teil(id) { var g = new THREE.Group(); szene.add(g); zimmerTeile[id] = g; return g; }
    var g = teil('z_sessel'), sx = 16.2, sz = -15.75;
    BAU.kasten(0.75, 0.4, 0.8, 0x6fae8f, g, sx, 0.22, sz); BAU.kasten(0.2, 0.75, 0.8, 0x6fae8f, g, sx + 0.33, 0.62, sz);
    BAU.kasten(0.7, 0.24, 0.16, 0x5a9a7c, g, sx, 0.52, sz - 0.4); BAU.kasten(0.7, 0.24, 0.16, 0x5a9a7c, g, sx, 0.52, sz + 0.4);
    tk(0.5, 0.06, 0.5, 0xffe9a8, sx - 0.02, 0.46, sz, g); tk(0.04, 0.5, 0.5, 0xe9607f, sx + 0.2, 0.75, sz - 0.1, g).rotation.x = 0.15;
    g = teil('z_lampe');
    BAU.walze(0.16, 0.18, 0.04, 0x4a4a4a, g, 16.55, 0.02, -19.0, 12); BAU.walze(0.025, 0.025, 1.5, 0x4a4a4a, g, 16.55, 0.77, -19.0, 6);
    var ls = leucht(0xffcf8a); ls.emissiveIntensity = 0.5; zimmerTeile.lampeMat = ls;
    BAU.netz(new THREE.CylinderGeometry(0.15, 0.26, 0.32, 12), ls, g, 16.55, 1.62, -19.0).castShadow = false;
    var sl = new THREE.PointLight(0xffc977, 0, 8, 1.8); sl.position.set(16.3, 1.7, -19.0); g.add(sl); zimmerTeile.lampeLicht = sl;
    g = teil('z_aquarium');
    var gl = new THREE.MeshStandardMaterial({ color: 0x6fd0f0, transparent: true, opacity: 0.45, roughness: 0.1 });
    BAU.netz(new THREE.BoxGeometry(0.34, 0.3, 0.5), gl, g, 9.42, 0.96, -18.75).castShadow = false;
    tk(0.36, 0.03, 0.52, 0x333333, 9.42, 1.12, -18.75, g); tk(0.3, 0.03, 0.46, 0xe8d9a8, 9.42, 0.83, -18.75, g);
    tk(0.02, 0.14, 0.02, 0x3f9a46, 9.38, 0.91, -18.9, g); tk(0.02, 0.1, 0.02, 0x3f9a46, 9.46, 0.89, -18.62, g);
    [0xff8a2a, 0xffd23f, 0xe8413c].forEach(function (f, k) { var fi = BAU.netz(new THREE.SphereGeometry(0.03, 6, 5), f, g, 9.42, 0.95, -18.75); fi.scale.set(0.6, 1, 1.7); fi.castShadow = false; gemuetlich.fische.push({ m: fi, p: k * 2.1, y: 0.9 + k * 0.05 }); });
    g = teil('z_schaukel');
    var sch = new THREE.Group(); sch.position.set(14.7, 0, -15.3); sch.rotation.y = -0.6; g.add(sch); gemuetlich.schaukel = sch;
    [-0.16, 0.16].forEach(function (x) { var ku = BAU.netz(new THREE.TorusGeometry(0.7, 0.03, 6, 14, 1.3), 0xb5773c, sch, x, 0.72, 0); ku.rotation.set(0, Math.PI / 2, 0); ku.rotation.z = Math.PI + (Math.PI - 1.3) / 2 - Math.PI / 2; });
    BAU.kasten(0.24, 0.26, 0.7, 0xf3e3c8, sch, 0, 0.55, 0); BAU.kasten(0.16, 0.34, 0.2, 0xf3e3c8, sch, 0, 0.82, 0.32).rotation.x = 0.5; BAU.kasten(0.15, 0.17, 0.3, 0xf3e3c8, sch, 0, 0.98, 0.5).rotation.x = 0.3;
    [[-0.1, -0.26], [0.1, -0.26], [-0.1, 0.26], [0.1, 0.26]].forEach(function (q) { BAU.kasten(0.06, 0.4, 0.06, 0xf3e3c8, sch, q[0], 0.24, q[1]); });
    tk(0.26, 0.05, 0.26, 0xe84393, 0, 0.7, -0.02, sch); tk(0.04, 0.24, 0.3, 0x7a4a2a, 0, 0.9, 0.2, sch); tk(0.05, 0.3, 0.06, 0x7a4a2a, 0, 0.5, -0.38, sch).rotation.x = -0.6;
    C.kreise.push([14.7, -15.3, 0.01, 0, 0]);
    g = teil('z_sterne');
    zimmerTeile.sterneMat = leucht(0xfff39a); zimmerTeile.sterneMat.emissiveIntensity = 0.3;
    for (i = 0; i < 12; i++) { var st = BAU.netz(new THREE.OctahedronGeometry(0.06 + (i % 3) * 0.02), zimmerTeile.sterneMat, g, H.x0 + 0.14, 2.0 + Math.sin(i * 2.3) * 0.45, -20.4 + i * 0.5); st.scale.x = 0.25; st.castShadow = false; }
  }
  function liesBuch() {
    var f = FAKTEN[gemuetlich.buch % FAKTEN.length]; gemuetlich.buch++;
    KERN.ton(700, 0.05, 'triangle', 0.08); KERN.ton(900, 0.05, 'triangle', 0.08, 0.08);
    C.karte('<h2>📖 Das große Pferdebuch</h2><div class="details">Du blätterst in deinem Lieblingsbuch.<br><br><b>Wusstest du schon?</b><br>' + f + '</div>', [{ text: 'Noch eine Seite', aktion: liesBuch }]);
  }
  function spieleUhr() {
    gemuetlich.musik = 6;
    [659, 784, 880, 784, 659, 587, 523, 587, 659, 784, 659, 523].forEach(function (n, i) { KERN.ton(n * 2, 0.35, 'sine', 0.09, i * 0.42); });
    KERN.meldung('🎵 Die Spieluhr spielt dein Lieblingslied', 'gut');
  }
  function bewegeGemuetlich(dt, z, an) {
    var G = gemuetlich;
    if (G.zeiger) { G.zeiger[0].rotation.z = -d.stunde / 12 * Math.PI * 2; G.zeiger[1].rotation.z = -(d.stunde % 1) * Math.PI * 2; }
    if (G.musik > 0) { G.musik -= dt; G.taenzer.rotation.y += dt * 4; G.taenzer.position.y = 0.17 + Math.abs(Math.sin(z * 4)) * 0.02; }
    if (zimmerTeile.z_aquarium && zimmerTeile.z_aquarium.visible) G.fische.forEach(function (f) { var w = z * 0.9 + f.p; f.m.position.set(9.42 + Math.sin(w * 2) * 0.08, f.y + Math.sin(w * 1.3) * 0.04 + (G.futter > 0 ? 0.06 : 0), -18.75 + Math.sin(w) * 0.17); f.m.rotation.y = Math.cos(w) > 0 ? 0 : Math.PI; });
    if (G.futter > 0) G.futter -= dt;
    if (G.schaukel) { G.schubs = Math.max(0, G.schubs - dt * 0.25); G.schaukel.rotation.x = Math.sin(z * 3.2) * 0.22 * G.schubs; }
    if (zimmerTeile.lampeMat) { zimmerTeile.lampeMat.emissiveIntensity = 0.5 + an; zimmerTeile.lampeLicht.intensity = zimmerTeile.z_lampe.visible ? 1.5 + an * 6 : 0; zimmerTeile.lampeLicht.visible = zimmerTeile.lampeLicht.intensity > 0; }
    if (zimmerTeile.sterneMat) zimmerTeile.sterneMat.emissiveIntensity = 0.3 + an * 1.4 + Math.sin(z * 2) * 0.1;
  }
  function zeigeZimmer() {
    LADEN.forEach(function (w) { if (w.kat === 'zimmer' && zimmerTeile[w.id]) zimmerTeile[w.id].visible = !!d.besitz[w.id]; });
    for (var i = 0; i < 9; i++) if (zimmerTeile['pokal' + i]) zimmerTeile['pokal' + i].visible = !zimmerTeile.regalModell && i < 2 + d.sterne;
  }

  // Fahrrad, Hofkatze
  function baueRad() {
    var g = new THREE.Group(); g.position.set(RAD[0], 0, RAD[1]); g.rotation.y = 0.3; g.rotation.z = 0.12; szene.add(g);
    var rot = 0xe5412d;
    [-0.52, 0.52].forEach(function (z) { var r = BAU.netz(new THREE.TorusGeometry(0.33, 0.035, 6, 18), 0x222222, g, 0, 0.36, z); r.rotation.y = Math.PI / 2; });
    BAU.kasten(0.05, 0.05, 0.75, rot, g, 0, 0.72, 0.05); var s1 = BAU.kasten(0.05, 0.62, 0.05, rot, g, 0, 0.56, -0.3); s1.rotation.x = -0.35;
    var s2 = BAU.kasten(0.05, 0.6, 0.05, rot, g, 0, 0.6, 0.42); s2.rotation.x = 0.3;
    BAU.kasten(0.16, 0.05, 0.26, 0x2a1c12, g, 0, 0.9, -0.36); BAU.kasten(0.5, 0.04, 0.04, 0x8a8f96, g, 0, 0.95, 0.36);
    BAU.kasten(0.26, 0.2, 0.2, 0xb9843c, g, 0, 0.82, 0.56);
    MODELLE3D.setze('fahrrad', g, { dreh: Math.PI, laenge: 1.8, statt: g.children.slice() });
    C.kreise.push([RAD[0], RAD[1], 0.5, 0, 0]);
    var w = BAU.wegweiser('🚲 Nach Hause', { hoehe: 0.6, fuss: 1.8 }); w.position.set(RAD[0] + 1.6, 0, RAD[1] - 1.2); szene.add(w);
  }
  var KATZENWEG = [[11, 7.4], [14.5, 1.5], [10.5, -7.5], [13, -11.5], [5, 9.5], [-4, 9.3], [15, 9.5]];
  function baueKatze() {
    var g = new THREE.Group(), grau = 0x8b8f98, hell = 0xe9e4da;
    BAU.netz(new THREE.SphereGeometry(0.16, 10, 8), grau, g, 0, 0.24, 0).scale.set(0.85, 0.85, 1.7);
    var kopf = new THREE.Group(); kopf.position.set(0, 0.36, 0.26); g.add(kopf);
    BAU.netz(new THREE.SphereGeometry(0.12, 10, 8), grau, kopf);
    BAU.netz(new THREE.SphereGeometry(0.06, 8, 6), hell, kopf, 0, -0.03, 0.08);
    for (var i = -1; i <= 1; i += 2) {
      BAU.netz(new THREE.ConeGeometry(0.045, 0.1, 4), grau, kopf, i * 0.07, 0.12, 0);
      BAU.netz(new THREE.SphereGeometry(0.018, 6, 5), 0x7ad04a, kopf, i * 0.045, 0.02, 0.105);
      BAU.walze(0.03, 0.03, 0.2, grau, g, i * 0.07, 0.1, 0.16, 6); BAU.walze(0.03, 0.03, 0.2, grau, g, i * 0.07, 0.1, -0.16, 6);
    }
    var schwanz = new THREE.Group(); schwanz.position.set(0, 0.3, -0.26); g.add(schwanz);
    BAU.netz(new THREE.CapsuleGeometry(0.03, 0.34, 3, 6), grau, schwanz, 0, 0.17, 0);
    szene.add(g);
    katze = { g: g, kopf: kopf, schwanz: schwanz, x: 11, z: 7.4, kurs: 0, ziel: 1, warte: 4, phase: 0, schnurr: 0, schild: null, lauf: g.children.slice(), sitz: null };
    katze.schild = BAU.schwebeText('Minka', 0.24, { schrift: 40 }); katze.schild.position.y = 0.85; g.add(katze.schild);
    // sitzt Minka, sieht man das 3D-Modell; läuft sie, die bewegliche Katze
    katze.sitz = MODELLE3D.setze('katze', g, { vordreh: -Math.PI / 2, hoehe: 0.5, z: 0.05 }); katze.sitz.visible = false;
  }
  // Hofhund Bello, Hühner, Traktor
  var bello, huehner = [];
  function baueTiere() {
    bello = { x: 11.1, z: -12.3 };
    var g = MODELLE3D.setze('hund', szene, { x: bello.x, z: bello.z, dreh: -Math.PI / 2 + 0.5, breite: 1.15 });
    var sch = BAU.schwebeText('Bello', 0.24, { schrift: 40 }); sch.position.y = 0.95; sch.visible = false; g.add(sch);
    MODELLE3D.lade('hund', function () { sch.visible = true; bello.da = true; });
    C.kreise.push([bello.x, bello.z, 0.45, 0, 0]);
    for (var i = 0; i < 4; i++) {
      var h = { g: new THREE.Group(), x: -12 + i * 1.6, z: -12.5 - (i % 2) * 1.4, kurs: i * 1.9, warte: 1 + i, zx: 0, zz: 0, phase: i };
      h.modell = MODELLE3D.setze('huhn', h.g, { vordreh: -Math.PI / 2, hoehe: 0.5 + (i % 2) * 0.06 });
      szene.add(h.g); huehner.push(h);
    }
    MODELLE3D.setze('traktor', szene, { x: -27, z: -24.5, dreh: 0.12, breite: 6.4 }); C.kreise.push([-27, -24.5, 2.6, 0, 0]);
  }
  function bewegeHuehner(dt) {
    huehner.forEach(function (h) {
      var pickt = 0;
      if (h.warte > 0) { h.warte -= dt; pickt = Math.max(0, Math.sin(zeit * 9 + h.phase)) * 0.5; if (h.warte <= 0) { h.zx = -13 + Math.random() * 7.5; h.zz = -15.5 + Math.random() * 4.8; } }
      else {
        var dx = h.zx - h.x, dz = h.zz - h.z, e = Math.hypot(dx, dz);
        if (e < 0.15) h.warte = 2 + Math.random() * 5;
        else { h.kurs = Math.atan2(dx, dz); h.x += dx / e * 0.7 * dt; h.z += dz / e * 0.7 * dt; }
      }
      var fl = Math.hypot(S.x - h.x, S.z - h.z);
      if (fl < 1.3) { h.zx = h.x + (h.x - S.x) / fl * 3; h.zz = h.z + (h.z - S.z) / fl * 3; h.warte = 0; SOUND.spiel('huhn', 0.45, 0.95 + Math.random() * 0.2, 0, { pause: 1.2 }); }     // Hühner laufen weg, wenn man zu nah kommt
      h.g.position.set(h.x, h.warte > 0 ? 0 : Math.abs(Math.sin(zeit * 11 + h.phase)) * 0.04, h.z);
      h.g.rotation.y = h.kurs; h.modell.rotation.x = pickt;
    });
  }
  function streichleBello() {
    if (!SOUND.spiel('hund', 0.7)) { KERN.ton(190, 0.09, 'square', 0.12); KERN.ton(240, 0.12, 'square', 0.12, 0.16); } else SOUND.spiel('hund', 0.6, 1.08, 0.45);
    KERN.meldung('🐶 Bello wedelt mit dem Schwanz', 'perfekt');
  }
  function bewegeKatze(dt) {
    var k = katze;
    k.schnurr -= dt;
    var imKorb = d.besitz.z_korb && d.stunde >= 20;
    if (imKorb) { k.x = 12; k.z = -14.9; k.warte = 5; }
    else if (k.warte > 0) { k.warte -= dt; }
    else {
      var z = KATZENWEG[k.ziel], dx = z[0] - k.x, dz = z[1] - k.z, e = Math.hypot(dx, dz);
      if (e < 0.25) { k.ziel = Math.floor(Math.random() * KATZENWEG.length); k.warte = 4 + Math.random() * 8; }
      else { k.kurs = Math.atan2(dx, dz); k.x += dx / e * 1.5 * dt; k.z += dz / e * 1.5 * dt; k.phase += dt * 9; }
    }
    var sitzt = k.warte > 0;
    k.g.position.set(k.x, imKorb ? 0.16 : Math.abs(Math.sin(k.phase)) * (sitzt ? 0 : 0.03), k.z);
    k.g.rotation.y = k.kurs;
    var modell = sitzt && k.sitz.children.length > 0;
    k.sitz.visible = modell; k.lauf.forEach(function (t) { t.visible = !modell; });
    k.g.rotation.x = sitzt && !modell ? -0.28 : 0;
    k.schwanz.rotation.x = -0.5 + Math.sin(zeit * (k.schnurr > 0 ? 9 : 2.5)) * 0.25;
    k.schwanz.rotation.z = Math.sin(zeit * 1.7) * 0.35;
    k.kopf.rotation.z = k.schnurr > 0 ? Math.sin(zeit * 10) * 0.12 : 0;
  }
  function streichle() {
    katze.schnurr = 3.5; katze.warte = Math.max(katze.warte, 5);
    katze.kurs = Math.atan2(S.x - katze.x, S.z - katze.z);
    SOUND.spiel('katze', 0.5);
    for (var i = 0; i < 7; i++) KERN.ton(58 + (i % 2) * 6, 0.22, 'sawtooth', 0.07, 0.5 + i * 0.2);
    KERN.meldung('💕 Minka schnurrt', 'perfekt');
    zaehle('katze', 1);
  }

  // ---------- Die Landschaft rundherum (sieht man beim Rauszoomen) ----------
  function baueUmland() {
    var i, zf = 77;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    // Landstraße im Norden, Zufahrt zum Hof
    flaeche(-800, -36, 800, -31, 0x8d8f94, 0.02);
    for (i = -40; i < 40; i++) flaeche(i * 20, -33.6, i * 20 + 8, -33.4, 0xffffff, 0.03);
    flaeche(19, -31, 22.5, -9, 0xd9c9a3, 0.022);
    // Felder
    [[-230, -150, -70, -45, 0xf2d84a], [-60, -140, 55, -44, 0xb98f5a], [-240, 70, -100, 190, 0xe9cf7a], [90, 60, 230, 150, 0x9bd06a], [110, -20, 250, 45, 0xcfe08a],
      [-420, -160, -260, -50, 0xa7d46a], [270, -170, 430, -60, 0xf2d84a], [-80, 190, 80, 300, 0xb98f5a], [-430, 40, -290, 170, 0xcfe08a], [260, 170, 420, 290, 0xe9cf7a]].forEach(function (f) { flaeche(f[0], f[1], f[2], f[3], f[4], 0.014); });
    var ballen = [];
    for (i = 0; i < 14; i++) { var hb = BAU.walze(1.3, 1.3, 1.6, 0xd9c060, szene, -225 + zuf() * 110, 1.3, 80 + zuf() * 100, 12); hb.rotation.z = Math.PI / 2; hb.rotation.y = zuf() * 3; ballen.push(hb); }
    MODELLE3D.streue('heurund', szene, ballen.map(function (hb, k) { return [hb.position.x, 0, hb.position.z, 1, 0, k * 1.3]; }), 2.7, function () { ballen.forEach(function (hb) { hb.visible = false; }); });
    // Fluss im Westen mit Brücke
    var fluss = flaeche(-150, -800, -128, 800, 0x4aa3df, 0.018);
    fluss.material = new THREE.MeshStandardMaterial({ color: 0x4aa3df, roughness: 0.2 });
    BAU.kasten(26, 0.5, 7, 0x9a6b3f, szene, -139, 0.3, -33.5); BAU.kasten(26, 0.9, 0.3, 0x7a4a2a, szene, -139, 0.9, -36.8); BAU.kasten(26, 0.9, 0.3, 0x7a4a2a, szene, -139, 0.9, -30.2);
    // Dorf im Nordosten
    var hausFarben = [0xfff3d6, 0xf7d9c4, 0xe9e4da, 0xffe9a8, 0xdfeaf5], dachFarben = [0xa9432f, 0x8a3324, 0x5b6f8f, 0x6b4a2a];
    for (i = 0; i < 12; i++) {
      var hx = 80 + (i % 4) * 22 + zuf() * 8, hz = -112 + Math.floor(i / 4) * 24 + zuf() * 6, b = 9 + zuf() * 4, t = 7 + zuf() * 3, h = 5 + zuf() * 2.5;
      var hg = new THREE.Group(); hg.position.set(hx, 0, hz); hg.rotation.y = (zuf() - 0.5) * 0.5; szene.add(hg);
      BAU.kasten(b, h, t, hausFarben[i % 5], hg, 0, h / 2, 0);
      var dc = BAU.netz(new THREE.ConeGeometry(0.72, 1, 4), dachFarben[i % 4], hg, 0, h + 1.9, 0); dc.rotation.y = Math.PI / 4; dc.scale.set(b * 1.08, 3.8, t * 1.08);
      BAU.kasten(1.2, 2.2, 0.1, 0x6b4a2a, hg, 0, 1.1, t / 2 + 0.03);
      MODELLE3D.setze('dorfhaus', hg, { dreh: (i % 3) * Math.PI / 2, hoehe: h + 4.5, statt: hg.children.slice() });
    }
    var vorKirche = szene.children.length;
    BAU.kasten(10, 9, 18, 0xf3ead8, szene, 128, 4.5, -40.5 - 22); var kd = BAU.netz(new THREE.ConeGeometry(0.72, 1, 4), 0x8a3324, szene, 128, 11, -62.5); kd.rotation.y = Math.PI / 4; kd.scale.set(10.5, 4, 19);
    BAU.kasten(6, 22, 6, 0xf3ead8, szene, 128, 11, -49); BAU.netz(new THREE.ConeGeometry(4.6, 10, 4), 0x5b6f8f, szene, 128, 27, -49).rotation.y = Math.PI / 4;
    MODELLE3D.setze('kirche', szene, { x: 128, z: -58, dreh: -Math.PI / 2, hoehe: 31, statt: szene.children.slice(vorKirche) });
    // Galopprennbahn im Südwesten und Geländestrecke im Südosten
    var oval = BAU.netz(new THREE.RingGeometry(0.72, 1, 56), 0xe3cf9c, szene, -62, 0.02, 105); oval.rotation.x = -Math.PI / 2; oval.scale.set(62, 36, 1); oval.castShadow = false;
    [0.7, 1.02].forEach(function (r) { var gl = BAU.netz(new THREE.TorusGeometry(1, 0.012, 4, 64), 0xffffff, szene, -62, 1.0, 105); gl.rotation.x = Math.PI / 2; gl.scale.set(62 * r, 36 * r, 30); });
    for (i = 0; i < 3; i++) BAU.kasten(30, 1.2, 2.4, 0xb9b2a4, szene, -62, 0.6 + i * 1.2, 146 + i * 2.4);
    BAU.kasten(32, 0.4, 9, 0xa9432f, szene, -62, 7.5, 148.5);
    flaeche(-37, 47, -31, 70, 0xd9c9a3); flaeche(33, 47, 39, 80, 0xd9c9a3);
    var teich = BAU.netz(new THREE.CircleGeometry(11, 24), new THREE.MeshStandardMaterial({ color: 0x3f97d6, roughness: 0.2 }), szene, 70, 0.02, 105); teich.rotation.x = -Math.PI / 2; teich.castShadow = false;
    [[40, 70, 0.3], [52, 90, 1.2], [84, 78, 0.7], [96, 118, 0.1], [48, 122, 1.0]].forEach(function (p) { var st = BAU.walze(0.45, 0.45, 5, 0x7a4a2a, szene, p[0], 0.55, p[1], 8); st.rotation.z = Math.PI / 2; st.rotation.y = p[2]; });
    // großer See mit Wald im Osten (dorthin führt der Ausritt)
    var see = BAU.netz(new THREE.CircleGeometry(52, 36), new THREE.MeshStandardMaterial({ color: 0x3f97d6, roughness: 0.15 }), szene, 330, 0.02, 30); see.rotation.x = -Math.PI / 2; see.scale.y = 0.8; see.castShadow = false;
    // Windmühle
    muehle = new THREE.Group(); muehle.position.set(-95, 0, -82); szene.add(muehle);
    BAU.walze(3.2, 5, 16, 0xf3ead8, muehle, 0, 8, 0, 10); BAU.netz(new THREE.ConeGeometry(4, 4, 10), 0x8a3324, muehle, 0, 18, 0);
    muehle.rad = new THREE.Group(); muehle.rad.position.set(0, 15, 4.2); muehle.add(muehle.rad);
    for (i = 0; i < 4; i++) { var fl = new THREE.Group(); fl.rotation.z = i * Math.PI / 2; muehle.rad.add(fl); BAU.kasten(0.4, 12, 0.2, 0x7a4a2a, fl, 0, 6.5, 0); BAU.kasten(2.6, 9, 0.1, 0xffffff, fl, 1.2, 7.6, 0); }
    MODELLE3D.setze('windmuehle', muehle, { dreh: -Math.PI / 4, hoehe: 22, statt: muehle.children.slice() });
    // Heißluftballon
    ballon = new THREE.Group(); szene.add(ballon);
    BAU.netz(new THREE.SphereGeometry(9, 16, 12), 0xe84393, ballon, 0, 0, 0).scale.y = 1.15;
    [0.5, 0, -0.5].forEach(function (y, k) { var r = Math.sqrt(1 - y * y) * 9.1; BAU.netz(new THREE.TorusGeometry(r, 0.5, 5, 24), k === 1 ? 0xffe36b : 0xffffff, ballon, 0, y * 10.3, 0).rotation.x = Math.PI / 2; });
    BAU.kasten(2.6, 2.2, 2.6, 0xb9843c, ballon, 0, -14, 0);
    for (i = 0; i < 4; i++) BAU.walze(0.05, 0.05, 6, 0x6b4a2a, ballon, i < 2 ? -1.2 : 1.2, -10.5, i % 2 ? -1.2 : 1.2, 4);
    // Wälder: Bäume rund um den Hof, aber nicht auf Straße, Feldern, Dorf, Rennbahn und Wasser
    var baeume = [];
    function belegt(x, z) {
      if (Math.abs(x) < 72 && z > -30 && z < 58) return true;                      // der Hof selbst
      if (z > -40 && z < -27) return true;                                         // Straße
      if (x > -154 && x < -124) return true;                                       // Fluss
      if (x > 68 && x < 172 && z > -124 && z < -38) return true;                   // Dorf
      if (Math.hypot((x + 62) / 70, (z - 105) / 46) < 1) return true;              // Rennbahn
      if (Math.hypot(x - 70, z - 105) < 15 || Math.hypot((x - 330) / 58, (z - 30) / 48) < 1) return true;
      if (Math.hypot(x + 95, z + 82) < 12) return true;
      if (x > -37.5 && x < -30.5 && z < 72 || x > 32.5 && x < 39.5 && z < 82) return true;
      return (x > -235 && x < -65 && z > -155 && z < -42) || (x > -64 && x < 58 && z > -143 && z < -42) || (x > -245 && x < -95 && z > 66 && z < 194) || (x > 86 && x < 234 && z > 56 && z < 154) ||
        (x > 106 && x < 254 && z > -24 && z < 48) || (x > -424 && x < -256 && z > -164 && z < -46) || (x > 266 && x < 434 && z > -174 && z < -56) || (x > -84 && x < 84 && z > 186 && z < 304) ||
        (x > -434 && x < -286 && z > 36 && z < 174) || (x > 256 && x < 424 && z > 166 && z < 294);
    }
    for (i = 0; i < 1500 && baeume.length < 520; i++) {
      var w = zuf() * 6.283, r = 78 + zuf() * zuf() * 470, x = Math.sin(w) * r, z = Math.cos(w) * r;
      if (i % 3 === 0) { x = 250 + zuf() * 170; z = -45 + zuf() * 190; }                   // dichter Wald am See
      if (belegt(x, z)) continue;
      baeume.push([x, 0, z, 1.2 + zuf() * 1.5, zuf() < 0.4 ? 1 : 0]);
    }
    szene.add(BAU.wald(baeume));
    // Hügel und Berge am Horizont
    var gr = [0x6fb552, 0x5fa648, 0x7cc35a, 0x559a44];
    for (i = 0; i < 16; i++) {
      var hw = i / 16 * 6.283 + zuf() * 0.3, hr = 560 + zuf() * 130, hg2 = 110 + zuf() * 90;
      BAU.netz(new THREE.SphereGeometry(hg2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), gr[i % 4], szene, Math.sin(hw) * hr, -4, Math.cos(hw) * hr).scale.y = 0.28 + zuf() * 0.2;
    }
    for (i = 0; i < 9; i++) {
      var bw = -2.2 + i * 0.5 + zuf() * 0.2, br = 760, bh = 150 + zuf() * 110;
      BAU.netz(new THREE.ConeGeometry(120 + zuf() * 50, bh, 7), 0x7f93a8, szene, Math.sin(bw) * br, bh / 2 - 6, -Math.abs(Math.cos(bw)) * br);
      BAU.netz(new THREE.ConeGeometry(34, bh * 0.26, 7), 0xffffff, szene, Math.sin(bw) * br, bh * 0.87 - 5, -Math.abs(Math.cos(bw)) * br);
    }
  }

  function baue(ctx) {
    C = ctx; szene = ctx.szene; S = ctx.S;
    baueHaus(); baueRad(); baueKatze(); baueKarre('mist', KARRE_PLATZ, 0, 0x3e8f4a, 0x2c6b36); baueKarre('futter', FUTTER_PLATZ, -Math.PI / 2, 0x2f6fb5, 0x1f4f85); baueGabel(); baueTiere(); baueUmland();
    misthaufen = BAU.netz(new THREE.SphereGeometry(2.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x5a3d22, szene, ctx.ORT.mist[0] + 0.3, 0, ctx.ORT.mist[1] - 0.2);
    zeigeHaufen(); MODELLE3D.lade('misthaufen', zeigeHaufen);
    letzteStunde = d.stunde;
  }

  // ---------- Was kann man tun? ----------
  function aktionen(vor, S, P, beste) {
    var K = schiebt(), M = C.ORT.mist, amHaufen = Math.hypot(S.x - M[0], S.z - M[1]) < 4.8, b, B;
    if (K && K.art === 'mist') {
      b = C.inBoxVon(S.x, S.z);
      if (K.ladung > 0 && amHaufen) vor(S.x, S.z, 9, '💩 Mist auf den Misthaufen kippen', ladeAb);
      else if (b && b.mist.length && K.ladung < KARRE_MAX) vor(S.x, S.z, 9, gabel.aufKarre ? '🛒 Schubkarre hier abstellen' : null, gabel.aufKarre ? function () { stelleKarreAb(); } : null, gabel.aufKarre ? null : 'Stell die Schubkarre hier ab und hol die Mistgabel. Sie lehnt westlich an der Stallwand.');
      else if (!beste()) vor(S.x, S.z, 9, '🛒 Schubkarre abstellen', function () { stelleKarreAb(); });
      return;
    }
    if (K) {             // Futterwagen
      b = boxInDerNaehe(); B = b && b.pferd && b.pferd.ort === 'box' ? b.pferd : null;
      var imVorrat = S.x > 0 && S.x < 8 && S.z < -1.2 && S.z > -6.5 && Math.hypot(S.x - 4, S.z + 2.6) < 4.2;
      if (imVorrat && K.ladung < 6) vor(S.x, S.z, 9, '🌾 Futterwagen beladen', beladeFutter);
      else if (B && K.ladung > 0 && !(B.st.hafer && B.st.heu)) vor(b.xc, b.zVorn, 9, '🌾 ' + B.def.name + ' füttern', function () { fuettereAusWagen(B); });
      else if (B && K.ladung > 0) vor(b.xc, b.zVorn, 9, null, null, B.def.name + ' hat schon Futter. Fahr zur nächsten Box.');
      else if (!K.ladung && !imVorrat) vor(S.x, S.z, 9, '🛒 Futterwagen abstellen', function () { stelleKarreAb(); }, null);
      else if (!beste()) vor(S.x, S.z, 9, '🛒 Futterwagen abstellen', function () { stelleKarreAb(); });
      return;
    }
    var mist = gabel.inHand ? naherMist() : null, KM = karren.mist, anKarre = Math.hypot(S.x - KM.x - Math.sin(KM.kurs) * 0.6, S.z - KM.z - Math.cos(KM.kurs) * 0.6) < 2.3;
    if (gabel.inHand) {
      if (gabel.voll && anKarre) vor(S.x, S.z, 9, '💩 Mist in die Schubkarre werfen', wirfInKarre);
      else if (gabel.voll && amHaufen) vor(S.x, S.z, 9, '💩 Mist auf den Misthaufen werfen', wirfAufHaufen);
      else if (gabel.voll) vor(S.x, S.z, 9, null, null, 'Die Gabel ist voll. Wirf den Mist in die Schubkarre oder auf den Misthaufen.');
      else if (mist) vor(mist.m.position.x, mist.m.position.z, 9, '🔱 Mist aufgabeln', function () { gabelAuf(mist); });
    } else if (!P && !S.traegt) vor(gabel.platz[0] - 0.5, gabel.platz[1], 1.5, '🔱 Mistgabel nehmen', nimmGabel);
    if (!P && !S.traegt && !(gabel.inHand && (mist || gabel.voll))) {
      ['mist', 'futter'].forEach(function (art) { var k = karren[art]; vor(k.x + Math.sin(k.kurs) * 0.3, k.z + Math.cos(k.kurs) * 0.3, 1.7, art === 'mist' ? '🛒 Mistkarre nehmen' : '🌾 Futterwagen nehmen', function () { nimmKarre(k); }); });
    }
    vor(BETT[0] + 0.2, BETT[1] + 1.0, 1.5, d.stunde >= 18 ? '🛏️ Schlafen gehen' : '🛏️ Dein Bett', function () { fragSchlafen('bett'); });
    vor(SCHRANK[0], SCHRANK[1] + 1.0, 1.4, '👗 Kleiderschrank', zeigeSchrank);
    vor(TISCH[0] - 0.9, TISCH[1], 1.3, '📋 Aufgabenbuch', zeigeAufgaben);
    vor(REGAL[0] + 0.8, REGAL[1], 1.3, '🏆 Pokalregal', zeigeRegal);
    vor(13.6, -19.9, 1.1, '📖 Im Pferdebuch lesen', liesBuch);
    vor(10.2, -18.5, 1.0, d.besitz.z_aquarium ? '🐠 Fische füttern' : '🎵 Spieluhr aufziehen', function () {
      if (d.besitz.z_aquarium && gemuetlich.futter <= 0) { gemuetlich.futter = 5; KERN.ton(1200, 0.05, 'sine', 0.08); KERN.ton(1500, 0.05, 'sine', 0.08, 0.1); KERN.meldung('🐠 Die Fische schnappen nach dem Futter', 'gut'); } else spieleUhr();
    });
    if (d.besitz.z_schaukel) vor(14.4, -15.9, 1.0, '🎠 Schaukelpferd anschubsen', function () { gemuetlich.schubs = 1; KERN.ton(300, 0.08, 'triangle', 0.1); KERN.ton(360, 0.08, 'triangle', 0.1, 0.3); });
    vor(RAD[0], RAD[1], 2.0, '🚲 Nach Hause fahren', function () { fragSchlafen('rad'); });
    if (!P) vor(katze.x, katze.z, 1.5, '🐱 Minka streicheln', streichle);
    if (!P && bello.da) vor(bello.x, bello.z, 1.6, '🐶 Bello streicheln', streichleBello);
  }

  function schritt(dt, z) {
    zeit = z;
    schaufelZeit = Math.max(0, schaufelZeit - dt);
    bewegeKatze(dt); bewegeHuehner(dt);
    var K = schiebt();
    if (K) {
      K.kurs = S.kurs; K.x = S.x + Math.sin(S.kurs) * 0.28; K.z = S.z + Math.cos(S.kurs) * 0.28;
      K.g.position.set(K.x, 0, K.z); K.g.rotation.y = K.kurs;
    }
    var km = karren.mist;
    if (km.kippZeit > 0) km.kippZeit = Math.max(0, km.kippZeit - dt);
    km.kipp.rotation.x = Math.sin(Math.min(1, km.kippZeit / 1.1) * Math.PI) * 0.75;
    flieger.forEach(function (f) {
      if (f.t > 1) return;
      f.t += dt / 0.5;
      var q = Math.min(1, f.t);
      f.m.position.set(f.von[0] + (f.nach[0] - f.von[0]) * q, f.von[1] + (f.nach[1] - f.von[1]) * q + Math.sin(q * Math.PI) * 0.9, f.von[2] + (f.nach[2] - f.von[2]) * q);
      f.m.rotation.x += dt * 9;
      if (f.t >= 1) { f.m.visible = false; f.t = 9; if (f.fertig) f.fertig(); }
    });
    if (muehle) muehle.rad.rotation.z += dt * 0.5;
    if (ballon) { var bw = z * 0.012; ballon.position.set(Math.sin(bw) * 190, 78 + Math.sin(z * 0.2) * 3, Math.cos(bw) * 150 - 40); }
    // Abendlicht: Fenster und Laternen
    var h = d.stunde, an = Math.max(0, Math.min(1, (h - 18.8) / 1.5));
    fenster.forEach(function (m) { m.emissiveIntensity = an * 0.9; });
    // Am Tag sind die Lampen ganz aus (unsichtbar): Sonst rechnet die Grafikkarte sie bei jedem Bildpunkt mit, obwohl sie nichts beleuchten.
    var lampenAn = an > 0.02;
    lampen.forEach(function (l) { l.m.emissiveIntensity = an * 1.6; l.l.intensity = an * 14; l.l.visible = lampenAn; });
    bewegeGemuetlich(dt, z, an);
    if (zimmerTeile.lichterMat) zimmerTeile.lichterMat.forEach(function (m, i) { m.emissiveIntensity = 0.5 + an + Math.sin(z * 3 + i * 1.6) * 0.3; });
    // der Abend kommt
    if (letzteStunde !== null && !schlaeft) {
      if (letzteStunde < 20 && h >= 20) KERN.meldung('🌆 Es wird Abend', 'knapp');
      if (letzteStunde < 21 && h >= 21) { KERN.meldung('🌙 Es ist Nacht. Zeit fürs Bett!', 'knapp'); KERN.ton(330, 0.4, 'sine', 0.14); KERN.ton(262, 0.6, 'sine', 0.14, 0.35); }
      if (h >= 23.95) schlafe('muede');
    }
    letzteStunde = h;
  }

  return {
    baue: baue, imHaus: imHaus, zeigeDach: function (v) { if (hausDach) hausDach.visible = v; }, aktionen: aktionen, schritt: schritt,
    zaehle: zaehle, nacht: nacht, zeigeAufgaben: zeigeAufgaben, zeigeZimmer: zeigeZimmer,
    schiebt: function () { return !!schiebt(); }, loslassen: function () { stelleKarreAb(); stelleGabelWeg(true); },
    pose: function () { return schaufelZeit > 0 ? 'schaufeln' : schiebt() ? 'schieben' : gabel && gabel.inHand ? 'gabel' : null; },
    // weitere Knöpfe neben dem Aktionsknopf
    zweit: function () {
      var K = schiebt();
      if (K) return [{ text: K.art === 'mist' ? '🛒 Abstellen' : '🛒 Abstellen', tun: function () { stelleKarreAb(); } }];
      if (gabel && gabel.inHand) return [{ text: '🔱 Wegstellen', tun: function () { stelleGabelWeg(); } }];
      return [];
    },
    hatGabel: function () { return !!(gabel && gabel.inHand); },
    hinweis: function () {
      if (schlaeft) return null;
      if (nacht()) return '🌙 Es ist Nacht. Bring die Pferde in den Stall und geh ins Bett (dein Zimmer ist im Haus nördlich vom Stall) oder fahr mit dem 🚲 nach Hause.';
      var K = schiebt();
      if (K && K.art === 'mist') return '🛒 Mistkarre: ' + K.ladung + ' von ' + KARRE_MAX + '. ' + (K.ladung >= KARRE_MAX ? 'Voll! Auskippen am Misthaufen westlich vom Stall.' : gabel.aufKarre ? 'Stell sie in einer Box ab, dann gabelst du den Mist hinein.' : 'Auskippen am Misthaufen westlich vom Stall.');
      if (K) return '🌾 Futterwagen: noch ' + K.ladung + ' von 6 Portionen. ' + (K.ladung ? 'Fahr durch die Stallgasse von Box zu Box.' : 'Im Vorratsraum gibt es Nachschub.');
      if (gabel && gabel.inHand && !gabel.voll && !naherMist()) return '🔱 Mistgabel: Geh zu den Pferdeäpfeln in den Boxen und auf dem Hof. Am besten stellst du vorher die Mistkarre daneben.';
      return null;
    },
    tipp: function () { return nacht() ? 'Gute Nacht! Ab ins Bett mit dir.' : d.stunde >= 20 ? 'Es wird dunkel. Sind alle Pferde im Stall?' : null; },
    kachel: function () { return REITEN.kachel('Tag ' + d.tag, '📋 ' + geschafft() + ' / ' + d.aufgaben.liste.length); },
    vergeht: function (stunden) { d.stunde = Math.min(23.5, d.stunde + stunden); },
    zustand: function () { return { karre: karren.mist, karren: karren, gabel: gabel, katze: katze, aufgaben: d.aufgaben, schlaeft: schlaeft }; }
  };
})();
