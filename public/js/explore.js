// Explore & Discovery page controller: User search, directory, and follow actions

let searchTimeout = null;

async function initExplore() {
  await Auth.init({ requireAuth: false });

  const searchInput = document.getElementById('explore-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 250);
    });

    // Check for query param if redirected from quick search
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      searchInput.value = q;
      performSearch(q);
    } else {
      performSearch('');
    }
  }
}

async function performSearch(query) {
  const container = document.getElementById('explore-results-container');
  const countLabel = document.getElementById('explore-results-count');

  if (!container) return;

  container.innerHTML = `
    <div style="padding: 20px;">
      <div class="skeleton" style="height: 70px; margin-bottom: 12px; border-radius: 10px;"></div>
      <div class="skeleton" style="height: 70px; margin-bottom: 12px; border-radius: 10px;"></div>
      <div class="skeleton" style="height: 70px; border-radius: 10px;"></div>
    </div>
  `;

  try {
    const endpoint = query ? `/api/users?search=${encodeURIComponent(query)}` : '/api/users?limit=30';
    const res = await API.get(endpoint);

    if (res.success && res.users) {
      container.innerHTML = '';

      if (countLabel) {
        countLabel.textContent = query
          ? `${res.users.length} ${res.users.length === 1 ? 'user' : 'users'} found for "${query}"`
          : `Discover Community Members (${res.users.length})`;
      }

      if (res.users.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 class="empty-state-title">No users found</h3>
            <p class="empty-state-desc">Try searching with a different name or username.</p>
          </div>
        `;
        return;
      }

      res.users.forEach((user) => {
        container.appendChild(createExploreUserCard(user));
      });
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-title" style="color: var(--danger);">Search error</p>
        <p class="empty-state-desc">${escapeHTML(err.message)}</p>
      </div>
    `;
  }
}

function createExploreUserCard(user) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.style.cursor = 'pointer';

  const isSelf = user.isSelf;
  const followBtnHTML = isSelf
    ? `<span style="font-size: 0.8rem; color: var(--text-dim); font-weight: 500;">You</span>`
    : `
      <button class="btn-follow ${user.isFollowing ? 'following' : ''}" onclick="event.stopPropagation(); handleExploreFollow('${escapeHTML(user._id)}', this)">
        ${user.isFollowing ? 'Following' : 'Follow'}
      </button>
    `;

  card.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;">
      <a href="/profile.html?username=${encodeURIComponent(user.username)}" style="display: flex; gap: 14px; text-decoration: none; flex: 1; min-width: 0;">
        <img class="avatar avatar-md" style="width: 48px; height: 48px;" src="${sanitizeURL(user.avatar, '/images/default-avatar.svg')}" alt="${escapeHTML(user.name)}" />
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">
            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${escapeHTML(user.name)}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem;">@${escapeHTML(user.username)}</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.45; word-break: break-word;">
            ${escapeHTML(user.bio || 'Member of CONNECT community.')}
          </p>
        </div>
      </a>
      <div style="flex-shrink: 0; align-self: center;">
        ${followBtnHTML}
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      window.location.href = `/profile.html?username=${encodeURIComponent(user.username)}`;
    }
  });

  return card;
}

async function handleExploreFollow(userId, btn) {
  if (!Auth.user) {
    showToast('Please log in to follow users', 'error');
    window.location.href = '/login.html';
    return;
  }

  const isCurrentlyFollowing = btn.classList.contains('following');
  btn.disabled = true;

  try {
    if (isCurrentlyFollowing) {
      const res = await API.delete(`/api/users/${encodeURIComponent(userId)}/follow`);
      if (res.success) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
        showToast('Unfollowed', 'info');
      }
    } else {
      const res = await API.post(`/api/users/${encodeURIComponent(userId)}/follow`);
      if (res.success) {
        btn.classList.add('following');
        btn.textContent = 'Following';
        showToast('Now following', 'success');
      }
    }
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  } finally {
    btn.disabled = false;
  }
}
