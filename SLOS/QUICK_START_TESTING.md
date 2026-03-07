# 🚀 SLOS - QUICK START TEST GUIDE

## 5-Minute System Check

### 1. Open Application
- Open `index.html` in web browser
- Should see SLOS login screen

### 2. Test Login
```
Username: admin
Password: 123
```
**Expected:** Dashboard with buttons appears

### 3. Run Automated Tests
Press `F12` → Go to Console tab → Copy & paste:
```javascript
new SLOSSystemTest().runAllTests()
```
**Expected:** See ✅ checkmarks for all 8 tests

### 4. Test Key Features (5 minutes each)

#### ✅ Student Messages (2 min)
1. Create a teacher account (Academic Setup → Create Account)
2. Create a student account in same strand with shared subject
3. Login as student
4. Click "Inbox" button
5. Should see teacher in contacts

#### ✅ Teacher Grading (2 min)
1. Login as teacher
2. Go to Students
3. Click on a student → Subjects → Grade Students
4. Only students with shared subject should show

#### ✅ Student Notifications (2 min)
1. Create some scoresheet entries as teacher
2. Login as student  
3. Click "Notifications"
4. Click on pending task
5. Should see scoresheet table

#### ✅ Data Persistence (1 min)
1. Create account → Press F5 to refresh
2. Data should still be there
3. Check browser console:
```javascript
localStorage.getItem('SLOS_ACCOUNTS') // Should have data
```

---

## 🎯 Full Testing (2 hours)

| Phase | Time | Steps |
|-------|------|-------|
| **Setup** | 10 min | Create clusters, strands, sections |
| **Teacher** | 20 min | Create account, add students, create scores |
| **Student** | 20 min | Login, view subjects, see notifications |
| **Messages** | 15 min | Send/receive messages, search contacts |
| **Grading** | 10 min | Grade individual students |
| **Validation** | 10 min | Verify data isolated per student |
| **Edge Cases** | 15 min | Test permissions, filtering |

---

## 🐛 If Something Breaks

### Check Browser Console
Press `F12` → Console tab → Look for red errors

### Run Diagnosis
```javascript
// Test 1: Data exists
console.table(window.userAccounts);

// Test 2: getClusters works
console.log(window.getClusters());

// Test 3: Functions exposed
console.log(typeof window.openScoresheet);

// Test 4: Check specific user
const user = window.getCurrentUser();
console.log('Current user:', user, window.userAccounts[user]);
```

### Reference
See `TROUBLESHOOTING_GUIDE.md` for detailed fixes

---

## 📋 Must-Test Scenarios

### ✅ Can user login?
- [ ] Admin login works
- [ ] Teacher login works  
- [ ] Student login works

### ✅ Can users see correct data?
- [ ] Teacher sees only their students
- [ ] Student sees only their teachers
- [ ] Message contacts filtered correctly

### ✅ Can data be created?
- [ ] Admin creates teacher account
- [ ] Teacher adds student
- [ ] Teacher creates scoresheet entry

### ✅ Do scores stay private?
- [ ] Student A can't see Student B's score
- [ ] Each score saved separately
- [ ] Only template data is shared

### ✅ Does messaging work?
- [ ] Student sent message to teacher
- [ ] Teacher received message
- [ ] Message shows on both sides

### ✅ Do notifications work?
- [ ] Student sees pending tasks
- [ ] Clicking notification shows table
- [ ] Table shows pending entries only

---

## 📊 Success Criteria

**System is READY if:**
- ✅ 8/8 automated tests pass
- ✅ All 6 scenarios above work
- ✅ No error messages in console
- ✅ Data persists after F5 refresh
- ✅ All role permissions working
- ✅ Messages between users working
- ✅ Scoresheet per-student isolation working
- ✅ Notifications showing correct data

---

## 🚁 30-Second System Status Check

```javascript
// Copy this entire block and paste in console
(async () => {
  console.clear();
  console.log('🔍 SLOS Quick Status Check\n');
  
  // Check 1
  const user = window.getCurrentUser();
  console.log('1. User logged in:', user ? '✅' : '❌', user || 'NOT LOGGED IN');
  
  // Check 2
  const accts = JSON.parse(localStorage.getItem('SLOS_ACCOUNTS') || '{}');
  console.log('2. Accounts exist:', Object.keys(accts).length > 0 ? '✅' : '❌', 'Count:', Object.keys(accts).length);
  
  // Check 3
  const clusters = window.getClusters();
  console.log('3. Clusters loaded:', Object.keys(clusters).length > 0 ? '✅' : '⚠️', 'Count:', Object.keys(clusters).length);
  
  // Check 4
  const sheets = JSON.parse(localStorage.getItem('SLOS_SCORESHEETS') || '{}');
  console.log('4. Scoresheets created:', Object.keys(sheets).length > 0 ? '✅' : '⚠️', 'Count:', Object.keys(sheets).length);
  
  // Check 5
  const msgs = JSON.parse(localStorage.getItem('slos_messages') || '{}');
  console.log('5. Messages exist:', Object.keys(msgs).length > 0 ? '✅' : '⚠️', 'Count:', Object.keys(msgs).length);
  
  // Check 6
  const funcs = ['openScoresheet', 'openInboxView', 'saveStudentAccount', 'handleLogin'];
  const missing = funcs.filter(f => typeof window[f] !== 'function');
  console.log('6. Key functions:', missing.length === 0 ? '✅' : '❌', missing.length === 0 ? 'All present' : 'Missing: ' + missing.join(', '));
  
  console.log('\n✅ System ready for testing!' + (missing.length > 0 ? ' (but check missing functions)' : ''));
})();
```

---

## 📱 Test on Different Devices

| Device | Recommended Test |
|--------|-----------------|
| **Desktop (1920px)** | Full UI test, all features |
| **Tablet (768px)** | Messaging on split view |
| **Mobile (360px)** | Inbox chat responsiveness |
| **Chrome** | Primary browser |
| **Firefox** | Compatibility check |
| **Safari** | Final verification |

---

## 🎓 Final Checklist Before "READY"

- [ ] All 8 automated tests pass
- [ ] Can login with admin/123
- [ ] Can create teacher account
- [ ] Can create student account
- [ ] Student sees teacher in messages
- [ ] Teacher sees student in messages
- [ ] Can create scoresheet entry
- [ ] Student sees in notifications
- [ ] Clicking notification shows table
- [ ] Grade Students shows only assigned students
- [ ] No console errors
- [ ] Data persists after refresh

**All checked?** → ✅ **SYSTEM IS READY FOR PRODUCTION**

---

## 📞 Quick Commands

```javascript
// View all accounts
JSON.parse(localStorage.getItem('SLOS_ACCOUNTS'))

// View all clusters
JSON.parse(localStorage.getItem('SLOS_CLUSTERS'))

// View all scoresheets
JSON.parse(localStorage.getItem('SLOS_SCORESHEETS'))

// View all messages
JSON.parse(localStorage.getItem('slos_messages'))

// Check current user
window.getCurrentUser()

// Test a function
window.openScoresheet('English')

// Clear everything (DANGEROUS!)
localStorage.clear(); location.reload()
```

---

**Time to test:** 2-5 hours  
**Difficulty:** Easy (just follow the checklist)  
**Success Rate:** Should be 95%+ if system is working  

Good luck! 🚀
