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

exports.getPendingItems = async (req, res) => {
    const { site_id, role } = req.user;

    if (!site_id && role !== 'admin') {
        return res.json({ trips: [], outbound: [] });
    }

    try {
        const params = [];
        let siteFilter = '';
        if (role !== 'admin') {
            params.push(site_id);
            siteFilter = 'AND s.id = $1';
        }

        const pendingTrips = await pool.query(
            `
      SELECT
        t.id,
        t.biz_date,
        t.status,
        t.created_at,
        f.id AS factory_id,
        f.code AS factory_code,
        f.name AS factory_name,
        s.id AS site_id,
        s.name AS site_name,
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
      JOIN inventory_locations lf ON t.from_location_id = lf.id
      JOIN factories f ON lf.factory_id = f.id
      JOIN inventory_locations ls ON t.to_location_id = ls.id
      JOIN client_sites s ON ls.site_id = s.id
      JOIN users u ON t.created_by = u.id
      LEFT JOIN inventory_transfer_lines l ON l.transfer_id = t.id
      WHERE t.transfer_type = 'driver_trip'
        AND t.status = 'submitted'
        ${siteFilter}
      GROUP BY t.id, f.id, s.id, u.display_name
      ORDER BY t.created_at ASC
      `,
            params
        );

        res.json({ trips: pendingTrips.rows, outbound: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list pending items' });
    }
};

exports.approveItem = async (req, res) => {
    const { type, id } = req.body;
    const transferId = Number.parseInt(id, 10);

    if (!Number.isInteger(transferId) || type !== 'trip') {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const result = await pool.query(
            `UPDATE inventory_transfers
       SET status = 'approved', approved_by = $1, approved_at = now()
       WHERE id = $2 AND transfer_type = 'driver_trip' AND status = 'submitted'
       RETURNING *`,
            [req.user.id, transferId]
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

exports.createPlatformReturn = async (_req, res) => {
    res.status(410).json({ error: 'deprecated' });
};

exports.getPlatformReturns = async (_req, res) => {
    res.json([]);
};

exports.createRestock = async (req, res) => {
    const userId = req.user.id;
    const { biz_date, factory_id, lines, note, v_level } = req.body;
    const factoryId = Number.parseInt(factory_id, 10);
    const parsedLines = parseLines(lines);

    if (!biz_date || !Number.isInteger(factoryId) || !parsedLines) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!req.user.site_id) {
        return res.status(400).json({ error: 'manager_site_required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const locationResult = await client.query(
            `SELECT
        lf.id AS to_location_id,
        ls.id AS from_location_id
      FROM site_factories sf
      JOIN inventory_locations lf
        ON lf.location_type = 'factory' AND lf.factory_id = sf.factory_id
      JOIN inventory_locations ls
        ON ls.location_type = 'site' AND ls.site_id = sf.site_id
      WHERE sf.factory_id = $1 AND sf.site_id = $2`,
            [factoryId, req.user.site_id]
        );

        if (locationResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'factory_site_mismatch' });
        }

        const { from_location_id, to_location_id } = locationResult.rows[0];
        const headerResult = await client.query(
            `INSERT INTO inventory_transfers
       (biz_date, from_location_id, to_location_id, created_by, status, v_level, note, transfer_type)
       VALUES ($1, $2, $3, $4, 'submitted', COALESCE($5::verification_level, 'verbal_only'), $6, 'manager_restock')
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

        await client.query(
            `UPDATE inventory_transfers
       SET status = 'approved', approved_by = $2, approved_at = now()
       WHERE id = $1`,
            [transferId, userId]
        );

        await client.query('COMMIT');
        res.status(201).json({ id: transferId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create restock' });
    } finally {
        client.release();
    }
};
