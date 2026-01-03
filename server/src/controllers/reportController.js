const { pool } = require('../config/db');

exports.getBalances = async (req, res, next) => {
    const asOf = req.query.as_of ? new Date(req.query.as_of) : new Date();
    const confirmedOnly = req.query.confirmed_only !== 'false';

    try {
        const result = await pool.query(
            'SELECT * FROM daily_return_balances_as_of($1, $2)',
            [asOf.toISOString(), confirmedOnly]
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};
