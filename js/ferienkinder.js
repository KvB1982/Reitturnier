// ============================================================
//  FERIEN  -  Ferienkinder kommen und gehen
//
//  Alle paar Tage hält morgens ein kleiner Bus in der Zufahrt.
//  Drei Ferienkinder steigen aus, tragen Koffer und Rucksack zum
//  Wohnhaus und bleiben drei Tage. Sie schauen überall zu, man
//  kann mit ihnen reden (js/reden.js, Liste "gast") und Freundschaft
//  schließen. Am dritten Tag holt der Bus sie nachmittags wieder ab.
//  Ein paar Tage später kommt die andere Gruppe - und danach
//  wieder die erste. Die Freundschaft bleibt.
//
//  Ein neues Ferienkind ist ein Eintrag in der Liste GAESTE.
//  Wird von hof.js eingebunden (baue, schritt, alleHeim).
// ============================================================
var FERIEN = (function () {
  'use strict';
  var d = STAND.daten, H = null;

  // ---------- Zum Einstellen ----------
  var BLEIBEN = 3, PAUSE = 2;                 // so viele Tage sind sie da, so viele Tage ist danach Ruhe
  var BUS_KOMMT = 8.85, AUFSTEHEN = 8.0, INS_BETT = 19.5;      // Uhrzeiten
  var PACKEN = 15.3, BUS_HOLT = 15.6, BUS_SPAET = 16.6;        // am letzten Tag: Koffer holen, Bus kommt, Bus fährt spätestens
  var GEHEN = 1.6, RENNEN = 3.0, BUS_TEMPO = 8;                // Meter pro Sekunde
  var BUS_MASSE = [6.0, 2.9, 2.5];                             // Länge, Höhe, Breite vom Bus (Meter)

  // ---------- Die Ferienkinder ----------
  // gruppe: 0 oder 1 (die Gruppen wechseln sich ab), platz: Nummer in der Gruppe (0 = Mädchen, 1 = Junge, 2 = Mädchen),
  // gepaeck: 'koffer' oder 'rucksack', outfit: Farben wie in AUSWAHL (js/config.js)
  var GAESTE = [
    { id: 'frieda', name: 'Frieda', rolle: 'gast', gruppe: 0, platz: 0, alter: 9, woher: 'aus der Stadt', mag: 'Fohlen', sagt: 'war noch nie auf einem Pferdehof', gepaeck: 'koffer',
      outfit: { art: 'maedchen', jacke: '#f1c40f', hose: '#5d7ea8', stiefel: '#5a3418', haare: '#c0502a', frisur: 'zoepfe', helm: '#111111' } },
    { id: 'tom', name: 'Tom', rolle: 'gast', gruppe: 0, platz: 1, alter: 10, junge: true, woher: 'vom Meer', mag: 'Traktoren und Ponys', sagt: 'verliert ständig seine Sachen', gepaeck: 'rucksack',
      outfit: { art: 'junge', jacke: '#e67e22', hose: '#3d3d3d', stiefel: '#151515', haare: '#e6c35c', frisur: 'kurz', helm: '#111111' } },
    { id: 'nele', name: 'Nele', rolle: 'gast', gruppe: 0, platz: 2, alter: 11, woher: 'aus den Bergen', mag: 'Pferde malen', sagt: 'hat immer ihren Malblock dabei', gepaeck: 'koffer',
      outfit: { art: 'maedchen', jacke: '#16a085', hose: '#f5f0e1', stiefel: '#7b1e1e', haare: '#2b1a10', frisur: 'zopf', helm: '#111111' } },
    { id: 'carla', name: 'Carla', rolle: 'gast', gruppe: 1, platz: 0, alter: 10, woher: 'aus der Großstadt', mag: 'alles über Pferde wissen', sagt: 'stellt tausend Fragen', gepaeck: 'rucksack',
      outfit: { art: 'maedchen', jacke: '#9b59b6', hose: '#d9c7a0', stiefel: '#151515', haare: '#111111', frisur: 'zopf', helm: '#111111' } },
    { id: 'oskar', name: 'Oskar', rolle: 'gast', gruppe: 1, platz: 1, alter: 8, junge: true, woher: 'vom Dorf nebenan', mag: 'Hühner und Hofhunde', sagt: 'hat ein bisschen Angst vor großen Pferden', gepaeck: 'koffer',
      outfit: { art: 'junge', jacke: '#2e86c1', hose: '#5d7ea8', stiefel: '#5a3418', haare: '#7a4a21', frisur: 'kurz', helm: '#111111' } },
    { id: 'jule', name: 'Jule', rolle: 'gast', gruppe: 1, platz: 2, alter: 12, woher: 'von einer Insel', mag: 'Reiten am Strand', sagt: 'reitet zu Hause ein Islandpferd', gepaeck: 'koffer',
      outfit: { art: 'maedchen', jacke: '#e84393', hose: '#3d3d3d', stiefel: '#151515', haare: '#e6c35c', frisur: 'zoepfe', helm: '#111111' } }
  ];
  GAESTE.forEach(function (b) { PERSONEN.neu(b); });
  function gast(id) { for (var i = 0; i < GAESTE.length; i++) if (GAESTE[i].id === id) return GAESTE[i]; return null; }

  // ---------- Der Kalender: Wer ist wann da? ----------
  // Tag 1 bis 3: Gruppe 0, Tag 4 und 5: niemand, Tag 6 bis 8: Gruppe 1, dann wieder von vorn
  function besuchNr(tag) { return Math.floor(((tag === undefined ? KALENDER.tag() : tag) - 1) / (BLEIBEN + PAUSE)); }
  // Der wievielte Tag des Besuchs ist heute? 1 = Ankunft, 3 = Abreise, 0 = es ist niemand da
  function besuchsTag(tag) {
    var t = ((tag === undefined ? KALENDER.tag() : tag) - 1) % (BLEIBEN + PAUSE);
    return t < BLEIBEN ? t + 1 : 0;
  }
  function gruppeJetzt() { return besuchNr() % 2; }
  // In wie vielen Tagen kommt der nächste Bus? (0 = heute sind Ferienkinder da)
  function tageBis() { var t = (KALENDER.tag() - 1) % (BLEIBEN + PAUSE); return t < BLEIBEN ? 0 : BLEIBEN + PAUSE - t; }
  // Ist dieses Kind gerade auf dem Hof zu Besuch? (auch wenn es schon im Bett ist)
  function istDa(id) {
    var b = gast(PERSONEN.kennung(id));
    if (!b || !besuchsTag() || b.gruppe !== gruppeJetzt()) return false;
    if (besuchsTag() === 1 && d.stunde < BUS_KOMMT) return false;
    return !(besuchsTag() === BLEIBEN && (abgereist === KALENDER.tag() || d.stunde >= BUS_SPAET));
  }
  // Man hat mit dem Kind gesprochen (merkt sich, bei welchem Besuch)
  function gesprochen(id) {
    var b = gast(PERSONEN.kennung(id));
    if (!b) return;
    var s = PERSONEN.stand(b.id);
    s.besuche = s.besuche || [];
    if (s.besuche[s.besuche.length - 1] !== besuchNr()) s.besuche.push(besuchNr());
  }
  // Kennt man das Kind schon von einem früheren Besuch?
  function wieder(id) {
    var s = PERSONEN.stand(PERSONEN.kennung(id));
    return !!(s.besuche && s.besuche.length && s.besuche[0] < besuchNr());
  }

  // ---------- Orte ----------
  // (die Punkte 'haus', 'zufahrt' und 'bus' im Wege-Netz stehen in js/hofkinder.js)
  var TUER = [13, -12.6];                       // vor der Tür vom Wohnhaus
  var BUS_HALT = [20.9, -26.2];                 // hier hält der Bus in der Zufahrt
  var EINSTIEG = [19.3, -24.6];                 // hier steigen die Kinder ein und aus
  var WAND = [[13.95, -12.75], [14.6, -12.8], [16.4, -12.75]];      // hier steht das Gepäck an der Hauswand
  var STALL = [[-11, 0.95, 'g0'], [-11, -0.95, 'g0'], [7.2, -0.95, 'gO']];   // bei Regen: Platz im Stall und der Punkt im Wege-Netz davor
  var FUNDORT = [-21.9, 17.2];                  // hier liegt Toms Rucksack in der Geschichte "Der vergessene Rucksack"
  // Wo die Ferienkinder zuschauen: [Punkt im Wege-Netz, x, z, dahin schauen sie (x, z), Spruch]
  var ORTE = [
    ['weideTor', -18.2, -5.4, -24, -8, 'Schau mal, das Fohlen!'],
    ['trainTor', -21.4, 19.8, -37, 22, 'Ich will auch mal so hoch springen!'],
    ['turnTor', 21.4, 19.8, 37, 22, 'Wer gewinnt wohl das Turnier?'],
    ['putzVor', -5.2, 17.6, -11.8, 15.2, 'Ich schaue beim Putzen zu.'],
    ['hofSO', 13.4, 10.2, 12, 0, 'Auf dem Hof ist es viel schöner als in der Schule.'],
    ['ostHof', 15.4, -2.0, 13.5, -3, 'Pferde trinken ganz schön viel!'],
    ['g1', -6, -0.7, -6, 4, 'Im Stall riecht es so gut nach Heu.'],
    ['longeVor', -8.4, 23.6, -10, 34, 'Das Pferd läuft immer im Kreis!']
  ];
  // Der Weg vom Bus: von der Landstraße in die Zufahrt
  var REIN = [[150, -34.7], [28, -34.7], [23, -33.4], [20.9, -30.6], BUS_HALT];
  var RUECK = [BUS_HALT, [20.9, -30.6], [23, -33.4], [28, -34.7], [32, -34.7]];     // rückwärts hinaus
  var FORT = [[32, -34.7], [-190, -34.7]];

  // ---------- Bauen ----------
  var kinder = [], bus = null, fund = null, gebaut = -1;
  var angekommen = 0, abgereist = 0, gemeldet = 0;      // an welchem Spieltag war das schon?
  function baue(ctx) {
    H = ctx; kinder = []; bus = null; fund = null; gebaut = -1; angekommen = 0; abgereist = 0;
    // anmelden, damit man die Ferienkinder ansprechen kann (auch die, die gerade nicht da sind)
    GAESTE.forEach(function (b) {
      PERSONEN.melde(b.id, {
        wo: function () { var G = kinder[b.platz]; return G && G.wer === b ? { x: G.x, z: G.z, da: G.da && G.figur.wurzel.visible, frei: !G.steigtEin } : { x: 0, z: 0, da: false, frei: false }; },
        halte: function (sek) { var G = kinder[b.platz]; if (G && G.wer === b) G.halt = sek; }
      });
    });
    if (besuchsTag()) sorge();
  }
  // Der Bus: eine Gruppe, die fährt. Zuerst Klötze, dann das 3D-Modell
  function baueBus() {
    var g = new THREE.Group(), s = H.szene;
    var statt = [BAU.kasten(BUS_MASSE[2], BUS_MASSE[1] - 0.5, BUS_MASSE[0], 0xf3ead8, g, 0, BUS_MASSE[1] / 2 + 0.25, 0),
      BAU.kasten(BUS_MASSE[2] + 0.04, 0.3, BUS_MASSE[0] + 0.04, 0xc0392b, g, 0, 1.0, 0)];
    MODELLE3D.setze('ferienbus', g, { vordreh: -Math.PI / 2, masse: [BUS_MASSE[2], BUS_MASSE[1], BUS_MASSE[0]], statt: statt });
    g.visible = false; s.add(g);
    bus = { g: g, zustand: 'weg', x: 0, z: 0, kurs: 0, weg: null, wand: null, t: 0 };
  }
  // Figuren und Gepäck für die Gruppe, die gerade zu Besuch ist
  function sorge() {
    var gr = gruppeJetzt(), s = H.szene;
    if (!bus) baueBus();
    if (!fund) { fund = MODELLE3D.setze('rucksack', s, { x: FUNDORT[0], z: FUNDORT[1], dreh: 0.6, hoehe: 0.5 }); fund.visible = false; }
    if (gebaut === gr) return;
    gebaut = gr;
    GAESTE.filter(function (b) { return b.gruppe === gr; }).forEach(function (b) {
      var G = kinder[b.platz];
      if (!G) {
        var f = baueFigur(b.outfit, { helm: false });
        G = kinder[b.platz] = { platz: b.platz, figur: f, x: TUER[0], z: TUER[1], kurs: 0, phase: b.platz, laeuft: 0, plan: [], t: 0, frisch: true, gruss: -3 - b.platz };
        f.wurzel.visible = false; s.add(f.wurzel);
        // Gepäck: in den Armen, auf dem Rücken und an der Hauswand (immer nur eins davon ist zu sehen)
        G.arme = new THREE.Group(); G.arme.position.set(0, 0.02, 0.3); f.gelenke.rumpf.add(G.arme);
        G.ruecken = new THREE.Group(); G.ruecken.position.set(0, 0.2, -0.2); f.gelenke.rumpf.add(G.ruecken);
        G.wand = new THREE.Group(); G.wand.position.set(WAND[b.platz][0], 0, WAND[b.platz][1]); s.add(G.wand);
        MODELLE3D.setze('koffer', G.arme, { hoehe: 0.5, dreh: Math.PI / 2 });
        MODELLE3D.setze('rucksack', G.ruecken, { hoehe: 0.46, dreh: Math.PI });
        G.wandKoffer = MODELLE3D.setze('koffer', G.wand, { hoehe: 0.62, dreh: 0.2 + b.platz });
        G.wandRucksack = MODELLE3D.setze('rucksack', G.wand, { hoehe: 0.55, dreh: 0.3 });
      } else G.figur.setzeOutfit(b.outfit);
      G.wer = b; G.da = false; G.plan = []; G.modus = null; G.traegt = false; G.steigtEin = false; G.amBus = false; G.halt = 0; G.knoten = 'haus'; G.zuKnoten = null;
      G.figur.wurzel.visible = false; G.spruch = 'Hallo! Ich bin ' + b.name + '.';
      if (G.schild) { G.figur.wurzel.remove(G.schild); G.schild.material.map.dispose(); G.schild.material.dispose(); }
      G.schild = BAU.schwebeText(b.name, 0.3, { schrift: 40 }); G.schild.position.y = 1.95; G.figur.wurzel.add(G.schild);
      G.wandKoffer.visible = b.gepaeck === 'koffer'; G.wandRucksack.visible = b.gepaeck === 'rucksack';
      zeigeGepaeck(G, 'weg');
    });
  }
  // Wo ist das Gepäck? 'traegt' = das Kind hat es bei sich, 'wand' = es steht am Haus, 'weg' = nicht zu sehen
  function zeigeGepaeck(G, wo) {
    var koffer = G.wer.gepaeck === 'koffer';
    G.traegt = wo === 'traegt';
    G.arme.visible = G.traegt && koffer; G.ruecken.visible = G.traegt && !koffer; G.wand.visible = wo === 'wand';
  }
  function gruppe() { return kinder.filter(function (G) { return G && G.wer && G.wer.gruppe === gebaut; }); }

  // ---------- Sprechblase ----------
  function sag(G, text, sek) {
    var f = G.figur;
    if (G.blase) { f.wurzel.remove(G.blase); G.blase.material.map.dispose(); G.blase.material.dispose(); }
    G.blase = BAU.schwebeText(text, 0.34, { schrift: 36, immerSichtbar: true });
    G.blase.position.y = 2.45; G.blase.renderOrder = 5; f.wurzel.add(G.blase);
    G.blasZeit = sek || 3.2;
  }

  // ---------- Der Bus ----------
  function busFahre(weg, zustand, rueckwaerts) {
    bus.weg = weg.slice(1); bus.zustand = zustand; bus.t = 0; bus.rueck = !!rueckwaerts; bus.g.visible = true;
    if (zustand === 'kommt') { bus.x = weg[0][0]; bus.z = weg[0][1]; bus.kurs = Math.atan2(weg[1][0] - weg[0][0], weg[1][1] - weg[0][1]); }
    if (bus.wand) { H.waende.splice(H.waende.indexOf(bus.wand), 1); bus.wand = null; }
  }
  function busSchritt(dt) {
    if (!bus || bus.zustand === 'weg') return;
    bus.t += dt;
    if (bus.weg && bus.weg.length) {
      var p = bus.weg[0], dx = p[0] - bus.x, dz = p[1] - bus.z, dist = Math.hypot(dx, dz);
      // vor dem Halt und in der Kurve langsamer, rückwärts auch
      var v = bus.rueck ? 2.6 : bus.zustand === 'kommt' ? (bus.weg.length <= 3 ? 2.2 + dist * 0.5 : 4.5 + dist * 0.4) : 2 + bus.t * 2;
      v = Math.min(BUS_TEMPO, v);
      if (dist < Math.max(0.15, v * dt)) { bus.x = p[0]; bus.z = p[1]; bus.weg.shift(); }
      else {
        var soll = Math.atan2(dx, dz) + (bus.rueck ? Math.PI : 0), diff = Math.atan2(Math.sin(soll - bus.kurs), Math.cos(soll - bus.kurs));
        bus.kurs += diff * Math.min(1, dt * 3.2);
        bus.x += dx / dist * v * dt; bus.z += dz / dist * v * dt;
      }
    } else if (bus.zustand === 'kommt') {
      // angekommen: Jetzt steht der Bus im Weg
      bus.zustand = 'steht'; bus.t = 0; bus.kurs = 0;
      bus.wand = [BUS_HALT[0] - BUS_MASSE[2] / 2, BUS_HALT[1] - BUS_MASSE[0] / 2, BUS_HALT[0] + BUS_MASSE[2] / 2, BUS_HALT[1] + BUS_MASSE[0] / 2];
      H.waende.push(bus.wand);
    } else if (bus.zustand === 'zurueck') busFahre(FORT, 'faehrt');
    else if (bus.zustand === 'faehrt') { bus.zustand = 'weg'; bus.g.visible = false; }
    bus.g.position.set(bus.x, 0, bus.z); bus.g.rotation.y = bus.kurs;
  }
  function busWeg() { if (bus && (bus.zustand === 'steht' || bus.zustand === 'kommt')) busFahre(RUECK, 'zurueck', true); }
  function nahAmHof() { return Math.hypot(H.S.x - 10, H.S.z + 10) < 60; }

  // ---------- Zu Fuß ----------
  function laufZu(G, x, z, dt) {
    var dx = x - G.x, dz = z - G.z, dist = Math.hypot(dx, dz), v = G.modus === 'regen' ? RENNEN : GEHEN;
    if (dist < 0.2) return true;
    var zielKurs = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(zielKurs - G.kurs), Math.cos(zielKurs - G.kurs));
    G.kurs += diff * Math.min(1, dt * 9);
    var s = Math.min(dist, v * dt);
    G.x += dx / dist * s; G.z += dz / dist * s;
    G.phase += v * dt * 4.2; G.laeuft = v > 2.4 ? 1 : 0.8;
    return false;
  }
  function weiter(G) { G.plan.shift(); G.frisch = true; G.t = 0; }
  function nimmPlan(G, plan) { G.plan = plan; G.frisch = true; G.t = 0; }
  // irgendwo zuschauen, wo noch kein anderes Ferienkind steht
  function neuerPlan(G) {
    var frei = ORTE.filter(function (o) { return !gruppe().some(function (A) { return A !== G && A.ort === o; }); });
    var o = frei[Math.floor(Math.random() * frei.length)];
    G.ort = o; G.spruch = o[5];
    return [['geh', o[0]], ['punkt', o[1], o[2]], ['warte', 22 + Math.random() * 26, o[3], o[4]], ['geh', o[0]]];
  }
  function tu(G, dt) {
    var s = G.plan[0], neu = G.frisch, K = HOFKINDER.knoten;
    G.frisch = false; G.t += dt;
    switch (s[0]) {
      case 'geh':
        if (neu) {
          var ab = G.zuKnoten || G.knoten, r = HOFKINDER.route(ab, s[1]);
          if (G.zuKnoten && r[1] === G.knoten) r = HOFKINDER.route(G.knoten, s[1]);
          G.pfad = r;
        }
        if (!G.pfad.length) { weiter(G); break; }
        G.zuKnoten = G.pfad[0];
        if (laufZu(G, K[G.pfad[0]][0], K[G.pfad[0]][1], dt)) { G.knoten = G.pfad.shift(); G.zuKnoten = null; if (!G.pfad.length) weiter(G); }
        break;
      case 'punkt': if (laufZu(G, s[1], s[2], dt)) weiter(G); break;
      case 'pause': if (G.t > s[1]) weiter(G); break;                 // kurz warten (zum Beispiel, bis man aus dem Bus steigt)
      case 'warte':
        if (neu) G.kurs = Math.atan2(s[2] - G.x, s[3] - G.z);
        if (G.t > s[1]) weiter(G);
        break;
      case 'schutz':                 // im Stall warten, bis der Regen vorbei ist
        if (neu) { G.kurs = G.z < 0 ? 0 : Math.PI; G.spruch = 'Bei Regen ist es im Stall am gemütlichsten.'; }
        break;
      case 'stell': zeigeGepaeck(G, 'wand'); weiter(G); break;       // Gepäck an die Hauswand stellen
      case 'nimm': zeigeGepaeck(G, 'traegt'); weiter(G); break;      // Gepäck wieder mitnehmen
      case 'rein': G.da = false; G.figur.wurzel.visible = false; G.plan = []; break;        // ins Haus: Gute Nacht!
      case 'bus':                    // am Bus warten, bis alle da sind
        if (neu) { G.amBus = true; G.kurs = Math.atan2(H.S.x - G.x, H.S.z - G.z); G.spruch = 'Tschüs! Es war so schön hier!'; }
        break;
      default: weiter(G);
    }
  }

  // ---------- Was ist gerade dran? ----------
  function lage() {
    var bt = besuchsTag(), h = d.stunde, tag = KALENDER.tag();
    if (!bt) return 'fort';
    if (bt === 1 && angekommen !== tag) return h >= BUS_KOMMT ? 'ankunft' : 'fort';
    if (bt === BLEIBEN && (abgereist === tag || h >= BUS_SPAET + 0.3)) return 'fort';
    if (bt === BLEIBEN && h >= PACKEN) return 'abreise';
    if (h >= INS_BETT || h < AUFSTEHEN) return 'nacht';
    return WETTER.regnet() ? 'regen' : 'tag';
  }
  // Das Kind steht plötzlich da (zum Beispiel, wenn man mitten am Tag auf den Hof kommt)
  function stelle(G, x, z, knoten) {
    G.da = true; G.x = x; G.z = z; G.knoten = knoten; G.zuKnoten = null; G.steigtEin = false; G.amBus = false;
    G.figur.wurzel.visible = true; G.figur.setzePose('steh', true);
  }
  function alleFort() {
    gruppe().forEach(function (G) { G.da = false; G.figur.wurzel.visible = false; G.plan = []; G.modus = 'fort'; zeigeGepaeck(G, 'weg'); });
  }

  // ---------- Jedes Bild ----------
  function schritt(dt) {
    if (!H) return;
    var was = lage(), tag = KALENDER.tag(), bt = besuchsTag();
    if (bt) sorge();
    busSchritt(dt);
    if (fund) fund.visible = typeof EREIGNISSE !== 'undefined' && EREIGNISSE.laeuft() === 'ferien_rucksack' && EREIGNISSE.stand().laeuft.schritt === 1;
    if (!bt || gebaut < 0) { if (gebaut >= 0) { alleFort(); gebaut = -1; } busWeg(); return; }      // niemand zu Besuch: auch das Gepäck ist weg
    var alle = gruppe();
    // morgens Bescheid sagen, dass heute der Bus kommt
    if (bt === 1 && d.stunde < BUS_KOMMT && d.stunde > 7.2 && gemeldet !== tag) { gemeldet = tag; KERN.meldung('🚌 Heute um 9 Uhr kommen Ferienkinder mit dem Bus!', 'knapp'); }

    // ----- Ankunft -----
    if (was === 'ankunft') {
      if (d.stunde > BUS_KOMMT + 0.7 || !nahAmHof()) {
        // Man war nicht dabei: Die Kinder sind einfach schon da
        angekommen = tag;
        alle.forEach(function (G, i) { var o = ORTE[(i * 3 + tag) % ORTE.length]; stelle(G, o[1], o[2], o[0]); G.ort = o; G.spruch = o[5]; G.kurs = Math.atan2(o[3] - o[1], o[4] - o[2]); zeigeGepaeck(G, 'wand'); G.modus = 'tag'; nimmPlan(G, [['warte', 6 + i * 8, o[3], o[4]], ['geh', o[0]]]); });
        return;
      }
      if (bus.zustand === 'weg') { busFahre(REIN, 'kommt'); KERN.meldung('🚌 Der Bus mit den Ferienkindern kommt!', 'knapp'); }
      if (bus.zustand === 'steht' && bus.t > 1.2) {
        angekommen = tag;
        alle.forEach(function (G, i) {
          stelle(G, EINSTIEG[0] - i * 0.5, EINSTIEG[1] + i * 0.9, 'bus'); G.kurs = Math.PI / 2;
          G.figur.wurzel.visible = false;
          zeigeGepaeck(G, 'traegt'); G.modus = 'kommt'; G.spruch = 'Hallo! Wir sind die Ferienkinder!';
          nimmPlan(G, [['pause', 1.5 * i + 1.2], ['geh', 'haus'], ['punkt', WAND[G.platz][0], WAND[G.platz][1] + 0.8], ['stell'], ['pause', 1.5]]);
        });
      }
      return;
    }
    if (was === 'fort') {
      if (alle.some(function (G) { return G.da; })) alleFort();
      if (bt === BLEIBEN && abgereist !== tag && d.stunde >= BUS_SPAET) { abgereist = tag; geschichteAus(); }
      busWeg();
      return;
    }
    // Der Bus fährt wieder, sobald alle ausgestiegen und ein Stück gegangen sind
    if (bus.zustand === 'steht' && was !== 'abreise' && bus.t > 14) busWeg();

    // ----- Abreise -----
    if (was === 'abreise') {
      if (bus.zustand === 'weg' && d.stunde >= BUS_HOLT) busFahre(REIN, 'kommt');
      var bereit = alle.every(function (G) { return G.amBus || !G.da; });
      if (bus.zustand === 'steht' && (bereit || d.stunde >= BUS_SPAET) && !alle.some(function (G) { return G.steigtEin; })) {
        if (nahAmHof()) KERN.meldung('👋 Die Ferienkinder fahren nach Hause. Bis zum nächsten Mal!', 'knapp');
        alle.forEach(function (G, i) { G.steigtEin = true; G.einT = 2.4 + i * 0.9; if (G.da) { sag(G, 'Tschüs!', 2.2); if (G.wer.gepaeck !== 'koffer') { G.figur.setzePose('winken'); G.gruss = 3; } } });       // wer den Koffer trägt, hat keine Hand frei
      }
    }

    alle.forEach(function (G) {
      var f = G.figur;
      if (abgereist === tag) return;               // alle sitzen schon im Bus
      // einsteigen: winken, dann ist das Kind im Bus
      if (G.steigtEin) {
        G.einT -= dt;
        if (G.einT <= 0 && G.da) { G.da = false; f.wurzel.visible = false; zeigeGepaeck(G, 'weg'); }
        if (alle.every(function (A) { return !A.da; }) && abgereist !== tag) { abgereist = tag; geschichteAus(); busWeg(); alle.forEach(function (A) { A.steigtEin = false; A.modus = 'fort'; }); }
      }
      // neue Lage: neuer Plan
      if (was !== G.modus && G.modus !== 'kommt' && !G.steigtEin) {
        var vorher = G.modus;
        G.modus = was;
        if (!G.da && was !== 'nacht') {
          // steht morgens auf (oder man kommt gerade erst auf den Hof)
          if (vorher === 'nacht') stelle(G, TUER[0] + (G.platz - 1) * 0.7, TUER[1], 'haus');
          else { var o = ORTE[(G.platz * 3 + tag) % ORTE.length]; stelle(G, o[1], o[2], o[0]); G.kurs = Math.atan2(o[3] - o[1], o[4] - o[2]); G.spruch = o[5]; }
          zeigeGepaeck(G, 'wand');
          G.spruch = vorher === 'nacht' ? 'Guten Morgen!' : G.spruch;
        }
        if (was === 'regen') { var sp = STALL[G.platz]; G.ort = null; G.spruch = 'Schnell in den Stall!'; nimmPlan(G, [['geh', sp[2]], ['punkt', sp[0], sp[1]], ['schutz']]); }
        else if (was === 'nacht') { G.ort = null; G.spruch = 'Gute Nacht! Bis morgen!'; nimmPlan(G, G.da ? [['geh', 'haus'], ['rein']] : []); if (!G.da) zeigeGepaeck(G, 'wand'); }
        else if (was === 'abreise') { G.ort = null; G.spruch = 'Heute fahren wir leider schon heim.'; nimmPlan(G, [['geh', 'haus'], ['punkt', WAND[G.platz][0], WAND[G.platz][1] + 0.8], ['nimm'], ['geh', 'bus'], ['punkt', EINSTIEG[0] - G.platz * 0.5, EINSTIEG[1] + G.platz * 0.9], ['bus']]); }
        else nimmPlan(G, []);
      }
      if (!G.da) return;
      if (G.modus === 'kommt' && !G.plan.length) G.modus = null;        // angekommen und Gepäck abgestellt: ab jetzt wie an jedem Tag
      if (!G.plan.length) nimmPlan(G, neuerPlan(G));
      G.laeuft = 0;
      if (G.halt > 0 && was !== 'abreise') {
        // Jemand spricht mit dem Kind: stehen bleiben und hinschauen
        G.halt -= dt;
        G.kurs = Math.atan2(H.S.x - G.x, H.S.z - G.z); G.gruss = Math.min(G.gruss, 0); if (G.blase) G.blasZeit = 0;
      } else if (!G.steigtEin) { G.halt = 0; tu(G, dt); }
      if (!G.da) return;
      if (G.plan[0] && G.plan[0][0] === 'pause' && G.modus === 'kommt' && G.traegt && G.knoten === 'bus' && !G.zuKnoten && !f.wurzel.visible) return;       // sitzt noch im Bus
      f.wurzel.visible = true;
      // Gruß, wenn die Spielerin vorbeikommt
      G.gruss -= dt;
      if (G.gruss <= -7 && Math.hypot(H.S.x - G.x, H.S.z - G.z) < 2.6) {
        G.gruss = 3; sag(G, G.spruch);
        if (G.laeuft === 0 && !G.traegt) f.setzePose('winken');
      }
      if (G.blase) { G.blasZeit -= dt; G.blase.visible = G.blasZeit > 0; }
      if (G.gruss <= 0) f.setzePose(G.traegt && G.wer.gepaeck === 'koffer' ? 'tragen' : 'steh');
      f.gehe(G.phase, G.laeuft);
      f.bewege(dt);
      f.wurzel.position.set(G.x, 0, G.z);
      f.wurzel.rotation.y = G.kurs;
    });
  }
  // Läuft gerade eine Geschichte mit einem Ferienkind, das abgereist ist? Dann hört sie auf (sie kann später neu anfangen).
  function geschichteAus() {
    if (typeof EREIGNISSE === 'undefined' || !EREIGNISSE.laeuft()) return;
    var g = EREIGNISSE.GESCHICHTEN.filter(function (e) { return e.id === EREIGNISSE.laeuft(); })[0];
    if (g && g.schritte.some(function (s) { return s.art === 'rede' && gast(PERSONEN.kennung(s.wer)); })) EREIGNISSE.brichAb();
  }

  // Nachts (oder wenn die Spielerin schlafen geht): Alle liegen im Bett, der Bus ist weg
  function alleHeim() {
    if (!H) return;
    kinder.forEach(function (G) { if (!G) return; G.da = false; G.figur.wurzel.visible = false; G.plan = []; G.modus = 'nacht'; G.steigtEin = false; G.amBus = false; if (G.blase) G.blase.visible = false; });
    if (bus) { if (bus.wand) { H.waende.splice(H.waende.indexOf(bus.wand), 1); bus.wand = null; } bus.zustand = 'weg'; bus.g.visible = false; }
    if (besuchsTag() === BLEIBEN && d.stunde >= PACKEN) { abgereist = KALENDER.tag(); geschichteAus(); }
  }

  return {
    GAESTE: GAESTE, baue: baue, schritt: schritt, alleHeim: alleHeim,
    besuchsTag: besuchsTag, besuchNr: besuchNr, tageBis: tageBis, istDa: istDa, wieder: wieder, gesprochen: gesprochen,
    kinder: function () { return kinder; }, bus: function () { return bus; }, lage: lage
  };
})();
