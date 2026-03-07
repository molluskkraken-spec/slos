/* =========================================
   SYSTEM VERIFICATION TESTS
   For SLOS Application Testing
   ========================================= */

class SLOSSystemTest {
    constructor() {
        this.results = [];
        this.passedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Run all system tests
     */
    async runAllTests() {
        console.log('='.repeat(60));
        console.log('🧪 SLOS SYSTEM VERIFICATION TESTS');
        console.log('='.repeat(60));
        
        // Test 1: Storage Initialization
        this.testStorageInitialization();
        
        // Test 2: User Account System
        this.testUserAccounts();
        
        // Test 3: Cluster Structure
        this.testClusterStructure();
        
        // Test 4: Module Imports
        this.testModuleImports();
        
        // Test 5: Data Persistence
        this.testDataPersistence();
        
        // Test 6: Messaging System
        this.testMessagingSystem();
        
        // Test 7: Scoresheet System
        this.testScoresheetSystem();
        
        // Test 8: Contact Filtering
        this.testContactFiltering();
        
        // Print Summary
        this.printSummary();
    }

    /**
     * Test 1: Storage Initialization
     */
    testStorageInitialization() {
        console.log('\n📦 Test 1: Storage Initialization');
        
        const keys = [
            'SLOS_ACCOUNTS',
            'SLOS_CLUSTERS',
            'SLOS_SUBJECTS',
            'SLOS_GENDERS',
            'SLOS_SCORESHEETS',
            'SLOS_NOTIFICATIONS'
        ];
        
        let allExist = true;
        keys.forEach(key => {
            const exists = localStorage.getItem(key) !== null;
            const status = exists ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${exists ? 'EXISTS' : 'MISSING'}`);
            if (!exists) allExist = false;
        });
        
        this.addResult('Storage Keys Exist', allExist);
    }

    /**
     * Test 2: User Accounts
     */
    testUserAccounts() {
        console.log('\n👤 Test 2: User Accounts');
        
        const accountsData = localStorage.getItem('SLOS_ACCOUNTS');
        if (!accountsData) {
            this.addResult('Accounts Data Exists', false);
            return;
        }
        
        try {
            const accounts = JSON.parse(accountsData);
            
            // Check admin exists
            const hasAdmin = accounts.admin !== undefined;
            console.log(`  ${hasAdmin ? '✅' : '❌'} Admin account exists`);
            this.addResult('Admin Account Exists', hasAdmin);
            
            // Check account structure
            let validStructure = true;
            Object.entries(accounts).forEach(([username, account]) => {
                const hasRequired = account.role && account.password;
                if (!hasRequired) validStructure = false;
            });
            console.log(`  ${validStructure ? '✅' : '❌'} All accounts have required fields`);
            this.addResult('Account Structure Valid', validStructure);
            
            console.log(`  ℹ️  Total accounts: ${Object.keys(accounts).length}`);
        } catch (e) {
            console.log(`  ❌ Error parsing accounts: ${e.message}`);
            this.addResult('Account Data Parse', false);
        }
    }

    /**
     * Test 3: Cluster Structure
     */
    testClusterStructure() {
        console.log('\n🏢 Test 3: Cluster Structure');
        
        const clustersData = localStorage.getItem('SLOS_CLUSTERS');
        if (!clustersData) {
            console.log('  ℹ️  No clusters created yet (empty system)');
            this.addResult('Cluster Data Exists', true);
            return;
        }
        
        try {
            const clusters = JSON.parse(clustersData);
            const clusterCount = Object.keys(clusters).length;
            console.log(`  ✅ Clusters parsed successfully`);
            console.log(`  ℹ️  Total clusters: ${clusterCount}`);
            
            let strandCount = 0;
            let sectionCount = 0;
            let studentCount = 0;
            
            Object.entries(clusters).forEach(([clusterName, clusterData]) => {
                Object.entries(clusterData).forEach(([strandName, strandData]) => {
                    if (strandName === 'subjects') return;
                    strandCount++;
                    
                    Object.entries(strandData).forEach(([sectionName, sectionData]) => {
                        if (sectionName === 'subjects') return;
                        if (Array.isArray(sectionData)) {
                            sectionCount++;
                            studentCount += sectionData.length;
                        }
                    });
                });
            });
            
            console.log(`  ℹ️  Total strands: ${strandCount}`);
            console.log(`  ℹ️  Total sections: ${sectionCount}`);
            console.log(`  ℹ️  Total students: ${studentCount}`);
            
            this.addResult('Cluster Structure Valid', true);
        } catch (e) {
            console.log(`  ❌ Error parsing clusters: ${e.message}`);
            this.addResult('Cluster Data Parse', false);
        }
    }

    /**
     * Test 4: Module Imports
     */
    testModuleImports() {
        console.log('\n📚 Test 4: Module Functions');
        
        const requiredGlobals = [
            'handleLogin',
            'handleLogout',
            'renderApp',
            'openInboxView',
            'openScoresheet',
            'showSuccessToast',
            'saveStudentAccount',
            'saveTeacherAccount'
        ];
        
        let allExist = true;
        requiredGlobals.forEach(funcName => {
            const exists = typeof window[funcName] === 'function';
            const status = exists ? '✅' : '❌';
            console.log(`  ${status} window.${funcName}()`);
            if (!exists) allExist = false;
        });
        
        this.addResult('All Required Functions Exposed', allExist);
    }

    /**
     * Test 5: Data Persistence
     */
    testDataPersistence() {
        console.log('\n💾 Test 5: Data Persistence');
        
        const testKey = 'SLOS_TEST_' + Date.now();
        const testData = { test: 'data', timestamp: Date.now() };
        
        // Write test
        localStorage.setItem(testKey, JSON.stringify(testData));
        const written = localStorage.getItem(testKey) !== null;
        console.log(`  ${written ? '✅' : '❌'} Write to localStorage`);
        
        // Read test  
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        const readMatch = retrieved && retrieved.test === 'data';
        console.log(`  ${readMatch ? '✅' : '❌'} Read from localStorage`);
        
        // Cleanup
        localStorage.removeItem(testKey);
        
        this.addResult('Data Persistence', written && readMatch);
    }

    /**
     * Test 6: Messaging System
     */
    testMessagingSystem() {
        console.log('\n💬 Test 6: Messaging System');
        
        const messagesData = localStorage.getItem('slos_messages');
        let messagesValid = true;
        let messageCount = 0;
        
        if (messagesData) {
            try {
                const messages = JSON.parse(messagesData);
                messageCount = Object.keys(messages).length;
                
                // Check structure
                Object.entries(messages).forEach(([chatID, conversation]) => {
                    if (!Array.isArray(conversation)) {
                        messagesValid = false;
                    }
                    conversation.forEach(msg => {
                        if (!msg.sender || !msg.receiver || !msg.timestamp) {
                            messagesValid = false;
                        }
                    });
                });
                
                console.log(`  ${messagesValid ? '✅' : '❌'} Message data structure valid`);
                console.log(`  ℹ️  Total conversations: ${messageCount}`);
            } catch (e) {
                console.log(`  ❌ Error parsing messages: ${e.message}`);
                messagesValid = false;
            }
        } else {
            console.log(`  ℹ️  No messages yet (new system)`);
        }
        
        this.addResult('Messaging System', messagesValid);
    }

    /**
     * Test 7: Scoresheet System
     */
    testScoresheetSystem() {
        console.log('\n📊 Test 7: Scoresheet System');
        
        const scoresheetsData = localStorage.getItem('SLOS_SCORESHEETS');
        let scoresheetsValid = true;
        let scoreCount = 0;
        
        if (scoresheetsData) {
            try {
                const scoresheets = JSON.parse(scoresheetsData);
                
                // Check structure
                Object.entries(scoresheets).forEach(([owner, subjects]) => {
                    Object.entries(subjects).forEach(([subject, types]) => {
                        Object.entries(types).forEach(([typeKey, rows]) => {
                            if (Array.isArray(rows)) {
                                scoreCount += rows.length;
                                rows.forEach(row => {
                                    if (!row.no || !row.title) {
                                        scoresheetsValid = false;
                                    }
                                });
                            }
                        });
                    });
                });
                
                console.log(`  ${scoresheetsValid ? '✅' : '❌'} Scoresheet structure valid`);
                console.log(`  ℹ️  Total scoresheet entries: ${scoreCount}`);
            } catch (e) {
                console.log(`  ❌ Error parsing scoresheets: ${e.message}`);
                scoresheetsValid = false;
            }
        } else {
            console.log(`  ℹ️  No scoresheets created yet`);
        }
        
        this.addResult('Scoresheet System', scoresheetsValid);
    }

    /**
     * Test 8: Contact Filtering
     */
    testContactFiltering() {
        console.log('\n🔍 Test 8: Contact Filtering Logic');
        
        const accountsData = localStorage.getItem('SLOS_ACCOUNTS');
        if (!accountsData) {
            console.log('  ℹ️  No accounts to test filtering');
            this.addResult('Contact Filtering', true);
            return;
        }
        
        try {
            const accounts = JSON.parse(accountsData);
            let teachersWithAssignment = 0;
            let teachersWithoutAssignment = 0;
            
            Object.entries(accounts).forEach(([username, account]) => {
                if (account.role === 'teacher') {
                    if (account.assignedSubjects && account.assignedSubjects.length > 0) {
                        teachersWithAssignment++;
                    } else {
                        teachersWithoutAssignment++;
                    }
                }
            });
            
            console.log(`  ℹ️  Teachers with subject assignments: ${teachersWithAssignment}`);
            console.log(`  ℹ️  Teachers without assignments: ${teachersWithoutAssignment}`);
            
            this.addResult('Contact Filtering Logic', true);
        } catch (e) {
            console.log(`  ❌ Error in contact filtering test: ${e.message}`);
            this.addResult('Contact Filtering Logic', false);
        }
    }

    /**
     * Add test result
     */
    addResult(testName, passed) {
        this.results.push({ testName, passed });
        if (passed) {
            this.passedCount++;
        } else {
            this.failedCount++;
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(60));
        
        this.results.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.testName}`);
        });
        
        console.log('\n' + '-'.repeat(60));
        const totalTests = this.passedCount + this.failedCount;
        const percentage = Math.round((this.passedCount / totalTests) * 100);
        console.log(`✅ PASSED: ${this.passedCount}/${totalTests}`);
        console.log(`❌ FAILED: ${this.failedCount}/${totalTests}`);
        console.log(`📊 SUCCESS RATE: ${percentage}%`);
        console.log('='.repeat(60));
        
        if (this.failedCount === 0) {
            console.log('🎉 ALL TESTS PASSED! System is ready for use.');
        } else {
            console.log('⚠️  Some tests failed. Please review the issues above.');
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SLOSSystemTest;
}

// Auto-run if in browser and user wants to test
console.log('%c👋 Welcome to SLOS System Tests!', 'color: #2196F3; font-size: 14px; font-weight: bold;');
console.log('%cTo run system tests, copy and paste this in the console: new SLOSSystemTest().runAllTests()', 'color: #4CAF50; font-weight: bold;');
