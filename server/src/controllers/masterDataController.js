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
exports.listFactories = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, code, name, is_active FROM factories ORDER BY code'
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createFactory = async (req, res, next) => {
    const { code, name, is_active } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO factories (code, name, is_active)
       VALUES ($1, $2, COALESCE($3, true))
       RETURNING id, code, name, is_active`,
            [code, name, is_active]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
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
