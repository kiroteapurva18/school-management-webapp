import Timetable, { DAYS, DIVISIONS, SCHOOL_CLASSES } from "../models/Timetable.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { ALLOWED_DIVISIONS, getMappedDisplayDivisions, mapDivision, STORED_DIVISIONS } from "../utils/division.js";

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
  division: mapDivision(body.division),
  mappedDivision: body.division?.trim()?.toUpperCase(),
  day: body.day?.trim(),
  subject: body.subject?.trim(),
  teacherName: body.teacherName?.trim(),
  teacherId: body.teacherId,
  startTime: body.startTime?.trim(),
  endTime: body.endTime?.trim()
});

const hydrateTeacherNames = async (rows) => {
  const ids = new Set();
  rows.forEach((row) => {
    if (!row.teacherName && row.teacherId) ids.add(String(row.teacherId));
    if (!row.substituteTeacherName && row.substituteTeacherId) ids.add(String(row.substituteTeacherId));
  });
  if (!ids.size) return rows;

  const users = await User.find({ _id: { $in: [...ids] } }).select("name");
  const userMap = new Map(users.map((user) => [String(user._id), user.name]));
  return rows.map((row) => ({
    ...row,
    teacherName: row.teacherName || userMap.get(String(row.teacherId)) || "Teacher",
    substituteTeacherName:
      row.substituteTeacherName || (row.substituteTeacherId ? userMap.get(String(row.substituteTeacherId)) : undefined)
  }));
};

const toViewRow = (row) => ({
  ...row,
  subject: row.subject || "N/A",
  teacherName: row.substituteTeacherName || row.teacherName || "Teacher",
  class: row.class || "",
  division: row.division || ""
});

const resolveStudentProfile = async (req) => {
  if (req.user.className && req.user.division) {
    return { className: req.user.className, division: req.user.division?.toUpperCase() };
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
    return { className: req.user.childClass, division: req.user.childDivision?.toUpperCase() };
  }
  return null;
};

const enforceStudentParentScope = async (req, className, division) => {
  if (req.user.role === "student") {
    const profile = await resolveStudentProfile(req);
    if (!profile) {
      return "Student profile is missing class/division";
    }
    if (profile.className !== className || mapDivision(profile.division) !== mapDivision(division)) {
      return "Students can view only their class timetable";
    }
  }

  if (req.user.role === "parent") {
    const profile = resolveParentProfile(req);
    if (!profile) {
      return "Parent profile is missing childClass/childDivision";
    }
    if (profile.className !== className || mapDivision(profile.division) !== mapDivision(division)) {
      return "Parents can view only their child's class timetable";
    }
  }

  return null;
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

const validateSubjectRotation = (entries) => {
  const grouped = entries.reduce((acc, entry) => {
    const key = `${entry.class}-${entry.division}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  for (const timetableEntries of Object.values(grouped)) {
    timetableEntries.sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return toMinutes(a.startTime) - toMinutes(b.startTime);
    });
    let streak = 1;
    for (let i = 1; i < timetableEntries.length; i += 1) {
      if (timetableEntries[i].subject === timetableEntries[i - 1].subject) {
        streak += 1;
        if (streak > 2) return "Subject cannot repeat continuously more than 2 times";
      } else {
        streak = 1;
      }
    }
  }
  return null;
};

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
  const normalizedEntries = entries.map((rawEntry) => normalizePayload(rawEntry));
  const subjectRotationError = validateSubjectRotation(normalizedEntries);
  if (subjectRotationError) {
    res.status(400);
    throw new Error(subjectRotationError);
  }
  const created = [];

  for (const payload of normalizedEntries) {
    if (!SCHOOL_CLASSES.includes(payload.class)) {
      res.status(400);
      throw new Error("Invalid class value");
    }
    if (!STORED_DIVISIONS.includes(payload.division)) {
      res.status(400);
      throw new Error("Invalid division value");
    }
    if (!DAYS.includes(payload.day)) {
      res.status(400);
      throw new Error("Invalid day value");
    }
    if (!payload.subject || !payload.startTime || !payload.endTime) {
      res.status(400);
      throw new Error("subject, startTime and endTime are required");
    }
    if (!payload.teacherName && payload.teacherId) {
      const teacher = await User.findById(payload.teacherId).select("name");
      payload.teacherName = teacher?.name;
    }
    if (!payload.teacherName) {
      res.status(400);
      throw new Error("teacherName is required");
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

  res.status(201).json(Array.isArray(req.body.entries) ? created : created[0]);
});

export const getAllTimetables = asyncHandler(async (req, res) => {
  const records = await Timetable.find().sort({ class: 1, division: 1, day: 1, startTime: 1 }).lean();
  const hydrated = await hydrateTeacherNames(records);
  res.json(hydrated.map((row) => toViewRow(row)));
});

export const getClassTimetable = asyncHandler(async (req, res) => {
  const className = req.params.className?.trim();
  const requestedDivision = req.params.division?.trim()?.toUpperCase();
  const division = mapDivision(requestedDivision);

  if (!SCHOOL_CLASSES.includes(className) || !ALLOWED_DIVISIONS.includes(requestedDivision)) {
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
    .lean();
  const hydrated = await hydrateTeacherNames(records);
  res.json(hydrated.map((row) => ({ ...toViewRow(row), displayDivision: requestedDivision })));
});

export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId || req.user._id;
  const isSelf = String(req.user._id) === String(teacherId);
  if (req.user.role === "teacher" && !isSelf) {
    res.status(403);
    throw new Error("Teachers can only view their own timetable");
  }

  const records = await Timetable.find({
    $or: [{ teacherId }, { substituteTeacherId: teacherId }]
  })
    .sort({ day: 1, startTime: 1 })
    .lean();
  const hydrated = await hydrateTeacherNames(records);
  const expanded = hydrated.flatMap((row) =>
    getMappedDisplayDivisions(row.division).map((division) => ({
      ...toViewRow(row),
      displayDivision: division
    }))
  );
  res.json(expanded);
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
    query.division = mapDivision(profile.division);
  }
  if (req.user.role === "parent") {
    const profile = resolveParentProfile(req);
    if (!profile) {
      res.status(403);
      throw new Error("Parent profile is missing childClass/childDivision");
    }
    query.class = profile.className;
    query.division = mapDivision(profile.division);
  }

  const records = await Timetable.find(query)
    .sort({ class: 1, division: 1, startTime: 1 })
    .lean();
  const hydrated = await hydrateTeacherNames(records);
  res.json(hydrated.map((row) => toViewRow(row)));
});

export const getStudentTimetable = asyncHandler(async (req, res) => {
  const profile = await resolveStudentProfile(req);
  const requestedClass = req.query.class?.trim();
  const requestedDivisionFromQuery = req.query.division?.trim()?.toUpperCase();
  if (!profile) {
    return res.json({
      student: null,
      timetable: []
    });
  }
  const selectedClass = requestedClass || profile.className;
  const requestedDivision = requestedDivisionFromQuery || profile.division?.toUpperCase();
  const mappedDivision = mapDivision(requestedDivision);
  console.log("student timetable -> user.class:", selectedClass);
  console.log("student timetable -> user.division:", requestedDivision);
  console.log("student timetable -> mapped division:", mappedDivision);
  if (!ALLOWED_DIVISIONS.includes(requestedDivision)) {
    return res.json({
      student: {
        name: req.user.name,
        class: selectedClass,
        division: requestedDivision || ""
      },
      timetable: []
    });
  }

  const timetable = await Timetable.find({
    class: selectedClass,
    division: mappedDivision
  })
    .sort({ day: 1, startTime: 1 })
    .lean();
  const hydrated = await hydrateTeacherNames(timetable);
  console.log("student timetable -> API response count:", hydrated.length);

  res.json({
    student: {
      name: req.user.name,
      class: selectedClass,
      division: requestedDivision,
      mappedDivision
    },
    timetable: hydrated.map((row) => ({ ...toViewRow(row), displayDivision: requestedDivision }))
  });
});

export const getTeacherUsers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher" }).select("name email role").sort({ name: 1 });
  res.json(teachers);
});

export const updateTimetableSlot = asyncHandler(async (req, res) => {
  const { id, subject, teacherId, substituteTeacherId } = req.body;
  if (!id) {
    res.status(400);
    throw new Error("id is required");
  }

  const payload = {};
  if (subject) payload.subject = subject.trim();
  if (teacherId) {
    payload.teacherId = teacherId;
    const teacher = await User.findById(teacherId).select("name");
    payload.teacherName = teacher?.name || "Teacher";
  }
  if (substituteTeacherId !== undefined) {
    payload.substituteTeacherId = substituteTeacherId || undefined;
    if (substituteTeacherId) {
      const substitute = await User.findById(substituteTeacherId).select("name");
      payload.substituteTeacherName = substitute?.name || "Substitute";
    } else {
      payload.substituteTeacherName = undefined;
    }
  }

  const updated = await Timetable.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!updated) {
    res.status(404);
    throw new Error("Timetable slot not found");
  }

  const [row] = await hydrateTeacherNames([updated]);
  res.json(toViewRow(row));
});
