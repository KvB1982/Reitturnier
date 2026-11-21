# Reitturnier – Hinweise für Claude

3D-Reitspiel für den Browser (PC, iPad, iPhone) mit Pferdehof, Springen, Galopprennen, Military, Ausritt, Dressur und Voltigieren.
Familien-Lernprojekt wie die Geschwister-Spiele Powershot, Frontline, Rennspiel und Police-Quest.
Repository: https://github.com/KvB1982/Reitturnier · läuft auf GitHub Pages unter https://kvb1982.github.io/Reitturnier/

## Arbeitsweise

- Antworten, Code-Kommentare und Texte im Spiel auf **Deutsch**. Kommentare so schreiben, dass ein Kind mitlesen kann.
- Kein Build-Schritt und keine ES-Module: three.js r160 als klassisches Skript (`js/three.min.js`), damit das Spiel auch per Doppelklick auf `index.html` läuft.
  Deshalb sind 3D-Modelle als Text in `.js`-Dateien verpackt (kein `fetch`).
- Commits als `KvB1982 <KvB1982@users.noreply.github.com>`.
- Nach Änderungen im Browser prüfen. Ehrlich sagen, was nur als Standbild geprüft wurde.

## Aufbau (kurz)

- Jeder Spielmodus ist eine „Welt“ in `WELTEN.<name>` (`js/hof.js`, `js/ausritt.js`, `js/rennen.js`, `js/dressur.js`, `js/voltigieren.js`, `js/gelaende.js`), Ablauf und Menü in `js/spiel.js` (`KERN`).
- Personen: `baueFigur(outfit, opt)` in `js/figur.js` (Gelenke, Posen `FIGUR_POSEN`, Mixamo-Bewegungen `MOCAP` aus `js/bewegungen.js`). Zu sehen ist ein Mensch aus MakeHuman (`js/mensch.js`, `modelle/menschen/`, Anleitung `tools/figur/LIESMICH.md`). Die eigene Reiterin sitzt in `js/pferd.js` (`reitFigur`).
- Pferde: `js/pferd.js` (eigenes Pferd), `js/herde.js` (alle anderen), Modelle in `modelle/`.
- Gebäude, Bäume, Möbel: `js/modelle3d.js` lädt `modelle/umwelt/<name>.js` bei Bedarf.
- Spielstand: `js/stand.js` (`STAND`, localStorage `reitturnier_hof`). Einstellbares: `js/config.js`.
- Dressur (`js/dressur.js`): sechs Aufgaben von Klasse E bis Grand Prix (`AUFGABEN`), gebaut mit einer kleinen Zeichen-Sprache (`Bauer`: `bahn`, `kreis`, `seit`, `wechsel`, `lek` …), besondere Lektionen in `SPEZ`, Notenbogen in `fertig`, Lexikon `WISSEN`. Was nachgeschlagen ist und was nicht: `docs/dressur.md`. Prüfen ohne Bild: `node tools/dressur.mjs` (malt `tools/dressur.svg`).
- Musik: MP3-Dateien in `musik/`, Liste `MUSIKLISTE` in `musik/musik.js`, abgespielt in `js/sound.js` (`musikWunsch` sucht das Stück zur Welt; eine Welt kann mit `musik` selbst eins nennen). Der Ton-Knopf hat vier Stufen: laut mit Musik, leise mit Musik, nur Geräusche, aus. Nur CC0, Quellen in `musik/CREDITS.md`. Angehört hat die Stücke noch niemand.
- Tempo-Wächter (`tempoPruefen` in `js/spiel.js`, abgeschaut vom Rennspiel): Dauert ein Bild zu lange, malt das Spiel mit weniger Bildpunkten.
- App: Capacitor in `ios/`, `npm run sync` kopiert nach `www/` (`scripts/copy-web.mjs`, neue Ordner dort in `FILES`). Anleitung `APP-ANLEITUNG.md`.

## Testen

Playwright ohne Fenster (`--use-gl=swiftshader --allow-file-access-from-files`), `file:///…/index.html` öffnen. Vorher im localStorage `reitturnier_hof` = `{"neuigkeiten6":true}` setzen,
sonst liegt eine Karte über dem Spiel. Welt starten: Knopf mit dem Namen des Modus, dann `#modusStart`. `SPIEL.vor(sek)` spult vor.
Die Menschen-Modelle brauchen im Test-Browser bis zu 20 Sekunden zum Laden. `?ohnemenschen` zeigt die alten Figuren aus Klötzen.
