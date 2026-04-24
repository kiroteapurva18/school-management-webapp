import express from "express";
import {
  createOrUpdateTimetable,
  getClassTimetable,
  getStudentTimetable,
  getTeacherUsers,
  getTeacherTimetable,
  getTimetableByDay,
  updateTimetableSlot
} from "../controllers/timetableController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("admin"), createOrUpdateTimetable);
router.put("/update", allowRoles("admin"), updateTimetableSlot);
router.get("/teachers", allowRoles("admin"), getTeacherUsers);
router.get("/student", allowRoles("student"), getStudentTimetable);
router.get("/teacher", allowRoles("teacher", "admin"), getTeacherTimetable);
router.get("/class/:className/division/:division", allowRoles("admin", "teacher", "student", "parent"), getClassTimetable);
router.get("/teacher/:teacherId", allowRoles("admin", "teacher"), getTeacherTimetable);
router.get("/day/:day", allowRoles("admin", "teacher", "student", "parent"), getTimetableByDay);

export default router;
