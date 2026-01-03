const { pool } = require('../config/db');

function parseNonNegativeInteger(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return NaN;
    }
    return parsed;
}

// Consumables
exports.listConsumables = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, name, unit, is_active FROM consumables ORDER BY code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createConsumable = async (req, res, next) => {
    const { code, name, unit, is_active } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO consumables (code, name, unit, is_active)
       VALUES ($1, $2, $3, COALESCE($4, true))
       RETURNING id, code, name, unit, is_active`,
            [code, name ?? null, unit ?? 'pcs', is_active]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.updateConsumable = async (req, res, next) => {
    const { id } = req.params;
    const { code, name, unit, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE consumables SET code = $1, name = $2, unit = $3, is_active = $4, updated_at = now() 
       WHERE id = $5 RETURNING *`,
            [code, name, unit, is_active, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
};

exports.deleteConsumable = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM consumables WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        // Handle FK violation
        if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete: Item is in use' });
        next(err);
    }
};

// Factories
exports.getFactories = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, name, is_active, baseline_boxes FROM factories ORDER BY code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getFactorySites = async (req, res) => {
    const { factory_id } = req.params;
    try {
        const result = await pool.query(`
      SELECT s.id, s.name, s.code
      FROM client_sites s
      JOIN site_factories sf ON s.id = sf.site_id
      WHERE sf.factory_id = $1
    `, [factory_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
};

exports.getFactoryStaff = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT id, username, display_name, role FROM users WHERE factory_id = $1 AND role IN ('driver', 'clerk') ORDER BY role, display_name",
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

// ...

exports.getSiteManagers = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT id, username, display_name, role FROM users WHERE site_id = $1 AND role = 'manager' ORDER BY display_name",
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch managers' });
    }
};

exports.createFactory = async (req, res) => {
    const { code, name, site_ids, baseline_boxes } = req.body; // site_ids is array of integers

    const baselineValue = parseNonNegativeInteger(baseline_boxes);
    if (Number.isNaN(baselineValue)) {
        return res.status(400).json({ error: 'Invalid baseline_boxes' });
    }

    if (!code || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Factory
        const resFactory = await client.query(
            'INSERT INTO factories (code, name, baseline_boxes) VALUES ($1, $2, $3) RETURNING *',
            [code, name, baselineValue ?? 0]
        );
        const factoryId = resFactory.rows[0].id;

        // 2. Link to Sites (if any)
        if (site_ids && Array.isArray(site_ids) && site_ids.length > 0) {
            for (const siteId of site_ids) {
                await client.query(
                    'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2)',
                    [siteId, factoryId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(resFactory.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Factory code already exists' });
        }
        res.status(500).json({ error: 'Failed to create factory' });
    } finally {
        client.release();
    }
};

exports.updateFactory = async (req, res) => {
    const { id } = req.params;
    const { code, name, site_ids, is_active, baseline_boxes } = req.body;

    const baselineValue = parseNonNegativeInteger(baseline_boxes);
    if (Number.isNaN(baselineValue)) {
        return res.status(400).json({ error: 'Invalid baseline_boxes' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE factories SET code = $1, name = $2, is_active = $3, baseline_boxes = COALESCE($4, baseline_boxes), updated_at = now() 
       WHERE id = $5 RETURNING *`,
            [code, name, is_active ?? true, baselineValue, id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Not found' });
        }

        // Update sites: Wipe and Rewrite strategy for simplicity
        await client.query('DELETE FROM site_factories WHERE factory_id = $1', [id]);
        if (site_ids && Array.isArray(site_ids)) {
            for (const siteId of site_ids) {
                await client.query(
                    'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2)',
                    [siteId, id]
                );
            }
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    } finally {
        client.release();
    }
};

exports.getFactoryBoxCounts = async (req, res) => {
    const { role, site_id } = req.user;

    if (role === 'manager' && !site_id) {
        return res.json([]);
    }

    const params = [];
    let joinClause = '';
    let whereClause = '';
    if (role === 'manager') {
        joinClause = 'JOIN site_factories sf ON sf.factory_id = f.id';
        whereClause = 'WHERE sf.site_id = $1';
        params.push(site_id);
    }

    try {
        const result = await pool.query(`
      SELECT DISTINCT
        f.id,
        f.code,
        f.name,
        f.baseline_boxes,
        COALESCE(trip_out.total, 0) AS trips_out,
        COALESCE(outbound_out.total, 0) AS outbound_out,
        COALESCE(restock_in.total, 0) AS restocks_in,
        (f.baseline_boxes + COALESCE(restock_in.total, 0) - COALESCE(trip_out.total, 0) - COALESCE(outbound_out.total, 0)) AS current_boxes
      FROM factories f
      ${joinClause}
      LEFT JOIN (
        SELECT factory_id, SUM(quantity) AS total
        FROM return_trips
        WHERE status = 'approved'
        GROUP BY factory_id
      ) trip_out ON trip_out.factory_id = f.id
      LEFT JOIN (
        SELECT factory_id, SUM(quantity) AS total
        FROM daily_outbound
        WHERE status = 'approved'
        GROUP BY factory_id
      ) outbound_out ON outbound_out.factory_id = f.id
      LEFT JOIN (
        SELECT factory_id, SUM(quantity) AS total
        FROM factory_restocks
        WHERE status = 'received'
        GROUP BY factory_id
      ) restock_in ON restock_in.factory_id = f.id
      ${whereClause}
      ORDER BY f.code
    `, params);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load box counts' });
    }
};

exports.getFactoryBoxHistory = async (req, res) => {
    const { role, site_id } = req.user;
    const factoryId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(factoryId)) {
        return res.status(400).json({ error: 'Invalid factory id' });
    }

    try {
        if (role === 'manager' && !site_id) {
            return res.status(403).json({ error: 'forbidden' });
        }

        if (role === 'manager') {
            const linkCheck = await pool.query(
                'SELECT 1 FROM site_factories WHERE site_id = $1 AND factory_id = $2',
                [site_id, factoryId]
            );
            if (linkCheck.rowCount === 0) {
                return res.status(403).json({ error: 'forbidden' });
            }
        }

        const factoryResult = await pool.query(
            'SELECT id, code, name, baseline_boxes, created_at FROM factories WHERE id = $1',
            [factoryId]
        );
        if (factoryResult.rowCount === 0) {
            return res.status(404).json({ error: 'factory_not_found' });
        }

        const factory = factoryResult.rows[0];
        const historyResult = await pool.query(
            `
      WITH events AS (
        SELECT
          $1::bigint AS factory_id,
          $2::timestamptz AS event_time,
          'baseline'::text AS event_type,
          $3::integer AS delta,
          0::integer AS event_order,
          NULL::bigint AS ref_id,
          NULL::text AS actor,
          NULL::text AS note
        UNION ALL
        SELECT
          t.factory_id,
          t.updated_at AS event_time,
          'trip_out' AS event_type,
          -t.quantity AS delta,
          1 AS event_order,
          t.id AS ref_id,
          u.display_name AS actor,
          t.note AS note
        FROM return_trips t
        JOIN users u ON t.driver_id = u.id
        WHERE t.factory_id = $1 AND t.status = 'approved'
        UNION ALL
        SELECT
          o.factory_id,
          o.updated_at AS event_time,
          'outbound_out' AS event_type,
          -o.quantity AS delta,
          1 AS event_order,
          o.id AS ref_id,
          u.display_name AS actor,
          NULL::text AS note
        FROM daily_outbound o
        JOIN users u ON o.clerk_id = u.id
        WHERE o.factory_id = $1 AND o.status = 'approved'
        UNION ALL
        SELECT
          r.factory_id,
          COALESCE(r.received_at, r.updated_at) AS event_time,
          'restock_in' AS event_type,
          r.quantity AS delta,
          1 AS event_order,
          r.id AS ref_id,
          u.display_name AS actor,
          r.note AS note
        FROM factory_restocks r
        JOIN users u ON r.manager_id = u.id
        WHERE r.factory_id = $1 AND r.status = 'received'
      )
      SELECT
        event_time,
        event_type,
        delta,
        ref_id,
        actor,
        note,
        SUM(delta) OVER (ORDER BY event_time, event_order, ref_id NULLS FIRST) AS running_total
      FROM events
      ORDER BY event_time, event_order, ref_id NULLS FIRST
      `,
            [factoryId, factory.created_at, factory.baseline_boxes]
        );

        res.json({ factory, events: historyResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load box history' });
    }
};

exports.deleteFactory = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM site_factories WHERE factory_id = $1', [id]);
            const result = await client.query('DELETE FROM factories WHERE id = $1 RETURNING id', [id]);
            await client.query('COMMIT');

            if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
            res.json({ message: 'Deleted' });
        } catch (e) {
            await client.query('ROLLBACK');
            if (e.code === '23503') return res.status(409).json({ error: 'Cannot delete: Factory has data' });
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
    }
};

// Client Sites
exports.listClientSites = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, name, is_active FROM client_sites ORDER BY code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getSiteFactories = async (req, res) => {
    const { site_id } = req.params;
    try {
        const result = await pool.query(`
      SELECT f.id, f.name, f.code
      FROM factories f
      JOIN site_factories sf ON f.id = sf.factory_id
      WHERE sf.site_id = $1
    `, [site_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch factories' });
    }
};

exports.createClientSite = async (req, res, next) => {
    const { code, name, is_active, factory_ids } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO client_sites (code, name, is_active)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING id, code, name, is_active`,
            [code, name, is_active]
        );
        const siteId = result.rows[0].id;

        if (factory_ids && Array.isArray(factory_ids)) {
            for (const factoryId of factory_ids) {
                await client.query(
                    'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2)',
                    [siteId, factoryId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

exports.updateClientSite = async (req, res, next) => {
    const { id } = req.params;
    const { code, name, is_active, factory_ids } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE client_sites SET code = $1, name = $2, is_active = $3, updated_at = now() 
       WHERE id = $4 RETURNING *`,
            [code, name, is_active, id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Not found' });
        }

        // Update factories: Wipe and Rewrite
        await client.query('DELETE FROM site_factories WHERE site_id = $1', [id]);
        if (factory_ids && Array.isArray(factory_ids)) {
            for (const factoryId of factory_ids) {
                await client.query(
                    'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2)',
                    [id, factoryId]
                );
            }
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

exports.deleteClientSite = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM client_sites WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete: Site is in use' });
        next(err);
    }
};
