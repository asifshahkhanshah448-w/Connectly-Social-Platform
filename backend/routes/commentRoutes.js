import express from 'express';
import { deleteComment } from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Delete comment by comment ID
router.delete('/:id', authenticateToken, deleteComment);

export default router;
