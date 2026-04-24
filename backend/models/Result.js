import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    class: { type: String, required: true, trim: true },
    division: { type: String, required: true, trim: true, uppercase: true },
    percentage: { type: Number, min: 0, max: 100 },
    resultPdfUrl: { type: String, required: true, trim: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;
