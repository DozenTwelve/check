require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Admin';
const DB_CONNECT_RETRIES = Number.parseInt(process.env.DB_CONNECT_RETRIES || '30', 10);
const DB_CONNECT_DELAY_MS = Number.parseInt(process.env.DB_CONNECT_DELAY_MS || '2000', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDb() {
  for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (attempt === DB_CONNECT_RETRIES) {
        throw err;
      }
      console.log(`DB not ready (attempt ${attempt}/${DB_CONNECT_RETRIES}), retrying...`);
      await sleep(DB_CONNECT_DELAY_MS);
    }
  }
}

function sortByNumericPrefix(a, b) {
  const aNum = Number.parseInt(a, 10);
  const bNum = Number.parseInt(b, 10);

  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) {
    return aNum - bNum;
  }

  return a.localeCompare(b);
}

async function runMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort(sortByNumericPrefix);

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const client = await pool.connect();
  try {
    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8').trim();

      if (!sql) {
        console.log(`Skipping empty migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }

    console.log('Migrations complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function tableExists(table) {
  const result = await pool.query('SELECT to_regclass($1) AS name', [`public.${table}`]);
  return Boolean(result.rows[0]?.name);
}

async function ensurePasswordHashColumn() {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text');
}

async function ensureAdminUser() {
  const result = await pool.query(
    'SELECT id, password_hash FROM users WHERE username = $1',
    [ADMIN_USERNAME]
  );

  if (result.rowCount === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (username, display_name, role, password_hash, is_active)
       VALUES ($1, $2, 'admin', $3, true)`,
      [ADMIN_USERNAME, ADMIN_DISPLAY_NAME, passwordHash]
    );
    console.log(`Seeded admin user: ${ADMIN_USERNAME}`);
    return;
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      user.id
    ]);
    console.log(`Set password for existing admin user: ${ADMIN_USERNAME}`);
  }
}

async function main() {
  await waitForDb();

  const usersTableExists = await tableExists('users');
  if (!usersTableExists) {
    console.log('Users table not found. Running migrations...');
    await runMigrations();
  }

  await ensurePasswordHashColumn();
  await ensureAdminUser();

  require('./index');
}

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
