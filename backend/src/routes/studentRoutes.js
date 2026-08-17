/**
 * studentRoutes.js
 * ─────────────────────────────────────────────────────────────────────
 * Role-based access control (RBAC):
 *   GET  /api/students        → admin, superadmin, teacher
 *   GET  /api/students/:id    → admin, superadmin, teacher, OR the student themselves
 *   POST /api/students        → admin, superadmin only
 *   PUT  /api/students/:id    → admin, superadmin only
 *   DELETE /api/students/:id  → admin, superadmin only
 * All routes already guarded by requireAuth in app.js.
 */

import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { validateStudent }    from '../middleware/validationMiddleware.js';
import { requireRoles }       from '../middleware/authMiddleware.js';

const router = express.Router();

const adminOnly    = requireRoles('admin', 'superadmin');
const staffOrAdmin = requireRoles('admin', 'superadmin', 'teacher');

// ── READ (admin + teacher) ────────────────────────────────────
router.get('/',                   staffOrAdmin, studentController.getAllStudents);
router.get('/count',              staffOrAdmin, studentController.getStudentsCount);
router.get('/department/:deptId', staffOrAdmin, studentController.getStudentsByDepartment);
router.get('/:id',                staffOrAdmin, studentController.getStudentById);

// ── WRITE (admin + superadmin only) ──────────────────────────
router.post('/',       adminOnly, validateStudent, studentController.createStudent);
router.put('/:id',     adminOnly, validateStudent, studentController.updateStudent);
router.delete('/:id',  adminOnly, studentController.deleteStudent);

// ── Course assignment (admin or teacher) ─────────────────────
router.post('/:id/courses', staffOrAdmin, studentController.assignCourse);

export default router;