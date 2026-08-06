/* Service worker de la app unificada SITI · Comunicaciones.
   Cachea el "app shell" (shell + las 3 herramientas) para que abra aunque
   no haya señal en sitio. Sube CACHE_NAME cada vez que actualices archivos
   para forzar que los dispositivos descarguen la versión nueva. */
const CACHE_NAME = 'siti-app-v11';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './levantamiento.css',
  './calculadora.css',
  './costos.css',
  './levantamiento.js',
  './calculadora.js',
  './costos.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var network = fetch(event.request).then(function(response){
        if(response && response.ok){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      // Si ya está en caché, se muestra de inmediato y se actualiza en segundo plano.
      return cached || network;
    })
  );
});
