const baseUrl = 'http://127.0.0.1:3000';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(baseUrl + url, { ...options, headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, ok: res.ok, json, text };
}

async function runTests() {
  console.log('=== RUNNING CONNECT FULL-STACK TEST SUITE ===\n');

  // 1. Health Check
  const health = await req('/api/health');
  console.log('[TEST 1] GET /api/health -> Status:', health.status, 'DB:', health.json?.database);
  if (health.status !== 200 || health.json?.database !== 'connected') {
    throw new Error('Health check failed');
  }

  // 2. Static HTML/CSS/JS Assets
  const staticFiles = [
    '/',
    '/login.html',
    '/register.html',
    '/profile.html',
    '/explore.html',
    '/css/style.css',
    '/js/api.js',
    '/js/auth.js',
    '/js/feed.js',
    '/js/profile.js',
    '/js/explore.js',
    '/images/logo.svg',
    '/images/default-avatar.svg',
  ];
  for (const page of staticFiles) {
    const res = await fetch(baseUrl + page);
    console.log(`[TEST 2] Static ${page} -> Status:`, res.status);
    if (res.status !== 200) throw new Error('Static file missing: ' + page);
  }

  // 3. Login Demo User
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'alexrivera', password: 'Password123!' }),
  });
  console.log('[TEST 3] POST /api/auth/login -> Status:', loginRes.status, 'User:', loginRes.json?.user?.username, 'Token received:', !!loginRes.json?.token);
  if (!loginRes.json?.token || loginRes.json?.user?.passwordHash) {
    throw new Error('Login failed or leaked passwordHash');
  }
  const alexToken = loginRes.json.token;
  const alexId = loginRes.json.user._id;

  // 4. GET /api/auth/me
  const meRes = await req('/api/auth/me', { headers: { Authorization: 'Bearer ' + alexToken } });
  console.log('[TEST 4] GET /api/auth/me -> Status:', meRes.status, 'Name:', meRes.json?.user?.name);
  if (meRes.status !== 200) throw new Error('Auth me failed');

  // 5. User Registration & Duplicate Prevention
  const uniqueId = Date.now();
  const uniqueUsername = 'intern_' + uniqueId;
  const regRes = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Intern',
      username: uniqueUsername,
      email: uniqueUsername + '@codealpha.test',
      password: 'Password123!',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    }),
  });
  console.log('[TEST 5] POST /api/auth/register -> Status:', regRes.status, 'Created:', regRes.json?.user?.username);
  if (regRes.status !== 201 || !regRes.json?.token) throw new Error('Registration failed');
  const testerToken = regRes.json.token;
  const testerId = regRes.json.user._id;

  // Duplicate email check
  const dupEmail = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Intern',
      username: 'other_' + uniqueId,
      email: uniqueUsername + '@codealpha.test',
      password: 'Password123!',
    }),
  });
  console.log('[TEST 5.1] Duplicate Email Prevention -> Status:', dupEmail.status, dupEmail.json?.message);
  if (dupEmail.status !== 409) throw new Error('Duplicate email was not rejected with 409');

  // Duplicate username check
  const dupUser = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Username',
      username: uniqueUsername,
      email: 'unique_' + uniqueId + '@codealpha.test',
      password: 'Password123!',
    }),
  });
  console.log('[TEST 5.2] Duplicate Username Prevention -> Status:', dupUser.status, dupUser.json?.message);
  if (dupUser.status !== 409) throw new Error('Duplicate username was not rejected with 409');

  // 6. Profile & Stats
  const profileRes = await req('/api/users/alexrivera', { headers: { Authorization: 'Bearer ' + alexToken } });
  console.log('[TEST 6] GET /api/users/alexrivera -> Status:', profileRes.status, 'Posts:', profileRes.json?.user?.postsCount, 'Followers:', profileRes.json?.user?.followersCount);
  if (profileRes.status !== 200) throw new Error('Get profile failed');

  // Update profile
  const updateProfile = await req('/api/users/profile', {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + testerToken },
    body: JSON.stringify({ name: 'Intern Engineer', bio: 'Full-stack engineering enthusiast.' }),
  });
  console.log('[TEST 6.1] PUT /api/users/profile -> Status:', updateProfile.status, 'Updated Bio:', updateProfile.json?.user?.bio);
  if (updateProfile.status !== 200 || updateProfile.json?.user?.bio !== 'Full-stack engineering enthusiast.') {
    throw new Error('Profile update failed');
  }

  // 7. Posts CRUD & Authorization
  const postsFeed = await req('/api/posts', { headers: { Authorization: 'Bearer ' + alexToken } });
  console.log('[TEST 7] GET /api/posts -> Status:', postsFeed.status, 'Total Posts:', postsFeed.json?.pagination?.totalPosts);
  if (postsFeed.status !== 200 || postsFeed.json?.posts?.length === 0) throw new Error('Feed retrieval failed');
  const existingPost = postsFeed.json.posts[0];

  // Create post
  const newPostRes = await req('/api/posts', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + testerToken },
    body: JSON.stringify({
      content: 'Hello CONNECT! Testing production post creation with MongoDB.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    }),
  });
  console.log('[TEST 7.1] POST /api/posts (create) -> Status:', newPostRes.status, 'ID:', newPostRes.json?.post?._id);
  if (newPostRes.status !== 201) throw new Error('Post creation failed');
  const createdPostId = newPostRes.json.post._id;

  // Edit own post
  const editPostRes = await req('/api/posts/' + createdPostId, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + testerToken },
    body: JSON.stringify({ content: 'Updated content: Verified post editing pipeline.' }),
  });
  console.log('[TEST 7.2] PUT /api/posts/:id (edit own) -> Status:', editPostRes.status, 'New Content:', editPostRes.json?.post?.content);
  if (editPostRes.status !== 200) throw new Error('Edit post failed');

  // Unauthorized edit (Alex tries to edit Tester's post)
  const unauthEdit = await req('/api/posts/' + createdPostId, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + alexToken },
    body: JSON.stringify({ content: 'Malicious modification' }),
  });
  console.log('[TEST 7.3] Unauthorized Edit Guard -> Status:', unauthEdit.status, unauthEdit.json?.message);
  if (unauthEdit.status !== 403) throw new Error('Unauthorized edit was not blocked with 403 Forbidden');

  // 8. Like / Unlike
  const likeRes1 = await req('/api/posts/' + existingPost._id + '/like', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 8] POST /api/posts/:id/like -> Status:', likeRes1.status, 'isLiked:', likeRes1.json?.isLiked, 'likesCount:', likeRes1.json?.likesCount);
  if (likeRes1.status !== 200 || !likeRes1.json?.isLiked) throw new Error('Like post failed');

  const likeRes2 = await req('/api/posts/' + existingPost._id + '/like', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 8.1] POST /api/posts/:id/like (toggle unlike) -> Status:', likeRes2.status, 'isLiked:', likeRes2.json?.isLiked, 'likesCount:', likeRes2.json?.likesCount);
  if (likeRes2.status !== 200 || likeRes2.json?.isLiked !== false) throw new Error('Unlike post failed');

  // 9. Comments System
  const addCommentRes = await req('/api/posts/' + createdPostId + '/comments', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + alexToken },
    body: JSON.stringify({ content: 'Welcome to the platform, looking forward to your posts!' }),
  });
  console.log('[TEST 9] POST /api/posts/:id/comments -> Status:', addCommentRes.status, 'Comment ID:', addCommentRes.json?.comment?._id);
  if (addCommentRes.status !== 201) throw new Error('Add comment failed');
  const commentId = addCommentRes.json.comment._id;

  const getComments = await req('/api/posts/' + createdPostId + '/comments');
  console.log('[TEST 9.1] GET /api/posts/:id/comments -> Status:', getComments.status, 'Count:', getComments.json?.count);
  if (getComments.status !== 200 || getComments.json?.count === 0) throw new Error('Get comments failed');

  // Delete own comment
  const delComment = await req('/api/comments/' + commentId, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + alexToken },
  });
  console.log('[TEST 9.2] DELETE /api/comments/:id -> Status:', delComment.status, delComment.json?.message);
  if (delComment.status !== 200) throw new Error('Delete comment failed');

  // 10. Follow System
  const followRes = await req('/api/users/' + alexId + '/follow', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 10] POST /api/users/:id/follow -> Status:', followRes.status, 'isFollowing:', followRes.json?.isFollowing);
  if (followRes.status !== 201 || !followRes.json?.isFollowing) throw new Error('Follow user failed');

  // Prevent self-follow
  const selfFollow = await req('/api/users/' + testerId + '/follow', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 10.1] Prevent self-follow -> Status:', selfFollow.status, selfFollow.json?.message);
  if (selfFollow.status !== 400) throw new Error('Self-follow was not rejected with 400');

  // Followers and Following list
  const followersList = await req('/api/users/' + alexId + '/followers');
  console.log('[TEST 10.2] GET /api/users/:id/followers -> Status:', followersList.status, 'Followers:', followersList.json?.count);
  if (followersList.status !== 200) throw new Error('Followers list failed');

  // Unfollow
  const unfollowRes = await req('/api/users/' + alexId + '/follow', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 10.3] DELETE /api/users/:id/follow -> Status:', unfollowRes.status, 'isFollowing:', unfollowRes.json?.isFollowing);
  if (unfollowRes.status !== 200 || unfollowRes.json?.isFollowing !== false) throw new Error('Unfollow failed');

  // 11. Search / Discovery
  const searchRes = await req('/api/users?search=alex');
  console.log('[TEST 11] GET /api/users?search=alex -> Status:', searchRes.status, 'Found Users:', searchRes.json?.users?.map((u) => u.username));
  if (searchRes.status !== 200 || !searchRes.json?.users?.some((u) => u.username === 'alexrivera')) {
    throw new Error('Search failed');
  }

  // 12. Delete Post
  const delPostRes = await req('/api/posts/' + createdPostId, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + testerToken },
  });
  console.log('[TEST 12] DELETE /api/posts/:id -> Status:', delPostRes.status, delPostRes.json?.message);
  if (delPostRes.status !== 200) throw new Error('Delete post failed');

  console.log('\n======================================================');
  console.log('🎉 ALL 12 TEST SUITES PASSED COMPLETELY AND VERIFIED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
