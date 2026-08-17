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
    console.log('--- Starting Admin/Staff Migration ---');
    
    // 1. Check if teachers table exists
    const [tables] = await conn.execute('SHOW TABLES LIKE "teachers"');
    if (tables.length > 0) {
      await conn.execute('RENAME TABLE teachers TO staff');
      console.log('✅ Renamed teachers to staff');
    } else {
      console.log('⏭ teachers table not found or already renamed');
    }

    // 2. Add role column to staff
    const [sCols] = await conn.execute('SHOW COLUMNS FROM staff');
    const hasRole = sCols.some(c => c.Field === 'role');
    if (!hasRole) {
      await conn.execute("ALTER TABLE staff ADD COLUMN role ENUM('teacher', 'admin', 'superadmin') DEFAULT 'teacher' AFTER password_hash");
      console.log('✅ Added role column to staff table');
    } else {
      console.log('⏭ role column already exists in staff table');
    }

    console.log('--- Migration Complete ---');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

runMigration();
