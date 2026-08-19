/*
  ConnectHub Push Notifications Service Worker Extension
  This script is imported by the main service worker and structures push notification event listeners.
*/

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'ConnectHub';
  
  // Rich styling options for native devices
  const options = {
    body: data.body || 'You have a new update on ConnectHub!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    image: data.image || undefined,
    timestamp: data.timestamp || Date.now(),
    vibrate: [100, 50, 100],
    tag: data.data?.type ? `connecthub-${data.data.type}` : 'connecthub-general',
    renotify: true,
    actions: data.actions || [],
    data: {
      url: data.url || '/',
      actionsUrls: data.data?.actionsUrls || {}
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  let urlToOpen = event.notification.data?.url || '/';

  // If user clicked the 'Dismiss' action button
  if (action === 'dismiss') {
    return;
  }

  // If clicked a custom action button with a mapped URL
  if (action && event.notification.data?.actionsUrls?.[action]) {
    urlToOpen = event.notification.data.actionsUrls[action];
  }

  const targetOrigin = new URL(self.location.origin).origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Search for any open window matching the application origin
      const matchingClient = windowClients.find((client) => {
        return new URL(client.url).origin === targetOrigin;
      });

      // 2. If tab found, navigate it to target route and focus it
      if (matchingClient) {
        return matchingClient.navigate(urlToOpen).then((client) => {
          if (client && 'focus' in client) {
            return client.focus();
          }
        });
      }

      // 3. If no tab is open, launch a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Push notification was dismissed by the user.');
});
