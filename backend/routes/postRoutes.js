import express from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
} from '../controllers/postController.js';
import {
  getCommentsForPost,
  addComment,
} from '../controllers/commentController.js';
import { authenticateToken, optionalToken } from '../middleware/auth.js';

const router = express.Router();

// Posts feed & list
router.get('/', optionalToken, getPosts);

// Single post
router.get('/:id', optionalToken, getPostById);

// Create post
router.post('/', authenticateToken, createPost);

// Edit post
router.put('/:id', authenticateToken, updatePost);

// Delete post
router.delete('/:id', authenticateToken, deletePost);

// Like / unlike post
router.post('/:id/like', authenticateToken, toggleLikePost);

// Comments nested on post
router.get('/:id/comments', optionalToken, getCommentsForPost);
router.post('/:id/comments', authenticateToken, addComment);

export default router;
