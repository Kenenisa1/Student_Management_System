import { pool } from "../config/db.js";

// CREATE DEPARTMENT
const createDepartment = async (department) => {
    const sql = `INSERT INTO departments (name) VALUES (?)`;
    const [result] = await pool.execute(sql, [department.name]);
    return result;
};

// GET ALL DEPARTMENTS
const getAllDepartments = async () => {
    const [rows] = await pool.execute("SELECT * FROM departments");
    return rows;
};

// GET DEPARTMENT BY ID
const getDepartmentById = async (id) => {
    const [rows] = await pool.execute("SELECT * FROM departments WHERE id=?", [id]);
    return rows[0];
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
