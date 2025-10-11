// ============================================
// Section Manager - COMPLETE FULL VERSION
// ============================================
 

class SectionManager {
    constructor() {
        this.formCounter = 0;
        this.timeSlots = {};
        this.creditHoursMap = {};
        this.availableLectureSections = {};
    }

    // ==========================================
    // COURSE FILTERING & SELECTION
    // ==========================================
    async filterCourses() {
        const department = document.getElementById('sectionDepartment').value;
        const courseCodeSelect = document.getElementById('sectionCourseCode');
        
        courseCodeSelect.innerHTML = '<option value="">Select Course Code</option>';
        document.getElementById('sectionCourseName').value = '';
        
        if (!department) {
            return;
        }

        try {
            const actualDepartment = window.departmentMapping[department] || department;
            const response = await fetch(`${window.API_URL}/courses-by-department?department=${encodeURIComponent(actualDepartment)}`);
            const data = await response.json();
            
            if (response.ok && data.courses) {
                data.courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.code;
                    option.textContent = `${course.code} - ${course.name}`;
                    option.setAttribute('data-name', course.name);
                    courseCodeSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }

    async updateCourseName() {
        const courseCodeSelect = document.getElementById('sectionCourseCode');
        const selectedOption = courseCodeSelect.options[courseCodeSelect.selectedIndex];
        const courseName = document.getElementById('sectionCourseName');
        
        if (selectedOption.value) {
            courseName.value = selectedOption.getAttribute('data-name');
            
            // Load course pattern for guidance
            await this.loadAndDisplayCoursePattern(selectedOption.value);
            
            // Load lecture sections for this course
            await this.loadLectureSections(selectedOption.value);
        } else {
            courseName.value = '';
            document.getElementById('patternGuidanceAlert').style.display = 'none';
        }
    }

    // ==========================================
    // PATTERN GUIDANCE
    // ==========================================
    async loadAndDisplayCoursePattern(courseCode) {
        try {
            const response = await fetch(`${window.API_URL}/course-details/${courseCode}`);
            const course = await response.json();
            
            if (course.pattern) {
                this.displayPatternGuidance(course.pattern, course.credit_hours);
            }
        } catch (error) {
            console.error('Error loading course pattern:', error);
        }
    }

    displayPatternGuidance(pattern, creditHours) {
        const alert = document.getElementById('patternGuidanceAlert');
        const requirements = document.getElementById('patternRequirements');
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-2"><strong>Pattern Type:</strong> ${pattern.type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p class="mb-2"><strong>Credit Hours:</strong> ${creditHours}</p>
                    <p class="mb-0"><strong>Total Duration:</strong> ${pattern.total_hours}h/week</p>
                </div>
                <div class="col-md-6">
                    <strong>Required Sections:</strong>
                    <div class="mt-2">
        `;
        
        if (pattern.lecture_hours > 0) {
            html += `<div class="badge bg-primary me-2 mb-2">🎓 Lecture: <strong>${pattern.lecture_hours}h</strong></div>`;
        }
        if (pattern.lab_hours > 0) {
            html += `<div class="badge bg-success me-2 mb-2">🧪 Lab: <strong>${pattern.lab_hours}h</strong></div>`;
        }
        if (pattern.tutorial_hours > 0) {
            html += `<div class="badge bg-info me-2 mb-2">📚 Tutorial: <strong>${pattern.tutorial_hours}h</strong></div>`;
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        requirements.innerHTML = html;
        alert.style.display = 'block';
    }

    // ==========================================
    // LECTURE SECTIONS LOADING
    // ==========================================
    async loadLectureSections(courseCode) {
        try {
            const response = await fetch(`${window.API_URL}/lecture-sections/${courseCode}`);
            if (response.ok) {
                const data = await response.json();
                this.availableLectureSections[courseCode] = data.lecture_sections || [];
                return data.lecture_sections || [];
            }
            return [];
        } catch (error) {
            console.error('Error loading lecture sections:', error);
            return [];
        }
    }

    // ==========================================
    // ADD SECTION FORM
    // ==========================================
    async addSectionForm() {
        const courseCode = document.getElementById('sectionCourseCode').value;
        
        if (!courseCode) {
            alert('Please select Course Code first');
            return;
        }
        
        this.formCounter++;
        window.sectionFormCounter = this.formCounter; // ✅ SYNC GLOBAL
        const formId = this.formCounter;
        
        const container = document.getElementById('sectionsContainer');
        
        this.timeSlots[formId] = [];
        window.sectionTimeSlotsMap[formId] = []; // ✅ SYNC GLOBAL
        
        const sectionForm = document.createElement('div');
        sectionForm.className = 'card mb-3 section-form-card';
        sectionForm.id = `sectionForm_${formId}`;
        sectionForm.innerHTML = `
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-door-open"></i> Section #${formId}</h6>
                <button type="button" class="btn btn-sm btn-danger" onclick="window.sectionManager.removeSectionForm(${formId})">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
            <div class="card-body">
                <!-- Section Type Selection -->
                <div class="mb-3">
                    <label class="form-label fw-bold"><i class="bi bi-tag"></i> Section Type *</label>
                    <select class="form-control" id="sectionType_${formId}" onchange="window.sectionManager.onSectionTypeChange(${formId})" required>
                        <option value="">Select Type</option>
                        <option value="lecture">Lecture</option>
                        <option value="lab">Lab</option>
                        <option value="lab a">Lab A</option>
                        <option value="lab b">Lab B</option>
                        <option value="tutorial">Tutorial</option>
                    </select>
                </div>
                
                <!-- Parent Lecture Selection (hidden by default) -->
                <div id="lectureSelectContainer_${formId}" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label fw-bold" id="lectureLabel_${formId}">
                            <i class="bi bi-link-45deg"></i> Parent Lecture Section
                        </label>
                        <input type="text" class="form-control mb-2" id="lectureSearch_${formId}" 
                               placeholder="Search lecture sections..." 
                               onkeyup="window.sectionManager.searchLectureSections(${formId})">
                        <select class="form-control" id="followsLecture_${formId}">
                            <option value="">Select Lecture Section</option>
                        </select>
                        <small class="text-muted" id="lectureHelp_${formId}">Link this section to a lecture</small>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label fw-bold"><i class="bi bi-clock"></i> Time Slots</label>
                    <div class="row mb-2">
                        <div class="col-md-3">
                            <select class="form-control" id="dayOfWeek_${formId}">
                                <option value="">Select Day</option>
                                <option value="Sunday">Sunday</option>
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" id="startTime_${formId}">
                                <option value="">Start Time</option>
                                <option value="8:00">8:00 AM</option>
                                <option value="9:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" id="endTime_${formId}">
                                <option value="">End Time</option>
                                <option value="9:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button type="button" class="btn btn-primary w-100" onclick="window.sectionManager.addTimeSlot(${formId})">
                                <i class="bi bi-plus"></i> Add Slot
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="bi bi-info-circle"></i> 
                            Credit Hours Tracking: <span id="creditHoursStatus_${formId}">0/0</span>
                            <span id="creditHoursWarning_${formId}" class="ms-2"></span>
                        </small>
                    </div>
                    
                    <div id="timeSlotsContainer_${formId}">
                        <p class="text-muted small">No time slots added yet</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(sectionForm);
        
        // Load course credit hours for this section
        await this.loadCourseCreditHoursForSection(formId, courseCode);
    }

    // ==========================================
    // CREDIT HOURS TRACKING
    // ==========================================
    async loadCourseCreditHoursForSection(sectionId, courseCode) {
        try {
            const response = await fetch(`${window.API_URL}/course-details/${courseCode}`);
            if (response.ok) {
                const courseData = await response.json();
                const creditHours = courseData.credit_hours || 0;
                
                // Store credit hours for this section
                this.creditHoursMap[sectionId] = creditHours;
                window.sectionCreditHoursMap[sectionId] = creditHours; // ✅ SYNC GLOBAL
                
                // Update the display
                this.updateCreditHoursStatus(sectionId);
            }
        } catch (error) {
            console.error('Error loading course credit hours:', error);
        }
    }

    // ==========================================
    // SECTION TYPE CHANGE
    // ==========================================
    onSectionTypeChange(sectionId) {
        const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
        const lectureSelectContainer = document.getElementById(`lectureSelectContainer_${sectionId}`);
        const followsLectureSelect = document.getElementById(`followsLecture_${sectionId}`);
        const lectureLabel = document.getElementById(`lectureLabel_${sectionId}`);
        const lectureHelp = document.getElementById(`lectureHelp_${sectionId}`);
        
        // Only tutorials REQUIRE a lecture link, labs are optional
        if (sectionType === 'tutorial') {
            lectureSelectContainer.style.display = 'block';
            followsLectureSelect.required = true;
            lectureLabel.innerHTML = '<i class="bi bi-link-45deg"></i> Parent Lecture Section <span class="text-danger">*</span>';
            lectureHelp.textContent = 'Tutorials MUST be linked to a lecture section';
            this.populateLectureSections(sectionId);
        } else if (sectionType === 'lab' || sectionType === 'lab a' || sectionType === 'lab b') {
            lectureSelectContainer.style.display = 'block';
            followsLectureSelect.required = false; // Labs are optional!
            lectureLabel.innerHTML = '<i class="bi bi-link-45deg"></i> Parent Lecture Section <span class="text-muted">(Optional)</span>';
            lectureHelp.textContent = 'Labs can optionally be linked to a lecture section';
            this.populateLectureSections(sectionId);
        } else {
            lectureSelectContainer.style.display = 'none';
            followsLectureSelect.required = false;
        }

        const validationNote = document.getElementById(`validationNote_${sectionId}`);
        if (!validationNote) {
            const noteDiv = document.createElement('div');
            noteDiv.id = `validationNote_${sectionId}`;
            noteDiv.className = 'alert alert-sm alert-info py-2 mb-2';
            
            // Insert after section type select
            const sectionTypeSelect = document.getElementById(`sectionType_${sectionId}`);
            sectionTypeSelect.parentNode.insertBefore(noteDiv, sectionTypeSelect.nextSibling);
        }
        
        this.updateSectionTypeValidationNote(sectionId);
    }

    // ==========================================
    // PATTERN VALIDATION NOTE
    // ==========================================
    updateSectionTypeValidationNote(sectionId) {
        const noteDiv = document.getElementById(`validationNote_${sectionId}`);
        const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
        const courseCode = document.getElementById('sectionCourseCode').value;
        
        if (!sectionType || !courseCode) return;
        
        fetch(`${window.API_URL}/course-details/${courseCode}`)
            .then(res => res.json())
            .then(courseData => {
                if (!courseData.pattern) return;
                
                const pattern = courseData.pattern;
                let expectedHours = 0;
                let typeColor = 'info';
                
                if (sectionType === 'lecture') {
                    expectedHours = pattern.lecture_hours;
                    typeColor = 'primary';
                } else if (sectionType.includes('lab')) {
                    expectedHours = pattern.lab_hours;
                    typeColor = 'success';
                } else if (sectionType === 'tutorial') {
                    expectedHours = pattern.tutorial_hours;
                    typeColor = 'warning';
                }
                
                if (expectedHours > 0) {
                    noteDiv.className = `alert alert-sm alert-${typeColor} py-2 mb-2`;
                    noteDiv.innerHTML = `
                        <i class="bi bi-info-circle"></i> 
                        This ${sectionType} section must have exactly <strong>${expectedHours} hours</strong> per week
                    `;
                }
            })
            .catch(error => console.error('Error fetching pattern:', error));
    }

    // ==========================================
    // POPULATE LECTURE SECTIONS
    // ==========================================
    async populateLectureSections(sectionId) {
        const courseCode = document.getElementById('sectionCourseCode').value;
        if (!courseCode) {
            alert('Please select a course first');
            return;
        }
        
        const lectureSelect = document.getElementById(`followsLecture_${sectionId}`);
        lectureSelect.innerHTML = '<option value="">Loading...</option>';
        
        console.log(`🔍 Loading lecture sections for course: ${courseCode}`);
        const lectureSections = await this.loadLectureSections(courseCode);
        console.log(`📚 Found ${lectureSections.length} lecture sections:`, lectureSections);
        
        // Add "None (Optional)" option for labs
        const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
        const isLab = sectionType === 'lab' || sectionType === 'lab a' || sectionType === 'lab b';
        
        if (isLab) {
            lectureSelect.innerHTML = '<option value="">None (Optional)</option>';
        } else {
            lectureSelect.innerHTML = '<option value="">Select Lecture Section (Required)</option>';
        }

        // Add pending sections first
        const pendingSections = document.querySelectorAll('.section-form-card');
        let pendingCount = 0;
        
        pendingSections.forEach(form => {
            const formSectionId = parseInt(form.id.split('_')[1]);
            const formSectionType = document.getElementById(`sectionType_${formSectionId}`).value;
            
            if (formSectionType === 'lecture' && formSectionId !== sectionId) {
                const option = document.createElement('option');
                option.value = `pending_${formSectionId}`;
                option.textContent = `[PENDING] Section #${formSectionId} - New Lecture`;
                option.className = 'text-muted';
                lectureSelect.appendChild(option);
                pendingCount++;
            }
        });
        
        if (pendingCount > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.innerHTML = '─────── Existing Sections ───────';
            lectureSelect.appendChild(separator);
        }
        
        // Then add existing lecture sections from database
        if (lectureSections.length === 0) {
            if (!isLab && pendingCount === 0) {
                alert(`⚠️ No lecture sections found for ${courseCode}. Please create a lecture section first.`);
            }
            return;
        }

        // ADD THE LECTURE SECTIONS TO THE DROPDOWN!
        lectureSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.sec_num;
            
            // Calculate lecture hours from time_slots
            let lectureHours = 0;
            if (section.time_slots && Array.isArray(section.time_slots)) {
                section.time_slots.forEach(slot => {
                    // Parse time slot like "Sunday 8:00-9:00"
                    const timeMatch = slot.match(/(\d+):(\d+)-(\d+):(\d+)/);
                    if (timeMatch) {
                        const startHour = parseInt(timeMatch[1]);
                        const endHour = parseInt(timeMatch[3]);
                        lectureHours += (endHour - startHour);
                    }
                });
            }
            
            console.log(`✅ Section ${section.sec_num}: ${lectureHours} hours from slots:`, section.time_slots);
            
            // Store lecture hours in data attribute
            option.setAttribute('data-lecture-hours', lectureHours);
            
            const timeSlots = section.time_slots.join(', ');
            const levelText = section.academic_level ? ` (Level ${section.academic_level})` : '';
            option.textContent = `Section ${section.sec_num}${levelText} - ${timeSlots} (${lectureHours}h)`;
            lectureSelect.appendChild(option);
        });
        
        // CRITICAL: Add event listener for lecture selection change
        const newSelect = document.getElementById(`followsLecture_${sectionId}`);
        newSelect.addEventListener('change', () => {
            console.log('🔔 Lecture selection changed!');
            this.updateCreditHoursFromLecture(sectionId);
        });
    }

    searchLectureSections(sectionId) {
        const searchTerm = document.getElementById(`lectureSearch_${sectionId}`).value.toLowerCase();
        const select = document.getElementById(`followsLecture_${sectionId}`);
        const options = select.getElementsByTagName('option');
        
        for (let i = 1; i < options.length; i++) {
            const optionText = options[i].textContent.toLowerCase();
            if (optionText.includes(searchTerm)) {
                options[i].style.display = '';
            } else {
                options[i].style.display = 'none';
            }
        }
    }

    // ==========================================
    // ADD TIME SLOT WITH OVERLAP DETECTION
    // ==========================================
    async addTimeSlot(sectionId) {
        const day = document.getElementById(`dayOfWeek_${sectionId}`).value;
        const startTime = document.getElementById(`startTime_${sectionId}`).value;
        const endTime = document.getElementById(`endTime_${sectionId}`).value;
        const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
        
        if (!day || !startTime || !endTime) {
            alert('Please select day, start time, and end time');
            return;
        }
        
        if (!sectionType) {
            alert('Please select section type first');
            return;
        }
        
        const startHour = parseFloat(startTime.split(':')[0]);
        const endHour = parseFloat(endTime.split(':')[0]);
        
        if (startHour >= endHour) {
            alert('End time must be after start time');
            return;
        }
        
        const duration = endHour - startHour;
        
        if (duration <= 0) {
            alert('Invalid time duration');
            return;
        }
        
        // Check for overlapping time slots on the same day within this section
        const existingSlots = this.timeSlots[sectionId].filter(slot => slot.day === day);
        const hasOverlap = existingSlots.some(slot => {
            const existingStart = parseFloat(slot.start_time.split(':')[0]);
            const existingEnd = parseFloat(slot.end_time.split(':')[0]);
            
            return (startHour < existingEnd && endHour > existingStart);
        });
        
        if (hasOverlap) {
            alert('This time slot overlaps with an existing slot on the same day');
            return;
        }
        
        // Check if this is a duplicate
        const duplicate = existingSlots.find(slot => 
            slot.start_time === startTime && slot.end_time === endTime
        );
        
        if (duplicate) {
            alert('This exact time slot has already been added');
            return;
        }
        
        // Check if this tutorial/lab overlaps with parent lecture
        if (sectionType === 'tutorial' || sectionType.includes('lab')) {
            const followsLectureSelect = document.getElementById(`followsLecture_${sectionId}`);
            const parentLectureValue = followsLectureSelect.value;
            
            if (parentLectureValue) {
                let lectureTimeSlots = [];
                
                // Check if it's a pending section
                if (parentLectureValue.startsWith('pending_')) {
                    const pendingSectionId = parseInt(parentLectureValue.split('_')[1]);
                    
                    // Get time slots from the pending section
                    if (this.timeSlots[pendingSectionId]) {
                        lectureTimeSlots = this.timeSlots[pendingSectionId];
                        console.log('📋 Checking against PENDING lecture slots:', lectureTimeSlots);
                    }
                } else {
                    // This is an existing lecture section from database
                    const selectedOption = followsLectureSelect.options[followsLectureSelect.selectedIndex];
                    const optionText = selectedOption.textContent;
                    
                    console.log('📋 Parsing lecture time slots from:', optionText);
                    
                    // Parse time slots from option text
                    // Format: "Section 72681 - Sunday 10:00-12:00, Tuesday 10:00-12:00 (6h)"
                    const timeSlotPattern = /(\w+)\s+(\d+):(\d+)-(\d+):(\d+)/g;
                    let match;
                    
                    while ((match = timeSlotPattern.exec(optionText)) !== null) {
                        lectureTimeSlots.push({
                            day: match[1],
                            start_time: `${match[2]}:${match[3]}`,
                            end_time: `${match[4]}:${match[5]}`,
                            duration: parseInt(match[4]) - parseInt(match[2])
                        });
                    }
                    
                    console.log('📋 Parsed lecture slots:', lectureTimeSlots);
                }
                
                // Now check for overlaps
                for (const lectureSlot of lectureTimeSlots) {
                    if (lectureSlot.day === day) {
                        const lectureStartHour = parseFloat(lectureSlot.start_time.split(':')[0]);
                        const lectureEndHour = parseFloat(lectureSlot.end_time.split(':')[0]);
                        
                        console.log(`🔍 Checking overlap: Tutorial ${day} ${startHour}:00-${endHour}:00 vs Lecture ${lectureSlot.day} ${lectureStartHour}:00-${lectureEndHour}:00`);
                        
                        // Check if times overlap
                        if (startHour < lectureEndHour && endHour > lectureStartHour) {
                            alert(`❌ This ${sectionType} time slot overlaps with the parent lecture!\n\nLecture: ${day} ${lectureStartHour}:00-${lectureEndHour}:00\nYour slot: ${day} ${startHour}:00-${endHour}:00\n\nPlease choose a different time.`);
                            return;
                        }
                    }
                }
                
                console.log('✅ No overlap detected with lecture');
            }
        }

        // Get credit hours for validation
        const creditHours = this.creditHoursMap[sectionId] || 0;
        const currentTotal = this.timeSlots[sectionId].reduce((sum, slot) => sum + slot.duration, 0);
        const newTotal = currentTotal + duration;
        
        // Warn if exceeding credit hours significantly
        if (creditHours > 0 && newTotal > creditHours + 2) {
            if (!confirm(`Warning: This will make total hours ${newTotal}, but course is only ${creditHours} credit hours.\n\nDo you want to continue?`)) {
                return;
            }
        }

        // PATTERN VALIDATION: Check if total hours match expected for this section type
        const courseCode = document.getElementById('sectionCourseCode').value;
        
        try {
            // Fetch course pattern
            const courseResponse = await fetch(`${window.API_URL}/course-details/${courseCode}`);
            const courseData = await courseResponse.json();
            
            if (courseData.pattern) {
                const pattern = courseData.pattern;
                let expectedHours = 0;
                
                if (sectionType === 'lecture') {
                    expectedHours = pattern.lecture_hours;
                } else if (sectionType.includes('lab')) {
                    expectedHours = pattern.lab_hours;
                } else if (sectionType === 'tutorial') {
                    expectedHours = pattern.tutorial_hours;
                }
                
                // Calculate current total for this section type
                const currentTotal = (this.timeSlots[sectionId] || []).reduce((sum, slot) => sum + slot.duration, 0);
                const newTotal = currentTotal + duration;
                
                // CRITICAL: Check if adding this slot would exceed expected hours
                if (expectedHours > 0 && newTotal > expectedHours) {
                    alert(`⚠️ This ${sectionType} section can only have ${expectedHours} hours total.\n\nCurrent: ${currentTotal}h\nNew slot: +${duration}h\nTotal would be: ${newTotal}h\n\nPlease adjust your time slots.`);
                    return;
                }
            }
        } catch (error) {
            console.error('Error validating pattern:', error);
        }
        
        // Add the time slot
        const newSlot = {
            day: day,
            start_time: startTime,
            end_time: endTime,
            duration: duration,
            type: sectionType
        };
        
        this.timeSlots[sectionId].push(newSlot);
        window.sectionTimeSlotsMap[sectionId].push(newSlot); // ✅ SYNC GLOBAL
        
        this.updateTimeSlotsDisplay(sectionId);
        this.updateCreditHoursStatus(sectionId);
        
        // Clear the form but keep day selected for convenience
        document.getElementById(`startTime_${sectionId}`).value = '';
        document.getElementById(`endTime_${sectionId}`).value = '';
    }

    updateTimeSlotsDisplay(sectionId) {
        const container = document.getElementById(`timeSlotsContainer_${sectionId}`);
        const slots = this.timeSlots[sectionId];
        
        if (!slots || slots.length === 0) {
            container.innerHTML = '<p class="text-muted small">No time slots added yet</p>';
            return;
        }
        
        // Calculate total hours
        const totalHours = slots.reduce((sum, slot) => sum + slot.duration, 0);
        
        container.innerHTML = slots.map((slot, index) => `
            <div class="alert alert-info alert-dismissible fade show py-2" role="alert">
                <small>
                    <strong>${slot.day}</strong>: ${slot.start_time} - ${slot.end_time} 
                    <span class="badge bg-secondary ms-2">${slot.duration}h</span>
                    <span class="badge bg-primary ms-1">${slot.type}</span>
                </small>
                <button type="button" class="btn-close" onclick="window.sectionManager.removeTimeSlot(${sectionId}, ${index})"></button>
            </div>
        `).join('');
    }

    removeTimeSlot(sectionId, slotIndex) {
        this.timeSlots[sectionId].splice(slotIndex, 1);
        window.sectionTimeSlotsMap[sectionId].splice(slotIndex, 1); // ✅ SYNC GLOBAL
        this.updateTimeSlotsDisplay(sectionId);
        this.updateCreditHoursStatus(sectionId);
    }

    removeSectionForm(sectionId) {
        const form = document.getElementById(`sectionForm_${sectionId}`);
        if (form) {
            form.remove();
            delete this.timeSlots[sectionId];
            delete this.creditHoursMap[sectionId];
            delete window.sectionTimeSlotsMap[sectionId];
            delete window.sectionCreditHoursMap[sectionId];
        }
    }

    // ==========================================
    // CREDIT HOURS STATUS UPDATE
    // ==========================================
    updateCreditHoursStatus(sectionId) {
        // Check if a lecture is selected
        const lectureSelect = document.getElementById(`followsLecture_${sectionId}`);
        if (lectureSelect && lectureSelect.value) {
            // Use the lecture-aware calculation
            this.updateCreditHoursFromLecture(sectionId);
            return;
        }
        
        // Original logic for sections without linked lectures
        const creditHours = this.creditHoursMap[sectionId] || 0;
        const slots = this.timeSlots[sectionId] || [];
        const totalHours = slots.reduce((sum, slot) => sum + slot.duration, 0);
        
        const statusElement = document.getElementById(`creditHoursStatus_${sectionId}`);
        const warningElement = document.getElementById(`creditHoursWarning_${sectionId}`);
        
        if (statusElement) {
            statusElement.textContent = `${totalHours}/${creditHours}`;
            
            // Add color coding
            if (creditHours > 0) {
                if (totalHours === creditHours) {
                    statusElement.className = 'text-success fw-bold';
                    warningElement.innerHTML = '<i class="bi bi-check-circle"></i> Perfect match!';
                    warningElement.className = 'text-success';
                } else if (totalHours < creditHours) {
                    statusElement.className = 'text-warning fw-bold';
                    const remaining = creditHours - totalHours;
                    warningElement.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Need ${remaining} more hour(s)`;
                    warningElement.className = 'text-warning';
                } else {
                    statusElement.className = 'text-danger fw-bold';
                    const excess = totalHours - creditHours;
                    warningElement.innerHTML = `<i class="bi bi-x-circle"></i> ${excess} hour(s) over limit`;
                    warningElement.className = 'text-danger';
                }
            } else {
                statusElement.className = 'text-muted';
                warningElement.innerHTML = '';
            }
        }
    }

    updateCreditHoursFromLecture(sectionId) {
        console.log('🔍 updateCreditHoursFromLecture called for section:', sectionId);
        
        const lectureSelect = document.getElementById(`followsLecture_${sectionId}`);
        const selectedOption = lectureSelect.options[lectureSelect.selectedIndex];
        const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
        
        console.log('Selected option:', selectedOption);
        console.log('Selected value:', selectedOption?.value);
        
        if (!selectedOption || !selectedOption.value) {
            console.log('❌ No lecture selected, using only lab/tutorial hours');
            this.updateCreditHoursStatus(sectionId);
            return;
        }
        
        // Get lecture hours from data attribute
        const lectureHours = parseInt(selectedOption.getAttribute('data-lecture-hours') || 0);
        console.log('🎓 Lecture hours from data attribute:', lectureHours);
        
        // Calculate lab/tutorial hours
        const labTutorialSlots = this.timeSlots[sectionId] || [];
        const labTutorialHours = labTutorialSlots.reduce((sum, slot) => sum + slot.duration, 0);
        console.log('🧪 Lab/Tutorial hours:', labTutorialHours);
        
        // Total hours = lecture + lab/tutorial
        const totalHours = lectureHours + labTutorialHours;
        console.log('📈 Total hours:', totalHours);
        
        const creditHours = this.creditHoursMap[sectionId] || 0;
        console.log('💯 Credit hours required:', creditHours);
        
        const statusElement = document.getElementById(`creditHoursStatus_${sectionId}`);
        const warningElement = document.getElementById(`creditHoursWarning_${sectionId}`);
        
        if (statusElement) {
            // Get the course details to find expected hours for this section type
            const courseCode = document.getElementById('sectionCourseCode').value;
            
            fetch(`${window.API_URL}/course-details/${courseCode}`)
                .then(res => res.json())
                .then(courseData => {
                    if (!courseData.pattern) {
                        // No pattern, show basic hours
                        statusElement.textContent = `${labTutorialHours}/${creditHours}`;
                        return;
                    }
                    
                    const pattern = courseData.pattern;
                    let expectedHours = 0;
                    
                    if (sectionType === 'tutorial') {
                        expectedHours = pattern.tutorial_hours;
                    } else if (sectionType.includes('lab')) {
                        expectedHours = pattern.lab_hours;
                    }
                    
                    // Show breakdown with expected hours for this section type only
                    if (labTutorialHours > 0) {
                        statusElement.textContent = `${lectureHours}+${labTutorialHours}/${expectedHours}`;
                    } else {
                        statusElement.textContent = `${lectureHours}+0/${expectedHours}`;
                    }
                    
                    console.log('✏️ Updated status display to:', statusElement.textContent);
                    
                    // Add color coding based on expected hours
                    if (expectedHours > 0) {
                        if (labTutorialHours === expectedHours) {
                            statusElement.className = 'text-success fw-bold';
                            warningElement.innerHTML = '<i class="bi bi-check-circle"></i> Perfect match!';
                            warningElement.className = 'text-success';
                        } else if (labTutorialHours < expectedHours) {
                            statusElement.className = 'text-warning fw-bold';
                            const remaining = expectedHours - labTutorialHours;
                            warningElement.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Need ${remaining} more hour(s) for ${sectionType}`;
                            warningElement.className = 'text-warning';
                        } else {
                            statusElement.className = 'text-danger fw-bold';
                            const excess = labTutorialHours - expectedHours;
                            warningElement.innerHTML = `<i class="bi bi-x-circle"></i> ${excess} hour(s) over limit`;
                            warningElement.className = 'text-danger';
                        }
                    } else {
                        statusElement.className = 'text-muted';
                        warningElement.innerHTML = '';
                    }
                    
                    console.log('✅ Credit hours update complete!');
                })
                .catch(error => console.error('Error fetching pattern:', error));
        } else {
            console.error('❌ Status element not found!');
        }
    }

    // ==========================================
    // CREATE ALL SECTIONS
    // ==========================================
    async createAllSections() {
        const academicLevel = document.getElementById('sectionAcademicLevel').value;
        const courseCode = document.getElementById('sectionCourseCode').value;
        const sectionForms = document.querySelectorAll('.section-form-card');
        
        if (!courseCode) {
            alert('Please select Course Code');
            return;
        }
        
        if (sectionForms.length === 0) {
            alert('Please add at least one section first');
            return;
        }
        
        // Get course details to check credit hours
        let courseCreditHours = 0;
        let courseName = '';
        try {
            const response = await fetch(`${window.API_URL}/course-details/${courseCode}`);
            if (response.ok) {
                const courseData = await response.json();
                courseCreditHours = courseData.credit_hours || 0;
                courseName = courseData.name || courseCode;
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
        }
        
        const sections = [];
        const errors = [];
        const warnings = [];
        
        sectionForms.forEach(form => {
            const sectionId = parseInt(form.id.split('_')[1]);
            const slots = this.timeSlots[sectionId];
            const sectionType = document.getElementById(`sectionType_${sectionId}`).value;
            
            if (!sectionType) {
                errors.push(`Section #${sectionId}: Section type not selected`);
                return;
            }
            
            if (!slots || slots.length === 0) {
                errors.push(`Section #${sectionId}: No time slots added`);
                return;
            }
            
            let followsLecture = null;
            if (sectionType === 'lab' || sectionType === 'lab a' || sectionType === 'lab b' || sectionType === 'tutorial') {
                followsLecture = document.getElementById(`followsLecture_${sectionId}`).value;
                
                // Only tutorials REQUIRE a parent lecture
                if (sectionType === 'tutorial' && !followsLecture) {
                    errors.push(`Section #${sectionId}: Tutorials must have a parent lecture section`);
                    return;
                }
                
                // Labs are optional, so just set to null if not selected
                if (!followsLecture) {
                    followsLecture = null;
                }
            }
            
            // Calculate total hours for this section
            const totalHours = slots.reduce((sum, slot) => sum + slot.duration, 0);
            
            // Validate against credit hours
            if (courseCreditHours > 0) {
                if (totalHours < courseCreditHours) {
                    warnings.push(`Section #${sectionId}: Only ${totalHours}h (needs ${courseCreditHours}h)`);
                } else if (totalHours > courseCreditHours + 2) {
                    warnings.push(`Section #${sectionId}: ${totalHours}h (significantly exceeds ${courseCreditHours}h)`);
                }
            }
            
            sections.push({
                section_id: sectionId,
                time_slots: slots,
                total_hours: totalHours,
                type: sectionType,
                follows_lecture: followsLecture
            });
        });
        
        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }
        
        let confirmMsg = `Create ${sections.length} section(s) for ${courseCode} - ${courseName}?\n\n`;
        
        sections.forEach(s => {
            const status = courseCreditHours > 0 ? 
                (s.total_hours === courseCreditHours ? '✅' : 
                 s.total_hours < courseCreditHours ? '⚠️' : '❌') : 'ℹ️';
            const lectureInfo = s.follows_lecture ? ` → Lecture ${s.follows_lecture}` : '';
            confirmMsg += `${status} Section #${s.section_id} (${s.type}): ${s.total_hours}h${lectureInfo}\n`;
        });
        
        if (courseCreditHours > 0) {
            confirmMsg += `\nCourse Credit Hours: ${courseCreditHours}`;
        }
        
        if (warnings.length > 0) {
            confirmMsg += `\n\nWarnings:\n${warnings.join('\n')}`;
        }
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        const results = [];
        
        for (const section of sections) {
            try {
                const response = await fetch(`${window.API_URL}/create-section`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        course_code: courseCode,
                        classroom: null,
                        max_number: null,
                        time_slots: section.time_slots,
                        academic_level: academicLevel ? parseInt(academicLevel) : null,
                        type: section.type,
                        follows_lecture: section.follows_lecture,
                        section_number: null
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successCount++;
                    const status = courseCreditHours > 0 ? 
                        (section.total_hours === courseCreditHours ? '✅' : 
                         section.total_hours < courseCreditHours ? '⚠️' : '❌') : '✅';
                    const lectureInfo = section.follows_lecture ? ` (linked to ${section.follows_lecture})` : '';
                    results.push(`${status} Section ${data.section.sec_num} (${section.type}): ${section.total_hours}/${courseCreditHours}h${lectureInfo}`);
                } else {
                    failCount++;
                    results.push(`❌ Section #${section.section_id} (${section.type}): ${data.error}`);
                }
            } catch (error) {
                failCount++;
                results.push(`❌ Section #${section.section_id} (${section.type}): Connection error`);
            }
        }
        
        alert(`Section Creation Complete!\n\n` +
              `✅ Successful: ${successCount}\n` +
              `❌ Failed: ${failCount}\n\n` +
              `Details:\n${results.join('\n')}`);
        
        if (successCount > 0) {
            document.getElementById('sectionsContainer').innerHTML = '';
            this.formCounter = 0;
            window.sectionFormCounter = 0;
            this.timeSlots = {};
            this.creditHoursMap = {};
            window.sectionTimeSlotsMap = {};
            window.sectionCreditHoursMap = {};
        }
    }

    reset() {
        document.getElementById('sectionsContainer').innerHTML = '';
        this.formCounter = 0;
        window.sectionFormCounter = 0;
        this.timeSlots = {};
        this.creditHoursMap = {};
        window.sectionTimeSlotsMap = {};
        window.sectionCreditHoursMap = {};
        if (document.getElementById('sectionForm')) {
            document.getElementById('sectionForm').reset();
        }
    }
}

// ✅ EXPOSE TO WINDOW
window.sectionManager = null;
console.log('✅ SectionManager COMPLETE loaded');