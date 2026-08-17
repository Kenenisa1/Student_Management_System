import validator from 'validator';

/**
 * validationMiddleware.js
 * ─────────────────────────────────────────────────────────────────────
 * Input validation for student CRUD endpoints.
 * Uses parameterized queries (via mysql2) so this is an extra layer —
 * not a substitute for prepared statements.
 */

// Patterns that look like SQL injection attempts
const SQL_INJECTION_PATTERN = /('|--|;|\/\*|\*\/|xp_|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+.*SET)/i;

export const validateStudent = (req, res, next) => {
    const { name, email, phone, department_id } = req.body;

    // Required fields
    if (!name || !String(name).trim()) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'name' is required."
        });
    }
    if (!email || !String(email).trim()) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'email' is required."
        });
    }

    // Email format
    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'email' must be a valid email address."
        });
    }

    // Name length
    if (String(name).trim().length < 2 || String(name).trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'name' must be between 2 and 100 characters."
        });
    }

    // Phone format (optional)
    if (phone && !validator.isMobilePhone(String(phone), 'any', { strictMode: false })) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'phone' must be a valid phone number."
        });
    }

    // Department ID must be a positive integer if provided
    if (department_id !== undefined && department_id !== null && department_id !== '') {
        const deptNum = Number(department_id);
        if (!Number.isInteger(deptNum) || deptNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: 'department_id' must be a positive integer."
            });
        }
    }

    // Injection pattern check (defence-in-depth — parameterized queries are the primary protection)
    const fieldsToCheck = [name, email, phone].filter(Boolean).map(String);
    for (const field of fieldsToCheck) {
        if (SQL_INJECTION_PATTERN.test(field)) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error: Input contains disallowed characters or patterns.'
            });
        }
    }

    next();
};
