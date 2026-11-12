// Connectly Feed Page Logic
document.addEventListener('DOMContentLoaded', async () => {
  let currentUser = null;
  try {
    currentUser = await auth.getCurrentUser();
  } catch (e) {
    console.warn(e);
  }

  const userActionContainer = document.getElementById('user-nav-action');
  if (userActionContainer) {
    if (currentUser) {
      userActionContainer.innerHTML = `
        <a href="/profile.html" class="btn btn-secondary btn-sm">@${currentUser.username}</a>
        <button id="logout-btn" class="btn btn-secondary btn-sm">Sign Out</button>
      `;
      document.getElementById('logout-btn')?.addEventListener('click', () => auth.logout());
    } else {
      userActionContainer.innerHTML = `
        <a href="/login.html" class="btn btn-secondary btn-sm">Sign In</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
  }

  // Load Feed Posts
  const postsFeedEl = document.getElementById('posts-feed');
  if (postsFeedEl) {
    try {
      const posts = await postsService.getPosts();
      if (posts.length === 0) {
        postsFeedEl.innerHTML = '<div class="card" style="text-align: center; color: var(--text-muted);">No posts available. Be the first to share!</div>';
        return;
      }

      postsFeedEl.innerHTML = posts.map(renderPostCard).join('');
      attachPostHandlers();
    } catch (err) {
      postsFeedEl.innerHTML = `<div class="card" style="color: #dc2626;">Failed to load posts: ${err.message}</div>`;
    }
  }

  // Create Post Form
  const postForm = document.getElementById('create-post-form');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) {
        window.location.href = '/login.html';
        return;
      }

      const content = document.getElementById('post-content').value;
      const image = document.getElementById('post-image')?.value;

      try {
        await postsService.createPost(content, image);
        window.location.reload();
      } catch (err) {
        alert(err.message || 'Error creating post');
      }
    });
  }
});

function renderPostCard(post) {
  const isLiked = post.isLiked ? 'liked' : '';
  const imageHtml = post.image ? `<img src="${post.image}" alt="Post attachment" class="post-image" />` : '';

  return `
    <article class="post-card" data-post-id="${post._id}">
      <div class="post-header">
        <div class="author-info">
          <img src="${post.author.profilePicture}" alt="${post.author.name}" class="avatar" />
          <div>
            <div class="author-name">${post.author.name}</div>
            <div class="author-meta">@${post.author.username} · ${new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
      <div class="post-body">${post.content}</div>
      ${imageHtml}
      <div class="post-actions">
        <button class="action-btn like-btn ${isLiked}" data-id="${post._id}" data-liked="${post.isLiked}">
          ♥ <span>${post.likesCount}</span>
        </button>
        <div class="action-btn">💬 <span>${post.commentsCount}</span></div>
      </div>
    </article>
  `;
}

function attachPostHandlers() {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const postId = btn.getAttribute('data-id');
      const isLiked = btn.getAttribute('data-liked') === 'true';

      try {
        if (isLiked) {
          await postsService.unlikePost(postId);
          btn.classList.remove('liked');
          btn.setAttribute('data-liked', 'false');
          const countSpan = btn.querySelector('span');
          countSpan.innerText = Math.max(0, parseInt(countSpan.innerText) - 1);
        } else {
          await postsService.likePost(postId);
          btn.classList.add('liked');
          btn.setAttribute('data-liked', 'true');
          const countSpan = btn.querySelector('span');
          countSpan.innerText = parseInt(countSpan.innerText) + 1;
        }
      } catch (err) {
        alert(err.message || 'Error updating like');
      }
    });
  });
}
