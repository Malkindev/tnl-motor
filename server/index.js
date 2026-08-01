import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize, DataTypes } from 'sequelize';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5201;
const JWT_SECRET = process.env.JWT_SECRET || 'tnl-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Malkinlawrence00@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Malkin00';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4201';

const useS3 = Boolean(process.env.S3_BUCKET);

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('Production requires DATABASE_URL. Set DATABASE_URL in environment.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !useS3) {
  console.error('Production requires S3 storage configuration via S3_BUCKET. Local uploads are not supported in production.');
  process.exit(1);
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

// Database setup: use DATABASE_URL (Postgres) or fallback to SQLite file for local development
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });
} else {
  const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
}

// Models
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  password: DataTypes.STRING,
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

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

const ResetToken = sequelize.define('ResetToken', {
  token: { type: DataTypes.STRING, primaryKey: true },
  email: DataTypes.STRING,
  expiresAt: DataTypes.DATE
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

// Multer: memory storage when using S3, disk storage otherwise
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

const createToken = (user) => jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

async function seedAdminIfNeeded() {
  const adminEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD;
  const existingUsers = await User.findAll({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), adminEmail) });
  if (existingUsers.length === 0) {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ id: uuidv4(), name: 'TNL Motors Admin', email: adminEmail, phone: '', password: hashed, isAdmin: true });
    console.log(`Seeded admin user: ${adminEmail}`);
    return;
  }
  let adminUser = existingUsers.find((user) => user.isAdmin) || existingUsers[0];
  const duplicateIds = existingUsers.filter((user) => user.id !== adminUser.id).map((user) => user.id);
  if (duplicateIds.length) {
    await User.destroy({ where: { id: duplicateIds } });
    console.log(`Removed ${duplicateIds.length} duplicate admin user record(s).`);
  }
  let changed = false;
  if (!adminUser.isAdmin) {
    adminUser.isAdmin = true;
    changed = true;
    console.log(`Updated existing admin user to isAdmin=true for ${adminEmail}`);
  }
  const passwordMatch = await bcrypt.compare(password, adminUser.password || '');
  if (!passwordMatch) {
    adminUser.password = await bcrypt.hash(password, 10);
    changed = true;
    console.log(`Updated admin password for ${adminEmail}`);
  }
  if (adminUser.email !== adminEmail) {
    adminUser.email = adminEmail;
    changed = true;
    console.log(`Normalized admin email to ${adminEmail}`);
  }
  if (changed) await adminUser.save();
}

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    next();
  });
};

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    // Always respond success to avoid user enumeration
    if (!user) return res.json({ message: 'If that email is registered, we sent password reset instructions.' });
    const token = uuidv4();
    await ResetToken.create({ token, email, expiresAt: new Date(Date.now() + 1000 * 60 * 60) });
    console.log(`Password reset token for ${email}: ${token}`);
    res.json({ message: 'If that email is registered, we sent password reset instructions.' });
  } catch (err) {
    console.error('Forgot password error', err);
    res.status(500).json({ message: 'Unable to process request.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const reset = await ResetToken.findByPk(token);
    if (!reset || new Date(reset.expiresAt) < new Date()) return res.status(400).json({ message: 'Reset token is invalid or expired.' });
    const user = await User.findOne({ where: { email: reset.email } });
    if (!user) return res.status(400).json({ message: 'User not found.' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await ResetToken.destroy({ where: { token } });
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error', err);
    res.status(500).json({ message: 'Unable to reset password.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    const existing = await User.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), normalizedEmail) });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ id: uuidv4(), name, email: normalizedEmail, phone: phone || '', password: hashed, isAdmin: false });
    const token = createToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin }, token });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ message: err?.message || 'Unable to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const users = await User.findAll({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), normalizedEmail) });
    let user = null;
    for (const candidate of users) {
      if (candidate.password && await bcrypt.compare(password, candidate.password)) {
        if (!user || candidate.isAdmin) {
          user = candidate;
        }
        if (candidate.isAdmin) break;
      }
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = createToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin }, token });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: err?.message || 'Unable to sign in.' });
  }
});

app.post('/api/auth/signout', (req, res) => {
  res.json({ message: 'Signed out successfully.' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Signed out successfully.' });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin });
});

app.patch('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const { name, phone } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin });
  } catch (err) {
    console.error('Update profile error', err);
    res.status(500).json({ message: 'Unable to update profile.' });
  }
});

app.get('/api/user/inquiries', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const inquiries = await Inquiry.findAll({ where: { email: user.email }, order: [['createdAt', 'DESC']] });
    res.json(inquiries);
  } catch (err) {
    console.error('GET /api/user/inquiries error', err);
    res.status(500).json({ message: 'Unable to fetch inquiries.' });
  }
});

app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    return res.status(400).json({ message: 'Google OAuth is not configured.' });
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: 'code',
    access_type: 'offline',
    scope: 'openid email profile',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: 'Missing Google authorization code.' });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error('Google token exchange failed.');

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileResponse.json();
    if (!profile.email) throw new Error('Unable to retrieve Google user email.');

    let user = await User.findOne({ where: { email: profile.email } });
    if (!user) {
      user = await User.create({
        id: uuidv4(),
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        phone: '',
        password: '',
        isAdmin: false
      });
    }

    const token = createToken(user);
    const redirectUrl = new URL(`${FRONTEND_URL}/login`);
    redirectUrl.searchParams.set('google_token', token);
    redirectUrl.searchParams.set('google_user', encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin
    })));
    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Google auth callback error', err);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
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

app.get('/api/vehicles', async (req, res) => {
  try {
    const rows = await Vehicle.findAll({ order: [['createdAt', 'DESC']] });
    const origin = `${req.protocol}://${req.get('host')}`;
    const normalized = rows.map((v) => {
      const obj = parseVehicleInstance(v);
      obj.images = (obj.images || []).map((img) => (typeof img === 'string' && img.startsWith('/') && !img.startsWith('//') && !img.startsWith('http') ? `${origin}${img}` : img));
      return obj;
    });
    res.json(normalized);
  } catch (err) {
    console.error('GET /api/vehicles error', err);
    res.status(500).json({ message: 'Unable to fetch vehicles.' });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const v = await Vehicle.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Vehicle not found' });
    const obj = parseVehicleInstance(v);
    const origin = `${req.protocol}://${req.get('host')}`;
    obj.images = (obj.images || []).map((img) => (typeof img === 'string' && img.startsWith('/') && !img.startsWith('//') && !img.startsWith('http') ? `${origin}${img}` : img));
    res.json(obj);
  } catch (err) {
    console.error('GET /api/vehicles/:id error', err);
    res.status(500).json({ message: 'Unable to fetch vehicle.' });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const { vehicleId, name, email, phone, message } = req.body;
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const inquiry = await Inquiry.create({ id: uuidv4(), vehicleId, vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, name, email, phone, message, status: 'New' });
    res.json(inquiry);
  } catch (err) {
    console.error('POST /api/inquiries error', err);
    res.status(500).json({ message: 'Unable to create inquiry.' });
  }
});

app.get('/api/admin/inquiries', adminMiddleware, async (req, res) => {
  try {
    const items = await Inquiry.findAll({ order: [['createdAt', 'DESC']] });
    res.json(items);
  } catch (err) {
    console.error('GET /api/admin/inquiries error', err);
    res.status(500).json({ message: 'Unable to fetch inquiries.' });
  }
});

app.patch('/api/admin/inquiries/:id', adminMiddleware, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    inquiry.status = req.body.status || inquiry.status;
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    console.error('PATCH /api/admin/inquiries/:id error', err);
    res.status(500).json({ message: 'Unable to update inquiry.' });
  }
});

app.get('/api/admin/vehicles', adminMiddleware, async (req, res) => {
  try {
    const rows = await Vehicle.findAll({ order: [['createdAt', 'DESC']] });
    res.json(rows.map(parseVehicleInstance));
  } catch (err) {
    console.error('GET /api/admin/vehicles error', err);
    res.status(500).json({ message: 'Unable to fetch vehicles.' });
  }
});

app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin })));
  } catch (err) {
    console.error('GET /api/admin/users error', err);
    res.status(500).json({ message: 'Unable to fetch users.' });
  }
});

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalVehicles = await Vehicle.count();
    const activeListings = await Vehicle.count({ where: { sold: false } });
    const soldVehicles = await Vehicle.count({ where: { sold: true } });
    const totalInquiries = await Inquiry.count();
    const totalUsers = await User.count();
    const vehicles = await Vehicle.findAll();
    const conditionBreakdown = vehicles.reduce((acc, v) => {
      const condition = v.condition || 'Used';
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});
    res.json({ totalVehicles, activeListings, soldVehicles, totalInquiries, totalUsers, conditionBreakdown });
  } catch (err) {
    console.error('GET /api/admin/stats error', err);
    res.status(500).json({ message: 'Unable to fetch stats.' });
  }
});

app.post('/api/admin/vehicles', adminMiddleware, upload.array('images', 8), async (req, res) => {
  try {
    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    const uploadedImages = [];
    for (const file of (req.files || [])) {
      if (useS3 && file.buffer && s3Client) {
        const key = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        await s3Client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype }));
        uploadedImages.push(makeFileUrl(req, key));
      } else {
        uploadedImages.push(makeFileUrl(req, file.filename));
      }
    }
    const images = [...existingImages, ...uploadedImages].filter(Boolean);
    const features = req.body.features ? JSON.parse(req.body.features) : [];
    const vehicle = await Vehicle.create({
      id: uuidv4(),
      make: req.body.make,
      model: req.body.model,
      year: Number(req.body.year) || 0,
      price: req.body.price ? Number(req.body.price) : undefined,
      askPrice: req.body.askPrice === 'true',
      mileage: req.body.mileage || '',
      transmission: req.body.transmission || '',
      condition: req.body.condition || 'Used',
      fuelType: req.body.fuelType || '',
      bodyType: req.body.bodyType || '',
      engine: req.body.engine || '',
      seats: req.body.seats ? Number(req.body.seats) : 0,
      doors: req.body.doors ? Number(req.body.doors) : 0,
      interior: req.body.interior || '',
      exterior: req.body.exterior || '',
      location: req.body.location || '',
      description: req.body.description || '',
      features: JSON.stringify(features),
      featured: req.body.featured === 'true',
      sold: req.body.sold === 'true',
      images: JSON.stringify(images)
    });
    res.json(parseVehicleInstance(vehicle));
  } catch (err) {
    console.error('POST /api/admin/vehicles error', err);
    res.status(500).json({ message: 'Unable to create vehicle.' });
  }
});

app.patch('/api/admin/vehicles/:id', adminMiddleware, upload.array('images', 8), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : (vehicle.images ? JSON.parse(vehicle.images) : []);
    const uploadedImages = [];
    for (const file of (req.files || [])) {
      if (useS3 && file.buffer && s3Client) {
        const key = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        await s3Client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype }));
        uploadedImages.push(makeFileUrl(req, key));
      } else {
        uploadedImages.push(makeFileUrl(req, file.filename));
      }
    }
    const images = [...existingImages, ...uploadedImages].filter(Boolean);
    const features = req.body.features ? JSON.parse(req.body.features) : (vehicle.features ? JSON.parse(vehicle.features) : []);
    await vehicle.update({
      make: req.body.make || vehicle.make,
      model: req.body.model || vehicle.model,
      year: req.body.year ? Number(req.body.year) : vehicle.year,
      price: req.body.price ? Number(req.body.price) : vehicle.price,
      askPrice: req.body.askPrice === 'true',
      mileage: req.body.mileage || vehicle.mileage,
      transmission: req.body.transmission || vehicle.transmission,
      condition: req.body.condition || vehicle.condition,
      fuelType: req.body.fuelType || vehicle.fuelType,
      bodyType: req.body.bodyType || vehicle.bodyType,
      engine: req.body.engine || vehicle.engine,
      seats: req.body.seats ? Number(req.body.seats) : vehicle.seats,
      doors: req.body.doors ? Number(req.body.doors) : vehicle.doors,
      interior: req.body.interior || vehicle.interior,
      exterior: req.body.exterior || vehicle.exterior,
      location: req.body.location || vehicle.location,
      description: req.body.description || vehicle.description,
      features: JSON.stringify(features),
      featured: req.body.featured === 'true',
      sold: req.body.sold === 'true',
      images: JSON.stringify(images)
    });
    res.json(parseVehicleInstance(vehicle));
  } catch (err) {
    console.error('PATCH /api/admin/vehicles/:id error', err);
    res.status(500).json({ message: 'Unable to update vehicle.' });
  }
});

app.delete('/api/admin/vehicles/:id', adminMiddleware, async (req, res) => {
  try {
    await Vehicle.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error('DELETE /api/admin/vehicles/:id error', err);
    res.status(500).json({ message: 'Unable to delete vehicle.' });
  }
});

// Start server after syncing DB and seeding admin
(async () => {
  try {
    await sequelize.sync();
    await seedAdminIfNeeded();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
