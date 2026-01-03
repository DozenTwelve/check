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

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, display_name, role, factory_id, site_id, password, is_active } = req.body;

    try {
        let query = `UPDATE users SET username = $1, display_name = $2, role = $3, factory_id = $4, site_id = $5, is_active = $6, updated_at = now()`;
        const params = [username, display_name, role, factory_id || null, site_id || null, is_active];

        if (password) {
            query += `, password_hash = $${params.length + 1}`;
            params.push(password);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING id, username, role`;
        params.push(id);

        const result = await pool.query(query, params);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(409).json({ error: 'Username exists' });
        res.status(500).json({ error: 'Update failed' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err); // likely FK if user has created data
        if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete: User has history' });
        res.status(500).json({ error: 'Delete failed' });
    }
};
