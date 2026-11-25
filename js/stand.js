// ============================================================
//  STAND  -  was gespeichert wird: Muenzen, die Pferde im Stall,
//  gekaufte Ausruestung.  Wo das liegt und wem es gehoert, weiss SPEICHER (js/speicher.js).
// ============================================================
var STAND = (function () {
  'use strict';
  var d = SPEICHER.hof;
  if (typeof d.wach !== 'number' || isNaN(d.wach)) d.wach = 0;      // so viele Spielstunden war man schon wach auf dem Hof (zählt nur, während gespielt wird)
  d.muenzen = d.muenzen || 0;
  d.besitz = d.besitz || {};          // gekaufte Dinge: { kennung: true }
  d.pferde = d.pferde || {};          // je Pferd: { schmutz, hunger, mist, stroh, hufe, zeit, ausruestung, fit }
  d.gewaehlt = d.gewaehlt || null;
  d.schleifen = d.schleifen || 0;
  d.namen = d.namen || {};            // eigene Pferdenamen: { kennung: name }
  d.leistung = d.leistung || {};      // beste Ergebnisse fuer die Reitabzeichen
  d.abzeichen = d.abzeichen || {};    // bestandene Abzeichen: { kennung: true }
  if (typeof HOF_PFERDE !== 'undefined') HOF_PFERDE.forEach(function (def) {
    def.standardName = def.name;
    if (d.namen[def.id]) def.name = d.namen[def.id];
  });
  // Dein eigenes Pferd: Nur um dieses musst du dich kümmern. Die anderen versorgen die Hofkinder.
  var BETREUER = ['Emma', 'Jonas', 'Hanna', 'Ben', 'Lina', 'Paul'];
  var kennungen = typeof HOF_PFERDE !== 'undefined' ? HOF_PFERDE.map(function (p) { return p.id; }) : [];
  if (kennungen.indexOf(d.meins) < 0) d.meins = kennungen.indexOf(d.gewaehlt) >= 0 ? d.gewaehlt : (kennungen[0] || null);
  function betreuer(id) { return BETREUER[Math.max(0, kennungen.indexOf(id)) % BETREUER.length]; }
  // ein Pferd, das ein anderes Kind betreut, ist immer gut versorgt und gesund
  function versorge(p) {
    p.schmutz = Math.min(p.schmutz, 0.1); p.hunger = Math.min(p.hunger, 0.15); p.mist = 0; p.stroh = Math.max(p.stroh || 0, 0.9);
    p.hufe = Math.min(p.hufe, 0.1); p.krank = null; p.eisen = Math.min(p.eisen || 0, 0.3);
    return p;
  }
  function speichere() { SPEICHER.sichere(); }

  // Zustand eines Pferdes holen. Schmutz und Hunger wachsen mit der Uhr im Spiel. Ist das Spiel zu, steht die Uhr.
  function pferd(id) {
    var p = d.pferde[id];
    var jetzt = d.wach;
    if (!p) {
      var z = Math.abs(Math.sin(id.length * 12.9 + id.charCodeAt(0) * 4.1));
      p = d.pferde[id] = { schmutz: 0.35 + z * 0.4, hunger: 0.3 + (1 - z) * 0.4, mist: 0.6, stroh: 0.5, hufe: 0.6, zeit: jetzt, ausruestung: {}, fit: 0.3 };
    }
    if (typeof p.zeit !== 'number' || p.zeit > jetzt) p.zeit = jetzt;
    var stunden = Math.max(0, Math.min(72, jetzt - p.zeit));
    if (stunden > 0.01) {
      var S = typeof HOF_REGELN !== 'undefined' ? HOF_REGELN : { schmutzProStunde: 0.01, hungerProStunde: 0.02, mistProStunde: 0.02 };
      p.schmutz = Math.min(1, p.schmutz + stunden * S.schmutzProStunde);
      p.hunger = Math.min(1, p.hunger + stunden * S.hungerProStunde);
      p.mist = Math.min(1, p.mist + stunden * S.mistProStunde);
      p.stroh = Math.max(0, p.stroh - stunden * S.mistProStunde * 0.6);
      p.hufe = Math.min(1, p.hufe + stunden * S.schmutzProStunde);
      p.zeit = jetzt;
    }
    p.ausruestung = p.ausruestung || {};
    if (id !== d.meins) versorge(p);
    return p;
  }
  // Wie gut geht es dem Pferd? 0..1
  function laune(id) {
    var p = pferd(id);
    return Math.max(0, 1 - (p.schmutz * 0.3 + p.hunger * 0.4 + p.mist * 0.15 + p.hufe * 0.15) - (p.krank ? 0.3 : 0) - ((p.eisen || 0) > 0.8 ? 0.1 : 0));
  }
  // Muenzen gutschreiben; gibt eine Zeile fuer die Ergebniskarte zurueck
  function belohne(anzahl, wofuer) {
    anzahl = Math.max(0, Math.round(anzahl));
    if (!anzahl) return '';
    d.muenzen += anzahl;
    speichere();
    return '<div class="lohn">+' + anzahl + ' 🪙 Münzen' + (wofuer ? ' <small>(' + wofuer + ')</small>' : '') + '</div>';
  }
  // Pferd umbenennen (leerer Name = wieder der alte)
  function benenne(def, name) {
    name = String(name || '').replace(/[<>&"]/g, '').trim().slice(0, 14);
    if (name && name !== def.standardName) d.namen[def.id] = name; else delete d.namen[def.id];
    def.name = d.namen[def.id] || def.standardName;
    speichere();
    return def.name;
  }
  // bestes Ergebnis merken (fuer die Reitabzeichen). kleiner = true: kleinere Werte sind besser (Platz)
  function merke(art, wert, kleiner) {
    var alt = d.leistung[art];
    if (alt === undefined || (kleiner ? wert < alt : wert > alt)) { d.leistung[art] = wert; speichere(); }
  }
  return {
    benenne: benenne, merke: merke, versorge: versorge, betreuer: betreuer,
    meins: function () { return d.meins; }, istMeins: function (id) { return id === d.meins; },
    daten: d, speichere: speichere, pferd: pferd, laune: laune, belohne: belohne,
    zahle: function (preis) { if (d.muenzen < preis) return false; d.muenzen -= preis; speichere(); return true; }
  };
})();

// ============================================================
//  KALENDER  -  die eine Uhr im Spiel
//  Es gibt nur Spieltag und Uhrzeit (STAND.daten.tag und .stunde).
//  Eine Minute in echt ist eine Stunde im Spiel, und die Uhr läuft
//  nur, solange man auf dem Hof spielt. Wochentag, Woche und
//  Jahreszeit rechnen wir daraus aus. Tag 1 ist ein Montag im Frühling.
// ============================================================
var KALENDER = (function () {
  'use strict';
  var d = STAND.daten;
  var TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var ZEITEN = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
  var TAGE_JE_JAHRESZEIT = 7;            // eine Jahreszeit dauert eine Woche, ein Jahr also 28 Spieltage
  function tag() { return Math.max(1, Math.floor(d.tag || 1)); }
  return {
    TAGE_JE_JAHRESZEIT: TAGE_JE_JAHRESZEIT,
    tag: tag,
    stunde: function () { return typeof d.stunde === 'number' ? d.stunde : 7; },
    wach: function () { return d.wach || 0; },                 // Spielstunden, die man schon wach war (läuft nie rückwärts)
    wochentag: function () { return TAGE[(tag() - 1) % 7]; },
    woche: function () { return Math.floor((tag() - 1) / 7) + 1; },
    wochenende: function () { return (tag() - 1) % 7 >= 5; },
    jahreszeit: function () { return ZEITEN[Math.floor((tag() - 1) / TAGE_JE_JAHRESZEIT) % 4]; },
    jahr: function () { return Math.floor((tag() - 1) / (TAGE_JE_JAHRESZEIT * 4)) + 1; },
    text: function () { return TAGE[(tag() - 1) % 7] + ', Tag ' + tag(); }
  };
})();
