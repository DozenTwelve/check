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
