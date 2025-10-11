class ValidationUtils {
    static validateCourseCode(code) {
        const pattern = /^[A-Z]{3,4}\d{3}$/i;
        return pattern.test(code);
    }

    static validatePattern(pattern, duration) {
        if (!pattern) return true;
        const total = (parseInt(pattern.lecture_hours) || 0) + 
                     (parseInt(pattern.lab_hours) || 0) + 
                     (parseInt(pattern.tutorial_hours) || 0);
        return total === parseInt(duration);
    }
}