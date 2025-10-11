import mongoose, { Schema, Document } from "mongoose";

/**
 * 🧩 TypeScript interface for strong typing
 */
export interface IUser extends Document {
  userID: number;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Password: string;
  role: "Faculty" | "Scheduler" | "LoadCommittee" | "Student";
  comments: mongoose.Types.ObjectId[];
}

/**
 * 🏗️ User Schema
 * Mirrors the existing MongoDB documents exactly
 * with enhancements for auto-generating userID and supporting Student role.
 */
const UserSchema = new Schema<IUser>(
  {
    userID: {
      type: Number,
      required: true,
      unique: true,
    },
    First_Name: {
      type: String,
      required: true,
      trim: true,
    },
    Last_Name: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    Password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Faculty", "Scheduler", "LoadCommittee", "Student"], // 👈 Added Student
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: [],
      },
    ],
  },
  {
    collection: "User", // 👈 Match your existing MongoDB collection name
    timestamps: true,
  }
);

/**
 * 📌 Indexes for efficient lookup
 */
UserSchema.index({ userID: 1 });
UserSchema.index({ Email: 1 });

/**
 * 🧠 Pre-save hook to auto-generate userID if not provided
 */
UserSchema.pre<IUser>("validate", async function (next) {
  if (this.isNew && !this.userID) {
    const lastUser = await User.findOne({}, { userID: 1 })
      .sort({ userID: -1 })
      .lean();
    this.userID = lastUser ? lastUser.userID + 1 : 1;
  }
  next();
});

/**
 * 📤 Export the model
 */
export const User = mongoose.model<IUser>("User", UserSchema);