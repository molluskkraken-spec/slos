/* =========================================
   APP.JS - MAIN ROUTER & DASHBOARD
   ========================================= */

import { getCurrentUser, getCurrentStudentId, appContainer, header, pushNavigation } from './global.js';
import { userAccounts } from './storage.js';
import { getStudentData } from './utils.js';
import { roleConfigs } from './config.js';
import { openSubjects, openStudentsView } from './students.js';
import { updateMessageNotification } from './messaging.js';
import { setupLoginFormListeners } from './auth.js';
import { renderProfileView } from './auth.js';

/*================================
   MAIN APP ROUTER & INITIALIZATION
   ================================*/

export function renderApp() {
    try {
        console.log("🎨 renderApp() called");
        
        // Initialize navigation history with dashboard as root
        pushNavigation('Dashboard', renderApp);
        
        // 1. Check Login Status
        const currentUser = getCurrentUser();
        const currentStudentId = getCurrentStudentId();
        
        console.log("👤 currentUser:", currentUser);
        console.log("📦 currentStudentId:", currentStudentId);
        console.log("📱 appContainer exists:", !!appContainer);
        
        if (!currentUser) {
            console.log("❌ No user - SHOWING LOGIN PAGE");
            console.log("📋 Checking for login template...");
            
            // Get header and hide it
            const headerEl = document.getElementById('main-header');
            if(headerEl) {
                headerEl.classList.add('hidden');
                console.log("✓ Header hidden");
            } else {
                console.warn("⚠️ main-header element not found");
            }
            
            if (!appContainer) {
                console.error("🚨 CRITICAL: appContainer is null!");
                return;
            }
            
            // Clear everything
            appContainer.innerHTML = '';
            console.log("✓ App container cleared");
            
            // First try to get the template
            let loginTemplate = document.getElementById('login-view');
            console.log("📋 loginTemplate element found:", !!loginTemplate);
            
            if (loginTemplate) {
                console.log("📋 loginTemplate.content exists:", !!loginTemplate.content);
                if (!loginTemplate.content) {
                    console.error("❌ loginTemplate.content is null - template may be corrupted");
                }
            } else {
                console.log("⚠️ Templates in template-library:", document.querySelectorAll('#template-library template').length);
                const templateLib = document.getElementById('template-library');
                console.log("⚠️ template-library element exists:", !!templateLib);
                if (templateLib) {
                    console.log("⚠️ template-library HTML length:", templateLib.innerHTML.length);
                }
            }
            
            if(loginTemplate) {
                try {
                    const clonedContent = loginTemplate.content.cloneNode(true);
                    appContainer.appendChild(clonedContent);
                    console.log("✅ LOGIN TEMPLATE RENDERED SUCCESSFULLY");
                    // Setup Enter key listeners
                    setTimeout(() => setupLoginFormListeners(), 100);
                } catch (err) {
                    console.error("❌ Error rendering login template:", err);
                    console.error("   Error stack:", err.stack);
                    showFallbackLogin();
                }
            } else {
                console.warn("⚠️ Login template not found in DOM, using fallback");
                showFallbackLogin();
            }
            return;
        }

    console.log("👤 User logged in as:", currentUser);
    // 2. Show Header
    const headerEl = document.getElementById('main-header');
    if(headerEl) headerEl.classList.remove('hidden');
    
    // 3. Update Role Display (Name)
    const nameDisplayElement = document.getElementById('role-display');
    if (nameDisplayElement) {
        if (userAccounts[currentUser].role === 'student') {
            const sData = getStudentData(currentStudentId);
            if (sData && sData.name) {
                nameDisplayElement.textContent = sData.name.toUpperCase();
            } else {
                nameDisplayElement.textContent = currentUser.toUpperCase();
            }
        } else {
            // Teacher or Admin
            const realName = userAccounts[currentUser].name || currentUser;
            nameDisplayElement.textContent = realName.toUpperCase();
        }
    }

    // 4. Update Header Profile Picture
    const headerIcon = document.getElementById('header-profile-pic');
    if (headerIcon) {
        const userRole = userAccounts[currentUser]?.role || 'student';
        if (userRole === 'student') {
            const sData = getStudentData(currentStudentId);
            headerIcon.src = sData ? sData.img : 'images/default.svg';
        } else if (userRole === 'admin') {
            // Admins always show default.svg in header
            headerIcon.src = 'images/default.svg';
            headerIcon.style.display = 'block';
        } else {
            // Teachers show their custom image or default
            headerIcon.src = userAccounts[currentUser].img || 'images/default.svg';
        }
    }

    // 5. Render Dashboard
    document.querySelector('.view-title').textContent = "Dashboard";
    appContainer.innerHTML = '';
    const dashboardTemplate = document.getElementById('dashboard-view');
    
    if(dashboardTemplate) {
        const clonedContent = dashboardTemplate.content.cloneNode(true);
        
        // For Admin users: Remove notes and schedule cards from the cloned content BEFORE rendering
        if (userAccounts[currentUser].role === 'admin') {
            const scheduleCard = clonedContent.querySelector('#schedule-card-container');
            if (scheduleCard) scheduleCard.remove();
            const notesCard = clonedContent.querySelector('#notes-card-container');
            if (notesCard) notesCard.remove();
            console.log("✓ Admin: Schedule and Notes cards excluded from dashboard");
        }
        
        appContainer.appendChild(clonedContent);
    }

    // 5a. Load schedule, notes, and checklist for students
    if (userAccounts[currentUser].role === 'student') {
        setTimeout(() => {
            try {
                // Load schedule
                if (window.renderStudentSchedule) {
                    window.renderStudentSchedule(currentStudentId);
                    console.log("✓ Student schedule loaded");
                }
                // Load notes and checklist
                if (window.loadQuickNote) {
                    window.loadQuickNote(currentStudentId);
                    console.log("✓ Quick notes loaded");
                }
                if (window.loadChecklist) {
                    window.loadChecklist(currentStudentId);
                    console.log("✓ Checklist loaded");
                }
            } catch (e) {
                console.error('Error loading student schedule/notes:', e);
                console.error('   Stack:', e.stack);
            }
        }, 100);
    }

    // 5a-Teacher. Load schedule for teachers
    if (userAccounts[currentUser].role === 'teacher') {
        setTimeout(() => {
            try {
                // Load teacher schedule
                if (window.renderTeacherSchedule) {
                    window.renderTeacherSchedule(currentUser);
                    console.log("✓ Teacher schedule loaded");
                }
            } catch (e) {
                console.error('Error loading teacher schedule:', e);
                console.error('   Stack:', e.stack);
            }
        }, 100);
    }
    
    // 5b. Show pending notifications for students
    if (userAccounts[currentUser].role === 'student' && currentStudentId) {
        setTimeout(() => {
            if (window.showPendingNotificationPopup) {
                window.showPendingNotificationPopup(currentStudentId);
            }
        }, 500);
    }
    
    // 6. Update message notification badge
    setTimeout(() => window.updateMessageNotification?.(), 100);

    // 6. Generate Buttons based on Role
    const navBar = document.getElementById('role-quick-nav');
    if (!navBar) return;
    navBar.innerHTML = '';

    const userRole = userAccounts[currentUser].role;

    if (roleConfigs[userRole]) {
        roleConfigs[userRole].forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'nav-pill';
            btn.textContent = item;
            
            // --- NAVIGATION LOGIC ---
            if (item === "Subjects") {
                btn.onclick = openSubjects;
            } 
            else if (item === "Students") {
                btn.onclick = openStudentsView;
            }
            else if (item === "Record") {
                // Teacher Records view
                btn.onclick = () => {
                    if (userRole === 'teacher' && typeof window.openTeacherRecordView === 'function') {
                        window.openTeacherRecordView();
                    } else {
                        openStudentsView();
                    }
                };
            }
            else if (item === "Inbox" || item === "Message" || item === "Messages") {
                btn.onclick = openInboxView;
            }
            else if (item === "Academic Setup") {
                // Opens Academic Structure Setup for Admins only
                btn.onclick = () => {
                    if(typeof openAcademicSetup === 'function') {
                        openAcademicSetup();
                    } else {
                        alert("Error: js/students.js not loaded.");
                    }
                };
            }
            else if (item === "Create Account") {
                // Opens the Teacher Registration for Admins only
                btn.onclick = () => {
                    if(typeof openTeacherRegistration === 'function') {
                        openTeacherRegistration();
                    } else {
                        alert("Error: js/students.js not loaded.");
                    }
                };
            }
            else if (item === "Teachers") {
                // Opens Teacher Management for Admins only
                btn.onclick = () => {
                    if(typeof openAdminTeacherSelector === 'function') {
                        openAdminTeacherSelector();
                    } else {
                        alert("Error: js/students.js not loaded.");
                    }
                };
            }
            else {
                btn.onclick = () => alert(item + " view coming soon");
            }
            
            navBar.appendChild(btn);
        });
    } else {
        navBar.innerHTML = "<p style='color:red'>Error: Role not recognized.</p>";
    }
    } catch (error) {
        console.error("❌ CRITICAL ERROR IN renderApp:", error);
        console.error("   Message:", error.message);
        console.error("   Stack:", error.stack);
        
        // Try to show error message to user
        if (appContainer) {
            appContainer.innerHTML = `
                <div style="padding: 20px; background: #ffebee; border: 2px solid #d32f2f; border-radius: 8px; color: #d32f2f; margin: 20px;">
                    <strong style="font-size: 18px;">⚠️ Application Error</strong>
                    <p style="margin: 10px 0;">There was an error loading the application. Please refresh the page.</p>
                    <details style="margin-top: 10px; cursor: pointer; background: white; padding: 10px; border-radius: 4px;">
                        <summary style="color: #c62828; font-weight: bold;">Error details (click to expand)</summary>
                        <pre style="background: #fff3e0; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin-top: 10px; color: #000;">${error.message}

${error.stack}</pre>
                    </details>
                </div>
            `;
        }
    }
}

// Fallback login form function
function showFallbackLogin() {
    if (!appContainer) return;
    
    appContainer.innerHTML = `
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
    console.log("✅ FALLBACK LOGIN FORM RENDERED");
    // Setup Enter key listeners
    setTimeout(() => setupLoginFormListeners(), 100);
}



// Header Event Listeners
const logoBtn = document.getElementById('logoHome');
if(logoBtn) logoBtn.onclick = () => {
    if(getCurrentUser()) renderApp();
};

const profileBtn = document.getElementById('profileBtn');
if(profileBtn) profileBtn.onclick = () => { 
    if (getCurrentUser()) renderProfileView(); 
};