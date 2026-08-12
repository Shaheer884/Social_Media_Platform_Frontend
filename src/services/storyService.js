import api from './api';

const storyService = {
  getStories() {
    return api.get('/stories');
  },
  createStory(storyData, config = {}) {
    const isFormData = storyData instanceof FormData;
    return api.post('/stories', storyData, {
      ...config,
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
        ...(config.headers || {})
      }
    });
  },
  updateStory(id, storyData) {
    return api.put(`/stories/${id}`, storyData);
  },
  deleteStory(id) {
    return api.delete(`/stories/${id}`);
  },
  likeStory(id) {
    return api.post(`/stories/${id}/like`);
  },
  unlikeStory(id) {
    return api.delete(`/stories/${id}/like`);
  },
  commentStory(id, text) {
    return api.post(`/stories/${id}/comment`, { text });
  },
  viewStory(id) {
    return api.post(`/stories/${id}/view`);
  },
  getStoryViews(id) {
    return api.get(`/stories/${id}/views`);
  },
  getStoryLikes(id) {
    return api.get(`/stories/${id}/likes`);
  },
  replyStory(id, message) {
    return api.post(`/stories/${id}/reply`, { message });
  },
  getStoryReplies(id) {
    return api.get(`/stories/${id}/replies`);
  }
};

export default storyService;
