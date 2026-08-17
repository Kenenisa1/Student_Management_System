import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

/**
 * Verify JWT token and attach user to req.user
 */
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
    }
};

/**
 * Require specific roles
 * e.g., requireRoles('admin', 'superadmin')
 */
export const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: 'Forbidden. No role identified.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
        }
        
        next();
    };
};
