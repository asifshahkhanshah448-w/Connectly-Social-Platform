// Connectly Comments Module
const commentsService = {
  async getComments(postId) {
    const res = await api.get(`/posts/${postId}/comments`);
    return res.comments;
  },

  async addComment(postId, content) {
    const res = await api.post(`/posts/${postId}/comments`, { content });
    return res.comment;
  },

  async deleteComment(commentId) {
    return await api.delete(`/comments/${commentId}`);
  },
};

window.commentsService = commentsService;
