import app from '../backend/server.js';

// Vercel serverless function entrypoint for Express REST API
export default function handler(req, res) {
  return app(req, res);
}
