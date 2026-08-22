import 'dotenv/config';
import { pool } from './src/config/db.js';

async function run() {
    try {
        await pool.execute('ALTER TABLE staff ADD COLUMN login_attempts INT DEFAULT 0, ADD COLUMN locked_until TIMESTAMP NULL, ADD COLUMN password_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN totp_secret VARCHAR(64) NULL, ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;');
        console.log('staff updated');
    } catch(e) { console.error(e.message); }
    
    try {
        await pool.execute('ALTER TABLE students ADD COLUMN login_attempts INT DEFAULT 0, ADD COLUMN locked_until TIMESTAMP NULL, ADD COLUMN password_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN totp_secret VARCHAR(64) NULL, ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;');
        console.log('students updated');
    } catch(e) { console.error(e.message); }

    try {
        await pool.execute(`CREATE TABLE IF NOT EXISTS refresh_tokens ( id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, user_type ENUM('student','staff') NOT NULL, token_hash VARCHAR(255) NOT NULL UNIQUE, device_hint VARCHAR(255) NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_user (user_id, user_type), INDEX idx_expires (expires_at) )`);
        console.log('refresh_tokens created');
    } catch(e) { console.error(e.message); }
    
    process.exit(0);
}
run();
