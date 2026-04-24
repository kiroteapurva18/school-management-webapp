import Timetable, { DAYS, DIVISIONS, SCHOOL_CLASSES } from "../models/Timetable.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

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

const validatePeriodOverlaps = (periods) => {
  const sorted = [...periods].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const currentEnd = toMinutes(sorted[i].endTime);
    const nextStart = toMinutes(sorted[i + 1].startTime);
    if (currentEnd > nextStart) {
      return "Class periods cannot overlap";
    }
  }
  return null;
};

const validateTeacherOverlaps = async ({ periods, day, excludeId }) => {
  const teacherIds = [...new Set(periods.map((period) => String(period.teacherId)))];
  if (!teacherIds.length) return null;

  const query = { day, "periods.teacherId": { $in: teacherIds } };
  if (excludeId) query._id = { $ne: excludeId };
  const records = await Timetable.find(query).lean();

  for (const period of periods) {
    const start = toMinutes(period.startTime);
    const end = toMinutes(period.endTime);
    const teacherId = String(period.teacherId);

    for (const record of records) {
      for (const existing of record.periods) {
        if (String(existing.teacherId) !== teacherId) continue;

        const existingStart = toMinutes(existing.startTime);
        const existingEnd = toMinutes(existing.endTime);
        const overlaps = start < existingEnd && end > existingStart;
        if (overlaps) {
          return `Teacher has overlapping period on ${day} (${record.class}-${record.division} ${existing.startTime}-${existing.endTime})`;
        }
      }
    }
  }

  // Also validate duplicates in the same payload for same teacher
  const groupedByTeacher = periods.reduce((acc, period) => {
    const key = String(period.teacherId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(period);
    return acc;
  }, {});

  for (const teacherPeriods of Object.values(groupedByTeacher)) {
    const sorted = teacherPeriods.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const currentEnd = toMinutes(sorted[i].endTime);
      const nextStart = toMinutes(sorted[i + 1].startTime);
      if (currentEnd > nextStart) {
        return "Teacher periods overlap in submitted timetable";
      }
    }
  }

  return null;
};

const normalizePayload = (body) => ({
  class: body.class?.trim(),
  division: body.division?.trim()?.toUpperCase(),
  day: body.day?.trim(),
  periods: Array.isArray(body.periods)
    ? body.periods.map((period) => ({
      subject: period.subject?.trim(),
      teacherId: period.teacherId,
      startTime: period.startTime?.trim(),
      endTime: period.endTime?.trim()
    }))
    : []
});

const enforceStudentParentScope = (req, className, division) => {
  if (req.user.role === "student") {
    if (!req.user.className || !req.user.division) {
      return "Student profile is missing class/division";
    }
    if (req.user.className !== className || req.user.division !== division) {
      return "Students can view only their class timetable";
    }
  }

  if (req.user.role === "parent") {
    if (!req.user.childClass || !req.user.childDivision) {
      return "Parent profile is missing childClass/childDivision";
    }
    if (req.user.childClass !== className || req.user.childDivision !== division) {
      return "Parents can view only their child's class timetable";
    }
  }

  return null;
};

export const createOrUpdateTimetable = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body);

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
  if (!payload.periods.length) {
    res.status(400);
    throw new Error("At least one period is required");
  }

  for (const period of payload.periods) {
    if (!period.subject || !period.teacherId || !period.startTime || !period.endTime) {
      res.status(400);
      throw new Error("Each period requires subject, teacherId, startTime, and endTime");
    }
    const timeError = validateSchoolHours(period.startTime, period.endTime);
    if (timeError) {
      res.status(400);
      throw new Error(timeError);
    }
  }

  const classOverlap = validatePeriodOverlaps(payload.periods);
  if (classOverlap) {
    res.status(400);
    throw new Error(classOverlap);
  }

  const teacherOverlap = await validateTeacherOverlaps({
    periods: payload.periods,
    day: payload.day
  });
  if (teacherOverlap) {
    res.status(400);
    throw new Error(teacherOverlap);
  }

  const timetable = await Timetable.findOneAndUpdate(
    { class: payload.class, division: payload.division, day: payload.day },
    payload,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("periods.teacherId", "name email role");

  res.status(201).json(timetable);
});

export const getClassTimetable = asyncHandler(async (req, res) => {
  const className = req.params.className?.trim();
  const division = req.params.division?.trim()?.toUpperCase();

  if (!SCHOOL_CLASSES.includes(className) || !DIVISIONS.includes(division)) {
    res.status(400);
    throw new Error("Invalid class or division");
  }

  const scopeError = enforceStudentParentScope(req, className, division);
  if (scopeError) {
    res.status(403);
    throw new Error(scopeError);
  }

  const records = await Timetable.find({ class: className, division })
    .sort({ day: 1 })
    .populate("periods.teacherId", "name email");
  res.json(records);
});

export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const isSelf = String(req.user._id) === String(teacherId);
  if (req.user.role === "teacher" && !isSelf) {
    res.status(403);
    throw new Error("Teachers can only view their own timetable");
  }

  const records = await Timetable.find({ "periods.teacherId": teacherId })
    .sort({ day: 1 })
    .populate("periods.teacherId", "name email");

  const filtered = records
    .map((record) => ({
      ...record.toObject(),
      periods: record.periods.filter((period) => String(period.teacherId?._id || period.teacherId) === String(teacherId))
    }))
    .filter((record) => record.periods.length > 0);

  res.json(filtered);
});

export const getTimetableByDay = asyncHandler(async (req, res) => {
  const day = req.params.day?.trim();
  if (!DAYS.includes(day)) {
    res.status(400);
    throw new Error("Invalid day value");
  }

  const query = { day };
  if (req.user.role === "student") {
    if (!req.user.className || !req.user.division) {
      res.status(403);
      throw new Error("Student profile is missing class/division");
    }
    query.class = req.user.className;
    query.division = req.user.division;
  }
  if (req.user.role === "parent") {
    if (!req.user.childClass || !req.user.childDivision) {
      res.status(403);
      throw new Error("Parent profile is missing childClass/childDivision");
    }
    query.class = req.user.childClass;
    query.division = req.user.childDivision;
  }

  const records = await Timetable.find(query)
    .sort({ class: 1, division: 1 })
    .populate("periods.teacherId", "name email");

  res.json(records);
});

export const getTeacherUsers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher" }).select("name email role").sort({ name: 1 });
  res.json(teachers);
});
