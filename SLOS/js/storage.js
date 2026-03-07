/* =========================================
   STORAGE.JS - LOCALSTORAGE MANAGEMENT
   ========================================= */

import { STORAGE_KEY, ACCOUNTS_KEY, CLUSTERS_KEY, MESSAGES_KEY, PREFS_KEY, SUBJECTS_KEY, GENDERS_KEY, NOTIFICATIONS_KEY, SCORESHEETS_KEY, defaultAccounts, defaultClusters } from './config.js';

// Global Data Objects (loaded from localStorage)
export let userAccounts = null;
export let clusters = null;
export let subjectGrades = null;
export let availableSubjects = null;
export let availableGenders = null;

// Getters to access current state
export function getUserAccounts() {
    // Always read fresh from localStorage to ensure latest data
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    userAccounts = stored ? JSON.parse(stored) : defaultAccounts;
    return userAccounts;
}

export function getClusters() {
    // Always read fresh from localStorage to ensure latest data
    const stored = localStorage.getItem(CLUSTERS_KEY);
    if (stored) {
        try {
            clusters = JSON.parse(stored);
        } catch (e) {
            console.error('🚨 Failed to parse clusters from localStorage, falling back to empty object:', e);
            clusters = {};
        }
    } else {
        clusters = defaultClusters;
    }
    return clusters;
}

export function getSubjectGrades() {
    return subjectGrades;
}

export function getAvailableSubjects() {
    // Always read fresh from localStorage to ensure latest data
    const stored = localStorage.getItem(SUBJECTS_KEY);
    availableSubjects = stored ? JSON.parse(stored) : [];
    return availableSubjects;
}

export function getAvailableGenders() {
    // Always read fresh from localStorage to ensure latest data
    const stored = localStorage.getItem(GENDERS_KEY);
    availableGenders = stored ? JSON.parse(stored) : ['Male', 'Female'];
    console.log('🔍 getAvailableGenders from storage:', availableGenders);
    return availableGenders;
}

/**
 * Convert all strand names to uppercase (migration function)
 */
function migrateStrandsToUppercase(clustersObj) {
    let modified = false;
    
    for (const clusterName in clustersObj) {
        const strands = clustersObj[clusterName];
        const newStrands = {};
        
        for (const strandName in strands) {
            const upperStrand = strandName.toUpperCase();
            if (upperStrand !== strandName) {
                modified = true;
                newStrands[upperStrand] = strands[strandName];
            } else {
                newStrands[strandName] = strands[strandName];
            }
        }
        
        clustersObj[clusterName] = newStrands;
    }
    
    return modified;
}

/**
 * Convert all strand subjects to title case (migration function)
 */
function convertSubjectsToTitleCase(clustersObj) {
    let modified = false;
    
    for (const clusterName in clustersObj) {
        for (const strandName in clustersObj[clusterName]) {
            const strand = clustersObj[clusterName][strandName];
            if (Array.isArray(strand.subjects)) {
                const newSubjects = strand.subjects.map(subject => {
                    const titleCased = subject.split(' ').map(word => {
                        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }).join(' ');
                    if (titleCased !== subject) {
                        modified = true;
                    }
                    return titleCased;
                });
                strand.subjects = newSubjects;
            }
        }
    }
    
    return modified;
}

/**
 * Initialize strand subjects structure (migration function)
 */
function initializeStrandSubjects(clustersObj) {
    let modified = false;
    
    for (const clusterName in clustersObj) {
        for (const strandName in clustersObj[clusterName]) {
            const strand = clustersObj[clusterName][strandName];
            // Initialize subjects array for each strand if it doesn't exist
            if (!strand.subjects) {
                strand.subjects = [];
                modified = true;
            }
        }
    }
    
    return modified;
}

/**
 * Normalize all usernames to lowercase (migration function)
 */
function normalizeUsernamesToLowercase(accountsObj) {
    let modified = false;
    const normalizedAccounts = {};
    
    for (const username in accountsObj) {
        const lowerUsername = username.toLowerCase();
        if (lowerUsername !== username) {
            modified = true;
        }
        normalizedAccounts[lowerUsername] = accountsObj[username];
    }
    
    // Replace original with normalized
    for (const username in accountsObj) {
        delete accountsObj[username];
    }
    
    for (const username in normalizedAccounts) {
        accountsObj[username] = normalizedAccounts[username];
    }
    
    return modified;
}

/**
 * Initialize all data from localStorage or use defaults
 */
export function initializeStorage() {
    // Load accounts from localStorage, but ensure only admin exists by default
    let storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY));
    
    // If no accounts exist, use defaults (only admin)
    if (!storedAccounts) {
        userAccounts = { ...defaultAccounts };
    } else {
        // If accounts exist, verify admin exists, remove any hardcoded test accounts
        if (!storedAccounts.admin) {
            // If admin doesn't exist, add it but PRESERVE all other accounts
            console.warn("⚠️ Admin account missing - restoring it while preserving existing users");
            userAccounts = { ...defaultAccounts, ...storedAccounts };
            // Now save to ensure admin is persisted
            saveAccounts();
        } else {
            // Keep existing accounts but ensure admin exists
            userAccounts = storedAccounts;
            // Remove the hardcoded teacher account if it exists
            if (userAccounts.teacher) {
                delete userAccounts.teacher;
                saveAccounts();
            }
        }
    }
    
    // load clusters but protect against corrupt JSON
    try {
        const raw = localStorage.getItem(CLUSTERS_KEY);
        clusters = raw ? JSON.parse(raw) : defaultClusters;
    } catch (e) {
        console.warn('⚠️ Corrupt cluster data in storage, resetting to default');
        clusters = defaultClusters;
    }
    
    // Normalize usernames to lowercase
    let modified = normalizeUsernamesToLowercase(userAccounts);
    
    // Migrate strands to uppercase
    if (migrateStrandsToUppercase(clusters)) {
        modified = true;
    }
    
    // Initialize strand subjects structure
    if (initializeStrandSubjects(clusters)) {
        modified = true;
    }
    
    // Convert subjects to title case
    if (convertSubjectsToTitleCase(clusters)) {
        modified = true;
    }
    
    if (modified) {
        saveClusters();
    }
    
    subjectGrades = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    availableSubjects = JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || [];
    availableGenders = JSON.parse(localStorage.getItem(GENDERS_KEY)) || ['Male', 'Female'];
}

/**
 * Save Functions
 */
export function saveAccounts() {
    // CRITICAL: Always ensure admin account exists before saving
    if (!userAccounts.admin) {
        console.error("🚨 CRITICAL: Attempting to save without admin account! Restoring...");
        userAccounts.admin = defaultAccounts.admin;
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(userAccounts));
}

export function saveClusters() {
    localStorage.setItem(CLUSTERS_KEY, JSON.stringify(clusters));
    // Also update the module variable to keep it in sync
    const stored = localStorage.getItem(CLUSTERS_KEY);
    clusters = stored ? JSON.parse(stored) : defaultClusters;
}

export function saveGrades() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjectGrades));
}

export function saveSubjects() {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(availableSubjects));
    // Also update the module variable to keep it in sync
    const stored = localStorage.getItem(SUBJECTS_KEY);
    availableSubjects = stored ? JSON.parse(stored) : [];
}

export function saveGenders() {
    console.log('💾 Saving genders to localStorage:', availableGenders);
    localStorage.setItem(GENDERS_KEY, JSON.stringify(availableGenders));
    // Also update the module variable to keep it in sync
    const stored = localStorage.getItem(GENDERS_KEY);
    availableGenders = stored ? JSON.parse(stored) : ['Male', 'Female'];
    console.log('✅ Genders saved. Verified from storage:', availableGenders);
}

export function saveMessages(messages) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function getMessages() {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
}

export function savePreferences(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getPreferences() {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
}

export function saveNotifications(notifications) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function getNotifications() {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '{}');
}

export function getScoresheets() {
    return JSON.parse(localStorage.getItem(SCORESHEETS_KEY) || '{}');
}

export function saveScoresheets(scoresheets) {
    localStorage.setItem(SCORESHEETS_KEY, JSON.stringify(scoresheets || {}));
}
