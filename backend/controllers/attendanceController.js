import Attendance from "../models/Attendance.js";
import asyncHandler from "../utils/asyncHandler.js";

export const markAttendance = asyncHandler(async (req, res) => {
  const { studentEmail, date, status } = req.body;
  const normalizedStatus = status?.toLowerCase() === "present" ? "Present" : "Absent";
  const attendance = await Attendance.create({
    studentEmail: studentEmail?.trim()?.toLowerCase(),
    date,
    status: normalizedStatus
  });
  res.status(201).json(attendance);
});

export const getAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find().sort({ date: -1 });
  res.json(records);
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const normalizedStatus = req.body.status?.toLowerCase() === "present" ? "Present" : "Absent";
  const payload = {
    studentEmail: req.body.studentEmail?.trim()?.toLowerCase(),
    date: req.body.date,
    status: normalizedStatus
  };
  const record = await Attendance.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!record) {
    res.status(404);
    throw new Error("Attendance record not found");
  }
  res.json(record);
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Attendance record not found");
  }
  res.json({ message: "Attendance deleted successfully" });
});
