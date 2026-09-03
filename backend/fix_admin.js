import 'dotenv/config';
import { pool } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function fixAdmin() {
    try {
        const hash = await bcrypt.hash('Admin@2026!', 12);
        await pool.execute('UPDATE staff SET password_hash = ? WHERE email = "admin@ju.edu"', [hash]);
        console.log("Admin password updated successfully.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
fixAdmin();
