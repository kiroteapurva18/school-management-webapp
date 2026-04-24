import express from "express";
import { getStudentResults, uploadResult } from "../controllers/resultController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { resultPdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/upload", allowRoles("teacher"), resultPdfUpload.single("file"), uploadResult);
router.get("/student", allowRoles("student", "parent", "teacher", "admin"), getStudentResults);

export default router;
