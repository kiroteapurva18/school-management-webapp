import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";
import Student from "../models/Student.js";

export const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, class: className, division, holidayDate } = req.body;
  if (!title || !message || !type) {
    res.status(400);
    throw new Error("title, message and type are required");
  }
  if (!["holiday", "general"].includes(type)) {
    res.status(400);
    throw new Error("Invalid notification type");
  }
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Only admin can create notifications");
  }

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type,
    createdBy: req.user._id,
    class: className?.trim(),
    division: division ? mapDivision(division) : undefined,
    holidayDate
  });

  res.status(201).json(notification);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === "student") {
    let className = req.user.className;
    let division = req.user.division;
    if (!className || !division) {
      const linked = await Student.findOne({ email: req.user.email }).select("class");
      const match = linked?.class?.trim()?.match(/^(\d+)\s*[-]?\s*([A-D])$/i);
      if (match) {
        className = match[1];
        division = match[2];
      }
    }
    query.$or = [
      { class: { $exists: false }, division: { $exists: false } },
      { class: className, division: mapDivision(division) }
    ];
    query.type = { $in: ["holiday", "general"] };
  } else if (req.user.role === "parent") {
    let className = req.user.childClass;
    let division = req.user.childDivision;
    if (!className || !division) {
      const parentPrefix = req.user.email?.split("@")[0]?.toLowerCase();
      const linked = parentPrefix
        ? await Student.findOne({ email: new RegExp(`^${parentPrefix}@`, "i") }).select("class")
        : null;
      const match = linked?.class?.trim()?.match(/^(\d+)\s*[-]?\s*([A-D])$/i);
      if (match) {
        className = match[1];
        division = match[2];
      }
    }
    query.$or = [
      { class: { $exists: false }, division: { $exists: false } },
      { class: className, division: mapDivision(division) }
    ];
    query.type = { $in: ["holiday", "general"] };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");

  res.json(notifications);
});
