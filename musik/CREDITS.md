# Musik im Spiel – woher sie kommt

Alle Stücke kommen von [Freesound.org](https://freesound.org) und stehen unter der Lizenz
**CC0** (Creative Commons Zero: frei für alles, der Name muss nicht genannt werden – wir nennen ihn trotzdem gern).
Heruntergeladen am 21.11.2026 als MP3-Vorschau, auf höchstens 90 Sekunden gekürzt, am Anfang und Ende
weich ein- und ausgeblendet, alle gleich laut gemacht (ffmpeg) und als MP3 mit 80 kbit/s gespeichert.

| Datei | Wo es läuft | Titel bei Freesound | von | Link |
|---|---|---|---|---|
| `menue.mp3` | Hauptmenü | Nodens (Field Song) | axtoncrolley | https://freesound.org/s/172707/ |
| `hof.mp3` | Pferdehof | calm_happy_rpgTownBackground | SciCodeDev | https://freesound.org/s/442911/ |
| `zimmer.mp3` | im Haus | Music Box – J. Brahms – Opus 39 – Waltz no 3 | Flying_Deer_Fx | https://freesound.org/s/369405/ |
| `ausritt.mp3` | Ausritt | After Afternoon | mochadaddy | https://freesound.org/s/718119/ |
| `springen.mp3` | Springen | Cute Happy Background Music | Seth_Makes_Sounds | https://freesound.org/s/666720/ |
| `rennen.mp3` | Galopprennen | Orchestral_Song_Short4 | bainmack | https://freesound.org/s/567196/ |
| `gelaende.mp3` | Military | Medieval March | G-14 | https://freesound.org/s/646460/ |
| `voltigieren.mp3` | Voltigieren | Another Baroque Heaven | younoise | https://freesound.org/s/673524/ |
| `dressur.mp3` | Dressur | J.S.Bach BWV 816 Gavotte | tootoos24 | https://freesound.org/s/737895/ |

Die Kür in der Dressur macht ihre Musik weiter selbst (im Takt von Schritt, Trab und Galopp).

## Wichtig

- Die Stücke sind nach Titel, Beschreibung und Lautstärke-Verlauf ausgesucht. **Angehört hat sie noch niemand** –
  im Test-Rechner gibt es keinen Lautsprecher. Passt ein Stück nicht, einfach die Datei tauschen
  oder in `musik/musik.js` die Zeile löschen (dann ist es dort still).
- Neue Musik: nur **CC0** (bei Freesound der Filter „Creative Commons 0“), hier eintragen.
  Etwa 60 bis 90 Sekunden reichen, das Stück läuft im Kreis.
- Welches Stück wo läuft, steht in `musik/musik.js`. Abgespielt wird in `js/sound.js`.
