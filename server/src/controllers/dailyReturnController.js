const { pool } = require('../config/db');

exports.listDailyReturns = async (req, res, next) => {
    const { biz_date, transfer_type, status, location_id } = req.query;
    const filters = [];
    const values = [];

    if (biz_date) {
        values.push(biz_date);
        filters.push(`t.biz_date = $${values.length}`);
    }

    if (transfer_type) {
        values.push(transfer_type);
        filters.push(`t.transfer_type = $${values.length}`);
    }

    if (status) {
        values.push(status);
        filters.push(`t.status = $${values.length}`);
    }

    if (location_id) {
        values.push(Number.parseInt(location_id, 10));
        filters.push(`(t.from_location_id = $${values.length} OR t.to_location_id = $${values.length})`);
    } else if (req.user.role === 'manager' && req.user.site_id) {
        values.push(req.user.site_id);
        filters.push(`(from_site.site_id = $${values.length} OR to_site.site_id = $${values.length})`);
    } else if (req.user.factory_id) {
        values.push(req.user.factory_id);
        filters.push(`(from_factory.factory_id = $${values.length} OR to_factory.factory_id = $${values.length})`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    try {
        const result = await pool.query(
            `SELECT
          t.*,
          from_loc.location_type AS from_location_type,
          from_loc.factory_id AS from_factory_id,
          from_loc.site_id AS from_site_id,
          to_loc.location_type AS to_location_type,
          to_loc.factory_id AS to_factory_id,
          to_loc.site_id AS to_site_id,
          COALESCE(
            json_agg(
              json_build_object(
                'id', l.id,
                'consumable_id', l.consumable_id,
                'qty', l.qty,
                'discrepancy_note', l.discrepancy_note
              )
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'
          ) AS lines
       FROM inventory_transfers t
       LEFT JOIN inventory_locations from_loc ON from_loc.id = t.from_location_id
       LEFT JOIN inventory_locations to_loc ON to_loc.id = t.to_location_id
       LEFT JOIN inventory_locations from_factory ON from_factory.id = t.from_location_id AND from_factory.location_type = 'factory'
       LEFT JOIN inventory_locations to_factory ON to_factory.id = t.to_location_id AND to_factory.location_type = 'factory'
       LEFT JOIN inventory_locations from_site ON from_site.id = t.from_location_id AND from_site.location_type = 'site'
       LEFT JOIN inventory_locations to_site ON to_site.id = t.to_location_id AND to_site.location_type = 'site'
       LEFT JOIN inventory_transfer_lines l ON l.transfer_id = t.id
       ${whereClause}
       GROUP BY t.id, from_loc.id, to_loc.id, from_factory.id, to_factory.id, from_site.id, to_site.id
       ORDER BY t.biz_date DESC, t.id DESC`,
            values
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createDailyReturn = async (_req, res) => {
    res.status(410).json({ error: 'deprecated' });
};

exports.confirmDailyReturn = async (_req, res) => {
    res.status(410).json({ error: 'deprecated' });
};

exports.createAdjustment = async (req, res, next) => {
    const transferId = Number.parseInt(req.params.id, 10);
    const { note, lines } = req.body;

    if (!Number.isInteger(transferId)) {
        return res.status(400).json({ error: 'invalid_transfer_id' });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: 'lines_required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const headerResult = await client.query(
            `INSERT INTO inventory_adjustments (transfer_id, created_by, note)
       VALUES ($1, $2, $3)
       RETURNING id`,
            [transferId, req.user.id, note ?? null]
        );

        const adjustmentId = headerResult.rows[0].id;

        for (const line of lines) {
            await client.query(
                `INSERT INTO inventory_adjustment_lines
         (adjustment_id, consumable_id, delta_qty, reason)
         VALUES ($1, $2, $3, $4)`,
                [adjustmentId, line.consumable_id, line.delta_qty, line.reason ?? null]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ id: adjustmentId });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};
