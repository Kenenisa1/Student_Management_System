import { pool } from './backend/src/config/db.js';
import bcrypt from 'bcryptjs';

async function check() {
    const [rows] = await pool.execute('SELECT * FROM staff WHERE email="admin@ju.edu"');
    console.log("Admin rows:", rows);
    if (rows.length > 0) {
        const match = await bcrypt.compare("Admin@2026!", rows[0].password_hash);
        console.log("Password match?", match);
    }
    process.exit(0);
}
check();
