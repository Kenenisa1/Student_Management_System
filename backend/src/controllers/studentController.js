/**
 * =====================================================
 * studentController.js
 * =====================================================
 * Clean Code refactor:
 *  - All handlers use async/await + next(err) pattern
 *  - Errors thrown via custom error classes (AppError)
 *  - DRY: shared ABAC checks extracted into helpers
 *  - No direct res.status(500) scattered throughout
 * =====================================================
 */

import * as studentModel from '../models/studentModel.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE ABAC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the set of student IDs a teacher is allowed to see */
const getTeacherStudentIds = async (teacherId) => {
    const students = await studentModel.getStudentsByTeacherId(teacherId);
    return new Set(students.map(s => s.id));
};

/** Throw 403 if a student is accessing another student's record */
const assertStudentOwnership = (requestingUser, targetId) => {
    if (requestingUser.role === 'student' && requestingUser.id !== parseInt(targetId, 10)) {
        throw new ForbiddenError('You can only view your own profile.');
    }
};

/** Throw 403 if a teacher is accessing a student not in their courses */
const assertTeacherStudentAccess = async (teacher, student) => {
    if (teacher.role !== 'teacher') return;
    const allowedIds = await getTeacherStudentIds(teacher.id);
    if (!allowedIds.has(student.id)) {
        throw new ForbiddenError('Student is not enrolled in your courses.');
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/students — Create student */
export const createStudent = async (req, res, next) => {
    try {
        const result = await studentModel.createStudent(req.body);
        return res.status(201).json({ success: true, message: 'Student created successfully.', id: result.insertId });
    } catch (err) { next(err); }
};

/** GET /api/students — List all (ABAC filtered) */
export const getAllStudents = async (req, res, next) => {
    try {
        const students = req.user.role === 'teacher'
            ? await studentModel.getStudentsByTeacherId(req.user.id)
            : await studentModel.getAllStudents();

        return res.json({ success: true, data: students });
    } catch (err) { next(err); }
};

/** GET /api/students/:id — Get one (ABAC checked) */
export const getStudentById = async (req, res, next) => {
    try {
        assertStudentOwnership(req.user, req.params.id);

        const student = await studentModel.getStudentById(req.params.id);
        if (!student) throw new NotFoundError('Student');

        await assertTeacherStudentAccess(req.user, student);

        return res.json({ success: true, data: student });
    } catch (err) { next(err); }
};

/** PUT /api/students/:id — Update student */
export const updateStudent = async (req, res, next) => {
    try {
        const result = await studentModel.updateStudent(req.params.id, req.body);
        if (result.affectedRows === 0) throw new NotFoundError('Student');
        return res.json({ success: true, message: 'Student updated successfully.' });
    } catch (err) { next(err); }
};

/** DELETE /api/students/:id — Soft delete student */
export const deleteStudent = async (req, res, next) => {
    try {
        const result = await studentModel.deleteStudent(req.params.id);
        if (result.affectedRows === 0) throw new NotFoundError('Student');
        return res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (err) { next(err); }
};

/** POST /api/students/:id/courses — Assign course */
export const assignCourse = async (req, res, next) => {
    try {
        const { course_id } = req.body;
        if (!course_id) throw new ValidationError('course_id is required.');
        await studentModel.assignCourseToStudent(req.params.id, course_id);
        return res.status(201).json({ success: true, message: 'Course assigned successfully.' });
    } catch (err) { next(err); }
};

/** GET /api/students/department/:deptId — Students by department */
export const getStudentsByDepartment = async (req, res, next) => {
    try {
        const students = await studentModel.getStudentsByDepartment(req.params.deptId);
        return res.json({ success: true, data: students });
    } catch (err) { next(err); }
};

/** GET /api/students/count — Active students count */
export const getStudentsCount = async (req, res, next) => {
    try {
        const count = await studentModel.getActiveStudentsCount();
        return res.json({ success: true, count });
    } catch (err) { next(err); }
};