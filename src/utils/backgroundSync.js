/**
 * Background Sync and Offline Queue Utility for ConnectHub PWA
 */

import api from '../services/api';

const QUEUE_KEY = 'connecthub_sync_queue';

// Get current queue from localStorage
export const getQueue = () => {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    console.error('Error reading sync queue:', e);
    return [];
  }
};

// Save queue to localStorage
export const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving sync queue:', e);
  }
};

// Check if a request path should be queued
export const shouldQueueRequest = (url, method) => {
  const normalizedUrl = url.toLowerCase();
  
  // Do NOT queue authentication, verification, forgot password, or reset password requests
  if (normalizedUrl.includes('/auth/') || 
      normalizedUrl.includes('/verify') || 
      normalizedUrl.includes('/forgot-password') || 
      normalizedUrl.includes('/reset-password') ||
      normalizedUrl.includes('/admin/login')) {
    return false;
  }

  // Only queue mutation operations (POST, PUT, DELETE, PATCH)
  const isMutation = ['post', 'put', 'delete', 'patch'].includes(method.toLowerCase());
  
  if (!isMutation) return false;

  // Check matching patterns:
  // - Likes: /posts/:id/like
  // - Saves: /posts/:id/save
  // - Comments: /posts/:id/comments, /comments/:id
  // - Follows: /users/:id/follow
  // - Notifications: /notifications/mark-read, /notifications/:id/read
  const queueablePatterns = [
    '/posts/',
    '/comments',
    '/users/',
    '/notifications'
  ];

  return queueablePatterns.some((pattern) => normalizedUrl.includes(pattern));
};

// Add a request to the offline queue
export const enqueueRequest = (url, method, data = null) => {
  if (!shouldQueueRequest(url, method)) {
    return false;
  }

  const queue = getQueue();
  
  // Avoid duplicating identical queued operations (e.g. liking the same post twice in a row)
  const isDuplicate = queue.some(
    (req) => req.url === url && req.method === method && JSON.stringify(req.data) === JSON.stringify(data)
  );

  if (isDuplicate) {
    // If we toggle like/unlike, we can cancel them out!
    // For example: if we have a POST /like and then a DELETE /like, they cancel out.
    // Let's implement toggle cancellation to keep the queue clean and optimized!
    const togglePairs = [
      { first: 'post', second: 'delete', suffix: '/like' },
      { first: 'post', second: 'delete', suffix: '/save' },
      { first: 'post', second: 'delete', suffix: '/follow' }
    ];

    for (const pair of togglePairs) {
      if (url.endsWith(pair.suffix)) {
        const opposingMethod = method === pair.first ? pair.second : pair.first;
        const opposingIndex = queue.findIndex((req) => req.url === url && req.method === opposingMethod);
        
        if (opposingIndex !== -1) {
          queue.splice(opposingIndex, 1);
          saveQueue(queue);
          console.log(`Cancelled out opposing queued request: ${method} ${url}`);
          return true;
        }
      }
    }
    
    return true; // Ignore exact duplicate to prevent redundant API calls
  }

  queue.push({
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    method,
    data,
    timestamp: new Date().toISOString()
  });

  saveQueue(queue);
  console.log(`Enqueued offline request: ${method.toUpperCase()} ${url}`);
  
  // Show standard console or dispatch global event to update UI count
  window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: queue.length } }));
  return true;
};

// Retry all queued requests sequentially
let isSyncing = false;
export const retryQueuedRequests = async () => {
  if (isSyncing || !navigator.onLine) return;
  
  const queue = getQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  console.log(`Syncing ${queue.length} queued offline requests...`);
  
  const failedRequests = [];

  for (const req of queue) {
    try {
      // Execute the request via our Axios client
      // We pass a custom header 'X-Background-Sync: true' so our interceptor knows to let it bypass offline checks
      await api({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: {
          'X-Background-Sync': 'true'
        }
      });
      console.log(`Successfully synced queued request: ${req.method.toUpperCase()} ${req.url}`);
    } catch (error) {
      console.error(`Failed to sync queued request: ${req.method.toUpperCase()} ${req.url}`, error);
      
      // If it's a client error (4xx) like 400 or 404, the request is invalid or resources were modified.
      // Do not keep it in the queue as it will keep failing.
      // If it's a network error or server error (5xx), we keep it to retry later.
      const status = error.response?.status || error.status;
      if (!status || status >= 500) {
        failedRequests.push(req);
      }
    }
  }

  saveQueue(failedRequests);
  isSyncing = false;
  
  window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: failedRequests.length } }));
  
  if (failedRequests.length === 0) {
    console.log('All offline requests synced successfully!');
  } else {
    console.log(`Failed to sync ${failedRequests.length} requests. They remain in queue.`);
  }
};
