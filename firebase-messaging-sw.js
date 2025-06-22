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

messaging.onBackgroundMessage(function(payload) {
  console.log("📦 Background message received:", payload);
  const { title, body } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png' // Optional
  }); 
});
