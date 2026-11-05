import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { seedInitialData } from './config/seed.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const app = express();

// Trust reverse proxy (Vercel, Cloud Run) for accurate client IP in rate limiting
app.set('trust proxy', 1);

const isVercelProd = Boolean(process.env.VERCEL);

// Security middleware with robust Content Security Policy
// Allow AI Studio preview origins to frame the app in preview/dev while enforcing SAMEORIGIN on Vercel production
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'wss:'],
        frameAncestors: isVercelProd
          ? ["'self'"]
          : [
              "'self'",
              'https://*.google.com',
              'https://*.googlers.com',
              'https://*.usercontent.goog',
              'https://localhost.corp.google.com:26001',
            ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isVercelProd ? [] : null,
      },
    },
    frameguard: isVercelProd ? { action: 'sameorigin' } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

function isAllowedOrigin(origin, req) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const configuredOrigins = (process.env.FRONTEND_URL || 'https://connectly-social-platform-pearl.vercel.app')
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    if (configuredOrigins.includes(origin)) {
      return true;
    }

    const requestHost = req.headers['x-forwarded-host'] || req.headers.host;
    if (requestHost && parsed.host === requestHost) {
      return true;
    }

    if (!isVercelProd) {
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.run.app') ||
        parsed.hostname.endsWith('.google.com') ||
        parsed.hostname.endsWith('.googleusercontent.com') ||
        parsed.hostname.endsWith('.usercontent.goog')
      ) {
        return true;
      }
    } else if (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'connectly-social-platform-pearl.vercel.app' ||
        (parsed.hostname.endsWith('.vercel.app') && parsed.hostname.startsWith('connectly')))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    if (isAllowedOrigin(origin, req)) {
      callback(null, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
    } else {
      callback(null, { origin: false });
    }
  })
);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Serve frontend static assets from /public
app.use(express.static(publicDir));

let initPromise = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = connectDB()
      .then(async (conn) => {
        if (!process.env.VERCEL) {
          await seedInitialData();
        }
        return conn;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

// Database auto-connection middleware (crucial for Vercel serverless functions and fast server startup)
app.use(async (req, res, next) => {
  // Skip DB connection for static files and root shell
  if (
    req.path === '/' ||
    req.path.startsWith('/css') ||
    req.path.startsWith('/images') ||
    req.path.startsWith('/js') ||
    req.path.endsWith('.html') ||
    req.path.endsWith('.svg') ||
    req.path.endsWith('.ico')
  ) {
    return next();
  }

  try {
    await ensureInitialized();
    next();
  } catch (err) {
    console.error('Database connection error in request middleware:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is properly configured.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Global API rate limiter
app.use(
  '/api',
  authRateLimiter({
    max: 300,
    windowMs: 15 * 60 * 1000,
    message: 'Too many API requests from this IP, please try again later.',
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    platform: 'CONNECT Social Media Platform',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Friendly redirect for root and HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

const PORT = parseInt(process.env.PORT_OVERRIDE || (process.env.VERCEL ? process.env.PORT || '3000' : '3000'), 10);

export async function startServer() {
  try {
    // Bind HTTP port immediately so preview proxy and health probes never get ECONNREFUSED
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(` CONNECT - Full-Stack Social Media Server `);
      console.log(` Server running on http://0.0.0.0:${PORT}`);
      console.log(`===============================================`);
    });

    // Connect and seed database asynchronously while API middleware awaits ensureInitialized()
    ensureInitialized()
      .then(() => {
        console.log('Database: Mongoose connected and ready');
      })
      .catch((err) => {
        console.error('Database initialization warning:', err);
      });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Auto-start only if executed directly as main module in Node
if (process.argv[1] && process.argv[1].endsWith('backend/server.js')) {
  startServer();
}

export default app;
