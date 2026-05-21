const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petstore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00' // Argentina
});

// Test de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
    console.error('   Verificá que MySQL esté corriendo y los datos en .env sean correctos');
  });

module.exports = pool;
