// backend/src/app.ts
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/connection.js";
import { config } from "./config/index.js";

// Import models
import "./db/models/Course.js";
import "./db/models/Level.js";
import "./db/models/Rule.js";
import "./db/models/Schedule.js";
import "./db/models/Notification.js";

// Import routes
import scheduleRoutes from "./routes/Sschedule.js";
import router from "./routes/schedule.js";
import ruleRoutes from "./routes/ruleRoutes.js";
import authRoutes from "./routes/auth.js";
import irregularRoutes from "./routes/irregularRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import deadlineRoutes from "./routes/deadlineRoutes.js";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "../../public")));

// API Routes
app.use("/api", scheduleRoutes);
app.use("/api", router);
app.use("/api/rules", ruleRoutes);
app.use("/api", authRoutes);
app.use("/api/irregulars", irregularRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/deadlines", deadlineRoutes);

const port = config.PORT || 4000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
});