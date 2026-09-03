/**
 * =====================================================
 * errors.js — Custom Error Classes
 * =====================================================
 * Provides structured, descriptive error types so
 * the global error handler can set the correct HTTP
 * status code and keep internal details off the wire.
 *
 * Usage:
 *   throw new AppError('Not found', 404);
 *   throw new ValidationError('Email is required');
 *   throw new AuthError('Invalid credentials');
 * =====================================================
 */

/**
 * Base application error — carries an HTTP status code.
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.name       = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational; // false = programmer error (bug)
        Error.captureStackTrace(this, this.constructor);
    }
}

/** 400 — Validation failed */
export class ValidationError extends AppError {
    constructor(message = 'Validation failed.') {
        super(message, 400);
    }
}

/** 401 — Not authenticated */
export class AuthError extends AppError {
    constructor(message = 'Authentication required.') {
        super(message, 401);
    }
}

/** 403 — Not authorised */
export class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action.') {
        super(message, 403);
    }
}

/** 404 — Resource missing */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found.`, 404);
    }
}

/** 409 — Conflict (e.g. duplicate) */
export class ConflictError extends AppError {
    constructor(message = 'A conflict occurred with existing data.') {
        super(message, 409);
    }
}

/** 423 — Account locked */
export class AccountLockedError extends AppError {
    constructor(minutesLeft) {
        super(
            `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
            403
        );
    }
}

/** 429 — Rate limit hit */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests. Please slow down.') {
        super(message, 429);
    }
}
