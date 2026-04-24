import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";

export const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, class: className, division, holidayDate } = req.body;
  if (!title || !message || !type) {
    res.status(400);
    throw new Error("title, message and type are required");
  }
  if (!["homework", "holiday", "general"].includes(type)) {
    res.status(400);
    throw new Error("Invalid notification type");
  }
  if (type === "homework" && (!className || !division)) {
    res.status(400);
    throw new Error("Homework notification needs class and division");
  }
  if (type === "holiday" && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Only admin can create holiday notifications");
  }
  if (type === "homework" && req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Only teachers can create homework notifications");
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
    query.$or = [
      { type: { $in: ["holiday", "general"] } },
      { class: req.user.className, division: mapDivision(req.user.division) }
    ];
  } else if (req.user.role === "parent") {
    query.$or = [
      { type: { $in: ["holiday", "general"] } },
      { class: req.user.childClass, division: mapDivision(req.user.childDivision) }
    ];
  } else if (req.user.role === "teacher") {
    query.$or = [{ createdBy: req.user._id }, { type: { $in: ["holiday", "general"] } }];
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");

  res.json(notifications);
});
