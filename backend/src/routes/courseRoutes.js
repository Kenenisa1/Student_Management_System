import express from "express";
import * as courseController from "../controllers/courseController.js";

const router = express.Router();

// CREATE
router.post("/", courseController.createCourse);

// GET ALL
router.get("/", courseController.getAllCourses);

// GET ONE
router.get("/:id", courseController.getCourseById);

// UPDATE
router.put("/:id", courseController.updateCourse);

// DELETE
router.delete("/:id", courseController.deleteCourse);

export default router;