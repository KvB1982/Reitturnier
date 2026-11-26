// ============================================================
//  TECHNIK  -  Messen, Aufräumen, Fehler zeigen
//
//  Hier steht nichts vom Spiel selbst, sondern das Werkzeug drumherum:
//   1. Messanzeige: Wie flüssig läuft das Spiel? (einschalten: "?messen" hinter
//      die Adresse schreiben oder im Menü fünfmal schnell auf "🐴 Reitturnier" tippen)
//   2. Aufräumen: Verlässt man eine Welt, gibt sie ihren Platz auf der Grafikkarte frei.
//   3. Nur malen, was im Bild ist: Figuren hinter der Kamera werden ausgelassen.
//   4. Fehler zeigen: Geht etwas schief, sagt das Spiel Bescheid und schreibt es auf.
// ============================================================
var TECHNIK = (function () {
  'use strict';
  var renderer = null, kern = null;

  // ============================================================
  //  1. MESSANZEIGE
  // ============================================================
  var MESS_NAME = 'reitturnier_messen';
  var messAn = false, kasten = null;
  // m = die laufende halbe Sekunde, welten = was je Welt zusammenkam
  var m = { zeit: 0, bilder: 0, schlimm: 0 }, welten = {}, weltJetzt = '', weltSeit = 0;
  // Ruckler: Bilder, die länger als RUCK_AB Sekunden gedauert haben (höchstens RUCK_MAX werden gemerkt)
  var RUCK_AB = 0.1, RUCK_MAX = 20, ruckler = [], ruckVoll = false, vorF = 0, vorB = 0, vorP = 0;
  try { messAn = /[?&]messen/.test(location.search) || localStorage.getItem(MESS_NAME) === '1'; } catch (e) { /* egal */ }

  function zahl(n) { return n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' Mio.' : String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, '.'); }
  function messKasten() {
    if (kasten) return kasten;
    kasten = document.createElement('button');
    kasten.id = 'messen'; kasten.type = 'button';
    kasten.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:60;margin:0;padding:5px 8px;border:0;border-radius:8px;background:rgba(0,0,0,.62);color:#fff;' +
      'font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;text-align:left;white-space:pre;pointer-events:auto;min-width:0;box-shadow:none';
    kasten.addEventListener('click', function (e) { e.stopPropagation(); zeigeBericht(); });
    document.body.appendChild(kasten);
    return kasten;
  }
  function messSchalten(an) {
    messAn = an === undefined ? !messAn : !!an;
    try { localStorage.setItem(MESS_NAME, messAn ? '1' : '0'); } catch (e) { /* egal */ }
    if (kasten) kasten.style.display = messAn ? '' : 'none';
    return messAn;
  }
  // Wird nach jedem gemalten Bild aufgerufen. roh = so lange hat das Bild gedauert (Sekunden)
  function bild(roh, name, schaerfe) {
    if (!messAn || !renderer) return;
    if (name !== weltJetzt) { weltJetzt = name; weltSeit = 0; }
    weltSeit += roh;
    if (!(roh > 0) || roh > 1) return;                 // Fenster war weg: nicht mitzählen
    // Ruckler aufschreiben: Was ist in dem Bild passiert, das so lange gedauert hat?
    var Iv = renderer.info, jetztF = Iv.memory.geometries, jetztB = Iv.memory.textures, jetztP = Iv.programs ? Iv.programs.length : 0;
    if (roh > RUCK_AB && weltSeit > 3) {
      // Ist die Liste voll, fliegt der kürzeste Ruckler raus (wenn der neue länger ist)
      if (ruckler.length >= RUCK_MAX) { ruckVoll = true; var kl = 0; ruckler.forEach(function (r, i) { if (r.ms < ruckler[kl].ms) kl = i; }); if (ruckler[kl].ms < roh * 1000) ruckler.splice(kl, 1); }
      if (ruckler.length < RUCK_MAX) ruckler.push({ welt: name, ms: Math.round(roh * 1000), nach: Math.round(weltSeit), uhr: typeof KALENDER !== 'undefined' ? KALENDER.stunde() : -1,
        wetter: typeof STAND !== 'undefined' ? STAND.daten.wetter || '' : '', formen: jetztF - vorF, bilder: jetztB - vorB, programme: jetztP - vorP });
    }
    vorF = jetztF; vorB = jetztB; vorP = jetztP;
    m.zeit += roh; m.bilder++; if (roh > m.schlimm) m.schlimm = roh;
    if (m.zeit < 0.5) return;
    var I = renderer.info, fps = m.bilder / m.zeit;
    // Die ersten 3 Sekunden einer Welt zählen nicht: Da wird noch gebaut und geladen.
    if (weltSeit > 3) {
      var W = welten[name] || (welten[name] = { zeit: 0, bilder: 0, schlimm: 0, aufrufe: 0, dreiecke: 0, formen: 0, texturen: 0, schaerfeMin: 9 });
      W.zeit += m.zeit; W.bilder += m.bilder; W.schlimm = Math.max(W.schlimm, m.schlimm);
      W.aufrufe = Math.max(W.aufrufe, I.render.calls); W.dreiecke = Math.max(W.dreiecke, I.render.triangles);
      W.formen = Math.max(W.formen, I.memory.geometries); W.texturen = Math.max(W.texturen, I.memory.textures);
      W.schaerfeMin = Math.min(W.schaerfeMin, schaerfe);
    }
    var speicher = performance.memory ? '\nSpeicher ' + Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : '';
    messKasten().textContent = Math.round(fps) + ' Bilder/s  (längstes ' + Math.round(m.schlimm * 1000) + ' ms)\n' +
      zahl(I.render.calls) + ' Aufrufe · ' + zahl(I.render.triangles) + ' Dreiecke\n' +
      zahl(I.memory.geometries) + ' Formen · ' + zahl(I.memory.textures) + ' Bilder · Schärfe ' + schaerfe + speicher + '\n' + name + '  (tippen: Bericht)';
    kasten.style.display = '';
    m.zeit = 0; m.bilder = 0; m.schlimm = 0;
  }
  // Der Bericht als Text: zum Ansehen und zum Verschicken
  function bericht() {
    var z = ['Reitturnier – Messbericht', new Date().toLocaleString('de-DE'), navigator.userAgent, 'Bildschirm ' + window.innerWidth + ' × ' + window.innerHeight + ', Punktdichte ' + (window.devicePixelRatio || 1), ''];
    var namen = Object.keys(welten);
    if (!namen.length) z.push('Noch nichts gemessen (jede Welt braucht ein paar Sekunden).');
    namen.forEach(function (n) {
      var W = welten[n];
      z.push(n + ': ' + Math.round(W.bilder / W.zeit) + ' Bilder/s im Schnitt, längstes Bild ' + Math.round(W.schlimm * 1000) + ' ms, gemessen ' + Math.round(W.zeit) + ' s');
      z.push('   ' + zahl(W.aufrufe) + ' Aufrufe, ' + zahl(W.dreiecke) + ' Dreiecke, ' + zahl(W.formen) + ' Formen, ' + zahl(W.texturen) + ' Bilder, kleinste Schärfe ' + W.schaerfeMin);
    });
    if (ruckler.length) {
      z.push('', 'Ruckler (Bilder über ' + Math.round(RUCK_AB * 1000) + ' ms): ' + (ruckVoll ? 'die ' + ruckler.length + ' längsten' : ruckler.length));
      ruckler.forEach(function (r) {
        var uhr = r.uhr >= 0 ? Math.floor(r.uhr) + ':' + ('0' + Math.floor(r.uhr % 1 * 60)).slice(-2) + ' Uhr' : '';
        var neu = [r.formen > 0 ? '+' + r.formen + ' Formen' : '', r.bilder > 0 ? '+' + r.bilder + ' Bilder' : '', r.programme > 0 ? '+' + r.programme + ' Malprogramme' : ''].filter(Boolean).join(', ');
        z.push('   ' + r.welt + ', ' + r.ms + ' ms, nach ' + r.nach + ' s, ' + uhr + (r.wetter ? ', ' + r.wetter : '') + ': ' + (neu || 'nichts Neues auf der Grafikkarte'));
      });
    }
    if (typeof SOUND !== 'undefined' && SOUND.musikStand) { var ms = SOUND.musikStand(); z.push('', 'Musik: ' + (ms.jetzt || 'keine') + ', Weg ' + (ms.weg || '–') + (ms.alt ? ' (alter Weg eingestellt)' : '') + (ms.imSpeicher.length ? ', ausgepackt im Speicher: ' + ms.imSpeicher.join(', ') : '')); }
    if (typeof EREIGNISSE !== 'undefined') z.push('', EREIGNISSE.info() + (typeof PFERDE !== 'undefined' ? ', ' + PFERDE.alle().length + ' Pferde im Register' : ''));
    if (typeof SPEICHER !== 'undefined') z.push('', SPEICHER.info() + (typeof KALENDER !== 'undefined' ? ', ' + KALENDER.text() + ', ' + Math.round(KALENDER.wach()) + ' Spielstunden wach' : ''));
    var P = protokoll();
    z.push('', 'Fehler-Protokoll: ' + (P.length ? P.length + ' Einträge' : 'leer'));
    P.forEach(function (p) { z.push('   ' + p.wann + ' [' + p.wo + '] ' + p.was + (p.spur ? '\n      ' + p.spur.replace(/\n/g, '\n      ') : '')); });
    return z.join('\n');
  }
  function zeigeBericht() {
    var text = bericht(), knoepfe = [];
    if (navigator.share) knoepfe.push({ text: '📤 Teilen', klasse: 'zweit', aktion: function () { navigator.share({ title: 'Reitturnier – Messbericht', text: text }).catch(function () { /* abgebrochen */ }); } });
    else if (navigator.clipboard && navigator.clipboard.writeText) knoepfe.push({ text: '📋 Kopieren', klasse: 'zweit', aktion: function () { navigator.clipboard.writeText(text).then(function () { kern.meldung('Kopiert', 'knapp'); }, function () { /* egal */ }); } });
    if (typeof SOUND !== 'undefined' && SOUND.musikAlt) knoepfe.push({ text: SOUND.musikAlt() ? '🎵 Musik: alter Weg' : '🎵 Musik: Datenstrom', klasse: 'zweit', aktion: function () { SOUND.musikAlt(!SOUND.musikAlt()); zeigeBericht(); } });
    knoepfe.push({ text: 'Protokoll leeren', klasse: 'zweit', aktion: function () { protokollLeeren(); welten = {}; ruckler = []; ruckVoll = false; kern.schliesseKarte(); } });
    knoepfe.push({ text: 'Messanzeige aus', klasse: 'zweit', aktion: function () { messSchalten(false); kern.schliesseKarte(); } });
    knoepfe.push({ text: 'Schließen', aktion: function () { kern.schliesseKarte(); } });
    kern.zeigeKarte('mitte', '<h2>📏 Messbericht</h2><pre style="text-align:left;white-space:pre-wrap;word-break:break-word;font-size:12px;max-height:46vh;overflow:auto;user-select:text;-webkit-user-select:text">' + kern.esc(text) + '</pre>', knoepfe);
  }

  // ============================================================
  //  2. AUFRÄUMEN
  //  Formen, Bilder und Schatten einer Welt belegen Platz auf der Grafikkarte.
  //  raeume() gibt diesen Platz frei. Die Welt selbst bleibt gebaut: Kommt man
  //  wieder, schickt three.js alles von selbst neu zur Grafikkarte.
  //  Materialien bleiben liegen: Ihre kleinen Malprogramme neu zu übersetzen
  //  würde beim Wiederkommen lange ruckeln, und sie brauchen kaum Platz.
  // ============================================================
  function bilderVon(mat, tu) {
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach(function (einMat) {
      for (var k in einMat) { var t = einMat[k]; if (t && t.isTexture) tu(t); }
      if (einMat.uniforms) for (var u in einMat.uniforms) { var w = einMat.uniforms[u] && einMat.uniforms[u].value; if (w && w.isTexture) tu(w); }
    });
  }
  // behalte = Szenen, die weiter gebraucht werden. Was dort auch vorkommt, bleibt.
  function raeume(szene, behalte) {
    if (!szene) return { formen: 0, bilder: 0 };
    var bleibt = new Set(), weg = new Set(), n = { formen: 0, bilder: 0 };
    (behalte || []).forEach(function (s) {
      if (!s || s === szene) return;
      s.traverse(function (o) { if (o.geometry) bleibt.add(o.geometry); bilderVon(o.material, function (t) { bleibt.add(t); }); });
      if (s.background && s.background.isTexture) bleibt.add(s.background);
    });
    function frei(ding, art) { if (!ding || bleibt.has(ding) || weg.has(ding) || !ding.dispose) return; weg.add(ding); ding.dispose(); n[art]++; }
    szene.traverse(function (o) {
      if (o.geometry) frei(o.geometry, 'formen');
      bilderVon(o.material, function (t) { frei(t, 'bilder'); });
      if (o.isLight && o.shadow && o.shadow.map) o.shadow.dispose();                       // die Schatten-Karte (bei uns 2048 × 2048 Punkte)
      if (o.isSkinnedMesh && o.skeleton && o.skeleton.boneTexture) o.skeleton.dispose();   // die Knochen-Tabelle der Figuren
    });
    if (szene.background && szene.background.isTexture) frei(szene.background, 'bilder');
    return n;
  }

  // ============================================================
  //  3. NUR MALEN, WAS IM BILD IST
  //  Pferde und Menschen haben Knochen. Bei solchen Figuren weiß three.js nicht von selbst, wo sie
  //  gerade stehen, deshalb wurden sie bisher IMMER gemalt – auch hinter der Kamera, und noch einmal
  //  für die Schatten. Hier bekommt jede Figur eine unsichtbare Kugel um sich herum (großzügig, damit
  //  sie in jeder Pose hineinpasst). Liegt die Kugel nicht im Bild, wird die Figur nicht gemalt.
  //  Das gilt genauso für die Schatten-Karte: Wer zu weit weg steht, kommt dort nicht hinein.
  //  Abschalten zum Vergleichen: "?allesmalen" hinter die Adresse schreiben.
  // ============================================================
  var KUGEL_MAL = 1.3, KUGEL_RAND = 1.6, KUGELN_JE_RUNDE = 4;      // Kugel = 1,3-mal so groß wie die Figur plus 1,6 m Rand
  var sparAus = false, sparUhr = 0, sparSzene = null, kugeln = [], hilfsOrt = null, hilfsMatrix = null;
  try { sparAus = /[?&]allesmalen/.test(location.search); } catch (e) { /* egal */ }
  // Eine Figur ausmessen: Wo ist ihre Mitte, wie groß ist sie? Die Mitte merken wir uns vom Haupt-Knochen aus gesehen
  // (meist die Hüfte). Die Haut einer Figur folgt nämlich ihren Knochen, nicht der Stelle, an der sie in der Szene hängt.
  function kugelMessen(o) {
    try {
      var anker = o.skeleton && o.skeleton.bones[0];
      if (!anker) { o.userData.kugel = 'nein'; return; }
      o.updateWorldMatrix(true, false);
      o.updateMatrixWorld(true);                       // bringt bei Figuren mit Knochen auch die Umrechnung „Welt → Figur“ auf den neuesten Stand
      o.skeleton.bones.forEach(function (b) { b.updateWorldMatrix(true, false); });
      o.computeBoundingSphere();                       // misst die Figur in ihrer jetzigen Pose aus
      var k = o.boundingSphere, gross = o.matrixWorld.getMaxScaleOnAxis() || 1;
      if (!k || !(k.radius > 0) || !isFinite(k.radius)) { o.userData.kugel = 'nein'; o.boundingSphere = null; return; }
      var mitte = k.center.clone().applyMatrix4(o.matrixWorld);                    // Mitte in der Welt
      o.userData.kugelOrt = anker.worldToLocal(mitte).toArray();                   // ... und vom Haupt-Knochen aus gesehen
      o.userData.kugelRadius = k.radius * gross * KUGEL_MAL + KUGEL_RAND;          // in Metern
      o.frustumCulled = true; o.userData.kugel = 'ja';
    } catch (e) { o.userData.kugel = 'nein'; }
  }
  // Wird vor jedem Bild aufgerufen
  function sparen(szene, dt) {
    if (sparAus || !szene) return;
    var i, o;
    sparUhr -= dt;
    if (sparUhr <= 0 || szene !== sparSzene) {
      // Zweimal in der Sekunde nachsehen: Wer gehört zur Szene, wer ist neu und braucht noch eine Kugel?
      sparUhr = 0.5; sparSzene = szene; kugeln.length = 0;
      var neu = 0;
      szene.traverse(function (m) {
        if (!m.isSkinnedMesh || m.userData.kugel === 'nein') return;
        if (m.userData.kugel === 'ja' && m.frustumCulled && m.userData.kugelOrt) { kugeln.push(m); return; }
        if (neu >= KUGELN_JE_RUNDE || m.frustumCulled) return;
        // nur Figuren, die gerade wirklich da sind (unsichtbare haben vielleicht noch keine richtige Pose)
        for (var q = m; q; q = q.parent) if (!q.visible) return;
        neu++; kugelMessen(m);
        if (m.userData.kugel === 'ja') kugeln.push(m);
      });
    }
    // Jede Kugel an die Stelle rücken, an der ihre Figur jetzt steht
    if (!hilfsOrt) { hilfsOrt = new THREE.Vector3(); hilfsMatrix = new THREE.Matrix4(); }
    for (i = 0; i < kugeln.length; i++) {
      o = kugeln[i];
      var anker = o.skeleton.bones[0], k = o.boundingSphere, ort = o.userData.kugelOrt;
      if (!k || !anker) continue;
      hilfsOrt.set(ort[0], ort[1], ort[2]).applyMatrix4(anker.matrixWorld);
      hilfsMatrix.copy(o.matrixWorld).invert();
      k.center.copy(hilfsOrt).applyMatrix4(hilfsMatrix);
      k.radius = o.userData.kugelRadius / (o.matrixWorld.getMaxScaleOnAxis() || 1);
    }
  }

  // ============================================================
  //  4. FEHLER ZEIGEN
  //  Früher blieb das Spiel bei einem Fehler einfach stehen, und niemand wusste warum.
  //  Jetzt: aufschreiben (höchstens 12 Einträge, im Speicher des Geräts) und,
  //  wenn es nicht von selbst weitergeht, eine Karte mit "Zurück zum Menü" zeigen.
  // ============================================================
  var PROT_NAME = 'reitturnier_fehler', PROT_MAX = 12;
  var reihe = 0, karteOffen = false, letzterText = '', letzteZeit = 0;
  function protokoll() { try { return JSON.parse(localStorage.getItem(PROT_NAME) || '[]') || []; } catch (e) { return []; } }
  function protokollLeeren() { try { localStorage.removeItem(PROT_NAME); } catch (e) { /* egal */ } }
  function merke(fehler, wo) {
    var was = String(fehler && fehler.message ? fehler.message : fehler), jetzt = Date.now();
    if (was === letzterText && jetzt - letzteZeit < 5000) return;      // derselbe Fehler in jedem Bild: nur einmal aufschreiben
    letzterText = was; letzteZeit = jetzt;
    try {
      var P = protokoll();
      P.push({ wann: new Date().toLocaleString('de-DE'), wo: wo || '?', was: was.slice(0, 300), spur: fehler && fehler.stack ? String(fehler.stack).split('\n').slice(0, 5).join('\n').slice(0, 700) : '' });
      while (P.length > PROT_MAX) P.shift();
      localStorage.setItem(PROT_NAME, JSON.stringify(P));
    } catch (e) { /* voller Speicher: dann eben nicht */ }
    if (window.console) console.error('[' + wo + ']', fehler);
  }
  // Ein Fehler im Spiel-Schritt einer Welt. Gibt true zurück, solange die Welt angehalten ist.
  function weltFehler(fehler, wo) {
    merke(fehler, wo);
    reihe++;
    if (reihe >= 3 && !karteOffen) fehlerKarte(wo);       // dreimal hintereinander: Das wird nicht von selbst wieder gut
    return karteOffen;
  }
  function bildGut() { reihe = 0; }
  function fehlerKarte(wo) {
    karteOffen = true;
    try {
      kern.zeigeKarte('mitte', '<h2>🙈 Hoppla!</h2><p>Hier ist etwas schiefgegangen. Das ist nicht deine Schuld.</p><p style="font-size:14px">Der Fehler ist aufgeschrieben (' + kern.esc(wo) + '). Im Menü fünfmal auf „🐴 Reitturnier“ tippen zeigt das Protokoll.</p>', [
        { text: 'Zurück zum Menü', aktion: function () { karteOffen = false; reihe = 0; try { kern.schliesseKarte(); kern.insMenue(); } catch (e) { merke(e, 'insMenue'); location.reload(); } } },
        { text: 'Weiter versuchen', klasse: 'zweit', aktion: function () { karteOffen = false; reihe = 0; kern.schliesseKarte(); } }
      ]);
    } catch (e) { karteOffen = false; }
  }
  window.addEventListener('error', function (e) { merke(e.error || e.message, 'Seite'); });
  window.addEventListener('unhandledrejection', function (e) { merke(e.reason || 'Versprechen abgelehnt', 'Seite'); });

  // ---------- Die Grafik ist weg (iPad und iPhone nehmen sie einer App manchmal weg) ----------
  // three.js baut alles von selbst neu auf, sobald die Grafik zurück ist. Kommt sie nicht, hilft nur neu laden.
  var grafikWeg = false, grafikTimer = null;
  function wo() { return window.SPIEL && SPIEL.weltName ? SPIEL.weltName() : 'Spiel'; }
  function grafikWaechter(canvas) {
    canvas.addEventListener('webglcontextlost', function () {
      grafikWeg = true;
      merke('Grafik verloren (webglcontextlost)', wo());
      clearTimeout(grafikTimer);
      grafikTimer = setTimeout(function () {
        if (!grafikWeg) return;
        try { if (typeof STAND !== 'undefined') STAND.speichere(); } catch (e) { /* egal */ }
        kern.zeigeKarte('mitte', '<h2>😴 Die Grafik macht Pause</h2><p>Das Gerät hat dem Spiel das Bild weggenommen. Dein Spielstand ist gespeichert.</p>', [
          { text: 'Spiel neu laden', aktion: function () { location.reload(); } }
        ]);
      }, 4000);
    });
    canvas.addEventListener('webglcontextrestored', function () {
      grafikWeg = false; clearTimeout(grafikTimer);
      merke('Grafik wieder da (webglcontextrestored)', wo());
      try { kern.schliesseKarte(); kern.meldung('Weiter geht’s!', 'knapp'); } catch (e) { /* egal */ }
    });
  }

  // Fünfmal schnell auf die Überschrift im Menü tippen: Messanzeige an und aus
  function geheimKnopf() {
    var h = document.querySelector('#menue h1'), tipps = [];
    if (!h) return;
    h.addEventListener('click', function () {
      var jetzt = Date.now();
      tipps.push(jetzt); tipps = tipps.filter(function (t) { return jetzt - t < 2500; });
      if (tipps.length >= 5) { tipps = []; kern.meldung(messSchalten() ? '📏 Messanzeige an' : 'Messanzeige aus', 'knapp'); if (messAn) messKasten(); }
    });
  }

  return {
    // spiel.js meldet sich hier an, sobald es Bild und Karten gibt
    start: function (r, k) { renderer = r; kern = k; grafikWaechter(r.domElement); geheimKnopf(); if (messAn) messKasten(); },
    bild: bild, messen: messSchalten, misst: function () { return messAn; }, bericht: bericht, werte: function () { return welten; },
    raeume: raeume, sparen: sparen,
    merke: merke, weltFehler: weltFehler, bildGut: bildGut, protokoll: protokoll, protokollLeeren: protokollLeeren,
    grafikWeg: function () { return grafikWeg; }
  };
})();
