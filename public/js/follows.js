// Connectly Follows Module
const followsService = {
  async follow(userId) {
    return await api.post(`/users/${userId}/follow`, {});
  },

  async unfollow(userId) {
    return await api.delete(`/users/${userId}/follow`);
  },

  async getFollowers(userId) {
    const res = await api.get(`/users/${userId}/followers`);
    return res.followers;
  },

  async getFollowing(userId) {
    const res = await api.get(`/users/${userId}/following`);
    return res.following;
  },
};

window.followsService = followsService;
