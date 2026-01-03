const { pool } = require('../config/db');

exports.getDailyOutbound = async (req, res) => {
    const { factory_id, biz_date } = req.query;

    if (!factory_id || !biz_date) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM daily_outbound WHERE factory_id = $1 AND biz_date = $2`,
            [factory_id, biz_date]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get outbound record' });
    }
};

exports.upsertDailyOutbound = async (req, res) => {
    const { userId } = req; // Clerk
    const { biz_date, factory_id, quantity } = req.body;

    if (!biz_date || !factory_id || quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Upsert logic: if exists for day/factory, update quantity
        const result = await pool.query(
            `INSERT INTO daily_outbound (biz_date, factory_id, clerk_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (biz_date, factory_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, clerk_id = EXCLUDED.clerk_id, updated_at = now()
       RETURNING *`,
            [biz_date, factory_id, userId, quantity]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save outbound record' });
    }
};
