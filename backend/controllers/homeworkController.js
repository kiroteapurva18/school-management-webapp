import Homework from "../models/Homework.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";

export const createHomework = asyncHandler(async (req, res) => {
  const { title, subject, class: className, division, description } = req.body;
  if (!title || !subject || !className || !division || !description) {
    res.status(400);
    throw new Error("title, subject, class, division and description are required");
  }

  const homework = await Homework.create({
    title: title.trim(),
    subject: subject.trim(),
    class: className.trim(),
    division: mapDivision(division),
    description: description.trim(),
    assignedBy: req.user._id
  });

  res.status(201).json(homework);
});

export const getHomework = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === "student") {
    query.class = req.user.className;
    query.division = mapDivision(req.user.division);
  }
  if (req.user.role === "parent") {
    query.class = req.user.childClass;
    query.division = mapDivision(req.user.childDivision);
  }

  const homework = await Homework.find(query).sort({ createdAt: -1 }).populate("assignedBy", "name");
  res.json(homework);
});

export const uploadHomeworkSubmission = asyncHandler(async (req, res) => {
  const { homeworkId } = req.body;
  if (!homeworkId || !req.file) {
    res.status(400);
    throw new Error("homeworkId and PDF file are required");
  }

  const homework = await Homework.findById(homeworkId);
  if (!homework) {
    res.status(404);
    throw new Error("Homework not found");
  }

  homework.studentId = req.user._id;
  homework.studentSubmissionPdf = `/uploads/homework/${req.file.filename}`;
  await homework.save();

  res.json(homework);
});
