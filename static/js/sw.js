// static/sw.js

const CACHE_NAME = 'multimodel-cache-v4'; // Önbellek adını güncelledim (v3'ten v4'e)
const urlsToCache = [
  '/', // Ana sayfanız (index.html) için bu yeterli
  // '/templates/index.html', // BU SATIR KALDIRILDI
  '/static/js/scripts.js',
  '/static/manifest.json',
  '/static/images/logo.png',
  '/static/images/wallpaper.jpg',
  'https://cdn.tailwindcss.com/3.4.16',
  'https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css',
  'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
];

self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching app shell');
        const requests = urlsToCache.map(url => {

          if (url.startsWith('http')) {
            return new Request(url, { mode: 'no-cors' });
          }
          return url;
        });
        return cache.addAll(requests)
          .catch(err => {
            console.error('SW: Failed to cache some resources during install:', err);

          });
      })
      .then(() => {
        console.log('SW: Install completed, skipping waiting.');
        return self.skipWaiting(); // Yeni SW'nin hemen aktif olmasını sağlar
      })
      .catch(error => {
        console.error('SW: Caching failed during install phase', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eğer önbellek adı mevcut CACHE_NAME ile aynı değilse, eski önbelleği sil
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('SW: Activate completed, claiming clients.');
        return self.clients.claim(); // Aktif olan SW'nin tüm açık istemcileri kontrol etmesini sağlar
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  if (event.request.url.includes('/process')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('SW: API request failed for /process:', event.request.url, err);
        return new Response(JSON.stringify({
            status: "error",
            message: "Network error or offline. Cannot process request."
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return; // Bu isteği burada sonlandır
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(
          networkResponse => {
            const responseToCache = networkResponse.clone();

            if (networkResponse.ok || networkResponse.type === 'opaque') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            } else {
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('SW: Fetch failed, and not in cache:', error, event.request.url);

        });
      })
  );
});