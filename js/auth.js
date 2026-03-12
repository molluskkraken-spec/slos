/* =========================================
   AUTH.JS - AUTHENTICATION & PROFILE
   ========================================= */

import { setCurrentUser, setCurrentStudentId, getCurrentUser, getCurrentStudentId, appContainer, pushNavigation, popNavigation } from './global.js';
import { userAccounts, saveAccounts, saveClusters } from './storage.js';
import { getStudentData } from './utils.js';

export function handleLogin() {
    const userVal = document.getElementById('username').value.toLowerCase().trim();
    const passVal = document.getElementById('password').value.toLowerCase().trim();

    const remember = document.getElementById('remember-me') ? document.getElementById('remember-me').checked : false;

    if (userAccounts[userVal] && userAccounts[userVal].password === passVal) {
        setCurrentUser(userVal, remember);
        if (userAccounts[userVal].role === 'student') {
            setCurrentStudentId(userAccounts[userVal].studentId, remember);
        }
        // Call renderApp through a dynamic import to avoid circular dependency
        import('./app.js').then(module => module.renderApp());
    } else {
        const errorEl = document.getElementById('error-msg');
        errorEl.textContent = "Invalid Username or Password.";
        errorEl.classList.add('shake');
        setTimeout(() => errorEl.classList.remove('shake'), 300);
    }
}

/**
 * Setup Enter key listeners for login form
 */
export function setupLoginFormListeners() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
}

export function handleLogout() {
    console.log("🔴 LOGOUT INITIATED");

    // Blank out navigation history so back button can't return to previous user pages
    import('./global.js').then(module => module.clearNavigationHistory());
    
    // 1. Clear user state
    setCurrentUser(null);
    setCurrentStudentId("");
    
    // 2. Clear notification sound flag so it plays again on next login
    sessionStorage.removeItem('pendingTasksNotificationSoundPlayed');
    console.log("✓ User state cleared");
    console.log("✓ Notification sound flag reset");
    
    // 3. Get references to DOM elements
    const header = document.getElementById('main-header');
    const container = document.getElementById('app-container');
    
    // 4. Hide header
    if (header) {
        header.classList.add('hidden');
        console.log("✓ Header hidden");
    }
    
    // 5. Clear and show loading state
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading login...</div>';
        console.log("✓ Showing loading state");
    }
    
    // 6. Try to find and render the login template
    setTimeout(() => {
        if (!container) {
            console.error("❌ Container not found!");
            return;
        }
        
        container.innerHTML = '';
        
        // Try template first
        const loginTemplate = document.getElementById('login-view');
        if (loginTemplate && loginTemplate.content) {
            try {
                const cloned = loginTemplate.content.cloneNode(true);
                container.appendChild(cloned);
                console.log("✅ LOGIN PAGE DISPLAYED (from template)");
                setupLoginFormListeners();
                return;
            } catch (err) {
                console.error("❌ Error with template:", err);
            }
        }
        
        // Fallback to direct HTML
        container.innerHTML = `
            <div class="login-wrapper">
                <div class="login-box shadow-card">
                    <img src="images/aulogo.png" alt="AU Logo" style="width: 80px; margin-bottom: 10px;"> 
                    <h2>Login to SLOS</h2>
                    <br>
                    <div class="form-container">
                        <input type="text" id="username" placeholder="Username" class="au-input">
                        <input type="password" id="password" placeholder="Password" class="au-input">
                        <div style="display:flex; align-items:center; gap:8px; margin:8px 0;">
                            <input type="checkbox" id="remember-me" />
                            <label for="remember-me" style="font-size:0.9rem; color:#555; cursor:pointer;">Remember me</label>
                        </div>
                        <button onclick="handleLogin()" class="btn-blue-submit">Login</button>
                        <p id="error-msg" class="error-msg"></p>
                    </div>
                </div>
            </div>
        `;
        console.log("✅ LOGIN PAGE DISPLAYED (fallback)");
        setupLoginFormListeners();
    }, 50);
}

export function renderProfileView() {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    
    // Track navigation so back button works
    pushNavigation('Profile Settings', renderProfileView);
    
    _renderProfileViewContent();
}

/**
 * Internal function to render profile view content without adding to navigation history
 * Used by internal callbacks that return to profile view
 */
function _renderProfileViewContent() {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    const userRole = userAccounts[currentUser]?.role || 'student';
    
    document.querySelector('.view-title').textContent = "Profile Settings";
    appContainer.innerHTML = '';
    
    // 1. Clone the template
    appContainer.appendChild(
        document.getElementById('profile-view').content.cloneNode(true)
    );
    
    // Hide "Change Profile" button for admins
    if (userRole === 'admin') {
        const changeProfileBtn = document.querySelector('[onclick="openChangeProfile()"]');
        if (changeProfileBtn) {
            changeProfileBtn.style.display = 'none';
        }
    }
    
    // 2. Set the Name (UPDATED: Checks for real name first)
    const nameDisplay = document.getElementById('profile-name-display');
    
    if (userRole === 'student') {
        const studentData = getStudentData(currentStudentId);
        // If we find a real name (like 'Aaron Adan'), use it. Else use username.
        if (studentData && studentData.name) {
            nameDisplay.textContent = studentData.name.toUpperCase();
        } else {
            nameDisplay.textContent = currentUser.toUpperCase();
        }
    } else {
        // For Admin/Teacher
        nameDisplay.textContent = (userAccounts[currentUser].name || currentUser).toUpperCase();
    }

    // 3. Set the Image
    const bigProfilePic = document.getElementById('big-profile-pic');
    
    if (bigProfilePic) {
        if (userRole === 'student') {
            const studentData = getStudentData(currentStudentId);
            bigProfilePic.src = (studentData && studentData.img) ? studentData.img : 'images/default.svg';
        }
        else if (userRole === 'admin') {
            // Admins always use default.svg
            bigProfilePic.src = 'images/default.svg';
        }
        else {
            // Teachers use their custom image if set, otherwise default.svg
            bigProfilePic.src = userAccounts[currentUser].img || 'images/default.svg';
        }
    }
}

export function saveMyProfilePic() {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    
    const previewContainer = document.getElementById('preview-pic');
    const imgTag = previewContainer.querySelector('img');
    
    if (!imgTag) {
        // Show toast instead of alert
        const Toast = window.showSuccessToast || console.log;
        if (Toast) Toast("⚠️ Please select an image first.");
        return;
    }
    
    const newImgData = imgTag.src;

    if (userAccounts[currentUser].role === 'student') {
        const studentObj = getStudentData(currentStudentId);
        if (studentObj) {
            studentObj.img = newImgData;
            saveClusters(); // Save to storage
        }
    } else {
        userAccounts[currentUser].img = newImgData;
        saveAccounts(); // Save to storage
    }

    // Update Header Immediately
    const headerIcon = document.getElementById('header-profile-pic');
    if (headerIcon) headerIcon.src = newImgData;

    // Show toast instead of alert
    const Toast = window.showSuccessToast || console.log;
    if (Toast) Toast("✅ Profile photo updated successfully!");
    
    // Pop the Change Photo page from history and re-render profile
    popNavigation();
    _renderProfileViewContent();
}

export function validateAndChangePassword() {
    const currentUser = getCurrentUser();
    
    const inputs = document.querySelectorAll('.password-form input');
    const newPass = inputs[1].value;
    const confirmPass = inputs[2].value;

    if (newPass === "" || newPass !== confirmPass) {
        // Show toast instead of alert
        const Toast = window.showSuccessToast || console.log;
        if (Toast) Toast("⚠️ Passwords do not match or are empty.");
        return;
    }

    userAccounts[currentUser].password = newPass;
    saveAccounts();
    
    // Show toast instead of alert
    const Toast = window.showSuccessToast || console.log;
    if (Toast) Toast("✅ Password updated successfully!");
    
    // Pop the Change Password page from history and re-render profile
    popNavigation();
    _renderProfileViewContent();
}

export function openChangeProfile() {
    const currentUser = getCurrentUser();
    const userRole = userAccounts[currentUser]?.role || 'student';
    
    // Prevent admins from changing profile
    if (userRole === 'admin') {
        const Toast = window.showErrorToast || console.log;
        if (Toast) Toast("❌ Admins cannot change their profile picture.");
        return;
    }
    
    // Track navigation so back button works
    pushNavigation('Update Photo', openChangeProfile);
    
    document.querySelector('.view-title').textContent = "Update Photo";
    appContainer.innerHTML = '';
    appContainer.appendChild(document.getElementById('change-photo-view').content.cloneNode(true));
    // Load the current user's profile image and render the icon picker
    const previewPic = document.getElementById('preview-pic');
    const picker = document.getElementById('icon-picker');
    const iconFolder = userRole === 'student' ? 'students' : 'teachers';
    
    let currentImg = 'images/default.svg';
    if (currentUser && userAccounts && userAccounts[currentUser]) {
        currentImg = userAccounts[currentUser].img || 'images/default.svg';
    }

    if (previewPic) {
        previewPic.innerHTML = `<img src="${currentImg}" id="selected-icon-preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;border:3px solid var(--au-blue);">`;
    }

    if (picker) {
        // choose icons based on role
        let icons = [];
        if (userRole === 'student') {
            icons = [
                'girl1', 'girl2', 'girl3', 'girl4', 'girl5',
                'boy1', 'boy2', 'boy3', 'boy4', 'boy5'
            ];
        } else if (userRole === 'teacher') {
            icons = ['tg1','tb1'];
        }

        picker.innerHTML = '';

        icons.forEach(name => {
            const option = document.createElement('div');
            option.className = 'icon-option';
            option.style = 'cursor:pointer; padding:6px; border-radius:8px; display:flex; justify-content:center; align-items:center; background:white;';

            const img = document.createElement('img');
            img.style = 'width:64px; height:64px; border-radius:50%; object-fit:cover;';
            import('./utils.js').then(u => u.setIconSrc(img, name, iconFolder));

            option.appendChild(img);

            option.onclick = () => {
                document.querySelectorAll('#icon-picker .icon-option').forEach(el => el.style.boxShadow = 'none');
                option.style.boxShadow = '0 0 0 3px var(--au-blue)';
                const previewImg = document.getElementById('selected-icon-preview');
                if (previewImg) previewImg.src = img.src;
                option.setAttribute('data-selected-src', img.src);
            };

            if (currentImg && currentImg.includes(name)) {
                option.style.boxShadow = '0 0 0 3px var(--au-blue)';
                const previewImg = document.getElementById('selected-icon-preview');
                if (previewImg) previewImg.src = img.src;
            }

            picker.appendChild(option);
        });

        import('./utils.js').then(u => {
            u.applyIconPickerLayout(picker, icons.length);
        });
    }
}

export function previewImage(event) {
    // File uploads are disabled. This function is retained as a no-op to avoid errors from other modules.
    console.warn('previewImage() called but file uploads are disabled.');
}

export function openChangePasswordView() {
    // Track navigation so back button works
    pushNavigation('Security', openChangePasswordView);
    
    document.querySelector('.view-title').textContent = "Security";
    appContainer.innerHTML = '';
    appContainer.appendChild(document.getElementById('change-password-view').content.cloneNode(true));
}

export function openProfileInfo() {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    const role = userAccounts[currentUser].role;
    
    // Track navigation so back button works
    pushNavigation('Account Information', openProfileInfo);
    
    document.querySelector('.view-title').textContent = "Account Information";
    appContainer.innerHTML = '';
    
    let profileInfoHTML = `
        <div class="dashboard-content" style="max-width: 900px; margin: 0 auto;">
            <h2 style="text-align: center; margin-bottom: 30px; color: var(--au-blue);">📋 Account Information</h2>
    `;
    
    if (role === 'student') {
        // Get student data
        const studentData = window.getStudentData(currentStudentId);
        const subjects = studentData?.subjects?.join(', ') || 'N/A';
        const birthday = studentData?.birthday ? new Date(studentData.birthday).toLocaleDateString() : 'N/A';
        const name = studentData?.name || currentUser;
        const firstName = studentData?.firstName || 'N/A';
        const lastName = studentData?.lastName || 'N/A';
        const gender = studentData?.gender || 'N/A';
        
        profileInfoHTML += `
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">👤 Personal Information</h3>
                <div class="info-row">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">First Name:</span>
                    <span class="info-value">${firstName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Last Name:</span>
                    <span class="info-value">${lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Birthday:</span>
                    <span class="info-value">${birthday}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${gender}</span>
                </div>
            </div>
            
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">🎓 Academic Information</h3>
                <div class="info-row">
                    <span class="info-label">Student ID:</span>
                    <span class="info-value">${currentStudentId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cluster:</span>
                    <span class="info-value">${userAccounts[currentUser].cluster || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Strand:</span>
                    <span class="info-value">${userAccounts[currentUser].strand || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Section:</span>
                    <span class="info-value">${userAccounts[currentUser].section || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Subjects:</span>
                    <span class="info-value">${subjects}</span>
                </div>
            </div>
            
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">🔐 Account Details</h3>
                <div class="info-row">
                    <span class="info-label">Username:</span>
                    <span class="info-value">${currentUser}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Role:</span>
                    <span class="info-value" style="text-transform: uppercase; font-weight: 600; color: #28a745;">Student</span>
                </div>
            </div>
        `;
    } else if (role === 'teacher') {
        // Get teacher data
        const teacherData = userAccounts[currentUser];
        const cluster = teacherData.assignedCluster || 'N/A';
        const subjects = teacherData.assignedSubjects?.join(', ') || 'N/A';
        
        // Build strands and sections display
        let strandsInfo = 'N/A';
        if (teacherData.assignedStrandSections && Object.keys(teacherData.assignedStrandSections).length > 0) {
            strandsInfo = Object.entries(teacherData.assignedStrandSections)
                .map(([strand, sections]) => `${strand} (${sections.join(', ')})`)
                .join('; ');
        }
        
        const name = teacherData.name || currentUser;
        
        profileInfoHTML += `
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">👤 Personal Information</h3>
                <div class="info-row">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${name}</span>
                </div>
            </div>
            
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">📚 Assignment Information</h3>
                <div class="info-row">
                    <span class="info-label">Assigned Cluster:</span>
                    <span class="info-value">${cluster}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Strands & Sections:</span>
                    <span class="info-value">${strandsInfo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Subjects:</span>
                    <span class="info-value">${subjects}</span>
                </div>
            </div>
            
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">🔐 Account Details</h3>
                <div class="info-row">
                    <span class="info-label">Username:</span>
                    <span class="info-value">${currentUser}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Role:</span>
                    <span class="info-value" style="text-transform: uppercase; font-weight: 600; color: #4169e1;">Teacher</span>
                </div>
            </div>
        `;
    } else if (role === 'admin') {
        // Get admin data
        const adminData = userAccounts[currentUser];
        const name = adminData.name || currentUser;
        
        profileInfoHTML += `
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">👤 Personal Information</h3>
                <div class="info-row">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${name}</span>
                </div>
            </div>
            
            <div class="profile-info-section">
                <h3 style="color: var(--au-blue); margin-bottom: 15px; font-size: 1.1rem;">🔐 Account Details</h3>
                <div class="info-row">
                    <span class="info-label">Username:</span>
                    <span class="info-value">${currentUser}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Role:</span>
                    <span class="info-value" style="text-transform: uppercase; font-weight: 600; color: #dc3545;">Administrator</span>
                </div>
            </div>
        `;
    }
    
    profileInfoHTML += `
                <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
                    <button type="button" onclick="goBack()" class="btn-blue-submit" style="min-width: 150px;"><i class="fas fa-arrow-left"></i> Back</button>
                </div>
            </div>
    `;
    
    appContainer.innerHTML = profileInfoHTML;
}