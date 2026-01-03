const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function main() {
  const result = await pool.query(
    `SELECT id, username, password_hash
     FROM users
     WHERE password_hash IS NOT NULL`
  );

  let updated = 0;
  for (const row of result.rows) {
    const current = String(row.password_hash || '');
    if (!current || current.startsWith('$2')) {
      continue;
    }

    const nextHash = await bcrypt.hash(current, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [nextHash, row.id]
    );
    updated += 1;
  }

  console.log(`Rehashed ${updated} user password(s).`);
}

main()
  .catch((err) => {
    console.error('Failed to rehash passwords:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
