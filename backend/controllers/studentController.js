import Student from "../models/Student.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const pickStudentPayload = (body) => ({
  name: body.name?.trim(),
  class: body.class?.trim(),
  rollNumber: Number(body.rollNumber),
  email: body.email?.trim()?.toLowerCase()
});

export const createStudent = asyncHandler(async (req, res) => {
  const payload = pickStudentPayload(req.body);
  
  if (!payload.class) {
    res.status(400);
    throw new Error("Class is required");
  }
  
  const match = payload.class.match(/^(\d+)\s*[-]?\s*([A-Za-z])$/i);
  if (!match) {
    res.status(400);
    throw new Error("Class must be in format like '10-A' or '8B'");
  }
  const className = match[1];
  const division = match[2].toUpperCase();

  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already registered as a user");
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: "12345678",
    role: "student",
    className,
    division,
    rollNumber: payload.rollNumber
  });

  const student = await Student.create({ ...payload, _id: user._id });
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
