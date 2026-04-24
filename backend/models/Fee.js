import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    examFees: { type: Number, default: 800 },
    pendingFees: { type: Number, default: 0 },
    status: { type: String, enum: ["Paid", "Pending"], default: "Pending" }
  },
  { timestamps: true }
);

const Fee = mongoose.model("Fee", feeSchema);
export default Fee;
