import { Request, Response } from 'express';
import courseService from '../../business/services/courseService';
import { CourseCreateInput } from '../../types';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await courseService.getAllCourses();
    res.json({
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCoursesByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const courses = await courseService.getCoursesByDepartment(department as string);
    res.json({
      department: department,
      courses: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Error fetching courses by department:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCourseDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseCode } = req.params;
    
    if (!courseCode) {
      res.status(400).json({ error: 'Course code is required' });
      return;
    }

    const course = await courseService.getCourseDetails(courseCode);
    
    res.json({
      code: course.code,
      name: course.name,
      credit_hours: course.credit_hours,
      department: course.department,
      college: course.college,
      is_elective: course.is_elective,
      duration: course.Duration,
      pattern: course.pattern || null,
      prerequisites: course.prerequisites || []
    });
  } catch (error) {
    const statusCode = (error as Error).message === 'Course not found' ? 404 : 500;
    res.status(statusCode).json({ error: (error as Error).message });
  }
};

export const createCourse = async (req: Request<{}, {}, CourseCreateInput>, res: Response): Promise<void> => {
  try {
    console.log('📝 Creating course:', req.body.code);
    const course = await courseService.createCourse(req.body);
    res.status(201).json({
      message: 'Course created successfully',
      course: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({ error: (error as Error).message });
  }
};