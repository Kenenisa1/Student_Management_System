/**
 * errorMiddleware.js
 * ─────────────────────────────────────────────────────────────────────
 * Global error handler — must have 4 parameters so Express recognises it.
 * NEVER leaks SQL messages, stack traces, or internal details to the client.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const errorHandler = (err, req, res, next) => {
    // Structured internal logging (server-side only)
    console.error('[ERROR]', {
        timestamp: new Date().toISOString(),
        method:    req.method,
        url:       req.originalUrl,
        message:   err.message,
        code:      err.code || null,
        // Only log stack in development
        stack:     IS_PROD ? undefined : err.stack
    });

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || err.status || 500;

    // Determine client-facing message — never expose DB internals
    let clientMessage = 'Internal Server Error. Please try again.';

    if (statusCode === 400) clientMessage = err.message || 'Bad request.';
    if (statusCode === 401) clientMessage = err.message || 'Unauthorized.';
    if (statusCode === 403) clientMessage = err.message || 'Forbidden.';
    if (statusCode === 404) clientMessage = err.message || 'Resource not found.';
    if (statusCode === 409) clientMessage = err.message || 'Conflict.';
    // 500+ always use generic message to prevent info leakage
    if (statusCode >= 500)  clientMessage = 'An unexpected error occurred. Please try again.';

    res.status(statusCode).json({
        success: false,
        message: clientMessage
    });
};

export default errorHandler;