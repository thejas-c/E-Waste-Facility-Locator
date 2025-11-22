const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ewaste_locator',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('Please ensure MySQL is running and database is created');
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

module.exports = pool.promise();