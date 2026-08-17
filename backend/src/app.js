/**
 * =====================================================
 * app.js — Express Application Configuration
 * =====================================================
 * Security layers applied (OWASP Top 10 mitigations):
 *  - A01 Broken Access Control    → requireAuth + requireRoles on all routes
 *  - A02 Cryptographic Failures   → bcrypt (12 rounds), JWT HS256
 *  - A03 Injection                → Parameterized queries, sanitizeMiddleware
 *  - A05 Security Misconfiguration→ Helmet headers, CORS whitelist, no stack traces
 *  - A06 Vulnerable Components    → package.json uses latest secure versions
 *  - A07 Auth Failures            → Rate limiting, JWT expiry, bcrypt
 *  - A09 Security Logging         → loggerMiddleware on all requests
 * =====================================================
 */

import 'dotenv/config';
import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';

// ─── Middleware imports ───────────────────────────────────────
import logger        from './middleware/loggerMiddleware.js';
import sanitize      from './middleware/sanitizeMiddleware.js';
import notFound      from './middleware/notFoundMiddleware.js';
import errorHandler  from './middleware/errorMiddleware.js';
import { requireAuth, requireRoles } from './middleware/authMiddleware.js';
import { generalLimiter }            from './middleware/rateLimitMiddleware.js';

// ─── Route imports ────────────────────────────────────────────
import authRoutes       from './routes/authRoutes.js';
import studentRoutes    from './routes/studentRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import courseRoutes     from './routes/courseRoutes.js';
import profileRoutes    from './routes/profileRoutes.js';

// ─── App ─────────────────────────────────────────────────────
const app = express();

// ── 1. Security Headers (Helmet) ─────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:     ["'self'"],
            scriptSrc:      ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            styleSrc:       ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            fontSrc:        ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            imgSrc:         ["'self'", 'data:'],
            connectSrc:     ["'self'"],
            frameSrc:       ["'none'"],
            objectSrc:      ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false   // Allow fonts/images from CDN in dev
}));

// ── 2. CORS — whitelist frontend origin only ─────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,null').split(',');
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, curl) in development
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods:            ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders:     ['Content-Type', 'Authorization'],
    credentials:        true,
    optionsSuccessStatus: 200
}));

// ── 3. Global rate limiter ────────────────────────────────────
app.use(generalLimiter);

// ── 4. Body parsers ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 5. Request logger ─────────────────────────────────────────
app.use(logger);

// ── 6. Input sanitization (XSS defence-in-depth) ─────────────
app.use(sanitize);

// ── 7. Health-check ───────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'JU Student Management API is running.',
        version: '2.0.0'
    });
});

// ── 8. API Routes ─────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/profile',     profileRoutes);                                     // requires auth inside
app.use('/api/students',    requireAuth, studentRoutes);
app.use('/api/departments', requireAuth, departmentRoutes);
app.use('/api/courses',     requireAuth, courseRoutes);

// ── 9. 404 handler ────────────────────────────────────────────
app.use(notFound);

// ── 10. Global error handler (must be last) ───────────────────
app.use(errorHandler);

export default app;