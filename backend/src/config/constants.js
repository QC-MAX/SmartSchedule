module.exports = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    DB_NAME: process.env.DB_NAME || 'SmartSchedule',
    PORT: process.env.PORT || 5000,
    
    COLLECTIONS: {
        COURSES: 'Course',
        SECTIONS: 'Section',
        STUDENTS: 'Student',
        SCHEDULES: 'Schedule',
        ELECTIVES: 'Elective'
    },

    PATTERNS: {
        LECTURE_ONLY: 'lecture_only',
        LECTURE_TUTORIAL: 'lecture_tutorial',
        LECTURE_LAB: 'lecture_lab',
        LECTURE_LAB_TUTORIAL: 'lecture_lab_tutorial',
        LAB_ONLY: 'lab_only',
        CUSTOM: 'custom'
    },

    SECTION_TYPES: {
        LECTURE: 'lecture',
        LAB: 'lab',
        TUTORIAL: 'tutorial'
    },

    DAYS: {
        1: 'Sunday',
        2: 'Monday',
        3: 'Tuesday',
        4: 'Wednesday',
        5: 'Thursday'
    }
};