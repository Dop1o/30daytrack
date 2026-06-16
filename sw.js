const CACHE_NAME = '30daytrack-v1.0.13';
const OFFLINE_URL = '/';

// ПРАВИЛЬНЫЕ пути для Vercel
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
  '/images/icon-512.png'
];

// Внешние ресурсы
const externalUrls = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

//  УСТАНОВКА
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Начинаем кэширование...');
        
        // Кэшируем каждый файл по отдельности с логированием
        const results = [];
        for (const url of urlsToCache) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] Успешно: ${url}`);
              results.push({ url, status: 'ok' });
            } else {
    
              results.push({ url, status: 'failed', error: `HTTP ${response.status}` });
            }
          } catch (error) {
            console.error(`[SW] Ошибка кэширования: ${url}`, error);
            results.push({ url, status: 'error', error: error.message });
          }
        }
        
        console.log('[SW] Результаты кэширования:', results);
        
        // Кэшируем внешние ресурсы
        for (const url of externalUrls) {
          try {
            await cache.add(url);
            console.log(`[SW] Внешний ресурс: ${url}`);
          } catch (e) {
            console.warn(`[SW] Внешний ресурс: ${url}`, e);
          }
        }
        
        console.log('[SW] Кэширование завершено');
      })
  );
  self.skipWaiting();
});

// АКТИВАЦИЯ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаляем старый кэш:', cacheName);
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

//  FETCH с правильной стратегией
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Пропускаем аналитику и внешние API
  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('vercel')) {
    return;
  }

  //  HTML - Network First с fallback
  if (request.mode === 'navigate' || 
      request.headers.get('accept')?.includes('text/html')) {
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
        .catch(async () => {
          console.warn('[SW] Офлайн, ищем в кэше...');
          const cached = await caches.match(request);
          if (cached) {
            console.log('[SW] ✅ Найдено в кэше');
            return cached;
          }
          const offlinePage = await caches.match('/index.html');
          if (offlinePage) {
            console.log('[SW] ✅ Показываем index.html');
            return offlinePage;
          }
          console.error('[SW] ❌ Ничего не найдено в кэше');
          return new Response('Страница недоступна в офлайн режиме', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  //  Статика - Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Обновляем в фоне
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
