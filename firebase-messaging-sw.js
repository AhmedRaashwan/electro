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

  // Extract notification data from the 'data' payload,
  // as the 'notification' payload will no longer be sent
  // (to prevent automatic display by the browser).
  const notificationTitle = payload.data.title;
  const notificationBody = payload.data.body;

  // You can also extract other custom data from payload.data
  // For example, if you send an 'imageUrl' in your data payload:
  // const imageUrl = payload.data.imageUrl;

  // Display the notification using the extracted data
  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.png' // Ensure this path is correct for your icon!
    // Add other notification options here as needed:
    // image: imageUrl,
    // badge: '/badge.png',
    // data: payload.data // To pass custom data back when notification is clicked
  });
});
