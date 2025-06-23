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

messaging.onBackgroundMessage(function(payload) {
  // console.log("📦 Background message received:", payload);

  const notificationTitle = payload.data.title;
  const notificationBody = payload.data.body;
  const clickAction = payload.data.click_action || 'http://reports.infy.uk/reports.html';

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: 'https://ahmedraashwan.github.io/electro/kuwait.png',
    image: 'https://www.mew.gov.kw/images/mew_en.svg',
    data: {
      url: clickAction
    }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || 'http://reports.infy.uk/reports.html';
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
