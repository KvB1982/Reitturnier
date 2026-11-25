// ============================================================
//  SPEICHER  -  Wer spielt? Und wo liegt sein Spielstand?
//
//  Jedes Kind hat ein eigenes Profil mit eigenem Hof, eigenen
//  Münzen und eigenem Fohlen. Alles zusammen liegt im Browser
//  (localStorage):
//    reitturnier_profile          die Liste der Profile und wer gerade spielt
//    reitturnier_stand_<id>       der Spielstand eines Profils
//    reitturnier_stand_<id>_alt   eine Sicherungskopie davon (Stand beim letzten Start)
//
//  Der Spielstand hat eine Versionsnummer. Ändert sich später
//  sein Aufbau, zieht eine Umzugs-Funktion den alten Stand um.
//  Einstellungen des Geräts (Ton, Grafik, Messanzeige) gehören
//  nicht dazu, sie gelten für alle Kinder am selben Gerät.
// ============================================================
var SPEICHER = (function () {
  'use strict';
  var VERSION = 2;
  var LISTE = 'reitturnier_profile', VOR = 'reitturnier_stand_';
  var HOECHSTENS = 6;                    // so viele Profile passen auf ein Gerät
  // Diese kleinen Einstellungen gehörten früher in eigene Speicher-Namen. Jetzt liegen sie im Spielstand des Profils.
  var KLEIN = ['spieler', 'best', 'parcours', 'gegner', 'stufe', 'steuerung', 'stadion', 'modus'];

  function roh(name) { try { return localStorage.getItem(name); } catch (e) { return null; } }
  function lies(name) { try { var v = roh(name); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function schreib(name, wert) { try { localStorage.setItem(name, typeof wert === 'string' ? wert : JSON.stringify(wert)); return true; } catch (e) { return false; } }
  function weg(name) { try { localStorage.removeItem(name); } catch (e) { /* egal */ } }
  function istDing(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function sauber(name) { return String(name || '').replace(/[<>&"']/g, '').trim().slice(0, 16); }

  // ---------- Umzug: aus einem alten Stand wird ein neuer ----------
  // Fassung 1 = die Zeit vor den Profilen: ein Hof für alle, zehn einzelne Speicher-Namen.
  function ausFassung1() {
    var s = { v: 1, hof: lies('reitturnier_hof'), klein: {} };
    if (!istDing(s.hof)) s.hof = {};
    KLEIN.forEach(function (k) { var w = lies('reitturnier_' + k); if (w !== null) s.klein[k] = w; });
    var outfit = lies('reitturnier_outfit');
    if (!s.klein.spieler && istDing(outfit)) s.klein.spieler = [{ name: 'Spieler 1', outfit: outfit, siege: 0 }];
    return s;
  }
  // UMZUG[n] macht aus Fassung n die Fassung n + 1
  var UMZUG = {
    1: function (s) {
      var h = s.hof;
      // Früher zählten echte Stunden (auch wenn das Spiel zu war). Jetzt zählt nur noch die Uhr im Spiel.
      h.wach = 0;
      if (istDing(h.pferde)) Object.keys(h.pferde).forEach(function (id) { if (istDing(h.pferde[id])) h.pferde[id].zeit = 0; });
      if (istDing(h.fohlen)) { h.fohlen.zeit = 0; h.fohlen.flasche = -9; h.fohlen.buerste = -9; }
    }
  };
  function zieheUm(s) {
    if (!istDing(s.hof)) s.hof = {};
    if (!istDing(s.klein)) s.klein = {};
    var v = typeof s.v === 'number' ? s.v : 1;
    while (v < VERSION) { if (UMZUG[v]) UMZUG[v](s); v++; }
    s.v = Math.max(v, VERSION);          // ein Stand aus einer neueren Fassung des Spiels behält seine Nummer
    return s;
  }

  // ---------- Profile ----------
  var P = lies(LISTE), neuAngelegt = false;
  if (!istDing(P) || !Array.isArray(P.liste) || !P.liste.length) {
    var alt = ausFassung1();
    var ersterName = alt.klein.spieler && alt.klein.spieler[0] && sauber(alt.klein.spieler[0].name);
    P = { aktiv: 'p1', naechste: 2, liste: [{ id: 'p1', name: ersterName || 'Spieler 1' }] };
    schreib(VOR + 'p1', zieheUm(alt));   // die alten Speicher-Namen bleiben als Sicherung liegen
    schreib(LISTE, P);
    neuAngelegt = true;
  }
  P.liste = P.liste.filter(function (e) { return istDing(e) && /^p\d+$/.test(e.id); });
  if (!P.liste.length) P.liste = [{ id: 'p1', name: 'Spieler 1' }];
  if (!P.liste.some(function (e) { return e.id === P.aktiv; })) P.aktiv = P.liste[0].id;
  var ich = P.aktiv;                     // dieses Profil gehört zu allem, was in dieser Sitzung gespeichert wird

  // ---------- Spielstand laden ----------
  var gerettet = false, fest = false;
  var S = lies(VOR + ich);
  if (!istDing(S)) {
    // Der Stand ist weg oder kaputt: die Sicherungskopie vom letzten Start nehmen
    var kopie = lies(VOR + ich + '_alt');
    if (istDing(kopie)) { S = kopie; gerettet = true; } else S = { v: VERSION, hof: {}, klein: {} };
  } else if (!neuAngelegt) schreib(VOR + ich + '_alt', roh(VOR + ich));     // so sah der Stand beim Start aus
  zieheUm(S);

  function sichere() {
    if (fest) return false;              // gleich wird neu geladen: nichts mehr überschreiben
    S.wann = new Date().toISOString();
    return schreib(VOR + ich, S);
  }
  // Auch speichern, wenn die App in den Hintergrund geht oder das Fenster zugeht
  document.addEventListener('visibilitychange', function () { if (document.hidden) sichere(); });
  window.addEventListener('pagehide', sichere);

  // kleine Einstellungen: gehören sie zum Profil, liegen sie im Spielstand, sonst beim Gerät
  function kurz(name) { return String(name).replace(/^reitturnier_/, ''); }
  function hol(name, ersatz) {
    var k = kurz(name);
    if (KLEIN.indexOf(k) < 0) { var w = lies('reitturnier_' + k); return w === null ? ersatz : w; }
    return S.klein[k] === undefined || S.klein[k] === null ? ersatz : S.klein[k];
  }
  function setz(name, wert) {
    var k = kurz(name);
    if (KLEIN.indexOf(k) < 0) return schreib('reitturnier_' + k, wert);
    S.klein[k] = wert;
    return sichere();
  }

  function neuLaden() { fest = true; location.reload(); }
  function profile() { return P.liste.map(function (e) { return { id: e.id, name: e.name, aktiv: e.id === ich }; }); }
  function eintrag(id) { for (var i = 0; i < P.liste.length; i++) if (P.liste[i].id === id) return P.liste[i]; return null; }
  // Ein neues Kind kommt dazu. Es fängt mit einem frischen Hof an.
  function neu(name) {
    if (P.liste.length >= HOECHSTENS) return null;
    var id = 'p' + (P.naechste || P.liste.length + 1);
    P.naechste = (P.naechste || P.liste.length + 1) + 1;
    name = sauber(name) || 'Spieler ' + (P.liste.length + 1);
    P.liste.push({ id: id, name: name });
    weg(VOR + id); weg(VOR + id + '_alt');
    schreib(LISTE, P);
    return id;
  }
  function wechsle(id) {
    if (!eintrag(id) || id === ich) return false;
    sichere();
    P.aktiv = id; schreib(LISTE, P);
    neuLaden();
    return true;
  }
  function benenne(id, name) {
    var e = eintrag(id); name = sauber(name);
    if (!e || !name) return false;
    e.name = name; schreib(LISTE, P);
    return true;
  }
  // Ein Profil löschen. Das Profil, das gerade spielt, kann man nicht löschen.
  function loesche(id) {
    if (id === ich || !eintrag(id)) return false;
    P.liste = P.liste.filter(function (e) { return e.id !== id; });
    weg(VOR + id); weg(VOR + id + '_alt');
    schreib(LISTE, P);
    return true;
  }

  // ---------- alles als Datei sichern und wieder laden ----------
  function paket() {
    sichere();
    var staende = {};
    P.liste.forEach(function (e) { var s = lies(VOR + e.id); if (istDing(s)) staende[e.id] = s; });
    return { art: 'reitturnier-sicherung', fassung: VERSION, wann: new Date().toISOString(), profile: P, staende: staende };
  }
  // Prüft eine Sicherung und spielt sie ein. Gibt einen Fehlertext zurück oder '' wenn alles geklappt hat.
  function einspielen(p) {
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { return 'Das ist keine Sicherung vom Reitturnier.'; } }
    if (!istDing(p) || p.art !== 'reitturnier-sicherung' || !istDing(p.profile) || !Array.isArray(p.profile.liste) || !istDing(p.staende)) return 'Das ist keine Sicherung vom Reitturnier.';
    var liste = p.profile.liste.filter(function (e) { return istDing(e) && /^p\d+$/.test(e.id) && istDing(p.staende[e.id]); }).slice(0, HOECHSTENS)
      .map(function (e) { return { id: e.id, name: sauber(e.name) || 'Spieler' }; });
    if (!liste.length) return 'In der Sicherung ist kein Spielstand.';
    // erst alles Alte wegräumen, dann das Neue hinlegen
    P.liste.forEach(function (e) { weg(VOR + e.id); weg(VOR + e.id + '_alt'); });
    var hoechste = 1;
    liste.forEach(function (e) { schreib(VOR + e.id, zieheUm(p.staende[e.id])); hoechste = Math.max(hoechste, +e.id.slice(1)); });
    var aktiv = liste.some(function (e) { return e.id === p.profile.aktiv; }) ? p.profile.aktiv : liste[0].id;
    schreib(LISTE, { aktiv: aktiv, naechste: hoechste + 1, liste: liste });
    neuLaden();
    return '';
  }

  return {
    VERSION: VERSION, HOECHSTENS: HOECHSTENS,
    hof: S.hof, sichere: sichere, hol: hol, setz: setz,
    profile: profile, ich: function () { return eintrag(ich); }, neu: neu, wechsle: wechsle, benenne: benenne, loesche: loesche,
    paket: paket, einspielen: einspielen,
    gerettet: function () { return gerettet; },
    info: function () { return 'Spielstand Fassung ' + S.v + ', Profil ' + ich + ' von ' + P.liste.length + (gerettet ? ', aus der Sicherungskopie geholt' : ''); }
  };
})();
