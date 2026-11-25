// ============================================================
//  RAUCHTEST  -  Startet jede Welt einmal und schaut, ob etwas „raucht“.
//
//  Aufruf:   node tools/rauch.mjs                 alle Welten einzeln, danach alle hintereinander in einer Sitzung
//            node tools/rauch.mjs hof ausritt     nur diese Welten
//            node tools/rauch.mjs bilder          legt zusätzlich Bildschirmfotos nach tools/rauch/
//            node tools/rauch.mjs ohnesitzung     lässt den zweiten Teil weg
//
//  Geprüft wird: keine Fehlermeldung, kein Eintrag im Fehler-Protokoll (js/technik.js),
//  und nach dem Besuch aller Welten liegt nicht mehr auf der Grafikkarte als erlaubt.
//  Dazu druckt der Test die Zahlen je Welt: Zeichenaufrufe, Dreiecke, Formen, Bilder.
//  Braucht Playwright (npm i --no-save playwright && npx playwright install chromium).
//  Der Test-Browser hat keine Grafikkarte: Bilder pro Sekunde sagt er NICHT, dafür gibt es die Messanzeige im Spiel.
// ============================================================
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Playwright fehlt. Einmal ausführen:  npm i --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

const ordner = join(dirname(fileURLToPath(import.meta.url)), '..');
const seite = pathToFileURL(join(ordner, 'index.html')).href;
const ALLE = ['hof', 'ausritt', 'rennen', 'gelaende', 'dressur', 'voltigieren', 'springen'];
const KNOPF = { hof: 'Pferdehof', ausritt: 'Ausritt', rennen: 'Galopprennen', gelaende: 'Military', dressur: 'Dressur', voltigieren: 'Voltigieren', springen: 'Springen' };
// Obergrenzen. Wer sie reißt, hat etwas schwerer gemacht und soll das im Pull Request begründen (und die Zahl hier anheben).
const GRENZE = {
  hof: { aufrufe: 500, dreiecke: 1.0e6 }, ausritt: { aufrufe: 500, dreiecke: 1.15e6 },
  rennen: { aufrufe: 170, dreiecke: 0.56e6 }, gelaende: { aufrufe: 130, dreiecke: 0.37e6 },
  dressur: { aufrufe: 175, dreiecke: 0.34e6 }, voltigieren: { aufrufe: 175, dreiecke: 0.55e6 }, springen: { aufrufe: 240, dreiecke: 0.72e6 },
  // nach allen Welten in einer Sitzung, zurück im Menü: so viel darf auf der Grafikkarte liegen bleiben
  sitzung: { formen: 1500, bilder: 330 }
};

const wahl = process.argv.slice(2);
const mitBildern = wahl.includes('bilder'), ohneSitzung = wahl.includes('ohnesitzung');
const welten = ALLE.filter(w => wahl.includes(w)).length ? ALLE.filter(w => wahl.includes(w)) : ALLE;
if (mitBildern) mkdirSync(join(ordner, 'tools', 'rauch'), { recursive: true });

const warte = (p, ms) => p.waitForTimeout(ms);
const probleme = [];
function problem(text) { probleme.push(text); console.log('   ❌ ' + text); }

async function neueSeite(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('console', m => { if (m.type() === 'error') p.fehler.push(m.text().slice(0, 300)); });
  p.on('pageerror', e => p.fehler.push('Absturz: ' + String(e.stack || e).slice(0, 400)));
  // Die Neuigkeiten-Karten würden sonst über dem Spiel liegen
  await p.addInitScript(() => { localStorage.setItem('reitturnier_hof', JSON.stringify({ neuigkeiten6: true, neuigkeiten7: true })); });
  await p.goto(seite);
  await p.waitForFunction(() => window.SPIEL && window.TECHNIK && document.getElementById('laden').style.display === 'none', null, { timeout: 120000 });
  return p;
}
async function starte(p, w) {
  await p.evaluate(name => { const k = [...document.querySelectorAll('#modusWahl button')].find(b => b.textContent.includes(name)); if (!k) throw new Error('Knopf fehlt: ' + name); k.click(); }, KNOPF[w]);
  await p.click(w === 'springen' ? '#training' : '#modusStart');
}
// Spult eine Minute vor (in der Welt mit Wetter) und liest dann die Zahlen des letzten gemalten Bildes
async function messe(p) {
  await p.evaluate(() => {
    const w = KERN.welt();
    for (let i = 0; i < 6; i++) { SPIEL.vor(10); if (w && KERN.welt() === w) for (let j = 0; j < 250; j++) WETTER.schritt(0.04, w); }
  });
  await warte(p, 1200);
  return p.evaluate(() => { const i = SPIEL.info(); return { welt: SPIEL.weltName(), aufrufe: i.render.calls, dreiecke: i.render.triangles, formen: i.memory.geometries, bilder: i.memory.textures, protokoll: TECHNIK.protokoll() }; });
}
async function insMenue(p) {
  await p.evaluate(() => { KERN.schliesseKarte(); KERN.insMenue(); });
  await warte(p, 800);
  return p.evaluate(() => { const i = SPIEL.info(); return { formen: i.memory.geometries, bilder: i.memory.textures, menue: document.body.classList.contains('im-menue') }; });
}
const zahl = n => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, '.');
function zeile(name, r) { console.log('   ' + name.padEnd(12) + zahl(r.aufrufe).padStart(6) + ' Aufrufe ' + zahl(r.dreiecke).padStart(10) + ' Dreiecke ' + zahl(r.formen).padStart(6) + ' Formen ' + zahl(r.bilder).padStart(5) + ' Bilder'); }
function pruefe(w, r, p) {
  const g = GRENZE[w];
  if (r.welt !== w) problem(w + ': läuft nicht (gerade: ' + r.welt + ')');
  if (g && r.aufrufe > g.aufrufe) problem(w + ': ' + r.aufrufe + ' Zeichenaufrufe, erlaubt sind ' + g.aufrufe);
  if (g && r.dreiecke > g.dreiecke) problem(w + ': ' + zahl(r.dreiecke) + ' Dreiecke, erlaubt sind ' + zahl(g.dreiecke));
  if (r.protokoll.length) problem(w + ': Fehler-Protokoll: ' + r.protokoll.map(e => e.was).join(' | '));
  [...new Set(p.fehler)].forEach(f => problem(w + ': ' + f));
  p.fehler.length = 0;
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const t0 = Date.now();

console.log('Teil 1: jede Welt einzeln (frisch geladen)');
for (const w of welten) {
  const p = await neueSeite(browser);
  try {
    await starte(p, w);
    await warte(p, 15000);                        // die Menschen-Modelle brauchen im Test-Browser lange
    const r = await messe(p);
    zeile(w, r); pruefe(w, r, p);
    if (mitBildern) await p.screenshot({ path: join(ordner, 'tools', 'rauch', w + '.png') });
    const m = await insMenue(p);
    if (!m.menue) problem(w + ': kommt nicht zurück ins Menü');
  } catch (e) { problem(w + ': Test abgebrochen: ' + String(e).slice(0, 300)); }
  await p.context().close();
}

if (!ohneSitzung && welten.length > 1) {
  console.log('Teil 2: alle Welten hintereinander in einer Sitzung (wird aufgeräumt?)');
  const p = await neueSeite(browser);
  try {
    for (const w of welten) {
      await starte(p, w);
      await warte(p, 9000);
      const r = await messe(p);
      zeile(w, r);
      if (r.welt !== w) problem('Sitzung, ' + w + ': läuft nicht');
      if (r.protokoll.length) problem('Sitzung, ' + w + ': Fehler-Protokoll: ' + r.protokoll.map(e => e.was).join(' | '));
      await insMenue(p);
    }
    const ende = await insMenue(p);
    console.log('   danach im Menü: ' + zahl(ende.formen) + ' Formen, ' + zahl(ende.bilder) + ' Bilder auf der Grafikkarte');
    if (welten.length === ALLE.length) {
      if (ende.formen > GRENZE.sitzung.formen) problem('Sitzung: ' + ende.formen + ' Formen bleiben liegen, erlaubt sind ' + GRENZE.sitzung.formen);
      if (ende.bilder > GRENZE.sitzung.bilder) problem('Sitzung: ' + ende.bilder + ' Bilder bleiben liegen, erlaubt sind ' + GRENZE.sitzung.bilder);
    }
    // noch einmal in die erste Welt: Kommt nach dem Aufräumen alles wieder?
    await starte(p, welten[0]);
    await warte(p, 6000);
    const r2 = await messe(p);
    zeile(welten[0] + ' (2.)', r2);
    if (mitBildern) await p.screenshot({ path: join(ordner, 'tools', 'rauch', 'sitzung_' + welten[0] + '.png') });
    [...new Set(p.fehler)].forEach(f => problem('Sitzung: ' + f));
  } catch (e) { problem('Sitzung: Test abgebrochen: ' + String(e).slice(0, 300)); }
  await p.context().close();
}
await browser.close();

console.log((probleme.length ? '❌ ' + probleme.length + ' Problem(e)' : '✅ Alles in Ordnung') + '  (' + Math.round((Date.now() - t0) / 1000) + ' s)');
process.exit(probleme.length ? 1 : 0);
