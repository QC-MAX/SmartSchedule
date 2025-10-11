const electiveRepository = require('../../data/repositories/electiveRepository');

class ElectiveService {
    async getElectiveCourses() {
        return await electiveRepository.getElectiveCourses();
    }
    
    async getStudentElectives(studentId) {
        return await electiveRepository.getStudentElectives(studentId);
    }
    
    async submitElectiveChoice(studentId, courseCode, level) {
        return await electiveRepository.submitElectiveChoice(studentId, courseCode, level);
    }
    
    async getElectiveStatsByLevel(level) {
        return await electiveRepository.getElectiveStatsByLevel(level);
    }
}

module.exports = new ElectiveService();