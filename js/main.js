/* =========================================
   MAIN.JS - APPLICATION ENTRY POINT
   ========================================= */

import { initializeApp, getCurrentUser, getCurrentStudentId, goBack, pushNavigation } from './global.js';
import { renderApp } from './app.js';
import * as auth from './auth.js';
import * as students from './students.js';
import * as messaging from './messaging.js';
import { getStudentData, loadQuickNote, loadChecklist, renderStudentSchedule, renderTeacherSchedule } from './utils.js';

// Expose functions to window for HTML onclick handlers
window.renderApp = renderApp;
window.handleLogin = auth.handleLogin;
window.handleLogout = auth.handleLogout;
window.renderProfileView = auth.renderProfileView;
window.saveMyProfilePic = auth.saveMyProfilePic;
window.previewImage = auth.previewImage;
window.validateAndChangePassword = auth.validateAndChangePassword;
window.openChangeProfile = auth.openChangeProfile;
window.togglePasswordVisibility = students.togglePasswordVisibility;

window.openStudentsView = students.openStudentsView;
window.openSubjects = students.openSubjects;
window.confirmStudentSelection = students.confirmStudentSelection;
window.openAddStudentModal = students.openAddStudentModal;
window.goBackToTeacherStudentSelector = students.goBackToTeacherStudentSelector;
window.populateTeacherAddStudentStrands = students.populateTeacherAddStudentStrands;
window.updateTeacherAddStudentSections = students.updateTeacherAddStudentSections;
window.updateTeacherAddStudentSubjects = students.updateTeacherAddStudentSubjects;
window.saveTeacherAddedStudent = students.saveTeacherAddedStudent;
window.saveStudentChanges = students.saveStudentChanges;
window.closeEditModal = students.closeEditModal;
window.saveNewStudent = students.saveNewStudent;
window.closeAddModal = students.closeAddModal;
window.onClusterChange = students.onClusterChange;
window.onStrandChange = students.onStrandChange;
window.onTeacherClusterChange = students.onTeacherClusterChange;
window.onTeacherStrandChange = students.onTeacherStrandChange;
window.onStudentClusterChange = students.onStudentClusterChange;
window.onStudentStrandChange = students.onStudentStrandChange;
window.populateTeacherStrandSectionsUI = students.populateTeacherStrandSectionsUI;
window.onTeacherStrandToggle = students.onTeacherStrandToggle;
window.getTeacherStrandSections = students.getTeacherStrandSections;
window.populateTeacherSubjectsForCluster = students.populateTeacherSubjectsForCluster;
window.updateTeacherSubjectsForSelectedStrands = students.updateTeacherSubjectsForSelectedStrands;
window.updateTeacherCompleteSummary = students.updateTeacherCompleteSummary;
window.updateStudentCompleteSummary = students.updateStudentCompleteSummary;
window.updateTeacherAddStudentSummary = students.updateTeacherAddStudentSummary;
window.updateStudentList = students.updateStudentList;
window.openCreateAccountView = students.openCreateAccountView;
window.openCreateAccountModal = students.openCreateAccountModal;
window.openAccountSelection = students.openAccountSelection;
window.openAcademicSetup = students.openAcademicSetup;
window.openStudentRegistration = students.openStudentRegistration;
window.openTeacherRegistration = students.openTeacherRegistration;
window.populateTeacherStrandFilter = students.populateTeacherStrandFilter;
window.updateTeacherSectionAndStudentList = students.updateTeacherSectionAndStudentList;
window.updateTeacherStudentList = students.updateTeacherStudentList;
window.selectTeacherStudent = students.selectTeacherStudent;
window.openEditStudentModal = students.openEditStudentModal;
window.previewEditImage = students.previewEditImage;
window.deleteStudent = students.deleteStudent;
window.deleteTeacherStudent = students.deleteTeacherStudent;
window.confirmDeleteTeacherStudent = students.confirmDeleteTeacherStudent;
window.cancelDeleteTeacherStudent = students.cancelDeleteTeacherStudent;
window.editTeacherStudent = students.editTeacherStudent;
window.confirmEditTeacherStudent = students.confirmEditTeacherStudent;
window.cancelEditTeacherStudent = students.cancelEditTeacherStudent;
window.previewEditProfileImage = students.previewEditProfileImage;
window.editAdminStudent = students.editAdminStudent;
window.closeAdminEditDialog = students.closeAdminEditDialog;
window.saveAdminStudentCredentials = students.saveAdminStudentCredentials;
window.openStudentInboxAdmin = students.openStudentInboxAdmin;
window.closeStudentInboxModal = students.closeStudentInboxModal;
window.viewStudentMessages = students.viewStudentMessages;
window.updateAdminStrandAndStudentList = students.updateAdminStrandAndStudentList;
window.updateAdminSectionAndStudentList = students.updateAdminSectionAndStudentList;
window.updateAdminStudentList = students.updateAdminStudentList;
window.selectAdminStudent = students.selectAdminStudent;
window.openStudentPortfolio = students.openStudentPortfolio;
window.editStudentAdminCredentials = students.editStudentAdminCredentials;
window.saveStudentAdminCredentials = students.saveStudentAdminCredentials;
window.editStudentAccountInfo = students.editStudentAccountInfo;
window.saveStudentAccountInfo = students.saveStudentAccountInfo;
window.editStudentProfilePic = students.editStudentProfilePic;
window.cancelEditStudentProfilePic = students.cancelEditStudentProfilePic;
window.confirmStudentProfilePicEdit = students.confirmStudentProfilePicEdit;

// student unified information editor
window.editStudentInfo = students.editStudentInfo;
window.cancelEditStudentInfo = students.cancelEditStudentInfo;
window.confirmStudentInfoEdit = students.confirmStudentInfoEdit;

window.openAdminTeacherSelector = students.openAdminTeacherSelector;
window.populateTeacherList = students.populateTeacherList;
window.filterTeacherList = students.filterTeacherList;
window.updateTeacherStrandAndFilterList = students.updateTeacherStrandAndFilterList;
window.updateTeacherSectionAndFilterList = students.updateTeacherSectionAndFilterList;
window.updateTeacherSubjectsAndFilterList = students.updateTeacherSubjectsAndFilterList;
window.openTeacherPortfolio = students.openTeacherPortfolio;
window.editTeacherProfilePic = students.editTeacherProfilePic;
window.cancelEditTeacherProfilePic = students.cancelEditTeacherProfilePic;
window.confirmTeacherProfilePicEdit = students.confirmTeacherProfilePicEdit;

// teacher unified information editor
window.editTeacherInfo = students.editTeacherInfo;
window.cancelEditTeacherInfo = students.cancelEditTeacherInfo;
window.confirmTeacherInfoEdit = students.confirmTeacherInfoEdit;
window.editTeacherCredentials = students.editTeacherCredentials;
window.editTeacherAccountInfo = students.editTeacherAccountInfo;
window.saveTeacherAccountInfo = students.saveTeacherAccountInfo;
window.deleteTeacherAccount = students.deleteTeacherAccount;

// Teacher Record View functions
window.openTeacherRecordView = students.openTeacherRecordView;
window.populateRecordStrandFilter = students.populateRecordStrandFilter;
window.populateRecordSubjectFilter = students.populateRecordSubjectFilter;
window.updateRecordSectionAndSubjectList = students.updateRecordSectionAndSubjectList;
window.updateRecordSectionAndStudentList = students.updateRecordSectionAndStudentList;
window.updateRecordStudentList = students.updateRecordStudentList;
window.displayRecordCards = students.displayRecordCards;
window.openTeacherStudentScoresheet = students.openTeacherStudentScoresheet;
window.handleRecordSubjectChange = students.handleRecordSubjectChange;
window.openTeacherRecordTable = students.openTeacherRecordTable;
window.switchTeacherQuarter = students.switchTeacherQuarter;
window.addNewOption = students.addNewOption;
window.deleteCurrentOption = students.deleteCurrentOption;
window.initializeDateInputs = students.initializeDateInputs;
window.initializeSentenceCaseInputs = students.initializeSentenceCaseInputs;
window.initializeTitleCaseInputs = students.initializeTitleCaseInputs;
window.showSuccessToast = students.showSuccessToast;
window.renderSubjectDetails = students.renderSubjectDetails;
window.renderScoresheet = students.renderScoresheet;
window.renderTeacherScoresheet = students.renderTeacherScoresheet;
window.renderStudentScoresheet = students.renderStudentScoresheet;
window.openScoresheet = students.openScoresheet;
window.saveStudentAccount = students.saveStudentAccount;
window.saveTeacherAccount = students.saveTeacherAccount;
window.saveAdminAccount = students.saveAdminAccount;
window.updateScore = students.updateScore;
window.addTeacherStrand = students.addTeacherStrand;
window.deleteTeacherStrand = students.deleteTeacherStrand;
window.addTeacherSubject = students.addTeacherSubject;
window.deleteTeacherSubject = students.deleteTeacherSubject;
window.closeCustomDialog = students.closeCustomDialog;
window.confirmCustomDialog = students.confirmCustomDialog;

// CSV Import functions
window.triggerCSVFileInput = students.triggerCSVFileInput;
window.handleCSVFileUpload = students.handleCSVFileUpload;
window.showCSVPreviewModal = students.showCSVPreviewModal;
window.closeCSVPreviewModal = students.closeCSVPreviewModal;
window.confirmCSVImport = students.confirmCSVImport;

window.openInboxView = messaging.openInboxView;
window.updateMessageNotification = messaging.updateMessageNotification;
window.renderMessages = messaging.renderMessages;
window.sendMessage = messaging.sendChatMessage;
window.sendChatMessage = messaging.sendChatMessage;
window.handleChatImage = messaging.handleChatImage;
window.loadChat = messaging.loadChat;

// Expose notification and scoresheet functions
window.showPendingNotificationPopup = window.showPendingNotificationPopup || function() {};
window.openNotificationsView = window.openNotificationsView || function() {};
window.openNotificationsViewForSubject = window.openNotificationsViewForSubject || function() {};
window.closeNotificationPopup = window.closeNotificationPopup || function() {};
window.changeWrittenWorksQuarter = window.changeWrittenWorksQuarter || function() {};
window.toggleWrittenWorksEditMode = window.toggleWrittenWorksEditMode || function() {};
window.updateWrittenWorksField = window.updateWrittenWorksField || function() {};
window.deleteWrittenWorksRow = window.deleteWrittenWorksRow || function() {};

/**
 * Request notification permission for pending tasks alerts
 */
window.requestNotificationPermission = function() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(err => {
            console.log('Notification permission request cancelled or failed:', err);
        });
    }
};

// Expose getters for debugging
window.getCurrentUser = getCurrentUser;
window.getCurrentStudentId = getCurrentStudentId;

// Verify critical functions are exposed
setTimeout(() => {
    const criticalFunctions = [
        'saveTeacherAccount',
        'saveStudentAccount',
        'openAdminTeacherSelector'
    ];
    
    criticalFunctions.forEach(fn => {
        if (typeof window[fn] === 'function') {
            console.log(`✅ ${fn} is available`);
        } else {
            console.warn(`⚠️  ${fn} is NOT available - Type: ${typeof window[fn]}`);
        }
    });
}, 1000);
window.goBack = goBack;
window.pushNavigation = pushNavigation;
window.getStudentData = getStudentData;
window.loadQuickNote = loadQuickNote;
window.loadChecklist = loadChecklist;
window.renderStudentSchedule = renderStudentSchedule;
window.renderTeacherSchedule = renderTeacherSchedule;

// DIAGNOSTIC: Clear session and reload
window.clearSessionAndReload = function() {
    console.log("🔄 Clearing session and reloading...");
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentStudentId');
    location.reload();
};

// DIAGNOSTIC: Check login system status
window.checkLoginStatus = function() {
    console.log("\n📋 LOGIN SYSTEM DIAGNOSTICS");
    console.log("===========================================");
    console.log("Current User:", localStorage.getItem('currentUser') || "NONE");
    console.log("Current Student ID:", localStorage.getItem('currentStudentId') || "NONE");
    console.log("\nApp Container Present:", !!document.getElementById('app-container'));
    console.log("Header Present:", !!document.getElementById('main-header'));
    console.log("Login Template Present:", !!document.getElementById('login-view'));
    console.log("Dashboard Template Present:", !!document.getElementById('dashboard-view'));
    console.log("\nTo clear session and show login:");
    console.log("  → clearSessionAndReload()");
    console.log("===========================================");
};

// Start the application
(async () => {
    try {
        console.log("🚀 Starting SLOS Application...");
        console.log("📊 Current localStorage state:");
        console.log("  - currentUser:", localStorage.getItem('currentUser'));
        console.log("  - currentStudentId:", localStorage.getItem('currentStudentId'));
        
        await initializeApp();
        console.log("✓ Initialization complete");
        
        // Run data migration to add dateGiven field to existing items
        if (typeof window.migrateAllStudentsData === 'function') {
            try {
                window.migrateAllStudentsData();
            } catch (e) {
                console.error('Migration error:', e);
            }
        }
        
        // Request notification permission for pending tasks alerts
        if ('Notification' in window && Notification.permission === 'default') {
            window.requestNotificationPermission();
        }
        
        // Inject custom dialog template
        const template = document.getElementById('custom-dialog-template');
        if (template) {
            const dialogClone = template.content.cloneNode(true);
            document.body.appendChild(dialogClone);
        } else {
            // Create custom dialog HTML if template doesn't exist
            const dialogHTML = `
                <div class="custom-dialog-overlay" id="custom-dialog-overlay">
                    <div class="custom-dialog-box shadow-card">
                        <h3 id="custom-dialog-title">Enter Value</h3>
                        <input type="text" id="custom-dialog-input" class="au-input" placeholder="Enter here..." />
                        <div class="custom-dialog-buttons">
                            <button onclick="closeCustomDialog()" class="btn-gray">Cancel</button>
                            <button onclick="confirmCustomDialog()" class="btn-blue-submit">OK</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', dialogHTML);
        }
        
        renderApp();
        console.log("✓ App rendered successfully");
    } catch (error) {
        console.error("❌ Fatal error:", error);
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `<div style="color: red; padding: 20px; font-size: 18px;"><strong>Error:</strong> ${error.message}</div>`;
        }
    }
})();

// Add debug function to check data integrity
window.debugDataStatus = function() {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("📊 SLOS SYSTEM DATA STATUS");
    console.log("═══════════════════════════════════════════════════");
    
    const accountsRaw = localStorage.getItem('SLOS_ACCOUNTS');
    const clustersRaw = localStorage.getItem('SLOS_CLUSTERS');
    const gradesRaw = localStorage.getItem('SLOS_GRADES');
    
    try {
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : null;
        console.log("\n✅ ACCOUNTS:");
        console.log(`   Total users: ${accounts ? Object.keys(accounts).length : 0}`);
        if (accounts) {
            Object.keys(accounts).forEach(user => {
                console.log(`   - ${user} (${accounts[user].role})`);
            });
        } else {
            console.log("   ⚠️ No accounts found - will reset to defaults on next load");
        }
    } catch (e) {
        console.log("   ❌ Corrupted accounts data");
    }
    
    try {
        const clusters = clustersRaw ? JSON.parse(clustersRaw) : null;
        console.log("\n✅ CLUSTERS & STRANDS:");
        if (clusters) {
            console.log(`   Total clusters: ${Object.keys(clusters).length}`);
            Object.keys(clusters).forEach(cluster => {
                const strands = Object.keys(clusters[cluster]).length;
                console.log(`   - ${cluster}: ${strands} strand(s)`);
            });
        } else {
            console.log("   ℹ️ No clusters configured (empty by default)");
        }
    } catch (e) {
        console.log("   ❌ Corrupted clusters data");
    }
    
    try {
        const grades = gradesRaw ? JSON.parse(gradesRaw) : null;
        console.log("\n✅ GRADES & SCORES:");
        console.log(`   Stored entries: ${grades ? Object.keys(grades).length : 0}`);
    } catch (e) {
        console.log("   ❌ Corrupted grades data");
    }
    
    console.log("\n📝 WHAT TO DO IF DATA IS MISSING:");
    console.log("   1. Make sure you clicked SAVE after making changes");
    console.log("   2. Check Console > Application > Local Storage");
    console.log("   3. Run: debugDataStatus() in console to see this report");
    console.log("══════════════════════════════════════════════════════\n");
};
