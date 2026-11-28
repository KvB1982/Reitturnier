// ============================================================
//  NACHT  -  die Nachtwanderung (Stufe 2, Abenteuer)
//
//  Sind Ferienkinder zu Besuch, lädt Lotte nachmittags zur
//  Nachtwanderung ein. Wer zusagt und zu Fuß durch das Tor im
//  Süden geht, wandert im Dunkeln mit Lotte und den drei
//  Ferienkindern durch das Ausritt-Gelände: immer den
//  Leuchtbändern nach, von Station zu Station, bis zum
//  Lagerfeuer mit Stockbrot und wieder nach Hause.
//
//  Dunkel wird es ohne echte Lampen: Über dem Bild liegt ein
//  dunkler Schleier (eine zweite Malfläche). Wo die Laterne
//  leuchtet, hat der Schleier ein Loch. Leuchtbänder, Feuer,
//  Glühwürmchen und Eulenaugen werden als helle Punkte auf den
//  Schleier gemalt. Das kostet die Grafikkarte fast nichts.
//
//  Was es unterwegs zu erleben gibt, steht in der Liste STATIONEN.
//  Eine neue Station ist ein neuer Eintrag dort, kein neuer Code:
//
//    { id: 'eule', bild: '🦉', name: 'Die Eule', x: 33, z: -40,       // hier bleibt die Gruppe stehen
//      art: 'leuchte',                                                // was man dort tut (siehe unten)
//      ding: 'eule', dx: 39.3, dz: -37.9, dy: 3.3,                        // was dort zu sehen ist, und wo genau
//      ruf: 'Pssst! Hört ihr das?',                                   // das sagt Lotte, wenn die Gruppe ankommt
//      knopf: '🔦 In den Baum leuchten',                              // der Knopf rechts unten
//      wissen: 'Eulen fliegen ganz leise …' }                         // das erzählt Lotte danach
//
//    art: 'leuchte' = mit der Laterne etwas anleuchten · 'dunkel' = Laterne kurz zuhalten ·
//         'quiz' = Sternbild-Frage · 'mut' = Mutprobe ohne Laterne (freiwillig) ·
//         'feuer' = Lagerfeuer mit Stockbrot und Geschichte · 'wunsch' = Sternschnuppe
//
//  Der Stand liegt in STAND.daten.nacht: mal (so oft mitgewandert), besuch (bei welchem
//  Besuch der Ferienkinder zuletzt), bereit (an diesem Spieltag hat man Lotte zugesagt).
// ============================================================
var NACHT = (function () {
  'use strict';
  var d = STAND.daten;
  d.nacht = d.nacht || {};
  var N = d.nacht;
  N.mal = N.mal || 0;
  if (N.besuch === undefined) N.besuch = -1;
  N.bereit = N.bereit || 0;

  // ---------- Zahlen zum Einstellen ----------
  var AB_UHR = 14, BIS_UHR = 21;   // in dieser Zeit lädt Lotte ein und wartet am Tor
  var NACHT_UHR = 21.3;            // so spät ist es, wenn die Wanderung beginnt
  var HEIM_UHR = 22;               // und so spät, wenn man wieder auf dem Hof ist
  var LOHN = 15;                   // Münzen am Ende
  var MUT_LOHN = 4;                // Münzen für die Mutprobe
  var STERN_LOHN = 3;              // Münzen für den Polarstern beim ersten Versuch
  var LATERNE = 4.2;               // so weit leuchtet die Laterne (Meter)
  var SCHLEIER = 0.9;              // so dunkel ist es außerhalb vom Licht (0 = hell, 1 = schwarz)
  var BAND_ABSTAND = 13;           // Meter zwischen zwei Leuchtbändern
  var STATION_NAH = 7;             // so nah muss man an einer Station sein
  var GRUPPE_NAH = 13;             // so nah müssen alle Kinder sein, bevor es an einer Station losgeht
  var KIND_TEMPO = 4.2;            // so schnell laufen die Kinder (man selbst: 4,6 m/s)
  var KIND_ABSTAND = 1.5;          // Abstand im Gänsemarsch
  var ANGST_NACH = 30;             // so viele Meter nach den Glühwürmchen bleibt ein Kind stehen
  var BROT_GOLD = [4.5, 8];        // in diesen Sekunden ist das Stockbrot goldbraun

  // ---------- Der Weg: vom Tor einmal um die kleine Runde ----------
  var WEG = [[0, -113], [0, -104], [10, -70], [38, -40], [66, -12], [80, 14], [70, 50], [58, 74], [30, 62], [4, 46], [-22, 32], [-48, -4], [-70, -44], [-40, -80], [-3, -104], [-3, -113]];

  var STATIONEN = [
    { id: 'eule', bild: '🦉', name: 'Die Eule in der alten Eiche', x: 33, z: -41, art: 'leuchte', ding: 'eule', dx: 39.3, dz: -37.9, dy: 3.3, klang: 'eule',
      ruf: 'Pssst! Bleibt mal stehen. Hört ihr das? Da oben in der Eiche sitzt jemand.',
      knopf: '🔦 In die Eiche leuchten',
      wissen: 'Ein Waldkauz! Eulen fliegen fast lautlos, weil ihre Federn am Rand ganz weich sind. Und sie können den Kopf fast ganz nach hinten drehen.' },
    { id: 'wurm', bild: '✨', name: 'Die Glühwürmchen', x: 65, z: -13, art: 'dunkel', ding: 'wuermchen', dx: 70, dz: -8, dy: 1,
      ruf: 'Seht ihr die kleinen Lichter dort im Gras? Halt mal die Hand vor die Laterne, dann sieht man sie besser.',
      knopf: '🏮 Laterne zuhalten',
      wissen: 'Glühwürmchen sind kleine Käfer. Sie machen ihr Licht selbst, ganz ohne Feuer und ohne Strom, damit sie einander im Dunkeln finden.' },
    { id: 'igel', bild: '🦔', name: 'Der Igel an der Waldhütte', x: 77, z: 16, art: 'leuchte', ding: 'igel', dx: 78.5, dz: 20.2, dy: 0, klang: 'rascheln',
      ruf: 'Da raschelt etwas im Laub neben der Hütte! Wer leuchtet mal hin? Aber leise.',
      knopf: '🔦 Ins Laub leuchten',
      wissen: 'Ein Igel auf der Suche nach Käfern und Schnecken. Ein großer Igel hat ungefähr 6000 Stacheln. Im Winter schläft er monatelang in einem Laubhaufen.' },
    { id: 'sterne', bild: '⭐', name: 'Sterne gucken auf dem Hügel', x: 58, z: 74, art: 'quiz',
      ruf: 'Hier oben sieht man die Sterne am besten. Wer findet den Polarstern? Der zeigt immer nach Norden.',
      knopf: '⭐ Sterne ansehen',
      wissen: 'Der Polarstern steht immer im Norden. Früher haben Seeleute und Wanderer so nachts den Weg gefunden.' },
    { id: 'mut', bild: '🌑', name: 'Die Mutprobe', x: 31, z: 62, art: 'mut', frei: true,
      ruf: 'Wer traut sich? Wir machen alle Laternen aus und gehen Hand in Hand bis zum Lagerfeuer. Man sieht es von hier schon leuchten. Wer nicht mag, geht einfach mit Licht weiter.',
      knopf: '🌑 Mutprobe: Laterne aus',
      wissen: 'Geschafft! Merkt ihr was? Nach ein paar Minuten im Dunkeln sehen die Augen viel mehr. Das nennt man Nachtsehen.' },
    { id: 'feuer', bild: '🔥', name: 'Das Lagerfeuer', x: 3.5, z: 48, art: 'feuer', ding: 'feuer', dx: 0.5, dz: 50.5, dy: 0,
      ruf: 'Da ist unser Lagerfeuer! Mia hat es für uns angezündet. Setzt euch, es gibt Stockbrot!',
      knopf: '🔥 Ans Lagerfeuer setzen',
      wissen: 'Ein Feuer lässt man nie allein. Mia passt auf und löscht es nachher mit Wasser, damit im Wald nichts passieren kann. Kommt, wir gehen über die Wiese zurück.' },
    { id: 'wunsch', bild: '🌠', name: 'Die Sternschnuppe über der Blumenwiese', x: -66, z: -40, art: 'wunsch',
      ruf: 'Bleibt mal stehen und schaut nach oben. Über der Wiese ist der Himmel ganz weit.',
      knopf: '🌠 In den Himmel schauen',
      wissen: 'Eine Sternschnuppe ist ein Steinchen aus dem Weltall, oft nur so groß wie ein Sandkorn. Es verglüht hoch oben in der Luft.' }
  ];

  // Das sagen die Ferienkinder unterwegs ({name} sagt …)
  var SPRUECHE = ['Habt ihr das gehört? Da hat was geknackt!', 'Bei uns zu Hause sieht man nie so viele Sterne.', 'Meine Laterne ist die hellste!', 'Ich habe gar keine Angst. Fast gar keine.',
    'Riecht ihr das? Der Wald riecht nachts ganz anders.', 'Wie weit ist es noch bis zum Lagerfeuer?', 'Guck mal, unser Atem dampft!', 'Das erzähle ich alles zu Hause.'];
  // Die Geschichte am Lagerfeuer (Lotte erzählt)
  var GESCHICHTE = [
    'Es war einmal ein kleines Pony namens Pünktchen. Jede Nacht stand es auf der Koppel und schaute in den Himmel. „Ich will wissen, wie viele Sterne es gibt“, sagte es. Und es fing an zu zählen: eins, zwei, drei …',
    'Bei hundert kam der alte Wallach vorbei. „Das schaffst du nie“, brummte er. Bei tausend kam die Eule. „Hör auf, du zählst ja die ganze Nacht!“ Aber Pünktchen zählte weiter. Nur: Immer wenn es blinzelte, wusste es nicht mehr, wo es gewesen war.',
    'Da setzte sich ein Glühwürmchen auf seine Nase. „Du musst sie nicht zählen“, flüsterte es. „Such dir einen aus. Der gehört dann dir.“ Pünktchen suchte sich den hellsten aus. Seitdem schaut es jede Nacht nur nach diesem einen Stern – und schläft dabei ganz schnell ein.'];

  // ---------- kleine Helfer ----------
  function winkel(w) { while (w > Math.PI) w -= 2 * Math.PI; while (w < -Math.PI) w += 2 * Math.PI; return w; }
  function gruppe() {
    var gr = FERIEN.besuchsTag() ? FERIEN.besuchNr() % 2 : 0;
    return FERIEN.GAESTE.filter(function (b) { return b.gruppe === gr; }).sort(function (a, b) { return a.platz - b.platz; });
  }
  function belegt() { return (typeof AUSREISSER !== 'undefined' && AUSREISSER.laeuft()) || (typeof DIEBSTAHL !== 'undefined' && DIEBSTAHL.laeuft()) || !!EREIGNISSE.laeuft(); }
  // Passt heute alles? (Ferienkinder da, richtiges Wetter, richtige Uhrzeit, bei diesem Besuch noch nicht gewandert)
  function moeglich() {
    var bt = FERIEN.besuchsTag(), h = d.stunde;
    if (!bt || bt >= 3 || h < AB_UHR || h >= BIS_UHR) return false;
    if (WETTER.regnet() || WETTER.gewitter() || N.besuch === FERIEN.besuchNr()) return false;
    return FERIEN.istDa(gruppe()[0].id);
  }
  function angebot() { return moeglich() && !belegt() && N.bereit !== KALENDER.tag(); }
  function bereit() { return moeglich() && N.bereit === KALENDER.tag() && !(typeof AUSREISSER !== 'undefined' && AUSREISSER.laeuft()); }

  // ============================================================
  //  Auf dem Hof: Lotte lädt ein, am Südtor geht es los
  // ============================================================
  var H = null;
  function baueHof(ctx) { H = ctx; }
  function hinweis() {
    if (bereit()) return '🏮 Nachtwanderung: Lotte und die Ferienkinder warten am Tor im Süden. Geh zu Fuß hindurch, dann geht es los.';
    if (angebot()) { var w = PERSONEN.wo('lotte'); if (w && w.da) return '🏮 Lotte hat eine Idee für heute Abend. Sprich sie an (Knopf „💬 Mit Lotte reden“).'; }
    return '';
  }
  function marke() {
    if (bereit()) return H ? { x: H.ORT.ausritt.tor[0], z: H.ORT.ausritt.tor[1], art: 'ort' } : null;
    if (angebot()) { var w = PERSONEN.wo('lotte'); return w && w.da ? { x: w.x, z: w.z, art: 'person' } : null; }
    return null;
  }
  function redeFuer(wer) {
    if (PERSONEN.kennung(wer) !== 'lotte') return null;
    if (bereit()) return { id: 'nacht_los', text: 'Alle sind fertig und haben ihre Laternen. Geh zu Fuß durch das Tor im Süden, dann geht es los!', antworten: [{ text: 'Bin gleich da!' }] };
    if (!angebot()) return null;
    return { id: 'nacht_frage', text: 'Heute Abend machen wir mit den Ferienkindern eine Nachtwanderung! Mit Laternen durch den Wald, und am Picknickplatz gibt es Lagerfeuer und Stockbrot. Kommst du mit?', antworten: [
      { text: 'Au ja! 🏮', herz: 1, dann: 'Prima! Bring dein Pferd vorher in die Box. Wenn du so weit bist, geh zu Fuß durch das Tor im Süden. Wir warten dort, bis es dunkel wird.', tun: function () { N.bereit = KALENDER.tag(); STAND.speichere(); } },
      { text: 'Ist das nicht gruselig?', dann: 'Nur ein ganz kleines bisschen. Wir bleiben alle zusammen und jeder hat eine Laterne. Nachts hört und sieht man Tiere, die am Tag schlafen. Frag mich einfach noch mal, wenn du mitkommen magst.' },
      { text: 'Heute lieber nicht.', dann: 'Schade. Sag Bescheid, wenn du es dir anders überlegst. Bis es dunkel wird, ist noch Zeit.' }] };
  }
  // Der Hof fragt am Südtor: Geht es jetzt zur Nachtwanderung? Dann wird es Nacht.
  function brichAuf() { WETTER.setze(Math.max(d.stunde, NACHT_UHR)); }
  // Und wenn man zurückkommt, ist es spät.
  function zurueck() { WETTER.setze(Math.max(d.stunde, HEIM_UHR)); }

  // ============================================================
  //  Draußen: die Wanderung selbst
  // ============================================================
  var W = null;            // was der Ausritt uns mitgibt (Szene, Kamera, Boden, Hinweise …)
  var welt = null;         // alles, was wir für die Nacht in die Landschaft stellen
  var bild = null, sg = null;          // der dunkle Schleier (Malfläche) und sein Stift
  var kinder = [], baender = [], dinge = {}, laterne = null, wuermchen = null, flammen = [];
  var L = null;            // der Lauf: { nr, phase, t, … }
  var spur = [], spurLang = 0;         // hier ist man entlanggegangen (dem folgen die Kinder im Gänsemarsch)
  var v3 = new THREE.Vector3();

  function entlang(weg, abstand) {
    var aus = [], rest = 0, i, a, b, lang, t;
    for (i = 0; i < weg.length - 1; i++) {
      a = weg[i]; b = weg[i + 1]; lang = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (t = rest; t < lang; t += abstand) aus.push([a[0] + (b[0] - a[0]) * t / lang, a[1] + (b[1] - a[1]) * t / lang, Math.atan2(b[0] - a[0], b[1] - a[1])]);
      rest = t - lang;
    }
    return aus;
  }
  function leuchtMat(farbe) { return new THREE.MeshBasicMaterial({ color: farbe, fog: false }); }

  function baue() {
    welt = new THREE.Group(); W.szene.add(welt);
    // --- Leuchtbänder: ein Pfahl mit einem hellen Band, alle zusammen sind nur zwei Formen ---
    var orte = entlang(WEG, BAND_ABSTAND).map(function (p) { return [p[0] + Math.cos(p[2]) * 1.7, p[1] - Math.sin(p[2]) * 1.7]; })
      .filter(function (p) { return W.boden(p[0], p[1]) > W.wasser + 0.1; });
    var pfahl = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.045, 1.1, 6), BAU.mat(0x6b4a2b), orte.length);
    var band = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8), leuchtMat(0xd8ff5a), orte.length);
    var m = new THREE.Matrix4();
    orte.forEach(function (p, i) {
      var y = W.hoehe(p[0], p[1]);
      m.makeTranslation(p[0], y + 0.55, p[1]); pfahl.setMatrixAt(i, m);
      m.makeTranslation(p[0], y + 1.0, p[1]); band.setMatrixAt(i, m);
      baender.push({ x: p[0], y: y + 1.0, z: p[1] });
    });
    pfahl.frustumCulled = false; band.frustumCulled = false;
    welt.add(pfahl); welt.add(band);
    // --- die Dinge an den Stationen ---
    STATIONEN.forEach(function (S) {
      if (!S.ding) return;
      var g = new THREE.Group(), y = W.hoehe(S.dx, S.dz) + S.dy;
      g.position.set(S.dx, y, S.dz); welt.add(g);
      dinge[S.id] = { g: g, x: S.dx, y: y, z: S.dz };
      if (S.ding === 'eule') {
        BAU.walze(0.05, 0.07, 1.8, 0x4a3320, g, 0, -0.3, -0.65).rotation.x = Math.PI / 2;                     // der Ast, auf dem sie sitzt
        var leib = BAU.netz(new THREE.SphereGeometry(0.2, 10, 8), 0x7a5a3a, g, 0, 0, 0); leib.scale.set(1, 1.35, 0.9);
        var kopf = new THREE.Group(); kopf.position.y = 0.32; g.add(kopf);
        BAU.netz(new THREE.SphereGeometry(0.17, 10, 8), 0x8a6a48, kopf, 0, 0, 0);
        BAU.netz(new THREE.SphereGeometry(0.045, 8, 6), leuchtMat(0xffd23a), kopf, -0.07, 0.02, 0.14);
        BAU.netz(new THREE.SphereGeometry(0.045, 8, 6), leuchtMat(0xffd23a), kopf, 0.07, 0.02, 0.14);
        BAU.netz(new THREE.ConeGeometry(0.03, 0.07, 6), 0xd9a441, kopf, 0, -0.04, 0.17).rotation.x = Math.PI / 2;
        dinge[S.id].kopf = kopf; g.scale.setScalar(1.35);
        g.rotation.y = Math.atan2(S.x - S.dx, S.z - S.dz);                                                    // sie schaut zur Gruppe
      } else if (S.ding === 'igel') {
        var ig = BAU.netz(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x5a4632, g, 0, 0, 0); ig.scale.set(1, 0.85, 1.35);
        BAU.netz(new THREE.ConeGeometry(0.06, 0.16, 6), 0xb8956a, g, 0, 0.04, 0.26).rotation.x = Math.PI / 2;
        BAU.netz(new THREE.SphereGeometry(0.018, 6, 4), 0x111111, g, 0, 0.045, 0.34);
        g.scale.setScalar(1.6);                    // etwas größer als echt, damit man ihn im Laternenlicht gut sieht
        dinge[S.id].x0 = S.dx; dinge[S.id].z0 = S.dz;
      } else if (S.ding === 'feuer') {
        var ring = BAU.netz(new THREE.TorusGeometry(0.62, 0.11, 5, 10), 0x7d7f86, g, 0, 0.06, 0); ring.rotation.x = Math.PI / 2;
        for (var i = 0; i < 3; i++) { var holz = BAU.walze(0.07, 0.07, 0.9, 0x4a3320, g, 0, 0.13, 0, 6); holz.rotation.z = Math.PI / 2; holz.rotation.y = i * 1.05; }
        flammen = [BAU.netz(new THREE.ConeGeometry(0.3, 0.8, 7), leuchtMat(0xff8a1e), g, 0, 0.5, 0), BAU.netz(new THREE.ConeGeometry(0.17, 0.5, 6), leuchtMat(0xffe07a), g, 0.04, 0.42, 0.03)];
        flammen.forEach(function (f) { f.castShadow = false; });
      } else if (S.ding === 'wuermchen') {
        var n = 26, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var punkte = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd8ff5a, size: 0.14, fog: false }));
        punkte.frustumCulled = false; g.add(punkte);
        wuermchen = { punkte: punkte, liste: [] };
        for (var k = 0; k < n; k++) wuermchen.liste.push({ x: (Math.random() - 0.5) * 16, y: 0.3 + Math.random() * 1.6, z: (Math.random() - 0.5) * 16, t: Math.random() * 9, an: 0 });
      }
    });
    // --- die Laterne in der Hand ---
    laterne = new THREE.Group(); laterne.position.set(0.34, 0.92, 0.3);
    BAU.kasten(0.13, 0.19, 0.13, leuchtMat(0xffd97a), laterne, 0, 0, 0).castShadow = false;
    BAU.kasten(0.16, 0.03, 0.16, 0x2a2a2a, laterne, 0, 0.11, 0); BAU.kasten(0.16, 0.03, 0.16, 0x2a2a2a, laterne, 0, -0.11, 0);
    // --- der Schleier über dem Bild ---
    bild = document.createElement('canvas');
    bild.id = 'nachtSchleier';
    bild.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;display:none';
    (document.getElementById('buehne') || document.body).appendChild(bild);
    sg = bild.getContext('2d');
  }
  function sorgeKinder() {
    var G = gruppe();
    G.forEach(function (b, i) {
      var K = kinder[i];
      if (!K) {
        K = kinder[i] = { figur: baueFigur(b.outfit, { helm: false }), x: 0, z: 0, kurs: 0, phase: i, s: 0, tempo: 0 };
        welt.add(K.figur.wurzel);
      } else K.figur.setzeOutfit(b.outfit);
      if (K.schild) { K.figur.wurzel.remove(K.schild); K.schild.material.map.dispose(); K.schild.material.dispose(); }
      K.schild = BAU.schwebeText(b.name, 0.3, { schrift: 40 }); K.schild.position.y = 1.95; K.figur.wurzel.add(K.schild);
      K.wer = b; K.halt = false; K.hand = false; K.sitzt = false;
      K.figur.setzePose('steh', true); K.figur.setzeHoehe(0.8, true);
    });
  }

  // Der Ausritt ruft das beim Start: ctx.nacht sagt, ob es eine Nachtwanderung ist
  function ausrittStart(ctx) {
    W = ctx;
    if (!ctx.nacht) { raeume(); L = null; return; }
    if (!welt) baue();
    welt.visible = true; bild.style.display = 'block';
    sorgeKinder();
    if (laterne.parent !== W.ich.wurzel) W.ich.wurzel.add(laterne);
    laterne.visible = true;
    L = { nr: 0, phase: 'hin', t: 0, zeit: 0, licht: 1, lichtZiel: 1, spot: 0, gerufen: false, geschafft: {}, uebersprungen: {}, mut: false, sternFalsch: false,
      angst: null, angstBei: -1, spruch: 22, schnuppe: 0, start: true, brot: '' };
    spur = []; spurLang = 0;
    var ig = dinge.igel; if (ig) { ig.g.position.x = ig.x0; ig.g.position.z = ig.z0; ig.x = ig.x0; ig.z = ig.z0; }
  }
  function raeume() {
    if (welt) welt.visible = false;
    if (bild) bild.style.display = 'none';
    if (laterne) laterne.visible = false;
  }
  function ausrittEnde() { raeume(); L = null; }

  // ---------- Gänsemarsch: die Kinder laufen genau da, wo man selbst gegangen ist ----------
  function spurPunkt(s) {
    if (!spur.length) return null;
    if (s <= spur[0][2]) return spur[0];
    for (var i = spur.length - 1; i > 0; i--) {
      if (spur[i - 1][2] <= s) { var a = spur[i - 1], b = spur[i], t = (s - a[2]) / Math.max(0.001, b[2] - a[2]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    }
    return spur[0];
  }
  // Die Spur neu legen: hinten das letzte Kind, vorn man selbst
  function neueSpur(P) {
    spur = []; spurLang = 0;
    for (var i = kinder.length - 1; i >= 0; i--) {
      var K = kinder[i];
      if (spur.length) spurLang += Math.max(0.3, Math.hypot(K.x - spur[spur.length - 1][0], K.z - spur[spur.length - 1][1]));
      spur.push([K.x, K.z, spurLang]); K.s = spurLang;
    }
    spurLang += Math.max(0.3, Math.hypot(P.x - spur[spur.length - 1][0], P.z - spur[spur.length - 1][1]));
    spur.push([P.x, P.z, spurLang]);
  }
  function bewegeKinder(dt, P) {
    var i, K;
    var letzter = spur[spur.length - 1], weit = letzter ? Math.hypot(P.x - letzter[0], P.z - letzter[1]) : 0;
    if (L.start || weit > 30) {              // am Anfang stehen alle hinter einem am Tor (und auch, wenn man im Test versetzt wurde)
      L.start = false; weit = 0;
      kinder.forEach(function (K2, nr) { K2.x = P.x - Math.sin(P.kurs) * (nr + 1) * KIND_ABSTAND; K2.z = P.z - Math.cos(P.kurs) * (nr + 1) * KIND_ABSTAND; K2.kurs = P.kurs; });
      neueSpur(P);
    }
    if (weit > 0.5) { spurLang += weit; spur.push([P.x, P.z, spurLang]); }
    var feuer = STATIONEN[L.nr] && STATIONEN[L.nr].art === 'feuer' && L.phase !== 'hin' ? dinge.feuer : null;
    for (i = 0; i < kinder.length; i++) {
      K = kinder[i];
      var sitzen = !!feuer && P.sitzt;
      if (sitzen) {             // rund ums Feuer
        var w = 2.1 + i * 1.05, zx = feuer.x + Math.sin(w) * 1.9, zz = feuer.z + Math.cos(w) * 1.9;
        K.x += (zx - K.x) * Math.min(1, dt * 3); K.z += (zz - K.z) * Math.min(1, dt * 3); K.kurs = Math.atan2(feuer.x - K.x, feuer.z - K.z); K.tempo = 0;
        if (!K.sitzt) { K.sitzt = true; K.figur.setzePose('sitzen'); }
      } else {
        if (K.sitzt) { K.sitzt = false; K.figur.setzePose('steh'); K.figur.setzeHoehe(0.8); neueSpur(P); }
        var ziel = spurLang - (i + 1) * KIND_ABSTAND, alt = K.s, tempo = K.hand ? 5 : KIND_TEMPO;
        if (K.halt) ziel = K.s;
        if (i > 0) ziel = Math.min(ziel, kinder[i - 1].s - KIND_ABSTAND * 0.8);      // niemand überholt
        K.s = Math.max(K.s, Math.min(ziel, K.s + tempo * dt));
        var p = spurPunkt(K.s);
        if (p) {
          var dx = p[0] - K.x, dz = p[1] - K.z, e = Math.hypot(dx, dz);
          if (e > 0.02) K.kurs += winkel(Math.atan2(dx, dz) - K.kurs) * Math.min(1, dt * 10);
          K.x = p[0]; K.z = p[1];
        }
        K.tempo += ((K.s - alt) / Math.max(0.001, dt) - K.tempo) * Math.min(1, dt * 8);
        K.phase += K.tempo * dt * 4.2;
      }
      K.figur.gehe(K.phase, Math.min(1, K.tempo / 3.5)); K.figur.bewege(dt);
      K.figur.wurzel.position.set(K.x, W.hoehe(K.x, K.z), K.z); K.figur.wurzel.rotation.y = K.kurs;
    }
    // alte Spur wegwerfen
    var hinten = kinder.length ? kinder[kinder.length - 1].s - 2 : spurLang - 10;
    while (spur.length > 2 && spur[1][2] < hinten) spur.shift();
  }
  function weitestes(P) { var m = 0; kinder.forEach(function (K) { m = Math.max(m, Math.hypot(K.x - P.x, K.z - P.z)); }); return m; }

  // ---------- der Schleier ----------
  function aufSchirm(x, y, z) {
    v3.set(x, y, z).project(W.kamera);
    if (v3.z > 1 || v3.z < -1) return null;
    return [(v3.x + 1) / 2 * bild.width, (1 - v3.y) / 2 * bild.height];
  }
  function groesse(x, y, z, meter) {
    var k = W.kamera, weit = Math.max(0.5, k.position.distanceTo(v3.set(x, y, z)));
    return meter / (weit * Math.tan(k.fov * Math.PI / 360)) * bild.height / 2;
  }
  function loch(x, y, z, meter, stark) {
    var r = groesse(x, y, z, meter), q = aufSchirm(x, y, z);
    if (!q || r < 0.5) return;
    var gr = sg.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
    gr.addColorStop(0, 'rgba(0,0,0,' + stark + ')'); gr.addColorStop(0.5, 'rgba(0,0,0,' + stark * 0.8 + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = gr; sg.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
  }
  function schein(x, y, z, meter, farbe, mindestens) {
    var q = aufSchirm(x, y, z); if (!q) return;
    var r = Math.max(mindestens || 0, groesse(x, y, z, meter));
    var gr = sg.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
    gr.addColorStop(0, farbe); gr.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = gr; sg.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
  }
  function maleSchleier(P) {
    var breit = 256, hoch = Math.max(64, Math.round(breit * window.innerHeight / Math.max(1, window.innerWidth)));
    if (bild.width !== breit || bild.height !== hoch) { bild.width = breit; bild.height = hoch; }
    var g = sg, i, zeit = L.zeit, k = W.kamera;
    k.updateMatrixWorld(); k.matrixWorldInverse.copy(k.matrixWorld).invert();
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, breit, hoch);
    g.fillStyle = 'rgba(4,7,26,' + SCHLEIER + ')'; g.fillRect(0, 0, breit, hoch);
    // Löcher: Hier ist es hell
    g.globalCompositeOperation = 'destination-out';
    var flacker = 1 + Math.sin(zeit * 9) * 0.02 + Math.sin(zeit * 23) * 0.015;
    loch(P.x, P.y + 0.9, P.z, LATERNE * (0.1 + 0.9 * L.licht) * flacker, 0.25 + 0.75 * L.licht);
    kinder.forEach(function (K) { loch(K.x, W.hoehe(K.x, K.z) + 0.9, K.z, 1.7 * (0.25 + 0.75 * L.licht), 0.3 + 0.45 * L.licht); });       // jedes Kind hat eine kleine Laterne
    var F = dinge.feuer;
    if (F) loch(F.x, F.y + 0.5, F.z, 5.5 * (1 + Math.sin(zeit * 11) * 0.04 + Math.sin(zeit * 5.3) * 0.04), 1);
    if (L.spot > 0.01 && STATIONEN[L.nr] && dinge[STATIONEN[L.nr].id]) { var D = dinge[STATIONEN[L.nr].id]; loch(D.x, D.y + 0.15, D.z, 1.3 * L.spot, 1); }
    // Lichter: Die sieht man auch im Dunkeln
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < baender.length; i++) {
      var B = baender[i], weit = Math.hypot(B.x - P.x, B.z - P.z);
      if (weit < 75) schein(B.x, B.y, B.z, 0.32, 'rgba(200,255,80,' + (0.85 - weit / 110).toFixed(2) + ')', 1.6);
    }
    if (F) schein(F.x, F.y + 0.6, F.z, 2.2, 'rgba(255,150,40,0.5)', 3);
    schein(P.x, P.y + 0.95, P.z, 2.2 * (0.2 + 0.8 * L.licht), 'rgba(255,200,110,0.16)', 0);
    var E = dinge.eule;
    if (E && Math.hypot(E.x - P.x, E.z - P.z) < 40) { schein(E.x, E.y + 0.34, E.z, 0.16, 'rgba(255,215,60,0.9)', 1.3); }
    if (wuermchen) {
      var O = dinge.wurm;
      wuermchen.liste.forEach(function (w) { if (w.an > 0.05) schein(O.x + w.x, O.y + w.y, O.z + w.z, 0.2, 'rgba(210,255,90,' + (w.an * 0.9).toFixed(2) + ')', 1.2); });
    }
    // Sternschnuppe: ein heller Strich oben über das Bild
    if (L.schnuppe > 0) {
      var t = 1 - L.schnuppe / 1.6, x0 = breit * (0.2 + 0.5 * t), y0 = hoch * (0.08 + 0.16 * t);
      var st = g.createLinearGradient(x0 - 34, y0 - 11, x0, y0); st.addColorStop(0, 'rgba(255,255,255,0)'); st.addColorStop(1, 'rgba(255,255,230,0.95)');
      g.strokeStyle = st; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 - 34, y0 - 11); g.lineTo(x0, y0); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }

  // ---------- die Stationen ----------
  function station() { return L ? STATIONEN[L.nr] : null; }
  function fertig(S, text) {
    L.geschafft[S.id] = true; L.nr++; L.phase = 'hin'; L.t = 0; L.gerufen = false; L.lichtZiel = 1; L.mut = false;
    KERN.klang('gut');
    W.sage(text || S.wissen, 10);
    if (S.id === 'wurm') L.angstBei = spurLang + ANGST_NACH;
  }
  function sternKarte() {
    // Großer Wagen (sieben Sterne) und drei Sterne zur Auswahl. Der Polarstern liegt dort, wo man hinkommt,
    // wenn man die hintere Wand vom Wagenkasten (die zwei Sterne rechts) fünfmal nach oben verlängert.
    var wagen = [[48, 164], [82, 150], [116, 156], [152, 168], [150, 198], [196, 200], [206, 172]], wahl = [['A', 256, 32], ['B', 112, 48], ['C', 292, 150]];
    var svg = '<svg viewBox="0 0 330 230" style="width:100%;max-width:420px;background:#0b1030;border-radius:14px">';
    svg += '<polyline points="' + wagen.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + ' ' + wagen[3][0] + ',' + wagen[3][1] + '" fill="none" stroke="#5f6fb0" stroke-width="1.5"/>';
    svg += '<line x1="206" y1="172" x2="253" y2="40" stroke="#5f6fb0" stroke-width="1" stroke-dasharray="4 5"/>';
    wagen.forEach(function (p) { svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#fff8d0"/>'; });
    wahl.forEach(function (p) { svg += '<circle cx="' + p[1] + '" cy="' + p[2] + '" r="5" fill="#ffffff"/><text x="' + (p[1] + 10) + '" y="' + (p[2] + 6) + '" fill="#ffd97a" font-size="18" font-weight="bold">' + p[0] + '</text>'; });
    for (var i = 0; i < 26; i++) svg += '<circle cx="' + ((i * 97) % 322 + 4) + '" cy="' + ((i * 53) % 220 + 5) + '" r="1" fill="#8f9bd0"/>';
    svg += '<text x="60" y="222" fill="#8f9bd0" font-size="13">Großer Wagen</text></svg>';
    function antwort(nr) {
      return function () {
        if (nr === 0) {
          KERN.schliesseKarte(); var S = station();
          if (!L.sternFalsch) W.lohn(STERN_LOHN, '⭐ Polarstern gefunden!'); else KERN.meldung('⭐ Jetzt hast du ihn!', 'gut');
          if (S && S.art === 'quiz') fertig(S);
        } else { L.sternFalsch = true; KERN.klang('knapp'); zeige('Fast! Tipp von Lotte: Folge der gestrichelten Linie. Sie geht von den zwei Sternen ganz rechts am Wagenkasten fünfmal so weit nach oben.'); }
      };
    }
    function zeige(tipp) {
      KERN.zeigeKarte('mitte', '<div class="klein">Station ' + (L.nr + 1) + ' · Sterne gucken</div><h2>⭐ Welcher ist der Polarstern?</h2>' + svg +
        '<div class="details">' + KERN.esc(tipp || 'Das Sternbild mit den sieben hellen Sternen heißt Großer Wagen. Mit ihm findet man den Polarstern.') + '</div>',
        wahl.map(function (p, nr) { return { text: 'Stern ' + p[0], klasse: 'zweit', aktion: antwort(nr) }; }));
    }
    zeige();
  }
  function wunschKarte() {
    function wunsch(text) { return function () { KERN.schliesseKarte(); KERN.meldung(text, 'perfekt'); var S = station(); if (S && S.art === 'wunsch') fertig(S); }; }
    KERN.zeigeKarte('mitte', '<div class="klein">Station ' + (L.nr + 1) + ' · Über der Blumenwiese</div><h2>🌠 Eine Sternschnuppe!</h2><div class="details">Schnell, wünsch dir etwas! Aber nicht laut sagen, sonst geht es nicht in Erfüllung.</div>',
      [{ text: '🐴 Etwas mit Pferden', aktion: wunsch('🌠 Gewünscht! Mal sehen, was daraus wird.') },
       { text: '👫 Etwas mit Freunden', klasse: 'zweit', aktion: wunsch('🌠 Gewünscht! Freunde sind das Beste.') },
       { text: '🤫 Das verrate ich nicht', klasse: 'zweit', aktion: wunsch('🌠 Pssst. Dann geht es bestimmt in Erfüllung.') }]);
  }
  function geschichte(seite) {
    KERN.zeigeKarte('mitte', '<div class="klein">Lotte erzählt am Lagerfeuer · ' + (seite + 1) + ' von ' + GESCHICHTE.length + '</div><h2>🐴 Das Pony, das die Sterne zählte</h2><div class="details" style="text-align:left">' + KERN.esc(GESCHICHTE[seite]) + '</div>',
      [{ text: seite < GESCHICHTE.length - 1 ? 'Und dann?' : 'Schöne Geschichte!', aktion: function () {
        if (seite < GESCHICHTE.length - 1) { geschichte(seite + 1); return; }
        KERN.schliesseKarte(); L.phase = 'satt'; W.tipp('🔥 Wenn du magst, bleib noch ein bisschen sitzen. Mit „🧍 Aufstehen“ geht es weiter.', 7);
      } }]);
  }
  function feiere() {
    var n = Object.keys(L.geschafft).length, G = gruppe();
    N.mal++; N.besuch = FERIEN.besuchsTag() ? FERIEN.besuchNr() : N.besuch; N.bereit = 0;
    d.merker = d.merker || {}; d.merker.nachtwanderung = true;
    G.forEach(function (b) { PERSONEN.freund(b.id, 2); });
    PERSONEN.freund('lotte', 1);
    var zeile = STAND.belohne(LOHN, 'Nachtwanderung');
    KERN.klang('jubel');
    var ende = W.ende; L.phase = 'ende';
    KERN.zeigeKarte('mitte', '<div class="klein">Nachtwanderung</div><h2>🏮 Alle wieder gut zu Hause!</h2><div class="details">Stationen: <b>' + n + ' von ' + STATIONEN.length + '</b>' +
      (L.geschafft.mut ? '<br>🌑 Mutprobe bestanden' : '') + '<br>' + G.map(function (b) { return KERN.esc(b.name); }).join(', ') + ' und Lotte fanden es toll. <b>+Freundschaft</b></div>' + zeile +
      '<div class="details"><small>Die Ferienkinder schlafen heute bestimmt schnell ein. Für dich wird es auch Zeit fürs Bett!</small></div>',
      [{ text: '🌙 Gute Nacht!', aktion: function () { KERN.schliesseKarte(); ende(); } }]);
  }

  // Der Ausritt ruft das in jedem Bild. P = wo man ist: { x, z, y, tempo, kurs, sitzt, frei }
  // Zurück kommt, was der große Knopf anbietet und was oben links in der Kachel steht.
  function ausrittSchritt(dt, zeit, P) {
    if (!L || !W) return null;
    L.zeit += dt; L.t += dt;
    L.licht += (L.lichtZiel - L.licht) * Math.min(1, dt * 3);
    if (L.schnuppe > 0) L.schnuppe -= dt;
    bewegeKinder(dt, P);
    // Feuer flackert, Glühwürmchen blinken, die Eule dreht den Kopf
    flammen.forEach(function (f, i) { f.scale.set(1 + Math.sin(L.zeit * (9 + i * 4)) * 0.12, 1 + Math.sin(L.zeit * (13 + i * 5) + i) * 0.18, 1 + Math.cos(L.zeit * (8 + i * 3)) * 0.12); });
    if (wuermchen) {
      var pos = wuermchen.punkte.geometry.attributes.position, dunkel = 1 - L.licht;
      wuermchen.liste.forEach(function (w, i) {
        w.t += dt; var hell = Math.max(0, Math.sin(w.t * 0.9 + i)) * (0.35 + 0.65 * dunkel);
        w.an = hell; pos.setXYZ(i, w.x + Math.sin(w.t * 0.5 + i) * 0.6, w.y + Math.sin(w.t * 0.8 + i * 2) * 0.25, w.z + Math.cos(w.t * 0.4 + i) * 0.6);
      });
      pos.needsUpdate = true;
    }
    if (dinge.eule) dinge.eule.kopf.rotation.y = Math.sin(L.zeit * 0.4) * 1.1;
    var S = station(), aktion, kachel, ich = P;
    // ein Kind sagt ab und zu etwas
    L.spruch -= dt;
    if (L.spruch <= 0 && L.phase === 'hin' && L.t > 12 && kinder.length) { L.spruch = 24 + Math.random() * 18; var K0 = kinder[Math.floor(Math.random() * kinder.length)]; W.tipp(K0.wer.name + ': „' + SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)] + '“', 5); }
    // einmal bleibt das letzte Kind stehen, weil es sich nicht weitertraut
    if (L.angstBei > 0 && spurLang > L.angstBei && !L.angst && L.phase === 'hin' && kinder.length) {
      L.angstBei = -1; L.angst = kinder[kinder.length - 1]; L.angst.halt = true; KERN.klang('knapp');
    }
    if (L.angst) {
      var A = L.angst, nahA = Math.hypot(A.x - ich.x, A.z - ich.z);
      W.sage('Wartet mal! ' + A.wer.name + ' ist stehen geblieben und traut sich nicht weiter. Gehst du zurück und nimmst ' + (A.wer.junge ? 'ihn' : 'sie') + ' an die Hand?', 1.5);
      if (nahA < 2.6) aktion = { text: '🤝 ' + A.wer.name + ' an die Hand nehmen', tun: function () {
        A.halt = false; A.hand = true; L.angst = null; L.gerufen = false; L.t = 0;
        kinder.splice(kinder.indexOf(A), 1); kinder.unshift(A); neueSpur(ich);           // jetzt läuft das Kind gleich hinter einem
        PERSONEN.freund(A.wer.id, 1); KERN.klang('gut');
        KERN.meldung('🤝 ' + A.wer.name + ': „Danke! Mit dir zusammen ist es gar nicht mehr so dunkel.“', 'gut');
      } };
      maleSchleier(ich);
      return { aktion: aktion || null, kachel: REITEN.kachel('Nachtwanderung', '😟 ' + A.wer.name + ' wartet'), fest: true };
    }
    var weitWeg = weitestes(ich);
    if (S) {
      var nah = Math.hypot(S.x - ich.x, S.z - ich.z), naechste = STATIONEN[L.nr + 1];
      if (L.phase === 'hin') {
        // eine freiwillige Station lässt man einfach liegen, wenn man schon bei der nächsten ist
        if (S.frei && naechste && Math.hypot(naechste.x - ich.x, naechste.z - ich.z) < STATION_NAH) { L.uebersprungen[S.id] = true; L.nr++; L.gerufen = false; S = station(); nah = 99; }
        else if (nah < STATION_NAH) {
          if (weitWeg > GRUPPE_NAH) W.tipp('🏮 Warte kurz, bis alle Kinder da sind.', 1.5);
          else {
            if (!L.gerufen) { L.gerufen = true; W.sage(S.ruf, 9); if (S.klang) SOUND.spiel(S.klang, 0.7); }
            if (ich.frei) aktion = { text: S.knopf, tun: function () { beginne(S, ich); } };
          }
        } else if (weitWeg > 22) W.tipp('🏮 Die Kinder kommen nicht so schnell hinterher. Warte auf sie!', 1.5);
      } else laufe(S, ich, dt);
      if (L.phase !== 'hin' && S === station()) aktion = knopf(S, ich) || aktion;
      S = station();
      kachel = REITEN.kachel('Nachtwanderung', L.brot || (S ? S.bild + ' ' + (L.nr + 1) + ' / ' + STATIONEN.length + (L.phase === 'hin' ? ' · ' + Math.round(Math.hypot(S.x - ich.x, S.z - ich.z) / 5) * 5 + ' m' : '') : '🏡 zum Tor'));
    }
    if (!S) {
      // alle Stationen geschafft: zurück zum Tor
      if (L.phase === 'hin') { L.phase = 'heim'; W.tipp('🏡 Jetzt geht es nach Hause. Folge den Leuchtbändern bis zum Tor.', 7); }
      kachel = REITEN.kachel('Nachtwanderung', '🏡 zum Tor');
      if (L.phase === 'heim' && ich.z < -110 && Math.abs(ich.x) < 9) {
        if (weitWeg > GRUPPE_NAH) W.tipp('🏮 Warte am Tor, bis alle Kinder da sind.', 1.5);
        else aktion = { text: '🏡 Alle da? Zurück zum Hof', tun: feiere };
      }
    }
    // Wer vorher am Tor steht, darf abbrechen
    if (!aktion && L.phase === 'hin' && L.zeit > 15 && ich.z < -116 && Math.abs(ich.x) < 9) aktion = { text: '🏡 Abbrechen und heimgehen', tun: W.heim };
    maleSchleier(ich);
    return { aktion: aktion || null, kachel: kachel, fest: !!aktion || (L.phase !== 'hin' && L.phase !== 'heim' && L.phase !== 'satt') };
  }
  // Der Knopf an einer Station wurde gedrückt
  function beginne(S, P) {
    L.phase = 'schau'; L.t = 0;
    if (S.art === 'leuchte') { if (S.klang) SOUND.spiel(S.klang, 0.9); KERN.ton(880, 0.12, 'triangle', 0.1); }
    else if (S.art === 'dunkel') { L.lichtZiel = 0.08; KERN.ton(330, 0.2, 'sine', 0.1); }
    else if (S.art === 'quiz') sternKarte();
    else if (S.art === 'mut') { L.lichtZiel = 0.05; L.mut = true; KERN.ton(220, 0.4, 'sine', 0.12); W.sage('Laternen aus! Fasst euch an den Händen. Immer auf das Feuer zu.', 6); }
    else if (S.art === 'feuer') { var F = dinge.feuer, w = 0.2; W.sitz({ x: F.x + Math.sin(w) * 1.9, z: F.z + Math.cos(w) * 1.9, pose: 'sitzen', kurs: w + Math.PI, fx: Math.sin(1.25) * 1.9 - Math.sin(w) * 1.9, fz: Math.cos(1.25) * 1.9 - Math.cos(w) * 1.9, feuer: true }); L.phase = 'teig'; W.sage('Hier, für jeden ein Stock mit Teig. Halt ihn über die Glut, nicht mitten in die Flamme.', 7); }
    else if (S.art === 'wunsch') { L.schnuppe = 1.6; KERN.ton(1500, 0.5, 'sine', 0.06); }
  }
  // Was an einer Station von selbst weiterläuft
  function laufe(S, P, dt) {
    if (S.art === 'leuchte') {
      L.spot = Math.min(1, L.t / 0.8);
      var D = dinge[S.id];
      if (S.ding === 'igel' && D) { D.z += dt * 0.12; D.g.position.z = D.z; D.g.rotation.y = Math.sin(L.t * 2) * 0.2; }       // er trippelt langsam weiter
      if (L.t > 5) { L.spot = 0; fertig(S); }
    } else if (S.art === 'dunkel') {
      if (L.t > 7) fertig(S);
    } else if (S.art === 'mut') {
      var ziel = STATIONEN[L.nr + 1] || S;
      if (Math.hypot(ziel.x - P.x, ziel.z - P.z) < STATION_NAH) { W.lohn(MUT_LOHN, '🌑 Mutprobe bestanden!'); fertig(S); }
      else if (L.t > 45) { L.uebersprungen[S.id] = true; L.nr++; L.phase = 'hin'; L.gerufen = false; L.lichtZiel = 1; L.mut = false; W.sage('Das war lang genug im Dunkeln. Laternen wieder an!', 5); }
    } else if (S.art === 'feuer') {
      if (L.phase === 'brot') {
        L.brot = L.t < BROT_GOLD[0] ? '🥖 noch hell' : L.t < BROT_GOLD[1] ? '🥖 goldbraun!' : '🥖 wird dunkel …';
        if (L.t > BROT_GOLD[1] + 4) nimmBrot();
      }
      if ((L.phase === 'satt' || L.phase === 'teig') && !P.sitzt) { L.brot = ''; if (L.phase === 'satt') fertig(S); else { L.phase = 'hin'; L.gerufen = true; } }      // aufgestanden
    } else if (S.art === 'wunsch') {
      if (L.phase === 'schau' && L.t > 1.7) { L.phase = 'karte'; wunschKarte(); }
    }
  }
  function nimmBrot() {
    var t = L.t; L.brot = ''; L.phase = 'essen'; L.t = 0;
    if (t < BROT_GOLD[0]) { KERN.meldung('🥖 Innen noch ein bisschen teigig. Schmeckt trotzdem!', 'gut'); KERN.klang('knapp'); }
    else if (t < BROT_GOLD[1]) { W.lohn(2, '🥖 Goldbraun und knusprig. Perfekt!'); }
    else { KERN.meldung('🥖 Außen ganz schön schwarz. Abkratzen, dann geht es!', 'gut'); KERN.klang('knapp'); }
    setTimeout(function () { if (L && L.phase === 'essen') { L.phase = 'geschichte'; geschichte(0); } }, 2600);
  }
  // Der Knopf, solange an einer Station etwas läuft
  function knopf(S, P) {
    if (S.art === 'feuer' && L.phase === 'teig' && P.sitzt) return { text: '🥖 Stockbrot über die Glut halten', tun: function () { L.phase = 'brot'; L.t = 0; KERN.ton(500, 0.1, 'triangle', 0.1); } };
    if (S.art === 'feuer' && L.phase === 'brot') return { text: '😋 Stockbrot herausnehmen', tun: nimmBrot };
    if (S.art === 'mut' && L.phase === 'schau') return { text: '🏮 Lieber wieder Licht an', tun: function () { L.uebersprungen[S.id] = true; L.nr++; L.phase = 'hin'; L.gerufen = false; L.lichtZiel = 1; L.mut = false; W.sage('Kein Problem! Mit Licht ist es auch schön.', 4); } };
    return null;
  }

  // Für den Radar: die Stationen
  function radar(g, punkt, m) {
    if (!L) return;
    STATIONEN.forEach(function (S, nr) {
      var q = punkt(S.x, S.z); if (Math.hypot(q[0] - m, q[1] - m) > m - 16) return;
      g.globalAlpha = L.geschafft[S.id] || L.uebersprungen[S.id] ? 0.45 : 1; g.font = (nr === L.nr ? 24 : 18) + 'px sans-serif'; g.fillText(S.bild, q[0], q[1]); g.globalAlpha = 1;
    });
  }
  // Zeile für die Karte am Tor, wenn man vorzeitig heimgeht
  function heimText() {
    if (!L || L.phase === 'ende') return '';
    return '<div class="details">🏮 Die Nachtwanderung ist noch nicht zu Ende (' + Object.keys(L.geschafft).length + ' von ' + STATIONEN.length + ' Stationen). Wenn du jetzt heimgehst, kommen alle mit zurück.</div>';
  }
  // Zum Nachprüfen: Liegt eine Station oder ein Ding im Wasser?
  function pruefe() {
    if (!W) return ['erst eine Nachtwanderung starten'];
    var aus = [];
    STATIONEN.forEach(function (S) {
      if (W.boden(S.x, S.z) < W.wasser + 0.1) aus.push(S.id + ': Station im Wasser');
      if (S.ding && W.boden(S.dx, S.dz) < W.wasser + 0.1) aus.push(S.id + ': Ding im Wasser');
      var o = { x: S.x, z: S.z, radius: 0.35 }; W.grenze(o); if (Math.hypot(o.x - S.x, o.z - S.z) > 0.3) aus.push(S.id + ': Station steckt in einem Baum oder Hindernis');
    });
    return aus;
  }

  return {
    STATIONEN: STATIONEN, baueHof: baueHof, hinweis: hinweis, marke: marke, redeFuer: redeFuer, bereit: bereit, angebot: angebot, brichAuf: brichAuf, zurueck: zurueck,
    ausrittStart: ausrittStart, ausrittSchritt: ausrittSchritt, ausrittEnde: ausrittEnde, radar: radar, heimText: heimText, pruefe: pruefe,
    laeuft: function () { return !!L; }, zusage: function () { N.bereit = KALENDER.tag(); STAND.speichere(); },
    stand: function () { return N; }, zustand: function () { return { L: L, kinder: kinder, dinge: dinge, baender: baender, spur: spur, bild: bild }; }
  };
})();
