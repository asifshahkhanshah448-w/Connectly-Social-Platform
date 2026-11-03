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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow CDN resources like fonts and avatars
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets from /public
app.use(express.static(publicDir));

// Database auto-connection middleware (crucial for Vercel serverless functions)
app.use(async (req, res, next) => {
  // Skip DB connection for static files
  if (
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
    await connectDB();
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

const PORT = parseInt(process.env.PORT || '3000', 10);

export async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(` CONNECT - Full-Stack Social Media Server `);
      console.log(` Server running on http://0.0.0.0:${PORT}`);
      console.log(` Database: Mongoose connected`);
      console.log(`===============================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Auto-start if executed directly in Node
if (process.argv[1] && (process.argv[1].endsWith('backend/server.js') || process.argv[1].endsWith('server.js'))) {
  startServer();
}

export default app;
