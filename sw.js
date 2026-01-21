// Service Worker for Lifeprep Academy Foundation
// Provides basic caching for improved performance

const CACHE_NAME = 'lifeprep-academy-v14';
const MAX_RUNTIME_ENTRIES = 120;
const MAX_ASSET_ENTRIES = 40;

async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    // Delete oldest entries first (Cache keys are ordered by insertion)
    const deleteCount = keys.length - maxEntries;
    for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
    }
}
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/programs.html',
    '/events.html',
    '/contact.html',
    '/style.min.css',
    '/script.min.js',
    '/logo.png',
    '/groupPhoto.avif',
    '/eventa.avif',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/offline.html',
    // Founder photo (keep both during rollout to avoid case-sensitivity breakage)
    '/photos/founder.png',
    '/photos/founder.PNG',
    // Flyers (PNG + WebP)
    '/photos/flyer2.png',
    '/photos/flyer2.webp',
    '/photos/flyer3.png',
    '/photos/flyer3.webp'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                // Cache assets individually so one missing file doesn't break SW install.
                return Promise.allSettled(
                    STATIC_ASSETS.map(asset =>
                        cache.add(asset).catch(error => {
                            console.warn('Failed to cache asset:', asset, error);
                        })
                    )
                );
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    const url = new URL(event.request.url);
    // Prefer exact cache keys (including query string) so cache-busting works.
    // For offline fallback, we may fall back to an ignoreSearch match.
    const exactKey = event.request;
    // Network-first for HTML documents to avoid serving stale pages (important for widgets like Turnstile)
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    const clone = networkResponse.clone();
                    // Normalize documents by pathname so querystrings don't duplicate entries.
                    const docKey = new Request(url.pathname, { method: 'GET' });
                    caches.open(CACHE_NAME).then(cache => cache.put(docKey, clone));
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cached document or offline page
                    const docKey = new Request(url.pathname, { method: 'GET' });
                    return caches.match(docKey).then(r => r || caches.match('/offline.html'));
                })
        );
        return;
    }

    // Images: stale-while-revalidate (fast repeat views, better offline)
    if (event.request.destination === 'image') {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached =
                (await cache.match(exactKey)) ||
                (await cache.match(exactKey, { ignoreSearch: true }));

            const networkFetch = fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(exactKey, networkResponse.clone()).then(() => {
                            trimCache(CACHE_NAME, MAX_RUNTIME_ENTRIES);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => undefined);

            if (cached) {
                // Update in background
                networkFetch.catch(() => undefined);
                return cached;
            }

            const res = await networkFetch;
            return res;
        })());
        return;
    }

    // CSS/JS/fonts: stale-while-revalidate (keeps them fresh without blocking)
    if (event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'font') {
        // Network-first to respect cache-busting querystrings (serve newest when online).
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.status === 200) {
                    await cache.put(exactKey, networkResponse.clone());
                    trimCache(CACHE_NAME, MAX_ASSET_ENTRIES);
                }
                return networkResponse;
            } catch {
                return (
                    (await cache.match(exactKey)) ||
                    (await cache.match(exactKey, { ignoreSearch: true }))
                );
            }
        })());
        return;
    }

    // For other same-origin GETs, use cache-first with network fallback
    event.respondWith(
        caches.match(exactKey)
            .then(cachedResponse => cachedResponse || caches.match(exactKey, { ignoreSearch: true }))
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(exactKey, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(() => undefined);
            })
    );
});
