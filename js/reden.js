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
//  In den Texten wird ersetzt: {ich} = dein Name, {pferd} = das Pflegepferd
//  der Person, {meins} = dein Pferd, {fohlen} = das Fohlen.
//
//  Freundschaft zählt in Herzen (0 bis 5, js/personen.js). Punkte gibt
//  es je Person nur einmal am Tag, sonst könnte man sie sich erreden.
//
//  Vorlesen: Schalter 🔈 in der Sprechblase (gilt für das Gerät). Gibt es
//  zu einem Satz eine Aufnahme (Liste SPRACHE), wird sie abgespielt,
//  sonst liest die Stimme des Geräts vor.
// ============================================================
var REDEN = (function () {
  'use strict';
  var d = STAND.daten;

  // ---------- Zum Einstellen ----------
  var WEG_AB = 5.5;                       // geht man so weit weg (Meter), endet das Gespräch von selbst
  var HALTEN = 30;                        // so lange bleibt die Person höchstens stehen (Sekunden)

  // ---------- Die Gespräche ----------
  // '*' = passt zu jeder Person. Die eigenen Gespräche einer Person kommen zuerst dran.
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
        { text: 'Das merke ich mir!', herz: 1, merker: 'geheimnis_aepfel', dann: 'Aber nicht weitersagen, ja?' }] }
    ],
    jonas: [
      { id: 'jonas_wald', text: 'Im Wald habe ich gestern ein Reh gesehen. Ganz nah!', antworten: [
        { text: 'Wo denn genau?', herz: 1, dann: 'Am Bergweg, gleich hinter der großen Lichtung. Du musst leise sein.' },
        { text: 'Ich habe einen Fuchs gesehen!', herz: 1, dann: 'Stark! Trag ihn gleich in dein Tierbuch ein.' },
        { text: 'Tschüs!' }] },
      { id: 'jonas_weg', wenn: { herzen: 2 }, text: 'Soll ich dir meinen Lieblingsweg verraten? Durch den Bach und dann links den Hügel hoch.', antworten: [
        { text: 'Den reite ich mal!', herz: 1, dann: 'Oben sieht man den ganzen Hof. Lohnt sich!' },
        { text: 'Ist der Bach nicht tief?', dann: 'Nein, nur bis zu den Fesseln. {pferd} planscht da gern.' }] }
    ],
    hanna: [
      { id: 'hanna_dressur', text: 'Ich übe gerade Zirkel reiten. Der soll ganz rund werden, wie ein Teller.', antworten: [
        { text: 'Klingt schwer.', herz: 1, dann: 'Man muss nur immer zum nächsten Punkt schauen. Dann wird es rund.' },
        { text: 'Zeigst du es mir mal?', herz: 1, dann: 'Gern! Komm einfach zum Platz, wenn ich reite.' },
        { text: 'Tschüs!' }] },
      { id: 'hanna_ruhe', wenn: { herzen: 2 }, text: '{pferd} merkt sofort, wenn ich hibbelig bin. Pferde sind wie ein Spiegel.', antworten: [
        { text: 'Das kenne ich von {meins}.', herz: 1, dann: 'Siehst du! Dann seid ihr ein gutes Team.' },
        { text: 'Wie ein Spiegel?', dann: 'Bin ich ruhig, ist {pferd} ruhig. Bin ich wild, wird {pferd} wild.' }] }
    ],
    ben: [
      { id: 'ben_moehre', text: 'Pssst. Ich habe drei Möhren in der Tasche. Eine ist für {pferd}.', antworten: [
        { text: 'Und die anderen zwei?', herz: 1, dann: 'Eine für mich. Und eine für den, der fragt. Hier!' , muenzen: 1 },
        { text: 'Nicht zu viele Leckerli!', dann: 'Ja, ja. Das sagt meine Reitlehrerin auch immer.' },
        { text: 'Tschüs!' }] },
      { id: 'ben_hunger', wenn: { abStunde: 11, bisStunde: 14 }, text: 'Ist bald Mittag? Mein Bauch knurrt lauter als {pferd}.', antworten: [
        { text: 'Meiner auch!', herz: 1, dann: 'Dann essen wir gleich zusammen ein Brot auf der Bank.' },
        { text: 'Erst die Pferde, dann wir.', herz: 1, dann: 'Stimmt. Erst füttern, dann futtern!' }] }
    ],
    lina: [
      { id: 'lina_turnen', text: 'Guck mal, ich kann auf einem Bein stehen. Auf dem Pferd ist das viel schwerer!', antworten: [
        { text: 'Wow! Wie lange übst du schon?', herz: 1, dann: 'Seit zwei Jahren. Am Anfang bin ich immer runtergerutscht.' },
        { text: 'Hast du keine Angst?', herz: 1, dann: 'Nur ein bisschen. Das Pferd geht ja ganz ruhig im Kreis.' },
        { text: 'Tschüs!' }] },
      { id: 'lina_tipp', wenn: { herzen: 2 }, text: 'Mein Tipp fürs Voltigieren: Immer im Takt vom Pferd bleiben. Wie beim Tanzen!', antworten: [
        { text: 'Danke, das probiere ich!', herz: 1, dann: 'Sag mir, ob es geklappt hat!' }] }
    ],
    paul: [
      { id: 'paul_hufe', text: 'Wusstest du, dass ein Huf wächst wie ein Fingernagel? Darum kommt der Schmied.', antworten: [
        { text: 'Tut das dem Pferd weh?', herz: 1, dann: 'Nein, gar nicht. Wie Nägel schneiden. Nur lauter.' },
        { text: 'Das wusste ich nicht!', herz: 1, dann: 'Ich weiß noch mehr. Frag mich ruhig öfter!' },
        { text: 'Tschüs!' }] },
      { id: 'paul_eisen', wenn: { herzen: 2 }, text: 'Ein Hufeisen über der Tür bringt Glück. Aber nur, wenn die Öffnung nach oben zeigt!', antworten: [
        { text: 'Warum nach oben?', herz: 1, dann: 'Sonst fällt das Glück heraus. Sagt mein Opa.' }] }
    ],
    lotte: [
      { id: 'lotte_fohlen', wenn: { fohlen: true }, text: '{fohlen} wächst so schnell! Hast du heute schon nach ihm geschaut?', antworten: [
        { text: 'Ja, gerade eben!', herz: 1, dann: 'Super. Es freut sich immer, wenn du kommst.' },
        { text: 'Mache ich gleich.', dann: 'Es steht meistens auf der Weide hinter dem Stall.' }] },
      { id: 'lotte_hof', text: 'Ich wohne hier auf dem Hof. Morgens wecken mich die Pferde mit ihrem Wiehern.', antworten: [
        { text: 'Das ist bestimmt schön!', herz: 1, dann: 'Ja. Nur am Sonntag könnten sie länger schlafen.' },
        { text: 'Tschüs!' }] }
    ],
    mia: [
      { id: 'mia_rad', text: 'Ich komme jeden Tag mit dem Rad. Bergauf ist es anstrengend, aber heim geht es von allein!', antworten: [
        { text: 'Wie weit ist es denn?', herz: 1, dann: 'Drei Kilometer. Dafür bin ich abends richtig müde.' },
        { text: 'Tschüs!' }] }
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
      { id: 'alle_hallo', text: 'Hallo {ich}! Schön, dass du da bist.', antworten: [
        { text: 'Hallo! Was machst du gerade?', herz: 1, dann: 'Ich kümmere mich um {pferd}. Es gibt immer etwas zu tun.' },
        { text: 'Tschüs!' }] }
    ]
  };

  // ---------- Passt eine Bedingung gerade? ----------
  // wenn = { wetter: 'regen' | 'trocken' | 'gewitter', abStunde, bisStunde, abTag, wochentag: 'Samstag', wochenende: true,
  //          jahreszeit: 'Sommer', herzen: 2 (so viele Herzen bei dieser Person), merker: 'name', ohneMerker: 'name', fohlen: true }
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
    return true;
  }

  // ---------- Platzhalter in den Texten ----------
  function pflegePferd(wer) {
    var b = PERSONEN.brief(wer), liste = PFERDE.alle(function (p) { return p.imStall && b && p.besitzer === b.name; });
    return liste.length ? liste[0].name : 'mein Pferd';
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
    function kandidaten(liste) { return (liste || []).filter(function (g) { return passt(g.wenn, wer) && !(g.einmal && s.gehoert[g.id]); }); }
    var eigene = kandidaten(GESPRAECHE[wer]), alle = kandidaten(GESPRAECHE['*']);
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
    var datei = typeof SPRACHE !== 'undefined' && SPRACHE && SPRACHE[schluessel];
    if (datei) {
      try { ton = new Audio(datei); ton.play().catch(function () { /* egal */ }); return; } catch (e) { /* dann die Gerätestimme */ }
    }
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
    if (a.dann) { L.letzte = a; zeige(a.dann, (g && g.id) + '_' + nr, [{ text: a.weiterText || 'Bis später!' }]); return; }
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
    var g = opt.gespraech || (typeof EREIGNISSE !== 'undefined' ? EREIGNISSE.redeFuer(wer) : null), ausGeschichte = !!g && !opt.gespraech;
    if (!g) g = waehle(wer);
    if (!g) return false;
    var s = PERSONEN.stand(wer);
    s.gehoert = s.gehoert || {};
    s.zaehler = (s.zaehler || 0) + 1; s.gehoert[g.id] = s.zaehler; s.mal = (s.mal || 0) + 1;
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
    vorlesen: function (an) { if (an !== undefined) { vorlesen = !!an; try { localStorage.setItem(VOR_NAME, vorlesen ? '1' : '0'); } catch (e) { /* egal */ } } return vorlesen; },
    // zum Testen: Antwort Nummer n wählen
    waehleAntwort: function (n) { if (laeuft && laeuft.knoepfe[n]) laeuft.knoepfe[n](); }
  };
})();
