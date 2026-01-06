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
