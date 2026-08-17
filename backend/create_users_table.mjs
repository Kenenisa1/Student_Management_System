import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Musab@54',
  database: process.env.DB_NAME || 'student_management'
});

const sql = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','staff','viewer') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const conn = await pool.getConnection();
await conn.execute(sql);
const [rows] = await conn.execute('SHOW COLUMNS FROM users');
console.log('✅ users table OK:', rows.map(r => r.Field).join(', '));
conn.release();
process.exit(0);
