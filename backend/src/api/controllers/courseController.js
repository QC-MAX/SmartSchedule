const courseService = require('../../business/services/courseService');

const getAllCourses = async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.json({
            courses: courses,
            count: courses.length
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: error.message });
    }
};

const getCoursesByDepartment = async (req, res) => {
    try {
        const { department } = req.query;
        const courses = await courseService.getCoursesByDepartment(department);
        res.json({
            department: department,
            courses: courses,
            count: courses.length
        });
    } catch (error) {
        console.error('Error fetching courses by department:', error);
        res.status(500).json({ error: error.message });
    }
};

const getCourseDetails = async (req, res) => {
    try {
        const { courseCode } = req.params;
        
        if (!courseCode) {
            return res.status(400).json({ error: 'Course code is required' });
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
        const statusCode = error.message === 'Course not found' ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};

const createCourse = async (req, res) => {
    try {
        console.log('ðŸ“ Creating course:', req.body.code);
        const course = await courseService.createCourse(req.body);
        res.status(201).json({
            message: 'Course created successfully',
            course: course
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllCourses,
    getCoursesByDepartment,
    getCourseDetails,
    createCourse
};