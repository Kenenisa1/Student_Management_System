import { pool } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function check() {
    try {
        const [rows] = await pool.execute('SELECT email, role, password_hash FROM staff WHERE email="admin@ju.edu"');
        console.log("Admin rows:", rows);
        if (rows.length > 0) {
            const match = await bcrypt.compare("Admin@2026!", rows[0].password_hash);
            console.log("Password match?", match);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
