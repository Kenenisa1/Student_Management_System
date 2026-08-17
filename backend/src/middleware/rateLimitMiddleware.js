import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again in 15 minutes.'
    }
});

/**
 * Strict auth limiter — 10 requests per 15 minutes per IP.
 * Applied to /api/auth/login and /api/auth/register only.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
});
