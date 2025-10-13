import mongoose, { Schema, Document } from "mongoose";

export interface ILevel extends Document {
  level_num: number;
  has: mongoose.Types.ObjectId[];
  student_count?: number; // Total number of students in this level
  course_enrollments?: Map<string, number>; // Student count per course code
  updated_at?: Date;
}

const LevelSchema: Schema = new Schema({
  level_num: {
    type: Number,
    required: true,
    min: 3,
    max: 8,
  },
  has: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  ],
  student_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  course_enrollments: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update updated_at on save
LevelSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Level = mongoose.model<ILevel>("Level", LevelSchema, "Level");