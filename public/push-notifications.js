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
    badge: data.badge || '/icons/badge-72x72.png',
    image: data.image || undefined,
    timestamp: data.timestamp || Date.now(),
    vibrate: [100, 50, 100],
    tag: data.data?.type ? `connecthub-${data.data.type}` : 'connecthub-general',
    renotify: true,
    actions: data.actions || [],
    data: {
      type: data.data?.type || 'general',
      targetId: data.data?.targetId || null,
      route: data.data?.route || '/',
      notificationId: data.data?.notificationId || null,
      createdAt: data.data?.createdAt || null,
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
  
  if (action === 'dismiss') {
    return;
  }

  // Extract relative route and custom action buttons urls
  let targetRoute = event.notification.data?.route || '/';
  const actionsUrls = event.notification.data?.actionsUrls || {};

  // If clicked a custom action button with a mapped relative URL
  if (action && actionsUrls[action]) {
    targetRoute = actionsUrls[action];
  }

  const origin = self.location.origin;
  const absoluteUrl = new URL(targetRoute, origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Search for any open window matching the application origin
      const matchingClient = windowClients.find((client) => {
        try {
          return new URL(client.url).origin === origin;
        } catch (e) {
          return false;
        }
      });

      // 2. If tab found, focus it and tell the React app to navigate internally
      if (matchingClient) {
        matchingClient.postMessage({
          type: 'NAVIGATE',
          route: targetRoute
        });
        
        if ('focus' in matchingClient) {
          return matchingClient.focus();
        }
      } else {
        // 3. If no tab is open, launch a new window directly on the absolute URL
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Push notification was dismissed by the user.');
});
