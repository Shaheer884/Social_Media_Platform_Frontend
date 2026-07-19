import api from './api';

const notificationService = {
  getNotifications() {
    return api.get('/notifications');
  },
  markAllRead() {
    return api.patch('/notifications/mark-read');
  },
  markReadOne(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`);
  }
};

export default notificationService;
