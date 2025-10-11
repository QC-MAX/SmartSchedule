const electiveService = require('../../business/services/electiveService');

const getElectiveCourses = async (req, res) => {
  try {
    const result = await electiveService.getElectiveCourses();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStudentElectives = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await electiveService.getStudentElectives(studentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD THIS EXPORT SECTION:
module.exports = {
  getElectiveCourses,
  getStudentElectives
};