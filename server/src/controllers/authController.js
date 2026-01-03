const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getMe = (req, res) => {
  res.json(req.user);
};

exports.login = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  try {
    const result = await pool.query(
      `SELECT id, role, username, display_name, factory_id, site_id, password_hash, is_active
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const user = result.rows[0];
    if (!user.is_active || !user.password_hash) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    return res.json({
      id: user.id,
      role: user.role,
      username: user.username,
      display_name: user.display_name,
      factory_id: user.factory_id,
      site_id: user.site_id
    });
  } catch (err) {
    return res.status(500).json({ error: 'login_failed' });
  }
};
