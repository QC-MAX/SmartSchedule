const { getDB } = require('../../db/connect');

class SectionRepository {
    async findAll() {
        const db = getDB();
        return await db.collection('Section').find().toArray();
    }

    async findByCourse(courseCode, type = null) {
        const db = getDB();
        const query = { course: courseCode };
        if (type) query.type = type;
        return await db.collection('Section')
            .find(query)
            .sort({ sec_num: 1 })
            .toArray();
    }

    async findById(sectionId) {
        const db = getDB();
        return await db.collection('Section').findOne({ sec_num: sectionId });
    }

    async getLastSection() {
        const db = getDB();
        return await db.collection('Section')
            .find()
            .sort({ sec_num: -1 })
            .limit(1)
            .toArray();
    }

    async create(sectionData) {
        const db = getDB();
        const result = await db.collection('Section').insertOne(sectionData);
        return { ...sectionData, _id: result.insertedId };
    }

    async update(sectionId, updateData) {
        const db = getDB();
        const result = await db.collection('Section').updateOne(
            { sec_num: sectionId },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    }

    async delete(sectionId) {
        const db = getDB();
        const result = await db.collection('Section').deleteOne({ sec_num: sectionId });
        return result.deletedCount > 0;
    }
}

module.exports = new SectionRepository();