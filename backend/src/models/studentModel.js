/**
 * =====================================================
 * studentModel.js
 * -----------------------------------------------------
 * Purpose:
 * Handle all database operations for students table.
 *
 * Responsibilities:
 * - Insert student
 * - Get students
 * - Get student by ID
 * - Update student
 * - Delete student
 * =====================================================
 */


// Import database connection pool
import { pool } from "../config/db.js";



/**
 * =====================================================
 * CREATE STUDENT
 * =====================================================
 *
 * Insert new student into database
 *
 */

const createStudent = async(student)=>{


    const sql = `
        INSERT INTO students
        (name,email,phone,department_id)

        VALUES (?,?,?,?)
    `;


    const values=[
        student.name,
        student.email,
        student.phone,
        student.department_id
    ];



    const [result] = await pool.execute(
        sql,
        values
    );


    return result;

};





/**
 * =====================================================
 * GET ALL STUDENTS
 * =====================================================
 */

const getAllStudents = async()=>{


    const [rows] = await pool.execute(
        "SELECT * FROM students WHERE is_deleted = false"
    );


    return rows;

};





/**
 * =====================================================
 * GET STUDENT BY ID
 * =====================================================
 */

const getStudentById = async(id)=>{


    const [rows] = await pool.execute(
        "SELECT * FROM students WHERE id=? AND is_deleted = false",
        [id]
    );


    return rows[0];

};





/**
 * =====================================================
 * UPDATE STUDENT
 * =====================================================
 */

const updateStudent = async(id,student)=>{


    const sql=`
        UPDATE students
        SET name=?,
            email=?,
            phone=?,
            department_id=?
        WHERE id=? AND is_deleted = false
    `;

    const values=[
        student.name,
        student.email,
        student.phone,
        student.department_id,
        id
    ];



    const [result]=await pool.execute(

        sql,

        values

    );


    return result;

};





/**
 * =====================================================
 * DELETE STUDENT
 * =====================================================
 */

const deleteStudent=async(id)=>{


    const [result]=await pool.execute(
        "UPDATE students SET is_deleted = true WHERE id=?",
        [id]
    );


    return result;

};

/**
 * =====================================================
 * ASSIGN COURSE TO STUDENT
 * =====================================================
 */
const assignCourseToStudent = async (studentId, courseId) => {
    const sql = `INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)`;
    const [result] = await pool.execute(sql, [studentId, courseId]);
    return result;
};

/**
 * =====================================================
 * GET STUDENTS BY DEPARTMENT
 * =====================================================
 */
const getStudentsByDepartment = async (departmentId) => {
    const [rows] = await pool.execute(
        "SELECT * FROM students WHERE department_id=? AND is_deleted = false",
        [departmentId]
    );
    return rows;
};

/**
 * =====================================================
 * GET ACTIVE STUDENTS COUNT
 * =====================================================
 */
const getActiveStudentsCount = async () => {
    const [rows] = await pool.execute(
        "SELECT COUNT(*) as count FROM students WHERE is_deleted = false"
    );
    return rows[0].count;
};





// Export functions
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