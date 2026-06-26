// Service worker para notificaciones push en segundo plano (FCM).
// Rellena la config con los mismos valores NEXT_PUBLIC_* de tu proyecto.
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "REEMPLAZA",
  authDomain: "REEMPLAZA",
  projectId: "REEMPLAZA",
  messagingSenderId: "REEMPLAZA",
  appId: "REEMPLAZA",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || "MantenimientoHUB", {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
  });
});
