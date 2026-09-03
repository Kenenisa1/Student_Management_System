import { pool } from "../config/db.js";

// CREATE DEPARTMENT
const createDepartment = async (department) => {
    const sql = `INSERT INTO departments (name) VALUES (?)`;
    const [result] = await pool.execute(sql, [department.name]);
    return result;
};

// GET ALL DEPARTMENTS
const getAllDepartments = async () => {
    const sql = `
        SELECT
            d.id,
            d.name,
            COUNT(DISTINCT CASE WHEN s.is_deleted = false THEN s.id END) AS student_count,
            COUNT(DISTINCT CASE WHEN s.is_deleted = false THEN s.id END) AS students,
            COUNT(DISTINCT c.id) AS course_count,
            COUNT(DISTINCT c.id) AS courses_count
        FROM departments d
        LEFT JOIN students s ON d.id = s.department_id
        LEFT JOIN courses c ON d.id = c.department_id
        GROUP BY d.id
        ORDER BY d.id ASC
    `;
    const [rows] = await pool.execute(sql);
    return rows;
};

// GET DEPARTMENT BY ID
const getDepartmentById = async (id) => {
    const sql = `
        SELECT
            d.id,
            d.name,
            COUNT(DISTINCT CASE WHEN s.is_deleted = false THEN s.id END) AS student_count,
            COUNT(DISTINCT CASE WHEN s.is_deleted = false THEN s.id END) AS students,
            COUNT(DISTINCT c.id) AS course_count,
            COUNT(DISTINCT c.id) AS courses_count
        FROM departments d
        LEFT JOIN students s ON d.id = s.department_id
        LEFT JOIN courses c ON d.id = c.department_id
        WHERE d.id = ?
        GROUP BY d.id
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
};

// UPDATE DEPARTMENT
const updateDepartment = async (id, department) => {
    const sql = `UPDATE departments SET name=? WHERE id=?`;
    const [result] = await pool.execute(sql, [department.name, id]);
    return result;
};

// DELETE DEPARTMENT
const deleteDepartment = async (id) => {
    const [result] = await pool.execute("DELETE FROM departments WHERE id=?", [id]);
    return result;
};

export {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};

