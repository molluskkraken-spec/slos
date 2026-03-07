/* =========================================
   SCORESHEET.JS - NEW SCORESHEET SYSTEM
   ========================================= */

import { getCurrentUser, appContainer, pushNavigation } from './global.js';
import { userAccounts, getUserAccounts, getScoresheets, saveScoresheets, getNotifications, saveNotifications, getClusters } from './storage.js';
import { showSuccessToast } from './students.js';

// Scoresheet Types
const SCORESHEET_TYPES = [
    'Concept Notes',
    'Activities',
    'Quizzes',
    'Prelim',
    'Performance Task',
    'Departmental Exam'
];

const QUARTERS = ['1st', '2nd', '3rd', '4th'];

// Global state for scoresheet
let currentScoreSheetContext = {
    subject: null,
    type: 'Concept Notes',
    quarter: '1st',
    teacherUsername: null,
    isTeacher: false,
    isEditMode: false
};

/**
 * Open scoresheet view (Teacher or Student)
 */
export function openScoresheet(subject, initialType = 'Concept Notes', initialQuarter = '1st') {
    const currentUser = getCurrentUser();
    const userRole = userAccounts[currentUser].role;
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = `${subject} - Scoresheet`;

    pushNavigation(`${subject} - Scoresheet`, () => openScoresheet(subject, initialType, initialQuarter));

    // Determine which teacher's scoresheet to show. If current user is a student,
    // find the assigned teacher for this subject and the student's strand/section.
    const displayProfileUser = currentUser; // profile shown is always the current user (student or teacher)

    let dataTeacherUsername = currentUser;
    if (userRole === 'student') {
        const assigned = findAssignedTeacherForStudent(subject, currentUser);
        if (assigned) dataTeacherUsername = assigned;
    }

    // Store context for edit mode
    currentScoreSheetContext = {
        subject,
        type: initialType,
        quarter: initialQuarter,
        teacherUsername: dataTeacherUsername,
        isTeacher: userRole === 'teacher',
        isEditMode: false,
        displayProfileUser
    };

    appContainer.innerHTML = '';

    const isTeacher = userRole === 'teacher';
    const canEdit = isTeacher;

    // Assigned teacher display name
    const assignedTeacherName = (userAccounts[dataTeacherUsername] && userAccounts[dataTeacherUsername].name) ? userAccounts[dataTeacherUsername].name : '';

    const html = `
        <div class="scoresheet-page">
            <!-- Blue Title Header -->
            <div class="scoresheet-header">
                <h1 style="margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: 0.5px;">${subject}</h1>
                <p id="scoresheet-subtitle" style="margin: 5px 0 0 0; opacity: 0.95; font-size: 0.95rem;">Scoresheet for ${initialType} - ${initialQuarter} Quarter</p>
                <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 0.85rem;">Work Immersion — ${isTeacher ? (userAccounts[currentUser]?.name || 'You') : (assignedTeacherName || 'Teacher')}</p>
            </div>

            <!-- Control Bar -->
            <div class="scoresheet-controls">
                <!-- Back Button -->
                <button type="button" onclick="goBack()" class="btn-muted" title="Back">
                    <i class="fas fa-arrow-left"></i> Back
                </button>

                <!-- Quarter selector for teachers / buttons for others -->
                ${canEdit ? `
                <div style="position: relative;">
                    <select id="scoresheet-quarter-select" class="scoresheet-select" onchange="changeQuarter(this.value)">
                        ${QUARTERS.map(q => `<option value="${q}" ${q === initialQuarter ? 'selected' : ''}>${q}</option>`).join('')}
                    </select>
                    <i class="fas fa-chevron-down" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; font-size: 0.85rem;"></i>
                </div>
                ` : `
                <div class="quarter-group">
                    ${QUARTERS.map(q => `<button class="quarter-btn ${q === initialQuarter ? 'active' : ''}" data-quarter="${q}" onclick="changeQuarter('${q}')">${q}</button>`).join('')}
                </div>
                `}

                <!-- Type Dropdown -->
                <div style="position: relative;">
                    <select id="scoresheet-type" class="scoresheet-select">
                        ${SCORESHEET_TYPES.map(type => `<option value="${type}" ${type === initialType ? 'selected' : ''}>${type}</option>`).join('')}
                    </select>
                    <i class="fas fa-chevron-down" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; font-size: 0.85rem;"></i>
                </div>

                ${canEdit ? `
                    <!-- Edit & Grade Buttons -->
                    <div style="margin-left: auto; display: flex; gap: 12px;">
                        <button class="scoresheet-action-btn grade" onclick="openGradeStudentsView()">
                            <i class="fas fa-user-graduate"></i> Grade Students
                        </button>
                        <button class="scoresheet-action-btn edit" onclick="openScoreSheetEditMode()">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- Scoresheet Table -->
            <div class="scoresheet-table">
                <table id="scoresheet-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">No.</th>
                            <th class="title">Title</th>
                            <th style="width:90px;">Score</th>
                            <th style="width:110px;">Posted Date</th>
                            <th style="width:120px;">Submitted</th>
                            <th style="width:80px;"><i class="fas fa-flag"></i> Status</th>
                        </tr>
                    </thead>
                    <tbody id="scoresheet-body">
                        <!-- Rows populated by JavaScript -->
                    </tbody>
                </table>
                <div id="empty-message" class="scoresheet-empty">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block; opacity: 0.3;"></i>
                    <p>No assignments yet for this type and quarter.</p>
                </div>
            </div>
        </div>
    `;

    appContainer.innerHTML = html;

    // Render initial table (use teacherUsername stored in context for data)
    renderScoresheetTable(subject, initialType, initialQuarter, isTeacher);
}

/**
 * Find an assigned teacher username for a student based on subject and student's strand/section
 */
function findAssignedTeacherForStudent(subject, studentUsername) {
    const accounts = getUserAccounts ? getUserAccounts() : userAccounts;
    const student = accounts[studentUsername];
    if (!student) return null;

    // Get student's actual data from clusters
    const clusters = getClusters();
    let studentStrand = null;
    let studentSection = null;
    
    // Find student in clusters to get strand/section
    for (const clusterName in clusters) {
        for (const strandName in clusters[clusterName]) {
            if (strandName === 'subjects') continue;
            for (const sectionName in clusters[clusterName][strandName]) {
                if (sectionName === 'subjects') continue;
                if (!Array.isArray(clusters[clusterName][strandName][sectionName])) continue;
                
                const found = clusters[clusterName][strandName][sectionName].find(s => s.id === student.studentId || s.name === student.name);
                if (found) {
                    studentStrand = strandName;
                    studentSection = sectionName;
                    break;
                }
            }
            if (studentStrand && studentSection) break;
        }
        if (studentStrand && studentSection) break;
    }

    // Now find teacher with matching subject and strand/section
    for (const username in accounts) {
        const acc = accounts[username];
        if (acc.role === 'teacher') {
            const subjects = acc.assignedSubjects || [];
            const strands = acc.assignedStrandSections || {};
            if (subjects.includes(subject)) {
                // Check if teacher has this strand+section assignment
                if (studentStrand && studentSection) {
                    if (strands[studentStrand] && strands[studentStrand].includes(studentSection)) {
                        return username;
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Change scoresheet type
 */
export function changeScoreSheetType() {
    const typeSelect = document.getElementById('scoresheet-type');
    const selectedType = typeSelect?.value || 'Concept Notes';
    const selectedQuarter = currentScoreSheetContext.quarter;
    const subject = currentScoreSheetContext.subject;

    currentScoreSheetContext.type = selectedType;
    // update subtitle if present
    const subtitle = document.getElementById('scoresheet-subtitle');
    if (subtitle) subtitle.textContent = `Scoresheet for ${selectedType} - ${selectedQuarter} Quarter`;
    renderScoresheetTable(subject, selectedType, selectedQuarter, currentScoreSheetContext.isTeacher);
}

/**
 * Change quarter
 */
export function changeQuarter(quarter) {
    // update button state if buttons exist
    const quarterBtns = document.querySelectorAll('.quarter-btn');
    quarterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quarter === quarter);
    });

    // update dropdown value if select exists
    const quarterSelect = document.getElementById('scoresheet-quarter-select');
    if (quarterSelect) quarterSelect.value = quarter;

    const selectedType = document.getElementById('scoresheet-type')?.value || 'Concept Notes';
    const subject = currentScoreSheetContext.subject;

    currentScoreSheetContext.quarter = quarter;

    // update subtitle text
    const subtitle = document.getElementById('scoresheet-subtitle');
    if (subtitle) subtitle.textContent = `Scoresheet for ${selectedType} - ${quarter} Quarter`;

    renderScoresheetTable(subject, selectedType, quarter, currentScoreSheetContext.isTeacher);
}



/**
 * Render the scoresheet table
 */
function renderScoresheetTable(subject, type, quarter, isTeacher) {
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();

    // Use the teacherUsername stored in context for template lookup (so students see the shared tasks)
    const teacherUsername = currentScoreSheetContext?.teacherUsername || getCurrentUser();

    // If the display profile user is a student with strand/section, use a section-level key for templates
    const displayUser = currentScoreSheetContext?.displayProfileUser;
    let templateOwnerKey = teacherUsername;
    if (displayUser && userAccounts[displayUser] && userAccounts[displayUser].strand && userAccounts[displayUser].section) {
        const s = userAccounts[displayUser].strand;
        const sec = userAccounts[displayUser].section;
        templateOwnerKey = `SECTION_${s}_${sec}`;
    }

    // Load template rows from the template owner (teacher or section)
    let templateRows = [];
    if (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) {
        templateRows = scoresheets[templateOwnerKey][subject][key];
    }

    // Viewer (current logged-in user) — used to fetch per-student overrides
    const viewer = getCurrentUser();

    // Per-student data (if any) stored under the student username
    const studentDataRows = (scoresheets[viewer] && scoresheets[viewer][subject] && scoresheets[viewer][subject][key]) ? scoresheets[viewer][subject][key] : [];

    const tbody = document.getElementById('scoresheet-body');
    const emptyMsg = document.getElementById('empty-message');

    if (!tbody) return;

    if (templateRows.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';

    let html = '';
    templateRows.forEach((row, index) => {
        // Overlay per-student fields (score, submitted, submittedDate, status) if viewer has personal data
        const personal = studentDataRows[index] || {};

        const isSubmitted = (typeof personal.submitted !== 'undefined') ? personal.submitted : (row.submitted || false);
        // Only use template's score if the viewer is the template owner (teacher or section owner)
        const allowTemplateScore = (viewer === templateOwnerKey);
        const displayScore = (typeof personal.score !== 'undefined' && personal.score !== null) ? personal.score : (allowTemplateScore && row.score !== undefined ? row.score : null);
        const submittedDate = personal.submittedDate || (allowTemplateScore ? row.submittedDate : null) || null;

        const statusColor = isSubmitted ? '#4ade80' : '#ef4444';
        const statusBg = isSubmitted ? '#dcfce7' : '#fee2e2';
        const statusText = isSubmitted ? 'Complete' : 'Pending';

        html += `
            <tr style="border-bottom: 1px solid #e8e8e8; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='white'">
                <!-- No. Column (Yellow) -->
                <td style="padding: 14px 12px; text-align: center; font-weight: 700; background: #ffeaa7; color: #333; border-right: 1px solid #e8e8e8; width: 60px;">${row.no || index + 1}</td>
                
                <!-- Title Column -->
                <td style="padding: 14px 12px; text-align: left; color: #1a1a1a; border-right: 1px solid #e8e8e8; min-width: 180px; font-weight: 500;">${row.title || '—'}</td>
                
                <!-- Score Column -->
                <td style="padding: 14px 12px; text-align: center; color: #1a1a1a; border-right: 1px solid #e8e8e8; font-weight: 600; width: 90px;">
                    ${isTeacher ? `${displayScore !== null ? displayScore : '—'}${row.scoreLimit ? ' / ' + row.scoreLimit : ''}` : `<input type="number" value="${displayScore !== null ? displayScore : ''}" min="0" max="${row.scoreLimit || 100}" style="width: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9rem;" oninput="updateStudentScore('${viewer}', '${subject}', '${key}', ${index}, this.value)" placeholder="—">${row.scoreLimit ? ' / ' + row.scoreLimit : ''}`}
                </td>
                
                <!-- Posted Date Column -->
                <td style="padding: 14px 12px; text-align: center; color: #666; border-right: 1px solid #e8e8e8; font-size: 0.9rem; width: 110px;">${row.postedDate || '—'}</td>
                
                <!-- Submitted Column -->
                <td style="padding: 14px 12px; text-align: center; border-right: 1px solid #e8e8e8; width: 120px;">
                    <input type="checkbox" ${isSubmitted ? 'checked' : ''} onclick="event.preventDefault(); toggleSubmitted('${viewer}', '${subject}', '${key}', ${index})" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--au-blue);">
                    ${submittedDate ? `<div style="font-size: 0.8rem; color: #666; margin-top: 4px;">${submittedDate}</div>` : ''}
                </td>
                
                <!-- Status Indicator (Right) -->
                <td style="padding: 14px 12px; text-align: center; width: 80px;">
                    <div style="display: inline-block; padding: 6px 12px; background: ${statusBg}; color: ${statusColor}; border-radius: 4px; font-weight: 700; font-size: 0.8rem; border: 2px solid ${statusColor};">
                        ${statusText}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Show dialog for marking submitted
 */
function showSubmitDialog(action, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px; text-align: center; animation: slideIn 0.3s ease-out;';
    
    const title = action === 'mark' ? 'Mark as Submitted?' : 'Unmark as Submitted?';
    const message = action === 'mark' ? 'Are you sure you want to mark this task as submitted?' : 'Are you sure you want to unmark this task as submitted?';
    const btnColor = action === 'mark' ? '#4ade80' : '#f43f5e';
    const btnHover = action === 'mark' ? '#22c55e' : '#ec4899';
    
    dialog.innerHTML = `
        <i class="fas ${action === 'mark' ? 'fa-check-circle' : 'fa-times-circle'}" style="font-size: 3rem; color: ${btnColor}; margin-bottom: 15px; display: block;"></i>
        <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 1.3rem;">${title}</h2>
        <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="this.closest('[data-dialog]').remove(); document.querySelector('[data-dialog-overlay]').remove();" style="padding: 12px 24px; background: #e0e0e0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.2s;" onmouseover="this.style.background='#d0d0d0'" onmouseout="this.style.background='#e0e0e0'">
                Cancel
            </button>
            <button onclick="(${callback})(); this.closest('[data-dialog]').remove(); document.querySelector('[data-dialog-overlay]').remove();" style="padding: 12px 24px; background: ${btnColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.2s;" onmouseover="this.style.background='${btnHover}'" onmouseout="this.style.background='${btnColor}'">
                Confirm
            </button>
        </div>
    `;
    
    dialog.setAttribute('data-dialog', 'true');
    overlay.setAttribute('data-dialog-overlay', 'true');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            dialog.remove();
        }
    });
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

/**
 * Toggle submitted status for a row
 */
export function toggleSubmitted(ownerKey, subject, key, rowIndex) {
    const scoresheets = getScoresheets();
    // Ensure owner structure exists
    if (!scoresheets[ownerKey]) scoresheets[ownerKey] = {};
    if (!scoresheets[ownerKey][subject]) scoresheets[ownerKey][subject] = {};

    // If the owner's row array doesn't exist, create per-student rows from template
    if (!scoresheets[ownerKey][subject][key]) {
        // Determine template owner (teacher or section)
        const teacherUsername = currentScoreSheetContext?.teacherUsername || getCurrentUser();
        let templateOwnerKey = teacherUsername;
        const displayUser = currentScoreSheetContext?.displayProfileUser;
        if (displayUser && userAccounts[displayUser] && userAccounts[displayUser].strand && userAccounts[displayUser].section) {
            const s = userAccounts[displayUser].strand;
            const sec = userAccounts[displayUser].section;
            templateOwnerKey = `SECTION_${s}_${sec}`;
        }

        const templateRows = (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) ? scoresheets[templateOwnerKey][subject][key] : [];

        // Build personal rows (no shared scores) for ownerKey
        scoresheets[ownerKey][subject][key] = templateRows.map(r => ({
            id: r.id,
            no: r.no,
            title: r.title,
            score: null,
            scoreLimit: r.scoreLimit,
            postedDate: r.postedDate,
            submitted: false,
            submittedDate: null,
            status: 'pending'
        }));
    }

    const row = scoresheets[ownerKey][subject][key][rowIndex];
    if (!row) return;

    // If the actor is not the same as ownerKey (e.g., teacher toggling section template), require a score
    const actor = getCurrentUser();
    if (!row.submitted && !row.score && actor !== ownerKey) {
        showSuccessToast('⚠️ Cannot mark submitted without a score.');
        // Revert checkbox state and re-render
        const checkbox = document.querySelector(`input[onclick*="toggleSubmitted('${ownerKey}', '${subject}', '${key}', ${rowIndex})"]`);
        if (checkbox) checkbox.checked = false;
        return;
    }

    const newSubmittedState = !row.submitted;

    if (newSubmittedState && row.submitted === false) {
        // Show dialog to mark as submitted
        showSubmitDialog('mark', function() {
            row.submitted = true;
            row.submittedDate = new Date().toISOString().split('T')[0];
            saveScoresheets();
            updateNotifications(ownerKey, subject);
            renderScoresheetTable(subject, key.split('_')[0], key.split('_')[1].replace('q', ''), currentScoreSheetContext.isTeacher);
            showSuccessToast('✓ Marked as submitted');
        });
    } else if (!newSubmittedState && row.submitted === true) {
        // Show dialog to unmark
        showSubmitDialog('unmark', function() {
            row.submitted = false;
            row.submittedDate = null;
            saveScoresheets();
            updateNotifications(ownerKey, subject);
            renderScoresheetTable(subject, key.split('_')[0], key.split('_')[1].replace('q', ''), currentScoreSheetContext.isTeacher);
            showSuccessToast('✓ Unmarked as submitted');
        });
    } else {
        // If no state change needed, just re-render to fix any visual inconsistencies
        renderScoresheetTable(subject, key.split('_')[0], key.split('_')[1].replace('q', ''), currentScoreSheetContext.isTeacher);
    }
}

/**
 * Update student score when input changes
 */
export function updateStudentScore(ownerKey, subject, key, rowIndex, newValue) {
    const scoresheets = getScoresheets();

    // Ensure owner structure exists
    if (!scoresheets[ownerKey]) scoresheets[ownerKey] = {};
    if (!scoresheets[ownerKey][subject]) scoresheets[ownerKey][subject] = {};

    // If the owner's row array doesn't exist, create per-student rows from template
    if (!scoresheets[ownerKey][subject][key]) {
        // Determine template owner (teacher or section)
        const teacherUsername = currentScoreSheetContext?.teacherUsername || getCurrentUser();
        let templateOwnerKey = teacherUsername;
        const displayUser = currentScoreSheetContext?.displayProfileUser;
        if (displayUser && userAccounts[displayUser] && userAccounts[displayUser].strand && userAccounts[displayUser].section) {
            const s = userAccounts[displayUser].strand;
            const sec = userAccounts[displayUser].section;
            templateOwnerKey = `SECTION_${s}_${sec}`;
        }

        const templateRows = (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) ? scoresheets[templateOwnerKey][subject][key] : [];

        // Build personal rows (no shared scores) for ownerKey
        scoresheets[ownerKey][subject][key] = templateRows.map(r => ({
            id: r.id,
            no: r.no,
            title: r.title,
            score: null,
            scoreLimit: r.scoreLimit,
            postedDate: r.postedDate,
            submitted: false,
            submittedDate: null,
            status: 'pending'
        }));
    }

    const row = scoresheets[ownerKey][subject][key][rowIndex];
    if (!row) return;

    // Parse and validate the score
    const score = parseInt(newValue);
    if (isNaN(score) || score < 0) {
        row.score = null;
    } else {
        // Ensure score doesn't exceed the limit
        row.score = Math.min(score, row.scoreLimit || 100);
    }

    // Save changes
    saveScoresheets();
    updateNotifications(ownerKey, subject);

    // Show success message
    showSuccessToast('✓ Score updated');
}

/**
 * Open grading view to enter per-student scores
 */
export function openGradeStudentsView() {
    const { subject, type, quarter, teacherUsername } = currentScoreSheetContext;
    const currentUser = getCurrentUser();
    const userInfo = userAccounts[currentUser];
    
    if (!userInfo || userInfo.role !== 'teacher') {
        showSuccessToast('⚠️ Only teachers can grade students');
        return;
    }

    // Check if teacher is assigned to this subject
    const assignedSubjects = userInfo.assignedSubjects || [];
    if (!assignedSubjects.includes(subject)) {
        showSuccessToast('⚠️ You are not assigned to teach this subject');
        return;
    }

    // Get students in the same section(s) as the teacher
    const clustersData = getClusters();
    const assignedStrandSections = userInfo.assignedStrandSections || {};
    
    let studentsInSections = [];
    
    // Iterate through clusters/strands/sections to find students
    for (const cluster in clustersData) {
        for (const strand in clustersData[cluster]) {
            if (strand === 'subjects') continue; // skip subjects array
            
            // Check if teacher is assigned to this strand
            if (!assignedStrandSections[strand]) continue;
            
            for (const section in clustersData[cluster][strand]) {
                if (section === 'subjects') continue; // skip subjects array
                
                // Check if teacher is assigned to this section in the strand
                if (!assignedStrandSections[strand].includes(section)) continue;
                
                const sectionStudents = clustersData[cluster][strand][section];
                if (Array.isArray(sectionStudents)) {
                    sectionStudents.forEach(student => {
                        // Find the username for this student
                        for (const username in userAccounts) {
                            const acc = userAccounts[username];
                            if (acc.role === 'student' && acc.studentId === student.id) {
                                // Only add student if they have this subject assigned
                                const studentSubjects = acc.subjects || [];
                                if (studentSubjects.includes(subject)) {
                                    studentsInSections.push({
                                        username: username,
                                        name: student.name || acc.name,
                                        section: section,
                                        strand: strand,
                                        cluster: cluster
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }
    }

    if (studentsInSections.length === 0) {
        showSuccessToast('⚠️ No students found in your assigned sections');
        return;
    }

    // Show student selector
    showStudentGraderModal(studentsInSections, subject, type, quarter);
}

/**
 * Show modal to select student and enter grades
 */
function showStudentGraderModal(students, subject, type, quarter) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 20px;';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;';
    
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();
    const templateOwnerKey = currentScoreSheetContext?.teacherUsername || getCurrentUser();
    const templateRows = (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) ? scoresheets[templateOwnerKey][subject][key] : [];

    let studentHTML = students.map(s => `
        <div onclick="gradeStudent('${s.username}', '${subject}', '${type}', '${quarter}')" style="padding: 15px; background: #f9f9f9; border-radius: 8px; cursor: pointer; margin-bottom: 10px; transition: all 0.2s; border: 2px solid transparent;" onmouseover="this.style.background='#e3f2fd'; this.style.borderColor='var(--au-blue)'" onmouseout="this.style.background='#f9f9f9'; this.style.borderColor='transparent'">
            <p style="margin: 0; font-weight: 600; color: #1a1a1a;">${s.name}</p>
            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #666;">${s.strand} - ${s.section}</p>
        </div>
    `).join('');

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #1a1a1a;">Grade Students - ${subject}</h2>
            <button onclick="this.closest('[data-grader-overlay]').remove();" style="background: none; border: none; font-size: 1.5rem; color: #666; cursor: pointer;">&times;</button>
        </div>
        <p style="color: #666; margin-bottom: 20px;">Select a student to enter grades:</p>
        <div style="max-height: 400px; overflow-y: auto;">
            ${studentHTML}
        </div>
    `;

    modal.setAttribute('data-grader-modal', 'true');
    overlay.setAttribute('data-grader-overlay', 'true');
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

/**
 * Grade a specific student
 */
window.gradeStudent = function(studentUsername, subject, type, quarter) {
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();
    const templateOwnerKey = currentScoreSheetContext?.teacherUsername || getCurrentUser();
    const templateRows = (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) ? scoresheets[templateOwnerKey][subject][key] : [];
    const studentDataRows = (scoresheets[studentUsername] && scoresheets[studentUsername][subject] && scoresheets[studentUsername][subject][key]) ? scoresheets[studentUsername][subject][key] : [];

    const overlay = document.querySelector('[data-grader-overlay]');
    if (overlay) overlay.remove();

    // Create grade form
    const gradeOverlay = document.createElement('div');
    gradeOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001; overflow-y: auto; padding: 20px;';
    
    const gradeModal = document.createElement('div');
    gradeModal.style.cssText = 'background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;';
    
    const studentName = userAccounts[studentUsername]?.name || studentUsername;
    const scoreInputs = templateRows.map((row, idx) => {
        const personal = studentDataRows[idx] || {};
        const currentScore = (typeof personal.score !== 'undefined' && personal.score !== null) ? personal.score : '';
        return `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
                <label style="display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">${row.title || '(Untitled)'}</label>
                <input type="number" id="score-${idx}" value="${currentScore}" min="0" max="${row.scoreLimit}" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; width: 150px; font-size: 0.95rem;" placeholder="Enter score...">
                <span style="margin-left: 10px; color: #666;">/ ${row.scoreLimit}</span>
            </div>
        `;
    }).join('');

    gradeModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h2 style="margin: 0; color: #1a1a1a;">${studentName}</h2>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">${subject}</p>
            </div>
            <button id="gradeModalCloseBtn" style="background: none; border: none; font-size: 1.5rem; color: #666; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 25px;">
            ${scoreInputs}
        </div>
        <div style="display: flex; gap: 12px;">
            <button id="gradeModalSaveBtn" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                <i class="fas fa-save"></i> Save Grades
            </button>
            <button id="gradeModalBackBtn" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                <i class="fas fa-arrow-left"></i> Back to Students
            </button>
        </div>
    `;

    gradeModal.setAttribute('data-grade-modal', 'true');
    gradeOverlay.setAttribute('data-grade-overlay', 'true');
    
    gradeOverlay.appendChild(gradeModal);
    document.body.appendChild(gradeOverlay);

    // Setup event listeners with error handling
    const saveBtn = gradeModal.querySelector('#gradeModalSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = function(e) {
            e.preventDefault();
            try {
                if (typeof window.saveStudentGrades === 'function') {
                    window.saveStudentGrades(studentUsername, subject, type, quarter);
                } else {
                    console.error('saveStudentGrades function not available');
                    gradeOverlay.remove();
                }
            } catch (err) {
                console.error('Error saving grades:', err);
                gradeOverlay.remove();
            }
        };
    }

    const closeBtn = gradeModal.querySelector('#gradeModalCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.preventDefault();
            gradeOverlay.remove();
        };
    }

    const backBtn = gradeModal.querySelector('#gradeModalBackBtn');
    if (backBtn) {
        backBtn.onclick = function(e) {
            e.preventDefault();
            try {
                gradeOverlay.remove();
                if (typeof openGradeStudentsView === 'function') {
                    openGradeStudentsView();
                } else if (typeof window.openGradeStudentsView === 'function') {
                    window.openGradeStudentsView();
                } else {
                    console.error('openGradeStudentsView function not available');
                }
            } catch (err) {
                console.error('Error navigating back:', err);
                gradeOverlay.remove();
            }
        };
    }
};

/**
 * Save student grades
 */
window.saveStudentGrades = function(studentUsername, subject, type, quarter) {
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();
    const templateOwnerKey = currentScoreSheetContext?.teacherUsername || getCurrentUser();
    const templateRows = (scoresheets[templateOwnerKey] && scoresheets[templateOwnerKey][subject] && scoresheets[templateOwnerKey][subject][key]) ? scoresheets[templateOwnerKey][subject][key] : [];

    // Build student data with scores from form
    const studentDataRows = templateRows.map((row, idx) => {
        const scoreInput = document.getElementById(`score-${idx}`);
        const score = scoreInput ? parseInt(scoreInput.value) : null;
        
        return {
            id: row.id,
            no: row.no,
            title: row.title,
            score: (score !== null && !isNaN(score)) ? score : null,
            scoreLimit: row.scoreLimit,
            postedDate: row.postedDate,
            submitted: false,
            submittedDate: null,
            status: 'pending'
        };
    });

    // Save under student username
    if (!scoresheets[studentUsername]) scoresheets[studentUsername] = {};
    if (!scoresheets[studentUsername][subject]) scoresheets[studentUsername][subject] = {};
    scoresheets[studentUsername][subject][key] = studentDataRows;
    saveScoresheets();

    showSuccessToast('✓ Grades saved for ' + userAccounts[studentUsername]?.name);
    document.querySelector('[data-grade-overlay]').remove();
    openGradeStudentsView();
};

/**
 * Open edit mode for scoresheet
 */
export function openScoreSheetEditMode() {
    if (!currentScoreSheetContext.isTeacher) {
        showSuccessToast('⚠️ Only teachers can edit scoresheets');
        return;
    }

    const { subject, type, quarter, teacherUsername, displayProfileUser } = currentScoreSheetContext;
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();

    // Determine owner key (section-level or teacher-level)
    let ownerKey = teacherUsername;
    if (displayProfileUser && userAccounts[displayProfileUser] && userAccounts[displayProfileUser].strand && userAccounts[displayProfileUser].section) {
        const s = userAccounts[displayProfileUser].strand;
        const sec = userAccounts[displayProfileUser].section;
        ownerKey = `SECTION_${s}_${sec}`;
    }

    let tableData = [];
    if (scoresheets[ownerKey] && scoresheets[ownerKey][subject] && scoresheets[ownerKey][subject][key]) {
        tableData = [...scoresheets[ownerKey][subject][key]];
    }

    // Get current score limit from first row or default to 10
    const currentScoreLimit = tableData.length > 0 ? tableData[0].scoreLimit : 10;

    currentScoreSheetContext.isEditMode = true;

    const html = `
        <div style="min-height: 100vh; background: #f5f5f5; padding: 20px;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <button onclick="exitEditMode()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <h1 style="margin: 0; font-size: 1.5rem; color: #1a1a1a;">Edit ${type}</h1>
                <button onclick="saveEditMode()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>

            <!-- Score Limit Setting -->
            <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333;">Score Limit for All Rows:</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="number" id="edit-score-limit" value="${currentScoreLimit}" min="1" max="500" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.95rem; width: 150px;">
                    <small style="color: #666;">e.g., 10 for 10/10, 50 for 50/50, 100 for 100/100</small>
                </div>
            </div>

            <!-- Editable Table -->
            <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow-x: auto;">
                <table id="edit-scoresheet-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--au-blue); color: white;">
                            <th style="padding: 12px; text-align: center; font-weight: 600; width: 40px;" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">No.</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; min-width: 250px;">Title</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">Score</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">Posted Date</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="edit-table-body">
                        <!-- Rows populated by JavaScript -->
                    </tbody>
                </table>
            </div>

            <!-- Add Row Button -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <button onclick="addNewEditRow()" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-plus"></i> Add New Row
                </button>
            </div>
        </div>
    `;

    appContainer.innerHTML = html;

    // Render current rows
    renderEditTable(tableData, currentScoreLimit);
}

/**
 * Render the edit table
 */
function renderEditTable(data, scoreLimit) {
    const tbody = document.getElementById('edit-table-body');
    if (!tbody) return;

    let html = '';
    data.forEach((row, index) => {
        const isFirst = index === 0;
        const isLast = index === data.length - 1;
        
        html += `
            <tr style="border-bottom: 1px solid #e0e0e0; background: white; transition: background 0.2s;" draggable="true" 
                ondragstart="handleDragStart(event, ${index})" ondragover="handleDragOver(event)" ondrop="handleDrop(event, ${index})" 
                ondragend="handleDragEnd(event)" onmouseenter="this.style.background='#f5f5f5'" onmouseleave="this.style.background='white'">
                
                <!-- Drag Handle -->
                <td style="padding: 12px; text-align: center; width: 40px; cursor: move; color: #999;" title="Drag to reorder">
                    <i class="fas fa-grip-vertical" style="cursor: move;"></i>
                </td>
                
                <!-- No. Column -->
                <td style="padding: 12px; text-align: center; font-weight: 600; width: 50px;" class="row-number">${index + 1}</td>
                
                <!-- Title Column -->
                <td style="padding: 12px;">
                    <input type="text" value="${row.title || ''}" class="edit-title-input" data-row-index="${index}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;" placeholder="Enter title...">
                </td>
                
                <!-- Score Column -->
                <td style="padding: 12px; text-align: center;">
                    <input type="number" value="${row.score || 0}" min="0" max="${scoreLimit || 100}" class="edit-score-input" data-row-index="${index}" style="width: 70px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;">
                </td>
                
                <!-- Posted Date -->
                <td style="padding: 12px; text-align: center; color: #666;">
                    ${formatDate(row.postedDate) || 'Not posted'}
                </td>
                
                <!-- Action Buttons -->
                <td style="padding: 12px; text-align: center; width: 160px;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <!-- Move Up Button -->
                        <button onclick="moveRowUp(${index})" ${isFirst ? 'disabled' : ''} style="padding: 6px 8px; background: ${isFirst ? '#d0d0d0' : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: ${isFirst ? 'not-allowed' : 'pointer'}; font-size: 0.85rem; opacity: ${isFirst ? '0.5' : '1'};" title="Move up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        
                        <!-- Move Down Button -->
                        <button onclick="moveRowDown(${index})" ${isLast ? 'disabled' : ''} style="padding: 6px 8px; background: ${isLast ? '#d0d0d0' : '#28a745'}; color: white; border: none; border-radius: 4px; cursor: ${isLast ? 'not-allowed' : 'pointer'}; font-size: 0.85rem; opacity: ${isLast ? '0.5' : '1'};" title="Move down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        
                        <!-- Delete Button -->
                        <button onclick="deleteEditRow(${index})" style="padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;" title="Delete row">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Global variable to track dragging
let draggedRowIndex = null;

/**
 * Move row up in the edit table
 */
export function moveRowUp(index) {
    if (index <= 0) return;
    
    const tbody = document.getElementById('edit-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (rows[index] && rows[index - 1]) {
        // Swap rows
        tbody.insertBefore(rows[index], rows[index - 1]);
        // Re-render to update numbering and button states
        updateRowNumbers();
        showSuccessToast(`✓ Row moved up`);
    }
}

/**
 * Move row down in the edit table
 */
export function moveRowDown(index) {
    const tbody = document.getElementById('edit-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (rows[index] && rows[index + 1]) {
        // Swap rows
        tbody.insertBefore(rows[index + 1], rows[index]);
        // Re-render to update numbering and button states
        updateRowNumbers();
        showSuccessToast(`✓ Row moved down`);
    }
}

/**
 * Update row numbers after reordering
 */
function updateRowNumbers() {
    const tbody = document.getElementById('edit-table-body');
    const rows = tbody.querySelectorAll('tr');
    const totalRows = rows.length;
    
    rows.forEach((row, index) => {
        // Update row number
        const numberCell = row.querySelector('.row-number');
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
        
        // Update up/down button states
        const buttons = row.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.title === 'Move up') {
                btn.disabled = index === 0;
                btn.style.background = index === 0 ? '#d0d0d0' : '#007bff';
                btn.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
                btn.style.opacity = index === 0 ? '0.5' : '1';
            } else if (btn.title === 'Move down') {
                btn.disabled = index === totalRows - 1;
                btn.style.background = index === totalRows - 1 ? '#d0d0d0' : '#28a745';
                btn.style.cursor = index === totalRows - 1 ? 'not-allowed' : 'pointer';
                btn.style.opacity = index === totalRows - 1 ? '0.5' : '1';
            }
        });
    });
}

/**
 * Handle drag start
 */
export function handleDragStart(event, index) {
    draggedRowIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    const row = event.target.closest('tr');
    if (row) {
        row.style.opacity = '0.5';
    }
}

/**
 * Handle drag over
 */
export function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const row = event.target.closest('tr');
    if (row) {
        row.style.borderTop = '3px solid #007bff';
    }
}

/**
 * Handle drop
 */
export function handleDrop(event, dropIndex) {
    event.preventDefault();
    event.stopPropagation();
    
    if (draggedRowIndex === null || draggedRowIndex === dropIndex) return;
    
    const tbody = document.getElementById('edit-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (draggedRowIndex < dropIndex) {
        // Moving down
        rows[dropIndex].parentNode.insertBefore(rows[draggedRowIndex], rows[dropIndex].nextSibling);
    } else {
        // Moving up
        rows[dropIndex].parentNode.insertBefore(rows[draggedRowIndex], rows[dropIndex]);
    }
    
    // Clear visual feedback
    rows.forEach(r => {
        r.style.opacity = '1';
        r.style.borderTop = 'none';
    });
    
    // Update numbering
    updateRowNumbers();
    draggedRowIndex = null;
}

/**
 * Handle drag end
 */
export function handleDragEnd(event) {
    const row = event.target.closest('tr');
    if (row) {
        row.style.opacity = '1';
        row.style.borderTop = 'none';
    }
    draggedRowIndex = null;
}

/**
 * Add new row to edit table
 */
export function addNewEditRow() {
    const tbody = document.getElementById('edit-table-body');
    const currentCount = tbody.querySelectorAll('tr').length;
    const scoreLimit = parseInt(document.getElementById('edit-score-limit').value) || 10;

    const newRow = `
        <tr style="border-bottom: 1px solid #e0e0e0; background: #f0f7ff; transition: background 0.2s;" draggable="true" 
            ondragstart="handleDragStart(event, ${currentCount})" ondragover="handleDragOver(event)" ondrop="handleDrop(event, ${currentCount})" 
            ondragend="handleDragEnd(event)" onmouseenter="this.style.background='#e0f0ff'" onmouseleave="this.style.background='#f0f7ff'">
            
            <!-- Drag Handle -->
            <td style="padding: 12px; text-align: center; width: 40px; cursor: move; color: #999;" title="Drag to reorder">
                <i class="fas fa-grip-vertical" style="cursor: move;"></i>
            </td>
            
            <!-- No. Column -->
            <td style="padding: 12px; text-align: center; font-weight: 600;" class="row-number">${currentCount + 1}</td>
            
            <!-- Title Column -->
            <td style="padding: 12px;">
                <input type="text" value="" class="edit-title-input" data-row-index="new_${currentCount}" style="width: 100%; padding: 8px; border: 1px solid #28a745; border-radius: 4px; font-size: 0.9rem;" placeholder="Enter title...">
            </td>
            
            <!-- Score Column -->
            <td style="padding: 12px; text-align: center;">
                <input type="number" value="0" min="0" max="${scoreLimit}" class="edit-score-input" data-row-index="new_${currentCount}" style="width: 70px; padding: 8px; border: 1px solid #28a745; border-radius: 4px; text-align: center; font-size: 0.9rem;">
            </td>
            
            <!-- Posted Date -->
            <td style="padding: 12px; text-align: center; color: #999;">
                Today
            </td>
            
            <!-- Action Buttons -->
            <td style="padding: 12px; text-align: center; width: 160px;">
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <!-- Move Up Button -->
                    <button onclick="moveRowUp(${currentCount})" ${currentCount === 0 ? 'disabled' : ''} style="padding: 6px 8px; background: ${currentCount === 0 ? '#d0d0d0' : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: ${currentCount === 0 ? 'not-allowed' : 'pointer'}; font-size: 0.85rem; opacity: ${currentCount === 0 ? '0.5' : '1'};" title="Move up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    
                    <!-- Move Down Button -->
                    <button onclick="moveRowDown(${currentCount})" disabled style="padding: 6px 8px; background: #d0d0d0; color: white; border: none; border-radius: 4px; cursor: not-allowed; font-size: 0.85rem; opacity: 0.5;" title="Move down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    
                    <!-- Delete Button -->
                    <button onclick="deleteEditRow(${currentCount})" style="padding: 6px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;" title="Delete row">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `;

    tbody.insertAdjacentHTML('beforeend', newRow);
}

/**
 * Delete row from edit table
 */
export function deleteEditRow(index) {
    const doDelete = () => {
        const rows = document.querySelectorAll('#edit-table-body tr');
        if (rows[index]) {
            rows[index].remove();
            updateRowNumbers();
            showSuccessToast('✓ Row deleted');
        }
    };

    if (window.showDeleteConfirmation) {
        window.showDeleteConfirmation('this row', doDelete);
    } else {
        if (confirm('Delete this row? This action cannot be undone.')) doDelete();
    }
}

/**
 * Exit edit mode without saving
 */
export function exitEditMode() {
    if (confirm('Exit without saving changes?')) {
        const { subject, type, quarter } = currentScoreSheetContext;
        currentScoreSheetContext.isEditMode = false;
        openScoresheet(subject, type, quarter);
    }
}

/**
 * Save edit mode changes
 */
export function saveEditMode() {
    const { subject, type, quarter, teacherUsername, displayProfileUser } = currentScoreSheetContext;
    const key = generateScoreSheetKey(type, quarter);
    const scoresheets = getScoresheets();
    const scoreLimit = parseInt(document.getElementById('edit-score-limit').value) || 10;

    // Collect all row data
    let newTableData = [];
    const rows = document.querySelectorAll('#edit-table-body tr');

    rows.forEach((row, index) => {
        const titleInput = row.querySelector('.edit-title-input');
        const scoreInput = row.querySelector('.edit-score-input');

        if (titleInput && scoreInput) {
            const title = titleInput.value.trim();
            const score = parseInt(scoreInput.value) || 0;

            // Determine owner key and get existing data
            let ownerKey = teacherUsername;
            if (displayProfileUser && userAccounts[displayProfileUser] && userAccounts[displayProfileUser].strand && userAccounts[displayProfileUser].section) {
                const s = userAccounts[displayProfileUser].strand;
                const sec = userAccounts[displayProfileUser].section;
                ownerKey = `SECTION_${s}_${sec}`;
            }
            const existingRows = scoresheets[ownerKey]?.[subject]?.[key] || [];
            const existingRow = existingRows[index];

            newTableData.push({
                id: existingRow?.id || `${Date.now()}_${index}`,
                no: index + 1,
                title: title || '(Untitled)',
                scoreLimit: scoreLimit,
                postedDate: existingRow?.postedDate || new Date().toISOString().split('T')[0]
            });
        }
    });

    // Save to storage
    // Save under ownerKey (section-level or teacher-level)
    let ownerKey = teacherUsername;
    if (displayProfileUser && userAccounts[displayProfileUser] && userAccounts[displayProfileUser].strand && userAccounts[displayProfileUser].section) {
        const s = userAccounts[displayProfileUser].strand;
        const sec = userAccounts[displayProfileUser].section;
        ownerKey = `SECTION_${s}_${sec}`;
    }

    if (!scoresheets[ownerKey]) {
        scoresheets[ownerKey] = {};
    }
    if (!scoresheets[ownerKey][subject]) {
        scoresheets[ownerKey][subject] = {};
    }

    scoresheets[ownerKey][subject][key] = newTableData;
    saveScoresheets();

    currentScoreSheetContext.isEditMode = false;
    showSuccessToast('✓ Changes saved successfully!');
    openScoresheet(subject, type, quarter);
}

/**
 * Generate unique key for scoresheet
 */
function generateScoreSheetKey(type, quarter) {
    const typeKey = type.toLowerCase().replace(/\s+/g, '');
    return `${typeKey}_${quarter.toLowerCase()}q`;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch {
        return dateString;
    }
}

/**
 * Update notifications when task is marked
 */
function updateNotifications(ownerKey, subject) {
    const notifications = getNotifications();
    const scoresheets = getScoresheets();

    // Recalculate pending count for this subject
    // Only count tasks that are NOT submitted AND do NOT have a score
    let pendingCount = 0;
    const ownerSheets = scoresheets[ownerKey];
    if (ownerSheets && ownerSheets[subject]) {
        Object.values(ownerSheets[subject]).forEach(typeData => {
            if (Array.isArray(typeData)) {
                typeData.forEach(row => {
                    if (!row.submitted && !row.score) pendingCount++;
                });
            }
        });
    }

    if (!notifications[ownerKey]) {
        notifications[ownerKey] = {};
    }

    if (pendingCount === 0) {
        delete notifications[ownerKey][subject];
    } else {
        notifications[ownerKey][subject] = {
            pendingCount,
            lastUpdated: new Date().toISOString()
        };
    }

    saveNotifications();
}

export default { openScoresheet };
