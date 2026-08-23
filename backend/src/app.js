/**
 * =====================================================
 * app.js — Express Application Configuration
 * =====================================================
 * Security layers applied (OWASP Top 10 mitigations):
 *  - A01 Broken Access Control    → requireAuth + requireRoles + ABAC on all routes
 *  - A02 Cryptographic Failures   → bcrypt (12 rounds), JWT HS256
 *  - A03 Injection                → Parameterized queries, sanitizeMiddleware
 *  - A05 Security Misconfiguration→ Helmet headers, CORS whitelist, no stack traces
 *  - A06 Vulnerable Components    → package.json uses latest secure versions
 *  - A07 Auth Failures            → Rate limiting, JWT expiry, bcrypt, account lockout
 *  - A09 Security Logging         → loggerMiddleware on all requests, CSP violation reporting
 *
 * Architecture patterns applied:
 *  - API Gateway Pattern          → Auth, rate limiting, request routing, logging all in one layer
 *  - Multi-Client Architecture    → /api/v1/ versioned routes (browser, mobile, desktop)
 *  - Load Balancing ready         → PM2 cluster mode (ecosystem.config.json)
 *  - Lazy Loading                 → Tab-based JS loading on frontend
 *  - Caching (Redis)              → Student & course list responses cached 60-120 seconds
 *  - Message Queue (BullMQ/Redis) → Async email notifications & batch report jobs
 *  - Circuit Breaker (Opossum)    → External service calls protected against cascading failures
 *  - Retry + Exponential Backoff  → axios-retry for transient failures
 *  - Health Checks                → /health, /ready, /live endpoints
 *  - Graceful Shutdown            → SIGTERM/SIGINT handlers in server.js
 *  - Distributed Rate Limiting    → Redis-backed role-based limits (Admin:1000, Teacher:500, Student:100/min)
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
            scriptSrc:      ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'unpkg.com'],
            styleSrc:       ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            fontSrc:        ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
            imgSrc:         ["'self'", 'data:', 'blob:'],
            connectSrc:     ["'self'", "http://localhost:*", "ws://localhost:*"],
            frameSrc:       ["'none'"],
            objectSrc:      ["'none'"],
            upgradeInsecureRequests: [],
            reportUri:      '/api/v1/csp-report'
        },
        reportOnly: false
    },
    crossOriginEmbedderPolicy: false,   // Allow fonts/images from CDN in dev
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Permissions-Policy (not fully supported by Helmet directly yet, often set manually)
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

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

import cookieParser from 'cookie-parser';

// ── 3. Global rate limiter ────────────────────────────────────
app.use(generalLimiter);

// ── 4. Body parsers ───────────────────────────────────────────
app.use(express.json({ 
    limit: '10kb',
    type: ['application/json', 'application/csp-report']
})); // prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── 5. Request logger ─────────────────────────────────────────
app.use(logger);

// ── 6. Input sanitization (XSS defence-in-depth) ─────────────
app.use(sanitize);

// ── 7. API Version Header (Multi-Client Architecture) ────────
// Every response carries an X-API-Version header so clients know
// which version they are talking to. This enables:
//  - Web browsers, mobile apps and desktop clients to all use the same API
//  - Future versioning without breaking existing clients
app.use((req, res, next) => {
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Powered-By-Worker', process.pid); // shows which PM2 worker handled it
    next();
});

// ── 8. Health-check (shows load balancing in action) ──────────
// When PM2 runs multiple workers, each request may be handled by
// a different worker process. The worker_pid field proves this.
app.get('/', (req, res) => {
    res.json({
        success:     true,
        message:     'JU Student Management API is running.',
        version:     '1.0.0',
        worker_pid:  process.pid,           // changes per worker → proves load balancing
        uptime_sec:  Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        clients:     ['web-browser', 'mobile-app (future)', 'desktop-app (future)']
    });
});

// ── 9. API Routes — versioned for Multi-Client Architecture ───
// /api/v1/ prefix means:
//  - Web app uses: http://localhost:5000/api/v1/auth/login
//  - Mobile app will use the same URL — no code changes on server side
//  - When v2 is released, v1 still works → no breaking changes
const v1 = '/api/v1';

import { roleBasedLimiter } from './middleware/rateLimitMiddleware.js';

// ── Health Check endpoints ────────────────────────────────────
// API Gateway: expose health, readiness, and liveness probes
import { pool } from './config/db.js';
import redisClient from './config/redis.js';

app.get('/health', async (req, res) => {
    const health = {
        status: 'UP',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        services: {}
    };

    // Check MySQL
    try {
        await pool.query('SELECT 1');
        health.services.database = 'UP';
    } catch {
        health.services.database = 'DOWN';
        health.status = 'DEGRADED';
    }

    // Check Redis
    try {
        await redisClient.ping();
        health.services.redis = 'UP';
    } catch {
        health.services.redis = 'DOWN';
        health.status = 'DEGRADED';
    }

    const httpStatus = health.status === 'UP' ? 200 : 503;
    return res.status(httpStatus).json(health);
});

app.get('/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.status(200).json({ status: 'READY' });
    } catch {
        return res.status(503).json({ status: 'NOT_READY', reason: 'Database unavailable' });
    }
});

app.get('/live', (req, res) => res.status(200).json({ status: 'ALIVE', pid: process.pid }));

app.post(`${v1}/csp-report`, (req, res) => {
    if (req.body) {
        console.warn('CSP Violation: ', req.body);
    } else {
        console.warn('CSP Violation: No data received!');
    }
    res.status(204).end();
});

app.use(`${v1}/auth`,        authRoutes);
app.use(`${v1}/profile`,     requireAuth, roleBasedLimiter, profileRoutes);
app.use(`${v1}/students`,    requireAuth, roleBasedLimiter, studentRoutes);
app.use(`${v1}/departments`, requireAuth, roleBasedLimiter, departmentRoutes);
app.use(`${v1}/courses`,     requireAuth, roleBasedLimiter, courseRoutes);

// Backward-compatible aliases (old /api/ routes still work)
app.use('/api/auth',        authRoutes);
app.use('/api/profile',     requireAuth, roleBasedLimiter, profileRoutes);
app.use('/api/students',    requireAuth, roleBasedLimiter, studentRoutes);
app.use('/api/departments', requireAuth, roleBasedLimiter, departmentRoutes);
app.use('/api/courses',     requireAuth, roleBasedLimiter, courseRoutes);

// ── 9. 404 handler ────────────────────────────────────────────
app.use(notFound);

// ── 10. Global error handler (must be last) ───────────────────
app.use(errorHandler);

export default app;