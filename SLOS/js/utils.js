/* =========================================
   UTILS.JS - HELPER FUNCTIONS
   ========================================= */

import { clusters, getUserAccounts } from './storage.js';

/**
 * Get student data by ID from any cluster/strand/section
 */
export function getStudentData(id) {
    if (!id) return null;
    for (const cluster in clusters) {
        for (const strand in clusters[cluster]) {
            for (const section in clusters[cluster][strand]) {
                const found = clusters[cluster][strand][section].find(s => s.id === id);
                if (found) return found;
            }
        }
    }
    return null;
}

/**
 * Load external templates from templates.html
 */
export async function loadExternalTemplates() {
    try {
        const response = await fetch('./templates.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById('template-library').innerHTML = html;
        console.log("✓ Templates loaded successfully.");
        return true;
    } catch (error) {
        console.error("✗ Error loading templates:", error);
        return false;
    }
}

/**
 * Format date helper
 */
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}

/**
 * Get current quarter from button text
 */
export function getCurrentQuarter() {
    const quarterBtn = document.getElementById('quarterBtn');
    if (!quarterBtn) return "1st";
    const text = quarterBtn.textContent.trim().split(' ')[0].toLowerCase();
    return text || "1st";
}

/**
 * Generate unique ID
 */
export function generateID() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Sentence case conversion
 */
export function toSentenceCase(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) {
        const clone = [];
        for (let i = 0; i < obj.length; i++) {
            clone[i] = deepClone(obj[i]);
        }
        return clone;
    }
    if (obj instanceof Object) {
        const clone = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = deepClone(obj[key]);
            }
        }
        return clone;
    }
}

/**
 * Get initials from name
 */
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Sleep function (promise-based delay)
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse CSV string to array
 */
export function parseCSV(csvString) {
    const rows = csvString.split('\n');
    const result = [];
    
    rows.forEach(row => {
        if (row.trim()) {
            const cols = row.split(',').map(col => col.trim());
            result.push(cols);
        }
    });
    
    return result;
}

/**
 * Convert array to CSV string
 */
export function arrayToCSV(data) {
    return data.map(row => 
        Array.isArray(row) ? row.join(',') : row
    ).join('\n');
}

/**
 * Debounce function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Sort array of objects by property
 */
export function sortBy(array, property, ascending = true) {
    const sorted = [...array];
    sorted.sort((a, b) => {
        if (a[property] < b[property]) return ascending ? -1 : 1;
        if (a[property] > b[property]) return ascending ? 1 : -1;
        return 0;
    });
    return sorted;
}

/**
 * Filter array by multiple criteria
 */
export function filterBy(array, filters) {
    return array.filter(item => {
        for (const key in filters) {
            if (item[key] !== filters[key]) return false;
        }
        return true;
    });
}

/**
 * Get unique values from array
 */
export function getUnique(array, property = null) {
    if (property) {
        return [...new Set(array.map(item => item[property]))];
    }
    return [...new Set(array)];
}

/**
 * Set an image element's src by trying multiple extensions for a base filename.
 * Attempts extensions in order and falls back to `images/default.svg`.
 */
export function setIconSrc(imgElement, baseName) {
    if (!imgElement || !baseName) return;
    const exts = ['svg', 'png', 'webp', 'jpg', 'jpeg'];
    let i = 0;
    function tryNext() {
        if (i >= exts.length) {
            imgElement.onerror = null;
            imgElement.src = 'images/default.svg';
            return;
        }
        const path = `images/profile-icons/${baseName}.${exts[i++]}`;
        imgElement.onerror = tryNext;
        imgElement.src = path;
    }
    tryNext();
}

/**
 * Group array by property
 */
export function groupBy(array, property) {
    return array.reduce((grouped, item) => {
        const key = item[property];
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
        return grouped;
    }, {});
}

/**
 * Find differences between two objects
 */
export function getDifferences(obj1, obj2) {
    const diff = {};
    for (const key in obj1) {
        if (obj1[key] !== obj2[key]) {
            diff[key] = { old: obj1[key], new: obj2[key] };
        }
    }
    return diff;
}

/**
 * Merge objects deeply
 */
export function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Convert object to query string
 */
export function objectToQueryString(obj) {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
}

/**
 * Parse query string to object
 */
export function queryStringToObject(queryString) {
    const pairs = queryString.split('&');
    const result = {};
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        result[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return result;
}

/**
 * Schedule Functions - Auto-load student/teacher schedules
 */

// Get student schedule from localStorage
function getStudentSchedule(studentId) {
    const key = `schedule_${studentId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

// Get teacher schedule from localStorage
function getTeacherSchedule(teacherId) {
    const key = `schedule_teacher_${teacherId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

// Save student schedule to localStorage
function saveStudentSchedule(studentId, scheduleData) {
    const key = `schedule_${studentId}`;
    localStorage.setItem(key, JSON.stringify(scheduleData));
}

// Save teacher schedule to localStorage
function saveTeacherSchedule(teacherId, scheduleData) {
    const key = `schedule_teacher_${teacherId}`;
    localStorage.setItem(key, JSON.stringify(scheduleData));
}

// Load schedule data from LocalStorage into DOM
function loadScheduleToDOM(scheduleData) {
    if (!scheduleData) return;
    
    // Load online schedule
    const onlineTable = document.getElementById('scheduleTableOnline');
    if (onlineTable && scheduleData.online) {
        scheduleData.online.forEach((rowData) => {
            const rowNum = rowData.row;
            const row = onlineTable.querySelector(`tbody tr[data-row="${rowNum}"]`);
            if (row) {
                // Check if this row should be a health break
                if (rowData.isHealthBreak) {
                    convertToHealthBreakRow(row);
                } else {
                    convertToRegularRow(row);
                    // Fill in the content
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        cells[0].textContent = rowData.time;
                        cells[1].textContent = rowData.mon;
                        cells[2].textContent = rowData.tue;
                        cells[3].textContent = rowData.wed;
                        cells[4].textContent = rowData.thu;
                        cells[5].textContent = rowData.fri;
                    }
                }
            }
        });
    }
    
    // Load offline schedule
    const offlineTable = document.getElementById('scheduleTableOffline');
    if (offlineTable && scheduleData.offline) {
        scheduleData.offline.forEach((rowData) => {
            const rowNum = rowData.row;
            const row = offlineTable.querySelector(`tbody tr[data-row="${rowNum}"]`);
            if (row) {
                // Check if this row should be a health break
                if (rowData.isHealthBreak) {
                    convertToHealthBreakRow(row);
                } else {
                    convertToRegularRow(row);
                    // Fill in the content
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        cells[0].textContent = rowData.time;
                        cells[1].textContent = rowData.mon;
                        cells[2].textContent = rowData.tue;
                        cells[3].textContent = rowData.wed;
                        cells[4].textContent = rowData.thu;
                        cells[5].textContent = rowData.fri;
                    }
                }
            }
        });
    }
}

// Get schedule from table DOM
function getScheduleTableData() {
    const onlineTable = document.getElementById('scheduleTableOnline');
    const offlineTable = document.getElementById('scheduleTableOffline');
    
    const getTableData = (table) => {
        const rows = [];
        if (!table) return rows;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return rows;
        
        tbody.querySelectorAll('tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            const rowNum = tr.getAttribute('data-row');
            const isHealthBreak = tr.classList.contains('schedule-row-health-break');
            
            // Handle colspan rows (health break rows with only 1 cell)
            if (cells.length === 1 || isHealthBreak) {
                rows.push({
                    row: rowNum,
                    time: '',
                    mon: isHealthBreak ? 'Health Break' : cells[0].textContent.trim(),
                    tue: '',
                    wed: '',
                    thu: '',
                    fri: '',
                    isHealthBreak: true
                });
            } else if (cells.length >= 6) {
                // Regular rows with 6+ cells
                rows.push({
                    row: rowNum,
                    time: cells[0].textContent.trim(),
                    mon: cells[1].textContent.trim(),
                    tue: cells[2].textContent.trim(),
                    wed: cells[3].textContent.trim(),
                    thu: cells[4].textContent.trim(),
                    fri: cells[5].textContent.trim(),
                    isHealthBreak: false
                });
            }
        });
        return rows;
    };
    
    return {
        online: getTableData(onlineTable),
        offline: getTableData(offlineTable)
    };
}

// Enable schedule edit mode
function setupScheduleAutoSave() {
    // Setup auto-save listeners only for schedule table editable cells
    const selector = '#scheduleTableOnline [contenteditable="true"], #scheduleTableOffline [contenteditable="true"]';
    document.querySelectorAll(selector).forEach(cell => {
        cell.removeEventListener('blur', autoSaveSchedule);
        cell.addEventListener('blur', autoSaveSchedule);
    });
    
    // Setup context menu for rows
    setupScheduleContextMenu();
}

// Auto-save schedule to localStorage
function autoSaveSchedule() {
    const currentUser = (window.getCurrentUser && window.getCurrentUser()) || localStorage.getItem('currentUser');
    if (!currentUser) return;
    const accounts = getUserAccounts();
    const role = accounts?.[currentUser]?.role;
    const scheduleData = getScheduleTableData();

    if (role === 'student') {
        // Prefer saving under the selected studentId (when a teacher or student view is open)
        const studentId = (window.getCurrentStudentId && window.getCurrentStudentId()) || currentUser;
        saveStudentSchedule(studentId, scheduleData);
    } else if (role === 'teacher') {
        saveTeacherSchedule(currentUser, scheduleData);
    }
}

// Exit edit mode
function exitScheduleEditMode() {
    // Auto-save when exiting
    autoSaveSchedule();
}

// Global save function for schedule changes (kept for compatibility)
window.saveScheduleChanges = function() {
    autoSaveSchedule();
};

// Global toggle edit mode function (kept for compatibility, no longer used)
window.toggleScheduleEditMode = function() {
    // Function kept for backwards compatibility - no longer needed
};

// Global cancel function (kept for compatibility, no longer used)
window.cancelScheduleEdit = function() {
    // Function kept for backwards compatibility - no longer needed
};

// Reload schedule data from localStorage
function reloadScheduleData() {
    const currentUser = (window.getCurrentUser && window.getCurrentUser()) || localStorage.getItem('currentUser');
    const accounts = getUserAccounts();
    const role = accounts?.[currentUser]?.role;

    let scheduleData;
    if (role === 'student') {
        const studentId = (window.getCurrentStudentId && window.getCurrentStudentId()) || currentUser;
        scheduleData = getStudentSchedule(studentId);
    } else if (role === 'teacher') {
        scheduleData = getTeacherSchedule(currentUser);
    }

    if (scheduleData) {
        loadScheduleToDOM(scheduleData);
    }
}

// Render student schedule
export function renderStudentSchedule(studentId) {
    try {
        const schedule = getStudentSchedule(studentId);
        if (schedule) {
            loadScheduleToDOM(schedule);
        }
        // Always setup auto-save listeners, even if no schedule exists yet
        setupScheduleAutoSave();
        // Setup context menu after a brief delay to ensure DOM is ready
        setTimeout(() => setupScheduleContextMenu(), 50);
    } catch (error) {
        console.error('Error rendering student schedule:', error);
    }
}

// Render teacher schedule
export function renderTeacherSchedule(teacherId) {
    try {
        const schedule = getTeacherSchedule(teacherId);
        if (schedule) {
            loadScheduleToDOM(schedule);
        }
        // Always setup auto-save listeners, even if no schedule exists yet
        setupScheduleAutoSave();
        // Setup context menu after a brief delay to ensure DOM is ready
        setTimeout(() => setupScheduleContextMenu(), 50);
    } catch (error) {
        console.error('Error rendering teacher schedule:', error);
    }
}

// Expose renderers globally for compatibility with existing code
try {
    if (typeof window !== 'undefined') {
        window.renderStudentSchedule = renderStudentSchedule;
        window.renderTeacherSchedule = renderTeacherSchedule;
    }
} catch (e) {
    console.warn('Could not attach schedule renderers to window:', e);
}

// ===== HEALTH BREAK TOGGLE FUNCTIONALITY =====

// Toggle row between health break and regular subject
function toggleHealthBreak(tableId, rowNum) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const row = table.querySelector(`tbody tr[data-row="${rowNum}"]`);
    if (!row) return;
    
    const isCurrentlyHealthBreak = row.classList.contains('schedule-row-health-break');
    
    if (isCurrentlyHealthBreak) {
        // Convert from health break to regular subject row
        convertToRegularRow(row);
    } else {
        // Convert to health break
        convertToHealthBreakRow(row);
    }
    
    // Re-setup event listeners and context menu
    setTimeout(() => {
        setupScheduleAutoSave();
        setupScheduleContextMenu();
    }, 50);
    
    // Auto-save the change
    autoSaveSchedule();
}

// Convert a row to health break format
function convertToHealthBreakRow(row) {
    row.classList.remove('schedule-row-subject');
    row.classList.add('schedule-row-health-break');
    
    // Clear existing cells and create single colspan cell that spans all columns
    row.innerHTML = '<td class="schedule-cell health-break-cell" colspan="6" style="text-align: center; font-weight: 600; cursor: not-allowed; background: #fff8e1 !important; border: 2px solid #ffc107 !important;">Health Break</td>';
}

// Convert a row back to regular subject format
function convertToRegularRow(row) {
    row.classList.add('schedule-row-subject');
    row.classList.remove('schedule-row-health-break');
    
    // Create 6 cells (time + 5 days)
    row.innerHTML = `
        <td class="schedule-time-cell" contenteditable="true"></td>
        <td class="schedule-cell" contenteditable="true"></td>
        <td class="schedule-cell" contenteditable="true"></td>
        <td class="schedule-cell" contenteditable="true"></td>
        <td class="schedule-cell" contenteditable="true"></td>
        <td class="schedule-cell" contenteditable="true"></td>
    `;
}

// Add toggle buttons to schedule rows
// Setup context menu for schedule rows
function setupScheduleContextMenu() {
    const tables = ['scheduleTableOnline', 'scheduleTableOffline'];
    
    // Create context menu if it doesn't exist
    if (!document.getElementById('schedule-context-menu')) {
        const menu = document.createElement('div');
        menu.id = 'schedule-context-menu';
        menu.className = 'schedule-context-menu';
        menu.style.cssText = `
            display: none;
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            min-width: 200px;
        `;
        document.body.appendChild(menu);
    }
    
    tables.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        // Remove any existing context menu listeners to avoid duplicates
        tbody.addEventListener('contextmenu', handleScheduleContextMenu);
    });
    
    // Hide menu when clicking elsewhere
    document.addEventListener('click', hideScheduleContextMenu);
}

// Handle context menu for schedule rows
function handleScheduleContextMenu(e) {
    e.preventDefault();
    
    const row = e.target.closest('tr[data-row]');
    if (!row) return;
    
    const menu = document.getElementById('schedule-context-menu');
    if (!menu) return;
    
    const tableId = row.closest('table').id;
    const rowNum = row.getAttribute('data-row');
    const isHealthBreak = row.classList.contains('schedule-row-health-break');
    
    // Create menu items
    menu.innerHTML = `
        <div class="schedule-context-item" data-action="toggle" data-table="${tableId}" data-row="${rowNum}">
            <span style="font-size: 1.2rem; margin-right: 8px;">
                ${isHealthBreak ? '➕' : ''}
            </span>
            <span>
                ${isHealthBreak ? 'Convert to Subject' : 'Mark as Health Break'}
            </span>
        </div>
    `;
    
    // Position menu
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.display = 'block';
    
    // Handle menu item click
    menu.querySelectorAll('.schedule-context-item').forEach(item => {
        item.onclick = function() {
            const action = this.getAttribute('data-action');
            const tblId = this.getAttribute('data-table');
            const rNum = this.getAttribute('data-row');
            
            if (action === 'toggle') {
                toggleHealthBreak(tblId, rNum);
            }
            hideScheduleContextMenu();
        };
    });
}

// Hide context menu
function hideScheduleContextMenu() {
    const menu = document.getElementById('schedule-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
}

/**
 * Enhanced Notes & Checklist Functions (per-student)
 */
// Tab switching


window.switchNoteTab = function(tab) {
    const notesTab = document.getElementById('notesTab');
    const checklistTab = document.getElementById('checklistTab');
    const notesTabBtn = document.getElementById('notesTabBtn');
    const checklistTabBtn = document.getElementById('checklistTabBtn');
    
    if (tab === 'notes') {
        notesTab.style.display = 'flex';
        checklistTab.style.display = 'none';
        notesTabBtn.classList.add('active');
        checklistTabBtn.classList.remove('active');
        notesTabBtn.style.background = 'var(--au-blue)';
        notesTabBtn.style.color = 'white';
        checklistTabBtn.style.background = '#ccc';
        checklistTabBtn.style.color = '#333';
    } else {
        notesTab.style.display = 'none';
        checklistTab.style.display = 'flex';
        notesTabBtn.classList.remove('active');
        checklistTabBtn.classList.add('active');
        notesTabBtn.style.background = '#ccc';
        notesTabBtn.style.color = '#333';
        checklistTabBtn.style.background = 'var(--au-blue)';
        checklistTabBtn.style.color = 'white';
        renderChecklistItems();
    }
}

// Emoji picker
window.openEmojiPicker = function(targetType) {
    const emojiList = ['😊', '😍', '🥳', '😎', '🤔', '😴', '😋', '🤗', '😘', '🥰', '😇', '🤩', '😻', '⭐', '🎉', '🎊', '📚', '💡', '🔥', '✨', '💪', '🎯', '📝', '✏️', '🖊️', '📌', '🔔', '💬', '🌟', '💎', '🎨', '🌈', '☀️', '🌙', '⚡', '💥', '👍', '👏', '🙌', '✌️'];
    
    const modal = document.createElement('div');
    modal.className = 'emoji-picker-modal';
    modal.style.zIndex = '10000';
    
    const title = document.createElement('h4');
    title.textContent = '😊 Pick an Emoji';
    title.style.margin = '0 0 15px 0';
    title.style.color = 'var(--au-blue)';
    
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    
    emojiList.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.onclick = () => {
            window.selectEmoji(emoji, targetType);
            document.body.removeChild(modal);
        };
        grid.appendChild(btn);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.width = '100%';
    closeBtn.style.marginTop = '15px';
    closeBtn.style.padding = '8px';
    closeBtn.style.background = '#ddd';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => document.body.removeChild(modal);
    
    modal.appendChild(title);
    modal.appendChild(grid);
    modal.appendChild(closeBtn);
    
    // Close on outer click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });
    
    document.body.appendChild(modal);
}

window.selectEmoji = function(emoji, targetType) {
    if (targetType === 'note') {
        const editor = document.getElementById('quickNoteInput');
        if (editor) {
            document.execCommand('insertText', false, emoji);
            editor.focus();
            showSaveIndicator('Unsaved changes...');
        }
    } else if (targetType === 'checklist') {
        const input = document.getElementById('checklistInput');
        if (input) {
            input.value += emoji;
            input.focus();
        }
    }
}

// Color mapping for note tags
const colorMap = {
    'red': '#dc3545',
    'orange': '#ff9800',
    'green': '#28a745',
    'blue': '#0a60d6',
    'purple': '#9c27b0',
    '': '#333'
};

// Apply color tag to selected text or all text
window.applyNoteColor = function() {
    const colorTag = document.getElementById('noteColorTag');
    const editor = document.getElementById('quickNoteInput');
    
    if (!colorTag || !editor) return;
    
    const selectedColor = colorTag.value;
    const color = colorMap[selectedColor] || '#333';
    
    // Focus editor
    editor.focus();
    
    // Get current selection
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        // If text is selected, apply color to selection
        document.execCommand('foreColor', false, color);
    } else {
        // If no selection, select all and apply color
        document.execCommand('selectAll', false, null);
        document.execCommand('foreColor', false, color);
        // Deselect
        selection.removeAllRanges();
    }
    
    showSaveIndicator('Unsaved changes...');
}

// Show save indicator
function showSaveIndicator(text) {
    const status = document.getElementById('noteSaveStatus');
    if (status) {
        status.textContent = text;
        if (text === 'Saved ✓' || text.includes('Saved')) {
            status.style.color = '#28a745';
        } else {
            status.style.color = '#ff9800';
        }
    }
}

// Update formatting button states based on current selection
window.updateFormatButtonStates = function() {
    const boldBtn = document.querySelector('button[onclick="formatNoteText(\'bold\')"]');
    const italicBtn = document.querySelector('button[onclick="formatNoteText(\'italic\')"]');
    const underlineBtn = document.querySelector('button[onclick="formatNoteText(\'underline\')"]');
    
    // Check if formats are active
    const isBold = document.queryCommandValue('bold') === 'true';
    const isItalic = document.queryCommandValue('italic') === 'true';
    const isUnderline = document.queryCommandValue('underline') === 'true';
    
    // Update button styles
    if (boldBtn) {
        boldBtn.style.background = isBold ? 'var(--au-blue)' : '#fff';
        boldBtn.style.color = isBold ? 'white' : '#333';
        boldBtn.style.fontWeight = isBold ? 'bold' : 'bold';
    }
    
    if (italicBtn) {
        italicBtn.style.background = isItalic ? 'var(--au-blue)' : '#fff';
        italicBtn.style.color = isItalic ? 'white' : '#333';
        italicBtn.style.fontStyle = isItalic ? 'italic' : 'italic';
    }
    
    if (underlineBtn) {
        underlineBtn.style.background = isUnderline ? 'var(--au-blue)' : '#fff';
        underlineBtn.style.color = isUnderline ? 'white' : '#333';
        underlineBtn.style.textDecoration = isUnderline ? 'underline' : 'underline';
    }
}

// Rich text formatting for contenteditable div
window.formatNoteText = function(format) {
    const editor = document.getElementById('quickNoteInput');
    if (!editor) return;
    
    // Focus the editor to ensure commands work
    editor.focus();
    
    if (format === 'bold') {
        document.execCommand('bold', false, null);
    } else if (format === 'italic') {
        document.execCommand('italic', false, null);
    } else if (format === 'underline') {
        document.execCommand('underline', false, null);
    }
    
    showSaveIndicator('Unsaved changes...');
    updateFormatButtonStates();
    editor.focus();
}

// Enhanced save note with timestamp and color tag
window.saveQuickNote = function() {
    const studentId = window.getCurrentStudentId();
    const editor = document.getElementById('quickNoteInput');
    const colorTag = document.getElementById('noteColorTag');
    
    if (!editor) return;
    
    const noteData = {
        content: editor.innerHTML || '',
        tag: colorTag ? colorTag.value : '',
        timestamp: new Date().toLocaleString()
    };
    
    const key = `quicknote_${studentId}`;
    localStorage.setItem(key, JSON.stringify(noteData));
    
    showSaveIndicator(`Saved ✓ ${new Date().toLocaleTimeString()}`);
    setTimeout(() => {
        const status = document.getElementById('noteSaveStatus');
        if (status) status.textContent = '';
    }, 3000);
}

export function loadQuickNote(studentId) {
    const editor = document.getElementById('quickNoteInput');
    if (!editor) return;
    
    const key = `quicknote_${studentId}`;
    const data = localStorage.getItem(key);
    
    if (data) {
        try {
            const noteData = JSON.parse(data);
            editor.innerHTML = noteData.content || '';
            const colorTag = document.getElementById('noteColorTag');
            if (colorTag) colorTag.value = noteData.tag || '';
            
            // Display timestamp
            const timestamp = document.getElementById('noteTimestamp');
            if (timestamp && noteData.timestamp) {
                timestamp.textContent = `Last saved: ${noteData.timestamp}`;
            }
        } catch (e) {
            // Fallback to plain text if JSON parse fails
            editor.textContent = data;
        }
    }
    
    // Add event listeners to update button states on user interaction
    if (!editor.hasAttribute('data-listeners-attached')) {
        editor.addEventListener('mouseup', updateFormatButtonStates);
        editor.addEventListener('keyup', updateFormatButtonStates);
        editor.addEventListener('click', updateFormatButtonStates);
        editor.setAttribute('data-listeners-attached', 'true');
    }
    
    // Initial button state update
    updateFormatButtonStates();
}

// Checklist functions
window.addChecklistItem = function() {
    const input = document.getElementById('checklistInput');
    if (!input || !input.value.trim()) {
        alert('Please enter a task');
        return;
    }
    
    const itemText = input.value.trim();
    input.value = '';
    
    // Add to in-memory list
    if (!window.checklistDraft) window.checklistDraft = [];
    window.checklistDraft.push({
        id: Date.now(),
        text: itemText,
        done: false
    });
    
    renderChecklistItems();
}

window.deleteChecklistItem = function(itemId) {
    if (!window.checklistDraft) return;

    const item = (window.checklistDraft || []).find(i => i.id === itemId);
    const itemName = item ? item.text : 'this item';

    const doDelete = () => {
        window.checklistDraft = window.checklistDraft.filter(item => item.id !== itemId);
        renderChecklistItems();
    };

    if (window.showDeleteConfirmation) {
        window.showDeleteConfirmation(itemName, doDelete);
    } else {
        if (confirm(`Delete "${itemName}"?`)) doDelete();
    }
}

window.toggleChecklistItem = function(itemId) {
    if (!window.checklistDraft) return;
    const item = window.checklistDraft.find(i => i.id === itemId);
    if (item) item.done = !item.done;
    renderChecklistItems();
}

function renderChecklistItems() {
    const container = document.getElementById('checklistItems');
    if (!container) return;
    
    if (!window.checklistDraft || window.checklistDraft.length === 0) {
        container.innerHTML = '<div style="color: #999; text-align: center; padding: 20px; font-size: 0.9rem;">No tasks yet. Add one to get started!</div>';
        return;
    }
    
    container.innerHTML = window.checklistDraft.map(item => `
        <div class="checklist-item ${item.done ? 'done' : ''}" style="${item.done ? 'opacity: 0.6;' : ''}">
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem(${item.id})" style="cursor: pointer; width: 18px; height: 18px;">
            <span class="checklist-text">${escapeHtml(item.text)}</span>
            <button class="delete-btn" onclick="deleteChecklistItem(${item.id})">Delete</button>
        </div>
    `).join('');
}

window.saveChecklist = function() {
    const studentId = window.getCurrentStudentId();
    const key = `checklist_${studentId}`;
    
    const checklistData = {
        items: window.checklistDraft || [],
        timestamp: new Date().toLocaleString()
    };
    
    localStorage.setItem(key, JSON.stringify(checklistData));
    alert('Checklist saved!');
}

export function loadChecklist(studentId) {
    const key = `checklist_${studentId}`;
    const data = localStorage.getItem(key);
    
    if (data) {
        try {
            const checklistData = JSON.parse(data);
            window.checklistDraft = checklistData.items || [];
            
            // Display timestamp
            const timestamp = document.getElementById('noteTimestamp');
            if (timestamp && checklistData.timestamp) {
                timestamp.textContent = `Last saved: ${checklistData.timestamp}`;
            }
        } catch (e) {
            window.checklistDraft = [];
        }
    } else {
        window.checklistDraft = [];
    }
    
    renderChecklistItems();
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

