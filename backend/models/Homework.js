import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    division: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, required: true, trim: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentSubmissionPdf: { type: String, trim: true }
  },
  { timestamps: true }
);

const Homework = mongoose.model("Homework", homeworkSchema);
export default Homework;
