// ============================================================
//  Aufnahmen für das Vorlesen
//
//  node tools/sprache.mjs          zeigt, welche Sätze noch keine Aufnahme haben,
//                                  und schreibt sprache/sprache.js neu
//  node tools/sprache.mjs json     gibt die fehlenden Sätze als Liste aus
//
//  Jede Person mit einer Stimme (STIMMEN) bekommt für jeden ihrer Sätze
//  eine Datei sprache/<person>/<name>.mp3. Sätze mit {ich}, {meins} oder
//  {fohlen} lassen sich nicht aufnehmen (die Namen sucht ja das Kind aus),
//  die liest weiter die Stimme des Geräts.
//  Die Aufnahmen selbst kommen aus der Sprachausgabe von 3D AI Studio
//  (Sprache Deutsch). Ändert man einen Satz, muss seine Aufnahme neu gemacht werden.
// ============================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Wer spricht mit welcher Stimme? (von Kristian am 27.11.2026 ausgesucht)
export const STIMMEN = { emma: 'Laura', jonas: 'Will', lotte: 'Lily', hanna: 'Sarah', lina: 'Jessica', mia: 'Matilda', ben: 'Liam', paul: 'Chris' };
// Das Pflegepferd jeder Person, so wie es am Anfang heißt
const PFLEGEPFERD = { emma: 'Blitz', jonas: 'Sternchen', hanna: 'Donner', ben: 'Karamell', lina: 'Flocke', paul: 'Krümel' };

// Die Gespräche und Geschichten aus dem Spiel holen (ohne Browser)
const welt = { STAND: { daten: {} }, window: { addEventListener() {} }, localStorage: { getItem() { return null; } } };
vm.createContext(welt);
for (const f of ['js/reden.js', 'js/ereignisse.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), welt);

// Wer kein Pflegepferd hat, erzählt vom Schulpony (OHNE_PFERD in js/reden.js)
const OHNE_PFERD = 'Mücke';
const saetze = [];                       // { wer, name, text }
function nimm(wer, name, text) {
  if (!text || /\{(ich|meins|fohlen)\}/.test(text)) return;
  if (!/\{pferd\}/.test(text)) { saetze.push({ wer, name, text }); return; }
  // Sätze mit Pferdenamen gibt es zweimal: mit dem Pflegepferd und (Name mit ~) mit dem Schulpony,
  // falls das Pflegepferd inzwischen dem Kind gehört, das spielt
  if (PFLEGEPFERD[wer]) saetze.push({ wer, name, text: text.replace(/\{pferd\}/g, PFLEGEPFERD[wer]) });
  saetze.push({ wer, name: name + '~', text: text.replace(/\{pferd\}/g, OHNE_PFERD) });
}
for (const wer of Object.keys(STIMMEN)) {
  for (const g of [...(welt.REDEN.GESPRAECHE[wer] || []), ...welt.REDEN.GESPRAECHE['*']]) {
    nimm(wer, g.id, g.text);
    (g.antworten || []).forEach((a, i) => nimm(wer, g.id + '_' + i, a.dann));
  }
  for (const g of welt.EREIGNISSE.GESCHICHTEN) g.schritte.forEach((s, nr) => {
    if (s.art !== 'rede' || s.wer !== wer) return;
    nimm(wer, g.id + '_' + nr, s.text);
    (s.antworten || []).forEach((a, i) => nimm(wer, g.id + '_' + nr + '_' + i, a.dann));
  });
}

// Was gibt es schon? Der Text der alten Liste zeigt, ob eine Aufnahme noch zum Satz passt.
let alt = {};
const listeDatei = join(root, 'sprache/sprache.js');
if (existsSync(listeDatei)) { const w = {}; vm.createContext(w); vm.runInContext(readFileSync(listeDatei, 'utf8'), w); alt = w.SPRACHE || {}; }
const neuDa = process.argv.includes('neu');   // "neu" = alle vorhandenen Dateien gelten als frisch aufgenommen
const liste = {}, fehlt = [];
for (const s of saetze) {
  const name = s.wer + '/' + s.name, da = existsSync(join(root, 'sprache', name + '.mp3'));
  if (da && (neuDa || alt[name] === s.text)) liste[name] = s.text;
  else fehlt.push({ ...s, stimme: STIMMEN[s.wer], veraltet: da });
}
// Dateien, die zu keinem Satz mehr gehören
const uebrig = [];
for (const wer of Object.keys(STIMMEN)) {
  const ordner = join(root, 'sprache', wer);
  if (!existsSync(ordner)) continue;
  for (const f of readdirSync(ordner)) if (f.endsWith('.mp3') && !saetze.some(s => s.wer === wer && s.name + '.mp3' === f)) uebrig.push(join(ordner, f));
}
if (process.argv.includes('aufraeumen')) uebrig.forEach(f => unlinkSync(f));

writeFileSync(listeDatei, '// Aufnahmen für das Vorlesen. Nicht von Hand ändern: node tools/sprache.mjs schreibt diese Liste.\n// "person/name": der Satz, der in sprache/person/name.mp3 gesprochen wird\nvar SPRACHE = ' + JSON.stringify(liste, null, 1) + ';\n');

if (process.argv.includes('json')) console.log(JSON.stringify(fehlt));
else {
  console.log(saetze.length + ' Sätze, ' + Object.keys(liste).length + ' mit Aufnahme, ' + fehlt.length + ' fehlen' + (uebrig.length ? ', ' + uebrig.length + ' Dateien übrig (weg mit „aufraeumen“)' : '') + '.');
  for (const f of fehlt) console.log('  ' + (f.veraltet ? '↻' : '○') + ' ' + f.wer + '/' + f.name + ' (' + f.stimme + '): ' + f.text);
}
