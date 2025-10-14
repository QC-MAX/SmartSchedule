import express, { Request, Response } from "express";
import { generateSchedule } from "../services/scheduler.js";
import { Schedule } from "../db/models/Schedule.js";
import { User } from "../db/models/User.js";
import Notification from "../db/models/Notification.js";

const router = express.Router();

/**
 * 🧩 POST /api/schedule/generate
 * Generates a schedule for a given level using Gemini AI.
 */
router.post("/schedule/generate", async (req: Request, res: Response) => {
  try {
    const { level } = req.body;
    if (!level) {
      return res.status(400).json({ error: "Level number is required." });
    }
    const result = await generateSchedule(level);
    res.json({
      success: true,
      schedules: result.schedules,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 💾 PUT /api/update/:id
 * Updates a specific schedule's grid data after an edit.
 */
router.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { grid } = req.body;

    // --- Validation ---
    if (!grid) {
      // Always send a JSON error back
      return res
        .status(400)
        .json({ success: false, error: "Grid data is missing." });
    }

    // --- Database Update ---
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { grid },
      { new: true } // This option returns the updated document
    );

    if (!updatedSchedule) {
      // Always send a JSON error if the ID is not found
      return res
        .status(404)
        .json({ success: false, error: "Schedule not found." });
    }

    // --- Success Response ---
    // Always send a JSON success message
    res.json({ success: true, schedule: updatedSchedule });
  } catch (error: any) {
    console.error("❌ Error updating schedule:", error);
    // Always send a JSON error for any other server issues
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal Server Error",
      });
  }
});

router.get("/schedule/level/:levelNum", async (req: Request, res: Response) => {
  try {
    const { levelNum } = req.params;

    // --- NEW: Aggregation Pipeline to get the latest version of each group's schedule ---
    const latestSchedulesByGroup = await Schedule.aggregate([
      // Stage 1: Match only the schedules for the selected level
      { $match: { level: parseInt(levelNum) } },

      // Stage 2: Sort by version in descending order to get the newest first
      { $sort: { version: -1 } },

      // Stage 3: Group by the section name (e.g., "Group 1") and take the FIRST document,
      // which is the latest version because of the previous sort.
      {
        $group: {
          _id: "$section", // Group by the "section" field
          latestDoc: { $first: "$$ROOT" }, // Get the entire first document in each group
        },
      },

      // Stage 4: Replace the root of the document to restore its original structure
      { $replaceRoot: { newRoot: "$latestDoc" } },

      // Stage 5: (Optional) Sort the final results by section name for consistent order
      { $sort: { section: 1 } },
    ]);

    if (!latestSchedulesByGroup || latestSchedulesByGroup.length === 0) {
      return res
        .status(404)
        .json({ error: "No published schedule found for this level." });
    }

    res.json({
      success: true,
      schedules: latestSchedulesByGroup, // Send only the latest version of each group's schedule
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/schedule/publish/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    const newVersion = (schedule.version || 0) + 1;
    schedule.version = newVersion;
    schedule.publishedAt = new Date();
    await schedule.save();
    let recipients;
    if (newVersion === 1) {
      recipients = await User.find({
        role: { $in: ["LoadCommittee", "Scheduler"] },
      });
    } else {
      recipients = await User.find({});
    }
    const notifications = recipients.map((user) => ({
      userId: user._id,
      title: `Schedule Version ${newVersion} Published`,
      message:
        newVersion === 1
          ? `Initial schedule for Level ${schedule.level} has been published.`
          : `Updated schedule (v${newVersion}) for Level ${schedule.level} is now available.`,
      createdAt: new Date(),
      read: false,
    }));
    await Notification.insertMany(notifications);
    console.log(
      `✅ Schedule v${newVersion} published. Notifications sent to ${recipients.length} users.`
    );
    res.json({
      success: true,
      message: `Schedule version ${newVersion} published successfully.`,
      recipients: recipients.length,
      version: newVersion,
    });
  } catch (error: any) {
    console.error("❌ Publish error details:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to publish schedule" });
  }
});

export default router;