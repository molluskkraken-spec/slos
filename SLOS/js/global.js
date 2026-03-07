/* =========================================
   GLOBAL.JS - GLOBAL STATE & UI REFERENCES
   ========================================= */

import { initializeStorage, userAccounts as accounts } from './storage.js';
import { loadExternalTemplates } from './utils.js';

// Global State (Private - only accessible through getters/setters)
// Respect explicit 'remember me' preference: only restore persisted user when remembered
const _rememberMe = localStorage.getItem('rememberMe') === 'true';
let _currentUser = _rememberMe ? localStorage.getItem('currentUser') : null;
let _currentViewedSubject = "";
let _currentStudentId = _rememberMe ? localStorage.getItem('currentStudentId') || "" : "";
let _navigationHistory = []; // Track navigation history for back button

// Getters
export function getCurrentUser() {
    return _currentUser;
}

export function getCurrentViewedSubject() {
    return _currentViewedSubject;
}

export function getCurrentStudentId() {
    return _currentStudentId;
}

// Expose simple window-level accessors for legacy modules (avoids circular imports)
if (typeof window !== 'undefined') {
    window.getCurrentUser = getCurrentUser;
    window.getCurrentStudentId = getCurrentStudentId;
}

// Setters
export function setCurrentUser(user, remember = true) {
    _currentUser = user;
    if (user) {
        if (remember) {
            localStorage.setItem('currentUser', user);
            localStorage.setItem('rememberMe', 'true');
        } else {
            // Do not persist the user across sessions
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberMe');
        }
    } else {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
    }
}

export function setCurrentStudentId(id, remember = true) {
    _currentStudentId = id;
    if (id) {
        if (remember) {
            localStorage.setItem('currentStudentId', id);
        } else {
            localStorage.removeItem('currentStudentId');
        }
    } else {
        localStorage.removeItem('currentStudentId');
    }
}

export function setCurrentViewedSubject(subject) {
    _currentViewedSubject = subject;
}

/**
 * Push a page to navigation history
 * @param {string} pageName - Name of the page being navigated to
 * @param {function} pageFunction - Function to call to render this page
 */
export function pushNavigation(pageName, pageFunction) {
    _navigationHistory.push({ name: pageName, func: pageFunction });
    console.log("📍 Navigation pushed:", pageName, "| Stack:", _navigationHistory.map(p => p.name));
}

/**
 * Go back to the previous page in history
 */
export function goBack() {
    if (_navigationHistory.length > 1) {
        _navigationHistory.pop(); // Remove current page
        // Walk back until we find a valid entry with a callable function
        while (_navigationHistory.length > 0) {
            const previousPage = _navigationHistory[_navigationHistory.length - 1];
            console.log("⬅️  Attempting to go back to:", previousPage && previousPage.name);
            try {
                if (previousPage && typeof previousPage.func === 'function') {
                    previousPage.func();
                    return;
                }
            } catch (err) {
                console.error("❌ Error invoking previous page function:", err);
            }
            // If invalid, remove and continue looking
            _navigationHistory.pop();
        }

        // If we fall through, navigate to dashboard as a safe fallback
        console.log("⬅️  No valid previous page found, going to dashboard");
        import('./app.js').then(module => module.renderApp());
    } else {
        console.log("⬅️  No previous page, going to dashboard");
        import('./app.js').then(module => module.renderApp());
    }
}

/**
 * Pop the current page from navigation history without executing anything
 * Used when returning to a page that's already visible (e.g., after saving changes)
 */
export function popNavigation() {
    if (_navigationHistory.length > 0) {
        const popped = _navigationHistory.pop();
        console.log("📴 Navigation popped:", popped && popped.name, "| Stack:", _navigationHistory.map(p => p.name));
    }
}

// Export as properties for backward compatibility (but these won't be mutable)
export let currentUser = null;
export let currentViewedSubject = "";
export let currentStudentId = "";

// DOM References
export const appContainer = document.getElementById('app-container');
export const header = document.getElementById('main-header');

// Log if elements are found
if (!appContainer) console.error("❌ app-container not found!");
if (!header) console.error("❌ main-header not found!");
if (appContainer) console.log("✓ app-container found");
if (header) console.log("✓ main-header found");

/**
 * App Initialization
 */
export async function initializeApp() {
    try {
        console.log("🚀 Initializing SLOS Application...");
        
        // 1. Load storage
        console.log("Loading storage...");
        initializeStorage();
        console.log("✓ Storage initialized");
        
        // 2. Load templates
        console.log("Loading templates...");
        const templatesLoaded = await loadExternalTemplates();
        if (!templatesLoaded) {
            console.error("Failed to load templates");
            throw new Error("Templates failed to load");
        }
        
        // 3. Start the app (renderApp from app.js will be called)
        console.log("✓ App ready to render");
    } catch (error) {
        console.error("Error during app initialization:", error);
        throw error;
    }
}