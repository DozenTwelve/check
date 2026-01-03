const { pool } = require('../config/db');

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

exports.getFactories = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, name, is_active FROM factories ORDER BY code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createFactory = async (req, res) => {
    const { code, name, site_ids } = req.body; // site_ids is array of integers

    if (!code || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Factory
        const resFactory = await client.query(
            'INSERT INTO factories (code, name) VALUES ($1, $2) RETURNING *',
            [code, name]
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
    const { code, name, site_ids, is_active } = req.body;

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

exports.createClientSite = async (req, res, next) => {
    const { code, name, is_active } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO client_sites (code, name, is_active)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING id, code, name, is_active`,
            [code, name, is_active]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.updateClientSite = async (req, res, next) => {
    const { id } = req.params;
    const { code, name, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE client_sites SET code = $1, name = $2, is_active = $3, updated_at = now() 
       WHERE id = $4 RETURNING *`,
            [code, name, is_active, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
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
