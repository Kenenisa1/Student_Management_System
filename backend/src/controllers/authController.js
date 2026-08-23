import jwt       from 'jsonwebtoken';
import crypto    from 'crypto';
import * as userModel from '../models/userModel.js';
import { addEmailJob } from '../config/queues.js';
import {
    AuthError,
    ConflictError,
    NotFoundError,
    AccountLockedError,
    ValidationError,
    ForbiddenError,
} from '../utils/errors.js';

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET is not set in environment variables.');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Create a signed JWT for the given user */
const signToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );

/** Returns true if the account lock window is still active */
const isLocked = (user) =>
    user.locked_until && new Date(user.locked_until) > new Date();

/** Returns remaining lockout minutes */
const lockMinutesLeft = (user) =>
    Math.ceil((new Date(user.locked_until) - new Date()) / 60000);

/** Determine which table + type a user type maps to */
const resolveUserTable = (role) =>
    role === 'student'
        ? { table: 'students', type: 'student' }
        : { table: 'staff', type: 'staff' };

/** Find a user by email in students first, then staff */
const findUserAcrossTables = async (email) => {
    let user = await userModel.findUserByEmail('student', email);
    if (user) return { user, table: 'students', type: 'student' };

    user = await userModel.findUserByEmail('staff', email);
    if (user) return { user, table: 'staff', type: 'staff' };

    return null;
};

/** Check password is not older than 90 days */
const isPasswordExpired = (user) => {
    const MS_PER_DAY = 86_400_000;
    const ref = user.password_changed_at || user.created_at;
    return Math.floor((Date.now() - new Date(ref)) / MS_PER_DAY) > 90;
};

/** Generate a refresh token and return both raw + hash */
const generateRefreshToken = () => {
    const raw  = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
};

/** Set secure HttpOnly cookies on the response */
const setAuthCookies = (res, token, refreshToken) => {
    const IS_SECURE = process.env.NODE_ENV === 'production';
    res.cookie('jwt', token, {
        httpOnly: true,
        secure:   IS_SECURE,
        sameSite: 'Strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,       // 7 days
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   IS_SECURE,
        sameSite: 'Strict',
        path:     '/api/v1/auth/refresh',
        maxAge:   30 * 24 * 60 * 60 * 1000,      // 30 days
    });
};

/** Verify a TOTP token against the user's secret */
const verifyTotpToken = async (totpToken, secret) => {
    const { authenticator } = await import('otplib');
    return authenticator.check(totpToken, secret);
};

/** Format the public user payload (never include password_hash etc.) */
const formatUserPayload = (user) => ({
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
// Body is pre-validated by Joi schema via `validate(schemas.register)` route middleware
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, department_id, phone } = req.body;

        const allowedRoles = ['student', 'teacher'];
        if (!allowedRoles.includes(role)) throw new ValidationError('Role must be student or teacher.');

        const { table } = resolveUserTable(role);
        const existing  = await userModel.findUserByEmail(role, email);
        if (existing) throw new ConflictError('An account with this email already exists.');

        const safeName = name.trim();
        await userModel.registerUser(role, { name: safeName, email, password });
        const newUser = await userModel.findUserByEmail(table, email);
        const token   = signToken(newUser);

        // Fire-and-forget welcome email via message queue
        addEmailJob(email, 'Welcome to JU SMS', `Hello ${safeName}, your account has been created.`)
            .catch(err => console.error('[Queue] Failed to enqueue welcome email:', err));

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: formatUserPayload(newUser),
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
// Body is pre-validated by Joi schema via `validate(schemas.login)` route middleware
export const login = async (req, res, next) => {
    try {
        const { email, password, totpToken } = req.body;

        // 1. Locate user across both tables
        const found = await findUserAcrossTables(email);
        if (!found) throw new AuthError('Invalid email or password.');
        const { user, table, type } = found;

        // 2. Check lockout
        if (isLocked(user)) throw new AccountLockedError(lockMinutesLeft(user));

        // 3. Verify password
        const isMatch = await userModel.comparePassword(password, user.password_hash);
        if (!isMatch) {
            await userModel.incrementLoginAttempts(table, user.id);
            throw new AuthError('Invalid email or password.');
        }

        // 4. TOTP check (if enabled)
        if (user.totp_enabled) {
            if (!totpToken) {
                return res.json({ success: true, requireTotp: true, message: 'TOTP token required.' });
            }
            const validTotp = await verifyTotpToken(totpToken, user.totp_secret);
            if (!validTotp) throw new AuthError('Invalid TOTP token.');
        }

        // 5. Reset failed attempts
        if (user.login_attempts > 0 || user.locked_until) {
            await userModel.resetLoginAttempts(table, user.id);
        }

        // 6. Password expiry check
        if (isPasswordExpired(user)) {
            throw new ForbiddenError('Password has expired (90 days). Please reset your password.');
        }

        // 7. Issue tokens
        const accessToken  = signToken(user);
        const { raw: rfRaw, hash: rfHash } = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await userModel.saveRefreshToken(user.id, type, rfHash, expiresAt);
        setAuthCookies(res, accessToken, rfRaw);

        return res.json({
            success: true,
            message: 'Login successful.',
            token:   accessToken,
            user:    formatUserPayload(user),
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
    try {
        const user = await userModel.findUserById(req.user.role, req.user.id);
        if (!user) throw new AuthError('User not found or account deleted.');

        return res.json({
            success: true,
            user: {
                ...formatUserPayload(user),
                phone:         user.phone || null,
                department_id: user.department_id,
                created_at:    user.created_at,
            },
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
export const refreshToken = async (req, res, next) => {
    try {
        const rawToken = req.cookies.refreshToken;
        if (!rawToken) throw new AuthError('No refresh token provided.');

        const hash    = crypto.createHash('sha256').update(rawToken).digest('hex');
        const session = await userModel.findRefreshToken(hash);
        if (!session) throw new AuthError('Invalid refresh token.');

        if (new Date(session.expires_at) < new Date()) {
            await userModel.revokeRefreshToken(hash);
            throw new AuthError('Refresh token expired. Please log in again.');
        }

        const userType = session.user_type === 'student' ? 'student' : 'staff';
        const user = await userModel.findUserById(userType, session.user_id);
        if (!user) throw new AuthError('User not found.');

        const newAccessToken = signToken(user);
        const IS_SECURE = process.env.NODE_ENV === 'production';
        res.cookie('jwt', newAccessToken, {
            httpOnly: true, secure: IS_SECURE, sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true, token: newAccessToken });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
export const logout = async (req, res, next) => {
    try {
        const rawToken = req.cookies.refreshToken;
        if (rawToken) {
            const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
            await userModel.revokeRefreshToken(hash);
        }
        res.clearCookie('jwt');
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

        return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/v1/auth/totp/setup ───────────────────────────────────────────────
export const setupTotp = async (req, res, next) => {
    try {
        const { authenticator } = await import('otplib');
        const qrcode            = await import('qrcode');

        const { table } = resolveUserTable(req.user.role);
        const user      = await userModel.findUserById(req.user.role, req.user.id);
        if (!user) throw new NotFoundError('User');

        const secret   = authenticator.generateSecret();
        const otpauth  = authenticator.keyuri(user.email, 'JU Student Management', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        // Store secret without enabling (user must verify first)
        await userModel.pool.execute(
            `UPDATE ${table} SET totp_secret = ?, totp_enabled = FALSE WHERE id = ?`,
            [secret, user.id]
        );

        return res.json({ success: true, secret, qrCodeUrl });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/v1/auth/totp/verify ─────────────────────────────────────────────
export const verifyTotp = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw new ValidationError('TOTP token is required.');
        if (!req.user) throw new AuthError('Unauthorized.');

        const userRole = req.user.role;
        const { table } = resolveUserTable(userRole);
        const user = await userModel.findUserByEmail(userRole, req.user.email);

        if (!user?.totp_secret) throw new ValidationError('TOTP setup not initiated. Call /totp/setup first.');

        const isValid = await verifyTotpToken(token, user.totp_secret);
        if (!isValid) throw new AuthError('Invalid TOTP token.');

        await userModel.enableTotp(table, user.id, user.totp_secret);
        return res.json({ success: true, message: 'TOTP successfully enabled.' });
    } catch (err) {
        next(err);
    }
};
