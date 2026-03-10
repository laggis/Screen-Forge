const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { generateTokens, requireAuth } = require('../middleware/auth');

// Register
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ error: 'Invalid input. Username: 3-20 chars (letters/numbers/_). Password: min 6 chars.' });

  const { username, email, password } = req.body;
  try {
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?', [email, username]
    );
    if (existing.length) return res.status(409).json({ error: 'Email or username already taken' });

    const id = uuidv4();
    await db.execute(
      'INSERT INTO users (id, username, email, password_hash, is_verified) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, await bcrypt.hash(password, 12), true]
    );

    const { accessToken } = generateTokens(id);
    res.status(201).json({ token: accessToken, user: { id, username, email, role: 'user', avatar: null } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid email or password format' });

  const { email, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, password_hash, avatar, role FROM users WHERE email = ?', [email]
    );
    if (!rows.length || !rows[0].password_hash)
      return res.status(401).json({ error: 'Invalid email or password' });

    if (!await bcrypt.compare(password, rows[0].password_hash))
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    const { accessToken } = generateTokens(user.id);
    res.json({ token: accessToken, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email, u.avatar, u.role, u.created_at,
              COUNT(DISTINCT p.id) AS project_count
       FROM users u LEFT JOIN projects p ON p.user_id = u.id
       WHERE u.id = ? GROUP BY u.id`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update username
router.put('/me', requireAuth, [
  body('username').optional().trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
], async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Invalid username' });
  const { username } = req.body;
  try {
    if (username) {
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]
      );
      if (existing.length) return res.status(409).json({ error: 'Username already taken' });
      await db.execute('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
    }
    res.json({ message: 'Profile updated' });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Change password
router.put('/me/password', requireAuth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Invalid input' });
  try {
    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!await bcrypt.compare(req.body.currentPassword, rows[0].password_hash))
      return res.status(401).json({ error: 'Current password incorrect' });
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?',
      [await bcrypt.hash(req.body.newPassword, 12), req.user.id]);
    res.json({ message: 'Password updated' });
  } catch {
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
