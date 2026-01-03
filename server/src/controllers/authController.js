const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

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

    const hash = user.password_hash;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const payload = {
      id: user.id,
      role: user.role,
      username: user.username,
      display_name: user.display_name,
      factory_id: user.factory_id,
      site_id: user.site_id
    };
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    return res.json({ token, user: payload });
  } catch (err) {
    return res.status(500).json({ error: 'login_failed' });
  }
};

exports.impersonate = async (req, res) => {
  const { user_id } = req.body || {};
  const targetId = Number(user_id);
  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ error: 'invalid_user_id' });
  }

  try {
    const result = await pool.query(
      `SELECT id, role, username, display_name, factory_id, site_id
       FROM users
       WHERE id = $1 AND is_active = true`,
      [targetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: 'impersonate_failed' });
  }
};
