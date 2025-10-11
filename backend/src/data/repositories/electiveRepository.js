const { getDB } = require('../../db/connect');

class ElectiveRepository {
    async findActiveDeadline() {
        const db = getDB();
        const currentDate = new Date();
        return await db.collection('elective_deadlines').findOne({
            is_active: true,
            start_date: { $lte: currentDate },
            end_date: { $gte: currentDate }
        });
    }

    async findUpcomingDeadlines() {
        const db = getDB();
        const currentDate = new Date();
        return await db.collection('elective_deadlines')
            .find({ start_date: { $gte: currentDate } })
            .sort({ start_date: 1 })
            .toArray();
    }

    async findSubmission(studentId, semester, academicYear) {
        const db = getDB();
        return await db.collection('elective_submissions').findOne({
            student_id: studentId,
            semester: semester,
            academic_year: academicYear
        });
    }

    async createSubmission(submissionData) {
        const db = getDB();
        const result = await db.collection('elective_submissions').insertOne(submissionData);
        return { ...submissionData, _id: result.insertedId };
    }

    async updateSubmission(submissionId, updateData) {
        const db = getDB();
        const result = await db.collection('elective_submissions').findOneAndUpdate(
            { _id: submissionId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        return result.value;
    }

    async findSubmissionsByLevel(level, semester, academicYear) {
        const db = getDB();
        return await db.collection('elective_submissions').find({
            student_level: parseInt(level),
            semester: semester,
            academic_year: academicYear,
            submission_status: 'submitted'
        }).toArray();
    }
}

module.exports = new ElectiveRepository();