/**
 * =====================================================
 * errorMiddleware.js — Global Error Handler
 * =====================================================
 * Must be the LAST middleware added to Express.
 * Uses custom AppError classes to set correct HTTP
 * status codes while NEVER leaking internals.
 * =====================================================
 */

import { AppError } from '../utils/errors.js';

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Map well-known DB / library error codes → AppError ────────
const normalizeError = (err) => {
    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        const field = err.sqlMessage?.match(/key '(.+)'/)?.[1] ?? 'field';
        return new AppError(`Duplicate value for ${field}.`, 409);
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
        return new AppError('Session expired. Please log in again.', 401);
    }

    // JWT malformed / invalid
    if (err.name === 'JsonWebTokenError') {
        return new AppError('Invalid authentication token.', 401);
    }

    // BullMQ / Redis connection — don't surface to the client
    if (err.code === 'ECONNREFUSED') {
        return new AppError('Service temporarily unavailable.', 503, false);
    }

    return err;
};

// ── Safe client-facing message ─────────────────────────────────
const clientMessage = (err) => {
    if (!IS_PROD) return err.message;               // dev: full detail
    if (err.isOperational) return err.message;       // expected: show it
    return 'An unexpected error occurred. Please try again.'; // bug: hide it
};

// ── The handler ────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const normalized = normalizeError(err);

    const statusCode = normalized.statusCode || normalized.status || 500;
    const message    = clientMessage(normalized);

    // Structured server-side log
    console.error('[ERROR]', {
        timestamp: new Date().toISOString(),
        method:    req.method,
        url:       req.originalUrl,
        status:    statusCode,
        name:      normalized.name,
        message:   normalized.message,
        stack:     IS_PROD ? undefined : normalized.stack,
    });

    res.status(statusCode).json({
        success: false,
        message,
        // Only include error name in development to aid debugging
        ...(IS_PROD ? {} : { error: normalized.name }),
    });
};

export default errorHandler;