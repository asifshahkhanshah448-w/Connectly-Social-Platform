import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter({ max: 20 }), register);
router.post('/login', authRateLimiter({ max: 30 }), login);
router.get('/me', authenticateToken, getMe);

export default router;
