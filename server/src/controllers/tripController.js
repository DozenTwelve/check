const { pool } = require('../config/db');

// List trips for the current user (Driver) on a specific date (or just recent 50)
exports.listMyTrips = async (req, res) => {
    const userId = req.user.id;
    // Optional: filter by date if needed, but for now just show recent
    try {
        const result = await pool.query(
            `SELECT t.*, f.name as factory_name 
       FROM return_trips t
       JOIN factories f ON t.factory_id = f.id
       WHERE t.driver_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list trips' });
    }
};

exports.createTrip = async (req, res) => {
    const userId = req.user.id;
    const { biz_date, factory_id, site_id, quantity, note } = req.body;

    if (!biz_date || !factory_id || !quantity || !site_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO return_trips (biz_date, factory_id, site_id, driver_id, quantity, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [biz_date, factory_id, site_id, userId, quantity, note]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create trip' });
    }
};

exports.deletePendingTrip = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM return_trips 
       WHERE id = $1 AND driver_id = $2 AND status = 'pending'
       RETURNING id`,
            [id, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Trip not found or not pending' });
        }
        res.json({ message: 'Trip deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete trip' });
    }
};
