import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment
} from "../controllers/assignmentController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getAssignments)
  .post(authorizeRoles("admin", "teacher"), createAssignment);

router.route("/:id")
  .put(validateObjectId(), authorizeRoles("admin", "teacher"), updateAssignment)
  .delete(validateObjectId(), authorizeRoles("admin", "teacher"), deleteAssignment);

export default router;
