/**
 * Service Worker — Sistem Monitoring Penerjemah by Master Translate
 * Strategy:
 *  - Static assets (JS, CSS, fonts, images): Cache-First
 *  - HTML navigation: Network-First with offline fallback
 *  - External APIs/Firebase: Network-Only
 */

const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE = `tms-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tms-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/favicon.webp',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: Pre-cache core assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching core assets');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may be missing):', err);
        return self.skipWaiting();
      })
  );
});

// ── Activate: Clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => {
        console.log('[SW] Activated. Claiming clients.');
        return self.clients.claim();
      })
  );
});

// ── Fetch: Route interception ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external/third-party requests (Firebase, APIs, Google Fonts CDN)
  if (url.origin !== self.location.origin) {
    // Allow Google Fonts to be cached for offline use
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    }
    return; // All other external = network only
  }

  // HTML navigation requests → Network-First with offline fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts, icons) → Cache-First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else → Network with dynamic cache fallback
  event.respondWith(networkWithDynamicCache(request));
});

// ── Strategy: Cache-First ────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.warn('[SW] Cache-first fetch failed:', request.url);
    return new Response('', { status: 408, statusText: 'Network timeout' });
  }
}

// ── Strategy: Network-First with offline fallback ────────────────────────────
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return cached index for SPA navigation
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;

    // Last resort: offline page
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('<h1>Offline</h1><p>Tidak ada koneksi internet.</p>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ── Strategy: Network with Dynamic Cache ─────────────────────────────────────
async function networkWithDynamicCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 408, statusText: 'Network timeout' });
  }
}

// ── Background Sync (future-ready hook) ──────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'tms-sync') {
    console.log('[SW] Background sync triggered');
  }
});

// ── Push Notifications (future-ready hook) ───────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Master Translate', {
      body: data.body || 'Ada pembaruan tugas.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
