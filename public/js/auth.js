// Authentication lifecycle and state management for CONNECT

const Auth = {
  user: null,

  async init(options = { requireAuth: false }) {
    const token = API.getToken();
    if (!token) {
      if (options.requireAuth) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
        return false;
      }
      this.renderUnauthenticatedUI();
      return false;
    }

    try {
      const res = await API.get('/api/auth/me');
      if (res.success && res.user) {
        this.user = res.user;
        API.setCurrentUser(res.user);
        this.renderAuthenticatedUI(res.user);
        return true;
      }
    } catch (err) {
      console.warn('Session verification failed:', err);
      API.logout();
      if (options.requireAuth) {
        window.location.href = '/login.html';
      }
      return false;
    }
  },

  renderAuthenticatedUI(user) {
    // Populate user elements in sidebar
    const userCard = document.getElementById('sidebar-user-card');
    if (userCard) {
      userCard.style.display = 'flex';
      const avatarEl = userCard.querySelector('.sidebar-user-avatar');
      const nameEl = userCard.querySelector('.sidebar-user-name');
      const handleEl = userCard.querySelector('.sidebar-user-handle');
      const linkEl = userCard.querySelector('.sidebar-user-info');

      if (avatarEl) avatarEl.src = sanitizeURL(user.avatar, '/images/default-avatar.svg');
      if (nameEl) nameEl.textContent = user.name;
      if (handleEl) handleEl.textContent = `@${user.username}`;
      if (linkEl) linkEl.href = `/profile.html?username=${encodeURIComponent(user.username)}`;
    }

    // Populate profile nav links
    const profileNavLinks = document.querySelectorAll('.nav-profile-link');
    profileNavLinks.forEach((link) => {
      link.href = `/profile.html?username=${encodeURIComponent(user.username)}`;
    });

    // Mobile header avatar
    const mobileAvatar = document.getElementById('mobile-top-avatar');
    if (mobileAvatar) {
      mobileAvatar.src = sanitizeURL(user.avatar, '/images/default-avatar.svg');
      mobileAvatar.parentElement.href = `/profile.html?username=${encodeURIComponent(user.username)}`;
    }

    // Composer avatar if present
    const composerAvatar = document.getElementById('composer-avatar');
    if (composerAvatar) {
      composerAvatar.src = sanitizeURL(user.avatar, '/images/default-avatar.svg');
    }

    // Hide guest login button if present
    const guestBtn = document.getElementById('sidebar-guest-btn');
    if (guestBtn) guestBtn.style.display = 'none';
  },

  renderUnauthenticatedUI() {
    const userCard = document.getElementById('sidebar-user-card');
    if (userCard) userCard.style.display = 'none';

    const guestBtn = document.getElementById('sidebar-guest-btn');
    if (guestBtn) guestBtn.style.display = 'block';

    const composerCard = document.getElementById('post-composer-card');
    if (composerCard) {
      composerCard.innerHTML = `
        <div style="text-align: center; padding: 12px 0;">
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 10px;">
            Join the conversation on CONNECT. Share thoughts, follow engineers, and comment.
          </p>
          <a href="/login.html" class="btn-primary" style="display: inline-block;">Log In or Register</a>
        </div>
      `;
    }
  },
};

// Wire up logout button
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.logout();
    });
  }
});
