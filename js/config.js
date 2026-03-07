/* =========================================
   CONFIG.JS - CONSTANTS & DEFAULT DATA
   ========================================= */

// Storage Keys
export const STORAGE_KEY = "SLOS_GRADES";
export const ACCOUNTS_KEY = "SLOS_ACCOUNTS";
export const CLUSTERS_KEY = "SLOS_CLUSTERS";
export const MESSAGES_KEY = "slos_messages";
export const PREFS_KEY = "slos_prefs";
export const SUBJECTS_KEY = "SLOS_SUBJECTS";
export const GENDERS_KEY = "SLOS_GENDERS";
export const NOTIFICATIONS_KEY = "SLOS_NOTIFICATIONS";
export const SCORESHEETS_KEY = "SLOS_SCORESHEETS";

// DEFAULT ACCOUNTS
export const defaultAccounts = {
    "admin": { password: "123", role: "admin", img: "images/default.svg", name: "Administrator" }
};

// DEFAULT CLUSTERS & STRUCTURE
export const defaultClusters = {};

// ROLE CONFIGURATION
export const roleConfigs = {
    admin: ['Academic Setup', 'Create Account', 'Students', 'Teachers'],
    teacher: ['Record', 'Messages'],
    student: ['Subjects', 'Inbox']
};


