import express from 'express';
import { register, login, getMe, refreshToken, logout, setupTotp, verifyTotp } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// POST /api/auth/register  — strict rate-limited
router.post('/register', authLimiter, register);

// POST /api/auth/login  — strict rate-limited
router.post('/login', authLimiter, login);

// GET /api/auth/me  — requires valid JWT token
router.get('/me', requireAuth, getMe);

// POST /api/auth/refresh — get a new access token
router.post('/refresh', refreshToken);

// POST /api/auth/logout — revoke token and clear cookie
router.post('/logout', logout);

// GET /api/auth/totp/setup — requires valid JWT token
router.get('/totp/setup', requireAuth, setupTotp);

// POST /api/auth/totp/verify — requires valid JWT token
router.post('/totp/verify', requireAuth, verifyTotp);

export default router;
