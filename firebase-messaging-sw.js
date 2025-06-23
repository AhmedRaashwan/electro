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

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});



self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = 'http://reports.infy.uk/reports.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
