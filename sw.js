// OnePlan Service Worker
const CACHE_VERSION = 'oneplan-v46';
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

// Push-Subscription-Erneuerung: Der Browser kann eine bestehende Push-
// Subscription jederzeit von sich aus ungültig machen und erneuern (z. B. bei
// Schlüsselrotation des Push-Dienstes). Ohne diesen Handler würde die App
// davon nichts mitbekommen und stumm keine Benachrichtigungen mehr erhalten.
// Wir erzeugen daher eine neue Subscription mit demselben Public Key und
// informieren alle offenen Clients, damit app.js die neue Subscription an
// die Supabase Edge Function übermitteln und die alte dort ersetzen kann.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldSubscription = event.oldSubscription;
        const applicationServerKey = oldSubscription
          ? oldSubscription.options.applicationServerKey
          : event.applicationServerKey || undefined;

        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsArr.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            oldEndpoint: oldSubscription ? oldSubscription.endpoint : null,
            subscription: newSubscription.toJSON()
          });
        });
      } catch (err) {
        // Erneuerung fehlgeschlagen (z. B. Berechtigung entzogen) – nichts
        // weiter zu tun, die App erkennt beim nächsten Öffnen den fehlenden
        // Subscription-Status und kann erneut um Erlaubnis bitten.
      }
    })()
  );
});
