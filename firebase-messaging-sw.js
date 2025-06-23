self.addEventListener('push', function(event) {
  self.registration.showNotification("🔗 Click Test", {
    body: "Click here to open Google",
    icon: '/icon.png',
    data: {
      url: "https://google.com"
    }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  console.log("🔗 Opening URL:", targetUrl);

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
