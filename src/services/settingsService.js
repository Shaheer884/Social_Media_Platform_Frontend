import api from './api';

const settingsService = {
  // Get all preferences
  getSettings() {
    return api.get('/settings');
  },

  // Update account details (name, username, email, phone, website, location, pictures, etc.)
  updateAccount(accountData) {
    // If updating files, accountData will be FormData, otherwise standard object
    const headers = accountData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' } 
      : { 'Content-Type': 'application/json' };
    return api.put('/settings/account', accountData, { headers });
  },

  // Update theme settings (light, dark, system)
  updateTheme(theme) {
    return api.put('/settings/theme', { theme });
  },

  // Update notification delivery settings
  updateNotifications(preferences) {
    return api.put('/settings/notifications', { preferences });
  },

  // Toggle Private Account status
  updatePrivacy(isPrivate) {
    return api.put('/settings/privacy', { isPrivate });
  },

  // Update comments policy
  updateComments(settings) {
    return api.put('/settings/comments', { settings });
  },

  // Blocked user management
  getBlockedUsers(page = 1, query = '', limit = 10) {
    return api.get(`/settings/blocked?page=${page}&q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  blockUser(userId) {
    return api.post(`/settings/block/${userId}`);
  },

  unblockUser(userId) {
    return api.delete(`/settings/block/${userId}`);
  },

  // Follow requests (Private Accounts)
  getFollowRequests() {
    return api.get('/settings/requests');
  },

  acceptFollowRequest(requesterId) {
    return api.post(`/settings/requests/${requesterId}/accept`);
  },

  rejectFollowRequest(requesterId) {
    return api.post(`/settings/requests/${requesterId}/reject`);
  }
};

export default settingsService;
