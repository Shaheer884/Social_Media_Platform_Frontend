import api from './api';

const birthdayService = {
  getReminders() {
    return api.get('/birthday/reminders');
  },
  postWish(recipientId, message) {
    return api.post('/birthday/wish', { recipientId, message });
  },
  postGift(recipientId, giftType, message) {
    return api.post('/birthday/send-gift', { recipientId, giftType, message });
  },
  getWishesAndGifts(userId) {
    return api.get(`/birthday/wishes/${userId}`);
  },
  likeWish(wishId) {
    return api.post(`/birthday/wishes/${wishId}/like`);
  },
  replyWish(wishId, message) {
    return api.post(`/birthday/wishes/${wishId}/reply`, { message });
  },
  deleteWish(wishId) {
    return api.delete(`/birthday/wishes/${wishId}`);
  }
};

export default birthdayService;
