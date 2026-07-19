import api from './api';

const commentService = {
  getComments(postId) {
    return api.get(`/posts/${postId}/comments`);
  },
  createComment(postId, content) {
    return api.post(`/posts/${postId}/comments`, { content });
  },
  deleteComment(commentId) {
    return api.delete(`/comments/${commentId}`);
  }
};

export default commentService;
