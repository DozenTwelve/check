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

function parseInteger(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
        return NaN;
    }
    return parsed;
}

function parseTransferLines(lines) {
    if (!Array.isArray(lines) || lines.length === 0) {
        return null;
    }
    const parsed = lines
        .map((line) => ({
            consumable_id: Number(line.consumable_id),
            qty: Number(line.qty)
        }))
        .filter((line) => Number.isInteger(line.consumable_id) && line.qty > 0);
    return parsed.length ? parsed : null;
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
    const { code, name, unit, is_active, initial_qty } = req.body;
    const initialQty = parseNonNegativeInteger(initial_qty);

    if (Number.isNaN(initialQty)) {
        return res.status(400).json({ error: 'Invalid initial_qty' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO consumables (code, name, unit, is_active)
       VALUES ($1, $2, $3, COALESCE($4, true))
       RETURNING id, code, name, unit, is_active`,
            [code, name ?? null, unit ?? 'pcs', is_active]
        );

        const consumable = result.rows[0];
        if (initialQty && initialQty > 0) {
            const locations = await client.query(
                `SELECT id, location_type
         FROM inventory_locations
         WHERE location_type IN ('global', 'external')`
            );
            const globalLocation = locations.rows.find((row) => row.location_type === 'global');
            const externalLocation = locations.rows.find((row) => row.location_type === 'external');
            if (!globalLocation || !externalLocation) {
                await client.query('ROLLBACK');
                return res.status(500).json({ error: 'inventory_locations_missing' });
            }

            const transferResult = await client.query(
                `INSERT INTO inventory_transfers
         (biz_date, from_location_id, to_location_id, created_by, status, v_level, note, transfer_type)
         VALUES (CURRENT_DATE, $1, $2, $3, 'submitted',
                 'full_count'::verification_level, 'Initial inventory', 'initial_inventory')
         RETURNING id`,
                [externalLocation.id, globalLocation.id, req.user.id]
            );

            await client.query(
                `INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty)
         VALUES ($1, $2, $3)`,
                [transferResult.rows[0].id, consumable.id, initialQty]
            );

            await client.query(
                `UPDATE inventory_transfers
         SET status = 'approved', approved_by = $2, approved_at = now()
         WHERE id = $1`,
                [transferResult.rows[0].id, req.user.id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(consumable);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

exports.updateConsumable = async (req, res, next) => {
    const { id } = req.params;
    const { code, name, unit, is_active, adjust_qty } = req.body;
    const adjustQty = parseInteger(adjust_qty);

    if (Number.isNaN(adjustQty)) {
        return res.status(400).json({ error: 'Invalid adjust_qty' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE consumables SET code = $1, name = $2, unit = $3, is_active = $4, updated_at = now() 
       WHERE id = $5 RETURNING *`,
            [code, name, unit, is_active, id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Not found' });
        }

        if (adjustQty !== null && adjustQty !== 0) {
            const locations = await client.query(
                `SELECT id, location_type
         FROM inventory_locations
         WHERE location_type IN ('global', 'external')`
            );
            const globalLocation = locations.rows.find((row) => row.location_type === 'global');
            const externalLocation = locations.rows.find((row) => row.location_type === 'external');
            if (!globalLocation || !externalLocation) {
                await client.query('ROLLBACK');
                return res.status(500).json({ error: 'inventory_locations_missing' });
            }

            const delta = Math.abs(adjustQty);
            const fromLocation = adjustQty > 0 ? externalLocation.id : globalLocation.id;
            const toLocation = adjustQty > 0 ? globalLocation.id : externalLocation.id;

            const transferResult = await client.query(
                `INSERT INTO inventory_transfers
         (biz_date, from_location_id, to_location_id, created_by, status, v_level, note, transfer_type)
         VALUES (CURRENT_DATE, $1, $2, $3, 'submitted',
                 'full_count'::verification_level, 'Admin inventory adjustment', 'admin_adjustment')
         RETURNING id`,
                [fromLocation, toLocation, req.user.id]
            );

            await client.query(
                `INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty)
         VALUES ($1, $2, $3)`,
                [transferResult.rows[0].id, id, delta]
            );

            await client.query(
                `UPDATE inventory_transfers
         SET status = 'approved', approved_by = $2, approved_at = now()
         WHERE id = $1`,
                [transferResult.rows[0].id, req.user.id]
            );
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
            `SELECT
        f.id,
        f.code,
        f.name,
        f.is_active,
        COALESCE(
          array_agg(sf.site_id ORDER BY sf.site_id) FILTER (WHERE sf.site_id IS NOT NULL),
          ARRAY[]::bigint[]
        ) AS site_ids
      FROM factories f
      LEFT JOIN site_factories sf ON sf.factory_id = f.id
      GROUP BY f.id, f.code, f.name, f.is_active
      ORDER BY f.code`
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
    const { code, name, site_id, site_ids, baseline_lines } = req.body;
    const parsedLines = parseTransferLines(baseline_lines);

    if (!code || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const rawSiteIds = Array.isArray(site_ids)
        ? site_ids
        : (site_id !== undefined && site_id !== null ? [site_id] : []);
    const finalSiteIds = Array.from(new Set(
        rawSiteIds
            .map((id) => Number.parseInt(id, 10))
            .filter(Number.isInteger)
    ));
    if (finalSiteIds.length === 0) {
        return res.status(400).json({ error: 'Missing site_ids' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const resFactory = await client.query(
            'INSERT INTO factories (code, name) VALUES ($1, $2) RETURNING *',
            [code, name]
        );
        const factoryId = resFactory.rows[0].id;

        for (const siteId of finalSiteIds) {
            await client.query(
                'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [siteId, factoryId]
            );
        }

        const locationResult = await client.query(
            `INSERT INTO inventory_locations (location_type, factory_id, label)
       VALUES ('factory', $1, $2)
       RETURNING id`,
            [factoryId, name]
        );
        const factoryLocationId = locationResult.rows[0].id;

        if (parsedLines) {
            const globalLocation = await client.query(
                `SELECT id FROM inventory_locations WHERE location_type = 'global' LIMIT 1`
            );
            if (globalLocation.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(500).json({ error: 'inventory_locations_missing' });
            }

            const transferResult = await client.query(
                `INSERT INTO inventory_transfers
         (biz_date, from_location_id, to_location_id, created_by, status, v_level, note, transfer_type)
         VALUES (CURRENT_DATE, $1, $2, $3, 'submitted',
                 'factory_directive'::verification_level, 'Factory baseline', 'baseline')
         RETURNING id`,
                [globalLocation.rows[0].id, factoryLocationId, req.user.id]
            );

            for (const line of parsedLines) {
                await client.query(
                    `INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty)
           VALUES ($1, $2, $3)`,
                    [transferResult.rows[0].id, line.consumable_id, line.qty]
                );
            }

            await client.query(
                `UPDATE inventory_transfers
         SET status = 'approved', approved_by = $2, approved_at = now()
         WHERE id = $1`,
                [transferResult.rows[0].id, req.user.id]
            );
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
    const { code, name, site_id, site_ids, is_active } = req.body;
    const hasSiteIds = Array.isArray(site_ids) || site_id !== undefined;
    const rawSiteIds = Array.isArray(site_ids)
        ? site_ids
        : (site_id !== undefined && site_id !== null ? [site_id] : null);
    const finalSiteIds = rawSiteIds === null
        ? null
        : Array.from(new Set(
            rawSiteIds
                .map((value) => Number.parseInt(value, 10))
                .filter(Number.isInteger)
        ));

    if (hasSiteIds && (!finalSiteIds || finalSiteIds.length === 0)) {
        return res.status(400).json({ error: 'Missing site_ids' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `UPDATE factories SET code = $1, name = $2, is_active = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
            [code, name, is_active ?? true, id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Not found' });
        }

        if (finalSiteIds) {
            await client.query('DELETE FROM site_factories WHERE factory_id = $1', [id]);
            for (const siteId of finalSiteIds) {
                await client.query(
                    'INSERT INTO site_factories (site_id, factory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [siteId, id]
                );
            }
        }

        await client.query(
            `UPDATE inventory_locations
       SET label = $1
       WHERE location_type = 'factory' AND factory_id = $2`,
            [name, id]
        );

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
    let siteJoin = '';
    let whereClause = '';
    if (role === 'manager') {
        siteJoin = 'JOIN site_factories sf ON sf.factory_id = f.id';
        whereClause = 'WHERE sf.site_id = $1';
        params.push(site_id);
    }

    try {
        const result = await pool.query(
            `
      SELECT
        f.id AS factory_id,
        f.code AS factory_code,
        f.name AS factory_name,
        c.id AS consumable_id,
        c.code AS consumable_code,
        c.name AS consumable_name,
        COALESCE(b.as_of_qty, 0) AS qty
      FROM factories f
      ${siteJoin}
      JOIN inventory_locations lf
        ON lf.location_type = 'factory' AND lf.factory_id = f.id
      JOIN consumables c ON c.is_active = true
      LEFT JOIN inventory_balances_as_of(now(), true) b
        ON b.location_id = lf.id AND b.consumable_id = c.id
      ${whereClause}
      ORDER BY f.code, c.code
      `,
            params
        );

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
            'SELECT id, code, name, created_at FROM factories WHERE id = $1',
            [factoryId]
        );
        if (factoryResult.rowCount === 0) {
            return res.status(404).json({ error: 'factory_not_found' });
        }

        const factory = factoryResult.rows[0];
        const historyResult = await pool.query(
            `
      WITH target AS (
        SELECT id AS location_id
        FROM inventory_locations
        WHERE location_type = 'factory' AND factory_id = $1
      ),
      transfer_events AS (
        SELECT
          t.created_at AS event_time,
          t.transfer_type::text AS event_type,
          l.consumable_id,
          CASE
            WHEN t.to_location_id = target.location_id THEN l.qty
            ELSE -l.qty
          END AS delta,
          t.id AS ref_id,
          u.display_name AS actor,
          t.note AS note
        FROM inventory_transfers t
        JOIN inventory_transfer_lines l ON l.transfer_id = t.id
        JOIN target ON true
        LEFT JOIN users u ON t.created_by = u.id
        WHERE (t.from_location_id = target.location_id
           OR t.to_location_id = target.location_id)
          AND t.status = 'approved'
      ),
      adjustment_events AS (
        SELECT
          a.created_at AS event_time,
          'adjustment'::text AS event_type,
          l.consumable_id,
          CASE
            WHEN t.to_location_id = target.location_id THEN l.delta_qty
            ELSE -l.delta_qty
          END AS delta,
          a.id AS ref_id,
          u.display_name AS actor,
          a.note AS note
        FROM inventory_adjustments a
        JOIN inventory_adjustment_lines l ON l.adjustment_id = a.id
        JOIN inventory_transfers t ON t.id = a.transfer_id
        JOIN target ON true
        LEFT JOIN users u ON a.created_by = u.id
        WHERE (t.from_location_id = target.location_id
           OR t.to_location_id = target.location_id)
          AND t.status = 'approved'
      ),
      events AS (
        SELECT * FROM transfer_events
        UNION ALL
        SELECT * FROM adjustment_events
      )
      SELECT
        e.event_time,
        e.event_type,
        e.consumable_id,
        c.code AS consumable_code,
        c.name AS consumable_name,
        e.delta,
        e.ref_id,
        e.actor,
        e.note,
        SUM(e.delta) OVER (
          PARTITION BY e.consumable_id
          ORDER BY e.event_time, e.ref_id NULLS FIRST
        ) AS running_total
      FROM events e
      JOIN consumables c ON c.id = e.consumable_id
      ORDER BY e.event_time, e.ref_id NULLS FIRST
      `,
            [factoryId]
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

        await client.query(
            `INSERT INTO inventory_locations (location_type, site_id, label)
       VALUES ('site', $1, $2)`,
            [siteId, name]
        );

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

        await client.query(
            `UPDATE inventory_locations
       SET label = $1
       WHERE location_type = 'site' AND site_id = $2`,
            [name, id]
        );

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
