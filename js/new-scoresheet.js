/**
 * NEW SCORESHEET SYSTEM
 * 6-Category Design with Posted Date, Submitted Checkbox, and Notification System
 * 
 * Categories: Concept Notes (10), Activities (100), Quizzes (100), 
 *            Prelim (50), PETA (100), Dept Exam (50)
 */

import { getSubjectGrades, saveGrades, userAccounts } from './storage.js';
import { getCurrentUser, getCurrentStudentId, goBack, pushNavigation } from './global.js';
import { getStudentData } from './utils.js';
import { showSuccessToast } from './students.js';

// Category definitions
const SCORESHEET_CATEGORIES = [
    { id: 'concept-notes', name: 'Concept Notes', icon: 'fa-book', maxScore: 10, parent: 'written-works' },
    { id: 'activities', name: 'Activities', icon: 'fa-tasks', maxScore: 100, parent: 'written-works' },
    { id: 'quizzes', name: 'Quizzes', icon: 'fa-question-circle', maxScore: 100, parent: 'written-works' },
    { id: 'performance-tasks', name: 'Performance Tasks', icon: 'fa-star', maxScore: 100, parent: 'performance-tasks' },
    { id: 'prelim', name: 'Preliminary Exam', icon: 'fa-file-alt', maxScore: 50, parent: 'examination' },
    { id: 'dept-exam', name: 'Departmental Exam', icon: 'fa-chart-bar', maxScore: 50, parent: 'examination' }
];

// Map parent categories to their children
const PARENT_CATEGORY_MAP = {
    'written-works': ['concept-notes', 'activities', 'quizzes'],
    'performance-tasks': ['performance-tasks'],
    'examination': ['prelim', 'dept-exam']
};

// Current viewing state
let currentNewScoresheet = {
    studentId: null,
    subjectName: null,
    quarter: '1st',
    category: 'concept-notes',
    editMode: false
};

/**
 * Initialize new scoresheet data structure for a student
 */
function initNewScoresheetStructure(studentId, subjectName) {
    const grades = getSubjectGrades();
    
    if (!grades[studentId]) {
        grades[studentId] = {};
    }
    
    if (!grades[studentId][subjectName]) {
        grades[studentId][subjectName] = {};
    }
    
    // Initialize all quarters and categories
    ['1st', '2nd', '3rd', '4th'].forEach(quarter => {
        if (!grades[studentId][subjectName][quarter]) {
            grades[studentId][subjectName][quarter] = {};
        }
        
        SCORESHEET_CATEGORIES.forEach(cat => {
            if (!grades[studentId][subjectName][quarter][cat.id]) {
                grades[studentId][subjectName][quarter][cat.id] = [];
            }
        });
    });
    
    saveGrades();
}

/**
 * Render the new scoresheet
 */
function renderNewScoresheet(subjectName, quarter = '1st', category = 'concept-notes') {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    const appContainer = document.getElementById('app-container');
    
    // Track in navigation history when called from scoresheet navigation (not already tracked)
    // Only track if we're not already in a scoresheet view
    if (currentNewScoresheet.subjectName !== subjectName) {
        pushNavigation('Scoresheet: ' + subjectName, () => window.renderNewScoresheet(subjectName, quarter, category));
    }
    
    // Set header title
    const titleEl = document.querySelector('.view-title');
    if (titleEl) titleEl.textContent = `${subjectName} Scoresheet`;
    
    // Initialize structure
    initNewScoresheetStructure(currentStudentId, subjectName);
    
    // Store current state
    currentNewScoresheet = {
        studentId: currentStudentId,
        subjectName: subjectName,
        quarter: quarter,
        category: category,
        editMode: false
    };
    
    // Render from template
    const template = document.getElementById('new-scoresheet-view');
    const clone = template ? template.content.cloneNode(true) : null;
    appContainer.innerHTML = '';
    if (clone) {
        appContainer.appendChild(clone);
    } else {
        // Fallback if template not present: simple wrapper
        appContainer.innerHTML = `<div id="new-scoresheet-root"></div>`;
    }
    
    // Get student and set header
    const student = getStudentData(currentStudentId);
    if (student) {
        document.getElementById('currentStudentName').textContent = student.name || 'Student';
        document.getElementById('currentStudentPic').src = student.profilePic || 'images/default.svg';
    }
    
    document.getElementById('currentSubjectName').textContent = subjectName;
    
    // Set category dropdown button access
    const role = userAccounts[currentUser].role;
    const isTeacher = role === 'teacher';
    document.getElementById('addRowBtn').style.display = isTeacher ? 'flex' : 'none';
    document.getElementById('actionsHeader').style.display = isTeacher ? 'table-cell' : 'none';
    
    // Render the current category table
    renderCategoryTable(subjectName, quarter, category);
    
    // Bind global functions
    window.switchCategory = switchCategory;
    window.switchQuarter = switchQuarter;
    window.toggleEditMode = toggleEditMode;
    window.addNewRow = addNewRow;
    window.deleteRow = deleteRow;
    window.toggleSubmitted = toggleSubmitted;
}

// Expose renderNewScoresheet to window
window.renderNewScoresheet = renderNewScoresheet;

/**
 * Render a single category table
 */
function renderCategoryTable(subjectName, quarter, categoryId) {
    const currentStudentId = getCurrentStudentId();
    const currentUser = getCurrentUser();

    // Get category definition
    const categoryDef = SCORESHEET_CATEGORIES.find(c => c.id === categoryId);
    if (!categoryDef) return;

    const items = getSubjectGrades()[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId] || [];

    // Update header
    const titleEl = document.getElementById('tableCategoryTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fas ${categoryDef.icon}"></i> ${categoryDef.name}`;
    const infoEl = document.getElementById('tableCategoryInfo');
    if (infoEl) infoEl.textContent = `Max Score: ${categoryDef.maxScore} points`;

    const tbody = document.getElementById('scoresheetTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (items.length === 0) {
        const empty = document.getElementById('emptyState');
        if (empty) empty.style.display = 'block';
        return;
    } else {
        const empty = document.getElementById('emptyState');
        if (empty) empty.style.display = 'none';
    }

    items.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.className = 'ns-row';

        const isSubmitted = !!item.submitted;
        const indicatorClass = isSubmitted ? 'ns-badge completed' : 'ns-badge pending';
        const indicatorLabel = isSubmitted ? '✓ Completed' : '○ Pending';
        const itemNum = idx + 1;

        row.innerHTML = `
            <td class="ns-col-no">#${itemNum}</td>
            <td class="ns-col-title">
                ${currentNewScoresheet.editMode ? `<input type="text" value="${item.title || ''}" onchange="updateRowField('${subjectName}', '${quarter}', '${categoryId}', ${idx}, 'title', this.value)" class="ns-input">` : `<span>${item.title || '(No title)'}</span>`}
            </td>
            <td class="ns-col-score">
                ${currentNewScoresheet.editMode ? `<input type="number" value="${item.score || 0}" min="0" max="${categoryDef.maxScore}" onchange="updateRowField('${subjectName}', '${quarter}', '${categoryId}', ${idx}, 'score', this.value, ${categoryDef.maxScore})" class="ns-number"> <span style="color:#999;">/ ${categoryDef.maxScore}</span>` : `<span>${item.score || 0} / ${categoryDef.maxScore}</span>`}
            </td>
            <td class="ns-col-date"><span>${formatDate(item.postedDate) || 'N/A'}</span></td>
            <td class="ns-col-deadline">
                ${currentNewScoresheet.editMode ? `<input type="date" value="${item.deadline || ''}" onchange="updateRowField('${subjectName}', '${quarter}', '${categoryId}', ${idx}, 'deadline', this.value)" class="ns-input">` : `<span>${formatDate(item.deadline) || 'N/A'}</span>`}
            </td>
            <td class="ns-col-status">
                ${userAccounts[getCurrentUser()].role === 'teacher' && currentNewScoresheet.editMode ? `<input type="checkbox" ${isSubmitted ? 'checked' : ''} onchange="toggleSubmitted('${subjectName}', '${quarter}', '${categoryId}', ${idx})">` : `<input type="checkbox" ${isSubmitted ? 'checked' : ''} disabled>`}
                ${isSubmitted ? `<div style="font-size:0.75rem; color:#666; margin-top:4px;">${formatDate(item.submittedDate)}</div>` : ''}
            </td>
            <td class="ns-col-status"><div class="${indicatorClass}">${indicatorLabel}</div></td>
            <td class="ns-actions-col" style="display: ${userAccounts[getCurrentUser()].role === 'teacher' ? 'table-cell' : 'none'};">
                ${currentNewScoresheet.editMode ? `<button onclick="deleteRow('${subjectName}', '${quarter}', '${categoryId}', ${idx})" style="padding:4px 8px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>` : '-'}
            </td>
        `;

        tbody.appendChild(row);
    });

    updateNavigationLabels();
}

/**
 * Switch to a different category
 */
window.switchCategory = function(categoryId) {
    // If it's a parent category, switch to the first child
    if (PARENT_CATEGORY_MAP[categoryId]) {
        categoryId = PARENT_CATEGORY_MAP[categoryId][0];
    }
    
    const categoryDef = SCORESHEET_CATEGORIES.find(c => c.id === categoryId);
    if (!categoryDef) return;
    
    // Explicitly set the category
    currentNewScoresheet.category = categoryId;
    currentNewScoresheet.editMode = false; // Exit edit mode when switching
    
    // Render the table with the new category
    renderCategoryTable(
        currentNewScoresheet.subjectName,
        currentNewScoresheet.quarter,
        categoryId
    );
    
    // Extra safety: ensure category is still set after render
    currentNewScoresheet.category = categoryId;
};

/**
 * Switch to a different quarter
 */
window.switchQuarter = function(quarter) {
    currentNewScoresheet.quarter = quarter;
    currentNewScoresheet.editMode = false; // Exit edit mode when switching
    
    renderCategoryTable(
        currentNewScoresheet.subjectName,
        quarter,
        currentNewScoresheet.category
    );
};

/**
 * Toggle edit mode
 */
window.toggleEditMode = function() {
    const currentUser = getCurrentUser();
    if (userAccounts[currentUser].role !== 'teacher') return;
    
    currentNewScoresheet.editMode = !currentNewScoresheet.editMode;
    
    document.getElementById('editBtnLabel').textContent = currentNewScoresheet.editMode ? 'Done' : 'Edit';
    document.getElementById('addRowBtn').style.display = currentNewScoresheet.editMode ? 'flex' : 'none';
    
    renderCategoryTable(
        currentNewScoresheet.subjectName,
        currentNewScoresheet.quarter,
        currentNewScoresheet.category
    );
};

/**
 * Add a new row to the current category
 */
window.addNewRow = function() {
    const grades = getSubjectGrades();
    const { studentId, subjectName, quarter, category } = currentNewScoresheet;
    
    // Ensure category is preserved
    const preservedCategory = category;
    
    const newItem = {
        title: '',
        score: 0,
        postedDate: new Date().toISOString().split('T')[0], // Auto-fill with today's date
        deadline: '',
        submitted: false,
        submittedDate: null
    };
    
    grades[studentId][subjectName][quarter][preservedCategory].push(newItem);
    saveGrades();
    
    // Make sure category is still the same before rendering
    currentNewScoresheet.category = preservedCategory;
    
    renderCategoryTable(subjectName, quarter, preservedCategory);
    showSuccessToast('✓ New row added!');
};

/**
 * Update a field in a row
 */
window.updateRowField = function(subjectName, quarter, categoryId, rowIdx, field, value, maxScore) {
    const { studentId } = currentNewScoresheet;
    const grades = getSubjectGrades();
    const item = grades[studentId][subjectName][quarter][categoryId][rowIdx];
    
    if (!item) {
        console.error('Item not found');
        return;
    }
    
    // Special handling for different fields
    if (field === 'title') {
        item.title = value;
        // Auto-fill posted date if it's not already set
        if (!item.postedDate) {
            item.postedDate = new Date().toISOString().split('T')[0];
        }
    } else if (field === 'score') {
        // Clamp score to valid range
        item.score = Math.max(0, Math.min(maxScore || 10, parseInt(value) || 0));
    } else if (field === 'deadline') {
        item.deadline = value;
    }
    
    saveGrades();
    renderCategoryTable(subjectName, quarter, categoryId);
};

/**
 * Delete a row
 */
window.deleteRow = function(subjectName, quarter, categoryId, rowIdx) {
    const doDelete = function() {
        const { studentId } = currentNewScoresheet;
        const grades = getSubjectGrades();

        grades[studentId][subjectName][quarter][categoryId].splice(rowIdx, 1);
        saveGrades();

        renderCategoryTable(subjectName, quarter, categoryId);
        showSuccessToast('✓ Row deleted!');
    };

    if (window.showDeleteConfirmation) {
        window.showDeleteConfirmation('this row', doDelete);
    } else {
        if (!confirm('Are you sure you want to delete this row?')) return;
        doDelete();
    }
};

/**
 * Toggle submitted checkbox
 */
window.toggleSubmitted = function(subjectName, quarter, categoryId, rowIdx) {
    const { studentId } = currentNewScoresheet;
    const grades = getSubjectGrades();
    const item = grades[studentId][subjectName][quarter][categoryId][rowIdx];
    
    if (!item) return;
    
    if (item.submitted) {
        // If already submitted, show dialog to unmark
        showUnmarkDialog(() => {
            item.submitted = false;
            item.submittedDate = null;
            saveGrades();
            renderCategoryTable(subjectName, quarter, categoryId);
            updateNotificationBadges(studentId);
            showSuccessToast('✓ Unmarked!');
        });
    } else {
        // Mark as submitted
        item.submitted = true;
        item.submittedDate = new Date().toISOString().split('T')[0];
        saveGrades();
        renderCategoryTable(subjectName, quarter, categoryId);
        updateNotificationBadges(studentId);
        showSuccessToast('✓ Marked as submitted!');
    }
};

/**
 * Show unmark confirmation dialog
 */
function showUnmarkDialog(callback) {
    showWarningDialog('Are you sure you want to unmark this submission? This will revert it back to pending.');
    window.pendingUnmarkCallback = callback;
}

/**
 * Update navigation labels
 */
function updateNavigationLabels() {
    const categoryDef = SCORESHEET_CATEGORIES.find(c => c.id === currentNewScoresheet.category);
    const quarter = currentNewScoresheet.quarter;
    
    if (categoryDef) {
        // Update category label text
        const labelEl = document.getElementById('categoryLabel');
        if (labelEl) {
            labelEl.textContent = categoryDef.name;
        }
        
        // Update the icon in the category button
        const categoryIcon = document.querySelector('#categoryBtn i.fas');
        if (categoryIcon) {
            categoryIcon.className = `fas ${categoryDef.icon}`;
        }
    }
    
    // Update quarter label
    const quarterLabelEl = document.getElementById('quarterLabel');
    if (quarterLabelEl) {
        quarterLabelEl.textContent = `${quarter.toUpperCase()} QUARTER`;
    }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Update notification badges (pending count)
 */
function updateNotificationBadges(studentId) {
    // This will be called when teacher marks a task as submitted
    // It will update the notification system to decrease pending count
    // Implementation will be in the notification system
}

/**
 * Get pending tasks for a student
 */
function getPendingTasks(studentId) {
    const grades = getSubjectGrades();
    const student = getStudentData(studentId);
    const pendingTasks = {};
    
    if (!student || !student.subjects) return pendingTasks;
    
    // For each subject the student is enrolled in
    student.subjects.forEach(subjectName => {
        const subjectData = grades[studentId]?.[subjectName];
        if (!subjectData) return;
        
        let pendingCount = 0;
        
        // Count pending tasks across all quarters and categories
        // Only count tasks that are NOT submitted AND do NOT have a score
        ['1st', '2nd', '3rd', '4th'].forEach(quarter => {
            SCORESHEET_CATEGORIES.forEach(category => {
                const items = subjectData[quarter]?.[category.id] || [];
                items.forEach(item => {
                    if (!item.submitted && !item.score) {
                        pendingCount++;
                    }
                });
            });
        });
        
        if (pendingCount > 0) {
            pendingTasks[subjectName] = pendingCount;
        }
    });
    
    return pendingTasks;
}

/**
 * Render pending tasks list for a subject
 */
window.renderPendingTasksList = function(subjectName) {
    const currentStudentId = getCurrentStudentId();
    const grades = getSubjectGrades();
    const appContainer = document.getElementById('app-container');

    // Set header title
    const titleEl = document.querySelector('.view-title');
    if (titleEl) titleEl.textContent = `${subjectName} - Pending Works`;

    // Get all pending tasks from all quarters and categories
    const pendingTasksList = [];
    // expose list so click handlers can reference individual tasks
    window._lastPendingTasks = pendingTasksList;

    ['1st', '2nd', '3rd', '4th'].forEach(quarter => {
        SCORESHEET_CATEGORIES.forEach(category => {
            const items = grades[currentStudentId]?.[subjectName]?.[quarter]?.[category.id] || [];
            items.forEach((item, idx) => {
                if (!item.submitted && !item.score) {
                    pendingTasksList.push({
                        quarter,
                        category: category.name,
                        categoryId: category.id,
                        index: idx,
                        title: item.title || '(No title)',
                        postedDate: item.postedDate,
                        deadline: item.deadline
                    });
                }
            });
        });
    });

    // Render the list view (compact grid, no separate View button)
    appContainer.innerHTML = `
        <div style="padding: 18px;">
            <div style="margin-bottom: 18px; display:flex; gap:10px; align-items:center;">
                <button type="button" onclick="goBack()" class="nav-pill"><i class="fas fa-arrow-left"></i> Back</button>
            </div>
            <div style="margin-bottom: 18px;">
                <h2 style="color: var(--au-blue); margin: 0 0 8px 0;">📋 Pending Works</h2>
                <p style="color: #666; margin: 0; font-size: 0.95rem;">${subjectName}</p>
            </div>

            ${pendingTasksList.length === 0 ? `
                <div style="text-align: center; padding: 48px 20px; color: #999;">
                    <i class="fas fa-check-circle" style="font-size: 2.6rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 1rem; margin: 0;">All tasks are complete! No pending works.</p>
                </div>
            ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
                    ${pendingTasksList.map((task, taskIdx) => `
                        <div onclick="showPendingReminderDetails(${taskIdx})" 
                             style="background: white; border: 1px solid #e9eef8; border-radius: 10px; padding: 12px; display: flex; gap: 12px; align-items: flex-start; cursor: pointer; transition: box-shadow 0.18s;" 
                             onmouseover="this.style.boxShadow='0 8px 24px rgba(0, 51, 170, 0.08)'; this.style.borderColor='var(--au-blue)'" 
                             onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e9eef8'">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--au-blue); color: #fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem;">
                                #${taskIdx + 1}
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:700; color: var(--au-blue); margin-bottom:6px;">${task.title}</div>
                                <div style="font-size:0.88rem; color:#444; line-height:1.4;">
                                    <div><strong>📂 Category:</strong> ${task.category}</div>
                                    <div><strong>📅 Posted:</strong> ${formatDate(task.postedDate) || 'No date'}</div>
                                    <div style="color: ${task.deadline ? '#d32f2f' : '#777'};"><strong>⏰ Deadline:</strong> ${formatDate(task.deadline) || 'No deadline'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
};

// display details for a reminder card in pending list
window.showPendingReminderDetails = function(taskIdx) {
    const list = window._lastPendingTasks || [];
    const task = list[taskIdx];
    if (!task) return;

    const detailsHtml = `
        <div style="text-align:left; line-height:1.5;">
            <div><strong>Title:</strong> ${task.title}</div>
            <div><strong>Category:</strong> ${task.category}</div>
            <div><strong>Quarter:</strong> ${task.quarter}</div>
            <div><strong>Posted:</strong> ${formatDate(task.postedDate) || 'No date'}</div>
            <div><strong>Deadline:</strong> ${formatDate(task.deadline) || 'No deadline'}</div>
        </div>
    `;

    const overlay = document.getElementById('confirm-modal-overlay');
    const modalTitle = document.querySelector('.confirm-modal-box h3');
    const messageEl = document.getElementById('confirm-modal-message');
    const buttons = document.querySelector('.confirm-modal-buttons');

    if (overlay && modalTitle && messageEl && buttons) {
        modalTitle.textContent = 'Reminder Details';
        messageEl.innerHTML = detailsHtml;
        buttons.innerHTML = '<button class="btn-cancel" onclick="closeWarningDialog()">OK</button>';
        overlay.classList.add('active');
    } else {
        alert(`Title: ${task.title}\nCategory: ${task.category}\nQuarter: ${task.quarter}\nPosted: ${formatDate(task.postedDate) || 'No date'}\nDeadline: ${formatDate(task.deadline) || 'No deadline'}`);
    }
};

/**
 * Show pending tasks notification
 */
function showPendingNotification(studentId) {
    const pendingTasks = getPendingTasks(studentId);
    
    if (Object.keys(pendingTasks).length === 0) {
        return; // No pending tasks
    }
    
    let message = '<strong>You have pending tasks:</strong><br>';
    Object.entries(pendingTasks).forEach(([subject, count]) => {
        message += `• ${subject}: ${count} pending<br>`;
    });
    
    // Use the existing dialog system
    const overlay = document.getElementById('confirm-modal-overlay');
    const messageEl = document.getElementById('confirm-modal-message');
    
    if (overlay && messageEl) {
        messageEl.innerHTML = message;
        overlay.classList.add('active');
    } else {
        alert('Pending Tasks:\n' + Object.entries(pendingTasks).map(([s, c]) => `${s}: ${c} pending`).join('\n'));
    }
}

/**
 * Play notification sound one time only
 */
function playNotificationSound() {
    // Check if sound has already been played in this session
    const soundPlayKey = 'pendingTasksNotificationSoundPlayed';
    if (sessionStorage.getItem(soundPlayKey)) {
        return; // Sound already played in this session
    }
    
    try {
        // Mark sound as played
        sessionStorage.setItem(soundPlayKey, 'true');
        
        // Try to use Web Notification API first
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pending Tasks', {
                body: 'You have pending tasks to complete',
                icon: 'images/aulogo.png',
                tag: 'pending-tasks-notification',
                requireInteraction: false
            });
        }
        
        // Play audio beep using Web Audio API
        playAudioBeep();
    } catch (e) {
        console.log('Notification sound playback encountered an error (may be disabled)');
    }
}

/**
 * Create and play a notification beep sound using Web Audio API
 */
function playAudioBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // A softer, more 'reminding' chime using gentle bell tones
        // We'll use longer duration and a slower fade-out
        const now = audioContext.currentTime;
        const duration = 0.3; // slightly longer so it's easier to perceive
        
        // Frequencies chosen to sound like a soft bell: A4, C5, E5
        const frequencies = [440.0, 523.25, 659.25];
        
        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            // Stagger the notes slightly for a cascade effect
            const startTime = now + (index * 0.1);
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.linearRampToValueAtTime(0.0, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    } catch (e) {
        console.log('Web Audio API not available, notification sound skipped');
    }
}

/**
 * Request notification permission from user
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

/**
 * Show pending tasks notification pop-up on login
 */
window.showPendingNotificationPopup = function(studentId) {
    const pendingTasks = getPendingTasks(studentId);
    
    // Calculate total pending tasks across all subjects
    const totalPending = Object.values(pendingTasks).reduce((sum, count) => sum + count, 0);
    
    if (totalPending === 0) {
        return; // No pending tasks
    }
    
    // Create popup from template
    const template = document.getElementById('notification-popup');
    if (!template) return;
    
    const clone = template.content.cloneNode(true);
    const contentDiv = clone.querySelector('#notificationPopupContent');
    
    // Build simple notification content showing only total count
    let html = `
        <div style="text-align: center; padding: 20px 0;">
            <p style="font-size: 1.4rem; font-weight: 700; color: var(--au-blue); margin: 0;">
                ${totalPending} Pending Task${totalPending !== 1 ? 's' : ''}
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 0.95rem;">
                Click below to view details
            </p>
        </div>
    `;
    
    contentDiv.innerHTML = html;
    
    // Add popup to body
    const existingPopup = document.getElementById('notificationPopup');
    if (existingPopup) existingPopup.remove();
    
    document.body.appendChild(clone);
    
    // Play notification sound one time only
    playNotificationSound();
    
    // Auto-close popup after 10 seconds
    setTimeout(() => {
        const popup = document.getElementById('notificationPopup');
        if (popup) {
            popup.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => popup.remove(), 400);
        }
    }, 10000);
};

/**
 * Close notification popup
 */
window.closeNotificationPopup = function() {
    const popup = document.getElementById('notificationPopup');
    if (popup) {
        popup.style.animation = 'slideOut 0.4s ease forwards';
        setTimeout(() => popup.remove(), 400);
    }
};

/**
 * Open notifications view
 */
window.openNotificationsView = function() {
    closeNotificationPopup();
    // Track in navigation history so back button goes to Dashboard
    pushNavigation('Notifications', () => renderNotificationsView());
    renderNotificationsView();
};

/**
 * Open notifications view filtered by subject
 */
window.openNotificationsViewForSubject = function(subjectName) {
    closeNotificationPopup();
    // Track in navigation history so back button goes to Dashboard
    pushNavigation('Notifications', () => renderNotificationsView(subjectName));
    renderNotificationsView(subjectName);
};

/**
 * Render the notifications view
 */
function renderNotificationsView(filterSubject = null) {
    const currentStudentId = getCurrentStudentId();
    const appContainer = document.getElementById('app-container');
    
    // Set header title
    const titleEl = document.querySelector('.view-title');
    if (titleEl) titleEl.textContent = 'Pending Tasks';
    
    // Render from template
    const template = document.getElementById('notifications-view');
    if (!template) return;
    
    const clone = template.content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(clone);
    
    const pendingTasks = getPendingTasks(currentStudentId);
    const container = document.getElementById('notificationsContainer');
    const noNotifications = document.getElementById('noNotifications');
    
    const tasksToShow = filterSubject ? { [filterSubject]: pendingTasks[filterSubject] } : pendingTasks;
    
    if (Object.keys(tasksToShow).length === 0) {
        container.style.display = 'none';
        noNotifications.style.display = 'block';
    } else {
        container.style.display = 'grid';
        noNotifications.style.display = 'none';
        
        Object.entries(tasksToShow).forEach(([subject, count]) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: linear-gradient(135deg, #f0f7ff 0%, #f8f0ff 100%);
                border: 2px solid var(--au-blue);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            card.onmouseover = () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 12px 32px rgba(0, 51, 170, 0.15)';
            };
            card.onmouseout = () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            };
            card.onclick = () => {
                setCurrentViewedSubject(subject);
                // Track in navigation history so back button returns to Notifications
                pushNavigation('Pending Tasks', () => renderNotificationsView());
                renderPendingTasksList(subject);
            };
            
            card.innerHTML = `
                <h3 style="margin: 0 0 10px 0; color: var(--au-blue);">${subject}</h3>
                <p style="margin: 0 0 15px 0; font-size: 2rem; color: var(--au-blue); font-weight: 700;">${count}</p>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">📌 Pending task${count > 1 ? 's' : ''} to complete</p>
                <button style="margin-top: 15px; width: 100%; padding: 10px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    View Tasks →
                </button>
            `;
            
            container.appendChild(card);
        });
    }
}

/**
 * Get or set current viewed subject (for context)
 */
let currentViewedSubject = null;

function setCurrentViewedSubject(subject) {
    currentViewedSubject = subject;
}

function getCurrentViewedSubject() {
    return currentViewedSubject;
}

/**
 * Migrate old scoresheet data to new 6-category format
 * This runs once when initializing a student's scoresheet
 */
function migrateOldScoresheetsToNew(studentId, subjectName) {
    const grades = getSubjectGrades();
    
    // Check if data already exists in new format
    if (grades[studentId]?.[subjectName]?.['1st']?.['concept-notes']) {
        return; // Already migrated
    }
    
    // Initialize new structure
    initNewScoresheetStructure(studentId, subjectName);
    
    // Check for old format data (flat structure with keys like 'n', 'a', 'p', 'e')
    const oldData = grades[studentId]?.[subjectName];
    if (!oldData) return;
    
    // Try to map old data to new structure if it exists
    // Old format might have direct data, so we skip if it's already in new format
    // This is a placeholder for actual migration logic if needed
}

/**
 * Migrate all students' old data to new format
 */
window.migrateAllStudentsData = function() {
    const grades = getSubjectGrades();
    let migratedCount = 0;
    
    Object.keys(grades).forEach(studentId => {
        Object.keys(grades[studentId]).forEach(subjectName => {
            migrateOldScoresheetsToNew(studentId, subjectName);
            migratedCount++;
        });
    });
    
    console.log(`✓ Migrated data for ${migratedCount} subject(s)`);
    showSuccessToast(`✓ Data migration complete! ${migratedCount} scoresheet(s) updated.`);
};

export {
    SCORESHEET_CATEGORIES,
    initNewScoresheetStructure,
    getPendingTasks,
    showPendingNotification,
    renderNewScoresheet
};
