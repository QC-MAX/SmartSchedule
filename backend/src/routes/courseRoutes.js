const express = require('express');
const {
    getAllCourses,
    getCoursesByDepartment,
    getCourseDetails,
    createCourse
} = require('../api/controllers/courseController');

const router = express.Router();

router.get('/all-courses', getAllCourses);
router.get('/courses-by-department', getCoursesByDepartment);
router.get('/course-details/:courseCode', getCourseDetails);
router.post('/create-course', createCourse);

module.exports = router;