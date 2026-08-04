// Service Worker de Firebase Cloud Messaging.
// Se activa solo si existe /firebase-config.json en el hosting (ver firebase-config.example.json).
self.addEventListener('install', (e) => e.waitUntil(skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'FCM_INIT') initFcm();
});

async function initFcm() {
  try {
    const res = await fetch('/firebase-config.json');
    if (!res.ok) return;
    const cfg = await res.json();

    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title ?? 'Repuestos ERP';
      const body = payload.notification?.body ?? '';
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data ?? {},
      });
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const url = event.notification.data?.url || '/';
      event.waitUntil(clients.openWindow(url));
    });
  } catch {
    /* FCM no configurado: silencioso */
  }
}
