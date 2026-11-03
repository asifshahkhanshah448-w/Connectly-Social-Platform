import express from 'express';
import {
  getUsers,
  getUserByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/userController.js';
import { authenticateToken, optionalToken } from '../middleware/auth.js';

const router = express.Router();

// Profile update (put before :username route)
router.put('/profile', authenticateToken, updateProfile);

// Discovery & search
router.get('/', optionalToken, getUsers);

// Followers & Following lists
router.get('/:id/followers', optionalToken, getFollowers);
router.get('/:id/following', optionalToken, getFollowing);

// Follow / Unfollow actions
router.post('/:id/follow', authenticateToken, followUser);
router.delete('/:id/follow', authenticateToken, unfollowUser);

// Single user profile by username
router.get('/:username', optionalToken, getUserByUsername);

export default router;
