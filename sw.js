'use strict';

// Øk versjonen når app-filene endres, så telefonen henter nye filer.
const SHELL_CACHE = 'shell-v1';
const TILE_CACHE = 'kartverket-tiles-v1'; // samme navn som i app.js – slettes ikke ved oppdatering

const SHELL = [
  './',
  'index.html',
  'app.js',
  'style.css',
  'manifest.webmanifest',
  'vendor/leaflet/leaflet.js',
  'vendor/leaflet/leaflet.css',
  'data/loyper.geojson',
  'data/Trysilknut-loyper.gpx',
  'data/Trysilknut-loyper.kml',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Kartbiter: fra lagret kart først, ellers nett (og lagre det man ser på).
  if (url.hostname === 'cache.kartverket.no') {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const hit = await cache.match(req.url);
        if (hit) return hit;
        try {
          const res = await fetch(req.url, { mode: 'cors' });
          // Bare kartbiter som vises (<img>) lagres her; «Last ned kart» i appen lagrer selv.
          if (res.ok && req.destination === 'image') cache.put(req.url, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  // App-filer: nett først (for oppdateringer), men lagret kopi etter 3 s ved dårlig dekning.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = () => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'));
      const network = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
      const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
      const first = await Promise.race([network.catch(() => null), timeout]);
      if (first) return first;
      return (await cached()) || network;
    })());
  }
});
