// ============================================================
//  STAND  -  was gespeichert wird: Muenzen, die Pferde im Stall,
//  gekaufte Ausruestung.  Liegt im Browser (localStorage).
// ============================================================
var STAND = (function () {
  'use strict';
  var NAME = 'reitturnier_hof';
  function lade() { try { return JSON.parse(localStorage.getItem(NAME)) || {}; } catch (e) { return {}; } }
  var d = lade();
  d.muenzen = d.muenzen || 0;
  d.besitz = d.besitz || {};          // gekaufte Dinge: { kennung: true }
  d.pferde = d.pferde || {};          // je Pferd: { schmutz, hunger, mist, stroh, hufe, zeit, ausruestung, fit }
  d.gewaehlt = d.gewaehlt || null;
  d.schleifen = d.schleifen || 0;
  function speichere() { try { localStorage.setItem(NAME, JSON.stringify(d)); } catch (e) { /* egal */ } }

  // Zustand eines Pferdes holen. Schmutz und Hunger wachsen mit der Zeit (auch wenn das Spiel zu ist).
  function pferd(id) {
    var p = d.pferde[id];
    var jetzt = Date.now();
    if (!p) {
      var z = Math.abs(Math.sin(id.length * 12.9 + id.charCodeAt(0) * 4.1));
      p = d.pferde[id] = { schmutz: 0.35 + z * 0.4, hunger: 0.3 + (1 - z) * 0.4, mist: 0.6, stroh: 0.5, hufe: 0.6, zeit: jetzt, ausruestung: {}, fit: 0.3 };
    }
    var stunden = Math.max(0, Math.min(72, (jetzt - (p.zeit || jetzt)) / 3600000));
    if (stunden > 0.01) {
      var S = typeof HOF_REGELN !== 'undefined' ? HOF_REGELN : { schmutzProStunde: 0.03, hungerProStunde: 0.06, mistProStunde: 0.05 };
      p.schmutz = Math.min(1, p.schmutz + stunden * S.schmutzProStunde);
      p.hunger = Math.min(1, p.hunger + stunden * S.hungerProStunde);
      p.mist = Math.min(1, p.mist + stunden * S.mistProStunde);
      p.stroh = Math.max(0, p.stroh - stunden * S.mistProStunde * 0.6);
      p.hufe = Math.min(1, p.hufe + stunden * S.schmutzProStunde);
      p.zeit = jetzt;
    }
    p.ausruestung = p.ausruestung || {};
    return p;
  }
  // Wie gut geht es dem Pferd? 0..1
  function laune(id) {
    var p = pferd(id);
    return Math.max(0, 1 - (p.schmutz * 0.3 + p.hunger * 0.4 + p.mist * 0.15 + p.hufe * 0.15));
  }
  // Muenzen gutschreiben; gibt eine Zeile fuer die Ergebniskarte zurueck
  function belohne(anzahl, wofuer) {
    anzahl = Math.max(0, Math.round(anzahl));
    if (!anzahl) return '';
    d.muenzen += anzahl;
    speichere();
    return '<div class="lohn">+' + anzahl + ' 🪙 Münzen' + (wofuer ? ' <small>(' + wofuer + ')</small>' : '') + '</div>';
  }
  return {
    daten: d, speichere: speichere, pferd: pferd, laune: laune, belohne: belohne,
    zahle: function (preis) { if (d.muenzen < preis) return false; d.muenzen -= preis; speichere(); return true; }
  };
})();
