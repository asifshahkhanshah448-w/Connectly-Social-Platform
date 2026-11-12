const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const authMiddleware = require('../middleware/auth');

// Optional auth helper to know viewer
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'connectly_super_secret_jwt_key_2026');
    } catch {
      // Ignored
    }
  }
  next();
};

// GET /api/posts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort, authorId, followingOnly } = req.query;
    const filter = {};

    if (authorId) {
      filter.author = authorId;
    }

    if (followingOnly === 'true' && req.user) {
      const follows = await Follow.find({ follower: req.user.id });
      const followedIds = follows.map((f) => f.following);
      followedIds.push(req.user.id);
      filter.author = { $in: followedIds };
    }

    let query = Post.find(filter).populate('author', '-password');

    if (sort === 'trending') {
      // Sort by likes array length descending
      query = query.sort({ 'likes.length': -1, createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const posts = await query.lean();

    // Populate commentsCount and isLiked
    const enriched = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        const likes = p.likes || [];
        const isLiked = req.user ? likes.some((id) => id.toString() === req.user.id) : false;

        return {
          ...p,
          likesCount: likes.length,
          commentsCount,
          isLiked,
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      posts: enriched,
    });
  } catch (error) {
    console.error('Express get posts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/posts
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty',
      });
    }

    const post = await Post.create({
      author: req.user.id,
      content: content.trim(),
      image: image ? image.trim() : '',
      likes: [],
    });

    const populated = await Post.findById(post._id).populate('author', '-password').lean();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        ...populated,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
      },
    });
  } catch (error) {
    console.error('Express create post error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '-password').lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const commentsCount = await Comment.countDocuments({ post: post._id });
    const isLiked = req.user ? post.likes.some((id) => id.toString() === req.user.id) : false;

    res.json({
      success: true,
      post: {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Express get single post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post',
      });
    }

    const { content, image } = req.body;
    if (content) post.content = content.trim();
    if (image !== undefined) post.image = image.trim();
    post.updatedAt = Date.now();

    await post.save();

    const populated = await Post.findById(post._id).populate('author', '-password').lean();

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: populated,
    });
  } catch (error) {
    console.error('Express update post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Express delete post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!post.likes.includes(req.user.id)) {
      post.likes.push(req.user.id);
      await post.save();
    }

    res.json({
      success: true,
      message: 'Post liked',
      likesCount: post.likes.length,
      isLiked: true,
    });
  } catch (error) {
    console.error('Express like post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/posts/:id/like
router.delete('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked',
      likesCount: post.likes.length,
      isLiked: false,
    });
  } catch (error) {
    console.error('Express unlike post error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', '-password')
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error('Express get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user.id,
      content: content.trim(),
    });

    const populated = await Comment.findById(comment._id).populate('author', '-password').lean();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populated,
    });
  } catch (error) {
    console.error('Express add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
