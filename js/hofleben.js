// ============================================================
//  HOFLEBEN  -  was auf dem Pferdehof sonst noch passiert:
//  Tieraerztin, Hufschmied, das Fohlen auf der Weide und das
//  Schwarze Brett mit den Reitabzeichen.
//  Wird von hof.js eingebunden (baue, aktionen, schritt).
// ============================================================

// Die Reitabzeichen, der Reihe nach. braucht: [Kennung der Leistung, Mindestwert, Text, kleiner = besser]
var ABZEICHEN = [
  { id: 'steckenpferd', name: 'Steckenpferd', bild: '🐴', lohn: 20, braucht: [['sauber', 1, 'Ein Pferd blitzblank putzen'], ['gefuettert', 1, 'Ein Pferd füttern'], ['hufe', 1, 'Hufe auskratzen']] },
  { id: 'kleinesHufeisen', name: 'Kleines Hufeisen', bild: '🍀', lohn: 30, braucht: [['dressur1', 55, 'Dressur Klasse E mit 55 %'], ['springen', 50, 'Springtraining mit der Hälfte der Punkte'], ['schmied', 1, 'Mit einem Pferd zum Hufschmied gehen']] },
  { id: 'grossesHufeisen', name: 'Großes Hufeisen', bild: '🏵️', lohn: 40, braucht: [['dressur1', 68, 'Dressur Klasse E mit 68 %'], ['springen', 70, 'Springtraining mit 70 % der Punkte'], ['gelaende', 9, 'Einen Geländeritt beenden', true], ['ausritt', 4, 'Beim Ausritt 4 Orte entdecken']] },
  { id: 'bronze', name: 'Reitabzeichen Bronze', bild: '🥉', lohn: 60, braucht: [['dressur2', 65, 'Dressur Klasse A mit 65 %'], ['springTurnier', 3, 'Springturnier: Platz 3 oder besser', true], ['gelaende', 3, 'Military: Platz 3 oder besser', true], ['volti', 6, 'Voltigieren mit Note 6,0']] },
  { id: 'silber', name: 'Reitabzeichen Silber', bild: '🥈', lohn: 80, braucht: [['dressur2', 75, 'Dressur Klasse A mit 75 %'], ['springTurnier', 2, 'Springturnier: Platz 2 oder besser', true], ['gelaende', 2, 'Military: Platz 2 oder besser', true], ['rennen', 2, 'Galopprennen: Platz 2 oder besser', true], ['volti', 7.5, 'Voltigieren mit Note 7,5'], ['kuer', 6.5, 'Kür mit Musik mit Note 6,5']] },
  { id: 'gold', name: 'Reitabzeichen Gold', bild: '🥇', lohn: 150, braucht: [['dressur2', 85, 'Dressur Klasse A mit 85 %'], ['springTurnier', 1, 'Springturnier gewinnen', true], ['gelaende', 1, 'Military gewinnen', true], ['rennen', 1, 'Galopprennen gewinnen', true], ['volti', 8.5, 'Voltigieren mit Note 8,5'], ['kuer', 8, 'Kür mit Musik mit Note 8,0']] }
];
// Fragen fuer die Theoriepruefung: [Frage, richtige Antwort, falsch, falsch]
var THEORIE = [
  ['Von welcher Seite steigt man normalerweise auf das Pferd?', 'Von links', 'Von rechts', 'Von hinten'],
  ['Wie heißen die drei Grundgangarten?', 'Schritt, Trab, Galopp', 'Gehen, Laufen, Rennen', 'Schritt, Sprung, Sprint'],
  ['Wie nähert man sich einem Pferd?', 'Ruhig von vorne seitlich und ansprechen', 'Leise von hinten', 'Schnell rennend'],
  ['Was frisst ein Pferd am meisten?', 'Heu und Gras', 'Fleisch', 'Brot und Kuchen'],
  ['Warum kratzt man die Hufe aus?', 'Damit keine Steine und kein Mist drin bleiben', 'Damit das Pferd schneller wird', 'Damit die Hufe glänzen'],
  ['Wie heißen die langen Haare am Hals des Pferdes?', 'Mähne', 'Schweif', 'Fesselbehang'],
  ['Was trägt man beim Reiten immer auf dem Kopf?', 'Einen Reithelm', 'Eine Mütze', 'Nichts'],
  ['Wie nennt man ein junges Pferd?', 'Fohlen', 'Kalb', 'Welpe'],
  ['Wie viele Takte hat der Trab?', 'Zwei', 'Vier', 'Drei'],
  ['Wie viele Takte hat der Schritt?', 'Vier', 'Zwei', 'Sechs'],
  ['Wer beschlägt die Hufe mit Hufeisen?', 'Der Hufschmied', 'Der Tierarzt', 'Der Sattler'],
  ['Was bedeutet es, wenn ein Pferd die Ohren flach anlegt?', 'Es ist ärgerlich oder droht', 'Es freut sich', 'Es ist müde'],
  ['Wie heißt ein weißes Pferd?', 'Schimmel', 'Rappe', 'Fuchs'],
  ['Wie heißt ein schwarzes Pferd?', 'Rappe', 'Schimmel', 'Falbe'],
  ['Wie lang ist das kleine Dressurviereck?', '40 Meter', '10 Meter', '100 Meter'],
  ['Was braucht ein Pferd jeden Tag unbedingt?', 'Frisches Wasser, Futter und Bewegung', 'Nur Möhren', 'Einen neuen Sattel'],
  ['Womit misst man die Größe eines Pferdes?', 'Stockmaß (bis zum Widerrist)', 'Bis zu den Ohren', 'Bis zur Schweifspitze'],
  ['Was macht man nach dem Reiten zuerst?', 'Das Pferd versorgen: absatteln, trocken reiben, tränken', 'Selbst etwas essen', 'Das Pferd allein stehen lassen'],
  ['Wo darf man nie dicht hinter einem Pferd stehen?', 'Direkt hinter den Hinterbeinen', 'Neben der Schulter', 'Vor dem Stall'],
  ['Welche Bahnpunkte liegen an den kurzen Seiten des Vierecks?', 'A und C', 'B und E', 'X und M']
];

var HOFLEBEN = (function () {
  'use strict';
  var H = null;                 // was der Hof zur Verfuegung stellt
  var ARZT = [26, 5], SCHMIED = [26, -5], BRETT = [15.6, 8.9];
  var KRANK = {
    husten: { name: 'Husten', zeichen: 'hustet', befund: 'lunge', hilfe: 0 },
    lahm: { name: 'ein dickes Bein', zeichen: 'lahmt', befund: 'beine', hilfe: 1 },
    bauch: { name: 'Bauchweh', zeichen: 'hat Bauchweh', befund: 'bauch', hilfe: 2 }
  };
  var UNTERSUCHEN = [
    ['lunge', '🩺 Lunge abhören', 'Die Lunge rasselt und pfeift. Das ist Husten!', 'Die Lunge klingt frei und ruhig.'],
    ['bauch', '👂 Bauch abhören', 'Im Bauch gluckert es gar nicht. Das ist Bauchweh!', 'Im Bauch gluckert es schön, alles in Ordnung.'],
    ['beine', '🦵 Beine abtasten', 'Ein Vorderbein ist warm und dick. Es tut weh!', 'Alle vier Beine sind kühl und glatt.']
  ];
  var HILFE = ['🍯 Hustensaft und nasses Heu ohne Staub', '🧊 Bein kühlen und einen Verband anlegen', '🫖 Bauch massieren, im Schritt führen, Kräutertee'];
  var arzt = null, schmied = null, fohlen = null, glut = null;
  var hv = new THREE.Vector3();

  function esc(t) { return KERN.esc(t); }

  // ---------- Bauen ----------
  function baue(ctx) {
    H = ctx;
    var s = H.szene, d = STAND.daten;
    var platz = BAU.netz(new THREE.PlaneGeometry(15, 20), 0xd9c9a3, s, 25.5, 0.02, 0); platz.rotation.x = -Math.PI / 2; platz.castShadow = false;

    // Tieraerztin mit Praxiswagen
    var wagen = new THREE.Group(); wagen.position.set(ARZT[0] + 3.2, 0, ARZT[1] - 1.2); s.add(wagen);
    BAU.kasten(2.0, 1.7, 4.2, 0xf4f6f8, wagen, 0, 1.25, 0); BAU.kasten(1.9, 0.9, 1.3, 0xf4f6f8, wagen, 0, 0.85, 2.6);
    BAU.kasten(1.7, 0.6, 0.05, 0x7fb6d9, wagen, 0, 1.5, 3.27);
    [[-1, 1.4], [1, 1.4], [-1, -1.3], [1, -1.3]].forEach(function (r) { var rad = BAU.walze(0.36, 0.36, 0.25, 0x222222, wagen, r[0] * 0.95, 0.36, r[1], 12); rad.rotation.z = Math.PI / 2; });
    var kreuz = new THREE.Group(); kreuz.position.set(-1.02, 1.35, 0); wagen.add(kreuz);
    BAU.kasten(0.04, 0.7, 0.22, 0x2e9e5b, kreuz, 0, 0, 0); BAU.kasten(0.04, 0.22, 0.7, 0x2e9e5b, kreuz, 0, 0, 0);
    MODELLE3D.setze('tierarztauto', wagen, { z: 0.3, dreh: -Math.PI / 2, breite: 5.2, statt: wagen.children.slice() });
    H.waende.push([ARZT[0] + 2.1, ARZT[1] - 3.4, ARZT[0] + 4.3, ARZT[1] + 2.2]);
    var t1 = BAU.wegweiser('🩺 Tierärztin', { hoehe: 0.7, fuss: 1.9 }); t1.position.set(ARZT[0] - 3.2, 0, ARZT[1] - 2.6); s.add(t1);
    arzt = baueFigur({ jacke: '#ffffff', hose: '#3a7bd5', stiefel: '#2a1c12', haare: '#7a4a2a', frisur: 'dutt', art: 'frau' }, { helm: false });
    arzt.wurzel.position.set(ARZT[0] + 1.2, 0, ARZT[1] - 0.6); arzt.wurzel.rotation.y = -0.6; s.add(arzt.wurzel);
    var n1 = BAU.schwebeText('Dr. Sommer', 0.3, { schrift: 40 }); n1.position.y = 1.95; arzt.wurzel.add(n1);
    BAU.kasten(0.5, 0.35, 0.3, 0x8a5a33, s, ARZT[0] + 1.3, 0.18, ARZT[1] + 0.6);

    // Schmiede: offener Unterstand mit Esse und Amboss
    var sm = new THREE.Group(); sm.position.set(SCHMIED[0] + 2.6, 0, SCHMIED[1] - 1.5); s.add(sm);
    [[-1.8, -1.4], [1.8, -1.4], [-1.8, 1.4], [1.8, 1.4]].forEach(function (p) { BAU.kasten(0.2, 2.6, 0.2, 0x7a4a2a, sm, p[0], 1.3, p[1]); });
    var dach = BAU.kasten(4.4, 0.14, 3.6, 0x5a5f66, sm, 0, 2.75, 0); dach.rotation.x = 0.12;
    BAU.kasten(1.2, 0.9, 0.9, 0x6b6f76, sm, 1.0, 0.45, -0.9);
    glut = BAU.netz(new THREE.BoxGeometry(0.9, 0.12, 0.6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), sm, 1.0, 0.94, -0.9); glut.castShadow = false;
    var amboss = [BAU.kasten(0.5, 0.45, 0.4, 0x4a3320, sm, -0.8, 0.22, 0.6), BAU.kasten(0.75, 0.2, 0.3, 0x3a3d42, sm, -0.8, 0.55, 0.6)];
    MODELLE3D.setze('schmiede', sm, { x: -0.7, z: 0.2, dreh: Math.PI / 2, laenge: 2.0, statt: amboss });
    H.waende.push([SCHMIED[0] + 0.6, SCHMIED[1] - 3.1, SCHMIED[0] + 4.6, SCHMIED[1] + 0.1]);
    var t2 = BAU.wegweiser('🔨 Hufschmied', { hoehe: 0.7, fuss: 1.9 }); t2.position.set(SCHMIED[0] - 3.2, 0, SCHMIED[1] - 3); s.add(t2);
    schmied = baueFigur({ jacke: '#5a3a1e', hose: '#3d4046', stiefel: '#2a1c12', haare: '#2a1c12', frisur: 'kurz', art: 'mann' }, { helm: false });
    schmied.wurzel.position.set(SCHMIED[0] + 0.9, 0, SCHMIED[1] + 0.9); schmied.wurzel.rotation.y = -0.8; s.add(schmied.wurzel);
    var n2 = BAU.schwebeText('Meister Eisen', 0.3, { schrift: 40 }); n2.position.y = 1.95; schmied.wurzel.add(n2);

    // Schwarzes Brett fuer die Reitabzeichen
    var br = new THREE.Group(); br.position.set(BRETT[0], 0, BRETT[1]); s.add(br);
    BAU.kasten(0.12, 2.2, 0.12, 0x7a4a2a, br, -0.9, 1.1, 0); BAU.kasten(0.12, 2.2, 0.12, 0x7a4a2a, br, 0.9, 1.1, 0);
    BAU.kasten(2.0, 1.2, 0.08, 0x2f5d3a, br, 0, 1.6, 0);
    var t3 = BAU.tafel('🎖️ Reitabzeichen', 0.36, { grund: null, farbe: '#ffffff', schrift: 60 }); t3.position.set(0, 1.85, 0.05); br.add(t3);
    ['#f1c40f', '#c0c0c0', '#cd7f32'].forEach(function (f, i) { BAU.netz(new THREE.CircleGeometry(0.14, 12), f, br, -0.5 + i * 0.5, 1.35, 0.05).castShadow = false; });
    H.waende.push([BRETT[0] - 1, BRETT[1] - 0.15, BRETT[0] + 1, BRETT[1] + 0.15]);

    // ein Pferd ist beim ersten Besuch krank, damit man die Tieraerztin kennenlernt
    if (!d.arztBekannt) {
      d.arztBekannt = true;
      STAND.speichere();
    }
    baueFohlen();
  }

  // ---------- Gesundheit ----------
  function krank(P) { return P && P.st.krank && KRANK[P.st.krank] ? KRANK[P.st.krank] : null; }
  function zeichen(P) {
    return (krank(P) ? ' 🤒' : '') + ((P.st.eisen || 0) > 0.8 ? ' 🔨' : '');
  }
  // nach jedem Ritt nutzen sich die Hufeisen ab; mit alten Eisen kann ein Bein dick werden
  function nachRitt(P) {
    var st = P.st;
    st.eisen = Math.min(1, (st.eisen || 0) + 0.13);
    if (!STAND.istMeins(P.def.id)) { STAND.versorge(st); return; }             // um die anderen kümmern sich die Hofkinder
    if (st.krank || gesundZeit(st)) return;
    if (st.eisen > 0.92 && Math.random() < 0.15) { werdeKrank(st, 'lahm'); KERN.meldung(P.def.name + ' lahmt. Ab zur Tierärztin!', 'rot'); }
    else if (WETTER.regnet() && st.schmutz > 0.6 && Math.random() < 0.04) { werdeKrank(st, 'husten'); KERN.meldung(P.def.name + ' hustet nach dem Regen.', 'rot'); }
  }
  // ab und zu wird ein vernachlaessigtes Pferd krank
  // Krank wird nur das eigene Pferd, und das selten: nach einer Krankheit ist mindestens vier Tage Ruhe
  function gesundZeit(st) { var tag = STAND.daten.tag || 1; return st.krankTag !== undefined && tag - st.krankTag < 4 && tag >= st.krankTag; }
  function werdeKrank(st, art) { st.krank = art; st.krankTag = STAND.daten.tag || 1; }
  var krankZeit = 60;
  function pruefeGesundheit(dt) {
    krankZeit -= dt;
    if (krankZeit > 0) return;
    krankZeit = 90;
    H.pferde.forEach(function (P) {
      if (!STAND.istMeins(P.def.id)) {         // die Hofkinder halten ihre Pferde sauber, satt und gesund
        if (P.ort === 'box' && (P.st.schmutz > 0.1 || P.st.hunger > 0.15 || P.st.hufe > 0.1 || P.st.krank)) { STAND.versorge(P.st); H.zeigeZustand(P, true); }
        return;
      }
      if (P.st.krank || P.ort !== 'box' || gesundZeit(P.st)) return;
      // nur wer lange vernachlässigt wird, wird krank
      if (P.st.hunger > 0.97 && Math.random() < 0.06) werdeKrank(P.st, 'bauch');
      else if (P.st.hufe > 0.98 && Math.random() < 0.04) werdeKrank(P.st, 'lahm');
      if (P.st.krank) { H.zeigeZustand(P); STAND.speichere(); }
    });
  }

  function zeigeArzt(P) {
    var k = krank(P), name = esc(P.def.name);
    if (!k) {
      H.karte('<h2>🩺 Tierärztin Dr. Sommer</h2><div class="details">„' + name + ' ist kerngesund! Ich schaue trotzdem gern nach Zähnen und Impfung.“</div>', [
        { text: '💉 Vorsorge (5 🪙)', aktion: function () {
          STAND.zahle(Math.min(5, STAND.daten.muenzen));
          P.st.fit = Math.min(1, (P.st.fit || 0) + 0.12); STAND.merke('arzt', 1); STAND.speichere();
          H.frei(); KERN.meldung(name + ' ist topfit!', 'perfekt'); KERN.klang('perfekt');
        } }]);
      return;
    }
    var gefunden = false, fehler = 0;
    function untersuche(text) {
      var html = '<h2>🩺 Was fehlt ' + name + '?</h2><div class="details">' + (text || '„Oh, ' + name + ' geht es nicht gut. Hilf mir bei der Untersuchung!“') + '</div>';
      if (!gefunden) H.karte(html, UNTERSUCHEN.map(function (u) {
        return { text: u[1], aktion: function () {
          if (u[0] === k.befund) { gefunden = true; KERN.klang('gut'); untersuche('<b>' + u[2] + '</b><br>Was hilft jetzt am besten?'); }
          else { KERN.ton(420, 0.12, 'triangle', 0.14); untersuche(u[3] + ' Such weiter!'); }
        } };
      }));
      else H.karte(html, HILFE.map(function (h, i) {
        return { text: h, aktion: function () {
          if (i !== k.hilfe) { fehler++; KERN.klang('knapp'); untersuche('„Hm, das hilft bei ' + k.name + ' nicht. Überleg noch einmal.“'); return; }
          P.st.krank = null; P.st.krankTag = STAND.daten.tag || 1; STAND.merke('arzt', 1);
          var lohn = STAND.belohne(fehler ? 2 : 5, 'gut geholfen');
          H.zeigeZustand(P); STAND.speichere();
          KERN.klang('perfekt');
          KERN.zeigeKarte('mitte', '<h2>💚 ' + name + ' wird wieder gesund!</h2><div class="details">„Genau richtig! In ein paar Tagen ist alles vergessen. Du wärst eine gute Tierärztin.“</div>' + lohn,
            [{ text: 'Danke!', aktion: H.frei }]);
        } };
      }));
    }
    untersuche();
  }

  // Hufschmied: viermal im richtigen Moment haemmern
  function zeigeSchmied(P) {
    var name = esc(P.def.name), abnutzung = P.st.eisen || 0, preis = Math.min(12, STAND.daten.muenzen);
    H.karte('<h2>🔨 Hufschmied Meister Eisen</h2><div class="details">Hufeisen von ' + name + ': ' + REITEN.messer(1 - abnutzung) +
      '<br>' + (abnutzung > 0.8 ? '„Die sind ja ganz abgelaufen! Höchste Zeit für neue.“' : abnutzung > 0.4 ? '„Die halten noch ein Weilchen, neue schaden aber nicht.“' : '„Die Eisen sitzen noch prima.“') + '</div>', [
      { text: '🔨 Neue Hufeisen (' + preis + ' 🪙)', aktion: function () { STAND.zahle(preis); haemmern(P); } }]);
  }
  function haemmern(P) {
    var huf = 0, treffer = [], lauf = true, start = performance.now(), HUFE = ['vorne links', 'vorne rechts', 'hinten links', 'hinten rechts'];
    KERN.zeigeKarte('mitte', '<h2>🔨 Hufeisen aufnageln</h2><div class="details" id="schmiedText"></div>' +
      '<div class="schlag"><div class="zone" style="left:40%;width:20%"></div><div class="marke" id="schmiedMarke"></div></div>',
      [{ text: '🔨 Hämmern!', aktion: schlag }]);
    function text() { var e = document.getElementById('schmiedText'); if (e) e.innerHTML = 'Huf <b>' + HUFE[huf] + '</b> (' + (huf + 1) + ' von 4): Schlag zu, wenn der Hammer in der grünen Mitte ist!'; }
    function ort() { return Math.sin((performance.now() - start) / 1000 * (2.4 + huf * 0.35)); }
    function tick() {
      var m = document.getElementById('schmiedMarke');
      if (!lauf || !m) return;
      m.style.left = (50 + ort() * 46) + '%';
      requestAnimationFrame(tick);
    }
    function schlag() {
      if (!lauf) return;
      var a = Math.abs(ort()), g = a < 0.2 ? 1 : a < 0.45 ? 0.6 : 0.2;
      treffer.push(g);
      KERN.ton(g === 1 ? 1250 : 900, 0.09, 'square', 0.16); KERN.ton(g === 1 ? 2500 : 1700, 0.2, 'triangle', 0.12, 0.02);
      KERN.meldung(g === 1 ? 'Pling! Perfekt!' : g > 0.5 ? 'Sitzt!' : 'Schief, aber hält', g >= 0.6 ? 'gut' : 'knapp');
      huf++;
      if (huf < 4) { text(); return; }
      lauf = false;
      var summe = treffer.reduce(function (x, y) { return x + y; }, 0);
      P.st.eisen = 0; P.st.hufe = 0; P.st.fit = Math.min(1, (P.st.fit || 0) + 0.05);
      if (P.st.krank === 'lahm' && summe >= 3.2) P.st.krank = null;
      STAND.merke('schmied', 1);
      var lohn = STAND.belohne(Math.round(summe * 2), 'sauber gehämmert');
      H.zeigeZustand(P); STAND.speichere();
      KERN.klang('perfekt');
      KERN.zeigeKarte('mitte', '<h2>✨ Vier neue Hufeisen!</h2><div class="details">„' + (summe >= 3.6 ? 'Meisterlich! Willst du bei mir in die Lehre gehen?' : summe >= 2.4 ? 'Gute Arbeit, die halten.' : 'Na ja, sie halten. Üben wir noch.') + '“<br>' + esc(P.def.name) + ' läuft wieder wie auf Wolken.</div>' + lohn,
        [{ text: 'Danke!', aktion: H.frei }]);
    }
    text(); tick();
  }

  // ---------- Fohlen ----------
  var STUFEN = [[0.34, 'Fohlen'], [0.67, 'Jährling'], [1, 'Jungpferd'], [9, 'großes Pferd']];
  function fohlenDaten() {
    var d = STAND.daten;
    if (!d.fohlen) d.fohlen = { name: '', wuchs: 0, zeit: Date.now(), flasche: 0, buerste: 0, gross: false };
    var f = d.fohlen, jetzt = Date.now();
    var stunden = Math.max(0, Math.min(240, (jetzt - (f.zeit || jetzt)) / 3600000));
    f.wuchs = Math.min(1, f.wuchs + stunden * 0.004); f.zeit = jetzt;
    return f;
  }
  function stufe(w) { for (var i = 0; i < STUFEN.length; i++) if (w < STUFEN[i][0]) return STUFEN[i][1]; return 'großes Pferd'; }
  function baueFohlen() {
    var f = fohlenDaten(), W = H.ORT.weide.platz;
    var tier = HERDE.bauePferd({ fell: 'fuchs', saat: 23 });
    tier.setzeSattel(false); tier.setzeZaum(false);
    H.szene.add(tier.wurzel);
    fohlen = { tier: tier, x: W[0] + 8, z: W[1] + 8, kurs: 1, tempo: 0, phase: 0, ziel: null, warte: 2, blick: 0, schild: null, schildText: '', herz: null, herzZeit: 0, huepf: 0, tobt: 0, tobPause: 8, bock: 0, sprung: 0, nah: false };
    // eine kleine Stange zum Drüberhüpfen
    var sx = (W[0] + W[2]) / 2 + 5, sz = (W[1] + W[3]) / 2 + 3;
    fohlen.stange = [sx, sz];
    [-1.3, 1.3].forEach(function (v) { BAU.kasten(0.14, 0.5, 0.14, 0xffffff, H.szene, sx, 0.25, sz + v); BAU.kasten(0.3, 0.06, 0.3, 0xe84393, H.szene, sx, 0.03, sz + v); });
    var stg = BAU.walze(0.05, 0.05, 2.6, 0xe84393, H.szene, sx, 0.34, sz, 8); stg.rotation.x = Math.PI / 2;
    [-0.65, 0.65].forEach(function (v) { var r = BAU.walze(0.054, 0.054, 0.4, 0xffffff, H.szene, sx, 0.34, sz + v, 8); r.rotation.x = Math.PI / 2; });
    // Fläschchen und Bürste für die Nahansicht
    var fl = new THREE.Group(); H.szene.add(fl); fl.visible = false; fl.scale.setScalar(0.72);
    var glas = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.2 });
    var fg = BAU.netz(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 10), glas, fl, 0, 0, 0); fg.castShadow = false;
    var milch = BAU.netz(new THREE.CylinderGeometry(0.047, 0.047, 0.22, 10), 0xffffff, fl, 0, 0, 0); milch.castShadow = false;
    BAU.netz(new THREE.CylinderGeometry(0.02, 0.05, 0.07, 8), 0xffb37a, fl, 0, 0.155, 0).castShadow = false;
    BAU.netz(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 10), 0xff6fae, fl, 0, 0.115, 0).castShadow = false;
    var bu = new THREE.Group(); H.szene.add(bu); bu.visible = false;
    BAU.kasten(0.2, 0.05, 0.1, 0xb5773c, bu, 0, 0.03, 0).castShadow = false; BAU.kasten(0.19, 0.05, 0.09, 0xf6e3b4, bu, 0, -0.02, 0).castShadow = false;
    var fu = [];
    for (var i = 0; i < 6; i++) { var st = BAU.netz(new THREE.OctahedronGeometry(0.045), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffffff : 0xfff39a }), H.szene, 0, -5, 0); st.castShadow = false; fu.push(st); }
    fohlen.flasche = fl; fohlen.milch = milch; fohlen.buerste = bu; fohlen.funken = fu;
    zeigeFohlen();
  }
  function zeigeFohlen() {
    var f = fohlenDaten(), s = 0.46 + 0.54 * f.wuchs;
    fohlen.gross = s;
    fohlen.tier.wurzel.scale.setScalar(s);
    var text = (f.name || 'Fohlen') + '\n' + stufe(f.wuchs) + (f.wuchs < 1 ? ' · ' + Math.round(f.wuchs * 100) + ' %' : ' 💕');
    if (text !== fohlen.schildText) {
      fohlen.schildText = text;
      if (fohlen.schild) { H.szene.remove(fohlen.schild); fohlen.schild.material.map.dispose(); fohlen.schild.material.dispose(); }
      fohlen.schild = BAU.schwebeText(text, 0.55, { schrift: 40 });
      H.szene.add(fohlen.schild);
    }
  }
  function herz(text) {
    if (fohlen.herz) { H.szene.remove(fohlen.herz); fohlen.herz.material.map.dispose(); fohlen.herz.material.dispose(); }
    fohlen.herz = BAU.schwebeText(text || '💕', 0.6, { schrift: 60, grund: null });
    H.szene.add(fohlen.herz); fohlen.herzZeit = 2.2; fohlen.huepf = 1;
  }
  function bewegeFohlen(dt, zeit) {
    var F = fohlen, S = H.S, W = H.ORT.weide.platz, f = STAND.daten.fohlen;
    var imGatter = S.x > W[0] && S.x < W[2] && S.z > W[1] && S.z < W[3];
    var dS = Math.hypot(S.x - F.x, S.z - F.z), soll = 0, zx, zz;
    F.tobPause -= dt;
    if (F.nah) {                            // Nahansicht: steht still und lässt sich versorgen
      zx = F.x; zz = F.z; soll = 0; F.tobt = 0;
      F.blick += ((F.nahKopf || 0) - F.blick) * Math.min(1, dt * 5);
    } else if (F.tobt > 0) {                // tobt fröhlich über die Weide: Galopp, Bocksprünge, über die Stange
      F.tobt -= dt;
      if (!F.ziel || Math.hypot(F.ziel[0] - F.x, F.ziel[1] - F.z) < 1.6) {
        F.tobNr = (F.tobNr || 0) + 1;
        F.ziel = F.tobNr % 3 === 1 ? [F.stange[0] + (F.x < F.stange[0] ? 7 : -7), F.stange[1] + (Math.random() - 0.5) * 1.2] : [W[0] + 3 + Math.random() * (W[2] - W[0] - 6), W[1] + 3 + Math.random() * (W[3] - W[1] - 6)];
      }
      zx = F.ziel[0]; zz = F.ziel[1]; soll = 6.2;
      F.bock -= dt;
      if (F.bock <= 0 && F.sprung <= 0) { F.bock = 1.1 + Math.random() * 1.4; F.huepf = 1; if (dS < 30) KERN.ton(500 + Math.random() * 200, 0.07, 'triangle', 0.05); }
      F.blick += (0 - F.blick) * Math.min(1, dt * 4);
      if (F.tobt <= 0) { F.warte = 3; F.ziel = null; F.tobPause = 14 + Math.random() * 16; }
    } else if (F.tobPause <= 0 && !(imGatter && dS < 4)) {
      F.tobt = 6 + Math.random() * 4; F.ziel = null; F.tobNr = 0; F.bock = 0.5; soll = 0; zx = F.x; zz = F.z;
      if (dS < 40) { [0, 1, 2, 3, 4].forEach(function (i) { KERN.ton(1150 - i * 110 + (i % 2) * 90, 0.12, 'sawtooth', 0.045, i * 0.09); }); }
    } else if (imGatter && dS < 11) {       // laeuft neugierig zur Spielerin
      zx = S.x; zz = S.z; soll = dS > 5 ? 4.2 : dS > 1.9 ? 1.5 : 0;
      F.blick += (0 - F.blick) * Math.min(1, dt * 3);
    } else {
      if (!F.ziel || (F.warte <= 0 && Math.hypot(F.ziel[0] - F.x, F.ziel[1] - F.z) < 0.7)) {
        if (F.ziel) F.warte = 3 + Math.random() * 6;
        F.ziel = [W[0] + 3 + Math.random() * (W[2] - W[0] - 6), W[1] + 3 + Math.random() * (W[3] - W[1] - 6)];
        F.flott = Math.random() < 0.35;
      }
      F.warte -= dt;
      zx = F.ziel[0]; zz = F.ziel[1]; soll = F.warte > 0 ? 0 : F.flott ? 5 : 1.3;
      F.blick += ((F.warte > 0 ? 0.9 : 0) - F.blick) * Math.min(1, dt * 2);
    }
    F.tempo += (soll - F.tempo) * Math.min(1, dt * 3);
    if (F.tempo > 0.1) {
      var zw = Math.atan2(zx - F.x, zz - F.z), df = Math.atan2(Math.sin(zw - F.kurs), Math.cos(zw - F.kurs));
      F.kurs += df * Math.min(1, dt * 3);
      F.x += Math.sin(F.kurs) * F.tempo * dt; F.z += Math.cos(F.kurs) * F.tempo * dt;
    }
    F.x = Math.max(W[0] + 1, Math.min(W[2] - 1, F.x)); F.z = Math.max(W[1] + 1, Math.min(W[3] - 1, F.z));
    var gang = F.tempo < 0.15 ? 'steh' : F.tempo < 2.2 ? 'schritt' : F.tempo < 4.6 ? 'trab' : 'galopp';
    F.phase += F.tempo * dt * Math.PI * 2 / ((gang === 'galopp' ? 4.19 : gang === 'trab' ? 2.9 : 1.9) * F.gross);
    F.huepf = Math.max(0, F.huepf - dt * 1.6);
    // über die kleine Stange springen
    if (F.sprung <= 0 && F.tempo > 3.5 && Math.abs(F.z - F.stange[1]) < 1.5) {
      var vor = (F.stange[0] - F.x) * Math.sin(F.kurs);
      if (vor > 0.4 && vor < 1.5 && Math.abs(Math.sin(F.kurs)) > 0.6) { F.sprung = 1; F.huepf = 0; if (dS < 30) KERN.huf(0.2, 1500); }
    }
    var hoch = Math.abs(Math.sin(F.huepf * Math.PI * 2)) * 0.25 * F.huepf, nick = F.huepf > 0 ? Math.sin(F.huepf * Math.PI * 2) * 0.22 * F.huepf : 0;
    if (F.sprung > 0) { F.sprung -= dt / 0.62; var sq = 1 - Math.max(0, F.sprung); hoch = Math.sin(sq * Math.PI) * 0.75 * F.gross + 0.1; nick = Math.cos(sq * Math.PI) * -0.3; if (F.sprung <= 0 && dS < 30) KERN.huf(0.25, 1100); }
    F.tier.wurzel.position.set(F.x, hoch, F.z);
    F.tier.wurzel.rotation.set(0, F.kurs, 0); F.tier.koerper.rotation.x = nick;
    if (F.nah) bewegeNah(dt, zeit);
    F.tier.setzeKopfTief(F.blick);
    F.tier.bewege(gang, F.phase, 1, -1, dt);
    F.schild.position.set(F.x, 2.3 * F.gross + 0.5, F.z);
    if (F.herz) {
      F.herzZeit -= dt;
      F.herz.position.set(F.x, 2.3 * F.gross + 1.2 + (2.2 - F.herzZeit) * 0.5, F.z);
      F.herz.visible = F.herzZeit > 0;
    }
    if (f && f.wuchs >= 1 && !f.gross) {
      f.gross = true; STAND.merke('fohlen', 1);
      var lohn = STAND.belohne(60, 'Fohlen großgezogen');
      H.setzeModus('karte');
      KERN.klang('fanfare');
      KERN.zeigeKarte('mitte', '<h2>🎉 ' + esc(f.name || 'Dein Fohlen') + ' ist erwachsen!</h2><div class="details">Aus dem kleinen Fohlen ist ein großes, starkes Pferd geworden. Das hast du toll gemacht!<br>Beim <b>Ausritt</b> kommt es jetzt als zweites Pferd mit.</div>' + lohn,
        [{ text: 'Juhu!', aktion: H.frei }]);
    }
  }
  // Nahansicht: Die Kamera geht ganz nah heran, man sieht genau, was man mit dem Fohlen macht
  var hv = new THREE.Vector3();
  function maul(F, o) {                    // wo ist das Maul des Fohlens?
    var k = F.tier.knochen.spine016 || F.tier.knochen.spine014, s = F.gross;
    if (k) { k.getWorldPosition(o); o.x += Math.sin(F.kurs) * 0.42 * s; o.z += Math.cos(F.kurs) * 0.42 * s; o.y -= 0.12 * s; }
    else o.set(F.x + Math.sin(F.kurs) * 1.3 * s, 1.5 * s, F.z + Math.cos(F.kurs) * 1.3 * s);
    return o;
  }
  function geheNah() {
    var F = fohlen, S = H.S, s = F.gross;
    if (F.nah) return;
    F.nah = true; F.tat = null; F.tempo = 0; F.sprung = 0; F.huepf = 0; F.nahKopf = 0.12;
    var vx = Math.sin(F.kurs), vz = Math.cos(F.kurs), rx = Math.cos(F.kurs), rz = -Math.sin(F.kurs);
    // die Spielerin steht vorn am Kopf, die Kamera schaut von der Seite
    S.x = F.x + vx * (1.25 * s + 0.55) - rx * 0.35; S.z = F.z + vz * (1.25 * s + 0.55) - rz * 0.35;
    S.kurs = Math.atan2(F.x + vx * 0.9 * s - S.x, F.z + vz * 0.9 * s - S.z); S.tempo = 0;
    S.figur.wurzel.position.set(S.x, 0, S.z); S.figur.wurzel.rotation.y = S.kurs; S.figur.gehe(0, 0);
    var schmal = window.innerWidth < 700, weit = (2.4 * s + 2.0) * (schmal ? 1.75 : 1);
    var pos = new THREE.Vector3(F.x + rx * weit + vx * (0.9 * s + 0.3), 0.9 * s + 0.95, F.z + rz * weit + vz * (0.9 * s + 0.3));
    var blick = new THREE.Vector3(F.x + vx * (0.75 * s + (schmal ? 0 : -0.5)), schmal ? 0.1 : 1.0 * s + 0.1, F.z + vz * (0.75 * s + (schmal ? 0 : -0.5)));
    H.setzeKamera({ pos: pos, blick: blick });
    F.schild.visible = false;
  }
  function verlasseNah() {
    var F = fohlen;
    F.nah = false; F.tat = null; F.flasche.visible = false; F.buerste.visible = false; F.schild.visible = true;
    F.funken.forEach(function (m) { m.position.y = -5; });
    H.S.figur.setzePose('steh');
    H.setzeKamera(null); H.frei();
  }
  function bewegeNah(dt, zeit) {
    var F = fohlen, T = F.tat, s = F.gross, fig = H.S.figur;
    if (!T) { F.nahKopf = 0.12 + Math.sin(zeit * 1.3) * 0.04; return; }
    T.t += dt;
    var q = T.t / T.dauer, rx = Math.cos(F.kurs), rz = -Math.sin(F.kurs), vx = Math.sin(F.kurs), vz = Math.cos(F.kurs);
    if (T.art === 'flasche') {
      fig.setzePose('flasche');
      F.nahKopf = 0.0 + Math.sin(zeit * 9) * 0.025;
      maul(F, hv);
      F.flasche.visible = true; F.flasche.position.set(hv.x + vx * 0.12, hv.y - 0.1, hv.z + vz * 0.12);
      F.flasche.rotation.set(0, 0, 0); F.flasche.rotateY(F.kurs); F.flasche.rotateX(-2.0);
      F.milch.scale.y = Math.max(0.03, 1 - q); F.milch.position.y = -0.11 * q;
      T.takt -= dt; if (T.takt <= 0) { T.takt = 0.3; KERN.ton(260 + Math.random() * 60, 0.05, 'sine', 0.1); }
    } else if (T.art === 'buerste') {
      fig.setzePose('streicheln');
      F.nahKopf = 0.08;
      var hin = Math.sin(T.t * 5.2), bx = F.x + vx * (0.25 + 0.38 * hin) * s + rx * 0.33 * s, bz = F.z + vz * (0.25 + 0.38 * hin) * s + rz * 0.33 * s, by = (1.42 + 0.14 * Math.cos(T.t * 2.6)) * s;
      F.buerste.visible = true; F.buerste.position.set(bx, by, bz); F.buerste.rotation.set(0, F.kurs + Math.PI / 2, Math.PI / 2);
      F.funken.forEach(function (m, i) { var w = T.t * 2.2 + i * 1.05, a = (w % 1); m.position.set(bx + rx * 0.12 + Math.sin(i * 2.4) * 0.3 * a, by + a * 0.45 + Math.cos(i * 1.7) * 0.1, bz + rz * 0.12 + Math.cos(i * 2.4) * 0.3 * a); m.scale.setScalar(1.2 - a); m.rotation.y = w * 4; });
      T.takt -= dt; if (T.takt <= 0) { T.takt = 0.6; KERN.huf(0.05, 3200); }
    } else {
      fig.setzePose('streicheln');
      F.nahKopf = 0.2 + Math.sin(T.t * 4) * 0.1;
      T.takt -= dt; if (T.takt <= 0) { T.takt = 0.9; herz('💕'); F.huepf = 0; KERN.ton(700 + Math.random() * 200, 0.12, 'sine', 0.08); }
    }
    if (T.t >= T.dauer) {
      F.tat = null; F.flasche.visible = false; F.buerste.visible = false; F.funken.forEach(function (m) { m.position.y = -5; });
      fig.setzePose('steh');
      T.fertig();
    }
  }
  function zeigeFohlenKarte() {
    var f = fohlenDaten(), jetzt = Date.now(), name = esc(f.name || 'Fohlen');
    geheNah();
    function rest(wann) { return Math.max(0, Math.ceil((wann + 120000 - jetzt) / 1000)); }
    var rF = rest(f.flasche), rB = rest(f.buerste), klein = f.wuchs < 1;
    var html = '<h2>🐴 ' + name + '</h2><div class="details">' + stufe(f.wuchs) + (klein ? ' · gewachsen: ' + REITEN.messer(f.wuchs) +
      '<br><small>Mit Milch, Bürsten und Streicheln wächst es schneller. Es wächst auch von allein, jeden Tag ein Stück.</small>' : '<br>Dein großes Pferd kommt beim Ausritt mit.') +
      '</div><div class="details">Name: <input id="fohlenName" type="text" maxlength="14" value="' + esc(f.name) + '" placeholder="Wie soll es heißen?" style="font:inherit;padding:6px 10px;border-radius:10px;border:2px solid #d9cbb0;width:55%;text-align:center"></div>';
    function merkeName() { var e = document.getElementById('fohlenName'); if (e) f.name = e.value.replace(/[<>&"]/g, '').trim().slice(0, 14); }
    // erst sieht man in Ruhe zu, dann zählt es
    function tat(art, feld, plus, text, bild, dauer) {
      return function () {
        merkeName();
        KERN.schliesseKarte();
        fohlen.tat = { art: art, t: 0, dauer: dauer, takt: 0, fertig: function () {
          if (feld) f[feld] = Date.now();
          f.wuchs = Math.min(1, f.wuchs + plus);
          STAND.merke('fohlenPflege', (STAND.daten.leistung.fohlenPflege || 0) + 1);
          HOFTAG.zaehle('fohlen', 1);
          STAND.speichere(); zeigeFohlen(); fohlen.schild.visible = false; herz(bild);
          KERN.meldung(text, 'gut'); KERN.klang('gut');
          if (!(f.wuchs >= 1 && !f.gross)) zeigeFohlenKarte(); else verlasseNah();
        } };
      };
    }
    function satt() { KERN.ton(300, 0.1, 'triangle', 0.1); }
    var kn = [];
    if (klein) {
      kn.push(rF ? { text: '🍼 Milch (noch ' + rF + ' s satt)', klasse: 'zweit', aktion: satt } : { text: '🍼 Fläschchen Milch geben', aktion: tat('flasche', 'flasche', 0.025, 'Schmatz! Das schmeckt.', '🍼', 3.4) });
      kn.push(rB ? { text: '🖌️ Bürsten (noch ' + rB + ' s)', klasse: 'zweit', aktion: satt } : { text: '🖌️ Weich bürsten', aktion: tat('buerste', 'buerste', 0.015, 'So ein weiches Fell!', '✨', 3.4) });
    }
    kn.push({ text: '💕 Streicheln', aktion: tat('streicheln', null, klein ? 0.004 : 0, (f.name || 'Das Fohlen') + ' mag dich!', '💕', 2.6) });
    kn.push({ text: 'Fertig', klasse: 'zweit', aktion: function () { merkeName(); STAND.speichere(); zeigeFohlen(); verlasseNah(); } });
    H.setzeModus('karte');
    KERN.zeigeKarte('seite', html, kn);
    var eingabe = document.getElementById('fohlenName');
    if (eingabe) eingabe.addEventListener('change', function () { merkeName(); STAND.speichere(); zeigeFohlen(); fohlen.schild.visible = false; });
  }

  // ---------- Reitabzeichen ----------
  function erfuellt(b) {
    var w = STAND.daten.leistung[b[0]];
    if (w === undefined) return false;
    return b[3] ? w <= b[1] : w >= b[1];
  }
  function zeigeBrett() {
    var d = STAND.daten, naechstes = null;
    var html = '<h2>🎖️ Reitabzeichen</h2><div class="details">Sammle die Abzeichen der Reihe nach. Wenn alle Aufgaben abgehakt sind, kommt die Theorieprüfung.</div><div class="liste">';
    ABZEICHEN.forEach(function (a) {
      var hat = !!d.abzeichen[a.id], dran = !hat && !naechstes;
      if (dran) naechstes = a;
      html += '<div class="eintrag" style="align-items:flex-start;' + (hat || dran ? '' : 'opacity:0.5') + '"><div class="bild">' + (hat ? a.bild : dran ? '⭐' : '🔒') + '</div><div class="text" style="text-align:left"><b>' + a.name + '</b>' + (hat ? ' ✔ bestanden' : '') +
        (dran ? '<br><small>' + a.braucht.map(function (b) { return (erfuellt(b) ? '✅ ' : '⬜ ') + b[2]; }).join('<br>') + '</small>' : '') + '</div></div>';
    });
    html += '</div>';
    var kn = [];
    if (naechstes && naechstes.braucht.every(erfuellt)) kn.push({ text: '📝 Prüfung: ' + naechstes.name, aktion: function () { pruefung(naechstes); } });
    else if (!naechstes) html += '<div class="grossPunkte">🏆 Du hast alle Abzeichen!</div>';
    H.karte(html, kn);
  }
  function pruefung(a) {
    var fragen = THEORIE.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4), nr = 0, richtig = 0;
    function frage(vorher) {
      if (nr >= fragen.length) { ende(); return; }
      var f = fragen[nr], antworten = [f[1], f[2], f[3]].sort(function () { return Math.random() - 0.5; });
      KERN.zeigeKarte('mitte', '<div class="klein">Theorieprüfung · Frage ' + (nr + 1) + ' von ' + fragen.length + '</div><h2>' + f[0] + '</h2>' + (vorher ? '<div class="details">' + vorher + '</div>' : ''),
        antworten.map(function (t) {
          return { text: t, klasse: 'zweit', aktion: function () {
            var ok = t === f[1];
            if (ok) { richtig++; KERN.klang('gut'); } else KERN.klang('knapp');
            nr++;
            frage(ok ? '✅ Richtig!' : '❌ Richtig wäre: <b>' + f[1] + '</b>');
          } };
        }));
    }
    function ende() {
      if (richtig >= 3) {
        STAND.daten.abzeichen[a.id] = true;
        var lohn = STAND.belohne(a.lohn, a.name);
        STAND.speichere();
        KERN.klang('fanfare');
        KERN.zeigeKarte('mitte', '<h2>' + a.bild + ' Bestanden!</h2><div class="note">' + a.name + '</div><div class="details">' + richtig + ' von 4 Fragen richtig. Herzlichen Glückwunsch!</div>' + lohn,
          [{ text: 'Weiter', aktion: zeigeBrett }]);
      } else {
        KERN.klang('oh');
        KERN.zeigeKarte('mitte', '<h2>Knapp daneben</h2><div class="details">' + richtig + ' von 4 Fragen richtig, du brauchst 3. Probier es gleich noch einmal!</div>',
          [{ text: 'Nochmal versuchen', aktion: function () { pruefung(a); } }, { text: 'Später', klasse: 'zweit', aktion: H.frei }]);
      }
    }
    frage();
  }

  // ---------- Was kann man hier tun? (von findeAktion in hof.js aufgerufen) ----------
  function aktionen(vor, S, P) {
    if (P) {
      vor(ARZT[0], ARZT[1], 3.2, '🩺 ' + P.def.name + ' untersuchen lassen', function () { zeigeArzt(P); });
      vor(SCHMIED[0], SCHMIED[1], 3.2, '🔨 Zum Hufschmied', function () { zeigeSchmied(P); });
    } else {
      vor(ARZT[0], ARZT[1], 3.2, null, null, 'Die Tierärztin hilft kranken Pferden. Führe ein Pferd hierher.');
      vor(SCHMIED[0], SCHMIED[1], 3.2, null, null, 'Der Hufschmied macht neue Hufeisen. Führe ein Pferd hierher.');
      if (fohlen) vor(fohlen.x, fohlen.z, 2.4, '🐴 ' + (STAND.daten.fohlen.name || 'Fohlen') + ' versorgen', zeigeFohlenKarte);
    }
    vor(BRETT[0], BRETT[1] + 1.2, 2.2, '🎖️ Reitabzeichen ansehen', zeigeBrett);
  }

  function schritt(dt, zeit) {
    if (!H) return;
    pruefeGesundheit(dt);
    if (fohlen) bewegeFohlen(dt, zeit);
    if (glut) glut.material.color.setHSL(0.06 + Math.sin(zeit * 7) * 0.01, 1, 0.5 + Math.sin(zeit * 11) * 0.06);
    // der Schmied haemmert, die Tieraerztin winkt, wenn man in die Naehe kommt
    var S = H.S;
    schmied.gelenke.armR.rotation.x = -1.2 + Math.max(0, Math.sin(zeit * 6)) * 0.9;
    schmied.gelenke.ellR.rotation.x = -0.6;
    var nah = Math.hypot(S.x - ARZT[0], S.z - ARZT[1]) < 5;
    arzt.setzePose(nah ? 'winken' : 'steh'); arzt.bewege(dt);
  }

  // Tipp fuer die Sprechblasen der Reitmaedchen
  function tipp() {
    var k = H.pferde.filter(function (P) { return krank(P); })[0];
    if (k) return k.def.name + ' ' + krank(k).zeichen + '. Bring ' + k.def.name + ' zur Tierärztin!';
    var e = H.pferde.filter(function (P) { return (P.st.eisen || 0) > 0.8; })[0];
    if (e) return e.def.name + ' braucht neue Hufeisen!';
    var f = STAND.daten.fohlen;
    if (f && f.wuchs < 1 && Math.random() < 0.3) return 'Hast du das Fohlen auf der Weide schon gesehen?';
    return null;
  }

  return {
    baue: baue, aktionen: aktionen, schritt: schritt, krank: krank, zeichen: zeichen, nachRitt: nachRitt, tipp: tipp,
    zeigeBrett: zeigeBrett, zeigeArzt: zeigeArzt, zeigeSchmied: zeigeSchmied, zeigeFohlenKarte: zeigeFohlenKarte,
    fohlen: function () { return fohlen; },
    // das grosse Fohlen als Begleitpferd fuer den Ausritt
    begleitpferd: function () { var f = STAND.daten.fohlen; return f && f.wuchs >= 1 ? { name: f.name || 'Fohlen', fell: 'fuchs' } : null; }
  };
})();
