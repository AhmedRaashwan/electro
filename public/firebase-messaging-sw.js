// [firebase-messaging-sw.js]
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCRKhcp_SHx3JhK9voZdLUEYjgDsd8UFS8",
  authDomain: "electro-12753.firebaseapp.com",
  projectId: "electro-12753",
  storageBucket: "electro-12753.appspot.com",
  messagingSenderId: "34147042347",
  appId: "1:34147042347:web:e358bb7763a6afff03566e",
  measurementId: "G-MXBD5C0ZDJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png" // Optional: update with your icon path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
