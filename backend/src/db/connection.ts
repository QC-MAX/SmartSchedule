import mongoose from "mongoose";
import { config } from "../config/index.js";

import "../db/models/Course.js";
import "../db/models/Level.js";
import "../db/models/Rule.js";
import "../db/models/Schedule.js";
import "../db/models/Notification.js";
import "../db/models/Student.js";  // Add this line

export const connectDB = async () => {
  try {
    if (!config.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in config");
    }

    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log(
      `✅✅✅ Mongoose is using the '${mongoose.connection.name}' database.`
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};