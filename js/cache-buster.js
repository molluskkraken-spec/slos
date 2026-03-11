/**
 * Cache Buster - Forces real-time updates on GitHub Pages
 * Simple, non-intrusive approach to prevent caching
 */

// Check for updates every hour and reload if needed
const currentHour = new Date().getHours();
let lastCheckedHour = currentHour;

setInterval(() => {
    const newHour = new Date().getHours();
    if (newHour !== lastCheckedHour) {
        console.log('🔄 Hourly update check - reloading page to fetch latest files...');
        lastCheckedHour = newHour;
        setTimeout(() => {
            location.reload(true); // true = hard refresh from server
        }, 2000);
    }
}, 60000); // Check every minute (60000 ms)

console.log('✅ Cache buster activated - Page reloads hourly for fresh updates');
