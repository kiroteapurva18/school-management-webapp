import Result from "../models/Result.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";
import Student from "../models/Student.js";

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
  let linkedStudentId = req.user._id;

  if (req.user.role === "parent") {
    className = req.user.childClass;
    division = req.user.childDivision;
    const prefix = req.user.email?.split("@")[0]?.toLowerCase();
    const linked = prefix ? await Student.findOne({ email: new RegExp(`^${prefix}@`, "i") }).select("_id class") : null;
    if (linked) {
      linkedStudentId = linked._id;
      const match = linked.class?.trim()?.match(/^(\d+)\s*[-]?\s*([A-D])$/i);
      if (match) {
        className = match[1];
        division = match[2];
      }
    }
    console.log("results parent mapping:", { parent: req.user.email, linkedStudentId, className, division });
  }

  const query = {};
  if (req.user.role === "student" || req.user.role === "parent") {
    query.$or = [
      { studentId: linkedStudentId },
      { class: className, division: mapDivision(division), studentId: { $exists: false } }
    ];
  }
  if (req.user.role === "student") query.$or = [{ studentId: req.user._id }, { class: className, division: mapDivision(division), studentId: { $exists: false } }];

  const results = await Result.find(query).sort({ createdAt: -1 }).populate("uploadedBy", "name");
  console.log("results API response count:", results.length);
  res.json(results);
});
