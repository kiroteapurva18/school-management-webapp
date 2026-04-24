import express from "express";
import {
  createLeaveRequest,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus
} from "../controllers/leaveRequestController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("parent"), createLeaveRequest);
router.get("/teacher", allowRoles("teacher", "admin"), getTeacherLeaveRequests);
router.put("/:id", validateObjectId(), allowRoles("teacher", "admin"), updateLeaveRequestStatus);

export default router;
