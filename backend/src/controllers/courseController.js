/**
 * =====================================================
 * courseController.js
 * =====================================================
 * Clean Code refactor:
 *  - All handlers use async/await + next(err) pattern
 *  - Errors thrown via custom error classes
 *  - DRY: ABAC access checks extracted into helpers
 * =====================================================
 */

import * as courseModel from '../models/courseModel.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE ABAC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Throw 403 if teacher doesn't own the course */
const assertTeacherCourseAccess = (user, course) => {
    if (user.role === 'teacher' && course.instructor_id !== user.id) {
        throw new ForbiddenError('You do not have access to this course.');
    }
};

/** Throw 403 if student is not enrolled in the course */
const assertStudentEnrollment = async (userId, course) => {
    const { findStudentCoursesWithGrades } = await import('../models/userModel.js');
    const enrolled = await findStudentCoursesWithGrades(userId);
    const isEnrolled = enrolled.some(c => c.id === course.id);
    if (!isEnrolled) throw new ForbiddenError('You are not enrolled in this course.');
};

/** Apply ABAC filtering for course list by role */
const filterCoursesByRole = async (courses, user) => {
    if (user.role === 'teacher') {
        return courses.filter(c => c.instructor_id === user.id);
    }
    if (user.role === 'student') {
        const { findStudentCoursesWithGrades } = await import('../models/userModel.js');
        const myCourses = await findStudentCoursesWithGrades(user.id);
        const myIds = new Set(myCourses.map(c => c.id));
        return courses.filter(c => myIds.has(c.id));
    }
    return courses; // admin / superadmin see all
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/courses */
export const createCourse = async (req, res, next) => {
    try {
        const result = await courseModel.createCourse(req.body);
        return res.status(201).json({ success: true, message: 'Course created successfully.', id: result.insertId });
    } catch (err) { next(err); }
};

/** GET /api/courses */
export const getAllCourses = async (req, res, next) => {
    try {
        const allCourses = await courseModel.getAllCourses();
        const courses    = await filterCoursesByRole(allCourses, req.user);
        return res.json({ success: true, data: courses });
    } catch (err) { next(err); }
};

/** GET /api/courses/:id */
export const getCourseById = async (req, res, next) => {
    try {
        const course = await courseModel.getCourseById(req.params.id);
        if (!course) throw new NotFoundError('Course');

        assertTeacherCourseAccess(req.user, course);
        if (req.user.role === 'student') await assertStudentEnrollment(req.user.id, course);

        return res.json({ success: true, data: course });
    } catch (err) { next(err); }
};

/** PUT /api/courses/:id */
export const updateCourse = async (req, res, next) => {
    try {
        const result = await courseModel.updateCourse(req.params.id, req.body);
        if (result.affectedRows === 0) throw new NotFoundError('Course');
        return res.json({ success: true, message: 'Course updated successfully.' });
    } catch (err) { next(err); }
};

/** DELETE /api/courses/:id */
export const deleteCourse = async (req, res, next) => {
    try {
        const result = await courseModel.deleteCourse(req.params.id);
        if (result.affectedRows === 0) throw new NotFoundError('Course');
        return res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (err) { next(err); }
};