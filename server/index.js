import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, DataTypes } from 'sequelize';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabaseAdmin } from './supabaseClient.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5201;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4201';

const useS3 = Boolean(process.env.S3_BUCKET);

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('Production requires DATABASE_URL (if you use server DB features).');
}

if (process.env.NODE_ENV === 'production' && !useS3) {
  console.error('Production requires S3 storage configuration via S3_BUCKET if you want S3 uploads.');
}

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!useS3) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
}

// Database setup (vehicles/inquiries use Sequelize)
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });
} else {
  // Keep SQLite for local dev for vehicles if no DATABASE_URL; but auth is Supabase now.
  const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
}

// Vehicle & Inquiry models remain as before (no change)
const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.STRING, primaryKey: true },
  make: DataTypes.STRING,
  model: DataTypes.STRING,
  year: DataTypes.INTEGER,
  price: DataTypes.FLOAT,
  askPrice: DataTypes.BOOLEAN,
  mileage: DataTypes.STRING,
  transmission: DataTypes.STRING,
  condition: DataTypes.STRING,
  fuelType: DataTypes.STRING,
  bodyType: DataTypes.STRING,
  engine: DataTypes.STRING,
  seats: DataTypes.INTEGER,
  doors: DataTypes.INTEGER,
  interior: DataTypes.STRING,
  exterior: DataTypes.STRING,
  location: DataTypes.STRING,
  description: DataTypes.TEXT,
  features: { type: DataTypes.TEXT }, // JSON string
  featured: DataTypes.BOOLEAN,
  sold: DataTypes.BOOLEAN,
  images: { type: DataTypes.TEXT } // JSON string array
}, { timestamps: true });

const Inquiry = sequelize.define('Inquiry', {
  id: { type: DataTypes.STRING, primaryKey: true },
  vehicleId: DataTypes.STRING,
  vehicleTitle: DataTypes.STRING,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  message: DataTypes.TEXT,
  status: DataTypes.STRING
}, { timestamps: true });

// S3 client setup (optional)
let s3Client = null;
if (useS3) {
  s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    endpoint: process.env.S3_ENDPOINT || undefined
  });
}

const multerStorage = useS3 ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    const accepted = ['.jpg', '.jpeg', '.png', '.webp'];
    cb(null, accepted.includes(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper to build public URL for uploaded file
function makeFileUrl(req, filename) {
  if (useS3) {
    const bucket = process.env.S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) return `${endpoint.replace(/\/$/, '')}/${filename}`;
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
  }
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

function parseVehicleInstance(v) {
  const obj = v.toJSON();
  try { obj.images = obj.images ? JSON.parse(obj.images) : []; } catch { obj.images = []; }
  try { obj.features = obj.features ? JSON.parse(obj.features) : []; } catch { obj.features = []; }
  return obj;
}

/**
 * Auth middleware (Supabase):
 * - Accepts Authorization: Bearer <access_token> OR cookie named 'sb-access-token'
 * - Verifies the token via supabaseAdmin.auth.getUser(token)
 */
const authMiddleware = async (req, res, next) => {
  const bearer = req.headers.authorization?.split(' ')[1];
  const token = bearer || req.cookies['sb_access_token'] || req.cookies['sb-access-token'] || req.cookies['tnl_token'];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = data.user; // Supabase user object
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = async (req, res, next) => {
  await authMiddleware(req, res, async () => {
    try {
      const { data, error } = await supabaseAdmin.from('admins').select('id').eq('id', req.user.id).limit(1).maybeSingle();
      if (error) {
        console.error('adminMiddleware supabase error', error);
        return res.status(500).json({ message: 'Unable to verify admin' });
      }
      if (!data) return res.status(403).json({ message: 'Admin access required' });
      next();
    } catch (err) {
      console.error('adminMiddleware error', err);
      return res.status(500).json({ message: 'Unable to verify admin' });
    }
  });
};

// Auth endpoints
// NOTE: Client-side is expected to call Supabase directly for signUp/signIn, but we keep server-side endpoints
// so existing client code that calls /api/auth/* still works. These endpoints use the service role key.
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ message: 'Name, email and password are required.' });

    // Create user via Supabase Admin API
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (createErr || !userData) {
      console.error('Supabase create user error', createErr);
      return res.status(500).json({ message: createErr?.message || 'Unable to create account.' });
    }

    // Create a profile row
    await supabaseAdmin.from('profiles').insert({ id: userData.id, email: userData.email, full_name: name, phone: phone || '' });

    // If the email matches ADMIN_EMAIL env, add as admin (optional)
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (adminEmail && email.trim().toLowerCase() === adminEmail) {
      await supabaseAdmin.from('admins').insert({ id: userData.id, role: 'admin' });
    }

    // Return a success (client should then sign in)
    res.json({ user: { id: userData.id, email: userData.email, name }, message: 'Account created. Please sign in.' });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ message: err?.message || 'Unable to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    // Sign in using Supabase (service role key will work here)
    const { data: signData, error: signErr } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (signErr || !signData) {
      console.error('Supabase signIn error', signErr);
      return res.status(401).json({ message: signErr?.message || 'Invalid email or password.' });
    }

    const token = signData.session?.access_token;
    const user = signData.user;

    // Ensure profile exists; fetch profile data if present
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle();

    // Check admin status
    const { data: adminRow } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).maybeSingle();

    res.json({
      user: { id: user.id, name: profile?.full_name || user.user_metadata?.name || null, email: user.email, phone: profile?.phone || user.user_metadata?.phone || '', isAdmin: Boolean(adminRow) },
      token
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: err?.message || 'Unable to sign in.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    // Use the Supabase Auth API to send reset email
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${FRONTEND_URL}/reset-password`
    });
    if (error) {
      console.error('Forgot password supabase error', error);
      // Always respond success to avoid user enumeration
      return res.json({ message: 'If that email is registered, we sent password reset instructions.' });
    }
    res.json({ message: 'If that email is registered, we sent password reset instructions.' });
  } catch (err) {
    console.error('Forgot password error', err);
    res.status(500).json({ message: 'Unable to process request.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required.' });

    // The supabase-js admin client doesn't expose a direct "update password by token" helper,
+... (truncated due to length)