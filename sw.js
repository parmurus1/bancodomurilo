// Service worker: permite abrir o app sem internet.
// Rede primeiro (para sempre pegar a versão nova), cache como reserva.
// As chamadas ao Supabase nunca passam pelo cache.
const CACHE = 'banco-do-murilo-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const cacheable = url.origin === self.location.origin
    || /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)
    || url.hostname === 'cdn.jsdelivr.net';
  if (e.request.method !== 'GET' || !cacheable) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
