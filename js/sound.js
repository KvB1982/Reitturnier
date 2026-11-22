// ============================================================
//  SOUND  -  echte Geräusche (Hufe, Wiehern, Vögel, Regen, ...)
// ============================================================
//  Die Geräusche liegen als Text in sounds/sounds.js (alle CC0,
//  Quellen in sounds/CREDITS.md).
//
//  Benutzen:
//    SOUND.spiel('wiehern')            einmal abspielen (nimmt zufällig wiehern1, wiehern2, ...)
//    SOUND.spiel('hund', 0.6, 1.1)     leiser (0..1) und etwas höher (Tempo)
//    SOUND.schleife('bach', 0.5)       Dauergeräusch: jedes Bild aufrufen, sonst wird es von selbst leise
//
//  Hintergrundmusik: liegt als MP3 im Ordner musik/ (Quellen in musik/CREDITS.md).
//  Welche Musik läuft, sucht sich das Spiel selbst aus (Menü, Hof, Zimmer, Ausritt, Dressur ...).
//
//  Ton-Knopf: laut mit Musik -> leise mit Musik -> nur Geräusche -> aus (wird gemerkt).
// ============================================================
var SOUND = (function () {
  var ctx = null, haupt = null;
  var puffer = {}, gruppen = {}, schleifen = {};
  var entsperrt = false, geladen = false;
  var STUFEN = [{ laut: 1, musik: true, bild: '🎵🔊', text: 'Ton laut, mit Musik' }, { laut: 0.4, musik: true, bild: '🎵🔉', text: 'Ton leise, mit Musik' },
    { laut: 1, musik: false, bild: '🔊', text: 'Nur Geräusche, keine Musik' }, { laut: 0, musik: false, bild: '🔇', text: 'Ton aus' }];
  var stufe = 0;
  try {
    if (localStorage.getItem('reitturnier_ton') === 'false') stufe = 3;
    else if (localStorage.getItem('reitturnier_laut') === '1') stufe = 1;
    else if (localStorage.getItem('reitturnier_laut') === '2') stufe = 2;
  } catch (e) { /* egal */ }

  function an() { return stufe < 3; }
  function kontext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      haupt = ctx.createGain();
      haupt.gain.value = STUFEN[stufe].laut;
      haupt.connect(ctx.destination);
    }
    return ctx;
  }
  function ausgang() { kontext(); return haupt; }
  function weiter() {
    stufe = (stufe + 1) % STUFEN.length;
    try { localStorage.setItem('reitturnier_ton', JSON.stringify(an())); localStorage.setItem('reitturnier_laut', String(stufe)); } catch (e) { /* egal */ }
    if (haupt) haupt.gain.setTargetAtTime(STUFEN[stufe].laut, ctx.currentTime, 0.05);
    if (an()) spiel('klick', 0.6);
    return an();
  }

  // ---------- Laden: Text -> Töne (erst nach dem ersten Tippen, vorher darf der Browser nicht) ----------
  function zuPuffer(text) {
    var roh = atob(text), n = roh.length, feld = new Uint8Array(n);
    for (var i = 0; i < n; i++) feld[i] = roh.charCodeAt(i);
    return feld.buffer;
  }
  function ladeAlle() {
    if (geladen || typeof SOUNDDATEN === 'undefined') return;
    geladen = true;
    var liste = [];
    // die wichtigsten zuerst
    ['klick', 'muenze', 'trab1', 'trab2', 'trab3', 'trab4', 'schritt1', 'schritt2', 'schritt3', 'schritt4'].forEach(function (n) { if (SOUNDDATEN.ton[n]) liste.push([n, null]); });
    Object.keys(SOUNDDATEN.schleife).forEach(function (n) { liste.push([n, SOUNDDATEN.schleife[n]]); });
    Object.keys(SOUNDDATEN.ton).forEach(function (n) { if (!liste.some(function (e) { return e[0] === n && !e[1]; })) liste.push([n, null]); });
    function naechster() {
      var e = liste.shift();
      if (!e) return;
      var name = e[0], S = e[1], text = S ? S.daten : SOUNDDATEN.ton[name];
      var fertig = function (p) {
        if (p) {
          if (S) schleifen[name] = { puffer: p, start: S.start, dauer: S.dauer, quelle: null, regler: null, ziel: 0, zuletzt: -9, laut: 0 };
          else { puffer[name] = p; var g = name.replace(/\d+$/, ''); (gruppen[g] = gruppen[g] || []).push(name); }
        }
        if (S) S.daten = null; else SOUNDDATEN.ton[name] = null;      // Speicher freigeben
        setTimeout(naechster, 15);
      };
      try {
        var v = ctx.decodeAudioData(zuPuffer(text), fertig, function () { fertig(null); });
        if (v && v.catch) v.catch(function () { /* schon gemeldet */ });
      } catch (err) { fertig(null); }
    }
    naechster();
  }

  // iPad/iPhone: Ton geht erst nach dem ersten Tippen an
  function entsperre() {
    try {
      kontext();
      if (ctx.state !== 'running' && ctx.resume) ctx.resume();
      if (!entsperrt) {
        entsperrt = true;
        var q = ctx.createBufferSource();
        q.buffer = ctx.createBuffer(1, 1, 22050);
        q.connect(ctx.destination); q.start(0);
        ladeAlle();
      }
    } catch (e) { /* kein Ton möglich */ }
  }
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (ev) { window.addEventListener(ev, entsperre, true); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend(); else if (entsperrt) ctx.resume(); } catch (e) { /* egal */ }
  });

  // ---------- einmal abspielen ----------
  var zuletztGespielt = {};
  // opt: { dauer: nach so vielen Sekunden ausblenden, pause: frühestens nach so vielen Sekunden wieder }
  function spiel(name, laut, tempo, verz, opt) {
    if (!an() || !ctx || ctx.state !== 'running') return false;
    var g = gruppen[name], n = g ? g[Math.floor(Math.random() * g.length)] : name, p = puffer[n];
    if (!p) return false;
    var jetzt = ctx.currentTime;
    if (opt && opt.pause && jetzt - (zuletztGespielt[name] || -99) < opt.pause) return true;
    zuletztGespielt[name] = jetzt;
    try {
      var t = jetzt + (verz || 0), q = ctx.createBufferSource(), r = ctx.createGain();
      q.buffer = p; q.playbackRate.value = tempo || 1;
      r.gain.setValueAtTime(laut === undefined ? 1 : laut, t);
      if (opt && opt.dauer && opt.dauer < p.duration) {
        r.gain.setValueAtTime(laut === undefined ? 1 : laut, t + opt.dauer);
        r.gain.linearRampToValueAtTime(0.0001, t + opt.dauer + 0.7);
        q.stop(t + opt.dauer + 0.75);
      }
      q.connect(r); r.connect(haupt); q.start(t);
    } catch (e) { return false; }
    return true;
  }

  // ---------- Dauergeräusche ----------
  function schleife(name, laut) {
    var S = schleifen[name];
    if (!S || !ctx) return;
    var jetzt = ctx.currentTime, w = Math.max(0, Math.min(1, laut));
    S.ziel = jetzt === S.zuletzt ? Math.max(S.ziel, w) : w;       // mehrere Quellen im selben Bild (zwei Traktoren): die lauteste zählt
    S.zuletzt = jetzt;
  }
  function pflegeSchleifen() {
    if (!ctx || ctx.state !== 'running') return;
    var jetzt = ctx.currentTime;
    for (var name in schleifen) {
      var S = schleifen[name];
      var ziel = an() && jetzt - S.zuletzt < 0.45 ? S.ziel : 0;
      if (ziel > 0.004 && !S.quelle) {
        try {
          S.quelle = ctx.createBufferSource(); S.regler = ctx.createGain();
          S.quelle.buffer = S.puffer; S.quelle.loop = true;
          S.quelle.loopStart = S.start; S.quelle.loopEnd = S.start + S.dauer;
          S.regler.gain.value = 0; S.laut = 0;
          S.quelle.connect(S.regler); S.regler.connect(haupt);
          S.quelle.start(0, S.start + Math.random() * S.dauer * 0.8);
        } catch (e) { S.quelle = null; }
      }
      if (S.quelle) {
        S.regler.gain.setTargetAtTime(ziel, jetzt, 0.25);
        S.laut += (ziel - S.laut) * 0.3;
        if (ziel === 0 && S.laut < 0.003) { try { S.quelle.stop(); } catch (e) { /* egal */ } S.quelle = null; S.regler = null; }
      }
    }
  }

  // ---------- Hufe: ersetzt das künstliche Klopfen aus spiel.js ----------
  // laut wie bisher (Schritt etwa 0.08, Trab 0.14, Galopp bis 0.26), hoehe = Tonhöhe des alten Klopfens
  function huf(laut, hoehe) {
    if (hoehe < 100 || hoehe > 400) return false;         // andere Geräusche (Wasserstrahl, Rumms) bleiben wie sie sind
    var art = laut < 0.1 ? 'schritt' : 'trab';
    if (!gruppen[art]) return false;
    return spiel(art, Math.min(0.8, 0.1 + laut * 2.6), Math.max(0.82, Math.min(1.25, 0.72 + hoehe / 700 + Math.random() * 0.1)));
  }
  function applaus(dauer, laut) {
    var name = dauer < 1.5 ? 'klatschen' : 'jubel';
    return spiel(name, Math.min(1, laut * 5.5), 1, 0, { dauer: Math.max(1.3, dauer) });
  }
  function klang(name) {
    if (name === 'abwurf') return spiel('stange', 0.9);
    if (name === 'oh') return spiel('oh', 0.5);
    if (name === 'verweigert') spiel('schnauben', 0.8, 1, 0.1);
    if (name === 'fanfare') spiel('wiehern', 0.6, 1, 1.5);
    return false;
  }

  // ---------- Stimmung: Vögel, Wind, Regen, Grillen, ab und zu ein Schnauben ----------
  var drinnen = 0, drinnenZeit = -9, naechstesTier = 20, uhr = 0;
  function stimmung() {
    pflegeSchleifen();
    pflegeMusik();
    if (!ctx || ctx.state !== 'running' || !an()) return;
    uhr += 0.1;
    var imMenue = document.body.classList.contains('im-menue');
    var welt = typeof KERN !== 'undefined' && KERN.welt ? KERN.welt() : null;
    var hof = typeof WELTEN !== 'undefined' && welt && welt === WELTEN.hof;
    var ausritt = typeof WELTEN !== 'undefined' && welt && welt === WELTEN.ausritt;
    var nacht = (hof || (welt && welt.mitNacht)) && typeof WETTER !== 'undefined' && WETTER.istNacht();
    var regen = !imMenue && typeof WETTER !== 'undefined' && WETTER.regnet() && !!welt;
    var innen = ctx.currentTime - drinnenZeit < 0.5 ? drinnen : 0;
    var basis = imMenue ? 0.35 : 1;
    schleife('voegel', nacht ? 0 : basis * 0.5 * (regen ? 0.25 : 1) * (1 - 0.75 * innen));
    schleife('wind', basis * (ausritt ? 0.3 : 0.16) * (1 - 0.6 * innen));
    if (nacht) schleife('grillen', 0.3 * (1 - 0.6 * innen));
    if (regen) schleife('regen', 0.55 * (1 - 0.4 * innen));
    // Tiere melden sich ab und zu
    if (imMenue || !welt) return;
    naechstesTier -= 0.1;
    if (naechstesTier <= 0) {
      naechstesTier = 22 + Math.random() * 30;
      var z = Math.random();
      if (nacht && z < 0.4) spiel('eule', 0.3);
      else if (z < 0.6) spiel('schnauben', 0.3 + innen * 0.25);
      else if (z < 0.75) spiel('brummeln', 0.5);
      else if (hof && !nacht && z < 0.9) spiel('huhn', 0.14 * (1 - innen * 0.6));
      else if (hof && z < 0.96) spiel('wiehern', 0.22 + innen * 0.15);
    }
  }
  setInterval(stimmung, 100);

  // ============================================================
  //  HINTERGRUNDMUSIK
  //  Jedes Stück ist eine MP3-Datei im Ordner musik/. Es läuft immer nur eins,
  //  beim Wechsel wird das alte leise und das neue laut (überblenden).
  // ============================================================
  var MUSIK_LAUT = 0.5;                 // Musik insgesamt leiser als die Geräusche, damit man die Hufe noch hört
  var MUSIK = typeof MUSIKLISTE !== 'undefined' ? MUSIKLISTE : {};
  var M = { wunsch: null, seit: 0, jetzt: null, quelle: null, regler: null, element: null, elementLaut: 0, puffer: {}, reihe: [], laedt: {}, ohneNetz: false, folgeNr: {}, basis: null, start: 0, dauer: 0 };
  // Welches Stück passt gerade?
  function musikWunsch() {
    if (!STUFEN[stufe].musik || !entsperrt) return null;
    if (document.body.classList.contains('im-menue')) return 'menue';
    var welt = typeof KERN !== 'undefined' && KERN.welt ? KERN.welt() : null;
    if (!welt) return 'springen';
    if (welt.musik) return typeof welt.musik === 'function' ? welt.musik() : welt.musik;
    if (welt === WELTEN.hof) {
      var s = welt.spielerin ? welt.spielerin() : null;
      if (s && typeof HOFTAG !== 'undefined' && HOFTAG.imHaus && HOFTAG.imHaus(s.x, s.z)) return 'zimmer';
      // bei Regen und am Abend klingt der Hof anders
      if (typeof WETTER !== 'undefined' && WETTER.regnet() && MUSIK.regen) return 'regen';
      if (typeof STAND !== 'undefined' && STAND.daten.stunde >= 19 && MUSIK.abend) return 'abend';
      return 'hof';
    }
    for (var name in WELTEN) if (WELTEN[name] === welt) return name;
    return null;
  }
  // gibt es das Stück nicht, nimmt man ein ähnliches
  function musikName(n) { while (n && MUSIK[n] && MUSIK[n].wie) n = MUSIK[n].wie; return n && MUSIK[n] ? n : null; }
  // Hat ein Ort mehrere Stücke ("folge"), kommt eins nach dem anderen dran
  function musikAusFolge(n) {
    var f = n && MUSIK[n] ? MUSIK[n].folge : null;
    if (!f || !f.length) return n;
    var st = f[(M.folgeNr[n] || 0) % f.length];
    return MUSIK[st] ? st : n;
  }
  // Ist das Stück gleich zu Ende? Dann ist das nächste aus der Folge dran.
  function musikWeiter() {
    var b = M.basis, f = b && MUSIK[b] ? MUSIK[b].folge : null;
    if (!f || f.length < 2 || M.wechselt || f.indexOf(M.jetzt) < 0) return;      // läuft gerade etwas anderes (Menü, Regen), wird nicht weitergezählt
    var rest = 99;
    if (M.quelle && M.dauer) rest = M.dauer - (ctx.currentTime - M.start) % M.dauer;
    else if (M.element && M.element.duration) rest = M.element.duration - M.element.currentTime;
    if (rest < 1.6) { M.folgeNr[b] = (M.folgeNr[b] || 0) + 1; M.dauer = 0; M.wechselt = true; if (M.element) M.element.loop = false; }
  }
  function musikLaden(name, fertig) {
    if (M.puffer[name]) { fertig(M.puffer[name]); return; }
    if (M.laedt[name] || M.ohneNetz) return;
    M.laedt[name] = true;
    var fehler = function () { M.laedt[name] = false; M.ohneNetz = true; };      // per Doppelklick geöffnet: dann spielt ein <audio> die Datei
    try {
      fetch(MUSIK[name].datei).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (roh) {
        ctx.decodeAudioData(roh, function (p) {
          M.laedt[name] = false; M.puffer[name] = p; M.reihe.push(name);
          if (M.reihe.length > 3) { var weg = M.reihe.shift(); if (weg !== M.jetzt) delete M.puffer[weg]; else M.reihe.push(weg); }   // höchstens 3 Stücke im Speicher
          fertig(p);
        }, fehler);
      }).catch(fehler);
    } catch (e) { fehler(); }
  }
  function musikStopp() {
    if (M.quelle) {
      var q = M.quelle, r = M.regler;
      try { r.gain.setTargetAtTime(0, ctx.currentTime, 0.35); q.stop(ctx.currentTime + 1.6); } catch (e) { /* egal */ }
      M.quelle = null; M.regler = null;
    }
    if (M.element) { var el = M.element; M.element = null; var t = setInterval(function () { el.volume = Math.max(0, el.volume - 0.06); if (el.volume <= 0.01) { el.pause(); clearInterval(t); } }, 60); }
  }
  function musikStart(name) {
    musikStopp();
    M.jetzt = name; M.wechselt = false;
    if (!name) return;
    var laut = (MUSIK[name].laut || 1) * MUSIK_LAUT;
    if (M.ohneNetz) {
      try {
        M.element = new Audio(MUSIK[name].datei); M.element.loop = true; M.element.volume = 0; M.elementLaut = laut;
        var v = M.element.play(); if (v && v.catch) v.catch(function () { /* egal */ });
      } catch (e) { M.element = null; }
      return;
    }
    musikLaden(name, function (p) {
      if (M.jetzt !== name || M.quelle) return;
      try {
        M.quelle = ctx.createBufferSource(); M.regler = ctx.createGain();
        M.quelle.buffer = p; M.quelle.loop = true;
        M.regler.gain.value = 0; M.regler.gain.setTargetAtTime(laut, ctx.currentTime + 0.3, 0.5);
        M.start = ctx.currentTime; M.dauer = p.duration;
        M.quelle.connect(M.regler); M.regler.connect(haupt);
        M.quelle.start(0);
      } catch (e) { M.quelle = null; }
    });
  }
  function pflegeMusik() {
    if (!ctx) return;
    musikWeiter();
    var basis = musikName(musikWunsch()), w = musikName(musikAusFolge(basis)), jetzt = ctx.currentTime;
    M.basis = basis;
    if (w !== M.wunsch) { M.wunsch = w; M.seit = jetzt; }
    if (w !== M.jetzt && (jetzt - M.seit > 0.4 || ctx.state !== 'running')) musikStart(w);
    else if (w && M.ohneNetz && !M.element && !M.quelle) musikStart(w);          // Laden über das Netz ging nicht: zweiter Versuch mit <audio>
    if (M.element) M.element.volume += (M.elementLaut * STUFEN[stufe].laut - M.element.volume) * 0.15;
  }

  // ---------- Knöpfe klicken, Münzen klimpern ----------
  document.addEventListener('click', function (e) {
    var k = e.target && e.target.closest ? e.target.closest('button') : null;
    if (k && k.id !== 'ton' && k.id !== 'weltTon') spiel('klick', 0.5, 1, 0, { pause: 0.05 });
  }, true);
  function muenze() { spiel('muenze', 0.55, 1, 0.12, { pause: 0.35 }); }
  window.addEventListener('load', function () {
    if (typeof STAND !== 'undefined' && STAND.belohne) {
      var alt = STAND.belohne;
      STAND.belohne = function () { muenze(); return alt.apply(STAND, arguments); };
    }
    if (typeof KERN !== 'undefined' && KERN.meldung) {
      var altM = KERN.meldung;
      KERN.meldung = function (text) { if (String(text).indexOf('🪙') >= 0) muenze(); return altM.apply(KERN, arguments); };
    }
  });

  return {
    kontext: kontext, ausgang: ausgang, an: an, weiter: weiter, bild: function () { return STUFEN[stufe].bild; }, text: function () { return STUFEN[stufe].text; },
    musikLaeuft: function () { return !!(M.quelle || (M.element && !M.element.paused)); }, musikJetzt: function () { return M.jetzt; },
    spiel: spiel, schleife: schleife, huf: huf, applaus: applaus, klang: klang,
    // der Hof meldet jedes Bild, wie sehr man drinnen ist (0..1): dann klingt draußen gedämpft
    setzeDrinnen: function (w) { drinnen = w; if (ctx) drinnenZeit = ctx.currentTime; },
    bereit: function () { return Object.keys(puffer).length; }
  };
})();
