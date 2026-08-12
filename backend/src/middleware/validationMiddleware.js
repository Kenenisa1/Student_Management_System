/**
 * =====================================================
 * validationMiddleware.js
 * -----------------------------------------------------
 * Purpose:
 * Validate incoming request bodies for required fields.
 * =====================================================
 */

export const validateStudent = (req, res, next) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'name' and 'email' are required fields."
        });
    }

    next();
};
