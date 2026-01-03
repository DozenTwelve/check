const { pool } = require('../config/db');

exports.listUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, role, username, display_name, factory_id, is_active FROM users ORDER BY id'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res, next) => {
    const { role, username, display_name, factory_id } = req.body;

    try {
        const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM users');
        const hasUsers = countResult.rows[0].count > 0;

        if (hasUsers) {
            const header = req.get('x-user-id');
            const userId = header ? Number.parseInt(header, 10) : NaN;

            if (!Number.isInteger(userId)) {
                return res.status(401).json({ error: 'missing_or_invalid_user_id' });
            }

            const userResult = await pool.query(
                'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
                [userId]
            );

            if (userResult.rowCount === 0) {
                return res.status(401).json({ error: 'user_not_found' });
            }

            if (userResult.rows[0].role !== 'admin') {
                return res.status(403).json({ error: 'forbidden' });
            }
        }

        const insertResult = await pool.query(
            `INSERT INTO users (role, username, display_name, factory_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role, username, display_name, factory_id`,
            [role, username, display_name, factory_id ?? null]
        );

        res.status(201).json(insertResult.rows[0]);
    } catch (err) {
        next(err);
    }
};
