const CACHE_NAME = 'nova-ai-v2';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache API calls - always go straight to network
  if (url.includes('api.anthropic.com') || url.includes('elevenlabs.io')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for the app shell: always try to get the latest version.
  // Only fall back to cache if the network is unavailable (offline).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update the cache with the fresh version for offline fallback later
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
