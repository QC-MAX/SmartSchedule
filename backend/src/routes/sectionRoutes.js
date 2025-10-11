const express = require('express');
const {
    getLectureSections,
    getAllSections,
    createSection
} = require('../api/controllers/sectionController');

const router = express.Router();

router.get('/lecture-sections/:courseCode', getLectureSections);
router.get('/sections', getAllSections);
router.post('/create-section', createSection);

module.exports = router;