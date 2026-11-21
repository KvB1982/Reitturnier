# Menschen aus MakeHuman

Alle Personen im Spiel (Reiterin, Lotte, Hofkinder, Tierärztin, Hufschmied, Richter, Zuschauer …) sind Menschen aus
MakeHuman / MPFB (CC0). Die Idee und das Bau-Skript kommen aus dem Polizeispiel (`KvB1982/Police-Quest`, `tools/figur/`).

## Was im Spiel liegt

- `modelle/menschen/maedchen.js`, `junge.js`, `frau.js`, `mann.js`: je ein Körper mit Haut, Augen, Brauen, Wimpern, Oberteil,
  Reithose und Stiefeln (etwa 30.000 Dreiecke, 1,2 MB). Die Kleidung ist grau gemalt, das Spiel färbt sie mit den Farben aus dem Outfit.
- `modelle/menschen/haar_<name>.js`: acht Frisuren ohne Knochen (zopf, zoepfe, kurz, lang, dutt, flecht, locken, kurzj für Jungen und Männer).
- `js/mensch.js`: lädt die Dateien erst, wenn sie gebraucht werden, und hängt den Menschen an die Figur aus `js/figur.js`.
  Die Figur aus Klötzen bleibt unsichtbar als Gerüst: Der Mensch macht jede Bewegung ihrer Gelenke nach. Deshalb gehen alle Posen
  (`FIGUR_POSEN`), das Reiten und die Mixamo-Bewegungen (`js/bewegungen.js`) ohne Änderung weiter.
- Welcher Körper: `outfit.art` = `maedchen` (ohne Angabe), `junge`, `frau`, `mann`. Im Menü wählt man „Ich bin: Mädchen / Junge“.
- Abschalten zum Vergleichen: Adresse mit `?ohnemenschen`, oder Landschaft „Einfach (schneller)“.

## Neu bauen

1. Einmal einrichten: `pip install bpy numpy`, `git clone --depth 1 https://github.com/makehumancommunity/mpfb2.git`,
   den Ordner `mpfb2/src/mpfb` nach `~/.config/blender/5.3/extensions/user_default/mpfb` kopieren.
2. Die CC0-Pakete von https://files.makehumancommunity.org/asset_packs/ (`system_assets/makehuman_system_assets_cc0.zip`, `hair01`, `shirts01`,
   `pants01`, `shoes01`) nach `~/.config/blender/5.3/extensions/.user/user_default/mpfb/data` auspacken (Ordner `skins`, `hair`, `clothes`, `eyes` …).
3. Körper bauen (Beispiel Mädchen), dann verkleinern und einpacken:

```bash
python3 tools/figur/mensch.py maedchen_roh.glb '{"name":"maedchen","gender":0.0,"age":0.23,"weight":0.4,"muscle":0.45,"height":0.5,"haut":"young_caucasian_female","augenfarbe":"blue","oberteil":"toigo_fisherman_sweater","hose":"toigo_wool_pants","schuhe":"culturalibre_hero_boots_2","dick":{"oberteil":0.009,"schuhe":0.004,"hose":0.003},"instiefel":true,"bild":{"haut":1024}}'
npx gltf-transform webp maedchen_roh.glb a.glb --quality 80 && npx gltf-transform quantize a.glb maedchen.glb
node tools/figur/pack.mjs maedchen.glb modelle/menschen/maedchen.js maedchen
```

   Die anderen: Junge `gender 1, age 0.23, young_caucasian_male, namuhekam_male_polo_shirt`; Frau `gender 0, age 0.5, young_caucasian_female2`;
   Mann `gender 1, age 0.58, weight 0.55, middleage_caucasian_male, namuhekam_male_polo_shirt, cortu_cargo_pants`.
4. Frisur bauen: dieselben Körper-Zahlen, dazu `"haare":"ponytail01","nurhaare":true`; vor dem Einpacken zusätzlich
   `npx gltf-transform resize … --width 512 --height 512`. Name der Datei `haar_<name>`. Zuordnung der Frisuren: `FRISUR` in `js/mensch.js`
   (zopf = ponytail01, zoepfe = elvs_double_mh_braid, kurz = short03, lang = long01, dutt = rehmanpolanski_hair_bun_brown, flecht = braid01,
   locken = culturalibre_hair_06, kurzj = short04 auf dem Jungen).

Nicht `gltf-transform simplify` benutzen, das zerstört die kleinen Augen.

## Bekannte Grenzen (Stand 21.11.2026)

- Nur als Standbilder im Test-Browser angesehen (Posen nebeneinander, Hof, Menü, Galopprennen), nicht in Bewegung und nicht auf dem iPad.
- Der Rücken beugt sich nur an einer Stelle und der Kopf nur am Kopf-Gelenk, wie bei der alten Figur. Dafür sitzen Helm, Haare und alles in den Händen genau.
- Haare sind starr (sie wehen und wippen nicht). Unter dem Helm schauen sie hervor. Die Frisur „hoher Zopf mit Schleife“ ist der normale Pferdeschwanz.
- Hände greifen nicht (Finger bleiben locker), das Gesicht ist starr.
- Kinderkleidung gibt es bei MakeHuman nicht: Die Kinder tragen Erwachsenen-Kleidung, die MakeHuman auf den Kinderkörper zieht.
- Schmuck aus dem Reitladen (Umhang, Flügel, Kappen-Schmuck) sitzt an den alten Stellen und passt nur ungefähr.
