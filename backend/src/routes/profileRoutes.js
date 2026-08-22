import express from 'express';
import { getMyProfile, updateMyProfile, submitGrade } from '../controllers/profileController.js';
import { requireRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

const allAuthenticated = requireRoles('admin', 'superadmin', 'teacher', 'student');
const staffOnly = requireRoles('admin', 'superadmin', 'teacher');

// GET  /api/profile/me  — returns user profile + courses/grades
router.get('/me', allAuthenticated, getMyProfile);

// PUT  /api/profile/me  — update student profile (name, phone)
router.put('/me', allAuthenticated, updateMyProfile);

// POST /api/profile/grades  — teacher submits/updates a grade
router.post('/grades', staffOnly, submitGrade);

export default router;
