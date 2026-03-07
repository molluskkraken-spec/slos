# SLOS System - Quick Troubleshooting Guide

## Common Issues & Solutions

### 1. **Messages Show "No Contacts"**
**Symptoms:** Student or Teacher opens Inbox → See "No contacts found"

**Causes:**
- Teacher not assigned to any subjects
- No shared subjects between teacher and student
- Student not in teacher's assigned sections
- Student has no subjects assigned

**Solutions:**
1. **For Teachers:** Go to Academic Setup → Create Account → Verify teacher has:
   - ✅ Strand assignments (assignedStrandSections)
   - ✅ Subject assignments (assignedSubjects)
   - ✅ Check console: `window.userAccounts[username]` shows both fields

2. **For Students:** Verify student has:
   - ✅ Assigned to correct cluster
   - ✅ Assigned to correct strand
   - ✅ Assigned to correct section  
   - ✅ Has subjects assigned
   - ✅ Teacher teaches at least one of those subjects

3. **Debug Steps:**
```javascript
// Check teacher assignments (in browser console)
const teacher = window.userAccounts['teacher_username'];
console.log('Assigned Subjects:', teacher.assignedSubjects);
console.log('Assigned Strands:', teacher.assignedStrandSections);

// Check if getClusters() works
const clusters = window.getClusters();
console.log('Clusters:', Object.keys(clusters));
```

---

### 2. **Notification Table Doesn't Show When Clicking Pending Task**
**Symptoms:** Student clicks notification → White screen or blank table

**Causes:**
- Scoresheet data not found for subject
- Student not properly linked to teacher
- Scoresheet entries not created yet

**Solutions:**
1. **Verify scoresheet exists:**
```javascript
const scoresheets = JSON.parse(localStorage.getItem('SLOS_SCORESHEETS'));
console.log('Scoresheet subjects:', Object.keys(scoresheets));
```

2. **Create test scoresheet entry:**
   - Teacher login → Go to Subjects → Pick subject → Create task

3. **Check teacher assignment:**
   - Verify teacher is assigned to student's strand/section AND subject

---

### 3. **Grade Students Button Shows Wrong Students**
**Symptoms:** Work Immersion teacher sees students with Animation 3

**Causes:**
- Subject filtering not applied
- Student enrolled in multiple subjects but not actually taught

**Solutions:**
1. **Verify via console:**
```javascript
// Get current subject from context
console.log('Current context:', window.currentScoreSheetContext);

// Check student's subjects
const accounts = JSON.parse(localStorage.getItem('SLOS_ACCOUNTS'));
const student = accounts['student_username'];
console.log('Student subjects:', student.subjects);
```

2. **Ensure Teacher subject assignment:**
   - Admin creates account → Select ONLY Work Immersion
   - Don't select unrelated subjects

3. **Ensure Student in correct section:**
   - Student must be in section where teacher teaches

---

### 4. **Students See Each Other's Scores**
**Symptoms:** Student sees another student's score instead of their own

**Causes:**
- Per-student isolation not working
- Using wrong student username for lookup
- Template data being shown instead of personal data

**Solutions:**
1. **Verify data structure:**
```javascript
const scoresheets = JSON.parse(localStorage.getItem('SLOS_SCORESHEETS'));
// Should have keys like: 'student1', 'student2', 'SECTION_STRAND_SECTION'
console.log('Scoresheet owners:', Object.keys(scoresheets));
```

2. **Check rendering logic:**
   - File: `js/scoresheet.js`, function: `renderScoresheetTable()`
   - Ensure it overlays personal data on templates

---

### 5. **Login Not Working**
**Symptoms:** Enter credentials → Nothing happens or error appears

**Causes:**
- Account not created
- Password incorrect
- JavaScript not loaded

**Solutions:**
1. **Check admin account exists:**
```javascript
const accounts = JSON.parse(localStorage.getItem('SLOS_ACCOUNTS'));
console.log('Has admin:', accounts.admin !== undefined);
```

2. **Default admin credentials:**
   - Username: `admin`
   - Password: `123`

3. **Test login:**
```javascript
window.handleLogin('admin', '123');
```

---

### 6. **Toast Notifications Not Appearing**
**Symptoms:** No success/error toast messages

**Causes:**
- CSS not loaded
- Container not created
- Animation not defined

**Solutions:**
1. **Verify CSS exists:**
   - Open browser DevTools → Elements → Search for "toast-container"
   - Check that style.css is loaded

2. **Manual test:**
```javascript
window.showSuccessToast('Test message');
```

3. **Check in Elements tab** for dynamically created div

---

### 7. **Cluster/Strand Data Not Saving**
**Symptoms:** Create cluster → Refresh page → Data gone

**Causes:**
- `saveClusters()` not called
- localStorage quota exceeded
- Browser in private/incognito mode

**Solutions:**
1. **Check if saving is called:**
   - Edit file accessing cluster
   - Verify `saveClusters()` is called after modifications

2. **Check localStorage quota:**
```javascript
// Get current usage
const size = new Blob(Object.values(localStorage)).size;
console.log('localStorage size:', (size / 1024 / 1024).toFixed(2) + ' MB');
```

3. **Check browser mode:**
   - Exit private/incognito mode
   - Allow localStorage in browser settings

---

### 8. **Scoresheet Takes Long Time to Load**
**Symptoms:** Click on subject → Takes >5 seconds to show table

**Causes:**
- Large number of students (>500)
- Complex scoresheet renders
- Network delay (if using external resources)

**Solutions:**
1. **Optimize data lookup:**
   - Add caching to `getStudentData()`
   - Batch process contacts

2. **Monitor performance:**
```javascript
console.time('scoresheet-render');
window.openScoresheet('Subject Name');
console.timeEnd('scoresheet-render');
```

3. **Reduce data:**
   - Split into multiple clusters
   - Archive old scoresheets

---

### 9. **Message Appears But Doesn't Send**
**Symptoms:** Type message → Click send → Message doesn't appear

**Causes:**
- No chat partner selected
- Chat storage corrupted
- Missing message structure

**Solutions:**
1. **Ensure partner selected:**
   - Click contact first
   - Verify chat header shows name

2. **Check message storage:**
```javascript
const messages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
console.log('Conversations:', Object.keys(messages));
```

3. **Manual message test:**
```javascript
window.saveMessageToStorage('Test message', 'text');
```

---

### 10. **Profile Picture Not Updating**
**Symptoms:** Upload photo → Not showing in profile

**Causes:**
- Image not converted to base64
- File too large
- Wrong element targeted

**Solutions:**
1. **Check image size:**
   - Max recommended: 2MB
   - Format: JPG, PNG, GIF

2. **Manual test:**
```javascript
const img = document.createElement('img');
img.src = 'data:image/...'; // base64 string
console.log('Image loads:', img.complete);
```

3. **Force refresh:**
   - Ctrl+F5 (hard refresh)
   - Clear browser cache

---

## Debug Console Commands

### Quick Status Check
```javascript
// Run this to get full system status
new SLOSSystemTest().runAllTests();
```

### Check Current User
```javascript
console.log('Current User:', window.getCurrentUser());
console.log('Current Student ID:', window.getCurrentStudentId());
console.log('User Role:', window.userAccounts[window.getCurrentUser()].role);
```

### View All Data
```javascript
console.log('Accounts:', JSON.parse(localStorage.getItem('SLOS_ACCOUNTS')));
console.log('Clusters:', JSON.parse(localStorage.getItem('SLOS_CLUSTERS')));
console.log('Scoresheets:', JSON.parse(localStorage.getItem('SLOS_SCORESHEETS')));
console.log('Messages:', JSON.parse(localStorage.getItem('slos_messages')));
```

### Clear All Data (CAREFUL!)
```javascript
// WARNING: This deletes everything!
localStorage.clear();
location.reload();
```

### Reset to Default
```javascript
// Keep accounts but reset scores
const accounts = JSON.parse(localStorage.getItem('SLOS_ACCOUNTS'));
localStorage.clear();
localStorage.setItem('SLOS_ACCOUNTS', JSON.stringify(accounts));
location.reload();
```

---

## Performance Tips

### For Large Systems (>500 students)
1. **Split into multiple clusters** instead of one big cluster
2. **Use batch operations** for mass account creation
3. **Clear old messages** regularly
4. **Archive old scoresheets** by academic year

### For Slow Devices
1. **Reduce image quality** for profile pictures
2. **Limit scoresheet view** to one quarter at a time
3. **Use list view** instead of grid view for students
4. **Disable message image feature** if not needed

---

## Files to Check When Debugging

| Issue | File to Check |
|-------|---------------|
| Message not showing | `js/messaging.js` → `renderContactList()` |
| Scoresheet blank | `js/scoresheet.js` → `renderScoresheetTable()` |
| Login fails | `js/auth.js` → `handleLogin()` |
| Data not saved | `js/storage.js` → `saveAccounts()`, `saveClusters()` |
| Student not visible | `js/students.js` → `updateTeacherStudentList()` |
| Wrong teacher showing | `js/scoresheet.js` → `findAssignedTeacherForStudent()` |

---

## Browser Compatibility

**Tested & Working:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Known Issues:**
- ⚠️ IE11: Not supported (uses ES6 features)
- ⚠️ Mobile Safari: May need viewport adjustments

---

## Last Updated
February 6, 2026 - v1.0

For more detailed documentation, see `SYSTEM_CHECK_REPORT.md`
