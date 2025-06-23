// Immediately show test notification on Service Worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(
    self.registration.showNotification("🔗 Manual Test", {
      body: "Click to open google.com",
      icon: "/icon.png",
      data: {
        url: "https://google.com"
      }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  console.log("🔗 Opening:", targetUrl);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (let client of clientsArr) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
