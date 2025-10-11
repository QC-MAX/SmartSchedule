const API_URL = 'http://localhost:5000/api';

class ElectiveFormManager {
    constructor() {
        this.studentData = null;
        this.selectedCourses = [];
        this.allCourses = [];
        this.formStatus = 'idle';
        this.formDeadline = null;
        this.coursesTaken = [];
        this.existingSubmission = null;
        this.isFormActive = false;
        this.hasLoadedTakenCourses = false;
    }

    async init() {
        const studentDataStr = localStorage.getItem('studentData');
        if (studentDataStr) {
            this.studentData = JSON.parse(studentDataStr);
            this.updateWelcomeMessage();
            
            // Load taken courses FIRST, before anything else
            await this.fetchStudentCoursesTaken();
        }
        
        document.getElementById('elective-tab').addEventListener('click', () => {
            this.loadElectiveForm();
        });

        if (this.studentData) {
            await this.checkFormStatus();
        }
    }

    async fetchStudentCoursesTaken() {
        if (!this.studentData) return;
        
        try {
            console.log('Fetching taken courses for student:', this.studentData.student_id);
            const response = await fetch(`${API_URL}/student/${this.studentData.student_id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.coursesTaken = data.courses_taken || [];
            this.hasLoadedTakenCourses = true;
            
            console.log(`✅ Loaded ${this.coursesTaken.length} taken courses:`, this.coursesTaken);
            
        } catch (error) {
            console.error('❌ Error fetching student courses:', error);
            this.coursesTaken = [];
            this.hasLoadedTakenCourses = false;
        }
    }

    async checkFormStatus() {
        if (!this.studentData) return false;
        
        try {
            const response = await fetch(`${API_URL}/student-electives/${this.studentData.student_id}`);
            const data = await response.json();
            
            // Check if form is active
            this.isFormActive = data.form_active;
            
            if (data.form_active && data.submission && data.submission.submission_status === 'submitted') {
                this.showAlreadySubmittedState(data.submission);
                return true;
            }
            
            // If form is not active, show message
            if (!data.form_active) {
                this.showFormInactive(data.message);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking form status:', error);
            return false;
        }
    }

    updateWelcomeMessage() {
        const welcomeName = document.querySelector('.student-welcome h3');
        const welcomeInfo = document.querySelector('.student-welcome p');
        
        if (welcomeName && welcomeInfo && this.studentData) {
            welcomeName.textContent = `Welcome back, ${this.studentData.first_name}!`;
            welcomeInfo.textContent = `Level ${this.studentData.level} - Software Engineering | ID: ${this.studentData.student_id}`;
        }
    }

    async loadElectiveForm() {
        // Check if user has already submitted or form is inactive (only if student data exists)
        if (this.studentData) {
            const shouldBlockForm = await this.checkFormStatus();
            if (shouldBlockForm) {
                return;
            }
        }
        
        if (this.allCourses.length > 0) return;
        
        try {
            const response = await fetch(`${API_URL}/elective-courses`);
            const data = await response.json();
            
            if (!response.ok) {
                this.showFormInactive(data.error || 'Form is not active');
                return;
            }
            
            // Wait for taken courses to load if not already loaded and student data exists
            if (this.studentData && !this.hasLoadedTakenCourses) {
                await this.fetchStudentCoursesTaken();
            }
            
            // FILTER OUT TAKEN COURSES
            const originalCount = data.courses.length;
            this.allCourses = this.filterOutTakenCourses(data.courses);
            const filteredCount = originalCount - this.allCourses.length;
            
            console.log(`📊 Course filtering: ${originalCount} total, ${filteredCount} taken, ${this.allCourses.length} available`);
            
            this.formDeadline = new Date(data.deadline);
            this.isFormActive = true;
            
            if (!this.isBeforeDeadline()) {
                this.showDeadlinePassed();
                return;
            }
            
            if (this.allCourses.length === 0) {
                this.showNoAvailableCourses(originalCount, filteredCount);
                return;
            }
            
            this.renderCourses(originalCount, filteredCount);
            this.setupEventListeners();
            
            if (this.studentData) {
                await this.checkExistingSubmission();
            }
            
        } catch (error) {
            console.error('Error loading elective form:', error);
            alert('Failed to load elective form');
        }
    }

    filterOutTakenCourses(courses) {
        if (!this.coursesTaken || this.coursesTaken.length === 0) {
            console.log('⚠️ No taken courses data - showing all elective courses');
            return courses;
        }
        
        const availableCourses = courses.filter(course => {
            const isTaken = this.coursesTaken.includes(course.code);
            if (isTaken) {
                console.log(`🚫 Filtered out taken course: ${course.code} - ${course.name}`);
            }
            return !isTaken;
        });
        
        return availableCourses;
    }

    isBeforeDeadline() {
        if (!this.formDeadline) return false;
        const now = new Date();
        return now < this.formDeadline;
    }

    showDeadlinePassed() {
        const coursesList = document.getElementById('coursesList');
        const deadlineStr = this.formDeadline.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        coursesList.innerHTML = `
            <div class="alert alert-danger">
                <h5><i class="bi bi-clock"></i> Form Deadline Passed</h5>
                <p>The elective form deadline was on <strong>${deadlineStr}</strong>.</p>
                <p class="mb-0">Submission is no longer allowed. Please contact administration if this is an error.</p>
            </div>
        `;
        
        // Disable submit button
        const submitBtn = document.getElementById('submitElectiveBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-clock"></i> Deadline Passed';
        }
    }

    showFormInactive(message = 'The elective form is not currently available.') {
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = `
            <div class="alert alert-warning">
                <h5><i class="bi bi-exclamation-triangle"></i> Form Not Active</h5>
                <p>${message}</p>
                <p class="mb-0">Please check back during the form period.</p>
            </div>
        `;
    }

    showNoAvailableCourses(originalCount, filteredCount) {
        const coursesList = document.getElementById('coursesList');
        
        let message = '';
        if (filteredCount > 0) {
            message = `
                <div class="alert alert-info">
                    <h5><i class="bi bi-info-circle"></i> No Available Elective Courses</h5>
                    <p>There are <strong>${originalCount} elective courses</strong> in total, but:</p>
                    <ul>
                        <li>🚫 <strong>${filteredCount} courses</strong> you've already taken are hidden</li>
                        <li>✅ <strong>0 courses</strong> available for you to choose</li>
                    </ul>
                    <p class="mb-0">You have completed all available elective courses for your level.</p>
                </div>
            `;
        } else {
            message = `
                <div class="alert alert-warning">
                    <h5><i class="bi bi-exclamation-triangle"></i> No Elective Courses Available</h5>
                    <p>There are currently no elective courses available for your level and program.</p>
                    <p class="mb-0">Please contact your academic advisor for assistance.</p>
                </div>
            `;
        }
        
        coursesList.innerHTML = message;
    }

    renderCourses(originalCount, filteredCount) {
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';
        
        // Add deadline banner
        if (this.formDeadline) {
            const deadline = new Date(this.formDeadline);
            const now = new Date();
            const timeLeft = deadline - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const daysLeft = Math.floor(hoursLeft / 24);
            
            const deadlineBanner = document.createElement('div');
            deadlineBanner.className = `alert ${daysLeft < 2 ? 'alert-danger' : 'alert-info'} mb-3`;
            deadlineBanner.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-clock-history"></i> <strong>Form Deadline:</strong> 
                        ${deadline.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div>
                        <strong>${daysLeft > 0 ? daysLeft + ' days' : hoursLeft + ' hours'} remaining</strong>
                    </div>
                </div>
            `;
            coursesList.appendChild(deadlineBanner);
        }
        
        // Add detailed filtering info
        if (filteredCount > 0) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'alert alert-light mb-3';
            filterInfo.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-filter"></i> 
                        <strong>Course Filtering Applied:</strong>
                        Showing ${this.allCourses.length} available courses 
                        (${filteredCount} taken courses hidden)
                    </div>
                    <small class="text-muted">
                        Total elective courses: ${originalCount}
                    </small>
                </div>
            `;
            coursesList.appendChild(filterInfo);
        } else if (this.coursesTaken.length === 0 && this.studentData) {
            const noFilterInfo = document.createElement('div');
            noFilterInfo.className = 'alert alert-warning mb-3';
            noFilterInfo.innerHTML = `
                <small>
                    <i class="bi bi-exclamation-triangle"></i> 
                    <strong>Note:</strong> Taken courses filtering is not available. 
                    Showing all ${this.allCourses.length} elective courses.
                </small>
            `;
            coursesList.appendChild(noFilterInfo);
        }
        
        // Render available courses
        this.allCourses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.className = 'course-item';
            courseItem.setAttribute('data-course', course.code);
            courseItem.innerHTML = `
                <div class="course-info">
                    <span class="course-code">${course.code} - ${course.name}</span>
                    <small class="text-muted d-block">${course.department} - ${course.credit_hours} credit hours</small>
                    ${course.description ? `<small class="text-muted d-block mt-1">${course.description}</small>` : ''}
                </div>
                <span class="course-hours">${course.credit_hours} hrs</span>
            `;
            
            courseItem.addEventListener('click', () => {
                this.toggleCourseSelection(course.code, courseItem);
            });
            
            coursesList.appendChild(courseItem);
        });
    }

    async checkExistingSubmission() {
        if (!this.studentData) return;
        
        try {
            const response = await fetch(`${API_URL}/student-electives/${this.studentData.student_id}`);
            const data = await response.json();
            
            if (data.submission) {
                this.existingSubmission = data.submission;
                
                if (data.submission.submission_status === 'submitted') {
                    this.showAlreadySubmittedState(data.submission);
                } else if (data.submission.submission_status === 'draft') {
                    this.formStatus = 'draft';
                    this.selectedCourses = data.submission.selected_courses || [];
                    document.getElementById('studentSuggestions').value = data.submission.suggestions || '';
                    
                    // Mark selected courses (only those that are in the available list)
                    this.selectedCourses.forEach(code => {
                        const courseItem = document.querySelector(`.course-item[data-course="${code}"]`);
                        if (courseItem) {
                            courseItem.classList.add('selected');
                            this.addToSelectedList(code, courseItem);
                        }
                    });
                    this.updateCounter();
                }
            }
        } catch (error) {
            console.error('Error checking submission:', error);
        }
    }

    showAlreadySubmittedState(submission) {
        const electiveTab = document.getElementById('elective');
        electiveTab.innerHTML = `
            <div class="dashboard-card">
                <div class="alert alert-success">
                    <h4><i class="bi bi-check-circle"></i> Form Already Submitted</h4>
                    <p>Your elective preferences have already been submitted and cannot be modified.</p>
                    <p class="mb-0"><small>Submitted on: ${new Date(submission.submitted_at).toLocaleDateString()}</small></p>
                </div>
                
                <div class="submission-details">
                    <h5>Your Submission Details:</h5>
                    
                    <div class="selected-courses-section mt-3">
                        <h6>Selected Courses:</h6>
                        ${submission.selected_courses.length === 0 
                            ? '<div class="alert alert-light">No courses selected</div>' 
                            : `
                            <div class="selected-courses-list">
                                ${submission.selected_courses.map(code => {
                                    const course = this.allCourses.find(c => c.code === code) || { code: code, name: 'Unknown Course' };
                                    return `
                                        <div class="submitted-course-item">
                                            <strong>${course.code}</strong> - ${course.name}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            `
                        }
                    </div>
                    
                    ${submission.suggestions ? `
                        <div class="suggestions-section mt-3">
                            <h6>Your Suggestions:</h6>
                            <div class="alert alert-light">
                                <p class="mb-0">${submission.suggestions}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="submission-meta mt-4 p-3 bg-light rounded">
                        <small class="text-muted">
                            <strong>Submission Reference:</strong><br>
                            Semester: ${submission.semester || 'N/A'}<br>
                            Academic Year: ${submission.academic_year || 'N/A'}<br>
                            Submitted: ${new Date(submission.submitted_at).toLocaleString()}
                        </small>
                    </div>
                </div>
            </div>
        `;
        
        // Also disable the elective tab to prevent clicking
        const electiveTabElement = document.getElementById('elective-tab');
        if (electiveTabElement) {
            electiveTabElement.classList.add('disabled');
            electiveTabElement.style.pointerEvents = 'none';
            electiveTabElement.style.opacity = '0.6';
        }
    }

    toggleCourseSelection(courseCode, element) {
        if (this.formStatus === 'submitted') return;
        
        const index = this.selectedCourses.indexOf(courseCode);
        
        if (index === -1) {
            this.selectedCourses.push(courseCode);
            element.classList.add('selected');
            this.addToSelectedList(courseCode, element);
        } else {
            this.selectedCourses.splice(index, 1);
            element.classList.remove('selected');
            this.removeFromSelectedList(courseCode);
        }
        
        this.updateCounter();
    }

    addToSelectedList(courseCode, element) {
        const selectedList = document.getElementById('selectedList');
        
        // Remove empty message
        const emptyMsg = selectedList.querySelector('.empty-message');
        if (emptyMsg) emptyMsg.remove();
        
        const courseInfo = element.querySelector('.course-info').innerHTML;
        const selectedItem = document.createElement('div');
        selectedItem.className = 'selected-course';
        selectedItem.setAttribute('data-course', courseCode);
        selectedItem.innerHTML = `
            <div class="course-info">${courseInfo}</div>
            <button class="remove-btn" onclick="electiveForm.removeCourse('${courseCode}')">×</button>
        `;
        
        selectedList.appendChild(selectedItem);
    }

    removeFromSelectedList(courseCode) {
        const selectedItem = document.querySelector(`.selected-course[data-course="${courseCode}"]`);
        if (selectedItem) selectedItem.remove();
        
        const selectedList = document.getElementById('selectedList');
        if (selectedList.children.length === 0) {
            selectedList.innerHTML = '<div class="empty-message">No courses selected yet</div>';
        }
    }

    removeCourse(courseCode) {
        const courseItem = document.querySelector(`.course-item[data-course="${courseCode}"]`);
        if (courseItem) {
            this.toggleCourseSelection(courseCode, courseItem);
        }
    }

    updateCounter() {
        document.getElementById('selectedCount').textContent = this.selectedCourses.length;
    }

    setupEventListeners() {
        // Replace the submit button's onclick
        const submitBtn = document.getElementById('submitElectiveBtn');
        if (submitBtn) {
            submitBtn.onclick = () => this.submitSelections();
        }
    }

    async submitSelections() {
        if (!this.studentData) {
            alert('Student data not found. Please log in to submit.');
            return;
        }

        // DOUBLE CHECK: Verify form is still active before submitting
        if (!this.isFormActive) {
            alert('Form is no longer active. Cannot submit.');
            return;
        }

        // DOUBLE CHECK: Verify deadline hasn't passed
        if (!this.isBeforeDeadline()) {
            this.showDeadlinePassed();
            alert('Cannot submit: The form deadline has passed.');
            return;
        }

        const suggestions = document.getElementById('studentSuggestions').value;
        
        if (this.selectedCourses.length === 0 && !suggestions.trim()) {
            if (!confirm('You haven\'t selected any courses or provided suggestions. Submit anyway?')) {
                return;
            }
        }

        try {
            const submitBtn = document.getElementById('submitElectiveBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

            // Start form if not started
            if (this.formStatus === 'idle') {
                const startResponse = await fetch(`${API_URL}/start-electives/${this.studentData.student_id}`, {
                    method: 'POST'
                });
                
                if (!startResponse.ok) {
                    const errorData = await startResponse.json();
                    throw new Error(errorData.error || 'Failed to start form');
                }
            }
            
            // Save selections
            const saveResponse = await fetch(`${API_URL}/save-electives/${this.studentData.student_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_courses: this.selectedCourses,
                    suggestions: suggestions
                })
            });
            
            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.error || 'Failed to save selections');
            }
            
            // FINAL CHECK: Submit with deadline validation on server side
            const submitResponse = await fetch(`${API_URL}/submit-electives/${this.studentData.student_id}`, {
                method: 'POST'
            });
            
            const data = await submitResponse.json();
            
            if (submitResponse.ok) {
                alert('✓ Elective preferences submitted successfully!');
                this.formStatus = 'submitted';
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to submit');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('❌ Failed to submit: ' + error.message);
            
            const submitBtn = document.getElementById('submitElectiveBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send"></i> Submit Elective Preferences';
        }
    }
}

// Initialize when page loads
const electiveForm = new ElectiveFormManager();
document.addEventListener('DOMContentLoaded', () => {
    electiveForm.init();
});