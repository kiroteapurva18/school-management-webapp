import Fee from "../models/Fee.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Add a new fee
// @route   POST /api/fees
// @access  Private/Admin
export const addFee = asyncHandler(async (req, res) => {
  const { studentId, amount, dueDate } = req.body;

  if (!studentId || !amount || !dueDate) {
    res.status(400);
    throw new Error("studentId, amount, and dueDate are required");
  }

  const fee = await Fee.create({
    studentId,
    amount,
    dueDate,
    status: "Pending"
  });

  const populatedFee = await Fee.findById(fee._id).populate("studentId", "name class rollNumber email");
  res.status(201).json(populatedFee);
});

// @desc    Get all fees (for Admin)
// @route   GET /api/fees
// @access  Private/Admin
export const getAllFees = asyncHandler(async (req, res) => {
  const fees = await Fee.find()
    .populate("studentId", "name class rollNumber email")
    .sort({ createdAt: -1 });
  res.json(fees);
});

// @desc    Get fees for a student
// @route   GET /api/fees/student/:studentId
// @access  Private (Admin, Parent, Student)
export const getStudentFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const fees = await Fee.find({ studentId })
    .populate("studentId", "name class rollNumber email")
    .sort({ createdAt: -1 });
  res.json(fees);
});

// @desc    Mark fee as Paid
// @route   PUT /api/fees/:id/pay
// @access  Private/Admin
export const payFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);

  if (!fee) {
    res.status(404);
    throw new Error("Fee record not found");
  }

  fee.status = "Paid";
  fee.paidAt = new Date();
  
  const updatedFee = await fee.save();
  const populatedFee = await Fee.findById(updatedFee._id).populate("studentId", "name class rollNumber email");
  
  res.json(populatedFee);
});
