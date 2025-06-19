importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "electro-12753.firebaseapp.com",
  projectId: "electro-12753",
  storageBucket: "electro-12753.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Bypass API requests to Google Apps Script
  self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('script.google.com')) {
      event.respondWith(fetch(event.request));
    }
  });

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icons/icon.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.fcmOptions?.link || 'https://electro-12753.web.app';
    event.waitUntil(clients.openWindow(url));
  });
} catch (error) {
  console.error('Service Worker error:', error);
}
