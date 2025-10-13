import { Router, Request, Response } from 'express';
import database from '../db/database.js';
const router = Router();

async function checkElectiveFormActive() {
  try {
    const db = database.getDb();
    const currentDate = new Date();
    const activeForm = await db.collection('elective_deadlines').findOne({
      is_active: true,
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate }
    });
    
    return activeForm;
  } catch (error) {
    console.error('Error checking elective form:', error);
    return null;
  }
}

router.get('/elective-courses', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const activeForm = await checkElectiveFormActive();
    
    if (!activeForm) {
      return res.status(400).json({ 
        error: 'Elective form is not currently active'
      });
    }

    const courses = await db.collection('Course')
      .find({ is_elective: true })
      .project({
        name: 1,
        code: 1,
        credit_hours: 1,
        department: 1,
        college: 1,
        description: 1
      })
      .toArray();
    
    res.json({
      courses: courses,
      deadline: activeForm.end_date,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year
    });
  } catch (error) {
    console.error('Error fetching elective courses:', error);
    res.status(500).json({ error: 'Failed to fetch elective courses' });
  }
});

router.get('/student-electives/:studentId', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const studentId = req.params.studentId;
    const activeForm = await checkElectiveFormActive();
    
    if (!activeForm) {
      return res.json({ 
        form_active: false,
        message: 'Elective form is not currently active'
      });
    }

    const student = await db.collection('student').findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const submission = await db.collection('elective_submissions').findOne({
      student_id: studentId,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year
    });

    res.json({
      form_active: true,
      student_level: student.level,
      submission: submission,
      form_deadline: activeForm.end_date,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year,
      has_started: !!submission
    });
  } catch (error) {
    console.error('Error fetching student electives:', error);
    res.status(500).json({ error: 'Failed to fetch student data' });
  }
});

router.post('/start-electives/:studentId', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const studentId = req.params.studentId;
    const activeForm = await checkElectiveFormActive();
    
    if (!activeForm) {
      return res.status(400).json({ 
        error: 'Elective form is not currently active' 
      });
    }

    const existing = await db.collection('elective_submissions').findOne({
      student_id: studentId,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year
    });

    if (existing) {
      return res.json({ 
        message: 'Form already started', 
        submission: existing 
      });
    }

    const student = await db.collection('student').findOne({ student_id: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const submission = {
      student_id: studentId,
      student_level: student.level,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year,
      selected_courses: [],
      suggestions: '',
      submission_status: 'draft',
      started_at: new Date(),
      last_saved: new Date(),
      submitted_at: null
    };

    const result = await db.collection('elective_submissions').insertOne(submission);

    res.json({ 
      message: 'Form started successfully', 
      submission: { ...submission, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error starting electives:', error);
    res.status(500).json({ error: 'Failed to start form' });
  }
});

router.put('/save-electives/:studentId', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const studentId = req.params.studentId;
    const { selected_courses, suggestions } = req.body;
    
    const activeForm = await checkElectiveFormActive();
    if (!activeForm) {
      return res.status(400).json({ 
        error: 'Elective form is not currently active' 
      });
    }

    const courses = await db.collection('Course')
      .find({ code: { $in: selected_courses }, is_elective: true })
      .toArray();
    
    if (courses.length !== selected_courses.length) {
      return res.status(400).json({ error: 'One or more selected courses are invalid' });
    }

    const result = await db.collection('elective_submissions').findOneAndUpdate(
      { 
        student_id: studentId, 
        semester: activeForm.semester, 
        academic_year: activeForm.academic_year 
      },
      {
        $set: {
          selected_courses: selected_courses || [],
          suggestions: suggestions || '',
          last_saved: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    // Fix: Check if result is null
    if (!result) {
      return res.status(404).json({ error: 'Form not started. Please start the form first.' });
    }

    res.json({ 
      message: 'Form saved successfully', 
      submission: result
    });
  } catch (error) {
    console.error('Error saving electives:', error);
    res.status(500).json({ error: 'Failed to save form' });
  }
});

router.post('/submit-electives/:studentId', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const studentId = req.params.studentId;
    const activeForm = await checkElectiveFormActive();
    
    if (!activeForm) {
      return res.status(400).json({ 
        error: 'Elective form is not currently active' 
      });
    }

    const submission = await db.collection('elective_submissions').findOne({
      student_id: studentId,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year
    });

    if (!submission) {
      return res.status(404).json({ error: 'Form not found. Please start the form first.' });
    }

    if (submission.submission_status === 'submitted') {
      return res.status(400).json({ error: 'Form already submitted' });
    }

    await db.collection('elective_submissions').updateOne(
      { _id: submission._id },
      {
        $set: {
          submission_status: 'submitted',
          submitted_at: new Date()
        }
      }
    );

    await db.collection('student').updateOne(
      { student_id: studentId },
      { $set: { user_elective_choice: submission.selected_courses } }
    );

    const updatedSubmission = await db.collection('elective_submissions').findOne({
      _id: submission._id
    });

    res.json({ 
      message: 'Form submitted successfully', 
      submission: updatedSubmission 
    });
  } catch (error) {
    console.error('Error submitting electives:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

router.get('/elective-statistics/:level', async (req: Request, res: Response) => {
  try {
    const db = database.getDb();
    const level = parseInt(req.params.level);
    const activeForm = await checkElectiveFormActive();
    
    if (!activeForm) {
      return res.status(400).json({ 
        error: 'No active elective form period' 
      });
    }

    const submissions = await db.collection('elective_submissions')
      .find({
        student_level: level,
        semester: activeForm.semester,
        academic_year: activeForm.academic_year,
        submission_status: 'submitted'
      })
      .toArray();

    const courseCounts: { [key: string]: number } = {};
    submissions.forEach(submission => {
      submission.selected_courses.forEach((courseCode: string) => {
        courseCounts[courseCode] = (courseCounts[courseCode] || 0) + 1;
      });
    });

    const courseCodes = Object.keys(courseCounts);
    const courses = await db.collection('Course')
      .find({ code: { $in: courseCodes } })
      .toArray();

    const courseDetails: { [key: string]: any } = {};
    courses.forEach(course => {
      courseDetails[course.code] = course;
    });

    const sortedCourses = Object.entries(courseCounts)
      .map(([course_code, count]) => ({
        course_code,
        count,
        course_name: courseDetails[course_code]?.name || 'Unknown Course',
        credit_hours: courseDetails[course_code]?.credit_hours || 0,
        department: courseDetails[course_code]?.department || 'Unknown'
      }))
      .sort((a, b) => b.count - a.count);

    const totalStudents = await db.collection('student')
      .countDocuments({ level: level });

    res.json({
      level: level,
      semester: activeForm.semester,
      academic_year: activeForm.academic_year,
      total_students: totalStudents,
      total_submissions: submissions.length,
      submission_rate: totalStudents > 0 ? (submissions.length / totalStudents * 100).toFixed(1) : 0,
      course_selections: sortedCourses,
      generated_at: new Date()
    });
  } catch (error) {
    console.error('Error getting elective statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;