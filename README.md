# Reitturnier

Ein 3D-Reitspiel für den Browser mit einem ganzen Pferdehof: Pferde pflegen und füttern, Springen, Dressur, Galopprennen, Military im Gelände und Voltigieren.

## Starten

**Direkt spielen:** https://kvb1982.github.io/Reitturnier/ (auch auf iPad und iPhone)

Oder ohne Internet: Repository herunterladen (grüner Knopf **Code**, dann **Download ZIP**), entpacken und `index.html` doppelklicken. Das Spiel läuft in Chrome, Edge oder Firefox, ohne Installation und ohne Internet.

## Pferdehof und Modi

Im Menü wählst du oben, was du spielen möchtest. Jeder Modus lässt sich direkt starten, oder du lebst auf dem **Pferdehof** und gehst zu Fuß dorthin.

- **Pferdehof:** frei im Stall und auf dem Hof herumlaufen, in die Boxen gehen, sechs Pferde mit eigenen Stärken. Jedes Pferd hat Anzeigen für Sauberkeit, Hunger und Fitness.
- **Pflegen:** abspritzen, striegeln, Hufe auskratzen, ausmisten, frisches Stroh einstreuen. Hafer, Heu und Möhren holt man im Vorratsraum und bringt sie in Trog und Raufe.
- **Führen:** Pferd am Halfter aus der Box holen und zum Trainingsplatz, Turnierplatz, zur Rennbahn, ins Gelände, in die Schrittmaschine, in den Longierzirkel oder auf die Weide bringen. Wo man hingeht, startet der passende Modus.
- **Springen:** Training auf dem Trainingsplatz, Turnier auf dem Turnierplatz.
- **Dressur:** Viereck 20 × 40 Meter mit den Bahnpunkten A K E H C M B F und X. Hufschlagfiguren wie Zirkel, „durch die ganze Bahn wechseln“ und Schlangenlinie in Schritt, Trab und Galopp, Noten von 0 bis 10.
- **Galopprennen:** eine Runde auf der Rennbahn gegen fünf Gegner, Ausdauer einteilen und im Endspurt anfeuern.
- **Military:** Geländeritt auf Zeit über Baumstämme, Hecken, Gräben, durch Fluss und Furt, über die Brücke, bergauf und bergab durch den Wald.
- **Voltigieren:** Pflichtübungen auf dem galoppierenden Pferd an der Longe: Aufsprung, Grundsitz, Fahne, Mühle, Schere, Stehen, Abgang. Im Galopptakt beginnen, dann das Gleichgewicht halten.
- **Münzen und Reitladen:** Für Pflege, Training und Siege gibt es Münzen. Im Reitladen kauft man Gamaschen, Fliegenhauben, Mähnenschleifen, Sättel und mehr und zieht sie den Pferden in der Box an.
- Andere Reitmädchen laufen über den Hof, füttern, misten und reiten.

Auf iPad und iPhone läuft man mit dem Finger wie mit einem Steuerknüppel, der große Knopf unten führt die jeweilige Aktion aus.

## Springen

- Reiterin ankleiden, Pferd und Sattel einfärben
- Sprung-Timing mit Farbzonen: Dunkelgrün 3 Punkte, Hellgrün 2, Gelb 1, Rot Abwurf, ohne Drücken Verweigerung
- Turnier mit bis zu 4 Spielern am selben Rechner und bis zu 3 Computergegnern in vier Stärken
- Stechen bei Gleichstand, Siegerehrung mit Medaille und Siegerschleife
- Drei Steuerungsarten: automatisch, selbst lenken, lenken und Tempo bestimmen
- Auf iPad und iPhone: tippen springt, links / rechts wischen lenkt, hoch / runter wischen ändert das Tempo
- Stadion mit Zuschauern, Galoppklang und Applaus

Die ausführliche Anleitung steht in [LIESMICH.txt](LIESMICH.txt).

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite mit Menü und Anzeigen |
| `css/style.css` | Aussehen von Menü und Anzeigen |
| `js/config.js` | Einstellungen: Farben, Timing, Parcours, Gegnerstärken, Steuerung |
| `js/pferd.js` | Pferd und Reiterin im Springen |
| `js/stand.js` | Spielstand: Münzen, Zustand der Pferde, gekaufte Sachen |
| `js/herde.js` | Pferde für Hof und Rennen: Fellfarben, Schmutz, Schritt, Trab, Galopp |
| `js/figur.js` | bewegliche Figuren (Spielerin zu Fuß, andere Reitmädchen, Voltigiererin) |
| `js/reiten.js` | gemeinsame Bausteine: Reiten, Kamera, Zäune, Bäume, Schilder |
| `js/hof.js`, `js/pflege.js` | Pferdehof mit Stall, Vorratsraum, Laden und der Pflege in der Box |
| `js/rennen.js`, `js/gelaende.js`, `js/dressur.js`, `js/voltigieren.js` | Galopprennen, Military, Dressur, Voltigieren |
| `js/platz.js` | Reitplatz, Stadion, Hindernisse |
| `js/spiel.js` | Spielablauf, Punkte, Turnier, Kamera, Ton |
| `js/three.min.js`, `js/gltf-lader.js` | 3D-Bibliothek three.js und Modell-Lader |
| `modelle/` | 3D-Modelle, als Text verpackt, damit das Spiel ohne Server läuft |

Neue Parcours, Farben, Schwierigkeiten, Hofpferde (`HOF_PFERDE`), Ladenartikel (`LADEN`) und Preisgelder (`PREISGELD`) lassen sich in `js/config.js` eintragen.

## Verwendete 3D-Modelle

Beide stehen unter der Lizenz [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) und wurden für das Spiel angepasst.

- [Animated Rigged Horse With Saddle](https://sketchfab.com/3d-models/animated-rigged-horse-with-saddle-b08743c2c4734fb98a4e0a2f5767c318) von Ayan: umgefärbt, Satteltasche ausgeblendet, Animation als Schleife
- [Show jumping, Horse jumping obstacles](https://sketchfab.com/3d-models/show-jumping-horse-jumping-obstacles-67ff46cf20504428a1f7cf7c2e73ed3d) von Every 3D: Texturen verkleinert, Teile neu zusammengestellt und eingefärbt

Die 3D-Bibliothek [three.js](https://threejs.org) steht unter der MIT-Lizenz, siehe `js/three-LICENSE.txt`.
