const express = require('express');
const { 
  getElectiveCourses, 
  getStudentElectives 
} = require('../api/controllers/electiveController');

const router = express.Router();

router.get('/courses', getElectiveCourses);
router.get('/student/:studentId', getStudentElectives);

// Remove or comment out these routes until you create the controller functions:
// router.post('/start/:studentId', startElectives);
// router.put('/save/:studentId', saveElectives);
// router.post('/submit/:studentId', submitElectives);
// router.get('/statistics/:level', getElectiveStatistics);

module.exports = router;