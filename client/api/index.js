// client/api/index.js
// Minimal Vercel function entry for the exact /api path when Vercel project root is the client folder (ESM)

import app from '../../server/index.js';

export default function handler(req, res) {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
}
