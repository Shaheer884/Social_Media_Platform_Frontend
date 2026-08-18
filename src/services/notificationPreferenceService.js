import api from './api';

const notificationPreferenceService = {
  // Get current notification settings
  getPreferences() {
    return api.get('/notifications/preferences');
  },

  // Update notification settings
  updatePreferences(preferences) {
    return api.put('/notifications/preferences', preferences);
  }
};

export default notificationPreferenceService;
