// ============================================
// File Upload Manager - COMPLETE FIXED VERSION
// ============================================
 

class FileUploadManager {
    constructor() {
        this.uploadedData = null;
    }

    showFileUpload() {
        document.getElementById('fileUploadSection').style.display = 'block';
        document.getElementById('manualEntrySection').style.display = 'none';
        
        // Update active button states
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            if (btn.textContent.includes('Upload')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    showManualEntry() {
        document.getElementById('fileUploadSection').style.display = 'none';
        document.getElementById('manualEntrySection').style.display = 'block';
        
        // Update active button states
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            if (btn.textContent.includes('Manual Entry')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    cancelFileUpload() {
        document.getElementById('filePreviewSection').style.display = 'none';
        document.getElementById('scheduleFile').value = '';
        document.getElementById('filePreviewBody').innerHTML = '';
        if (window.NotificationManager) {
            NotificationManager.info('File upload cancelled');
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (window.NotificationManager) {
            NotificationManager.info(`Processing ${file.name}...`);
        }
        
        if (fileExtension === 'pdf') {
            await this.parsePDFFile(file);
        } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            this.parseExcelOrCSVFile(file, fileExtension);
        } else {
            alert('Unsupported file format. Please upload PDF, Excel, or CSV files.');
            return;
        }
    }

    // ==========================================
    // PDF PARSING
    // ==========================================
    async parsePDFFile(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                alert('❌ PDF.js library not loaded. Please refresh the page.');
                return;
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            
            let allTextItems = [];
            
            // Extract text from all pages with position information
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Sort items by Y position (top to bottom) then X position (left to right)
                const sortedItems = textContent.items.sort((a, b) => {
                    const yDiff = Math.abs(b.transform[5] - a.transform[5]);
                    if (yDiff > 5) { // Items on different lines
                        return b.transform[5] - a.transform[5];
                    }
                    return a.transform[4] - b.transform[4]; // Same line, sort by X
                });
                
                // Group items by rows (items with similar Y coordinates)
                let currentY = null;
                let currentRow = [];
                const rows = [];
                
                sortedItems.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    
                    if (currentY === null || Math.abs(currentY - y) < 5) {
                        currentY = y;
                        currentRow.push(item.str);
                    } else {
                        if (currentRow.length > 0) {
                            rows.push(currentRow.join(' '));
                        }
                        currentRow = [item.str];
                        currentY = y;
                    }
                });
                
                if (currentRow.length > 0) {
                    rows.push(currentRow.join(' '));
                }
                
                allTextItems.push(...rows);
            }
            
            const fullText = allTextItems.join('\n');
            console.log('📄 Extracted PDF text:', fullText);
            
            // Parse the extracted text
            const rows = this.parseTextFromPDF(fullText);
            
            if (rows.length === 0) {
                alert('⚠️ No valid course data found in PDF. Please check the file format.\n\nExpected format:\nCourse Code | Section | Type | Days | Time\nExample: PHYS103 1 lecture 1-3-5 8-9');
                return;
            }
            
            this.processParsedData(rows);
            
        } catch (error) {
            console.error('❌ Error parsing PDF:', error);
            alert('Error parsing PDF file: ' + error.message);
        }
    }

    parseTextFromPDF(text) {
        const rows = [];
        
        // Clean up the text and split into lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        // Remove header line if present
        const dataLines = lines.filter(line => 
            !line.toLowerCase().includes('course code') && 
            !line.toLowerCase().includes('section') &&
            !line.toLowerCase().includes('type') &&
            !line.toLowerCase().includes('day') &&
            !line.toLowerCase().includes('time') &&
            line.length > 3
        );
        
        let currentCourseCode = null;
        let currentSection = null;
        
        for (let line of dataLines) {
            // CRITICAL FIX: Remove spaces around hyphens and collapse multiple spaces
            line = line.replace(/\s+-\s+/g, '-');  // "1 - 3 - 5" → "1-3-5"
            line = line.replace(/\s+/g, ' ').trim(); // Multiple spaces → single space
            
            console.log('🔍 Processing:', line);
            
            // Pattern 1: Fully spaced (e.g., "PHYS103 1 lecture 1-3-5 8-9")
            let match = line.match(/^([A-Z]+(?:\s*\d+)+)\s+(\d+)\s+(lecture|lab\s*a|lab\s*b|lab|tutorial)\s+([\d-]+)\s+([\d-]+)$/i);
            
            if (match) {
                currentCourseCode = match[1].replace(/\s+/g, '');
                currentSection = match[2];
                rows.push({
                    courseCode: currentCourseCode,
                    section: currentSection,
                    type: match[3].replace(/\s+/g, ' ').toLowerCase(),
                    days: match[4],
                    time: match[5]
                });
                console.log('✅ Pattern 1:', rows[rows.length - 1]);
                continue;
            }
            
            // Pattern 2: Type continuation (e.g., "Lab a 4 8-10")
            match = line.match(/^([Ll]\s*ab\s*[ab]?|lecture|lab|tutorial)\s+([\d-]+)\s+([\d-]+)$/i);
            
            if (match && currentCourseCode && currentSection) {
                let type = match[1].replace(/\s+/g, ' ').toLowerCase().trim();
                type = type.replace(/^l\s*ab/i, 'lab');
                
                rows.push({
                    courseCode: currentCourseCode,
                    section: currentSection,
                    type: type,
                    days: match[2],
                    time: match[3]
                });
                console.log('✅ Pattern 2:', rows[rows.length - 1]);
                continue;
            }
            
            // Pattern 3: Course without section on same line
            match = line.match(/^([A-Z]+(?:\s*\d+)+)\s+(\d+)\s+(lecture|lab|tutorial)\s+([\d-]+)\s+([\d-]+)$/i);
            
            if (match) {
                currentCourseCode = match[1];
                currentSection = match[2];
                rows.push({
                    courseCode: currentCourseCode,
                    section: currentSection,
                    type: match[3].toLowerCase(),
                    days: match[4],
                    time: match[5]
                });
                console.log('✅ Pattern 3:', rows[rows.length - 1]);
                continue;
            }
            
            // Pattern 4: Section number change
            match = line.match(/^(\d+)\s+(lecture|lab|tutorial)\s+([\d-]+)\s+([\d-]+)$/i);
            
            if (match && currentCourseCode) {
                currentSection = match[1];
                rows.push({
                    courseCode: currentCourseCode,
                    section: currentSection,
                    type: match[2].toLowerCase(),
                    days: match[3],
                    time: match[4]
                });
                console.log('✅ Pattern 4:', rows[rows.length - 1]);
                continue;
            }
            
            // Pattern 5: Just type + days + time
            match = line.match(/^(lecture|lab|tutorial)\s+([\d-]+)\s+([\d-]+)$/i);
            
            if (match && currentCourseCode && currentSection) {
                rows.push({
                    courseCode: currentCourseCode,
                    section: currentSection,
                    type: match[1].toLowerCase(),
                    days: match[2],
                    time: match[3]
                });
                console.log('✅ Pattern 5:', rows[rows.length - 1]);
                continue;
            }
            
            console.log('❌ No pattern matched');
        }
        
        console.log(`\n📊 Total rows parsed: ${rows.length}`);
        return rows;
    }

    // ==========================================
    // CSV PARSING
    // ==========================================
    parseExcelOrCSVFile(file, fileExtension) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let rows = [];
                
                if (fileExtension === 'csv') {
                    rows = this.parseCSVData(e.target.result);
                } else {
                    alert('Excel parsing would require SheetJS library. For now, please use CSV format.');
                    return;
                }
                
                this.processParsedData(rows);
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Error parsing file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }

    parseCSVData(csvText) {
        const rows = [];
        const lines = csvText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(',').map(col => col.trim());
            
            if (columns.length >= 5) {
                rows.push({
                    courseCode: columns[0],
                    section: columns[1],
                    type: columns[2],
                    days: columns[3],
                    time: columns[4]
                });
            }
        }
        
        return rows;
    }

    // ==========================================
    // PROCESS PARSED DATA
    // ==========================================
    processParsedData(rows) {
        const previewBody = document.getElementById('filePreviewBody');
        const uploadSummary = document.getElementById('uploadSummary');
        
        previewBody.innerHTML = '';
        
        let validRows = 0;
        let invalidRows = 0;
        
        // Track sections by course-section-type
        const sectionBreakdown = {};
        
        rows.forEach((row, index) => {
            const isValid = this.validateRowData(row);
            const tr = document.createElement('tr');
            
            if (isValid) {
                validRows++;
                tr.className = 'table-success';
                
                // Create unique key for each section type
                const sectionKey = `${row.courseCode}-${row.section}-${row.type}`;
                if (!sectionBreakdown[sectionKey]) {
                    sectionBreakdown[sectionKey] = {
                        courseCode: row.courseCode,
                        sectionNumber: row.section,
                        type: row.type,
                        timeSlots: []
                    };
                }
                sectionBreakdown[sectionKey].timeSlots.push({
                    days: row.days,
                    time: row.time
                });
                
            } else {
                invalidRows++;
                tr.className = 'table-danger';
            }
            
            tr.innerHTML = `
                <td>${row.courseCode || 'N/A'}</td>
                <td>${row.section || 'N/A'}</td>
                <td><span class="badge bg-info">${row.type || 'N/A'}</span></td>
                <td>${row.days || 'N/A'}</td>
                <td>${row.time || 'N/A'}</td>
                <td>
                    ${isValid ? 
                        '<span class="badge bg-success">✓ Valid</span>' : 
                        '<span class="badge bg-danger">✗ Invalid</span>'
                    }
                </td>
            `;
            
            previewBody.appendChild(tr);
        });
        
        // Calculate summary
        const totalSections = Object.keys(sectionBreakdown).length;
        
        let summaryHTML = `
            <div class="row">
                <div class="col-md-4">
                    <strong>📊 File Analysis:</strong><br>
                    ✅ Valid rows: ${validRows}<br>
                    ${invalidRows > 0 ? `❌ Invalid rows: ${invalidRows}<br>` : ''}
                </div>
                <div class="col-md-8">
                    <strong>📚 Sections to Create:</strong> ${totalSections}
                    <br><small class="text-muted">Each type (lecture, lab, tutorial) creates a separate section</small>
                </div>
            </div>
            <hr>
            <div class="mt-2">
                <strong>Section Breakdown:</strong>
                <div class="table-responsive mt-2">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Course</th>
                                <th>Section</th>
                                <th>Type</th>
                                <th>Time Slots</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Group by course-section for better display
        const courseGroups = {};
        Object.values(sectionBreakdown).forEach(section => {
            const groupKey = `${section.courseCode}-${section.sectionNumber}`;
            if (!courseGroups[groupKey]) {
                courseGroups[groupKey] = [];
            }
            courseGroups[groupKey].push(section);
        });
        
        Object.keys(courseGroups).sort().forEach(groupKey => {
            const sections = courseGroups[groupKey];
            const [courseCode, sectionNum] = groupKey.split('-');
            
            sections.forEach((section, idx) => {
                const totalHours = section.timeSlots.reduce((sum, slot) => {
                    const [start, end] = slot.time.split('-').map(t => parseInt(t));
                    return sum + (end - start);
                }, 0);
                
                const typeClass = section.type === 'lecture' ? 'primary' : 
                                section.type.includes('lab') ? 'success' : 'info';
                
                summaryHTML += `
                    <tr>
                        ${idx === 0 ? `<td rowspan="${sections.length}"><strong>${courseCode}</strong></td>` : ''}
                        ${idx === 0 ? `<td rowspan="${sections.length}">${sectionNum}</td>` : ''}
                        <td><span class="badge bg-${typeClass}">${section.type}</span></td>
                        <td>${section.timeSlots.length} slot(s)</td>
                        <td><strong>${totalHours}h</strong></td>
                    </tr>
                `;
            });
        });
        
        summaryHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <i class="bi bi-info-circle"></i> 
                <strong>Note:</strong> 
                <ul class="mb-0 mt-2">
                    <li>Each type (lecture, lab, tutorial) will be created as a <strong>separate section</strong></li>
                    <li>Labs and tutorials will automatically link to their parent lecture sections</li>
                    <li>Academic level is optional for file uploads</li>
                </ul>
            </div>
        `;
        
        uploadSummary.innerHTML = summaryHTML;
        document.getElementById('filePreviewSection').style.display = 'block';
        
        if (window.NotificationManager) {
            NotificationManager.success(`Found ${validRows} valid entries`);
        }
    }

    // ==========================================
    // VALIDATE ROW DATA
    // ==========================================
    validateRowData(row) {
        if (!row.courseCode || !row.section || !row.type || !row.days || !row.time) {
            return false;
        }
        
        // Validate course code format (letters followed by numbers)
        if (!/^[A-Za-z]+\d+$/.test(row.courseCode)) {
            return false;
        }
        
        // Validate section is numeric
        if (!/^\d+$/.test(row.section)) {
            return false;
        }
        
        // Validate type (case insensitive, allow spaces)
        const validTypes = ['lecture', 'lab', 'lab a', 'lab b', 'tutorial'];
        const normalizedType = row.type.toLowerCase().trim();
        if (!validTypes.includes(normalizedType)) {
            return false;
        }
        
        // Validate days format (e.g., "1-3-5", "4", "1", "1-3")
        if (!/^[\d\-]+$/.test(row.days)) {
            return false;
        }
        
        // Validate day numbers are between 1-5 (Sunday-Thursday)
        const dayNumbers = row.days.split('-').map(d => parseInt(d));
        if (dayNumbers.some(day => day < 1 || day > 5)) {
            return false;
        }
        
        // Validate time format (e.g., "8-9", "8-10", "10-12")
        if (!/^\d+\-\d+$/.test(row.time)) {
            return false;
        }
        
        // Validate time range is logical
        const [startTime, endTime] = row.time.split('-').map(t => parseInt(t));
        if (startTime >= endTime || startTime < 8 || endTime > 17) {
            return false;
        }
        
        return true;
    }

    // ==========================================
    // PROCESS UPLOADED SCHEDULE
    // ==========================================
    async processUploadedSchedule() {
        const previewBody = document.getElementById('filePreviewBody');
        const academicLevel = document.getElementById('sectionAcademicLevel').value;
        
        const rows = [];
        
        // Extract data from preview table (only valid rows)
        const rowsElements = previewBody.querySelectorAll('tr');
        rowsElements.forEach(tr => {
            if (tr.classList.contains('table-success')) {
                const cells = tr.querySelectorAll('td');
                rows.push({
                    courseCode: cells[0].textContent.trim(),
                    section: cells[1].textContent.trim(),
                    type: cells[2].textContent.trim(),
                    days: cells[3].textContent.trim(),
                    time: cells[4].textContent.trim()
                });
            }
        });
        
        if (rows.length === 0) {
            alert('❌ No valid rows to process.');
            return;
        }
        
        // Group by course-section-type
        const sectionsToCreate = [];
        const courseSectionMap = {};
        
        rows.forEach(row => {
            const key = `${row.courseCode}-${row.section}-${row.type}`;
            const groupKey = `${row.courseCode}-${row.section}`;
            
            if (!courseSectionMap[groupKey]) {
                courseSectionMap[groupKey] = { lectures: [], labs: [], tutorials: [] };
            }
            
            const timeSlots = this.convertToTimeSlots(row.days, row.time, row.type);
            const sectionData = {
                courseCode: row.courseCode,
                sectionNumber: parseInt(row.section),
                type: row.type.toLowerCase(),
                timeSlots: timeSlots,
                groupKey: groupKey
            };
            
            sectionsToCreate.push(sectionData);
            
            // Categorize by type
            if (row.type.toLowerCase() === 'lecture') {
                courseSectionMap[groupKey].lectures.push(sectionData);
            } else if (row.type.toLowerCase().includes('lab')) {
                courseSectionMap[groupKey].labs.push(sectionData);
            } else if (row.type.toLowerCase() === 'tutorial') {
                courseSectionMap[groupKey].tutorials.push(sectionData);
            }
        });
        
        // Confirmation
        let confirmMsg = `Create ${sectionsToCreate.length} section(s)?\n\n`;
        if (academicLevel) {
            confirmMsg += `Academic Level: ${academicLevel}\n\n`;
        } else {
            confirmMsg += `Academic Level: Not specified (optional)\n\n`;
        }
        confirmMsg += `Sections to create:\n`;
        
        Object.keys(courseSectionMap).forEach(groupKey => {
            const group = courseSectionMap[groupKey];
            confirmMsg += `\n${groupKey}:`;
            if (group.lectures.length > 0) confirmMsg += `\n  • ${group.lectures.length} lecture(s)`;
            if (group.labs.length > 0) confirmMsg += `\n  • ${group.labs.length} lab(s) (will link to lecture)`;
            if (group.tutorials.length > 0) confirmMsg += `\n  • ${group.tutorials.length} tutorial(s) (will link to lecture)`;
        });
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Show progress
        const progressMsg = document.createElement('div');
        progressMsg.className = 'alert alert-info mt-3';
        progressMsg.innerHTML = '<i class="bi bi-hourglass-split"></i> Creating sections... Please wait.';
        document.getElementById('uploadSummary').appendChild(progressMsg);
        
        // Create sections in order: lectures first, then labs/tutorials
        let successCount = 0;
        let failCount = 0;
        const results = [];
        const lectureSectionMap = {};
        
        // Step 1: Create all lecture sections first
        for (const sectionData of sectionsToCreate) {
            if (sectionData.type === 'lecture') {
                try {
                    const response = await fetch(`${window.API_URL}/create-section`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            course_code: sectionData.courseCode,
                            classroom: null,
                            max_number: null,
                            time_slots: sectionData.timeSlots,
                            academic_level: academicLevel ? parseInt(academicLevel) : null,
                            type: 'lecture',
                            follows_lecture: null,
                            section_number: null
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        successCount++;
                        lectureSectionMap[sectionData.groupKey] = data.section.sec_num;
                        results.push(`✅ ${sectionData.courseCode} Section ${sectionData.sectionNumber} Lecture: Created as ${data.section.sec_num}`);
                    } else {
                        failCount++;
                        results.push(`❌ ${sectionData.courseCode} Section ${sectionData.sectionNumber} Lecture: ${data.error || 'Failed'}`);
                    }
                } catch (error) {
                    failCount++;
                    results.push(`❌ ${sectionData.courseCode} Section ${sectionData.sectionNumber} Lecture: Connection error`);
                }
            }
        }
        
        // Step 2: Create labs and tutorials with references to their parent lectures
        for (const sectionData of sectionsToCreate) {
            if (sectionData.type !== 'lecture') {
                const parentLecture = lectureSectionMap[sectionData.groupKey];
                
                try {
                    const response = await fetch(`${window.API_URL}/create-section`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            course_code: sectionData.courseCode,
                            classroom: null,
                            max_number: null,
                            time_slots: sectionData.timeSlots,
                            academic_level: academicLevel ? parseInt(academicLevel) : null,
                            type: sectionData.type,
                            follows_lecture: parentLecture || null,
                            section_number: null
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        successCount++;
                        const linkInfo = parentLecture ? ` (linked to lecture ${parentLecture})` : '';
                        results.push(`✅ ${sectionData.courseCode} Section ${sectionData.sectionNumber} ${sectionData.type}: Created as ${data.section.sec_num}${linkInfo}`);
                    } else {
                        failCount++;
                        results.push(`❌ ${sectionData.courseCode} Section ${sectionData.sectionNumber} ${sectionData.type}: ${data.error || 'Failed'}`);
                    }
                } catch (error) {
                    failCount++;
                    results.push(`❌ ${sectionData.courseCode} Section ${sectionData.sectionNumber} ${sectionData.type}: Connection error`);
                }
            }
        }
        
        // Remove progress message
        progressMsg.remove();
        
        // Show detailed results
        const resultMsg = `Section Creation Complete!\n\n` +
              `✅ Successful: ${successCount}\n` +
              `❌ Failed: ${failCount}\n\n` +
              `Detailed Results:\n${results.join('\n')}`;
        
        alert(resultMsg);
        
        // Reset form if all succeeded
        if (successCount > 0) {
            if (failCount === 0) {
                this.cancelFileUpload();
                alert('✨ All sections created successfully! Labs and tutorials are linked to their parent lectures.');
            }
        }
    }

    // ==========================================
    // CONVERT TIME SLOTS
    // ==========================================
    convertToTimeSlots(daysStr, timeStr, type) {
        const timeSlots = [];
        const dayNumbers = daysStr.split('-').map(d => parseInt(d.trim()));
        const [startHour, endHour] = timeStr.split('-').map(t => parseInt(t.trim()));
        
        // Map day numbers to day names
        const dayMap = {
            1: 'Sunday',
            2: 'Monday', 
            3: 'Tuesday',
            4: 'Wednesday',
            5: 'Thursday'
        };
        
        dayNumbers.forEach(dayNum => {
            const dayName = dayMap[dayNum];
            if (dayName) {
                timeSlots.push({
                    day: dayName,
                    start_time: `${startHour}:00`,
                    end_time: `${endHour}:00`,
                    duration: endHour - startHour,
                    type: type.toLowerCase()
                });
            }
        });
        
        return timeSlots;
    }
}

// ✅ EXPOSE TO WINDOW
window.fileUploadManager = null;
console.log('✅ FileUploadManager COMPLETE loaded');