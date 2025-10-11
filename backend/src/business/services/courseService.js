const courseRepository = require('../../data/repositories/courseRepository');

class CourseService {
    async getAllCourses() {
        return await courseRepository.findAll();
    }

    async getCoursesByDepartment(department) {
        return await courseRepository.findByDepartment(department);
    }

    async getCourseDetails(courseCode) {
        const course = await courseRepository.findByCode(courseCode);
        if (!course) {
            throw new Error('Course not found');
        }
        return course;
    }

    async createCourse(courseData) {
        // Validate required fields
        this.validateRequiredFields(courseData);
        
        // Check duplicates
        await this.checkDuplicates(courseData);
        
        // Validate prerequisites
        await this.validatePrerequisites(courseData.prerequisites);
        
        // Validate pattern
        this.validatePattern(courseData.pattern, courseData.Duration);
        
        // Transform and create
        const transformedCourse = this.transformCourseData(courseData);
        return await courseRepository.create(transformedCourse);
    }

    validateRequiredFields(courseData) {
        const required = ['name', 'code', 'credit_hours', 'Duration', 'department', 'college', 'level'];
        const missing = required.filter(field => !courseData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }

    async checkDuplicates(courseData) {
        const existingByCode = await courseRepository.findByCode(courseData.code);
        if (existingByCode) {
            throw new Error(`Course with code "${courseData.code.toUpperCase()}" already exists`);
        }

        const existingByName = await courseRepository.findByName(courseData.name);
        if (existingByName) {
            throw new Error(`Course with name "${courseData.name}" already exists`);
        }
    }

    async validatePrerequisites(prerequisites) {
        if (!prerequisites || prerequisites.length === 0 || prerequisites[0] === null) {
            return;
        }

        const validPrereqs = await courseRepository.validatePrerequisites(prerequisites);
        if (validPrereqs.length !== prerequisites.length) {
            const invalidPrereqs = prerequisites.filter(prereq => 
                !validPrereqs.some(course => course.code === prereq)
            );
            throw new Error(`Invalid prerequisites: ${invalidPrereqs.join(', ')}`);
        }
    }

    validatePattern(pattern, duration) {
        if (!pattern) return;

        const lectureHours = parseInt(pattern.lecture_hours) || 0;
        const labHours = parseInt(pattern.lab_hours) || 0;
        const tutorialHours = parseInt(pattern.tutorial_hours) || 0;
        const totalPatternHours = lectureHours + labHours + tutorialHours;

        if (totalPatternHours !== parseInt(duration)) {
            throw new Error(
                `Pattern total hours (${totalPatternHours}) doesn't match Duration (${duration})`
            );
        }
    }

    transformCourseData(courseData) {
        let coursePattern = null;
        if (courseData.pattern) {
            const lectureHours = parseInt(courseData.pattern.lecture_hours) || 0;
            const labHours = parseInt(courseData.pattern.lab_hours) || 0;
            const tutorialHours = parseInt(courseData.pattern.tutorial_hours) || 0;

            coursePattern = {
                type: courseData.pattern.type,
                lecture_hours: lectureHours,
                lab_hours: labHours,
                tutorial_hours: tutorialHours,
                total_hours: lectureHours + labHours + tutorialHours
            };
        }

        return {
            name: courseData.name.trim(),
            code: courseData.code.toUpperCase().trim(),
            credit_hours: parseInt(courseData.credit_hours),
            Duration: parseInt(courseData.Duration),
            is_elective: Boolean(courseData.is_elective),
            department: courseData.department,
            college: courseData.college,
            level: parseInt(courseData.level),
            prerequisites: courseData.prerequisites && courseData.prerequisites.length > 0 && 
                          courseData.prerequisites[0] !== null ? courseData.prerequisites : [null],
            exam_date: courseData.exam_date || null,
            exam_time: courseData.exam_time || null,
            pattern: coursePattern,
            section: [null],
            created_at: new Date(),
            updated_at: new Date()
        };
    }
}

module.exports = new CourseService();