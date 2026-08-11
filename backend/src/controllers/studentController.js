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


        const student =
            await studentModel.getStudentById(
                req.params.id
            );



        if(!student){

            return res.status(404).json({

                message:"Student not found"

            });

        }



        res.json(student);



    }catch(error){


        res.status(500).json({

            message:error.message

        });

    }

};





/**
 * UPDATE STUDENT
 * PUT /api/students/:id
 */

export const updateStudent=async(req,res)=>{


    try{


        const result = await studentModel.updateStudent(
            req.params.id,
            req.body
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }



        res.json({

            message:"Student updated successfully"

        });



    }catch(error){


        res.status(500).json({

            message:error.message

        });


    }

};





/**
 * DELETE STUDENT
 * DELETE /api/students/:id
 */

export const deleteStudent=async(req,res)=>{


    try{


        const result = await studentModel.deleteStudent(
            req.params.id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }



        res.json({

            message:"Student deleted successfully"

        });



    }catch(error){


        res.status(500).json({

            message:error.message

        });

    }

};