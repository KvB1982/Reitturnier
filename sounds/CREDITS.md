# Geräusche im Spiel

Alle Geräusche stammen von [Freesound.org](https://freesound.org) und stehen unter der Lizenz
**Creative Commons 0 (CC0 1.0, gemeinfrei)**: https://creativecommons.org/publicdomain/zero/1.0/

Eine Namensnennung ist bei CC0 nicht nötig. Wir bedanken uns trotzdem bei allen, die ihre Aufnahmen verschenkt haben.

Die Aufnahmen wurden zugeschnitten, in der Lautstärke angeglichen und als MP3 (mono) in `sounds/sounds.js` eingebettet.

| Geräusch | Name im Spiel | Original | Von | Quelle |
|---|---|---|---|---|
| Wiehern | `wiehern1` | Renill de cavall / Horse Neigh |  | https://freesound.org/s/826753/ |
| Wiehern | `wiehern2` | horse's whinny |  | https://freesound.org/s/347036/ |
| Wiehern | `wiehern3` | Horse_Whinny.wav |  | https://freesound.org/s/149024/ |
| Schnauben | `schnauben1` | Horse(snort)_3.wav |  | https://freesound.org/s/475483/ |
| Schnauben | `schnauben2` | G38-16-Four Horse Snorts.wav |  | https://freesound.org/s/437111/ |
| Leises Brummeln | `brummeln` | Horses - Soft Nicker |  | https://freesound.org/s/861234/ |
| Hufe im Schritt | `schritt1 bis schritt4` | SFX - Horse - Walk.wav |  | https://freesound.org/s/581833/ |
| Hufe im Trab und Galopp | `trab1 bis trab4` | SFX - Horse - Trot.wav |  | https://freesound.org/s/581834/ |
| Pferd frisst | `fressen` | Horse eating carrot |  | https://freesound.org/s/382290/ |
| Apfel | `apfel` | Biting into an apple.wav |  | https://freesound.org/s/494568/ |
| Mistgabel | `gabel1, gabel2` | Pitchfork.mp3 |  | https://freesound.org/s/636095/ |
| Mist in die Karre | `schaufel` | shoveling-dirt |  | https://freesound.org/s/849840/ |
| Landung nach dem Sprung | `landung` | object falling on grass |  | https://freesound.org/s/711443/ |
| Stange fällt | `stange` | wood_hit.wav |  | https://freesound.org/s/79391/ |
| Stange fällt | `stange` | Small Sticks Drop |  | https://freesound.org/s/773759/ |
| Klatschen | `klatschen` | Small applause |  | https://freesound.org/s/462362/ |
| Jubel | `jubel` | smallcrowd.wav |  | https://freesound.org/s/32260/ |
| Publikum „Ooh“ | `oh` | aww.wav |  | https://freesound.org/s/124996/ |
| Hund Bello | `hund` | Single Dog Bark |  | https://freesound.org/s/277058/ |
| Hund | `hund2` | Dog Bark |  | https://freesound.org/s/495658/ |
| Katze Minka | `katze` | cat meow |  | https://freesound.org/s/110011/ |
| Huhn | `huhn` | Chicken clucking 1 |  | https://freesound.org/s/668805/ |
| Hahn am Morgen | `hahn` | Rooster Crow 1 |  | https://freesound.org/s/435508/ |
| Schaf | `schaf1` | Sheep baaing 5 - Norwegian sheep expressing itself concisely |  | https://freesound.org/s/710300/ |
| Schaf | `schaf2` | sheep 3.mp3 |  | https://freesound.org/s/171149/ |
| Kuh | `kuh` | cows_mooing_mono_4824.wav |  | https://freesound.org/s/401636/ |
| Ente | `ente` | single quack from a duck |  | https://freesound.org/s/418509/ |
| Eule in der Nacht | `eule` | Owl Hoot |  | https://freesound.org/s/465697/ |
| Knopf-Klick | `klick` | UI Button Click |  | https://freesound.org/s/467951/ |
| Münze | `muenze` | Coin_C_07 |  | https://freesound.org/s/350875/ |
| Platsch ins Wasser | `platsch` | Waboba Moon Ball Water Splash 7 |  | https://freesound.org/s/867462/ |
| Baum fällt um | `baum` | A Tree Falling Down.wav |  | https://freesound.org/s/139952/ |
| Kirchenglocke im Dorf | `glocke` | Church Bell |  | https://freesound.org/s/518343/ |
| Vogelgezwitscher (Schleife) | `voegel` | Birds Loop |  | https://freesound.org/s/393699/ |
| Wind (Schleife) | `wind` | Windloop6sec.wav |  | https://freesound.org/s/135034/ |
| Bach (Schleife) | `bach` | babbling_brook_loop.wav |  | https://freesound.org/s/222752/ |
| Traktor (Schleife) | `traktor` | tractor idling |  | https://freesound.org/s/149193/ |
| Regen (Schleife) | `regen` | Soft Rain Loop |  | https://freesound.org/s/595717/ |
| Grillen in der Nacht (Schleife) | `grillen` | Outdoors_Night_CricketsLoop.wav |  | https://freesound.org/s/521843/ |
| Striegeln (Schleife) | `buerste` | Light brushing |  | https://freesound.org/s/791893/ |
| Wasserschlauch (Schleife) | `wasser` | F6_hose.mp3 |  | https://freesound.org/s/371715/ |

Die Melodien (Fanfare, Zähler, Dressurmusik) erzeugt das Spiel selbst.

## Neues Geräusch einbauen

1. Auf Freesound nach der Lizenz „Creative Commons 0“ filtern.
2. Als kurze MP3 speichern und als Base64-Text in `sounds/sounds.js` eintragen: `SOUNDDATEN.ton["name"]="…";`
3. Im Spiel abspielen mit `SOUND.spiel('name')`.
4. Hier in die Tabelle eintragen.
