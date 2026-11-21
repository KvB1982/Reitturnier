// Kopiert das Spiel (die Dateien im Hauptordner) nach www/.
// Capacitor packt den Ordner www/ danach in die App.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
// sw.js fehlt absichtlich: Die App braucht keinen Offline-Speicher des Browsers.
const FILES = ['index.html', 'manifest.webmanifest', 'css', 'js', 'modelle', 'sounds', 'icons'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of FILES) {
  if (!existsSync(join(root, f))) throw new Error('Datei fehlt: ' + f);
  cpSync(join(root, f), join(out, f), { recursive: true });
}
console.log('Spiel nach www/ kopiert (' + FILES.length + ' Einträge).');
