import express from "express";
import { addFee, getAllFees, getStudentFees, payFee } from "../controllers/feeController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", allowRoles("admin"), addFee);
router.get("/", allowRoles("admin"), getAllFees);
router.get("/student/:studentId", allowRoles("parent", "student", "admin"), getStudentFees);
router.put("/:id/pay", allowRoles("admin"), payFee);

export default router;
