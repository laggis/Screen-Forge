const jwt = require('jsonwebtoken');
const db  = require('../db');

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const [rows]  = await db.execute(
      'SELECT id, username, email, avatar, role FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const [rows]  = await db.execute(
        'SELECT id, username, email, avatar, role FROM users WHERE id = ?',
        [decoded.userId]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) {}
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  }),
});

module.exports = { requireAuth, optionalAuth, requireAdmin, generateTokens };
