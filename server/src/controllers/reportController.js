const { pool } = require('../config/db');

exports.getBalances = async (req, res, next) => {
    const asOf = req.query.as_of ? new Date(req.query.as_of) : new Date();
    const confirmedOnly = req.query.confirmed_only !== 'false';
    const locationType = req.query.location_type || 'factory';

    try {
        const result = await pool.query(
            `
      SELECT
        b.location_id,
        b.consumable_id,
        b.as_of_qty,
        l.location_type,
        l.factory_id,
        l.site_id,
        f.code AS factory_code,
        f.name AS factory_name,
        s.code AS site_code,
        s.name AS site_name
      FROM inventory_balances_as_of($1, $2) b
      JOIN inventory_locations l ON l.id = b.location_id
      LEFT JOIN factories f ON f.id = l.factory_id
      LEFT JOIN client_sites s ON s.id = l.site_id
      WHERE l.location_type = $3
      ORDER BY b.location_id, b.consumable_id
      `,
            [asOf.toISOString(), confirmedOnly, locationType]
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getFactoryNetChanges = async (req, res, next) => {
    const startRaw = req.query.start;
    const endRaw = req.query.end;
    const confirmedOnly = req.query.confirmed_only !== 'false';

    const startDate = startRaw ? new Date(startRaw) : null;
    const endDate = endRaw ? new Date(endRaw) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'invalid_date_range' });
    }

    const startTs = new Date(startDate);
    startTs.setHours(0, 0, 0, 0);
    const endTs = new Date(endDate);
    endTs.setHours(23, 59, 59, 999);

    try {
        const result = await pool.query(
            `
      WITH locations AS (
        SELECT id, factory_id
        FROM inventory_locations
        WHERE location_type = 'factory'
      ),
      start_balances AS (
        SELECT location_id, consumable_id, as_of_qty
        FROM inventory_balances_as_of($1, $3)
        WHERE location_id IN (SELECT id FROM locations)
      ),
      end_balances AS (
        SELECT location_id, consumable_id, as_of_qty
        FROM inventory_balances_as_of($2, $3)
        WHERE location_id IN (SELECT id FROM locations)
      ),
      keys AS (
        SELECT location_id, consumable_id FROM start_balances
        UNION
        SELECT location_id, consumable_id FROM end_balances
      )
      SELECT
        f.id AS factory_id,
        f.code AS factory_code,
        f.name AS factory_name,
        c.id AS consumable_id,
        c.code AS consumable_code,
        c.name AS consumable_name,
        COALESCE(s.as_of_qty, 0) AS start_qty,
        COALESCE(e.as_of_qty, 0) AS end_qty,
        COALESCE(e.as_of_qty, 0) - COALESCE(s.as_of_qty, 0) AS delta_qty
      FROM keys k
      JOIN locations l ON l.id = k.location_id
      JOIN factories f ON f.id = l.factory_id
      JOIN consumables c ON c.id = k.consumable_id
      LEFT JOIN start_balances s ON s.location_id = k.location_id AND s.consumable_id = k.consumable_id
      LEFT JOIN end_balances e ON e.location_id = k.location_id AND e.consumable_id = k.consumable_id
      ORDER BY f.code, c.code
      `,
            [startTs.toISOString(), endTs.toISOString(), confirmedOnly]
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getSiteDebtSeries = async (req, res, next) => {
    const startRaw = req.query.start;
    const endRaw = req.query.end;
    const confirmedOnly = req.query.confirmed_only !== 'false';
    const consumableId = req.query.consumable_id ? Number.parseInt(req.query.consumable_id, 10) : null;

    const startDate = startRaw ? new Date(startRaw) : null;
    const endDate = endRaw ? new Date(endRaw) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'invalid_date_range' });
    }

    if (req.query.consumable_id && !Number.isInteger(consumableId)) {
        return res.status(400).json({ error: 'invalid_consumable_id' });
    }

    const startTs = new Date(startDate);
    startTs.setHours(0, 0, 0, 0);
    const endTs = new Date(endDate);
    endTs.setHours(0, 0, 0, 0);

    try {
        if (Number.isInteger(consumableId)) {
            const result = await pool.query(
                `
        WITH days AS (
          SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
        ),
        balances AS (
          SELECT d.day,
                 b.location_id,
                 b.consumable_id,
                 b.as_of_qty
          FROM days d
          JOIN inventory_balances_as_of(d.day::timestamptz + interval '23 hours 59 minutes 59 seconds', $3) b ON true
        ),
        site_locations AS (
          SELECT id, site_id
          FROM inventory_locations
          WHERE location_type = 'site'
        )
        SELECT
          b.day AS biz_date,
          s.site_id,
          cs.code AS site_code,
          cs.name AS site_name,
          b.consumable_id,
          c.code AS consumable_code,
          c.name AS consumable_name,
          b.as_of_qty
        FROM balances b
        JOIN site_locations s ON s.id = b.location_id
        JOIN client_sites cs ON cs.id = s.site_id
        JOIN consumables c ON c.id = b.consumable_id
        WHERE b.consumable_id = $4
          AND b.as_of_qty <> 0
        ORDER BY b.day, cs.code, c.code
        `,
                [startTs.toISOString(), endTs.toISOString(), confirmedOnly, consumableId]
            );

            res.json(result.rows);
            return;
        }

        const result = await pool.query(
            `
      WITH days AS (
        SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
      ),
      balances AS (
        SELECT d.day,
               b.location_id,
               b.as_of_qty
        FROM days d
        JOIN inventory_balances_as_of(d.day::timestamptz + interval '23 hours 59 minutes 59 seconds', $3) b ON true
      ),
      site_locations AS (
        SELECT id, site_id
        FROM inventory_locations
        WHERE location_type = 'site'
      )
      SELECT
        b.day AS biz_date,
        s.site_id,
        cs.code AS site_code,
        cs.name AS site_name,
        SUM(b.as_of_qty)::integer AS as_of_qty
      FROM balances b
      JOIN site_locations s ON s.id = b.location_id
      JOIN client_sites cs ON cs.id = s.site_id
      GROUP BY b.day, s.site_id, cs.code, cs.name
      HAVING SUM(b.as_of_qty) <> 0
      ORDER BY b.day, cs.code
      `,
            [startTs.toISOString(), endTs.toISOString(), confirmedOnly]
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.getSiteInventory = async (req, res, next) => {
    const { role, site_id } = req.user;
    const requestedSiteId = req.query.site_id ? Number.parseInt(req.query.site_id, 10) : null;

    let siteId = Number.parseInt(site_id, 10);
    if (role === 'admin') {
        if (Number.isInteger(requestedSiteId)) {
            siteId = requestedSiteId;
        } else {
            return res.status(400).json({ error: 'site_id_required' });
        }
    }

    if (!Number.isInteger(siteId)) {
        return res.status(400).json({ error: 'manager_site_required' });
    }

    try {
        const locationResult = await pool.query(
            `SELECT id FROM inventory_locations WHERE location_type = 'site' AND site_id = $1`,
            [siteId]
        );
        if (locationResult.rowCount === 0) {
            return res.status(404).json({ error: 'site_location_missing' });
        }

        const locationId = locationResult.rows[0].id;
        const result = await pool.query(
            `
      SELECT
        c.id AS consumable_id,
        c.code AS consumable_code,
        c.name AS consumable_name,
        c.unit AS consumable_unit,
        COALESCE(b.as_of_qty, 0) AS qty
      FROM consumables c
      LEFT JOIN inventory_balances_as_of(now(), true) b
        ON b.consumable_id = c.id AND b.location_id = $1
      WHERE c.is_active = true
      ORDER BY c.code
      `,
            [locationId]
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};
