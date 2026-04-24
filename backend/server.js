console.log("=== ENV DEBUG ===");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import homeworkRoutes from "./routes/homeworkRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 Allow frontend (Vercel)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// 🚀 Start Server Function
const startServer = async () => {
  try {
    // ✅ Connect DB first
    await connectDB();
    

    // 🛡️ Security & Middleware
    app.set("trust proxy", 1);
    app.use(helmet());

    // ✅ CORS (IMPORTANT for Vercel)
    app.use(
      cors({
        origin: CLIENT_URL,
        credentials: true,
      })
    );

    app.use(compression());
    app.use(express.json({ limit: "10kb" }));

    // 📄 Logging
    if (process.env.NODE_ENV !== "test") {
      app.use(
        morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
      );
    }

    // 🚫 Rate Limiting
    app.use(
      "/api",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 500,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );

    // 📂 Serve uploaded files (for PDFs)
    const __dirname = path.resolve();
    app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

    // ✅ Health Check Route
    app.get("/", (req, res) => {
      res.status(200).json({
        message: "School Management API is running 🚀",
      });
    });

    // 🔗 API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/students", studentRoutes);
    app.use("/api/teachers", teacherRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/assignments", assignmentRoutes);
    app.use("/api/timetable", timetableRoutes);
    app.use("/api/leave-request", leaveRequestRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/homework", homeworkRoutes);
    app.use("/api/results", resultRoutes);
    app.use("/api/fees", feeRoutes);

    // ❌ Error Handling
    app.use(notFound);
    app.use(errorHandler);

    // 🚀 Start Server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();