import express from "express";
import * as courseController from "../controllers/courseController.js";
import { requireRoles } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

const adminOnly = requireRoles('admin', 'superadmin');
const staffOrAdmin = requireRoles('admin', 'superadmin', 'teacher');
const allAuthenticated = requireRoles('admin', 'superadmin', 'teacher', 'student');

// CREATE
router.post("/", adminOnly, courseController.createCourse);

// GET ALL
router.get("/", allAuthenticated, cacheMiddleware(120), courseController.getAllCourses);

// GET ONE
router.get("/:id", allAuthenticated, courseController.getCourseById);

// UPDATE
router.put("/:id", adminOnly, courseController.updateCourse);

// DELETE
router.delete("/:id", adminOnly, courseController.deleteCourse);

export default router;