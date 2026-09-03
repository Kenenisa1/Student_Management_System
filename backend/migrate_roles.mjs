import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Musab@54',
  database: process.env.DB_NAME || 'student_management'
});

async function runMigration() {
  const conn = await pool.getConnection();
  try {
    console.log('--- Starting Role Migration ---');
    
    // 1. Drop users table
    await conn.execute('DROP TABLE IF EXISTS users');
    console.log('✅ Dropped generic users table');

    // 2. Modify students table
    const [sCols] = await conn.execute('SHOW COLUMNS FROM students');
    const hasPassword = sCols.some(c => c.Field === 'password_hash');
    if (!hasPassword) {
      await conn.execute('ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) NULL');
      console.log('✅ Added password_hash to students table');
    } else {
      console.log('⏭ password_hash already exists in students table');
    }

    // 3. Create teachers table
    const createTeachersSql = `
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        department_id INT NULL,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `;
    await conn.execute(createTeachersSql);
    console.log('✅ Created teachers table');

    console.log('--- Migration Complete ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
