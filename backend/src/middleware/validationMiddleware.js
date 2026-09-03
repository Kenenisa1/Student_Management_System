import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

/**
 * =====================================================
 * validationSchemas.js — Joi Validation Schemas
 * =====================================================
 * DRY: All input validation schemas live here.
 * Use `validate(schema)` middleware to apply them.
 * =====================================================
 */

// ── Reusable field definitions ─────────────────────────────────
const fields = {
    name:         Joi.string().trim().min(2).max(100).required(),
    email:        Joi.string().trim().email().required(),
    phone:        Joi.string().trim().min(7).max(20).optional().allow('', null),
    department_id:Joi.number().integer().positive().optional().allow(null),
    password:     Joi.string().min(12)
                      .pattern(/[A-Z]/, 'uppercase')
                      .pattern(/[a-z]/, 'lowercase')
                      .pattern(/[0-9]/, 'digit')
                      .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'special')
                      .required()
                      .messages({
                          'string.min':     'Password must be at least 12 characters.',
                          'string.pattern.name': 'Password must contain at least one {#name} character.'
                      }),
    role:         Joi.string().valid('student', 'teacher').required(),
    totpToken:    Joi.string().length(6).pattern(/^\d+$/).optional(),
};

// ── Schemas ────────────────────────────────────────────────────
export const schemas = {

    register: Joi.object({
        name:          fields.name,
        email:         fields.email,
        password:      fields.password,
        role:          fields.role,
        department_id: fields.department_id,
        phone:         fields.phone,
    }),

    login: Joi.object({
        email:      fields.email,
        password:   Joi.string().required().messages({ 'any.required': 'Password is required.' }),
        totpToken:  fields.totpToken,
    }),

    student: Joi.object({
        name:          fields.name,
        email:         fields.email,
        phone:         fields.phone,
        department_id: fields.department_id,
        course_ids:    Joi.array().items(Joi.number().integer().positive()).optional(),
    }),

    course: Joi.object({
        name:          Joi.string().trim().min(2).max(150).required(),
        code:          Joi.string().trim().min(2).max(20).required(),
        description:   Joi.string().trim().max(500).optional().allow('', null),
        credits:       Joi.number().integer().min(1).max(10).optional(),
        department_id: fields.department_id,
        instructor_id: Joi.number().integer().positive().optional().allow(null),
    }),

    grade: Joi.object({
        student_id:   Joi.number().integer().positive().required(),
        course_id:    Joi.number().integer().positive().required(),
        grade:        Joi.number().min(0).max(100).required(),
        letter_grade: Joi.string().max(3).optional().allow('', null),
    }),

    profileUpdate: Joi.object({
        name:  Joi.string().trim().min(2).max(100).optional(),
        phone: fields.phone,
    }),
};

/**
 * Factory: returns a middleware that validates req.body
 * against the provided Joi schema.
 *
 * @param {Joi.Schema} schema
 * @param {'body'|'params'|'query'} [source='body']
 */
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly:  false,  // return ALL errors at once
            stripUnknown: true,  // remove unexpected fields
        });

        if (error) {
            const messages = error.details.map(d => d.message.replace(/"/g, "'")).join('; ');
            return next(new ValidationError(messages));
        }

        // Overwrite with sanitised/coerced value
        req[source] = value;
        next();
    };
};
