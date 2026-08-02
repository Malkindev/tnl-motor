// api/index.js
// Minimal Vercel function entry for the exact /api path (ESM)

import app from '../server/index.js';

export default function handler(req, res) {
  // Ensure Express sees '/api' prefix if your routes are defined under '/api/*'
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
}
