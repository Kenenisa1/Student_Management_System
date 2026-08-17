import jwt from 'jsonwebtoken';
import validator from 'validator';
import * as userModel from '../models/userModel.js';

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
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters.';
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
        if (!user) {
            user = await userModel.findUserByEmail('staff', email);
        }

        // Generic error — do NOT reveal whether email exists (prevents enumeration)
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await userModel.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = signToken(user);

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
