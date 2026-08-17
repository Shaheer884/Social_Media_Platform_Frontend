import api from './api';

const notificationService = {
  getLatestNotifications() {
    return api.get('/notifications/latest');
  },
  getNotifications(params = {}) {
    return api.get('/notifications', { params });
  },
  getNotificationDetails(notificationId) {
    return api.get(`/notifications/${notificationId}`);
  },
  markAllRead() {
    return api.patch('/notifications/mark-read');
  },
  markReadOne(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`);
  },
  deleteNotification(notificationId) {
    return api.delete(`/notifications/${notificationId}`);
  },
  deleteMultipleNotifications(ids) {
    return api.delete('/notifications/multiple', { data: { ids } });
  },
  deleteAllNotifications() {
    return api.delete('/notifications');
  }
};

export default notificationService;
