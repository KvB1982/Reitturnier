// ============================================================
//  REDEN  -  mit den Leuten auf dem Hof sprechen
//
//  Ein Gespräch ist kein Programm, sondern ein Eintrag in der Liste
//  GESPRAECHE: Was sagt die Person? Was kann man antworten? Was
//  passiert danach? So schreibt man ein neues Gespräch:
//
//    { id: 'emma_regen',                 // eigener Name, kommt nur einmal vor
//      wenn: { wetter: 'regen' },        // nur dann passt es (siehe passt() unten), ohne "wenn" passt es immer
//      text: 'So ein Regen!',            // das sagt die Person (höchstens drei Zeilen)
//      antworten: [
//        { text: 'Ich mag Regen.', herz: 1, dann: 'Du bist lustig!' },   // herz = Freundschaft, dann = Antwort der Person
//        { text: 'Tschüs!' } ] }
//
//  Mehr geht auch: einmal: true = kommt nur ein einziges Mal. folge: 'name' bei einer
//  Antwort = danach geht es mit dem Gespräch 'name' weiter. nurFolge: true = dieses
//  Gespräch kommt nie von allein, nur als Folge. merker: 'name' = das Spiel merkt sich etwas.
//
//  In den Texten wird ersetzt: {ich} = dein Name, {pferd} = das Pflegepferd
//  der Person, {meins} = dein Pferd, {fohlen} = das Fohlen.
//
//  Freundschaft zählt in Herzen (0 bis 5, js/personen.js). Punkte gibt
//  es je Person nur einmal am Tag, sonst könnte man sie sich erreden.
//
//  Vorlesen: Schalter 🔈 in der Sprechblase (gilt für das Gerät). Gibt es
//  zu einem Satz eine Aufnahme (Liste SPRACHE in sprache/sprache.js,
//  gebaut mit tools/sprache.mjs), wird sie abgespielt, sonst liest die
//  Stimme des Geräts vor.
// ============================================================
var REDEN = (function () {
  'use strict';
  var d = STAND.daten;

  // ---------- Zum Einstellen ----------
  var WEG_AB = 5.5;                       // geht man so weit weg (Meter), endet das Gespräch von selbst
  var HALTEN = 30;                        // so lange bleibt die Person höchstens stehen (Sekunden)

  // ---------- Die Gespräche ----------
  // '*' = passt zu jeder Person. Die eigenen Gespräche einer Person kommen zuerst dran.
  // 'gast' = passt zu jedem Ferienkind (js/ferienkinder.js).
  var GESPRAECHE = {
    emma: [
      { id: 'emma_sprung', wenn: { wetter: 'trocken' }, text: 'Heute übe ich mit {pferd} den Oxer. Der ist ganz schön breit!', antworten: [
        { text: 'Du schaffst das!', herz: 1, dann: 'Danke, {ich}! Ich drück dir auch die Daumen.' },
        { text: 'Was ist ein Oxer?', herz: 1, dann: 'Ein Hindernis mit zwei Stangen hintereinander. Man muss weit springen.' },
        { text: 'Tschüs!' }] },
      { id: 'emma_turnier', wenn: { herzen: 1 }, text: 'Weißt du was? Vor einem Turnier bin ich immer ganz zappelig.', antworten: [
        { text: 'Ich auch!', herz: 1, dann: 'Echt? Dann sind wir schon zwei.' },
        { text: 'Tief atmen hilft.', herz: 1, dann: 'Das probiere ich. Ein … aus … Ja, besser!' }] },
      { id: 'emma_geheim', wenn: { herzen: 3 }, einmal: true, text: 'Ich verrate dir was: Hinter der Mühle am Bach wachsen die besten Äpfel für Pferde.', antworten: [
        { text: 'Das merke ich mir!', herz: 1, merker: 'geheimnis_aepfel', dann: 'Aber nicht weitersagen, ja?' }] },
      { id: 'emma_koppel', wenn: { wetter: 'trocken' }, text: 'Warst du schon auf der großen Koppel? Da kann man ohne Sattel galoppieren!', antworten: [
        { text: 'Ohne Sattel? Echt?', herz: 1, dann: 'Ja! Stell dich neben ein Pferd und steig einfach auf. Halt dich gut an der Mähne fest.' },
        { text: 'Bin ich schon!', herz: 1, dann: 'Und? Bist du über den Baumstamm gesprungen? Das kribbelt so schön im Bauch.' },
        { text: 'Tschüs!' }] },
      { id: 'emma_stange', text: 'Gestern habe ich eine Stange gerissen. Es hat richtig laut gescheppert!', antworten: [
        { text: 'Das passiert jedem mal.', herz: 1, dann: 'Sagt meine Reitlehrerin auch. Einfach weiterreiten und zum nächsten Sprung schauen.' },
        { text: 'Hast du dich erschrocken?', herz: 1, dann: 'Ein bisschen. Aber mein Pferd ist ganz ruhig geblieben.' }] },
      { id: 'emma_traum', wenn: { herzen: 2 }, text: 'Wenn ich groß bin, reite ich bei einem ganz großen Turnier mit. Mit Fernsehen und allem!', antworten: [
        { text: 'Dann schaue ich zu!', herz: 1, dann: 'Abgemacht! Du bekommst den besten Platz ganz vorne.' },
        { text: 'Und was, wenn du aufgeregt bist?', dann: 'Dann denke ich an den Hof. Hier bin ich nie aufgeregt.', weiterText: 'Das ist schön.', folge: 'emma_traum2' }] },
      { id: 'emma_traum2', nurFolge: true, text: 'Und du? Was willst du mal werden?', antworten: [
        { text: 'Reiterin, so wie du!', herz: 1, dann: 'Dann reiten wir zusammen. Das wird toll!' },
        { text: 'Tierärztin für Pferde.', herz: 1, dann: 'Oh ja! Dann kommst du zu meinem Pferd, wenn es Bauchweh hat.' },
        { text: 'Das weiß ich noch nicht.', dann: 'Macht nichts. Du hast ja noch viel Zeit.' }] }
    ],
    jonas: [
      { id: 'jonas_wald', text: 'Im Wald habe ich gestern ein Reh gesehen. Ganz nah!', antworten: [
        { text: 'Wo denn genau?', herz: 1, dann: 'Am Bergweg, gleich hinter der großen Lichtung. Du musst leise sein.' },
        { text: 'Ich habe einen Fuchs gesehen!', herz: 1, dann: 'Stark! Trag ihn gleich in dein Tierbuch ein.' },
        { text: 'Tschüs!' }] },
      { id: 'jonas_weg', wenn: { herzen: 2 }, text: 'Soll ich dir meinen Lieblingsweg verraten? Durch den Bach und dann links den Hügel hoch.', antworten: [
        { text: 'Den reite ich mal!', herz: 1, dann: 'Oben sieht man den ganzen Hof. Lohnt sich!' },
        { text: 'Ist der Bach nicht tief?', dann: 'Nein, nur bis zu den Fesseln. {pferd} planscht da gern.' }] },
      { id: 'jonas_spuren', text: 'Ich kann Spuren lesen. Ein Reh hat zwei spitze Zehen, ein Pferd einen runden Huf.', antworten: [
        { text: 'Und ein Fuchs?', herz: 1, dann: 'Der hat kleine Pfoten wie ein Hund. Und er läuft schnurgerade, wie auf einer Linie.' },
        { text: 'Zeigst du mir mal welche?', herz: 1, dann: 'Klar! Nach dem Regen sieht man sie am besten, im weichen Boden.' },
        { text: 'Tschüs!' }] },
      { id: 'jonas_bach', wenn: { wetter: 'trocken' }, text: 'Auf der Koppel fließt ein kleiner Bach. Im Galopp spritzt das Wasser bis zu den Ohren!', antworten: [
        { text: 'Das probiere ich aus!', herz: 1, dann: 'Mach das! Aber danach musst du die Beine von deinem Pferd abtrocknen.' },
        { text: 'Wird das Pferd da nicht nass?', dann: 'Doch, klar. Aber Pferde mögen das. Die meisten jedenfalls.' }] },
      { id: 'jonas_nacht', wenn: { herzen: 3 }, einmal: true, text: 'Nachts ist der Wald ganz anders. Dann rufen die Eulen, und alles raschelt.', antworten: [
        { text: 'Warst du schon mal nachts dort?', herz: 1, merker: 'jonas_nacht', dann: 'Einmal, mit meinem Papa und einer Taschenlampe. Das war das Beste überhaupt!' },
        { text: 'Das klingt gruselig.', dann: 'Nur am Anfang. Dann merkt man, dass es bloß die Tiere sind.' }] }
    ],
    hanna: [
      { id: 'hanna_dressur', text: 'Ich übe gerade Zirkel reiten. Der soll ganz rund werden, wie ein Teller.', antworten: [
        { text: 'Klingt schwer.', herz: 1, dann: 'Man muss nur immer zum nächsten Punkt schauen. Dann wird es rund.' },
        { text: 'Zeigst du es mir mal?', herz: 1, dann: 'Gern! Komm einfach zum Platz, wenn ich reite.' },
        { text: 'Tschüs!' }] },
      { id: 'hanna_ruhe', wenn: { herzen: 2 }, text: '{pferd} merkt sofort, wenn ich hibbelig bin. Pferde sind wie ein Spiegel.', antworten: [
        { text: 'Das kenne ich von {meins}.', herz: 1, dann: 'Siehst du! Dann seid ihr ein gutes Team.' },
        { text: 'Wie ein Spiegel?', dann: 'Bin ich ruhig, ist {pferd} ruhig. Bin ich wild, wird {pferd} wild.' }] },
      { id: 'hanna_buchstaben', text: 'Kennst du die Buchstaben am Dressurplatz? A, K, E, H, C, M, B, F. Ich kann sie im Schlaf.', antworten: [
        { text: 'Wie merkst du dir die?', herz: 1, dann: 'Mit einem Satz: Alte Kühe essen Heu, Clowns mögen bunte Federn. Lustig, oder?' },
        { text: 'Wozu sind die gut?', herz: 1, dann: 'Sie sagen dir, wo du abbiegen oder antraben sollst. Wie Schilder an der Straße.' },
        { text: 'Tschüs!' }] },
      { id: 'hanna_putzen', wenn: { abStunde: 7, bisStunde: 11 }, text: 'Morgens putze ich am liebsten. Da ist es noch ganz still im Stall.', antworten: [
        { text: 'Ich mag die Ruhe auch.', herz: 1, dann: 'Dann hören wir zusammen zu, wie die Pferde ihr Heu kauen.' },
        { text: 'Ich bin morgens noch müde.', dann: 'Das Putzen macht wach. Versprochen!' }] },
      { id: 'hanna_fehler', wenn: { herzen: 2 }, text: 'Früher habe ich geweint, wenn eine Lektion nicht geklappt hat. Jetzt übe ich sie einfach noch einmal.', antworten: [
        { text: 'Das ist viel klüger.', herz: 1, dann: 'Finde ich auch. Und mein Pferd ist nie böse mit mir.' },
        { text: 'Mir geht es manchmal auch so.', herz: 1, dann: 'Dann denk daran: Jeder Reiter hat mal klein angefangen.' }] }
    ],
    ben: [
      { id: 'ben_moehre', text: 'Pssst. Ich habe drei Möhren in der Tasche. Eine ist für {pferd}.', antworten: [
        { text: 'Und die anderen zwei?', herz: 1, dann: 'Eine für mich. Und eine für den, der fragt. Hier!' , muenzen: 1 },
        { text: 'Nicht zu viele Leckerli!', dann: 'Ja, ja. Das sagt meine Reitlehrerin auch immer.' },
        { text: 'Tschüs!' }] },
      { id: 'ben_hunger', wenn: { abStunde: 11, bisStunde: 14 }, text: 'Ist bald Mittag? Mein Bauch knurrt lauter als {pferd}.', antworten: [
        { text: 'Meiner auch!', herz: 1, dann: 'Dann essen wir gleich zusammen ein Brot auf der Bank.' },
        { text: 'Erst die Pferde, dann wir.', herz: 1, dann: 'Stimmt. Erst füttern, dann futtern!' }] },
      { id: 'ben_heu', text: 'Rate mal, wie viel Heu ein Pferd am Tag frisst!', antworten: [
        { text: 'Einen Eimer voll?', dann: 'Viel mehr! Ungefähr so viel, wie in eine ganze Schubkarre passt.' },
        { text: 'Eine Schubkarre voll?', herz: 1, dann: 'Genau! Woher weißt du das? Du bist ja ein Profi.' },
        { text: 'Tschüs!' }] },
      { id: 'ben_apfel', wenn: { jahreszeit: 'Herbst' }, text: 'Im Herbst fallen die Äpfel von den Bäumen. Das ist die beste Zeit im Jahr!', antworten: [
        { text: 'Für dich oder für die Pferde?', herz: 1, dann: 'Für uns alle! Ich teile gerecht. Meistens.' },
        { text: 'Aber nicht zu viele füttern!', dann: 'Nein, nein. Zwei am Tag, mehr nicht. Ehrenwort.' }] },
      { id: 'ben_witz', wenn: { herzen: 2 }, text: 'Kennst du den? Was ist klein, braun und galoppiert über die Wiese? Ein Pony-Keks!', antworten: [
        { text: 'Haha, der ist gut!', herz: 1, dann: 'Ich habe noch mehr. Aber die erzähle ich dir morgen.' },
        { text: 'Oh nein, Ben!', herz: 1, dann: 'Na gut, der war nicht so toll. Aber du hast gelacht!' }] }
    ],
    lina: [
      { id: 'lina_turnen', text: 'Guck mal, ich kann auf einem Bein stehen. Auf dem Pferd ist das viel schwerer!', antworten: [
        { text: 'Wow! Wie lange übst du schon?', herz: 1, dann: 'Seit zwei Jahren. Am Anfang bin ich immer runtergerutscht.' },
        { text: 'Hast du keine Angst?', herz: 1, dann: 'Nur ein bisschen. Das Pferd geht ja ganz ruhig im Kreis.' },
        { text: 'Tschüs!' }] },
      { id: 'lina_tipp', wenn: { herzen: 2 }, text: 'Mein Tipp fürs Voltigieren: Immer im Takt vom Pferd bleiben. Wie beim Tanzen!', antworten: [
        { text: 'Danke, das probiere ich!', herz: 1, dann: 'Sag mir, ob es geklappt hat!' }] },
      { id: 'lina_fahne', text: 'Die Fahne ist meine Lieblingsübung. Ein Arm nach vorn, ein Bein nach hinten, und dann ganz lang machen!', antworten: [
        { text: 'Wackelt das nicht?', herz: 1, dann: 'Doch, am Anfang sehr. Man muss den Bauch fest anspannen.' },
        { text: 'Das will ich auch können.', herz: 1, dann: 'Üb erst auf dem Boden. Dann auf dem Holzpferd. Dann klappt es auch oben.' },
        { text: 'Tschüs!' }] },
      { id: 'lina_musik', wenn: { herzen: 1 }, text: 'Beim Voltigieren läuft Musik. Welche würdest du nehmen?', antworten: [
        { text: 'Etwas Schnelles!', herz: 1, dann: 'Hui, dann muss das Pferd aber flott galoppieren!' },
        { text: 'Etwas Ruhiges.', herz: 1, dann: 'Schön. Dann sehen die Übungen aus wie ein Tanz.' }] },
      { id: 'lina_gruppe', wenn: { herzen: 3 }, einmal: true, text: 'Wir suchen noch jemanden für unsere Voltigiergruppe. Hättest du Lust?', antworten: [
        { text: 'Ja, unbedingt!', herz: 1, merker: 'lina_gruppe', dann: 'Super! Komm zur Voltigierhalle und zeig, was du kannst.' },
        { text: 'Ich überlege es mir.', dann: 'Kein Problem. Der Platz bleibt für dich frei.' }] }
    ],
    paul: [
      { id: 'paul_hufe', text: 'Wusstest du, dass ein Huf wächst wie ein Fingernagel? Darum kommt der Schmied.', antworten: [
        { text: 'Tut das dem Pferd weh?', herz: 1, dann: 'Nein, gar nicht. Wie Nägel schneiden. Nur lauter.' },
        { text: 'Das wusste ich nicht!', herz: 1, dann: 'Ich weiß noch mehr. Frag mich ruhig öfter!' },
        { text: 'Tschüs!' }] },
      { id: 'paul_eisen', wenn: { herzen: 2 }, text: 'Ein Hufeisen über der Tür bringt Glück. Aber nur, wenn die Öffnung nach oben zeigt!', antworten: [
        { text: 'Warum nach oben?', herz: 1, dann: 'Sonst fällt das Glück heraus. Sagt mein Opa.' }] },
      { id: 'paul_zaehne', text: 'Am Gebiss kann man sehen, wie alt ein Pferd ist. Die Zähne werden immer länger und schräger.', antworten: [
        { text: 'Putzen Pferde ihre Zähne?', herz: 1, dann: 'Nein. Aber einmal im Jahr kommt der Pferdezahnarzt und feilt sie glatt.' },
        { text: 'Du weißt aber viel!', herz: 1, dann: 'Ich lese jeden Abend in meinem Pferdebuch. Es hat dreihundert Seiten.' },
        { text: 'Tschüs!' }] },
      { id: 'paul_schlaf', text: 'Wusstest du, dass Pferde im Stehen schlafen können? Sie stellen ihre Knie einfach fest.', antworten: [
        { text: 'Legen sie sich nie hin?', herz: 1, dann: 'Doch, zum Träumen. Aber nur, wenn sie sich ganz sicher fühlen.' },
        { text: 'Das würde ich auch gern können.', herz: 1, dann: 'Ich auch! Dann könnte ich in der Schule schlafen.' }] },
      { id: 'paul_traktor', wenn: { herzen: 2 }, text: 'Der Traktor hinter dem Hofplatz hat vier Zylinder. Ich durfte schon mal auf dem Sitz sitzen!', antworten: [
        { text: 'Bist du auch gefahren?', herz: 1, dann: 'Nein, dafür bin ich noch zu klein. Aber ich weiß schon, wo die Bremse ist.' },
        { text: 'Pferde oder Traktoren?', dann: 'Pferde. Aber ganz knapp!' }] }
    ],
    lotte: [
      { id: 'lotte_fohlen', wenn: { fohlen: true }, text: '{fohlen} wächst so schnell! Hast du heute schon nach ihm geschaut?', antworten: [
        { text: 'Ja, gerade eben!', herz: 1, dann: 'Super. Es freut sich immer, wenn du kommst.' },
        { text: 'Mache ich gleich.', dann: 'Es steht meistens auf der Weide hinter dem Stall.' }] },
      { id: 'lotte_hof', text: 'Ich wohne hier auf dem Hof. Morgens wecken mich die Pferde mit ihrem Wiehern.', antworten: [
        { text: 'Das ist bestimmt schön!', herz: 1, dann: 'Ja. Nur am Sonntag könnten sie länger schlafen.' },
        { text: 'Tschüs!' }] },
      { id: 'lotte_flasche', wenn: { fohlen: true }, text: 'Beim Fläschchen musst du die Flasche schön schräg halten. Dann schluckt das Fohlen keine Luft.', antworten: [
        { text: 'Danke für den Tipp!', herz: 1, dann: 'Gern. Und danach kraulst du es am Hals, das mag es am liebsten.' },
        { text: 'Trinkt es immer alles aus?', dann: 'Meistens. Wenn nicht, ist es einfach satt. Das ist nicht schlimm.' }] },
      { id: 'lotte_abend', wenn: { abStunde: 17 }, text: 'Abends gehe ich noch einmal durch den Stall und sage allen Pferden gute Nacht.', antworten: [
        { text: 'Darf ich mal mitkommen?', herz: 1, dann: 'Na klar. Aber leise, die ersten dösen dann schon.' },
        { text: 'Antworten sie dir?', herz: 1, dann: 'Manche schnauben. Ich glaube, das heißt gute Nacht.' }] },
      { id: 'lotte_herde', wenn: { wetter: 'trocken' }, text: 'Hast du gesehen? Wenn einer auf der Koppel losgaloppiert, rennen alle anderen mit.', antworten: [
        { text: 'Warum machen sie das?', herz: 1, dann: 'Pferde sind Herdentiere. Zusammen fühlen sie sich sicher. Und es macht ihnen Spaß!' },
        { text: 'Sogar das Fohlen!', herz: 1, dann: 'Ja! Es ist noch wackelig, aber es will immer vorne dabei sein.' }] },
      { id: 'lotte_ferien', wenn: { herzen: 2 }, text: 'Bald kommen wieder Ferienkinder auf den Hof. Dann ist hier richtig was los!', antworten: [
        { text: 'Ich freue mich schon!', herz: 1, dann: 'Ich mich auch. Vielleicht findest du ja neue Freunde.' },
        { text: 'Wo schlafen die denn?', dann: 'Im Heuhotel über dem Stall. Das ist das Gemütlichste, was es gibt.' }] }
    ],
    mia: [
      { id: 'mia_rad', text: 'Ich komme jeden Tag mit dem Rad. Bergauf ist es anstrengend, aber heim geht es von allein!', antworten: [
        { text: 'Wie weit ist es denn?', herz: 1, dann: 'Drei Kilometer. Dafür bin ich abends richtig müde.' },
        { text: 'Tschüs!' }] },
      { id: 'mia_ausritt', text: 'Am liebsten reite ich aus. Einfach los, ohne Plan, und schauen, wohin der Weg führt.', antworten: [
        { text: 'Verirrst du dich nie?', herz: 1, dann: 'Einmal fast. Aber Pferde finden immer nach Hause. Die riechen ihren Stall!' },
        { text: 'Das mache ich auch gern.', herz: 1, dann: 'Dann treffen wir uns bestimmt mal an der Mühle.' },
        { text: 'Tschüs!' }] },
      { id: 'mia_picknick', wenn: { herzen: 2, wetter: 'trocken' }, text: 'Am See gibt es eine Stelle, die ist wie gemacht für ein Picknick. Mit Blick aufs Wasser!', antworten: [
        { text: 'Was packst du ein?', herz: 1, dann: 'Brote für mich und Möhren für mein Pferd. Jeder bekommt, was er mag.' },
        { text: 'Die suche ich mal.', herz: 1, dann: 'Reite einfach am Ufer entlang. Du erkennst sie an der großen Weide.' }] }
    ],
    // ---------- Die Ferienkinder ----------
    gast: [
      { id: 'gast_ankunft', wenn: { gastTag: 1, wieder: false }, text: 'Hallo! Wir sind gerade mit dem Bus gekommen. Wohnst du hier auf dem Hof?', antworten: [
        { text: 'Ja! Herzlich willkommen!', herz: 1, dann: 'Danke! Ich bin schon ganz aufgeregt. So viele Pferde!' },
        { text: 'Soll ich dir etwas zeigen?', herz: 1, dann: 'Oh ja! Wo sind denn die Pferde, wenn sie nicht im Stall stehen?', weiterText: 'Auf der Koppel hinter dem Stall.', folge: 'gast_ankunft2' },
        { text: 'Tschüs!' }] },
      { id: 'gast_ankunft2', nurFolge: true, text: 'Hinter dem Stall? Da gehe ich nachher gleich hin. Danke, {ich}!', antworten: [
        { text: 'Gern! Viel Spaß bei uns.', herz: 1 }] },
      { id: 'gast_wieder', wenn: { gastTag: 1, wieder: true }, text: '{ich}! Ich bin wieder da! Ich habe mich die ganze Busfahrt auf den Hof gefreut.', antworten: [
        { text: 'Schön, dass du wieder da bist!', herz: 1, dann: 'Ich habe allen zu Hause von dir und den Pferden erzählt.' },
        { text: 'Hier hat sich viel getan!', herz: 1, dann: 'Echt? Dann musst du mir alles erzählen!' }] },
      { id: 'gast_abschied', wenn: { gastTag: 3, abStunde: 12 }, text: 'Heute Nachmittag holt uns der Bus ab. Ich will noch gar nicht weg!', antworten: [
        { text: 'Du kommst doch bald wieder, oder?', herz: 1, dann: 'Ganz bestimmt! In den nächsten Ferien bin ich wieder da.' },
        { text: 'Ich werde dich vermissen.', herz: 1, dann: 'Ich dich auch, {ich}. Pass gut auf die Pferde auf!' },
        { text: 'Gute Heimreise!', dann: 'Danke! Ich winke dir aus dem Bus.' }] },
      { id: 'gast_fohlen', wenn: { fohlen: true, wetter: 'trocken' }, text: 'Ich habe vorhin {fohlen} gesehen. Die Beine sind ja länger als der ganze Bauch!', antworten: [
        { text: 'Damit kann es schon richtig rennen.', herz: 1, dann: 'Das habe ich gesehen! Es ist über die halbe Koppel gesaust.' },
        { text: 'Abends kommt es in seine Box.', herz: 1, dann: 'Darf ich dann zuschauen? Ich bin auch ganz leise.' }] },
      { id: 'gast_frage_huf', text: 'Darf ich dich etwas fragen? Tut es den Pferden weh, wenn man ihnen die Hufe auskratzt?', antworten: [
        { text: 'Nein, das ist wie Fingernägel putzen.', herz: 1, dann: 'Ach so! Dann traue ich mich morgen vielleicht auch mal.' },
        { text: 'Nein. Aber man muss vorsichtig sein.', herz: 1, dann: 'Das merke ich mir. Immer schön langsam.' }] },
      { id: 'gast_frage_schlaf', wenn: { herzen: 1 }, text: 'Stimmt es, dass Pferde im Stehen schlafen?', antworten: [
        { text: 'Ja, sie dösen im Stehen.', herz: 1, dann: 'Und sie fallen nicht um? Das möchte ich auch können!' },
        { text: 'Ja. Für den tiefen Schlaf legen sie sich aber hin.', herz: 1, dann: 'Das wusste ich nicht. Du weißt aber viel über Pferde!' }] },
      { id: 'gast_regen', wenn: { wetter: 'regen' }, text: 'Bei uns zu Hause bleibe ich bei Regen drinnen. Hier ist es sogar im Stall schön.', antworten: [
        { text: 'Hör mal, wie die Pferde kauen.', herz: 1, dann: 'Stimmt! Das klingt richtig gemütlich.' },
        { text: 'Gleich scheint wieder die Sonne.', dann: 'Hoffentlich! Ich will noch zur Koppel.' }] },
      { id: 'gast_abend', wenn: { abStunde: 17 }, text: 'Heute Abend dürfen wir im Wohnhaus noch eine Geschichte hören. Dann schlafe ich bestimmt sofort ein.', antworten: [
        { text: 'Was war heute am schönsten?', herz: 1, dann: 'Alles! Aber am allerschönsten waren die weichen Pferdenasen.' },
        { text: 'Schlaf gut!', herz: 1, dann: 'Du auch, {ich}. Bis morgen!' }] },
      { id: 'gast_meins', wenn: { herzen: 1 }, text: 'Ist {meins} wirklich dein eigenes Pferd? Du hast es gut!', antworten: [
        { text: 'Ja. Ich kümmere mich jeden Tag darum.', herz: 1, dann: 'Jeden Tag? Auch wenn es regnet? Das ist ganz schön viel Arbeit.' },
        { text: 'Willst du es mal streicheln?', herz: 1, dann: 'Darf ich? Ich bin auch ganz vorsichtig!' }] },
      { id: 'gast_hallo', text: 'Hallo {ich}! Hier gibt es so viel zu sehen.', antworten: [
        { text: 'Was gefällt dir am besten?', herz: 1, dann: 'Dass man die Pferde überall hört. Sogar nachts im Bett!' },
        { text: 'Tschüs!' }] }
    ],
    frieda: [
      { id: 'frieda_stadt', text: 'In der Stadt sehe ich nie Pferde. Ich habe noch nie eins gestreichelt!', antworten: [
        { text: 'Dann wird es Zeit!', herz: 1, dann: 'Meinst du? Vielleicht fange ich mit einem ganz kleinen an.' },
        { text: 'Halte ihm die flache Hand hin.', herz: 1, dann: 'Die flache Hand. Gut. Und dann schnuppert es daran?' }] },
      { id: 'frieda_mut', wenn: { herzen: 2 }, text: 'Weißt du was? Ich habe heute ein Pferd an der Nase gestreichelt. Sie ist ganz weich!', antworten: [
        { text: 'Das war mutig von dir!', herz: 1, dann: 'Mein Herz hat ganz laut geklopft. Aber jetzt will ich es wieder tun.' },
        { text: 'Wie Samt, oder?', herz: 1, dann: 'Genau! Wie das Samtkissen von meiner Oma.' }] }
    ],
    tom: [
      { id: 'tom_traktor', text: 'Habt ihr den Traktor gesehen? Der ist riesig! Darf man damit fahren?', antworten: [
        { text: 'Nur die Großen.', dann: 'Schade. Dann schaue ich ihn mir wenigstens ganz genau an.' },
        { text: 'Der bringt das Heu vom Feld.', herz: 1, dann: 'Für die Pferde? Dann ist er ja der wichtigste Mitarbeiter auf dem Hof!' }] },
      { id: 'tom_meer', wenn: { herzen: 1 }, text: 'Ich wohne am Meer. Da reiten manchmal Leute am Strand entlang, bis ins Wasser.', antworten: [
        { text: 'Das möchte ich auch mal!', herz: 1, dann: 'Dann besuchst du mich. Ich zeige dir die beste Stelle.' },
        { text: 'Mögen Pferde Wellen?', herz: 1, dann: 'Manche schon. Die planschen wie kleine Kinder.' }] }
    ],
    nele: [
      { id: 'nele_malen', text: 'Ich male gerade alle Pferde vom Hof in meinen Block. Pferdebeine sind so schwer zu malen!', antworten: [
        { text: 'Zeigst du mir ein Bild?', herz: 1, dann: 'Erst wenn es fertig ist. Dann bekommst du das schönste.' },
        { text: 'Welches Pferd malst du zuerst?', herz: 1, dann: 'Das mit der weißen Blesse. Die sieht aus wie ein Blitz.' }] },
      { id: 'nele_berge', wenn: { herzen: 1 }, text: 'Bei uns in den Bergen tragen die Pferde im Sommer Glocken, damit man sie auf der Alm wiederfindet.', antworten: [
        { text: 'Das klingt bestimmt schön.', herz: 1, dann: 'Ja! Abends hört man sie über das ganze Tal.' },
        { text: 'Laufen sie dort einfach frei herum?', herz: 1, dann: 'Den ganzen Sommer lang. Im Herbst holen wir sie wieder ins Tal.' }] }
    ],
    carla: [
      { id: 'carla_fragen', text: 'Ich habe ein Heft mit hundert Fragen über Pferde mitgebracht. Frage eins: Wie viel frisst ein Pferd am Tag?', antworten: [
        { text: 'Viel Heu, einen ganzen Arm voll und mehr.', herz: 1, dann: 'Das schreibe ich auf. Und dazu Hafer und Möhren, oder?' },
        { text: 'Es frisst fast den ganzen Tag.', herz: 1, dann: 'Den ganzen Tag essen! Das würde mir auch gefallen.' }] },
      { id: 'carla_wasser', wenn: { herzen: 1 }, text: 'Frage siebzehn: Wie viel trinkt ein Pferd? Ich habe am Trog zugeschaut und nicht mehr mitzählen können.', antworten: [
        { text: 'Mehrere Eimer am Tag.', herz: 1, dann: 'Mehrere Eimer! Kein Wunder, dass der Trog so groß ist.' },
        { text: 'Im Sommer noch viel mehr.', herz: 1, dann: 'Logisch. Wenn es heiß ist, habe ich auch mehr Durst.' }] }
    ],
    oskar: [
      { id: 'oskar_gross', text: 'Die Pferde sind so groß. Ich bleibe lieber ein Stück weg. Bist du gar nicht ängstlich?', antworten: [
        { text: 'Am Anfang war ich es auch.', herz: 1, dann: 'Wirklich? Und jetzt reitest du sogar. Dann schaffe ich das vielleicht auch.' },
        { text: 'Sie sind groß, aber ganz sanft.', herz: 1, dann: 'Sanft … Das eine hat mich vorhin so lieb angeschaut.' }] },
      { id: 'oskar_huhn', text: 'Die Hühner mag ich am liebsten. Die sind genau richtig groß für mich.', antworten: [
        { text: 'Die legen jeden Tag Eier.', herz: 1, dann: 'Jeden Tag eins? Dann suche ich morgen früh gleich danach.' },
        { text: 'Und der Hofhund?', herz: 1, dann: 'Der ist auch nett. Er hat mir die Hand abgeschleckt.' }] }
    ],
    jule: [
      { id: 'jule_island', text: 'Zu Hause reite ich ein Islandpferd. Das kann den Tölt. Da sitzt man ganz ruhig, obwohl es schnell geht.', antworten: [
        { text: 'Was ist der Tölt?', herz: 1, dann: 'Eine Gangart extra. Die Füße machen tack-tack-tack-tack, ganz gleichmäßig.' },
        { text: 'Sind Islandpferde klein?', herz: 1, dann: 'Klein, aber ganz stark. Und im Winter haben sie ein Fell wie ein Teddy.' }] },
      { id: 'jule_strand', wenn: { herzen: 1 }, text: 'Auf unserer Insel reiten wir bei Ebbe über den Strand. Dann spritzt das Wasser bis zu den Ohren.', antworten: [
        { text: 'Hier kannst du durch den Bach reiten.', herz: 1, dann: 'Gibt es hier einen Bach? Den muss ich mir ansehen!' },
        { text: 'Das klingt wunderbar.', herz: 1, dann: 'Ist es auch. Aber euer Hof gefällt mir fast genauso gut.' }] }
    ],
    '*': [
      { id: 'alle_regen', wenn: { wetter: 'regen' }, text: 'So ein Wetter! Die Pferde stehen lieber trocken. Ich auch.', antworten: [
        { text: 'Ich mag Regen.', herz: 1, dann: 'Dann bist du mutiger als ich!' },
        { text: 'Hoffentlich hört es bald auf.', herz: 1, dann: 'Bestimmt. Danach riecht der Hof immer so gut.' }] },
      { id: 'alle_abend', wenn: { abStunde: 18 }, text: 'Bald ist Feierabend. War das ein schöner Tag auf dem Hof?', antworten: [
        { text: 'Ja, richtig schön!', herz: 1, dann: 'Finde ich auch. Bis morgen, {ich}!' },
        { text: 'Ich bin ganz schön müde.', herz: 1, dann: 'Dann schlaf gut. Die Pferde auch.' }] },
      { id: 'alle_wochenende', wenn: { wochenende: true }, text: 'Endlich Wochenende! Da ist auf dem Hof am meisten los.', antworten: [
        { text: 'Was machst du heute?', herz: 1, dann: 'Erst reiten, dann helfe ich beim Füttern.' },
        { text: 'Tschüs!' }] },
      { id: 'alle_meins', text: 'Wie geht es {meins}? Ihr zwei seid oft zusammen unterwegs.', antworten: [
        { text: 'Gut! Wir üben fleißig.', herz: 1, dann: 'Das sieht man. {meins} schaut dir schon hinterher.' },
        { text: 'Und wie geht es {pferd}?', herz: 1, dann: 'Prima! Danke, dass du fragst.' },
        { text: 'Tschüs!' }] },
      { id: 'alle_morgen', wenn: { bisStunde: 9, wetter: 'trocken' }, text: 'Guten Morgen! So früh riecht der Hof nach frischem Heu.', antworten: [
        { text: 'Guten Morgen! Gut geschlafen?', herz: 1, dann: 'Wie ein Murmeltier. Und jetzt freue ich mich auf die Pferde.' },
        { text: 'Ich bin noch müde.', dann: 'Das vergeht gleich. Spätestens beim Ausmisten!' }] },
      { id: 'alle_gewitter', wenn: { wetter: 'gewitter' }, text: 'Hast du den Donner gehört? Gut, dass die Pferde im Stall sind.', antworten: [
        { text: 'Haben sie Angst?', herz: 1, dann: 'Ein bisschen. Darum bleiben wir bei ihnen und reden ruhig mit ihnen.' },
        { text: 'Ich mag Gewitter nicht.', herz: 1, dann: 'Hier drin kann uns nichts passieren. Es zieht bald vorbei.' }] },
      { id: 'alle_koppel', wenn: { wetter: 'trocken', abStunde: 10, bisStunde: 17 }, text: 'Die Pferde stehen heute auf der großen Koppel. Da haben sie richtig viel Platz zum Toben.', antworten: [
        { text: 'Da gehe ich gleich hin!', herz: 1, dann: 'Folge einfach dem Wegweiser neben dem Stall.' },
        { text: 'Tschüs!' }] },
      { id: 'alle_hallo', text: 'Hallo {ich}! Schön, dass du da bist.', antworten: [
        { text: 'Hallo! Was machst du gerade?', herz: 1, dann: 'Ich kümmere mich um {pferd}. Es gibt immer etwas zu tun.' },
        { text: 'Tschüs!' }] }
    ]
  };

  // ---------- Passt eine Bedingung gerade? ----------
  // wenn = { wetter: 'regen' | 'trocken' | 'gewitter', abStunde, bisStunde, abTag, wochentag: 'Samstag', wochenende: true,
  //          jahreszeit: 'Sommer', herzen: 2 (so viele Herzen bei dieser Person), merker: 'name', ohneMerker: 'name', fohlen: true,
  //          gastTag: 1 (Ferienkinder: 1 = Ankunft, 3 = Abreise), gast: 'tom' (ist gerade zu Besuch), wieder: true (kennt man von früher) }
  function passt(wenn, wer) {
    if (!wenn) return true;
    var st = KALENDER.stunde(), regen = typeof WETTER !== 'undefined' && WETTER.regnet();
    if (wenn.wetter === 'regen' && !regen) return false;
    if (wenn.wetter === 'trocken' && regen) return false;
    if (wenn.wetter === 'gewitter' && !(typeof WETTER !== 'undefined' && WETTER.gewitter())) return false;
    if (wenn.abStunde !== undefined && st < wenn.abStunde) return false;
    if (wenn.bisStunde !== undefined && st >= wenn.bisStunde) return false;
    if (wenn.abTag !== undefined && KALENDER.tag() < wenn.abTag) return false;
    if (wenn.wochentag && [].concat(wenn.wochentag).indexOf(KALENDER.wochentag()) < 0) return false;
    if (wenn.wochenende !== undefined && KALENDER.wochenende() !== !!wenn.wochenende) return false;
    if (wenn.jahreszeit && [].concat(wenn.jahreszeit).indexOf(KALENDER.jahreszeit()) < 0) return false;
    if (wenn.herzen !== undefined && (!wer || PERSONEN.herzen(wer) < wenn.herzen)) return false;
    if (wenn.merker && !(d.merker && d.merker[wenn.merker])) return false;
    if (wenn.ohneMerker && d.merker && d.merker[wenn.ohneMerker]) return false;
    if (wenn.fohlen !== undefined && !!d.fohlen !== !!wenn.fohlen) return false;
    // Ferienkinder (js/ferienkinder.js): gastTag = der wievielte Tag des Besuchs, gast = dieses Kind ist gerade zu Besuch, wieder = man kennt sich von früher
    var F = typeof FERIEN !== 'undefined' ? FERIEN : null;
    if (wenn.gastTag !== undefined && (!F || [].concat(wenn.gastTag).indexOf(F.besuchsTag()) < 0)) return false;
    if (wenn.gast && !(F && F.istDa(wenn.gast))) return false;
    if (wenn.wieder !== undefined && !!(F && wer && F.wieder(wer)) !== !!wenn.wieder) return false;
    return true;
  }

  // ---------- Platzhalter in den Texten ----------
  // Wer gerade kein Pflegepferd hat (Lotte, Mia oder das Kind, dessen Pferd jetzt dir gehört),
  // erzählt vom Schulpony Mücke. Ein Name passt in jeden Satz, "mein Pferd" nicht ("mit mein Pferd").
  var OHNE_PFERD = 'Mücke';
  function pflegePferd(wer) {
    var b = PERSONEN.brief(wer), liste = PFERDE.alle(function (p) { return p.imStall && b && p.besitzer === b.name; });
    return liste.length ? liste[0].name : OHNE_PFERD;
  }
  function fuelle(text, wer) {
    var ich = typeof SPEICHER !== 'undefined' && SPEICHER.ich() ? SPEICHER.ich().name : 'du';
    var meins = PFERDE.hol(STAND.meins());
    return String(text || '').replace(/\{ich\}/g, ich).replace(/\{pferd\}/g, pflegePferd(wer))
      .replace(/\{meins\}/g, meins ? meins.name : 'dein Pferd').replace(/\{fohlen\}/g, d.fohlen && d.fohlen.name ? d.fohlen.name : 'das Fohlen');
  }

  // ---------- Welches Gespräch kommt dran? ----------
  // Das, was passt und am längsten nicht mehr dran war. Eigene Gespräche der Person gehen vor.
  function waehle(wer) {
    var s = PERSONEN.stand(wer);
    s.gehoert = s.gehoert || {};
    function kandidaten(liste) { return (liste || []).filter(function (g) { return passt(g.wenn, wer) && !g.nurFolge && !(g.einmal && s.gehoert[g.id]); }); }
    var eigene = kandidaten(GESPRAECHE[wer]), alle = kandidaten(GESPRAECHE['*']);
    // Ferienkinder haben zusammen die Liste 'gast'. Die Gespräche für alle passen nicht zu ihnen (sie haben kein Pflegepferd und kennen den Hof noch nicht).
    if ((PERSONEN.brief(wer) || {}).rolle === 'gast') { eigene = eigene.concat(kandidaten(GESPRAECHE.gast)); alle = []; }
    // Der einfache Gruß 'alle_hallo' ist nur der Notnagel
    var pool = eigene.concat(alle.filter(function (g) { return g.id !== 'alle_hallo'; }));
    if (!pool.length) pool = alle;
    if (!pool.length) return null;
    pool.sort(function (a, b) { return (s.gehoert[a.id] || 0) - (s.gehoert[b.id] || 0); });
    // unter den am längsten nicht gehörten: eigene mit Bedingung zuerst (die sind besonderer)
    var aelteste = s.gehoert[pool[0].id] || 0;
    var beste = pool.filter(function (g) { return (s.gehoert[g.id] || 0) === aelteste; });
    beste.sort(function (a, b) { return (b.wenn ? 1 : 0) + (eigene.indexOf(b) >= 0 ? 2 : 0) - (a.wenn ? 1 : 0) - (eigene.indexOf(a) >= 0 ? 2 : 0); });
    return beste[0];
  }

  // ---------- Vorlesen ----------
  var VOR_NAME = 'reitturnier_vorlesen', vorlesen = false, ton = null;
  try { vorlesen = localStorage.getItem(VOR_NAME) === '1'; } catch (e) { /* egal */ }
  function stumm() {
    if (ton) { try { ton.pause(); } catch (e) { /* egal */ } ton = null; }
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e2) { /* egal */ } }
  }
  // schluessel = Name der Aufnahme (zum Beispiel 'emma_sprung' oder 'emma_sprung_1' für die Antwort auf die zweite Auswahl)
  function liesVor(text, schluessel, wer) {
    stumm();
    if (!vorlesen || !text) return;
    // Gibt es eine Aufnahme mit genau diesem Satz? (Heißt ein Pferd inzwischen anders, passt sie nicht mehr.)
    // Mit ~ am Ende: derselbe Satz noch einmal für Kinder ohne Pflegepferd (dann mit "Mücke").
    var name = wer + '/' + schluessel, L = typeof SPRACHE !== 'undefined' && SPRACHE ? SPRACHE : {};
    if (L[name] !== text && L[name + '~'] === text) name += '~';
    if (L[name] === text) {
      try {
        var t = ton = new Audio('sprache/' + name + '.mp3');
        t.onerror = function () { if (ton === t) { ton = null; stimme(text, wer); } };      // Datei fehlt: dann liest das Gerät
        var p = t.play();
        if (p && p.catch) p.catch(function () { /* egal */ });
        return;
      } catch (e) { /* dann die Gerätestimme */ }
    }
    stimme(text, wer);
  }
  // Die Stimme des Geräts (klingt je nach Gerät anders)
  function stimme(text, wer) {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
    try {
      var u = new SpeechSynthesisUtterance(text.replace(/[^\wäöüÄÖÜß .,!?:;'-]/g, ' '));
      u.lang = 'de-DE'; u.rate = 1; u.pitch = (PERSONEN.brief(wer) || {}).junge ? 1.05 : 1.3;
      window.speechSynthesis.speak(u);
    } catch (e3) { /* egal */ }
  }

  // ---------- Die Sprechblase ----------
  var kasten = null, laeuft = null;        // laeuft = { wer, gespraech, fertig, ort }
  function baueKasten() {
    if (kasten) return kasten;
    kasten = document.createElement('div');
    kasten.id = 'rede';
    kasten.innerHTML = '<div class="redeKopf"><b id="redeName"></b><span id="redeHerzen"></span><button type="button" id="redeTon" class="redeKlein" title="Vorlesen"></button><button type="button" id="redeZu" class="redeKlein" title="Schließen">✕</button></div><div id="redeText"></div><div id="redeWahl"></div>';
    document.body.appendChild(kasten);
    // Tipps in die Blase sollen nicht bis zum Spiel durchgehen (sonst läuft die Figur los)
    ['pointerdown', 'pointerup', 'touchstart', 'click'].forEach(function (n) { kasten.addEventListener(n, function (e) { e.stopPropagation(); }); });
    kasten.querySelector('#redeZu').addEventListener('click', function () { ende(); });
    kasten.querySelector('#redeTon').addEventListener('click', function () {
      vorlesen = !vorlesen;
      try { localStorage.setItem(VOR_NAME, vorlesen ? '1' : '0'); } catch (e) { /* egal */ }
      zeigeTon();
      if (vorlesen && laeuft) liesVor(laeuft.gesagt, laeuft.schluessel, laeuft.wer); else stumm();
    });
    return kasten;
  }
  function zeigeTon() { kasten.querySelector('#redeTon').textContent = vorlesen ? '🔊' : '🔈'; }
  function zeige(text, schluessel, antworten) {
    var k = baueKasten(), b = PERSONEN.brief(laeuft.wer) || { name: laeuft.wer };
    k.querySelector('#redeName').textContent = b.name;
    k.querySelector('#redeHerzen').textContent = PERSONEN.herzText(laeuft.wer);
    laeuft.gesagt = fuelle(text, laeuft.wer); laeuft.schluessel = schluessel;
    k.querySelector('#redeText').textContent = laeuft.gesagt;
    zeigeTon();
    var wahl = k.querySelector('#redeWahl');
    wahl.innerHTML = '';
    laeuft.knoepfe = [];
    (antworten && antworten.length ? antworten : [{ text: 'Tschüs!' }]).slice(0, 3).forEach(function (a, i) {
      var kn = document.createElement('button');
      kn.type = 'button';
      kn.textContent = fuelle(a.text, laeuft.wer);
      var tun = function () { antworte(a, i); };
      kn.addEventListener('click', tun);
      laeuft.knoepfe.push(tun);
      wahl.appendChild(kn);
    });
    document.body.classList.add('mit-rede');
    liesVor(laeuft.gesagt, schluessel, laeuft.wer);
  }
  // Eine Antwort wurde gewählt
  function antworte(a, nr) {
    if (!laeuft) return;
    var L = laeuft, s = PERSONEN.stand(L.wer), g = L.gespraech, neuesHerz = false;
    // Freundschaft: nur einmal am Tag je Person (Geschichten dürfen immer)
    if (a.herz && (L.immerHerz || s.tag !== KALENDER.tag())) { neuesHerz = PERSONEN.freund(L.wer, a.herz); if (!L.immerHerz) s.tag = KALENDER.tag(); }
    if (a.merker) { d.merker = d.merker || {}; d.merker[a.merker] = true; }
    if (a.muenzen) { d.muenzen += a.muenzen; KERN.meldung('+' + a.muenzen + ' 🪙', 'knapp'); }
    if (neuesHerz) { KERN.meldung('❤️ Ein neues Herz bei ' + (PERSONEN.brief(L.wer) || { name: L.wer }).name + '!', 'knapp'); KERN.klang('gut'); }
    if (a.tun) { try { a.tun(); } catch (e2) { if (typeof TECHNIK !== 'undefined') TECHNIK.merke(e2, 'Gespräch ' + (g && g.id)); } }
    STAND.speichere();
    if (a.dann) { L.letzte = a; zeige(a.dann, (g && g.id) + '_' + nr, [{ text: a.weiterText || (a.folge ? 'Und dann?' : 'Bis später!'), folge: a.folge }]); return; }
    if (a.folge) { var n = finde(a.folge); if (n) { L.gespraech = n; zeige(n.text, n.id, n.antworten); return; } }
    ende(L.letzte || a);
  }
  function finde(id) {
    var treffer = null;
    Object.keys(GESPRAECHE).forEach(function (k) { GESPRAECHE[k].forEach(function (g) { if (g.id === id) treffer = g; }); });
    return treffer;
  }
  // Gespräch beenden. gewaehlt = die Antwort, mit der es zu Ende ging (oder nichts: abgebrochen)
  function ende(gewaehlt) {
    if (!laeuft) return;
    var L = laeuft;
    laeuft = null;
    stumm();
    document.body.classList.remove('mit-rede');
    PERSONEN.halte(L.wer, 0.8);
    if (typeof EREIGNISSE !== 'undefined') EREIGNISSE.nachRede();
    if (L.fertig) { try { L.fertig(gewaehlt || null); } catch (e) { if (typeof TECHNIK !== 'undefined') TECHNIK.merke(e, 'Gespräch Ende'); } }
  }

  // ---------- Los geht's ----------
  // wer = Kennung der Person. opt.gespraech = ein bestimmtes Gespräch (sonst sucht REDEN eins aus), opt.fertig(antwort) = danach
  function starte(wer, opt) {
    opt = opt || {};
    wer = PERSONEN.kennung(wer);
    if (laeuft) ende();
    var g = opt.gespraech || (typeof EREIGNISSE !== 'undefined' ? EREIGNISSE.redeFuer(wer) : null) || (typeof DIEBSTAHL !== 'undefined' ? DIEBSTAHL.redeFuer(wer) : null) || (typeof NACHT !== 'undefined' ? NACHT.redeFuer(wer) : null), ausGeschichte = !!g && !opt.gespraech;
    if (!g) g = waehle(wer);
    if (!g) return false;
    var s = PERSONEN.stand(wer);
    s.gehoert = s.gehoert || {};
    s.zaehler = (s.zaehler || 0) + 1; s.gehoert[g.id] = s.zaehler; s.mal = (s.mal || 0) + 1;
    if (typeof FERIEN !== 'undefined') FERIEN.gesprochen(wer);
    laeuft = { wer: wer, gespraech: g, fertig: opt.fertig, immerHerz: ausGeschichte || !!opt.immerHerz };
    PERSONEN.halte(wer, HALTEN);
    zeige(g.text, g.id, g.antworten);
    return true;
  }
  // Jedes Bild: Ist die Spielerin weggelaufen oder die Person verschwunden? Dann ist das Gespräch vorbei.
  function schritt(x, z) {
    if (!laeuft) return;
    var o = PERSONEN.wo(laeuft.wer);
    if (!o || !o.da || Math.hypot(o.x - x, o.z - z) > WEG_AB) ende();
  }
  // Tasten 1, 2, 3 wählen eine Antwort, Escape schließt
  window.addEventListener('keydown', function (e) {
    if (!laeuft || e.repeat) return;
    var i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
    if (i >= 0 && laeuft.knoepfe[i]) { e.preventDefault(); laeuft.knoepfe[i](); }
    else if (e.code === 'Escape') ende();
  });

  return {
    GESPRAECHE: GESPRAECHE, starte: starte, ende: function () { ende(); }, schritt: schritt, passt: passt, fuelle: fuelle, waehle: waehle,
    offen: function () { return !!laeuft; }, mit: function () { return laeuft ? laeuft.wer : null; },
    liesVor: liesVor,
    vorlesen: function (an) { if (an !== undefined) { vorlesen = !!an; try { localStorage.setItem(VOR_NAME, vorlesen ? '1' : '0'); } catch (e) { /* egal */ } } return vorlesen; },
    // zum Testen: Antwort Nummer n wählen
    waehleAntwort: function (n) { if (laeuft && laeuft.knoepfe[n]) laeuft.knoepfe[n](); }
  };
})();
