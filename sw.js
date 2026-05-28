// Service worker for benedictdixon.com
// Strategy: cache-first for static assets, network-first for HTML.
// Bump CACHE_VERSION to invalidate the existing cache on deploy.

const CACHE_VERSION = 'bd-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/site.css',
  '/bundle.js',
  '/vendor/react@18.3.1.min.js',
  '/vendor/react-dom@18.3.1.min.js',
  '/assets/fonts/fraunces-latin.woff2',
  '/assets/fonts/inter-latin.woff2',
  '/assets/fonts/jetbrains-mono-latin.woff2',
  '/assets/og-image.png',
  '/assets/beanie_hero_16x9_navySides.json',
  '/assets/beanie_morph_grid.json',
  '/favicons/favicon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML so deploys land immediately.
  if (req.mode === 'navigate' || (req.headers.get('Accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets.
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
