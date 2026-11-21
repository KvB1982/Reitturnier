// ============================================================
//  DRESSUR  -  Aufgaben wie auf einem echten Turnier
//
//  Das Viereck ist 20 x 40 m (Klassen E, A, L) oder 20 x 60 m (M, S, Grand Prix).
//  Bahnpunkte: A K E H C M B F, im großen Viereck dazu V S R P,
//  auf der Mittellinie D L X I G.
//
//  Jede Aufgabe besteht aus Lektionen. Für jede Lektion geben drei Richter
//  eine Note von 0 bis 10. Wichtige Lektionen zählen doppelt (Koeffizient 2).
//  Am Ende kommen die Schlussnoten dazu, alles zusammen ergibt Prozent.
//  Was hier nachgebaut ist und woher es stammt: docs/dressur.md
// ============================================================
WELTEN.dressur = (function () {
  'use strict';
  var GANG = ['steh', 'schritt', 'trab', 'galopp'], GANG_TEMPO = [0, 1.7, 3.7, 6.2], GANG_TEXT = ['Halt', 'Schritt', 'Trab', 'Galopp'];
  var GANG_FARBE = [0xffffff, 0x3f9bff, 0xff3d7f, 0xff9a1f];     // Farbe der Linie am Boden: Schritt blau, Trab rosa, Galopp orange
  var GANG_CSS = ['#fff', '#3f9bff', '#ff3d7f', '#ff9a1f'];
  var PI = Math.PI;
  var HL = 20;                 // halbe Länge des Vierecks (20 oder 30 Meter)
  var W = 9, ECKE = 3;         // der Hufschlag liegt 1 Meter innen an der Bande, Ecken sind Viertelkreise
  var SPRUNG = 4.19;           // Länge eines Galoppsprungs (wie in reiten.js)

  // Die Notenskala der Richter (so steht sie in den Regeln der FN und der FEI)
  var NOTEN_WORT = ['nicht ausgeführt', 'sehr schlecht', 'schlecht', 'ziemlich schlecht', 'mangelhaft', 'genügend', 'befriedigend', 'ziemlich gut', 'gut', 'sehr gut', 'ausgezeichnet'];

  // ---------- Linien bauen ----------
  function linie(x0, z0, x1, z1) {
    var p = [], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5));
    for (var i = 0; i <= n; i++) p.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]);
    return p;
  }
  // Bogen um (cx, cz): Winkel 0 = südlich der Mitte, PI/2 = östlich, PI = nördlich
  function bogen(cx, cz, r, w0, w1) {
    var p = [], n = Math.max(2, Math.round(Math.abs(w1 - w0) * r / 0.5));
    for (var i = 0; i <= n; i++) { var w = w0 + (w1 - w0) * i / n; p.push([cx + Math.sin(w) * r, cz + Math.cos(w) * r]); }
    return p;
  }
  function kette() {
    var p = [];
    for (var i = 0; i < arguments.length; i++) { var t = arguments[i]; if (p.length) t = t.slice(1); p = p.concat(t); }
    return p;
  }
  function winkelDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }

  // Wo liegt ein Bahnpunkt? (auf dem Hufschlag oder auf der Mittellinie)
  function pkt(b) {
    var s = HL - 6, t = HL - 1;
    var P = { A: [0, t], C: [0, -t], X: [0, 0], D: [0, s], G: [0, -s], L: [0, 12], I: [0, -12],
      K: [-W, s], E: [-W, 0], H: [-W, -s], M: [W, -s], B: [W, 0], F: [W, s],
      V: [-W, 12], S: [-W, -12], R: [W, -12], P: [W, 12] };
    return P[b];
  }
  // Einmal rund um die ganze Bahn auf der linken Hand: A - F - B - M - C - H - E - K - A
  function rundweg() {
    var t = HL - 1, e = ECKE;
    return kette(linie(0, t, W - e, t), bogen(W - e, t - e, e, 0, PI / 2), linie(W, t - e, W, -(t - e)), bogen(W - e, -(t - e), e, PI / 2, PI),
      linie(W - e, -t, -(W - e), -t), bogen(-(W - e), -(t - e), e, PI, PI * 1.5), linie(-W, -(t - e), -W, t - e), bogen(-(W - e), t - e, e, PI * 1.5, PI * 2), linie(-(W - e), t, -0.5, t));
  }
  function naechster(liste, p) {
    var best = 1e9, bi = 0;
    for (var i = 0; i < liste.length; i++) { var d = Math.hypot(liste[i][0] - p[0], liste[i][1] - p[1]); if (d < best) { best = d; bi = i; } }
    return bi;
  }

  // Besondere Lektionen: Man hält dabei den großen Knopf (oder die Leertaste) gedrückt.
  //   mal    = so viel schneller oder langsamer als die Gangart sonst
  //   quer   = das Pferd stellt sich schräg zur Linie (Schulterherein, Travers)
  //   gerade = das Pferd bleibt fast gerade zur langen Seite und geht seitwärts (Traversale, Schenkelweichen)
  //   eigen  = eigene Bewegung der Beine (Passage, Pirouette)
  var SPEZ = {
    zulegenS: { name: 'Starker Schritt', mal: 1.25 },
    zulegenT: { name: 'Tritte verlängern', mal: 1.3 },
    mittelT: { name: 'Mitteltrab', mal: 1.3 },
    starkT: { name: 'Starker Trab', mal: 1.45 },
    mittelG: { name: 'Mittelgalopp', mal: 1.2 },
    starkG: { name: 'Starker Galopp', mal: 1.35 },
    weichen: { name: 'Schenkelweichen', mal: 0.9, gerade: true },
    sh: { name: 'Schulterherein', mal: 0.9, quer: 0.45 },
    travers: { name: 'Travers', mal: 0.9, quer: -0.45 },
    trav: { name: 'Traversale', mal: 0.9, gerade: true },
    passage: { name: 'Passage', mal: 0.42, eigen: { gang: 'trab', takt: 0.9, kraft: 1, hub: 0.09 } },
    piru: { name: 'Pirouette', mal: 0.2, eng: true, eigen: { gang: 'galopp', takt: 1.5, kraft: 0.85, hub: 0.05 } },
    kehrt: { name: 'Kurzkehrt', mal: 0.55, eng: true }
  };

  // ---------- Der Bauer: malt den Weg einer Aufgabe Stück für Stück ----------
  // Er merkt sich, wo das Pferd gerade ist und wohin es schaut.
  function Bauer() {
    var B = { hand: 1, liste: [] }, x = 0, z = HL + 7, h = PI, runde = rundweg();
    function ende(p, kurs) { var b = p[p.length - 1], a = p[p.length - 2]; x = b[0]; z = b[1]; h = kurs === undefined ? Math.atan2(b[0] - a[0], b[1] - a[1]) : kurs; h = ((h % (PI * 2)) + PI * 2) % (PI * 2); return p; }
    // gerade Linie zu einem Bahnpunkt ('X') oder zu einer Stelle [x, z]
    B.nach = function (ziel) { var q = typeof ziel === 'string' ? pkt(ziel) : ziel; return ende(linie(x, z, q[0], q[1])); };
    // ein Stück geradeaus
    B.vor = function (l) { return ende(linie(x, z, x + Math.sin(h) * l, z + Math.cos(h) * l)); };
    // Kreisbogen: r = Halbmesser, hd = +1 nach links, -1 nach rechts, winkel = wie weit herum
    B.kreis = function (r, hd, winkel) {
      if (winkel === undefined) winkel = PI * 2;
      var cx = x + Math.cos(h) * hd * r, cz = z - Math.sin(h) * hd * r, p = [], n = Math.max(6, Math.round(winkel * r / (r < 2 ? 0.3 : 0.5)));
      for (var i = 0; i <= n; i++) { var a = h + hd * winkel * i / n; p.push([cx - hd * r * Math.cos(a), cz + hd * r * Math.sin(a)]); }
      return ende(p, h + hd * winkel);
    };
    // auf dem Hufschlag weiter bis zu einem Bahnpunkt (in der Richtung von B.hand)
    B.bahn = function (ziel) {
      var q = typeof ziel === 'string' ? pkt(ziel) : ziel, i0 = naechster(runde, [x, z]), i1 = naechster(runde, q), n = runde.length, p = [[x, z]];
      var i = i0;
      do { i = (i + B.hand + n) % n; p.push(runde[i]); } while (i !== i1 && p.length < n + 2);
      return ende(p);
    };
    // von der Mittellinie auf den Hufschlag abbiegen (bei C oder A)
    B.ab_auf = function (hd) { B.hand = hd; return kette(B.nach([0, (h > PI / 2 && h < PI * 1.5 ? -1 : 1) * (HL - 1 - ECKE)]), B.kreis(ECKE, hd, PI / 2)); };
    // vom Hufschlag auf die Mittellinie abbiegen (bei A oder C)
    B.aufMitte = function (bei) { var t = pkt(bei); return kette(B.bahn([-B.hand * ECKE * (t[1] > 0 ? 1 : -1), t[1]]), B.kreis(ECKE, B.hand, PI / 2)); };
    // einfache Schlangenlinie an der langen Seite: bis 5 Meter in die Bahn und zurück
    B.schlange1 = function (ziel) {
      var q = pkt(ziel), p = [], n = Math.round(Math.abs(q[1] - z) / 0.5), x0 = x, z0 = z, innen = x0 > 0 ? -1 : 1;
      for (var i = 0; i <= n; i++) { var t = i / n; p.push([x0 + innen * 5 * Math.pow(Math.sin(PI * t), 2), z0 + (q[1] - z0) * t]); }
      return ende(p, h);
    };
    // Schlangenlinie durch die ganze Bahn mit n Bögen (von A nach C oder umgekehrt)
    B.schlange = function (n) {
      var r = (HL - 1) / n, p = [], hd = -B.hand;
      for (var i = 0; i < n; i++) { hd = -hd; p.push(B.kreis(r, hd, PI)); }
      if (n % 2 === 0) B.hand = -B.hand;
      return kette.apply(null, p);
    };
    // ein Abschnitt einer Lektion: Gangart (1 Schritt, 2 Trab, 3 Galopp), Weg, besondere Lektion
    B.ab = function (gang, weg, art, mehr) {
      var s = null, k;
      if (art) { s = {}; for (k in SPEZ[art]) s[k] = SPEZ[art][k]; s.hand = B.hand; for (k in (mehr || {})) s[k] = mehr[k]; }
      else if (mehr) s = mehr;
      return { gang: gang, weg: weg, spez: s };
    };
    // seitwärts zu einem Bahnpunkt (Traversale oder Schenkelweichen): das Pferd bleibt gerade zur langen Seite
    B.seit = function (gang, ziel, art) { var z0 = z, a = B.ab(gang, B.nach(ziel), art || 'trav'); a.spez.kopf = z < z0 ? PI : 0; return a; };
    // Pirouette oder Kurzkehrt: erst ein paar Meter versammeln, dann auf der Stelle drehen
    B.dreh = function (gang, hd, winkel, art) { return B.ab(gang, kette(B.vor(gang === 3 ? 4 : 1.5), B.kreis(gang === 3 ? 1.2 : 0.8, hd, winkel)), art || 'piru'); };
    // fliegende Galoppwechsel: sprung = alle wie viele Galoppsprünge (4, 3, 2, 1), bei = einzelner Wechsel an einer Stelle (0..1)
    B.wechsel = function (weg, sprung, bei) { return { gang: 3, weg: weg, spez: { name: 'Fliegender Wechsel', sprung: sprung, bei: bei } }; };
    // eine Lektion aus Abschnitten zusammensetzen.  k = Koeffizient (2 = zählt doppelt)
    B.lek = function (text, k, teile, kurz) {
      var L = { text: text, k: k || 1, weg: [], ab: [], sterne: [], kurz: kurz || text };
      teile.forEach(function (t) {
        var von = L.weg.length ? L.weg.length - 1 : 0;
        L.weg = L.weg.length ? L.weg.concat(t.weg.slice(1)) : t.weg.slice();
        L.ab.push({ bis: L.weg.length - 1, von: von, gang: t.gang, spez: t.spez });
      });
      L.laengen = [0];
      for (var i = 1; i < L.weg.length; i++) L.laengen.push(L.laengen[i - 1] + Math.hypot(L.weg[i][0] - L.weg[i - 1][0], L.weg[i][1] - L.weg[i - 1][1]));
      // Sterne für die fliegenden Wechsel verteilen
      L.ab.forEach(function (a) {
        if (!a.spez || (!a.spez.sprung && a.spez.bei === undefined)) return;
        var s0 = L.laengen[a.von], s1 = L.laengen[a.bis], stellen = [];
        if (a.spez.sprung) { var d = a.spez.sprung * SPRUNG, n = Math.max(1, Math.floor((s1 - s0 - 11) / d) + 1), start = (s0 + s1) / 2 - (n - 1) * d / 2; for (var j = 0; j < n; j++) stellen.push(start + j * d); }
        else stellen.push(s0 + (s1 - s0) * a.spez.bei);
        stellen.forEach(function (s) { var i2 = a.von; while (i2 < a.bis && L.laengen[i2] < s) i2++; L.sterne.push({ i: i2, s: L.laengen[i2], gut: -1 }); });
      });
      B.liste.push(L);
      return L;
    };
    // anhalten und grüßen
    B.halt = function (text, wo) { B.liste.push({ text: text, kurz: text, k: 1, halt: true, punkt: pkt(wo || 'X') }); };
    // auf der Stelle: 'piaffe' (im Trab, Knopf halten) oder 'rueck' (aus dem Halten rückwärts, Knopf halten)
    B.steh = function (text, art, k, dauer) {
      B.liste.push({ text: text, kurz: text, k: k || 1, steh: art, dauer: dauer || (art === 'piaffe' ? 7 : 3), name: art === 'piaffe' ? 'Piaffe' : 'Rückwärtsrichten' });
      if (art === 'rueck') { x -= Math.sin(h) * 2.4; z -= Math.cos(h) * 2.4; }
    };
    B.ort = function () { return [x, z]; };
    B.einreiten = function (gang, text) { B.lek(text, 1, [B.ab(gang, B.nach('X'))]); B.halt('X: Halten und Grüßen'); };
    B.schluss = function (gang, text) { B.lek(text, 1, [B.ab(gang, kette(B.aufMitte('A'), B.nach('X')))]); B.halt('X: Halten und Grüßen'); };
    return B;
  }

  // ============================================================
  //  DIE AUFGABEN  -  selbst zusammengestellt, aber aus den Lektionen,
  //  die in der jeweiligen Klasse wirklich verlangt werden.
  // ============================================================
  var AUFGABEN = [
    { id: 'e', name: 'Klasse E', stufe: 'Einsteiger', lang: 40, merk: 'dressur1', text: 'Schritt, Trab, Galopp, Zirkel und Handwechsel',
      baue: function (B) {
        B.einreiten(2, 'A – X: Einreiten im Arbeitstrab');
        B.lek('Im Arbeitstrab anreiten. C: linke Hand, ganze Bahn bis A', 1, [B.ab(2, kette(B.ab_auf(1), B.bahn('A')))], 'C – H – E – K – A: ganze Bahn im Arbeitstrab');
        B.lek('A: Zirkel links (20 Meter) im Arbeitstrab', 1, [B.ab(2, B.kreis(9, 1))]);
        B.lek('F – X – H: durch die ganze Bahn wechseln', 1, [B.ab(2, kette(B.bahn('F'), B.nach('H')))]); B.hand = -1;
        B.lek('H – C – M: Mittelschritt', 2, [B.ab(1, B.bahn('M'))]);
        B.lek('M – B – F – A: Arbeitstrab', 1, [B.ab(2, B.bahn('A'))]);
        B.lek('A: Zirkel rechts, dabei angaloppieren', 1, [B.ab(2, B.kreis(9, -1, PI / 2)), B.ab(3, B.kreis(9, -1, PI * 1.5))], 'A: Zirkel rechts im Arbeitsgalopp');
        B.lek('A – K – E: Arbeitsgalopp. E: Arbeitstrab bis H', 1, [B.ab(3, B.bahn('E')), B.ab(2, B.bahn('H'))], 'A – K – E Galopp, E Übergang zum Trab');
        B.lek('H – C – M – B – F: Arbeitstrab', 1, [B.ab(2, B.bahn('F'))]);
        B.schluss(2, 'A: auf die Mittellinie');
      } },
    { id: 'a', name: 'Klasse A', stufe: 'Anfänger', lang: 40, merk: 'dressur2', text: 'dazu Volte, Schlangenlinien, Tritte verlängern, Schenkelweichen, Rückwärtsrichten',
      baue: function (B) {
        B.einreiten(2, 'A – X: Einreiten im Arbeitstrab');
        B.lek('Im Arbeitstrab anreiten. C: rechte Hand, bis B', 1, [B.ab(2, kette(B.ab_auf(-1), B.bahn('B')))], 'C – M – B: Arbeitstrab');
        B.lek('B: Volte rechts (10 Meter)', 1, [B.ab(2, B.kreis(5, -1))]);
        B.lek('B – F – A: Arbeitstrab', 1, [B.ab(2, B.bahn('A'))]);
        B.lek('A – C: Schlangenlinie durch die ganze Bahn, 3 Bögen', 2, [B.ab(2, B.schlange(3))]);
        B.lek('C – M: Arbeitstrab. M – X – K: Tritte verlängern', 1, [B.ab(2, B.bahn('M')), B.ab(2, B.nach('K'), 'zulegenT')], 'M – X – K: Tritte verlängern'); B.hand = 1;
        B.lek('K – A – F: Arbeitstrab', 1, [B.ab(2, B.bahn('F'))]);
        B.lek('F – B – M: Viereck verkleinern und vergrößern (Schenkelweichen)', 2, [B.seit(2, [W - 5, 0], 'weichen'), B.seit(2, 'M', 'weichen')]);
        B.lek('M – C – H: Mittelschritt', 2, [B.ab(1, B.bahn('H'))]);
        B.lek('H – E: Arbeitstrab', 1, [B.ab(2, B.bahn('E'))]);
        B.steh('E: Halten. Eine Pferdelänge rückwärtsrichten', 'rueck', 1);
        B.lek('Im Arbeitstrab anreiten, E – K – A', 1, [B.ab(2, B.bahn('A'))]);
        B.lek('A: Zirkel links, dabei angaloppieren', 1, [B.ab(2, B.kreis(9, 1, PI / 2)), B.ab(3, B.kreis(9, 1, PI * 1.5))], 'A: Zirkel links im Arbeitsgalopp');
        B.lek('A – F – B – M: Arbeitsgalopp. M: Arbeitstrab bis C', 1, [B.ab(3, B.bahn('M')), B.ab(2, B.bahn('C'))], 'Galopp ganze Bahn, M Übergang zum Trab');
        B.lek('C – H: Trab. H – K: einfache Schlangenlinie', 1, [B.ab(2, B.bahn('H')), B.ab(2, B.schlange1('K'))], 'H – K: einfache Schlangenlinie');
        B.schluss(2, 'A: auf die Mittellinie');
      } },
    { id: 'l', name: 'Klasse L', stufe: 'Leicht', lang: 40, merk: 'dressur3', text: 'dazu Volte 8 m, Mitteltrab, Kurzkehrt, Außengalopp, einfacher Galoppwechsel',
      baue: function (B) {
        B.einreiten(2, 'A – X: Einreiten im versammelten Trab');
        B.lek('Im Trab anreiten. C: linke Hand, H – E', 1, [B.ab(2, kette(B.ab_auf(1), B.bahn('E')))], 'C – H – E: versammelter Trab');
        B.lek('E: Volte links (8 Meter)', 1, [B.ab(2, B.kreis(4, 1))]);
        B.lek('E – K – A – F: versammelter Trab', 1, [B.ab(2, B.bahn('F'))]);
        B.lek('F – X – H: Mitteltrab', 2, [B.ab(2, B.nach('H'), 'mittelT')]); B.hand = -1;
        B.lek('H – C – M: Mittelschritt', 2, [B.ab(1, B.bahn('M'))]);
        B.lek('M: Kurzkehrt rechts', 1, [B.dreh(1, -1, PI, 'kehrt')]); B.hand = 1;
        B.lek('Im Schritt zurück zu C', 1, [B.ab(1, kette(B.nach([W, -(HL - 6)]), B.bahn('C')))], 'M – C: Mittelschritt');
        B.lek('C: links angaloppieren. C – H – E – K – A – F', 1, [B.ab(3, B.bahn('F'))], 'C bis F: versammelter Galopp');
        B.lek('F – X – H: durch die ganze Bahn wechseln, ohne Galoppwechsel', 1, [B.ab(3, B.nach('H'))]); B.hand = -1;
        B.lek('H – C: Außengalopp', 2, [B.ab(3, B.bahn('C'))]);
        B.lek('C: einfacher Galoppwechsel (Galopp – Schritt – Galopp)', 2, [B.ab(1, B.bahn([4.5, -(HL - 1)])), B.ab(3, B.bahn('M'))]);
        B.lek('M – B – F: Mittelgalopp', 1, [B.ab(3, B.bahn('F'), 'mittelG')]);
        B.lek('F – A: versammelter Galopp. A: Trab bis E', 1, [B.ab(3, B.bahn('A')), B.ab(2, B.bahn('E'))], 'A: Übergang zum Trab');
        B.steh('E: Halten. Vier Tritte rückwärtsrichten', 'rueck', 1);
        B.lek('Im Trab anreiten, E – H – C – M – B – F', 1, [B.ab(2, B.bahn('F'))]);
        B.schluss(2, 'A: auf die Mittellinie');
      } },
    { id: 'm', name: 'Klasse M', stufe: 'Mittelschwer', lang: 60, merk: 'dressur4', text: 'großes Viereck: Schulterherein, Travers, Traversalen, fliegender Galoppwechsel',
      baue: function (B) {
        B.einreiten(2, 'A – X: Einreiten im versammelten Trab');
        B.lek('Im Trab anreiten. C: linke Hand bis H', 1, [B.ab(2, kette(B.ab_auf(1), B.bahn('H')))], 'C – H: versammelter Trab');
        B.lek('H – E: Schulterherein links', 2, [B.ab(2, B.bahn('E'), 'sh')]);
        B.lek('E: Volte links (8 Meter)', 1, [B.ab(2, B.kreis(4, 1))]);
        B.lek('E – K: Travers links', 2, [B.ab(2, B.bahn('K'), 'travers')]);
        B.lek('K – A – F: versammelter Trab', 1, [B.ab(2, B.bahn('F'))]);
        B.lek('F – X: Traversale nach links', 2, [B.seit(2, 'X')]);
        B.lek('X – G: geradeaus. C: rechte Hand bis M', 1, [B.ab(2, kette(B.ab_auf(-1), B.bahn('M')))], 'X – C – M: versammelter Trab');
        B.lek('M – X – K: starker Trab', 2, [B.ab(2, B.nach('K'), 'starkT')]); B.hand = 1;
        B.lek('K – A: Mittelschritt', 2, [B.ab(1, B.bahn('A'))]);
        B.lek('A: links angaloppieren. A – F – B – M – C – H', 1, [B.ab(3, B.bahn('H'))], 'A bis H: versammelter Galopp');
        B.lek('H – X – F: Mittelgalopp, vor F fliegender Galoppwechsel', 2, [B.ab(3, B.nach([4.5, (HL - 6) / 2]), 'mittelG'), B.wechsel(B.nach('F'), 0, 0.6)], 'H – X – F: Mittelgalopp, fliegender Wechsel'); B.hand = -1;
        B.lek('F – A – K: versammelter Galopp', 1, [B.ab(3, B.bahn('K'))]);
        B.lek('K – X: Galopptraversale nach rechts', 2, [B.seit(3, 'X')]);
        B.lek('X – G: geradeaus, bei I fliegender Galoppwechsel. C: linke Hand', 2, [B.wechsel(B.nach([0, -(HL - 4)]), 0, 0.45), B.ab(3, kette(B.kreis(ECKE, 1, PI / 2), (B.hand = 1, B.bahn('H'))))], 'I: fliegender Galoppwechsel');
        B.lek('H – E: Galopp. E: Trab bis K', 1, [B.ab(3, B.bahn('E')), B.ab(2, B.bahn('K'))], 'E: Übergang zum Trab');
        B.schluss(2, 'A: auf die Mittellinie');
      } },
    { id: 's', name: 'Klasse S', stufe: 'Schwer, wie ein Prix St. Georges', lang: 60, merk: 'dressur5', text: 'Traversalen im Zickzack, halbe Galopp-Pirouetten, Wechsel alle 4 und alle 3 Sprünge',
      baue: function (B) {
        B.einreiten(3, 'A – X: Einreiten im versammelten Galopp');
        B.lek('Im Trab anreiten. C: rechte Hand bis M', 1, [B.ab(2, kette(B.ab_auf(-1), B.bahn('M')))], 'C – M: versammelter Trab');
        B.lek('M – B: Schulterherein rechts', 1, [B.ab(2, B.bahn('B'), 'sh')]);
        B.lek('B: Volte rechts (8 Meter)', 1, [B.ab(2, B.kreis(4, -1))]);
        B.lek('B – F – A – K: versammelter Trab', 1, [B.ab(2, B.bahn('K'))]);
        B.lek('K – X: Traversale nach rechts. X – H: Traversale nach links', 2, [B.seit(2, 'X'), B.seit(2, 'H')], 'K – X – H: Traversalen');
        B.lek('H – C: Mittelschritt', 2, [B.ab(1, B.bahn('C'))]);
        B.lek('C: rechts angaloppieren bis M', 1, [B.ab(3, B.bahn('M'))], 'C – M: versammelter Galopp');
        B.lek('M – X: halbe Pirouette rechts, zurück zu M', 2, [B.ab(3, B.nach([W * 0.5, -(HL - 6) * 0.5])), B.dreh(3, -1, PI), B.ab(3, B.nach('M'))], 'Halbe Galopp-Pirouette rechts'); B.hand = 1;
        B.lek('M – C: Außengalopp. Bei C fliegender Galoppwechsel, bis H', 1, [B.wechsel(B.bahn('C'), 0, 0.92), B.ab(3, B.bahn('H'))], 'C: fliegender Galoppwechsel');
        B.lek('H – X: halbe Pirouette links, zurück zu H', 2, [B.ab(3, B.nach([-W * 0.5, -(HL - 6) * 0.5])), B.dreh(3, 1, PI), B.ab(3, B.nach('H'))], 'Halbe Galopp-Pirouette links'); B.hand = -1;
        B.lek('H – C: Außengalopp. Bei C fliegender Galoppwechsel, bis M', 1, [B.wechsel(B.bahn('C'), 0, 0.92), B.ab(3, B.bahn('M'))], 'C: fliegender Galoppwechsel');
        B.lek('M – X – K: fliegende Wechsel alle 4 Galoppsprünge', 2, [B.wechsel(B.nach('K'), 4)], 'M – X – K: Wechsel zu 4 Sprüngen'); B.hand = 1;
        B.lek('K – A – F: versammelter Galopp', 1, [B.ab(3, B.bahn('F'))]);
        B.lek('F – X – H: fliegende Wechsel alle 3 Galoppsprünge', 2, [B.wechsel(B.nach('H'), 3)], 'F – X – H: Wechsel zu 3 Sprüngen'); B.hand = -1;
        B.lek('H – C – M: versammelter Trab', 1, [B.ab(2, B.bahn('M'))]);
        B.lek('M – B – F: starker Trab', 2, [B.ab(2, B.bahn('F'), 'starkT')]);
        B.schluss(2, 'A: auf die Mittellinie');
      } },
    { id: 'gp', name: 'Grand Prix', stufe: 'die schwerste Prüfung der Welt', lang: 60, merk: 'dressur6', text: 'Passage, Piaffe, ganze Pirouetten, Wechsel von Sprung zu Sprung',
      baue: function (B) {
        B.einreiten(3, 'A – X: Einreiten im versammelten Galopp');
        B.lek('Im Trab anreiten. C: linke Hand bis H', 1, [B.ab(2, kette(B.ab_auf(1), B.bahn('H')))], 'C – H: versammelter Trab');
        B.lek('H – X – F: starker Trab', 1, [B.ab(2, B.nach('F'), 'starkT')]); B.hand = -1;
        B.lek('F – A – K: versammelter Trab', 1, [B.ab(2, B.bahn('K'))]);
        B.lek('K – B: Traversale nach rechts. B – H: Traversale nach links', 2, [B.seit(2, 'B'), B.seit(2, 'H')], 'K – B – H: Traversalen');
        B.lek('H – C: versammelter Trab. C – M: Passage', 2, [B.ab(2, B.bahn('C')), B.ab(2, B.bahn('M'), 'passage')], 'C – M: Passage');
        B.steh('M: Piaffe, 12 bis 15 Tritte', 'piaffe', 2);
        B.lek('M – R: Passage', 1, [B.ab(2, B.bahn('R'), 'passage')]);
        B.lek('R – B – P: starker Schritt', 2, [B.ab(1, B.bahn('P'), 'zulegenS')]);
        B.lek('P – F: versammelter Schritt. F – A: Passage', 1, [B.ab(1, B.bahn('F')), B.ab(2, B.bahn('A'), 'passage')], 'F – A: Passage');
        B.lek('A: aus der Passage rechts angaloppieren, bis K', 1, [B.ab(3, B.bahn('K'))], 'A – K: versammelter Galopp');
        B.lek('K – X – M: fliegende Wechsel alle 2 Galoppsprünge', 1, [B.wechsel(B.nach('M'), 2)], 'K – X – M: Wechsel zu 2 Sprüngen'); B.hand = 1;
        B.lek('M – C – H: versammelter Galopp', 1, [B.ab(3, B.bahn('H'))]);
        B.lek('H – X – F: fliegende Wechsel von Sprung zu Sprung', 2, [B.wechsel(B.nach('F'), 1)], 'H – X – F: Einerwechsel'); B.hand = -1;
        B.lek('F – A: Galopp. A: auf die Mittellinie bis L', 1, [B.ab(3, kette(B.aufMitte('A'), B.nach([0, 16])))], 'A: auf die Mittellinie');
        B.lek('L: ganze Pirouette rechts', 2, [B.dreh(3, -1, PI * 2)]);
        B.lek('X: fliegender Galoppwechsel', 1, [B.wechsel(B.nach([0, -8]), 0, 0.6)]);
        B.lek('I: ganze Pirouette links', 2, [B.dreh(3, 1, PI * 2)]);
        B.lek('G – C: linke Hand bis H. H – S: Übergang zum Trab', 1, [B.ab(3, kette(B.ab_auf(1), B.bahn('H'))), B.ab(2, B.bahn('S'))], 'C – H Galopp, H Trab');
        B.lek('S – E – V – K: starker Trab', 1, [B.ab(2, B.bahn('K'), 'starkT')]);
        B.lek('K – A: versammelter Trab. A: auf die Mittellinie. D – X: Passage', 2, [B.ab(2, kette(B.aufMitte('A'), B.nach('D'))), B.ab(2, B.nach('X'), 'passage')], 'A – X: Passage auf der Mittellinie');
        B.steh('X: Piaffe, 12 bis 15 Tritte', 'piaffe', 2);
        B.lek('X – G: Passage', 2, [B.ab(2, B.nach('G'), 'passage')]);
        B.halt('G: Halten und Grüßen', 'G');
      } }
  ];
  // Ab wie viel Prozent in der Klasse davor darf man die nächste reiten?
  var FREI_AB = 55;
  // Ergebnisse der Computergegner in Prozent [von, bis]: wer selbst lenkt, hat es schwerer als mit Automatik
  var KI_PROZENT = { sehrleicht: [45, 58], leicht: [52, 66], mittel: [60, 74], schwer: [68, 82] };
  var KI_PROZENT_AUTO = { sehrleicht: [60, 75], leicht: [68, 82], mittel: [76, 89], schwer: [84, 95] };

  var gebaut = false, szene, kamera, sonne, opt = {}, R = null, punkte = null, ringe = null, sterneNetz = null, ende = null, haus = null, vierecke = {};
  var modus = 'aus', aufgabe = null, nr = 0, lek = null, stufe = 0, noten = [], steuerung = 'lenken';
  var mess = {}, summen = {}, haltZeit = 0, zeit = 0, altHoch = 0, altTaste = { s: false, l: false }, stopp = null, gruss = 0, bremsWeg = 1;
  var druck = false, iNah = 0, abNr = 0, gnade = 0, querGlatt = 0, eigenPhase = 0, hupf = 0, verritten = 0, wegZeit = 0, plan = null, planPferd = null;

  // ---------- Die Welt: Wiese, Richterhaus, Bäume (steht immer) ----------
  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 36, nebelNah: 90, nebelFern: 280 });
    kamera = REITEN.neueKamera();
    var wiese = BAU.netz(new THREE.PlaneGeometry(400, 400), 0x7cc35a, szene); wiese.rotation.x = -PI / 2; wiese.castShadow = false;
    // Richterhäuschen bei C (wandert mit, wenn das Viereck länger wird)
    haus = new THREE.Group(); szene.add(haus);
    BAU.kasten(5, 0.3, 3, 0x9a6b3f, haus, 0, 0.6, 0); BAU.kasten(5, 1.0, 0.15, 0xf4f1e8, haus, 0, 1.25, 1.4);
    [-2.4, 2.4].forEach(function (x) { BAU.kasten(0.15, 2.4, 0.15, 0xf4f1e8, haus, x, 1.95, 1.4); BAU.kasten(0.15, 2.4, 0.15, 0xf4f1e8, haus, x, 1.95, -1.4); });
    var dach = BAU.netz(new THREE.ConeGeometry(4.2, 1.5, 4), 0xa9432f, haus, 0, 3.9, 0); dach.rotation.y = PI / 4;
    for (var r = 0; r < 3; r++) {
      var richter = baueFigur(KERN.zufallsOutfit(Math.random() < 0.5 ? 'frau' : 'mann'), { helm: false });
      richter.setzePose({ beinL: [-1.5, 0, 0], beinR: [-1.5, 0, 0], knieL: [1.5, 0, 0], knieR: [1.5, 0, 0], armL: [-0.7, 0, 0], armR: [-0.7, 0, 0], ellL: [-1.0, 0, 0], ellR: [-1.0, 0, 0], hoch: 0.55 }, true);
      richter.wurzel.position.set(-1.5 + r * 1.5, 0.75, 0.4); haus.add(richter.wurzel);
    }
    var schild = BAU.tafel('Richter', 0.45, { farbe: '#7a3b12' }); schild.position.set(0, 1.25, 1.49); haus.add(schild);
    // Bäume und Zaun drumherum
    var baeume = [], zf = 9;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (var bn = 0; bn < 80; bn++) { var w = zuf() * PI * 2, e = 50 + zuf() * 60; baeume.push([Math.sin(w) * e, 0, Math.cos(w) * e, 0.9 + zuf(), zuf() < 0.3 ? 1 : 0]); }
    szene.add(BAU.wald(baeume));
    szene.add(BAU.zaun([[-24, 44], [-24, -44], [24, -44], [24, 44]], { farbe: 0x8a5a33 }));
    // Linie der aktuellen Lektion: bunte Punkte am Boden (Farbe = Gangart), gelbe Ringe = Knopf halten, Sterne = Wechsel
    punkte = new THREE.InstancedMesh(new THREE.CircleGeometry(0.14, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }), 420);
    ringe = new THREE.InstancedMesh(new THREE.RingGeometry(0.2, 0.34, 10), new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.95, depthWrite: false }), 420);
    sterneNetz = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.32), new THREE.MeshBasicMaterial({ color: 0xffd21f }), 16);
    [punkte, ringe, sterneNetz].forEach(function (m) { m.frustumCulled = false; m.count = 0; szene.add(m); });
    ende = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0xff3d7f }));
    ende.rotation.x = PI;
    szene.add(ende);
    R = REITEN.neu(KERN.pferd, { drehung: 2.4, beschleunigung: 3.5, bremsen: 5, grenze: function (r2) {
      var drin = r2.z < HL - 0.4;
      if (drin || Math.abs(r2.x) > 1.4) { r2.x = Math.max(-9.6, Math.min(9.6, r2.x)); r2.z = Math.max(-(HL - 0.4), Math.min(Math.abs(r2.x) < 1.4 ? HL + 8 : HL - 0.4, r2.z)); }
      else { r2.x = Math.max(-1.4, Math.min(1.4, r2.x)); r2.z = Math.min(HL + 8, r2.z); }
    } });
    // Der große Knopf und die Leertaste: gedrückt halten für besondere Lektionen
    KERN.el('springen').addEventListener('pointerdown', function () { druck = true; });
    ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) { window.addEventListener(ev, function () { druck = false; }); });
    window.addEventListener('keydown', function (e) { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') druck = true; });
    window.addEventListener('keyup', function (e) { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') druck = false; });
    // kleiner Plan vom Viereck oben links
    plan = document.createElement('div'); plan.id = 'dressurPlan'; document.body.appendChild(plan);
    gebaut = true;
  }

  // ---------- Das Viereck: 40 oder 60 Meter lang, mit Bahnbuchstaben ----------
  function zeigeViereck(lang) {
    HL = lang / 2;
    for (var k in vierecke) vierecke[k].visible = false;
    haus.position.set(0, 0, -(HL + 5.5));
    if (vierecke[lang]) { vierecke[lang].visible = true; return; }
    var g = new THREE.Group(); szene.add(g); vierecke[lang] = g;
    var sand = BAU.netz(new THREE.PlaneGeometry(20, lang), 0xe6d3a3, g, 0, 0.02, 0); sand.rotation.x = -PI / 2; sand.castShadow = false;
    var vor = BAU.netz(new THREE.PlaneGeometry(6, 10), 0xe6d3a3, g, 0, 0.015, HL + 5); vor.rotation.x = -PI / 2; vor.castShadow = false;
    // niedrige weiße Einfassung, bei A offen
    g.add(BAU.zaun([[-1.6, HL], [-10, HL], [-10, -HL], [10, -HL], [10, HL], [1.6, HL]], { hoehe: 0.4, latten: 1, abstand: 2 }));
    (lang === 60 ? 'AKVESHCMRBPF' : 'AKEHCMBF').split('').forEach(function (b) {
      var p = pkt(b), aus = b === 'A' ? [2.6, HL + 1.3] : b === 'C' ? [0, -(HL + 1.6)] : [p[0] > 0 ? 11.5 : -11.5, p[1]];
      BAU.kasten(0.8, 0.9, 0.8, 0xffffff, g, aus[0], 0.45, aus[1]);
      for (var s = 0; s < 4; s++) {
        var t = BAU.tafel(b, 0.7, { grund: null, farbe: '#1c1c1c', schrift: 80 });
        t.position.set(aus[0] + Math.sin(s * PI / 2) * 0.41, 0.48, aus[1] + Math.cos(s * PI / 2) * 0.41); t.rotation.y = s * PI / 2;
        g.add(t);
      }
      var blume = BAU.netz(new THREE.SphereGeometry(0.28, 8, 6), [0xff6fae, 0xffe36b, 0xb07cff][b.charCodeAt(0) % 3], g, aus[0], 1.05, aus[1]);
      blume.scale.y = 0.7;
    });
  }

  // ---------- Die Linie am Boden ----------
  function zeigeLinie(L) {
    var d = new THREE.Object3D(), n = 0, nr2 = 0, ns = 0, farbe = new THREE.Color();
    d.rotation.x = -PI / 2;
    if (L && L.weg) {
      var letzte = -9;
      L.ab.forEach(function (a) {
        var halten = a.spez && a.spez.mal !== undefined;
        for (var i = a.von; i <= a.bis && n < 420; i++) {
          if (L.laengen[i] - letzte < 0.95 && i < a.bis) continue;
          letzte = L.laengen[i];
          d.position.set(L.weg[i][0], 0.04, L.weg[i][1]); d.updateMatrix();
          punkte.setMatrixAt(n, d.matrix); punkte.setColorAt(n, farbe.setHex(GANG_FARBE[a.gang])); n++;
          if (halten) { d.position.y = 0.035; d.updateMatrix(); ringe.setMatrixAt(nr2++, d.matrix); }
        }
      });
      d.rotation.set(0, 0, 0);
      L.sterne.forEach(function (s) { d.position.set(L.weg[s.i][0], 1.5, L.weg[s.i][1]); d.updateMatrix(); if (ns < 16) sterneNetz.setMatrixAt(ns++, d.matrix); });
    }
    punkte.count = n; ringe.count = nr2; sterneNetz.count = ns;
    punkte.instanceMatrix.needsUpdate = ringe.instanceMatrix.needsUpdate = sterneNetz.instanceMatrix.needsUpdate = true;
    if (punkte.instanceColor) punkte.instanceColor.needsUpdate = true;
  }
  // ein getroffener oder verpasster Stern verschwindet
  function sternWeg(i) {
    var d = new THREE.Object3D(); d.scale.setScalar(0.0001); d.updateMatrix();
    if (i < 16) { sterneNetz.setMatrixAt(i, d.matrix); sterneNetz.instanceMatrix.needsUpdate = true; }
  }

  // ---------- Der kleine Plan: das Viereck von oben mit Buchstaben, Linie und Pferd ----------
  function zeigePlan(L) {
    if (!plan) return;
    if (!L) { plan.style.display = 'none'; return; }
    var m = 3.1, rand = 15, b = 20 * m + rand * 2, h = HL * 2 * m + rand * 2;
    function px(x) { return (rand + (10 + x) * m).toFixed(1); }
    function pz(z) { return (rand + (HL + z) * m).toFixed(1); }
    var s = '<svg width="' + b + '" height="' + h + '" viewBox="0 0 ' + b + ' ' + h + '"><rect x="' + rand + '" y="' + rand + '" width="' + 20 * m + '" height="' + HL * 2 * m + '" fill="#f0e0b4" stroke="#fff" stroke-width="2"/>';
    (HL === 30 ? 'AKVESHCMRBPF' : 'AKEHCMBF').split('').forEach(function (bu) {
      var p = pkt(bu), x = bu === 'A' || bu === 'C' ? b / 2 : p[0] > 0 ? b - 7 : 7, y = bu === 'A' ? h - 3 : bu === 'C' ? 11 : +pz(p[1]) + 4;
      s += '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="11" font-weight="bold" fill="#5a3a1c">' + bu + '</text>';
    });
    s += '<text x="' + px(0) + '" y="' + (+pz(0) + 3) + '" text-anchor="middle" font-size="9" fill="#b09a6a">X</text>';
    if (L.weg) {
      L.ab.forEach(function (a) {
        var pts = [];
        for (var i = a.von; i <= a.bis; i++) pts.push(px(L.weg[i][0]) + ',' + pz(L.weg[i][1]));
        if (a.spez && a.spez.mal !== undefined) s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#ffd21f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
        s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + GANG_CSS[a.gang] + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      });
      L.sterne.forEach(function (st) { s += '<circle cx="' + px(L.weg[st.i][0]) + '" cy="' + pz(L.weg[st.i][1]) + '" r="3" fill="#ffd21f" stroke="#a87400"/>'; });
    } else if (L.punkt) s += '<circle cx="' + px(L.punkt[0]) + '" cy="' + pz(L.punkt[1]) + '" r="5" fill="none" stroke="#ff3d7f" stroke-width="2"/>';
    s += '<circle id="dressurPlanPferd" r="4" fill="#7a3b12" stroke="#fff" stroke-width="1.5"/></svg>';
    plan.innerHTML = s;
    plan.style.display = 'block';
    planPferd = document.getElementById('dressurPlanPferd');
    planPferd.px = px; planPferd.pz = pz;
  }

  function frei(i) { return i === 0 || (STAND.daten.leistung[AUFGABEN[i - 1].merk] || 0) >= FREI_AB; }
  function waehleAufgabe() {
    modus = 'wahl';
    document.body.className = 'im-welt welt-dressur';
    zeigeViereck(40); zeigePlan(null);
    R.setze(0, HL + 7, PI); R.zeichne(0, 0);
    kamera.userData.sprung = true;
    zeigeLinie(null); ende.visible = false;
    var knoepfe = AUFGABEN.map(function (a, i) {
      var best = STAND.daten.leistung[a.merk];
      if (!frei(i)) return { text: '🔒 ' + a.name + ' (erst ' + FREI_AB + ' % in ' + AUFGABEN[i - 1].name + ')', klasse: 'zweit', aktion: function () { KERN.meldung('Reite zuerst ' + AUFGABEN[i - 1].name + ' mit ' + FREI_AB + ' %!', 'knapp'); } };
      return { text: a.name + ' · ' + a.stufe + (best ? '  ★ ' + best.toFixed(0) + ' %' : ''), aktion: function () { starte(i); } };
    });
    KERN.zeigeKarte('mitte', '<div class="klein">' + (opt.turnier ? 'Dressurprüfung' : 'Dressur üben') + '</div><h2>🎩 Welche Aufgabe?</h2>' +
      '<div class="details" style="text-align:left">Reite die <b>bunte Linie</b> genau nach: <b style="color:#3f9bff">blau = Schritt</b>, <b style="color:#ff3d7f">rosa = Trab</b>, <b style="color:#ff9a1f">orange = Galopp</b>. ' +
      'Mit <b>↑ ↓</b> wechselst du die Gangart' + (steuerung === 'auto' ? ', das Pferd findet den Weg allein.' : ', mit <b>← →</b> lenkst du.') +
      ' Auf dem iPad: hoch / runter und links / rechts wischen.<br><b>Gelbe Ringe:</b> den großen Knopf (oder die Leertaste) <b>gedrückt halten</b>, dann zeigt dein Pferd die besondere Lektion. <b>Gelbe Sterne:</b> genau dort einmal drücken (fliegender Galoppwechsel).<br>' +
      'Drei Richter geben jeder Lektion eine Note von 0 bis 10.</div>',
      knoepfe.concat([{ text: '🎵 Kür mit Musik', aktion: starteKuer }, { text: '📖 Dressur-Wissen', klasse: 'zweit', aktion: function () { wissen(0); } }, { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, null); } }]));
  }

  function starte(i) {
    KERN.schliesseKarte();
    aufgabe = AUFGABEN[i];
    zeigeViereck(aufgabe.lang);
    var B = Bauer();
    aufgabe.baue(B);
    aufgabe.lektionen = B.liste;
    nr = -1; noten = []; stufe = 0; verritten = 0; druck = false; querGlatt = 0;
    summen = { n: 0, richtig: 0, an: 0, summe: 0, spezN: 0, spezGut: 0, sterne: 0, sterneGut: 0 };
    R.setze(0, HL + 7, PI);
    kamera.userData.sprung = true;
    modus = 'start';
    document.body.className = 'im-welt welt-dressur mit-tempo' + (steuerung !== 'auto' ? ' mit-lenken' : '');
    zeigePlan(aufgabe.lektionen[0]);
    if (stopp) stopp();
    stopp = REITEN.countdown(function () { modus = 'ritt'; naechste(); });
  }

  function naechste() {
    nr++;
    if (nr >= aufgabe.lektionen.length) { fertig(); return; }
    lek = aufgabe.lektionen[nr];
    mess = { summe: 0, an: 0, n: 0, richtig: 0, spezN: 0, spezGut: 0, t: 0, gut: 0 };
    haltZeit = 0; iNah = 0; abNr = 0; gnade = 1.2; wegZeit = 0;
    bremsWeg = R.tempo * R.tempo / 10 + 1;      // so weit braucht das Pferd zum Anhalten, das zählt beim Halten nicht als Fehler
    KERN.setzeAktion(null);
    var tipp = '';
    if (lek.weg) {
      lek.sterne.forEach(function (s) { s.gut = -1; });
      zeigeLinie(lek);
      var e = lek.weg[lek.weg.length - 1];
      ende.position.set(e[0], 2.6, e[1]); ende.visible = true;
      if (lek.ab.some(function (a) { return a.spez && a.spez.mal !== undefined; })) tipp = '  ⭐ Gelbe Ringe: Knopf halten!';
      if (lek.sterne.length) tipp = '  ⭐ Bei jedem Stern einmal drücken!';
    } else {
      zeigeLinie(null);
      if (lek.halt) { ende.position.set(lek.punkt[0], 2.6, lek.punkt[1]); ende.visible = true; }
      else { ende.visible = false; tipp = lek.steh === 'piaffe' ? '  ⭐ Im Trab bleiben und Knopf halten!' : '  ⭐ Anhalten, dann Knopf halten!'; }
    }
    zeigePlan(lek);
    setzeHinweis(lek.text + tipp);
  }
  function setzeHinweis(text) {
    KERN.el('weltHinweis').textContent = text || '';
    document.body.classList.toggle('mit-hinweis', !!text);
  }

  function grenze(n) { return Math.max(0, Math.min(10, n)); }
  function halb(n) { return Math.round(grenze(n) * 2) / 2; }
  function note(n) { return halb(n).toFixed(1).replace('.', ','); }
  function bewerte(n) {
    n = grenze(n);
    noten.push({ text: lek.kurz, k: lek.k, note: n });
    // für die Schlussnoten mitzählen
    summen.n += mess.n; summen.richtig += mess.richtig; summen.an += mess.an; summen.summe += mess.summe; summen.spezN += mess.spezN; summen.spezGut += mess.spezGut;
    if (lek.sterne) lek.sterne.forEach(function (s) { summen.sterne++; summen.sterneGut += Math.max(0, s.gut); });
    KERN.meldung('Note ' + note(n) + ' – ' + NOTEN_WORT[Math.round(n)] + (lek.k > 1 ? '  (zählt doppelt)' : ''), n >= 8 ? 'perfekt' : n >= 6.5 ? 'gut' : n >= 5 ? 'knapp' : 'rot');
    KERN.klang(n >= 8 ? 'perfekt' : n >= 6.5 ? 'gut' : n >= 5 ? 'knapp' : 'oh');
    naechste();
  }

  function gangWechsel() {
    var t = KERN.taste, hoch = KERN.wisch.hoch;
    var rauf = (t.schneller && !altTaste.s) || (hoch > 0.6 && altHoch <= 0.6), runter = (t.langsamer && !altTaste.l) || (hoch < -0.6 && altHoch >= -0.6);
    altTaste.s = t.schneller; altTaste.l = t.langsamer; altHoch = hoch;
    if (rauf && stufe < 3) { stufe++; KERN.ton(500 + stufe * 120, 0.08, 'triangle', 0.14); }
    if (runter && stufe > 0) { stufe--; KERN.ton(500 + stufe * 120, 0.08, 'triangle', 0.14); }
    R.wunsch = GANG_TEMPO[stufe];
    R.festerGang = stufe ? GANG[stufe] : null;
  }

  // ============================================================
  //  KUER MIT MUSIK  -  frei reiten, passend zur Musik
  //  Die Musik hat Teile fuer Schritt, Trab und Galopp. Die Richter
  //  bewerten: passt die Gangart zur Musik (Harmonie), wie viele
  //  Figuren gezeigt werden (Choreographie) und der Schlussgruss bei X.
  // ============================================================
  var TON = { C3: 131, G3: 196, A3: 220, F3: 175, G4: 392, A4: 440, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, C6: 1047 };
  // Musikteile: gang (1 Schritt, 2 Trab, 3 Galopp, 0 Halt), sek = Dauer, takt = Sekunden je Schlag
  var KUER_TEILE = [
    { name: 'Trab', gang: 2, sek: 15, takt: 0.2, mel: ['E5', 'G5', 'E5', 'C5', 'D5', 'E5', 'D5', 'A4', 'C5', 'E5', 'C5', 'A4', 'G4', 'A4', 'C5', 'D5'], bass: ['C3', 0, 'G3', 0, 'C3', 0, 'G3', 0, 'A3', 0, 'G3', 0, 'F3', 0, 'G3', 0] },
    { name: 'Schritt', gang: 1, sek: 11, takt: 0.31, mel: ['C5', 0, 'E5', 0, 'G5', 0, 'E5', 0, 'A4', 0, 'C5', 0, 'D5', 0, 'C5', 0], bass: ['C3', 0, 0, 0, 'G3', 0, 0, 0, 'F3', 0, 0, 0, 'G3', 0, 0, 0] },
    { name: 'Galopp', gang: 3, sek: 17, takt: 0.15, mel: ['G5', 0, 0, 0, 'E5', 0, 0, 0, 'C5', 0, 0, 0, 'E5', 0, 0, 0, 'A5', 0, 0, 0, 'G5', 0, 0, 0, 'E5', 0, 0, 0, 'D5', 0, 0, 0], bass: ['C3', 'C3', 'G3', 0, 'C3', 'C3', 'G3', 0, 'A3', 'A3', 'C3', 0, 'A3', 'A3', 'C3', 0, 'F3', 'F3', 'C3', 0, 'F3', 'F3', 'C3', 0, 'G3', 'G3', 'G3', 0, 'G3', 'G3', 'G3', 0] },
    { name: 'Trab', gang: 2, sek: 14, takt: 0.2, mel: ['C5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'C5'], bass: ['C3', 0, 'G3', 0, 'F3', 0, 'G3', 0, 'A3', 0, 'G3', 0, 'F3', 0, 'G3', 0] },
    { name: 'Galopp', gang: 3, sek: 13, takt: 0.15, mel: ['C6', 0, 0, 0, 'A5', 0, 0, 0, 'G5', 0, 0, 0, 'E5', 0, 0, 0, 'G5', 0, 0, 0, 'A5', 0, 0, 0, 'G5', 0, 0, 0, 'E5', 0, 0, 0], bass: ['F3', 'F3', 'C3', 0, 'F3', 'F3', 'C3', 0, 'C3', 'C3', 'G3', 0, 'C3', 'C3', 'G3', 0, 'G3', 'G3', 'G3', 0, 'G3', 'G3', 'G3', 0, 'C3', 'C3', 'G3', 0, 'C3', 'C3', 'G3', 0] },
    { name: 'Schluss: Halt bei X', gang: 0, sek: 9, takt: 0.45, mel: ['C5', 'E5', 'G5', 'C6', 0, 'G5', 'C6', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: ['C3', 0, 'G3', 'C3', 0, 0, 'C3', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ];
  var FIGUREN = { zl: 'Zirkel links', zr: 'Zirkel rechts', sl: 'Schlangenlinie', gl: 'Galopp linke Hand', gr: 'Galopp rechte Hand', bahn: 'Ganze Bahn nutzen' };
  var KI_KUER = { sehrleicht: [4.5, 6.0], leicht: [5.3, 6.8], mittel: [6.2, 7.6], schwer: [7.2, 8.6] };
  var K = null;

  function starteKuer() {
    KERN.schliesseKarte();
    aufgabe = { name: 'Kür mit Musik', kuer: true };
    zeigeViereck(40); zeigePlan(null);
    nr = 0; noten = []; stufe = 0; lek = null;
    zeigeLinie(null); ende.visible = false;
    R.setze(0, HL + 7, PI);
    kamera.userData.sprung = true;
    modus = 'start';
    document.body.className = 'im-welt welt-dressur mit-tempo mit-lenken';
    K = { teil: 0, t: 0, schlag: -1, passend: 0, gesamt: 0, dreh: 0, wechsel: 0, galL: 0, galR: 0, zonen: {}, fig: {}, altKurs: PI, gruss: -1, schluss: 0 };
    setzeHinweis('Kür: Reite frei durch die Bahn, immer in der Gangart, die zur Musik passt.');
    if (stopp) stopp();
    stopp = REITEN.countdown(function () { modus = 'kuer'; });
  }
  function figur(k) {
    if (K.fig[k]) return;
    K.fig[k] = true;
    KERN.meldung('✓ ' + FIGUREN[k], 'gut'); KERN.klang('gut');
  }
  function kuerMusik(teil) {
    if (SOUND.musikLaeuft && SOUND.musikLaeuft()) return;       // echte Musik spielt schon: dann keine Piepser dazu
    var s = Math.floor(K.t / teil.takt);
    if (s === K.schlag) return;
    K.schlag = s;
    if (teil.gang === 0 && s >= teil.mel.length) return;
    var m = teil.mel[s % teil.mel.length], b = teil.bass[s % teil.bass.length];
    if (m) KERN.ton(TON[m], teil.gang === 1 ? 0.5 : teil.gang === 0 ? 0.9 : 0.22, teil.gang === 1 ? 'sine' : 'triangle', 0.13);
    if (b) KERN.ton(TON[b], teil.gang === 3 ? 0.12 : 0.3, 'triangle', 0.16);
  }
  function kuerSchritt(dt) {
    var teil = KUER_TEILE[K.teil];
    gangWechsel();
    K.t += dt;
    kuerMusik(teil);
    // Harmonie: Gangart passt zur Musik (die ersten 2 Sekunden jedes Teils zaehlen nicht)
    if (K.t > 2 && teil.gang > 0) { K.gesamt += dt; if (stufe === teil.gang && R.tempo > 0.5) K.passend += dt; }
    // Figuren erkennen
    var dk = Math.atan2(Math.sin(R.kurs - K.altKurs), Math.cos(R.kurs - K.altKurs));
    K.altKurs = R.kurs;
    if (R.tempo > 1) {
      // Zirkel: lange in dieselbe Richtung drehen; Gegenlenken beginnt neu
      if (Math.abs(dk) > 0.003) {
        if (K.dreh === 0 || (dk > 0) === (K.dreh > 0)) K.dreh += dk;
        else {
          // Richtungswechsel: fuer die Schlangenlinie zaehlen Boegen von mindestens einer Viertel-Drehung im Trab
          if (Math.abs(K.dreh) > 0.9 && stufe === 2) { K.wechsel++; if (K.wechsel >= 3) figur('sl'); }
          K.dreh = dk;
        }
      }
      if (K.dreh > PI * 1.9) { figur('zl'); K.dreh = 0; K.wechsel = 0; }
      if (K.dreh < -PI * 1.9) { figur('zr'); K.dreh = 0; K.wechsel = 0; }
      if (stufe === 3 && R.gang === 'galopp') {
        if (dk > 0) K.galL += dk; else K.galR -= dk;
        if (K.galL > PI * 1.2) figur('gl');
        if (K.galR > PI * 1.2) figur('gr');
      }
      if (R.z < 19) {
        K.zonen[(R.x < 0 ? 'w' : 'o') + (R.z < 0 ? 'n' : 's')] = true;
        if (Math.hypot(R.x, R.z) < 3) K.zonen.x = true;
        if (Object.keys(K.zonen).length >= 5) figur('bahn');
      }
    }
    // Schluss: bei X halten und gruessen
    if (teil.gang === 0) {
      var dx = Math.hypot(R.x, R.z);
      ende.position.set(0, 2.6, 0); ende.visible = K.gruss < 0;
      if (K.gruss < 0 && R.tempo < 0.15 && dx < 4) { K.schluss += dt; if (K.schluss > 0.6) KERN.setzeAktion('🎩 Grüßen'); }
      else { K.schluss = 0; KERN.setzeAktion(null); }
    }
    var offen = Object.keys(FIGUREN).filter(function (k) { return !K.fig[k]; }).map(function (k) { return FIGUREN[k]; });
    setzeHinweis('🎵 Musik: ' + teil.name + (teil.gang === 0 ? (K.gruss < 0 ? '. Reite zu X, halte an und grüße!' : '') : offen.length ? '  ·  Zeig noch: ' + offen.slice(0, 2).join(', ') : '  ·  Alle Figuren gezeigt!'));
    if (K.t >= teil.sek) {
      K.t = 0; K.schlag = -1; K.teil++;
      if (K.teil >= KUER_TEILE.length) { K.teil = KUER_TEILE.length - 1; kuerFertig(); return 0; }
      KERN.meldung('🎵 ' + KUER_TEILE[K.teil].name, 'knapp');
    }
    return REITEN.lenkung();
  }
  function kuerGruss() {
    if (modus !== 'kuer' || KUER_TEILE[K.teil].gang !== 0 || K.gruss >= 0 || K.schluss < 0.6) return;
    K.gruss = Math.max(0, 10 - Math.hypot(R.x, R.z) * 2.2);
    gruss = 1.2;
    KERN.klang('klatschen'); KERN.applaus(1.5, 0.1);
    KERN.setzeAktion(null); ende.visible = false;
  }
  function kuerFertig() {
    modus = 'fertig';
    setzeHinweis(null); ende.visible = false; KERN.setzeAktion(null);
    var harmonie = K.gesamt > 0 ? Math.min(10, K.passend / K.gesamt * 10.5) : 0;
    var anzahl = Object.keys(K.fig).length, choreo = anzahl / Object.keys(FIGUREN).length * 10;
    var schluss = K.gruss < 0 ? 2 : K.gruss;
    var gesamt = harmonie * 0.45 + choreo * 0.35 + schluss * 0.2;
    STAND.merke('kuer', gesamt);
    function z(text, n) { return '<tr><td class="links">' + text + '</td><td><b>' + note(n) + '</b></td></tr>'; }
    var html = '<div class="klein">Kür mit Musik</div><h2>' + (gesamt >= 8 ? 'Zauberhaft!' : gesamt >= 6.5 ? 'Eine schöne Kür!' : 'Weiter üben!') + '</h2><div class="note">' + gesamt.toFixed(1).replace('.', ',') + '</div>';
    var platz = 0, lohn = '';
    if (opt.turnier) {
      var b = KI_KUER[KERN.gegnerStufe()] || KI_KUER.leicht;
      var rang = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4).map(function (name) { return { name: name, p: b[0] + Math.random() * (b[1] - b[0]) }; });
      rang.push({ name: KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : ''), p: gesamt, ich: true });
      rang.sort(function (a, c) { return c.p - a.p; });
      rang.forEach(function (r2, i) { r2.wert = r2.p.toFixed(1).replace('.', ','); if (r2.ich) platz = i + 1; });
      lohn = STAND.belohne(PREISGELD.dressur[platz - 1] || 4, 'Kür');
      html += '<div class="grossPunkte">' + (platz === 1 ? '🏆 1. Platz!' : platz + '. Platz') + '</div>' + REITEN.tabelle(rang, 'Note');
      KERN.klang(platz === 1 ? 'fanfare' : 'jubel');
    } else { lohn = STAND.belohne(gesamt >= 8 ? 6 : gesamt >= 6.5 ? 3 : 1, 'Kür geübt'); KERN.klang('jubel'); }
    html += '<table class="tabelle"><tr><th class="links">Die Richter</th><th>Note</th></tr>' + z('Harmonie: Gangart passt zur Musik', harmonie) + z('Choreographie: ' + anzahl + ' von 6 Figuren', choreo) + z('Schlussgruß bei X', schluss) + '</table>' + lohn;
    KERN.zeigeKarte('mitte', html, [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); waehleAufgabe(); } },
      { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'kuer', platz: platz, note: gesamt }); } }]);
  }

  // ============================================================
  //  DER RITT  -  jedes Bild: Gangart, Linie, besondere Lektionen messen
  // ============================================================
  function autoLenk(zx, zz, staerke) {
    var zw = Math.atan2(zx - R.x, zz - R.z), df = winkelDiff(zw, R.kurs);
    return Math.max(-1, Math.min(1, df * staerke));
  }
  // zurück auf die Linie setzen (nach dem Verreiten)
  function aufLinie() {
    var w = lek.weg, i = Math.min(iNah, w.length - 2), tempo = R.tempo;
    R.setze(w[i][0], w[i][1], Math.atan2(w[i + 1][0] - w[i][0], w[i + 1][1] - w[i][1]));
    R.tempo = tempo;
    kamera.userData.sprung = true;
  }
  var aktivSpez = null, eigen = null;
  function rittSchritt(dt) {
    var lenk = 0;
    aktivSpez = null; eigen = null;
    gangWechsel();
    if (lek.halt) {
      // ----- Halten und Grüßen -----
      var dx = Math.hypot(R.x - lek.punkt[0], R.z - lek.punkt[1]);
      if (R.tempo < 0.15 && dx < 9) { haltZeit += dt; if (haltZeit > 0.8) KERN.setzeAktion('🎩 Grüßen'); }
      else { haltZeit = 0; KERN.setzeAktion(null); }
      if (steuerung === 'auto' && dx > 0.5) { var df = winkelDiff(Math.atan2(lek.punkt[0] - R.x, lek.punkt[1] - R.z), R.kurs); lenk = Math.abs(df) < 1.6 ? Math.max(-1, Math.min(1, df * 2)) : 0; }
      else if (steuerung !== 'auto') lenk = REITEN.lenkung();
      return lenk;
    }
    if (lek.steh) {
      // ----- Piaffe (Trab auf der Stelle) oder Rückwärtsrichten -----
      KERN.setzeAktion('⭐ ' + lek.name + ' (halten)');
      mess.t += dt;
      var piaffe = lek.steh === 'piaffe', aktiv = druck && (piaffe ? stufe === 2 : stufe === 0 && R.tempo < 0.25);
      R.wunsch = piaffe && aktiv ? 0.1 : Math.min(GANG_TEMPO[stufe], 0.5);
      if (aktiv) {
        mess.gut += dt;
        if (piaffe) eigen = { gang: 'trab', takt: 1.0, kraft: 1, hub: 0.06 };
        else {
          eigen = { gang: 'trab', takt: -0.8, kraft: 0.55, hub: 0 };
          R.x -= Math.sin(R.kurs) * 0.8 * dt; R.z -= Math.cos(R.kurs) * 0.8 * dt;
          R.x = Math.max(-9.6, Math.min(9.6, R.x)); R.z = Math.max(-(HL - 0.4), Math.min(HL - 0.4, R.z));
        }
      }
      mess.spezN += dt; if (aktiv) mess.spezGut += dt;
      setzeHinweis(lek.text + '  ⭐ ' + (piaffe ? Math.min(13, Math.floor(mess.gut / lek.dauer * 13)) + ' / 13 Tritte' : Math.min(4, Math.floor(mess.gut / lek.dauer * 4)) + ' / 4 Tritte'));
      if (mess.gut >= lek.dauer || mess.t >= lek.dauer * 2.4 + 2) {
        var n0 = 9.8 - Math.max(0, mess.t - lek.dauer - (piaffe ? 1.5 : 3)) / lek.dauer * 7;
        if (mess.gut < lek.dauer) n0 = Math.min(n0, mess.gut / lek.dauer * 6);
        KERN.setzeAktion(null);
        bewerte(n0);
      }
      return steuerung !== 'auto' ? REITEN.lenkung() : 0;
    }
    // ----- eine Linie reiten -----
    var w = lek.weg, Ln = lek.laengen, a = lek.ab[abNr];
    // nächsten Punkt der Linie suchen (nur ein Stück voraus, damit man nicht abkürzen kann)
    var best = 1e9, bi = iNah, weit = a.spez && a.spez.eng ? 1.5 : 4;
    for (var i = iNah; i < w.length && Ln[i] < Ln[iNah] + weit; i++) {
      var d = Math.hypot(w[i][0] - R.x, w[i][1] - R.z);
      if (d < best) { best = d; bi = i; }
    }
    if (best < 4.5) iNah = bi;
    if (bi === 0) {                    // noch vor dem Anfang der Linie: nur zählen, wie weit man seitlich daneben ist
      var rx = w[1][0] - w[0][0], rz = w[1][1] - w[0][1], rl = Math.hypot(rx, rz) || 1;
      best = Math.abs((R.x - w[0][0]) * rz - (R.z - w[0][1]) * rx) / rl;
    }
    while (abNr < lek.ab.length - 1 && iNah >= lek.ab[abNr].bis) { abNr++; gnade = 1.2; }
    a = lek.ab[abNr];
    var halten = !!(a.spez && a.spez.mal !== undefined);
    if (halten && druck && stufe === a.gang) aktivSpez = a.spez;
    if (aktivSpez) { R.wunsch = GANG_TEMPO[stufe] * aktivSpez.mal; eigen = aktivSpez.eigen || null; }
    // messen: Wie genau ist die Linie? Stimmt die Gangart? Wird die besondere Lektion gezeigt?
    if (R.tempo > 0.3) { mess.summe += Math.min(best, 4) * dt; mess.an += dt; }
    if (gnade > 0) gnade -= dt;               // kurz nach einem Übergang wird noch nicht gezählt
    else if (R.tempo > 0.3) {
      mess.n += dt;
      if (stufe === a.gang && (!halten || druck)) mess.richtig += dt;
      if (halten) { mess.spezN += dt; if (aktivSpez) mess.spezGut += dt; }
    } else mess.n += dt * 0.5;                // Herumstehen zählt als falsche Gangart
    // verpasste Sterne
    lek.sterne.forEach(function (s, si) { if (s.gut < 0 && Ln[iNah] > s.s + 3.5) { s.gut = 0; sternWeg(si); KERN.ton(180, 0.15, 'sawtooth', 0.08); } });
    // der Knopf zeigt, was gleich verlangt wird
    var naechst = null;
    for (var q = abNr; q < lek.ab.length && !naechst; q++) if (lek.ab[q].spez && lek.ab[q].spez.mal !== undefined) naechst = lek.ab[q].spez;
    KERN.setzeAktion(lek.sterne.some(function (s) { return s.gut < 0; }) ? '⭐ Wechsel!' : naechst ? '⭐ ' + naechst.name + (halten ? ' (halten)' : '') : null);
    // Verreiten: zu weit weg von der Linie
    if (best > 5) { wegZeit += dt; } else wegZeit = 0;
    if (wegZeit > 2.5) {
      wegZeit = 0;
      if (steuerung !== 'auto') {
        verritten++;
        KERN.ton(1400, 0.5, 'sine', 0.2); KERN.ton(1400, 0.5, 'sine', 0.2, 0.6);
        KERN.meldung('🔔 Verritten! Der Richter läutet die Glocke.', 'rot');
      }
      aufLinie();
    }
    if (steuerung === 'auto') {
      var vorn = Math.min(w.length - 1, iNah + Math.max(3, Math.round(R.tempo * 0.9)));
      lenk = autoLenk(w[vorn][0], w[vorn][1], 2.6);
    } else lenk = REITEN.lenkung();
    // Ende der Lektion: Note ausrechnen
    if (iNah >= w.length - 2) {
      var abw = mess.an > 0 ? mess.summe / mess.an : 4, anteil = mess.n > 0 ? mess.richtig / mess.n : 1;
      var n1 = (9.8 - abw * 4.5) * (0.3 + 0.7 * anteil * anteil);
      if (lek.sterne.length) { var sg = 0; lek.sterne.forEach(function (s) { sg += Math.max(0, s.gut); }); n1 *= 0.35 + 0.65 * sg / lek.sterne.length; }
      bewerte(n1);
    }
    return lenk;
  }
  // Knopf einmal gedrückt: grüßen oder fliegender Galoppwechsel am Stern
  function druecke() {
    if (modus === 'kuer') { kuerGruss(); return; }
    if (modus !== 'ritt' || !lek) return;
    if (lek.halt) { gruesse(); return; }
    if (!lek.weg || !lek.sterne.length) return;
    var best = 1e9, bi = -1, s0 = lek.laengen[iNah];
    lek.sterne.forEach(function (s, i) { var d = Math.abs(s.s - s0); if (s.gut < 0 && d < best) { best = d; bi = i; } });
    if (bi < 0 || best > 3.5 || stufe !== 3) return;
    lek.sterne[bi].gut = Math.max(0.2, Math.min(1, 1.15 - best / 3.2));
    sternWeg(bi);
    hupf = 0.35;
    KERN.ton(880, 0.1, 'triangle', 0.16); KERN.ton(1320, 0.14, 'triangle', 0.14, 0.07);
  }

  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    var lenk = 0, pferd = KERN.pferd;
    aktivSpez = null; eigen = null;
    if (modus === 'ritt' && lek) lenk = rittSchritt(dt);
    else if (modus === 'kuer') lenk = kuerSchritt(dt);
    else if (modus !== 'ritt') { R.wunsch = 0; R.festerGang = null; }
    if (gruss > 0) gruss -= dt;
    R.schritt(dt, lenk, zeit);
    // Seitengänge: Das Pferd steht schräg zur Linie oder bleibt gerade und geht seitwärts
    var zielQuer = 0;
    if (aktivSpez && aktivSpez.quer) zielQuer = aktivSpez.quer * aktivSpez.hand;
    else if (aktivSpez && aktivSpez.gerade) { var d0 = winkelDiff(R.kurs, aktivSpez.kopf); zielQuer = winkelDiff(aktivSpez.kopf + (d0 > 0 ? 0.15 : -0.15), R.kurs); }
    querGlatt += (zielQuer - querGlatt) * Math.min(1, dt * 5);
    pferd.wurzel.rotation.y = R.kurs + querGlatt;
    // Piaffe, Passage, Pirouette, Rückwärtsrichten: die Beine bewegen sich im eigenen Takt
    if (eigen) {
      var alt = eigenPhase;
      eigenPhase += dt * PI * 2 * eigen.takt;
      pferd.setzeGang(eigen.gang);
      pferd.bewege(eigenPhase, eigen.kraft, -1, zeit);
      pferd.koerper.position.y = Math.abs(Math.sin(eigenPhase)) * eigen.hub;
      if (eigen.gang === 'galopp') KERN.galoppTon(alt, eigenPhase, 0.5);
      else if (Math.floor(alt / PI) !== Math.floor(eigenPhase / PI)) KERN.huf(0.14, 200 + (Math.floor(eigenPhase / PI) % 2) * 40);
    }
    if (hupf > 0) { hupf -= dt; pferd.koerper.position.y += Math.sin(Math.max(0, hupf) / 0.35 * PI) * 0.09; }
    REITEN.folge(kamera, R, dt, { hinten: 7.5, hoch: 5.2, vor: 4 });
    sonne.folge(R.x, 0, R.z);
    if (ende.visible) { ende.position.y = 2.6 + Math.sin(zeit * 5) * 0.2; ende.rotation.y = zeit * 2; }
    if (planPferd && plan.style.display !== 'none') { planPferd.setAttribute('cx', planPferd.px(R.x)); planPferd.setAttribute('cy', planPferd.pz(Math.min(R.z, HL + 3))); }
    if (K && aufgabe && aufgabe.kuer && (modus === 'kuer' || modus === 'start')) {
      var kt = KUER_TEILE[Math.min(K.teil, KUER_TEILE.length - 1)], passt = kt.gang === 0 ? stufe === 0 : stufe === kt.gang;
      var rest = 0;
      for (var q = K.teil; q < KUER_TEILE.length; q++) rest += KUER_TEILE[q].sek;
      KERN.setzeHud(REITEN.kachel('Musik', '🎵 ' + (kt.gang ? kt.name : 'Halt'), 'gross2') + REITEN.kachel('Gangart', GANG_TEXT[stufe], 'gross2' + (passt ? '' : ' warn')) +
        REITEN.kachel('Figuren', Object.keys(K.fig).length + ' / 6') + REITEN.kachel('Noch', Math.max(0, Math.ceil(rest - K.t)) + ' s'));
    } else if (modus === 'ritt' || modus === 'start') {
      var soll = !lek ? 2 : lek.halt ? 0 : lek.steh ? (lek.steh === 'piaffe' ? 2 : 0) : lek.ab[abNr].gang;
      var sp = lek && lek.weg && lek.ab[abNr].spez && lek.ab[abNr].spez.mal !== undefined ? lek.ab[abNr].spez.name : lek && lek.steh ? lek.name : '';
      KERN.setzeHud(REITEN.kachel('Lektion', (Math.max(0, nr) + 1) + ' / ' + (aufgabe ? aufgabe.lektionen.length : 1)) +
        REITEN.kachel('Gangart', GANG_TEXT[stufe], 'gross2' + (stufe === soll ? '' : ' warn')) +
        REITEN.kachel('Verlangt', GANG_TEXT[soll] + (sp ? ' ⭐' : '')) +
        (noten.length ? REITEN.kachel('Letzte Note', note(noten[noten.length - 1].note)) : ''));
    }
  }

  function gruesse() {
    if (modus !== 'ritt' || !lek || !lek.halt || haltZeit < 0.8) return;
    var d = Math.hypot(R.x - lek.punkt[0], R.z - lek.punkt[1]);
    gruss = 1.2;
    KERN.klang('klatschen'); KERN.applaus(1.2, 0.08);
    KERN.setzeAktion(null);
    bewerte(9.8 - Math.max(0, d - bremsWeg) * 1.8);   // ein Meter daneben ist noch sehr gut
  }

  // ============================================================
  //  DAS ERGEBNIS  -  der Notenbogen wie auf dem Turnier
  //  Lektionsnoten (manche mal 2) + Schlussnoten, drei Richter,
  //  Prozent = erreichte Punkte / mögliche Punkte, Abzug fürs Verreiten.
  // ============================================================
  function fertig() {
    modus = 'fertig';
    lek = null;
    zeigeLinie(null); zeigePlan(null); ende.visible = false; setzeHinweis(null);
    KERN.setzeAktion(null);
    var S = summen, schnitt = 0;
    noten.forEach(function (n) { schnitt += n.note / noten.length; });
    // Schlussnoten: wie der ganze Ritt war
    var hilfen = S.spezN + S.sterne > 0 ? (S.spezGut + S.sterneGut * 3) / (S.spezN + S.sterne * 3) : -1;
    var zeilen = noten.concat([
      { text: 'Takt und Gangarten', k: 1, schluss: true, note: grenze(10.3 * Math.pow(S.n > 0 ? S.richtig / S.n : 0, 1.5)) },
      { text: 'Durchlässigkeit: genaue Linien', k: 1, schluss: true, note: grenze(10.4 - (S.an > 0 ? S.summe / S.an : 4) * 4.5) },
      { text: 'Sitz und Einwirkung der Reiterin', k: 2, schluss: true, note: grenze((hilfen < 0 ? schnitt : schnitt * 0.5 + hilfen * 5.2) - verritten * 0.5) }
    ]);
    // drei Richter sehen von ihren Plätzen (E, C, M) nicht ganz dasselbe
    var RICHTER = ['E', 'C', 'M'], punkte3 = [0, 0, 0], moeglich = 0;
    var neigung = RICHTER.map(function () { return (Math.random() - 0.5) * 0.5; });
    zeilen.forEach(function (zl) {
      zl.r = RICHTER.map(function (r0, j) { var nj = halb(zl.note + neigung[j] + (Math.random() - 0.5) * 0.7); punkte3[j] += nj * zl.k; return nj; });
      moeglich += 10 * zl.k;
    });
    var proz3 = punkte3.map(function (p) { return p / moeglich * 100; });
    var abzug = verritten === 0 ? 0 : verritten === 1 ? 0.5 : 1.5 + (verritten - 2) * 2;
    var prozent = Math.max(0, (proz3[0] + proz3[1] + proz3[2]) / 3 - abzug);
    function pz(p) { return p.toFixed(1).replace('.', ','); }
    function zeile(zl) {
      return '<tr><td class="links" style="font-size:12px">' + KERN.esc(zl.text) + (zl.k > 1 ? ' <b style="color:#b0764a">×' + zl.k + '</b>' : '') + '</td>' + zl.r.map(function (n) { return '<td>' + n.toFixed(1).replace('.', ',') + '</td>'; }).join('') + '</tr>';
    }
    var html = '<div class="klein">' + aufgabe.name + ' · ' + aufgabe.stufe + '</div><h2>' + (prozent >= 75 ? 'Wunderschön geritten!' : prozent >= 60 ? 'Gut geritten!' : 'Weiter üben!') + '</h2><div class="note">' + pz(prozent) + ' %</div>';
    var platz = 0, lohn = '', ai = AUFGABEN.indexOf(aufgabe);
    for (var q = 0; q <= ai; q++) STAND.merke(AUFGABEN[q].merk, prozent);       // eine schwere Aufgabe zählt auch für die leichteren Abzeichen
    var neuFrei = ai < AUFGABEN.length - 1 && prozent >= FREI_AB ? '<div class="lohn">🔓 ' + AUFGABEN[ai + 1].name + ' ist jetzt frei!</div>' : '';
    if (opt.turnier) {
      var tabelleKi = steuerung === 'auto' ? KI_PROZENT_AUTO : KI_PROZENT, b = tabelleKi[KERN.gegnerStufe()] || tabelleKi.leicht;
      var rang = GEGNER_NAMEN.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 4).map(function (name) { return { name: name, p: b[0] + Math.random() * (b[1] - b[0]) }; });
      rang.push({ name: KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : ''), p: prozent, ich: true });
      rang.sort(function (a, c) { return c.p - a.p; });
      rang.forEach(function (r2, i) { r2.wert = pz(r2.p) + ' %'; if (r2.ich) platz = i + 1; });
      lohn = STAND.belohne((PREISGELD.dressur[platz - 1] || 4) * (1 + ai * 0.3), 'Dressurprüfung ' + aufgabe.name);
      html += '<div class="grossPunkte">' + (platz === 1 ? '🏆 1. Platz!' : platz + '. Platz') + '</div>' + REITEN.tabelle(rang, 'Ergebnis');
      if (platz === 1) KERN.klang('fanfare');
    } else lohn = STAND.belohne((prozent >= 75 ? 6 : prozent >= 60 ? 3 : 1) * (1 + ai * 0.3), 'Dressurtraining');
    html += '<div class="details">Richter bei ' + RICHTER.map(function (r0, j) { return '<b>' + r0 + '</b> ' + pz(proz3[j]) + ' %'; }).join(' · ') +
      (abzug ? '<br>🔔 ' + verritten + '-mal verritten: −' + pz(abzug) + ' %' : '') + '</div>' +
      '<table class="tabelle"><tr><th class="links">Lektion</th>' + RICHTER.map(function (r0) { return '<th>' + r0 + '</th>'; }).join('') + '</tr>' +
      zeilen.filter(function (zl) { return !zl.schluss; }).map(zeile).join('') +
      '<tr><th class="links" colspan="4">Schlussnoten</th></tr>' + zeilen.filter(function (zl) { return zl.schluss; }).map(zeile).join('') + '</table>' + neuFrei + lohn;
    KERN.zeigeKarte('mitte', html, [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); waehleAufgabe(); } },
      { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'dressur', platz: platz, prozent: prozent }); } }]);
  }

  // ============================================================
  //  DRESSUR-WISSEN  -  kleines Lexikon zum Nachlesen
  // ============================================================
  function planBild(lang) {
    var m = 3.4, r = 22, hl = lang / 2, b = 20 * m + r * 2, h = lang * m + r * 2, s = '<svg width="' + b + '" height="' + h + '" style="vertical-align:top;margin:4px 8px"><rect x="' + r + '" y="' + r + '" width="' + 20 * m + '" height="' + lang * m + '" fill="#f0e0b4" stroke="#b0764a" stroke-width="2"/>' +
      '<line x1="' + b / 2 + '" y1="' + r + '" x2="' + b / 2 + '" y2="' + (h - r) + '" stroke="#d8c08a" stroke-dasharray="4 4"/>';
    var seite = lang === 60 ? { K: 6, V: 18, E: 30, S: 42, H: 54 } : { K: 6, E: 20, H: 34 }, gegen = { K: 'F', V: 'P', E: 'B', S: 'R', H: 'M' }, mitte = lang === 60 ? { D: 6, L: 18, X: 30, I: 42, G: 54 } : { D: 6, X: 20, G: 34 };
    function t(x, y, bu, klein) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (klein ? 10 : 13) + '" font-weight="bold" fill="' + (klein ? '#b09a6a' : '#5a3a1c') + '">' + bu + '</text>'; }
    for (var bu in seite) { var y = h - r - seite[bu] * m + 4; s += t(10, y, bu) + t(b - 10, y, gegen[bu]); }
    for (var bm in mitte) s += t(b / 2, h - r - mitte[bm] * m + 4, bm, true);
    return s + t(b / 2, h - 5, 'A') + t(b / 2, 14, 'C') + '</svg>';
  }
  var WISSEN = [
    ['Das Viereck und die Bahnpunkte', function () {
      return '<div style="text-align:center">' + planBild(40) + planBild(60) + '</div>' +
        'Dressur wird im <b>Viereck</b> geritten: <b>20 × 40 Meter</b> in den leichten Klassen, <b>20 × 60 Meter</b> ab den schweren Aufgaben. ' +
        'Am Rand stehen die <b>Bahnpunkte</b>. Eingeritten wird bei <b>A</b>, die Richter sitzen gegenüber bei <b>C</b>. Von A aus links herum: A – K – E – H – C – M – B – F. ' +
        'Im großen Viereck kommen V, S, R und P dazu. Auf der <b>Mittellinie</b> liegen D, X und G (im großen Viereck auch L und I). <b>X</b> ist genau die Mitte, dort wird gegrüßt.<br>' +
        'K, H, M und F sind 6 Meter von der kurzen Seite entfernt. Von dort wechselt man durch die ganze Bahn.<br>' +
        '<b>Linke Hand</b> heißt: Die Mitte der Bahn ist links von dir. <b>Hufschlag</b> nennt man den Weg außen an der Bande entlang.';
    }],
    ['Die Hufschlagfiguren', function () {
      return '<b>Ganze Bahn:</b> außen herum auf dem Hufschlag. <b>Halbe Bahn:</b> bei E oder B abbiegen.<br>' +
        '<b>Zirkel:</b> ein großer Kreis, 20 Meter, bei A, bei C oder in der Mitte.<br>' +
        '<b>Volte:</b> ein kleiner Kreis: 10 Meter (Klasse A), 8 Meter (Klasse L), 6 Meter (schwere Klassen).<br>' +
        '<b>Kehrtvolte:</b> eine halbe Volte und schräg zurück zum Hufschlag, danach reitet man auf der anderen Hand.<br>' +
        '<b>Durch die ganze Bahn wechseln:</b> schräg durch die Mitte, zum Beispiel F – X – H. <b>Durch die halbe Bahn wechseln:</b> zum Beispiel F – E.<br>' +
        '<b>Durch die Länge der Bahn wechseln:</b> auf der Mittellinie von A nach C.<br>' +
        '<b>Durch den Zirkel wechseln</b> und <b>aus dem Zirkel wechseln:</b> Handwechsel auf dem Zirkel, wie ein S oder eine Acht.<br>' +
        '<b>Schlangenlinie durch die ganze Bahn:</b> 3, 4 oder 5 Bögen von A bis C.<br>' +
        '<b>Einfache Schlangenlinie:</b> an der langen Seite 5 Meter in die Bahn hinein und zurück. <b>Doppelte:</b> zweimal je 2,5 Meter.';
    }],
    ['Gangarten und Tempo', function () {
      return 'Ein Pferd hat drei <b>Grundgangarten</b>:<br><b>Schritt</b> (4 Takte, kein Schweben), <b>Trab</b> (2 Takte, die schrägen Beinpaare zusammen), <b>Galopp</b> (3 Takte und ein Moment in der Luft; es gibt Linksgalopp und Rechtsgalopp).<br>' +
        'In jeder Gangart gibt es verschiedene <b>Tempi</b>. Schneller heißt dabei nicht hastiger, sondern <b>größere Schritte</b>:<br>' +
        '<b>versammelt</b> (kurz, erhaben, das Pferd trägt sich) – <b>Arbeitstempo</b> – <b>Mittel</b> – <b>stark</b> (so weit ausgreifen, wie es geht). Im Schritt: versammelter Schritt, Mittelschritt, starker Schritt.<br>' +
        '<b>Übergänge</b> sind die Wechsel zwischen Gangarten und Tempi. Sie sollen fließend und genau am Bahnpunkt gelingen.<br>' +
        '<b>Halten:</b> Das Pferd steht gerade und ruhig auf allen vier Beinen. <b>Grüßen:</b> Zügel in eine Hand, die andere Hand senken und mit dem Kopf nicken.<br>' +
        '<b>Rückwärtsrichten:</b> aus dem Halten 3 bis 5 Tritte gerade rückwärts.';
    }],
    ['Die Klassen E, A, L', function () {
      return 'In Deutschland heißen die Klassen <b>E</b> (Einsteiger), <b>A</b> (Anfänger), <b>L</b> (leicht), <b>M</b> (mittelschwer) und <b>S</b> (schwer). Sterne dahinter machen es noch schwerer (S*** ist ganz oben).<br><br>' +
        '<b>Klasse E:</b> Schritt, Arbeitstrab, Arbeitsgalopp, Zirkel, durch die ganze Bahn wechseln, Halten.<br>' +
        '<b>Klasse A:</b> dazu Volte 10 Meter, Schlangenlinien, Tritte und Galoppsprünge verlängern, <b>Schenkelweichen</b> und „Viereck verkleinern und vergrößern“ (das Pferd geht vorwärts und seitwärts zugleich), Rückwärtsrichten, Zügel aus der Hand kauen lassen.<br>' +
        '<b>Klasse L:</b> versammelter Trab und Galopp, Mitteltrab und Mittelgalopp, Volte 8 Meter, <b>Kurzkehrt</b> und <b>Hinterhandwendung</b> (auf der Stelle umdrehen um die Hinterbeine), <b>Außengalopp</b> (mit Absicht im „falschen“ Galopp), <b>einfacher Galoppwechsel</b> (Galopp – ein paar Schritte – anderer Galopp).';
    }],
    ['Die Klassen M, S und Grand Prix', function () {
      return '<b>Klasse M:</b> die <b>Seitengänge</b>. <b>Schulterherein:</b> Die Schultern kommen in die Bahn, das Pferd läuft auf drei Hufspuren. <b>Travers:</b> Die Hinterhand kommt in die Bahn. <b>Traversale:</b> schräg seitwärts durch die Bahn, fast gerade zur langen Seite. Dazu <b>starker Trab</b>, <b>starker Galopp</b> und der <b>fliegende Galoppwechsel</b>: Das Pferd wechselt im Sprung von Links- auf Rechtsgalopp.<br><br>' +
        '<b>Klasse S:</b> <b>Serienwechsel</b> (fliegende Wechsel alle 4, 3 oder 2 Sprünge), halbe und ganze <b>Galopp-Pirouetten</b> (6 bis 8 Galoppsprünge im Kreis fast auf der Stelle), Traversalen im Zickzack.<br><br>' +
        '<b>International</b> (Weltverband FEI), von leichter zu schwerer: Prix St. Georges, Intermédiaire I, Intermédiaire II, <b>Grand Prix</b>, Grand Prix Special und die <b>Grand Prix Kür</b> mit Musik. ' +
        'Im Grand Prix kommen dazu: <b>Piaffe</b> (Trab auf der Stelle, 12 bis 15 Tritte), <b>Passage</b> (ein schwebender, langsamer Trab) und <b>Einerwechsel</b> (15 fliegende Wechsel von Sprung zu Sprung, das Pferd scheint zu hüpfen).';
    }],
    ['Die Noten der Richter', function () {
      return 'Jede Lektion bekommt eine Note von <b>0 bis 10</b>, auch halbe Noten wie 6,5 gibt es:<br>' +
        '<table class="tabelle" style="font-size:13px">' + [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(function (n) { return '<tr><td><b>' + n + '</b></td><td class="links">' + NOTEN_WORT[n] + '</td></tr>'; }).join('') + '</table>' +
        'Wichtige Lektionen haben den <b>Koeffizienten 2</b>: Ihre Note zählt doppelt (oft der Schritt, die Pirouetten, Piaffe und Passage).<br>' +
        'Am Ende gibt es <b>Schlussnoten</b> für den ganzen Ritt, zum Beispiel für Sitz und Einwirkung des Reiters.<br>' +
        'Alle Punkte zusammen, geteilt durch die Punkte, die möglich wären, ergeben das Ergebnis in <b>Prozent</b>. Bei mehreren Richtern (bis zu fünf, bei Meisterschaften sieben, rund ums Viereck verteilt) zählt der Durchschnitt. Über 70 % ist schon richtig gut, in der Kür haben die Besten der Welt schon über 90 % geschafft.<br>' +
        '<b>Verreiten:</b> Wer den Weg vergisst, hört die Glocke des Richters und bekommt Punkte abgezogen, bei jedem Mal mehr. Wer sich zu oft verreitet, scheidet aus. Im Spiel: 0,5 %, dann 1,5 %, dann je 2 % mehr.<br>' +
        'In Klasse E bis L geben die Richter oft gemeinsam nur <b>eine Wertnote</b> für den ganzen Ritt (zum Beispiel 7,2).';
    }],
    ['Kür und Skala der Ausbildung', function () {
      return 'In der <b>Kür</b> denkt sich der Reiter die Reihenfolge selbst aus und reitet zu Musik. Es gibt zwei Noten: die <b>A-Note</b> für die Technik (jede Pflicht-Lektion) und die <b>B-Note</b> für das Künstlerische: Takt und Schwung, Harmonie zwischen Reiter und Pferd, Choreographie, Schwierigkeitsgrad, Musik und ihre Interpretation.<br><br>' +
        'Worauf die Richter immer achten, steht in der <b>Skala der Ausbildung</b>. So lernt jedes Pferd, Stufe für Stufe:<br>' +
        '<b>1. Takt</b> – gleichmäßige Schritte, Tritte und Sprünge<br><b>2. Losgelassenheit</b> – locker und zufrieden, ohne Verspannung<br><b>3. Anlehnung</b> – weiche, ruhige Verbindung zwischen Reiterhand und Pferdemaul<br>' +
        '<b>4. Schwung</b> – kraftvoller Schub aus der Hinterhand<br><b>5. Geraderichtung</b> – Hinterhufe laufen in der Spur der Vorderhufe<br><b>6. Versammlung</b> – das Pferd trägt mehr Gewicht mit der Hinterhand und wird vorn leicht<br><br>' +
        '<small>Die Aufgaben im Spiel sind selbst zusammengestellt (die echten Aufgabenhefte gehören der FN und der FEI), aber aus den Lektionen, die in der jeweiligen Klasse wirklich verlangt werden.</small>';
    }]
  ];
  function wissen(i) {
    var knoepfe = [];
    if (i < WISSEN.length - 1) knoepfe.push({ text: 'Weiter: ' + WISSEN[i + 1][0], aktion: function () { wissen(i + 1); } });
    if (i > 0) knoepfe.push({ text: 'Zurück', klasse: 'zweit', aktion: function () { wissen(i - 1); } });
    knoepfe.push({ text: 'Fertig', klasse: 'zweit', aktion: function () { KERN.schliesseKarte(); waehleAufgabe(); } });
    KERN.zeigeKarte('mitte', '<div class="klein">Dressur-Wissen ' + (i + 1) + ' / ' + WISSEN.length + '</div><h2>' + WISSEN[i][0] + '</h2><div class="details" style="text-align:left;line-height:1.45">' + WISSEN[i][1]() + '</div>', knoepfe);
    var k = document.querySelector('#karte .karte'); if (k) k.scrollTop = 0;
  }

  var API = {
    name: '🎩 Dressur',
    text: 'Dressur wie auf dem Turnier: sechs Aufgaben von Klasse E bis zum Grand Prix im Viereck mit den Bahnpunkten A, K, E, H, C, M, B, F. Zirkel, Volten, Schlangenlinien, Schulterherein, Traversalen, fliegende Galoppwechsel, Pirouetten, Piaffe und Passage. Drei Richter geben Noten von 0 bis 10. Dazu die Kür mit Musik.',
    knopf: '🎩 Zur Dressurprüfung',
    // welche Musik passt gerade? (fragt sound.js)
    musik: function () {
      if (modus === 'kuer' && K) return ['dressur', 'kuerSchritt', 'kuerTrab', 'kuerGalopp'][KUER_TEILE[Math.min(K.teil, KUER_TEILE.length - 1)].gang];
      return 'dressur';
    },
    start: function (o) {
      opt = o || {};
      if (!opt.hof) opt.turnier = true;
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      steuerung = KERN.steuerung();
      KERN.pferd.setzeOutfit(REITEN.outfitMit(opt.pferd));
      KERN.pferd.setzeAuszeichnung(false);
      KERN.pferd.setzeReiterin(true);
      szene.add(KERN.pferd.wurzel);
      KERN.betrete(API);
      waehleAufgabe();
    },
    schritt: schritt, aktion: druecke, tipp: druecke,
    zurueck: function () { if (stopp) stopp(); modus = 'aus'; setzeHinweis(null); zeigePlan(null); REITEN.heim(opt, null); },
    verlaesst: function () { if (stopp) stopp(); modus = 'aus'; setzeHinweis(null); zeigePlan(null); R.festerGang = null; KERN.pferd.koerper.rotation.set(0, 0, 0); KERN.pferd.koerper.position.y = 0; },
    zustand: function () { return { kuer: K, modus: modus, R: R, nr: nr, noten: noten, stufe: stufe, lek: lek, aufgabe: aufgabe, iNah: iNah, abNr: abNr, verritten: verritten, setzeStufe: function (s) { stufe = s; }, setzeDruck: function (d) { druck = d; }, starte: starte, wissen: wissen }; },
    // zum Prüfen ohne Bild (tools/dressur.mjs): alle Aufgaben mit ihren Wegen
    aufgaben: function () { return AUFGABEN.map(function (a) { HL = a.lang / 2; var B = Bauer(); a.baue(B); return { id: a.id, name: a.name, lang: a.lang, lektionen: B.liste }; }); }
  };
  return API;
})();
