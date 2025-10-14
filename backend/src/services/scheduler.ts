import { Course } from "../db/models/Course.js";
import { Level } from "../db/models/Level.js";
import { Rule } from "../db/models/Rule.js";
import { Schedule } from "../db/models/Schedule.js";
import { Section } from "../db/models/Section.js";
import { generateWithGemini } from "../gemini/geminiClient.js";

export const generateSchedule = async (levelNum: number) => {
  // 1. Fetch Level Data
  const levelData = await Level.findOne({ level_num: levelNum }).populate(
    "has"
  );
  if (!levelData) throw new Error(`Level ${levelNum} not found in database`);

  // 2. Calculate the number of student groups
  // Divide total students by 25 and round up to the nearest whole number.
  const numberOfGroups = Math.ceil(levelData.student_count / 25);
  console.log(
    `Calculated Number of Groups for Level ${levelNum}: ${numberOfGroups}`
  );

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
  console.log(sweCourses);
  const externalCourses = allCourses.filter(
    (c) => c.department !== "Software Engineering"
  );
  console.log(externalCourses);

  // 3. Fetch all available sections for external courses
  const allExternalSections = await Section.find({
    course: { $in: externalCourses.map((c) => c.code) },
  }).lean();

  // --- NEW: Diagnostic Logging ---
  // Check which external courses have sections defined in the database.
  const externalCourseCodesWithSections = [
    ...new Set(allExternalSections.map((s) => s.course)),
  ];
  const externalCoursesWithoutSections = externalCourses.filter(
    (c) => !externalCourseCodesWithSections.includes(c.code)
  );

  if (externalCoursesWithoutSections.length > 0) {
    console.warn(
      "⚠️ The following external courses were found but have NO predefined sections. They will NOT be included in the schedule:"
    );
    externalCoursesWithoutSections.forEach((c) =>
      console.warn(`- ${c.name} (${c.code})`)
    );
  }
  // --- END: Diagnostic Logging ---

  const savedSchedules = [];

  // 4. Loop through each group to generate a unique schedule
  for (let i = 1; i <= numberOfGroups; i++) {
    const groupNum = i;
    console.log(`\n--- Generating schedule for Group ${groupNum} ---`);

    // 5. Select a unique set of external sections for the current group
    // The sec_num format "L3-MATH106-G1" suggests the group is part of the section identifier.
    const groupExternalSections = allExternalSections.filter((section) => {
      // This regex will look for "-G" followed by the group number at the end of the sec_num
      const groupIdentifier = `-G${groupNum}`;
      return section.sec_num.endsWith(groupIdentifier);
    });

    if (groupExternalSections.length === 0 && externalCourses.length > 0) {
      console.warn(
        `No external sections found for Group ${groupNum}. This group might have an incomplete schedule.`
      );
    }

    // 6. Construct a dynamic prompt for the Gemini API for each group
    const prompt = `
You are an academic schedule generator for King Saud University (Software Engineering Department).
The week starts from Sunday.
The time slots are from 8:00 AM to 2:50 PM, each slot is one hour.

Generate a weekly schedule for Level ${levelNum}, Group ${groupNum}.
Each course has a duration in hours.

---

🧩 Software Engineering Courses (To be scheduled)
${
  sweCourses.length > 0
    ? sweCourses
        .map((c) => `- ${c.name} (${c.code}), Duration: ${c.duration}h`)
        .join("\n")
    : "None"
}

---

📘 External Department Courses (Fixed Schedule for Group ${groupNum})
${
  groupExternalSections.length > 0
    ? groupExternalSections
        .map(
          (s) => `
- Course: ${s.course}
  Section: ${s.sec_num}
  Times:
${s.time_Slot.map((ts) => `    - ${ts}`).join("\n")}
        `
        )
        .join("\n")
    : "None (no external courses found for this group)"
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
1. Do NOT modify the predefined external time slots for Group ${groupNum}.
2. Ensure no overlap between software engineering courses and the fixed external ones.
3. Avoid double-booking instructors or classrooms.
4. The total scheduled time for each course must match its duration.
5. Use only available times (8:00 AM - 2:50 PM).
6. Do not include any midterm slot.
7-if the slot is lab mark it as (L) and if it a lecture mark it as(L) and if it is a toutorial mark it as (T)
8- unify the design
---

The output must be pure JSON (no text, no Markdown) in the format:
[
  {
    "section": "Group ${groupNum}",
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

    console.log(`🧠 Gemini Prompt Preview for Group ${groupNum}:\n`, prompt);
    console.log("------------------------------------");

    const parsedSchedule = await generateWithGemini(prompt);

    // Add group information to the schedule before saving
    const scheduleForDb = parsedSchedule.map((s) => ({
      ...s,
      section: `Group ${groupNum}`,
    }));

    const inserted = await Schedule.insertMany(scheduleForDb);
    savedSchedules.push(...inserted);
  }

  const refreshedSchedules = await Schedule.find({
    _id: { $in: savedSchedules.map((s) => s._id) },
  }).lean();

  console.log("\n✅ All schedules successfully saved with IDs:");
  console.log(refreshedSchedules);

  return { schedules: refreshedSchedules };
};