import express from "express";
import {
  deleteAttendance,
  getAttendance,
  markAttendance,
  updateAttendance
} from "../controllers/attendanceController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getAttendance)
  .post(authorizeRoles("admin", "teacher"), markAttendance);

router.route("/:id")
  .put(validateObjectId(), authorizeRoles("admin", "teacher"), updateAttendance)
  .delete(validateObjectId(), authorizeRoles("admin"), deleteAttendance);

export default router;
