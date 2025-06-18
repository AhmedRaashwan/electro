
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyCRKhcp_SHx3JhK9voZdLUEYjgDsd8UFS8",
  authDomain: "electro-12753.firebaseapp.com",
  projectId: "electro-12753",
  storageBucket: "electro-12753.appspot.com",
  messagingSenderId: "34147042347",
  appId: "1:34147042347:web:e358bb7763a6afff03566e",
  measurementId: "G-MXBD5C0ZDJ"
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
