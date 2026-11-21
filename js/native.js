// ============================================================
//  NATIVE  -  Zusätze für die iPad- und iPhone-App (Capacitor)
// ============================================================
//  Im Browser passiert hier nichts. In der App vibriert das
//  iPhone kurz bei Landung und Platschen (iPads haben keinen
//  Vibrationsmotor, dort bleibt es still).
// ============================================================
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  document.documentElement.classList.add('native');
  var H = C.Plugins && C.Plugins.Haptics;
  if (!H || typeof SOUND === 'undefined' || !SOUND.spiel) return;
  var FUEHLEN = { landung: 'MEDIUM', platsch: 'MEDIUM', baum: 'HEAVY', muenze: 'LIGHT' };
  var zuletzt = 0;
  var spiel = SOUND.spiel;
  SOUND.spiel = function (name) {
    var jetzt = Date.now();
    if (FUEHLEN[name] && jetzt - zuletzt > 70) {
      zuletzt = jetzt;
      try { var p = H.impact({ style: FUEHLEN[name] }); if (p && p.catch) p.catch(function () {}); } catch (e) { /* egal */ }
    }
    return spiel.apply(this, arguments);
  };
})();
