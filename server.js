const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cloud storage imports
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '44.10.Malatya'; // Default admin password
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// Check if MongoDB and Cloudinary are configured in Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const useCloudStorage = !!MONGODB_URI;

const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Database schema setup for MongoDB
let MagazineModel;
let ConfigModel;

if (useCloudStorage) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB database (production).'))
    .catch(err => console.error('MongoDB connection error:', err));

  const MagazineSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    publishDate: { type: String, required: true },
    coverUrl: String,
    isTemplate: { type: Boolean, default: false },
    cover: mongoose.Schema.Types.Mixed,
    pages: mongoose.Schema.Types.Mixed,
    createdAt: { type: String, default: () => new Date().toISOString() }
  });

  MagazineModel = mongoose.model('Magazine', MagazineSchema);

  const ConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
  });
  ConfigModel = mongoose.model('Config', ConfigSchema);
}

// Ensure required directories exist for local development
const dirs = [
  path.join(__dirname, 'data'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'covers'),
  path.join(__dirname, 'uploads', 'pages')
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DB_FILE = path.join(__dirname, 'data', 'magazines.json');

// Initialize database file if it doesn't exist (local)
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

let activeAdminPassword = ADMIN_PASSWORD;

// Helper to load config
async function loadConfig() {
  if (useCloudStorage) {
    try {
      const configItem = await ConfigModel.findOne({ key: 'admin' });
      if (configItem && configItem.value && configItem.value.adminPassword) {
        activeAdminPassword = configItem.value.adminPassword;
      } else {
        activeAdminPassword = ADMIN_PASSWORD;
      }
    } catch (err) {
      console.error('Error loading config from MongoDB:', err);
      activeAdminPassword = ADMIN_PASSWORD;
    }
  } else {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (config.adminPassword) {
          activeAdminPassword = config.adminPassword;
        }
      } catch (err) {
        console.error('Error loading config file:', err);
      }
    }
  }
}

// Helper to save config
async function saveConfig(configObj) {
  activeAdminPassword = configObj.adminPassword;
  if (useCloudStorage) {
    try {
      await ConfigModel.findOneAndUpdate(
        { key: 'admin' },
        { value: configObj },
        { upsert: true, new: true }
      );
      return true;
    } catch (err) {
      console.error('Error saving config to MongoDB:', err);
      return false;
    }
  } else {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configObj, null, 2));
      return true;
    } catch (err) {
      console.error('Error writing config file:', err);
      return false;
    }
  }
}

// Helper to load magazines (local fallback)
function loadMagazines() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB file:', err);
    return [];
  }
}

// Helper to save magazines (local fallback)
function saveMagazines(magazines) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(magazines, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing DB file:', err);
    return false;
  }
}

// Database helper abstractions
async function dbLoadMagazines() {
  if (useCloudStorage) {
    try {
      const docs = await MagazineModel.find({}).sort({ createdAt: -1 });
      return docs.map(doc => doc.toObject());
    } catch (err) {
      console.error('Error loading from MongoDB:', err);
      return [];
    }
  } else {
    const mags = loadMagazines();
    return mags.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function dbSaveMagazine(magazineObj, isNew = true) {
  if (useCloudStorage) {
    try {
      if (isNew) {
        const newDoc = new MagazineModel(magazineObj);
        await newDoc.save();
      } else {
        await MagazineModel.findOneAndUpdate({ id: magazineObj.id }, magazineObj);
      }
      return true;
    } catch (err) {
      console.error('Error saving to MongoDB:', err);
      return false;
    }
  } else {
    const magazines = loadMagazines();
    if (isNew) {
      magazines.push(magazineObj);
    } else {
      const idx = magazines.findIndex(m => m.id === magazineObj.id);
      if (idx !== -1) {
        magazines[idx] = magazineObj;
      }
    }
    return saveMagazines(magazines);
  }
}

async function dbDeleteMagazine(id) {
  if (useCloudStorage) {
    try {
      await MagazineModel.deleteOne({ id });
      return true;
    } catch (err) {
      console.error('Error deleting from MongoDB:', err);
      return false;
    }
  } else {
    const magazines = loadMagazines();
    const filtered = magazines.filter(m => m.id !== id);
    return saveMagazines(filtered);
  }
}

// Cloudinary or Local File upload helper
async function uploadFile(file, folder) {
  if (useCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `dergi/${folder}`
      });
      // Delete temporary local file safely
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  } else {
    // Local storage URL mapping
    const folderSub = folder === 'covers' ? 'covers' : 'pages';
    return `/uploads/${folderSub}/${file.filename}`;
  }
}

// Cloudinary or Local File delete helper
async function deleteFile(url) {
  if (!url) return;
  if (useCloudinary && url.includes('cloudinary.com')) {
    try {
      const parts = url.split('/image/upload/');
      if (parts.length > 1) {
        const pathWithVersion = parts[1];
        const pathWithoutVersion = pathWithVersion.substring(pathWithVersion.indexOf('/') + 1);
        const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error('Error deleting from Cloudinary:', err);
    }
  } else {
    // Local storage cleanup
    if (url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, url);
      safeUnlink(localPath);
    }
  }
}

// Helper to escape basic HTML tags for XSS protection
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'hakkın-izinde-gizli-anahtar-super-secure-2026',
  resave: false,
  saveUninitialized: false,
  name: '__secure_session_id', // Obfuscated session cookie name
  cookie: {
    httpOnly: true, // Prevent XSS cookie harvesting
    secure: process.env.NODE_ENV === 'production', // Enable HTTPS-only cookies in production
    sameSite: 'lax', // CSRF protection
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Admin auth middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' });
  }
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, path.join(__dirname, 'uploads', 'covers'));
    } else {
      cb(null, path.join(__dirname, 'uploads', 'pages'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept images
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Sadece resim dosyaları yüklenebilir! (.jpg, .jpeg, .png, .webp, .gif)'));
  }
});

// Serve uploads static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static client assets
app.use(express.static(path.join(__dirname, 'public')));

// --- AUTH API ---

// Simple memory-based rate limiter to protect against brute-force attacks
const loginAttempts = {};
const LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = [];
  }
  
  // Filter out attempts older than the window
  loginAttempts[ip] = loginAttempts[ip].filter(timestamp => now - timestamp < LIMIT_WINDOW_MS);
  
  if (loginAttempts[ip].length >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((LIMIT_WINDOW_MS - (now - loginAttempts[ip][0])) / 1000 / 60);
    return res.status(429).json({ 
      error: `Çok fazla başarısız giriş denemesi yaptınız. Lütfen ${timeLeft} dakika sonra tekrar deneyin.` 
    });
  }
  
  next();
}

// Login endpoint
app.post('/api/login', loginRateLimiter, (req, res) => {
  const { password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (password === activeAdminPassword) {
    // Clear attempts on successful login
    delete loginAttempts[ip];
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Giriş başarılı.' });
  } else {
    // Track failed attempt
    if (!loginAttempts[ip]) loginAttempts[ip] = [];
    loginAttempts[ip].push(Date.now());
    res.status(401).json({ error: 'Geçersiz şifre.' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Çıkış yapılamadı.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Çıkış başarılı.' });
  });
});

// Change admin password (Admin only)
app.post('/api/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre alanları zorunludur.' });
    }

    if (currentPassword !== activeAdminPassword) {
      return res.status(400).json({ error: 'Mevcut şifre hatalı.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
    }

    // Save configuration (MongoDB or local JSON)
    const saved = await saveConfig({ adminPassword: newPassword });
    if (!saved) {
      return res.status(500).json({ error: 'Şifre kaydedilirken hata oluştu.' });
    }

    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Şifre değiştirilirken hata oluştu: ' + error.message });
  }
});

// Check auth status
app.get('/api/auth-status', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// --- MAGAZINES API ---

// Get all magazines
app.get('/api/magazines', async (req, res) => {
  try {
    const magazines = await dbLoadMagazines();
    res.json(magazines);
  } catch (error) {
    res.status(500).json({ error: 'Sayılar yüklenirken hata oluştu.' });
  }
});

// Get single magazine
app.get('/api/magazines/:id', async (req, res) => {
  try {
    const magazines = await dbLoadMagazines();
    const mag = magazines.find(m => m.id === req.params.id);
    if (!mag) {
      return res.status(404).json({ error: 'Dergi bulunamadı.' });
    }
    res.json(mag);
  } catch (error) {
    res.status(500).json({ error: 'Sayı aranırken hata oluştu.' });
  }
});

// Create magazine (Admin only)
app.post('/api/magazines', requireAdmin, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'cover_sub1', maxCount: 1 },
  { name: 'cover_sub2', maxCount: 1 },
  { name: 'cover_sub3', maxCount: 1 },
  { name: 'cover_sub4', maxCount: 1 },
  { name: 'cover_sub5', maxCount: 1 },
  { name: 'pages', maxCount: 100 },
  { name: 'template_images', maxCount: 100 }
]), async (req, res) => {
  try {
    const { title, description, publishDate, isTemplate, templateData } = req.body;

    if (!title || !publishDate) {
      return res.status(400).json({ error: 'Başlık ve Yayın Tarihi zorunludur.' });
    }

    let newMagazine = {
      id: Date.now().toString(),
      title: sanitizeString(title),
      description: sanitizeString(description || ''),
      publishDate: sanitizeString(publishDate),
      createdAt: new Date().toISOString(),
      isTemplate: isTemplate === 'true'
    };

    if (newMagazine.isTemplate) {
      // Parse template structure
      let template = JSON.parse(templateData);
      
      // Sanitize template cover
      if (template.cover) {
        template.cover.title = sanitizeString(template.cover.title || '');
        template.cover.subtitle = sanitizeString(template.cover.subtitle || '');
        template.cover.color = sanitizeString(template.cover.color || 'violet');
        template.cover.textcolor = sanitizeString(template.cover.textcolor || '#ffffff');
      }

      // Sanitize template pages
      if (template.pages && Array.isArray(template.pages)) {
        template.pages.forEach(page => {
          page.title = sanitizeString(page.title || '');
          page.subtitle = sanitizeString(page.subtitle || '');
          page.text = sanitizeString(page.text || '');
          page.layout = sanitizeString(page.layout || 'text-only');
        });
      }
      
      // Handle Cover background image if uploaded
      if (req.files && req.files['cover']) {
        const coverFile = req.files['cover'][0];
        template.cover.bgUrl = await uploadFile(coverFile, 'covers');
        newMagazine.coverUrl = template.cover.bgUrl; // Fallback for list grids
      } else {
        template.cover.bgUrl = '';
        newMagazine.coverUrl = ''; // Default gradient on frontend
      }

      // Handle Cover 5 collage sub-images
      template.cover.subImages = ['', '', '', '', ''];
      for (let i = 1; i <= 5; i++) {
        const fieldName = `cover_sub${i}`;
        if (req.files && req.files[fieldName]) {
          const subFile = req.files[fieldName][0];
          template.cover.subImages[i - 1] = await uploadFile(subFile, 'covers');
        }
      }

      // Handle template images map
      const templateImages = req.files && req.files['template_images'] ? req.files['template_images'] : [];
      // Sort to match original order (appended index order)
      templateImages.sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' }));

      // Map pages and replace file_index references with actual URLs
      if (template.pages && Array.isArray(template.pages)) {
        for (const page of template.pages) {
          if (page.imageIndex !== undefined && page.imageIndex !== null) {
            const index = parseInt(page.imageIndex);
            if (templateImages[index]) {
              page.imageUrl = await uploadFile(templateImages[index], 'pages');
            } else {
              page.imageUrl = '';
            }
          }
        }
      }

      newMagazine.cover = template.cover;
      newMagazine.pages = template.pages; // pages is array of objects here
    } else {
      // Classical JPG upload flow
      if (!req.files || !req.files['cover']) {
        return res.status(400).json({ error: 'Kapak resmi yüklenmelidir.' });
      }

      const coverFile = req.files['cover'][0];
      newMagazine.coverUrl = await uploadFile(coverFile, 'covers');

      let pageUrls = [];
      if (req.files['pages']) {
        const pageFiles = req.files['pages'];
        pageFiles.sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' }));
        for (const file of pageFiles) {
          const url = await uploadFile(file, 'pages');
          pageUrls.push(url);
        }
      }
      newMagazine.pages = pageUrls; // pages is array of strings (urls)
    }

    await dbSaveMagazine(newMagazine, true);

    res.status(201).json({ success: true, magazine: newMagazine });
  } catch (error) {
    console.error('Error adding magazine:', error);
    res.status(500).json({ error: 'Sayı eklenirken hata oluştu: ' + error.message });
  }
});

// Update magazine (Admin only)
app.put('/api/magazines/:id', requireAdmin, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'cover_sub1', maxCount: 1 },
  { name: 'cover_sub2', maxCount: 1 },
  { name: 'cover_sub3', maxCount: 1 },
  { name: 'cover_sub4', maxCount: 1 },
  { name: 'cover_sub5', maxCount: 1 },
  { name: 'pages', maxCount: 100 },
  { name: 'template_images', maxCount: 100 }
]), async (req, res) => {
  try {
    const magazines = await dbLoadMagazines();
    const index = magazines.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Sayı bulunamadı.' });
    }

    const { title, description, publishDate, isTemplate, templateData } = req.body;

    if (!title || !publishDate) {
      return res.status(400).json({ error: 'Başlık ve Yayın Tarihi zorunludur.' });
    }

    let existingMag = magazines[index];
    
    // Update basic fields
    existingMag.title = sanitizeString(title);
    existingMag.description = sanitizeString(description || '');
    existingMag.publishDate = sanitizeString(publishDate);

    const reqIsTemplate = isTemplate === 'true';

    if (reqIsTemplate) {
      // Parse template structure
      let template = JSON.parse(templateData);

      // Sanitize template cover
      if (template.cover) {
        template.cover.title = sanitizeString(template.cover.title || '');
        template.cover.subtitle = sanitizeString(template.cover.subtitle || '');
        template.cover.color = sanitizeString(template.cover.color || 'violet');
        template.cover.textcolor = sanitizeString(template.cover.textcolor || '#ffffff');
      }

      // Sanitize template pages
      if (template.pages && Array.isArray(template.pages)) {
        template.pages.forEach(page => {
          page.title = sanitizeString(page.title || '');
          page.subtitle = sanitizeString(page.subtitle || '');
          page.text = sanitizeString(page.text || '');
          page.layout = sanitizeString(page.layout || 'text-only');
        });
      }

      // Handle Cover background image if newly uploaded
      if (req.files && req.files['cover']) {
        const coverFile = req.files['cover'][0];
        template.cover.bgUrl = await uploadFile(coverFile, 'covers');
        existingMag.coverUrl = template.cover.bgUrl;
      } else {
        // Keep existing cover bg if not re-uploaded
        template.cover.bgUrl = template.cover.bgUrl || (existingMag.cover ? existingMag.cover.bgUrl : '') || '';
        existingMag.coverUrl = template.cover.bgUrl;
      }

      // Handle Cover 5 collage sub-images
      if (!template.cover.subImages) {
        template.cover.subImages = ['', '', '', '', ''];
      }
      for (let i = 1; i <= 5; i++) {
        const fieldName = `cover_sub${i}`;
        if (req.files && req.files[fieldName]) {
          const subFile = req.files[fieldName][0];
          template.cover.subImages[i - 1] = await uploadFile(subFile, 'covers');
        } else {
          // Keep existing sub-image if not re-uploaded
          template.cover.subImages[i - 1] = template.cover.subImages[i - 1] || (existingMag.cover && existingMag.cover.subImages ? existingMag.cover.subImages[i - 1] : '');
        }
      }

      // Handle template images map (new uploads)
      const templateImages = req.files && req.files['template_images'] ? req.files['template_images'] : [];
      templateImages.sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' }));

      // Map pages
      if (template.pages && Array.isArray(template.pages)) {
        for (const page of template.pages) {
          if (page.imageIndex !== undefined && page.imageIndex !== null) {
            const idx = parseInt(page.imageIndex);
            if (templateImages[idx]) {
              page.imageUrl = await uploadFile(templateImages[idx], 'pages');
            }
          }
          // If no new image was uploaded and page has an index, keep the previous imageUrl if it had one
          if (!page.imageUrl && page.id && existingMag.pages) {
            const oldPage = existingMag.pages.find(p => p.id === page.id);
            if (oldPage && oldPage.imageUrl) {
              page.imageUrl = oldPage.imageUrl;
            }
          }
        }
      }

      existingMag.cover = template.cover;
      existingMag.pages = template.pages;
      existingMag.isTemplate = true;
    } else {
      // Classical JPG upload flow
      if (req.files && req.files['cover']) {
        const coverFile = req.files['cover'][0];
        existingMag.coverUrl = await uploadFile(coverFile, 'covers');
      }

      if (req.files && req.files['pages']) {
        const pageFiles = req.files['pages'];
        pageFiles.sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' }));
        const newPageUrls = [];
        for (const file of pageFiles) {
          const url = await uploadFile(file, 'pages');
          newPageUrls.push(url);
        }
        existingMag.pages = newPageUrls;
      } else {
        // Keep existing pages if no new pages are uploaded
        existingMag.pages = existingMag.pages || [];
      }
      existingMag.isTemplate = false;
    }

    await dbSaveMagazine(existingMag, false);
    res.json({ success: true, magazine: existingMag });
  } catch (error) {
    console.error('Error updating magazine:', error);
    res.status(500).json({ error: 'Sayı güncellenirken hata oluştu: ' + error.message });
  }
});


// Delete magazine (Admin only)
app.delete('/api/magazines/:id', requireAdmin, async (req, res) => {
  try {
    const magazines = await dbLoadMagazines();
    const index = magazines.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Sayı bulunamadı.' });
    }

    const mag = magazines[index];

    // Helper to safely delete file on Windows (avoiding process lock crashes)
    const safeUnlink = (filePath) => {
      try {
        if (filePath && !filePath.startsWith('http')) {
          const absolutePath = path.join(__dirname, filePath.replace(/^\//, '')); // Strip leading slash for proper join
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        }
      } catch (err) {
        console.warn(`Could not delete file ${filePath} due to Windows file lock:`, err.message);
      }
    };

    // Clean up using deleteFile helper (handles Cloudinary and local safeUnlink)
    await deleteFile(mag.coverUrl);

    if (mag.cover && Array.isArray(mag.cover.subImages)) {
      for (const subImg of mag.cover.subImages) {
        await deleteFile(subImg);
      }
    }

    // Clean up cover template bg if present
    if (mag.cover && mag.cover.bgUrl) {
      await deleteFile(mag.cover.bgUrl);
    }

    // Remove page files
    if (mag.pages && Array.isArray(mag.pages)) {
      for (const page of mag.pages) {
        if (typeof page === 'string') {
          await deleteFile(page);
        } else if (typeof page === 'object') {
          if (page.imageUrl) {
            await deleteFile(page.imageUrl);
          }
        }
      }
    }

    await dbDeleteMagazine(req.params.id);

    res.json({ success: true, message: 'Sayı ve ilişkili tüm dosyalar başarıyla silindi.' });
  } catch (error) {
    console.error('Error deleting magazine:', error);
    res.status(500).json({ error: 'Sayı silinirken hata oluştu: ' + error.message });
  }
});

// Fallback to index.html for UI routing if necessary, or let Express serve public assets.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  await loadConfig();
  console.log(`Server running at http://localhost:${PORT}`);
  if (activeAdminPassword === 'admin123') {
    console.warn('\x1b[33m%s\x1b[0m', 'UYARI: Güvenlik açığı! Varsayılan "admin123" şifresi kullanılıyor. Lütfen webde canlıya alırken ortam değişkeni (ADMIN_PASSWORD) ile güçlü bir şifre tanımlayın.');
  }
});
