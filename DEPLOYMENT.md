Deployment steps for TNL Motors (backend + frontend)

Overview
- Frontend: Vite React app (client) — deployed to Vercel
- Backend: Express app (server) — deploy to a Node.js host (Render, Railway, Heroku, DigitalOcean App Platform, or AWS Elastic Beanstalk)

Required services
1. Production Postgres (or MySQL) database (set DATABASE_URL)
2. Optional S3-compatible storage (AWS S3, DigitalOcean Spaces, etc.) for persistent image uploads (set S3_* vars)
3. Vercel project for frontend (set `VITE_API_URL` variable)

- Environment variables (server)
- `DATABASE_URL`: Postgres connection URL (optional — if empty, a local SQLite file is used)
- JWT_SECRET: Strong JWT secret
- ADMIN_EMAIL: Admin account email
- ADMIN_PASSWORD: Admin password (will seed if missing)
- GOOGLE_CLIENT_ID: (optional) Google OAuth client id
- GOOGLE_CLIENT_SECRET: (optional) Google OAuth client secret
- GOOGLE_CALLBACK_URL: OAuth callback URL (e.g. https://your-backend.example.com/api/auth/google/callback)
- `FRONTEND_URL`: frontend URL (e.g. https://tnl-motor.vercel.app)
- S3_BUCKET: (optional) bucket name for image storage
- S3_REGION: S3 region
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- S3_ENDPOINT: (optional) custom endpoint for S3-compatible providers

Environment variables (frontend - Vercel)
- `VITE_API_URL`: https://your-backend.example.com (no trailing slash)

Vercel specifics
- Create a Vercel project for the `client` folder. In project settings:
	- Set `VITE_API_URL` to your backend URL (e.g. `https://api.yourdomain.com`).
	- Set build command: `npm run build` and output directory: `dist` (Vite default).
	- Add any additional environment variables required by your frontend (none by default).

Backend deployment notes
- Deploy the `server` to a Node-compatible host (Render, Railway, Heroku, DigitalOcean App Platform, etc.). If deploying to serverless platforms, enable S3 for file uploads (see `S3_BUCKET`).
- Ensure `FRONTEND_URL` matches the final frontend origin so CORS and OAuth redirects work.

Quick production checks
- From the repository root, run the following to validate environment and optional S3 connectivity:

```bash
# from repo root
node server/scripts/check_production.js
```

This script will exit non-zero if required environment variables are missing. If `S3_BUCKET` is set, it will attempt to `HeadBucket` to validate credentials.

Quick local setup
1. Install dependencies

```bash
# server
cd server
npm install

# client
cd ../client
npm install
```

2. Run locally

```bash
# server (dev)
cd server
npm run dev

# client (dev)
cd ../client
npm run dev
```

3. Build frontend for production (optional locally)

```bash
cd client
npm run build
```

Database/migrations
- The server uses Sequelize and will call `sequelize.sync()` on startup to create tables if they don't exist.
- For production you should configure `DATABASE_URL` to a managed Postgres instance and allow the server to run migration/sync on startup.

Image storage
- For production, configure S3-compatible storage and set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
- If S3 is set, uploads will be stored in the bucket; otherwise they will be kept on local disk (not suitable for serverless or multiple instances).

Git and secrets
- Do NOT commit `.env` files. Use the provided `.env.example` as a template.
- The repository `.gitignore` has been updated to ignore `.env` and uploads/data directories.

Deployment checklist
1. Provision a Postgres database and set `DATABASE_URL`.
2. Provision an S3 bucket (recommended) and set `S3_*` variables.
3. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `FRONTEND_URL`.
4. Deploy the backend to your host (Push repo and configure environment variables).
5. On Vercel set `VITE_API_URL` to your backend URL.
6. Deploy the frontend to Vercel.

Notes
- The server will seed an admin user if none exists using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars.
- For production, ensure `JWT_SECRET` is a strong random string.
- If deploying to a serverless environment, ensure S3 is enabled for uploads.
