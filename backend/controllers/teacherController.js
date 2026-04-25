import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const pickTeacherPayload = (body) => ({
  name: body.name?.trim(),
  subject: body.subject?.trim(),
  email: body.email?.trim()?.toLowerCase()
});

export const createTeacher = asyncHandler(async (req, res) => {
  const payload = pickTeacherPayload(req.body);

  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already registered as a user");
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: "12345678",
    role: "teacher",
    subject: payload.subject
  });

  const teacher = await Teacher.create({ ...payload, _id: user._id });
  res.status(201).json(teacher);
});

export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().sort({ createdAt: -1 });
  res.json(teachers);
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  res.json(teacher);
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, pickTeacherPayload(req.body), { new: true, runValidators: true });
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  res.json(teacher);
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  res.json({ message: "Teacher deleted successfully" });
});
