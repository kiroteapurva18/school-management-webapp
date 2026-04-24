import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      default: "student"
    },
    className: { type: String, trim: true },
    division: { type: String, trim: true, uppercase: true },
    childClass: { type: String, trim: true },
    childDivision: { type: String, trim: true, uppercase: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
