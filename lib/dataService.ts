import { store, generateId, IUser, IPost, IComment, IFollow } from './db';

// Helper to sanitize user (exclude password)
export function sanitizeUser(user: IUser) {
  const safe = { ...user };
  delete safe.password;
  return safe;
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function getUserById(id: string, viewerId?: string) {
  const user = store?.users.find((u) => u._id === id);
  if (!user) return null;

  const followersCount = (store?.follows || []).filter((f) => f.following === id).length;
  const followingCount = (store?.follows || []).filter((f) => f.follower === id).length;
  const isFollowing = viewerId
    ? (store?.follows || []).some((f) => f.follower === viewerId && f.following === id)
    : false;

  return {
    ...sanitizeUser(user),
    followersCount,
    followingCount,
    isFollowing,
  };
}

export async function getUserByUsername(username: string) {
  return store?.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function getUserByEmail(email: string) {
  return store?.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(data: Omit<IUser, '_id' | 'createdAt'>) {
  const newUser: IUser = {
    _id: generateId(),
    name: data.name,
    username: data.username.toLowerCase().trim(),
    email: data.email.toLowerCase().trim(),
    password: data.password,
    profilePicture: data.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: data.bio || '',
    createdAt: new Date().toISOString(),
  };

  store?.users.push(newUser);
  return sanitizeUser(newUser);
}

export async function updateUserProfile(id: string, updates: Partial<IUser>) {
  const user = store?.users.find((u) => u._id === id);
  if (!user) return null;

  if (updates.name !== undefined) user.name = updates.name.trim();
  if (updates.bio !== undefined) user.bio = updates.bio.trim();
  if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture.trim();

  return sanitizeUser(user);
}

export async function getAllUsers(query?: string, viewerId?: string) {
  let list = store?.users || [];
  if (query) {
    const q = query.toLowerCase().trim();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }

  return list.map((u) => {
    const followersCount = (store?.follows || []).filter((f) => f.following === u._id).length;
    const followingCount = (store?.follows || []).filter((f) => f.follower === u._id).length;
    const isFollowing = viewerId
      ? (store?.follows || []).some((f) => f.follower === viewerId && f.following === u._id)
      : false;
    return {
      ...sanitizeUser(u),
      followersCount,
      followingCount,
      isFollowing,
    };
  });
}

// -------------------------------------------------------------
// FOLLOW OPERATIONS
// -------------------------------------------------------------
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error('You cannot follow yourself');
  }

  const targetUser = store?.users.find((u) => u._id === followingId);
  if (!targetUser) {
    throw new Error('Target user not found');
  }

  const existing = (store?.follows || []).find(
    (f) => f.follower === followerId && f.following === followingId
  );
  if (existing) {
    return existing; // Already following
  }

  const newFollow: IFollow = {
    _id: generateId(),
    follower: followerId,
    following: followingId,
    createdAt: new Date().toISOString(),
  };

  store?.follows.push(newFollow);
  return newFollow;
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (!store?.follows) return false;
  const initialLen = store.follows.length;
  store.follows = store.follows.filter(
    (f) => !(f.follower === followerId && f.following === followingId)
  );
  return store.follows.length < initialLen;
}

export async function getUserFollowers(userId: string, viewerId?: string) {
  const followRecords = (store?.follows || []).filter((f) => f.following === userId);
  const followerIds = followRecords.map((f) => f.follower);
  const users = (store?.users || []).filter((u) => followerIds.includes(u._id));

  return users.map((u) => {
    const isFollowing = viewerId
      ? (store?.follows || []).some((f) => f.follower === viewerId && f.following === u._id)
      : false;
    return {
      ...sanitizeUser(u),
      isFollowing,
    };
  });
}

export async function getUserFollowing(userId: string, viewerId?: string) {
  const followRecords = (store?.follows || []).filter((f) => f.follower === userId);
  const followingIds = followRecords.map((f) => f.following);
  const users = (store?.users || []).filter((u) => followingIds.includes(u._id));

  return users.map((u) => {
    const isFollowing = viewerId
      ? (store?.follows || []).some((f) => f.follower === viewerId && f.following === u._id)
      : false;
    return {
      ...sanitizeUser(u),
      isFollowing,
    };
  });
}

// -------------------------------------------------------------
// POST OPERATIONS
// -------------------------------------------------------------
export interface EnrichedPost {
  _id: string;
  author: ReturnType<typeof sanitizeUser>;
  content: string;
  image?: string;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export function enrichPost(post: IPost, viewerId?: string): EnrichedPost | null {
  const author = typeof post.author === 'string'
    ? store?.users.find((u) => u._id === post.author)
    : post.author;

  if (!author) return null;

  const commentsCount = (store?.comments || []).filter((c) => c.post === post._id).length;
  const likes = post.likes || [];
  const isLiked = viewerId ? likes.includes(viewerId) : false;

  return {
    _id: post._id,
    author: sanitizeUser(author as IUser),
    content: post.content,
    image: post.image,
    likes,
    likesCount: likes.length,
    commentsCount,
    isLiked,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function getPosts(options: {
  sort?: 'latest' | 'trending';
  authorId?: string;
  viewerId?: string;
  followingOnly?: boolean;
}) {
  let list = [...(store?.posts || [])];

  if (options.authorId) {
    list = list.filter((p) => (typeof p.author === 'string' ? p.author : p.author._id) === options.authorId);
  }

  if (options.followingOnly && options.viewerId) {
    const followedIds = (store?.follows || [])
      .filter((f) => f.follower === options.viewerId)
      .map((f) => f.following);
    // Include user's own posts plus followed authors
    list = list.filter((p) => {
      const authorId = typeof p.author === 'string' ? p.author : p.author._id;
      return followedIds.includes(authorId) || authorId === options.viewerId;
    });
  }

  if (options.sort === 'trending') {
    list.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  } else {
    // Latest chronological
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list
    .map((p) => enrichPost(p, options.viewerId))
    .filter((p): p is EnrichedPost => p !== null);
}

export async function getPostById(id: string, viewerId?: string) {
  const post = store?.posts.find((p) => p._id === id);
  if (!post) return null;
  return enrichPost(post, viewerId);
}

export async function createPost(authorId: string, content: string, image?: string) {
  const now = new Date().toISOString();
  const newPost: IPost = {
    _id: generateId(),
    author: authorId,
    content: content.trim(),
    image: image?.trim() || undefined,
    likes: [],
    createdAt: now,
    updatedAt: now,
  };

  store?.posts.unshift(newPost);
  return enrichPost(newPost, authorId);
}

export async function updatePost(postId: string, authorId: string, content: string, image?: string) {
  const post = store?.posts.find((p) => p._id === postId);
  if (!post) throw new Error('Post not found');

  const currentAuthorId = typeof post.author === 'string' ? post.author : post.author._id;
  if (currentAuthorId !== authorId) {
    throw new Error('Not authorized to edit this post');
  }

  post.content = content.trim();
  if (image !== undefined) post.image = image.trim();
  post.updatedAt = new Date().toISOString();

  return enrichPost(post, authorId);
}

export async function deletePost(postId: string, authorId: string) {
  const post = store?.posts.find((p) => p._id === postId);
  if (!post) throw new Error('Post not found');

  const currentAuthorId = typeof post.author === 'string' ? post.author : post.author._id;
  if (currentAuthorId !== authorId) {
    throw new Error('Not authorized to delete this post');
  }

  if (store?.posts) {
    store.posts = store.posts.filter((p) => p._id !== postId);
  }
  // Delete associated comments
  if (store?.comments) {
    store.comments = store.comments.filter((c) => c.post !== postId);
  }

  return true;
}

// -------------------------------------------------------------
// LIKE OPERATIONS
// -------------------------------------------------------------
export async function likePost(postId: string, userId: string) {
  const post = store?.posts.find((p) => p._id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.likes) post.likes = [];
  if (!post.likes.includes(userId)) {
    post.likes.push(userId);
  }

  return {
    postId,
    likesCount: post.likes.length,
    isLiked: true,
  };
}

export async function unlikePost(postId: string, userId: string) {
  const post = store?.posts.find((p) => p._id === postId);
  if (!post) throw new Error('Post not found');

  if (!post.likes) post.likes = [];
  post.likes = post.likes.filter((id) => id !== userId);

  return {
    postId,
    likesCount: post.likes.length,
    isLiked: false,
  };
}

// -------------------------------------------------------------
// COMMENT OPERATIONS
// -------------------------------------------------------------
export interface EnrichedComment {
  _id: string;
  post: string;
  author: ReturnType<typeof sanitizeUser>;
  content: string;
  createdAt: string;
}

export function enrichComment(comment: IComment): EnrichedComment | null {
  const author = typeof comment.author === 'string'
    ? store?.users.find((u) => u._id === comment.author)
    : comment.author;

  if (!author) return null;

  return {
    _id: comment._id,
    post: comment.post,
    author: sanitizeUser(author as IUser),
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

export async function getPostComments(postId: string) {
  const comments = (store?.comments || [])
    .filter((c) => c.post === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return comments
    .map(enrichComment)
    .filter((c): c is EnrichedComment => c !== null);
}

export async function createComment(postId: string, authorId: string, content: string) {
  const post = store?.posts.find((p) => p._id === postId);
  if (!post) throw new Error('Post not found');

  const newComment: IComment = {
    _id: generateId(),
    post: postId,
    author: authorId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  store?.comments.push(newComment);
  return enrichComment(newComment);
}

export async function deleteComment(commentId: string, authorId: string) {
  const comment = store?.comments.find((c) => c._id === commentId);
  if (!comment) throw new Error('Comment not found');

  const currentAuthorId = typeof comment.author === 'string' ? comment.author : comment.author._id;
  if (currentAuthorId !== authorId) {
    throw new Error('Not authorized to delete this comment');
  }

  if (store?.comments) {
    store.comments = store.comments.filter((c) => c._id !== commentId);
  }

  return true;
}
