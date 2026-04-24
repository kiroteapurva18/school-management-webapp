import LeaveRequest from "../models/LeaveRequest.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { mapDivision } from "../utils/division.js";

const resolveParentChild = async (user) => {
  const prefix = user.email?.split("@")[0]?.toLowerCase();
  const linkedByPrefix = prefix
    ? await Student.findOne({ email: new RegExp(`^${prefix}@`, "i") }).sort({ createdAt: -1 })
    : null;
  if (linkedByPrefix) {
    const match = linkedByPrefix.class?.trim()?.match(/^(\d+)\s*[-]?\s*([A-D])$/i);
    return {
      studentId: linkedByPrefix._id,
      studentName: linkedByPrefix.name,
      className: match?.[1] || user.childClass || "",
      division: mapDivision(match?.[2] || user.childDivision || "A")
    };
  }

  if (user.childClass && user.childDivision) {
    const mappedDivision = mapDivision(user.childDivision);
    const match = await Student.findOne({
      class: new RegExp(`^${user.childClass}\\s*-?\\s*${user.childDivision}$`, "i")
    }).sort({ createdAt: -1 });
    return {
      studentId: match?._id,
      studentName: match?.name || "",
      className: user.childClass,
      division: mappedDivision
    };
  }
  return null;
};

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { fromDate, toDate, reason, studentId, studentName, parentName, class: className, division } = req.body;
  console.log("leave request payload:", req.body);
  if (!fromDate || !toDate || !reason) {
    res.status(400);
    throw new Error("fromDate, toDate and reason are required");
  }

  const child = await resolveParentChild(req.user).catch(() => null);
  
  const finalStudentId = studentId || child?.studentId || null;
  const finalStudentName = studentName?.trim() || child?.studentName || "Unknown Student";
  const finalClassName = className?.trim() || child?.className || "Unknown Class";
  const finalDivision = mapDivision(division || child?.division || "A");

  try {
    const leaveRequest = await LeaveRequest.create({
      studentId: finalStudentId,
      studentName: finalStudentName,
      parentId: req.user._id,
      parentName: parentName?.trim() || req.user.name || "Unknown Parent",
      class: finalClassName,
      division: finalDivision,
      fromDate,
      toDate,
      reason: reason.trim(),
      status: "Pending"
    });
    console.log("leave request saved data:", leaveRequest);

    res.status(201).json({
      message: "Leave Request Submitted Successfully",
      leaveRequest
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ error: "Failed to save leave request" });
  }
});

export const getTeacherLeaveRequests = asyncHandler(async (req, res) => {
  const records = await LeaveRequest.find({})
    .sort({ createdAt: -1 })
    .populate("parentId", "name email");
  console.log("teacher leave request API response count:", records.length);

  res.json(
    records.map((item) => ({
      ...item.toObject(),
      parentName: item.parentName || item.parentId?.name || "Parent"
    }))
  );
});

export const getParentLeaveRequests = asyncHandler(async (req, res) => {
  const records = await LeaveRequest.find({ parentId: req.user._id }).sort({ createdAt: -1 });
  res.json(records);
});

export const updateLeaveRequestStatus = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!["Approved", "Rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be Approved or Rejected");
  }

  const updated = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate("parentId", "name email");

  if (!updated) {
    res.status(404);
    throw new Error("Leave request not found");
  }

  res.json({
    ...updated.toObject(),
    parentName: updated.parentName || updated.parentId?.name || "Parent"
  });
});
