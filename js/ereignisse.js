// ============================================================
//  EREIGNISSE  -  kleine Geschichten auf dem Hof
//
//  Eine Geschichte ist kein Programm, sondern ein Eintrag in der
//  Liste GESCHICHTEN: Wann fängt sie an? Welche Schritte hat sie?
//  Was bekommt man am Ende? So schreibt man eine neue:
//
//    { id: 'hufkratzer', titel: 'Der verlorene Hufkratzer', welt: 'hof',
//      wenn: { abTag: 2, abStunde: 8, bisStunde: 17, wetter: 'trocken' },   // wie bei den Gesprächen (REDEN.passt)
//      pause: 4,                       // frühestens nach so vielen Tagen noch einmal (weglassen = nur einmal)
//      schritte: [
//        { art: 'rede', wer: 'emma', hinweis: '…', text: '…', antworten: [{ text: 'Ich helfe dir!', weiter: true }, { text: 'Später.' }] },
//        { art: 'ort', x: -12.4, z: 16.3, r: 1.8, hinweis: '…', aktion: '🔎 Aufheben', meldung: 'Gefunden!' },
//        { art: 'warte', stunden: 2, hinweis: '…' } ],
//      lohn: { muenzen: 5, herz: { emma: 2 }, merker: 'name', text: '…' } }
//
//  Schritt-Arten:
//    rede  = mit einer Person sprechen. Die Antwort mit "weiter: true" bringt die Geschichte voran.
//    ort   = zu einer Stelle gehen und dort den Knopf drücken (ohne "aktion" reicht es, hinzugehen).
//    warte = so viele Spielstunden vergehen lassen.
//
//  Es läuft immer nur eine Geschichte. Wo man gerade ist, steht im
//  Spielstand (STAND.daten.ereignisse) und bleibt über Nacht erhalten.
// ============================================================
var EREIGNISSE = (function () {
  'use strict';
  var d = STAND.daten;
  d.ereignisse = d.ereignisse || {};
  var E = d.ereignisse;
  E.fertig = E.fertig || {};              // je Geschichte: { tag, mal }
  if (E.laeuft === undefined) E.laeuft = null;   // { id, schritt, tag, seit }

  // ---------- Die Geschichten ----------
  var GESCHICHTEN = [
    { id: 'hufkratzer', titel: 'Der verlorene Hufkratzer', welt: 'hof',
      wenn: { abTag: 2, abStunde: 8, bisStunde: 17, wetter: 'trocken' }, pause: 5,
      schritte: [
        { art: 'rede', wer: 'emma', hinweis: '❗ Emma sucht etwas. Geh zu ihr und sprich sie an (Knopf „💬 Reden“).',
          text: 'Oh nein, {ich}! Mein Hufkratzer ist weg. Der rote, mit meinem Namen drauf. Hilfst du mir suchen?',
          antworten: [
            { text: 'Klar helfe ich dir!', weiter: true, dann: 'Du bist die Beste! Zuletzt hatte ich ihn am Putzplatz, glaube ich.' },
            { text: 'Wo hattest du ihn zuletzt?', weiter: true, dann: 'Am Putzplatz, glaube ich. Oder war es am Trog? Schau du am Putzplatz, ja?' },
            { text: 'Jetzt gerade nicht.', dann: 'Schade. Sag Bescheid, wenn du Zeit hast.' }] },
        { art: 'ort', x: -12.6, z: 16.6, r: 1.9, hinweis: '🔎 Such am Putzplatz nach Emmas rotem Hufkratzer. Das ❗ zeigt dir die Stelle.',
          aktion: '🔎 Hufkratzer aufheben', meldung: 'Gefunden! Da liegt er ja.' },
        { art: 'rede', wer: 'emma', hinweis: '🎁 Bring Emma ihren Hufkratzer zurück.',
          text: 'Du hast ihn gefunden? Zeig her!',
          antworten: [
            { text: 'Hier, bitte schön!', weiter: true, dann: 'Danke, danke, danke! Jetzt kann ich {pferd} endlich die Hufe machen.' },
            { text: 'Er lag am Putzplatz.', weiter: true, dann: 'Wusste ich es doch! Danke, {ich}. Du hast was gut bei mir.' }] }
      ],
      lohn: { muenzen: 5, herz: { emma: 3 }, text: 'Emma hat ihren Hufkratzer wieder.' } }
  ];
  function finde(id) { for (var i = 0; i < GESCHICHTEN.length; i++) if (GESCHICHTEN[i].id === id) return GESCHICHTEN[i]; return null; }
  // Eine Geschichte dazunehmen (zum Beispiel aus einer anderen Datei)
  function neu(g) { if (g && g.id && !finde(g.id) && g.schritte && g.schritte.length) GESCHICHTEN.push(g); }

  function jetzt() { return E.laeuft ? finde(E.laeuft.id) : null; }
  function schrittJetzt() { var g = jetzt(); return g ? g.schritte[E.laeuft.schritt] || null : null; }

  // Darf diese Geschichte heute anfangen?
  function darf(g, welt) {
    if (g.welt && g.welt !== welt) return false;
    var f = E.fertig[g.id];
    if (f && (g.pause === undefined || KALENDER.tag() - f.tag < g.pause)) return false;
    if (!REDEN.passt(g.wenn)) return false;
    // alle Personen der Geschichte müssen gerade da sein
    return g.schritte.every(function (s) { if (s.art !== 'rede') return true; var o = PERSONEN.wo(s.wer); return !!o && o.da; });
  }
  function starte(id) {
    var g = finde(id);
    if (!g || E.laeuft) return false;
    E.laeuft = { id: g.id, schritt: 0, tag: KALENDER.tag(), seit: KALENDER.wach() };
    STAND.speichere();
    return true;
  }
  // Zum nächsten Schritt. Nach dem letzten gibt es die Belohnung.
  function weiter() {
    var g = jetzt();
    if (!g) return;
    E.laeuft.schritt++; E.laeuft.seit = KALENDER.wach();
    if (E.laeuft.schritt >= g.schritte.length) return schluss(g);
    STAND.speichere();
  }
  function schluss(g) {
    var L = g.lohn || {}, f = E.fertig[g.id] || (E.fertig[g.id] = { tag: 0, mal: 0 });
    f.tag = KALENDER.tag(); f.mal++;
    E.laeuft = null;
    var zeilen = '';
    if (L.herz) Object.keys(L.herz).forEach(function (wer) {
      PERSONEN.freund(wer, L.herz[wer]);
      zeilen += '<div class="lohn">' + PERSONEN.herzText(wer) + ' <small>(' + KERN.esc((PERSONEN.brief(wer) || { name: wer }).name) + ')</small></div>';
    });
    if (L.merker) { d.merker = d.merker || {}; d.merker[L.merker] = true; }
    if (L.muenzen) zeilen += STAND.belohne(L.muenzen, g.titel);
    STAND.speichere();
    KERN.klang('gut');
    KERN.zeigeKarte('mitte', '<div class="klein">Geschafft</div><h2>🌟 ' + KERN.esc(g.titel) + '</h2><div class="details">' + KERN.esc(L.text || 'Gut gemacht!') + '</div>' + zeilen,
      [{ text: 'Weiter', aktion: function () { KERN.schliesseKarte(); } }]);
  }
  // Die laufende Geschichte abbrechen (sie kann später neu anfangen)
  function brichAb() { E.laeuft = null; STAND.speichere(); }

  // ---------- Jedes Bild ----------
  // welt = Name der Welt ('hof'), x, z = wo die Spielerin steht
  var geprueft = -1, weltJetzt = '';
  function schritt(dt, welt, x, z) {
    weltJetzt = welt;
    var g = jetzt();
    if (!g) {
      // einmal je Spielstunde nachsehen, ob eine Geschichte anfangen kann
      var st = Math.floor(KALENDER.wach());
      if (st === geprueft) return;
      geprueft = st;
      for (var i = 0; i < GESCHICHTEN.length; i++) if (darf(GESCHICHTEN[i], welt)) { starte(GESCHICHTEN[i].id); break; }
      return;
    }
    if (g.welt && g.welt !== welt) return;
    if (E.laeuft.wartet && !REDEN.offen()) return nachRede();          // das Spiel ging mitten im Gespräch zu
    var s = schrittJetzt();
    if (!s) return weiter();
    if (s.art === 'warte' && KALENDER.wach() - E.laeuft.seit >= (s.stunden || 1)) weiter();
    else if (s.art === 'ort' && !s.aktion && Math.hypot(s.x - x, s.z - z) < (s.r || 2)) { if (s.meldung) KERN.meldung(s.meldung, 'perfekt'); weiter(); }
  }

  // ---------- Was die Welt wissen will ----------
  // Der Hinweis-Text unten im Bild (oder null)
  function hinweis() {
    var g = jetzt(), s = schrittJetzt();
    if (!g || !s || (g.welt && g.welt !== weltJetzt)) return null;
    if (s.art === 'rede') {
      var o = PERSONEN.wo(s.wer), name = (PERSONEN.brief(s.wer) || { name: s.wer }).name;
      if (!o || !o.da) return '💤 ' + name + ' ist gerade nicht auf dem Hof. Die Geschichte „' + g.titel + '“ geht weiter, wenn ' + name + ' wieder da ist.';
      if (REDEN.offen()) return null;
    }
    return s.hinweis || null;
  }
  // Wo geht es hin? { x, z, art } für das Ausrufezeichen über der Stelle oder der Person (oder null)
  function marke() {
    var g = jetzt(), s = schrittJetzt();
    if (!g || !s || (g.welt && g.welt !== weltJetzt)) return null;
    if (s.art === 'ort') return { x: s.x, z: s.z, art: 'ort' };
    if (s.art === 'rede') { var o = PERSONEN.wo(s.wer); return o && o.da ? { x: o.x, z: o.z, art: 'person' } : null; }
    return null;
  }
  // Gibt es an dieser Stelle etwas zu tun? { x, z, r, text, tun } für den Aktionsknopf (oder null)
  function aktion() {
    var s = schrittJetzt(), g = jetzt();
    if (!g || !s || s.art !== 'ort' || !s.aktion || (g.welt && g.welt !== weltJetzt)) return null;
    return { x: s.x, z: s.z, r: s.r || 2, text: s.aktion, tun: function () { if (s.meldung) KERN.meldung(s.meldung, 'perfekt'); KERN.klang('gut'); weiter(); } };
  }
  // Hat die Geschichte gerade ein Gespräch für diese Person? (fragt REDEN, bevor es ein normales Gespräch aussucht)
  function redeFuer(wer) {
    var g = jetzt(), s = schrittJetzt();
    if (!g || !s || s.art !== 'rede' || PERSONEN.kennung(s.wer) !== wer) return null;
    var nr = E.laeuft.schritt;
    return {
      id: g.id + '_' + nr, text: s.text,
      antworten: (s.antworten || [{ text: 'Gut!', weiter: true }]).map(function (a) {
        var b = { text: a.text, dann: a.dann, herz: a.herz, merker: a.merker, muenzen: a.muenzen };
        // erst weiter, wenn die Geschichte noch an derselben Stelle steht (falls doppelt getippt wird)
        if (a.weiter) b.tun = function () { if (E.laeuft && E.laeuft.id === g.id && E.laeuft.schritt === nr) E.laeuft.wartet = true; };
        return b;
      })
    };
  }
  // Nach einem Gespräch: Wurde eine Antwort mit "weiter" gewählt? Dann jetzt den nächsten Schritt.
  function nachRede() { if (E.laeuft && E.laeuft.wartet) { delete E.laeuft.wartet; weiter(); } }

  return {
    GESCHICHTEN: GESCHICHTEN, neu: neu, starte: starte, weiter: weiter, brichAb: brichAb, schritt: schritt,
    hinweis: hinweis, marke: marke, aktion: aktion, redeFuer: redeFuer, nachRede: nachRede,
    laeuft: function () { return E.laeuft ? E.laeuft.id : null; }, stand: function () { return E; },
    info: function () { var g = jetzt(); return g ? 'Geschichte „' + g.titel + '“, Schritt ' + (E.laeuft.schritt + 1) + ' von ' + g.schritte.length : 'keine Geschichte'; }
  };
})();
