// ============================================
// Course Manager - COMPLETE FIXED VERSION
// ============================================
 

class CourseManager {
    constructor() {
        this.formCounter = 0;
        this.allCourses = [];
    }

    async loadAllCoursesForPrerequisites() {
        try {
            if (typeof APIClient === 'undefined') {
                console.error('❌ APIClient not loaded yet!');
                return;
            }
            
            const response = await APIClient.get('/all-courses');
            this.allCourses = response.courses || [];
            console.log('✅ Loaded courses for prerequisites:', this.allCourses.length);
        } catch (error) {
            console.error('Error loading courses:', error);
            if (window.NotificationManager) {
                NotificationManager.error('Failed to load courses: ' + error.message);
            }
        }
    }

    addCourseForm() {
        this.formCounter++;
        window.courseFormCounter = this.formCounter; // ✅ SYNC
        const formId = this.formCounter;
        
        const container = document.getElementById('coursesContainer');
        
        const courseForm = document.createElement('div');
        courseForm.className = 'card mb-3 course-form-card';
        courseForm.id = `courseForm_${formId}`;
        courseForm.innerHTML = `
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-book-fill"></i> Course #${formId}</h6>
                <button type="button" class="btn btn-sm btn-danger" onclick="window.courseManager.removeCourseForm(${formId})">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
            <div class="card-body">
                ${this.generateCourseFormFields(formId)}
            </div>
        `;
        
        container.appendChild(courseForm);
        this.populatePrerequisitesDropdown(formId);
    }

    generateCourseFormFields(formId) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Course Name *</label>
                        <input type="text" class="form-control" id="courseName_${formId}" 
                               placeholder="e.g., General Physics (1)" 
                               onblur="window.courseManager.checkCourseExists(${formId}, 'name')"
                               required />
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Course Code *</label>
                        <input type="text" class="form-control" id="courseCode_${formId}" 
                               placeholder="e.g., PHYS103" 
                               onblur="window.courseManager.checkCourseExists(${formId}, 'code')"
                               required />
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Credit Hours *</label>
                        <select class="form-control" id="creditHours_${formId}" required>
                            <option value="">Select hours</option>
                            <option value="1">1 Credit Hour</option>
                            <option value="2">2 Credit Hours</option>
                            <option value="3">3 Credit Hours</option>
                            <option value="4">4 Credit Hours</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Duration (hours/week) *</label>
                        <input type="number" class="form-control" id="duration_${formId}" 
                               placeholder="e.g., 5" min="1" max="10" required 
                               onchange="window.courseManager.validatePatternHours(${formId})" />
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Is Elective? *</label>
                        <select class="form-control" id="isElective_${formId}" required>
                            <option value="false">No (Required)</option>
                            <option value="true">Yes (Elective)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Course Pattern *</label>
                        <select class="form-control" id="coursePattern_${formId}" 
                                onchange="window.courseManager.updatePatternInfo(${formId})" required>
                            <option value="">Select Pattern</option>
                            <option value="lecture_only">Lecture Only</option>
                            <option value="lecture_tutorial">Lecture + Tutorial</option>
                            <option value="lecture_lab">Lecture + Lab</option>
                            <option value="lecture_lab_tutorial">Lecture + Lab + Tutorial</option>
                            <option value="lab_only">Lab Only</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Department *</label>
                        <select class="form-control" id="department_${formId}" required>
                            <option value="">Select Department</option>
                            <option value="Physics & Astronomy">Physics & Astronomy</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Software Engineering">Software Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Information Systems">Information Systems</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Islamic Culture">Islamic Culture</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">College *</label>
                        <select class="form-control" id="college_${formId}" required>
                            <option value="">Select College</option>
                            <option value="Computer and Information Sciences">Computer and Information Sciences</option>
                            <option value="Sciences">Sciences</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Business Administration">Business Administration</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Level *</label>
                        <select class="form-control" id="level_${formId}" required>
                            <option value="">Select Level</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                            <option value="5">Level 5</option>
                            <option value="6">Level 6</option>
                            <option value="7">Level 7</option>
                            <option value="8">Level 8</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Prerequisites</label>
                        <input type="text" class="form-control mb-2" id="prereqSearch_${formId}" 
                               placeholder="Search courses..." 
                               onkeyup="window.courseManager.filterPrerequisites(${formId})">
                        <div id="prerequisites_${formId}" 
                             style="max-height: 200px; overflow-y: auto; border: 1px solid #ced4da; border-radius: 0.375rem; padding: 0.5rem; background-color: #f8f9fa;">
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Exam Date</label>
                        <input type="text" class="form-control" id="examDate_${formId}" placeholder="e.g., 1447/07/01" />
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Exam Time</label>
                        <input type="text" class="form-control" id="examTime_${formId}" placeholder="e.g., 13:00-16:00" />
                    </div>
                </div>
            </div>

            <!-- Pattern Details -->
            <div id="patternDetails_${formId}" style="display: none;">
                <div class="card mb-3 bg-light">
                    <div class="card-body">
                        <h6 class="fw-bold mb-3"><i class="bi bi-diagram-3"></i> Course Structure Pattern</h6>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Lecture Hours</label>
                                    <input type="number" class="form-control" id="lectureHours_${formId}" 
                                           min="0" max="10" value="0" 
                                           onchange="window.courseManager.calculateTotalPattern(${formId})" />
                                    <small class="text-muted">Hours per week for lectures</small>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Lab Hours</label>
                                    <input type="number" class="form-control" id="labHours_${formId}" 
                                           min="0" max="10" value="0" 
                                           onchange="window.courseManager.calculateTotalPattern(${formId})" />
                                    <small class="text-muted">Hours per week for labs</small>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Tutorial Hours</label>
                                    <input type="number" class="form-control" id="tutorialHours_${formId}" 
                                           min="0" max="10" value="0" 
                                           onchange="window.courseManager.calculateTotalPattern(${formId})" />
                                    <small class="text-muted">Hours per week for tutorials</small>
                                </div>
                            </div>
                        </div>
                        <div class="alert alert-info mb-0" id="patternSummary_${formId}">
                            <i class="bi bi-info-circle"></i> <strong>Total:</strong> 
                            <span id="patternTotal_${formId}">0</span> hours/week
                            <span id="patternStatus_${formId}" class="ms-2"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    filterPrerequisites(formId) {
        const searchInput = document.getElementById(`prereqSearch_${formId}`);
        const searchText = searchInput.value.toLowerCase();
        const container = document.getElementById(`prerequisites_${formId}`);
        const allItems = container.querySelectorAll('.prereq-item');
        
        let visibleCount = 0;
        
        allItems.forEach(item => {
            const courseText = item.getAttribute('data-course-text');
            
            if (item.querySelector(`#prereq_none_${formId}`)) {
                item.style.display = '';
                return;
            }
            
            if (courseText.includes(searchText)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        const existingMessage = container.querySelector('.no-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        if (visibleCount === 0 && searchText !== '') {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'text-muted text-center py-3 no-results-message';
            noResultsMsg.innerHTML = '<em>No courses found matching your search</em>';
            container.appendChild(noResultsMsg);
        }
    }

    toggleNoPrerequisites(formId) {
        const noneCheckbox = document.getElementById(`prereq_none_${formId}`);
        if (noneCheckbox && noneCheckbox.checked) {
            const allCheckboxes = document.querySelectorAll(`.prereq-checkbox-${formId}`);
            allCheckboxes.forEach(cb => cb.checked = false);
        }
    }

    uncheckNoPrerequisites(formId) {
        const noneCheckbox = document.getElementById(`prereq_none_${formId}`);
        if (noneCheckbox && noneCheckbox.checked) {
            noneCheckbox.checked = false;
        }
    }

    updatePatternInfo(formId) {
        const patternSelect = document.getElementById(`coursePattern_${formId}`);
        const patternDetails = document.getElementById(`patternDetails_${formId}`);
        const durationInput = document.getElementById(`duration_${formId}`);
        
        if (!patternSelect.value) {
            patternDetails.style.display = 'none';
            return;
        }
        
        patternDetails.style.display = 'block';
        
        // Reset all inputs
        document.getElementById(`lectureHours_${formId}`).value = '0';
        document.getElementById(`labHours_${formId}`).value = '0';
        document.getElementById(`tutorialHours_${formId}`).value = '0';
        
        // Set predefined patterns
        switch(patternSelect.value) {
            case 'lecture_only':
                document.getElementById(`lectureHours_${formId}`).value = durationInput.value || '3';
                break;
            case 'lecture_tutorial':
                document.getElementById(`lectureHours_${formId}`).value = '3';
                document.getElementById(`tutorialHours_${formId}`).value = '1';
                break;
            case 'lecture_lab':
                document.getElementById(`lectureHours_${formId}`).value = '3';
                document.getElementById(`labHours_${formId}`).value = '2';
                break;
            case 'lecture_lab_tutorial':
                document.getElementById(`lectureHours_${formId}`).value = '2';
                document.getElementById(`labHours_${formId}`).value = '2';
                document.getElementById(`tutorialHours_${formId}`).value = '1';
                break;
            case 'lab_only':
                document.getElementById(`labHours_${formId}`).value = durationInput.value || '4';
                break;
            case 'custom':
                break;
        }
        
        this.calculateTotalPattern(formId);
    }

    calculateTotalPattern(formId) {
        const lectureHours = parseInt(document.getElementById(`lectureHours_${formId}`).value) || 0;
        const labHours = parseInt(document.getElementById(`labHours_${formId}`).value) || 0;
        const tutorialHours = parseInt(document.getElementById(`tutorialHours_${formId}`).value) || 0;
        
        const total = lectureHours + labHours + tutorialHours;
        document.getElementById(`patternTotal_${formId}`).textContent = total;
        
        const duration = parseInt(document.getElementById(`duration_${formId}`).value) || 0;
        const statusElement = document.getElementById(`patternStatus_${formId}`);
        
        if (duration > 0) {
            if (total === duration) {
                statusElement.innerHTML = '<span class="text-success">✓ Matches duration</span>';
            } else if (total < duration) {
                statusElement.innerHTML = `<span class="text-warning">⚠ Needs ${duration - total} more hours</span>`;
            } else {
                statusElement.innerHTML = `<span class="text-danger">✗ ${total - duration} hours over</span>`;
            }
        } else {
            statusElement.innerHTML = '<span class="text-muted">Set duration first</span>';
        }
    }

    validatePatternHours(formId) {
        this.calculateTotalPattern(formId);
    }

    async checkCourseExists(formId, field) {
        const courseCode = document.getElementById(`courseCode_${formId}`).value.trim().toUpperCase();
        const courseName = document.getElementById(`courseName_${formId}`).value.trim();
        
        if (field === 'code' && !courseCode) return;
        if (field === 'name' && !courseName) return;
        
        try {
            const response = await fetch(`${window.API_URL}/all-courses`);
            const data = await response.json();
            
            if (response.ok && data.courses) {
                if (field === 'code') {
                    const exists = data.courses.find(c => c.code.toUpperCase() === courseCode);
                    const codeInput = document.getElementById(`courseCode_${formId}`);
                    if (exists) {
                        codeInput.classList.add('is-invalid');
                        alert(`❌ Course code "${courseCode}" already exists as "${exists.name}"`);
                        codeInput.value = '';
                    } else {
                        codeInput.classList.remove('is-invalid');
                        codeInput.classList.add('is-valid');
                    }
                }
                
                if (field === 'name') {
                    const exists = data.courses.find(c => 
                        c.name.toLowerCase().trim() === courseName.toLowerCase()
                    );
                    const nameInput = document.getElementById(`courseName_${formId}`);
                    if (exists) {
                        nameInput.classList.add('is-invalid');
                        alert(`❌ Course name "${courseName}" already exists with code "${exists.code}"`);
                        nameInput.value = '';
                    } else {
                        nameInput.classList.remove('is-invalid');
                        nameInput.classList.add('is-valid');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking course existence:', error);
        }
    }

    removeCourseForm(formId) {
        const form = document.getElementById(`courseForm_${formId}`);
        if (form) {
            form.remove();
        }
    }

    async createAllCourses() {
        const courseForms = document.querySelectorAll('.course-form-card');
        
        if (courseForms.length === 0) {
            alert('Please add at least one course first');
            return;
        }

        const courses = [];
        const errors = [];

        courseForms.forEach(form => {
            const formId = parseInt(form.id.split('_')[1]);
            const courseData = this.validateCourseForm(formId);
            
            if (courseData) {
                courses.push(courseData);
            } else {
                errors.push(`Course #${formId} has missing required fields`);
            }
        });

        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        if (courses.length === 0) {
            alert('No valid courses to create');
            return;
        }

        const confirmMsg = `Are you sure you want to create ${courses.length} course(s)?\n\n` +
            courses.map(c => `• ${c.code} - ${c.name}`).join('\n');
        
        if (!confirm(confirmMsg)) {
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const results = [];

        for (const course of courses) {
            try {
                const response = await fetch(`${window.API_URL}/create-course`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(course)
                });

                const data = await response.json();

                if (response.ok) {
                    successCount++;
                    results.push(`✅ ${course.code}: Created successfully`);
                } else {
                    failCount++;
                    results.push(`❌ ${course.code}: ${data.error || 'Failed'}`);
                }
            } catch (error) {
                failCount++;
                results.push(`❌ ${course.code}: Connection error`);
            }
        }

        alert(`Course Creation Complete!\n\n` +
              `✅ Successful: ${successCount}\n` +
              `❌ Failed: ${failCount}\n\n` +
              `Details:\n${results.join('\n')}`);

        if (successCount > 0) {
            document.getElementById('coursesContainer').innerHTML = '';
            this.formCounter = 0;
            window.courseFormCounter = 0;
            await this.loadAllCoursesForPrerequisites();
        }
    }

    validateCourseForm(formId) {
        const courseName = document.getElementById(`courseName_${formId}`).value.trim();
        const courseCode = document.getElementById(`courseCode_${formId}`).value.trim();
        const creditHours = document.getElementById(`creditHours_${formId}`).value;
        const duration = document.getElementById(`duration_${formId}`).value;
        const isElective = document.getElementById(`isElective_${formId}`).value;
        const department = document.getElementById(`department_${formId}`).value;
        const college = document.getElementById(`college_${formId}`).value;
        const level = document.getElementById(`level_${formId}`).value;
        const patternType = document.getElementById(`coursePattern_${formId}`).value;

        if (!courseName || !courseCode || !creditHours || !duration || !department || !college || !level || !patternType) {
            return null;
        }

        const lectureHours = parseInt(document.getElementById(`lectureHours_${formId}`).value) || 0;
        const labHours = parseInt(document.getElementById(`labHours_${formId}`).value) || 0;
        const tutorialHours = parseInt(document.getElementById(`tutorialHours_${formId}`).value) || 0;
        const totalPatternHours = lectureHours + labHours + tutorialHours;

        if (totalPatternHours !== parseInt(duration)) {
            alert(`Pattern hours (${totalPatternHours}) don't match duration (${duration}). Please adjust the pattern.`);
            return null;
        }

        const selectedPrereqs = Array.from(document.querySelectorAll(`.prereq-checkbox-${formId}:checked`))
            .map(checkbox => checkbox.value)
            .filter(val => val !== '');

        return {
            name: courseName,
            code: courseCode.toUpperCase(),
            credit_hours: parseInt(creditHours),
            Duration: parseInt(duration),
            is_elective: isElective === 'true',
            department: department,
            college: college,
            level: level,
            prerequisites: selectedPrereqs.length > 0 ? selectedPrereqs : [null],
            exam_date: document.getElementById(`examDate_${formId}`).value.trim() || null,
            exam_time: document.getElementById(`examTime_${formId}`).value.trim() || null,
            pattern: {
                type: patternType,
                lecture_hours: lectureHours,
                lab_hours: labHours,
                tutorial_hours: tutorialHours,
                total_hours: totalPatternHours
            },
            section: [null]
        };
    }

    populatePrerequisitesDropdown(formId) {
        const container = document.getElementById(`prerequisites_${formId}`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="form-check prereq-item" data-course-text="no prerequisites">
                <input class="form-check-input" type="checkbox" value="" 
                       id="prereq_none_${formId}" checked 
                       onchange="window.courseManager.toggleNoPrerequisites(${formId})">
                <label class="form-check-label" for="prereq_none_${formId}">
                    <strong>No prerequisites</strong>
                </label>
            </div>
            <hr class="my-2">
        `;
        
        this.allCourses.forEach((course, index) => {
            const checkbox = document.createElement('div');
            checkbox.className = 'form-check prereq-item';
            checkbox.setAttribute('data-course-text', `${course.code} ${course.name}`.toLowerCase());
            checkbox.innerHTML = `
                <input class="form-check-input prereq-checkbox-${formId}" 
                       type="checkbox" value="${course.code}" 
                       id="prereq_${formId}_${index}" 
                       onchange="window.courseManager.uncheckNoPrerequisites(${formId})">
                <label class="form-check-label" for="prereq_${formId}_${index}">
                    <strong>${course.code}</strong> - ${course.name}
                </label>
            `;
            container.appendChild(checkbox);
        });
    }

    reset() {
        document.getElementById('coursesContainer').innerHTML = '';
        this.formCounter = 0;
        window.courseFormCounter = 0;
    }
}

// ✅ EXPOSE TO WINDOW
window.courseManager = null;
console.log('✅ CourseManager loaded');