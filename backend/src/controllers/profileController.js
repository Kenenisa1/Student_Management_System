/**
 * =====================================================
 * profileController.js
 * =====================================================
 * Clean Code refactor:
 *  - All handlers use async/await + next(err)
 *  - Validation moved to Joi schema in route layer
 *  - ABAC course ownership check extracted to helper
 * =====================================================
 */

import * as userModel  from '../models/userModel.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─── Helper: fetch courses based on role ──────────────────────
const fetchUserCourses = async (role, id) => {
    if (role === 'student') return userModel.findStudentCoursesWithGrades(id);
    if (role === 'teacher') return userModel.findTeacherCoursesWithStudents(id);
    return [];
};

// ─── Helper: format user profile payload ─────────────────────
const formatProfile = (user) => ({
    id:            user.id,
    name:          user.name,
    email:         user.email,
    phone:         user.phone || null,
    role:          user.role,
    department_id: user.department_id,
    created_at:    user.created_at,
});

// ─── GET /api/profile/me ──────────────────────────────────────
export const getMyProfile = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const user = await userModel.findUserById(role, id);
        if (!user) throw new NotFoundError('User');

        const courses = await fetchUserCourses(role, id);
        return res.json({ success: true, profile: formatProfile(user), courses });
    } catch (err) { next(err); }
};

// ─── PUT /api/profile/me ──────────────────────────────────────
// Only students update their own profile here; body validated by Joi
export const updateMyProfile = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        if (role !== 'student') {
            throw new ForbiddenError('Only students can update their profile here.');
        }

        const { name, phone } = req.body;
        await userModel.updateStudentProfile(id, { name: name.trim(), phone });
        const updated = await userModel.findUserById('student', id);

        return res.json({ success: true, message: 'Profile updated successfully.', profile: formatProfile(updated) });
    } catch (err) { next(err); }
};

// ─── POST /api/profile/grades ─────────────────────────────────
// Body validated by Joi schema.grade; ABAC ensures teacher owns the course
export const submitGrade = async (req, res, next) => {
    try {
        const { role, id: teacherId } = req.user;
        const { student_id, course_id, grade, letter_grade } = req.body;

        // ABAC: teacher must teach the course
        if (role === 'teacher') {
            const { getCourseById } = await import('../models/courseModel.js');
            const course = await getCourseById(Number(course_id));
            if (!course || course.instructor_id !== teacherId) {
                throw new ForbiddenError('You are not the instructor for this course.');
            }
        }

        await userModel.upsertGrade({
            studentId:   Number(student_id),
            courseId:    Number(course_id),
            grade:       parseFloat(grade),
            letterGrade: letter_grade || null,
            gradedBy:    teacherId,
        });

        return res.status(201).json({ success: true, message: 'Grade submitted successfully.' });
    } catch (err) { next(err); }
};
