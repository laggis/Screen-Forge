const path  = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'screenforge',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           'Z',
});

pool.getConnection()
  .then(conn => { console.log('✅ MySQL connected'); conn.release(); })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
