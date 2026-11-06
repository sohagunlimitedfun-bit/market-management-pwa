const CACHE_NAME = 'market-management-pwa-v6';
const APP_SHELL = [
  new URL('./', self.registration.scope).href,
  new URL('index.html', self.registration.scope).href,
  new URL('1market_bill_search.html', self.registration.scope).href,
  new URL('manifest.webmanifest', self.registration.scope).href,
  new URL('icons/icon-192.png', self.registration.scope).href,
  new URL('icons/icon-512.png', self.registration.scope).href
];
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(EXTERNAL_ASSETS.map(async url => {
      const response = await fetch(url, { mode: 'no-cors', cache: 'reload' });
      if (response && (response.ok || response.type === 'opaque')) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('market-management-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return (await cache.match(request)) ||
          (await cache.match(new URL('index.html', self.registration.scope).href)) ||
          (await cache.match(new URL('./', self.registration.scope).href));
      }
    }
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) { throw error; }
  })());
});
