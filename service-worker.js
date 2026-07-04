/* ==============================================================
   GENETIGZ — SERVICE WORKER
   Strategy:
   - App shell (HTML/CSS/JS/manifest/logo) cached on install so the
     site opens instantly and works offline on repeat visits.
   - Navigations: network-first, falling back to cache, then to
     offline.html if nothing cached is available.
   - Images: cache-first, populated as the user actually scrolls to
     and lazy-loads them (mirrors the site's own progressive-image
     hydration in script.js), so offline support "fills in" as
     someone browses rather than requiring one giant upfront download.
   - CSS/JS/manifest: stale-while-revalidate, so repeat visits are
     instant but still pick up updates in the background.

   Bump CACHE_VERSION whenever app-shell files change so old caches
   are cleared out on the next visit.
============================================== */

const CACHE_VERSION = 'genetigz-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/css/responsive.css',
  '/script.js',
  '/js/products.js',
  '/js/modal.js',
  '/manifest.json',
  '/offline.html',
  '/images/logo/logo-mark-180.png',
  '/images/logo/logo-full.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) =>
        // addAll fails atomically if any single request 404s, so we
        // fall back to best-effort caching to avoid a totally broken
        // install just because one shell asset is still a placeholder.
        Promise.all(
          APP_SHELL.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Skipped caching (not found yet):', url, err);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('genetigz-') &&
                key !== APP_SHELL_CACHE &&
                key !== RUNTIME_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allows script.js's "Refresh" toast to activate a waiting worker
// immediately instead of waiting for all tabs to close.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave fonts CDN, wa.me, etc. alone

  // --- Page navigations ---
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // --- Images: cache-first, filled in progressively as they're viewed ---
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached); // nothing to fall back to for a never-seen image while offline
      })
    );
    return;
  }

  // --- CSS / JS / manifest: stale-while-revalidate ---
  if (
    ['style', 'script', 'manifest'].includes(request.destination) ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.open(APP_SHELL_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // --- Everything else: network falling back to cache ---
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
