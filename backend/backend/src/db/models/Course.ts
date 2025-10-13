import mongoose, { Schema, Document } from "mongoose";

/**
 * Course Interface for TypeScript
 */
export interface ICourse extends Document {
  name: string;
  code: string;
  credit_hours: number;
  is_elective: boolean;
  exam_date: string;
  exam_time: string;
  department: string;
  college: string;
  prerequisites: string[];
  section: string[];
  level: mongoose.Types.ObjectId; // Reference to Level
  duration: string;
}

/**
 * Course Schema
 */
const CourseSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  credit_hours: {
    type: Number,
    required: true,
  },
  is_elective: {
    type: Boolean,
    default: false,
  },
  exam_date: {
    type: String,
  },
  exam_time: {
    type: String,
  },
  department: {
    type: String,
    required: true,
  },
  college: {
    type: String,
    required: true,
  },
  prerequisites: {
    type: [String],
    default: [],
  },
  section: {
    type: [String],
    default: [],
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Level",
  },
  duration: {
    type: String,
    required: true,
  },
});

/**
 * Export the Course model
 */
export const Course = mongoose.model<ICourse>("Course", CourseSchema, "Course");
