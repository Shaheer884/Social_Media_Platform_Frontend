import api from '../services/api';

const pushService = {
  /**
   * Fetch base64-encoded VAPID public key from backend
   */
  getPublicKey() {
    return api.get('/push/key');
  },

  /**
   * Send the browser push subscription details to the server
   */
  subscribe(subscription) {
    return api.post('/push/subscribe', subscription);
  },

  /**
   * Remove a registered browser subscription from the server
   */
  unsubscribe(endpoint) {
    return api.post('/push/unsubscribe', { endpoint });
  }
};

export default pushService;
