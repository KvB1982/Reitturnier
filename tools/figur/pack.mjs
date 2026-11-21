// Packt eine GLB-Datei als Text in eine js-Datei, damit das Spiel sie ohne Server laden kann (auch per Doppelklick auf index.html).
//   node tools/figur/pack.mjs maedchen.glb modelle/menschen/maedchen.js maedchen
import { readFileSync, writeFileSync } from 'node:fs';
const [ein, aus, name] = process.argv.slice(2);
writeFileSync(aus, `MENSCHEN.daten[${JSON.stringify(name)}]="${readFileSync(ein).toString('base64')}";\n`);
console.log(aus, Math.round(readFileSync(aus).length / 1024) + ' kB');
