import { Router, Request, Response } from "express";
import { Schedule, ISchedule } from "../db/models/Schedule.js";

// Define a type for the request parameters to ensure type safety.
type GetSchedulesByLevelParams = {
  level: string;
};

const router: Router = Router();

/**
 * @route   GET /api/student-schedules/:level
 * @desc    Fetches all schedules for a specific level with version 2 or higher.
 * @access  Public
 */
router.get(
  "/student-schedules/:level",
  async (req: Request<GetSchedulesByLevelParams>, res: Response) => {
    try {
      const { level } = req.params;
      const studentLevel = parseInt(level, 10);

      // Validate the parsed level.
      if (isNaN(studentLevel) || studentLevel < 1 || studentLevel > 8) {
        return res
          .status(400)
          .json({ error: "Invalid academic level provided." });
      }

      // âœ… Ø§Ù„Ø­Ù„ Ø§Ù„ØµØ­ÙŠØ­: Ø§Ø³ØªØ®Ø¯Ø§Ù… lean() Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· Ù…Ø¹ Ø§Ù„ÙÙ„ØªØ± Ø§Ù„ØµØ­ÙŠØ­
      const schedules = await Schedule.find({
        level: studentLevel,
        version: { $gte: 2 },
      })
        .sort({ version: -1 })
        .lean<ISchedule[]>();

      // âœ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ Ù†ØªØ§Ø¦Ø¬
      if (schedules.length === 0) {
        return res.status(404).json({
          error: `Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø¬Ø¯ÙˆÙ„ Ù„Ù„Ù…Ø³ØªÙˆÙ‰ ${level} Ø¨Ù†Ø³Ø®Ø© 2 Ø£Ùˆ Ø£Ø¹Ù„Ù‰.`,
        });
      }

      // âœ… Ø¥Ø±Ø¬Ø§Ø¹ Ø§Ù„Ù†ØªØ§Ø¦Ø¬
      return res.json({
        level: studentLevel,
        schedules: schedules,
      });
    } catch (e: unknown) {
      console.error("Error fetching student schedules:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      return res
        .status(500)
        .json({ message: "Server error", error: errorMessage });
    }
  }
);

export default router;