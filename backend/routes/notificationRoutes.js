import express from "express";
import { createNotification, deleteNotification, getNotifications } from "../controllers/notificationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("admin"), createNotification);
router.get("/", allowRoles("student", "parent", "admin"), getNotifications);
router.delete("/:id", validateObjectId(), allowRoles("admin"), deleteNotification);

export default router;
