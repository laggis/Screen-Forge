const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ── LIST MY PROJECTS ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const [projects] = await db.execute(
      `SELECT p.id, p.name, p.description, p.thumbnail, p.is_public, p.stars, p.views,
              p.created_at, p.updated_at, pd.version
       FROM projects p
       LEFT JOIN project_data pd ON pd.project_id = p.id
       WHERE p.user_id = ?
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ── GET SINGLE PROJECT ───────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, pd.components, pd.settings, pd.version,
              u.username as owner_username, u.avatar as owner_avatar
       FROM projects p
       LEFT JOIN project_data pd ON pd.project_id = p.id
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    const project = rows[0];

    // Private project: only owner can view
    if (!project.is_public && (!req.user || req.user.id !== project.user_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count if not owner
    if (!req.user || req.user.id !== project.user_id) {
      await db.execute('UPDATE projects SET views = views + 1 WHERE id = ?', [project.id]);
    }

    // Parse JSON fields
    try { project.components = JSON.parse(project.components || '[]'); } catch { project.components = []; }
    try { project.settings = JSON.parse(project.settings || '{}'); } catch { project.settings = {}; }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ── CREATE PROJECT ───────────────────────────────────────────────────────────
router.post('/', requireAuth, [
  body('name').trim().isLength({ min: 1, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid project name' });

  const { name, description = '', templateId = null } = req.body;

  try {
    // Limit: 50 projects per user (free tier)
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?', [req.user.id]
    );
    if (countRows[0].cnt >= 50) {
      return res.status(429).json({ error: 'Project limit reached (50 max)' });
    }

    const projectId = uuidv4();
    await db.execute(
      'INSERT INTO projects (id, user_id, name, description, template_id) VALUES (?, ?, ?, ?, ?)',
      [projectId, req.user.id, name, description, templateId]
    );

    // Create empty project data
    await db.execute(
      'INSERT INTO project_data (id, project_id, components, settings) VALUES (?, ?, ?, ?)',
      [uuidv4(), projectId, '[]', JSON.stringify({ bg: 'linear-gradient(135deg,#080810,#0d0d1a)', acc: '#6c63ff', serverName: name })]
    );

    const [newProject] = await db.execute(
      'SELECT * FROM projects WHERE id = ?', [projectId]
    );

    res.status(201).json({ ...newProject[0], components: [], settings: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ── SAVE PROJECT DATA ────────────────────────────────────────────────────────
router.put('/:id/save', requireAuth, async (req, res) => {
  const { components, settings, name, thumbnail } = req.body;

  try {
    // Verify ownership
    const [rows] = await db.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    // Validate JSON size (max 2MB)
    const dataStr = JSON.stringify({ components, settings });
    if (dataStr.length > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'Project data too large (max 2MB)' });
    }

    // Update project metadata
    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name.substring(0, 100)); }
    if (thumbnail) { updates.push('thumbnail = ?'); values.push(thumbnail.substring(0, 500)); }
    if (updates.length) {
      updates.push('updated_at = NOW()');
      values.push(req.params.id);
      await db.execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    } else {
      await db.execute('UPDATE projects SET updated_at = NOW() WHERE id = ?', [req.params.id]);
    }

    // Upsert project data
    await db.execute(
      `INSERT INTO project_data (id, project_id, components, settings, version)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         components = VALUES(components),
         settings = VALUES(settings),
         version = version + 1`,
      [uuidv4(), req.params.id,
       JSON.stringify(components || []),
       JSON.stringify(settings || {})]
    );

    res.json({ message: 'Saved', savedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// ── UPDATE PROJECT META ──────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  const { name, description, is_public } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    await db.execute(
      'UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), is_public = COALESCE(?, is_public), updated_at = NOW() WHERE id = ?',
      [name || null, description || null, is_public != null ? is_public : null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ── DUPLICATE PROJECT ────────────────────────────────────────────────────────
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, pd.components, pd.settings FROM projects p
       LEFT JOIN project_data pd ON pd.project_id = p.id
       WHERE p.id = ? AND (p.user_id = ? OR p.is_public = TRUE)`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });

    const src = rows[0];
    const newId = uuidv4();
    await db.execute(
      'INSERT INTO projects (id, user_id, name, description, template_id) VALUES (?, ?, ?, ?, ?)',
      [newId, req.user.id, `${src.name} (Copy)`, src.description, src.template_id]
    );
    await db.execute(
      'INSERT INTO project_data (id, project_id, components, settings) VALUES (?, ?, ?, ?)',
      [uuidv4(), newId, src.components || '[]', src.settings || '{}']
    );

    res.status(201).json({ id: newId, name: `${src.name} (Copy)` });
  } catch (err) {
    res.status(500).json({ error: 'Duplicate failed' });
  }
});

// ── DELETE PROJECT ───────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ error: 'Access denied' });

    await db.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ── TOGGLE STAR ──────────────────────────────────────────────────────────────
router.post('/:id/star', requireAuth, async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT 1 FROM gallery_stars WHERE user_id = ? AND project_id = ?',
      [req.user.id, req.params.id]
    );

    if (existing.length) {
      await db.execute('DELETE FROM gallery_stars WHERE user_id = ? AND project_id = ?', [req.user.id, req.params.id]);
      await db.execute('UPDATE projects SET stars = GREATEST(0, stars - 1) WHERE id = ?', [req.params.id]);
      res.json({ starred: false });
    } else {
      await db.execute('INSERT INTO gallery_stars (user_id, project_id) VALUES (?, ?)', [req.user.id, req.params.id]);
      await db.execute('UPDATE projects SET stars = stars + 1 WHERE id = ?', [req.params.id]);
      res.json({ starred: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Star failed' });
  }
});

module.exports = router;
