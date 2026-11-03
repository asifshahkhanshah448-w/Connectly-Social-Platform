import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

export async function getPosts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username.toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      query.author = user._id;
    }

    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username avatar bio'),
    ]);

    // Attach commentsCount and isLiked
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    commentCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

    const currentUserId = req.user ? req.user._id.toString() : null;

    const enrichedPosts = posts.map((post) => {
      const json = post.toJSON();
      const likesArray = json.likes || [];
      return {
        ...json,
        likesCount: likesArray.length,
        isLiked: currentUserId ? likesArray.some((id) => id.toString() === currentUserId) : false,
        isOwner: currentUserId ? post.author._id.toString() === currentUserId : false,
        commentsCount: countMap.get(post._id.toString()) || 0,
      };
    });

    const totalPages = Math.ceil(totalPosts / limit) || 1;

    return res.status(200).json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = await Post.findById(id).populate('author', 'name username avatar bio');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const commentsCount = await Comment.countDocuments({ post: post._id });
    const currentUserId = req.user ? req.user._id.toString() : null;
    const likesArray = post.likes || [];

    return res.status(200).json({
      success: true,
      post: {
        ...post.toJSON(),
        likesCount: likesArray.length,
        isLiked: currentUserId ? likesArray.some((uId) => uId.toString() === currentUserId) : false,
        isOwner: currentUserId ? post.author._id.toString() === currentUserId : false,
        commentsCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req, res, next) {
  try {
    const { content, image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty.',
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 1000 characters.',
      });
    }

    const post = new Post({
      author: req.user._id,
      content: content.trim(),
      image: (image && image.trim()) || '',
      likes: [],
    });

    await post.save();
    await post.populate('author', 'name username avatar bio');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post: {
        ...post.toJSON(),
        likesCount: 0,
        isLiked: false,
        isOwner: true,
        commentsCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req, res, next) {
  try {
    const { id } = req.params;
    const { content, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // Enforce ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own posts.',
      });
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ success: false, message: 'Post content cannot be empty.' });
      }
      if (content.trim().length > 1000) {
        return res.status(400).json({ success: false, message: 'Post content cannot exceed 1000 characters.' });
      }
      post.content = content.trim();
    }

    if (image !== undefined) {
      post.image = image.trim();
    }

    await post.save();
    await post.populate('author', 'name username avatar bio');

    const commentsCount = await Comment.countDocuments({ post: post._id });

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post: {
        ...post.toJSON(),
        likesCount: post.likes.length,
        isLiked: post.likes.some((uId) => uId.toString() === req.user._id.toString()),
        isOwner: true,
        commentsCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // Enforce ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own posts.',
      });
    }

    await Post.findByIdAndDelete(id);
    // Delete associated comments
    await Comment.deleteMany({ post: id });

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleLikePost(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = post.likes.findIndex((likeId) => likeId.toString() === userIdStr);

    let isLiked = false;
    if (existingIndex > -1) {
      // Unlike
      post.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Like
      post.likes.push(req.user._id);
      isLiked = true;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      isLiked,
      likesCount: post.likes.length,
      message: isLiked ? 'Post liked.' : 'Post unliked.',
    });
  } catch (err) {
    next(err);
  }
}
