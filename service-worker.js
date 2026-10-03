const CACHE_NAME = 'velisima-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './inventario.html',
  './pedidos.html',
  './css/style.css',
  './js/app.js',
  './js/inventario.js',
  './js/pedidos.js',
  './js/firebase-sync.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
