const { pool } = require('../config/db');

async function requireUser(req, res, next) {
  const header = req.get('x-user-id');
  const userId = header ? Number.parseInt(header, 10) : NaN;

  if (!Number.isInteger(userId)) {
    return res.status(401).json({ error: 'missing_or_invalid_user_id' });
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
