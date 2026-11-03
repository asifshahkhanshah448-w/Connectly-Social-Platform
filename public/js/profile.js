// Profile page controller: View profiles, edit profile, user posts, and followers/following

let profileUser = null;
let currentTab = 'posts';

async function initProfile() {
  await Auth.init({ requireAuth: false });

  const urlParams = new URLSearchParams(window.location.search);
  let targetUsername = urlParams.get('username');

  // If no username provided in URL, fallback to authenticated user
  if (!targetUsername) {
    if (Auth.user) {
      targetUsername = Auth.user.username;
    } else {
      window.location.href = '/login.html';
      return;
    }
  }

  await loadUserProfile(targetUsername);
  initProfileModals();
}

async function loadUserProfile(username) {
  try {
    const res = await API.get(`/api/users/${encodeURIComponent(username)}`);
    if (res.success && res.user) {
      profileUser = res.user;
      renderProfileHeader(res.user);
      loadUserPosts(res.user.username);
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
    const container = document.getElementById('profile-content-container');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title" style="color: var(--danger);">User not found</h3>
          <p class="empty-state-desc">The requested user @${escapeHTML(username)} does not exist or has been removed.</p>
          <a href="/" class="btn-primary" style="display: inline-block; margin-top: 14px;">Return to Feed</a>
        </div>
      `;
    }
  }
}

function renderProfileHeader(user) {
  document.title = `${user.name} (@${user.username}) - CONNECT`;

  const topTitle = document.getElementById('top-profile-name');
  if (topTitle) topTitle.textContent = user.name;

  const topPostsCount = document.getElementById('top-profile-posts-count');
  if (topPostsCount) topPostsCount.textContent = `${user.postsCount || 0} posts`;

  const avatar = document.getElementById('profile-avatar');
  if (avatar) avatar.src = user.avatar || '/images/default-avatar.svg';

  const fullname = document.getElementById('profile-fullname');
  if (fullname) fullname.textContent = user.name;

  const usernameEl = document.getElementById('profile-username');
  if (usernameEl) usernameEl.textContent = `@${user.username}`;

  const bioEl = document.getElementById('profile-bio');
  if (bioEl) {
    bioEl.textContent = user.bio || 'No bio provided yet.';
    bioEl.style.fontStyle = user.bio ? 'normal' : 'italic';
  }

  const joinDate = document.getElementById('profile-joindate');
  if (joinDate) {
    const date = new Date(user.createdAt);
    joinDate.textContent = `Joined ${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  }

  // Counts
  const postsCountEl = document.getElementById('profile-posts-count');
  if (postsCountEl) postsCountEl.textContent = user.postsCount || 0;

  const followersCountEl = document.getElementById('profile-followers-count');
  if (followersCountEl) followersCountEl.textContent = user.followersCount || 0;

  const followingCountEl = document.getElementById('profile-following-count');
  if (followingCountEl) followingCountEl.textContent = user.followingCount || 0;

  // Action Button: Edit Profile vs Follow/Unfollow
  const actionBtnContainer = document.getElementById('profile-action-btn-container');
  if (actionBtnContainer) {
    actionBtnContainer.innerHTML = '';

    if (user.isSelf) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit-profile';
      editBtn.textContent = 'Edit Profile';
      editBtn.onclick = () => openEditProfileModal();
      actionBtnContainer.appendChild(editBtn);
    } else {
      const followBtn = document.createElement('button');
      followBtn.className = `btn-follow ${user.isFollowing ? 'following' : ''}`;
      followBtn.id = 'profile-follow-btn';
      followBtn.textContent = user.isFollowing ? 'Following' : 'Follow';
      followBtn.onclick = () => handleProfileFollowToggle();
      actionBtnContainer.appendChild(followBtn);
    }
  }
}

async function handleProfileFollowToggle() {
  if (!Auth.user) {
    showToast('Please log in to follow this user', 'error');
    window.location.href = '/login.html';
    return;
  }

  const btn = document.getElementById('profile-follow-btn');
  const followersCountEl = document.getElementById('profile-followers-count');
  if (!btn || !profileUser) return;

  const isCurrentlyFollowing = btn.classList.contains('following');
  btn.disabled = true;

  try {
    if (isCurrentlyFollowing) {
      const res = await API.delete(`/api/users/${profileUser._id}/follow`);
      if (res.success) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
        if (followersCountEl) followersCountEl.textContent = res.followersCount;
        showToast(`Unfollowed @${profileUser.username}`, 'info');
      }
    } else {
      const res = await API.post(`/api/users/${profileUser._id}/follow`);
      if (res.success) {
        btn.classList.add('following');
        btn.textContent = 'Following';
        if (followersCountEl) followersCountEl.textContent = res.followersCount;
        showToast(`Following @${profileUser.username}`, 'success');
      }
    }
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  } finally {
    btn.disabled = false;
  }
}

// -----------------------------------------------------------------------------
// Tabs: Posts / Followers / Following
// -----------------------------------------------------------------------------

function switchProfileTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const container = document.getElementById('profile-tab-content');
  if (!container || !profileUser) return;

  if (tab === 'posts') {
    loadUserPosts(profileUser.username);
  } else if (tab === 'followers') {
    loadFollowersList(profileUser._id);
  } else if (tab === 'following') {
    loadFollowingList(profileUser._id);
  }
}

async function loadUserPosts(username) {
  const container = document.getElementById('profile-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 24px;">
      <div class="skeleton" style="height: 100px; margin-bottom: 14px;"></div>
      <div class="skeleton" style="height: 100px;"></div>
    </div>
  `;

  try {
    const res = await API.get(`/api/posts?username=${encodeURIComponent(username)}&limit=30`);
    if (res.success) {
      container.innerHTML = '';
      if (res.posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3 class="empty-state-title">No posts yet</h3>
            <p class="empty-state-desc">@${escapeHTML(username)} hasn't posted anything yet.</p>
          </div>
        `;
        return;
      }

      res.posts.forEach((post) => {
        container.appendChild(createPostCardElement(post));
      });
    }
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-title" style="color: var(--danger);">Failed to load posts</p>
        <p class="empty-state-desc">${escapeHTML(err.message)}</p>
      </div>
    `;
  }
}

async function loadFollowersList(userId) {
  const container = document.getElementById('profile-tab-content');
  if (!container) return;

  container.innerHTML = `<div style="padding: 24px;"><div class="skeleton" style="height: 60px; margin-bottom: 8px;"></div><div class="skeleton" style="height: 60px;"></div></div>`;

  try {
    const res = await API.get(`/api/users/${userId}/followers`);
    if (res.success) {
      container.innerHTML = '';
      if (res.followers.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3 class="empty-state-title">No followers yet</h3>
            <p class="empty-state-desc">When people follow this user, they will appear here.</p>
          </div>
        `;
        return;
      }

      const list = document.createElement('div');
      list.className = 'user-suggestion-list';
      list.style.padding = '16px 20px';

      res.followers.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'user-suggestion-item';
        item.style.padding = '8px 0';
        item.style.borderBottom = '1px solid var(--border-subtle)';

        item.innerHTML = `
          <a href="/profile.html?username=${user.username}" class="user-suggestion-link">
            <img class="avatar avatar-sm" src="${user.avatar || '/images/default-avatar.svg'}" alt="${escapeHTML(user.name)}" />
            <div class="user-names">
              <div class="user-fullname">${escapeHTML(user.name)}</div>
              <div class="user-handle">@${escapeHTML(user.username)}</div>
            </div>
          </a>
        `;
        list.appendChild(item);
      });

      container.appendChild(list);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="empty-state-desc">${escapeHTML(err.message)}</p></div>`;
  }
}

async function loadFollowingList(userId) {
  const container = document.getElementById('profile-tab-content');
  if (!container) return;

  container.innerHTML = `<div style="padding: 24px;"><div class="skeleton" style="height: 60px; margin-bottom: 8px;"></div><div class="skeleton" style="height: 60px;"></div></div>`;

  try {
    const res = await API.get(`/api/users/${userId}/following`);
    if (res.success) {
      container.innerHTML = '';
      if (res.following.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3 class="empty-state-title">Not following anyone</h3>
            <p class="empty-state-desc">This user isn't following anyone yet.</p>
          </div>
        `;
        return;
      }

      const list = document.createElement('div');
      list.className = 'user-suggestion-list';
      list.style.padding = '16px 20px';

      res.following.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'user-suggestion-item';
        item.style.padding = '8px 0';
        item.style.borderBottom = '1px solid var(--border-subtle)';

        item.innerHTML = `
          <a href="/profile.html?username=${user.username}" class="user-suggestion-link">
            <img class="avatar avatar-sm" src="${user.avatar || '/images/default-avatar.svg'}" alt="${escapeHTML(user.name)}" />
            <div class="user-names">
              <div class="user-fullname">${escapeHTML(user.name)}</div>
              <div class="user-handle">@${escapeHTML(user.username)}</div>
            </div>
          </a>
        `;
        list.appendChild(item);
      });

      container.appendChild(list);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="empty-state-desc">${escapeHTML(err.message)}</p></div>`;
  }
}

// -----------------------------------------------------------------------------
// Edit Profile Modal Logic
// -----------------------------------------------------------------------------

function openEditProfileModal() {
  if (!profileUser) return;

  const nameInput = document.getElementById('edit-profile-name');
  const bioInput = document.getElementById('edit-profile-bio');
  const avatarInput = document.getElementById('edit-profile-avatar');

  if (nameInput) nameInput.value = profileUser.name || '';
  if (bioInput) bioInput.value = profileUser.bio || '';
  if (avatarInput) avatarInput.value = profileUser.avatar || '';

  openModal('modal-edit-profile');
}

function initProfileModals() {
  const saveBtn = document.getElementById('btn-save-profile');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('edit-profile-name');
      const bioInput = document.getElementById('edit-profile-bio');
      const avatarInput = document.getElementById('edit-profile-avatar');

      const name = nameInput ? nameInput.value.trim() : '';
      const bio = bioInput ? bioInput.value.trim() : '';
      const avatar = avatarInput ? avatarInput.value.trim() : '';

      if (!name) {
        showToast('Full name cannot be empty', 'error');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await API.put('/api/users/profile', { name, bio, avatar });
        if (res.success && res.user) {
          showToast('Profile updated successfully!', 'success');
          API.setCurrentUser(res.user);
          profileUser = { ...profileUser, ...res.user };
          renderProfileHeader(profileUser);
          closeModal('modal-edit-profile');
        }
      } catch (err) {
        showToast(err.message || 'Failed to update profile', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Profile';
      }
    });
  }
}
