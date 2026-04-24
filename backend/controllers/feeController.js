import Fee from "../models/Fee.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getStudentFees = asyncHandler(async (req, res) => {
  const studentId = req.user.role === "parent" ? req.query.studentId : req.user._id;
  const fee = await Fee.findOne({ studentId });
  if (!fee) {
    return res.json({
      studentId,
      examFees: 800,
      pendingFees: 0,
      status: "Pending",
      totalDue: 800
    });
  }
  res.json({
    ...fee.toObject(),
    totalDue: Number(fee.examFees || 0) + Number(fee.pendingFees || 0)
  });
});

export const upsertFees = asyncHandler(async (req, res) => {
  const { studentId, examFees, pendingFees, status } = req.body;
  if (!studentId) {
    res.status(400);
    throw new Error("studentId is required");
  }
  const fee = await Fee.findOneAndUpdate(
    { studentId },
    {
      examFees: examFees ?? 800,
      pendingFees: pendingFees ?? 0,
      status: status || "Pending"
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({
    ...fee.toObject(),
    totalDue: Number(fee.examFees || 0) + Number(fee.pendingFees || 0)
  });
});
