// Firebase imports
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA2abvzifuMGk-tQEO8uymc08i8NvMAHwI",
  authDomain: "notify-raa.firebaseapp.com",
  projectId: "notify-raa",
  messagingSenderId: "767633213120",
  appId: "1:767633213120:web:0a19231dc1f04e3ced0f25",
});

const messaging = firebase.messaging();

// Handle installation and skip waiting
self.addEventListener('install', function(event) {
  event.waitUntil(
    self.skipWaiting().then(() => {
      // console.log("Service Worker installed and activated immediately");
    })
  );
});

// Handle activation and take control of clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    self.clients.claim().then(() => {
      // console.log("Service Worker activated and controlling clients");
    })
  );
});

// Handle push events
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const payload = event.data.json();
  if (!payload.data) return;

  const notificationTitle = payload.data.title || "Default Title";
  const notificationBody = payload.data.body || "Default Message";
  const clickAction = 'http://reports.infy.uk/admin.html';

  event.waitUntil(
    self.registration.showNotification(notificationTitle, {
      body: notificationBody,
      icon: 'https://ahmedraashwan.github.io/electro/kuwait.png',
      data: {
        url: clickAction
      }
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = 'http://reports.infy.uk/admin.html';
  // console.log("🔗 Opening URL:", targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
