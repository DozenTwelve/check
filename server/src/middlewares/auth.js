const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

async function requireUser(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'missing_or_invalid_token' });
  }

  let userId = NaN;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    userId = Number.parseInt(payload?.id, 10);
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: 'missing_or_invalid_token' });
  }

  try {
    const result = await pool.query(
      'SELECT id, role, username, display_name, factory_id, site_id FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'user_not_found' });
    }

    req.user = result.rows[0];
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireUser };
