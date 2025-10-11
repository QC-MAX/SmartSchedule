const { getDB } = require('../../db/connect');

class StudentRepository {
    async findById(studentId) {
        const db = getDB();
        return await db.collection('student').findOne({ student_id: studentId });
    }

    async findByLevel(level) {
        const db = getDB();
        return await db.collection('student').find({ level: parseInt(level) }).toArray();
    }

    async countByLevel(level) {
        const db = getDB();
        return await db.collection('student').countDocuments({ level: parseInt(level) });
    }

    async updateElectiveChoices(studentId, electiveCourses) {
        const db = getDB();
        const result = await db.collection('student').updateOne(
            { student_id: studentId },
            { $set: { user_elective_choice: electiveCourses } }
        );
        return result.modifiedCount > 0;
    }

    async resetAllElectiveChoices() {
        const db = getDB();
        const result = await db.collection('student').updateMany(
            {},
            { $set: { user_elective_choice: [] } }
        );
        return result.modifiedCount;
    }
}

module.exports = new StudentRepository();
