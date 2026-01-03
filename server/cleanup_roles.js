const { pool } = require('./src/config/db');

async function cleanupRoles() {
    try {
        console.log('--- Cleaning Up Role Assignments ---');

        // 1. Remove Factory from Managers/Admins
        const managersCleaned = await pool.query(`
            UPDATE users SET factory_id = NULL 
            WHERE role IN ('manager', 'admin') AND factory_id IS NOT NULL
        `);
        console.log(`Removed factory_id from ${managersCleaned.rowCount} managers/admins.`);

        // 2. Remove Site from Drivers/Clerks/Admins
        // (Admins might not need strict enforcement but usually don't have sites)
        const staffCleaned = await pool.query(`
            UPDATE users SET site_id = NULL 
            WHERE role IN ('driver', 'clerk', 'admin') AND site_id IS NOT NULL
        `);
        console.log(`Removed site_id from ${staffCleaned.rowCount} drivers/clerks/admins.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanupRoles();
