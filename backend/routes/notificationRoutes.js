import express from "express";
import { createNotification, getNotifications } from "../controllers/notificationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("teacher", "admin"), createNotification);
router.get("/", allowRoles("student", "parent", "teacher", "admin"), getNotifications);

export default router;
