const CACHE_NAME = '30daytrack-v1.0.13';
const OFFLINE_URL = '/';

// Определяем базовый путь
const BASE = self.location.pathname.replace(/\/[^/]*$/, '') || '/';

const urlsToCache = [
  BASE,
  BASE + 'index.html',
  BASE + 'style.css',
  BASE + 'scripts/script.js',
  BASE + 'scripts/i18n.js',
  BASE + 'scripts/data-manager.js',
  BASE + 'manifest/manifest-ru.json',
  BASE + 'manifest/manifest-en.json',
  BASE + 'images/icon-192.png',
  BASE + 'images/icon-512.png'
];

// Внешние ресурсы
const externalUrls = [
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
        
        // Кешируем основные файлы с обработкой ошибок
        try {
          await cache.addAll(urlsToCache);
          console.log('[SW] Основные файлы закешированы');
        } catch (err) {
          console.error('[SW] Ошибка кеширования основных файлов:', err);
          // Пытаемся кешировать по отдельности
          for (const url of urlsToCache) {
            try {
              await cache.add(url);
              console.log('[SW] Успешно закеширован:', url);
            } catch (e) {
              console.warn('[SW] Не удалось закешировать:', url, e);
            }
          }
        }
        
        // Кешируем внешние ресурсы
        for (const url of externalUrls) {
          try {
            await cache.add(url);
            console.log('[SW] Внешний ресурс закеширован:', url);
          } catch (e) {
            console.warn('[SW] Не удалось закешировать внешний ресурс:', url);
          }
        }
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
            console.log('[SW] Удаляем старый кеш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Активирован, захватываем клиентов');
      return self.clients.claim();
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Пропускаем аналитику
  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('vercel')) {
    return;
  }

  // Стратегия для HTML - Network First с fallback
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
          console.warn('[SW] Офлайн режим, показываем кешированную страницу');
          return caches.match(OFFLINE_URL) || caches.match('/index.html');
        })
    );
    return;
  }

  // Для статики - Cache First с обновлением в фоне
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Обновляем кеш в фоне
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {});
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
      }).catch(() => {
        // Fallback для изображений
        if (request.destination === 'image') {
          return new Response('', { status: 204 });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ✅ ИСПРАВЛЕННЫЙ Push
self.addEventListener('push', (event) => {
  let data = {};
  let title = '30-Дневный Трекер';
  let body = 'Не забудь отметить прогресс сегодня!';
  
  if (event.data) {
    try {
      // Пробуем получить как JSON
      data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch {
      // Если не JSON - используем как текст
      try {
        body = event.data.text() || body;
      } catch {
        // Если и text() не работает, оставляем fallback
      }
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
