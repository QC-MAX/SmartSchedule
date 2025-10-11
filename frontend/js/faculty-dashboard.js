// ============================================
// Faculty Dashboard - COMPLETE FIXED VERSION
// ============================================

// ✅ GLOBAL VARIABLES (needed for HTML onclick handlers)
window.courseFormCounter = 0;
window.sectionFormCounter = 0;
window.allCoursesForPrerequisites = [];
window.sectionTimeSlotsMap = {};
window.sectionCreditHoursMap = {};
window.availableLectureSections = {};

// Department mapping
window.departmentMapping = {
    'Science': 'Physics & Astronomy',
    'CSC': 'Computer Science',
    'IC': 'Islamic Culture',
    'IT': 'Information Technology',
    'IS': 'Information Systems',
    'Math': 'Mathematics',
    'CEN': 'Computer engineering'

   
};

// ============================================
// Main Faculty Dashboard Controller
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Faculty Dashboard...');
    
    checkFacultyAuth();
    
    // Initialize ALL managers
    window.courseManager = new CourseManager();
    window.sectionManager = new SectionManager();
    window.fileUploadManager = new FileUploadManager();
    
    await initializeDashboard();
    setupEventListeners();
    
    console.log('✅ Dashboard initialized successfully');
});

// ============================================
// Authentication
// ============================================
function checkFacultyAuth() {
    const userData = localStorage.getItem('studentData');
    if (!userData) {
        alert('⚠️ Please login first');
        window.location.href = '/login';
        return;
    }
    
    const user = JSON.parse(userData);
    if (user.role !== 'Faculty') {
        alert('❌ Access denied. Faculty only.');
        window.location.href = '/login';
        return;
    }
    
    console.log('✅ Faculty authenticated:', user.first_name, user.last_name);
}

function logout() {
    localStorage.removeItem('studentData');
    window.location.href = '/login';
}

// ============================================
// Initialization
// ============================================
async function initializeDashboard() {
    try {
        // Load courses for prerequisites
        await window.courseManager.loadAllCoursesForPrerequisites();
        
        // Add initial course form
        window.courseManager.addCourseForm();
        
        if (window.NotificationManager) {
            NotificationManager.success('Dashboard ready!');
        }
    } catch (error) {
        console.error('❌ Initialization error:', error);
        if (window.NotificationManager) {
            NotificationManager.error('Failed to initialize dashboard');
        }
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Modal close events
    const departmentModal = document.getElementById('departmentModal');
    if (departmentModal) {
        departmentModal.addEventListener('hidden.bs.modal', () => {
            resetAllForms();
        });
    }
    
    // Level buttons
    document.querySelectorAll('[onclick^="showLevel"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = parseInt(e.target.textContent.match(/\d+/)[0]);
            showLevel(level);
        });
    });
}

// ============================================
// Global Functions for HTML onclick handlers
// ============================================

// Course Management
window.addCourseForm = () => {
    if (window.courseManager) {
        window.courseManager.addCourseForm();
    } else {
        console.error('❌ CourseManager not initialized');
    }
};

window.removeCourseForm = (formId) => {
    if (window.courseManager) {
        window.courseManager.removeCourseForm(formId);
    }
};

window.createAllCourses = () => {
    if (window.courseManager) {
        window.courseManager.createAllCourses();
    } else {
        console.error('❌ CourseManager not initialized');
    }
};

// Section Management
window.filterCourses = () => {
    if (window.sectionManager) {
        window.sectionManager.filterCourses();
    } else {
        console.error('❌ SectionManager not initialized');
    }
};

window.updateCourseName = () => {
    if (window.sectionManager) {
        window.sectionManager.updateCourseName();
    }
};

window.addSectionForm = () => {
    if (window.sectionManager) {
        window.sectionManager.addSectionForm();
    } else {
        console.error('❌ SectionManager not initialized');
    }
};

window.removeSectionForm = (sectionId) => {
    if (window.sectionManager) {
        window.sectionManager.removeSectionForm(sectionId);
    }
};

window.createAllSections = () => {
    if (window.sectionManager) {
        window.sectionManager.createAllSections();
    } else {
        console.error('❌ SectionManager not initialized');
    }
};

// File Upload Management
window.showManualEntry = () => {
    if (window.fileUploadManager) {
        window.fileUploadManager.showManualEntry();
    } else {
        document.getElementById('fileUploadSection').style.display = 'none';
        document.getElementById('manualEntrySection').style.display = 'block';
    }
};

window.showFileUpload = () => {
    if (window.fileUploadManager) {
        window.fileUploadManager.showFileUpload();
    } else {
        document.getElementById('fileUploadSection').style.display = 'block';
        document.getElementById('manualEntrySection').style.display = 'none';
    }
};

window.handleFileSelect = async (event) => {
    if (window.fileUploadManager) {
        await window.fileUploadManager.handleFileSelect(event);
    } else {
        console.error('❌ FileUploadManager not initialized');
    }
};

window.cancelFileUpload = () => {
    if (window.fileUploadManager) {
        window.fileUploadManager.cancelFileUpload();
    } else {
        document.getElementById('filePreviewSection').style.display = 'none';
        document.getElementById('scheduleFile').value = '';
    }
};

window.processUploadedSchedule = async () => {
    if (window.fileUploadManager) {
        await window.fileUploadManager.processUploadedSchedule();
    } else {
        console.error('❌ FileUploadManager not initialized');
    }
};

// ============================================
// Schedule Management
// ============================================
let currentLevel = 3;

window.showLevel = (level) => {
    currentLevel = level;
    
    // Update active button
    document.querySelectorAll('.btn-outline-primary').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(`Level ${level}`)) {
            btn.classList.add('active');
        }
    });
    
    // Update schedule title
    const scheduleTitle = document.getElementById('scheduleTitle');
    if (scheduleTitle) {
        scheduleTitle.textContent = `Academic Schedule - Level ${level}`;
    }
    
    // Load schedule for this level
    loadScheduleForLevel(level);
};

async function loadScheduleForLevel(level) {
    try {
        console.log(`📅 Loading schedule for Level ${level}`);
        if (window.NotificationManager) {
            NotificationManager.info(`Loading Level ${level} schedule...`);
        }
        
        // TODO: Implement schedule loading
        // const response = await APIClient.get(`/schedule/level/${level}`);
        // renderSchedule(response.schedule);
    } catch (error) {
        console.error('Error loading schedule:', error);
        if (window.NotificationManager) {
            NotificationManager.warning(`No schedule available for Level ${level}`);
        }
    }
}

window.enableEditing = () => {
    if (window.NotificationManager) {
        NotificationManager.info('Edit mode enabled');
    }
    // TODO: Implement schedule editing
};

window.publishSchedule = () => {
    if (confirm('Publish this schedule to students?')) {
        if (window.NotificationManager) {
            NotificationManager.success('Schedule published!');
        }
        // TODO: Implement schedule publishing
    }
};

window.generateForLevel = (level, event) => {
    selectedLevelForGeneration = level;

    document.querySelectorAll('#generateScheduleModal .generate-option-btn').forEach((btn) => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });

    if (event && event.target) {
        event.target.classList.remove('btn-outline-primary');
        event.target.classList.add('btn-primary');
    }
};

window.confirmGeneration = () => {
    if (!selectedLevelForGeneration) {
        alert('Please select an academic level first');
        return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('generateScheduleModal'));
    if (modal) modal.hide();

    if (window.NotificationManager) {
        NotificationManager.info(`Generating schedule for Level ${selectedLevelForGeneration}...`);
    }
    
    // TODO: Implement schedule generation
};

// ============================================
// Utility Functions
// ============================================
function resetAllForms() {
    if (window.courseManager) {
        window.courseManager.reset();
    }
    if (window.sectionManager) {
        window.sectionManager.reset();
    }
    if (window.NotificationManager) {
        NotificationManager.info('Forms reset');
    }
}

console.log('✅ All global onclick handlers registered');
console.log('📊 Faculty Dashboard script COMPLETE loaded');