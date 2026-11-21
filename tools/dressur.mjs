// Prüft die Dressur-Aufgaben ohne Grafik und malt alle Wege von oben als tools/dressur.svg.
//   node tools/dressur.mjs
// Geprüft wird: Jede Lektion schließt an die vorige an, kein Weg verlässt das Viereck, keine Lücken im Weg.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WELTEN = {};
new Function('WELTEN', readFileSync(join(root, 'js/dressur.js'), 'utf8'))(WELTEN);
const FARBE = ['#888', '#3f9bff', '#ff3d7f', '#ff9a1f'];
let fehler = 0, svg = '', x0 = 0;
for (const a of WELTEN.dressur.aufgaben()) {
  const hl = a.lang / 2, m = 7, px = x => x0 + 30 + (10 + x) * m, pz = z => 40 + (30 + z) * m;
  let ende = null, laenge = 0, sek = 0;
  svg += `<text x="${x0 + 30}" y="20" font-size="16" font-weight="bold">${a.name} (${a.lektionen.length} Lektionen)</text>`;
  svg += `<rect x="${px(-10)}" y="${pz(-hl)}" width="${20 * m}" height="${a.lang * m}" fill="#f0e0b4" stroke="#999"/>`;
  a.lektionen.forEach((l, nr) => {
    if (!l.weg) { sek += 6; return; }
    if (ende && Math.hypot(l.weg[0][0] - ende[0], l.weg[0][1] - ende[1]) > 2.6) { fehler++; console.log('LÜCKE vor', a.name, l.text); }
    ende = l.weg[l.weg.length - 1];
    l.weg.forEach((p, i) => {
      if (Math.abs(p[0]) > 9.7 || p[1] < -hl + 0.3 || p[1] > hl + 7.1) { fehler++; console.log('AUSSERHALB', a.name, l.text, p); }
      if (i && Math.hypot(p[0] - l.weg[i - 1][0], p[1] - l.weg[i - 1][1]) > 0.9) { fehler++; console.log('SPRUNG', a.name, l.text); }
    });
    for (const ab of l.ab) {
      const pts = l.weg.slice(ab.von, ab.bis + 1).map(p => px(p[0]).toFixed(1) + ',' + pz(p[1]).toFixed(1)).join(' ');
      if (ab.spez && ab.spez.mal !== undefined) svg += `<polyline points="${pts}" fill="none" stroke="#ffd21f" stroke-width="7" opacity="0.7"/>`;
      svg += `<polyline points="${pts}" fill="none" stroke="${FARBE[ab.gang]}" stroke-width="1.6"/>`;
      const s = l.laengen[ab.bis] - l.laengen[ab.von];
      sek += s / ([0, 1.7, 3.7, 6.2][ab.gang] * (ab.spez && ab.spez.mal ? ab.spez.mal : 1));
    }
    for (const st of l.sterne) svg += `<circle cx="${px(l.weg[st.i][0])}" cy="${pz(l.weg[st.i][1])}" r="4" fill="#ffd21f" stroke="#000"/>`;
    const mi = l.weg[Math.floor(l.weg.length / 2)];
    svg += `<text x="${px(mi[0]) + 3}" y="${pz(mi[1])}" font-size="10">${nr + 1}</text>`;
    laenge += l.laengen[l.laengen.length - 1];
  });
  console.log(a.name.padEnd(12), a.lektionen.length, 'Lektionen,', Math.round(laenge), 'm, etwa', Math.round(sek / 6) / 10, 'Minuten');
  x0 += 20 * m + 60;
}
writeFileSync(join(root, 'tools/dressur.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${x0}" height="540" font-family="sans-serif"><rect width="100%" height="100%" fill="#fff"/>${svg}</svg>`);
console.log(fehler ? fehler + ' FEHLER' : 'Alles in Ordnung. Bild: tools/dressur.svg');
process.exit(fehler ? 1 : 0);
