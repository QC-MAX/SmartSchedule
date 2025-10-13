import { getDB } from '../../db/connection';
import { Section, UnifiedSectionInput } from '../../types';

class SectionRepository {
  async findAll(): Promise<Section[]> {
    const db = getDB();
    return await db.collection<Section>('Section').find().toArray();
  }

  async findByCourse(courseCode: string, type?: string | null): Promise<Section[]> {
    const db = getDB();
    const query: any = { course: courseCode };
    if (type) query.type = type;
    return await db.collection<Section>('Section')
      .find(query)
      .sort({ sec_num: 1 })
      .toArray();
  }

  async findById(sectionId: string): Promise<Section | null> {
    const db = getDB();
    return await db.collection<Section>('Section').findOne({ sec_num: sectionId });
  }

  async getLastSection(): Promise<Section[]> {
    const db = getDB();
    return await db.collection<Section>('Section')
      .find()
      .sort({ sec_num: -1 })
      .limit(1)
      .toArray();
  }

  async create(sectionData: Section): Promise<Section> {
    const db = getDB();
    const result = await db.collection<Section>('Section').insertOne(sectionData);
    return { ...sectionData, _id: result.insertedId };
  }

  async update(sectionId: string, updateData: Partial<Section>): Promise<boolean> {
    const db = getDB();
    const result = await db.collection<Section>('Section').updateOne(
      { sec_num: sectionId },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async delete(sectionId: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection<Section>('Section').deleteOne({ sec_num: sectionId });
    return result.deletedCount > 0;
  }

  async createUnifiedSection(sectionData: UnifiedSectionInput): Promise<Section> {
    const db = getDB();
    
    // Generate unique section number
    const lastSection = await this.getLastSection();
    let newSecNum = '72700';
    
    if (lastSection.length > 0 && lastSection[0].sec_num) {
      const lastNum = parseInt(lastSection[0].sec_num);
      newSecNum = String(lastNum + 1);
    }
    
    // Create the unified section document
    const sectionDoc: Section = {
      sec_num: newSecNum,
      course: sectionData.course_code,
      classroom: sectionData.classroom || null,
      max_Number: sectionData.max_Number || null,
      time_Slot: sectionData.time_Slot,
      time_slots_detail: sectionData.time_slots_detail || [],
      academic_level: sectionData.academic_level || null,
      created_at: new Date(),
      created_by: sectionData.created_by || 'manual_entry'
    };
    
    // Insert into database
    const result = await db.collection<Section>('Section').insertOne(sectionDoc);
    
    console.log('✅ Repository: Unified section created:', newSecNum);
    
    return {
      ...sectionDoc,
      _id: result.insertedId
    };
  }
}

export default new SectionRepository();