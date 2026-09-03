import express from 'express';
import { getMyProfile, updateMyProfile, submitGrade } from '../controllers/profileController.js';
import { requireRoles } from '../middleware/authMiddleware.js';
import { validate, schemas } from '../middleware/validationMiddleware.js';

const router = express.Router();

const allAuthenticated = requireRoles('admin', 'superadmin', 'teacher', 'student');
const staffOnly        = requireRoles('admin', 'superadmin', 'teacher');

router.get('/me',      allAuthenticated,                                  getMyProfile);
router.put('/me',      allAuthenticated, validate(schemas.profileUpdate), updateMyProfile);
router.post('/grades', staffOnly,        validate(schemas.grade),         submitGrade);

export default router;
