/**
 * studentRoutes.js
 * ─────────────────────────────────────────────────────────────────────
 * ABAC / RBAC matrix:
 *   GET    /api/students        → admin, superadmin, teacher (ABAC: teachers see only their students)
 *   GET    /api/students/:id    → admin, superadmin, teacher, student (ABAC: own record only for students)
 *   POST   /api/students        → admin, superadmin
 *   PUT    /api/students/:id    → admin, superadmin
 *   DELETE /api/students/:id    → admin, superadmin
 *   POST   /api/students/:id/courses → admin, superadmin
 * All routes guarded by requireAuth + roleBasedLimiter in app.js.
 */

import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { validate, schemas }   from '../middleware/validationMiddleware.js';
import { requireRoles }        from '../middleware/authMiddleware.js';
import { cacheMiddleware }     from '../middleware/cacheMiddleware.js';

const router = express.Router();

const adminOnly    = requireRoles('admin', 'superadmin');
const staffOrAdmin = requireRoles('admin', 'superadmin', 'teacher');
const allRoles     = requireRoles('admin', 'superadmin', 'teacher', 'student');

// ── READ ──────────────────────────────────────────────────────
router.get('/',                   staffOrAdmin, cacheMiddleware(60),  studentController.getAllStudents);
router.get('/count',              staffOrAdmin, cacheMiddleware(300), studentController.getStudentsCount);
router.get('/department/:deptId', staffOrAdmin, cacheMiddleware(60),  studentController.getStudentsByDepartment);
router.get('/:id',                allRoles,                           studentController.getStudentById);

// ── WRITE ─────────────────────────────────────────────────────
router.post('/',            adminOnly, validate(schemas.student), studentController.createStudent);
router.put('/:id',          adminOnly, validate(schemas.student), studentController.updateStudent);
router.delete('/:id',       adminOnly,                            studentController.deleteStudent);
router.post('/:id/courses', adminOnly,                            studentController.assignCourse);

export default router;