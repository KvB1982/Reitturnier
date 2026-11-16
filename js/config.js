// ============================================================
//  EINSTELLUNGEN  -  hier kann man das Spiel leicht erweitern
// ============================================================
//  - Neue Farben:     einfach in die Listen unten eintragen
//  - Neuer Parcours:  einen Block in PARCOURS kopieren und aendern
//  - Hindernis-Arten: "kreuz", "steil", "oxer", "mauer"
// ============================================================

// ---------- Ankleiden: was man auswaehlen kann ----------
var AUSWAHL = [
  { key: 'jacke', name: 'Jacke', farben: ['#1f3a93', '#c0392b', '#111111', '#e84393', '#27ae60', '#8e44ad', '#f5f5f5'] },
  { key: 'hose', name: 'Reithose', farben: ['#f5f0e1', '#d9c7a0', '#3d3d3d', '#5d7ea8', '#f8c9dc'] },
  { key: 'helm', name: 'Helm', farben: ['#111111', '#1f3a93', '#6c3483', '#e84393', '#7b4a2a'] },
  { key: 'stiefel', name: 'Stiefel', farben: ['#151515', '#5a3418', '#7b1e1e'] },
  { key: 'haare', name: 'Haarfarbe', farben: ['#e6c35c', '#7a4a21', '#2b1a10', '#c0502a', '#111111', '#ff7ac8'] },
  { key: 'frisur', name: 'Frisur', werte: [['zopf', 'Pferdeschwanz'], ['zoepfe', 'Zwei Zöpfe'], ['kurz', 'Kurz']] },
  { key: 'fell', name: 'Pferd', farben: ['#8b5a2b', '#3b2416', '#1c1c1c', '#f1ece2', '#d9a55a', '#9a9a9a'] },
  { key: 'gesicht', name: 'Abzeichen am Pferdekopf', werte: [['blesse', 'Blesse'], ['stern', 'Stern'], ['sprenkel', 'Sprenkel'], ['ohne', 'Ohne']] },
  { key: 'decke', name: 'Satteldecke', farben: ['#6b3f22', '#2a1a12', '#ffffff', '#e84393', '#1f3a93', '#27ae60', '#f1c40f', '#8e44ad'] }
];

// Das ist am Anfang angezogen
var START_OUTFIT = {
  jacke: '#1f3a93', hose: '#f5f0e1', helm: '#111111', stiefel: '#151515',
  haare: '#e6c35c', frisur: 'zopf', fell: '#8b5a2b', gesicht: 'blesse', decke: '#e84393'
};

// ---------- Sprung-Timing ----------
// Abstand zum Hindernis (in Metern), bei dem der Absprung perfekt ist
var TIMING = {
  ideal: 3.2,      // perfekter Absprungpunkt vor dem Hindernis
  perfekt: 0.8,    // +- so viele Meter um den Idealpunkt = 3 Punkte (gruen)
  gut: 1.5,        // +- = 2 Punkte (hellgruen)
  frueh: 5.6,      // weiter weg als das = zu frueh -> Abwurf
  spaet: 1.2,      // naeher dran als das = zu spaet -> Abwurf
  anzeige: 9.0,    // ab hier beginnt die Farbzone
  verweigern: 0.5  // ohne Knopfdruck bleibt das Pferd hier stehen
};

// ---------- Reitplatz ----------
var PLATZ = { breite: 76, tiefe: 48 };   // Meter

// ---------- Parcours ----------
// weg:   Punkte [x, z], durch die das Pferd laeuft (Platzmitte = 0,0)
// Ein Punkt mit drittem Eintrag ist ein Hindernis: [x, z, 'art', hoehe]
var PARCOURS = [
  {
    name: 'Ponywiese (leicht)',
    tempo: 7.5,
    weg: [
      [-30, 12], [-20, 12], [-10, 12, 'kreuz', 0.6], [0, 12], [10, 12, 'steil', 0.7], [20, 12],
      [28, 8], [30, 0], [28, -8],
      [20, -12], [10, -12, 'steil', 0.8], [0, -12], [-10, -12, 'oxer', 0.8], [-20, -12],
      [-27, -9.5], [-29, -6], [-27, -2.5],
      [-20, 0], [-10, 0], [0, 0, 'mauer', 0.9], [10, 0], [22, 0]
    ]
  },
  {
    name: 'Turnier (mittel)',
    tempo: 9,
    weg: [
      [-32, 15], [-23, 15], [-14, 15, 'steil', 0.9], [-4, 15], [6, 15, 'oxer', 0.9], [18, 15],
      [28, 11], [31, 0], [28, -11],
      [18, -15], [8, -15, 'mauer', 1.0], [-3, -15], [-14, -15, 'steil', 1.0], [-23, -15],
      [-30, -11.5], [-32, -7.5], [-30, -3.5],
      [-23, 0], [-13, 0, 'kreuz', 0.8], [-4, 0], [5, 0, 'oxer', 1.0], [14, 0], [23, 0, 'steil', 1.1], [29, 2]
    ]
  }
];

// ---------- Turnier ----------
// Computergegner: [kennung, Name, Streuung beim Absprung in Metern, Wahrscheinlichkeit fuer Verweigerung]
// Je groesser die Streuung, desto ungenauer springt der Gegner.
var GEGNER_STUFEN = [
  ['sehrleicht', 'Sehr leicht', 2.7, 0.22],
  ['leicht', 'Leicht', 1.9, 0.10],
  ['mittel', 'Mittel', 1.15, 0.03],
  ['schwer', 'Schwer', 0.6, 0.0]
];
var GEGNER_NAMEN = ['Lotte auf Blitz', 'Mia auf Sternchen', 'Emma auf Donner', 'Paula auf Flocke', 'Greta auf Karamell', 'Frieda auf Wirbelwind'];
// Im Stechen wird schneller geritten
var STECHEN = { tempoFaktor: 1.25 };

// ---------- Steuerung ----------
// auto   = das Pferd laeuft den Weg von allein, man muss nur springen
// lenken = man lenkt selbst (links / rechts)
// tempo  = man lenkt selbst und bestimmt auch das Tempo
var STEUERUNG = [
  ['auto', 'Automatisch (leicht)'],
  ['lenken', 'Selbst lenken (schwer)'],
  ['tempo', 'Lenken + Tempo (sehr schwer)']
];
var LENKEN = {
  drehung: 1.5,      // wie schnell das Pferd abbiegt
  tempoMin: 3,       // langsamstes Tempo (Meter pro Sekunde)
  tempoMax: 12,      // schnellstes Tempo
  zuLangsam: 5,      // langsamer als das -> Pferd verweigert den Sprung
  zuSchnell: 10.5    // schneller als das -> nur perfekte Absprunge bleiben fehlerfrei
};


// ============================================================
//  PFERDEHOF
// ============================================================
// Hier melden sich die Welten an (Hof, Rennbahn, Gelaende, Dressur, Voltigieren).
var WELTEN = {};

// Die Pferde im Stall. fell: siehe FELLE in herde.js
// tempo / sprung / ausdauer: 1 (wenig) bis 5 (viel)
var HOF_PFERDE = [
  { id: 'blitz', name: 'Blitz', fell: 'brauner', tempo: 5, sprung: 3, ausdauer: 3, art: 'schnell wie der Wind' },
  { id: 'sternchen', name: 'Sternchen', fell: 'schimmel', tempo: 3, sprung: 5, ausdauer: 3, art: 'springt am liebsten' },
  { id: 'donner', name: 'Donner', fell: 'rappe', tempo: 4, sprung: 4, ausdauer: 3, art: 'stark und mutig' },
  { id: 'karamell', name: 'Karamell', fell: 'palomino', tempo: 3, sprung: 3, ausdauer: 5, art: 'wird nie müde' },
  { id: 'flocke', name: 'Flocke', fell: 'apfel', tempo: 4, sprung: 3, ausdauer: 4, art: 'ruhig und brav' },
  { id: 'kruemel', name: 'Krümel', fell: 'schecke', tempo: 3, sprung: 4, ausdauer: 4, art: 'frech und verfressen' }
];

// Wie schnell Pferde schmutzig und hungrig werden (Anteil pro Stunde, auch wenn das Spiel zu ist)
var HOF_REGELN = { schmutzProStunde: 0.03, hungerProStunde: 0.06, mistProStunde: 0.05 };

// Reitladen: art = gamaschen | ohren (Fliegenhaube) | schleife (Maehnenschleifen) | decke (Satteldecke) | putz (Putzzeug)
var LADEN = [
  { id: 'gam_weiss', art: 'gamaschen', name: 'Gamaschen weiß', farbe: '#f5f5f5', preis: 20 },
  { id: 'gam_pink', art: 'gamaschen', name: 'Gamaschen pink', farbe: '#e84393', preis: 30 },
  { id: 'gam_blau', art: 'gamaschen', name: 'Gamaschen blau', farbe: '#1f6fd0', preis: 30 },
  { id: 'gam_gruen', art: 'gamaschen', name: 'Gamaschen grün', farbe: '#27ae60', preis: 30 },
  { id: 'ohr_weiss', art: 'ohren', name: 'Fliegenhaube weiß', farbe: '#f5f5f5', preis: 25 },
  { id: 'ohr_pink', art: 'ohren', name: 'Fliegenhaube pink', farbe: '#e84393', preis: 35 },
  { id: 'ohr_blau', art: 'ohren', name: 'Fliegenhaube blau', farbe: '#1f6fd0', preis: 35 },
  { id: 'schl_rot', art: 'schleife', name: 'Mähnenschleifen rot', farbe: '#d11f3a', preis: 15 },
  { id: 'schl_gelb', art: 'schleife', name: 'Mähnenschleifen gelb', farbe: '#f1c40f', preis: 15 },
  { id: 'schl_lila', art: 'schleife', name: 'Mähnenschleifen lila', farbe: '#8e44ad', preis: 15 },
  { id: 'decke_tuerkis', art: 'decke', name: 'Sattel türkis', farbe: '#1abc9c', preis: 40 },
  { id: 'decke_gold', art: 'decke', name: 'Sattel gold', farbe: '#d4a017', preis: 60 },
  { id: 'decke_regenbogen', art: 'decke', name: 'Sattel himbeer', farbe: '#c2185b', preis: 40 },
  { id: 'putz_turbo', art: 'putz', name: 'Zauberstriegel (putzt doppelt so schnell)', preis: 50 }
];

// Muenzen fuer Siege: [1. Platz, 2. Platz, 3. Platz]
var PREISGELD = { rennen: [40, 20, 10], gelaende: [45, 25, 12], dressur: [40, 22, 10], voltigieren: [35, 20, 10] };
