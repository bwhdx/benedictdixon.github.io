// Service worker for benedictdixon.com
// Strategy:
//   - network-first for HTML so deploys land immediately
//   - stale-while-revalidate for static assets so cached files
//     show instantly but get re-fetched in the background for
//     next time. Avoids the "old CSS / new HTML" mismatch you
//     get with strict cache-first.
// Bump CACHE_VERSION to force-evict everything on a deploy that
// breaks compatibility.

const CACHE_VERSION = 'bd-v24';
const PRECACHE = [
  '/',
  '/index.html',
  '/site.css',
  '/writing.css',
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
  '/writing/',
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

  // Stale-while-revalidate for static assets: return cached
  // immediately (instant paint), kick off a background fetch to
  // update the cache, so the next page load picks up changes.
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
