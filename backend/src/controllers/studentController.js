/**
 * =====================================================
 * studentController.js
 * -----------------------------------------------------
 * Purpose:
 * Handle HTTP requests and responses.
 * =====================================================
 */


import * as studentModel from "../models/studentModel.js";





/**
 * CREATE STUDENT
 * POST /api/students
 */

export const createStudent = async(req,res)=>{


    try{


        const student=req.body;



        const result =
            await studentModel.createStudent(student);


        res.status(201).json({

            success:true,

            message:"Student created successfully",

            id:result.insertId

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }

};





/**
 * GET ALL STUDENTS
 * GET /api/students
 */

export const getAllStudents=async(req,res)=>{


    try{


        const students =
            await studentModel.getAllStudents();



        res.json({

            success:true,

            data:students

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





/**
 * GET STUDENT BY ID
 * GET /api/students/:id
 */

export const getStudentById=async(req,res)=>{
    try{
        const student = await studentModel.getStudentById(req.params.id);

        if(!student){
            return res.status(404).json({
                success: false,
                message:"Student not found"
            });
        }

        res.json({
            success: true,
            data: student
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message:error.message
        });
    }
};

export const updateStudent=async(req,res)=>{
    try{
        const result = await studentModel.updateStudent(
            req.params.id,
            req.body
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message:"Student updated successfully"
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message:error.message
        });
    }
};

export const deleteStudent=async(req,res)=>{
    try{
        const result = await studentModel.deleteStudent(
            req.params.id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message:"Student deleted successfully"
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message:error.message
        });
    }
};

/**
 * ASSIGN COURSE TO STUDENT
 * POST /api/students/:id/courses
 */
export const assignCourse = async (req, res) => {
    try {
        const { course_id } = req.body;
        if (!course_id) {
            return res.status(400).json({ message: "Course ID is required" });
        }
        await studentModel.assignCourseToStudent(req.params.id, course_id);
        res.status(201).json({ message: "Course assigned successfully" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Student is already assigned to this course" });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET STUDENTS BY DEPARTMENT
 * GET /api/students/department/:deptId
 */
export const getStudentsByDepartment = async (req, res) => {
    try {
        const students = await studentModel.getStudentsByDepartment(req.params.deptId);
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET ACTIVE STUDENTS COUNT
 * GET /api/students/count
 */
export const getStudentsCount = async (req, res) => {
    try {
        const count = await studentModel.getActiveStudentsCount();
        res.json({ success: true, count: count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};