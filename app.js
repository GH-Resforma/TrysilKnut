'use strict';

const APP_VERSION = '1.0.0';
const TILE_URL = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TILE_CACHE = 'kartverket-tiles-v1';
const OFFLINE_ZOOMS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const MAX_NATIVE_ZOOM = 16; // høyere zoom forstørrer nivå 16, slik at offline-kartet alltid dekker
const MARGIN_DEG = { lon: 0.03, lat: 0.015 }; // ekstra kart rundt løypene (~1,5 km)
const NEAR_TRAIL_M = 40;

const $ = (id) => document.getElementById(id);

// ---------- Kart ----------
const map = L.map('map', { zoomControl: false, minZoom: 8, maxZoom: 18 });
L.tileLayer(TILE_URL, {
  maxNativeZoom: MAX_NATIVE_ZOOM,
  maxZoom: 18,
  attribution: '© <a href="https://www.kartverket.no/">Kartverket</a>',
  crossOrigin: true,
}).addTo(map);

let trailBounds = null;
let segments = []; // [[ [lat,lon], ... ], ...]

fetch('data/loyper.geojson')
  .then((r) => r.json())
  .then((geo) => {
    const style = (color, weight) => ({ color, weight, opacity: 1, lineCap: 'round', lineJoin: 'round' });
    L.geoJSON(geo, { style: style('#ffffff', 8), interactive: false }).addTo(map);
    const red = L.geoJSON(geo, { style: style('#d62828', 4), interactive: false }).addTo(map);
    trailBounds = red.getBounds();
    segments = geo.features.map((f) => f.geometry.coordinates.map(([lon, lat]) => [lat, lon]));
    map.fitBounds(trailBounds, { padding: [20, 20] });
    map.setMaxBounds(trailBounds.pad(1.5));
    refreshOfflineStatus();
  })
  .catch(() => map.setView([61.49, 11.94], 13));

// ---------- Avstand til nærmeste løype ----------
function nearestOnTrail(lat, lon) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180);
  const ky = 110574;
  let best = { d: Infinity, lat: 0, lon: 0 };
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i++) {
      const ax = (seg[i - 1][1] - lon) * kx, ay = (seg[i - 1][0] - lat) * ky;
      const bx = (seg[i][1] - lon) * kx, by = (seg[i][0] - lat) * ky;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      let t = len2 ? -(ax * dx + ay * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx, py = ay + t * dy;
      const d = Math.hypot(px, py);
      if (d < best.d) best = { d, lat: lat + py / ky, lon: lon + px / kx, bearing: Math.atan2(px, py) };
    }
  }
  return best;
}

function directionName(rad) {
  const names = ['nord', 'nordøst', 'øst', 'sørøst', 'sør', 'sørvest', 'vest', 'nordvest'];
  const deg = ((rad * 180) / Math.PI + 360) % 360;
  return names[Math.round(deg / 45) % 8];
}

function formatDist(m) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// ---------- GPS ----------
let watchId = null;
let follow = false;
let meMarker = null, accCircle = null, guideLine = null;
const btnLocate = $('btn-locate');

function setFollow(on) {
  follow = on;
  btnLocate.classList.toggle('follow', on);
  btnLocate.classList.toggle('active', watchId !== null && !on);
}

function onPosition(pos) {
  const { latitude: lat, longitude: lon, accuracy } = pos.coords;
  const ll = [lat, lon];
  if (!meMarker) {
    meMarker = L.marker(ll, {
      icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      interactive: false, zIndexOffset: 1000,
    }).addTo(map);
    accCircle = L.circle(ll, { radius: accuracy, color: '#1a73e8', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(map);
    map.setView(ll, Math.max(map.getZoom(), 15));
  } else {
    meMarker.setLatLng(ll);
    accCircle.setLatLng(ll).setRadius(accuracy);
    if (follow) map.panTo(ll, { animate: true });
  }

  const status = $('status');
  status.hidden = false;
  status.classList.remove('near', 'far');
  if (!segments.length) return;
  const n = nearestOnTrail(lat, lon);
  if (guideLine) { map.removeLayer(guideLine); guideLine = null; }
  if (n.d > 5000) {
    $('status-main').textContent = 'Du er utenfor løypeområdet';
    $('status-sub').textContent = `${formatDist(n.d)} til nærmeste løype`;
  } else if (n.d <= Math.max(NEAR_TRAIL_M, accuracy)) {
    status.classList.add('near');
    $('status-main').textContent = 'Du er på løypa';
    $('status-sub').textContent = `GPS-nøyaktighet ±${Math.round(accuracy)} m`;
  } else {
    status.classList.add('far');
    $('status-main').textContent = `${formatDist(n.d)} til løypa (mot ${directionName(n.bearing)})`;
    $('status-sub').textContent = `GPS-nøyaktighet ±${Math.round(accuracy)} m`;
    guideLine = L.polyline([ll, [n.lat, n.lon]], { color: '#1a73e8', weight: 2, dashArray: '6 6', interactive: false }).addTo(map);
  }
}

function onPositionError(err) {
  const status = $('status');
  status.hidden = false;
  status.classList.remove('near', 'far');
  $('status-main').textContent = err.code === 1 ? 'Appen har ikke tilgang til posisjon' : 'Finner ikke posisjon';
  $('status-sub').textContent = err.code === 1
    ? 'Innstillinger → Personvern → Stedstjenester → Safari-nettsteder'
    : 'Prøv igjen under åpen himmel';
}

btnLocate.addEventListener('click', () => {
  if (!('geolocation' in navigator)) return onPositionError({ code: 2 });
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
      enableHighAccuracy: true, maximumAge: 5000, timeout: 30000,
    });
    setFollow(true);
  } else {
    setFollow(true);
    if (meMarker) map.setView(meMarker.getLatLng(), Math.max(map.getZoom(), 15));
  }
});
map.on('dragstart', () => { if (follow) setFollow(false); });

// ---------- Meny ----------
$('btn-menu').addEventListener('click', () => { $('menu').hidden = false; refreshOfflineStatus(); });
$('btn-close').addEventListener('click', () => { $('menu').hidden = true; });
$('version').textContent = `Versjon ${APP_VERSION}`;

// ---------- Offline-kart ----------
function lon2x(lon, z) { return Math.floor(((lon + 180) / 360) * 2 ** z); }
function lat2y(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z);
}

function offlineTileUrls() {
  if (!trailBounds) return [];
  const w = trailBounds.getWest() - MARGIN_DEG.lon, e = trailBounds.getEast() + MARGIN_DEG.lon;
  const s = trailBounds.getSouth() - MARGIN_DEG.lat, n = trailBounds.getNorth() + MARGIN_DEG.lat;
  const urls = [];
  for (const z of OFFLINE_ZOOMS) {
    for (let x = lon2x(w, z); x <= lon2x(e, z); x++) {
      for (let y = lat2y(n, z); y <= lat2y(s, z); y++) {
        urls.push(TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y));
      }
    }
  }
  return urls;
}

async function refreshOfflineStatus() {
  if (!('caches' in window)) {
    $('offline-info').textContent = 'Denne nettleseren støtter ikke lagring av kart.';
    $('btn-download').disabled = true;
    return;
  }
  const urls = offlineTileUrls();
  if (!urls.length) return;
  const cache = await caches.open(TILE_CACHE);
  const keys = new Set((await cache.keys()).map((r) => r.url));
  const have = urls.filter((u) => keys.has(u)).length;
  if (have === urls.length) {
    $('offline-info').textContent = `✓ Kartet er lagret på telefonen (${urls.length} kartbiter). Appen virker uten dekning.`;
    $('btn-download').textContent = 'Oppdater lagret kart';
  } else if (have > 0) {
    $('offline-info').textContent = `Delvis lagret: ${have} av ${urls.length} kartbiter. Trykk for å fullføre.`;
    $('btn-download').textContent = 'Fullfør nedlasting';
  }
}

$('btn-download').addEventListener('click', async () => {
  const btn = $('btn-download');
  const urls = offlineTileUrls();
  if (!urls.length) return;
  btn.disabled = true;
  $('progress').hidden = false;
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const refresh = btn.textContent.startsWith('Oppdater');
  const cache = await caches.open(TILE_CACHE);
  const existing = refresh ? new Set() : new Set((await cache.keys()).map((r) => r.url));
  const todo = urls.filter((u) => !existing.has(u));
  let done = urls.length - todo.length, failed = 0;
  const update = () => {
    $('progress-bar').style.width = `${(100 * done) / urls.length}%`;
    btn.textContent = `Laster ned … ${Math.round((100 * done) / urls.length)} %`;
  };
  update();

  let i = 0;
  async function worker() {
    while (i < todo.length) {
      const url = todo[i++];
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) await cache.put(url, res); else failed++;
      } catch { failed++; }
      done++;
      update();
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  $('progress').hidden = true;
  if (failed) {
    $('offline-info').textContent = `${failed} kartbiter feilet. Sjekk nettet og trykk igjen for å fullføre.`;
    btn.textContent = 'Fullfør nedlasting';
  } else {
    await refreshOfflineStatus();
  }
  btn.disabled = false;
});

// ---------- Service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
