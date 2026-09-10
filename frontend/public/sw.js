const CACHE_NAME = 'taskmaster-v1';
const STATIC = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'TaskMaster Reminder';
  const options = {
    body: data.body || 'You have a pending task',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'taskmaster-reminder',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '✅ Open App' },
      { action: 'dismiss', title: '✖ Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
