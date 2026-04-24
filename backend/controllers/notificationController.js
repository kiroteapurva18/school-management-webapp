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
    query.type = { $in: ["holiday", "general"] };
  } else if (req.user.role === "parent") {
    query.type = { $in: ["holiday", "general"] };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role");
  console.log("notifications API response count:", notifications.length, "for role:", req.user.role);

  res.json(notifications);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await Notification.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ message: "Notification deleted successfully" });
});
