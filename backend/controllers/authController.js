import jwt from "jsonwebtoken";
import isEmail from "validator/lib/isEmail.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import Student from "../models/Student.js";

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

// ================= REGISTER =================
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, className, division, childClass, childDivision } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  if (!isEmail(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowedRoles = ["admin", "teacher", "student", "parent"];
  const safeRole = role && allowedRoles.includes(role) ? role : "student";
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error("Email already registered");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: safeRole,
    className: className?.trim(),
    division: division?.trim()?.toUpperCase(),
    childClass: childClass?.trim(),
    childDivision: childDivision?.trim()?.toUpperCase()
  });

  return res.status(201).json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      className: user.className,
      division: user.division,
      childClass: user.childClass,
      childDivision: user.childDivision
    }
  });
});

// ================= LOGIN =================
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = password === user.password;
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  return res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      className: user.className,
      division: user.division,
      childClass: user.childClass,
      childDivision: user.childDivision
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  let className = req.user.className;
  let division = req.user.division;

  if (req.user.role === "student" && (!className || !division)) {
    const student = await Student.findOne({ email: req.user.email }).select("class");
    const match = student?.class?.trim()?.match(/^(\d+)\s*[-]?\s*([A-D])$/i);
    if (match) {
      className = match[1];
      division = match[2].toUpperCase();
    }
  }

  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    className,
    division,
    childClass: req.user.childClass,
    childDivision: req.user.childDivision
  });
});