// OnePlan Service Worker
const CACHE_VERSION = 'oneplan-v26';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App-Shell: lokale Dateien, die für den Offline-Start nötig sind
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './Logo_Oneplan.png',
  './apple-touch-icon.png',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png'
];

// Installation: App-Shell vorab cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Aktivierung: alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('oneplan-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch-Strategien:
// - Supabase (API/Auth/Daten): immer Netzwerk, kein Caching (Live-Daten)
// - Navigation (HTML): Netzwerk zuerst, Fallback auf Cache/App-Shell (Offline-Support)
// - Statische lokale Assets: Cache zuerst, im Hintergrund aktualisieren
// - Externe CDN-Assets (Font Awesome, MathJax): Cache zuerst, Netzwerk als Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase-Aufrufe nicht cachen, immer live
  if (url.hostname.endsWith('supabase.co')) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 }
    )));
    return;
  }

  // Navigationsanfragen: Network-First mit Offline-Fallback auf index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Alles andere (eigene Assets & CDN): Cache-First, Netzwerk aktualisiert im Hintergrund
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push-Benachrichtigungen: Server (Supabase Edge Function) schickt eine Payload
// { title, body, url }, die hier als System-Benachrichtigung angezeigt wird —
// funktioniert auch, wenn OnePlan gerade nicht geöffnet ist.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'OnePlan', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'OnePlan';
  const options = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-96.png',
    data: { url: data.url || './' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klick auf die Benachrichtigung: bestehenden Tab fokussieren, sonst neuen öffnen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
