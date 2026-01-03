const { pool } = require('../config/db');

exports.listDailyReturns = async (req, res, next) => {
    const { biz_date, factory_id } = req.query;
    const filters = [];
    const values = [];

    if (biz_date) {
        values.push(biz_date);
        filters.push(`d.biz_date = $${values.length}`);
    }

    if (factory_id) {
        values.push(Number.parseInt(factory_id, 10));
        filters.push(`d.factory_id = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    try {
        const result = await pool.query(
            `SELECT d.*, 
          COALESCE(
            json_agg(
              json_build_object(
                'id', l.id,
                'consumable_id', l.consumable_id,
                'book_balance', l.book_balance,
                'declared_qty', l.declared_qty,
                'discrepancy_note', l.discrepancy_note
              )
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'
          ) AS lines
       FROM daily_returns d
       LEFT JOIN daily_return_lines l ON l.daily_return_id = d.id
       ${whereClause}
       GROUP BY d.id
       ORDER BY d.biz_date DESC, d.id DESC`,
            values
        );

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

exports.createDailyReturn = async (req, res, next) => {
    const { biz_date, factory_id, v_level, note, lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: 'lines_required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const headerResult = await client.query(
            `INSERT INTO daily_returns (biz_date, factory_id, v_level, created_by, note)
       VALUES ($1, $2, COALESCE($3::verification_level, 'verbal_only'::verification_level), $4, $5)
       RETURNING id`,
            [biz_date, factory_id, v_level ?? null, req.user.id, note ?? null]
        );

        const dailyReturnId = headerResult.rows[0].id;

        for (const line of lines) {
            await client.query(
                `INSERT INTO daily_return_lines
         (daily_return_id, consumable_id, book_balance, declared_qty, discrepancy_note)
         VALUES ($1, $2, $3, $4, $5)`,
                [
                    dailyReturnId,
                    line.consumable_id,
                    line.book_balance ?? 0,
                    line.declared_qty,
                    line.discrepancy_note ?? null
                ]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ id: dailyReturnId });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

exports.confirmDailyReturn = async (req, res, next) => {
    const dailyReturnId = Number.parseInt(req.params.id, 10);

    try {
        const result = await pool.query(
            `UPDATE daily_returns
       SET status = 'confirmed', confirmed_by = $1, confirmed_at = now()
       WHERE id = $2
       RETURNING id, status, confirmed_by, confirmed_at`,
            [req.user.id, dailyReturnId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'daily_return_not_found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.createAdjustment = async (req, res, next) => {
    const dailyReturnId = Number.parseInt(req.params.id, 10);
    const { note, lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: 'lines_required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const headerResult = await client.query(
            `INSERT INTO daily_return_adjustments (daily_return_id, created_by, note)
       VALUES ($1, $2, $3)
       RETURNING id`,
            [dailyReturnId, req.user.id, note ?? null]
        );

        const adjustmentId = headerResult.rows[0].id;

        for (const line of lines) {
            await client.query(
                `INSERT INTO daily_return_adjustment_lines
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
