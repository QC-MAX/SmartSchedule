const { getDB } = require('../../db/connect');
const sectionRepository = require('../../data/repositories/sectionRepository');

class SectionService {
    
    async getLectureSections(courseCode) {
        const db = getDB();
        return await db.collection('Section')
            .find({ 
                course: courseCode,
                type: 'lecture'
            })
            .sort({ sec_num: 1 })
            .toArray();
    }

    async getAllSections() {
        const db = getDB();
        return await db.collection('Section').find().toArray();
    }

    async createSection(sectionData) {
        const db = getDB();
        
        // Verify course exists
        const course = await db.collection('Course').findOne({ code: sectionData.course_code });
        if (!course) {
            throw new Error('Course not found');
        }

        // Check if section type matches course pattern
        if (course.pattern) {
            const sectionType = sectionData.type || 'lecture';
            const isValidType = this.validateSectionTypeAgainstPattern(sectionType, course.pattern);
            
            if (!isValidType) {
                throw new Error(`Section type "${sectionType}" doesn't match course pattern`);
            }
        }

        // Generate section number
        const sectionNumber = await this.generateSectionNumber();

        // Format time slots
        const formattedTimeSlots = sectionData.time_slots.map(slot => {
            return `${slot.day} ${slot.start_time}-${slot.end_time}`;
        });

        // Create new section
        const newSection = {
            sec_num: sectionNumber,
            classroom: sectionData.classroom || null,
            max_Number: sectionData.max_number ? parseInt(sectionData.max_number) : null,
            time_Slot: formattedTimeSlots,
            course: sectionData.course_code,
            academic_level: sectionData.academic_level ? parseInt(sectionData.academic_level) : null,
            type: sectionData.type || 'lecture',
            follows_lecture: sectionData.follows_lecture || null,
            time_slots_detail: sectionData.time_slots,
            created_at: new Date(),
            created_by: sectionData.faculty_id || 'file_upload'
        };

        const result = await db.collection('Section').insertOne(newSection);
        newSection._id = result.insertedId;

        return newSection;
    }

    async generateSectionNumber() {
        const db = getDB();
        const lastSection = await db.collection('Section')
            .find()
            .sort({ sec_num: -1 })
            .limit(1)
            .toArray();

        if (lastSection.length === 0) {
            return '72700';
        }

        const lastNumber = parseInt(lastSection[0].sec_num || lastSection[0].sec_numb || '72699');
        const nextNumber = lastNumber + 1;

        return nextNumber.toString();
    }

    validateSectionTypeAgainstPattern(sectionType, pattern) {
        if (!pattern || !pattern.type) return true;
        
        const normalizedType = sectionType.toLowerCase();
        
        switch(pattern.type) {
            case 'lecture_only':
                return normalizedType === 'lecture';
            case 'lecture_tutorial':
                return normalizedType === 'lecture' || normalizedType === 'tutorial';
            case 'lecture_lab':
                return normalizedType === 'lecture' || normalizedType.includes('lab');
            case 'lecture_lab_tutorial':
                return ['lecture', 'tutorial'].includes(normalizedType) || normalizedType.includes('lab');
            case 'lab_only':
                return normalizedType.includes('lab');
            case 'custom':
                return true;
            default:
                return true;
        }
    }


    async createSectionUnified(sectionData) {
        const db = getDB();
        
        // Verify course exists
        const course = await db.collection('Course').findOne({ 
            code: sectionData.course_code 
        });
        
        if (!course) {
            throw new Error('Course not found');
        }
        
        // Validate required fields
        if (!sectionData.time_Slot || !Array.isArray(sectionData.time_Slot)) {
            throw new Error('time_Slot array is required');
        }
        
        if (sectionData.time_Slot.length === 0) {
            throw new Error('At least one time slot is required');
        }
        
        console.log('🔧 Service: Creating unified section for', sectionData.course_code);
        
        // Use repository to create the section
        const newSection = await sectionRepository.createUnifiedSection({
            course: sectionData.course_code,
            classroom: sectionData.classroom || null,
            max_Number: sectionData.max_Number || null,
            time_Slot: sectionData.time_Slot,
            time_slots_detail: sectionData.time_slots_detail || [],
            academic_level: sectionData.academic_level || null,
            created_by: sectionData.created_by || 'manual_entry'
        });
        
        console.log('✅ Service: Unified section created:', newSection.sec_num);
        return newSection;
    }
    
}

module.exports = new SectionService();