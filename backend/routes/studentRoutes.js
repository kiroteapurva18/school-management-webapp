import express from "express";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent
} from "../controllers/studentController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getStudents)
  .post(authorizeRoles("admin", "teacher"), createStudent);

router.route("/:id")
  .get(validateObjectId(), getStudentById)
  .put(validateObjectId(), authorizeRoles("admin", "teacher"), updateStudent)
  .delete(validateObjectId(), authorizeRoles("admin"), deleteStudent);

export default router;
