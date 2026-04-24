import express from "express";
import { getStudentFees, upsertFees } from "../controllers/feeController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/student", allowRoles("parent", "student", "admin"), getStudentFees);
router.put("/update", allowRoles("admin"), upsertFees);

export default router;
