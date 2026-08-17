/**
 * =====================================================
 * studentModel.js
 * =====================================================
 * Purpose:
 * Handle all database operations for the students table.
 * =====================================================
 */

import { pool } from "../config/db.js";

const mapStudentRow = (row) => ({
    ...row,
    dept: row.department_name || (row.department_id ? String(row.department_id) : ''),
    courses: row.course_codes ? row.course_codes.split(', ').filter(Boolean) : []
});

// =====================================================
// CREATE STUDENT
// =====================================================

const createStudent = async (student) => {
    const sql = `
        INSERT INTO students
        (name, email, phone, department_id)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        student.name,
        student.email,
        student.phone || null,
        student.department_id || null
    ];

    const [result] = await pool.execute(sql, values);
    const studentId = result.insertId;

    // Sync courses if provided as course_ids array or course_codes array/string
    if (student.course_ids && Array.isArray(student.course_ids)) {
        for (const cid of student.course_ids) {
            await pool.execute(
                `INSERT IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)`,
                [studentId, cid]
            );
        }
    }

    return result;
};

// =====================================================
// GET ALL STUDENTS
// =====================================================

const getAllStudents = async () => {
    const sql = `
        SELECT
            s.id,
            s.name,
            s.email,
            s.phone,
            s.department_id,
            s.is_deleted,
            s.created_at,
            d.name AS department_name,
            GROUP_CONCAT(c.code ORDER BY c.code SEPARATOR ', ') AS course_codes
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN student_courses sc ON s.id = sc.student_id
        LEFT JOIN courses c ON sc.course_id = c.id
        WHERE s.is_deleted = false
        GROUP BY s.id
        ORDER BY s.id DESC
    `;

    const [rows] = await pool.execute(sql);
    return rows.map(mapStudentRow);
};

// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudentById = async (id) => {
    const sql = `
        SELECT
            s.id,
            s.name,
            s.email,
            s.phone,
            s.department_id,
            s.is_deleted,
            s.created_at,
            d.name AS department_name,
            GROUP_CONCAT(c.code ORDER BY c.code SEPARATOR ', ') AS course_codes
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN student_courses sc ON s.id = sc.student_id
        LEFT JOIN courses c ON sc.course_id = c.id
        WHERE s.id = ?
        AND s.is_deleted = false
        GROUP BY s.id
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] ? mapStudentRow(rows[0]) : null;
};

// =====================================================
// UPDATE STUDENT
// =====================================================

const updateStudent = async (id, student) => {
    const sql = `
        UPDATE students
        SET
            name = ?,
            email = ?,
            phone = ?,
            department_id = ?
        WHERE id = ?
        AND is_deleted = false
    `;

    const values = [
        student.name,
        student.email,
        student.phone || null,
        student.department_id || null,
        id
    ];

    const [result] = await pool.execute(sql, values);

    // Sync courses if provided
    if (student.course_ids && Array.isArray(student.course_ids)) {
        await pool.execute(`DELETE FROM student_courses WHERE student_id = ?`, [id]);
        for (const cid of student.course_ids) {
            await pool.execute(
                `INSERT IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)`,
                [id, cid]
            );
        }
    }

    return result;
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (id) => {
    const sql = `
        UPDATE students
        SET is_deleted = true
        WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [id]);

    return result;
};

// =====================================================
// ASSIGN COURSE TO STUDENT
// =====================================================

const assignCourseToStudent = async (studentId, courseId) => {
    const sql = `
        INSERT INTO student_courses
        (student_id, course_id)
        VALUES (?, ?)
    `;

    const [result] = await pool.execute(
        sql,
        [studentId, courseId]
    );

    return result;
};

// =====================================================
// GET STUDENTS BY DEPARTMENT
// =====================================================

const getStudentsByDepartment = async (departmentId) => {
    const sql = `
        SELECT
            s.id,
            s.name,
            s.email,
            s.phone,
            s.department_id,
            s.is_deleted,
            s.created_at,
            d.name AS department_name,
            GROUP_CONCAT(c.code ORDER BY c.code SEPARATOR ', ') AS course_codes
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN student_courses sc ON s.id = sc.student_id
        LEFT JOIN courses c ON sc.course_id = c.id
        WHERE s.department_id = ?
        AND s.is_deleted = false
        GROUP BY s.id
    `;

    const [rows] = await pool.execute(sql, [departmentId]);
    return rows.map(mapStudentRow);
};

// =====================================================
// GET ACTIVE STUDENTS COUNT
// =====================================================

const getActiveStudentsCount = async () => {
    const sql = `
        SELECT COUNT(*) AS count
        FROM students
        WHERE is_deleted = false
    `;

    const [rows] = await pool.execute(sql);

    return rows[0].count;
};

// =====================================================
// EXPORT
// =====================================================

export {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    assignCourseToStudent,
    getStudentsByDepartment,
    getActiveStudentsCount
};