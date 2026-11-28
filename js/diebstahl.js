// ============================================================
//  DIEBSTAHL  -  ein Kinderkrimi auf dem Hof (Stufe 2, Abenteuer)
//
//  Morgens fehlt etwas. Lotte bittet dich um Hilfe. Du suchst
//  Hinweise (Spuren am Boden, Fundstücke, Aussagen mit Uhrzeit),
//  sie stehen im Notizbuch. Drei Verdächtige stehen zur Wahl.
//  Hast du genug Hinweise, sagst du Lotte deinen Verdacht.
//  Liegst du falsch, sagt Lotte, was nicht passt. Einen Bösewicht
//  gibt es nie: Am Ende steht ein Lachen oder eine Entschuldigung.
//
//  Die Fälle stehen in der Liste FAELLE. Ein neuer Fall ist ein
//  neuer Eintrag dort, kein neuer Code:
//
//    { id: 'schleife', titel: 'Die goldene Turnierschleife', was: 'die goldene Turnierschleife',
//      ruf: '…',                                   // das sagt Lotte am Anfang
//      tatort: { x, z, ding, tipp, text },         // dort fehlt etwas
//      leute: [                                    // immer drei Verdächtige
//        { id: 'elster', name: 'die Elster', bild: '🐦',
//          spuren: [{ x, z, ding, tipp, text }, …],   // liegen nur da, wenn sie es WAR (ohne "spuren" war sie es nie)
//          alibi: { wer: 'mia', text } oder { x, z, ding, tipp, text },   // gibt es nur, wenn sie es NICHT war
//          falsch: '…',                            // das sagt Lotte, wenn man sie zu Unrecht verdächtigt
//          fund: { x, z, ding, wo, text } } ] }    // dort taucht das Ding wieder auf, mit dem Text für das Ende
//
//  Wer es war, würfelt das Spiel jedes Mal neu unter allen, die "spuren" haben.
//  Der Stand liegt in STAND.daten.diebstahl:
//    laeuft = { fall, taeter, tag, phase, hinweise, falsch }
//    phase: 'start' (Lotte ruft) → 'suche' (Hinweise sammeln) → 'fund' (nachsehen, ob es stimmt)
// ============================================================
var DIEBSTAHL = (function () {
  'use strict';
  var d = STAND.daten;
  d.diebstahl = d.diebstahl || {};
  var A = d.diebstahl;
  if (A.laeuft === undefined) A.laeuft = null;
  A.mal = A.mal || 0;            // so viele Fälle schon gelöst
  A.zuletzt = A.zuletzt || 0;    // Spieltag vom letzten Fall

  // ---------- Zahlen zum Einstellen ----------
  var AB_TAG = 4;                // frühestens an diesem Spieltag
  var PAUSE = 6;                 // höchstens einmal in so vielen Spieltagen
  var VON_UHR = 8, BIS_UHR = 14; // nur in dieser Zeit fällt auf, dass etwas fehlt
  var LOHN = 12;                 // Münzen, wenn der erste Verdacht stimmt
  var LOHN_SPAETER = 8;          // Münzen, wenn man sich vorher geirrt hat
  var GENUG = 3;                 // ab so vielen Hinweisen darf man Lotte einen Verdacht sagen
  var TAGE = 2;                  // nach so vielen Spieltagen löst Lotte den Fall selbst
  var NAH = 2.3;                 // so nah muss man an einer Spur stehen
  var SICHT = 16;                // ab hier sieht man die Lupe über einer Spur

  // ---------- Die Fälle ----------
  var FAELLE = [
    { id: 'schleife', titel: 'Die goldene Turnierschleife', was: 'die goldene Turnierschleife',
      ruf: '{ich}, gut dass du da bist! Die goldene Turnierschleife ist weg. Gestern Abend hing sie noch an der Tafel mit den Reitabzeichen. Hilfst du mir, das aufzuklären?',
      tatort: { x: 14.9, z: 10.4, ding: 'nagel', tipp: 'an der Tafel mit den Reitabzeichen', text: 'Der Nagel ist leer. Hier hing die goldene Schleife. Sie glitzert in der Sonne wie ein Schatz.' },
      leute: [
        { id: 'elster', name: 'die Elster', bild: '🐦',
          spuren: [
            { x: 11.9, z: 7.7, ding: 'feder', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Eine schwarz-weiße Feder. Sie schimmert ein bisschen blau.' },
            { x: 16.2, z: -0.4, ding: 'faden', tipp: 'beim Wassertrog', text: 'Ein goldener Faden hängt ganz oben an der Dachrinne. So hoch kommt nur, wer fliegen kann.' }],
          alibi: { x: 17.6, z: 6.2, ding: 'nest', tipp: 'am alten Pfahl mit dem Elsternnest', text: 'Im Elsternnest liegen Zweige, ein Kronkorken und ein Knopf. Aber keine Schleife.' },
          falsch: 'Die Elster? Im Nest liegt aber nichts Goldenes. Das passt nicht zusammen.',
          fund: { x: 17.6, z: 6.2, ding: 'nest', wo: 'im Elsternnest auf dem alten Pfahl', text: 'Im Nest glitzert es: die Schleife! Elstern sammeln alles, was glänzt. Die Elster schimpft laut, aber Lotte tauscht die Schleife gegen einen blanken Löffel. Damit ist die Elster zufrieden.' } },
        { id: 'minka', name: 'Minka', bild: '🐱',
          spuren: [
            { x: 13.4, z: 9.2, ding: 'pfoten', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Kleine Pfotenabdrücke im Staub. Sie führen von der Tafel zum Stall.' },
            { x: 6.5, z: 0.7, ding: 'faden', tipp: 'in der Stallgasse', text: 'Ein goldener Faden im Stroh, ganz zerkaut und nass.' }],
          alibi: { wer: 'mia', text: 'Minka? Die hat die ganze Nacht auf meiner Jacke im Stall geschlafen. Um sieben Uhr hat sie immer noch geschnarcht.' },
          falsch: 'Minka? Mia sagt, sie hat bis sieben Uhr auf ihrer Jacke geschlafen. Das passt nicht.',
          fund: { x: 5, z: 9.5, ding: 'schleife', wo: 'an Minkas Lieblingsplatz in der Sonne', text: 'Da liegt die Schleife, und Minka liegt obendrauf! Sie hat damit gespielt wie mit einer Maus. Ein bisschen zerzaust ist die Schleife jetzt, aber Lotte bügelt sie wieder glatt. Minka bekommt dafür ein Wollknäuel.' } },
        { id: 'paul', name: 'Paul', bild: '🧒',
          alibi: { wer: 'hanna', text: 'Paul? Der ist heute erst um acht gekommen. Ich bin mit dem Rad hinter ihm hergefahren. Da war die Schleife schon weg.' },
          falsch: 'Paul? Hanna sagt, er kam erst um acht. Da war die Schleife schon fort.' }] },

    { id: 'buerste', titel: 'Emmas blaue Bürste', was: 'Emmas blaue Lieblingsbürste',
      ruf: '{ich}, wir haben ein Rätsel! Emmas blaue Lieblingsbürste ist verschwunden. Gestern lag sie noch am Putzplatz. Suchst du mit mir nach Hinweisen?',
      tatort: { x: -12.6, z: 16.6, ding: 'nagel', tipp: 'am Putzplatz', text: 'Hier stand Emmas Putzkiste. Striegel und Hufkratzer sind noch da. Nur die blaue Bürste fehlt.' },
      leute: [
        { id: 'bello', name: 'Bello', bild: '🐶',
          spuren: [
            { x: -5.2, z: 17.6, ding: 'pfotenGross', tipp: 'auf dem Weg vor dem Putzplatz', text: 'Große Pfotenabdrücke. Sie führen vom Putzplatz weg, quer über den Hof.' },
            { x: 10.4, z: 10.6, ding: 'borsten', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Ein paar blaue Borsten. Und sie sind ganz nass gesabbert. Igitt!' }],
          alibi: { wer: 'ben', text: 'Bello? Der war die ganze Zeit bei mir am Wassertrog angebunden, bis halb neun. Der konnte nirgends hin.' },
          falsch: 'Bello? Ben sagt, er war bis halb neun am Wassertrog angebunden. Das passt nicht.',
          fund: { x: 12.6, z: -10.4, ding: 'erde', wo: 'neben Bellos Hütte, wo die Erde frisch aufgewühlt ist', text: 'Du buddelst ein bisschen, und da ist sie: Emmas Bürste! Bello hat sie vergraben wie einen Knochen. Er wedelt und ist mächtig stolz auf sein Versteck. Emma lacht und wäscht die Bürste am Wassertrog.' } },
        { id: 'jonas', name: 'Jonas', bild: '🧒',
          spuren: [
            { x: -5.2, z: 17.6, ding: 'schuh', tipp: 'auf dem Weg vor dem Putzplatz', text: 'Abdrücke von großen Reitstiefeln. Sie führen vom Putzplatz zum Stall.' },
            { x: -6, z: 0.7, ding: 'handschuh', tipp: 'in der Stallgasse', text: 'Ein grauer Reithandschuh. Innen steht mit Filzstift ein „J“.' }],
          alibi: { wer: 'lina', text: 'Jonas? Der war ab sieben mit mir auf dem Trainingsplatz. Am Putzplatz war er heute noch gar nicht.' },
          falsch: 'Jonas? Lina sagt, er war seit sieben auf dem Trainingsplatz. Das passt nicht.',
          fund: { x: -2, z: -0.7, ding: 'kiste', wo: 'in der Putzkiste von Jonas in der Stallgasse', text: 'Ganz oben in der Kiste liegt die blaue Bürste. Jonas wird rot: „Oh nein! Meine ist kaputt, da habe ich mir Emmas geliehen und vergessen zu fragen. Entschuldigung, Emma!“ Emma grinst: „Frag das nächste Mal einfach. Dann leihe ich sie dir gern.“' } },
        { id: 'kruemel', name: 'Krümel', bild: '🐴',
          alibi: { wer: 'mia', text: 'Krümel? Der stand die ganze Nacht in seiner Box. Um sieben habe ich selbst den Riegel aufgemacht.' },
          falsch: 'Krümel? Mia sagt, seine Box war bis sieben Uhr zu. Das passt nicht.' }] },

    { id: 'moehren', titel: 'Der leere Möhreneimer', was: 'die Möhren aus dem großen Eimer',
      ruf: '{ich}, stell dir vor: Der große Möhreneimer ist leer! Gestern Abend war er noch randvoll. Wer hat die Möhren? Hilfst du mir suchen?',
      tatort: { x: 5.6, z: -3.9, ding: 'eimer', tipp: 'beim Futter im Stall', text: 'Der Eimer ist leer. Am Boden liegt nur noch ein einziges Möhrenblatt.' },
      leute: [
        { id: 'kruemel', name: 'Krümel', bild: '🐴',
          spuren: [
            { box: 'kruemel', ding: 'gruen', tipp: 'vor Krümels Box', text: 'Abgebissenes Möhrengrün, direkt vor Krümels Box. Und der Riegel hängt lose und ist angeknabbert.' },
            { x: 1.5, z: -0.6, ding: 'gruen', tipp: 'in der Stallgasse', text: 'Noch mehr Möhrengrün. Wie eine Spur liegt es vom Futter bis zu den Boxen.' }],
          alibi: { wer: 'mia', text: 'Krümel? Seine Box war heute früh um sieben fest zu. Ich musste richtig am Riegel ziehen.' },
          falsch: 'Krümel? Mia sagt, seine Box war um sieben fest verriegelt. Das passt nicht.',
          fund: { box: 'kruemel', ding: 'gruen', wo: 'in Krümels Box', text: 'Im Stroh liegen noch drei Möhren, und Krümel kaut zufrieden. Er kann den Riegel mit den Lippen aufschieben! In der Nacht hat er sich selbst bedient. Mia schraubt einen zweiten Riegel an, und Krümel bekommt heute keine Möhre mehr.' } },
        { id: 'ben', name: 'Ben', bild: '🧒',
          spuren: [
            { x: 14.2, z: -1.6, ding: 'zettel', tipp: 'beim Wassertrog', text: 'Ein Zettel: „Möhrenkuchen: 500 Gramm Möhren, 4 Eier, Mehl, Zucker …“ Die Schrift ist krakelig.' },
            { x: 13, z: -11.2, ding: 'mehl', tipp: 'vor der Haustür', text: 'Weiße Mehlspuren vor der Haustür. Jemand hat hier gebacken.' }],
          alibi: { wer: 'paul', text: 'Ben? Der kam heute erst um neun. Sein Rad hatte einen Platten, ich habe ihm beim Flicken geholfen.' },
          falsch: 'Ben? Paul sagt, er kam erst um neun, weil sein Rad einen Platten hatte. Das passt nicht.',
          fund: { x: 14.6, z: -11.2, ding: 'kuchen', wo: 'am Küchenfenster vom Wohnhaus', text: 'Auf der Fensterbank kühlt ein riesiger Möhrenkuchen ab! Ben kommt angelaufen: „Das sollte eine Überraschung für alle werden. Ich hätte Mia vorher fragen sollen.“ Jeder bekommt ein Stück, und Mia holt neue Möhren für die Pferde.' } },
        { id: 'huehner', name: 'die Hühner', bild: '🐔',
          alibi: { x: 10.4, z: 10.6, ding: 'koerner', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Hier picken die Hühner ihre Körner. Der Möhreneimer ist viel zu hoch für sie, und eine ganze Möhre kriegen sie nicht klein.' },
          falsch: 'Die Hühner? Der Eimer ist doch viel zu hoch für sie. Das passt nicht.' }] },

    { id: 'kekse', titel: 'Die verschwundene Keksdose', was: 'die Keksdose',
      ruf: '{ich}! Die Keksdose ist weg! Sie stand auf der Bank am Hofplatz, bis oben voll mit Haferkeksen. Wollen wir herausfinden, wo sie ist?',
      tatort: { x: 11.9, z: 7.7, ding: 'nagel', tipp: 'an der Bank am Hofplatz', text: 'Auf der Bank ist ein runder Abdruck im Staub. Genau hier stand die Keksdose.' },
      leute: [
        { id: 'lina', name: 'Lina', bild: '🧒',
          spuren: [
            { x: 0, z: 22, ding: 'kruemel', tipp: 'auf dem Weg zwischen den Reitplätzen', text: 'Kekskrümel! Eine ganze Spur, immer weiter nach Süden.' },
            { x: -8.4, z: 23.6, ding: 'serviette', tipp: 'vor dem Longierzirkel', text: 'Eine Serviette mit Blümchen. Genau solche hat Lina immer in ihrer Satteltasche.' }],
          alibi: { wer: 'hanna', text: 'Lina? Die hat von sieben bis neun mit mir die Boxen gemistet. Sie war keine Minute weg.' },
          falsch: 'Lina? Hanna sagt, sie haben von sieben bis neun zusammen gemistet. Das passt nicht.',
          fund: { x: 2.6, z: 40.5, ding: 'korb', wo: 'beim Südtor', text: 'Am Tor steht ein gepackter Picknickkorb, und obenauf liegt die Keksdose. Lina kommt dazu: „Ich wollte euch alle mit einem Picknick überraschen! Die Dose hätte ich nicht einfach nehmen sollen. Entschuldigung.“ Lotte lacht: „Dann picknicken wir jetzt. Aber erst fragen, dann packen!“' } },
        { id: 'bello', name: 'Bello', bild: '🐶',
          spuren: [
            { x: 13.4, z: 9.2, ding: 'pfotenGross', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Große Pfotenabdrücke, gleich neben der Bank.' },
            { x: 14.2, z: -1.6, ding: 'kruemel', tipp: 'beim Wassertrog', text: 'Kekskrümel und ein nasser Fleck. Hier hat jemand geschleckt.' }],
          alibi: { wer: 'ben', text: 'Bello? Mit dem war ich von acht bis neun unten am Fluss spazieren. Er war die ganze Zeit an der Leine.' },
          falsch: 'Bello? Ben sagt, er war mit ihm von acht bis neun am Fluss. Das passt nicht.',
          fund: { x: 12.6, z: -10.4, ding: 'dose', wo: 'bei Bellos Hütte', text: 'Vor der Hütte liegt die Dose, blitzblank ausgeschleckt. Bello schaut ganz unschuldig und hat Krümel an der Schnauze. Zum Glück waren es nur Haferkekse! Lotte backt neue, und die Dose kommt ab jetzt ins Regal.' } },
        { id: 'minka', name: 'Minka', bild: '🐱',
          alibi: { wer: 'mia', text: 'Minka? Die frisst nur Fisch und Sahne. Und so eine Dose kriegt sie mit ihren Pfoten niemals auf.' },
          falsch: 'Minka? Mia sagt, Kekse mag sie gar nicht, und die Dose kriegt sie nicht auf. Das passt nicht.' }] },

    { id: 'sattel', titel: 'Der Turniersattel', was: 'der Turniersattel',
      ruf: '{ich}, jetzt wird es ernst: Der Turniersattel hängt nicht mehr auf seinem Halter! Dabei ist bald Turnier. Hilfst du mir, ihn zu finden?',
      tatort: { x: 6.5, z: 0.7, ding: 'nagel', tipp: 'am Sattelhalter in der Stallgasse', text: 'Der Sattelhalter ist leer. Die Decke liegt noch da, ordentlich gefaltet.' },
      leute: [
        { id: 'hanna', name: 'Hanna', bild: '🧒',
          spuren: [
            { x: -2, z: 0.7, ding: 'fleck', tipp: 'in der Stallgasse', text: 'Ein Klecks Lederfett auf dem Boden. Es riecht nach Bienenwachs.' },
            { x: -4.2, z: 16.2, ding: 'lappen', tipp: 'auf dem Weg vor dem Putzplatz', text: 'Ein Putzlappen, ganz fettig. In die Ecke ist ein „H“ gestickt.' }],
          alibi: { wer: 'emma', text: 'Hanna? Die ist seit sieben auf dem Turnierplatz. Ich habe ihr die Stangen aufgelegt.' },
          falsch: 'Hanna? Emma sagt, sie ist seit sieben auf dem Turnierplatz. Das passt nicht.',
          fund: { x: -13.6, z: 13.4, ding: 'sattel', wo: 'hinten am Putzplatz', text: 'Auf dem Sattelbock liegt der Turniersattel und glänzt wie neu! Hanna kommt mit dem Fettlappen: „Ich wollte ihn heimlich einfetten, als Überraschung vor dem Turnier. Ich hätte Bescheid sagen sollen.“ Lotte freut sich: „So schön hat er noch nie geglänzt. Aber nächstes Mal sagst du es mir, ja?“' } },
        { id: 'paul', name: 'Paul', bild: '🧒',
          spuren: [
            { x: 10.4, z: 10.6, ding: 'schuh', tipp: 'auf dem Hofplatz vor dem Stall', text: 'Stiefelabdrücke, tief eingedrückt. Hier hat jemand etwas Schweres getragen.' },
            { x: 19.6, z: 19.6, ding: 'riemen', tipp: 'am Zaun vom Turnierplatz', text: 'Ein Steigbügelriemen liegt am Zaun vom Turnierplatz.' }],
          alibi: { wer: 'jonas', text: 'Paul? Der hat ab sieben mit mir die Schubkarre repariert. Der hatte ölige Finger, aber keinen Sattel.' },
          falsch: 'Paul? Jonas sagt, er hat seit sieben mit ihm die Schubkarre repariert. Das passt nicht.',
          fund: { x: 21.4, z: 19.8, ding: 'sattel', wo: 'am Zaun vom Turnierplatz', text: 'Über dem Zaun hängt der Turniersattel! Paul kratzt sich am Kopf: „Ich wollte nur einmal probesitzen, wie sich so ein Turniersattel anfühlt. Dann gab es Frühstück, und ich habe ihn vergessen. Entschuldigung!“ Lotte lacht: „Probesitzen darfst du. Aber auf einem Pferd, und frag vorher.“' } },
        { id: 'bello', name: 'Bello', bild: '🐶',
          alibi: { wer: 'mia', text: 'Bello? Der Sattelhalter hängt höher als mein Kopf. Da kommt Bello nie im Leben dran.' },
          falsch: 'Bello? Mia sagt, an den Sattelhalter kommt er gar nicht heran. Das passt nicht.' }] }
  ];

  var H = null;                  // der Hof: { szene, S, pferde, waende … }
  var dinge = [];                // was gerade auf dem Hof liegt: { h, gruppe, lupe }
  var gebautFuer = '';           // für welchen Fall und welche Phase gebaut wurde
  var geprueft = -1;

  // ---------- Kleine Helfer ----------
  function fall(id) { return FAELLE.filter(function (f) { return f.id === id; })[0] || null; }
  function jetzt() { return A.laeuft ? fall(A.laeuft.fall) : null; }
  function person(F, id) { return F.leute.filter(function (p) { return p.id === id; })[0] || null; }
  function taeter() { var F = jetzt(); return F ? person(F, A.laeuft.taeter) : null; }
  function gross(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function nameVon(id) { var b = PERSONEN.brief(id); return b && b.name ? b.name : gross(id); }
  function karteOffen() { var k = document.getElementById('karte'); return !!(k && k.className); }
  // Wo liegt etwas? Entweder feste Stelle (x, z) oder vor der Box eines Pferdes (box: 'kruemel')
  function ort(o) {
    if (o.box && H) {
      var P = H.pferde.filter(function (Q) { return Q.def.id === o.box; })[0];
      if (P && P.box) { var k = HOFKINDER.knoten['box' + P.box.nr]; return k ? [k[0], k[1]] : [P.box.xc, P.box.v * 3.3]; }
    }
    return [o.x || 0, o.z || 0];
  }
  // Alle Hinweise dieses Falls: Tatort, die Spuren vom Täter, die Alibis der anderen
  function hinweise() {
    var F = jetzt(); if (!F) return [];
    var L = A.laeuft, liste = [{ id: 'tatort', h: F.tatort }];
    F.leute.forEach(function (p) {
      if (p.id === L.taeter) (p.spuren || []).forEach(function (s, i) { liste.push({ id: p.id + '_spur' + i, h: s }); });
      else if (p.alibi) liste.push({ id: p.id + '_alibi', h: p.alibi, entlastet: p });
    });
    return liste;
  }
  function gefunden() { var L = A.laeuft; return hinweise().filter(function (e) { return L.hinweise[e.id]; }); }
  function offen() { var L = A.laeuft; return hinweise().filter(function (e) { return !L.hinweise[e.id]; }); }

  // ---------- Sachen zum Hinlegen (alles aus ein paar einfachen Formen) ----------
  function baueDing(art) {
    var g = new THREE.Group(), i;
    function fleck(b, t, farbe, x, z, h) { return BAU.kasten(b, h || 0.02, t, farbe, g, x || 0, (h || 0.02) / 2 + 0.01, z || 0); }
    if (art === 'pfoten' || art === 'pfotenGross') {
      var r = art === 'pfoten' ? 0.05 : 0.09;
      for (i = 0; i < 5; i++) BAU.walze(r, r, 0.012, 0x4a3b2a, g, (i % 2 ? 0.12 : -0.12), 0.012, i * 0.34 - 0.7, 8);
    } else if (art === 'schuh') {
      for (i = 0; i < 4; i++) fleck(0.13, 0.3, 0x4a3b2a, (i % 2 ? 0.16 : -0.16), i * 0.42 - 0.65, 0.012);
    } else if (art === 'feder') { fleck(0.06, 0.34, 0x1c1c22); fleck(0.05, 0.12, 0xf2f2f2, 0, 0.2); g.rotation.y = 0.6; }
    else if (art === 'faden') { fleck(0.03, 0.3, 0xf2c230); fleck(0.2, 0.03, 0xf2c230, 0.08, 0.1); }
    else if (art === 'kruemel') { for (i = 0; i < 9; i++) fleck(0.05, 0.05, 0xc99a55, Math.sin(i * 2.4) * 0.35, i * 0.16 - 0.6, 0.03); }
    else if (art === 'koerner') { for (i = 0; i < 12; i++) fleck(0.04, 0.04, 0xe3c25a, Math.sin(i * 2.4) * 0.5, Math.cos(i * 1.7) * 0.5, 0.02); }
    else if (art === 'borsten') { for (i = 0; i < 6; i++) fleck(0.02, 0.12, 0x2f6fd0, Math.sin(i * 2.1) * 0.15, Math.cos(i * 1.3) * 0.15); }
    else if (art === 'gruen') { for (i = 0; i < 5; i++) fleck(0.05, 0.22, 0x4f9a3a, Math.sin(i * 2.1) * 0.2, Math.cos(i * 1.3) * 0.2); fleck(0.07, 0.07, 0xf08a24, 0.05, 0.02, 0.06); }
    else if (art === 'handschuh') fleck(0.14, 0.22, 0x8a8f96, 0, 0, 0.05);
    else if (art === 'lappen') { fleck(0.3, 0.26, 0xd9c7a0, 0, 0, 0.03); g.rotation.y = 0.4; }
    else if (art === 'serviette') { fleck(0.24, 0.24, 0xfdf3f6, 0, 0, 0.02); fleck(0.06, 0.06, 0xe85d9a, 0.05, 0.04, 0.03); g.rotation.y = 0.5; }
    else if (art === 'zettel') { fleck(0.2, 0.28, 0xfffbe8, 0, 0, 0.015); g.rotation.y = -0.3; }
    else if (art === 'mehl') { for (i = 0; i < 5; i++) fleck(0.18, 0.14, 0xf7f7f2, Math.sin(i * 2.1) * 0.3, i * 0.24 - 0.5, 0.012); }
    else if (art === 'fleck') BAU.walze(0.13, 0.13, 0.012, 0xe0b24a, g, 0, 0.012, 0, 10);
    else if (art === 'riemen') { fleck(0.05, 0.7, 0x5a3a1e, 0, 0, 0.03); BAU.kasten(0.12, 0.03, 0.1, 0xb9bec6, g, 0, 0.03, 0.38); g.rotation.y = 0.5; }
    else if (art === 'eimer') BAU.walze(0.24, 0.19, 0.36, 0x3f7fc0, g, 0, 0.18, 0, 12);
    else if (art === 'erde') { BAU.walze(0.12, 0.5, 0.2, 0x6b4a2c, g, 0, 0.1, 0, 10); fleck(0.3, 0.24, 0x5a3d24, 0.5, 0.2, 0.05); }
    else if (art === 'nest') {
      BAU.walze(0.07, 0.09, 2.5, 0x6b4a2c, g, 0, 1.25, 0, 8);          // der alte Pfahl
      BAU.walze(0.36, 0.2, 0.2, 0x5a3d24, g, 0, 2.58, 0, 10);          // das Nest obendrauf
      BAU.kasten(0.5, 0.03, 0.03, 0x4a3320, g, 0, 2.68, 0.1).rotation.y = 0.5;
    }
    else if (art === 'kiste') { BAU.kasten(0.46, 0.26, 0.3, 0xc0392b, g, 0, 0.13, 0); BAU.kasten(0.3, 0.03, 0.04, 0x30343a, g, 0, 0.3, 0); }
    else if (art === 'korb') { BAU.walze(0.3, 0.24, 0.26, 0xb98b4e, g, 0, 0.13, 0, 10); BAU.walze(0.14, 0.14, 0.1, 0xd94a3d, g, 0.04, 0.31, 0, 10); }
    else if (art === 'dose') { var dd = BAU.walze(0.14, 0.14, 0.2, 0xd94a3d, g, 0, 0.14, 0, 10); dd.rotation.z = Math.PI / 2; }
    else if (art === 'kuchen') { BAU.walze(0.26, 0.26, 0.12, 0xd9903d, g, 0, 1.16, 0, 12); BAU.walze(0.27, 0.27, 0.02, 0xfff3d6, g, 0, 1.23, 0, 12); }
    else if (art === 'sattel') { BAU.kasten(0.44, 0.1, 0.5, 0x5a3219, g, 0, 1.0, 0); BAU.kasten(0.5, 0.3, 0.12, 0x4a2814, g, 0, 0.86, 0.2); BAU.kasten(0.5, 0.3, 0.12, 0x4a2814, g, 0, 0.86, -0.2); }
    else if (art === 'schleife') { BAU.walze(0.13, 0.13, 0.03, 0xf2c230, g, 0, 0.04, 0, 12); fleck(0.06, 0.24, 0xf2c230, -0.05, 0.18); fleck(0.06, 0.24, 0xf2c230, 0.06, 0.18); }
    return g;                                                            // 'nagel' und alles Unbekannte: nur die Lupe
  }

  // Legt hin, was zum Fall gehört: in der Suche alle Hinweise mit Stelle, am Ende das Fundstück
  function raeume() { dinge.forEach(function (e) { H.szene.remove(e.gruppe); e.gruppe.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }); dinge = []; gebautFuer = ''; }
  function sorge() {
    if (!H) return;
    var L = A.laeuft, kenn = L ? L.fall + '|' + L.taeter + '|' + L.phase : '';
    if (kenn === gebautFuer) return;
    raeume(); gebautFuer = kenn;
    if (!L) return;
    var F = jetzt(), liste = [];
    if (L.phase === 'suche') hinweise().forEach(function (e) { if (!e.h.wer) liste.push({ id: e.id, h: e.h }); });
    if (L.phase === 'fund') { var T = taeter(); if (T && T.fund) liste.push({ id: 'fund', h: T.fund, fund: true }); }
    // der alte Pfahl mit dem Nest steht immer da, solange die Elster verdächtig ist
    if (!liste.some(function (e) { return e.h.ding === 'nest'; })) {
      var nest = null;
      F.leute.forEach(function (p) { [p.alibi, p.fund].forEach(function (h) { if (h && h.ding === 'nest') nest = h; }); });
      if (nest) liste.push({ id: 'kulisse', h: nest, kulisse: true });
    }
    liste.forEach(function (e) {
      var o = ort(e.h), g = baueDing(e.h.ding);
      g.position.set(o[0], 0, o[1]);
      var lupe = null;
      if (!e.kulisse) { lupe = BAU.schwebeText(e.fund ? '✨' : '🔎', 0.42, { schrift: 60, immerSichtbar: true }); lupe.position.y = e.h.ding === 'nest' ? 3.3 : 1.25; lupe.renderOrder = 6; g.add(lupe); }
      H.szene.add(g);
      dinge.push({ id: e.id, h: e.h, x: o[0], z: o[1], gruppe: g, lupe: lupe, fund: !!e.fund });
    });
  }

  // ---------- Ablauf ----------
  function darf() {
    if (!H || A.laeuft) return false;
    if (KALENDER.tag() < AB_TAG || KALENDER.tag() - A.zuletzt < PAUSE) return false;
    var st = STAND.daten.stunde;
    if (st < VON_UHR || st >= BIS_UHR || WETTER.regnet()) return false;
    if (typeof AUSREISSER !== 'undefined' && (AUSREISSER.laeuft() || KALENDER.tag() === AUSREISSER.stand().zuletzt)) return false;
    return !EREIGNISSE.laeuft();
  }
  // Los geht's. Ohne Angaben würfelt das Spiel Fall und Täter (zum Testen kann man beides nennen).
  function starte(fallId, taeterId) {
    if (!H || A.laeuft) return false;
    var wahl = FAELLE.filter(function (f) { return f.id !== A.letzter; });
    var F = fallId ? fall(fallId) : wahl[Math.floor(Math.random() * wahl.length)];
    if (!F) return false;
    var kann = F.leute.filter(function (p) { return p.spuren && p.fund; });
    var T = taeterId ? person(F, taeterId) : kann[Math.floor(Math.random() * kann.length)];
    if (!T || !T.spuren) return false;
    A.laeuft = { fall: F.id, taeter: T.id, tag: KALENDER.tag(), phase: 'start', hinweise: {}, falsch: [] };
    A.letzter = F.id;
    STAND.speichere();
    sorge();
    KERN.meldung('❗ Lotte ruft nach dir!', 'rot'); KERN.klang('knapp');
    return true;
  }
  // Ein Hinweis ist gefunden: ins Notizbuch damit
  function merke(id, still) {
    var L = A.laeuft; if (!L || L.hinweise[id]) return;
    L.hinweise[id] = true; STAND.speichere();
    if (!still) { KERN.meldung('📓 Neuer Hinweis im Notizbuch (' + gefunden().length + ' von ' + hinweise().length + ')', 'perfekt'); KERN.klang('gut'); }
  }
  function siehAn(e) {
    merke(e.id, true); KERN.klang('gut');
    if (e.lupe) e.lupe.visible = false;
    KERN.zeigeKarte('mitte', '<div class="klein">Hinweis ' + gefunden().length + ' von ' + hinweise().length + '</div><h2>🔎 ' + KERN.esc(gross(e.h.tipp)) + '</h2><div class="details">' + KERN.esc(e.h.text) + '</div>',
      [{ text: '✏️ Ins Notizbuch', aktion: function () { H.frei(); } }]);
  }

  // Das Notizbuch: was fehlt, wer verdächtig ist, was man schon weiß, wo man noch suchen kann
  function zeigeBuch() {
    var F = jetzt(), L = A.laeuft; if (!F) return;
    var html = '<div class="klein">Notizbuch</div><h2>📓 ' + KERN.esc(F.titel) + '</h2><div class="details"><b>Es fehlt:</b> ' + KERN.esc(F.was) + '<br><b>Verdächtig:</b> ';
    html += F.leute.map(function (p) { var durch = L.falsch.indexOf(p.id) >= 0; return p.bild + ' ' + (durch ? '<s>' : '') + KERN.esc(gross(p.name)) + (durch ? '</s>' : ''); }).join(' · ');
    html += '</div><div class="details" style="text-align:left">';
    var da = gefunden();
    if (!da.length) html += 'Noch keine Hinweise. Sieh dir zuerst die Stelle an, wo etwas fehlt.';
    da.forEach(function (e) {
      html += '<p>' + (e.h.wer ? '💬 <b>' + KERN.esc(nameVon(e.h.wer)) + ' sagt:</b> „' + KERN.esc(e.h.text) + '“' : '🔎 <b>' + KERN.esc(gross(e.h.tipp)) + ':</b> ' + KERN.esc(e.h.text)) + '</p>';
    });
    var rest = offen();
    if (rest.length && L.phase === 'suche') {
      html += '<p><small>🧭 Lottes Tipp, wo du noch suchen kannst: ' + rest.map(function (e) {
        if (!e.h.wer) return 'schau ' + KERN.esc(e.h.tipp);
        var w = PERSONEN.wo(e.h.wer);
        return 'frag ' + KERN.esc(nameVon(e.h.wer)) + (!w || !w.da ? ' (kommt morgens wieder)' : !w.frei ? ' (reitet gerade, warte bis zum Absteigen)' : '');
      }).join(', ') + '.</small></p>';
    }
    if (L.phase === 'suche') html += '<p><small>' + (da.length >= GENUG ? '💡 Du hast genug Hinweise. Sag Lotte, wen du verdächtigst.' : 'Ab ' + GENUG + ' Hinweisen kannst du Lotte deinen Verdacht sagen.') + '</small></p>';
    html += '</div>';
    KERN.zeigeKarte('mitte', html, [{ text: 'Zuklappen', aktion: function () { H.frei(); } }]);
  }

  // Lotte löst den Fall selbst, wenn man zu lange nicht sucht (ohne Lohn, ohne Schimpfen)
  function gibAuf() {
    var F = jetzt(), T = taeter();
    A.zuletzt = KALENDER.tag(); A.laeuft = null; STAND.speichere(); sorge();
    KERN.zeigeKarte('mitte', '<div class="klein">Fall gelöst</div><h2>📓 ' + KERN.esc(F.titel) + '</h2><div class="details">Lotte hat weitergesucht und es herausgefunden: Es war ' + KERN.esc(T.name) + '! ' + KERN.esc(T.fund.text) +
      '</div><div class="details"><small>Beim nächsten Rätsel hilfst du bestimmt wieder mit.</small></div>', [{ text: 'Ach so!', aktion: function () { H.frei(); } }]);
  }
  // Geschafft: das Ding ist wieder da
  function feiere() {
    var F = jetzt(), T = taeter(), L = A.laeuft, lohn = L.falsch.length ? LOHN_SPAETER : LOHN;
    A.mal++; A.zuletzt = KALENDER.tag(); A.laeuft = null;
    STAND.daten.merker = STAND.daten.merker || {}; STAND.daten.merker.detektiv = true;
    PERSONEN.freund('lotte', 3);
    var zeilen = '<div class="lohn">' + PERSONEN.herzText('lotte') + ' <small>(Lotte)</small></div>' + STAND.belohne(lohn, 'Fall gelöst');
    STAND.speichere();
    KERN.klang('jubel');
    KERN.zeigeKarte('mitte', '<div class="klein">Fall gelöst</div><h2>🕵️ Es war ' + KERN.esc(T.name) + '!</h2><div class="details">' + KERN.esc(T.fund.text) + '</div>' + zeilen,
      [{ text: 'Fall gelöst!', aktion: function () { H.frei(); sorge(); } }]);
  }

  // ---------- Der Hof fragt ----------
  function baueHof(ctx) { H = ctx; gebautFuer = ''; dinge = []; }
  function hofStart() { sorge(); }
  function hofSchritt(dt, zeit) {
    if (!H) return;
    if (!A.laeuft) {
      var st = Math.floor(KALENDER.wach() * 3);                // dreimal je Spielstunde nachsehen
      if (st === geprueft) return;
      geprueft = st;
      if (Math.random() < 0.5 && darf()) starte();
      return;
    }
    var L = A.laeuft, S = H.S;
    if (!jetzt() || !taeter()) { A.laeuft = null; sorge(); return; }       // den Fall gibt es nicht mehr (alter Spielstand)
    sorge();
    if (KALENDER.tag() >= L.tag + TAGE && !karteOffen() && !REDEN.offen()) return gibAuf();
    dinge.forEach(function (e) {
      if (!e.lupe) return;
      var weit = Math.hypot(S.x - e.x, S.z - e.z);
      e.lupe.visible = (e.fund || !L.hinweise[e.id]) && weit < SICHT;
      e.lupe.position.y = (e.h.ding === 'nest' ? 3.3 : 1.25) + Math.sin((zeit || 0) * 4 + e.x) * 0.08;
    });
  }
  function hinweis() {
    var F = jetzt(), L = A.laeuft; if (!F) return '';
    if (L.phase === 'start') return '❗ Lotte ruft nach dir. Geh zu ihr und sprich sie an (Knopf „💬 Mit Lotte reden“). Das ❗ zeigt dir, wo sie ist.';
    if (L.phase === 'fund') return '✨ Sieh nach, ob dein Verdacht stimmt: ' + taeter().fund.wo + '. Das ❗ zeigt dir die Stelle.';
    if (!L.hinweise.tatort) return '🔎 ' + F.titel + ': Sieh dir zuerst die Stelle an, wo etwas fehlt, ' + F.tatort.tipp + '. Das ❗ zeigt sie dir.';
    var n = gefunden().length, alle = hinweise().length;
    if (n >= alle) return '💡 Du hast alle ' + alle + ' Hinweise. Geh zu Lotte und sag ihr, wen du verdächtigst.';
    return '🔎 ' + n + ' von ' + alle + ' Hinweisen. Im 📓 Notizbuch (Knopf rechts unten) steht, wo du noch suchen kannst.' + (n >= GENUG ? ' Oder sag Lotte schon deinen Verdacht.' : '');
  }
  // Wohin das ❗ zeigt
  function marke() {
    var F = jetzt(), L = A.laeuft; if (!F) return null;
    var w;
    if (L.phase === 'fund') { var o = ort(taeter().fund); return { x: o[0], z: o[1], art: 'ort' }; }
    if (L.phase === 'suche' && !L.hinweise.tatort) return { x: F.tatort.x, z: F.tatort.z, art: 'ort' };
    if (L.phase === 'start' || gefunden().length >= hinweise().length) { w = PERSONEN.wo('lotte'); return w && w.da ? { x: w.x, z: w.z, art: 'person' } : null; }
    // sonst: die nächste Person, die etwas gesehen hat
    var best = null, S = H.S;
    offen().forEach(function (e) {
      if (!e.h.wer) return;
      var p = PERSONEN.wo(e.h.wer); if (!p || !p.da || !p.frei) return;
      var weit = Math.hypot(S.x - p.x, S.z - p.z);
      if (!best || weit < best.weit) best = { x: p.x, z: p.z, art: 'person', weit: weit };
    });
    return best;
  }
  // Knopf für die Stelle, an der man steht: { x, z, r, text, tun } oder null
  function aktion() {
    var L = A.laeuft; if (!L || !H) return null;
    var S = H.S, best = null;
    dinge.forEach(function (e) {
      if (!e.lupe || (!e.fund && L.hinweise[e.id])) return;
      var weit = Math.hypot(S.x - e.x, S.z - e.z);
      if (weit < NAH && (!best || weit < best.weit)) best = { e: e, weit: weit };
    });
    if (!best) return null;
    var e = best.e;
    return { x: e.x, z: e.z, r: NAH, text: e.fund ? '✨ Nachsehen' : '🔎 Genau ansehen', tun: function () { if (e.fund) feiere(); else siehAn(e); } };
  }
  // Der kleine Knopf rechts unten
  function zweit() { return A.laeuft && A.laeuft.phase !== 'start' ? [{ text: '📓 Notizbuch', tun: zeigeBuch }] : []; }

  // Hat der Fall gerade ein Gespräch für diese Person? (fragt REDEN, bevor es ein normales Gespräch aussucht)
  function redeFuer(wer) {
    var F = jetzt(), L = A.laeuft; if (!F) return null;
    wer = PERSONEN.kennung(wer);
    if (wer === 'lotte') {
      if (L.phase === 'start') return { id: 'dieb_' + F.id + '_ruf', text: F.ruf, antworten: [
        { text: 'Ich bin dabei! 🔎', herz: 1, dann: 'Super! Hier, mein Notizbuch. Sieh dir zuerst die Stelle an, ' + F.tatort.tipp + '. Und frag die anderen, was sie gesehen haben.', tun: function () { L.phase = 'suche'; STAND.speichere(); sorge(); } },
        { text: 'Gleich, ich muss noch etwas erledigen.', dann: 'In Ordnung. Aber komm bald, sonst wird die Spur kalt!' }] };
      if (L.phase === 'fund') return { id: 'dieb_' + F.id + '_los', text: 'Na los, sieh nach: ' + taeter().fund.wo + '. Ich bin gespannt!', antworten: [{ text: 'Bin schon unterwegs!' }] };
      if (gefunden().length < GENUG) return { id: 'dieb_' + F.id + '_wenig', text: 'Und, schon etwas herausgefunden? Für einen Verdacht brauchen wir mindestens ' + GENUG + ' Hinweise. Schau ins Notizbuch, da steht mein Tipp.', antworten: [{ text: 'Ich suche weiter!' }] };
      return { id: 'dieb_' + F.id + '_wer', text: 'Du hast ' + gefunden().length + ' Hinweise gesammelt. Dann sag mal: Wer hat ' + F.was.replace(/^der /, 'den ') + '?',
        antworten: F.leute.map(function (p) {
          if (p.id === L.taeter) return { text: p.bild + ' ' + gross(p.name), dann: 'Das passt zu allen Hinweisen! Komm, wir sehen nach: ' + p.fund.wo + '.', weiterText: 'Los!', tun: function () { L.phase = 'fund'; STAND.speichere(); sorge(); } };
          return { text: p.bild + ' ' + gross(p.name), dann: p.falsch + ' Such ruhig noch ein bisschen weiter.', weiterText: 'Stimmt!', tun: function () { if (L.falsch.indexOf(p.id) < 0) L.falsch.push(p.id); STAND.speichere(); } };
        }) };
    }
    if (L.phase !== 'suche') return null;
    var e = offen().filter(function (x) { return x.h.wer === wer; })[0];
    if (!e) return null;
    return { id: 'dieb_' + F.id + '_' + e.id, text: e.h.text, antworten: [{ text: '✏️ Danke, das schreibe ich auf!', tun: function () { merke(e.id); } }] };
  }

  return {
    FAELLE: FAELLE, baueHof: baueHof, hofStart: hofStart, hofSchritt: hofSchritt,
    hinweis: hinweis, marke: marke, aktion: aktion, zweit: zweit, redeFuer: redeFuer,
    starte: starte, zeigeBuch: zeigeBuch,
    laeuft: function () { return !!A.laeuft; },
    stand: function () { return A; },
    // zum Prüfen: alle Hinweise des laufenden Falls mit ihrer Stelle
    liste: function () { return hinweise().map(function (e) { var o = e.h.wer ? null : ort(e.h); return { id: e.id, wer: e.h.wer || null, x: o && o[0], z: o && o[1], da: !!A.laeuft.hinweise[e.id] }; }); },
    fundOrt: function () { var T = taeter(); return T ? ort(T.fund) : null; },
    // zum Prüfen: Liegt eine Stelle in einer Wand oder in einem Hindernis? Gibt die Liste der schlechten Stellen zurück.
    pruefe: function () {
      var schlecht = [];
      FAELLE.forEach(function (F) {
        var alle = [['tatort', F.tatort]];
        F.leute.forEach(function (p) { (p.spuren || []).forEach(function (h, i) { alle.push([p.id + '_spur' + i, h]); }); if (p.alibi && !p.alibi.wer) alle.push([p.id + '_alibi', p.alibi]); if (p.fund) alle.push([p.id + '_fund', p.fund]); });
        alle.forEach(function (e) {
          var o = ort(e[1]), was = '';
          H.waende.forEach(function (w) { if (o[0] > w[0] - 0.3 && o[0] < w[2] + 0.3 && o[1] > w[1] - 0.3 && o[1] < w[3] + 0.3) was = 'Wand'; });
          H.kreise.forEach(function (k) { if (Math.hypot(o[0] - k[0], o[1] - k[1]) < k[2] + 0.3) was = was || 'Hindernis'; });
          if (was) schlecht.push(F.id + ' ' + e[0] + ' [' + o + '] ' + was);
        });
      });
      return schlecht;
    }
  };
})();
