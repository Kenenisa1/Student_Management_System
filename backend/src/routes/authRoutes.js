import express from 'express';
import { register, login, getMe, refreshToken, logout, setupTotp, verifyTotp } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate, schemas } from '../middleware/validationMiddleware.js';

const router = express.Router();

// POST /api/auth/register  — Joi validation + strict rate limit
router.post('/register', authLimiter, validate(schemas.register), register);

// POST /api/auth/login  — Joi validation + strict rate limit
router.post('/login', authLimiter, validate(schemas.login), login);

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
