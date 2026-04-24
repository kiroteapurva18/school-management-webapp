import Timetable, { DAYS, DIVISIONS, SCHOOL_CLASSES } from "../models/Timetable.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Student from "../models/Student.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time) => {
  if (!TIME_PATTERN.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const validateSchoolHours = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const schoolStart = toMinutes("10:00");
  const schoolEnd = toMinutes("17:00");

  if (start === null || end === null) {
    return "Time must be in HH:mm format";
  }
  if (start >= end) {
    return "Period endTime must be after startTime";
  }
  if (start < schoolStart || end > schoolEnd) {
    return "Period must be within school hours (10:00-17:00)";
  }
  return null;
};

const normalizePayload = (body) => ({
  class: body.class?.trim(),
  division: body.division?.trim()?.toUpperCase(),
  day: body.day?.trim(),
  subject: body.subject?.trim(),
  teacherId: body.teacherId,
  startTime: body.startTime?.trim(),
  endTime: body.endTime?.trim()
});

const resolveStudentProfile = async (req) => {
  if (req.user.className && req.user.division) {
    return { className: req.user.className, division: req.user.division };
  }
  const student = await Student.findOne({ email: req.user.email }).select("class");
  if (!student?.class) return null;
  // Supports values like "5-A" or "5A"
  const match = student.class.trim().match(/^(\d+)\s*[-]?\s*([A-D])$/i);
  if (!match) return null;
  return { className: match[1], division: match[2].toUpperCase() };
};

const resolveParentProfile = (req) => {
  if (req.user.childClass && req.user.childDivision) {
    return { className: req.user.childClass, division: req.user.childDivision };
  }
  return null;
};

const enforceStudentParentScope = async (req, className, division) => {
  if (req.user.role === "student") {
    const profile = await resolveStudentProfile(req);
    if (!profile) {
      return "Student profile is missing class/division";
    }
    if (profile.className !== className || profile.division !== division) {
      return "Students can view only their class timetable";
    }
  }

  if (req.user.role === "parent") {
    const profile = resolveParentProfile(req);
    if (!profile) {
      return "Parent profile is missing childClass/childDivision";
    }
    if (profile.className !== className || profile.division !== division) {
      return "Parents can view only their child's class timetable";
    }
  }

  return null;
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

const validateConflicts = async (payload, excludeId = null) => {
  const start = toMinutes(payload.startTime);
  const end = toMinutes(payload.endTime);
  const query = { day: payload.day };
  if (excludeId) query._id = { $ne: excludeId };

  const sameClassEntries = await Timetable.find({
    ...query,
    class: payload.class,
    division: payload.division
  }).lean();

  for (const row of sameClassEntries) {
    if (hasOverlap(start, end, toMinutes(row.startTime), toMinutes(row.endTime))) {
      return "Class periods cannot overlap";
    }
  }

  const teacherEntries = await Timetable.find({
    ...query,
    teacherId: payload.teacherId
  }).lean();
  for (const row of teacherEntries) {
    if (hasOverlap(start, end, toMinutes(row.startTime), toMinutes(row.endTime))) {
      return "Teacher has overlapping lectures on this day";
    }
  }

  return null;
};

export const createOrUpdateTimetable = asyncHandler(async (req, res) => {
  const entries = Array.isArray(req.body.entries) ? req.body.entries : [req.body];
  const created = [];

  for (const rawEntry of entries) {
    const payload = normalizePayload(rawEntry);
    if (!SCHOOL_CLASSES.includes(payload.class)) {
      res.status(400);
      throw new Error("Invalid class value");
    }
    if (!DIVISIONS.includes(payload.division)) {
      res.status(400);
      throw new Error("Invalid division value");
    }
    if (!DAYS.includes(payload.day)) {
      res.status(400);
      throw new Error("Invalid day value");
    }
    if (!payload.subject || !payload.teacherId || !payload.startTime || !payload.endTime) {
      res.status(400);
      throw new Error("subject, teacherId, startTime and endTime are required");
    }
    const timeError = validateSchoolHours(payload.startTime, payload.endTime);
    if (timeError) {
      res.status(400);
      throw new Error(timeError);
    }
    const conflictError = await validateConflicts(payload);
    if (conflictError) {
      res.status(400);
      throw new Error(conflictError);
    }

    const doc = await Timetable.create(payload);
    created.push(doc);
  }

  const populated = await Timetable.populate(created, { path: "teacherId", select: "name email role" });
  res.status(201).json(Array.isArray(req.body.entries) ? populated : populated[0]);
});

export const getClassTimetable = asyncHandler(async (req, res) => {
  const className = req.params.className?.trim();
  const division = req.params.division?.trim()?.toUpperCase();

  if (!SCHOOL_CLASSES.includes(className) || !DIVISIONS.includes(division)) {
    res.status(400);
    throw new Error("Invalid class or division");
  }

  const scopeError = await enforceStudentParentScope(req, className, division);
  if (scopeError) {
    res.status(403);
    throw new Error(scopeError);
  }

  const records = await Timetable.find({ class: className, division })
    .sort({ day: 1, startTime: 1 })
    .populate("teacherId", "name email");
  res.json(records);
});

export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId || req.user._id;
  const isSelf = String(req.user._id) === String(teacherId);
  if (req.user.role === "teacher" && !isSelf) {
    res.status(403);
    throw new Error("Teachers can only view their own timetable");
  }

  const records = await Timetable.find({ teacherId })
    .sort({ day: 1, startTime: 1 })
    .populate("teacherId", "name email");
  res.json(records);
});

export const getTimetableByDay = asyncHandler(async (req, res) => {
  const day = req.params.day?.trim();
  if (!DAYS.includes(day)) {
    res.status(400);
    throw new Error("Invalid day value");
  }

  const query = { day };
  if (req.user.role === "student") {
    const profile = await resolveStudentProfile(req);
    if (!profile) {
      res.status(403);
      throw new Error("Student profile is missing class/division");
    }
    query.class = profile.className;
    query.division = profile.division;
  }
  if (req.user.role === "parent") {
    const profile = resolveParentProfile(req);
    if (!profile) {
      res.status(403);
      throw new Error("Parent profile is missing childClass/childDivision");
    }
    query.class = profile.className;
    query.division = profile.division;
  }

  const records = await Timetable.find(query)
    .sort({ class: 1, division: 1, startTime: 1 })
    .populate("teacherId", "name email");

  res.json(records);
});

export const getStudentTimetable = asyncHandler(async (req, res) => {
  const profile = await resolveStudentProfile(req);
  if (!profile) {
    res.status(404);
    throw new Error("Student profile not found");
  }

  const timetable = await Timetable.find({
    class: profile.className,
    division: profile.division
  })
    .sort({ day: 1, startTime: 1 })
    .populate("teacherId", "name email");

  res.json({
    student: {
      name: req.user.name,
      class: profile.className,
      division: profile.division
    },
    timetable
  });
});

export const getTeacherUsers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher" }).select("name email role").sort({ name: 1 });
  res.json(teachers);
});
