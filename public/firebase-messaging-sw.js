// Service worker para notificaciones push en segundo plano (FCM).
// Valores del proyecto housekeeping-bda2d (los mismos NEXT_PUBLIC_* del .env.local).
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBUIQaFBvZ2JJN3SiwJEi8Z2n2beQ50_7w",
  authDomain: "housekeeping-bda2d.firebaseapp.com",
  projectId: "housekeeping-bda2d",
  messagingSenderId: "96691115013",
  appId: "1:96691115013:web:6a983863aaf10ac4b6786c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || "4RHousekeeping", {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: "4rhk",
    renotify: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((cl) => {
      for (const c of cl) { if ("focus" in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
