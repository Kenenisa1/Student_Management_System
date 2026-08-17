import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// POST /api/auth/register  — strict rate-limited
router.post('/register', authLimiter, register);

// POST /api/auth/login  — strict rate-limited
router.post('/login', authLimiter, login);

// GET /api/auth/me  — requires valid JWT token
router.get('/me', requireAuth, getMe);

export default router;
