import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Ephemeral per-process CSPRNG fallback for local development when JWT_SECRET is not set
const RUNTIME_DEV_SECRET = crypto.randomBytes(32).toString('hex');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isVercelProd = Boolean(process.env.VERCEL);
  if (isVercelProd && (!secret || secret.length < 16)) {
    throw new Error('CRITICAL: A strong JWT_SECRET (min 16 characters) is required in production.');
  }
  return secret || RUNTIME_DEV_SECRET;
}

const ALLOWED_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
const MAX_DATA_IMAGE_LENGTH = 3 * 1024 * 1024; // 3 MB base64 cap

export function isValidMediaUrl(url) {
  if (url === undefined || url === null || url === '') return true;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith('data:')) {
    return trimmed.length <= MAX_DATA_IMAGE_LENGTH && ALLOWED_DATA_IMAGE_REGEX.test(trimmed);
  }

  if (trimmed.length > 2048) return false;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function authenticateToken(req, res, next) {
  try {
    const JWT_SECRET = getJwtSecret();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token missing.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded.id !== 'string' || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload. Authorization denied.',
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: user not found.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authorization denied.',
    });
  }
}

// Optional auth: attaches req.user if a valid token is provided, but does not block if not
export async function optionalToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
        if (decoded && typeof decoded.id === 'string' && mongoose.Types.ObjectId.isValid(decoded.id)) {
          const user = await User.findById(decoded.id).select('-passwordHash');
          if (user) {
            req.user = user;
          }
        }
      }
    }
  } catch {
    // Ignore error for optional authentication
  }
  next();
}

export function generateToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn }
  );
}
