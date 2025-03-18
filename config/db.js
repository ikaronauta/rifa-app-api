require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'rifa_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rifa_db',
  password: process.env.DB_PASSWORD || 'Adm1n@123*',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Error en la conexión con PostgreSQL', err);
});

module.exports = pool;
