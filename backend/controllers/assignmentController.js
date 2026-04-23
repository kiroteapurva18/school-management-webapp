import Assignment from "../models/Assignment.js";
import asyncHandler from "../utils/asyncHandler.js";

const pickAssignmentPayload = (body) => ({
  title: body.title?.trim(),
  description: body.description?.trim(),
  dueDate: body.dueDate
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create(pickAssignmentPayload(req.body));
  res.status(201).json(assignment);
});

export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find().sort({ createdAt: -1 });
  res.json(assignments);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, pickAssignmentPayload(req.body), {
    new: true,
    runValidators: true
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  res.json(assignment);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  res.json({ message: "Assignment deleted successfully" });
});
