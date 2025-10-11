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
async createUnifiedSection(sectionData) {
        const db = getDB();
        
        // Generate unique section number
        const lastSection = await this.getLastSection();
        let newSecNum = '72700';
        
        if (lastSection.length > 0 && lastSection[0].sec_num) {
            const lastNum = parseInt(lastSection[0].sec_num);
            newSecNum = String(lastNum + 1);
        }
        
        // Create the unified section document
        const sectionDoc = {
            sec_num: newSecNum,
            course: sectionData.course,
            classroom: sectionData.classroom,
            max_Number: sectionData.max_Number,
            time_Slot: sectionData.time_Slot,  // Array: ["lecture: Sunday 8:00-10:00", "lab: Monday 9:00-11:00"]
            time_slots_detail: sectionData.time_slots_detail || [],
            academic_level: sectionData.academic_level,
            created_at: new Date(),
            created_by: sectionData.created_by
        };
        
        // Insert into database
        const result = await db.collection('Section').insertOne(sectionDoc);
        
        console.log('✅ Repository: Unified section created:', newSecNum);
        
        return {
            ...sectionDoc,
            _id: result.insertedId
        };
    }
    

}

module.exports = new SectionRepository();