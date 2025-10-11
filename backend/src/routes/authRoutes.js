const express = require('express');
const { login, getStudentData } = require('../api/controllers/authController');

const router = express.Router();

router.post('/login', login);
router.get('/student/:studentId', getStudentData);

module.exports = router;