import api from './api';

const postService = {
  getFeed(page = 1, limit = 5) {
    return api.get(`/posts?page=${page}&limit=${limit}`);
  },
  createPost(postData) {
    // If postData is FormData, axios handles Content-Type boundary automatically
    return api.post('/posts', postData);
  },
  getPost(id) {
    return api.get(`/posts/${id}`);
  },
  updatePost(id, postData) {
    return api.put(`/posts/${id}`, postData);
  },
  deletePost(id) {
    return api.delete(`/posts/${id}`);
  },
  likePost(id) {
    return api.post(`/posts/${id}/like`);
  },
  unlikePost(id) {
    return api.delete(`/posts/${id}/like`);
  },
  getUserPosts(userId) {
    return api.get(`/posts/user/${userId}`);
  }
};

export default postService;
