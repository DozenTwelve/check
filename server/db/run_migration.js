const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');
const fs = require('fs');

async function runMigration() {
    try {
        const migrationFiles = [
            // '5_site_mn_hierarchy.sql', -- Already run
            '6_add_password_hash.sql'
        ];

        for (const file of migrationFiles) {
            const sqlPath = path.join(__dirname, file);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log(`Running migration: ${file}...`);
            await pool.query(sql);
            console.log(`Migration ${file} successful.`);
        }

        console.log('All migrations successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
