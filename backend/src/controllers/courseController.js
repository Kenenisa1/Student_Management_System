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
        let courses = await courseModel.getAllCourses();

        // ABAC: Object-level authorization
        if (req.user.role === 'student') {
            // Must fetch which courses student is enrolled in, or just let them see all courses?
            // "Object-level authorization with deny by default" implies strict access.
            // But if they need to see course catalog, maybe it's ok?
            // Actually, `userModel.findStudentCoursesWithGrades(req.user.id)` gets their courses.
            const userModel = await import('../models/userModel.js');
            const myCourses = await userModel.findStudentCoursesWithGrades(req.user.id);
            const myCourseIds = new Set(myCourses.map(c => c.id));
            courses = courses.filter(c => myCourseIds.has(c.id));
        } else if (req.user.role === 'teacher') {
            courses = courses.filter(c => c.instructor_id === req.user.id);
        }

        res.json({
            success: true,
            data: courses
        });

    } catch (error) {
        console.error('[courseController.getAllCourses]', error.message, error.sqlMessage || '');
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
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

        // ABAC: Object-level authorization
        if (req.user.role === 'teacher' && course.instructor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have access to this course."
            });
        }
        
        if (req.user.role === 'student') {
            const userModel = await import('../models/userModel.js');
            const myCourses = await userModel.findStudentCoursesWithGrades(req.user.id);
            const isEnrolled = myCourses.some(c => c.id === course.id);
            if (!isEnrolled) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not enrolled in this course."
                });
            }
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