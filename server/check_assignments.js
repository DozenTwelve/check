const { pool } = require('./src/config/db');

async function checkUsers() {
    try {
        console.log('--- Checking Users and Assignments ---');
        const res = await pool.query('SELECT id, username, role, factory_id, site_id FROM users');
        console.table(res.rows);

        console.log('--- Checking Factories ---');
        const facts = await pool.query('SELECT id, name FROM factories');
        console.table(facts.rows);

        console.log('--- Checking Sites ---');
        const sites = await pool.query('SELECT id, name FROM client_sites');
        console.table(sites.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
