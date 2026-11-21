'use strict';
// Reitturnier – merkt sich die Dateien, damit das Spiel vom Home-Bildschirm auch ohne Internet läuft.
// Mit Internet wird immer zuerst die neueste Fassung geholt. Die Liste der Dateien steht nirgends von Hand:
// Beim Einrichten wird index.html gelesen und alles gemerkt, was dort eingebunden ist.
const CACHE = 'reitturnier-v1';
self.addEventListener('install', e => {
  e.waitUntil(
    fetch('index.html', { cache: 'no-cache' }).then(r => r.text()).then(text => {
      const files = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png'];
      text.replace(/<(?:script|link)[^>]+?(?:src|href)="([^"]+\.(?:js|css))"/g, (m, f) => { files.push(f); return m; });
      return caches.open(CACHE).then(c => Promise.all(files.map(f => c.add(f).catch(() => {}))));
    }).catch(() => {}).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
