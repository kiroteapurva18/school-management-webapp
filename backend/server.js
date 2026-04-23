import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";

dotenv.config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ✅ Connect DB BEFORE starting server
const startServer = async () => {
  try {
    await connectDB(); // important: await

    // Middleware
    app.set("trust proxy", 1);
    app.use(helmet());
    app.use(
      cors({
        origin: CLIENT_URL,
        credentials: true
      })
    );
    app.use(compression());
    app.use(express.json({ limit: "10kb" }));
    if (process.env.NODE_ENV !== "test") {
      app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
    }
    app.use(
      "/api",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 500,
        standardHeaders: true,
        legacyHeaders: false
      })
    );

    // Test route
    app.get("/", (req, res) => {
      res.json({ message: "School Management API is running" });
    });

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/students", studentRoutes);
    app.use("/api/teachers", teacherRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/assignments", assignmentRoutes);

    app.use(notFound);
    app.use(errorHandler);

    // Start server ONLY after DB connects
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();