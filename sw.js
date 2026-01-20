// Service Worker for Lifeprep Academy Foundation
// Provides basic caching for improved performance

const CACHE_NAME = 'lifeprep-academy-v7';
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
    // Ignore query strings for cache matching so cache-busted URLs (e.g., ?v=hash) still hit
    const pathnameOnly = url.pathname;
    const cacheKey = new Request(pathnameOnly, { method: 'GET' });
    // Network-first for HTML documents to avoid serving stale pages (important for widgets like Turnstile)
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, clone));
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cached document or offline page
                    return caches.match(cacheKey).then(r => r || caches.match('/offline.html'));
                })
        );
        return;
    }

    // For non-HTML, use cache-first with network fallback
    event.respondWith(
        caches.match(cacheKey)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(() => undefined);
            })
    );
});
