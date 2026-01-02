const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

function sortByNumericPrefix(a, b) {
  const aNum = Number.parseInt(a, 10);
  const bNum = Number.parseInt(b, 10);

  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) {
    return aNum - bNum;
  }

  return a.localeCompare(b);
}

async function runMigrations() {
  const dir = path.join(__dirname, '..', '..', 'db');
  const files = fs.readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort(sortByNumericPrefix);

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const client = await pool.connect();
  try {
    for (const file of files) {
      const fullPath = path.join(dir, file);
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
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
