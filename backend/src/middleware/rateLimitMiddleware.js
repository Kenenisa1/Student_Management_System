import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

/**
 * General API rate limiter (Unauthenticated or Basic IPs)
 */
export const generalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
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
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
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

/**
 * Role-based Rate Limiter (Applied AFTER auth)
 * Admin: 1000/min, Teacher: 500/min, Student: 100/min
 */
export const roleBasedLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:role:'
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req) => {
        if (!req.user) return 100;
        if (req.user.role === 'superadmin' || req.user.role === 'admin') return 1000;
        if (req.user.role === 'teacher') return 500;
        return 100; // Student
    },
    keyGenerator: (req) => {
        return req.user ? req.user.id.toString() : req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'API rate limit exceeded for your role.'
    }
});
