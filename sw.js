const CACHE_NAME = '30daytrack-v1.0.14';
const OFFLINE_URL = '/';

//  Четкое разделение CORE и EXTERNAL
const CORE = [
  '/',
  '/index.html',
  '/style.css',
  '/scripts/script.js',
  '/scripts/i18n.js',
  '/scripts/data-manager.js',
  '/manifest/manifest-ru.json',
  '/manifest/manifest-en.json',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

const EXTERNAL = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

//  INSTALL
self.addEventListener('install', function (e) {
  console.log('[SW] Install', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE).catch(function (err) {
        console.error('[SW] Cache addAll error:', err);
      });
    }).then(function () {
      return caches.open(CACHE_NAME + '-external').then(function (extCache) {
        return Promise.allSettled(
          EXTERNAL.map(function (url) {
            return fetch(url, { mode: 'no-cors' })
              .then(function (response) {
                if (response.ok || response.type === 'opaque') {
                  return extCache.put(url, response);
                }
              })
              .catch(function (err) {
                console.warn('[SW] Failed to cache external:', url, err);
              });
          })
        );
      });
    }).then(function () {
      console.log('[SW] Install complete, skipping waiting');
      return self.skipWaiting();
    })
  );
});

//  ACTIVATE
self.addEventListener('activate', function (e) {
  console.log('[SW] Activate', CACHE_NAME);
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key.startsWith('30daytrack-') && key !== CACHE_NAME && key !== CACHE_NAME + '-external';
        }).map(function (key) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(function () {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

//  FETCH
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  
  if (e.request.method !== 'GET') return;
  
  // API запросы - Network First
  if (url.hostname.includes('exchangerate-api.com')) {
    e.respondWith(
      fetch(e.request)
        .then(function (response) {
          return response;
        })
        .catch(function () {
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  //  Локальные ресурсы: Cache First, затем Network
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        if (cached) {
          return cached;
        }
        
        return fetch(e.request).then(function (response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(e.request, clone);
            });
          }
          return response;
        }).catch(function () {
          //  Важно! Для навигации показываем index.html
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Network unavailable');
        });
      })
    );
    return;
  }
  
  //  Внешние CDN: Stale-While-Revalidate
  if (EXTERNAL.some(function (ext) { return url.href.startsWith(ext); })) {
    e.respondWith(
      caches.open(CACHE_NAME + '-external').then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          var fetchPromise = fetch(e.request)
            .then(function (response) {
              if (response && response.ok) {
                cache.put(e.request, response.clone());
              }
              return response;
            })
            .catch(function () {});
          
          return cached || fetchPromise;
        });
      })
    );
    return;
  }
  
  e.respondWith(fetch(e.request));
});

//  PUSH - с безопасной обработкой
self.addEventListener('push', (event) => {
  let data = {};
  let title = '30-Дневный Трекер';
  let body = 'Не забудь отметить прогресс сегодня!';
  
  if (event.data) {
    try {
      data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch {
      try {
        body = event.data.text() || body;
      } catch {}
    }
  }
  
  const options = {
    body: body,
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'dismiss', title: 'Позже' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

//  NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || '/';
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
