import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";

const pickStudentPayload = (body) => ({
  name: body.name?.trim(),
  class: body.class?.trim(),
  rollNumber: Number(body.rollNumber),
  email: body.email?.trim()?.toLowerCase()
});

export const createStudent = asyncHandler(async (req, res) => {
  const payload = pickStudentPayload(req.body);
  const student = await Student.create(payload);
  res.status(201).json(student);
});

export const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json(student);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const payload = pickStudentPayload(req.body);
  const student = await Student.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json(student);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json({ message: "Student deleted successfully" });
});
