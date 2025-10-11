// ============================================
// frontend/js/services/courseService.js
// ============================================
class CourseServiceFrontend {
    async getAllCourses() {
        return await APIClient.get('/all-courses');
    }

    async getCoursesByDepartment(department) {
        const query = department && department !== 'all' ? `?department=${encodeURIComponent(department)}` : '';
        return await APIClient.get(`/courses-by-department${query}`);
    }

    async getCourseDetails(courseCode) {
        return await APIClient.get(`/course-details/${encodeURIComponent(courseCode)}`);
    }

    async createCourse(courseData) {
        return await APIClient.post('/create-course', courseData);
    }
}

const courseService = new CourseServiceFrontend();
window.courseService = courseService;

console.log('✅ CourseService loaded');

// ============================================
// Section Service (Combined in same file)
// ============================================
class SectionServiceFrontend {
    async getLectureSections(courseCode) {
        return await APIClient.get(`/lecture-sections/${encodeURIComponent(courseCode)}`);
    }

    async getAllSections() {
        return await APIClient.get('/sections');
    }

    async createSection(sectionData) {
        return await APIClient.post('/create-section', sectionData);
    }
}

const sectionService = new SectionServiceFrontend();
window.sectionService = sectionService;

console.log('✅ SectionService loaded');