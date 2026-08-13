import * as courseModel from "../models/courseModel.js";

// ============================================================
// CREATE COURSE
// POST /api/courses
// ============================================================

export const createCourse = async (req, res) => {
    try {
        const course = req.body;

        const result = await courseModel.createCourse(course);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            id: result.insertId
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET ALL COURSES
// GET /api/courses
// ============================================================

export const getAllCourses = async (req, res) => {
    try {
        const courses = await courseModel.getAllCourses();

        res.json({
            success: true,
            data: courses
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET COURSE BY ID
// GET /api/courses/:id
// ============================================================

export const getCourseById = async (req, res) => {
    try {
        const course = await courseModel.getCourseById(
            req.params.id
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            data: course
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// UPDATE COURSE
// PUT /api/courses/:id
// ============================================================

export const updateCourse = async (req, res) => {
    try {
        const result = await courseModel.updateCourse(
            req.params.id,
            req.body
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// DELETE COURSE
// DELETE /api/courses/:id
// ============================================================

export const deleteCourse = async (req, res) => {
    try {
        const result = await courseModel.deleteCourse(
            req.params.id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete course as it is assigned to students."
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};