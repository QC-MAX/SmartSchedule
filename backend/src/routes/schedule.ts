import express, { Request, Response } from "express";
import { generateSchedule } from "../services/scheduler.js";
import { Schedule } from "../db/models/Schedule.js";
import { User } from "../db/models/User.js";
import Notification  from "../db/models/Notification.js";

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
});

router.get("/schedule/level/:levelNum", async (req: Request, res: Response) => {
  try {
    const { levelNum } = req.params;

    // Find the schedule for the level with the highest version number
    const latestSchedule = await Schedule.findOne({ level: parseInt(levelNum) })
      .sort({ version: -1 }) // Sort by version in descending order
      .exec();

    if (!latestSchedule) {
      return res
        .status(404)
        .json({ error: "No published schedule found for this level." });
    }

    res.json({
      success: true,
      schedules: [latestSchedule],
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
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
  } catch (error) {
    console.error("❌ Publish error details:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to publish schedule" });
  }
});

export default router;