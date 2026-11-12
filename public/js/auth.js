// Connectly Authentication Logic
const auth = {
  async getCurrentUser() {
    try {
      if (!api.getToken()) return null;
      const res = await api.get('/auth/me');
      return res.user;
    } catch (err) {
      api.removeToken();
      return null;
    }
  },

  async login(emailOrUsername, password) {
    const res = await api.post('/auth/login', { emailOrUsername, password });
    if (res.token) {
      api.setToken(res.token);
    }
    return res.user;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.token) {
      api.setToken(res.token);
    }
    return res.user;
  },

  logout() {
    api.removeToken();
    window.location.href = '/login.html';
  },
};

window.auth = auth;
