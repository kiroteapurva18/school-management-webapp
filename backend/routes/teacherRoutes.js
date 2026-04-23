import express from "express";
import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher
} from "../controllers/teacherController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getTeachers)
  .post(authorizeRoles("admin"), createTeacher);

router.route("/:id")
  .get(validateObjectId(), getTeacherById)
  .put(validateObjectId(), authorizeRoles("admin"), updateTeacher)
  .delete(validateObjectId(), authorizeRoles("admin"), deleteTeacher);

export default router;
