import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    rollNumber: { type: Number, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
