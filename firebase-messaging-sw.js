importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

// Initialize Firebase with your project's configuration
firebase.initializeApp({
  apiKey: "AIzaSyA2abvzifuMGk-tQEO8uymc08i8NvMAHwI",
  authDomain: "notify-raa.firebaseapp.com",
  projectId: "notify-raa",
  messagingSenderId: "767633213120",
  appId: "1:767633213120:web:0a19231dc1f04e3ced0f25",
});

// Get the Messaging service instance
const messaging = firebase.messaging();

// Listen for background messages
messaging.onBackgroundMessage(function(payload) {
  console.log("📦 Background message received:", payload);

  const notificationTitle = payload.data.title;
  const notificationBody = payload.data.body;
  const clickAction = payload.data.click_action || '/'; // 🔗 Default or provided link

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.png',
    data: {
      url: clickAction
    }
  });
});


self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Access the custom data you passed into showNotification
  const targetUrl = 'http://reports.infy.uk/reports.html';
  console.log("🔗 Opening URL:", targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        // Reuse tab if already open
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

