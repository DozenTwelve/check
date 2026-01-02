require('dotenv').config();
const express = require('express');
const { pool } = require('./config/db');
const { requireUser } = require('./middlewares/auth');
const { requireRole } = require('./middlewares/requireRole');

const app = express();
app.use(express.json());

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/users/me', requireUser, (req, res) => {
  res.json(req.user);
});

app.get('/users', requireUser, requireRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, role, username, display_name, factory_id, is_active FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/users', async (req, res, next) => {
  const { role, username, display_name, factory_id } = req.body;

  try {
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    const hasUsers = countResult.rows[0].count > 0;

    if (hasUsers) {
      const header = req.get('x-user-id');
      const userId = header ? Number.parseInt(header, 10) : NaN;

      if (!Number.isInteger(userId)) {
        return res.status(401).json({ error: 'missing_or_invalid_user_id' });
      }

      const userResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rowCount === 0) {
        return res.status(401).json({ error: 'user_not_found' });
      }

      if (userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO users (role, username, display_name, factory_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role, username, display_name, factory_id`,
      [role, username, display_name, factory_id ?? null]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/consumables', requireUser, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, code, name, unit, is_active FROM consumables ORDER BY code'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/consumables', requireUser, requireRole(['admin']), async (req, res, next) => {
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
});

app.get('/factories', requireUser, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, code, name, is_active FROM factories ORDER BY code'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/factories', requireUser, requireRole(['admin']), async (req, res, next) => {
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
});

app.get('/client-sites', requireUser, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, code, name, is_active FROM client_sites ORDER BY code'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/client-sites', requireUser, requireRole(['admin']), async (req, res, next) => {
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
});

app.get('/daily-returns', requireUser, async (req, res, next) => {
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
});

app.post('/daily-returns', requireUser, requireRole(['driver', 'clerk']), async (req, res, next) => {
  const { biz_date, factory_id, v_level, note, lines } = req.body;

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'lines_required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const headerResult = await client.query(
      `INSERT INTO daily_returns (biz_date, factory_id, v_level, created_by, note)
       VALUES ($1, $2, COALESCE($3, 'verbal_only'), $4, $5)
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
});

app.post('/daily-returns/:id/confirm', requireUser, requireRole(['manager']), async (req, res, next) => {
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
});

app.post('/daily-returns/:id/adjustments', requireUser, requireRole(['clerk', 'manager']), async (req, res, next) => {
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
});

app.get('/reports/balances', requireUser, requireRole(['manager', 'admin']), async (req, res, next) => {
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
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
