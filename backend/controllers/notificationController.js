import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";

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
    query.$or = [
      { class: { $exists: false }, division: { $exists: false } },
      { class: req.user.className, division: mapDivision(req.user.division) }
    ];
    query.type = { $in: ["holiday", "general"] };
  } else if (req.user.role === "parent") {
    query.$or = [
      { class: { $exists: false }, division: { $exists: false } },
      { class: req.user.childClass, division: mapDivision(req.user.childDivision) }
    ];
    query.type = { $in: ["holiday", "general"] };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");

  res.json(notifications);
});
