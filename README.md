# Reitturnier

Ein 3D-Springreitspiel für den Browser. Das Pferd galoppiert über einen Parcours, und du drückst im richtigen Moment auf „Springen“.

## Starten

Repository herunterladen (grüner Knopf **Code**, dann **Download ZIP**), entpacken und `index.html` doppelklicken. Das Spiel läuft in Chrome, Edge oder Firefox, ohne Installation und ohne Internet.

## Was das Spiel kann

- Reiterin ankleiden, Pferd und Sattel einfärben
- Sprung-Timing mit Farbzonen: Dunkelgrün 3 Punkte, Hellgrün 2, Gelb 1, Rot Abwurf, ohne Drücken Verweigerung
- Turnier mit bis zu 4 Spielern am selben Rechner und bis zu 3 Computergegnern in vier Stärken
- Stechen bei Gleichstand, Siegerehrung mit Medaille und Siegerschleife
- Drei Steuerungsarten: automatisch, selbst lenken, lenken und Tempo bestimmen
- Stadion mit Zuschauern, Galoppklang und Applaus

Die ausführliche Anleitung steht in [LIESMICH.txt](LIESMICH.txt).

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite mit Menü und Anzeigen |
| `css/style.css` | Aussehen von Menü und Anzeigen |
| `js/config.js` | Einstellungen: Farben, Timing, Parcours, Gegnerstärken, Steuerung |
| `js/pferd.js` | Pferd und Reiterin |
| `js/platz.js` | Reitplatz, Stadion, Hindernisse |
| `js/spiel.js` | Spielablauf, Punkte, Turnier, Kamera, Ton |
| `js/three.min.js`, `js/gltf-lader.js` | 3D-Bibliothek three.js und Modell-Lader |
| `modelle/` | 3D-Modelle, als Text verpackt, damit das Spiel ohne Server läuft |

Neue Parcours, Farben und Schwierigkeiten lassen sich in `js/config.js` eintragen.

## Verwendete 3D-Modelle

Beide stehen unter der Lizenz [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) und wurden für das Spiel angepasst.

- [Animated Rigged Horse With Saddle](https://sketchfab.com/3d-models/animated-rigged-horse-with-saddle-b08743c2c4734fb98a4e0a2f5767c318) von Ayan: umgefärbt, Satteltasche ausgeblendet, Animation als Schleife
- [Show jumping, Horse jumping obstacles](https://sketchfab.com/3d-models/show-jumping-horse-jumping-obstacles-67ff46cf20504428a1f7cf7c2e73ed3d) von Every 3D: Texturen verkleinert, Teile neu zusammengestellt und eingefärbt

Die 3D-Bibliothek [three.js](https://threejs.org) steht unter der MIT-Lizenz, siehe `js/three-LICENSE.txt`.
