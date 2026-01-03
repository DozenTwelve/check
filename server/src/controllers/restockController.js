const { pool } = require('../config/db');

// List Pending Restocks for the current user's factory (or assigned to them as driver)
exports.getMyPendingRestocks = async (req, res) => {
    const userId = req.user.id;
    const { factory_id, role } = req.user;

    try {
        let query = `
      SELECT r.*, f.name as factory_name, u.display_name as manager_name
      FROM factory_restocks r
      JOIN factories f ON r.factory_id = f.id
      JOIN users u ON r.manager_id = u.id
      WHERE r.status = 'dispatched'
    `;
        const params = [];

        // Filter logic:
        // If Clerk: see all for their factory
        // If Driver: see all assigned to them OR for their factory (if strict assignment used)

        if (role === 'clerk' && factory_id) {
            query += ` AND r.factory_id = $1`;
            params.push(factory_id);
        } else if (role === 'driver') {
            // Drivers see items assigned to them explicitly, OR items for their factory if no driver assigned
            query += ` AND (r.driver_id = $1 OR (r.factory_id = $2 AND r.driver_id IS NULL))`;
            params.push(userId, factory_id);
        } else {
            // Fallback or empty for others
            return res.json([]);
        }

        query += ` ORDER BY r.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list restocks' });
    }
};

exports.confirmRestock = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        // Update to received
        const result = await pool.query(
            `UPDATE factory_restocks 
       SET status = 'received', receiver_id = $1, received_at = now()
       WHERE id = $2 AND status = 'dispatched'
       RETURNING *`,
            [userId, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Restock not found or already received' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Confirmation failed' });
    }
};
