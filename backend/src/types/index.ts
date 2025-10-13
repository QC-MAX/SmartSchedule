import { ObjectId } from 'mongodb';

// Course Pattern
export interface CoursePattern {
  type: 'lecture_only' | 'lecture_tutorial' | 'lecture_lab' | 'lecture_lab_tutorial' | 'lab_only' | 'custom';
  lecture_hours: number;
  lab_hours: number;
  tutorial_hours: number;
  total_hours: number;
}

// Course
export interface Course {
  _id?: ObjectId;
  name: string;
  code: string;
  credit_hours: number;
  Duration: number;
  is_elective: boolean;
  department: string;
  college: string;
  level: number;
  prerequisites: (string | null)[];
  exam_date: string | null;
  exam_time: string | null;
  pattern: CoursePattern | null;
  section: (string | null)[];
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseCreateInput {
  name: string;
  code: string;
  credit_hours: number;
  Duration: number;
  is_elective?: boolean;
  department: string;
  college: string;
  level: number;
  prerequisites?: string[];
  exam_date?: string | null;
  exam_time?: string | null;
  pattern?: {
    type: string;
    lecture_hours: number;
    lab_hours: number;
    tutorial_hours: number;
  };
}

// Section Types
export interface TimeSlotDetail {
  day: string;
  start_time: string;
  end_time: string;
  duration?: number;
  type?: string;
}

export interface Section {
  _id?: ObjectId;
  sec_num: string;
  course: string;
  classroom: string | null;
  max_Number: number | null;
  time_Slot: string[];
  time_slots_detail: TimeSlotDetail[];
  academic_level: number | null;
  type?: 'lecture' | 'lab' | 'tutorial';
  follows_lecture?: string | null;
  created_at: Date;
  created_by: string;
}

export interface SectionCreateInput {
  course_code: string;
  classroom?: string;
  max_number?: number;
  time_slots: TimeSlotDetail[];
  academic_level?: number;
  type?: 'lecture' | 'lab' | 'tutorial';
  follows_lecture?: string;
  faculty_id?: string;
}

export interface UnifiedSectionInput {
  course_code: string;
  classroom?: string;
  max_Number?: number;
  time_Slot: string[];
  time_slots_detail?: TimeSlotDetail[];
  academic_level?: number;
  created_by?: string;
}