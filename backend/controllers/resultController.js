import Result from "../models/Result.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";

export const uploadResult = asyncHandler(async (req, res) => {
  const { studentId, class: className, division, percentage } = req.body;
  if (!className || !division || !req.file) {
    res.status(400);
    throw new Error("class, division and result PDF are required");
  }

  const result = await Result.create({
    studentId: studentId || undefined,
    class: className.trim(),
    division: mapDivision(division),
    percentage: percentage !== undefined ? Number(percentage) : undefined,
    resultPdfUrl: `/uploads/results/${req.file.filename}`,
    uploadedBy: req.user._id
  });

  res.status(201).json(result);
});

export const getStudentResults = asyncHandler(async (req, res) => {
  let className = req.user.className;
  let division = req.user.division;

  if (req.user.role === "parent") {
    className = req.user.childClass;
    division = req.user.childDivision;
  }

  const query = {};
  if (req.user.role === "student" || req.user.role === "parent") {
    query.class = className;
    query.division = mapDivision(division);
  }
  if (req.user.role === "student") query.$or = [{ studentId: req.user._id }, { studentId: { $exists: false } }];

  const results = await Result.find(query).sort({ createdAt: -1 }).populate("uploadedBy", "name");
  res.json(results);
});
