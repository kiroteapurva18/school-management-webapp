import express from "express";
import {
  createLeaveRequest,
  getParentLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus
} from "../controllers/leaveRequestController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("parent"), createLeaveRequest);
router.get("/my", allowRoles("parent"), getParentLeaveRequests);
router.get("/teacher", allowRoles("teacher"), getTeacherLeaveRequests);
router.put("/:id", validateObjectId(), allowRoles("teacher"), updateLeaveRequestStatus);

export default router;
