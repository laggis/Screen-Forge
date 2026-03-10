const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload dir exists
['images','audio','fonts'].forEach(sub => {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED = {
  image: ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'],
  audio: ['audio/mpeg','audio/ogg','audio/wav','audio/mp4'],
  font:  ['font/ttf','font/otf','font/woff','font/woff2','application/font-woff'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mime = file.mimetype;
    let sub = 'images';
    if (ALLOWED.audio.includes(mime)) sub = 'audio';
    else if (ALLOWED.font.includes(mime)) sub = 'fonts';
    cb(null, path.join(UPLOAD_DIR, sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allAllowed = [...ALLOWED.image, ...ALLOWED.audio, ...ALLOWED.font];
    if (allAllowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

// ── UPLOAD ASSET ─────────────────────────────────────────────────────────────
router.post('/:projectId', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // Verify project ownership
    const [rows] = await db.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    const mime = req.file.mimetype;
    let fileType = 'other';
    if (ALLOWED.image.includes(mime)) fileType = 'image';
    else if (ALLOWED.audio.includes(mime)) fileType = 'audio';
    else if (ALLOWED.font.includes(mime))  fileType = 'font';

    const sub = fileType === 'audio' ? 'audio' : fileType === 'font' ? 'fonts' : 'images';
    const url = `/uploads/${sub}/${req.file.filename}`;
    const assetId = uuidv4();

    await db.execute(
      'INSERT INTO project_assets (id, project_id, user_id, filename, original_name, file_type, mime_type, file_size, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [assetId, req.params.projectId, req.user.id, req.file.filename, req.file.originalname, fileType, mime, req.file.size, url]
    );

    res.json({ id: assetId, url, filename: req.file.filename, originalName: req.file.originalname, fileType, size: req.file.size });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── LIST ASSETS ───────────────────────────────────────────────────────────────
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    const [assets] = await db.execute(
      'SELECT id, original_name, file_type, mime_type, file_size, url, created_at FROM project_assets WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

// ── DELETE ASSET ─────────────────────────────────────────────────────────────
router.delete('/:projectId/:assetId', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT pa.filename, pa.file_type FROM project_assets pa JOIN projects p ON p.id = pa.project_id WHERE pa.id = ? AND p.user_id = ?',
      [req.params.assetId, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    const { filename, file_type } = rows[0];
    const sub = file_type === 'audio' ? 'audio' : file_type === 'font' ? 'fonts' : 'images';
    const filePath = path.join(UPLOAD_DIR, sub, filename);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.execute('DELETE FROM project_assets WHERE id = ?', [req.params.assetId]);

    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
