const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('Database initialized');
}

module.exports = { initDatabase };
