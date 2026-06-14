const CACHE_NAME = '30daytrack-v1.0.11';
const OFFLINE_URL = '/';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/scripts/script.js',
  '/scripts/i18n.js',
  '/scripts/data-manager.js',
  '/manifest/manifest-ru.json',
  '/manifest/manifest-en.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Установка
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Кэширование ресурсов');
        
        // Сначала кешируем основные файлы
        await cache.addAll([
          '/index.html',  // ← явно указываем index.html
          '/style.css',
          '/scripts/script.js',
          '/scripts/i18n.js',
          '/scripts/data-manager.js',
          '/manifest/manifest-ru.json',
          '/manifest/manifest-en.json',
          '/images/icon-192.png',
          '/images/icon-512.png'
        ]);
        
        // Внешние библиотеки пытаемся закешировать, но не падаем при ошибке
        const externalUrls = [
          'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        ];
        
        for (const url of externalUrls) {
          try {
            await cache.add(url);
          } catch(e) {
            console.warn('[SW] Не удалось закешировать внешний ресурс:', url);
          }
        }
      })
      .catch((err) => {
        console.error('[SW] Ошибка кэширования:', err);
      })
  );
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return; 
  }

  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('vercel')) {
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return; 
  }

  // Стратегия для статических ресурсов
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      if (request.destination === 'image') {
        return new Response('', { status: 204 });
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

// Push из внешнего сервиса (FCM и т.п.); локальные напоминания — через Notification в основном потоке
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Не забудь отметить прогресс сегодня!',
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
    self.registration.showNotification(data.title || '30-Дневный Трекер', options)
  );
});

// Клик по уведомлению
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
