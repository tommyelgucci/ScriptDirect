// Minimal offline support: cache the app shell and same-origin assets.
// Cross-origin requests (AI provider APIs) are never intercepted or cached.
const CACHE = 'scriptdirect-v2'
// Filled in at build time by the precache-manifest plugin in vite.config.ts.
const PRECACHE_ASSETS = [] /* __PRECACHE_ASSETS__ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/favicon.svg', '/manifest.webmanifest', ...PRECACHE_ASSETS])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Network first so a new deploy is picked up; fall back to the cached shell offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Hashed build assets are immutable: cache first, fill on miss.
  event.respondWith(
    // ignoreVary: precached entries were stored without an Origin header, but module scripts request with CORS.
    caches.match(request, { ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
