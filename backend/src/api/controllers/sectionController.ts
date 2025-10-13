import { Request, Response } from 'express';
import sectionService from '../../business/services/sectionService';
import { SectionCreateInput, UnifiedSectionInput } from '../../types';

export const getLectureSections = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getAllSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = await sectionService.getAllSections();
    res.json({
      sections: sections,
      count: sections.length
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createSection = async (req: Request<{}, {}, SectionCreateInput>, res: Response): Promise<void> => {
  try {
    const section = await sectionService.createSection(req.body);
    res.status(201).json({
      message: 'Section created successfully',
      section: section
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const createSectionUnified = async (req: Request<{}, {}, UnifiedSectionInput>, res: Response): Promise<void> => {
  try {
    console.log('📦 Controller: Creating unified section');
    const section = await sectionService.createSectionUnified(req.body);
    res.status(201).json({
      message: 'Unified section created successfully',
      section: {
        sec_num: section.sec_num,
        course: section.course,
        time_slots: section.time_Slot.length
      }
    });
  } catch (error) {
    console.error('❌ Controller error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
};