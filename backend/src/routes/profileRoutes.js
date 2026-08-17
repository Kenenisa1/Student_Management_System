import express from 'express';
import { getMyProfile, updateMyProfile, submitGrade } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

// GET  /api/profile/me  — returns user profile + courses/grades
router.get('/me', getMyProfile);

// PUT  /api/profile/me  — update student profile (name, phone)
router.put('/me', updateMyProfile);

// POST /api/profile/grades  — teacher submits/updates a grade
router.post('/grades', submitGrade);

export default router;
