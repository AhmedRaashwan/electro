importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "electro-12753.firebaseapp.com",
  projectId: "electro-12753",
  storageBucket: "electro-12753.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon.png' // Optional: Add an icon in the public/assets folder
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.fcmOptions?.link || 'https://electro-12753.web.app';
  event.waitUntil(clients.openWindow(url));
});
