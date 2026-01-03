const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/db');

async function checkColumns() {
    try {
        const fRes = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'factories' AND column_name = 'site_id'
    `);
        const uRes = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'site_id'
      `);
        console.log('Fact Site ID:', fRes.rowCount > 0 ? 'Exists' : 'Missing');
        console.log('User Site ID:', uRes.rowCount > 0 ? 'Exists' : 'Missing');
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkColumns();
