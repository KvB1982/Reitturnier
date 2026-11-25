// ============================================================
//  EINSTELLUNGEN  -  hier kann man das Spiel leicht erweitern
// ============================================================
//  - Neue Farben:     einfach in die Listen unten eintragen
//  - Neuer Parcours:  einen Block in PARCOURS kopieren und aendern
//  - Hindernis-Arten: "kreuz", "steil", "oxer", "mauer"
// ============================================================

// ---------- Ankleiden: was man auswaehlen kann ----------
var AUSWAHL = [
  { key: 'art', name: 'Ich bin', werte: [['maedchen', 'Mädchen'], ['junge', 'Junge']] },
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
  haare: '#e6c35c', frisur: 'zopf', art: 'maedchen', fell: '#8b5a2b', gesicht: 'blesse', decke: '#e84393'
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
// Die Uhr im Spiel: So viele echte Sekunden dauert eine Spielstunde (60 = eine Minute in echt ist eine Stunde im Spiel).
var UHR = { sekProStunde: 60 };
// So schnell wird dein Pferd tagsüber schmutzig und hungrig, je Spielstunde. Über Nacht kommt in hoftag.js noch etwas dazu.
var HOF_REGELN = { schmutzProStunde: 0.01, hungerProStunde: 0.02, mistProStunde: 0.02 };

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
  { id: 'putz_turbo', art: 'putz', name: 'Zauberstriegel (putzt doppelt so schnell)', preis: 50 },
  { id: 'gam_lila', art: 'gamaschen', name: 'Gamaschen lila', farbe: '#8e44ad', preis: 30 },
  { id: 'gam_gold', art: 'gamaschen', name: 'Gamaschen gold', farbe: '#d4a017', preis: 45 },
  { id: 'ohr_tuerkis', art: 'ohren', name: 'Fliegenhaube türkis', farbe: '#1abc9c', preis: 35 },
  { id: 'ohr_gold', art: 'ohren', name: 'Fliegenhaube gold', farbe: '#d4a017', preis: 45 },
  { id: 'schl_pink', art: 'schleife', name: 'Mähnenschleifen pink', farbe: '#ff5fa2', preis: 15 },
  { id: 'schl_tuerkis', art: 'schleife', name: 'Mähnenschleifen türkis', farbe: '#1abc9c', preis: 15 },
  { id: 'decke_flieder', art: 'decke', name: 'Sattel flieder', farbe: '#b07cff', preis: 40 },
  { id: 'decke_schwarz', art: 'decke', name: 'Sattel schwarz', farbe: '#1c1c1c', preis: 40 },

  // ----- Für dich (kat: 'ich'). art = kappe | frisur | oberteil | extra | farben; wert = was angezogen wird -----
  { id: 'k_schleife', kat: 'ich', art: 'kappe', wert: 'schleife', name: 'Reitkappe mit Schleife', preis: 25 },
  { id: 'k_glitzer', kat: 'ich', art: 'kappe', wert: 'glitzer', name: 'Glitzer-Reitkappe', preis: 35 },
  { id: 'k_blumen', kat: 'ich', art: 'kappe', wert: 'blumen', name: 'Reitkappe mit Blumenkranz', preis: 30 },
  { id: 'k_ohren', kat: 'ich', art: 'kappe', wert: 'ohren', name: 'Reitkappe mit Katzenohren', preis: 40 },
  { id: 'k_bommel', kat: 'ich', art: 'kappe', wert: 'bommel', name: 'Winterkappe mit Bommel', preis: 30 },
  { id: 'k_cowboy', kat: 'ich', art: 'kappe', wert: 'cowboy', name: 'Cowboyhut', preis: 50 },
  { id: 'k_krone', kat: 'ich', art: 'kappe', wert: 'krone', name: 'Reitkappe mit Krone', preis: 70 },
  { id: 'k_einhorn', kat: 'ich', art: 'kappe', wert: 'einhorn', name: 'Einhorn-Reitkappe', preis: 80 },
  { id: 'f_lang', kat: 'ich', art: 'frisur', wert: 'lang', name: 'Frisur: lang und offen', preis: 20 },
  { id: 'f_dutt', kat: 'ich', art: 'frisur', wert: 'dutt', name: 'Frisur: Dutt', preis: 20 },
  { id: 'f_flecht', kat: 'ich', art: 'frisur', wert: 'flecht', name: 'Frisur: langer Flechtzopf', preis: 25 },
  { id: 'f_locken', kat: 'ich', art: 'frisur', wert: 'locken', name: 'Frisur: Locken', preis: 25 },
  { id: 'f_hoch', kat: 'ich', art: 'frisur', wert: 'hoch', name: 'Frisur: hoher Zopf mit Schleife', preis: 25 },
  { id: 'farben_haare', kat: 'ich', art: 'farben', name: 'Bunte Haarfarben (türkis, lila, grün, weiß, pink)', preis: 40 },
  { id: 'farben_bunt', kat: 'ich', art: 'farben', name: 'Farbpaket für Jacke, Hose, Kappe, Stiefel (gold, türkis, rosa, flieder, orange)', preis: 45 },
  { id: 'o_stern', kat: 'ich', art: 'oberteil', wert: 'stern', name: 'Pulli mit Goldstern', preis: 25 },
  { id: 'o_herz', kat: 'ich', art: 'oberteil', wert: 'herz', name: 'Pulli mit Herz', preis: 25 },
  { id: 'o_streifen', kat: 'ich', art: 'oberteil', wert: 'streifen', name: 'Ringelshirt', preis: 30 },
  { id: 'o_regenbogen', kat: 'ich', art: 'oberteil', wert: 'regenbogen', name: 'Regenbogen-Shirt', preis: 45 },
  { id: 'o_weste', kat: 'ich', art: 'oberteil', wert: 'weste', name: 'Kuschelige Steppweste', preis: 40 },
  { id: 'o_turnier', kat: 'ich', art: 'oberteil', wert: 'turnier', name: 'Turnierjacket mit Goldknöpfen', preis: 60 },
  { id: 'o_nummer', kat: 'ich', art: 'oberteil', wert: 'nummer', name: 'Startnummer 7', preis: 15 },
  { id: 'x_schal', kat: 'ich', art: 'extra', wert: 'schal', name: 'Roter Schal', preis: 15 },
  { id: 'x_brille', kat: 'ich', art: 'extra', wert: 'brille', name: 'Sonnenbrille', preis: 20 },
  { id: 'x_rucksack', kat: 'ich', art: 'extra', wert: 'rucksack', name: 'Rucksack', preis: 25 },
  { id: 'x_schaerpe', kat: 'ich', art: 'extra', wert: 'schaerpe', name: 'Goldene Siegerschärpe', preis: 50 },
  { id: 'x_umhang', kat: 'ich', art: 'extra', wert: 'umhang', name: 'Zauberumhang', preis: 55 },
  { id: 'x_fluegel', kat: 'ich', art: 'extra', wert: 'fluegel', name: 'Feenflügel', preis: 75 },

  // ----- Für dein Zimmer (kat: 'zimmer') -----
  { id: 'z_teppich', kat: 'zimmer', art: 'zimmer', name: 'Flauschteppich', preis: 20 },
  { id: 'z_poster', kat: 'zimmer', art: 'zimmer', name: 'Pferdeposter', preis: 10 },
  { id: 'z_pflanze', kat: 'zimmer', art: 'zimmer', name: 'Zimmerpflanze', preis: 15 },
  { id: 'z_lichter', kat: 'zimmer', art: 'zimmer', name: 'Lichterkette', preis: 30 },
  { id: 'z_kuschel', kat: 'zimmer', art: 'zimmer', name: 'Kuschelpferd fürs Bett', preis: 25 },
  { id: 'z_sitzsack', kat: 'zimmer', art: 'zimmer', name: 'Sitzsack', preis: 30 },
  { id: 'z_bett', kat: 'zimmer', art: 'zimmer', name: 'Himmelbett-Vorhang', preis: 60 },
  { id: 'z_korb', kat: 'zimmer', art: 'zimmer', name: 'Katzenkörbchen (Minka schläft dann bei dir)', preis: 35 },
  { id: 'z_sessel', kat: 'zimmer', art: 'zimmer', name: 'Kuschelsessel', preis: 40 },
  { id: 'z_lampe', kat: 'zimmer', art: 'zimmer', name: 'Stehlampe', preis: 25 },
  { id: 'z_aquarium', kat: 'zimmer', art: 'zimmer', name: 'Aquarium mit Goldfischen', preis: 50 },
  { id: 'z_schaukel', kat: 'zimmer', art: 'zimmer', name: 'Schaukelpferd', preis: 45 },
  { id: 'z_sterne', kat: 'zimmer', art: 'zimmer', name: 'Leuchtsterne für die Wand', preis: 20 }
];

// Farben aus den Farbpaketen im Reitladen
var FARBPAKETE = {
  farben_haare: { haare: ['#3fb8e0', '#8e44ad', '#27ae60', '#f5f5f5', '#ff5fa2'] },
  farben_bunt: { jacke: ['#d4a017', '#1abc9c', '#ff8fc0', '#b07cff', '#ff8a3c'], hose: ['#d4a017', '#1abc9c', '#ff8fc0', '#b07cff', '#ffffff'], helm: ['#d4a017', '#1abc9c', '#ff8fc0', '#b07cff', '#f5f5f5'], stiefel: ['#d4a017', '#f5f5f5', '#ff8fc0', '#b07cff'] }
};

// Aufgaben für den Tag: [Kennung, Text (# = Anzahl), kleinste Anzahl, größte Anzahl, Münzen]
var TAGESAUFGABEN = [
  ['fuettern', 'Gib deinem Pferd # Mal Hafer oder Heu', 1, 2, 5],
  ['box', 'Miste die Box von deinem Pferd aus (# Mal)', 1, 1, 6],
  ['mist', 'Bring # Mistäpfel mit der Schubkarre zum Misthaufen', 3, 6, 6],
  ['putzen', 'Putze # Pferd blitzblank', 1, 1, 5],
  ['hufe', 'Kratze # Pferd die Hufe aus', 1, 1, 4],
  ['stroh', 'Streue # Box frisch ein', 1, 1, 4],
  ['weide', 'Bring # Pferd auf die Weide', 1, 1, 4],
  ['longe', 'Longiere # Pferd', 1, 1, 5],
  ['maschine', 'Stell # Pferd in die Schrittmaschine', 1, 1, 3],
  ['ritt', 'Reite # Mal (Training, Turnier, Rennen, Gelände oder Ausritt)', 1, 2, 6],
  ['moehre', 'Gib # Pferden eine Möhre', 2, 3, 3],
  ['katze', 'Streichle # Mal die Hofkatze Minka', 1, 1, 3],
  ['fohlen', 'Kümmere dich # Mal um das Fohlen', 1, 2, 4],
  ['fohlenRein', 'Leine das Fohlen an und bring es in seine Box (abends ab 17 Uhr oder bei Regen)', 1, 1, 6]
];

// Muenzen fuer Siege: [1. Platz, 2. Platz, 3. Platz]
var PREISGELD = { rennen: [40, 20, 10], gelaende: [45, 25, 12], dressur: [40, 22, 10], voltigieren: [35, 20, 10] };
