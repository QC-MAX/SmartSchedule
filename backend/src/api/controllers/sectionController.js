const sectionService = require('../../business/services/sectionService');

const getLectureSections = async (req, res) => {
    try {
        const { courseCode } = req.params;
        const lectureSections = await sectionService.getLectureSections(courseCode);
        
        res.json({
            course_code: courseCode,
            lecture_sections: lectureSections.map(section => ({
                sec_num: section.sec_num,
                time_slots: section.time_Slot,
                academic_level: section.academic_level
            })),
            count: lectureSections.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllSections = async (req, res) => {
    try {
        const sections = await sectionService.getAllSections();
        res.json({
            sections: sections,
            count: sections.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createSection = async (req, res) => {
    try {
        const section = await sectionService.createSection(req.body);
        res.status(201).json({
            message: 'Section created successfully',
            section: section
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getLectureSections,
    getAllSections,
    createSection
};