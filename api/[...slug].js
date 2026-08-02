// api/[...slug].js
// Catch-all Vercel function for all /api/* subpaths (ESM)

import app from '../server/index.js';

export default function handler(req, res) {
  // Vercel invokes this for /api/<something> and may strip the /api prefix from req.url.
  // Your Express app defines routes under '/api/*', so re-add the prefix before handing to Express.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
}
