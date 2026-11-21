# Dressur im Spiel – was dahintersteckt

Stand 21.11.2026. Die Dressur im Spiel ist den echten Regeln nachgebaut, aber vereinfacht.
Diese Datei sagt, was nachgeschlagen ist und was nicht.

## Was im Spiel ist

| Klasse im Spiel | Viereck | Was dazukommt |
|---|---|---|
| Klasse E | 20 × 40 m | Schritt, Arbeitstrab, Arbeitsgalopp, Zirkel 20 m, durch die ganze Bahn wechseln, Halten und Grüßen |
| Klasse A | 20 × 40 m | Volte 10 m, Schlangenlinien, Tritte verlängern, Schenkelweichen, Rückwärtsrichten |
| Klasse L | 20 × 40 m | Volte 8 m, Mitteltrab, Mittelgalopp, Kurzkehrt, Außengalopp, einfacher Galoppwechsel |
| Klasse M | 20 × 60 m | Schulterherein, Travers, Traversalen, starker Trab, fliegender Galoppwechsel |
| Klasse S | 20 × 60 m | Traversalen im Zickzack, halbe Galopp-Pirouetten, Wechsel alle 4 und alle 3 Sprünge |
| Grand Prix | 20 × 60 m | Passage, Piaffe, ganze Pirouetten, Zweier- und Einerwechsel |

Dazu die Kür mit Musik (wie vorher) und das Lexikon „Dressur-Wissen“ mit sieben Seiten.
Die sechs Aufgaben sind **selbst zusammengestellt** – es sind nicht die amtlichen Aufgaben
aus dem Aufgabenheft der FN oder der FEI (die sind geschützt und viel länger).

## So wird bewertet

- Jede Lektion bekommt von drei Richtern (bei E, C und M) eine Note von 0 bis 10, auch halbe Noten.
- Wichtige Lektionen zählen doppelt (Koeffizient 2).
- Am Ende drei Schlussnoten: Takt und Gangarten, Durchlässigkeit, Sitz und Einwirkung (mal 2).
- Ergebnis in Prozent = erreichte Punkte geteilt durch mögliche Punkte.
- Verreiten (nur wenn man selbst lenkt): Der Richter läutet, es gibt Abzug in Prozentpunkten.
- Die Note im Spiel rechnet sich aus: Wie genau war die Linie? Stimmte die Gangart?
  Wurde die besondere Lektion gezeigt (Knopf halten)? Wurden die Wechsel am Stern getroffen?

## Nachgeschlagen (Websuche am 21.11.2026)

- Noten 0 bis 10 und ihre Namen (10 ausgezeichnet … 0 nicht ausgeführt), halbe Noten erlaubt.
- Die Klassen E, A, L, M, S in Deutschland; Seitengänge ab Klasse M, Zickzack-Traversalen
  und Serienwechsel in Klasse S, ganze Galopp-Pirouette erst in den höchsten Aufgaben.
- International (FEI): Prix St. Georges, Intermédiaire I und II, Grand Prix, Grand Prix Special, Kür.
  Dort gibt es nur noch eine Schlussnote (mal 2); im Spiel sind es drei, wie in deutschen Aufgaben.
- Kür: A-Note (Technik) und B-Note (künstlerisch: Rhythmus, Harmonie, Choreographie,
  Schwierigkeitsgrad, Musik).

## Nicht nachgeschlagen (allgemeines Reiter-Wissen, kann im Kleinen abweichen)

- Die genauen Abstände der Bahnpunkte (im Spiel: K, H, M, F 6 m von der kurzen Seite;
  im großen Viereck V, S, R, P 12 m weiter).
- Welche Lektion genau in welcher Klasse zum ersten Mal vorkommt.
- Wie viel Abzug es fürs Verreiten gibt (im Spiel ausgedacht: 0,5, dann 1,5, dann je 2 Prozentpunkte).
- Wikipedia und die Seiten der FEI waren vom Test-Rechner aus nicht erreichbar.

## Prüfen

`node tools/dressur.mjs` baut alle Aufgaben ohne Bild, prüft Lücken und Linien außerhalb
des Vierecks und malt `tools/dressur.svg`.
