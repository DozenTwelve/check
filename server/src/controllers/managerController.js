const { pool } = require('../config/db');

// Get all pending items (Driver Trips + Clerk Outbound) for the Manager's SITE
exports.getPendingItems = async (req, res) => {
    const { site_id, role } = req.user;

    // If manager has no site assigned, return empty
    if (!site_id && role !== 'admin') {
        return res.json({ trips: [], outbound: [] });
    }

    try {
        let pendingTrips;
        let pendingOutbound;

        if (role === 'admin') {
            // Admin sees ALL pending items across all sites
            pendingTrips = await pool.query(`
                SELECT t.*, f.name as factory_name, s.name as site_name, u.display_name as submitter_name, 'trip' as type
                FROM return_trips t
                JOIN factories f ON t.factory_id = f.id
                JOIN client_sites s ON t.site_id = s.id
                JOIN users u ON t.driver_id = u.id
                WHERE t.status = 'pending'
                ORDER BY t.created_at ASC
            `);

            pendingOutbound = await pool.query(`
                SELECT DISTINCT o.*, f.name as factory_name, u.display_name as submitter_name, 'outbound' as type
                FROM daily_outbound o
                JOIN factories f ON o.factory_id = f.id
                JOIN users u ON o.clerk_id = u.id
                WHERE o.status = 'pending'
                ORDER BY o.created_at ASC
            `);
        } else {
            // Manager sees pending items for their assigned site
            pendingTrips = await pool.query(`
                SELECT t.*, f.name as factory_name, s.name as site_name, u.display_name as submitter_name, 'trip' as type
                FROM return_trips t
                JOIN factories f ON t.factory_id = f.id
                JOIN client_sites s ON t.site_id = s.id
                JOIN users u ON t.driver_id = u.id
                WHERE t.status = 'pending' AND t.site_id = $1
                ORDER BY t.created_at ASC
            `, [site_id]);

            pendingOutbound = await pool.query(`
                SELECT o.*, f.name as factory_name, u.display_name as submitter_name, 'outbound' as type
                FROM daily_outbound o
                JOIN factories f ON o.factory_id = f.id
                JOIN users u ON o.clerk_id = u.id
                JOIN site_factories sf ON o.factory_id = sf.factory_id 
                WHERE o.status = 'pending' AND sf.site_id = $1
                ORDER BY o.created_at ASC
            `, [site_id]);
        }

        res.json({
            trips: pendingTrips.rows,
            outbound: pendingOutbound.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list pending items' });
    }
};

// Approve an item (Trip or Outbound)
exports.approveItem = async (req, res) => {
    const { type, id } = req.body; // type: 'trip' | 'outbound'

    if (!id || !['trip', 'outbound'].includes(type)) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        let table = type === 'trip' ? 'return_trips' : 'daily_outbound';

        // In a real app we might want to log WHO approved it (req.user.id)
        // For now we just flip the status
        const result = await pool.query(
            `UPDATE ${table} SET status = 'approved', updated_at = now() WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Approval failed' });
    }
};

// Create Platform Return (Inbound to Hub)
exports.createPlatformReturn = async (req, res) => {
    const userId = req.user.id;
    const { biz_date, quantity, note } = req.body;

    if (!biz_date || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO platform_returns (biz_date, manager_id, quantity, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [biz_date, userId, quantity, note]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create platform return' });
    }
};

// Get History of Platform Returns
exports.getPlatformReturns = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM platform_returns ORDER BY created_at DESC LIMIT 20`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch platform returns' });
    }
};

// Create Restock (Distribution to Factory/Driver)
exports.createRestock = async (req, res) => {
    const userId = req.user.id;
    const { biz_date, factory_id, driver_id, quantity, note } = req.body;

    if (!biz_date || !factory_id || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO factory_restocks (biz_date, factory_id, driver_id, manager_id, quantity, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [biz_date, factory_id, driver_id || null, userId, quantity, note]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create restock' });
    }
};
