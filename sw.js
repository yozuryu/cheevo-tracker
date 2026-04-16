const CACHE_NAME = 'cheevo-tracker-1775970452';

// Static assets — cache-first
const PRECACHE = [
  './',
  './index.html',
  './login.js',
  './profile/index.html',
  './profile/app.js',
  './profile/utils/constants.js',
  './profile/utils/helpers.js',
  './profile/utils/transform.js',
  './profile/utils/ra-api.js',
  './changelog/index.html',
  './changelog/app.js',
  './settings/index.html',
  './settings/app.js',
  './game/index.html',
  './game/app.js',
  './achievement/index.html',
  './achievement/app.js',
  './assets/mobile-nav.js',
  './assets/ui.js',
  './assets/favicon.ico',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

// Install — precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first for same-origin static assets; pass through cross-origin (RA API)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pass through cross-origin requests (RA API calls)
  if (url.origin !== self.location.origin) return;

  // changelog.md — network-first so it's always fresh
  if (url.pathname.endsWith('/changelog.md')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
      )
  );
});
