// ============================================================
//  PERSONEN  -  alle Leute auf dem Hof an einer Stelle
//
//  Jede Person hat einen Steckbrief (Name, Alter, was sie mag).
//  Hier steht auch, wie gut man mit jemandem befreundet ist
//  (Herzen von 0 bis 5) und wo die Person gerade steht.
//
//  Eine neue Person ist ein Eintrag in der Liste STECKBRIEFE,
//  kein neues Programm. Die Welt (zum Beispiel der Hof) meldet
//  ihre Figuren mit PERSONEN.melde(...) an, damit man sie
//  ansprechen kann (js/reden.js) und Geschichten sie finden
//  (js/ereignisse.js).
// ============================================================
var PERSONEN = (function () {
  'use strict';
  var d = STAND.daten;
  d.leute = d.leute || {};               // je Person: { punkte, tag, mal }  (Freundschaft und wann man zuletzt geredet hat)

  // ---------- Zum Einstellen ----------
  var PUNKTE_JE_HERZ = 3, HERZEN_MAX = 5;

  // ---------- Die Steckbriefe ----------
  // rolle: hofkind | hof (wohnt oder arbeitet hier) | gast (Ferienkind) | besuch
  var STECKBRIEFE = [
    { id: 'emma', name: 'Emma', rolle: 'hofkind', alter: 11, mag: 'Springen', sagt: 'ist mutig und lacht viel' },
    { id: 'jonas', name: 'Jonas', rolle: 'hofkind', alter: 12, junge: true, mag: 'Geländeritte', sagt: 'kennt jeden Weg im Wald' },
    { id: 'hanna', name: 'Hanna', rolle: 'hofkind', alter: 10, mag: 'Dressur', sagt: 'ist ruhig und sehr genau' },
    { id: 'ben', name: 'Ben', rolle: 'hofkind', alter: 9, junge: true, mag: 'Füttern und Leckerli', sagt: 'hat immer Möhren in der Tasche' },
    { id: 'lina', name: 'Lina', rolle: 'hofkind', alter: 12, mag: 'Voltigieren', sagt: 'turnt sogar auf dem Zaun' },
    { id: 'paul', name: 'Paul', rolle: 'hofkind', alter: 10, junge: true, mag: 'Hufe und Technik', sagt: 'will später Hufschmied werden' },
    { id: 'lotte', name: 'Lotte', rolle: 'hof', alter: 13, mag: 'das Fohlen', sagt: 'wohnt auf dem Hof und hilft überall' },
    { id: 'mia', name: 'Mia', rolle: 'hof', alter: 12, mag: 'Ausritte', sagt: 'kommt jeden Tag mit dem Rad' }
  ];
  function kennung(name) { return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function brief(id) { id = kennung(id); for (var i = 0; i < STECKBRIEFE.length; i++) if (STECKBRIEFE[i].id === id) return STECKBRIEFE[i]; return null; }
  // Eine neue Person dazunehmen (zum Beispiel ein Ferienkind). Gibt den Steckbrief zurück.
  function neu(b) {
    if (!b || !b.name) return null;
    b.id = kennung(b.id || b.name);
    var alt = brief(b.id);
    if (alt) return alt;
    STECKBRIEFE.push(b);
    return b;
  }

  // ---------- Freundschaft ----------
  function stand(id) { id = kennung(id); return d.leute[id] || (d.leute[id] = { punkte: 0, tag: 0, mal: 0 }); }
  function herzen(id) { return Math.min(HERZEN_MAX, Math.floor(stand(id).punkte / PUNKTE_JE_HERZ)); }
  // Freundschaft ändern. Gibt true zurück, wenn dabei ein neues Herz dazugekommen ist.
  function freund(id, punkte) {
    var s = stand(id), vorher = herzen(id);
    s.punkte = Math.max(0, Math.min(HERZEN_MAX * PUNKTE_JE_HERZ, s.punkte + (punkte || 0)));
    STAND.speichere();
    return herzen(id) > vorher;
  }
  function herzText(id) { var h = herzen(id), t = ''; for (var i = 0; i < HERZEN_MAX; i++) t += i < h ? '❤️' : '🤍'; return t; }

  // ---------- Wer steht gerade wo? ----------
  // Die Welt meldet jede Figur an: PERSONEN.melde('emma', { wo: function () { return { x, z, da, frei }; }, halte: function (sek) {} })
  //   da = ist zu sehen, frei = kann gerade angesprochen werden, halte = bleib kurz stehen und schau zur Spielerin
  var figuren = {};
  function melde(id, figur) { figuren[kennung(id)] = figur; }
  function alleAb() { figuren = {}; }
  function wo(id) { var f = figuren[kennung(id)]; return f ? f.wo() : null; }
  function halte(id, sek) { var f = figuren[kennung(id)]; if (f && f.halte) f.halte(sek); }
  // Wer steht am nächsten bei (x, z) und kann angesprochen werden? Gibt { id, name, x, z, weit } oder null zurück.
  function inNaehe(x, z, r) {
    var beste = null;
    Object.keys(figuren).forEach(function (id) {
      var o = figuren[id].wo();
      if (!o || !o.da || !o.frei) return;
      var w = Math.hypot(o.x - x, o.z - z);
      if (w <= r && (!beste || w < beste.weit)) beste = { id: id, name: (brief(id) || { name: id }).name, x: o.x, z: o.z, weit: w };
    });
    return beste;
  }

  // ---------- Wege-Netz ----------
  // Punkte und Verbindungen, auf denen Figuren laufen. knoten = { name: [x, z] }, kanten = [[von, nach], ...]
  // Gibt ein Netz zurück: route(von, nach) = der kürzeste Weg als Liste von Namen (der Start steht vorn).
  function netz(knoten, kanten) {
    var nachbarn = {};
    kanten.forEach(function (k) { (nachbarn[k[0]] = nachbarn[k[0]] || []).push(k[1]); (nachbarn[k[1]] = nachbarn[k[1]] || []).push(k[0]); });
    function weite(a, b) { return Math.hypot(knoten[a][0] - knoten[b][0], knoten[a][1] - knoten[b][1]); }
    function route(von, nach) {
      var lang = {}, her = {}, offen = [von], fertig = {};
      lang[von] = 0;
      while (offen.length) {
        offen.sort(function (a, b) { return lang[a] - lang[b]; });
        var n = offen.shift();
        if (n === nach) break;
        if (fertig[n]) continue;
        fertig[n] = true;
        (nachbarn[n] || []).forEach(function (m) {
          var l = lang[n] + weite(n, m);
          if (lang[m] === undefined || l < lang[m]) { lang[m] = l; her[m] = n; offen.push(m); }
        });
      }
      var weg = [nach];
      while (weg[0] !== von && her[weg[0]]) weg.unshift(her[weg[0]]);
      return weg;
    }
    return { knoten: knoten, nachbarn: nachbarn, weite: weite, route: route };
  }

  return {
    STECKBRIEFE: STECKBRIEFE, kennung: kennung, brief: brief, neu: neu,
    herzen: herzen, herzText: herzText, freund: freund, stand: stand, HERZEN_MAX: HERZEN_MAX,
    melde: melde, alleAb: alleAb, wo: wo, halte: halte, inNaehe: inNaehe, netz: netz
  };
})();
