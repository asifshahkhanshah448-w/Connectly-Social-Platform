import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

export async function getCommentsForPost(req, res, next) {
  try {
    const { id: postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar');

    const currentUserId = req.user ? req.user._id.toString() : null;

    const enrichedComments = comments.map((comment) => {
      const json = comment.toJSON();
      return {
        ...json,
        isOwner: currentUserId ? comment.author._id.toString() === currentUserId : false,
      };
    });

    return res.status(200).json({
      success: true,
      comments: enrichedComments,
      count: enrichedComments.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req, res, next) {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content: content.trim(),
    });

    await comment.save();
    await comment.populate('author', 'name username avatar');

    const totalComments = await Comment.countDocuments({ post: postId });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: {
        ...comment.toJSON(),
        isOwner: true,
      },
      commentsCount: totalComments,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID.' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    // Enforce ownership: only comment author can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own comments.',
      });
    }

    const postId = comment.post;
    await Comment.findByIdAndDelete(id);

    const totalComments = await Comment.countDocuments({ post: postId });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
      commentsCount: totalComments,
    });
  } catch (err) {
    next(err);
  }
}
