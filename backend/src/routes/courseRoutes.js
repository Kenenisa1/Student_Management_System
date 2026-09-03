import express from "express";
import * as courseController from "../controllers/courseController.js";
import { requireRoles } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import { validate, schemas } from "../middleware/validationMiddleware.js";

const router = express.Router();

const adminOnly       = requireRoles('admin', 'superadmin');
const staffOrAdmin    = requireRoles('admin', 'superadmin', 'teacher');
const allAuthenticated = requireRoles('admin', 'superadmin', 'teacher', 'student');

router.post("/",    adminOnly,       validate(schemas.course), courseController.createCourse);
router.get("/",     allAuthenticated, cacheMiddleware(120),    courseController.getAllCourses);
router.get("/:id",  allAuthenticated,                          courseController.getCourseById);
router.put("/:id",  adminOnly,       validate(schemas.course), courseController.updateCourse);
router.delete("/:id", adminOnly,                               courseController.deleteCourse);

export default router;