/* ==============================================================
   GENETIGZ — SERVICE WORKER
   Strategy:
   - App shell (HTML/CSS/JS/manifest/logo) cached on install so the
     site opens instantly and works offline on repeat visits.
   - Navigations (index.html, collection.html): NETWORK FIRST. Always
     tries the network first and updates the cache with whatever
     comes back, so a live page is never served stale HTML while
     online. Only falls back to the last-known-good cached page (then
     offline.html) if the network request itself fails.
   - CSS / JS / manifest: also NETWORK FIRST (changed from
     stale-while-revalidate — that pattern served the cached copy
     immediately and only updated it in the background, so one full
     load after every deploy still rendered with old styles/scripts).
     Falls back to cache only if the network request fails, so
     offline support is unchanged.
   - Images: cache-first, populated as the user actually scrolls to
     and lazy-loads them (mirrors the site's own progressive-image
     hydration in script.js). Unaffected by this change — images
     don't change per-deploy the way HTML/CSS/JS do.
   - Every network fetch below is issued with `cache: 'no-store'`, so
     the browser's own plain HTTP cache can never hand the service
     worker a stale response out from under it. Without this, a
     "network first" strategy can still be silently defeated by
     Cache-Control/ETag headers on the underlying HTTP request.

   Bump CACHE_VERSION whenever app-shell files change so old caches
   are cleared out on the next visit.
============================================== */

const CACHE_VERSION = 'genetigz-v5';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/collection.html',
  '/style.css',
  '/responsive.css',
  '/script.js',
  '/modal.js',
  '/collections.css',
  '/collections.js',
  '/data/collections-index.js',
  '/data/animeverse.js',
  '/data/bloomytales.js',
  '/data/lonewolf.js',
  '/data/outliers.js',
  '/data/typewriter.js',
  '/data/vagabond.js',
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
        // cache: 'no-store' here too, so the very first cache write
        // isn't itself a stale HTTP-cached copy of an app-shell file.
        Promise.all(
          APP_SHELL.map((url) =>
            fetch(url, { cache: 'no-store' })
              .then((response) => cache.put(url, response))
              .catch((err) => {
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
            // Delete every cache from a previous CACHE_VERSION —
            // anything prefixed 'genetigz-' that isn't this version's
            // shell/runtime cache. Bumping CACHE_VERSION above is what
            // makes this actually run on the next deploy.
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

  // --- Page navigations (index.html, collection.html, etc.): NETWORK FIRST ---
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
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

  // --- CSS / JS / manifest / JSON data files: NETWORK FIRST ---
  // Changed from stale-while-revalidate. That pattern returned the
  // cached copy immediately and only refreshed it in the background,
  // so the very next load after a deploy still rendered with the old
  // stylesheet/script. This now always tries the network first (with
  // cache: 'no-store' so the browser's own HTTP cache can't hand back
  // a stale response either) and only drops back to the cached copy
  // if the network request actually fails — same offline guarantee,
  // without ever preferring stale content while online.
  if (
    ['style', 'script', 'manifest'].includes(request.destination) ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // --- Everything else: network falling back to cache ---
  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(() => caches.match(request))
  );
});