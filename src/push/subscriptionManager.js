import pushService from './pushService';

/**
 * Converts a base64 URL-safe string to a Uint8Array.
 * Required by browser's PushManager subscription method.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Service Workers, Notifications, and Push API are supported
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Retrieves the current browser push subscription if active
 */
export async function getSubscription() {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error fetching active push subscription:', error);
    return null;
  }
}

/**
 * Subscribes the current device to push notifications
 */
export async function subscribeUser() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser');
  }

  try {
    // 1. Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 2. Fetch the server's VAPID public key
    const response = await pushService.getPublicKey();
    if (!response.success || !response.data) {
      throw new Error('Failed to retrieve server public VAPID key');
    }

    const applicationServerKey = urlBase64ToUint8Array(response.data);

    // 3. Request push subscription from browser's PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // 4. Send subscription info to backend
    await pushService.subscribe(subscription);
    
    console.log('📬 Device successfully subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribes the current device from push notifications
 */
export async function unsubscribeUser() {
  if (!isPushSupported()) return false;

  try {
    const subscription = await getSubscription();
    if (!subscription) return false;

    // 1. Send unsubscribe request to server
    await pushService.unsubscribe(subscription.endpoint);

    // 2. Unsubscribe the browser push token
    const unsubscribed = await subscription.unsubscribe();
    
    console.log('🔕 Device unsubscribed from push notifications status:', unsubscribed);
    return unsubscribed;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

/**
 * Synchronize the current subscription with the backend.
 * Useful if the user clears site settings but registration remains.
 */
export async function syncSubscriptionState() {
  if (!isPushSupported()) return;

  try {
    if (Notification.permission === 'granted') {
      const subscription = await getSubscription();
      if (subscription) {
        // Send to backend to ensure it's recorded
        await pushService.subscribe(subscription);
      } else {
        // We have permission, but no browser token. Attempt auto-subscription.
        await subscribeUser();
      }
    }
  } catch (error) {
    console.warn('Silent subscription synchronization failed:', error.message);
  }
}
