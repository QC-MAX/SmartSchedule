import mongoose, { Schema, Document } from "mongoose";

/**
 * 📘 Schedule Interface
 * Supports versioning, publishing, and notification triggers.
 */
export interface ISchedule extends Document {
  level: number;
  section: string;
  grid: Record<string, any>;
  version: number;
  publishedAt?: Date;
  created_at: Date;
}

/**
 * 🧩 Schedule Schema
 */
const ScheduleSchema: Schema<ISchedule> = new Schema(
  {
    level: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    grid: {
      type: Object,
      required: true,
    },
    version: {
      type: Number,
      default: 0, // ⬅ new schedules start as drafts
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "Schedule", // Keep consistent with your DB
  }
);

/**
 * 🔍 Index for faster queries
 */
ScheduleSchema.index({ level: 1 });
ScheduleSchema.index({ version: -1 });

/**
 * 🏗️ Export model
 */
export const Schedule = mongoose.model<ISchedule>("Schedule", ScheduleSchema);