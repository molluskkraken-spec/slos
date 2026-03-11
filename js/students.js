/* =========================================
   STUDENTS.JS - FULL LOGIC (UPDATED)
   ========================================= */

import { renderApp } from './app.js';
import { appContainer, getCurrentUser, getCurrentViewedSubject, goBack, pushNavigation, setCurrentStudentId, setCurrentViewedSubject } from './global.js';
import { clusters, getAvailableGenders, getAvailableSubjects, getClusters, getSubjectGrades, saveAccounts, saveClusters, saveGenders, saveGrades, saveSubjects, userAccounts, getUserAccounts } from './storage.js';
import { getStudentData } from './utils.js';

// Ensure a safe HTML-escape helper exists (fallback if not provided by utils.js)
if (typeof escapeHtml !== 'function') {
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// --- Global Variables for this module ---
let editingStudentId = null;
let editingLocation = { cluster: '', strand: '', section: '' };
let tempImageData = "";

// Teacher scoresheet tracking
let currentCategory = 'concept-notes';
let currentQuarter = '1st';

// View mode tracking (badge or list view)
let viewModes = {
    cluster: 'badge',
    strand: 'badge',
    section: 'badge',
    subject: 'badge'
};

// Search filter terms used by the academic setup panels
// (was implicitly global before – now declared explicitly so we can reset it properly)
let searchTerms = {
    cluster: '',
    strand: '',
    section: '',
    subject: ''
};

// --- TOAST NOTIFICATION SYSTEM ---
export function showSuccessToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: white;
        color: #333;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        pointer-events: auto;
        font-size: 0.95rem;
        border-left: 4px solid #4CAF50;
    `;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// --- CUSTOM DIALOG SYSTEM ---
export function showDialog(options) {
    const {
        type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
        title = 'Dialog',
        message = '',
        onConfirm = null,
        onCancel = null,
        confirmText = 'OK',
        cancelText = 'Cancel',
        showCancel = type === 'confirm'
    } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-width: 450px;
        width: 90%;
        overflow: hidden;
        animation: slideUp 0.3s ease-out;
    `;

    // Color scheme based on type
    const colorMap = {
        success: { icon: 'fas fa-check-circle', color: '#4CAF50', light: '#e8f5e9' },
        error: { icon: 'fas fa-exclamation-circle', color: '#f44336', light: '#ffebee' },
        warning: { icon: 'fas fa-warning', color: '#ff9800', light: '#fff3e0' },
        info: { icon: 'fas fa-info-circle', color: '#2196F3', light: '#e3f2fd' },
        confirm: { icon: 'fas fa-question-circle', color: '#2196F3', light: '#e3f2fd' }
    };

    const colors = colorMap[type] || colorMap.info;

    // Modal header
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, ${colors.color} 0%, ${colors.color}dd 100%);
        color: white;
        padding: 25px;
        text-align: center;
        border-radius: 12px 12px 0 0;
    `;

    header.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 10px;">
            <i class="${colors.icon}"></i>
        </div>
        <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">${title}</h2>
    `;

    // Modal body
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 25px;
        text-align: center;
        color: #333;
        font-size: 0.95rem;
        line-height: 1.6;
    `;
    body.textContent = message;

    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 15px 25px;

        /* =========================================
            2. EXISTING VIEW & GRADING LOGIC (UNCHANGED)
            ========================================= */
        display: flex;
        gap: 10px;
        justify-content: center;
        border-top: 1px solid #eee;
    `;

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-primary';
    confirmBtn.style.cssText = `
        padding: 10px 30px;
        background: ${colors.color};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.3s ease;
        flex: 1;
    `;
    confirmBtn.textContent = confirmText;
    confirmBtn.onmouseover = () => confirmBtn.style.opacity = '0.9';
    confirmBtn.onmouseout = () => confirmBtn.style.opacity = '1';
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        closeModal();
    };

    footer.appendChild(confirmBtn);

    // Cancel button
    if (showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-secondary';
        cancelBtn.style.cssText = `
            padding: 10px 30px;
            background: #f0f0f0;
            color: #333;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
        `;
        cancelBtn.textContent = cancelText;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#e0e0e0';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#f0f0f0';
        cancelBtn.onclick = () => {
            if (onCancel) onCancel();
            closeModal();
        };
        footer.appendChild(cancelBtn);
    }

    // Close button in header
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    `;
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.2)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
    closeBtn.onclick = () => closeModal();
    header.style.position = 'relative';
    header.appendChild(closeBtn);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);

    // Assemble overlay
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close modal function
    function closeModal() {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        modal.style.animation = 'slideDown 0.2s ease-out';
        setTimeout(() => {
            overlay.remove();
        }, 200);
    }

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    return closeModal;
}

// --- CUSTOM INPUT DIALOG ---
export function showInputDialog(options) {
    const {
        title = 'Enter Value',
        label = 'Input:',
        currentValue = '',
        onConfirm = null,
        onCancel = null,
        validationError = null
    } = options;

    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            width: 90%;
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
        `;

        // Modal header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #0033aa 0%, #0033aabb 100%);
            color: white;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            position: relative;
        `;

        header.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">
                <i class="fas fa-edit"></i>
            </div>
            <h2 style="margin: 0; font-size: 1.3rem; font-weight: 600;">${title}</h2>
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        `;
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.2)';
        closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 25px;
            color: #333;
        `;

        // Error message (if any)
        let errorDiv = null;
        if (validationError) {
            errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: #ffebee;
                color: #c62828;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
                font-size: 0.9rem;
                border-left: 4px solid #c62828;
            `;
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${validationError}`;
            body.appendChild(errorDiv);
        }

        // Label
        const labelEl = document.createElement('label');
        labelEl.style.cssText = `
            display: block;
            margin-bottom: 10px;
            font-weight: 500;
            color: #555;
            font-size: 0.95rem;
        `;
        labelEl.textContent = label;
        body.appendChild(labelEl);

        // Input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'au-input';
        input.value = currentValue;
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 0.95rem;
            font-family: inherit;
            box-sizing: border-box;
            transition: border-color 0.3s;
        `;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        };
        input.onfocus = () => {
            input.style.borderColor = '#0033aa';
            input.style.boxShadow = '0 0 0 3px rgba(0, 51, 170, 0.1)';
        };
        input.onblur = () => {
            input.style.borderColor = '#ddd';
            input.style.boxShadow = 'none';
        };
        body.appendChild(input);

        // Modal footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 15px 25px;
            display: flex;
            gap: 10px;
            justify-content: center;
            border-top: 1px solid #eee;
        `;

        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-btn modal-btn-primary';
        confirmBtn.style.cssText = `
            padding: 10px 30px;
            background: #0033aa;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
        `;
        confirmBtn.textContent = 'OK';
        confirmBtn.onmouseover = () => confirmBtn.style.opacity = '0.9';
        confirmBtn.onmouseout = () => confirmBtn.style.opacity = '1';
        confirmBtn.onclick = () => {
            const result = input.value;
            if (onConfirm) {
                onConfirm(result);
            }
            closeModal();
            resolve(result);
        };
        footer.appendChild(confirmBtn);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-secondary';
        cancelBtn.style.cssText = `
            padding: 10px 30px;
            background: #f0f0f0;
            color: #333;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
        `;
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#e0e0e0';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#f0f0f0';
        cancelBtn.onclick = () => {
            if (onCancel) onCancel();
            closeModal();
            resolve(null);
        };
        footer.appendChild(cancelBtn);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        // Assemble overlay
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal function
        function closeModal() {
            overlay.style.animation = 'fadeOut 0.2s ease-out';
            modal.style.animation = 'slideDown 0.2s ease-out';
            setTimeout(() => {
                overlay.remove();
            }, 200);
        }

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeModal();
                resolve(null);
            }
        };

        // Close on close button click
        closeBtn.onclick = () => {
            closeModal();
            resolve(null);
        };

        // Focus input
        input.focus();
        input.select();
    });
}
export function initializeSentenceCaseInputs() {
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        // Skip username and password fields
        if (input.id === 's-username' || input.id === 't-username' || input.id === 's-password' || input.id === 't-password' || 
            input.id === 'ta-username' || input.id === 'ta-password') {
            return;
        }
        
        // Convert to sentence case on blur (when user leaves the field)
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                const trimmed = this.value.trim();
                this.value = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            }
        });
    });
}

export function initializeTitleCaseInputs() {
    // Apply title case to name fields
    const nameFields = document.querySelectorAll(
        'input[id="s-fname"], input[id="s-mname"], input[id="s-lname"], ' +
        'input[id="t-fname"], input[id="t-mname"], input[id="t-lname"], ' +
        'input[id="ta-fname"], input[id="ta-mname"], input[id="ta-lname"]'
    );
    
    nameFields.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                const trimmed = this.value.trim();
                // Title case: capitalize each word
                this.value = trimmed.split(/\s+/).map(word => {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(' ');
            }
        });
    });
}

// --- DATE VALIDATION ---
export function initializeDateInputs() {
    const dateInputs = document.querySelectorAll('.date-input');
    dateInputs.forEach(input => {
        // Set min and max attributes
        input.min = "1900-01-01";
        input.max = "2030-12-31";
        
        // Add validation on change
        input.addEventListener('change', function() {
            validateDateInput(this);
        });
    });
}

function validateDateInput(input) {
    const value = input.value;
    if (!value) return;
    
    const date = new Date(value);
    const minDate = new Date('1900-01-01');
    const maxDate = new Date('2030-12-31');
    
    if (date < minDate || date > maxDate) {
        alert('Please enter a date between 1900 and 2030');
        input.value = '';
    }
}

/* =========================================
   PASSWORD TOGGLE FUNCTIONALITY
   ========================================= */

export function togglePasswordVisibility(element) {
    // Handle both: element can be an ID string or a DOM element (button)
    let passwordInput;
    let toggleBtn;
    
    if (typeof element === 'string') {
        // Called with ID string (e.g., 'password')
        passwordInput = document.getElementById(element);
        toggleBtn = document.querySelector(`button[onclick*="togglePasswordVisibility('${element}')"]`);
    } else {
        // Called with button element (this)
        toggleBtn = element;
        // Find the password input - it should be a sibling or in the same wrapper
        const wrapper = toggleBtn.closest('.password-input-wrapper');
        if (wrapper) {
            passwordInput = wrapper.querySelector('input[type="password"], input[type="text"]');
        } else {
            // Fallback: search nearby inputs
            passwordInput = toggleBtn.parentElement.querySelector('input[type="password"], input[type="text"]');
        }
    }
    
    if (!passwordInput) {
        console.warn('❌ Password input not found for toggle');
        return;
    }
    
    // Toggle password visibility
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update button emoji with animation
    if (toggleBtn) {
        toggleBtn.classList.add('emoji-transition');
        toggleBtn.textContent = isPassword ? '👁️' : '🙈';
        
        // Remove animation class after animation completes
        setTimeout(() => {
            toggleBtn.classList.remove('emoji-transition');
        }, 700);
    }
    
    console.log('✓ Password visibility toggled:', passwordInput.type);
}

/* =========================================
   CSV IMPORT FUNCTIONALITY FOR STUDENTS
   ========================================= */

// Global variable to store CSV data temporarily
let csvImportData = [];

export function updateRecordSectionAndSubjectList() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandSelect = document.getElementById('record-strand-select');
    const sectionSelect = document.getElementById('record-section-select');
    const subjectSelect = document.getElementById('record-subject-select');
    const studentListDiv = document.getElementById('record-student-list');
    const c = getClusters();

    // subjectSelect is optional (may not exist in this view) — don't bail out if missing
    if (!strandSelect || !sectionSelect) return;

    const selectedStrand = strandSelect.value;
    
    // Reset section dropdown
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
    sectionSelect.disabled = true;
    sectionSelect.style.backgroundColor = '#f5f5f5';
    
    // Reset student list
    if (studentListDiv) {
        studentListDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 30px 20px; font-style: italic;">Select a section to view students</p>';
    }
    
    // Reset subject dropdown (only if it exists)
    if (subjectSelect) {
        subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
        subjectSelect.disabled = true;
    }

    if (!selectedStrand) {
        displayRecordCards([]);
        return;
    }

    // Determine which sections to display. First try the teacher's assignments (case‑insensitive),
    // then fall back to the cluster definition if nothing was assigned.
    let sectionsToShow = getAssignedSectionsForStrand(teacherData, selectedStrand);

    // If teacher has no specific sections, grab them from the cluster schema
    if (sectionsToShow.length === 0) {
        const clusterStrand = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand]) || null;
        if (clusterStrand) {
            sectionsToShow = Object.keys(clusterStrand).filter(key => key !== 'subjects' && Array.isArray(clusterStrand[key]));
        }
    }

    if (sectionsToShow.length > 0) {
        sectionsToShow.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            sectionSelect.appendChild(opt);
        });

        // enable dropdown if at least one real section option exists
        if (sectionSelect.options.length > 1) {
            sectionSelect.disabled = false;
            sectionSelect.style.backgroundColor = '';
        }
    }

    // Populate subjects for this strand (if the subject select exists)
    if (subjectSelect && teacherData.assignedSubjects && Array.isArray(teacherData.assignedSubjects)) {
        teacherData.assignedSubjects.forEach(subject => {
            const opt = document.createElement('option');
            opt.value = subject;
            opt.textContent = subject;
            subjectSelect.appendChild(opt);
        });
        subjectSelect.disabled = false;
    }
}

function validateCSVData(data) {
    const validated = [];
    const clusters = getClusters();
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const errors = [];
        
        // Validate required fields
        if (!row['first name'] || !row['first name'].trim()) {
            errors.push("First name is empty");
        }
        if (!row['last name'] || !row['last name'].trim()) {
            errors.push("Last name is empty");
        }
        if (!row['birthday'] || !row['birthday'].trim()) {
            errors.push("Birthday is empty");
        }
        if (!row['gender'] || !row['gender'].trim()) {
            errors.push("Gender is empty");
        }
        if (!row['cluster'] || !row['cluster'].trim()) {
            errors.push("Cluster is empty");
        }
        if (!row['strand'] || !row['strand'].trim()) {
            errors.push("Strand is empty");
        }
        if (!row['section'] || !row['section'].trim()) {
            errors.push("Section is empty");
        }
        if (!row['subjects'] || !row['subjects'].trim()) {
            errors.push("Subjects are empty");
        }
        
        // Validate cluster/strand/section exist
        const cluster = row['cluster'].trim();
        const strand = row['strand'].trim();
        const section = row['section'].trim();
        
        if (cluster && !clusters[cluster]) {
            errors.push(`Cluster "${cluster}" does not exist`);
        } else if (strand && !clusters[cluster][strand]) {
            errors.push(`Strand "${strand}" does not exist in cluster "${cluster}"`);
        } else if (section && !clusters[cluster][strand][section]) {
            errors.push(`Section "${section}" does not exist`);
        }
        
        if (errors.length > 0) {
            continue; // Skip invalid row
        }
        
        // Validate and parse subjects
        const subjectsStr = row['subjects'].trim();
        const subjectsList = subjectsStr.split(';').map(s => s.trim()).filter(s => s);
        
        if (subjectsList.length === 0) {
            continue;
        }
        
        // Validate birthday format (DD/MM/YYYY or YYYY-MM-DD)
        let birthday = row['birthday'].trim();
        if (!isValidDate(birthday)) {
            continue;
        }
        
        // Add validated row
        validated.push({
            'first name': row['first name'].trim(),
            'middle name': row['middle name'] ? row['middle name'].trim() : '',
            'last name': row['last name'].trim(),
            'birthday': formatBirthdayForDB(birthday),
            'gender': row['gender'].trim(),
            'cluster': cluster,
            'strand': strand,
            'section': section,
            'subjects': subjectsList,
            'row': i + 2 // 1-indexed + header
        });
    }
    
    return validated;
}

function isValidDate(dateStr) {
    // Accept DD/MM/YYYY, YYYY-MM-DD, or MM/DD/YYYY formats
    const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
    ];
    
    return formats.some(fmt => fmt.test(dateStr));
}

function formatBirthdayForDB(dateStr) {
    // Convert to YYYY-MM-DD format for HTML date input
    if (dateStr.includes('-')) {
        return dateStr; // Already in YYYY-MM-DD
    }
    
    // Parse MM/DD/YYYY or DD/MM/YYYY - assuming DD/MM/YYYY per CSV format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    
    return dateStr;
}

function showCSVPreviewModal(data) {
    // Load modal template
    const modalTemplate = document.getElementById('csv-preview-modal');
    if (!modalTemplate) {
        showSuccessToast("❌ CSV Preview modal template not found");
        return;
    }
    
    // Clone and append modal
    const modalContent = modalTemplate.content.cloneNode(true);
    document.body.appendChild(modalContent);
    
    // Update preview data
    document.getElementById('csv-row-count').textContent = data.length;
    document.getElementById('csv-import-count').textContent = data.length;
    
    const tbody = document.getElementById('csv-preview-tbody');
    tbody.innerHTML = '';
    
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom: 1px solid #e0e0e0;';
        tr.innerHTML = `
            <td style="padding: 10px; text-align: center; color: #999;">${index + 1}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['first name']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['middle name']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['last name']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['birthday']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['gender']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['cluster']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['strand']}</td>
            <td style="padding: 10px;" contenteditable="true" onclick="event.stopPropagation()">${row['section']}</td>
            <td style="padding: 10px;">${row['subjects'].join(', ')}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Show modal
    const overlay = document.getElementById('csv-modal-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

export function closeCSVPreviewModal() {
    const overlay = document.getElementById('csv-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
    csvImportData = [];
}

export function confirmCSVImport() {
    if (csvImportData.length === 0) {
        showSuccessToast("⚠️ No data to import.");
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Bulk create accounts
    csvImportData.forEach((row, index) => {
        try {
            // Generate username and password
            const username = generateUsername(row['first name'], row['last name'], index);
            const password = generatePassword();
            
            // Check if username already exists
            if (userAccounts[username.toLowerCase()]) {
                errorCount++;
                errors.push(`Row ${index + 1}: Username "${username}" already exists`);
                return;
            }
            
            // Create login account
            const fullName = `${row['first name']} ${row['middle name'] ? row['middle name'] + ' ' : ''}${row['last name']}`.trim();
            const newId = "s_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            
            userAccounts[username.toLowerCase()] = {
                password: password,
                role: "student",
                studentId: newId,
                img: "images/default.svg",
                name: fullName,
                subjects: row['subjects'],
                strand: row['strand'],
                section: row['section'],
                username: username // Store original username for reference
            };
            
            // Create student record
            const newStudentObj = {
                id: newId,
                name: fullName,
                firstName: row['first name'],
                middleName: row['middle name'],
                lastName: row['last name'],
                birthday: row['birthday'],
                gender: row['gender'],
                img: "images/default.svg",
                subjects: row['subjects']
            };
            
            // Add to cluster structure
            const c = getClusters();
            if (!c[row['cluster']]) c[row['cluster']] = {};
            if (!c[row['cluster']][row['strand']]) c[row['cluster']][row['strand']] = {};
            if (!c[row['cluster']][row['strand']][row['section']]) {
                c[row['cluster']][row['strand']][row['section']] = [];
            }
            
            c[row['cluster']][row['strand']][row['section']].push(newStudentObj);
            
            successCount++;
        } catch (error) {
            errorCount++;
            errors.push(`Row ${index + 1}: ${error.message}`);
        }
    });
    
    // Save data
    if (successCount > 0) {
        saveAccounts();
        saveClusters();
    }
    
    // Close modal
    closeCSVPreviewModal();
    
    // Show result message
    if (successCount > 0 && errorCount === 0) {
        showSuccessToast(`✅ Successfully imported ${successCount} student${successCount !== 1 ? 's' : ''}!`);
        openStudentsView(); // Return to main student list
    } else if (successCount > 0 && errorCount > 0) {
        showSuccessToast(`⚠️ Imported ${successCount} students with ${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    } else {
        showSuccessToast(`❌ Failed to import. All ${errorCount} record${errorCount !== 1 ? 's' : ''} had errors.`);
    }
}

function generateUsername(firstName, lastName, index) {
    // Generate username like: john.smith123
    const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // If username exists, append number
    while (userAccounts[username.toLowerCase()]) {
        username = baseUsername + counter;
        counter++;
    }
    
    return username;
}

function generatePassword() {
    // Generate random password: 8 chars (uppercase, lowercase, number, special char)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/* =========================================
   ACADEMIC SETUP - ADMIN DASHBOARD
   ========================================= */

/**
 * Setup Enter key for form submission
 */
function setupFormEnterKey(callbackName) {
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], select');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (window[callbackName] && typeof window[callbackName] === 'function') {
                    window[callbackName]();
                }
            }
        });
    });
}

/**
 * Setup Enter key listeners for academic input fields
 */
function setupAcademicInputListeners() {
    const inputFields = [
        { id: 'add-cluster-input', action: 'cluster' },
        { id: 'add-strand-input', action: 'strand' },
        { id: 'add-section-input', action: 'section' }
    ];
    
    inputFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewOption(field.action);
                }
            });
        }
    });
    
    // Separate handler for subject input in Subjects tab
    const subjectInput = document.getElementById('add-subject-input');
    if (subjectInput) {
        subjectInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addSubjectToSelection();
            }
        });
    }
}

export function openAcademicSetup() {
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Academic Structure Setup";

    // Track navigation history
    pushNavigation('Academic Setup', openAcademicSetup);

    appContainer.innerHTML = '';
    
    const c = getClusters();
    const subjects = getAvailableSubjects();
    
    let html = `
        <div style="padding-top: 20px; width: 100%;">
        <div style="width: 95%; max-width: 1000px; margin: 0 auto 20px;">
            <button type="button" class="nav-pill" onclick="goBack()">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>
        <div class="academic-setup-container">
            <!-- TAB NAVIGATION -->
            <div class="academic-tabs-nav">
                <button class="academic-tab-btn active" onclick="switchAcademicTab('clusters')">
                    <i class="fas fa-layer-group"></i> Clusters
                </button>
                <button class="academic-tab-btn" onclick="switchAcademicTab('strands')">
                    <i class="fas fa-stream"></i> Strands
                </button>
                <button class="academic-tab-btn" onclick="switchAcademicTab('sections')">
                    <i class="fas fa-th-list"></i> Sections
                </button>
                <button class="academic-tab-btn" onclick="switchAcademicTab('subjects')">
                    <i class="fas fa-book"></i> Subjects
                </button>
            </div>
            
            <!-- TAB CONTENT -->
            <div class="academic-tabs-content">
                
                <!-- CLUSTERS TAB -->
                <div id="clusters-tab" class="academic-tab-pane active">
                    <div class="academic-content-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: var(--au-blue);"><i class="fas fa-layer-group"></i> Manage Clusters</h2>
                            <div class="view-toggle-group">
                                <button class="view-toggle-btn active" onclick="toggleViewMode('cluster', 'badge')" title="Badge View">
                                    <i class="fas fa-tag"></i>
                                </button>
                                <button class="view-toggle-btn" onclick="toggleViewMode('cluster', 'list')" title="List View">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Create New Cluster</label>
                                <div class="input-with-btn">
                                    <input type="text" id="add-cluster-input" class="au-input" placeholder="Enter cluster name" style="margin: 0;">
                                    <button class="btn-add-mini" onclick="addNewOption('cluster')">+</button>
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Search Clusters</label>
                                <div class="input-with-btn">
                                    <input type="text" id="cluster-search-input" class="au-input" placeholder="Search..." style="margin: 0;" onkeyup="onSearchChange('cluster')">
                                    <button class="btn-search-mini" onclick="clearSearch('cluster')" title="Clear search">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="cluster-list" class="academic-list-display">
                            <p style="color: #999; margin: 0; font-size: 0.9rem;">
                                <i class="fas fa-info-circle"></i> No clusters created yet
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- STRANDS TAB -->
                <div id="strands-tab" class="academic-tab-pane">
                    <div class="academic-content-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: var(--au-blue);"><i class="fas fa-stream"></i> Manage Strands</h2>
                            <div class="view-toggle-group">
                                <button class="view-toggle-btn active" onclick="toggleViewMode('strand', 'badge')" title="Badge View">
                                    <i class="fas fa-tag"></i>
                                </button>
                                <button class="view-toggle-btn" onclick="toggleViewMode('strand', 'list')" title="List View">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Select Cluster</label>
                            <select id="strand-cluster-select" class="au-input" onchange="updateStrandDisplay()">
                                <option value="">--Choose a cluster--</option>
                            </select>
                        </div>
                        
                        <div id="strand-section" style="display: none;">
                            <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 20px;">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Create New Strand</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="add-strand-input" class="au-input" placeholder="Enter strand name" style="margin: 0;">
                                        <button class="btn-add-mini" onclick="addNewOption('strand')">+</button>
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Search Strands</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="strand-search-input" class="au-input" placeholder="Search..." style="margin: 0;" onkeyup="onSearchChange('strand')">
                                        <button class="btn-search-mini" onclick="clearSearch('strand')" title="Clear search">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="strand-list" class="academic-list-display"></div>
                        </div>
                        
                        <div id="strand-empty-state" class="academic-empty-state">
                            <i class="fas fa-hand-point-up"></i>
                            <p>Select a cluster above to manage strands</p>
                        </div>
                    </div>
                </div>
                
                <!-- SECTIONS TAB -->
                <div id="sections-tab" class="academic-tab-pane">
                    <div class="academic-content-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: var(--au-blue);"><i class="fas fa-th-list"></i> Manage Sections</h2>
                            <div class="view-toggle-group">
                                <button class="view-toggle-btn active" onclick="toggleViewMode('section', 'badge')" title="Badge View">
                                    <i class="fas fa-tag"></i>
                                </button>
                                <button class="view-toggle-btn" onclick="toggleViewMode('section', 'list')" title="List View">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Select Cluster</label>
                                <select id="section-cluster-select" class="au-input" onchange="updateSectionClusterDisplay()" style="margin-bottom: 0;">
                                    <option value="">--Choose a cluster--</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Select Strand</label>
                                <select id="section-strand-select" class="au-input" onchange="updateSectionDisplay()" style="margin-bottom: 0;">
                                    <option value="">--Choose a strand--</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="section-input-section" style="display: none;">
                            <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 20px;">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Create New Section</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="add-section-input" class="au-input" placeholder="Enter section name" style="margin: 0;">
                                        <button class="btn-add-mini" onclick="addNewOption('section')">+</button>
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Search Sections</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="section-search-input" class="au-input" placeholder="Search..." style="margin: 0;" onkeyup="onSearchChange('section')">
                                        <button class="btn-search-mini" onclick="clearSearch('section')" title="Clear search">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="section-list" class="academic-list-display"></div>
                        </div>
                        
                        <div id="section-empty-state" class="academic-empty-state">
                            <i class="fas fa-hand-point-up"></i>
                            <p>Select cluster and strand above to manage sections</p>
                        </div>
                    </div>
                </div>
                
                <!-- SUBJECTS TAB -->
                <div id="subjects-tab" class="academic-tab-pane">
                    <div class="academic-content-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: var(--au-blue);"><i class="fas fa-book"></i> Manage Subjects</h2>
                            <div class="view-toggle-group">
                                <button class="view-toggle-btn active" onclick="toggleViewMode('subject', 'badge')" title="Badge View">
                                    <i class="fas fa-tag"></i>
                                </button>
                                <button class="view-toggle-btn" onclick="toggleViewMode('subject', 'list')" title="List View">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Select Cluster</label>
                                <select id="subject-cluster-select" class="au-input" onchange="window.updateSubjectStrandDisplay()">
                                    <option value="">--Choose a cluster--</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Select Strand</label>
                                <select id="subject-strand-select" class="au-input" onchange="window.updateSubjectsDisplay()">
                                    <option value="">--Choose a strand--</option>
                                </select>
                                <div id="subject-strand-empty" style="display: none; color: #999; font-size: 0.9rem; padding: 10px;">
                                    <i class="fas fa-hand-point-left"></i> Select a cluster first
                                </div>
                            </div>
                        </div>
                        
                        <div id="subject-selection-area" style="display: none;">
                            <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 20px;">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Add Subject to Strand</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="add-subject-input" class="au-input" placeholder="Enter subject name" style="margin: 0;">
                                        <button class="btn-add-mini" onclick="addSubjectToSelection()">+</button>
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label>Search Subjects</label>
                                    <div class="input-with-btn">
                                        <input type="text" id="subject-search-input" class="au-input" placeholder="Search..." style="margin: 0;" onkeyup="onSearchChange('subject')">
                                        <button class="btn-search-mini" onclick="clearSearch('subject')" title="Clear search">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="subjects-display-summary" class="academic-list-display"></div>
                        </div>
                        
                        <div id="subject-empty-prompt" style="text-align: center; color: #999; padding: 40px; font-size: 0.95rem;">
                            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                            <p>Select a Cluster → Strand to manage subjects</p>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    // Initialize displays and event listeners
    setTimeout(() => {
        console.log("🔄 Initializing academic setup displays");

        // make sure any stale search term from previous visits is cleared
        searchTerms.cluster = '';
        searchTerms.strand = '';
        searchTerms.section = '';
        searchTerms.subject = '';
        ['cluster','strand','section','subject'].forEach(type => {
            const inp = document.getElementById(type + '-search-input');
            if (inp) inp.value = '';
        });

        populateClusterDropdown();
        updateStrandClusterDropdowns();
        populateSubjectCheckboxList();
        window.updateClusterList();
        window.updateSubjectsDisplay();
        setupAcademicInputListeners();
        // Populate subject cluster dropdown
        const subjectClusterSelect = document.getElementById('subject-cluster-select');
        if (subjectClusterSelect) {
            const c = getClusters();
            const clusters = Object.keys(c);
            clusters.forEach(cluster => {
                const opt = document.createElement('option');
                opt.value = cluster;
                opt.textContent = cluster;
                subjectClusterSelect.appendChild(opt);
            });
            // ensure strand dropdown is in sync in case a cluster was pre-selected
            window.updateSubjectStrandDisplay();
        }
        console.log("✓ All displays initialized");
    }, 150);
}

// Helper function to update strand cluster dropdown
function updateStrandClusterDropdowns() {
    const c = getClusters();
    const strandClusterSelect = document.getElementById('strand-cluster-select');
    const sectionClusterSelect = document.getElementById('section-cluster-select');
    
    if (strandClusterSelect) {
        strandClusterSelect.innerHTML = '<option value="">--Choose a cluster--</option>';
        Object.keys(c).forEach(cluster => {
            const opt = document.createElement('option');
            opt.value = cluster;
            opt.textContent = cluster;
            strandClusterSelect.appendChild(opt);
        });
    }
    
    if (sectionClusterSelect) {
        sectionClusterSelect.innerHTML = '<option value="">--Choose a cluster--</option>';
        Object.keys(c).forEach(cluster => {
            const opt = document.createElement('option');
            opt.value = cluster;
            opt.textContent = cluster;
            sectionClusterSelect.appendChild(opt);
        });
    }
}

// Update strand display when cluster is selected
window.updateStrandDisplay = function(newStrandName = null) {
    const c = getClusters();
    const strandClusterSelect = document.getElementById('strand-cluster-select');
    const strandSection = document.getElementById('strand-section');
    const strandList = document.getElementById('strand-list');
    const strandEmptyState = document.getElementById('strand-empty-state');
    
    if (!strandClusterSelect) return; // Element doesn't exist yet
    
    const selectedCluster = strandClusterSelect.value;
    
    if (!selectedCluster) {
        if (strandSection) strandSection.style.display = 'none';
        if (strandEmptyState) strandEmptyState.style.display = 'block';
        return;
    }
    
    if (strandSection) strandSection.style.display = 'block';
    if (strandEmptyState) strandEmptyState.style.display = 'none';
    
    let strands = Object.keys(c[selectedCluster] || {});
    
    // Apply search filter
    strands = filterBySearch(strands, searchTerms.strand);
    
    if (strandList) {
        if (strands.length > 0) {
            if (viewModes.strand === 'list') {
                // List view
                strandList.innerHTML = renderStrandListView(strands, selectedCluster);
            } else {
                // Badge view (original)
                const strandBadges = strands.map(strand => {
                    const isNew = strand === newStrandName;
                    const className = isNew ? 'cluster-item-new' : '';
                    return `<span class="cluster-badge ${className}" style="display: flex; align-items: center; gap: 6px; padding-right: 8px; ${isNew ? 'animation: fadeInPulse 0.6s ease-out;' : ''}">
                        ${strand}
                        <i class="fas fa-times" style="cursor: pointer; font-size: 0.85rem; opacity: 0.8; transition: opacity 0.2s;" onclick="deleteStrandDirect('${selectedCluster}', '${strand}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Delete ${strand}"></i>
                    </span>`;
                }).join('');
                strandList.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <i class="fas fa-stream"></i>
                        <span style="color: #666; font-size: 0.9rem;"><strong>${strands.length}</strong> strand${strands.length !== 1 ? 's' : ''}</span>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-left: 10px;">
                            ${strandBadges}
                        </div>
                    </div>
                `;
            }
        } else {
            if (searchTerms.strand) {
                strandList.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No strands matching "<strong>${searchTerms.strand}</strong>"</p>`;
            } else {
                strandList.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No strands created yet</p>`;
            }
        }
    }
};

// Update section cluster display
window.updateSectionClusterDisplay = function() {
    const c = getClusters();
    const sectionClusterSelect = document.getElementById('section-cluster-select');
    const sectionStrandSelect = document.getElementById('section-strand-select');
    const selectedCluster = sectionClusterSelect.value;
    
    sectionStrandSelect.innerHTML = '<option value="">--Choose a strand--</option>';
    
    if (selectedCluster && c[selectedCluster]) {
        Object.keys(c[selectedCluster]).forEach(strand => {
            const opt = document.createElement('option');
            opt.value = strand;
            opt.textContent = strand;
            sectionStrandSelect.appendChild(opt);
        });
    }
    
    // Reset sections display when cluster changes
    window.updateSectionDisplay();
};

// Update section display when strand is selected
window.updateSectionDisplay = function(newSectionName = null) {
    const c = getClusters();
    const sectionClusterSelect = document.getElementById('section-cluster-select');
    const sectionStrandSelect = document.getElementById('section-strand-select');
    const sectionInputSection = document.getElementById('section-input-section');
    const sectionList = document.getElementById('section-list');
    const sectionEmptyState = document.getElementById('section-empty-state');
    
    if (!sectionClusterSelect || !sectionStrandSelect) return; // Elements don't exist yet
    
    const selectedCluster = sectionClusterSelect.value;
    const selectedStrand = sectionStrandSelect.value;
    
    if (!selectedCluster || !selectedStrand) {
        if (sectionInputSection) sectionInputSection.style.display = 'none';
        if (sectionEmptyState) sectionEmptyState.style.display = 'block';
        return;
    }
    
    if (sectionInputSection) sectionInputSection.style.display = 'block';
    if (sectionEmptyState) sectionEmptyState.style.display = 'none';
    
    let sections = Object.keys(c[selectedCluster][selectedStrand] || {}).filter(key => 
        key !== 'subjects' && Array.isArray(c[selectedCluster][selectedStrand][key])
    );
    
    // Apply search filter
    sections = filterBySearch(sections, searchTerms.section);
    
    // Populate delete dropdown (without search filter, but still filter by array type)
    const sectionDeleteSelect = document.getElementById('s-section');
    if (sectionDeleteSelect) {
        sectionDeleteSelect.innerHTML = '<option value="">--Select section to delete--</option>';
        Object.keys(c[selectedCluster][selectedStrand] || {}).forEach(section => {
            if (section !== 'subjects' && Array.isArray(c[selectedCluster][selectedStrand][section])) {
                const opt = document.createElement('option');
                opt.value = section;
                opt.textContent = section;
                sectionDeleteSelect.appendChild(opt);
            }
        });
    }
    
    if (sectionList) {
        if (sections.length > 0) {
            if (viewModes.section === 'list') {
                // List view
                sectionList.innerHTML = renderSectionListView(sections, selectedCluster, selectedStrand);
            } else {
                // Badge view (original)
                const sectionBadges = sections.map(section => {
                    const isNew = section === newSectionName;
                    const className = isNew ? 'cluster-item-new' : '';
                    return `<span class="cluster-badge ${className}" style="background: linear-gradient(135deg, #FF9800 0%, #e68900 100%); display: flex; align-items: center; gap: 6px; padding-right: 8px; ${isNew ? 'animation: fadeInPulse 0.6s ease-out;' : ''}">
                        ${section}
                        <i class="fas fa-times" style="cursor: pointer; font-size: 0.85rem; opacity: 0.8; transition: opacity 0.2s;" onclick="deleteSectionDirect('${selectedCluster}', '${selectedStrand}', '${section}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Delete ${section}"></i>
                    </span>`;
                }).join('');
                sectionList.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <i class="fas fa-th-list"></i>
                        <span style="color: #666; font-size: 0.9rem;"><strong>${sections.length}</strong> section${sections.length !== 1 ? 's' : ''}</span>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-left: 10px;">
                            ${sectionBadges}
                        </div>
                    </div>
                `;
            }
        } else {
            if (searchTerms.section) {
                sectionList.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No sections matching "<strong>${searchTerms.section}</strong>"</p>`;
            } else {
                sectionList.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No sections created yet</p>`;
            }
        }
    }
};

// Update cluster list
window.updateClusterList = function(newClusterName = null) {
    // always fetch fresh copy from storage
    let c;
    try {
        c = getClusters() || {};
    } catch (e) {
        console.error('Error retrieving clusters:', e);
        c = {};
    }

    const clusterList = document.getElementById('cluster-list');
    
    if (!clusterList) {
        console.warn("⚠️ cluster-list element not found");
        return;
    }
    
    let clusters = Object.keys(c);
    console.log("📦 Clusters found:", clusters);

    // log if we have a leftover search term that might filter them out
    if (searchTerms.cluster) {
        console.log("🔎 Applying search filter for clusters:", searchTerms.cluster);
    }
    
    // Apply search filter
    clusters = filterBySearch(clusters, searchTerms.cluster);
    
    if (clusters.length > 0) {
        if (viewModes.cluster === 'list') {
            // List view
            clusterList.innerHTML = renderClusterListView(clusters);
        } else {
            // Badge view (original)
            const clusterItems = clusters.map(cluster => {
                const isNew = cluster === newClusterName;
                const className = isNew ? 'cluster-item-new' : '';
                return `<span class="cluster-badge ${className}" style="display: flex; align-items: center; gap: 6px; padding-right: 8px; ${isNew ? 'animation: fadeInPulse 0.6s ease-out;' : ''}">
                    ${cluster}
                    <i class="fas fa-times" style="cursor: pointer; font-size: 0.85rem; opacity: 0.8; transition: opacity 0.2s;" onclick="deleteClusterDirect('${cluster}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Delete ${cluster}"></i>
                </span>`;
            }).join('');
            
            clusterList.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <i class="fas fa-list"></i>
                    <span style="color: #666; font-size: 0.9rem;"><strong>${clusters.length}</strong> cluster${clusters.length !== 1 ? 's' : ''}</span>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-left: 10px;">
                        ${clusterItems}
                    </div>
                </div>
            `;
        }
    } else {
        if (searchTerms.cluster) {
            clusterList.innerHTML = `
                <p style="color: #999; margin: 0; text-align: center; padding: 20px; font-size: 0.9rem;">
                    <i class="fas fa-search"></i> No clusters matching "<strong>${searchTerms.cluster}</strong>"
                </p>
            `;
        } else {
            clusterList.innerHTML = `
                <p style="color: #999; margin: 0; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> No clusters created yet
                </p>
            `;
        }
    }
}

// Display subjects as a summary view in the academic setup
// Update subjects display based on cluster/strand selection
window.updateSubjectStrandDisplay = function() {
    const c = getClusters();
    const clusterSelect = document.getElementById('subject-cluster-select');
    const strandSelect = document.getElementById('subject-strand-select');
    const strandEmpty = document.getElementById('subject-strand-empty');
    const selectedCluster = clusterSelect?.value || '';

    console.log('🔄 updateSubjectStrandDisplay for cluster:', selectedCluster);

    // start fresh
    strandSelect.innerHTML = '<option value="">--Choose a strand--</option>';
    strandSelect.disabled = true;
    strandEmpty.style.display = 'none';

    // always clear the subjects area when cluster changes
    window.updateSubjectsDisplay();

    if (!selectedCluster) {
        strandSelect.style.display = 'none';
        strandEmpty.innerHTML = '<i class="fas fa-hand-point-left"></i> Select a cluster first';
        strandEmpty.style.display = 'block';
        document.getElementById('subject-selection-area').style.display = 'none';
        document.getElementById('subject-empty-prompt').style.display = 'block';
        return;
    }

    // only treat actual strands (ignore any stray 'subjects' property)
    const strands = Object.keys(c[selectedCluster] || {}).filter(k => k !== 'subjects');
    console.log('Found strands:', strands);

    if (strands.length === 0) {
        // no strands available for this cluster
        strandSelect.style.display = 'none';
        strandEmpty.innerHTML = '<i class="fas fa-info-circle"></i> No strands exist for selected cluster';
        strandEmpty.style.display = 'block';
        document.getElementById('subject-selection-area').style.display = 'none';
        document.getElementById('subject-empty-prompt').textContent = 'Please create a strand under this cluster before adding subjects.';
        document.getElementById('subject-empty-prompt').style.display = 'block';
        return;
    }

    // populate dropdown
    strands.forEach(strand => {
        const opt = document.createElement('option');
        opt.value = strand;
        opt.textContent = strand;
        strandSelect.appendChild(opt);
    });

    strandSelect.disabled = false;
    strandSelect.style.display = 'block';
    strandEmpty.style.display = 'none';
    
    // Reset strand selection and hide subjects area
    strandSelect.value = '';
    document.getElementById('subject-selection-area').style.display = 'none';
    document.getElementById('subject-empty-prompt').style.display = 'block';
};

window.addSubjectToSelection = function() {
    const clusterSelect = document.getElementById('subject-cluster-select');
    const strandSelect = document.getElementById('subject-strand-select');
    const inputField = document.getElementById('add-subject-input');
    
    const cluster = clusterSelect.value;
    const strand = strandSelect.value;
    let subjectName = inputField.value.trim();
    
    if (!cluster || !strand) {
        alert('Please select Cluster and Strand first.');
        return;
    }
    
    if (!subjectName) {
        alert('Please enter a subject name.');
        return;
    }
    
    // Convert to Title Case (each word capitalized)
    subjectName = subjectName.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    const c = getClusters();
    
    // Initialize subjects array for this strand if it doesn't exist
    if (!c[cluster][strand].subjects) {
        c[cluster][strand].subjects = [];
    }
    
    // Check if subject already exists (case-insensitive check)
    if (c[cluster][strand].subjects.some(s => s.toLowerCase() === subjectName.toLowerCase())) {
        alert(`"${subjectName}" already exists in this strand.`);
        return;
    }
    
    // Add subject
    c[cluster][strand].subjects.push(subjectName);
    saveClusters();
    
    inputField.value = '';
    window.updateSubjectsDisplay();
    showSuccessToast(`✓ Subject "${subjectName}" added to this strand!`);
};

window.updateSubjectsDisplay = function(newSubjectName = null) {
    const clusterSelect = document.getElementById('subject-cluster-select');
    const strandSelect = document.getElementById('subject-strand-select');
    const displayContainer = document.getElementById('subjects-display-summary');
    const selectionArea = document.getElementById('subject-selection-area');
    const emptyPrompt = document.getElementById('subject-empty-prompt');
    
    const cluster = clusterSelect ? clusterSelect.value : '';
    const strand = strandSelect ? strandSelect.value : '';
    console.log('updateSubjectsDisplay cluster=', cluster, 'strand=', strand);
    
    if (!cluster || !strand) {
        selectionArea.style.display = 'none';
        emptyPrompt.style.display = 'block';
        return;
    }
    
    const c = getClusters();
    
    // Initialize subjects array if it doesn't exist
    if (!c[cluster][strand].subjects) {
        c[cluster][strand].subjects = [];
        saveClusters();
    }
    
    selectionArea.style.display = 'block';
    emptyPrompt.style.display = 'none';
    
    let subjects = (c[cluster][strand].subjects || []).slice();
    
    // Apply search filter
    subjects = filterBySearch(subjects, searchTerms.subject);
    
    if (subjects.length > 0) {
        if (viewModes.subject === 'list') {
            // List view
            displayContainer.innerHTML = renderSubjectListView(subjects, cluster, strand);
        } else {
            // Badge view
            const subjectBadges = subjects.map(sub => {
                const isNew = sub === newSubjectName;
                const className = isNew ? 'cluster-item-new' : '';
                return `<span class="cluster-badge ${className}" style="background: linear-gradient(135deg, #9C27B0 0%, #7b1fa2 100%); ${isNew ? 'animation: fadeInPulse 0.6s ease-out;' : ''} display: flex; align-items: center; gap: 6px; padding-right: 8px;">
                    ${sub}
                    <i class="fas fa-times" style="cursor: pointer; font-size: 0.85rem; opacity: 0.8; transition: opacity 0.2s;" onclick="deleteSubjectFromStrand('${cluster}', '${strand}', '${sub}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Delete ${sub}"></i>
                </span>`;
            }).join('');
            
            displayContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <i class="fas fa-book"></i>
                    <span style="color: #666; font-size: 0.9rem;"><strong>${subjects.length}</strong> subject${subjects.length !== 1 ? 's' : ''}</span>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-left: 10px;">
                        ${subjectBadges}
                    </div>
                </div>
            `;
        }
    } else {
        if (searchTerms.subject) {
            displayContainer.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No subjects matching "<strong>${searchTerms.subject}</strong>"</p>`;
        } else {
            displayContainer.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No subjects assigned to this strand yet</p>`;
        }
    }
};

window.deleteSubjectFromStrand = function(cluster, strand, subjectName) {
    window.showDeleteConfirmation(subjectName, function() {
        const c = getClusters();
        const subjects = c[cluster][strand].subjects || [];
        const index = subjects.indexOf(subjectName);
        
        if (index !== -1) {
            subjects.splice(index, 1);
            saveClusters();
            console.log(`Deleted subject "${subjectName}" from ${cluster} > ${strand}`);
            window.updateSubjectsDisplay();
            showSuccessToast(`✓ "${subjectName}" removed from this strand!`);
        }
    });
};

// Direct delete cluster function
window.deleteClusterDirect = function(clusterName) {
    window.showDeleteConfirmation(clusterName, function() {
        const c = getClusters();
        
        if (c[clusterName]) {
            delete c[clusterName];
            saveClusters();
            console.log(`Deleted cluster: ${clusterName}`);
            
            // Refresh displays
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            updateStrandClusterDropdowns();
            window.updateClusterList();
            window.updateStrandDisplay();
            updateSectionClusterDisplay();
            window.updateSectionDisplay();
            populateStrandCheckboxList();
            populateSubjectCheckboxList();
            showSuccessToast(`✓ "${clusterName}" deleted successfully!`);
        }
    });
};

// Direct delete strand function
window.deleteStrandDirect = function(clusterName, strandName) {
    window.showDeleteConfirmation(strandName, function() {
        const c = getClusters();
        
        if (c[clusterName] && c[clusterName][strandName]) {
            delete c[clusterName][strandName];
            saveClusters();
            console.log(`Deleted strand: ${strandName}`);
            
            // Refresh displays
            updateFormDropdowns('student');
            window.updateStrandDisplay();
            updateSectionClusterDisplay();
            window.updateSectionDisplay();
            populateStrandCheckboxList();
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            showSuccessToast(`✓ "${strandName}" deleted successfully!`);
        }
    });
};

// Direct delete section function
window.deleteSectionDirect = function(clusterName, strandName, sectionName) {
    window.showDeleteConfirmation(sectionName, function() {
        const c = getClusters();
        
        if (c[clusterName] && c[clusterName][strandName] && c[clusterName][strandName][sectionName]) {
            delete c[clusterName][strandName][sectionName];
            saveClusters();
            console.log(`Deleted section: ${sectionName}`);
            
            // Refresh displays
            updateFormDropdowns('student');
            window.updateSectionDisplay();
            populateStrandCheckboxList();
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            showSuccessToast(`✓ "${sectionName}" deleted successfully!`);
        }
    });
};

// EDIT FUNCTIONS FOR ACADEMIC ITEMS
// Edit cluster function
window.openClusterEditModal = async function(clusterName) {
    const newName = await showInputDialog({
        title: 'Edit Cluster Name',
        label: `Current: "${clusterName}"`,
        currentValue: clusterName
    });
    
    if (newName === null) return; // Cancel button
    
    if (!newName.trim()) {
        showDialog({
            type: 'error',
            title: 'Invalid Input',
            message: 'Cluster name cannot be empty',
            confirmText: 'OK'
        });
        return;
    }
    
    // Convert to sentence case (first letter capital, rest lowercase)
    const trimmedNewName = newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1).toLowerCase();
    
    if (trimmedNewName === clusterName) {
        return; // No change
    }
    
    const c = getClusters();
    
    if (c[trimmedNewName]) {
        showDialog({
            type: 'error',
            title: 'Name Already Exists',
            message: `A cluster named "${trimmedNewName}" already exists!`,
            confirmText: 'OK'
        });
        return;
    }
    
    // Rename the cluster
    c[trimmedNewName] = c[clusterName];
    delete c[clusterName];
    saveClusters();
    
    console.log(`Renamed cluster: "${clusterName}" → "${trimmedNewName}"`);
    
    // Refresh displays
    populateClusterDropdown();
    populateTeacherClusterDropdown();
    updateStrandClusterDropdowns();
    window.updateClusterList();
    window.updateStrandDisplay();
    updateSectionClusterDisplay();
    window.updateSectionDisplay();
    populateStrandCheckboxList();
    populateSubjectCheckboxList();
    showSuccessToast(`✓ Cluster renamed to "${trimmedNewName}"`);
};

// Edit strand function
window.openStrandEditModal = async function(clusterName, strandName) {
    const newName = await showInputDialog({
        title: 'Edit Strand Name',
        label: `Current: "${strandName}"`,
        currentValue: strandName
    });
    
    if (newName === null) return; // Cancel button
    
    if (!newName.trim()) {
        showDialog({
            type: 'error',
            title: 'Invalid Input',
            message: 'Strand name cannot be empty',
            confirmText: 'OK'
        });
        return;
    }
    
    // Convert strand name to uppercase
    const trimmedNewName = newName.trim().toUpperCase();
    
    if (trimmedNewName === strandName) {
        return; // No change
    }
    
    const c = getClusters();
    
    if (c[clusterName] && c[clusterName][trimmedNewName]) {
        showDialog({
            type: 'error',
            title: 'Name Already Exists',
            message: `A strand named "${trimmedNewName}" already exists in this cluster!`,
            confirmText: 'OK'
        });
        return;
    }
    
    // Rename the strand
    c[clusterName][trimmedNewName] = c[clusterName][strandName];
    delete c[clusterName][strandName];
    saveClusters();
    
    console.log(`Renamed strand: "${strandName}" → "${trimmedNewName}"`);
    
    // Refresh displays
    updateFormDropdowns('student');
    window.updateStrandDisplay();
    updateSectionClusterDisplay();
    window.updateSectionDisplay();
    populateStrandCheckboxList();
    populateClusterDropdown();
    populateTeacherClusterDropdown();
    showSuccessToast(`✓ Strand renamed to "${trimmedNewName}"`);
};

// Edit section function
window.openSectionEditModal = async function(clusterName, strandName, sectionName) {
    const newName = await showInputDialog({
        title: 'Edit Section Name',
        label: `Current: "${sectionName}"`,
        currentValue: sectionName
    });
    
    if (newName === null) return; // Cancel button
    
    if (!newName.trim()) {
        showDialog({
            type: 'error',
            title: 'Invalid Input',
            message: 'Section name cannot be empty',
            confirmText: 'OK'
        });
        return;
    }
    
    // Convert to title case (each word capitalized, or if starts with digit then digit+Capital like 1A)
    const trimmedNewName = newName.trim().split(' ').map(word => {
        // If first character is a digit, keep it and capitalize the next character
        if (/^\d/.test(word)) {
            return word.charAt(0) + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
        } else {
            // Normal title case
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }).join(' ');
    
    if (trimmedNewName === sectionName) {
        return; // No change
    }
    
    const c = getClusters();
    
    if (c[clusterName] && c[clusterName][strandName] && c[clusterName][strandName][trimmedNewName]) {
        showDialog({
            type: 'error',
            title: 'Name Already Exists',
            message: `A section named "${trimmedNewName}" already exists in this strand!`,
            confirmText: 'OK'
        });
        return;
    }
    
    // Rename the section
    c[clusterName][strandName][trimmedNewName] = c[clusterName][strandName][sectionName];
    delete c[clusterName][strandName][sectionName];
    saveClusters();
    
    console.log(`Renamed section: "${sectionName}" → "${trimmedNewName}"`);
    
    // Refresh displays
    updateFormDropdowns('student');
    window.updateSectionDisplay();
    populateStrandCheckboxList();
    populateClusterDropdown();
    populateTeacherClusterDropdown();
    showSuccessToast(`✓ Section renamed to "${trimmedNewName}"`);
};

// Edit subject function
window.openSubjectEditModal = async function(subjectName) {
    const newName = await showInputDialog({
        title: 'Edit Subject Name',
        label: `Current: "${subjectName}"`,
        currentValue: subjectName
    });
    
    if (newName === null) return; // Cancel button
    
    if (!newName.trim()) {
        showDialog({
            type: 'error',
            title: 'Invalid Input',
            message: 'Subject name cannot be empty',
            confirmText: 'OK'
        });
        return;
    }
    
    // Convert to title case (each word capitalized)
    const trimmedNewName = newName.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    if (trimmedNewName === subjectName) {
        return; // No change
    }
    
    const subjects = getAvailableSubjects();
    
    if (subjects.includes(trimmedNewName)) {
        showDialog({
            type: 'error',
            title: 'Name Already Exists',
            message: `A subject named "${trimmedNewName}" already exists!`,
            confirmText: 'OK'
        });
        return;
    }
    
    // Rename the subject
    const index = subjects.indexOf(subjectName);
    if (index !== -1) {
        subjects[index] = trimmedNewName;
        saveSubjects();
        
        console.log(`Renamed subject: "${subjectName}" → "${trimmedNewName}"`);
        
        // Refresh displays
        populateSubjectCheckboxList();
        window.updateSubjectsDisplay();
        populateClusterDropdown();
        populateTeacherClusterDropdown();
        populateStrandCheckboxList();
        showSuccessToast(`✓ Subject renamed to "${trimmedNewName}"`);
    }
};

// Tab switching function for academic setup
window.switchAcademicTab = function(tabName) {
    console.log("🔄 Switching to tab:", tabName);
    
    // Hide all tabs
    const allTabs = document.querySelectorAll('.academic-tab-pane');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.academic-tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log("✓ Tab activated:", tabName);
    } else {
        console.error("❌ Tab not found:", tabName + '-tab');
        return;
    }
    
    // Add active class to the button that was clicked
    if (event && event.target) {
        const btn = event.target.closest('.academic-tab-btn');
        if (btn) {
            btn.classList.add('active');
        }
    }
    
    // Refresh displays for the current tab
    setTimeout(() => {
        if (tabName === 'clusters') {
            window.updateClusterList();
        } else if (tabName === 'strands') {
            window.updateStrandDisplay();
        } else if (tabName === 'sections') {
            window.updateSectionDisplay();
        } else if (tabName === 'subjects') {
            populateSubjectCheckboxList();
            window.updateSubjectsDisplay();
        }
    }, 50);
};

// Toggle between badge and list view modes
window.toggleViewMode = function(type, mode) {
    viewModes[type] = mode;
    
    // Update button states
    const buttons = event.target.closest('.view-toggle-group').querySelectorAll('.view-toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-toggle-btn').classList.add('active');
    
    // Re-render the list with the new view mode
    if (type === 'cluster') {
        window.updateClusterList();
    } else if (type === 'strand') {
        window.updateStrandDisplay();
    } else if (type === 'section') {
        window.updateSectionDisplay();
    } else if (type === 'subject') {
        window.updateSubjectsDisplay();
    }
};

// Search functionality
window.onSearchChange = function(type) {
    const searchInput = document.getElementById(type + '-search-input');
    if (searchInput) {
        searchTerms[type] = searchInput.value.toLowerCase().trim();
        
        // Re-render with search filter
        if (type === 'cluster') {
            window.updateClusterList();
        } else if (type === 'strand') {
            window.updateStrandDisplay();
        } else if (type === 'section') {
            window.updateSectionDisplay();
        } else if (type === 'subject') {
            window.updateSubjectsDisplay();
        }
    }
};

// Clear search function
window.clearSearch = function(type) {
    searchTerms[type] = '';
    const searchInput = document.getElementById(type + '-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Re-render without search filter
    if (type === 'cluster') {
        window.updateClusterList();
    } else if (type === 'strand') {
        window.updateStrandDisplay();
    } else if (type === 'section') {
        window.updateSectionDisplay();
    } else if (type === 'subject') {
        window.updateSubjectsDisplay();
    }
};

// Filter function - applies search term to an array
function filterBySearch(items, searchTerm) {
    if (!searchTerm) return items;
    return items.filter(item => item.toLowerCase().includes(searchTerm));
}

// Render list view for clusters
function renderClusterListView(clusters) {
    if (clusters.length === 0) {
        if (searchTerms.cluster) {
            return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No clusters matching "<strong>${searchTerms.cluster}</strong>"</p>`;
        }
        return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No clusters created yet</p>`;
    }
    
    let html = `
        <table class="academic-list-table">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600;">
                        <i class="fas fa-layer-group"></i> Cluster Name
                    </th>
                    <th style="text-align: center; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600; width: 140px;">
                        <i class="fas fa-cog"></i> Actions
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    clusters.forEach(cluster => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">${cluster}</td>
                <td style="text-align: center; padding: 12px; display: flex; gap: 6px; justify-content: center;">
                    <button class="btn-edit-mini" onclick="openClusterEditModal('${cluster}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-mini" onclick="deleteClusterDirect('${cluster}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Render list view for strands
function renderStrandListView(strands, clusterName) {
    if (strands.length === 0) {
        if (searchTerms.strand) {
            return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No strands matching "<strong>${searchTerms.strand}</strong>"</p>`;
        }
        return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No strands created for this cluster</p>`;
    }
    
    let html = `
        <table class="academic-list-table">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600;">
                        <i class="fas fa-stream"></i> Strand Name
                    </th>
                    <th style="text-align: center; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600; width: 140px;">
                        <i class="fas fa-cog"></i> Actions
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    strands.forEach(strand => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">${strand}</td>
                <td style="text-align: center; padding: 12px; display: flex; gap: 6px; justify-content: center;">
                    <button class="btn-edit-mini" onclick="openStrandEditModal('${clusterName}', '${strand}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-mini" onclick="deleteStrandDirect('${clusterName}', '${strand}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Render list view for sections
function renderSectionListView(sections, clusterName, strandName) {
    if (sections.length === 0) {
        if (searchTerms.section) {
            return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No sections matching "<strong>${searchTerms.section}</strong>"</p>`;
        }
        return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No sections created for this strand</p>`;
    }
    
    let html = `
        <table class="academic-list-table">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600;">
                        <i class="fas fa-th-list"></i> Section Name
                    </th>
                    <th style="text-align: center; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600; width: 140px;">
                        <i class="fas fa-cog"></i> Actions
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sections.forEach(section => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">${section}</td>
                <td style="text-align: center; padding: 12px; display: flex; gap: 6px; justify-content: center;">
                    <button class="btn-edit-mini" onclick="openSectionEditModal('${clusterName}', '${strandName}', '${section}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-mini" onclick="deleteSectionDirect('${clusterName}', '${strandName}', '${section}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Render list view for subjects
function renderSubjectListView(subjects, cluster = '', strand = '') {
    if (subjects.length === 0) {
        if (searchTerms.subject) {
            return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-search"></i> No subjects matching "<strong>${searchTerms.subject}</strong>"</p>`;
        }
        return `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No subjects assigned yet</p>`;
    }
    
    let html = `
        <table class="academic-list-table">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600;">
                        <i class="fas fa-book"></i> Subject Name
                    </th>
                    <th style="text-align: center; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--au-blue); font-weight: 600; width: 140px;">
                        <i class="fas fa-cog"></i> Actions
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    subjects.forEach(subject => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">${subject}</td>
                <td style="text-align: center; padding: 12px; display: flex; gap: 6px; justify-content: center;">
                    <button class="btn-delete-mini" onclick="deleteSubjectFromStrand('${cluster}', '${strand}', '${subject}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

/* =========================================
   1. CREATE ACCOUNT FLOW (NEW STEP-BY-STEP)
   ========================================= */

// ENTRY POINT: Opens the Selection Screen (Student vs Teacher)
export function openCreateAccountView() {
    // 1. Update Title
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Select Account Type";

    // Track navigation history so Back returns to previous page (e.g., Dashboard)
    pushNavigation('Create Account', openCreateAccountView);

    // 2. Load Selection Template
    appContainer.innerHTML = '';
    const template = document.getElementById('account-selection-view');
    if (!template) return alert("Template 'account-selection-view' is missing in HTML.");
    appContainer.appendChild(template.content.cloneNode(true));
}

// OPTION A: Open Student Registration Form
export function openStudentRegistration() {
    // push navigation stack so back button works
    pushNavigation('Register New Student', openStudentRegistration);

    appContainer.innerHTML = '';
    const template = document.getElementById('create-student-view');
    if (!template) return alert("Template 'create-student-view' is missing.");
    appContainer.appendChild(template.content.cloneNode(true));

    // Initialize dropdowns and other elements once DOM is ready
    setTimeout(() => {
        populateClusterDropdown();           // cluster list for students
        populateAllGenderDropdowns();         // fill gender options
        setupFormEnterKey('saveStudentAccount');
        initializeSentenceCaseInputs();
        initializeTitleCaseInputs();

        // Attach listeners to fields that affect the summary
        const summaryFields = [
            's-fname','s-mname','s-lname','s-bday','s-age',
            's-gender','s-address','s-cluster','s-username','s-password'
        ];
        summaryFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updateStudentCompleteSummary);
                el.addEventListener('input', updateStudentCompleteSummary);
            }
        });

        // Auto-populate username field when LRN is entered
        const lrnField = document.getElementById('s-lrn');
        const usernameField = document.getElementById('s-username');
        if (lrnField && usernameField) {
            lrnField.addEventListener('input', function() {
                // Only allow numbers
                this.value = this.value.replace(/[^0-9]/g, '');
                // Limit to 30 characters
                if (this.value.length > 30) {
                    this.value = this.value.slice(0, 30);
                }
                usernameField.value = this.value;
                updateStudentCompleteSummary();
            });
        }

        // call initial summary update
        setTimeout(() => updateStudentCompleteSummary(), 50);
        console.log('✅ Student registration page initialized');
    }, 200);

    // initialize date picker styling
    setTimeout(() => initializeDateInputs(), 100);
}

// OPTION B: Open Teacher Registration Form
export function openTeacherRegistration() {
    pushNavigation('Register New Teacher', openTeacherRegistration);

    appContainer.innerHTML = '';
    const template = document.getElementById('create-teacher-view');
    if (!template) return alert("Template 'create-teacher-view' is missing.");
    appContainer.appendChild(template.content.cloneNode(true));
    
    // Initialize Teacher Dropdowns and Checkboxes after DOM is ready
    setTimeout(() => {
        populateTeacherClusterDropdown();
        populateAllGenderDropdowns();
        populateTeacherStrandSectionsUI();
        populateTeacherSubjectsForCluster();
        setupFormEnterKey('saveTeacherAccount');
        initializeSentenceCaseInputs();
        initializeTitleCaseInputs();
        
        // Add onchange handlers to update summary
        document.getElementById('t-fname')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-fname')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-mname')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-mname')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-lname')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-lname')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-bday')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-age')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-age')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-gender')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-address')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-address')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-cluster')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-username')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-username')?.addEventListener('input', updateTeacherCompleteSummary);
        document.getElementById('t-password')?.addEventListener('change', updateTeacherCompleteSummary);
        document.getElementById('t-password')?.addEventListener('input', updateTeacherCompleteSummary);
        
        // Add handlers to strand checkboxes
        setTimeout(() => {
            document.querySelectorAll('.teacher-strand-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateTeacherCompleteSummary);
            });
        }, 100);
        
        // Add handlers to subject checkboxes
        setTimeout(() => {
            document.querySelectorAll('.teacher-subject-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateTeacherCompleteSummary);
            });
        }, 100);
        
        // Call initial summary update
        setTimeout(() => updateTeacherCompleteSummary(), 50);
        
        console.log('✅ Teacher registration page initialized');
    }, 200);
    
    // Initialize date inputs
    setTimeout(() => initializeDateInputs(), 100);
}

// SHORTCUT: Used by "Back" buttons in forms to return to selection
export function openAccountSelection() {
    openCreateAccountView();
}

// --- POPULATION HELPERS ---

export function populateClusterDropdown() {
    const sCluster = document.getElementById('s-cluster');
    if(!sCluster) {
        console.log("ℹ️ s-cluster element not found (not in student registration view)");
        return;
    }
    sCluster.innerHTML = '<option value="">--Select Cluster--</option>';
    
    const c = getClusters();
    console.log("Clusters available:", c);
    
    if (!c || Object.keys(c).length === 0) {
        // Keep the placeholder
        return;
    }
    
    // Get list of clusters to display
    let clustersToShow = Object.keys(c);
    
    // If current user is a teacher, filter to only clusters containing their assigned strands
    const currentUser = getCurrentUser();
    console.log('populateClusterDropdown - Current user:', currentUser);
    if (currentUser && userAccounts[currentUser] && userAccounts[currentUser].role === 'teacher') {
        const teacherData = userAccounts[currentUser];
        console.log('Teacher data:', teacherData);
        console.log('Assigned strands:', Object.keys(teacherData.assignedStrandSections || {}));
        if (teacherData.assignedStrandSections) {
            const assignedStrands = Object.keys(teacherData.assignedStrandSections);
            console.log('Filtering clusters for assigned strands:', assignedStrands);
            clustersToShow = clustersToShow.filter(clusterName => {
                // Check if this cluster has any of the teacher's assigned strands
                const hasStrand = assignedStrands.some(strand => c[clusterName] && c[clusterName][strand]);
                console.log(`Cluster ${clusterName}: ${hasStrand ? 'has' : 'does not have'} assigned strands`);
                return hasStrand;
            });
            console.log("Filtered clusters:", clustersToShow);
        }
    }
    
    clustersToShow.forEach(clusterName => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = clusterName;
        sCluster.appendChild(opt);
    });
    // Trigger update for Strands
    updateFormDropdowns('student');
}

export function populateTeacherClusterDropdown() {
    const tCluster = document.getElementById('t-cluster');
    if(!tCluster) {
        console.log("ℹ️ t-cluster element not found (not in teacher view)");
        return;
    }
    tCluster.innerHTML = '<option value="">--Select Cluster--</option>';
    
    const c = getClusters();
    console.log("Teacher clusters available:", c);
    
    if (!c || Object.keys(c).length === 0) {
        return; // Keep the default message
    }
    
    Object.keys(c).forEach(clusterName => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = clusterName;
        tCluster.appendChild(opt);
    });
}

export function updateFormDropdowns(type) {
    // Only runs if we are in the Student Form
    const sCluster = document.getElementById('s-cluster');
    if (!sCluster) return; 

    const clusterVal = sCluster.value;
    const strandSel = document.getElementById('s-strand');
    const sectionSel = document.getElementById('s-section');
    
    // Exit early if we're not in a form context (e.g., in academic setup)
    if (!strandSel || !sectionSel) return;

    // Save current selection if possible
    const currentStrand = strandSel.value;
    const c = getClusters();

    console.log("updateFormDropdowns called for:", type);
    console.log("Current cluster value:", clusterVal);
    console.log("Current strand value:", currentStrand);
    console.log("Clusters data:", c);

    strandSel.innerHTML = '';
    sectionSel.innerHTML = '';

    if (clusterVal && c[clusterVal]) {
        // Get list of strands to display
        let strandsToShow = Object.keys(c[clusterVal]);
        
        // If current user is a teacher, filter to only their assigned strands
        const currentUser = getCurrentUser();
        if (currentUser && userAccounts[currentUser] && userAccounts[currentUser].role === 'teacher') {
            const teacherData = userAccounts[currentUser];
            if (teacherData.assignedStrandSections) {
                const assignedStrands = Object.keys(teacherData.assignedStrandSections);
                strandsToShow = strandsToShow.filter(s => assignedStrands.includes(s));
                console.log("Teacher assigned strands:", assignedStrands);
                console.log("Filtered strands to show:", strandsToShow);
            }
        }
        
        strandsToShow.forEach(s => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = s;
            strandSel.appendChild(opt);
        });
        
        // Auto-select logic
        const targetStrand = (currentStrand && c[clusterVal][currentStrand]) ? currentStrand : strandsToShow[0];
        
        if (targetStrand) {
            strandSel.value = targetStrand;
            if (c[clusterVal][targetStrand]) {
                console.log("Sections for strand", targetStrand, ":", Object.keys(c[clusterVal][targetStrand]).filter(key => key !== 'subjects'));
                Object.keys(c[clusterVal][targetStrand]).filter(key => key !== 'subjects').forEach(sec => {
                    const opt = document.createElement('option');
                    opt.value = opt.textContent = sec;
                    sectionSel.appendChild(opt);
                });
            }
        }
    }
}

export function populateStrandCheckboxList() {
    const list = document.getElementById('t-strands-list');
    if (!list) return; // Only runs if Teacher Form is open
    list.innerHTML = '';

    // Gather all unique strands from all clusters
    let allStrands = new Set();
    const c = getClusters();
    Object.values(c).forEach(clusterObj => {
        Object.keys(clusterObj).forEach(strand => allStrands.add(strand));
    });

    if(allStrands.size === 0) {
        list.innerHTML = '<span style="font-size:0.9rem; color:#888;">No strands available. Add one via Student Form or "+" button.</span>';
    }

    allStrands.forEach(strand => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `<label><input type="checkbox" value="${strand}"> ${strand}</label>`;
        list.appendChild(div);
    });
}

export function populateSubjectCheckboxList() {
    const list = document.getElementById('t-subjects-list');
    if (!list) return; // Only runs if Teacher Form or Academic Setup is open
    list.innerHTML = '';

    const subjects = getAvailableSubjects();
    
    // Check if we're in academic setup (class='academic-checkbox-list') or teacher registration
    const isAcademicSetup = list.classList.contains('academic-checkbox-list');
    
    if (isAcademicSetup) {
        // Display as checkboxes for deletion in academic setup
        if (subjects.length > 0) {
            subjects.forEach(sub => {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                div.innerHTML = `<label><input type="checkbox" value="${sub}"> ${sub}</label>`;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = `<p style="color: #999; text-align: center; padding: 20px; margin: 0;"><i class="fas fa-inbox"></i> No subjects created yet</p>`;
        }
    } else {
        // Display as checkboxes for teacher registration
        subjects.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `<label><input type="checkbox" value="${sub}"> ${sub}</label>`;
            list.appendChild(div);
        });
    }
}

export function populateAllGenderDropdowns() {
    const genders = getAvailableGenders();
    console.log('🎯 populateAllGenderDropdowns called with genders:', genders);
    console.log('genders array length:', genders.length);
    console.log('genders array content:', JSON.stringify(genders));
    
    const sGender = document.getElementById('s-gender');
    const tGender = document.getElementById('t-gender');
    const taGender = document.getElementById('ta-gender');
    
    console.log('🔍 Found s-gender:', sGender !== null);
    console.log('🔍 Found t-gender:', tGender !== null);
    console.log('🔍 Found ta-gender:', taGender !== null);
    
    const currentSGenderValue = sGender ? sGender.value : null;
    const currentTGenderValue = tGender ? tGender.value : null;
    const currentTaGenderValue = taGender ? taGender.value : null;
    
    if (sGender) {
        console.log('📝 Updating s-gender dropdown with', genders.length, 'genders');
        sGender.innerHTML = '';
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            sGender.appendChild(opt);
        });
        if (currentSGenderValue) sGender.value = currentSGenderValue;
        console.log('✅ s-gender dropdown updated, options count:', sGender.options.length);
    }
    
    if (tGender) {
        console.log('📝 Updating t-gender dropdown');
        tGender.innerHTML = '';
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            tGender.appendChild(opt);
        });
        if (currentTGenderValue) tGender.value = currentTGenderValue;
        console.log('✅ t-gender dropdown updated, options count:', tGender.options.length);
    }
    
    if (taGender) {
        console.log('📝 Updating ta-gender dropdown');
        taGender.innerHTML = '';
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            taGender.appendChild(opt);
        });
        if (currentTaGenderValue) taGender.value = currentTaGenderValue;
        console.log('✅ ta-gender dropdown updated, options count:', taGender.options.length);
    }
}

// --- ADD NEW (+) LOGIC ---

export function addNewOption(category) {
    // Get input from the appropriate field based on category
    let newVal = '';
    let inputElement = null;
    
    if (category === 'cluster') {
        inputElement = document.getElementById('add-cluster-input');
    } else if (category === 'strand') {
        inputElement = document.getElementById('add-strand-input');
    } else if (category === 'section') {
        inputElement = document.getElementById('add-section-input');
    } else if (category === 'subject') {
        inputElement = document.getElementById('add-subject-input');
    }
    
    // If in academic setup and input field exists, use it
    if (inputElement && inputElement.value.trim()) {
        newVal = inputElement.value;
        processAddOption(category, newVal, inputElement);
    } else if (!inputElement) {
        // Fallback for other contexts (like registration forms) - use custom dialog
        showCustomDialog(
            `Enter new ${category} name:`,
            category,
            (value) => processAddOption(category, value, null)
        );
    } else {
        showSuccessToast(`⚠️ Please enter a ${category} name.`);
        return;
    }
}

function processAddOption(category, newVal, inputElement) {
    if (!newVal || newVal.trim() === "") {
        showSuccessToast(`⚠️ Please enter a ${category} name.`);
        return;
    }

    console.log('processAddOption called with category:', category, 'newVal:', newVal);

    // Convert formatting based on category
    // Strands: UPPERCASE
    // Sections: Title Case (each word capitalized, or if starts with digit then digit+Capital like 1A)
    // Others: Sentence case (first letter capital, rest lowercase)
    const trimmed = newVal.trim();
    let val;
    if (category === 'strand') {
        val = trimmed.toUpperCase();
    } else if (category === 'section') {
        val = trimmed.split(' ').map(word => {
            // If first character is a digit, keep it and capitalize the next character
            if (/^\d/.test(word)) {
                return word.charAt(0) + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
            } else {
                // Normal title case
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
        }).join(' ');
    } else {
        val = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }
    const c = getClusters();

    // 1. ADD CLUSTER
    if (category === 'cluster') {
        if (!c[val]) {
            c[val] = {};
            saveClusters();
            populateClusterDropdown(); 
            populateTeacherClusterDropdown();
            updateStrandClusterDropdowns();
            populateStrandCheckboxList();
            updateClusterList(val); // Pass new cluster name for highlighting
            // UPDATE SUBJECT CLUSTER DROPDOWN
            const subjectClusterSelect = document.getElementById('subject-cluster-select');
            if (subjectClusterSelect) {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                subjectClusterSelect.appendChild(opt);
            }
            showSuccessToast(`✓ Cluster "${val}" created successfully!`);
            if (inputElement) inputElement.value = '';
        } else {
            alert("Cluster already exists.");
        }
    } 
    // 2. ADD STRAND
    else if (category === 'strand') {
        // Check if in academic setup (has strand-cluster-select) or in student registration (has s-cluster)
        const strandClusterSelect = document.getElementById('strand-cluster-select');
        const sCluster = document.getElementById('s-cluster');
        const taCluster = document.getElementById('ta-cluster');
        
        let currentCluster = '';
        
        if (strandClusterSelect && strandClusterSelect.value) {
            // Academic setup mode
            currentCluster = strandClusterSelect.value;
        } else if (sCluster && sCluster.value) {
            // Student registration mode
            currentCluster = sCluster.value;
        } else if (taCluster && taCluster.value) {
            // Teacher add student mode
            currentCluster = taCluster.value;
        } else {
            alert("Please select a cluster first.");
            return;
        }
        
        if (!c[currentCluster][val]) {
            c[currentCluster][val] = {}; 
            saveClusters();
            updateFormDropdowns('student');
            window.updateStrandDisplay(val);
            populateStrandCheckboxList(); 
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            updateSectionClusterDisplay();
            populateTeacherAddStudentStrands();

            // if we're viewing subjects and the cluster matches, refresh its strand list
            if (document.getElementById('subject-cluster-select')?.value === currentCluster) {
                window.updateSubjectStrandDisplay();
            }

            showSuccessToast(`✓ Strand "${val}" created successfully!`);
            if (inputElement) inputElement.value = '';
        } else {
            alert("Strand already exists in this cluster.");
        }
    } 
    // 3. ADD SECTION
    else if (category === 'section') {
        // Check if in academic setup or student registration
        const sectionClusterSelect = document.getElementById('section-cluster-select');
        const sectionStrandSelect = document.getElementById('section-strand-select');
        const sCluster = document.getElementById('s-cluster');
        const sStrand = document.getElementById('s-strand');
        
        let currentCluster = '';
        let currentStrand = '';
        
        if (sectionClusterSelect && sectionStrandSelect && sectionClusterSelect.value && sectionStrandSelect.value) {
            // Academic setup mode
            currentCluster = sectionClusterSelect.value;
            currentStrand = sectionStrandSelect.value;
        } else if (sCluster && sStrand && sCluster.value && sStrand.value) {
            // Student registration mode
            currentCluster = sCluster.value;
            currentStrand = sStrand.value;
        } else {
            alert("Please select Cluster and Strand first.");
            return;
        }
        
        if (!c[currentCluster][currentStrand][val]) {
            c[currentCluster][currentStrand][val] = []; // Section is an array of students
            saveClusters();
            updateFormDropdowns('student');
            window.updateSectionDisplay(val);
            populateStrandCheckboxList(); 
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            showSuccessToast(`✓ Section "${val}" created successfully!`);
            if (inputElement) inputElement.value = '';
        } else {
            alert("Section already exists in this strand.");
        }
    }
    // 4. ADD SUBJECT
    else if (category === 'subject') {
        const val_upper = val;
        const subjects = getAvailableSubjects();
        if (!subjects.includes(val_upper)) {
            subjects.push(val_upper);
            saveSubjects();
            populateSubjectCheckboxList();
            window.updateSubjectsDisplay(val_upper);
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            populateStrandCheckboxList();
            updateTeacherAddStudentSubjects();
            showSuccessToast(`✓ Subject "${val}" created successfully!`);
            if (inputElement) inputElement.value = '';
        } else {
            alert("Subject already exists.");
        }
    }
    // 5. ADD GENDER
    else if (category === 'gender') {
        console.log('🎨 Adding gender:', val);
        const genders = getAvailableGenders();
        console.log('📋 Available genders before adding:', genders);
        
        // Check if gender already exists
        if (!genders.includes(val)) {
            genders.push(val);
            console.log('📋 Available genders after adding:', genders);
            saveGenders();
            console.log('💾 Genders saved to localStorage');
            
            // Force reload genders to ensure we have the latest
            const updatedGenders = getAvailableGenders();
            console.log('📋 Genders after reload:', updatedGenders);
            
            populateAllGenderDropdowns();
            const taGenderSelect = document.getElementById('ta-gender');
            if (taGenderSelect) {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                taGenderSelect.appendChild(opt);
            }
            console.log('🔄 Gender dropdowns populated');
            showSuccessToast(`✓ Gender "${val}" added successfully!`);
        } else {
            showSuccessToast(`⚠️ Gender option already exists.`);
        }
    }
}

// --- SAVE FUNCTIONS (SEPARATED) ---

export function saveStudentAccount() {
    const fname = document.getElementById('s-fname').value.trim();
    const mname = document.getElementById('s-mname').value.trim();
    const lname = document.getElementById('s-lname').value.trim();
    const bday = document.getElementById('s-bday').value;
    const age = document.getElementById('s-age').value;
    const gender = document.getElementById('s-gender').value;
    const lrn = document.getElementById('s-lrn').value.trim();
    const studentNumber = document.getElementById('s-student-number').value.trim();
    const address = document.getElementById('s-address').value.trim();
    const cluster = document.getElementById('s-cluster').value;
    const strand = document.getElementById('s-strand').value;
    const section = document.getElementById('s-section').value;
    const user = document.getElementById('s-username').value.trim();
    const pass = document.getElementById('s-password').value;

    if (!fname || !lname || !user || !pass || !cluster || !strand || !section) {
        showSuccessToast("⚠️ Please fill in all required fields.");
        return;
    }

    if (userAccounts[user]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }

    // Get selected subjects
    const selectedSubjects = [];
    document.querySelectorAll('#s-subjects-list input:checked').forEach(cb => {
        selectedSubjects.push(cb.value);
    });

    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }

    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    const newId = "s_" + Date.now();

    // 1. Create Login
    userAccounts[user.toLowerCase()] = {
        password: pass,
        role: "student",
        studentId: newId,
        img: "images/default.svg",
        name: fullName,
        subjects: selectedSubjects,
        strand: strand,
        section: section,
        // New fields
        lrn: lrn,
        studentNumber: studentNumber,
        address: address
    };

    // 2. Create Data Record
    const newStudentObj = {
        id: newId,
        name: fullName,
        firstName: fname, middleName: mname, lastName: lname,
        birthday: bday, gender: gender, img: "images/default.svg",
        subjects: selectedSubjects,
        // New fields
        age: age ? parseInt(age) : null,
        lrn: lrn,
        studentNumber: studentNumber,
        address: address
    };

    // 3. Push to Clusters
    const c = getClusters();
    if (!c[cluster]) c[cluster] = {};
    if (!c[cluster][strand]) c[cluster][strand] = {};
    if (!c[cluster][strand][section]) c[cluster][strand][section] = [];
    
    c[cluster][strand][section].push(newStudentObj);

    saveAccounts();
    saveClusters();
    
    showSuccessToast("✅ Student Account Created Successfully!");
    openStudentsView(); // Return to main list
}

// Create new teacher account
export function saveTeacherAccount() {
    const fname = document.getElementById('t-fname').value.trim();
    const mname = document.getElementById('t-mname').value.trim();
    const lname = document.getElementById('t-lname').value.trim();
    const bday = document.getElementById('t-bday').value;
    const age = document.getElementById('t-age').value;
    const gender = document.getElementById('t-gender').value;
    const address = document.getElementById('t-address').value.trim();
    const cluster = document.getElementById('t-cluster').value;
    const user = document.getElementById('t-username').value.trim();
    const pass = document.getElementById('t-password').value;

    if (!fname || !lname || !user || !pass || !cluster || !gender) {
        showSuccessToast("⚠️ Please fill in all required fields.");
        return;
    }

    if (userAccounts[user.toLowerCase()]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }

    // Get selected strands and sections
    const strandSections = getTeacherStrandSections();
    if (Object.keys(strandSections).length === 0) {
        showSuccessToast("⚠️ Please select at least one strand.");
        return;
    }

    // Get selected subjects
    const selectedSubjects = [];
    document.querySelectorAll('#t-subjects-list input:checked').forEach(cb => {
        selectedSubjects.push(cb.value);
    });

    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }

    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;

    // Create teacher login account
    userAccounts[user.toLowerCase()] = {
        password: pass,
        role: "teacher",
        username: user.toLowerCase(),
        img: "images/default.svg",
        name: fullName,
        birthday: bday,
        gender: gender,
        address: address,
        age: age ? parseInt(age) : null,
        cluster: cluster,
        assignedStrandSections: strandSections,
        assignedSubjects: selectedSubjects
    };

    saveAccounts();
    
    showSuccessToast("✅ Teacher Account Created Successfully!");
    openAdminTeacherSelector(); // Return to teacher list
}


/* =========================================
   2. EXISTING VIEW & GRADING LOGIC (UNCHANGED)
   ========================================= */

export function openStudentsView() {
    const currentUser = getCurrentUser();
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Students";
    
    appContainer.innerHTML = '';
    
    const role = userAccounts[currentUser].role;
    
    // Teacher gets a simplified "Record" view
    if (role === 'teacher') {
        openTeacherRecordView();
    } else if (role === 'admin') {
        // Admin - open admin student selector
        openAdminStudentSelector();
    }
}

// Simplified Record view for teachers: back button, strand & section filters, student list
export function openTeacherRecordView() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const c = getClusters();

    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Records";

    pushNavigation('Records', openTeacherRecordView);

    const html = `
        <div style="padding: 20px; max-width: 1400px; margin: 0 auto;">
            <!-- Back Button -->
            <button onclick="renderApp()" style="margin-bottom: 20px; padding: 8px 16px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-arrow-left"></i> Back
            </button>

            <!-- Filters Section -->
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--au-blue); font-size: 1.1rem;">Select Strand and Section</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <!-- Strand Dropdown -->
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="record-strand-select" style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 0.95rem;">
                            <i class="fas fa-layer-group"></i> Strand
                        </label>
                        <select id="record-strand-select" class="au-input" onchange="updateRecordSectionAndSubjectList()" style="width: 100%; padding: 10px; border: 2px solid #e6e6e6; border-radius: 6px; font-size: 0.95rem; cursor: pointer; transition: border-color 0.3s;">
                            <option value="">-- Select a Strand --</option>
                        </select>
                    </div>

                    <!-- Section Dropdown -->
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="record-section-select" style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 0.95rem;">
                            <i class="fas fa-door-open"></i> Section
                        </label>
                        <select id="record-section-select" class="au-input" onchange="updateRecordStudentList()" style="width: 100%; padding: 10px; border: 2px solid #e6e6e6; border-radius: 6px; font-size: 0.95rem; cursor: pointer; transition: border-color 0.3s; background-color: #f5f5f5;" disabled>
                            <option value="">-- Select a Section --</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Student List Container -->
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: 25px;">
                <h3 style="margin: 0 0 15px 0; color: var(--au-blue); font-size: 1rem;">Students in Section</h3>

                <!-- Search bar for students (name or LRN) -->
                <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                    <input id="record-student-search" type="search" placeholder="Search student name or LRN" style="flex:1; padding:10px 12px; border:1px solid #e6e6e6; border-radius:8px; font-size:0.95rem;" oninput="updateRecordStudentList()" />
                    <button onclick="(function(){ const el=document.getElementById('record-student-search'); if(el){ el.value=''; updateRecordStudentList(); } })()" style="padding:8px 12px; background:#f3f4f6; border:1px solid #e6e6e6; border-radius:8px; cursor:pointer;">Clear</button>
                </div>

                <div id="record-student-list" style="display: grid; gap: 10px; max-height: 500px; overflow-y: auto;">
                    <p style="text-align: center; color: #999; padding: 30px 20px; font-style: italic;">Select a section to view students</p>
                </div>
            </div>

            <!-- Student Cards Container (Hidden by default, used for scoresheet navigation) -->
            <div id="record-cards-container" style="display: none; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; min-height: 300px;">
            </div>
        </div>
    `;

    appContainer.innerHTML = html;
    
    // Populate the strand filter
    populateRecordStrandFilter();
}

export function populateRecordStrandFilter() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandSelect = document.getElementById('record-strand-select');

    if (!strandSelect) return;

    strandSelect.innerHTML = '<option value="">-- Select a Strand --</option>';

    if (!teacherData || !teacherData.assignedStrandSections) {
        strandSelect.innerHTML += '<option value="" disabled>(No strands assigned)</option>';
        strandSelect.disabled = true;
        return;
    }

    // Get all assigned strands
    const assignedStrands = Object.keys(teacherData.assignedStrandSections);
    
    if (assignedStrands.length === 0) {
        strandSelect.innerHTML += '<option value="" disabled>(No strands assigned)</option>';
        strandSelect.disabled = true;
        return;
    }

    assignedStrands.forEach(strand => {
        const normalized = strand.toUpperCase();
        const opt = document.createElement('option');
        opt.value = normalized;
        opt.textContent = normalized;
        strandSelect.appendChild(opt);
    });

    strandSelect.disabled = false;

    // if a strand was already selected (e.g. navigating back), update sections immediately
    if (strandSelect.value) {
        updateRecordSectionAndSubjectList();
    }
}

export function populateRecordSubjectFilter() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const subjectSelect = document.getElementById('record-subject-select');

    if (!subjectSelect) return;

    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';

    if (!teacherData || !teacherData.assignedSubjects) {
        subjectSelect.innerHTML += '<option value="">(No assigned subjects)</option>';
        subjectSelect.disabled = true;
        return;
    }

    teacherData.assignedSubjects.forEach(subj => {
        const opt = document.createElement('option');
        opt.value = subj;
        opt.textContent = subj;
        subjectSelect.appendChild(opt);
    });

    subjectSelect.disabled = false;
}

// utility: case-insensitive lookup for strand key in teacher assignments
function findAssignedStrandKey(teacherData, strand) {
    if (!teacherData || !teacherData.assignedStrandSections) return null;
    const keys = Object.keys(teacherData.assignedStrandSections);
    return keys.find(k => k.toLowerCase() === strand.toLowerCase()) || null;
}

// get array of sections assigned to teacher for a given strand (case-insensitive)
function getAssignedSectionsForStrand(teacherData, strand) {
    const key = findAssignedStrandKey(teacherData, strand);
    return key ? (teacherData.assignedStrandSections[key] || []) : [];
}



export function displayRecordCards() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandSelect = document.getElementById('record-strand-select');
    const sectionSelect = document.getElementById('record-section-select');
    const subjectSelect = document.getElementById('record-subject-select');
    const container = document.getElementById('record-cards-container');
    const c = getClusters();

    if (!container) return;

    const selectedStrand = strandSelect.value;
    const selectedSection = sectionSelect.value;
    const selectedSubject = subjectSelect.value;

    // If no strand is selected, show default message
    if (!selectedStrand) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px 20px; font-style: italic;">Select filters to view records</p>';
        return;
    }

    // Build cards data based on selection
    let cardsData = [];

    if (selectedStrand && selectedSection && selectedSubject) {
        // All three selected - show specific record
        const students = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand] && Array.isArray(c[teacherData.assignedCluster][selectedStrand][selectedSection])) ? c[teacherData.assignedCluster][selectedStrand][selectedSection] : [];
        
        if (students.length > 0) {
            cardsData.push({
                title: selectedSection,
                strand: selectedStrand,
                subject: selectedSubject,
                onClick: `openTeacherRecordTable('${selectedStrand}', '${selectedSection}', '${selectedSubject}', '1st')`
            });
        }
    } else if (selectedStrand && selectedSection) {
        // Strand and section selected - show student cards with name + picture
        const students = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand] && Array.isArray(c[teacherData.assignedCluster][selectedStrand][selectedSection])) 
            ? c[teacherData.assignedCluster][selectedStrand][selectedSection] 
            : [];
        
        if (students.length > 0) {
            students.forEach(student => {
                if (student && student.id) {
                    cardsData.push({
                        studentId: student.id,
                        studentName: student.name || student.id,
                        profilePic: student.img || 'images/default.svg',
                        onClick: `openTeacherStudentScoresheet('${student.id}', '${selectedStrand}', '${selectedSection}')`
                    });
                }
            });
        }
    } else if (selectedStrand && selectedSubject) {
        // Strand and subject selected but no section - show all sections for this strand
        const assignedSections = getAssignedSectionsForStrand(teacherData, selectedStrand);
        if (assignedSections && assignedSections.length > 0) {
            const clusterStrand = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand]) || {};

            assignedSections.forEach(section => {
                if (Array.isArray(clusterStrand[section]) && clusterStrand[section].length > 0) {
                    cardsData.push({
                        title: section,
                        strand: selectedStrand,
                        subject: selectedSubject,
                        onClick: `openTeacherRecordTable('${selectedStrand}', '${section}', '${selectedSubject}', '1st')`
                    });
                }
            });
        }
    } else if (selectedStrand) {
        // Only strand selected - show all assigned sections
        const assignedSections = getAssignedSectionsForStrand(teacherData, selectedStrand);
        if (assignedSections && assignedSections.length > 0) {
            const clusterStrand = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand]) || {};

            assignedSections.forEach(section => {
                if (Array.isArray(clusterStrand[section])) {
                    cardsData.push({
                        title: section,
                        strand: selectedStrand,
                        onClick: `() => { document.getElementById('record-section-select').value = '${section}'; updateRecordSectionAndSubjectList(); }`
                    });
                }
            });
        }
    }

    // Render cards
    if (cardsData.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px 20px; font-style: italic;">No records available</p>';
        return;
    }

    let html = '';
    cardsData.forEach(card => {
        let cardHtml = '';
        
        if (card.studentId) {
            // Student card with picture
            cardHtml = `
                <div onclick="${card.onClick}" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; background: white; border: 2px solid #e6e6e6; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.08); text-align: center;" onmouseover="this.style.borderColor='#f43f5e'; this.style.boxShadow='0 6px 16px rgba(244, 63, 94, 0.2); this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#e6e6e6'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.08)'; this.style.transform='translateY(0)';">
                    <img src="${card.profilePic}" alt="${card.studentName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #f43f5e;">
                    <div style="word-break: break-word; flex: 1;">
                        <div style="font-weight: 600; color: #333; font-size: 0.95rem;">${card.studentName}</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 4px;">${card.studentId}</div>
                    </div>
                </div>
            `;
        } else if (card.subject) {
            // Subject card
            cardHtml = `
                <div onclick="${card.onClick}" style="cursor: pointer; padding: 20px; background: white; border: 2px solid #e6e6e6; border-radius: 8px; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#f43f5e'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.borderColor='#e6e6e6'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)';">
                    <div style="font-weight: 500;">${card.title}</div>
                    <div style="font-size: 0.85rem; color: #666;">${card.strand}</div>
                    <div style="font-size: 0.8rem; color: #999; margin-top: 4px;">${card.subject}</div>
                </div>
            `;
        } else {
            // Section card
            cardHtml = `
                <div onclick="${card.onClick}" style="cursor: pointer; padding: 20px; background: white; border: 2px solid #e6e6e6; border-radius: 8px; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#f43f5e'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.borderColor='#e6e6e6'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)';">
                    <div style="font-weight: 500;">${card.title}</div>
                    <div style="font-size: 0.85rem; color: #666;">${card.strand}</div>
                </div>
            `;
        }
        
        html += cardHtml;
    });

    container.innerHTML = html;
}

// Handle clicking a student card to open their scoresheet
export function openTeacherStudentScoresheet(studentId, strand, section) {
    setCurrentStudentId(studentId);
    renderApp();
}

export function handleRecordSubjectChange() {
    const strandSelect = document.getElementById('record-strand-select');
    const sectionSelect = document.getElementById('record-section-select');
    const subjectSelect = document.getElementById('record-subject-select');
    const c = getClusters();
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];

    const selectedStrand = strandSelect?.value;
    const selectedSection = sectionSelect?.value;
    const selectedSubject = subjectSelect?.value;

    // If all three filters are selected, navigate directly to the record table
    if (selectedStrand && selectedSection && selectedSubject) {
        const students = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand] && Array.isArray(c[teacherData.assignedCluster][selectedStrand][selectedSection])) ? c[teacherData.assignedCluster][selectedStrand][selectedSection] : [];
        
        if (students.length > 0) {
            // Directly navigate to record table
            openTeacherRecordTable(selectedStrand, selectedSection, selectedSubject, '1st');
        } else {
            // Show message if no students available
            showDialog({ type: 'warning', title: 'No Students', message: 'No students found in this section.' });
        }
    } else {
        // If not all filters are selected, just update the cards display
        displayRecordCards();
    }
}

export function updateRecordSectionAndStudentList() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandSelect = document.getElementById('record-strand-select');
    const sectionSelect = document.getElementById('record-section-select');
    const c = getClusters();

    if (!strandSelect || !sectionSelect) return;

    const selectedStrand = strandSelect.value;
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
    sectionSelect.disabled = true;

    if (!selectedStrand) {
        document.getElementById('record-student-list').innerHTML = '<p style="text-align:center; color:#999;">Please select a strand and section to view students.</p>';
        return;
    }

    const assignedSections = getAssignedSectionsForStrand(teacherData, selectedStrand) || [];
    const clusterStrand = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand]) || {};

    assignedSections.forEach(sec => {
        // Only show section if it exists in cluster data for that strand
        if (Array.isArray(clusterStrand[sec])) {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            sectionSelect.appendChild(opt);
        }
    });

    if (sectionSelect.options.length > 1) {
        sectionSelect.disabled = false;
    } else {
        sectionSelect.disabled = true;
        document.getElementById('record-student-list').innerHTML = '<p style="text-align:center; color:#999;">No sections available for the selected strand.</p>';
    }
}

export function updateRecordStudentList() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandSelect = document.getElementById('record-strand-select');
    const sectionSelect = document.getElementById('record-section-select');
    const listDiv = document.getElementById('record-student-list');
    const c = getClusters();

    if (!strandSelect || !sectionSelect || !listDiv) return;

    const selectedStrand = strandSelect.value;
    const selectedSection = sectionSelect.value;

    if (!selectedStrand || !selectedSection) {
        listDiv.innerHTML = '<p style="text-align:center; color:#999;">Please select a strand and section to view students.</p>';
        return;
    }

    const clusterStrand = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand]) || {};
    const students = Array.isArray(clusterStrand[selectedSection]) ? clusterStrand[selectedSection] : [];

    // Apply search filter if present
    const searchEl = document.getElementById('record-student-search');
    const searchTerm = searchEl && searchEl.value ? String(searchEl.value).trim().toLowerCase() : '';

    let filtered = students;
    if (searchTerm) {
        filtered = students.filter(s => {
            const name = (s.name || '').toString().toLowerCase();
            const id = (s.id || '').toString().toLowerCase();
            const lrn = (s.lrn || '').toString().toLowerCase();
            return name.includes(searchTerm) || id.includes(searchTerm) || lrn.includes(searchTerm);
        });
    }

    if (filtered.length === 0) {
        if (searchTerm) {
            listDiv.innerHTML = `<p style="text-align:center; color:#999;">No students found matching "${escapeHtml(searchTerm)}".</p>`;
        } else {
            listDiv.innerHTML = '<p style="text-align:center; color:#999;">No students found for this section.</p>';
        }
        return;
    }

    let html = '<div style="display:grid; gap:12px;">';
    filtered.forEach(student => {
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:14px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; transition:all 0.3s ease; box-shadow:0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.15)'; this.style.borderColor='#b3d9ff'; this.style.backgroundColor='#f8fbff';" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'; this.style.borderColor='#e0e0e0'; this.style.backgroundColor='#fff';">
                <div style="display:flex; align-items:center; gap:14px; flex:1;">
                    <img src="${student.img || 'images/default.svg'}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--au-blue); flex-shrink:0;">
                    <div style="flex:1;">
                        <div style="font-weight:600; color:#1a1a1a; font-size:0.95rem;">${student.name}</div>
                        <div style="font-size:0.8rem; color:#666; margin-top:3px;"><i class="fas fa-tag"></i> ${student.lrn || student.id}</div>
                    </div>
                </div>
                <div>
                    <button onclick="selectTeacherStudent('${student.id}')" style="padding:8px 16px; background:var(--au-blue); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; display:flex; align-items:center; gap:6px;" onmouseover="this.style.backgroundColor='#0ea5e9'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.3)';" onmouseout="this.style.backgroundColor='var(--au-blue)'; this.style.boxShadow='none';"><i class="fas fa-arrow-right"></i> Open</button>
                </div>
            </div>
        `;
    });
    html += '</div>';

    listDiv.innerHTML = html;
}

// ---------- Record Table View and Auto-save Logic ----------
const _recordSaveTimers = {};

function initRecordTotalsForStudent(studentId, subject, quarter) {
    const sg = getSubjectGrades();
    if (!sg[studentId]) sg[studentId] = {};
    if (!sg[studentId][subject]) sg[studentId][subject] = {};
    if (!sg[studentId][subject][quarter]) sg[studentId][subject][quarter] = {};
    if (!sg[studentId][subject][quarter]['recordTotals']) {
        sg[studentId][subject][quarter]['recordTotals'] = {
            'concept-notes': 0,
            'activities': 0,
            'quizzes': 0,
            'preliminary-exam': 0,
            'departmental-exam': 0
        };
    }
}

function saveRecordFieldDebounced(studentId, subject, quarter, field, value) {
    const key = `${studentId}::${subject}::${quarter}::${field}`;
    if (_recordSaveTimers[key]) clearTimeout(_recordSaveTimers[key]);
    _recordSaveTimers[key] = setTimeout(() => {
        const sg = getSubjectGrades();
        if (!sg[studentId]) sg[studentId] = {};
        if (!sg[studentId][subject]) sg[studentId][subject] = {};
        if (!sg[studentId][subject][quarter]) sg[studentId][subject][quarter] = {};
        if (!sg[studentId][subject][quarter]['recordTotals']) {
            sg[studentId][subject][quarter]['recordTotals'] = {};
        }
        sg[studentId][subject][quarter]['recordTotals'][field] = Number(value) || 0;
        saveGrades();
        showSuccessToast('✓ Saved');
    }, 1000);
}

export function openTeacherRecordTable(strand, section, subject, quarter = '1st') {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const c = getClusters();

    if (!strand || !section || !subject) {
        showDialog({ type: 'error', title: 'Missing selection', message: 'Please choose strand, section and subject first.' });
        return;
    }

    const students = (c[teacherData.assignedCluster] && c[teacherData.assignedCluster][strand] && Array.isArray(c[teacherData.assignedCluster][strand][section]) ) ? c[teacherData.assignedCluster][strand][section] : [];

    pushNavigation('Record Table', () => openTeacherRecordTable(strand, section, subject, quarter));

    // Store context for quarter switching
    window._recordTableContext = { strand, section, subject, quarter };

    // Build table HTML styled like the provided design
    let html = `
        <div style="padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0052cc 0%, #003a99 100%); color: white; padding: 16px 20px; font-weight: 600; font-size: 1.1rem;">
                ${subject} - ${section}
            </div>

            <div style="padding: 20px;">
                <!-- Navigation -->
                <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
                    <button onclick="openTeacherRecordView()" style="padding: 8px 16px; background: var(--au-blue); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    
                    <div class="dropdown" style="position: relative;">
                        <button class="nav-pill" id="quarterBtn" style="gap: 8px; display: flex; align-items: center; padding: 8px 16px;">
                            <span id="quarterLabel">${quarter.toUpperCase()} QUARTER</span> <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-content" id="quarterDropdown" style="min-width: 150px; display: none; position: absolute; background: white; border: 1px solid #ddd; border-radius: 6px; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                            <button onclick="switchTeacherQuarter('1st')" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 0.95rem; transition: background 0.2s;">1st Quarter</button>
                            <button onclick="switchTeacherQuarter('2nd')" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 0.95rem; transition: background 0.2s;">2nd Quarter</button>
                            <button onclick="switchTeacherQuarter('3rd')" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 0.95rem; transition: background 0.2s;">3rd Quarter</button>
                            <button onclick="switchTeacherQuarter('4th')" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 0.95rem; transition: background 0.2s;">4th Quarter</button>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto; border: 3px solid #333; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <!-- Header Row 1: Category Headers -->
                        <thead>
                            <tr style="background: #0052cc; color: white; font-weight: 600;">
                                <td colspan="2" style="padding: 12px; text-align: center; border: 1px solid #333;">BOY/GIRLS</td>
                                <td colspan="3" style="padding: 12px; text-align: center; border: 1px solid #333;">WRITTEN WORKS</td>
                                <td colspan="1" style="padding: 12px; text-align: center; border: 1px solid #333;">PERFORMANCE TASKS</td>
                                <td colspan="2" style="padding: 12px; text-align: center; border: 1px solid #333;">EXAMINATION</td>
                            </tr>
                            <!-- Header Row 2: Sub-categories -->
                            <tr style="background: #0052cc; color: white; font-weight: 600;">
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; width: 60px;">No.</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333;">Student</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; font-size: 0.85rem;">Concept Notes</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; font-size: 0.85rem;">Activities</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; font-size: 0.85rem;">Quizzes</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333;">Tasks</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; font-size: 0.85rem;">Preliminary Exam</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #333; font-size: 0.85rem;">Department Exam</td>
                            </tr>
                        </thead>
                        <!-- Data Rows -->
                        <tbody>
    `;

    // Combine and sort all students
    let allStudents = students || [];

    allStudents.forEach((stu, idx) => {
        const no = String(idx + 1).padStart(2, '0');
        // Ensure totals object exists
        initRecordTotalsForStudent(stu.id, subject, quarter);
        const sg = getSubjectGrades();
        const totals = (sg[stu.id] && sg[stu.id][subject] && sg[stu.id][subject][quarter] && sg[stu.id][subject][quarter]['recordTotals']) || {};
        const cn = totals['concept-notes'] || 0;
        const act = totals['activities'] || 0;
        const quiz = totals['quizzes'] || 0;
        const perf = totals['performance-tasks'] || 0;
        const pre = totals['preliminary-exam'] || 0;
        const dept = totals['departmental-exam'] || 0;

        // Alternate background colors
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';

        html += `
                            <tr style="background: ${bgColor}; border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: 500;">${no}</td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: left;">${stu.name}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${cn}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','concept-notes', this.value)"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${act}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','activities', this.value)"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${quiz}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','quizzes', this.value)"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${perf}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','performance-tasks', this.value)"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${pre}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','preliminary-exam', this.value)"></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><input type="number" value="${dept}" min="0" max="100" style="width: 60px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-size: 0.9rem;" onchange="window._saveRecordField('${stu.id}','${subject}','${quarter}','departmental-exam', this.value)"></td>
                            </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    appContainer.innerHTML = html;

    // --- quarter dropdown behaviour (teacher record view) ---
    const quarterBtnEl = document.getElementById('quarterBtn');
    const quarterDropdownEl = document.getElementById('quarterDropdown');
    if (quarterBtnEl && quarterDropdownEl) {
        // toggle on click (replace any existing handler)
        quarterBtnEl.onclick = function(e) {
            quarterDropdownEl.style.display = quarterDropdownEl.style.display === 'none' ? 'block' : 'none';

            // mark the currently selected option when opening
            const opts = quarterDropdownEl.querySelectorAll('button');
            opts.forEach(opt => {
                if (opt.textContent.trim().toLowerCase().startsWith(quarterBtnEl.textContent.trim().split(' ')[0].toLowerCase())) {
                    opt.style.fontWeight = '600';
                    opt.style.background = '#e0e0e0';
                } else {
                    opt.style.fontWeight = 'normal';
                    opt.style.background = 'none';
                }
            });
        };

        // hover highlights for each option
        const dropdownButtons = quarterDropdownEl.querySelectorAll('button');
        dropdownButtons.forEach(btn => {
            btn.onmouseover = function() { this.style.background = '#f0f0f0'; };
            btn.onmouseout = function() { this.style.background = 'none'; };
        });
    }
    if (!window._quarterDropdownClickHandlerAdded) {
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('quarterDropdown');
            const quarterBtn = document.getElementById('quarterBtn');
            if (dropdown && quarterBtn && !quarterBtn.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
        window._quarterDropdownClickHandlerAdded = true;
    }
}

export function switchTeacherQuarter(newQuarter) {
    // update button text quickly if still on screen
    const btn = document.getElementById('quarterBtn');
    if (btn) btn.innerHTML = `${newQuarter.toUpperCase()} QUARTER <i class="fas fa-chevron-down"></i>`;

    // close dropdown (in case user clicked an option)
    const dropdown = document.getElementById('quarterDropdown');
    if (dropdown) dropdown.style.display = 'none';

    const context = window._recordTableContext;
    if (context && context.strand && context.section && context.subject) {
        // Reload the table with the new quarter
        openTeacherRecordTable(context.strand, context.section, context.subject, newQuarter);
    }
}

// Expose a global helper for inline onchange handlers
window._saveRecordField = function(studentId, subject, quarter, field, value) {
    saveRecordFieldDebounced(studentId, subject, quarter, field, value);
};

// Expose view functions globally for inline/back navigation
window.openTeacherRecordView = openTeacherRecordView;
window.openTeacherRecordTable = openTeacherRecordTable;
window.updateRecordSectionAndSubjectList = updateRecordSectionAndSubjectList;
window.displayRecordCards = displayRecordCards;
window.handleRecordSubjectChange = handleRecordSubjectChange;
// teacher-specific quarter switch (avoids colliding with scoresheet module)
window.switchTeacherQuarter = switchTeacherQuarter;

// Handle clicking a student name in the record table to open their scoresheet
// (removed) handleRecordStudentClick - navigation handled via student cards now

// Admin student selector view
export function openAdminStudentSelector() {
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Students";
    
    pushNavigation('Students', openAdminStudentSelector);
    
    const html = `
        <div style="padding: 30px; max-width: 1300px; margin: 0 auto;">
            <!-- Back Button -->
            <div style="margin-bottom: 30px; display: flex; gap: 12px;">
                <button type="button" onclick="goBack()" style="padding: 12px 24px; background: var(--au-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-chevron-left"></i> Back
                </button>
            </div>
            
            <!-- Header Section -->
            <div style="margin-bottom: 40px;">
                <h1 style="margin: 0 0 10px 0; font-size: 2rem; color: #1a1a1a; display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-users" style="color: var(--au-blue);"></i> Manage Students
                </h1>
                <p style="margin: 0; color: #666; font-size: 0.95rem;">View and manage all student accounts across the university</p>
            </div>
            
            <!-- Filters Card -->
            <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid var(--au-blue);">
                <h3 style="margin: 0 0 20px 0; color: var(--au-blue); font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-filter"></i> Filter Students
                </h3>
                
                <!-- Filters Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <!-- Cluster Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">📚 Cluster</label>
                        <select id="admin-cluster-filter" onchange="updateAdminStrandAndStudentList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--au-blue)'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">Select Cluster</option>
                        </select>
                    </div>

                    <!-- Strand Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🎯 Strand</label>
                        <select id="admin-strand-filter" onchange="updateAdminSectionAndStudentList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--au-blue)'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">Select Strand</option>
                        </select>
                    </div>
                    
                    <!-- Section Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🏛️ Section</label>
                        <select id="admin-section-filter" onchange="updateAdminStudentList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--au-blue)'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">Select Section</option>
                        </select>
                    </div>
                    
                    <!-- Gender Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">👤 Gender</label>
                        <select id="admin-gender-filter" onchange="updateAdminStudentList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--au-blue)'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">All Genders</option>
                        </select>
                    </div>
                </div>
                
                <!-- Search Box -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🔍 Search by Name</label>
                    <input type="text" id="admin-student-search" placeholder="Type student name..." oninput="updateAdminStudentList()" onkeyup="updateAdminStudentList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--au-blue)'" onblur="this.style.borderColor='#e0e0e0'">
                </div>
            </div>
            
            <!-- Student List -->
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div id="admin-student-list" style="min-height: 200px;">
                    <p style="color: #999; text-align: center; padding: 40px 20px; font-style: italic;">👇 Select a filter or search to view students</p>
                </div>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    // Populate cluster filter and gender options
    populateAdminClusterFilter();
    populateAdminGenderFilter();
}

export function populateAdminClusterFilter() {
    const c = getClusters();
    const clusterFilter = document.getElementById('admin-cluster-filter');
    
    if (!clusterFilter) return;
    
    clusterFilter.innerHTML = '<option value="">-- Select Cluster --</option>';
    
    Object.keys(c).forEach(cluster => {
        const opt = document.createElement('option');
        opt.value = cluster;
        opt.textContent = cluster;
        clusterFilter.appendChild(opt);
    });
}

export function populateAdminGenderFilter() {
    const genderFilter = document.getElementById('admin-gender-filter');
    
    if (!genderFilter) return;
    
    // Get available genders from storage
    const genders = getAvailableGenders();
    
    genderFilter.innerHTML = '<option value="">-- All Genders --</option>';
    
    if (genders && Array.isArray(genders) && genders.length > 0) {
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            genderFilter.appendChild(opt);
        });
    } else {
        // Fallback to defaults if none are available
        const opt1 = document.createElement('option');
        opt1.value = 'Male';
        opt1.textContent = 'Male';
        genderFilter.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = 'Female';
        opt2.textContent = 'Female';
        genderFilter.appendChild(opt2);
    }
}

export function updateAdminStrandAndStudentList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('admin-cluster-filter');
    const strandFilter = document.getElementById('admin-strand-filter');
    const sectionFilter = document.getElementById('admin-section-filter');
    const genderFilter = document.getElementById('admin-gender-filter');
    const searchInput = document.getElementById('admin-student-search');
    
    const selectedCluster = clusterFilter.value;
    
    // Reset dependent filters when cluster changes
    strandFilter.innerHTML = '<option value="">-- Select Strand --</option>';
    sectionFilter.innerHTML = '<option value="">-- Select Section --</option>';
    genderFilter.value = '';
    searchInput.value = '';
    
    if (selectedCluster && c[selectedCluster]) {
        Object.keys(c[selectedCluster]).forEach(strand => {
            const opt = document.createElement('option');
            opt.value = strand;
            opt.textContent = strand;
            strandFilter.appendChild(opt);
        });
    }
    
    updateAdminStudentList();
}

export function updateAdminSectionAndStudentList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('admin-cluster-filter');
    const strandFilter = document.getElementById('admin-strand-filter');
    const sectionFilter = document.getElementById('admin-section-filter');
    const genderFilter = document.getElementById('admin-gender-filter');
    const searchInput = document.getElementById('admin-student-search');
    
    const selectedCluster = clusterFilter.value;
    const selectedStrand = strandFilter.value;
    
    // Reset dependent filters when strand changes
    sectionFilter.innerHTML = '<option value="">-- Select Section --</option>';
    genderFilter.value = '';
    searchInput.value = '';
    
    if (selectedCluster && selectedStrand && c[selectedCluster] && c[selectedCluster][selectedStrand]) {
        Object.keys(c[selectedCluster][selectedStrand]).forEach(section => {
            if (section !== 'subjects' && Array.isArray(c[selectedCluster][selectedStrand][section])) {
                const opt = document.createElement('option');
                opt.value = section;
                opt.textContent = section;
                sectionFilter.appendChild(opt);
            }
        });
    }
    
    updateAdminStudentList();
}

export function updateAdminStudentList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('admin-cluster-filter');
    const strandFilter = document.getElementById('admin-strand-filter');
    const sectionFilter = document.getElementById('admin-section-filter');
    const genderFilter = document.getElementById('admin-gender-filter');
    const searchInput = document.getElementById('admin-student-search');
    const studentListDiv = document.getElementById('admin-student-list');
    
    // Safety check - make sure all elements exist
    if (!clusterFilter || !strandFilter || !sectionFilter || !genderFilter || !searchInput || !studentListDiv) {
        console.error("One or more filter elements not found");
        return;
    }
    
    const selectedCluster = clusterFilter.value;
    const selectedStrand = strandFilter.value;
    const selectedSection = sectionFilter.value;
    const selectedGender = genderFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Check if any filter or search is applied
    const hasFilters = selectedCluster || selectedStrand || selectedSection || selectedGender || searchTerm;
    
    // If no filters or search, show placeholder message
    if (!hasFilters) {
        studentListDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 40px 20px; font-style: italic;">👇 Select a filter or search to view students</p>';
        return;
    }
    
    // Get all students from all clusters
    let allStudents = [];
    
    Object.keys(c).forEach(cluster => {
        const clusterData = c[cluster];
        Object.keys(clusterData).forEach(strand => {
            const strandData = clusterData[strand];
            Object.keys(strandData).forEach(section => {
                if (section !== 'subjects' && Array.isArray(strandData[section])) {
                    strandData[section].forEach(student => {
                        if (Array.isArray(student)) return;
                        allStudents.push({
                            ...student,
                            cluster: cluster,
                            strand: strand,
                            section: section
                        });
                    });
                }
            });
        });
    });
    
    // Apply cluster filter if selected
    if (selectedCluster) {
        allStudents = allStudents.filter(s => s.cluster === selectedCluster);
    }
    
    // Apply strand filter if selected
    if (selectedStrand) {
        allStudents = allStudents.filter(s => s.strand === selectedStrand);
    }
    
    // Apply section filter if selected
    if (selectedSection) {
        allStudents = allStudents.filter(s => s.section === selectedSection);
    }
    
    // Apply filters
    let filteredStudents = allStudents;
    
    if (selectedGender) {
        filteredStudents = filteredStudents.filter(s => s.gender === selectedGender);
    }
    
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(searchTerm));
    }
    
    // Render students
    if (filteredStudents.length === 0) {
        studentListDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 40px 20px;">No students found matching your criteria.</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 12px;">';
    
    filteredStudents.forEach(student => {
        html += `
            <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 10px; transition: all 0.3s ease; background: white; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onmouseover="this.style.backgroundColor='#f8fbff'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.15)'; this.style.borderColor='var(--au-blue)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.backgroundColor='white'; this.style.boxShadow='none'; this.style.borderColor='#e0e0e0'; this.style.transform='translateY(0)'">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;" onclick="selectAdminStudent('${student.id}')">
                    <img src="${student.img || 'images/default.svg'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 3px solid var(--au-blue); box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                    <div>
                        <div style="font-weight: 700; color: #1a1a1a; font-size: 0.95rem;">${student.name}</div>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                            <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">📚 ${student.cluster}</span>
                            <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">🎯 ${student.strand}</span>
                            <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">👥 ${student.section}</span>
                            <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">👤 ${student.gender}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="event.stopPropagation(); openStudentPortfolio('${student.id}', '${student.cluster}', '${student.strand}', '${student.section}')" title="View Portfolio" style="padding: 10px 16px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#0ea5e9'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.3)'" onmouseout="this.style.backgroundColor='var(--au-blue)'; this.style.boxShadow='none'">
                        <i class="fas fa-user"></i> Portfolio
                    </button>
                    <button onclick="event.stopPropagation(); deleteStudent('${student.id}', '${student.cluster}', '${student.strand}', '${student.section}')" title="Delete Student" style="padding: 10px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#c62828'; this.style.boxShadow='0 4px 8px rgba(220, 53, 69, 0.3)'" onmouseout="this.style.backgroundColor='#dc3545'; this.style.boxShadow='none'">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    studentListDiv.innerHTML = html;
}

export function selectAdminStudent(studentId) {
    // Student cards already have cluster, strand, and section information
    // So we can directly look up the student from the data
    const c = getClusters();
    
    // Search all clusters for this student
    for (const cluster in c) {
        for (const strand in c[cluster]) {
            if (strand === 'subjects') continue;
            for (const section in c[cluster][strand]) {
                if (section === 'subjects') continue;
                if (Array.isArray(c[cluster][strand][section])) {
                    const student = c[cluster][strand][section].find(s => s.id === studentId);
                    if (student) {
                        // Found the student - open portfolio directly
                        openStudentPortfolio(studentId, cluster, strand, section);
                        return;
                    }
                }
            }
        }
    }
    
    showSuccessToast("❌ Student not found.");
}

export function openTeacherStudentSelector() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    
    // Debug logging
    console.log('[openTeacherStudentSelector] Teacher data:', teacherData);
    const c = getClusters();
    console.log('[openTeacherStudentSelector] Full clusters structure:', JSON.stringify(c, null, 2));
    
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Students";
    
    pushNavigation('Students', openTeacherStudentSelector);
    
    if (!teacherData.assignedStrandSections || !teacherData.assignedSubjects) {
        showSuccessToast("⚠️ No students assigned to you yet.");
        return;
    }
    
    // Create custom teacher view
    const html = `
        <div style="padding: 20px; max-width: 1200px;">
            <!-- Back Button -->
            <button onclick="renderApp()" style="margin-bottom: 20px; padding: 10px 20px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ← Back to Dashboard
            </button>
            
            <h2 style="margin-bottom: 20px;">Select Student</h2>
            
            <!-- Filters Row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <!-- Strand Filter -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Strand:</label>
                    <select id="teacher-strand-filter" onchange="updateTeacherSectionAndStudentList()" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- Select Strand --</option>
                    </select>
                </div>
                
                <!-- Section Filter -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Section:</label>
                    <select id="teacher-section-filter" onchange="updateTeacherStudentList()" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- Select Section --</option>
                    </select>
                </div>
                
                <!-- Subject Filter -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Subject:</label>
                    <select id="teacher-subject-filter" onchange="updateTeacherStudentList()" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- Select Subject --</option>
                    </select>
                </div>
                
                <!-- Gender Filter -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Gender:</label>
                    <select id="teacher-gender-filter" onchange="updateTeacherStudentList()" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- All Genders --</option>
                    </select>
                </div>
            </div>
            
            <!-- Search Box -->
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Search Student:</label>
                <input type="text" id="teacher-student-search" placeholder="Type student name..." onkeyup="updateTeacherStudentList()" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
            </div>
            
            <!-- Add Student Button -->
            <div style="margin-bottom: 20px;">
                <button onclick="window.openAddStudentModal()" style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 14px;"><i class="fas fa-user-plus"></i> Add New Student</button>
            </div>
            
            <!-- Student List -->
            <div id="teacher-student-list" style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px; min-height: 200px;">
                <p style="color: #999; text-align: center;">Loading students...</p>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    // Populate strand filter and gender options
    populateTeacherStrandFilter();
    populateTeacherGenderFilter();
    
    // Load students after a brief delay to ensure DOM is ready
    setTimeout(() => {
        updateTeacherStudentList();
    }, 100);
}

export function populateTeacherStrandFilter() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandFilter = document.getElementById('teacher-strand-filter');
    
    if (!strandFilter || !teacherData.assignedStrandSections) return;
    
    strandFilter.innerHTML = '<option value="">-- Select Strand --</option>';
    
    Object.keys(teacherData.assignedStrandSections).forEach(strand => {
        const opt = document.createElement('option');
        opt.value = strand;
        opt.textContent = strand;
        strandFilter.appendChild(opt);
    });
}

export function populateTeacherGenderFilter() {
    const genderFilter = document.getElementById('teacher-gender-filter');
    
    if (!genderFilter) return;
    
    // Get available genders from storage
    const genders = getAvailableGenders();
    
    genderFilter.innerHTML = '<option value="">-- All Genders --</option>';
    
    if (genders && Array.isArray(genders) && genders.length > 0) {
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            genderFilter.appendChild(opt);
        });
    } else {
        // Fallback to defaults if none are available
        const opt1 = document.createElement('option');
        opt1.value = 'Male';
        opt1.textContent = 'Male';
        genderFilter.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = 'Female';
        opt2.textContent = 'Female';
        genderFilter.appendChild(opt2);
    }
}

export function updateTeacherSectionAndStudentList() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandFilter = document.getElementById('teacher-strand-filter');
    const sectionFilter = document.getElementById('teacher-section-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    const genderFilter = document.getElementById('teacher-gender-filter');
    const searchInput = document.getElementById('teacher-student-search');
    
    const selectedStrand = strandFilter.value;
    
    // Reset dependent filters when strand changes
    sectionFilter.innerHTML = '<option value="">-- Select Section --</option>';
    genderFilter.value = '';
    searchInput.value = '';
    
    if (selectedStrand) {
        const assignedSections = getAssignedSectionsForStrand(teacherData, selectedStrand);
        assignedSections.forEach(section => {
            const opt = document.createElement('option');
            opt.value = section;
            opt.textContent = section;
            sectionFilter.appendChild(opt);
        });
    }
    
    // Update subjects filter based on selected strand
    subjectFilter.innerHTML = '<option value="">-- Select Subject --</option>';
    
    if (selectedStrand) {
        // Get subjects for the selected strand from the cluster data
        const c = getClusters();
        const strandData = c[teacherData.assignedCluster] && c[teacherData.assignedCluster][selectedStrand];
        if (strandData && strandData.subjects) {
            strandData.subjects.forEach(subject => {
                // Only show if teacher is assigned to this subject
                if (teacherData.assignedSubjects && teacherData.assignedSubjects.includes(subject)) {
                    const opt = document.createElement('option');
                    opt.value = subject;
                    opt.textContent = subject;
                    subjectFilter.appendChild(opt);
                }
            });
        }
    } else {
        // If no strand selected, show all teacher's subjects
        if (teacherData.assignedSubjects && Array.isArray(teacherData.assignedSubjects)) {
            teacherData.assignedSubjects.forEach(subject => {
                const opt = document.createElement('option');
                opt.value = subject;
                opt.textContent = subject;
                subjectFilter.appendChild(opt);
            });
        }
    }
    
    updateTeacherStudentList();
}

export function updateTeacherStudentList() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const strandFilter = document.getElementById('teacher-strand-filter');
    const sectionFilter = document.getElementById('teacher-section-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    const genderFilter = document.getElementById('teacher-gender-filter');
    const searchInput = document.getElementById('teacher-student-search');
    const studentListDiv = document.getElementById('teacher-student-list');
    
    const selectedStrand = strandFilter.value;
    const selectedSection = sectionFilter.value;
    const selectedGender = genderFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    console.log('[Teacher Student List] Selected Strand:', selectedStrand, 'Section:', selectedSection, 'Gender:', selectedGender);
    console.log('[Teacher Student List] Teacher Assigned Cluster:', teacherData.assignedCluster);
    console.log('[Teacher Student List] Teacher Assigned Strands:', Object.keys(teacherData.assignedStrandSections || {}));
    
    // Get all students
    const c = getClusters();
    const allStudents = [];
    
    // Get the teacher's assigned cluster data
    const clusterData = c[teacherData.assignedCluster];
    if (!clusterData) {
        console.log('[Teacher Student List] No data found for cluster:', teacherData.assignedCluster);
        return;
    }
    
    console.log('[Teacher Student List] Cluster data found. Strands in cluster:', Object.keys(clusterData));
    
    // IMPORTANT: Only get students from teacher's assigned strands and sections
    Object.entries(teacherData.assignedStrandSections).forEach(([assignedStrand, assignedSections]) => {
        console.log('[Teacher Student List] Processing strand:', assignedStrand, 'Sections:', assignedSections);
        
        // Skip if a strand is selected and it doesn't match assigned strand
        if (selectedStrand && selectedStrand !== assignedStrand) return;
        
        // Get strand data from the cluster
        const strandData = clusterData[assignedStrand];
        if (!strandData) {
            console.log('[Teacher Student List] No strand data for:', assignedStrand);
            return;
        }
        
        assignedSections.forEach(assignedSection => {
            console.log('[Teacher Student List] Processing section:', assignedSection);
            
            // Skip if a section is selected and it doesn't match assigned section
            if (selectedSection && selectedSection !== assignedSection) return;
            
            console.log('[Teacher Student List] Section data exists:', !!strandData[assignedSection], 'Is array:', Array.isArray(strandData[assignedSection]));
            
            if (strandData[assignedSection] && Array.isArray(strandData[assignedSection])) {
                console.log('[Teacher Student List] Students in section:', strandData[assignedSection].length);
                strandData[assignedSection].forEach(student => {
                    allStudents.push({
                        ...student,
                        cluster: teacherData.assignedCluster,
                        strand: assignedStrand,
                        section: assignedSection
                    });
                });
            }
        });
    });
    
    console.log('[Teacher Student List] Total students in assigned sections:', allStudents.length);
    
    // Filter students based on criteria
    const selectedSubject = subjectFilter.value;
    const filteredStudents = allStudents.filter(student => {
        const matchesGender = !selectedGender || student.gender === selectedGender;
        const matchesSearch = !searchTerm || student.name.toLowerCase().includes(searchTerm);
        
        // Subject filter logic: show student if they have the selected subject
        // (regardless of whether teacher teaches it)
        let matchesSubject = true;
        if (selectedSubject) {
            // If a specific subject is selected, student must have that subject
            matchesSubject = student.subjects && student.subjects.includes(selectedSubject);
        }
        // If no subject filter is selected, show all students from teacher's assigned sections
        
        return matchesGender && matchesSearch && matchesSubject;
    });
    
    console.log('[Teacher Student List] Filtered students:', filteredStudents.length);
    
    // Display students
    if (filteredStudents.length === 0) {
        studentListDiv.innerHTML = '<p style="color: #999; text-align: center;">No students found matching your filters.</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 10px;">';
    
    filteredStudents.forEach(student => {
        html += `
            <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px; transition: all 0.2s; background: white; display: flex; align-items: center; justify-content: space-between;" onmouseover="this.style.backgroundColor='#f0f7ff'; this.style.borderColor='var(--au-blue)'" onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e0e0e0'">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="selectTeacherStudent('${student.id}', '${selectedSubject || ''}')">>
                    <img src="${student.img || 'images/default.svg'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div style="flex: 1;">
                        <p style="margin: 0; font-weight: 600;">${student.name}</p>
                        <p style="margin: 0; font-size: 0.85rem; color: #666;">${student.strand} - ${student.section} | ${student.gender}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button onclick="editTeacherStudent('${student.id}', '${student.cluster}', '${student.strand}', '${student.section}')" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteTeacherStudent('${student.id}', '${student.name}', '${student.cluster}', '${student.strand}', '${student.section}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    studentListDiv.innerHTML = html;
}

export function selectTeacherStudent(studentId, selectedSubjectFilter = null) {
    try {
        console.log('[🎓 selectTeacherStudent] Clicked on student:', studentId);
        
        // ✅ Authentication check
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.warn("❌ Tried to select student without authentication");
            import('./app.js').then(module => module.renderApp());
            return;
        }

        // Persist any unsaved grades before leaving record view
        try {
            saveGrades();
        } catch (e) {
            console.warn('Failed to auto-save grades before student selection', e);
        }
        
        console.log('[🎓 selectTeacherStudent] Setting current student ID:', studentId);
        setCurrentStudentId(studentId);
        
        console.log('[🎓 selectTeacherStudent] Calling openScoresheet()');
        openScoresheet(selectedSubjectFilter);
    } catch (error) {
        console.error('[🎓 selectTeacherStudent] Error:', error);
        showDialog({
            type: 'error',
            title: 'Error Loading Scoresheet',
            message: 'An error occurred while loading the student scoresheet. Please check the console for details.'
        });
    }
}

export function openScoresheet(selectedSubject = null) {
    try {
        const currentUser = getCurrentUser();
        const currentStudentId = getCurrentStudentId();
        const role = userAccounts[currentUser].role;

        console.log('[🎓 Teacher Scoresheet] Opening scoresheet for:', { currentStudentId, selectedSubject, role });

        // student path (or any non-teacher role)
        if (role !== 'teacher') {
            console.log('[🎓 Teacher Scoresheet] Non-teacher role, using student path');
            openSubjects(selectedSubject);
            return;
        }

        // teacher path
        const teacherData = userAccounts[currentUser];
        const assigned = teacherData.assignedSubjects || [];
        const student = getStudentData(currentStudentId);

        if (!student) {
            showDialog({
                type: 'error',
                title: 'Student Not Found',
                message: 'Unable to load student information.'
            });
            return;
        }

        // determine which of the teacher's subjects the student is taking
        const availableSubjects = assigned.filter(s =>
            Array.isArray(student.subjects) && student.subjects.includes(s)
        );

        console.log('[🎓 Teacher Scoresheet] Available subjects:', availableSubjects);

        if (availableSubjects.length === 0) {
            showDialog({
                type: 'error',
                title: 'No Subjects Available',
                message: 'You do not teach any subjects for this student.'
            });
            openStudentsView();
            return;
        }

        // choose target subject (respect filter if provided)
        let targetSubject = selectedSubject;
        if (!targetSubject || !availableSubjects.includes(targetSubject)) {
            // default to the first available subject when no valid filter
            targetSubject = availableSubjects[0];
        }

        console.log('[🎓 Teacher Scoresheet] Rendering scoresheet for subject:', targetSubject);

        // render the teacher scoresheet for the selected subject
        renderTeacherScoresheet(targetSubject);
    } catch (error) {
        console.error('[🎓 openScoresheet] Error:', error);
        const errorMsg = error && error.message ? error.message : (error ? error.toString() : 'Unknown error');
        showDialog({
            type: 'error',
            title: 'Error',
            message: 'Failed to open scoresheet. Please try again.'
        });
    }
}
export function renderStudentScoresheet(subjectName, quarter = "1st", selectedCategory = null) {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    
    // Authorization check - only students can access student scoresheet
    if (userAccounts[currentUser].role !== 'student') {
        showDialog({
            type: 'error',
            title: 'Access Denied',
            message: 'Only students can access their scoresheet.'
        });
        return;
    }

    const student = getStudentData(currentStudentId);
    if (!student) {
        showDialog({
            type: 'error',
            title: 'Student Not Found',
            message: 'Unable to load student information.'
        });
        return;
    }

    // Verify student has this subject
    if (!Array.isArray(student.subjects) || !student.subjects.includes(subjectName)) {
        showDialog({
            type: 'error',
            title: 'Subject Not Available',
            message: 'You are not enrolled in this subject.'
        });
        return;
    }

    // Set page title
    const titleEl = document.querySelector('.view-title');
    if (titleEl) titleEl.textContent = `${subjectName} - Scoresheet`;
    
    // Set current viewing context
    setCurrentViewedSubject(subjectName);
    currentCategory = selectedCategory || 'concept-notes';
    currentQuarter = quarter;

    // Initialize student grades for this subject if not exists
    initTeacherGradesStructure(currentStudentId, subjectName);

    // Define all categories
    const categories = [
        { id: 'concept-notes', name: 'Concept Notes', icon: 'fa-lightbulb', maxScore: 10 },
        { id: 'activities', name: 'Activities', icon: 'fa-tasks', maxScore: 100 },
        { id: 'quizzes', name: 'Quizzes', icon: 'fa-question-circle', maxScore: 100 },
        { id: 'preliminary-exam', name: 'Preliminary Examination', icon: 'fa-file-alt', maxScore: 50 },
        { id: 'departmental-exam', name: 'Departmental Examination', icon: 'fa-file-alt', maxScore: 50 }
    ];

    // Build the scoresheet page
    appContainer.innerHTML = `
        <div class="dashboard-content sheet-relative">
            <div class="score-sheet-top-layout">
                <div class="grade-nav">
                    <button class="nav-pill active" id="backToSubjectsBtn"><i class="fas fa-arrow-left"></i> Back to Subjects</button>
                    <div class="dropdown">
                        <button class="nav-pill" id="quarterBtn">${quarter.toUpperCase()} QUARTER <i class="fas fa-chevron-down"></i></button>
                        <div class="dropdown-content">
                            <button onclick="renderStudentScoresheet('${subjectName}', '1st', '${currentCategory}')">1st Quarter</button>
                            <button onclick="renderStudentScoresheet('${subjectName}', '2nd', '${currentCategory}')">2nd Quarter</button>
                            <button onclick="renderStudentScoresheet('${subjectName}', '3rd', '${currentCategory}')">3rd Quarter</button>
                            <button onclick="renderStudentScoresheet('${subjectName}', '4th', '${currentCategory}')">4th Quarter</button>
                        </div>
                    </div>
                    <div class="dropdown">
                        <button class="nav-pill" id="categoryBtn">Categories <i class="fas fa-chevron-down"></i></button>
                        <div class="dropdown-content">
                            ${categories.map(cat => `<button onclick="renderStudentScoresheet('${subjectName}', '${quarter}', '${cat.id}')">${cat.name}</button>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="student-sheet-header" style="visibility: hidden;"></div>
            </div>

            <div id="scoresheet-content"></div>
        </div>
    `;

    // Setup back button event listener with error handling
    const backBtn = appContainer.querySelector('#backToSubjectsBtn');
    if (backBtn) {
        backBtn.onclick = function(e) {
            e.preventDefault();
            try {
                if (typeof openSubjects === 'function') {
                    openSubjects();
                } else {
                    console.error('openSubjects function not available');
                    if (typeof goBack === 'function') goBack();
                }
            } catch (err) {
                console.error('Error navigating back to subjects:', err);
                if (typeof goBack === 'function') goBack();
            }
        };
    }

    // Find the selected category
    const selectedCategoryObj = categories.find(cat => cat.id === currentCategory);
    
    // Render only the selected category
    const contentContainer = document.getElementById('scoresheet-content');
    const categoryDiv = renderStudentCategorySection(subjectName, quarter, selectedCategoryObj);
    contentContainer.appendChild(categoryDiv);
}

/**
 * Render a single category section with its table (student view - read-only)
 */
function renderStudentCategorySection(subjectName, quarter, category) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    const items = (sg[currentStudentId]?.[subjectName]?.[quarter]?.[category.id]) || [];

    // Get max score for this category
    const maxScore = category.maxScore || 10;

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'shadow-card';
    sectionDiv.style.cssText = 'padding: 20px; border-radius: 8px; background: white;';

    // Category header
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--au-blue); padding-bottom: 15px;';
    headerDiv.innerHTML = `
        <div>
            <h3 style="margin: 0; color: var(--au-blue);"><i class="fas ${category.icon}"></i> ${category.name}</h3>
            <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #666;">Max Score: ${maxScore} points</p>
        </div>
    `;
    sectionDiv.appendChild(headerDiv);

    // Table
    const tableDiv = document.createElement('div');
    tableDiv.style.cssText = 'overflow-x: auto;';

    if (items.length === 0) {
        tableDiv.innerHTML = `
            <p style="color: #999; text-align: center; padding: 30px; margin: 0;">
                <i class="fas fa-inbox"></i> No items posted yet.
            </p>
        `;
    } else {
        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; width: 80px;">Item #</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; flex: 1; min-width: 150px;">Title</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 100px;">Score</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 120px;">Date Posted</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 120px;">Deadline</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 100px;">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach((item, idx) => {
            const itemNum = idx + 1;
            const status = getTeacherItemStatus(item);
            let statusColor = '#6c757d'; // Default grey for pending
            let statusLabel = 'Pending';
            let statusIcon = '○';
            
            if (status === 'green') {
                statusColor = '#28a745';
                statusLabel = '✓ Completed';
                statusIcon = '✓';
            } else if (status === 'red') {
                statusColor = '#dc3545';
                statusLabel = '✗ Overdue';
                statusIcon = '✗';
            }

            // Format category prefix for item number
            const categoryPrefix = category.name.split(' ')[0].charAt(0).toUpperCase();

            // Format dates for display
            const datePosted = item.datePosted ? new Date(item.datePosted).toLocaleDateString() : '—';
            const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString() : '—';

            tableHTML += `
                <tr style="border-bottom: 1px solid #eee; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f9f9f9'" onmouseout="this.style.backgroundColor='white'">
                    <td style="padding: 12px; text-align: left; font-weight: 600; color: var(--au-blue);">${categoryPrefix}${itemNum}</td>
                    <td style="padding: 12px; text-align: left; color: #333;">${item.title || '(No title)'}</td>
                    <td style="padding: 12px; text-align: center; font-weight: 600;">
                        <span style="color: var(--au-blue);">${item.score || 0}</span>
                        <span style="color: #999; font-size: 0.8rem;"> / ${maxScore}</span>
                    </td>
                    <td style="padding: 12px; text-align: center; color: #666;">${datePosted}</td>
                    <td style="padding: 12px; text-align: center; color: #666;">${deadline}</td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; background: ${statusColor}; color: white; font-weight: 600; font-size: 0.85rem; text-align: center;">
                            ${statusLabel}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        tableDiv.innerHTML = tableHTML;
    }

    sectionDiv.appendChild(tableDiv);
    return sectionDiv;
}

/**
 * - Quarter dropdown (1st to 4th)
 * - Category dropdown (Concept Notes, Activities, Quizzes, Preliminary Exam, Departmental Exam)
 * - Each row: Item Number, Title, Score, Date Posted, Deadline, Status (green/red)
 * - Status: Green if score submitted before deadline, Red if deadline passed without score
 */
export function renderTeacherScoresheet(subjectName, quarter = "1st", selectedCategory = null) {
    try {
        const currentUser = getCurrentUser();
        const currentStudentId = getCurrentStudentId();
        
        console.log('[🎓 Teacher Scoresheet] renderTeacherScoresheet called:', { 
            subjectName, 
            quarter, 
            selectedCategory, 
            currentStudentId,
            currentUser
        });
        
        // Authorization check
        if (userAccounts[currentUser].role !== 'teacher') {
            console.error('[🎓 Teacher Scoresheet] Access denied: not a teacher');
            showDialog({
                type: 'error',
                title: 'Access Denied',
                message: 'Only teachers can access the scoresheet.'
            });
            return;
        }
        
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        if (!assigned.includes(subjectName)) {
            console.error('[🎓 Teacher Scoresheet] Access denied: not assigned to subject', subjectName);
            showDialog({
                type: 'error',
                title: 'Access Denied',
                message: 'You are not authorized to view this subject.'
            });
            return;
        }

        const student = getStudentData(currentStudentId);
        if (!student) {
            console.error('[🎓 Teacher Scoresheet] Student not found:', currentStudentId);
            showDialog({
                type: 'error',
                title: 'Student Not Found',
                message: 'Unable to load student information.'
            });
            return;
        }

        console.log('[🎓 Teacher Scoresheet] Rendering scoresheet for student:', student.name);

        // Set page title
        const titleEl = document.querySelector('.view-title');
        if (titleEl) titleEl.textContent = `${subjectName} - ${student.name}`;
        
        // Add to navigation history
        pushNavigation(`${student.name} - ${subjectName}`, () => renderTeacherScoresheet(subjectName, quarter, selectedCategory));
        
        // Set current viewing context
        setCurrentViewedSubject(subjectName);
        currentCategory = selectedCategory || 'concept-notes';
        currentQuarter = quarter;

        // Initialize student grades for this subject if not exists
        initTeacherGradesStructure(currentStudentId, subjectName);

        // Define all categories
        const categories = [
            { id: 'concept-notes', name: 'Concept Notes', icon: 'fa-lightbulb', maxScore: 10 },
            { id: 'activities', name: 'Activities', icon: 'fa-tasks', maxScore: 100 },
            { id: 'quizzes', name: 'Quizzes', icon: 'fa-question-circle', maxScore: 100 },
            { id: 'preliminary-exam', name: 'Preliminary Examination', icon: 'fa-file-alt', maxScore: 50 },
            { id: 'departmental-exam', name: 'Departmental Examination', icon: 'fa-file-alt', maxScore: 50 }
        ];

        // Build the scoresheet page with teacher toolbar
        const html = `
            <div class="dashboard-content sheet-relative">
                <div class="score-sheet-top-layout">
                    <div class="grade-nav">
                        <button class="nav-pill active" id="backToStudentsBtn"><i class="fas fa-arrow-left"></i> Back to Students</button>
                        <div class="dropdown">
                            <button class="nav-pill" id="quarterBtn">${quarter.toUpperCase()} QUARTER <i class="fas fa-chevron-down"></i></button>
                            <div class="dropdown-content">
                                <button onclick="renderTeacherScoresheet('${subjectName}', '1st', '${currentCategory}')">1st Quarter</button>
                                <button onclick="renderTeacherScoresheet('${subjectName}', '2nd', '${currentCategory}')">2nd Quarter</button>
                                <button onclick="renderTeacherScoresheet('${subjectName}', '3rd', '${currentCategory}')">3rd Quarter</button>
                                <button onclick="renderTeacherScoresheet('${subjectName}', '4th', '${currentCategory}')">4th Quarter</button>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button class="nav-pill" id="categoryBtn">Categories <i class="fas fa-chevron-down"></i></button>
                            <div class="dropdown-content">
                                ${categories.map(cat => `<button onclick="renderTeacherScoresheet('${subjectName}', '${quarter}', '${cat.id}')">${cat.name}</button>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="teacher-toolbar" role="toolbar" aria-label="Teacher actions">
                        <div style="display:flex; gap:8px; align-items:center;">
                            <button class="teacher-btn" id="bulkEditToggle" onclick="toggleBulkEdit()">Toggle Bulk Edit</button>
                        </div>
                        <div style="text-align:right; font-size:0.9rem; color:#444;">
                            <div style="font-weight:700;">${student.name}</div>
                            <div style="font-size:0.8rem; color:#777;">${subjectName} • ${quarter.toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="student-sheet-header" style="visibility: hidden;"></div>
                </div>

                <div id="scoresheet-content"></div>
            </div>
        `;

        // Set the HTML into the container
        appContainer.innerHTML = html;
        console.log('[🎓 Teacher Scoresheet] HTML rendered to appContainer');

        // Setup back button event listener with error handling
        const backBtn = appContainer.querySelector('#backToStudentsBtn');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                try {
                    if (typeof openStudentsView === 'function') {
                        openStudentsView();
                    } else {
                        console.error('openStudentsView function not available');
                        if (typeof goBack === 'function') goBack();
                    }
                } catch (err) {
                    console.error('Error navigating back to students:', err);
                    if (typeof goBack === 'function') goBack();
                }
            };
        }

        // Find the selected category
        const selectedCategoryObj = categories.find(cat => cat.id === currentCategory);
        
        // Render only the selected category
        const contentContainer = document.getElementById('scoresheet-content');
        if (!contentContainer) {
            console.error('[🎓 Teacher Scoresheet] scoresheet-content container not found!');
            return;
        }
        
        const categoryDiv = renderTeacherCategorySection(subjectName, quarter, selectedCategoryObj);
        contentContainer.appendChild(categoryDiv);
        console.log('[🎓 Teacher Scoresheet] ✅ Teacher scoresheet fully loaded for:', student.name, 'Subject:', subjectName);
    } catch (error) {
        console.error('[🎓 renderTeacherScoresheet] Caught error:', error);
        showDialog({
            type: 'error',
            title: 'Error Loading Scoresheet',
            message: 'Failed to load scoresheet. Please check the browser console for details.'
        });
    }
}

/**
 * Initialize or get the grade structure for a subject (supporting new category-based format)
 */
function initTeacherGradesStructure(studentId, subjectName) {
    const sg = getSubjectGrades();
    
    if (!sg[studentId]) sg[studentId] = {};
    if (!sg[studentId][subjectName]) {
        sg[studentId][subjectName] = {
            '1st': { 'concept-notes': [], 'activities': [], 'quizzes': [], 'preliminary-exam': [], 'departmental-exam': [] },
            '2nd': { 'concept-notes': [], 'activities': [], 'quizzes': [], 'preliminary-exam': [], 'departmental-exam': [] },
            '3rd': { 'concept-notes': [], 'activities': [], 'quizzes': [], 'preliminary-exam': [], 'departmental-exam': [] },
            '4th': { 'concept-notes': [], 'activities': [], 'quizzes': [], 'preliminary-exam': [], 'departmental-exam': [] }
        };
    }
    // Ensure all quarters and categories exist
    ['1st', '2nd', '3rd', '4th'].forEach(q => {
        if (!sg[studentId][subjectName][q]) {
            sg[studentId][subjectName][q] = {};
        }
        ['concept-notes', 'activities', 'quizzes', 'preliminary-exam', 'departmental-exam'].forEach(cat => {
            if (!sg[studentId][subjectName][q][cat]) {
                sg[studentId][subjectName][q][cat] = [];
            }
        });
    });
    
    saveGrades();
}

/**
 * Render a single category section with its table
 */
function renderTeacherCategorySection(subjectName, quarter, category) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    const items = (sg[currentStudentId]?.[subjectName]?.[quarter]?.[category.id]) || [];

    // Get max score for this category
    const maxScore = category.maxScore || 10;

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'shadow-card';
    sectionDiv.style.cssText = 'padding: 20px; border-radius: 8px; background: white;';

    // Category header
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--au-blue); padding-bottom: 15px;';
    headerDiv.innerHTML = `
        <div>
            <h3 style="margin: 0; color: var(--au-blue);"><i class="fas ${category.icon}"></i> ${category.name}</h3>
            <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #666;">Max Score: ${maxScore} points</p>
        </div>
        <button class="nav-pill" onclick="addTeacherScoreItem('${subjectName}', '${quarter}', '${category.id}')">
            <i class="fas fa-plus"></i> Add Item
        </button>
    `;
    sectionDiv.appendChild(headerDiv);

    // Table
    const tableDiv = document.createElement('div');
    tableDiv.style.cssText = 'overflow-x: auto;';

    if (items.length === 0) {
        tableDiv.innerHTML = `
            <p style="color: #999; text-align: center; padding: 30px; margin: 0;">
                <i class="fas fa-inbox"></i> No items yet. Click "Add Item" to get started.
            </p>
        `;
    } else {
        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 40px;" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; width: 80px;">Item #</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; flex: 1; min-width: 150px;">Title</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 100px;">Score</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 120px;">Date Posted</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 120px;">Deadline</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 100px;">Status</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #333; width: 150px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach((item, idx) => {
            const itemNum = idx + 1;
            const status = getTeacherItemStatus(item);
            let statusColor = '#6c757d'; // Default grey for pending
            let statusLabel = 'Pending';
            let statusIcon = '○';
            
            if (status === 'green') {
                statusColor = '#28a745';
                statusLabel = '✓ Completed';
                statusIcon = '✓';
            } else if (status === 'red') {
                statusColor = '#dc3545';
                statusLabel = '✗ Overdue';
                statusIcon = '✗';
            }

            // Format category prefix for item number
            const categoryPrefix = category.name.split(' ')[0].charAt(0).toUpperCase();
            const isFirst = idx === 0;
            const isLast = idx === items.length - 1;

            tableHTML += `
                <tr style="border-bottom: 1px solid #eee; transition: all 0.2s;" draggable="true" 
                    ondragstart="handleTeacherItemDragStart(event, '${subjectName}', '${quarter}', '${category.id}', ${idx})"
                    ondragover="handleTeacherItemDragOver(event)" 
                    ondrop="handleTeacherItemDrop(event, '${subjectName}', '${quarter}', '${category.id}', ${idx})"
                    ondragend="handleTeacherItemDragEnd(event)"
                    onmouseover="this.style.backgroundColor='#f9f9f9'" 
                    onmouseout="this.style.backgroundColor='white'"
                    class="teacher-item-row">
                    
                    <!-- Drag Handle -->
                    <td style="padding: 12px; text-align: center; color: #999; cursor: move;" title="Drag to reorder">
                        <i class="fas fa-grip-vertical" style="cursor: move;"></i>
                    </td>
                    
                    <!-- Item Number -->
                    <td style="padding: 12px; text-align: left; font-weight: 600; color: var(--au-blue); teacher-item-num">${categoryPrefix}${itemNum}</td>
                    
                    <!-- Title -->
                    <td style="padding: 12px; text-align: left;">
                        <input type="text" value="${item.title || ''}" 
                            onchange="updateTeacherItem('${subjectName}', '${quarter}', '${category.id}', ${idx}, 'title', this.value)"
                            placeholder="Enter title..."
                            style="width: 90%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                    </td>
                    
                    <!-- Score -->
                    <td style="padding: 12px; text-align: center;">
                        <input type="number" value="${item.score || 0}" min="0" max="${maxScore}"
                            onchange="updateTeacherItem('${subjectName}', '${quarter}', '${category.id}', ${idx}, 'score', this.value, ${maxScore})"
                            style="width: 70px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 0.9rem;">
                        <span style="color: #999; font-size: 0.8rem; margin-left: 5px;">/ ${maxScore}</span>
                    </td>
                    
                    <!-- Date Posted -->
                    <td style="padding: 12px; text-align: center;">
                        <input type="date" value="${item.datePosted || ''}"
                            onchange="updateTeacherItem('${subjectName}', '${quarter}', '${category.id}', ${idx}, 'datePosted', this.value)"
                            style="width: 110px; padding: 6px 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                    </td>
                    
                    <!-- Deadline -->
                    <td style="padding: 12px; text-align: center;">
                        <input type="date" value="${item.deadline || ''}"
                            onchange="updateTeacherItem('${subjectName}', '${quarter}', '${category.id}', ${idx}, 'deadline', this.value)"
                            style="width: 110px; padding: 6px 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
                    </td>
                    
                    <!-- Status -->
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: inline-block; padding: 6px 12px; border-radius: 20px; background: ${statusColor}; color: white; font-weight: 600; font-size: 0.85rem; text-align: center;">
                            ${statusLabel}
                        </div>
                    </td>
                    
                    <!-- Actions -->
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <!-- Move Up -->
                            <button onclick="moveTeacherItemUp('${subjectName}', '${quarter}', '${category.id}', ${idx})" 
                                ${isFirst ? 'disabled' : ''} 
                                style="padding: 4px 6px; background: ${isFirst ? '#d0d0d0' : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: ${isFirst ? 'not-allowed' : 'pointer'}; font-size: 0.8rem; opacity: ${isFirst ? '0.5' : '1'};" 
                                title="Move up">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            
                            <!-- Move Down -->
                            <button onclick="moveTeacherItemDown('${subjectName}', '${quarter}', '${category.id}', ${idx})" 
                                ${isLast ? 'disabled' : ''} 
                                style="padding: 4px 6px; background: ${isLast ? '#d0d0d0' : '#28a745'}; color: white; border: none; border-radius: 4px; cursor: ${isLast ? 'not-allowed' : 'pointer'}; font-size: 0.8rem; opacity: ${isLast ? '0.5' : '1'};" 
                                title="Move down">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            
                            <!-- Delete -->
                            <button onclick="deleteTeacherScoreItemWithConfirmation('${subjectName}', '${quarter}', '${category.id}', ${idx})"
                                style="padding: 4px 6px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                                title="Delete item">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        tableDiv.innerHTML = tableHTML;
    }

    sectionDiv.appendChild(tableDiv);
    return sectionDiv;
}

/**
 * Determine the status of a score item
 * Green: score is entered before the deadline
 * Red: deadline passed without a score
 * Pending: no deadline set or still within deadline without score
 */
function getTeacherItemStatus(item) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Determine if score exists
    const hasScore = item.score && item.score > 0;
    
    // If no deadline, status depends on whether score is entered
    if (!item.deadline) {
        return hasScore ? 'green' : 'pending';
    }
    
    // Parse deadline date
    const deadlineDate = new Date(item.deadline);
    deadlineDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // If score is entered
    if (hasScore) {
        return 'green'; // Scored (regardless of deadline status)
    }
    
    // No score but deadline exists
    if (today > deadlineDate) {
        return 'red'; // Deadline passed without score
    }
    
    // No score and still within deadline
    return 'pending';
}

/**
 * Add a new item to a category table
 */
window.addTeacherScoreItem = function(subjectName, quarter, categoryId) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    
    if (!sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId]) {
        console.error('Unable to add item - invalid structure');
        return;
    }

    // Add a new empty item
    const newItem = {
        title: '',
        score: 0,
        datePosted: '',
        deadline: '',
        status: 'pending'
    };

    sg[currentStudentId][subjectName][quarter][categoryId].push(newItem);
    saveGrades();

    // Re-render the scoresheet, keeping the same category visible
    renderTeacherScoresheet(subjectName, quarter, categoryId);
    showSuccessToast(`✓ New item added to ${categoryId.split('-').join(' ')}!`);
};

/**
 * Update a single item field
 */
window.updateTeacherItem = function(subjectName, quarter, categoryId, itemIndex, field, value, maxScore = 100) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    
    if (!sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId]?.[itemIndex]) {
        console.error('Unable to update item - invalid structure');
        return;
    }

    const item = sg[currentStudentId][subjectName][quarter][categoryId][itemIndex];
    
    if (field === 'score') {
        // Clamp score to valid range [0, maxScore]
        item.score = Math.max(0, Math.min(maxScore, parseInt(value) || 0));
    } else {
        item[field] = value;
    }

    saveGrades();
    
    // Re-render to update status colors
    const selectedCategory = categoryId; // Keep the same category visible
    renderTeacherScoresheet(subjectName, quarter, selectedCategory);
};

/**
 * Delete an item from a category
 */
window.deleteTeacherScoreItem = function(subjectName, quarter, categoryId, itemIndex) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    
    if (!sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId]) {
        console.error('Unable to delete item - invalid structure');
        return;
    }

    sg[currentStudentId][subjectName][quarter][categoryId].splice(itemIndex, 1);
    saveGrades();

    // Re-render, keeping the same category visible
    renderTeacherScoresheet(subjectName, quarter, categoryId);
    showSuccessToast('✓ Item deleted!');
};

/**
 * Delete teacher score item with confirmation
 */
window.deleteTeacherScoreItemWithConfirmation = function(subjectName, quarter, categoryId, itemIndex) {
    window.showDeleteConfirmation('this item', function() {
        deleteTeacherScoreItem(subjectName, quarter, categoryId, itemIndex);
    });
};

// Global variable for tracking drags
let teacherItemDraggedIndex = null;

/**
 * Move teacher item up
 */
window.moveTeacherItemUp = function(subjectName, quarter, categoryId, itemIndex) {
    if (itemIndex <= 0) return;
    
    const sg = getSubjectGrades();
    const currentStudentId = getCurrentStudentId();
    const items = sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId];
    
    if (items && itemIndex > 0) {
        // Swap items
        const temp = items[itemIndex];
        items[itemIndex] = items[itemIndex - 1];
        items[itemIndex - 1] = temp;
        
        saveGrades();
        renderTeacherScoresheet(subjectName, quarter, categoryId);
        showSuccessToast('✓ Item moved up');
    }
};

/**
 * Move teacher item down
 */
window.moveTeacherItemDown = function(subjectName, quarter, categoryId, itemIndex) {
    const sg = getSubjectGrades();
    const currentStudentId = getCurrentStudentId();
    const items = sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId];
    
    if (items && itemIndex < items.length - 1) {
        // Swap items
        const temp = items[itemIndex];
        items[itemIndex] = items[itemIndex + 1];
        items[itemIndex + 1] = temp;
        
        saveGrades();
        renderTeacherScoresheet(subjectName, quarter, categoryId);
        showSuccessToast('✓ Item moved down');
    }
};

/**
 * Handle drag start for teacher items
 */
window.handleTeacherItemDragStart = function(event, subjectName, quarter, categoryId, itemIndex) {
    teacherItemDraggedIndex = itemIndex;
    event.dataTransfer.effectAllowed = 'move';
    const row = event.target.closest('tr');
    if (row) {
        row.style.opacity = '0.5';
    }
};

/**
 * Handle drag over for teacher items
 */
window.handleTeacherItemDragOver = function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const row = event.target.closest('tr');
    if (row) {
        row.style.borderTop = '3px solid #007bff';
    }
};

/**
 * Handle drop for teacher items
 */
window.handleTeacherItemDrop = function(event, subjectName, quarter, categoryId, dropIndex) {
    event.preventDefault();
    event.stopPropagation();
    
    if (teacherItemDraggedIndex === null || teacherItemDraggedIndex === dropIndex) return;
    
    const sg = getSubjectGrades();
    const currentStudentId = getCurrentStudentId();
    const items = sg[currentStudentId]?.[subjectName]?.[quarter]?.[categoryId];
    
    if (items) {
        // Move item by removing and inserting at new position
        const [movedItem] = items.splice(teacherItemDraggedIndex, 1);
        if (teacherItemDraggedIndex < dropIndex) {
            // Moving down
            items.splice(dropIndex - 1, 0, movedItem);
        } else {
            // Moving up
            items.splice(dropIndex, 0, movedItem);
        }
        
        saveGrades();
        renderTeacherScoresheet(subjectName, quarter, categoryId);
    }
    
    teacherItemDraggedIndex = null;
};

/**
 * Handle drag end for teacher items
 */
window.handleTeacherItemDragEnd = function(event) {
    const row = event.target.closest('tr');
    if (row) {
        row.style.opacity = '1';
        row.style.borderTop = 'none';
    }
    teacherItemDraggedIndex = null;
};

/**
 * Save all grades to storage with a single click
 */
window.saveAllTeacherScores = function() {
    try {
        saveGrades();
        showSuccessToast('✓ All scores saved');
    } catch (e) {
        console.error('Error saving grades:', e);
        showSuccessToast('Error saving scores');
    }
};

/**
 * Export current student's subject-quarter scores to CSV
 */
window.exportTeacherScoresCSV = function(subjectName, quarter) {
    const currentStudentId = getCurrentStudentId();
    const sg = getSubjectGrades();
    const student = getStudentData(currentStudentId) || { name: 'student' };

    const data = [];
    const categories = sg?.[currentStudentId]?.[subjectName]?.[quarter] || {};
    for (const cat in categories) {
        const items = categories[cat] || [];
        items.forEach((it, idx) => {
            data.push({
                category: cat,
                item: idx + 1,
                title: it.title || '',
                score: it.score || 0,
                max: it.max || '',
                datePosted: it.datePosted || '',
                deadline: it.deadline || ''
            });
        });
    }

    // Build CSV
    const rows = [];
    rows.push(['Category', 'Item #', 'Title', 'Score', 'Max', 'Date Posted', 'Deadline']);
    data.forEach(r => rows.push([r.category, r.item, `"${(r.title||'').replace(/"/g,'""')}"`, r.score, r.max, r.datePosted, r.deadline]));

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${student.name.replace(/\s+/g,'_')}-${subjectName}-${quarter}.csv`;

    if (navigator.msSaveBlob) { // IE10+
        navigator.msSaveBlob(blob, fileName);
    } else {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    showSuccessToast('✓ Exported CSV');
};

/**
 * Toggle bulk edit mode (enables/disables all inputs in the scoresheet)
 */
window.toggleBulkEdit = function() {
    const container = document.getElementById('scoresheet-content');
    if (!container) return;
    const current = container.getAttribute('data-bulk-edit') === '1';
    const enable = !current;
    container.setAttribute('data-bulk-edit', enable ? '1' : '0');

    const inputs = container.querySelectorAll('input');
    inputs.forEach(inp => {
        // For bulk mode, enable inputs; otherwise keep default enabled state
        inp.disabled = !enable;
    });

    const btn = document.getElementById('bulkEditToggle');
    if (btn) btn.textContent = enable ? 'Bulk Edit: ON' : 'Toggle Bulk Edit';
    showSuccessToast(enable ? 'Bulk edit enabled' : 'Bulk edit disabled');
};

export function confirmStudentSelection() {
    const currentUser = getCurrentUser();
    const selectedId = document.getElementById('selectedStudentId').value;
    setCurrentStudentId(selectedId);
    const role = userAccounts[currentUser].role;
    
    if (role === 'teacher') {
        // Teacher: automatically redirect to scoresheet for the selected student
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        const student = getStudentData(selectedId);
        
        if (!student) {
            showDialog({
                type: 'error',
                title: 'Student Not Found',
                message: 'Unable to load student information.'
            });
            openStudentsView();
            return;
        }
        
        // Filter to subjects teacher teaches and student takes
        const availableSubjects = assigned.filter(s => 
            Array.isArray(student.subjects) && student.subjects.includes(s)
        );
        
        if (availableSubjects.length === 0) {
            showDialog({
                type: 'error',
                title: 'No Subjects Available',
                message: 'You do not teach any subjects for this student.'
            });
            openStudentsView();
            return;
        }
        
        // Automatically redirect to scoresheet with first available subject
        renderTeacherScoresheet(availableSubjects[0], "1st");
    } else {
        // Student: show subjects view
        openSubjects();
    }
}

// Helper function to get icon based on subject name
function getSubjectIcon(subjectName) {
    const name = subjectName.toLowerCase();
    
    // Work Immersion, Internship, Training, Practice
    if (name.includes('work immersion') || name.includes('internship') || name.includes('training') ||
        name.includes('practice') || name.includes('apprentice')) {
        return 'fa-briefcase';
    }
    
    // Research Project, Research, Thesis
    if (name.includes('research') || name.includes('project') || name.includes('thesis') ||
        name.includes('experiment')) {
        return 'fa-microscope';
    }
    
    // Understanding Culture, Society And Politics, Civics, Social Studies
    if (name.includes('culture') || name.includes('society') || name.includes('politics') ||
        name.includes('civics') || name.includes('government') || name.includes('citizenship')) {
        return 'fa-handshake';
    }
    
    // Contemporary Philippine Arts, Arts Appreciation, Theater, Performance
    if (name.includes('contemporary') || name.includes('philippine arts') || name.includes('arts from') ||
        name.includes('theater') || name.includes('performing') || name.includes('drama')) {
        return 'fa-theater-masks';
    }
    
    // Physical Science, Physical Education, PE, Sports, Fitness, Gym
    if (name.includes('physical education') || name.includes('pe ') || name.includes('sports') ||
        name.includes('fitness') || name.includes('gym') || name.includes('athletics') ||
        name.includes('wellness')) {
        return 'fa-dumbbell';
    }
    
    // Physical Science, Chemistry, Physics, Science
    if (name.includes('physical science') || name.includes('physics') || name.includes('chemistry') ||
        name.includes('science') || name.includes('lab') || name.includes('biology')) {
        return 'fa-atom';
    }
    
    // ICT, IT, Computer Science, Programming, Web Development
    if (name.includes('ict') || name.includes('it ') || name.includes('computer') || 
        name.includes('programming') || name.includes('web') || name.includes('code') ||
        name.includes('software') || name.includes('system') || name.includes('network')) {
        return 'fa-laptop-code';
    }
    
    // Animation, Art, Design, Graphics, Drawing, Visual
    if (name.includes('animation') || name.includes('art') || name.includes('design') ||
        name.includes('graphic') || name.includes('drawing') || name.includes('visual') ||
        name.includes('photo') || name.includes('image')) {
        return 'fa-palette';
    }
    
    // Video, Film, Media, Multimedia, Production
    if (name.includes('video') || name.includes('film') || name.includes('media') ||
        name.includes('multimedia') || name.includes('production') || name.includes('cinema')) {
        return 'fa-video';
    }
    
    // Music, Audio, Sound
    if (name.includes('music') || name.includes('audio') || name.includes('sound')) {
        return 'fa-music';
    }
    
    // Math, Mathematics, Calculus, Algebra
    if (name.includes('math') || name.includes('calculus') || name.includes('algebra') ||
        name.includes('geometry') || name.includes('statistics') || name.includes('numeric')) {
        return 'fa-calculator';
    }
    
    // English, Language, Literature, Writing, Reading
    if (name.includes('english') || name.includes('language') || name.includes('literature') ||
        name.includes('writing') || name.includes('reading') || name.includes('grammar') ||
        name.includes('communication')) {
        return 'fa-book';
    }
    
    // History, Social Studies, Geography
    if (name.includes('history') || name.includes('social') || name.includes('geography')) {
        return 'fa-globe';
    }
    
    // Business, Economics, Finance, Accounting
    if (name.includes('business') || name.includes('economics') || name.includes('finance') ||
        name.includes('accounting') || name.includes('commerce') || name.includes('trade') ||
        name.includes('entrepreneurship')) {
        return 'fa-chart-line';
    }
    
    // Health, Medicine, Nursing, Medical
    if (name.includes('health') || name.includes('medicine') || name.includes('nursing') ||
        name.includes('medical') || name.includes('nutrition')) {
        return 'fa-heartbeat';
    }
    
    // Engineering, Technology, Mechanics, Architecture
    if (name.includes('engineer') || name.includes('technolog') || name.includes('mechanic') ||
        name.includes('architecture') || name.includes('robotics')) {
        return 'fa-wrench';
    }
    
    // Environmental Studies, Ecology, Environment
    if (name.includes('environment') || name.includes('ecology') || name.includes('green')) {
        return 'fa-leaf';
    }
    
    // Philosophy, Ethics, Religion
    if (name.includes('philosophy') || name.includes('ethics') || name.includes('religion') ||
        name.includes('moral')) {
        return 'fa-lightbulb';
    }
    
    // Entrepreneurship, Business, Enterprise
    if (name.includes('entrepreneurship') || name.includes('enterprise')) {
        return 'fa-rocket';
    }
    
    // Journalism, Media, Communication
    if (name.includes('journalism') || name.includes('broadcast') || name.includes('communication')) {
        return 'fa-newspaper';
    }
    
    // Psychology, Behavior, Human Development
    if (name.includes('psychology') || name.includes('behavior') || name.includes('development')) {
        return 'fa-brain';
    }
    
    // Cookery, Home Economics, Culinary
    if (name.includes('cookery') || name.includes('home ec') || name.includes('culinary') ||
        name.includes('food')) {
        return 'fa-utensils';
    }
    
    // Tourism, Hospitality, Travel
    if (name.includes('tourism') || name.includes('hospitality') || name.includes('travel')) {
        return 'fa-map';
    }
    
    // Default icon
    return 'fa-book-open';
}

export function openSubjects(filteredSubject = null) {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    const userRole = userAccounts[currentUser].role;

    document.querySelector('.view-title').textContent = "My Subjects";

    let backAction = "renderApp()";
    let backText = "Back to Dashboard";

    if (currentUser && userRole !== 'student') {
        backAction = "openStudentsView()";
        backText = "Back to Student Selection";
    }

    appContainer.innerHTML = `
        <div class="dashboard-content">
            <div style="margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="${backAction}" class="nav-pill">
                    <i class="fas fa-arrow-left"></i> ${backText}
                </button>
                ${userRole === 'student' ? `
                    <button onclick="openNotificationsView()" class="nav-pill" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-bell"></i> Pending Tasks
                    </button>
                ` : ''}
            </div>
            
            <div id="subjects-container" class="subjects-grid"></div>
        </div>
    `;

    const container = document.getElementById('subjects-container');
    const user = userAccounts[currentUser];
    let subjects = [];

    // For students: get from user.subjects (or from cluster data if missing)
    if (userRole === 'student') {
        subjects = user.subjects || [];
        if (subjects.length === 0 && currentStudentId) {
            const studentData = getStudentData(currentStudentId);
            if (studentData && studentData.subjects) subjects = studentData.subjects;
        }
    }
    // For teachers: subject list comes from assignedSubjects
    else if (userRole === 'teacher') {
        subjects = user.assignedSubjects || [];
    }

    // If teacher is viewing a student's profile, ensure teacher only sees subjects
    // they teach and that the student takes. If a filteredSubject is provided
    // (teacher selected a specific subject), narrow to that single subject.
    if (userRole === 'teacher' && currentStudentId) {
        const student = getStudentData(currentStudentId);
        if (!student) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted);">Student data not found.</p></div>`;
            return;
        }

        subjects = (user.assignedSubjects || []).filter(s => Array.isArray(student.subjects) && student.subjects.includes(s));

        if (filteredSubject) {
            subjects = subjects.filter(s => s === filteredSubject);
        }
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-book" style="font-size: 3rem; color: var(--au-blue); opacity: 0.3; margin-bottom: 15px; display: block;"></i>
                <p style="color: var(--text-muted); font-size: 1.1rem; margin: 0;">No subjects available.</p>
            </div>
        `;
        return;
    }

    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'
    ];

    subjects.forEach((sub, i) => {
        const card = document.createElement('div');
        card.className = 'subject-card shadow-card';
        card.style.background = gradients[i % gradients.length];
        const icon = getSubjectIcon(sub);
        card.innerHTML = `
            <div class="subject-card-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="subject-card-content">
                <h3 class="subject-card-title">${sub}</h3>
                <p class="subject-card-desc">View grades & scores</p>
            </div>
        `;

        // Route based on user role
        if (userRole === 'student') {
            // Students go to student scoresheet view
            card.onclick = () => renderStudentScoresheet(sub);
        } else {
            // Teachers go to subject details (old view) or teacher scoresheet
            card.onclick = () => renderSubjectDetails(sub);
        }
        container.appendChild(card);
    });
}

export function renderScoresheet(subjectName, availableSubjects = [], quarter = "1st") {
    // Deprecated - use renderSubjectDetails instead
    renderSubjectDetails(subjectName, quarter);
}

export function renderCategoryTable(category, quarter = "1st") {
    // Deprecated - using original renderSubjectDetails instead
    console.log("renderCategoryTable deprecated - use renderSubjectDetails");
}

export function updateItemField(category, index, field, value) {
    // Deprecated - using original updateScore instead
    console.log("updateItemField deprecated - use updateScore");
}

export function addItemToCategory(category) {
    // Deprecated - using original system instead
    console.log("addItemToCategory deprecated - use original system");
}

export function initStudentGradesWithCategories(id) {
    const sg = getSubjectGrades();
    if (!sg[id]) sg[id] = {};
    const subjects = ["ANIMATION 3", "ANIMATION 4", "WORK IMMERSION", "PHYSICAL EDUCATION", "RESEARCH PROJECT", "USCP", "PHYSICAL SCIENCE", "CPAR"];
    subjects.forEach(sub => {
        if (!sg[id][sub]) {
            sg[id][sub] = {
                "quarters": {
                    "1st": {
                        'concept-notes': [],
                        'activities': [],
                        'quizzes': [],
                        'preliminary': []
                    },
                    "2nd": {
                        'concept-notes': [],
                        'activities': [],
                        'quizzes': [],
                        'preliminary': []
                    },
                    "3rd": {
                        'concept-notes': [],
                        'activities': [],
                        'quizzes': [],
                        'preliminary': []
                    },
                    "4th": {
                        'concept-notes': [],
                        'activities': [],
                        'quizzes': [],
                        'preliminary': []
                    }
                }
            };
        }
    });
}

export function renderSubjectDetails(subjectName, quarter = "1st") {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    setCurrentViewedSubject(subjectName);
    initStudentGrades(currentStudentId); 
    
    const student = getStudentData(currentStudentId) || { name: "Student", img: "images/default.svg" };
    
    const role = userAccounts[currentUser].role;
    let displayName = "";

    // Authorization: teachers can only open subjects assigned to them
    if (role === 'teacher') {
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        if (!assigned.includes(subjectName)) {
            showDialog({
                type: 'error',
                title: 'Access Denied',
                message: 'You are not authorized to view this subject.'
            });
            return;
        }
    }

    if (role === 'student') {
        displayName = "Subject: " + subjectName;
    } else {
        displayName = student.name;
    }

    document.querySelector('.view-title').textContent = `${subjectName} | ${displayName}`;
    appContainer.innerHTML = '';
    
    const templateContent = document.getElementById('subject-detail-view').content.cloneNode(true);
    const profileImg = templateContent.querySelector('#student-sheet-pic');
    if (profileImg) {
        profileImg.src = student.img || 'images/default.svg';
    }

    appContainer.appendChild(templateContent);

    // Setup Back Button with proper error handling
    const backBtn = appContainer.querySelector('.nav-pill'); 
    if (backBtn && userAccounts[currentUser]) {
        if (userAccounts[currentUser].role === 'teacher') {
            backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> Back to Students`;
            backBtn.onclick = function(e) {
                e.preventDefault();
                try {
                    if (typeof openStudentsView === 'function') {
                        openStudentsView();
                    } else {
                        console.error('openStudentsView function not available');
                        if (typeof goBack === 'function') goBack();
                    }
                } catch (err) {
                    console.error('Error navigating back to students:', err);
                    if (typeof goBack === 'function') goBack();
                }
            };
        } else {
            backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> Back to Subjects`;
            backBtn.onclick = function(e) {
                e.preventDefault();
                try {
                    if (typeof openSubjects === 'function') {
                        openSubjects();
                    } else {
                        console.error('openSubjects function not available');
                        if (typeof goBack === 'function') goBack();
                    }
                } catch (err) {
                    console.error('Error navigating back to subjects:', err);
                    if (typeof goBack === 'function') goBack();
                }
            };
        }
    }

    // Setup Quarter Button and Table
    document.getElementById('quarterBtn').innerHTML = `${quarter.toUpperCase()} QUARTER <i class="fas fa-chevron-down"></i>`;
    const tbody = document.getElementById('scores-table-body');
    const sg = getSubjectGrades();
    const data = sg[currentStudentId] && sg[currentStudentId][subjectName] && sg[currentStudentId][subjectName][quarter] ? sg[currentStudentId][subjectName][quarter] : [];

    for (let i = 1; i <= 11; i++) {
        const row = data[i - 1] || { n: 0, a: 0, p: 0, e: 0 };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num">No. ${i}</td>
            ${createScoreCell(i, 'n', row.n)}
            ${createScoreCell(i, 'a', row.a)}
            ${createScoreCell(i, 'p', row.p)}
            ${createScoreCell(i, 'e', row.e)}
        `;
        tbody.appendChild(tr);
    }
}

export function updateQuarter(q) {
    // update the quarter button text if present (template-based views)
    const btn = document.getElementById('quarterBtn');
    if (btn) btn.innerHTML = `${q.toUpperCase()} QUARTER <i class="fas fa-chevron-down"></i>`;
    renderSubjectDetails(getCurrentViewedSubject(), q);
}

export function createScoreCell(rowIdx, type, value) {
    const currentUser = getCurrentUser();
    const currentViewedSubject = getCurrentViewedSubject();
    let isReadOnly = '';

    // Non-teachers cannot edit
    if (userAccounts[currentUser].role !== 'teacher') {
        isReadOnly = 'disabled';
    } else {
        // Teachers can edit only if the subject is assigned to them
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        if (!assigned.includes(currentViewedSubject)) isReadOnly = 'disabled';
    }

    return `<td><input type="number" class="score-input" value="${value}" min="0" max="100" ${isReadOnly} oninput="updateScore(${rowIdx-1}, '${type}', this.value)"></td>`;
}

export function updateScore(idx, type, val) {
    const currentStudentId = getCurrentStudentId();
    const currentViewedSubject = getCurrentViewedSubject();
    const quarterText = document.getElementById('quarterBtn').textContent.trim().split(' ')[0].toLowerCase();
    const quarter = quarterText || "1st"; 
    
    let numericVal = parseInt(val);
    if (isNaN(numericVal)) numericVal = 0;
    if (numericVal > 100) numericVal = 100;
    if (numericVal < 0) numericVal = 0;

    const sg = getSubjectGrades();
    // Authorization: ensure teacher is allowed to update this subject
    const currentUser = getCurrentUser();
    if (userAccounts[currentUser].role === 'teacher') {
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        if (!assigned.includes(currentViewedSubject)) {
            showDialog({ type: 'error', title: 'Access Denied', message: 'You are not authorized to modify this subject.' });
            return;
        }
    }
    if (!sg[currentStudentId]) sg[currentStudentId] = {};
    if (!sg[currentStudentId][currentViewedSubject]) sg[currentStudentId][currentViewedSubject] = {};
    if (!sg[currentStudentId][currentViewedSubject][quarter]) sg[currentStudentId][currentViewedSubject][quarter] = [];
    
    const data = sg[currentStudentId][currentViewedSubject][quarter];
    if (!data[idx]) data[idx] = { n: 0, a: 0, p: 0, e: 0 };
    
    data[idx][type] = numericVal;
    saveGrades(); 
}

export function initStudentGrades(id) {
    const sg = getSubjectGrades();
    if (!sg[id]) sg[id] = {};
    const subjects = ["ANIMATION 3", "ANIMATION 4", "WORK IMMERSION", "PHYSICAL EDUCATION", "RESEARCH PROJECT", "USCP", "PHYSICAL SCIENCE", "CPAR"];
    subjects.forEach(sub => {
        if (!sg[id][sub]) sg[id][sub] = { "1st": [], "2nd": [], "3rd": [], "4th": [] };
    });
}

export function onClusterChange() {
    const cluster = document.getElementById('clusterSelect').value;
    const strandSel = document.getElementById('strandSelect');
    const secSel = document.getElementById('sectionSelect');
    
    strandSel.innerHTML = '<option value="">--Select Strand--</option>';
    secSel.innerHTML = '<option value="">--Select Section--</option>';
    strandSel.disabled = true;
    secSel.disabled = true;

    const c = getClusters();
    if (cluster && c[cluster]) {
        Object.keys(c[cluster]).forEach(strand => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = strand;
            strandSel.appendChild(opt);
        });
        strandSel.disabled = false;
    }
    updateStudentList();
}

export function onTeacherClusterChange() {
    const cluster = document.getElementById('t-cluster').value;
    
    const c = getClusters();
    if (cluster && c[cluster]) {
        populateTeacherStrandSectionsUI();
        populateTeacherSubjectsForCluster();
        updateTeacherCompleteSummary();
    } else {
        const container = document.getElementById('teacher-strand-sections-container');
        if (container) {
            container.innerHTML = '<p style="color: #999; font-size: 0.9rem; margin: 0;">Select a cluster first to choose strands and sections.</p>';
        }
        const subjectsList = document.getElementById('t-subjects-list');
        if (subjectsList) {
            subjectsList.innerHTML = '<p style="color: #999; font-size: 0.9rem; grid-column: 1/-1;">Select a cluster first to see available subjects.</p>';
        }
    }
}

export function onTeacherStrandChange() {
    const cluster = document.getElementById('t-cluster').value;
    const strand = document.getElementById('t-strand').value;
    const secSel = document.getElementById('t-section');
    
    secSel.innerHTML = '<option value="">--Select Section--</option>';
    
    const c = getClusters();
    if (cluster && strand && c[cluster] && c[cluster][strand]) {
        // Populate sections, filtering out 'subjects' property
        Object.keys(c[cluster][strand]).filter(key => key !== 'subjects').forEach(section => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = section;
            secSel.appendChild(opt);
        });
    }
}

export function populateTeacherStrandSectionsUI() {
    const cluster = document.getElementById('t-cluster')?.value;
    const container = document.getElementById('teacher-strand-sections-container');
    
    if (!container) return;
    
    if (!cluster) {
        container.innerHTML = '<p style="color: #999; font-size: 0.9rem; margin: 0;">Select a cluster first to choose strands and sections.</p>';
        return;
    }
    
    const c = getClusters();
    if (!c[cluster]) {
        container.innerHTML = '<p style="color: #999; font-size: 0.9rem; margin: 0;">No strands available in this cluster.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    Object.keys(c[cluster]).forEach(strand => {
        const strandDiv = document.createElement('div');
        strandDiv.style.cssText = 'border: 1px solid #ddd; padding: 12px; border-radius: 6px; background: white;';
        
        // Strand checkbox
        const strandLabel = document.createElement('label');
        strandLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; font-weight: 500; margin-bottom: 10px; cursor: pointer;';
        const strandCheckbox = document.createElement('input');
        strandCheckbox.type = 'checkbox';
        strandCheckbox.value = strand;
        strandCheckbox.className = 'teacher-strand-checkbox';
        strandCheckbox.onchange = () => onTeacherStrandToggle(strand);
        
        strandLabel.appendChild(strandCheckbox);
        strandLabel.appendChild(document.createTextNode(strand));
        
        strandDiv.appendChild(strandLabel);
        
        // Sections container (initially hidden)
        const sectionsDiv = document.createElement('div');
        sectionsDiv.className = `sections-for-${strand}`;
        sectionsDiv.style.cssText = 'margin-left: 25px; display: none; gap: 8px; flex-wrap: wrap;';
        
        const sections = Object.keys(c[cluster][strand]).filter(key => key !== 'subjects');
        
        sections.forEach(section => {
            const sectionLabel = document.createElement('label');
            sectionLabel.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 0.9rem; cursor: pointer;';
            const sectionCheckbox = document.createElement('input');
            sectionCheckbox.type = 'checkbox';
            sectionCheckbox.value = section;
            sectionCheckbox.className = `section-checkbox-${strand}`;
            sectionCheckbox.dataset.strand = strand;
            sectionCheckbox.dataset.section = section;
            // Add both onchange and event listener for better compatibility
            sectionCheckbox.onchange = () => {
                updateTeacherCompleteSummary();
                updateTeacherSubjectsForSelectedStrands();
            };
            sectionCheckbox.addEventListener('change', () => {
                updateTeacherCompleteSummary();
                updateTeacherSubjectsForSelectedStrands();
            });
            
            sectionLabel.appendChild(sectionCheckbox);
            sectionLabel.appendChild(document.createTextNode(section));
            sectionsDiv.appendChild(sectionLabel);
        });
        
        strandDiv.appendChild(sectionsDiv);
        container.appendChild(strandDiv);
    });
}

export function onTeacherStrandToggle(strand) {
    const checkbox = document.querySelector(`.teacher-strand-checkbox[value="${strand}"]`);
    const sectionsDiv = document.querySelector(`.sections-for-${strand}`);
    
    if (!checkbox || !sectionsDiv) return;
    
    if (checkbox.checked) {
        sectionsDiv.style.display = 'flex';
    } else {
        sectionsDiv.style.display = 'none';
        // Uncheck all sections when strand is unchecked
        sectionsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    
    // Update the assignment summary and subjects
    updateTeacherCompleteSummary();
    updateTeacherSubjectsForSelectedStrands();
}

export function getTeacherStrandSections() {
    const strandSections = {};
    const container = document.getElementById('teacher-strand-sections-container');
    
    if (!container) return strandSections;
    
    // Get all checked strands
    container.querySelectorAll('.teacher-strand-checkbox:checked').forEach(strandCheckbox => {
        const strand = strandCheckbox.value;
        const sectionsDiv = container.querySelector(`.sections-for-${strand}`);
        
        if (sectionsDiv) {
            const sections = Array.from(sectionsDiv.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            strandSections[strand] = sections;
        }
    });
    
    return strandSections;
}

export function updateTeacherSubjectsForSelectedStrands() {
    const cluster = document.getElementById('t-cluster')?.value;
    const strandSections = getTeacherStrandSections();
    const subjectsList = document.getElementById('t-subjects-list');
    
    console.log('updateTeacherSubjectsForSelectedStrands called');
    console.log('Selected strands:', Object.keys(strandSections));
    
    if (!subjectsList || !cluster) {
        console.log('No subjectsList or cluster');
        return;
    }
    
    const c = getClusters();
    if (!c[cluster]) {
        console.log('Cluster not found:', cluster);
        return;
    }
    
    // Get subjects only from selected strands
    const availableSubjects = new Set();
    Object.entries(strandSections).forEach(([strand, sections]) => {
        console.log(`Checking strand: ${strand}, sections count: ${sections.length}`);
        if (sections.length > 0 && c[cluster][strand] && c[cluster][strand].subjects) {
            console.log(`  Strand ${strand} has subjects:`, c[cluster][strand].subjects);
            c[cluster][strand].subjects.forEach(subject => availableSubjects.add(subject));
        } else {
            console.log(`  Strand ${strand} - no subjects data or no sections selected`);
        }
    });
    
    console.log('Available subjects to show:', Array.from(availableSubjects));
    
    // Hide/show subjects based on selection
    document.querySelectorAll('.teacher-subject-checkbox').forEach(checkbox => {
        const subject = checkbox.value;
        const label = checkbox.parentElement;
        
        if (availableSubjects.has(subject)) {
            label.style.display = 'flex';
        } else {
            checkbox.checked = false;
            label.style.display = 'none';
        }
    });
}

export function populateTeacherSubjectsForCluster() {
    const cluster = document.getElementById('t-cluster')?.value;
    const subjectsList = document.getElementById('t-subjects-list');
    
    if (!subjectsList) return;
    
    subjectsList.innerHTML = '';
    
    if (!cluster) {
        subjectsList.innerHTML = '<p style="color: #999; font-size: 0.9rem; grid-column: 1/-1;">Select a cluster first to see available subjects.</p>';
        return;
    }
    
    const c = getClusters();
    if (!c[cluster]) {
        subjectsList.innerHTML = '<p style="color: #999; font-size: 0.9rem; grid-column: 1/-1;">No subjects available in this cluster.</p>';
        return;
    }
    
    // Get all unique subjects from all strands in this cluster
    const subjectsSet = new Set();
    Object.values(c[cluster]).forEach(strand => {
        if (strand.subjects && Array.isArray(strand.subjects)) {
            strand.subjects.forEach(subject => subjectsSet.add(subject));
        }
    });
    
    if (subjectsSet.size === 0) {
        subjectsList.innerHTML = '<p style="color: #999; font-size: 0.9rem; grid-column: 1/-1;">No subjects available in this cluster yet.</p>';
        return;
    }
    
    Array.from(subjectsSet).forEach(subject => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border: 1px solid #e0e0e0; border-radius: 6px; cursor: pointer; transition: all 0.2s;';
        label.onmouseover = () => label.style.backgroundColor = '#f0f7ff';
        label.onmouseout = () => label.style.backgroundColor = 'white';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = subject;
        checkbox.className = 'teacher-subject-checkbox';
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(subject));
        subjectsList.appendChild(label);
    });
    
    // Update based on currently selected strands
    updateTeacherSubjectsForSelectedStrands();
}

export function updateTeacherCompleteSummary() {
    const summaryDiv = document.getElementById('teacher-complete-summary');
    if (!summaryDiv) return;
    
    const fname = document.getElementById('t-fname').value.trim();
    const mname = document.getElementById('t-mname').value.trim();
    const lname = document.getElementById('t-lname').value.trim();
    const bday = document.getElementById('t-bday').value;
    const age = document.getElementById('t-age').value;
    const gender = document.getElementById('t-gender').value;
    const address = document.getElementById('t-address').value.trim();
    const user = document.getElementById('t-username').value.trim();
    const pass = document.getElementById('t-password').value;
    const cluster = document.getElementById('t-cluster')?.value;
    const strandSections = getTeacherStrandSections();
    
    const selectedSubjects = [];
    document.querySelectorAll('.teacher-subject-checkbox:checked').forEach(cb => selectedSubjects.push(cb.value));
    
    // Check if all data is filled
    const isComplete = fname && lname && bday && gender && user && pass && cluster && Object.keys(strandSections).length > 0 && selectedSubjects.length > 0;
    
    if (!isComplete) {
        summaryDiv.innerHTML = '<p style="color: #999; margin: 0; font-style: italic;">Fill in all fields above to see complete summary</p>';
        return;
    }
    
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    let html = `
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid var(--au-blue);">
            <p style="margin: 8px 0;"><strong>📝 Name:</strong> ${fullName}</p>
            <p style="margin: 8px 0;"><strong>🎂 Birthday:</strong> ${bday}${age ? ` (Age: ${age})` : ''}</p>
            <p style="margin: 8px 0;"><strong>👤 Gender:</strong> ${gender}</p>
            ${address ? `<p style="margin: 8px 0;"><strong>📍 Address:</strong> ${address}</p>` : ''}
            <p style="margin: 8px 0;"><strong>🔐 Username:</strong> ${user}</p>
            <p style="margin: 8px 0;"><strong>🔑 Password:</strong> ${pass}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #28a745;">
            <p style="margin: 8px 0; font-weight: 600; color: #28a745;">📍 Assignment Details</p>
            <p style="margin: 8px 0;"><strong>Cluster:</strong> ${cluster}</p>
    `;
    
    Object.entries(strandSections).forEach(([strand, sections]) => {
        if (sections.length > 0) {
            html += `<p style="margin: 8px 0;"><strong>${strand}:</strong> ${sections.join(', ')}</p>`;
        }
    });
    
    html += `</div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #ff9800;">
            <p style="margin: 8px 0; font-weight: 600; color: #ff9800;">📚 Subjects to Handle</p>
            <p style="margin: 8px 0;">${selectedSubjects.join(', ')}</p>
        </div>
    `;
    
    summaryDiv.innerHTML = html;
}

export function updateStudentCompleteSummary() {
    const summaryDiv = document.getElementById('student-complete-summary');
    if (!summaryDiv) return;
    
    const fname = document.getElementById('s-fname').value.trim();
    const mname = document.getElementById('s-mname').value.trim();
    const lname = document.getElementById('s-lname').value.trim();
    const bday = document.getElementById('s-bday').value;
    const age = document.getElementById('s-age').value;
    const gender = document.getElementById('s-gender').value;
    const lrn = document.getElementById('s-lrn').value.trim();
    const studentNumber = document.getElementById('s-student-number').value.trim();
    const address = document.getElementById('s-address').value.trim();
    const cluster = document.getElementById('s-cluster').value;
    const strand = document.getElementById('s-strand').value;
    const section = document.getElementById('s-section').value;
    const user = document.getElementById('s-username').value.trim();
    const pass = document.getElementById('s-password').value;
    
    // Check if all required data is filled
    const isComplete = fname && lname && bday && gender && cluster && strand && section && user && pass;
    
    if (!isComplete) {
        summaryDiv.innerHTML = '<p style="color: #999; margin: 0; font-style: italic;">Fill in all fields above to see complete summary</p>';
        return;
    }
    
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    let html = `
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid var(--au-blue);">
            <p style="margin: 8px 0;"><strong>📝 Name:</strong> ${fullName}</p>
            <p style="margin: 8px 0;"><strong>🎂 Birthday:</strong> ${bday}${age ? ` (Age: ${age})` : ''}</p>
            <p style="margin: 8px 0;"><strong>👤 Gender:</strong> ${gender}</p>
            ${lrn ? `<p style="margin: 8px 0;"><strong>🆔 LRN:</strong> ${lrn}</p>` : ''}
            ${studentNumber ? `<p style="margin: 8px 0;"><strong>🎓 Student Number:</strong> ${studentNumber}</p>` : ''}
            ${address ? `<p style="margin: 8px 0;"><strong>📍 Address:</strong> ${address}</p>` : ''}
            <p style="margin: 8px 0;"><strong>🔐 Username:</strong> ${user}</p>
            <p style="margin: 8px 0;"><strong>🔑 Password:</strong> ${pass}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #28a745; margin-top: 10px;">
            <p style="margin: 8px 0; font-weight: 600; color: #28a745;">📍 Academic Details</p>
            <p style="margin: 8px 0;"><strong>Cluster:</strong> ${cluster}</p>
            <p style="margin: 8px 0;"><strong>Strand:</strong> ${strand}</p>
            <p style="margin: 8px 0;"><strong>Section:</strong> ${section}</p>
        </div>
    `;
    
    summaryDiv.innerHTML = html;
}

export function updateTeacherAddStudentSummary() {
    const summaryDiv = document.getElementById('teacher-add-student-summary');
    if (!summaryDiv) return;
    
    const fname = document.getElementById('ta-fname').value.trim();
    const mname = document.getElementById('ta-mname').value.trim();
    const lname = document.getElementById('ta-lname').value.trim();
    const bday = document.getElementById('ta-bday').value;
    const gender = document.getElementById('ta-gender').value;
    const cluster = document.getElementById('ta-cluster').value;
    const strand = document.getElementById('ta-strand').value;
    const user = document.getElementById('ta-username').value.trim();
    const pass = document.getElementById('ta-password').value;
    
    const selectedSubjects = [];
    document.querySelectorAll('#ta-subjects-list input:checked').forEach(cb => {
        selectedSubjects.push(cb.value);
    });
    
    // Check if all required data is filled
    const isComplete = fname && lname && bday && gender && cluster && strand && user && pass && selectedSubjects.length > 0;
    
    if (!isComplete) {
        summaryDiv.innerHTML = '<p style="color: #999; margin: 0; font-style: italic;">Fill in all fields above to see complete summary</p>';
        return;
    }
    
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    let html = `
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid var(--au-blue);">
            <p style="margin: 8px 0;"><strong>📝 Name:</strong> ${fullName}</p>
            <p style="margin: 8px 0;"><strong>🎂 Birthday:</strong> ${bday}</p>
            <p style="margin: 8px 0;"><strong>👤 Gender:</strong> ${gender}</p>
            <p style="margin: 8px 0;"><strong>🔐 Username:</strong> ${user}</p>
            <p style="margin: 8px 0;"><strong>🔑 Password:</strong> ${pass}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #28a745; margin-top: 10px;">
            <p style="margin: 8px 0; font-weight: 600; color: #28a745;">📍 Academic Details</p>
            <p style="margin: 8px 0;"><strong>Cluster:</strong> ${cluster}</p>
            <p style="margin: 8px 0;"><strong>Strand:</strong> ${strand}</p>
            <p style="margin: 8px 0;"><strong>Subjects:</strong> ${selectedSubjects.join(', ')}</p>
        </div>
    `;
    
    summaryDiv.innerHTML = html;
}

export function onStudentClusterChange() {
    const cluster = document.getElementById('s-cluster').value;
    const strandSel = document.getElementById('s-strand');
    const secSel = document.getElementById('s-section');
    
    strandSel.innerHTML = '<option value="">--Select Strand--</option>';
    secSel.innerHTML = '<option value="">--Select Section--</option>';
    
    // Clear subjects when cluster changes
    const subjectsDiv = document.getElementById('s-subjects-list');
    if (subjectsDiv) subjectsDiv.innerHTML = '';
    
    const c = getClusters();
    if (cluster && c[cluster]) {
        // Get list of strands to display
        let strandsToShow = Object.keys(c[cluster]);
        
        // If current user is a teacher, filter to only their assigned strands
        const currentUser = getCurrentUser();
        console.log('onStudentClusterChange - Current user:', currentUser);
        if (currentUser && userAccounts[currentUser]) {
            console.log('User account data:', userAccounts[currentUser]);
            if (userAccounts[currentUser].role === 'teacher') {
                const teacherData = userAccounts[currentUser];
                console.log('Teacher data:', teacherData);
                console.log('Assigned strand sections:', teacherData.assignedStrandSections);
                if (teacherData.assignedStrandSections) {
                    const assignedStrands = Object.keys(teacherData.assignedStrandSections);
                    console.log("All strands in cluster:", strandsToShow);
                    console.log("Teacher assigned strands:", assignedStrands);
                    strandsToShow = strandsToShow.filter(s => assignedStrands.includes(s));
                    console.log("Filtered strands for cluster:", strandsToShow);
                }
            }
        }
        
        // Populate strands
        strandsToShow.forEach(strand => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = strand;
            strandSel.appendChild(opt);
        });
    }
}

export function onStudentStrandChange() {
    const cluster = document.getElementById('s-cluster').value;
    const strand = document.getElementById('s-strand').value;
    const secSel = document.getElementById('s-section');
    
    secSel.innerHTML = '<option value="">--Select Section--</option>';
    
    const c = getClusters();
    if (cluster && strand && c[cluster] && c[cluster][strand]) {
        // Populate sections, filtering out 'subjects' property and non-array keys
        Object.keys(c[cluster][strand]).filter(key => key !== 'subjects' && Array.isArray(c[cluster][strand][key])).forEach(section => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = section;
            secSel.appendChild(opt);
        });
    }
    
    // Update subjects for the selected strand
    populateStudentSubjects(cluster, strand);
}

export function populateStudentSubjects(cluster, strand) {
    const subjectsDiv = document.getElementById('s-subjects-list');
    if (!subjectsDiv || !cluster) return;
    
    subjectsDiv.innerHTML = '';
    
    // Get subjects from the cluster definition
    const c = getClusters();
    if (!c[cluster]) {
        subjectsDiv.innerHTML = '<p style="color: #999; grid-column: 1/-1;">No subjects available for this cluster</p>';
        return;
    }
    
    // Get subjects only from the selected strand
    let subjectsSet = new Set();
    if (strand && c[cluster][strand] && c[cluster][strand].subjects && Array.isArray(c[cluster][strand].subjects)) {
        subjectsSet = new Set(c[cluster][strand].subjects);
    }
    
    if (subjectsSet.size === 0) {
        subjectsDiv.innerHTML = '<p style="color: #999; grid-column: 1/-1;">No subjects available for this strand</p>';
        return;
    }
    
    Array.from(subjectsSet).forEach(subject => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.fontSize = '0.95rem';
        label.innerHTML = `<input type="checkbox" value="${subject}"> ${subject}`;
        subjectsDiv.appendChild(label);
    });
}

export function onStrandChange() {
    const currentUser = getCurrentUser();
    const role = userAccounts[currentUser].role;
    let cluster;

    if (role === 'teacher') {
        // teacher's cluster is stored on the account, use it if available
        const teacherData = userAccounts[currentUser] || {};
        cluster = teacherData.assignedCluster || document.getElementById('clusterSelect')?.value || '';
    } else {
        cluster = document.getElementById('clusterSelect').value;
    }

    const strand = document.getElementById('strandSelect').value;
    const secSel = document.getElementById('sectionSelect');
    const genderSel = document.getElementById('genderSelect');
    const searchInput = document.getElementById('searchStudent');

    secSel.innerHTML = '<option value="">--Select Section--</option>';
    
    const c = getClusters();
    if (strand && cluster && c[cluster] && c[cluster][strand]) {
        // collect all section names
        let sectionKeys = Object.keys(c[cluster][strand]).
            filter(key => key !== 'subjects' && Array.isArray(c[cluster][strand][key]));

        // if teacher, further restrict to assigned sections for that strand
        if (role === 'teacher') {
            const teacherData = userAccounts[currentUser] || {};
            const assignedArr = (teacherData.assignedStrandSections && teacherData.assignedStrandSections[strand]) || [];
            if (Array.isArray(assignedArr) && assignedArr.length > 0) {
                sectionKeys = sectionKeys.filter(sec => assignedArr.includes(sec));
            }
        }

        sectionKeys.forEach(section => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = section;
            secSel.appendChild(opt);
        });
        secSel.disabled = false;
        genderSel.disabled = false;
        searchInput.disabled = false;
    } else {
        secSel.disabled = true;
        genderSel.disabled = true;
        searchInput.disabled = true;
    }
    updateStudentList();
}

export function updateStudentList() {
    const currentUser = getCurrentUser();
    const role = userAccounts[currentUser].role;
    let cluster;

    if (role === 'teacher') {
        const teacherData = userAccounts[currentUser] || {};
        cluster = teacherData.assignedCluster || document.getElementById('clusterSelect')?.value || '';
    } else {
        cluster = document.getElementById('clusterSelect')?.value;
    }

    const strand = document.getElementById('strandSelect').value;
    const section = document.getElementById('sectionSelect').value;
    const gender = document.getElementById('genderSelect').value;
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase().trim();
    const listContainer = document.getElementById('custom-student-dropdown');
    
    if (!listContainer) return;
    listContainer.innerHTML = ''; 
    
    if (!section || section === "") {
        listContainer.innerHTML = '<p style="padding:15px; color:#999;">Please select section...</p>';
        return;
    }

    const c = getClusters();
    let students = c[cluster]?.[strand]?.[section] || [];

    if (gender !== 'all') {
        students = students.filter(s => s.gender === gender);
    }
    if (searchTerm) {
        students = students.filter(s => s.name.toLowerCase().includes(searchTerm));
    }

    if (students.length === 0) {
        listContainer.innerHTML = '<p style="padding:15px; color:#999;">No students found.</p>';
        return;
    }

    students.forEach(s => {
        const item = document.createElement('div');
        item.className = 'student-item';
        item.innerHTML = `
            <div class="student-info-group">
                <img src="${s.img || 'images/default.svg'}" class="student-mini-pic">
                <span>${s.name}</span>
            </div>
            <div class="student-actions">
                ${(role === 'teacher' || role === 'admin') ? `
                    <button class="edit-btn" onclick="event.stopPropagation(); openEditStudentModal('${s.id}', '${cluster}', '${strand}', '${section}')"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteStudent('${s.id}', '${cluster}', '${strand}', '${section}')"><i class="fas fa-trash"></i></button>
                ` : ''}
            </div>
        `;
        item.onclick = () => {
            document.querySelectorAll('.student-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            document.getElementById('selectedStudentId').value = s.id;
            document.getElementById('confirmStudentBtn').disabled = false;
        };
        listContainer.appendChild(item);
    });
}

export function openEditStudentModal(id, cluster, strand, section) {
    const c = getClusters();
    const student = c[cluster][strand][section].find(s => s.id === id);
    if (!student) return;

    editingStudentId = id;
    editingLocation = { cluster, strand, section };
    tempImageData = student.img;

    const modalTemplate = document.getElementById('edit-student-modal').content.cloneNode(true);
    document.body.appendChild(modalTemplate);

    document.getElementById('edit-name-input').value = student.name;
    document.getElementById('edit-img-preview').src = student.img || 'images/default.svg';
    // Wire Edit Photo button to open the icon-picker modal for this student
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    if (editPhotoBtn) {
        editPhotoBtn.onclick = () => window.editStudentProfilePic(editingStudentId, cluster, strand, section);
    }
}

export function previewEditImage(event) {
    console.warn('previewEditImage() called but file uploads are disabled.');
}

export function saveStudentChanges() {
    const newName = document.getElementById('edit-name-input').value;
    if (!newName.trim()) return alert("Name cannot be empty");

    const { cluster, strand, section } = editingLocation;
    const c = getClusters();
    const studentIndex = c[cluster][strand][section].findIndex(s => s.id === editingStudentId);
    
    if (studentIndex !== -1) {
        c[cluster][strand][section][studentIndex].name = newName;
        c[cluster][strand][section][studentIndex].img = tempImageData;
        saveClusters();
    }

    updateStudentList();
    closeEditModal();
}

export function closeEditModal() {
    const overlay = document.getElementById('editModalOverlay');
    if (overlay) overlay.remove();
    tempImageData = "";
}

export function deleteStudent(id, cluster, strand, section) {
    const c = getClusters();
    const student = c[cluster][strand][section].find(s => s.id === id);

    const doDelete = () => {
        c[cluster][strand][section] = c[cluster][strand][section].filter(s => s.id !== id);
        saveClusters();
        updateStudentList();
    };

    if (window.showDeleteConfirmation) {
        window.showDeleteConfirmation(student ? student.name : 'this student', doDelete);
    } else {
        if (confirm(`Delete ${student ? student.name : 'this student'}?`)) {
            doDelete();
        }
    }
}

// Global variables for confirmation dialog
let pendingDeleteAction = null;

// Show confirmation dialog
window.showDeleteConfirmation = function(itemName, callback) {
    const overlay = document.getElementById('confirm-modal-overlay');
    const message = document.getElementById('confirm-modal-message');
    
    if (!overlay || !message) {
        // Fallback to browser confirm if modal not found
        if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
            callback();
        }
        return;
    }
    
    message.textContent = `Are you sure you want to delete "${itemName}"?`;
    overlay.classList.add('active');
    
    // Store the callback to be executed when user confirms
    window.pendingDeleteCallback = callback;
};

// Cancel delete
window.cancelDelete = function() {
    const overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    window.pendingDeleteCallback = null;
};

// Confirm delete
window.confirmDelete = function() {
    const overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    if (window.pendingDeleteCallback && typeof window.pendingDeleteCallback === 'function') {
        window.pendingDeleteCallback();
    }
    window.pendingDeleteCallback = null;
};

// Show warning/info dialog
window.showWarningDialog = function(message) {
    const overlay = document.getElementById('confirm-modal-overlay');
    const modalBox = document.querySelector('.confirm-modal-box');
    const title = document.querySelector('.confirm-modal-box h3');
    const messageEl = document.getElementById('confirm-modal-message');
    const buttons = document.querySelector('.confirm-modal-buttons');
    
    if (!overlay || !title || !messageEl || !buttons) {
        alert(message);
        return;
    }
    
    // Update modal for warning
    title.innerHTML = '<i class="fas fa-info-circle" style="color: #f59e0b; margin-right: 8px;"></i>Attention';
    messageEl.textContent = message;
    
    // Replace buttons with single OK button
    buttons.innerHTML = '<button class="btn-cancel" style="background: var(--border-color); color: var(--text-main);" onclick="closeWarningDialog()">OK</button>';
    
    overlay.classList.add('active');
};

// Close warning dialog
window.closeWarningDialog = function() {
    const overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    // Restore delete confirmation buttons for next use
    const buttons = document.querySelector('.confirm-modal-buttons');
    if (buttons) {
        buttons.innerHTML = '<button class="btn-cancel" onclick="cancelDelete()">Cancel</button><button class="btn-confirm" onclick="confirmDelete()">Delete</button>';
    }
};

// Function to delete the currently selected option in a dropdown
export function deleteCurrentOption(elementId) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        window.showWarningDialog("Element not found.");
        return;
    }

    // Handle SELECT elements (dropdowns)
    if (element.tagName === 'SELECT') {
        if (element.selectedIndex === -1 || element.value === '') {
            window.showWarningDialog("Please select an item to delete.");
            return;
        }

        const selectedText = element.options[element.selectedIndex].text;
        
        // Show custom confirmation dialog
        window.showDeleteConfirmation(selectedText, function() {
            // Delete from storage based on which dropdown it is
            const c = getClusters();
            const subjects = getAvailableSubjects();
            
            if (elementId === 's-cluster' || elementId === 't-cluster') {
                // Deleting a cluster
                if (c[selectedText]) {
                    delete c[selectedText];
                    saveClusters();
                    console.log(`Deleted cluster: ${selectedText}`);
                }
            } else if (elementId === 's-strand') {
                // Deleting a strand from student view
                const sCluster = document.getElementById('s-cluster');
                if (sCluster && c[sCluster.value]) {
                    if (c[sCluster.value][selectedText]) {
                        delete c[sCluster.value][selectedText];
                        saveClusters();
                        console.log(`Deleted strand: ${selectedText}`);
                    }
                }
            } else if (elementId === 's-section') {
                // Deleting a section from student view OR academic setup
                const sCluster = document.getElementById('s-cluster');
                const sStrand = document.getElementById('s-strand');
                const sectionClusterSelect = document.getElementById('section-cluster-select');
                const sectionStrandSelect = document.getElementById('section-strand-select');
                
                if (sCluster && sStrand && c[sCluster.value] && c[sCluster.value][sStrand.value]) {
                    // Student view context
                    if (c[sCluster.value][sStrand.value][selectedText]) {
                        delete c[sCluster.value][sStrand.value][selectedText];
                        saveClusters();
                        console.log(`Deleted section: ${selectedText}`);
                    }
                } else if (sectionClusterSelect && sectionStrandSelect && c[sectionClusterSelect.value] && c[sectionClusterSelect.value][sectionStrandSelect.value]) {
                    // Academic setup context
                    if (c[sectionClusterSelect.value][sectionStrandSelect.value][selectedText]) {
                        delete c[sectionClusterSelect.value][sectionStrandSelect.value][selectedText];
                        saveClusters();
                        console.log(`Deleted section: ${selectedText}`);
                    }
                }
            } else if (elementId === 's-gender' || elementId === 't-gender') {
                // Deleting a gender
                const genders = getAvailableGenders();
                const index = genders.indexOf(selectedText);
                if (index !== -1) {
                    genders.splice(index, 1);
                    saveGenders();
                    console.log(`Deleted gender: ${selectedText}`);
                }
            }
            
            // Remove from DOM and refresh
            element.remove(element.selectedIndex);
            updateFormDropdowns('student');
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            populateStrandCheckboxList();
            updateStrandClusterDropdowns();
            window.updateClusterList();
            window.updateStrandDisplay();
            updateSectionClusterDisplay();
            window.updateSectionDisplay();
            showSuccessToast(`✓ "${selectedText}" deleted successfully!`);
        });
    }
    // Handle DIV elements with checkboxes (like t-strands-list, t-subjects-list)
    else if (element.tagName === 'DIV') {
        const checkedItems = element.querySelectorAll('input[type="checkbox"]:checked');
        
        if (checkedItems.length === 0) {
            window.showWarningDialog("Please select at least one item to delete.");
            return;
        }

        const itemCount = checkedItems.length;
        const itemText = itemCount === 1 ? 'this item' : `these ${itemCount} items`;
        
        // Show custom confirmation dialog for multiple items
        window.showDeleteConfirmation(itemText, function() {
            const c = getClusters();
            const subjects = getAvailableSubjects();
            
            checkedItems.forEach(checkbox => {
                const itemValue = checkbox.value;
                
                if (elementId === 't-strands-list') {
                    // Delete strand from all clusters
                    Object.keys(c).forEach(clusterName => {
                        if (c[clusterName][itemValue]) {
                            delete c[clusterName][itemValue];
                        }
                    });
                    saveClusters();
                    console.log(`Deleted strand: ${itemValue}`);
                } else if (elementId === 't-subjects-list') {
                    // Delete subject
                    const index = subjects.indexOf(itemValue);
                    if (index !== -1) {
                        subjects.splice(index, 1);
                    }
                    saveSubjects();
                    console.log(`Deleted subject: ${itemValue}`);
                }
                
                checkbox.closest('.checkbox-item')?.remove();
            });
            
            // Refresh all populate functions
            populateClusterDropdown();
            populateTeacherClusterDropdown();
            populateStrandCheckboxList();
            populateSubjectCheckboxList();
            window.updateClusterList();
            window.updateStrandDisplay();
            window.updateSectionDisplay();
            window.updateSubjectsDisplay();
            showSuccessToast(`✓ ${itemCount} item(s) deleted successfully!`);
        });
    }
}

// --- COMPATIBILITY FIX ---
export function openCreateAccountModal() {
    console.log("Redirecting to new Page View...");
    openCreateAccountView();
}

// --- CUSTOM DIALOG FUNCTIONS ---
let customDialogCallback = null;
let customDialogCategory = null;

export function showCustomDialog(title, category, callback) {
    const overlay = document.getElementById('custom-dialog-overlay');
    const titleEl = document.getElementById('custom-dialog-title');
    const input = document.getElementById('custom-dialog-input');
    
    console.log('showCustomDialog called with category:', category);
    console.log('Callback function:', callback);
    
    titleEl.textContent = title;
    input.value = '';
    input.placeholder = `Enter ${category} name...`;
    
    customDialogCallback = callback;
    customDialogCategory = category;
    
    console.log('customDialogCallback set to:', customDialogCallback);
    console.log('customDialogCategory set to:', customDialogCategory);
    
    overlay.classList.add('active');
    input.focus();
    
    // Prevent clicks on overlay from going through
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeCustomDialog();
        }
    };
    
    // Allow Enter key to submit - handle both keypress and keydown
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            confirmCustomDialog();
        }
    };
    
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };
}

export function closeCustomDialog() {
    const overlay = document.getElementById('custom-dialog-overlay');
    overlay.classList.remove('active');
    customDialogCallback = null;
    customDialogCategory = null;
}

export function confirmCustomDialog() {
    const input = document.getElementById('custom-dialog-input');
    const value = input.value.trim();
    
    console.log('confirmCustomDialog called with value:', value);
    console.log('Current customDialogCallback:', customDialogCallback);
    console.log('Current customDialogCategory:', customDialogCategory);
    
    if (!value) {
        showSuccessToast(`⚠️ Please enter a ${customDialogCategory} name.`);
        input.focus();
        return;
    }
    
    // Store callback before closing dialog (which clears it)
    const callback = customDialogCallback;
    const category = customDialogCategory;
    
    closeCustomDialog();
    
    if (callback) {
        console.log('✅ Callback exists. Calling with category:', category, 'value:', value);
        callback(value);
    } else {
        console.error('❌ ERROR: customDialogCallback was null!');
    }
}

export function openAddStudentModal() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    
    if (!teacherData || !teacherData.assignedCluster) {
        showSuccessToast("⚠️ You must be assigned a cluster to add students.");
        return;
    }
    
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Register New Student";
    
    pushNavigation('Add Student', openAddStudentModal);
    
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '';
    
    const template = document.getElementById('add-student-teacher-view');
    if (!template) {
        showSuccessToast("❌ Template not found");
        return;
    }
    
    appContainer.appendChild(template.content.cloneNode(true));
    
    setTimeout(() => {
        const clusterInput = document.getElementById('ta-cluster');
        const strandSelect = document.getElementById('ta-strand');
        const sectionSelect = document.getElementById('ta-section');
        
        if (clusterInput) {
            clusterInput.value = teacherData.assignedCluster;
        }
        
        // Clear section dropdown on load
        if (sectionSelect) {
            sectionSelect.innerHTML = '<option value="">--Select Section--</option>';
        }
        
        populateTeacherAddStudentStrands();
        populateAllGenderDropdowns();
        initializeTitleCaseInputs();
        initializeDateInputs();
        setupFormEnterKey('saveTeacherAddedStudent');
        
        // Add event listeners for summary updates
        document.getElementById('ta-fname')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-mname')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-lname')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-bday')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-gender')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-strand')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-username')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-password')?.addEventListener('change', updateTeacherAddStudentSummary);
        document.getElementById('ta-password')?.addEventListener('input', updateTeacherAddStudentSummary);
        
        // Update summary when subjects are selected/deselected
        setTimeout(() => {
            document.querySelectorAll('#ta-subjects-list input').forEach(checkbox => {
                checkbox.addEventListener('change', updateTeacherAddStudentSummary);
            });
        }, 100);
        
        console.log('✅ Teacher add student page initialized');
    }, 200);
}

export function goBackToTeacherStudentSelector() {
    openTeacherStudentSelector();
}

export function populateTeacherAddStudentStrands() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const cluster = teacherData.assignedCluster;
    
    const c = getClusters();
    let strands = Object.keys(c[cluster] || {});
    
    // Filter to only show strands the teacher is assigned to
    if (teacherData.assignedStrandSections) {
        const assignedStrands = Object.keys(teacherData.assignedStrandSections);
        strands = strands.filter(s => assignedStrands.includes(s));
        console.log('populateTeacherAddStudentStrands - Teacher assigned strands:', assignedStrands);
        console.log('populateTeacherAddStudentStrands - Filtered strands to show:', strands);
    }
    
    const strandSelect = document.getElementById('ta-strand');
    
    if (!strandSelect) return;
    
    strandSelect.innerHTML = '<option value="">--Select Strand--</option>';
    strands.forEach(strand => {
        const opt = document.createElement('option');
        opt.value = strand;
        opt.textContent = strand;
        strandSelect.appendChild(opt);
    });
}

export function updateTeacherAddStudentSections() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const cluster = teacherData.assignedCluster;
    const strand = document.getElementById('ta-strand').value;
    
    const sectionSelect = document.getElementById('ta-section');
    if (!sectionSelect) return;
    
    sectionSelect.innerHTML = '<option value="">--Select Section--</option>';
    
    if (!cluster || !strand) {
        return;
    }
    
    const c = getClusters();
    const strandData = c[cluster][strand];
    
    if (!strandData) return;
    
    // Determine allowed sections based on teacher's assignedStrandSections
    let allowedSections = Object.keys(strandData).filter(key => key !== 'subjects' && Array.isArray(strandData[key]));
    if (teacherData.assignedStrandSections) {
        const assignedArr = teacherData.assignedStrandSections[strand] || [];
        if (Array.isArray(assignedArr) && assignedArr.length > 0) {
            allowedSections = allowedSections.filter(sec => assignedArr.includes(sec));
        }
    }

    allowedSections.forEach(sectionName => {
        const opt = document.createElement('option');
        opt.value = sectionName;
        opt.textContent = sectionName;
        sectionSelect.appendChild(opt);
    });
    
    // Clear subjects when strand changes
    const subjectsList = document.getElementById('ta-subjects-list');
    if (subjectsList) {
        subjectsList.innerHTML = '<p style="color: #999; grid-column: 1/-1;">Select a strand and section first</p>';
    }
}

export function updateTeacherAddStudentSubjects() {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const cluster = teacherData.assignedCluster;
    const strand = document.getElementById('ta-strand').value;
    const section = document.getElementById('ta-section').value;
    
    const subjectsList = document.getElementById('ta-subjects-list');
    if (!subjectsList) return;
    
    if (!cluster || !strand || !section) {
        subjectsList.innerHTML = '<p style="color: #999; grid-column: 1/-1;">Select a strand and section first</p>';
        return;
    }
    
    const c = getClusters();
    const subjects = (c[cluster][strand].subjects || []).slice();
    
    if (subjects.length === 0) {
        subjectsList.innerHTML = '<p style="color: #999; grid-column: 1/-1;">No subjects available for this strand</p>';
        return;
    }
    
    subjectsList.innerHTML = '';
    subjects.forEach(subject => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 10px; background: #f5f5f5; border-radius: 6px; cursor: pointer; transition: all 0.2s;';
        label.innerHTML = `
            <input type="checkbox" value="${subject}" style="cursor: pointer; width: 18px; height: 18px;">
            <span>${subject}</span>
        `;
        label.onmouseover = () => label.style.background = '#e8f4f8';
        label.onmouseout = () => label.style.background = '#f5f5f5';
        subjectsList.appendChild(label);
    });
}

export function saveTeacherAddedStudent() {
    console.log('[SAVE TEACHER STUDENT] Function called');
    const fname = document.getElementById('ta-fname').value.trim();
    const mname = document.getElementById('ta-mname').value.trim();
    const lname = document.getElementById('ta-lname').value.trim();
    const bday = document.getElementById('ta-bday').value;
    const gender = document.getElementById('ta-gender').value;
    const cluster = document.getElementById('ta-cluster').value;
    const strand = document.getElementById('ta-strand').value;
    const section = document.getElementById('ta-section').value;
    const user = document.getElementById('ta-username').value.trim();
    const pass = document.getElementById('ta-password').value;
    
    if (!fname || !lname || !user || !pass || !cluster || !strand || !section) {
        showSuccessToast("⚠️ Please fill in all required fields including section.");
        return;
    }
    
    if (userAccounts[user]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }
    
    const selectedSubjects = [];
    document.querySelectorAll('#ta-subjects-list input:checked').forEach(cb => {
        selectedSubjects.push(cb.value);
    });
    
    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }
    
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    const newId = "s_" + Date.now();
    
    userAccounts[user.toLowerCase()] = {
        password: pass,
        role: "student",
        studentId: newId,
        img: "images/default.svg",
        name: fullName,
        subjects: selectedSubjects,
        cluster: cluster,
        strand: strand,
        section: section
    };
    
    const newStudentObj = {
        id: newId,
        name: fullName,
        firstName: fname,
        middleName: mname,
        lastName: lname,
        birthday: bday,
        gender: gender,
        img: "images/default.svg",
        subjects: selectedSubjects
    };
    
    const c = getClusters();
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    
    console.log('[Save] Got clusters, structure:', Object.keys(c));
    console.log('[Save] Teacher data:', teacherData);
    
    // Use the selected section from the form
    console.log('[Save Teacher Added Student] Cluster:', cluster, 'Strand:', strand, 'Section:', section);
    console.log('[Save Teacher Added Student] Cluster data exists:', !!c[cluster]);
    console.log('[Save Teacher Added Student] Strand data exists:', !!c[cluster] && !!c[cluster][strand]);
    
    // Make sure cluster structure exists
    if (!c[cluster]) {
        console.log('[Save] Creating cluster:', cluster);
        c[cluster] = {};
    }
    
    // Make sure strand structure exists
    if (!c[cluster][strand]) {
        console.log('[Save] Creating strand:', strand);
        c[cluster][strand] = {};
    }
    
    // Make sure the section array exists
    if (!c[cluster][strand][section]) {
        console.log('[Save] Creating section array:', section);
        c[cluster][strand][section] = [];
    }
    
    console.log('[Save Teacher Added Student] Adding student:', newStudentObj.name);
    console.log('[Save] Before push - section length:', c[cluster][strand][section].length);
    
    // Add student to the section
    c[cluster][strand][section].push(newStudentObj);
    
    console.log('[Save] After push - section length:', c[cluster][strand][section].length);
    console.log('[Save] Full section data:', JSON.stringify(c[cluster][strand][section]));
    
    console.log('[Save] About to call saveClusters()');
    saveClusters();
    console.log('[Save] saveClusters() completed');
    
    // Verify it was saved
    const cVerify = getClusters();
    console.log('[Save] Verification - students in section after save:', cVerify[cluster][strand][section].length);
    
    saveAccounts();
    
    showSuccessToast("✅ Student Account Created Successfully!");
    openTeacherStudentSelector();
}

// Quick Modal Functions for Admin
export function openAddModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) {
        // Clone the template and append to body
        const template = document.querySelector('#add-student-modal');
        const content = template.content.cloneNode(true);
        
        // Remove any existing modal overlay
        const existing = document.getElementById('addModalOverlay');
        if (existing) existing.remove();
        
        document.body.appendChild(content);
        
        // Initialize clusters dropdown
        const c = getClusters();
        const clusterSelect = document.getElementById('add-cluster-select');
        if (clusterSelect) {
            clusterSelect.innerHTML = '<option value="">-- Select Cluster --</option>';
            Object.keys(c).forEach(cluster => {
                const option = document.createElement('option');
                option.value = cluster;
                option.textContent = cluster;
                clusterSelect.appendChild(option);
            });
        }
    }
}

export function updateAddModalCluster() {
    const cluster = document.getElementById('add-cluster-select')?.value;
    const strandSelect = document.getElementById('add-strand-select');
    const strandList = document.getElementById('add-strands-list');
    
    if (!cluster) {
        if (strandSelect) strandSelect.innerHTML = '<option value="">-- Select Strand --</option>';
        if (strandList) strandList.innerHTML = '';
        return;
    }
    
    const c = getClusters();
    const strands = Object.keys(c[cluster] || {});
    
    if (strandSelect) {
        strandSelect.innerHTML = '<option value="">-- Select Strand --</option>';
        strands.forEach(strand => {
            const option = document.createElement('option');
            option.value = strand;
            option.textContent = strand;
            strandSelect.appendChild(option);
        });
    }
    
    if (strandList) {
        strandList.innerHTML = '';
        strands.forEach(strand => {
            const label = document.createElement('label');
            label.style.marginRight = '20px';
            label.innerHTML = `<input type="checkbox" value="${strand}" onchange="updateAddModalSections()"> ${strand}`;
            strandList.appendChild(label);
        });
    }
    
    updateAddModalSections();
}

export function updateAddModalSections() {
    const cluster = document.getElementById('add-cluster-select')?.value;
    const selectedStrands = Array.from(document.querySelectorAll('#add-strands-list input:checked')).map(cb => cb.value);
    const sectionSelect = document.getElementById('add-section-select');
    const sectionList = document.getElementById('add-sections-list');
    
    let sections = [];
    const c = getClusters();
    
    selectedStrands.forEach(strand => {
        if (c[cluster] && c[cluster][strand]) {
            sections = sections.concat(Object.keys(c[cluster][strand]));
        }
    });
    
    sections = [...new Set(sections)]; // Remove duplicates
    
    if (sectionSelect) {
        sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
    }
    
    if (sectionList) {
        sectionList.innerHTML = '';
        sections.forEach(section => {
            const label = document.createElement('label');
            label.style.marginRight = '20px';
            label.innerHTML = `<input type="checkbox" value="${section}" onchange="updateAddModalSubjects()"> ${section}`;
            sectionList.appendChild(label);
        });
    }
    
    updateAddModalSubjects();
}

export function updateAddModalSubjects() {
    const cluster = document.getElementById('add-cluster-select')?.value;
    const subjectsList = document.getElementById('add-subjects-list');
    
    if (!cluster || !subjectsList) return;
    
    const allSubjects = getAvailableSubjects();
    const clusterSubjects = (allSubjects[cluster] || []).map(subj => subj.name || subj);
    
    subjectsList.innerHTML = '';
    if (clusterSubjects.length === 0) {
        subjectsList.innerHTML = '<p style="color: #999; grid-column: 1/-1;">No subjects available</p>';
        return;
    }
    
    clusterSubjects.forEach(subject => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.marginRight = '20px';
        label.innerHTML = `<input type="checkbox" value="${subject}"> ${subject}`;
        subjectsList.appendChild(label);
    });
}

export function saveNewStudent() {
    const cluster = document.getElementById('add-cluster-select')?.value;
    const fname = document.getElementById('add-fname')?.value?.trim();
    const mname = document.getElementById('add-mname')?.value?.trim();
    const lname = document.getElementById('add-lname')?.value?.trim();
    const bday = document.getElementById('add-bday')?.value;
    const gender = document.getElementById('add-gender')?.value;
    const username = document.getElementById('add-username')?.value?.trim();
    const password = document.getElementById('add-password')?.value?.trim();
    const strand = document.getElementById('add-strand-select')?.value;
    const section = document.getElementById('add-section-select')?.value;
    
    // Get selected subjects
    const selectedSubjects = [];
    document.querySelectorAll('#add-subjects-list input:checked').forEach(cb => {
        selectedSubjects.push(cb.value);
    });
    
    // Validation
    if (!cluster || !fname || !lname || !bday || !gender || !username || !password || !strand || !section) {
        showSuccessToast("⚠️ Please fill in all required fields.");
        return;
    }
    
    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }
    
    const userAccounts = getUserAccounts();
    if (userAccounts[username]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }
    
    // Generate student ID
    const newId = "s_" + Date.now();
    
    // Create account
    userAccounts[username.toLowerCase()] = {
        password: password,
        role: "student",
        studentId: newId,
        img: "images/default.svg",
        name: fname + (mname ? ' ' + mname : '') + ' ' + lname,
        subjects: selectedSubjects,
        strand: strand,
        section: section
    };
    
    // Create student object for clusters
    const newStudentObj = {
        id: newId,
        name: fname + (mname ? ' ' + mname : '') + ' ' + lname,
        firstName: fname,
        middleName: mname,
        lastName: lname,
        birthday: bday,
        gender: gender,
        img: "images/default.svg",
        subjects: selectedSubjects
    };
    
    // Push to Clusters
    const c = getClusters();
    if (!c[cluster]) c[cluster] = {};
    if (!c[cluster][strand]) c[cluster][strand] = {};
    if (!c[cluster][strand][section]) c[cluster][strand][section] = [];
    
    c[cluster][strand][section].push(newStudentObj);
    
    saveAccounts();
    saveClusters();
    
    showSuccessToast("✅ Student Account Created Successfully!");
    closeAddModal();
    openAdminStudentSelector();
}

export function closeAddModal() {
    const modal = document.getElementById('add-student-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear form
    document.getElementById('add-fname').value = '';
    document.getElementById('add-mname').value = '';
    document.getElementById('add-lname').value = '';
    document.getElementById('add-bday').value = '';
    document.getElementById('add-gender').value = 'Male';
    document.getElementById('add-username').value = '';
    document.getElementById('add-password').value = '';
    document.getElementById('add-cluster-select').value = '';
    document.getElementById('add-strand-select').value = '';
    document.getElementById('add-section-select').value = '';
    document.querySelectorAll('#add-subjects-list input:checked').forEach(cb => cb.checked = false);
}

export function deleteTeacherStudent(studentId, studentName, cluster, strand, section) {
    const currentUser = getCurrentUser();
    const teacherData = userAccounts[currentUser];
    const teacherName = teacherData.name;
    
    // Create confirmation dialog
    const dialogHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;" id="delete-confirmation-dialog">
            <div style="background: white; border-radius: 8px; padding: 30px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <h3 style="margin-top: 0; color: #dc3545; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> Delete Student Account?
                </h3>
                <p style="color: #333; margin: 15px 0;">
                    Are you sure you want to permanently delete the account for <strong>${studentName}</strong>?
                </p>
                <p style="color: #666; font-size: 0.9rem; margin: 10px 0;">
                    <strong>Teacher Authorization:</strong> ${teacherName}
                </p>
                <p style="color: #999; font-size: 0.85rem; margin: 10px 0; font-style: italic;">
                    This action cannot be undone. All student data will be permanently removed.
                </p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="confirmDeleteTeacherStudent('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Confirm Delete
                    </button>
                    <button onclick="cancelDeleteTeacherStudent()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
}

export function confirmDeleteTeacherStudent(studentId, cluster, strand, section) {
    // Find and remove the student from the clusters
    const c = getClusters();
    const students = c[cluster][strand][section];
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex !== -1) {
        const studentName = students[studentIndex].name;
        students.splice(studentIndex, 1);
        saveClusters();
        
        // Find and remove the student account from userAccounts
        for (const username in userAccounts) {
            if (userAccounts[username].studentId === studentId) {
                delete userAccounts[username];
                break;
            }
        }
        saveAccounts();
        
        showSuccessToast(`✅ Student "${studentName}" has been deleted permanently.`);
    }
    
    cancelDeleteTeacherStudent();
    updateTeacherStudentList();
}

export function cancelDeleteTeacherStudent() {
    const dialog = document.getElementById('delete-confirmation-dialog');
    if (dialog) {
        dialog.remove();
    }
}

export function editTeacherStudent(studentId, cluster, strand, section) {
    const c = getClusters();
    const students = c[cluster][strand][section];
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showSuccessToast("⚠️ Student not found.");
        return;
    }
    
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; overflow-y: auto; padding: 20px;" id="edit-student-dialog">
            <div style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">Edit Student Information</h3>
                
                <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #333; font-size: 0.95rem;">Profile Information</h4>
                    
                    <div style="display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-start;">
                        <div style="flex-shrink: 0;">
                            <img id="edit-profile-preview" src="${student.img || 'images/default.svg'}" style="width: 100px; height: 100px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;">
                            <label style="display: block; margin-top: 10px; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Change Photo</label>
                            <button id="edit-profile-photo-btn" class="nav-pill" style="font-size: 0.85rem; padding: 5px;">Edit Photo</button>
                        </div>
                        
                        <div style="flex: 1;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">First Name</label>
                                    <input type="text" id="edit-fname" value="${student.firstName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Middle Name</label>
                                    <input type="text" id="edit-mname" value="${student.middleName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Last Name</label>
                                <input type="text" id="edit-lname" value="${student.lastName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Birthday</label>
                                    <input type="date" id="edit-bday" value="${student.birthday || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Gender</label>
                                    <select id="edit-gender" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                        <option value="">--Select Gender--</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #333; font-size: 0.95rem;">Section Assignment</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Strand</label>
                            <select id="edit-strand" onchange="updateEditSectionAndSubjects('${studentId}', '${cluster}', '${strand}', '${section}')" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <option value="">--Select Strand--</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Section</label>
                            <select id="edit-section" onchange="updateEditSubjects('${studentId}', '${cluster}', '${strand}', '${section}')" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <option value="">--Select Section--</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Subjects</label>
                        <div id="edit-subjects-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 150px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="confirmEditTeacherStudent('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Save Changes
                    </button>
                    <button onclick="cancelEditTeacherStudent()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Wire edit photo button to open the icon picker for this student
    setTimeout(() => {
        const editPhotoBtn = document.getElementById('edit-profile-photo-btn');
        if (editPhotoBtn) {
            editPhotoBtn.onclick = () => window.editStudentProfilePic(studentId, cluster, strand, section);
        }
    }, 50);

    setTimeout(() => {
        const genderSelect = document.getElementById('edit-gender');
        const strandSelect = document.getElementById('edit-strand');
        const sectionSelect = document.getElementById('edit-section');
        
        if (!genderSelect || !strandSelect || !sectionSelect) return;
        
        const genders = getAvailableGenders();
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            if (gender === student.gender) {
                opt.selected = true;
            }
            genderSelect.appendChild(opt);
        });
        
        const clusterData = c[cluster];
        Object.keys(clusterData).forEach(strandName => {
            const opt = document.createElement('option');
            opt.value = strandName;
            opt.textContent = strandName;
            if (strandName === strand) {
                opt.selected = true;
            }
            strandSelect.appendChild(opt);
        });
        
        populateEditSectionsForStrand(cluster, strand);
        sectionSelect.value = section;
        
        populateEditSubjectsForSection(cluster, strand, section);
        
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('#edit-subjects-container input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (student.subjects && student.subjects.includes(cb.value)) {
                    cb.checked = true;
                }
            });
        }, 100);
    }, 50);
}

export function confirmEditTeacherStudent(studentId, cluster, oldStrand, oldSection) {
    const fname = document.getElementById('edit-fname').value.trim();
    const mname = document.getElementById('edit-mname').value.trim();
    const lname = document.getElementById('edit-lname').value.trim();
    const bday = document.getElementById('edit-bday').value;
    const gender = document.getElementById('edit-gender').value;
    const newStrand = document.getElementById('edit-strand').value;
    const newSection = document.getElementById('edit-section').value;
    
    if (!fname || !lname) {
        showSuccessToast("⚠️ Please fill in first name and last name.");
        return;
    }
    
    if (!newStrand || !newSection) {
        showSuccessToast("⚠️ Please select a strand and section.");
        return;
    }
    
    const subjectCheckboxes = document.querySelectorAll('#edit-subjects-container input[type="checkbox"]:checked');
    const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    
    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }

    // If current user is a teacher, ensure they only assign subjects they are allowed to
    const currentUser = getCurrentUser();
    if (userAccounts[currentUser].role === 'teacher') {
        const assigned = userAccounts[currentUser].assignedSubjects || [];
        const invalid = selectedSubjects.filter(s => !assigned.includes(s));
        if (invalid.length > 0) {
            showDialog({ type: 'error', title: 'Unauthorized Subjects', message: 'You cannot assign subjects that are not assigned to you.' });
            return;
        }
    }
    
    const c = getClusters();
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    const oldStudents = c[cluster][oldStrand][oldSection];
    const studentIndex = oldStudents.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        showSuccessToast("⚠️ Student not found.");
        return;
    }
    
    const student = oldStudents[studentIndex];
    const profileImageInput = document.getElementById('edit-profile-image');
    let newImagePath = student.img || 'images/default.svg';
    
    // Handle new image upload
    if (profileImageInput && profileImageInput.files && profileImageInput.files.length > 0) {
        const file = profileImageInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            newImagePath = e.target.result; // Base64 encoded image
            saveUpdatedStudent(cluster, oldStrand, oldSection, studentId, fname, mname, lname, fullName, bday, gender, newStrand, newSection, selectedSubjects, newImagePath);
        };
        reader.readAsDataURL(file);
    } else {
        saveUpdatedStudent(cluster, oldStrand, oldSection, studentId, fname, mname, lname, fullName, bday, gender, newStrand, newSection, selectedSubjects, newImagePath);
    }
}

function saveUpdatedStudent(cluster, oldStrand, oldSection, studentId, fname, mname, lname, fullName, bday, gender, newStrand, newSection, selectedSubjects, newImagePath) {
    const c = getClusters();
    const oldStudents = c[cluster][oldStrand][oldSection];
    const studentIndex = oldStudents.findIndex(s => s.id === studentId);
    const student = oldStudents[studentIndex];
    
    const updatedStudent = {
        ...student,
        firstName: fname,
        middleName: mname,
        lastName: lname,
        name: fullName,
        birthday: bday,
        gender: gender,
        subjects: selectedSubjects,
        img: newImagePath
    };
    
    if (newStrand !== oldStrand || newSection !== oldSection) {
        oldStudents.splice(studentIndex, 1);
        
        if (!c[cluster][newStrand]) {
            c[cluster][newStrand] = { subjects: [] };
        }
        if (!c[cluster][newStrand][newSection]) {
            c[cluster][newStrand][newSection] = [];
        }
        
        c[cluster][newStrand][newSection].push(updatedStudent);
        
        for (const username in userAccounts) {
            if (userAccounts[username].studentId === studentId) {
                userAccounts[username].strand = newStrand;
                userAccounts[username].section = newSection;
                userAccounts[username].subjects = selectedSubjects;
                userAccounts[username].name = fullName;
                userAccounts[username].firstName = fname;
                userAccounts[username].middleName = mname;
                userAccounts[username].lastName = lname;
                userAccounts[username].img = newImagePath;
                break;
            }
        }
    } else {
        oldStudents[studentIndex] = updatedStudent;
        
        for (const username in userAccounts) {
            if (userAccounts[username].studentId === studentId) {
                userAccounts[username].name = fullName;
                userAccounts[username].firstName = fname;
                userAccounts[username].middleName = mname;
                userAccounts[username].lastName = lname;
                userAccounts[username].subjects = selectedSubjects;
                userAccounts[username].img = newImagePath;
                break;
            }
        }
    }
    
    saveClusters();
    saveAccounts();
    
    showSuccessToast(`✅ Student "${fullName}" has been updated.`);
    cancelEditTeacherStudent();
    updateTeacherStudentList();
}

export function cancelEditTeacherStudent() {
    const dialog = document.getElementById('edit-student-dialog');
    if (dialog) {
        dialog.remove();
    }
}

export function previewEditProfileImage(event) {
    console.warn('previewEditProfileImage() called but file uploads are disabled.');
}

// Helper function to populate sections for selected strand in edit modal
function populateEditSectionsForStrand(cluster, selectedStrand) {
    const c = getClusters();
    const sectionSelect = document.getElementById('edit-section');
    if (!sectionSelect) return;
    sectionSelect.innerHTML = '<option value="">--Select Section--</option>';
    
    const strandData = c[cluster] && c[cluster][selectedStrand];
    if (strandData) {
        Object.keys(strandData).forEach(sectionName => {
            if (!['subjects'].includes(sectionName)) {
                const opt = document.createElement('option');
                opt.value = sectionName;
                opt.textContent = sectionName;
                sectionSelect.appendChild(opt);
            }
        });
    }
}

// Helper function to populate subjects for selected section in edit modal
function populateEditSubjectsForSection(cluster, strand, section) {
    const c = getClusters();
    const container = document.getElementById('edit-subjects-container');
    if (!container) return;
    container.innerHTML = '';
    
    const strandData = c[cluster] && c[cluster][strand];
    if (strandData && strandData.subjects && Array.isArray(strandData.subjects)) {
        if (strandData.subjects.length === 0) {
            container.innerHTML = '<p style="color: #999; padding: 10px;">No subjects available</p>';
            return;
        }
        // If current user is a teacher, only show subjects assigned to them
        const currentUser = getCurrentUser();
        let subjectsToShow = strandData.subjects.slice();
        if (userAccounts[currentUser].role === 'teacher') {
            const assigned = userAccounts[currentUser].assignedSubjects || [];
            subjectsToShow = subjectsToShow.filter(s => assigned.includes(s));
        }

        if (subjectsToShow.length === 0) {
            container.innerHTML = '<p style="color: #999; padding: 10px;">No subjects available</p>';
            return;
        }

        subjectsToShow.forEach(subject => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 5px; cursor: pointer;';
            label.innerHTML = `
                <input type="checkbox" value="${subject}" style="cursor: pointer;">
                <span>${subject}</span>
            `;
            container.appendChild(label);
        });
    } else {
        container.innerHTML = '<p style="color: #999; padding: 10px;">No subjects available</p>';
    }
}

// Update sections when strand is changed in edit modal
function updateEditSectionAndSubjects(studentId, cluster, oldStrand, oldSection) {
    const strandSelect = document.getElementById('edit-strand');
    const sectionSelect = document.getElementById('edit-section');
    if (!strandSelect || !sectionSelect) return;
    
    const selectedStrand = strandSelect.value;
    
    if (selectedStrand) {
        populateEditSectionsForStrand(cluster, selectedStrand);
        setTimeout(() => {
            const firstSection = sectionSelect.options[1]?.value || '';
            if (firstSection) {
                sectionSelect.value = firstSection;
                updateEditSubjects(studentId, cluster, oldStrand, oldSection);
            } else {
                populateEditSubjectsForSection(cluster, selectedStrand, '');
            }
        }, 50);
    }
}

// Update subjects when section is changed in edit modal
function updateEditSubjects(studentId, cluster, oldStrand, oldSection) {
    const strandSelect = document.getElementById('edit-strand');
    const sectionSelect = document.getElementById('edit-section');
    if (!strandSelect || !sectionSelect) return;
    
    const selectedStrand = strandSelect.value;
    const selectedSection = sectionSelect.value;
    
    if (selectedStrand && selectedSection) {
        populateEditSubjectsForSection(cluster, selectedStrand, selectedSection);
    }
}

/* =========================================
   ADMIN STUDENT MANAGEMENT
   ========================================= */

export function editAdminStudent(studentId, cluster, strand, section) {
    const c = getClusters();
    const students = c[cluster][strand][section];
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showSuccessToast("⚠️ Student not found.");
        return;
    }
    
    // Find the account username for this student
    let username = '';
    for (const acc in userAccounts) {
        if (userAccounts[acc].studentId === studentId) {
            username = acc;
            break;
        }
    }
    
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;" id="admin-edit-student-dialog">
            <div style="background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto;">
                <h2 style="margin-top: 0; color: var(--au-blue); margin-bottom: 20px;">Edit Student Credentials</h2>
                
                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Student Name:</label>
                    <input type="text" value="${student.name}" disabled style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #f0f0f0; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Username:</label>
                    <input type="text" id="admin-edit-username" value="${username}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Password:</label>
                    <input type="password" id="admin-edit-password" value="${userAccounts[username]?.password || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveAdminStudentCredentials('${studentId}', '${username}')" style="flex: 1; padding: 10px; background: var(--au-blue); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Save</button>
                    <button onclick="closeAdminEditDialog()" style="flex: 1; padding: 10px; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function closeAdminEditDialog() {
    const dialog = document.getElementById('admin-edit-student-dialog');
    if (dialog) dialog.remove();
}

export function saveAdminStudentCredentials(studentId, oldUsername) {
    const newUsername = document.getElementById('admin-edit-username').value.trim();
    const newPassword = document.getElementById('admin-edit-password').value;

    if (!newUsername || !newPassword) {
        showSuccessToast("⚠️ Username and password cannot be empty.");
        return;
    }

    const normalizedOld = String(oldUsername).toLowerCase();
    const normalizedNew = newUsername.toLowerCase();

    // Check if new username already exists (and it's different from old username)
    if (normalizedNew !== normalizedOld && userAccounts[normalizedNew]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }

    // If username changed, update the account
    if (normalizedNew !== normalizedOld) {
        const oldAcc = userAccounts[normalizedOld];
        if (oldAcc) {
            userAccounts[normalizedNew] = { ...oldAcc, password: newPassword };
            delete userAccounts[normalizedOld];
        }
    } else {
        // Just update password
        if (userAccounts[normalizedOld]) {
            userAccounts[normalizedOld].password = newPassword;
        }
    }

    saveAccounts();
    showSuccessToast("✅ Student credentials updated successfully!");
    closeAdminEditDialog();
    updateAdminStudentList();
}

export function openStudentInboxAdmin(studentId) {
    // Find the username for this student
    let studentUsername = '';
    for (const acc in userAccounts) {
        if (userAccounts[acc].studentId === studentId) {
            studentUsername = acc;
            break;
        }
    }
    
    if (!studentUsername) {
        showSuccessToast("⚠️ Student account not found.");
        return;
    }
    
    // Show modal with all teachers who messaged this student
    const c = getClusters();
    const student = getStudentData(studentId);
    
    if (!student) {
        showSuccessToast("⚠️ Student data not found.");
        return;
    }
    
    let modalHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;" id="student-inbox-modal">
            <div style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto;">
                <h2 style="margin-top: 0; color: var(--au-blue); margin-bottom: 20px;">Messages for ${student.name}</h2>
                
                <div style="border-top: 1px solid #ddd; padding-top: 15px;">
    `;
    
    // Get all teachers
    let hasMessages = false;
    Object.keys(userAccounts).forEach(username => {
        const acc = userAccounts[username];
        if (acc.role === 'teacher') {
            // Check if this teacher has messaged this student
            const messages = getMessages() || {};
            const chatId = [username, studentUsername].sort().join('-');
            if (messages[chatId] && messages[chatId].length > 0) {
                hasMessages = true;
                const teacherData = acc;
                const messageCount = messages[chatId].length;
                
                modalHtml += `
                    <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 600; color: var(--au-blue);">${teacherData.name || username}</div>
                            <div style="font-size: 0.85rem; color: #666;">${messageCount} message(s)</div>
                        </div>
                        <button onclick="viewStudentMessages('${username}', '${studentUsername}')" style="padding: 6px 12px; background: var(--au-blue); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">View</button>
                    </div>
                `;
            }
        }
    });
    
    if (!hasMessages) {
        modalHtml += `<p style="color: #999; text-align: center; padding: 20px;">No messages for this student.</p>`;
    }
    
    modalHtml += `
                </div>
                
                <div style="margin-top: 20px;">
                    <button onclick="closeStudentInboxModal()" style="width: 100%; padding: 10px; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function closeStudentInboxModal() {
    const modal = document.getElementById('student-inbox-modal');
    if (modal) modal.remove();
}

export function viewStudentMessages(teacherUsername, studentUsername) {
    // Import messaging functions and load the chat
    import('./messaging.js').then(messaging => {
        closeStudentInboxModal();
        messaging.loadChat(teacherUsername);
    });
}
// ========================================
// ADMIN STUDENT PORTFOLIO VIEW
// ========================================

export function openStudentPortfolio(studentId, cluster, strand, section) {
    // Authorization: teachers can only access students in their assigned sections
    const currentUser = getCurrentUser();
    const userRole = userAccounts[currentUser].role;
    if (userRole === 'teacher') {
        const assigned = userAccounts[currentUser].assignedStrandSections || {};
        if (!assigned[strand] || !assigned[strand].includes(section)) {
            showDialog({ type: 'error', title: 'Access Denied', message: 'You are not authorized to access this student.' });
            return;
        }
    }
    
    // Get student data from clusters
    const c = getClusters();
    
    if (!c[cluster] || !c[cluster][strand] || !c[cluster][strand][section]) {
        showSuccessToast("❌ Student data not found.");
        return;
    }
    
    const studentList = c[cluster][strand][section];
    const studentData = studentList.find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = `${studentData.name} - Portfolio`;
    
    pushNavigation(`${studentData.name} - Portfolio`, () => openStudentPortfolio(studentId, cluster, strand, section));
    
    // Find login account for this student
    const loginAccount = Object.entries(userAccounts).find(
        ([username, account]) => account.studentId === studentId
    );
    
    const username = loginAccount ? loginAccount[0] : 'N/A';
    const password = loginAccount ? loginAccount[1].password : 'N/A';
    
    const html = `
        <div style="max-width: 1100px; margin: 0 auto; padding: 20px;">
            <!-- Back Button -->
            <button type="button" id="studentPortfolioBackBtn" style="margin-bottom: 20px; padding: 10px 20px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ← Back to Students
            </button>
            
            <!-- Main Container Card -->
            <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header with Gradient -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%); padding: 40px 30px; color: white;">
                    <div style="display: flex; gap: 30px; align-items: flex-start;">
                        <!-- Profile Picture Section -->
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                            <img id="profile-pic-display" src="${studentData.img || 'images/default.svg'}" style="width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                            <button onclick="editStudentProfilePic('${studentId}', '${cluster}', '${strand}', '${section}')" style="padding: 8px 16px; background: rgba(255,255,255,0.3); color: white; border: 2px solid white; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                                <i class="fas fa-camera"></i> Edit Photo
                            </button>
                        </div>
                        
                        <!-- Profile Info -->
                        <div style="flex: 1;">
                            <h1 style="margin: 0 0 20px 0; font-size: 2rem;">${studentData.name}</h1>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.95rem; opacity: 0.95;">
                                <div><strong>📚 Cluster:</strong> ${cluster}</div>
                                <div><strong>🎯 Strand:</strong> ${strand}</div>
                                <div><strong>🏛️ Section:</strong> ${section}</div>
                                <div><strong>👤 Username:</strong> ${username}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content Grid -->
                <div style="padding: 30px;">
                    
                    <!-- Personal Information Section -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: var(--au-blue); border-bottom: 3px solid var(--au-blue); padding-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-id-card"></i> Personal Information
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">First Name</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.firstName || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Middle Name</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.middleName || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Last Name</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.lastName || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Gender</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.gender || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Birthday</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.birthday || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">LRN (Learner Reference Number)</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.lrn || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue);">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">School Number</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.studentNumber || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--au-blue); grid-column: 1/-1;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Address</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${studentData.address || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button onclick="editStudentInfo('${studentId}', '${cluster}', '${strand}', '${section}')" style="padding: 10px 20px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-edit"></i> Edit Information
                            </button>
                        </div>
                    </div>
                    
                    <!-- Account Credentials Section -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: var(--au-blue); border-bottom: 3px solid var(--au-blue); padding-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lock"></i> Account Credentials
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Username</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${username}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Password</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600; font-family: monospace;">••••••••</p>
                            </div>
                        </div>
                        
                        <button onclick="editStudentAdminCredentials('${studentId}', '${cluster}', '${strand}', '${section}')" style="margin-top: 15px; padding: 10px 20px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-edit"></i> Edit Credentials
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    // Setup back button event listener with error handling
    const backBtn = appContainer.querySelector('#studentPortfolioBackBtn');
    if (backBtn) {
        backBtn.onclick = function(e) {
            e.preventDefault();
            try {
                if (typeof openStudentsView === 'function') {
                    openStudentsView();
                } else {
                    console.error('openStudentsView function not available');
                    if (typeof goBack === 'function') {
                        goBack();
                    } else {
                        window.history.back();
                    }
                }
            } catch (err) {
                console.error('Error navigating back to students:', err);
                if (typeof goBack === 'function') {
                    goBack();
                } else {
                    window.history.back();
                }
            }
        };
    }
}

// Edit Student Profile Picture
export function editStudentProfilePic(studentId, cluster, strand, section) {
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    const modalHtml = `
        <div class="modal-overlay" onclick="if(event.target === event.currentTarget) cancelEditStudentProfilePic()" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%;">
                <h2 style="margin-top: 0; color: var(--au-blue);">Edit Profile Picture</h2>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <img id="preview-pic" src="${studentData.img || 'images/default.svg'}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--au-blue); margin-bottom: 15px;">
                </div>
                <div style="margin-bottom: 10px; text-align:center; color:#666;">Choose one of the provided profile icons:</div>
                <div id="student-icon-picker" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; max-width:380px; margin: 0 auto 16px auto;"></div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="confirmStudentProfilePicEdit('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button onclick="cancelEditStudentProfilePic()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listener for URL preview
    // Populate icon picker
    const pickerEl = document.getElementById('student-icon-picker');
    if (pickerEl) {
        const icons = ['girl1','girl2','girl3','girl4','girl5','boy1','boy2','boy3','boy4','boy5'];
        pickerEl.innerHTML = '';
        icons.forEach(name => {
            const option = document.createElement('div');
            option.style = 'cursor:pointer; padding:6px; border-radius:8px; display:flex; justify-content:center; align-items:center; background:white;';
            const img = document.createElement('img');
            img.style = 'width:64px; height:64px; border-radius:50%; object-fit:cover;';
            import('./utils.js').then(u => u.setIconSrc(img, name));
            option.appendChild(img);
            option.onclick = () => {
                // mark selection
                document.querySelectorAll('#student-icon-picker div').forEach(el => el.style.boxShadow = 'none');
                option.style.boxShadow = '0 0 0 3px var(--au-blue)';
                document.getElementById('preview-pic').src = img.src;
            };
            // preselect if matches
            if (studentData.img && studentData.img.includes(name)) {
                option.style.boxShadow = '0 0 0 3px var(--au-blue)';
                document.getElementById('preview-pic').src = img.src;
            }
            pickerEl.appendChild(option);
        });
    }
}

export function cancelEditStudentProfilePic() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

export function confirmStudentProfilePicEdit(studentId, cluster, strand, section) {
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    const newImg = document.getElementById('preview-pic')?.src?.trim() || '';

    if (!newImg) {
        showSuccessToast("⚠️ Please select an icon.");
        return;
    }

    studentData.img = newImg;
    // If an edit-student modal is open and this student is being edited, update its tempImageData
    if (typeof editingStudentId !== 'undefined' && editingStudentId === studentId) {
        tempImageData = newImg;
        // also update any visible preview in the edit modal
        const editPreview = document.getElementById('edit-img-preview');
        if (editPreview) editPreview.src = newImg;
    }
    saveClusters();
    
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    openStudentPortfolio(studentId, cluster, strand, section);
    showSuccessToast("✓ Profile picture updated successfully!");
}

// Unified student info editor
export function editStudentInfo(studentId, cluster, strand, section) {
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }

    const genders = getAvailableGenders();
    const modalHtml = `
        <div class="modal-overlay" onclick="if(event.target === event.currentTarget) cancelEditStudentInfo()" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-top: 0; color: var(--au-blue);">Edit Information</h2>
                <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">First Name</label>
                        <input type="text" id="student-fname-edit" value="${studentData.firstName || ''}" placeholder="First name" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Middle Name (Optional)</label>
                        <input type="text" id="student-mname-edit" value="${studentData.middleName || ''}" placeholder="Middle name" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Last Name</label>
                        <input type="text" id="student-lname-edit" value="${studentData.lastName || ''}" placeholder="Last name" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Gender</label>
                        <select id="student-gender-edit" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                            <option value="">-- Select Gender --</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Birthday</label>
                        <input type="date" id="student-bday-edit" value="${studentData.birthday || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">LRN</label>
                        <input type="text" id="student-lrn-edit" value="${studentData.lrn || ''}" placeholder="Learner Reference Number" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">School Number</label>
                        <input type="text" id="student-num-edit" value="${studentData.studentNumber || ''}" placeholder="School number" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Address</label>
                        <textarea id="student-address-edit" placeholder="Address" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; resize: vertical;">${studentData.address || ''}</textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="confirmStudentInfoEdit('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button onclick="cancelEditStudentInfo()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // populate gender select
    setTimeout(() => {
        const genderSelect = document.getElementById('student-gender-edit');
        genders.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            if (g === studentData.gender) opt.selected = true;
            genderSelect.appendChild(opt);
        });
    }, 50);
}

export function cancelEditStudentInfo() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

export function confirmStudentInfoEdit(studentId, cluster, strand, section) {
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }

    const firstName = document.getElementById('student-fname-edit').value.trim();
    const middleName = document.getElementById('student-mname-edit').value.trim();
    const lastName = document.getElementById('student-lname-edit').value.trim();
    const gender = document.getElementById('student-gender-edit').value;
    const birthday = document.getElementById('student-bday-edit').value;
    const lrn = document.getElementById('student-lrn-edit').value.trim();
    const studentNumber = document.getElementById('student-num-edit').value.trim();
    const address = document.getElementById('student-address-edit').value.trim();

    if (!firstName || !lastName) {
        showSuccessToast("⚠️ First and last name are required.");
        return;
    }
    studentData.firstName = firstName;
    studentData.middleName = middleName;
    studentData.lastName = lastName;
    studentData.name = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`;
    studentData.gender = gender;
    studentData.birthday = birthday;
    studentData.lrn = lrn;
    studentData.studentNumber = studentNumber;
    studentData.address = address;

    saveClusters();
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    openStudentPortfolio(studentId, cluster, strand, section);
    showSuccessToast("✓ Information updated successfully!");
}

export function editStudentAdminCredentials(studentId, cluster, strand, section) {
    // Get student data
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    // Find login account
    const loginEntry = Object.entries(userAccounts).find(
        ([username, account]) => account.studentId === studentId
    );
    
    const username = loginEntry ? loginEntry[0] : '';
    
    const modal = document.createElement('div');
    modal.id = 'student-edit-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h2 style="margin-top: 0;">Edit Student Credentials</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Username</label>
                <input type="text" id="edit-student-username" value="${username}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Password</label>
                <input type="text" id="edit-student-password" value="${loginEntry ? loginEntry[1].password : ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="saveStudentAdminCredentials('${studentId}', '${cluster}', '${strand}', '${section}', '${username}')" style="flex: 1; padding: 12px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Save Changes
                </button>
                <button onclick="closeStudentEditModal()" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.closeStudentEditModal = function() {
    const modal = document.getElementById('student-edit-modal');
    if (modal) modal.remove();
};

window.saveStudentAdminCredentials = function(studentId, cluster, strand, section, oldUsername) {
    let newUsername = document.getElementById('edit-student-username').value.trim();
    const newPassword = document.getElementById('edit-student-password').value;

    if (!newUsername || !newPassword) {
        showSuccessToast("⚠️ Please fill in all fields.");
        return;
    }

    // normalize for consistent lookups (usernames are stored lowercase)
    const normalizedOld = String(oldUsername).toLowerCase();
    const normalizedNew = newUsername.toLowerCase();

    // check duplicates only when the normalized values differ
    if (normalizedNew !== normalizedOld && userAccounts[normalizedNew]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }

    // update the account entry
    if (normalizedNew !== normalizedOld) {
        const oldAccount = userAccounts[normalizedOld];
        delete userAccounts[normalizedOld];
        userAccounts[normalizedNew] = {
            ...oldAccount,
            password: newPassword
        };
    } else {
        // just change the password if username didn't really move
        if (userAccounts[normalizedNew]) {
            userAccounts[normalizedNew].password = newPassword;
        }
    }

    saveAccounts();
    closeStudentEditModal();
    showSuccessToast("✅ Student credentials updated successfully!");
    openStudentPortfolio(studentId, cluster, strand, section);
};

export function editStudentAccountInfo(studentId, cluster, strand, section) {
    // Get student data
    const c = getClusters();
    const studentData = c[cluster][strand][section].find(s => s.id === studentId);
    
    if (!studentData) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'student-account-edit-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2); margin: 20px auto;">
            <h2 style="margin-top: 0;">Edit Student Account Information</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid var(--au-blue);">
                <p style="margin: 0; color: #666;"><strong>Student ID:</strong> ${studentId}</p>
            </div>
            
            <h3 style="color: var(--au-blue); margin-top: 25px; margin-bottom: 15px;">Personal Information</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">First Name</label>
                <input type="text" id="edit-student-fname" value="${studentData.firstName || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Middle Name</label>
                <input type="text" id="edit-student-mname" value="${studentData.middleName || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Last Name</label>
                <input type="text" id="edit-student-lname" value="${studentData.lastName || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Birthday</label>
                <input type="date" id="edit-student-birthday" value="${studentData.birthday || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Gender</label>
                <input type="text" id="edit-student-gender" value="${studentData.gender || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
                <button onclick="saveStudentAccountInfo('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 12px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Save Changes
                </button>
                <button onclick="closeStudentAccountEditModal()" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.closeStudentAccountEditModal = function() {
    const modal = document.getElementById('student-account-edit-modal');
    if (modal) modal.remove();
};

window.saveStudentAccountInfo = function(studentId, cluster, strand, section) {
    const fname = document.getElementById('edit-student-fname').value.trim();
    const mname = document.getElementById('edit-student-mname').value.trim();
    const lname = document.getElementById('edit-student-lname').value.trim();
    const birthday = document.getElementById('edit-student-birthday').value;
    const gender = document.getElementById('edit-student-gender').value.trim();
    
    if (!fname || !lname) {
        showSuccessToast("⚠️ First name and last name are required.");
        return;
    }
    
    // Get student data and update
    const c = getClusters();
    const studentList = c[cluster][strand][section];
    const studentIndex = studentList.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        showSuccessToast("❌ Student not found.");
        return;
    }
    
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    // Update student data
    studentList[studentIndex].firstName = fname;
    studentList[studentIndex].middleName = mname;
    studentList[studentIndex].lastName = lname;
    studentList[studentIndex].name = fullName;
    studentList[studentIndex].birthday = birthday;
    studentList[studentIndex].gender = gender;
    
    // Update login account name
    const loginEntry = Object.entries(userAccounts).find(
        ([username, account]) => account.studentId === studentId
    );
    
    if (loginEntry) {
        userAccounts[loginEntry[0]].name = fullName;
    }
    
    saveClusters();
    saveAccounts();
    closeStudentAccountEditModal();
    showSuccessToast("✅ Student information updated successfully!");
    openStudentPortfolio(studentId, cluster, strand, section);
};

// ========================================
// ADMIN TEACHER SELECTOR & PORTFOLIO VIEW
// ========================================

export function openAdminTeacherSelector() {
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = "Teachers";
    
    pushNavigation('Teachers', openAdminTeacherSelector);
    
    // Build list of all teachers
    const teachers = [];
    Object.entries(getUserAccounts()).forEach(([username, account]) => {
        if (account.role === 'teacher') {
            teachers.push({
                username: username,
                ...account
            });
        }
    });
    
    // Get all unique clusters, strands, sections, and subjects
    const c = getClusters();
    const allClusters = new Set();
    const allStrands = new Set();
    const allSections = new Set();
    const allSubjects = new Set();
    
    Object.entries(c).forEach(([clusterName, cluster]) => {
        allClusters.add(clusterName);
        Object.keys(cluster).forEach(strand => {
            if (strand !== 'subjects') {
                allStrands.add(strand);
                const sections = cluster[strand]?.sections || [];
                sections.forEach(section => allSections.add(section));
                const subjects = cluster[strand]?.subjects || [];
                subjects.forEach(subj => allSubjects.add(subj));
            }
        });
    });
    
    const clustersList = Array.from(allClusters).sort();
    const strandsList = Array.from(allStrands).sort();
    const sectionsList = Array.from(allSections).sort();
    const subjectsList = Array.from(allSubjects).sort();
    
    const html = `
        <div style="padding: 30px; max-width: 1300px; margin: 0 auto;">
            <!-- Back Button -->
            <button type="button" onclick="goBack()" style="margin-bottom: 30px; padding: 12px 24px; background: var(--au-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-chevron-left"></i> Back
            </button>
            
            <!-- Header Section -->
            <div style="margin-bottom: 40px;">
                <h1 style="margin: 0 0 10px 0; font-size: 2rem; color: #1a1a1a; display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-chalkboard-user" style="color: #f43f5e;"></i> Manage Teachers
                </h1>
                <p style="margin: 0; color: #666; font-size: 0.95rem;">View and manage all teacher accounts and their assignments</p>
            </div>
            
            <!-- Filter Card -->
            <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid #f43f5e;">
                <h3 style="margin: 0 0 20px 0; color: #f43f5e; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-filter"></i> Filter Teachers
                </h3>
                
                <!-- Filters Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <!-- Cluster Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🏫 Cluster</label>
                        <select id="teacher-cluster-filter" onchange="updateTeacherStrandAndFilterList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#f43f5e'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">All Clusters</option>
                            ${clustersList.map(cluster => `<option value="${cluster}">${cluster}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Strand Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🎯 Strand</label>
                        <select id="teacher-strand-filter" onchange="updateTeacherSectionAndFilterList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#f43f5e'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">All Strands</option>
                        </select>
                    </div>

                    <!-- Section Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">📍 Section</label>
                        <select id="teacher-section-filter" onchange="updateTeacherSubjectsAndFilterList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#f43f5e'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">All Sections</option>
                        </select>
                    </div>

                    <!-- Subject Filter -->
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">📖 Subject</label>
                        <select id="teacher-subject-filter" onchange="filterTeacherList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; background: white; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#f43f5e'" onmouseout="this.style.borderColor='#e0e0e0'">
                            <option value="">All Subjects</option>
                        </select>
                    </div>
                </div>
                
                <!-- Search Box -->
                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 10px; color: #333; font-size: 0.9rem;">🔍 Search by Name</label>
                    <input type="text" id="teacher-search" placeholder="Type teacher name or username..." oninput="filterTeacherList()" onkeyup="filterTeacherList()" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; transition: border-color 0.2s;" onfocus="this.style.borderColor='#f43f5e'" onblur="this.style.borderColor='#e0e0e0'">
                </div>
            </div>
            
            <!-- Teachers List -->
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div id="admin-teacher-list" style="min-height: 200px;">
                    ${teachers.length === 0 ? '<p style="padding: 40px 20px; color: #999; text-align: center; font-style: italic;">No teachers found in the system</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    // Don't populate teacher list until filters are applied
    const listDiv = document.getElementById('admin-teacher-list');
    if (listDiv) {
        listDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 40px 20px; font-style: italic;">👇 Select a filter or search to view teachers</p>';
    }
}

export function populateTeacherList(teachers) {
    const listDiv = document.getElementById('admin-teacher-list');
    
    console.log('populateTeacherList called with', teachers.length, 'teachers:', teachers);
    
    if (teachers.length === 0) {
        listDiv.innerHTML = '<p style="padding: 40px 20px; color: #999; text-align: center; font-style: italic;">No teachers found in the system</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 12px;">';
    teachers.forEach(teacher => {
        html += `
            <div style="display: flex; align-items: center; gap: 15px; padding: 16px; border: 1px solid #e0e0e0; border-radius: 10px; cursor: pointer; transition: all 0.3s ease; background: white;" onmouseover="this.style.backgroundColor='#fff5f7'; this.style.boxShadow='0 4px 12px rgba(244, 63, 94, 0.15)'; this.style.borderColor='#f43f5e'; this.style.transform='translateY(-2px)'" onmouseout="this.style.backgroundColor='white'; this.style.boxShadow='none'; this.style.borderColor='#e0e0e0'; this.style.transform='translateY(0)'" onclick="openTeacherPortfolio('${teacher.username}')">
                <img src="${teacher.img || 'images/default.svg'}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 3px solid #f43f5e; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: #1a1a1a; font-size: 0.95rem;">${teacher.name || teacher.username}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                        <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">👤 @${teacher.username}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="event.stopPropagation(); openTeacherPortfolio('${teacher.username}')" style="padding: 10px 16px; background: #f43f5e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#ec4899'; this.style.boxShadow='0 4px 8px rgba(244, 63, 94, 0.3)'" onmouseout="this.style.backgroundColor='#f43f5e'; this.style.boxShadow='none'">
                        <i class="fas fa-user"></i> Portfolio
                    </button>
                    <button onclick="event.stopPropagation(); deleteTeacherAccount('${teacher.username}')" title="Delete Teacher" style="padding: 10px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#c62828'; this.style.boxShadow='0 4px 8px rgba(220, 53, 69, 0.3)'" onmouseout="this.style.backgroundColor='#dc3545'; this.style.boxShadow='none'">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    listDiv.innerHTML = html;
}

export function filterTeacherList() {
    const searchInput = document.getElementById('teacher-search');
    const clusterFilter = document.getElementById('teacher-cluster-filter');
    const strandFilter = document.getElementById('teacher-strand-filter');
    const sectionFilter = document.getElementById('teacher-section-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    const listDiv = document.getElementById('admin-teacher-list');
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCluster = clusterFilter.value;
    const selectedStrand = strandFilter.value;
    const selectedSection = sectionFilter.value;
    const selectedSubject = subjectFilter.value;
    
    // Check if any filter is applied
    const hasFilters = searchTerm || selectedCluster || selectedStrand || selectedSection || selectedSubject;
    
    if (!hasFilters) {
        listDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 40px 20px; font-style: italic;">👇 Select a filter or search to view teachers</p>';
        return;
    }
    
    const teachers = [];
    Object.entries(getUserAccounts()).forEach(([username, account]) => {
        if (account.role === 'teacher') {
            teachers.push({
                username: username,
                ...account
            });
        }
    });
    
    let filtered = teachers;
    const c = getClusters();
    
    // Build a map of strand -> cluster for quick lookup
    const strandToCluster = {};
    Object.entries(c).forEach(([clusterName, cluster]) => {
        Object.keys(cluster).forEach(strandName => {
            if (strandName !== 'subjects') {
                strandToCluster[strandName] = clusterName;
            }
        });
    });
    
    // If search term is provided, prioritize search and show matching teachers regardless of other filters
    if (searchTerm) {
        filtered = filtered.filter(teacher => {
            const nameMatch = teacher.name && teacher.name.toLowerCase().includes(searchTerm);
            const usernameMatch = teacher.username && teacher.username.toLowerCase().includes(searchTerm);
            console.log('Search filter check for', teacher.username, '- nameMatch:', nameMatch, 'usernameMatch:', usernameMatch, 'teacher.name:', teacher.name);
            return nameMatch || usernameMatch;
        });
        console.log('Filtered teachers after search:', filtered.length, filtered);
    } else {
        // Only apply dropdown filters if no search term is used
        // Filter by cluster
        if (selectedCluster) {
            filtered = filtered.filter(teacher => {
                const assignedStrands = teacher.assignedStrandSections || {};
                return Object.keys(assignedStrands).some(strandKey => 
                    strandToCluster[strandKey] === selectedCluster
                );
            });
        }
        
        // Filter by strand
        if (selectedStrand) {
            filtered = filtered.filter(teacher => {
                const assignedStrands = teacher.assignedStrandSections || {};
                return Object.keys(assignedStrands).includes(selectedStrand);
            });
        }
        
        // Filter by section
        if (selectedSection) {
            filtered = filtered.filter(teacher => {
                const assignedStrands = teacher.assignedStrandSections || {};
                for (const strandKey in assignedStrands) {
                    const sections = assignedStrands[strandKey] || [];
                    if (sections.includes(selectedSection)) {
                        return true;
                    }
                }
                return false;
            });
        }
        
        // Filter by subject
        if (selectedSubject) {
            filtered = filtered.filter(teacher => {
                const assignedSubjects = teacher.assignedSubjects || [];
                return assignedSubjects.includes(selectedSubject);
            });
        }
    }
    
    populateTeacherList(filtered);
}

export function updateTeacherStrandAndFilterList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('teacher-cluster-filter');
    const strandFilter = document.getElementById('teacher-strand-filter');
    const sectionFilter = document.getElementById('teacher-section-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    
    const selectedCluster = clusterFilter.value;
    
    // Reset dependent filters when cluster changes
    strandFilter.innerHTML = '<option value="">All Strands</option>';
    sectionFilter.innerHTML = '<option value="">All Sections</option>';
    subjectFilter.innerHTML = '<option value="">All Subjects</option>';
    
    if (selectedCluster && c[selectedCluster]) {
        Object.keys(c[selectedCluster]).forEach(strand => {
            if (strand !== 'subjects') {
                const opt = document.createElement('option');
                opt.value = strand;
                opt.textContent = strand;
                strandFilter.appendChild(opt);
            }
        });
    }
    
    filterTeacherList();
}

export function updateTeacherSectionAndFilterList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('teacher-cluster-filter');
    const strandFilter = document.getElementById('teacher-strand-filter');
    const sectionFilter = document.getElementById('teacher-section-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    
    const selectedCluster = clusterFilter.value;
    const selectedStrand = strandFilter.value;
    
    // Reset dependent filters when strand changes
    sectionFilter.innerHTML = '<option value="">All Sections</option>';
    subjectFilter.innerHTML = '<option value="">All Subjects</option>';
    
    if (selectedCluster && selectedStrand && c[selectedCluster] && c[selectedCluster][selectedStrand]) {
        const strandData = c[selectedCluster][selectedStrand];
        
        // Populate sections
        Object.keys(strandData).forEach(key => {
            if (key !== 'subjects' && Array.isArray(strandData[key])) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = key;
                sectionFilter.appendChild(opt);
            }
        });
        
        // Populate subjects for this strand
        if (strandData.subjects && Array.isArray(strandData.subjects)) {
            strandData.subjects.forEach(subject => {
                const opt = document.createElement('option');
                opt.value = subject;
                opt.textContent = subject;
                subjectFilter.appendChild(opt);
            });
        }
    }
    
    filterTeacherList();
}

export function updateTeacherSubjectsAndFilterList() {
    const c = getClusters();
    const clusterFilter = document.getElementById('teacher-cluster-filter');
    const strandFilter = document.getElementById('teacher-strand-filter');
    const subjectFilter = document.getElementById('teacher-subject-filter');
    
    const selectedCluster = clusterFilter.value;
    const selectedStrand = strandFilter.value;
    
    // Reset subjects when section changes
    subjectFilter.innerHTML = '<option value="">All Subjects</option>';
    
    // Repopulate subjects based on strand
    if (selectedCluster && selectedStrand && c[selectedCluster] && c[selectedCluster][selectedStrand]) {
        const strandData = c[selectedCluster][selectedStrand];
        if (strandData.subjects && Array.isArray(strandData.subjects)) {
            strandData.subjects.forEach(subject => {
                const opt = document.createElement('option');
                opt.value = subject;
                opt.textContent = subject;
                subjectFilter.appendChild(opt);
            });
        }
    }
    
    filterTeacherList();
}

export function openTeacherPortfolio(username) {
    const teacher = userAccounts[username];
    
    if (!teacher || teacher.role !== 'teacher') {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    
    const titleEl = document.querySelector('.view-title');
    if(titleEl) titleEl.textContent = `${teacher.name || username} - Portfolio`;
    
    pushNavigation(`${teacher.name} - Portfolio`, () => openTeacherPortfolio(username));
    
    // Get assigned strands and subjects
    const assignedStrandSections = teacher.assignedStrandSections || {};
    const assignedSubjects = teacher.assignedSubjects || [];
    
    // Count and list strands, sections, and subjects
    let strandList = [];
    let sectionList = [];
    Object.entries(assignedStrandSections).forEach(([strand, sections]) => {
        if (!strandList.includes(strand)) strandList.push(strand);
        Object.keys(sections || {}).forEach(section => {
            if (!sectionList.includes(section)) sectionList.push(section);
        });
    });
    
    const html = `
        <div style="max-width: 1100px; margin: 0 auto; padding: 20px;">
            <!-- Back Button -->
            <button type="button" onclick="goBack()" style="margin-bottom: 20px; padding: 10px 20px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ← Back to Teachers
            </button>
            
            <!-- Main Container Card -->
            <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header with Gradient -->
                <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 40px 30px; color: white;">
                    <div style="display: flex; gap: 30px; align-items: flex-start;">
                        <!-- Profile Picture Section -->
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                            <img id="profile-pic-display" src="${teacher.img || 'images/default.svg'}" style="width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                            <button onclick="editTeacherProfilePic('${username}')" style="padding: 8px 16px; background: rgba(255,255,255,0.3); color: white; border: 2px solid white; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                                <i class="fas fa-camera"></i> Edit Photo
                            </button>
                        </div>
                        
                        <!-- Profile Info -->
                        <div style="flex: 1;">
                            <h1 style="margin: 0 0 20px 0; font-size: 2rem;">${teacher.name || username}</h1>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.95rem; opacity: 0.95;">
                                <div><strong>👤 Username:</strong> ${username}</div>
                                <div><strong>📚 Strands:</strong> ${strandList.length}</div>
                                <div><strong>🏛️ Sections:</strong> ${sectionList.length}</div>
                                <div><strong>📖 Subjects:</strong> ${assignedSubjects.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content Grid -->
                <div style="padding: 30px;">
                    
                    <!-- Personal Information Section -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: #f43f5e; border-bottom: 3px solid #f43f5e; padding-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-id-card"></i> Personal Information
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Full Name</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${teacher.name || 'N/A'}</p>
                            </div>

                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Birthday</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${teacher.birthday || 'N/A'}</p>
                            </div>

                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e; grid-column: 1/-1;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Address</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${teacher.address || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <button onclick="editTeacherInfo('${username}')" style="margin-top: 15px; padding: 10px 20px; background: #f43f5e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-edit"></i> Edit Information
                        </button>
                    </div>
                    
                    <!-- Assignment Details Section -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: #f43f5e; border-bottom: 3px solid #f43f5e; padding-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-tasks"></i> Assignment Details
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Strands Handling</p>
                                <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--au-blue);">${strandList.length > 0 ? strandList.join(', ') : 'None'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Sections Handling</p>
                                <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--au-blue);">${sectionList.length > 0 ? sectionList.join(', ') : 'None'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Subjects to Teach</p>
                                <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--au-blue);">${assignedSubjects.length > 0 ? assignedSubjects.join(', ') : 'None'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Account Credentials Section -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: #f43f5e; border-bottom: 3px solid #f43f5e; padding-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lock"></i> Account Credentials
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Username</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600;">${username}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 0.85rem; font-weight: 600;">Password</p>
                                <p style="margin: 0; font-size: 1.05rem; font-weight: 600; font-family: monospace;">••••••••</p>
                            </div>
                        </div>
                        
                        <button onclick="editTeacherCredentials('${username}')" style="margin-top: 15px; padding: 10px 20px; background: #f43f5e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-edit"></i> Edit Credentials
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
}

// Edit Teacher Profile Picture
export function editTeacherProfilePic(username) {
    const teacher = userAccounts[username];
    
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    
    const modalHtml = `
        <div class="modal-overlay" onclick="if(event.target === event.currentTarget) cancelEditTeacherProfilePic()" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%;">
                <h2 style="margin-top: 0; color: #f43f5e;">Edit Profile Picture</h2>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <img id="preview-pic" src="${teacher.img || 'images/default.svg'}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #f43f5e; margin-bottom: 15px;">
                </div>
                <div style="margin-bottom:10px; text-align:center; color:#666;">Choose one of the provided profile icons:</div>
                <div id="teacher-icon-picker" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; max-width:380px; margin: 0 auto 16px auto;"></div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="confirmTeacherProfilePicEdit('${username}')" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button onclick="cancelEditTeacherProfilePic()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Populate icon picker for teacher
    const pickerEl = document.getElementById('teacher-icon-picker');
    if (pickerEl) {
        const icons = ['girl1','girl2','girl3','girl4','girl5','boy1','boy2','boy3','boy4','boy5'];
        pickerEl.innerHTML = '';
        icons.forEach(name => {
            const option = document.createElement('div');
            option.style = 'cursor:pointer; padding:6px; border-radius:8px; display:flex; justify-content:center; align-items:center; background:white;';
            const img = document.createElement('img');
            img.style = 'width:64px; height:64px; border-radius:50%; object-fit:cover;';
            import('./utils.js').then(u => u.setIconSrc(img, name));
            option.appendChild(img);
            option.onclick = () => {
                document.querySelectorAll('#teacher-icon-picker div').forEach(el => el.style.boxShadow = 'none');
                option.style.boxShadow = '0 0 0 3px #f43f5e';
                document.getElementById('preview-pic').src = img.src;
            };
            if (teacher.img && teacher.img.includes(name)) {
                option.style.boxShadow = '0 0 0 3px #f43f5e';
                document.getElementById('preview-pic').src = img.src;
            }
            pickerEl.appendChild(option);
        });
    }
}

export function cancelEditTeacherProfilePic() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

export function confirmTeacherProfilePicEdit(username) {
    const teacher = userAccounts[username];
    
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    
    const newImg = document.getElementById('preview-pic')?.src?.trim() || '';

    if (!newImg) {
        showSuccessToast("⚠️ Please select an icon.");
        return;
    }

    teacher.img = newImg;
    saveAccounts();
    
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    openTeacherPortfolio(username);
    showSuccessToast("✓ Profile picture updated successfully!");
}

// Unified teacher info editor
export function editTeacherInfo(username) {
    const teacher = userAccounts[username];
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    const modalHtml = `
        <div class="modal-overlay" onclick="if(event.target === event.currentTarget) cancelEditTeacherInfo()" style="display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-top: 0; color: #f43f5e;">Edit Information</h2>
                <div style="margin-bottom:12px;">
                    <label style="display:block; margin-bottom:8px; font-weight:600;">Full Name</label>
                    <input type="text" id="teacher-name-edit" value="${teacher.name || ''}" placeholder="Full name" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:600;">Birthday</label>
                        <input type="date" id="teacher-bday-edit" value="${teacher.birthday || ''}" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:600;">Address</label>
                        <input type="text" id="teacher-address-edit" value="${teacher.address || ''}" placeholder="Address" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="confirmTeacherInfoEdit('${username}')" style="flex:1; padding:12px; background:#28a745; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button onclick="cancelEditTeacherInfo()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function cancelEditTeacherInfo() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

export function confirmTeacherInfoEdit(username) {
    const teacher = userAccounts[username];
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    const name = document.getElementById('teacher-name-edit').value.trim();
    const birthday = document.getElementById('teacher-bday-edit')?.value || '';
    const address = document.getElementById('teacher-address-edit').value.trim();
    if (!name) {
        showSuccessToast("⚠️ Please enter a name.");
        return;
    }
    teacher.name = name;
    teacher.birthday = birthday;
    teacher.address = address;
    saveAccounts();
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    openTeacherPortfolio(username);
    showSuccessToast("✓ Information updated successfully!");
}

export function editTeacherCredentials(username) {
    const teacher = userAccounts[username];
    
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'teacher-edit-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-top: 0;">Edit Teacher Account</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Full Name</label>
                <input type="text" id="edit-teacher-name" value="${teacher.name || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Username</label>
                <input type="text" id="edit-teacher-username" value="${username}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Password</label>
                <input type="text" id="edit-teacher-password" value="${teacher.password || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="saveTeacherCredentials('${username}')" style="flex: 1; padding: 12px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Save Changes
                </button>
                <button onclick="closeTeacherEditModal()" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.closeTeacherEditModal = function() {
    const modal = document.getElementById('teacher-edit-modal');
    if (modal) modal.remove();
};

window.saveTeacherCredentials = function(oldUsername) {
    const newName = document.getElementById('edit-teacher-name').value.trim();
    const newUsername = document.getElementById('edit-teacher-username').value.trim();
    const newPassword = document.getElementById('edit-teacher-password').value;
    
    if (!newName || !newUsername || !newPassword) {
        showSuccessToast("⚠️ Please fill in all fields.");
        return;
    }
    
    // Check if new username exists (and is different from old)
    if (newUsername !== oldUsername && userAccounts[newUsername]) {
        showSuccessToast("⚠️ Username already exists.");
        return;
    }
    
    // If username changed, update it
    if (newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
        const oldAccount = userAccounts[oldUsername.toLowerCase()];
        delete userAccounts[oldUsername.toLowerCase()];
        userAccounts[newUsername.toLowerCase()] = {
            ...oldAccount,
            name: newName,
            password: newPassword
        };
    } else {
        userAccounts[newUsername.toLowerCase()].name = newName;
        userAccounts[newUsername.toLowerCase()].password = newPassword;
    }
    
    saveAccounts();
    closeTeacherEditModal();
    showSuccessToast("✅ Teacher credentials updated successfully!");
    openTeacherPortfolio(newUsername);
};

export function editTeacherAccountInfo(username) {
    const teacher = userAccounts[username];
    
    if (!teacher) {
        showSuccessToast("❌ Teacher not found.");
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'teacher-account-edit-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2); margin: 20px auto;">
            <h2 style="margin-top: 0;">Edit Teacher Account Information</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f43f5e;">
                <p style="margin: 0; color: #666;"><strong>Username:</strong> ${username}</p>
            </div>
            
            <h3 style="color: #f43f5e; margin-top: 25px; margin-bottom: 15px;">Personal Information</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 8px;">Full Name</label>
                <input type="text" id="edit-teacher-acct-name" value="${teacher.name || ''}" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
                <button onclick="saveTeacherAccountInfo('${username}')" style="flex: 1; padding: 12px; background: var(--au-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Save Changes
                </button>
                <button onclick="closeTeacherAccountEditModal()" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.closeTeacherAccountEditModal = function() {
    const modal = document.getElementById('teacher-account-edit-modal');
    if (modal) modal.remove();
};

window.saveTeacherAccountInfo = function(username) {
    const newName = document.getElementById('edit-teacher-acct-name').value.trim();
    
    if (!newName) {
        showSuccessToast("⚠️ Full name is required.");
        return;
    }
    
    userAccounts[username].name = newName;
    saveAccounts();
    closeTeacherAccountEditModal();
    showSuccessToast("✅ Teacher information updated successfully!");
    openTeacherPortfolio(username);
};

// Deletes a teacher account after confirmation, used in admin teacher list
export function deleteTeacherAccount(username) {
    const accounts = getUserAccounts();
    const teacher = accounts[username];

    const doDelete = () => {
        delete accounts[username];
        saveAccounts();
        // refresh the filtered list so the UI updates immediately
        filterTeacherList();
    };

    if (window.showDeleteConfirmation) {
        window.showDeleteConfirmation(teacher && teacher.name ? teacher.name : username, doDelete);
    } else {
        if (confirm(`Delete ${teacher && teacher.name ? teacher.name : username}?`)) {
            doDelete();
        }
    }
}

// calculate age based on birthday input (used in student/teacher registration forms)
window.calculateAgeFromBirthday = function(prefix) {
    const ageInput = document.getElementById(`${prefix}-age`);
    const bdayInput = document.getElementById(`${prefix}-bday`);
    if (!ageInput || !bdayInput || !bdayInput.value) return;
    
    const birthDate = new Date(bdayInput.value);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    // Validate age (0-120)
    if (age < 0 || age > 120) {
        ageInput.value = '';
        showSuccessToast("⚠️ Please enter a valid birth date.");
        return;
    }
    
    ageInput.value = age;
};

/**
 * Calculate birthday from entered age
 * @param {string} prefix - 's' for student, 't' for teacher
 */
window.calculateBirthdayFromAge = function(prefix) {
    const ageInput = document.getElementById(`${prefix}-age`);
    const bdayInput = document.getElementById(`${prefix}-bday`);
    
    if (!ageInput || !ageInput.value || !bdayInput) return;
    
    const age = parseInt(ageInput.value);
    
    // Validate age range
    if (isNaN(age) || age < 0 || age > 120) {
        ageInput.value = '';
        showSuccessToast("⚠️ Age must be between 0 and 120.");
        return;
    }
    
    // Calculate approximate birthday (assume current year)
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    
    // Use current month and day for the calculated birthday
    const calculatedDate = new Date(birthYear, today.getMonth(), today.getDate());
    
    // Format as YYYY-MM-DD for date input
    const year = calculatedDate.getFullYear();
    const month = String(calculatedDate.getMonth() + 1).padStart(2, '0');
    const day = String(calculatedDate.getDate()).padStart(2, '0');
    
    bdayInput.value = `${year}-${month}-${day}`;
};


