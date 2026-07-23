import api from './api';

const storyService = {
  getStories() {
    return api.get('/stories');
  },
  createStory(storyData) {
    const isFormData = storyData instanceof FormData;
    return api.post('/stories', storyData, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
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
  }
};

export default storyService;
