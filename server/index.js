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
const PORT = process.env.PORT || 4173;
const JWT_SECRET = process.env.JWT_SECRET || 'tnl-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4173/login';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4174';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Storage decision: S3 in production (if S3_BUCKET set), otherwise local uploads for dev
const useS3 = Boolean(process.env.S3_BUCKET);
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
  await sequelize.sync();
  const adminEmail = process.env.ADMIN_EMAIL || ADMIN_EMAIL;
  const existing = await User.findOne({ where: { email: adminEmail } });
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD || 'TnlAdmin2026!';
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ id: uuidv4(), name: 'TNL Motors Admin', email: adminEmail, phone: '', password: hashed, isAdmin: true });
    console.log(`Seeded admin user: ${adminEmail}`);
  }
}

seedAdminIfNeeded();

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

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  const existing = store.users.find((user) => user.email === email);
  if (existing) return res.status(400).json({ message: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), name, email, phone, password: hashed, isAdmin: false };
  store.users.push(newUser);
  const token = createToken(newUser);
  res.json({ user: { id: newUser.id, name, email, phone, isAdmin: false }, token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = store.users.find((entry) => entry.email === email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ message: 'Invalid credentials' });
  const token = createToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin }, token });
});

app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: 'Google auth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ message: 'Missing authorization code.' });
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: 'Google auth is not configured.' });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ message: 'Unable to retrieve Google access token.' });
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await userInfoResponse.json();
    if (!profile.email) {
      return res.status(400).json({ message: 'Unable to retrieve Google profile email.' });
    }

    let user = store.users.find((entry) => entry.email === profile.email);
    if (!user) {
      user = {
        id: uuidv4(),
        name: profile.name || profile.email,
        email: profile.email,
        phone: profile.phone_number || '',
        password: '',
        isAdmin: profile.email === ADMIN_EMAIL
      };
      store.users.push(user);
    }
    const token = createToken(user);
    const redirectTo = new URL(GOOGLE_CALLBACK_URL);
    redirectTo.searchParams.set('google_token', token);
    redirectTo.searchParams.set('google_user', encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin
    })));
    res.redirect(redirectTo.toString());
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed.' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = store.users.find((entry) => entry.email === email);
  if (!user) return res.status(200).json({ message: 'If that email is registered, we sent password reset instructions.' });
  const token = uuidv4();
  store.resetTokens.push({ token, email, expiresAt: Date.now() + 1000 * 60 * 60 });
  console.log(`Password reset token for ${email}: ${token}`);
  res.json({ message: 'If that email is registered, we sent password reset instructions.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const reset = store.resetTokens.find((entry) => entry.token === token && entry.expiresAt > Date.now());
  if (!reset) return res.status(400).json({ message: 'Reset token is invalid or expired.' });
  const user = store.users.find((entry) => entry.email === reset.email);
  if (!user) return res.status(400).json({ message: 'User not found.' });
  user.password = await bcrypt.hash(password, 10);
  store.resetTokens = store.resetTokens.filter((entry) => entry.token !== token);
  res.json({ message: 'Password reset successfully.' });
});

app.get('/api/vehicles', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const normalized = store.vehicles.map((v) => ({
    ...v,
    images: (v.images || []).map((img) => (typeof img === 'string' && img.startsWith('/') && !img.startsWith('//') && !img.startsWith('http') ? `${origin}${img}` : img))
  }));
  res.json(normalized);
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = store.vehicles.find((v) => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const origin = `${req.protocol}://${req.get('host')}`;
  const normalized = {
    ...vehicle,
    images: (vehicle.images || []).map((img) => (typeof img === 'string' && img.startsWith('/') && !img.startsWith('//') && !img.startsWith('http') ? `${origin}${img}` : img))
  };
  res.json(normalized);
});

app.post('/api/inquiries', (req, res) => {
  const { vehicleId, name, email, phone, message } = req.body;
  const vehicle = store.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const inquiry = { id: uuidv4(), vehicleId, vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, name, email, phone, message, status: 'New', createdAt: new Date().toISOString() };
  store.inquiries.push(inquiry);
  res.json(inquiry);
});

app.get('/api/admin/inquiries', adminMiddleware, (req, res) => {
  res.json(store.inquiries);
});

app.patch('/api/admin/inquiries/:id', adminMiddleware, (req, res) => {
  const inquiry = store.inquiries.find((item) => item.id === req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  inquiry.status = req.body.status || inquiry.status;
  res.json(inquiry);
});

app.get('/api/admin/vehicles', adminMiddleware, (req, res) => {
  res.json(store.vehicles);
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
  res.json(store.users.map((user) => ({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin })));
});

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const totalVehicles = store.vehicles.length;
  const activeListings = store.vehicles.filter((vehicle) => !vehicle.sold).length;
  const soldVehicles = store.vehicles.filter((vehicle) => vehicle.sold).length;
  const totalInquiries = store.inquiries.length;
  const totalUsers = store.users.length;
  const conditionBreakdown = store.vehicles.reduce((acc, vehicle) => {
    const condition = vehicle.condition || 'Used';
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {});
  res.json({ totalVehicles, activeListings, soldVehicles, totalInquiries, totalUsers, conditionBreakdown });
});

app.post('/api/admin/vehicles', adminMiddleware, upload.array('images', 8), (req, res) => {
  const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
  const uploadedImages = (req.files || []).map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
  const images = [...existingImages, ...uploadedImages].filter(Boolean);
  const vehicle = {
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
    seats: Number(req.body.seats) || 0,
    doors: Number(req.body.doors) || 0,
    interior: req.body.interior || '',
    exterior: req.body.exterior || '',
    location: req.body.location || '',
    description: req.body.description || '',
    features: req.body.features ? JSON.parse(req.body.features) : [],
    featured: req.body.featured === 'true',
    sold: req.body.sold === 'true',
    images,
    createdAt: new Date().toISOString()
  };
  store.vehicles.push(vehicle);
  res.json(vehicle);
});

app.patch('/api/admin/vehicles/:id', adminMiddleware, upload.array('images', 8), (req, res) => {
  const vehicle = store.vehicles.find((v) => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : vehicle.images || [];
  const uploadedImages = (req.files || []).map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
  vehicle.make = req.body.make || vehicle.make;
  vehicle.model = req.body.model || vehicle.model;
  vehicle.year = req.body.year ? Number(req.body.year) : vehicle.year;
  vehicle.price = req.body.price ? Number(req.body.price) : vehicle.price;
  vehicle.askPrice = req.body.askPrice === 'true';
  vehicle.mileage = req.body.mileage || vehicle.mileage;
  vehicle.transmission = req.body.transmission || vehicle.transmission;
  vehicle.condition = req.body.condition || vehicle.condition;
  vehicle.fuelType = req.body.fuelType || vehicle.fuelType;
  vehicle.bodyType = req.body.bodyType || vehicle.bodyType;
  vehicle.engine = req.body.engine || vehicle.engine;
  vehicle.seats = req.body.seats ? Number(req.body.seats) : vehicle.seats;
  vehicle.doors = req.body.doors ? Number(req.body.doors) : vehicle.doors;
  vehicle.interior = req.body.interior || vehicle.interior;
  vehicle.exterior = req.body.exterior || vehicle.exterior;
  vehicle.location = req.body.location || vehicle.location;
  vehicle.description = req.body.description || vehicle.description;
  vehicle.features = req.body.features ? JSON.parse(req.body.features) : vehicle.features;
  vehicle.featured = req.body.featured === 'true';
  vehicle.sold = req.body.sold === 'true';
  vehicle.images = [...existingImages, ...uploadedImages].filter(Boolean);
  res.json(vehicle);
});

app.delete('/api/admin/vehicles/:id', adminMiddleware, (req, res) => {
  store.vehicles = store.vehicles.filter((v) => v.id !== req.params.id);
  res.json({ message: 'Vehicle deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
