import api from './api';

const userService = {
  getProfile(userIdOrUsername) {
    return api.get(`/users/${userIdOrUsername}`);
  },
  updateProfile(userId, profileData) {
    return api.put(`/users/${userId}`, profileData);
  },
  deleteAccount(userId) {
    return api.delete(`/users/${userId}`);
  },
  getFollowers(userId) {
    return api.get(`/users/${userId}/followers`);
  },
  getFollowing(userId) {
    return api.get(`/users/${userId}/following`);
  },
  followUser(userId) {
    return api.post(`/users/${userId}/follow`);
  },
  unfollowUser(userId) {
    return api.delete(`/users/${userId}/follow`);
  },
  removeFollower(userId) {
    return api.delete(`/users/${userId}/follower`);
  },
  getSuggestions() {
    return api.get('/users/explore/suggestions');
  },
  searchUsers(query) {
    return api.get(`/users/explore/search?q=${encodeURIComponent(query)}`);
  }
};

export default userService;
