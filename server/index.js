const path = require('path');
const fs   = require('fs');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const db             = require('./db');
const { optionalAuth } = require('./middleware/auth');

const app  = express();
const PORT = 3002;

// Auto-build frontend on first run
const clientDist = path.join(__dirname, '../client/dist');
if (!fs.existsSync(clientDist)) {
  console.log('\n📦 First run — building frontend...');
  try {
    execSync('npm install', { cwd: path.join(__dirname, '../client'), stdio: 'inherit' });
    execSync('npm run build', { cwd: path.join(__dirname, '../client'), stdio: 'inherit' });
    console.log('✅ Frontend built!\n');
  } catch (e) {
    console.error('❌ Frontend build failed:', e.message);
    process.exit(1);
  }
}

// Ensure upload dirs exist
const uploadDir = path.join(__dirname, 'uploads');
['images', 'audio', 'fonts'].forEach(sub => {
  const d = path.join(uploadDir, sub);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/auth',                    rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  message: { error: 'Too many auth attempts' } }));
app.use('/api',                     rateLimit({ windowMs:       60 * 1000, max: 120, message: { error: 'Too many requests' } }));
app.use('/api/projects/:id/save',   rateLimit({ windowMs:       60 * 1000, max: 30,  message: { error: 'Too many save requests' } }));

// Static uploads
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/auth',         require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/export',   require('./routes/export'));
app.use('/api/uploads',  require('./routes/uploads'));

// Gallery
app.get('/api/gallery', optionalAuth, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = Math.min(parseInt(req.query.limit) || 12, 50);
    const offset = (page - 1) * limit;
    const sort   = req.query.sort === 'stars' ? 'p.stars DESC' : 'p.updated_at DESC';
    const search = req.query.search ? '%' + req.query.search + '%' : '%';

    const [items] = await db.execute(
      `SELECT p.id, p.name, p.thumbnail, p.stars, p.views, p.updated_at,
              u.username AS owner, u.avatar AS owner_avatar
       FROM projects p JOIN users u ON u.id = p.user_id
       WHERE p.is_public = TRUE AND p.name LIKE ?
       ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [search, limit, offset]
    );
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM projects WHERE is_public = TRUE AND name LIKE ?',
      [search]
    );
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Gallery error:', err);
    res.status(500).json({ error: 'Gallery fetch failed' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve React frontend
app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ScreenForge → http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_NAME || 'screenforge'} @ ${process.env.DB_HOST || 'localhost'}\n`);
});
