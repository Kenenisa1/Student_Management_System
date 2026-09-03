import express from "express";
import * as departmentController from "../controllers/departmentController.js";
import { requireRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

const adminOnly = requireRoles('admin', 'superadmin');
const allAuthenticated = requireRoles('admin', 'superadmin', 'teacher', 'student');

router.post("/", adminOnly, departmentController.createDepartment);
router.get("/", allAuthenticated, departmentController.getAllDepartments);
router.get("/:id", allAuthenticated, departmentController.getDepartmentById);
router.put("/:id", adminOnly, departmentController.updateDepartment);
router.delete("/:id", adminOnly, departmentController.deleteDepartment);

export default router;
