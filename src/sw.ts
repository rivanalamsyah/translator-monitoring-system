/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Clean up outdated caches from previous versions
cleanupOutdatedCaches();

// Precache all compiled assets provided by Vite
precacheAndRoute(self.__WB_MANIFEST);

// ── Strategy: Cache-First for Google Fonts ──
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// ── Strategy: Network-First with fallback to precached HTML/Offline ──
const navigationHandler = async (params: { request: Request }) => {
  try {
    const response = await fetch(params.request);
    // If response is valid, return it
    if (response && response.status === 200) {
      return response;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    // Attempt 1: serve index.html (SPA shell)
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) return cachedIndex;

    // Attempt 2: serve custom offline fallback page
    const cachedOffline = await caches.match('/offline.html');
    if (cachedOffline) return cachedOffline;

    // Last resort: simple fallback text
    return new Response('<h1>Offline</h1><p>Tidak ada koneksi internet.</p>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
};

registerRoute(new NavigationRoute(navigationHandler));

// Listen for the skip waiting message to trigger immediately active sw updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
