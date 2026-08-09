/**
 * Cache Management Utility for ConnectHub PWA
 */

/**
 * Calculates the total size of files stored in browser Cache Storage.
 * Returns the size in megabytes (MB) rounded to 2 decimal places.
 */
export const getCacheSize = async () => {
  if (!('caches' in window)) return 0;
  
  try {
    const cacheNames = await caches.keys();
    let totalBytes = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      
      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            // Read response as blob to check exact size
            const blob = await response.clone().blob();
            totalBytes += blob.size;
          }
        } catch (err) {
          // Ignore failed reads
        }
      }
    }

    const megabytes = totalBytes / (1024 * 1024);
    return parseFloat(megabytes.toFixed(2));
  } catch (error) {
    console.error('Failed to calculate cache size:', error);
    return 0;
  }
};

/**
 * Clears all stored assets in browser Cache Storage.
 */
export const clearAppCache = async () => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    const deletions = cacheNames.map((name) => caches.delete(name));
    await Promise.all(deletions);
    
    // Clear local cache placeholders if any
    localStorage.removeItem('connecthub_cached_feed');
    localStorage.removeItem('connecthub_cached_profiles');
    
    return true;
  } catch (error) {
    console.error('Failed to clear app cache:', error);
    return false;
  }
};

/**
 * Refreshes the cache by registering/refreshing service worker assets.
 */
export const refreshAppCache = async () => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const updates = registrations.map((reg) => reg.update());
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    return false;
  }
};

/**
 * Removes invalid or outdated cache entries.
 */
export const removeInvalidCacheEntries = async () => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    // Keep only active workbox caches and delete legacy ones
    const activePrefixes = ['workbox-precache', 'api-cache', 'images-cache', 'static-assets', 'fonts-cache'];
    
    for (const name of cacheNames) {
      const isMatched = activePrefixes.some((prefix) => name.startsWith(prefix));
      if (!isMatched) {
        await caches.delete(name);
      }
    }
    return true;
  } catch (error) {
    console.error('Failed to clear invalid cache entries:', error);
    return false;
  }
};
