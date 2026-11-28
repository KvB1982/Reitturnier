// ============================================================
//  AUSREISSER  -  ein Pferd reißt aus (Stufe 2, Abenteuer)
//
//  Morgens steht eine Box offen und ist leer. Hufspuren führen
//  durch den Stall zum Tor im Süden und draußen weiter durch den
//  Ausritt. Unterwegs liegen Fundstücke, jemand hat etwas gesehen,
//  man hört ein Wiehern. Am Versteck steigt man ab, lockt das
//  Pferd mit einer Möhre, legt das Halfter an und bringt es heim.
//
//  Wohin ein Pferd laufen kann, steht in der Liste VERSTECKE.
//  Ein neues Versteck ist ein neuer Eintrag dort, kein neuer Code:
//
//    { id: 'eiche', wo: 'bei der alten Eiche', x: 46, z: -28,       // dort grast das Pferd
//      weg: [[0, -116], [10, -70], [38, -40]],                       // hier entlang liegen die Hufspuren
//      zeuge: { name: 'Die Försterin', x: 20, z: -62, outfit: {…}, text: 'Ein {fell} Pferd? Das lief Richtung {richtung}!' },
//      funde: [[0.35, 'aepfel'], [0.75, 'haar']] }                   // Fundstücke: nach wie viel vom Weg, und was
//
//  Der Stand liegt in STAND.daten.ausreisser:
//    laeuft = { pferd, versteck, tag, phase, funde, gefragt }
//    phase: 'box' (leere Box entdecken) → 'tor' (Spur bis zum Südtor) → 'suche' (draußen suchen) → 'heim' (eingefangen)
// ============================================================
var AUSREISSER = (function () {
  'use strict';
  var d = STAND.daten;
  d.ausreisser = d.ausreisser || {};
  var A = d.ausreisser;
  if (A.laeuft === undefined) A.laeuft = null;
  A.mal = A.mal || 0;            // so oft schon ein Pferd zurückgebracht
  A.zuletzt = A.zuletzt || 0;    // Spieltag vom letzten Ausreißer

  // ---------- Zahlen zum Einstellen ----------
  var AB_TAG = 3;                // frühestens an diesem Spieltag
  var PAUSE = 7;                 // höchstens einmal in so vielen Spieltagen
  var VON_UHR = 7, BIS_UHR = 15; // nur in dieser Zeit fällt es auf
  var LOHN = 15;                 // Münzen fürs Heimbringen
  var SCHEU = 15;                // näher als so viele Meter darf man nicht traben oder galoppieren
  var ZU_SCHNELL = 2.8;          // ab diesem Tempo (m/s) erschrickt der Ausreißer
  var LOCK_NAH = 8;              // so nah muss man zu Fuß sein, um die Möhre hinzuhalten
  var WIEHERN_WEIT = 140;        // ab hier hört man das Wiehern
  var SPUR_ABSTAND = 2.3;        // Meter zwischen zwei Hufabdrücken

  var FELL_WORT = { brauner: 'braunes', schimmel: 'weißes', rappe: 'schwarzes', palomino: 'goldenes', apfel: 'graues', schecke: 'geschecktes', fuchs: 'rotbraunes' };

  // ---------- Die Verstecke ----------
  var VERSTECKE = [
    { id: 'eiche', wo: 'bei der alten Eiche', x: 47, z: -27,
      weg: [[0, -116], [2, -100], [10, -70], [26, -52], [38, -40]],
      zeuge: { name: 'Die Försterin', x: 16, z: -66, outfit: { jacke: '#4a6b3a', hose: '#5a4a32', stiefel: '#2a1c12', haare: '#8a5a2a', frisur: 'zopf', art: 'frau' },
        text: 'Ein {fell} Pferd ohne Reiter? Ja! Das ist eben Richtung {richtung} getrabt. Zu den großen alten Bäumen, glaube ich.' },
      funde: [[0.3, 'aepfel'], [0.8, 'haar']] },
    { id: 'wiese', wo: 'auf der Blumenwiese', x: -80, z: -40,
      weg: [[0, -116], [-4, -100], [-40, -80], [-58, -62], [-70, -50]],
      zeuge: { name: 'Der Imker', x: -34, z: -74, outfit: { jacke: '#f1e9c9', hose: '#8a8f6a', stiefel: '#2a1c12', haare: '#bdbdbd', frisur: 'kurz', art: 'mann' },
        text: 'Ein {fell} Pferd? Das ist an meinen Bienen vorbeigelaufen, Richtung {richtung}. Dort blüht gerade alles, das schmeckt ihm sicher.' },
      funde: [[0.35, 'apfel'], [0.75, 'aepfel']] },
    { id: 'huette', wo: 'hinter der Waldhütte', x: 90, z: 16,
      weg: [[0, -116], [2, -100], [10, -70], [38, -40], [66, -12], [80, 10]],
      zeuge: { name: 'Die Wanderin', x: 44, z: -30, outfit: { jacke: '#c0392b', hose: '#3d4046', stiefel: '#5a3a1e', haare: '#3a2a1c', frisur: 'dutt', art: 'frau' },
        text: 'Oh ja, ein {fell} Pferd! Es ist den Weg weitergelaufen, Richtung {richtung}. Ich glaube, es wollte in den Wald.' },
      funde: [[0.3, 'aepfel'], [0.55, 'haar'], [0.85, 'apfel']] },
    { id: 'picknick', wo: 'am Picknickplatz', x: -3, z: 57,
      weg: [[0, -116], [-4, -100], [-40, -80], [-70, -44], [-62, -20], [-48, -4]],
      zeuge: { name: 'Der Angler', x: -52, z: -8, outfit: { jacke: '#3a6a8a', hose: '#5a5a3a', stiefel: '#2f4a2a', haare: '#7a4a2a', frisur: 'kurz', art: 'mann' },
        text: 'Ein {fell} Pferd? Das ist am See entlang, Richtung {richtung}. Es hat mir fast die Brote geklaut!' },
      funde: [[0.3, 'haar'], [0.6, 'aepfel'], [0.9, 'apfel']] },
    { id: 'bach', wo: 'am Bach', x: -142, z: 68,
      weg: [[0, -116], [-4, -100], [-40, -80], [-70, -44], [-110, -10], [-134, 26]],
      zeuge: { name: 'Die Schäferin', x: -104, z: -14, outfit: { jacke: '#7a5a3a', hose: '#4a4a3a', stiefel: '#2a1c12', haare: '#d9a55a', frisur: 'zopf', art: 'frau' },
        text: 'Ein {fell} Pferd, ganz allein? Das lief am Weg entlang Richtung {richtung}. Sicher hat es Durst und will zum Bach.' },
      funde: [[0.25, 'aepfel'], [0.55, 'apfel'], [0.85, 'haar']] },
    { id: 'muehle', wo: 'an der Windmühle', x: 214, z: 34,
      weg: [[0, -116], [2, -100], [10, -70], [38, -40], [66, -12], [80, 14], [130, 10], [160, 18]],
      zeuge: { name: 'Der Müller', x: 126, z: 5, outfit: { jacke: '#f4f1e8', hose: '#8a8a8a', stiefel: '#2a1c12', haare: '#5a3a1e', frisur: 'kurz', art: 'mann' },
        text: 'Ein {fell} Pferd? Das stand vorhin an meinen Hafersäcken! Dann lief es Richtung {richtung}, zur Mühle hinüber.' },
      funde: [[0.25, 'aepfel'], [0.5, 'haar'], [0.75, 'apfel'], [0.95, 'aepfel']] }
  ];
  var FUND_TEXT = {
    aepfel: '💩 Frische Pferdeäpfel! Hier ist {pferd} vorbeigekommen.',
    apfel: '🍎 Ein angeknabberter Apfel! Das war bestimmt {pferd}.',
    haar: '🧵 Ein Büschel Schweifhaare an einem Ast. Die Spur stimmt!'
  };

  function versteck(id) { for (var i = 0; i < VERSTECKE.length; i++) if (VERSTECKE[i].id === id) return VERSTECKE[i]; return null; }
  function pferdDef() { return A.laeuft ? PFERDE.stall().filter(function (p) { return p.id === A.laeuft.pferd; })[0] || null : null; }
  function pferdName() { var p = pferdDef(); return p ? p.name : 'das Pferd'; }
  function winkel(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function karteOffen() { var k = document.getElementById('karte'); return !!(k && k.className); }
  // Himmelsrichtung von (x0, z0) nach (x1, z1). Norden ist z kleiner, Osten ist x größer.
  function richtung(x0, z0, x1, z1) {
    var n = Math.round(Math.atan2(x1 - x0, -(z1 - z0)) / (Math.PI / 4));
    return ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'][(n + 8) % 8];
  }
  // Punkte alle "abstand" Meter entlang einer Linie aus Eckpunkten: [x, z, Kurs, Anteil 0 bis 1]
  function entlang(ecken, abstand) {
    var lang = 0, i, teile = [];
    for (i = 1; i < ecken.length; i++) { var l = Math.hypot(ecken[i][0] - ecken[i - 1][0], ecken[i][1] - ecken[i - 1][1]); teile.push(l); lang += l; }
    var aus = [], s = 0, nr = 0, rest = 0;
    while (nr < teile.length) {
      var a = ecken[nr], b = ecken[nr + 1], t = teile[nr] ? rest / teile[nr] : 0;
      aus.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1]), lang ? (s + rest) / lang : 0]);
      rest += abstand;
      while (nr < teile.length && rest > teile[nr]) { rest -= teile[nr]; s += teile[nr]; nr++; }
    }
    return aus;
  }

  // ---------- Hufspuren: alle Abdrücke sind zusammen eine einzige Form ----------
  var hufBild = null;
  function hufMaterial() {
    if (!hufBild) {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      g.strokeStyle = 'rgba(52,34,18,0.82)'; g.lineWidth = 11; g.lineCap = 'round';
      g.beginPath(); g.arc(32, 30, 19, Math.PI * 0.12, Math.PI * 0.88, true); g.stroke();       // ein Hufeisen-Bogen, unten offen
      hufBild = new THREE.CanvasTexture(c);
    }
    return new THREE.MeshBasicMaterial({ map: hufBild, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  function baueSpur(szene, zahl) {
    var geo = new THREE.PlaneGeometry(0.24, 0.26); geo.rotateX(-Math.PI / 2);
    var netz = new THREE.InstancedMesh(geo, hufMaterial(), zahl);
    netz.count = 0; netz.frustumCulled = false; netz.renderOrder = 2; netz.visible = false;
    szene.add(netz);
    return netz;
  }
  var hilf = new THREE.Object3D();
  // punkte = Ergebnis von entlang(); hoehe(x, z) = wie hoch der Boden dort ist; darf(x, z, anteil) = soll hier ein Abdruck hin?
  function legeSpur(netz, punkte, hoehe, darf) {
    var n = 0, max = netz.instanceMatrix.count;
    punkte.forEach(function (p, i) {
      if (n >= max || (darf && !darf(p[0], p[1], p[3], i))) return;
      var seite = i % 2 ? 0.16 : -0.16, x = p[0] + Math.cos(p[2]) * seite, z = p[1] - Math.sin(p[2]) * seite;
      hilf.position.set(x, hoehe(x, z) + 0.05, z); hilf.rotation.set(0, p[2] + Math.PI, 0); hilf.updateMatrix();
      netz.setMatrixAt(n++, hilf.matrix);
    });
    netz.count = n; netz.instanceMatrix.needsUpdate = true; netz.visible = n > 0;
  }

  // ============================================================
  //  Auf dem Hof
  // ============================================================
  var H = null, hofSpur = null, geprueft = -1, fertigIn = -1, hofZeichen = null;

  function hofPferd() { return H && A.laeuft ? H.pferde.filter(function (P) { return P.def.id === A.laeuft.pferd; })[0] || null : null; }
  function boxPunkt(P) { var k = HOFKINDER.knoten['box' + P.box.nr]; return k || [P.box.xc, P.box.v * 3.3]; }
  // Das Pferd ist weg: Box leer, Schild sagt Bescheid, Hufspuren bis zum Tor
  function zeigeHof() {
    var P = hofPferd();
    if (!P) { if (hofSpur) hofSpur.visible = false; return; }
    P.ort = 'fort'; P.tempo = 0; P.tier.wurzel.visible = false;
    if (H.S.fuehrt === P) H.S.fuehrt = null;
    H.zeigeZustand(P, true);
    if (!hofSpur) hofSpur = baueSpur(H.szene, 90);
    var namen = HOFKINDER.route('box' + P.box.nr, 'suedTor') || [], ecken = [[P.box.xc, P.box.zc]];
    namen.forEach(function (n) { var k = typeof n === 'string' ? HOFKINDER.knoten[n] : n; if (k) ecken.push([k[0], k[1]]); });
    ecken.push([0, 49]);
    legeSpur(hofSpur, entlang(ecken, 1.5), function () { return 0; }, function (x, z, t, i) { return i > 1 && i % 7 !== 5; });
  }
  function hofFertig(P) {
    if (hofSpur) hofSpur.visible = false;
    if (P) { P.tier.wurzel.visible = true; H.inBox(P); STAND.versorge(P.st); H.zeigeZustand(P, true); }
  }

  // Darf heute ein Pferd ausreißen? Gibt das Pferd zurück (oder null).
  function kandidat() {
    if (!H || A.laeuft) return null;
    var st = KALENDER.stunde();
    if (KALENDER.tag() < AB_TAG || KALENDER.tag() - A.zuletzt < PAUSE || st < VON_UHR || st >= BIS_UHR) return null;
    if (WETTER.regnet() || EREIGNISSE.laeuft()) return null;
    var frei = H.pferde.filter(function (P) { return P.ort === 'box' && !STAND.istMeins(P.def.id) && !HOFLEBEN.krank(P) && H.inBoxVon(H.S.x, H.S.z) !== P.box; });
    return frei.length ? frei[Math.floor(Math.random() * frei.length)] : null;
  }
  // Los geht's. Ohne Angaben würfelt das Spiel Pferd und Versteck (zum Testen kann man beides nennen).
  function starte(pferdId, versteckId) {
    if (!H || A.laeuft) return false;
    var P = pferdId ? H.pferde.filter(function (Q) { return Q.def.id === pferdId; })[0] : kandidat();
    if (!P) return false;
    var wahl = VERSTECKE.filter(function (v) { return v.id !== A.letztes; });
    var V = versteckId ? versteck(versteckId) : wahl[Math.floor(Math.random() * wahl.length)];
    if (!V) return false;
    A.laeuft = { pferd: P.def.id, versteck: V.id, tag: KALENDER.tag(), phase: 'box', funde: {}, gefragt: false };
    A.letztes = V.id;
    STAND.speichere();
    zeigeHof();
    KERN.meldung('❗ Im Stall stimmt etwas nicht!', 'rot');
    if (!SOUND.spiel('wiehern', 0.35, 1.1)) KERN.ton(700, 0.3, 'sawtooth', 0.05);
    return true;
  }
  // Am nächsten Tag hat Mia das Pferd gefunden (ohne Belohnung), damit keine Box für immer leer bleibt
  function gibAuf() {
    var name = pferdName(), P = hofPferd();
    A.zuletzt = KALENDER.tag(); A.laeuft = null; STAND.speichere();
    hofFertig(P);
    H.setzeModus('karte');
    KERN.zeigeKarte('mitte', '<div class="klein">Alles gut</div><h2>🐴 ' + KERN.esc(name) + ' ist wieder da</h2><div class="details">Mia hat ' + KERN.esc(name) + ' am Abend draußen gefunden und heimgebracht. ' +
      'Beim nächsten Mal findest du den Ausreißer bestimmt selbst: Folge den Hufspuren!</div>', [{ text: 'Zum Glück!', aktion: H.frei }]);
  }
  function feiere() {
    var P = hofPferd(), name = pferdName(), wer = STAND.betreuer(A.laeuft.pferd), V = versteck(A.laeuft.versteck);
    A.mal++; A.zuletzt = KALENDER.tag(); A.laeuft = null;
    hofFertig(P);
    var zeilen = '';
    if (PERSONEN.brief(wer)) { PERSONEN.freund(wer, 3); zeilen += '<div class="lohn">' + PERSONEN.herzText(wer) + ' <small>(' + KERN.esc(wer) + ')</small></div>'; }
    zeilen += STAND.belohne(LOHN, 'Ausreißer heimgebracht');
    d.merker = d.merker || {}; d.merker.ausreisser = true;
    STAND.speichere();
    KERN.klang('fanfare');
    H.setzeModus('karte');
    KERN.zeigeKarte('mitte', '<div class="klein">Geschafft</div><h2>🌟 ' + KERN.esc(name) + ' ist wieder zu Hause!</h2><div class="details">Du hast die Spur gelesen und ' + KERN.esc(name) + ' ' + KERN.esc(V ? V.wo : 'draußen') +
      ' gefunden. Jetzt steht ' + KERN.esc(name) + ' wieder in der Box und mampft Heu. ' + KERN.esc(wer) + ' ist überglücklich!' + (A.mal > 1 ? '<br><small>Schon ' + A.mal + ' Ausreißer heimgebracht.</small>' : '') + '</div>' + zeilen,
      [{ text: 'Juhu!', aktion: H.frei }]);
  }

  function baueHof(ctx) { H = ctx; if (A.laeuft) zeigeHof(); }
  // jedes Mal, wenn man den Hof betritt
  function hofStart() {
    if (!H || !A.laeuft) return;
    zeigeHof();
    if (A.laeuft.phase === 'heim') fertigIn = 1.2;             // gleich kommt die Karte "wieder zu Hause"
  }
  function hofSchritt(dt) {
    if (!H) return;
    if (!A.laeuft) {
      var st = Math.floor(KALENDER.wach() * 4);                // viermal je Spielstunde nachsehen
      if (st === geprueft) return;
      geprueft = st;
      if (Math.random() < 0.5 && kandidat()) starte();
      return;
    }
    var L = A.laeuft, P = hofPferd(), S = H.S;
    if (!P) { A.laeuft = null; return; }
    if (P.ort !== 'fort') zeigeHof();
    if (fertigIn > 0) { fertigIn -= dt; if (fertigIn <= 0) { if (karteOffen()) fertigIn = 0.5; else feiere(); } return; }
    if (L.phase !== 'heim' && KALENDER.tag() > L.tag && !karteOffen()) return gibAuf();
    if (L.phase === 'box') {
      var b = boxPunkt(P);
      if (Math.hypot(S.x - b[0], S.z - b[1]) < 2.6 || Math.hypot(S.x - P.box.xc, S.z - P.box.zc) < 2.6) {
        L.phase = 'tor'; STAND.speichere();
        KERN.meldung('😮 Die Box von ' + P.def.name + ' ist leer!', 'rot'); KERN.klang('knapp');
      }
    } else if (L.phase === 'tor' && Math.hypot(S.x, S.z - 44.5) < 4.5) {
      L.phase = 'suche'; STAND.speichere();
      KERN.meldung('🚪 Das Tor steht offen! Die Spur führt hinaus.', 'perfekt'); KERN.klang('gut');
    }
  }
  function hinweis() {
    if (!A.laeuft || !H) return null;
    var n = pferdName(), ph = A.laeuft.phase;
    if (ph === 'box') return '❗ Aus dem Stall kam ein lautes Poltern. Schau in der Stallgasse nach, ob alle Pferde in ihren Boxen stehen. Das ❗ zeigt dir die Stelle.';
    if (ph === 'tor') return '🐾 ' + n + ' ist ausgerissen! Am Boden siehst du Hufspuren. Folge ihnen durch den Stall bis zum Tor im Süden.';
    if (ph === 'suche') return '🐾 Die Spur von ' + n + ' führt durch das Südtor hinaus. Reite oder geh hinterher und folge draußen den Hufspuren.';
    return null;
  }
  function marke() {
    if (!A.laeuft || !H) return null;
    var P = hofPferd(), ph = A.laeuft.phase;
    if (!P) return null;
    if (ph === 'box') { var b = boxPunkt(P); return { x: b[0], z: b[1], art: 'ort' }; }
    if (ph === 'tor' || ph === 'suche') return { x: 0, z: 45.5, art: 'ort' };
    return null;
  }

  // ============================================================
  //  Draußen im Ausritt
  // ============================================================
  var W = null, spur = null, tier = null, R = null, strick = null, zeugeFigur = null, zeugeSchild = null, fundNetze = [], fundOrte = [];
  var Z = null;          // was gerade draußen los ist (nur für diesen Ausritt)

  function baueAusritt() {
    spur = baueSpur(W.szene, 260);
    tier = HERDE.bauePferd({ fell: 'brauner', saat: 57 }); tier.setzeSattel(false); tier.setzeZaum(false); W.szene.add(tier.wurzel);
    R = REITEN.neu(tier, { hoehe: W.hoehe, grenze: W.grenze, herde: true, drehung: 2.4, laut: 0.3, beschleunigung: 4.5 });
    strick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x3a2a1c }));
    strick.frustumCulled = false; strick.visible = false; W.szene.add(strick);
    zeugeSchild = BAU.schwebeText('❓', 0.6, { schrift: 60 }); zeugeSchild.visible = false; W.szene.add(zeugeSchild);
  }
  function baueFund(art) {
    var g = new THREE.Group(), i;
    if (art === 'aepfel') for (i = 0; i < 5; i++) { var m = BAU.netz(new THREE.DodecahedronGeometry(0.11, 0), 0x4a3320, g, (i % 3) * 0.17 - 0.17, 0.08, Math.floor(i / 3) * 0.18 - 0.08); m.scale.y = 0.7; }
    else if (art === 'apfel') { BAU.netz(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 1.5), 0xd93a2b, g, 0, 0.12, 0); BAU.netz(new THREE.SphereGeometry(0.1, 8, 6), 0xf6efd0, g, 0.03, 0.12, 0.03); }
    else { BAU.walze(0.03, 0.04, 1.1, 0x5a3a1e, g, 0, 0.55, 0); for (i = 0; i < 5; i++) { var h = BAU.kasten(0.015, 0.42, 0.015, 0x1c1410, g, 0.05 + i * 0.012, 0.78, (i - 2) * 0.02); h.rotation.z = -0.5 - i * 0.07; } }
    var lupe = BAU.schwebeText('🔎', 0.5, { schrift: 60 }); lupe.position.y = 1.5; g.add(lupe); g.userData.lupe = lupe;
    return g;
  }
  function raeumeAusritt() {
    if (!spur) return;
    spur.visible = false; tier.wurzel.visible = false; strick.visible = false; zeugeSchild.visible = false;
    if (zeugeFigur) zeugeFigur.wurzel.visible = false;
    fundNetze.forEach(function (g) { g.visible = false; });
    Z = null;
  }
  // ctx = was die Welt Ausritt uns leiht: { szene, hoehe, boden, wasser, rand, grenze, tipp, sage, lohn }
  function ausrittStart(ctx) {
    W = ctx;
    if (!A.laeuft) { raeumeAusritt(); return; }
    var L = A.laeuft, V = versteck(L.versteck), def = pferdDef();
    if (!V || !def) { raeumeAusritt(); return; }
    if (!spur) baueAusritt();
    if (L.phase === 'box' || L.phase === 'tor') { L.phase = 'suche'; STAND.speichere(); }      // wer gleich hinausreitet, sucht eben draußen
    // Hufspuren: am Anfang dicht, dann mit Lücken, das letzte Stück fehlt (dort helfen Zeuge, Wiehern und "wärmer")
    var punkte = entlang(V.weg, SPUR_ABSTAND);
    legeSpur(spur, punkte, W.hoehe, function (x, z, t, i) { return W.boden(x, z) > W.wasser + 0.05 && (t < 0.3 || Math.floor(i / 7) % 2 === 0); });
    // Fundstücke am Weg
    fundOrte = V.funde.map(function (f, nr) {
      var p = punkte[Math.min(punkte.length - 1, Math.floor(f[0] * (punkte.length - 1)))], seite = nr % 2 ? 1.1 : -1.1;
      return { x: p[0] + Math.cos(p[2]) * seite, z: p[1] - Math.sin(p[2]) * seite, art: f[1], nr: nr };
    });
    fundOrte.forEach(function (f, nr) {
      var g = fundNetze[nr];
      if (!g || g.userData.art !== f.art) { if (g) W.szene.remove(g); g = fundNetze[nr] = baueFund(f.art); g.userData.art = f.art; W.szene.add(g); }
      g.position.set(f.x, W.hoehe(f.x, f.z), f.z); g.visible = true; g.userData.lupe.visible = !L.funde[nr];
    });
    for (var i = fundOrte.length; i < fundNetze.length; i++) fundNetze[i].visible = false;
    // Wer hat etwas gesehen?
    if (zeugeFigur) W.szene.remove(zeugeFigur.wurzel);
    zeugeFigur = baueFigur(V.zeuge.outfit, { helm: false });
    zeugeFigur.wurzel.position.set(V.zeuge.x, W.hoehe(V.zeuge.x, V.zeuge.z), V.zeuge.z); zeugeFigur.setzePose('steh', true);
    W.szene.add(zeugeFigur.wurzel);
    zeugeSchild.position.set(V.zeuge.x, W.hoehe(V.zeuge.x, V.zeuge.z) + 2.6, V.zeuge.z); zeugeSchild.visible = !L.gefragt;
    // der Ausreißer selbst
    tier.setzeFell(def.fell); tier.setzeSattel(false); tier.setzeZaum(L.phase === 'heim', false); tier.setzeKopfTief(1);
    tier.wurzel.visible = true;
    R.setze(V.x, V.z, 1.3);
    Z = { V: V, def: def, lage: L.phase === 'heim' ? 'mit' : 'grast', ziel: null, weit: 1e9, weitAlt: 1e9, warm: '', warmZeit: 2, wiehern: 6, tippZeit: 4, gesehen: false, flucht: 0, wartet: 0, start: true };
  }
  function ausrittEnde() { raeumeAusritt(); }

  // Wohin läuft das Pferd, wenn es erschrickt? Ein Stück weg von der Spielerin, aber nie weit vom Versteck.
  function fluchtZiel(s) {
    var V = Z.V, w0 = Math.atan2(R.x - s.x, R.z - s.z), i, x, z;
    for (i = 0; i < 8; i++) {
      var w = w0 + (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 0.7;
      x = V.x + Math.sin(w) * 26; z = V.z + Math.cos(w) * 26;
      if (W.boden(x, z) > W.wasser + 0.3 && x > W.rand.x0 + 8 && x < W.rand.x1 - 8 && z > W.rand.z0 + 8 && z < W.rand.z1 - 8) return [x, z];
    }
    return [V.x, V.z];
  }
  function laufeZu(dt, zeit, zx, zz, tempo, nah) {
    var dx = zx - R.x, dz = zz - R.z, e = Math.hypot(dx, dz);
    R.wunsch = e > nah ? Math.min(tempo, 0.8 + e * 1.4) : 0;
    R.schritt(dt, e > nah ? Math.max(-1, Math.min(1, winkel(Math.atan2(dx, dz) - R.kurs) * 2.4)) : 0, zeit);
    return e;
  }
  function halfterAn() {
    var L = A.laeuft;
    L.phase = 'heim'; STAND.speichere();
    Z.lage = 'mit'; tier.setzeZaum(true, false); tier.setzeKopfTief(0);
    spur.visible = false; zeugeSchild.visible = false;
    KERN.klang('perfekt'); KERN.meldung('🪢 Geschafft! ' + Z.def.name + ' kommt mit.', 'perfekt');
    SOUND.spiel('wiehern', 0.5, 1, 0.3);
    W.sage('Du hast ' + Z.def.name + ' gefunden! Jetzt bringen wir alle zusammen nach Hause. Das 🏡 auf dem Radar zeigt den Weg.', 9);
  }
  // Jedes Bild. s = wo die Spielerin ist: { x, z, y, tempo, kurs, blick, fuss, frei }
  // Zurück kommt, was die Welt anzeigen soll: { aktion: { text, tun }, kachel: 'HTML' } (oder null)
  function ausrittSchritt(dt, zeit, s) {
    if (!Z || !A.laeuft) return null;
    var L = A.laeuft, V = Z.V, name = Z.def.name, aus = { aktion: null, kachel: '' };
    var weit = Math.hypot(R.x - s.x, R.z - s.z);
    if (zeugeFigur) zeugeFigur.bewege(dt);
    fundNetze.forEach(function (g, n) { if (g.visible && g.userData.lupe.visible) g.userData.lupe.position.y = 1.5 + Math.sin(zeit * 3 + n) * 0.1; });

    // ---------- eingefangen: das Pferd läuft am Strick mit ----------
    if (Z.lage === 'mit') {
      var zx = s.x - Math.sin(s.kurs) * 2.4 - Math.cos(s.kurs) * 1.9, zz = s.z - Math.cos(s.kurs) * 2.4 + Math.sin(s.kurs) * 1.9;
      if (weit > 55) R.setze(zx, zz, s.kurs);
      laufeZu(dt, zeit, zx, zz, 11, 1.1);
      if (s.fuss) {
        var kopf = tier.knochen.jaw001 || tier.knochen.skull, pos = strick.geometry.attributes.position;
        if (kopf) { kopf.getWorldPosition(hilf.position); pos.setXYZ(0, s.x, s.y + 0.95, s.z); pos.setXYZ(1, hilf.position.x, hilf.position.y - 0.05, hilf.position.z); pos.needsUpdate = true; strick.visible = true; }
      } else strick.visible = false;
      Z.tippZeit -= dt;
      if (Z.tippZeit <= 0) { Z.tippZeit = 40; W.tipp('🏡 Bring ' + name + ' nach Hause: zurück zum Tor am Pferdehof. Der Radar oben rechts zeigt den Weg.', 6); }
      aus.kachel = REITEN.kachel('Ausreißer', '🪢 ' + KERN.esc(name) + ' kommt mit');
      return aus;
    }

    // ---------- Fundstücke am Weg ----------
    fundOrte.forEach(function (f) {
      if (L.funde[f.nr] || Math.hypot(s.x - f.x, s.z - f.z) > 3.6) return;
      L.funde[f.nr] = true; fundNetze[f.nr].userData.lupe.visible = false; STAND.speichere();
      W.lohn(1, FUND_TEXT[f.art].replace('{pferd}', name));
    });
    // ---------- Zeuge fragen ----------
    var ze = V.zeuge, zw = Math.hypot(s.x - ze.x, s.z - ze.z);
    if (zw < 14) zeugeFigur.wurzel.rotation.y = Math.atan2(s.x - ze.x, s.z - ze.z);
    if (zw < 6 && s.tempo < 1.5 && s.frei) aus.aktion = { text: '💬 ' + ze.name.replace(/^(Der|Die) /, '') + ' fragen', tun: function () {
      var text = ze.text.replace('{fell}', FELL_WORT[Z.def.fell] || 'fremdes').replace('{richtung}', richtung(ze.x, ze.z, V.x, V.z));
      if (!L.gefragt) { L.gefragt = true; STAND.speichere(); zeugeSchild.visible = false; KERN.klang('gut'); }
      zeugeFigur.setzePose('winken'); setTimeout(function () { if (zeugeFigur) zeugeFigur.setzePose('steh'); }, 2600);
      W.tipp('💬 ' + ze.name + ': „' + text + '“', 11);
    } };

    // ---------- der Ausreißer ----------
    if (Z.lage === 'grast') {
      R.wunsch = 0; R.schritt(dt, 0, zeit); tier.setzeKopfTief(weit < 20 ? 0.2 : 1);
      if (weit < 40 && !Z.gesehen) { Z.gesehen = true; W.sage('Da! Da vorne steht ' + name + '! Ganz ruhig jetzt, nur im Schritt näher gehen.', 7); KERN.klang('gut'); }
      if (weit < SCHEU && s.tempo > ZU_SCHNELL && !s.fuss) {
        Z.lage = 'flieht'; Z.ziel = fluchtZiel(s); Z.flucht++;
        KERN.meldung('😳 Zu schnell! ' + name + ' erschrickt und läuft ein Stück weg.', 'knapp'); SOUND.spiel('wiehern', 0.6, 1.1);
        W.sage('Hoppla, wir waren zu schnell. Im Schritt hinreiten, dann absteigen und zu Fuß weiter.', 7);
      } else if (weit < LOCK_NAH && s.fuss && s.frei) {
        aus.aktion = { text: '🥕 ' + name + ' mit einer Möhre locken', tun: function () { Z.lage = 'kommt'; Z.wartet = 0; KERN.ton(660, 0.1, 'triangle', 0.14); KERN.meldung('🥕 „Komm, ' + name + ', schau mal, was ich habe!“', 'gut'); } };
      } else if (weit < 14 && !s.fuss && s.tempo < 1) {
        Z.tippZeit -= dt; if (Z.tippZeit <= 0) { Z.tippZeit = 9; W.tipp('🥾 Steig ab (Knopf rechts unten) und geh zu Fuß zu ' + name + '. Dann kannst du es mit einer Möhre locken.', 6); }
      }
    } else if (Z.lage === 'flieht') {
      tier.setzeKopfTief(0);
      if (laufeZu(dt, zeit, Z.ziel[0], Z.ziel[1], 7.5, 1.5) < 1.6) { Z.lage = 'grast'; }
    } else if (Z.lage === 'kommt') {
      tier.setzeKopfTief(0);
      if (!s.fuss || weit > 16) { Z.lage = 'grast'; }
      else {
        var e = laufeZu(dt, zeit, s.x + Math.sin(s.kurs) * 1.5, s.z + Math.cos(s.kurs) * 1.5, 1.7, 0.5);
        if (e < 0.9 || weit < 2.3) { Z.wartet += dt; if (s.frei) aus.aktion = { text: '🪢 ' + name + ' das Halfter anlegen', tun: halfterAn }; }
      }
    }

    // ---------- Wiehern in der Ferne ----------
    Z.wiehern -= dt;
    if (Z.wiehern <= 0 && weit < WIEHERN_WEIT && weit > 22 && Z.lage === 'grast') {
      Z.wiehern = 16 + Math.random() * 8;
      var rel = Math.round(winkel(Math.atan2(R.x - s.x, R.z - s.z) - s.blick) / (Math.PI / 4));
      var pfeil = { '0': '⬆️ vor dir', '1': '↖️ links vorn', '2': '⬅️ links', '3': '↙️ links hinten', '4': '⬇️ hinter dir', '-4': '⬇️ hinter dir', '-1': '↗️ rechts vorn', '-2': '➡️ rechts', '-3': '↘️ rechts hinten' }[rel];
      if (!SOUND.spiel('wiehern', Math.max(0.12, 0.7 * (1 - weit / WIEHERN_WEIT)), 1)) KERN.ton(760, 0.35, 'sawtooth', 0.05);
      W.tipp('🐴 Ein Wiehern! Es kommt von ' + pfeil + '.', 5);
    }
    // ---------- wärmer oder kälter ----------
    Z.warmZeit -= dt;
    if (Z.warmZeit <= 0) {
      Z.warmZeit = 1.5;
      if (weit < Z.weitAlt - 5) { Z.warm = weit < 45 ? '🔥 heiß!' : '☀️ wärmer'; Z.weitAlt = weit; }
      else if (weit > Z.weitAlt + 5) { Z.warm = '❄️ kälter'; Z.weitAlt = weit; }
      else if (!Z.warm) Z.warm = '🐾 Spur suchen';
    }
    if (Z.start) { Z.start = false; Z.tippZeit = 9; setTimeout(function () { if (Z) W.tipp('🐾 ' + name + ' ist ausgerissen! Folge den Hufspuren am Boden. Fundstücke 🔎 und Leute am Weg ❓ helfen dir weiter.', 9); }, 6500); }
    aus.kachel = REITEN.kachel('Ausreißer ' + KERN.esc(name), Z.gesehen ? '👀 im Schritt hin!' : Z.warm || '🐾 Spur suchen');
    return aus;
  }
  // Der Radar zeigt gefundene Fundstücke, den Zeugen und (erst wenn man es gesehen hat) das Pferd
  function radar(g, punkt, m) {
    if (!Z || !A.laeuft) return;
    var L = A.laeuft;
    function mal(zeichen, x, z, gr) { var q = punkt(x, z); if (Math.hypot(q[0] - m, q[1] - m) > m - 16) return; g.font = (gr || 20) + 'px sans-serif'; g.fillText(zeichen, q[0], q[1]); }
    fundOrte.forEach(function (f) { if (L.funde[f.nr]) mal('🐾', f.x, f.z, 18); });
    if (Z.lage !== 'mit') mal(L.gefragt ? '💬' : '❓', Z.V.zeuge.x, Z.V.zeuge.z, 22);
    if (Z.gesehen || Z.lage === 'mit') mal('🐴', R.x, R.z, 24);
  }
  // Zeile für die Karte "Das war schön!" am Tor
  function heimText() {
    if (!Z || !A.laeuft) return '';
    return Z.lage === 'mit' ? '<div class="lohn">🐴 ' + KERN.esc(Z.def.name) + ' kommt mit nach Hause!</div>'
      : '<div class="details"><small>🐾 ' + KERN.esc(Z.def.name) + ' ist noch irgendwo hier draußen. Bis heute Abend kannst du weitersuchen.</small></div>';
  }

  return {
    VERSTECKE: VERSTECKE, baueHof: baueHof, hofStart: hofStart, hofSchritt: hofSchritt, hinweis: hinweis, marke: marke, starte: starte,
    ausrittStart: ausrittStart, ausrittSchritt: ausrittSchritt, ausrittEnde: ausrittEnde, radar: radar, heimText: heimText,
    laeuft: function () { return !!A.laeuft; }, pferdId: function () { return A.laeuft ? A.laeuft.pferd : null; },
    stand: function () { return A; }, zustand: function () { return { Z: Z, R: R, fundOrte: fundOrte, spur: spur, hofSpur: hofSpur }; }
  };
})();
