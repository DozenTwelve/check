const { pool } = require('../config/db');

exports.listUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, role, username, display_name, factory_id, site_id, is_active FROM users ORDER BY username'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res) => {
    const { username, display_name, role, factory_id, site_id, password } = req.body;

    if (!username || !display_name || !role || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic validation: Managers need site, Drivers/Clerks need factory
    // We won't strict enforce it in DB (cols are nullable) but we should in logic

    try {
        const result = await pool.query(
            `INSERT INTO users (username, display_name, role, factory_id, site_id, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, role`,
            [username, display_name, role, factory_id || null, site_id || null, password] // plaintext for MVP
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};
