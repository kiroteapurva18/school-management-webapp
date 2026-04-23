import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, lowercase: true, trim: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true }
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
