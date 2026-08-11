import * as departmentModel from "../models/departmentModel.js";

// CREATE DEPARTMENT
export const createDepartment = async (req, res) => {
    try {
        const department = req.body;
        const result = await departmentModel.createDepartment(department);
        res.status(201).json({
            success: true,
            message: "Department created successfully",
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET ALL DEPARTMENTS
export const getAllDepartments = async (req, res) => {
    try {
        const departments = await departmentModel.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET DEPARTMENT BY ID
export const getDepartmentById = async (req, res) => {
    try {
        const department = await departmentModel.getDepartmentById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json(department);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE DEPARTMENT
export const updateDepartment = async (req, res) => {
    try {
        const result = await departmentModel.updateDepartment(req.params.id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json({ message: "Department updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE DEPARTMENT
export const deleteDepartment = async (req, res) => {
    try {
        // Since we have ON DELETE RESTRICT for students and courses, this will fail
        // automatically at the DB level if there are linked records, which is correct behavior.
        const result = await departmentModel.deleteDepartment(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.json({ message: "Department deleted successfully" });
    } catch (error) {
        // Catch foreign key constraint errors
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: "Cannot delete department as it contains students or courses." });
        }
        res.status(500).json({ message: error.message });
    }
};
