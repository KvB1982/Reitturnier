// ============================================================
//  DIE HINTERGRUNDMUSIK
//  Hier steht, welches Stück wo läuft. Die Stücke selbst sind
//  MP3-Dateien in diesem Ordner. Woher sie kommen: CREDITS.md
//  "laut" macht ein Stück etwas lauter oder leiser (1 = normal).
//  "wie" heißt: Hier läuft dasselbe Stück wie woanders.
//  Abgespielt wird alles in js/sound.js (ganz unten: HINTERGRUNDMUSIK).
// ============================================================
var MUSIKLISTE = {
  menue:       { datei: 'musik/menue.mp3',       laut: 0.9 },   // Hauptmenü: ein ruhiges Lied vom Feld
  hof:         { datei: 'musik/hof.mp3',         laut: 0.8 },   // Pferdehof: fröhlich und gemütlich
  zimmer:      { datei: 'musik/zimmer.mp3',      laut: 0.8 },   // im Haus: eine Spieluhr spielt einen Walzer von Brahms
  ausritt:     { datei: 'musik/ausritt.mp3',     laut: 0.8 },   // Ausritt: eine Gitarre am Nachmittag
  springen:    { datei: 'musik/springen.mp3',    laut: 0.8 },   // Springen: munter
  rennen:      { datei: 'musik/rennen.mp3',      laut: 0.9 },   // Galopprennen: schnelles Orchester
  gelaende:    { datei: 'musik/gelaende.mp3',    laut: 0.9 },   // Military: ein Marsch
  voltigieren: { datei: 'musik/voltigieren.mp3', laut: 0.9 },   // Voltigieren: ruhige Streicher
  dressur:     { datei: 'musik/dressur.mp3',     laut: 1.0 }    // Dressur: eine Gavotte von Johann Sebastian Bach
  // Die Kür in der Dressur macht ihre Musik selbst (js/dressur.js), passend zum Takt der Gangart.
};
