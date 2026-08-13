import { pool } from "../config/db.js";

// CREATE COURSE
const createCourse = async (course) => {
    const sql = `
        INSERT INTO courses (name, code, department_id)
        VALUES (?, ?, ?)
    `;

    const values = [
        course.name,
        course.code,
        course.department_id
    ];

    const [result] = await pool.execute(sql, values);

    return result;
};


// GET ALL COURSES
const getAllCourses = async () => {
    const [rows] = await pool.execute(`
        SELECT *
        FROM courses
    `);

    return rows;
};


// GET COURSE BY ID
const getCourseById = async (id) => {
    const [rows] = await pool.execute(
        "SELECT * FROM courses WHERE id = ?",
        [id]
    );

    return rows[0];
};


// UPDATE COURSE
const updateCourse = async (id, course) => {
    const sql = `
        UPDATE courses
        SET name = ?, code = ?, department_id = ?
        WHERE id = ?
    `;

    const values = [
        course.name,
        course.code,
        course.department_id,
        id
    ];

    const [result] = await pool.execute(sql, values);

    return result;
};


// DELETE COURSE
const deleteCourse = async (id) => {
    const [result] = await pool.execute(
        "DELETE FROM courses WHERE id = ?",
        [id]
    );

    return result;
};


export {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};