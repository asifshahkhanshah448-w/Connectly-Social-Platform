// Feed logic: Post feed, composer, interactions, comments, and suggestions

let currentPage = 1;
let hasMorePosts = false;
let isLoadingPosts = false;
let editingPostId = null;
let deletingPostId = null;

// Initialize Feed
async function initFeed() {
  await Auth.init({ requireAuth: false });

  initComposer();
  initModals();
  loadPosts(1);
  loadSuggestions();
}

// -----------------------------------------------------------------------------
// Posts Loading & Rendering
// -----------------------------------------------------------------------------

async function loadPosts(page = 1, append = false) {
  if (isLoadingPosts) return;
  isLoadingPosts = true;

  const container = document.getElementById('posts-feed-container');
  const loadMoreBtn = document.getElementById('btn-load-more');

  if (!append && container) {
    container.innerHTML = `
      <div style="padding: 24px;">
        <div class="skeleton" style="height: 120px; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 140px; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 120px;"></div>
      </div>
    `;
  }

  try {
    const res = await API.get(`/api/posts?page=${page}&limit=10`);
    if (res.success) {
      currentPage = res.pagination.page;
      hasMorePosts = res.pagination.hasMore;

      if (!append) {
        container.innerHTML = '';
      }

      if (res.posts.length === 0 && !append) {
        container.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 class="empty-state-title">No posts yet</h3>
            <p class="empty-state-desc">Be the first to share an update with the community!</p>
          </div>
        `;
      } else {
        res.posts.forEach((post) => {
          container.appendChild(createPostCardElement(post));
        });
      }

      if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMorePosts ? 'block' : 'none';
      }
    }
  } catch (err) {
    console.error('Failed to load posts:', err);
    if (!append && container) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-title" style="color: var(--danger);">Failed to load posts</p>
          <p class="empty-state-desc">${escapeHTML(err.message)}</p>
          <button class="btn-secondary" style="margin-top: 12px;" onclick="loadPosts(1)">Try Again</button>
        </div>
      `;
    }
  } finally {
    isLoadingPosts = false;
  }
}

function createPostCardElement(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.id = `post-${post._id}`;

  const author = post.author || {
    name: 'Anonymous',
    username: 'user',
    avatar: '/images/default-avatar.svg',
  };

  const imageHTML = post.image
    ? `<div class="post-media-wrap"><img src="${escapeHTML(post.image)}" alt="Post attachment" loading="lazy" /></div>`
    : '';

  const dropdownHTML = post.isOwner
    ? `
      <div class="post-actions-menu">
        <button class="post-menu-trigger" onclick="togglePostMenu('${post._id}')" aria-label="Post actions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
        <div class="post-dropdown" id="dropdown-${post._id}">
          <button onclick="openEditModal('${post._id}', '${escapeHTML(post.content).replace(/'/g, "\\'")}', '${escapeHTML(post.image || '')}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit
          </button>
          <button class="danger" onclick="confirmDeletePost('${post._id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete
          </button>
        </div>
      </div>
    `
    : '';

  card.innerHTML = `
    <div class="post-card-inner">
      <a href="/profile.html?username=${author.username}">
        <img class="avatar" src="${author.avatar || '/images/default-avatar.svg'}" alt="${escapeHTML(author.name)}" />
      </a>
      <div class="post-content-wrap">
        <div class="post-header">
          <div class="post-author-row">
            <a href="/profile.html?username=${author.username}" class="post-author-name">${escapeHTML(author.name)}</a>
            <span class="post-author-handle">@${escapeHTML(author.username)}</span>
            <span class="post-separator">·</span>
            <time class="post-time">${formatTimeAgo(post.createdAt)}</time>
          </div>
          ${dropdownHTML}
        </div>

        <div class="post-body-text" id="post-body-${post._id}">${escapeHTML(post.content)}</div>
        ${imageHTML}

        <div class="post-interaction-row">
          <button class="action-btn ${post.isLiked ? 'liked' : ''}" id="like-btn-${post._id}" onclick="handleLike('${post._id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span id="like-count-${post._id}">${post.likesCount || 0}</span>
          </button>

          <button class="action-btn" onclick="toggleCommentsDrawer('${post._id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span id="comment-count-${post._id}">${post.commentsCount || 0}</span>
          </button>
        </div>

        <!-- Comments Drawer -->
        <div class="comments-drawer" id="comments-drawer-${post._id}">
          <div class="comment-input-row">
            <img class="avatar avatar-sm" src="${Auth.user ? Auth.user.avatar || '/images/default-avatar.svg' : '/images/default-avatar.svg'}" alt="Your avatar" />
            <div class="comment-input-wrap">
              <input type="text" class="comment-input-field" id="comment-input-${post._id}" placeholder="Write a thoughtful comment..." maxlength="500" onkeydown="handleCommentKeyDown(event, '${post._id}')" />
              <button class="btn-send-comment" onclick="submitComment('${post._id}')" aria-label="Post comment">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          <div class="comments-list" id="comments-list-${post._id}">
            <!-- Loaded on drawer open -->
          </div>
        </div>

      </div>
    </div>
  `;

  return card;
}

// -----------------------------------------------------------------------------
// Composer Logic
// -----------------------------------------------------------------------------

function initComposer() {
  const contentInput = document.getElementById('composer-content');
  const charCounter = document.getElementById('composer-char-count');
  const publishBtn = document.getElementById('btn-publish-post');
  const imageInput = document.getElementById('composer-image-input');
  const imageBtn = document.getElementById('btn-add-image');
  const previewBox = document.getElementById('composer-preview-box');
  const previewImg = document.getElementById('composer-preview-img');
  const removePreviewBtn = document.getElementById('btn-remove-preview');

  let currentImageSrc = '';

  if (contentInput && charCounter && publishBtn) {
    contentInput.addEventListener('input', () => {
      const len = contentInput.value.length;
      charCounter.textContent = `${len}/1000`;
      if (len > 900) {
        charCounter.className = 'char-counter danger';
      } else if (len > 750) {
        charCounter.className = 'char-counter warning';
      } else {
        charCounter.className = 'char-counter';
      }
      publishBtn.disabled = len === 0 && !currentImageSrc;
    });
  }

  if (imageBtn && imageInput) {
    imageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageSrc = event.target.result;
        if (previewImg && previewBox) {
          previewImg.src = currentImageSrc;
          previewBox.style.display = 'block';
        }
        if (publishBtn) publishBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', () => {
      currentImageSrc = '';
      if (previewBox) previewBox.style.display = 'none';
      if (imageInput) imageInput.value = '';
      if (publishBtn && contentInput) {
        publishBtn.disabled = contentInput.value.trim().length === 0;
      }
    });
  }

  if (publishBtn && contentInput) {
    publishBtn.addEventListener('click', async () => {
      if (!Auth.user) {
        showToast('Please log in to publish a post', 'error');
        window.location.href = '/login.html';
        return;
      }

      const content = contentInput.value.trim();
      if (!content) {
        showToast('Post content cannot be empty', 'error');
        return;
      }

      publishBtn.disabled = true;
      publishBtn.textContent = 'Publishing...';

      try {
        const res = await API.post('/api/posts', {
          content,
          image: currentImageSrc,
        });

        if (res.success && res.post) {
          showToast('Post published successfully!', 'success');
          contentInput.value = '';
          charCounter.textContent = '0/1000';
          currentImageSrc = '';
          if (previewBox) previewBox.style.display = 'none';
          if (imageInput) imageInput.value = '';

          // Prepend post to feed
          const container = document.getElementById('posts-feed-container');
          if (container) {
            const firstPost = container.querySelector('.post-card');
            const newCard = createPostCardElement(res.post);
            if (firstPost) {
              container.insertBefore(newCard, firstPost);
            } else {
              container.innerHTML = '';
              container.appendChild(newCard);
            }
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to publish post', 'error');
      } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish';
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Like & Interactions
// -----------------------------------------------------------------------------

async function handleLike(postId) {
  if (!Auth.user) {
    showToast('Please log in to like posts', 'error');
    window.location.href = '/login.html';
    return;
  }

  const btn = document.getElementById(`like-btn-${postId}`);
  const countEl = document.getElementById(`like-count-${postId}`);
  if (!btn || !countEl) return;

  const wasLiked = btn.classList.contains('liked');
  const currentCount = parseInt(countEl.textContent, 10) || 0;

  // Optimistic UI update
  btn.classList.toggle('liked', !wasLiked);
  countEl.textContent = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

  try {
    const res = await API.post(`/api/posts/${postId}/like`);
    if (res.success) {
      btn.classList.toggle('liked', res.isLiked);
      countEl.textContent = res.likesCount;
    }
  } catch (err) {
    // Revert optimistic update
    btn.classList.toggle('liked', wasLiked);
    countEl.textContent = currentCount;
    showToast(err.message || 'Unable to update like', 'error');
  }
}

// -----------------------------------------------------------------------------
// Comments Logic
// -----------------------------------------------------------------------------

async function toggleCommentsDrawer(postId) {
  const drawer = document.getElementById(`comments-drawer-${postId}`);
  if (!drawer) return;

  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
  } else {
    drawer.classList.add('open');
    loadCommentsForPost(postId);
  }
}

async function loadCommentsForPost(postId) {
  const listEl = document.getElementById(`comments-list-${postId}`);
  if (!listEl) return;

  listEl.innerHTML = `<div class="skeleton" style="height: 40px; border-radius: 8px;"></div>`;

  try {
    const res = await API.get(`/api/posts/${postId}/comments`);
    if (res.success) {
      listEl.innerHTML = '';
      if (res.comments.length === 0) {
        listEl.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-dim); text-align: center; padding: 6px 0;">No comments yet. Start the conversation!</p>`;
        return;
      }

      res.comments.forEach((c) => {
        listEl.appendChild(createCommentElement(c, postId));
      });
    }
  } catch (err) {
    listEl.innerHTML = `<p style="font-size: 0.82rem; color: var(--danger); text-align: center;">Failed to load comments</p>`;
  }
}

function createCommentElement(comment, postId) {
  const author = comment.author || { name: 'User', username: 'user', avatar: '/images/default-avatar.svg' };
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.id = `comment-${comment._id}`;

  const deleteBtnHTML = comment.isOwner
    ? `<button class="btn-delete-comment" onclick="deleteComment('${comment._id}', '${postId}')" title="Delete comment">Delete</button>`
    : '';

  div.innerHTML = `
    <a href="/profile.html?username=${author.username}">
      <img class="avatar avatar-sm" src="${author.avatar || '/images/default-avatar.svg'}" alt="${escapeHTML(author.name)}" />
    </a>
    <div class="comment-bubble">
      <div class="comment-meta">
        <div>
          <a href="/profile.html?username=${author.username}" class="comment-author-name">${escapeHTML(author.name)}</a>
          <span style="font-size: 0.76rem; color: var(--text-dim); margin-left: 4px;">@${escapeHTML(author.username)}</span>
        </div>
        <div>
          <time class="comment-time">${formatTimeAgo(comment.createdAt)}</time>
          ${deleteBtnHTML}
        </div>
      </div>
      <div class="comment-text">${escapeHTML(comment.content)}</div>
    </div>
  `;

  return div;
}

function handleCommentKeyDown(event, postId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitComment(postId);
  }
}

async function submitComment(postId) {
  if (!Auth.user) {
    showToast('Please log in to comment', 'error');
    window.location.href = '/login.html';
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  try {
    const res = await API.post(`/api/posts/${postId}/comments`, { content });
    if (res.success && res.comment) {
      input.value = '';
      const listEl = document.getElementById(`comments-list-${postId}`);
      const countEl = document.getElementById(`comment-count-${postId}`);

      if (countEl) countEl.textContent = res.commentsCount;

      if (listEl) {
        // Remove empty state message if present
        if (listEl.querySelector('p')) listEl.innerHTML = '';
        listEl.appendChild(createCommentElement(res.comment, postId));
      }
      showToast('Comment added!', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to post comment', 'error');
  }
}

async function deleteComment(commentId, postId) {
  try {
    const res = await API.delete(`/api/comments/${commentId}`);
    if (res.success) {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) el.remove();

      const countEl = document.getElementById(`comment-count-${postId}`);
      if (countEl && res.commentsCount !== undefined) {
        countEl.textContent = res.commentsCount;
      }
      showToast('Comment deleted', 'info');
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete comment', 'error');
  }
}

// -----------------------------------------------------------------------------
// Post Editing & Deletion
// -----------------------------------------------------------------------------

function togglePostMenu(postId) {
  const menu = document.getElementById(`dropdown-${postId}`);
  if (!menu) return;

  const isShown = menu.classList.contains('show');
  document.querySelectorAll('.post-dropdown').forEach((d) => d.classList.remove('show'));
  if (!isShown) menu.classList.add('show');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.post-actions-menu')) {
    document.querySelectorAll('.post-dropdown').forEach((d) => d.classList.remove('show'));
  }
});

function openEditModal(postId, content, image) {
  editingPostId = postId;
  const textarea = document.getElementById('edit-post-content');
  const imageInput = document.getElementById('edit-post-image');

  if (textarea) textarea.value = content;
  if (imageInput) imageInput.value = image;

  openModal('modal-edit-post');
}

function confirmDeletePost(postId) {
  deletingPostId = postId;
  openModal('modal-delete-post');
}

function initModals() {
  // Edit post save button
  const saveBtn = document.getElementById('btn-save-edit-post');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!editingPostId) return;

      const textarea = document.getElementById('edit-post-content');
      const imageInput = document.getElementById('edit-post-image');
      const content = textarea ? textarea.value.trim() : '';
      const image = imageInput ? imageInput.value.trim() : '';

      if (!content) {
        showToast('Post content cannot be empty', 'error');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await API.put(`/api/posts/${editingPostId}`, { content, image });
        if (res.success && res.post) {
          const bodyEl = document.getElementById(`post-body-${editingPostId}`);
          if (bodyEl) bodyEl.textContent = res.post.content;

          showToast('Post updated successfully', 'success');
          closeModal('modal-edit-post');
        }
      } catch (err) {
        showToast(err.message || 'Failed to update post', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }

  // Confirm delete post button
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete-post');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!deletingPostId) return;

      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      try {
        const res = await API.delete(`/api/posts/${deletingPostId}`);
        if (res.success) {
          const card = document.getElementById(`post-${deletingPostId}`);
          if (card) card.remove();
          showToast('Post removed', 'info');
          closeModal('modal-delete-post');
        }
      } catch (err) {
        showToast(err.message || 'Failed to delete post', 'error');
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Suggestions & Right Sidebar
// -----------------------------------------------------------------------------

async function loadSuggestions() {
  const container = document.getElementById('suggestions-list');
  if (!container) return;

  try {
    const res = await API.get('/api/users?limit=4');
    if (res.success && res.users) {
      container.innerHTML = '';
      if (res.users.length === 0) {
        container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-dim);">No suggestions right now.</p>`;
        return;
      }

      res.users.forEach((user) => {
        if (user.isSelf) return;

        const div = document.createElement('div');
        div.className = 'user-suggestion-item';
        div.id = `suggest-user-${user._id}`;

        div.innerHTML = `
          <a href="/profile.html?username=${user.username}" class="user-suggestion-link">
            <img class="avatar avatar-sm" src="${user.avatar || '/images/default-avatar.svg'}" alt="${escapeHTML(user.name)}" />
            <div class="user-names">
              <div class="user-fullname">${escapeHTML(user.name)}</div>
              <div class="user-handle">@${escapeHTML(user.username)}</div>
            </div>
          </a>
          <button class="btn-follow ${user.isFollowing ? 'following' : ''}" onclick="toggleFollowUser('${user._id}', this)">
            ${user.isFollowing ? 'Following' : 'Follow'}
          </button>
        `;

        container.appendChild(div);
      });
    }
  } catch (err) {
    console.warn('Suggestions load error:', err);
  }
}

async function toggleFollowUser(targetUserId, btn) {
  if (!Auth.user) {
    showToast('Please log in to follow users', 'error');
    window.location.href = '/login.html';
    return;
  }

  const isCurrentlyFollowing = btn.classList.contains('following');
  btn.disabled = true;

  try {
    if (isCurrentlyFollowing) {
      const res = await API.delete(`/api/users/${targetUserId}/follow`);
      if (res.success) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
        showToast('Unfollowed user', 'info');
      }
    } else {
      const res = await API.post(`/api/users/${targetUserId}/follow`);
      if (res.success) {
        btn.classList.add('following');
        btn.textContent = 'Following';
        showToast(res.message || 'Now following', 'success');
      }
    }
  } catch (err) {
    showToast(err.message || 'Follow action failed', 'error');
  } finally {
    btn.disabled = false;
  }
}

// Wire up "Load More"
document.addEventListener('DOMContentLoaded', () => {
  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (hasMorePosts) {
        loadPosts(currentPage + 1, true);
      }
    });
  }
});
