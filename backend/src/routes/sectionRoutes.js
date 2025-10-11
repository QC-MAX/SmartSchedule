const express = require('express');
const {
    getLectureSections,
    getAllSections,
    createSection,
    createSectionUnified
} = require('../api/controllers/sectionController');

const router = express.Router();

router.get('/lecture-sections/:courseCode', getLectureSections);
router.get('/sections', getAllSections);
router.post('/create-section', createSection);
router.post('/create-section-unified', createSectionUnified);

module.exports = router;