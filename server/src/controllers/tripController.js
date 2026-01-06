const { pool } = require('../config/db');

function parseLines(lines) {
    if (!Array.isArray(lines) || lines.length === 0) {
        return null;
    }
    const parsed = lines
        .map((line) => ({
            consumable_id: Number(line.consumable_id),
            qty: Number(line.qty)
        }))
        .filter((line) => Number.isInteger(line.consumable_id) && line.qty > 0);
    if (parsed.length === 0) {
        return null;
    }
    return parsed;
}

exports.listMyTrips = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT
        t.id,
        t.biz_date,
        t.status,
        t.created_at,
        f.id AS factory_id,
        f.code AS factory_code,
        f.name AS factory_name,
        s.id AS site_id,
        s.code AS site_code,
        s.name AS site_name,
        COALESCE(
          json_agg(
            json_build_object(
              'consumable_id', l.consumable_id,
              'qty', l.qty
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) AS lines
      FROM inventory_transfers t
      JOIN inventory_locations lf ON t.from_location_id = lf.id
      JOIN factories f ON lf.factory_id = f.id
      JOIN inventory_locations ls ON t.to_location_id = ls.id
      JOIN client_sites s ON ls.site_id = s.id
      LEFT JOIN inventory_transfer_lines l ON l.transfer_id = t.id
      WHERE t.created_by = $1
        AND t.transfer_type = 'driver_trip'
      GROUP BY t.id, f.id, s.id
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
    const { biz_date, factory_id, site_id, lines, note, v_level } = req.body;
    const factoryId = Number.parseInt(factory_id || req.user.factory_id, 10);
    const siteId = Number.parseInt(site_id, 10);
    const parsedLines = parseLines(lines);

    if (!biz_date || !Number.isInteger(factoryId) || !Number.isInteger(siteId) || !parsedLines) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (req.user.factory_id && Number(req.user.factory_id) !== factoryId) {
        return res.status(403).json({ error: 'factory_mismatch' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const locationResult = await client.query(
            `SELECT
        lf.id AS from_location_id,
        ls.id AS to_location_id
      FROM inventory_locations lf
      JOIN site_factories sf ON sf.factory_id = lf.factory_id AND sf.site_id = $2
      JOIN inventory_locations ls ON ls.location_type = 'site' AND ls.site_id = sf.site_id
      WHERE lf.location_type = 'factory' AND lf.factory_id = $1`,
            [factoryId, siteId]
        );

        if (locationResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'factory_site_not_found' });
        }

        const { from_location_id, to_location_id } = locationResult.rows[0];
        const headerResult = await client.query(
            `INSERT INTO inventory_transfers
       (biz_date, from_location_id, to_location_id, created_by, status, v_level, note, transfer_type)
       VALUES ($1, $2, $3, $4, 'submitted', COALESCE($5::verification_level, 'verbal_only'), $6, 'driver_trip')
       RETURNING id`,
            [biz_date, from_location_id, to_location_id, userId, v_level ?? null, note ?? null]
        );

        const transferId = headerResult.rows[0].id;
        for (const line of parsedLines) {
            await client.query(
                `INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty)
         VALUES ($1, $2, $3)`,
                [transferId, line.consumable_id, line.qty]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ id: transferId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create trip' });
    } finally {
        client.release();
    }
};

exports.deletePendingTrip = async (req, res) => {
    const userId = req.user.id;
    const transferId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(transferId)) {
        return res.status(400).json({ error: 'Invalid transfer id' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `DELETE FROM inventory_transfer_lines
       WHERE transfer_id = $1`,
            [transferId]
        );
        const result = await client.query(
            `DELETE FROM inventory_transfers
       WHERE id = $1 AND created_by = $2 AND status = 'submitted' AND transfer_type = 'driver_trip'
       RETURNING id`,
            [transferId, userId]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Trip not found or not pending' });
        }
        await client.query('COMMIT');
        res.json({ message: 'Trip deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete trip' });
    } finally {
        client.release();
    }
};

exports.listIncomingRestocks = async (req, res) => {
    const factoryId = Number.parseInt(req.user.factory_id, 10);
    if (!Number.isInteger(factoryId)) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT
        t.id,
        t.biz_date,
        t.status,
        t.created_at,
        s.id AS site_id,
        s.code AS site_code,
        s.name AS site_name,
        f.id AS factory_id,
        f.code AS factory_code,
        f.name AS factory_name,
        u.display_name AS submitter_name,
        COALESCE(
          json_agg(
            json_build_object(
              'consumable_id', l.consumable_id,
              'qty', l.qty
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) AS lines
      FROM inventory_transfers t
      JOIN inventory_locations ls ON t.from_location_id = ls.id
      JOIN client_sites s ON ls.site_id = s.id
      JOIN inventory_locations lf ON t.to_location_id = lf.id
      JOIN factories f ON lf.factory_id = f.id
      JOIN users u ON t.created_by = u.id
      LEFT JOIN inventory_transfer_lines l ON l.transfer_id = t.id
      WHERE t.transfer_type = 'manager_restock'
        AND t.status = 'submitted'
        AND lf.factory_id = $1
      GROUP BY t.id, s.id, f.id, u.display_name
      ORDER BY t.created_at ASC`,
            [factoryId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list incoming restocks' });
    }
};

exports.confirmIncomingRestock = async (req, res) => {
    const factoryId = Number.parseInt(req.user.factory_id, 10);
    const transferId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(factoryId) || !Number.isInteger(transferId)) {
        return res.status(400).json({ error: 'invalid_parameters' });
    }

    try {
        const result = await pool.query(
            `UPDATE inventory_transfers t
       SET status = 'approved', approved_by = $1, approved_at = now()
       FROM inventory_locations lf
       WHERE t.to_location_id = lf.id
         AND lf.location_type = 'factory'
         AND lf.factory_id = $2
         AND t.id = $3
         AND t.transfer_type = 'manager_restock'
         AND t.status = 'submitted'
       RETURNING t.*`,
            [req.user.id, factoryId, transferId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'restock_not_found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to confirm restock' });
    }
};
