import express from "express";
import { createHomework, getHomework, uploadHomeworkSubmission } from "../controllers/homeworkController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { homeworkPdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", allowRoles("teacher"), createHomework);
router.get("/", allowRoles("student", "teacher"), getHomework);
router.post("/upload", allowRoles("student"), homeworkPdfUpload.single("file"), uploadHomeworkSubmission);

export default router;
