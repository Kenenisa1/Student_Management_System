import { pool } from "../config/db.js";

// ============================================================
// CREATE COURSE
// ============================================================

const createCourse = async (course) => {
    const sql = `
        INSERT INTO courses
        (name, code, department_id, instructor, credits, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        course.name,
        course.code,
        course.department_id || null,
        course.instructor_id || course.instructor || null,
        course.credits ? Number(course.credits) : 3,
        course.description || course.desc || null
    ];

    const [result] = await pool.execute(sql, values);

    return result;
};


// ============================================================
// GET ALL COURSES
// ============================================================

const getAllCourses = async () => {

    const sql = `
        SELECT
            c.id,
            c.name,
            c.code,
            c.department_id,
            c.instructor_id,
            st.name AS instructor,
            c.credits,
            c.description,
            c.description AS course_description,
            d.name AS department_name,
            COUNT(
                DISTINCT CASE
                    WHEN s.is_deleted = false
                    THEN sc.student_id
                END
            ) AS enrolled
        FROM courses c
        LEFT JOIN departments d
            ON c.department_id = d.id
        LEFT JOIN staff st
            ON c.instructor_id = st.id
        LEFT JOIN student_courses sc
            ON c.id = sc.course_id
        LEFT JOIN students s
            ON sc.student_id = s.id
        GROUP BY c.id
        ORDER BY c.id DESC
    `;

    const [rows] = await pool.execute(sql);

    return rows;
};


// ============================================================
// GET COURSE BY ID
// ============================================================

const getCourseById = async (id) => {

    const sql = `
        SELECT
            c.id,
            c.name,
            c.code,
            c.department_id,
            c.instructor_id,
            st.name AS instructor,
            c.credits,
            c.description,
            c.description AS course_description,
            d.name AS department_name,
            COUNT(
                DISTINCT CASE
                    WHEN s.is_deleted = false
                    THEN sc.student_id
                END
            ) AS enrolled
        FROM courses c
        LEFT JOIN departments d
            ON c.department_id = d.id
        LEFT JOIN staff st
            ON c.instructor_id = st.id
        LEFT JOIN student_courses sc
            ON c.id = sc.course_id
        LEFT JOIN students s
            ON sc.student_id = s.id
        WHERE c.id = ?
        GROUP BY c.id
    `;

    const [rows] = await pool.execute(sql, [id]);

    return rows[0] || null;
};


// ============================================================
// UPDATE COURSE
// ============================================================

const updateCourse = async (id, course) => {

    const sql = `
        UPDATE courses
        SET
            name = ?,
            code = ?,
            department_id = ?,
            instructor_id = ?,
            credits = ?,
            description = ?
        WHERE id = ?
    `;

    const values = [
        course.name,
        course.code,
        course.department_id || null,
        course.instructor_id || course.instructor || null,
        course.credits ? Number(course.credits) : 3,
        course.description || course.desc || null,
        id
    ];

    const [result] = await pool.execute(sql, values);

    return result;
};


// ============================================================
// DELETE COURSE
// ============================================================

const deleteCourse = async (id) => {

    const [result] = await pool.execute(
        "DELETE FROM courses WHERE id = ?",
        [id]
    );

    return result;
};


// ============================================================
// EXPORT
// ============================================================

export {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};