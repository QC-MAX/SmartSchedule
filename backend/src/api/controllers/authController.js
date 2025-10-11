const userRepository = require('../../data/repositories/userRepository');
const studentRepository = require('../../data/repositories/studentRepository');

const login = async (req, res) => {
    try {
        const { student_id, password } = req.body;
        
        if (!student_id || !password) {
            return res.status(400).json({ error: 'Student ID and password are required' });
        }
        
        // Try student login first (with @student.ksu.edu.sa)
        const email = `${student_id}@student.ksu.edu.sa`;
        let user = await userRepository.findByEmailAndPassword(email, password);
        
        // If not student, try faculty (direct email)
        if (!user) {
            user = await userRepository.findByEmailAndPassword(student_id, password);
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If faculty, return faculty data
        if (user.role === 'Faculty') {
            return res.json({
                user_id: user.userID,
                first_name: user.First_Name,
                last_name: user.Last_Name,
                email: user.Email,
                role: user.role
            });
        }

        // For students, get additional student data
        const student = await studentRepository.findById(student_id);
        if (!student) {
            return res.status(404).json({ error: 'Student data not found' });
        }

        res.json({
            student_id: student_id,
            level: student.level,
            irregulars: student.irregulars || false,
            user_elective_choice: student.user_elective_choice || [],
            first_name: user.First_Name,
            last_name: user.Last_Name,
            email: user.Email,
            role: user.role || 'Student'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
};

const getStudentData = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const student = await studentRepository.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({
            student_id: student.student_id,
            user_id: student.user_id,
            level: student.level,
            irregulars: student.irregulars || false,
            courses_taken: student.courses_taken || [],
            user_elective_choice: student.user_elective_choice || [],
            prevent_falling_behind_courses: student.prevent_falling_behind_courses || [],
            remaining_courses_from_past_levels: student.remaining_courses_from_past_levels || []
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Failed to fetch student data' });
    }
};

module.exports = { login, getStudentData };