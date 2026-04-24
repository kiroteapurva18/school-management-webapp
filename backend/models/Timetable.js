import mongoose from "mongoose";
import { STORED_DIVISIONS } from "../utils/division.js";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DIVISIONS = ["A", "B", "C", "D"];
export const SCHOOL_CLASSES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10"
];

const timetableSchema = new mongoose.Schema(
  {
    class: { type: String, enum: SCHOOL_CLASSES, required: true, trim: true },
    division: { type: String, enum: STORED_DIVISIONS, required: true, trim: true, uppercase: true },
    mappedDivision: { type: String, trim: true, uppercase: true },
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    substituteTeacherName: { type: String, trim: true }
  },
  { timestamps: true }
);

timetableSchema.index({ class: 1, division: 1, day: 1, startTime: 1, endTime: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
