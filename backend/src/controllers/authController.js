import jwt from 'jsonwebtoken';
import validator from 'validator';
import * as userModel from '../models/userModel.js';
import { addEmailJob } from '../config/queues.js';

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET is not set in environment variables.');
    process.exit(1);
}

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

// ─── Helper: password complexity ──────────────────────────────────────────────
function validatePasswordComplexity(password) {
    if (!password || password.length < 12) {
        return 'Password must be at least 12 characters.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number.';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return 'Password must contain at least one special character.';
    }
    return null; // valid
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // ── Input presence ────────────────────────────────────────
        if (!name  || !String(name).trim())  return res.status(400).json({ success: false, message: 'Name is required.' });
        if (!email || !String(email).trim()) return res.status(400).json({ success: false, message: 'Email is required.' });
        if (!password)                       return res.status(400).json({ success: false, message: 'Password is required.' });

        // ── Role whitelist ────────────────────────────────────────
        const allowedRoles = ['student', 'teacher'];  // admin only via seeding/migration
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be student or teacher.' });
        }

        // ── Email format ──────────────────────────────────────────
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        // ── Name sanitization ─────────────────────────────────────
        const safeName = validator.escape(String(name).trim());
        if (safeName.length < 2 || safeName.length > 100) {
            return res.status(400).json({ success: false, message: 'Name must be 2–100 characters.' });
        }

        // ── Password complexity ───────────────────────────────────
        const pwErr = validatePasswordComplexity(password);
        if (pwErr) return res.status(400).json({ success: false, message: pwErr });

        // ── Duplicate check ───────────────────────────────────────
        const table = role === 'student' ? 'student' : 'staff';
        const existing = await userModel.findUserByEmail(table, email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // ── Create ────────────────────────────────────────────────
        await userModel.registerUser(role, { name: safeName, email, password });
        const newUser = await userModel.findUserByEmail(table, email);
        const token   = signToken(newUser);

        // Async Email Notification using Message Queue
        addEmailJob(email, 'Welcome to JU SMS', `Hello ${safeName}, your account has been successfully created.`).catch(err => console.error('Failed to queue email:', err));

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: {
                id:    newUser.id,
                name:  newUser.name,
                email: newUser.email,
                role:  newUser.role
            }
        });

    } catch (error) {
        console.error('[authController.register]', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        // Search students first, then staff (covers all roles)
        let user = await userModel.findUserByEmail('student', email);
        let table = 'students';
        if (!user) {
            user = await userModel.findUserByEmail('staff', email);
            table = 'staff';
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // ── Check if locked out ────────────────────────────────────────────────
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(403).json({ success: false, message: `Account locked due to too many failed attempts. Try again in ${minLeft} minutes.` });
        }

        const isMatch = await userModel.comparePassword(password, user.password_hash);
        
        if (!isMatch) {
            // Increment failed attempts
            await userModel.incrementLoginAttempts(table, user.id);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // ── TOTP Verification ──────────────────────────────────────────────────
        if (user.totp_enabled) {
            const { totpToken } = req.body;
            if (!totpToken) {
                // If they provided correct password but no TOTP token, prompt them
                return res.json({ success: true, requireTotp: true, message: 'TOTP token required.' });
            }
            const { authenticator } = await import('otplib');
            const isValidTotp = authenticator.check(totpToken, user.totp_secret);
            if (!isValidTotp) {
                return res.status(401).json({ success: false, message: 'Invalid TOTP token.' });
            }
        }

        // Reset login attempts on success
        if (user.login_attempts > 0 || user.locked_until) {
            await userModel.resetLoginAttempts(table, user.id);
        }

        // ── Check password expiration (90 days) ────────────────────────────────
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const daysSinceChange = Math.floor((new Date() - new Date(user.password_changed_at || user.created_at)) / MS_PER_DAY);
        if (daysSinceChange > 90) {
            return res.status(403).json({ success: false, message: 'Password has expired (90 days). Please reset your password.' });
        }

        const token = signToken(user);
        
        // ── Generate Refresh Token ──────────────────────────────────────────────
        const crypto = await import('crypto');
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        
        // Save to DB (valid for 30 days)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await userModel.saveRefreshToken(user.id, table === 'students' ? 'student' : 'staff', refreshHash, expiresAt);

        // ── Set Secure Cookies ──────────────────────────────────────────────────
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        return res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id:    user.id,
                name:  user.name,
                email: user.email,
                role:  user.role   // 'student' | 'teacher' | 'admin' | 'superadmin'
            }
        });

    } catch (error) {
        console.error('[authController.login]', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ─── GET /api/auth/me (protected by requireAuth middleware) ───────────────────
export const getMe = async (req, res) => {
    try {
        // req.user is populated by requireAuth middleware
        const user = await userModel.findUserById(req.user.role, req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or account deleted.' });
        }
        return res.json({
            success: true,
            user: {
                id:            user.id,
                name:          user.name,
                email:         user.email,
                role:          user.role,
                phone:         user.phone || null,
                department_id: user.department_id,
                created_at:    user.created_at
            }
        });
    } catch (error) {
        console.error('[authController.getMe]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided.' });

        const crypto = await import('crypto');
        const refreshHash = crypto.createHash('sha256').update(token).digest('hex');

        const session = await userModel.findRefreshToken(refreshHash);
        if (!session) return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

        if (new Date(session.expires_at) < new Date()) {
            await userModel.revokeRefreshToken(refreshHash);
            return res.status(401).json({ success: false, message: 'Refresh token expired.' });
        }

        const user = await userModel.findUserById(session.user_type === 'student' ? 'student' : 'staff', session.user_id);
        if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

        const newAccessToken = signToken(user);
        
        res.cookie('jwt', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.json({ success: true, token: newAccessToken });

    } catch (error) {
        console.error('[authController.refreshToken]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            const crypto = await import('crypto');
            const refreshHash = crypto.createHash('sha256').update(token).digest('hex');
            await userModel.revokeRefreshToken(refreshHash);
        }

        res.clearCookie('jwt');
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

        return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        console.error('[authController.logout]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /api/v1/auth/totp/setup ─────────────────────────────────────────────
export const setupTotp = async (req, res) => {
    try {
        const { authenticator } = await import('otplib');
        const qrcode = await import('qrcode');
        
        const user = await userModel.findUserById(req.user.role, req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'JU Student Management', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Save secret to DB temporarily (not enabled yet)
        const table = req.user.role === 'student' ? 'students' : 'staff';
        await userModel.enableTotp(table, user.id, secret);

        // But we must unset totp_enabled until they verify it! Wait, enableTotp sets it to TRUE. 
        // Let's modify the query to just save the secret and NOT enable it yet.
        await userModel.pool.execute(
            `UPDATE ${table} SET totp_secret = ?, totp_enabled = FALSE WHERE id = ?`,
            [secret, user.id]
        );

        return res.json({ success: true, secret, qrCodeUrl });
    } catch (error) {
        console.error('[authController.setupTotp]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/v1/auth/totp/verify ───────────────────────────────────────────
export const verifyTotp = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token is required.' });

        // User must be authenticated to enable TOTP (via jwt cookie/header)
        let userRole = 'staff';
        let table = 'staff';
        if (req.user) {
            userRole = req.user.role;
            table = userRole === 'student' ? 'students' : 'staff';
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await userModel.findUserByEmail(userRole, req.user.email);
        if (!user || !user.totp_secret) {
            return res.status(400).json({ success: false, message: 'TOTP setup not initiated.' });
        }

        const { authenticator } = await import('otplib');
        const isValid = authenticator.check(token, user.totp_secret);

        if (!isValid) return res.status(400).json({ success: false, message: 'Invalid TOTP token.' });

        // Enable it for real
        await userModel.enableTotp(table, user.id, user.totp_secret);

        return res.json({ success: true, message: 'TOTP successfully enabled.' });
    } catch (error) {
        console.error('[authController.verifyTotp]', error.message);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
