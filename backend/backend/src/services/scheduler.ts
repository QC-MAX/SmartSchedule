import { Course } from "../db/models/Course.js";
import { Level } from "../db/models/Level.js";
import { Rule } from "../db/models/Rule.js";
import { Schedule } from "../db/models/Schedule.js";
import { Section } from "../db/models/Section.js";
import { generateWithGemini } from "../gemini/geminiClient.js";

export const generateSchedule = async (levelNum: number) => {
  const levelData = await Level.findOne({ level_num: levelNum }).populate(
    "has"
  );
  if (!levelData) throw new Error(`Level ${levelNum} not found in database`);

  const rules = await Rule.find({});

  const allCourses = levelData.has.map((c: any) => ({
    name: c.name,
    code: c.code,
    duration: c.duration,
    department: c.department,
  }));
  console.log(allCourses);

  const sweCourses = allCourses.filter(
    (c) => c.department === "Software Engineering"
  );
  const externalCourses = allCourses.filter(
    (c) => c.department !== "Software Engineering"
  );

  const externalSections = await Section.find({
    course: { $in: externalCourses.map((c) => c.code) },
  }).lean();

  const prompt = `
You are an academic schedule generator for King Saud University (Software Engineering Department).
The week starts from Sunday.
The time slots are from 8:00 AM to 2:50 PM, each slot is one hour.

Generate a weekly schedule for Level ${levelNum}.
Each course has a duration in hours.

---

🧩 Software Engineering Courses
${
  sweCourses.length > 0
    ? sweCourses
        .map((c) => `- ${c.name} (${c.code}), Duration: ${c.duration}h`)
        .join("\n")
    : "None"
}

---

📘 External Department Courses (Fixed Schedule)
${
  externalCourses.length > 0
    ? externalCourses
        .map((c) => `-  (${c.code}), Duration: ${c.duration}h`)
        .join("\n")
    : "None (no external courses found)"
}

---

⚙️ Rules:
${
  rules.length > 0
    ? rules.map((r) => `- ${r.rule_description}`).join("\n")
    : "None"
}

---

⚠️ Constraints:
1. Do NOT modify predefined external time slots.
2. Ensure no overlap between software courses and external ones.
3. Avoid double-booking instructors or classrooms.
4. The total scheduled time for each course must match its duration.
5. Use only available times (8:00-2:50).
6. Do not include any midterm slot.

---

The output must be pure JSON (no text, no Markdown) in the format:
[
  {
    "section": "Section 1",
    "level": ${levelNum},
    "grid": {
      "Sunday": {"8:00-8:50": "CourseName"},
      "Monday": {},
      "Tuesday": {},
      "Wednesday": {},
      "Thursday": {}
    }
  }
]
`;

  console.log("🧠 Gemini Prompt Preview:\n", prompt);
  console.log("------------------------------------");

  const parsedSchedule = await generateWithGemini(prompt);

  const savedSchedules = await Schedule.insertMany(parsedSchedule);

  const refreshedSchedules = await Schedule.find({
    _id: { $in: savedSchedules.map((s) => s._id) },
  }).lean();

  console.log("✅ Schedule successfully saved with IDs:");
  console.log(refreshedSchedules);

  return { schedules: refreshedSchedules };
};
