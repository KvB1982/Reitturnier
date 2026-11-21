# Reitturnier als iPad- und iPhone-App

Das Spiel bleibt, wie es ist. [Capacitor](https://capacitorjs.com) packt die vorhandenen Dateien in eine echte App, genau wie bei Frontlinie 3. Das Xcode-Projekt liegt fertig im Ordner `ios`.

## Was die App anders macht als der Browser

- Echtes Vollbild ohne Statusleiste, fest im Querformat.
- Knöpfe und Anzeigen halten Abstand zur Kerbe und zum Home-Balken.
- Auf dem iPhone vibriert es kurz bei der Landung nach einem Sprung. iPads haben keinen Vibrationsmotor, dort bleibt es still.
- Alles liegt in der App und läuft ohne Internet.
- Der Spielstand der App ist getrennt vom Spielstand im Browser.

## Einmal einrichten (auf dem Mac)

Du brauchst **Xcode** (Version 26 oder neuer) und **Node.js** (https://nodejs.org, Version „LTS“). Beides ist von Frontlinie 3 schon da.

Im Programm **Terminal**:

```bash
cd ~/Documents
git clone https://github.com/KvB1982/Reitturnier.git
cd Reitturnier
npm install
npm run ios
```

`npm run ios` kopiert das Spiel in die App und öffnet Xcode. Beim ersten Öffnen lädt Xcode ein paar Pakete nach. Das dauert ein bis zwei Minuten und braucht Internet.

## Signieren

Das Team (`AX2SZQVU9L`, dasselbe wie bei Frontlinie 3 und Powershot) und die Kennung `de.kvb1982.reitturnier` sind schon eingetragen. Falls Xcode trotzdem fragt:

1. Links oben auf das blaue Symbol **App** klicken, dann unter „Targets“ wieder **App** wählen.
2. Reiter **Signing & Capabilities**: Haken bei **Automatically manage signing**, bei **Team** dein Team wählen.

## Auf iPad oder iPhone starten

1. Gerät per Kabel anschließen, entsperren und „Diesem Computer vertrauen“ antippen.
2. In Xcode oben in der Mitte das Gerät als Ziel auswählen.
3. Auf den Pfeil **▶** klicken oder `⌘R` drücken.

Ohne Gerät kannst du oben auch einen Simulator wählen (zum Beispiel „iPad Pro“).

## TestFlight

1. Einmalig auf https://appstoreconnect.apple.com unter **Apps → „+“ → Neue App** anlegen: Plattform iOS, Name „Reitturnier“ (falls vergeben, etwas anhängen), Bundle-ID `de.kvb1982.reitturnier`.
2. In Xcode oben als Gerät **Any iOS Device (arm64)** wählen, dann **Product → Archive**.
3. Im Fenster „Organizer“: **Distribute App → TestFlight & App Store → Upload**.
4. In App Store Connect unter **TestFlight** die Tester eintragen.

Bei jedem neuen Upload muss die Build-Nummer steigen: Ziel **App → General → Build** (im Projekt `CURRENT_PROJECT_VERSION`, im Moment 1).

## Nach Änderungen am Spiel

```bash
git pull
npm install
npm run sync
```

Danach in Xcode wieder auf ▶ oder neu archivieren. `npm run sync` kopiert die aktuellen Spieldateien in die App.

## Ohne Mac: als Web-App auf den Home-Bildschirm

Auf iPad oder iPhone in **Safari** https://kvb1982.github.io/Reitturnier/ öffnen, auf **Teilen** tippen und **Zum Home-Bildschirm** wählen. Das Spiel startet dann mit eigenem Symbol im Vollbild und läuft nach dem ersten Start auch ohne Internet (Landschaftsmodelle, die noch nie zu sehen waren, fehlen dann).

## Vor dem App Store

- **Modell-Lizenzen prüfen:** Pferd und Hindernisse stehen unter CC BY 4.0 (Namensnennung steht im Menü). Für die Modelle aus 3D AI Studio vor einer Veröffentlichung die Nutzungsbedingungen prüfen. Die Geräusche sind CC0 (`sounds/CREDITS.md`).
- **Version:** Für jedes Update „Version“ und „Build“ hochzählen.

## Was wo liegt

| Datei oder Ordner | Zweck |
| --- | --- |
| `index.html`, `css`, `js`, `modelle`, `sounds` | Das Spiel. Dieselben Dateien laufen weiter auf der Webseite. |
| `js/native.js` | Kleine Brücke für die App (Vibration). Im Browser macht sie nichts. |
| `manifest.webmanifest`, `sw.js`, `icons` | Für „Zum Home-Bildschirm“: Name, Symbol und Spielen ohne Internet. |
| `capacitor.config.json` | Name, Kennung und Einstellungen der App. |
| `scripts/copy-web.mjs` | Kopiert das Spiel nach `www`. Neue Ordner mit Spieldateien müssen dort in die Liste. |
| `www` | Kopie des Spiels für die App. Wird automatisch erzeugt, nicht von Hand ändern. |
| `ios` | Das Xcode-Projekt (Symbol und Startbild in `ios/App/App/Assets.xcassets`). |
