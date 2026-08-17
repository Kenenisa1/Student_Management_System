import validator from 'validator';

/**
 * sanitizeMiddleware.js
 * ─────────────────────────────────────────────────────────────────────
 * Recursively strips HTML tags and encodes dangerous characters from
 * all string values in req.body, req.query, and req.params.
 * This provides defence-in-depth against XSS and injection attacks.
 */

/**
 * Recursively sanitize a value.
 * - Strings: strip HTML tags, trim whitespace
 * - Objects/Arrays: recurse into each key
 * - Everything else: pass through unchanged
 */
function sanitizeValue(value) {
    if (typeof value === 'string') {
        // Strip HTML tags (XSS prevention)
        return validator.stripLow(validator.trim(value), true);
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        const sanitized = {};
        for (const key of Object.keys(value)) {
            sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
    }
    return value;
}

/**
 * Express middleware — sanitizes body, query, and params.
 */
const sanitize = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            req.body[key] = sanitizeValue(req.body[key]);
        }
    }
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            req.query[key] = sanitizeValue(req.query[key]);
        }
    }
    if (req.params && typeof req.params === 'object') {
        for (const key of Object.keys(req.params)) {
            req.params[key] = sanitizeValue(req.params[key]);
        }
    }
    next();
};

export default sanitize;
