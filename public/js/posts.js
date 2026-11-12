// Connectly Posts Module
const postsService = {
  async getPosts(options = {}) {
    let url = '/posts';
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.authorId) params.append('authorId', options.authorId);
    if (options.followingOnly) params.append('followingOnly', 'true');

    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await api.get(url);
    return res.posts;
  },

  async getPost(id) {
    const res = await api.get(`/posts/${id}`);
    return res.post;
  },

  async createPost(content, image) {
    const res = await api.post('/posts', { content, image });
    return res.post;
  },

  async updatePost(id, content, image) {
    const res = await api.put(`/posts/${id}`, { content, image });
    return res.post;
  },

  async deletePost(id) {
    return await api.delete(`/posts/${id}`);
  },

  async likePost(id) {
    return await api.post(`/posts/${id}/like`, {});
  },

  async unlikePost(id) {
    return await api.delete(`/posts/${id}/like`);
  },
};

window.postsService = postsService;
