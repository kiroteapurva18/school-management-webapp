import mongoose from "mongoose";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DIVISIONS = ["A", "B", "C", "D"];
export const SCHOOL_CLASSES = [
  "Nursery",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th"
];

const periodSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    class: { type: String, enum: SCHOOL_CLASSES, required: true, trim: true },
    division: { type: String, enum: DIVISIONS, required: true, trim: true, uppercase: true },
    day: { type: String, enum: DAYS, required: true },
    periods: {
      type: [periodSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one period is required"
      }
    }
  },
  { timestamps: true }
);

timetableSchema.index({ class: 1, division: 1, day: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
