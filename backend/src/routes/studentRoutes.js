/**
 * =====================================================
 * studentRoutes.js
 * -----------------------------------------------------
 * Purpose:
 * Define all student API endpoints.
 *
 * Routes connect:
 *
 * HTTP Request
 *        |
 *        ↓
 * Controller Function
 *
 * =====================================================
 */


// Import express router
import express from "express";


// Create router object
const router = express.Router();


// Import controller functions
import * as studentController from "../controllers/studentController.js";



/**
 * =====================================================
 * CREATE STUDENT
 * =====================================================
 *
 * HTTP Method:
 * POST
 *
 * URL:
 * /api/students
 *
 * Request Body:
 *
 * {
 *   "name":"Abebe",
 *   "email":"abebe@gmail.com",
 *   "department":"Computer Science"
 * }
 *
 */

router.post("/",studentController.createStudent);





/**
 * =====================================================
 * GET ALL STUDENTS
 * =====================================================
 *
 * HTTP Method:
 * GET
 *
 * URL:
 * /api/students
 *
 */

router.get( "/",studentController.getAllStudents);


/**
 * =====================================================
 * GET STUDENT BY ID
 * =====================================================
 *
 * HTTP Method:
 * GET
 *
 * URL:
 * /api/students/:id
 *
 * Example:
 *
 * /api/students/1
 *
 */

router.get("/:id",studentController.getStudentById);





/**
 * =====================================================
 * UPDATE STUDENT
 * =====================================================
 *
 * HTTP Method:
 * PUT
 *
 * URL:
 * /api/students/:id
 *
 * Example:
 *
 * PUT /api/students/1
 *
 */

router.put("/:id",studentController.updateStudent);





/**
 * =====================================================
 * DELETE STUDENT
 * =====================================================
 *
 * HTTP Method:
 * DELETE
 *
 * URL:
 * /api/students/:id
 *
 */

router.delete("/:id",studentController.deleteStudent);





// Export router
export default router;