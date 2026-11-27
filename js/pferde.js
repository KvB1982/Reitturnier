// ============================================================
//  PFERDE  -  das Pferde-Register: alle Pferde an einer Stelle
//
//  Zu jedem Pferd gibt es einen Steckbrief: Wer sind die Eltern?
//  Wann ist es geboren? Wem gehört es? In welcher Box wohnt es?
//  Wie weit ist seine Ausbildung?
//
//  Die sechs Pferde im Stall stehen fest in HOF_PFERDE (js/config.js).
//  Alles, was sich ändert (Fohlen, später neue Pferde aus der Zucht),
//  liegt im Spielstand unter STAND.daten.register.
//
//  Ein neues Pferd ist ein Eintrag in einer Liste, kein neues Programm:
//    PFERDE.neu({ id: 'stern2', name: 'Sternschnuppe', fell: 'fuchs', vater: 'donner', mutter: 'sternchen' })
// ============================================================
var PFERDE = (function () {
  'use strict';
  var d = STAND.daten;
  d.register = d.register || {};          // je Pferd: { id, name, fell, vater, mutter, geboren, besitzer, box, ausbildung, ... }

  // ---------- Zum Einstellen ----------
  var TAGE_JE_JAHR = 28;                   // ein Jahr im Spiel hat vier Jahreszeiten mit je 7 Tagen
  // Ab so vielen Tagen ist ein Pferd ein Jährling, ein Jungpferd, ein Reitpferd
  var STUFEN = [[0, 'fohlen', 'Fohlen'], [14, 'jaehrling', 'Jährling'], [28, 'jungpferd', 'Jungpferd'], [42, 'reitpferd', 'Reitpferd']];

  function heute() { return typeof KALENDER !== 'undefined' ? KALENDER.tag() : (d.tag || 1); }
  function fest(id) { for (var i = 0; i < HOF_PFERDE.length; i++) if (HOF_PFERDE[i].id === id) return HOF_PFERDE[i]; return null; }

  // Die Pferde im Stall bekommen beim ersten Mal einen Eintrag. Sie sind schon erwachsen: Wann sie geboren sind, weiß niemand mehr.
  HOF_PFERDE.forEach(function (def, i) {
    var e = d.register[def.id];
    if (!e) e = d.register[def.id] = { id: def.id, vater: null, mutter: null, geboren: null, box: i, ausbildung: 1 };
    e.id = def.id;
  });
  // Das Fohlen vom Hof gehört auch ins Register. Sein Zustand (Name, Wachsen) bleibt in STAND.daten.fohlen.
  function fohlenEintrag() {
    if (!d.fohlen) return null;
    var e = d.register.fohlen;
    if (!e) e = d.register.fohlen = { id: 'fohlen', vater: null, mutter: null, geboren: heute(), box: 'fohlenbox', ausbildung: 0, besitzer: 'ich', fell: 'fuchs' };
    return e;
  }

  // Wie alt ist das Pferd in Spieltagen? (null = erwachsen, keiner weiß es genau)
  function alter(id) {
    var e = d.register[id];
    if (!e || typeof e.geboren !== 'number') return null;
    return Math.max(0, heute() - e.geboren);
  }
  // In welcher Altersstufe ist es? Gibt { id, name } zurück.
  function stufe(id) {
    var a = alter(id);
    if (id === 'fohlen' && d.fohlen) return d.fohlen.gross ? { id: 'jaehrling', name: 'Jährling' } : { id: 'fohlen', name: 'Fohlen' };
    if (a === null) return { id: 'reitpferd', name: 'Reitpferd' };
    var s = STUFEN[0];
    STUFEN.forEach(function (z) { if (a >= z[0]) s = z; });
    return { id: s[1], name: s[2] };
  }
  // Wem gehört es? 'ich' = dem Kind, das spielt. Sonst der Name des Hofkinds, das es pflegt.
  function besitzer(id) {
    var e = d.register[id];
    if (e && e.besitzer) return e.besitzer;
    if (fest(id)) return STAND.istMeins(id) ? 'ich' : STAND.betreuer(id);
    return 'hof';
  }

  // Ein Pferd mit allem, was man über es weiß (zum Lesen, nicht zum Ändern)
  function hol(id) {
    if (id === 'fohlen') fohlenEintrag();
    var e = d.register[id];
    if (!e) return null;
    var def = fest(id) || e;
    var name = id === 'fohlen' && d.fohlen ? (d.fohlen.name || 'Fohlen') : (def.name || e.name || 'Pferd');
    return {
      id: id, name: name, fell: def.fell || e.fell || 'brauner', art: def.art || e.art || '',
      tempo: def.tempo || e.tempo || 3, sprung: def.sprung || e.sprung || 3, ausdauer: def.ausdauer || e.ausdauer || 3,
      vater: e.vater || null, mutter: e.mutter || null, geboren: e.geboren, alter: alter(id), stufe: stufe(id),
      besitzer: besitzer(id), box: e.box === undefined ? null : e.box, ausbildung: e.ausbildung || 0, imStall: !!fest(id), fort: e.fort || null
    };
  }
  // Alle Pferde im Register. Mit einem Filter nur die, die passen: PFERDE.alle(function (p) { return p.stufe.id === 'fohlen'; })
  function alle(filter) {
    fohlenEintrag();
    var liste = Object.keys(d.register).map(hol).filter(function (p) { return p && !p.fort; });
    return filter ? liste.filter(filter) : liste;
  }
  // Die Pferde, die eine Box im Stall haben (in der Reihenfolge der Boxen). Daraus baut der Hof den Stall.
  function stall() { return HOF_PFERDE; }

  // Ein neues Pferd eintragen (zum Beispiel ein Fohlen aus der Zucht). Gibt die Kennung zurück.
  function neu(def) {
    def = def || {};
    var id = def.id || 'pferd' + (d.registerNr = (d.registerNr || 0) + 1);
    if (d.register[id]) return null;
    d.register[id] = {
      id: id, name: String(def.name || 'Pferd').slice(0, 16), fell: def.fell || 'brauner', art: def.art || '',
      tempo: def.tempo || 3, sprung: def.sprung || 3, ausdauer: def.ausdauer || 3,
      vater: def.vater || null, mutter: def.mutter || null, geboren: typeof def.geboren === 'number' ? def.geboren : heute(),
      besitzer: def.besitzer || 'ich', box: def.box === undefined ? null : def.box, ausbildung: def.ausbildung || 0
    };
    STAND.speichere();
    return id;
  }
  // Etwas am Steckbrief ändern: PFERDE.aendere('fohlen', { ausbildung: 0.2 })
  function aendere(id, was) {
    var e = d.register[id];
    if (!e || !was) return false;
    ['name', 'besitzer', 'box', 'ausbildung', 'vater', 'mutter', 'geboren', 'fort'].forEach(function (k) { if (was[k] !== undefined) e[k] = was[k]; });
    STAND.speichere();
    return true;
  }
  // Ein Pferd zieht in ein neues Zuhause. Es bleibt im Register (für Postkarten), ist aber nicht mehr auf dem Hof.
  function ziehtFort(id, wohin) {
    if (fest(id)) return false;                      // die sechs Stallpferde bleiben
    return aendere(id, { fort: { wohin: wohin || 'neues Zuhause', tag: heute() }, box: null });
  }
  // Die Kinder eines Pferdes
  function kinder(id) { return alle(function (p) { return p.vater === id || p.mutter === id; }); }
  // Ein kurzer Steckbrief als Text (für Karten und den Messbericht)
  function text(id) {
    var p = hol(id);
    if (!p) return '';
    var z = [p.name + ' (' + p.stufe.name + ')'];
    if (p.alter !== null) z.push(p.alter + (p.alter === 1 ? ' Tag' : ' Tage') + ' alt');
    var v = p.vater && hol(p.vater), m = p.mutter && hol(p.mutter);
    if (v || m) z.push('Eltern: ' + [m && m.name, v && v.name].filter(Boolean).join(' und '));
    z.push(p.besitzer === 'ich' ? 'gehört dir' : p.besitzer === 'hof' ? 'gehört zum Hof' : 'Pflegepferd von ' + p.besitzer);
    return z.join(', ');
  }

  return { alle: alle, hol: hol, stall: stall, neu: neu, aendere: aendere, ziehtFort: ziehtFort, kinder: kinder, alter: alter, stufe: stufe, besitzer: besitzer, text: text, TAGE_JE_JAHR: TAGE_JE_JAHR, STUFEN: STUFEN };
})();
