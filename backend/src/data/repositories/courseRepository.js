const { getDB } = require('../../db/connect');

class CourseRepository {
    async findAll() {
        const db = getDB();
        return await db.collection('Course').find({}).sort({ code: 1 }).toArray();
    }

    async findByCode(courseCode) {
        const db = getDB();
        return await db.collection('Course').findOne({ 
            code: courseCode.toUpperCase().trim() 
        });
    }

    async findByName(courseName) {
        const db = getDB();
        return await db.collection('Course').findOne({ 
            name: { $regex: new RegExp(`^${courseName.trim()}$`, 'i') }
        });
    }

    async findByDepartment(department) {
        const db = getDB();
        const query = department && department !== 'all' 
            ? { department: department } 
            : {};
        return await db.collection('Course').find(query).toArray();
    }

    async findElectives() {
        const db = getDB();
        return await db.collection('Course')
            .find({ is_elective: true })
            .project({
                name: 1,
                code: 1,
                credit_hours: 1,
                department: 1,
                college: 1,
                description: 1
            })
            .toArray();
    }

    async validatePrerequisites(prerequisites) {
        const db = getDB();
        return await db.collection('Course')
            .find({ code: { $in: prerequisites } })
            .toArray();
    }

    async create(courseData) {
        const db = getDB();
        const result = await db.collection('Course').insertOne(courseData);
        return { ...courseData, _id: result.insertedId };
    }

    async update(courseCode, updateData) {
        const db = getDB();
        const result = await db.collection('Course').updateOne(
            { code: courseCode.toUpperCase() },
            { $set: { ...updateData, updated_at: new Date() } }
        );
        return result.modifiedCount > 0;
    }

    async delete(courseCode) {
        const db = getDB();
        const result = await db.collection('Course').deleteOne({
            code: courseCode.toUpperCase()
        });
        return result.deletedCount > 0;
    }
}

module.exports = new CourseRepository();