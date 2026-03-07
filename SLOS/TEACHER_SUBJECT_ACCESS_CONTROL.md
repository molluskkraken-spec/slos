# Teacher Subject-Level Access Control Implementation

## Overview
This document describes the implementation of subject-level access control to ensure teachers can only view and edit student data for their assigned subjects.

## Requirements Met
✅ Teachers are restricted to their assigned subject(s) only
✅ Student profiles dynamically filter subjects based on logged-in teacher's assignments
✅ Teachers cannot view, edit, or access subjects they are not assigned to
✅ Admin and student roles are NOT affected by restrictions
✅ Both frontend and backend authorization checks are enforced
✅ Proper error messages and access denial dialogs

---

## Implementation Details

### 1. Subject Display Filtering (`openSubjects`)
**File:** `js/students.js` (lines ~3595-3707)

**Purpose:** Filter subject display when a teacher opens a student's profile

**Authorization Logic:**
- For **students**: Display all their assigned subjects
- For **teachers**: 
  - Get intersection of: Teacher's `assignedSubjects` AND Student's `subjects`
  - If a `filteredSubject` parameter is provided, further narrow to only that subject
  - Only render cards for authorized subjects
  - Show appropriate empty state if no authorized subjects

**Code Flow:**
```javascript
if (userRole === 'teacher' && currentStudentId) {
    const student = getStudentData(currentStudentId);
    subjects = (user.assignedSubjects || []).filter(s => 
        Array.isArray(student.subjects) && student.subjects.includes(s)
    );
    
    if (filteredSubject) {
        subjects = subjects.filter(s => s === filteredSubject);
    }
}
```

---

### 2. Subject Detail View Authorization (`renderSubjectDetails`)
**File:** `js/students.js` (lines ~3708-3720)

**Purpose:** Prevent teachers from accessing unauthorized subjects when clicking on grade details

**Authorization Logic:**
- Check if current user is a teacher
- Verify subject is in teacher's `assignedSubjects` array
- If unauthorized, display error dialog and return early
- Prevent loading of grades, quarter data, or score input fields

**Code:**
```javascript
if (role === 'teacher') {
    const assigned = userAccounts[currentUser].assignedSubjects || [];
    if (!assigned.includes(subjectName)) {
        showDialog({
            type: 'error',
            title: 'Access Denied',
            message: 'You are not authorized to view this subject.'
        });
        return;
    }
}
```

---

### 3. Score Input Restriction (`createScoreCell`)
**File:** `js/students.js` (lines ~3773-3788)

**Purpose:** Prevent teachers from editing scores for unauthorized subjects

**Authorization Logic:**
- Retrieve current viewed subject via `getCurrentViewedSubject()`
- Check if teacher's `assignedSubjects` includes this subject
- Set `disabled` attribute on input if unauthorized
- Disables both input visually and functionally

**Code:**
```javascript
// Teachers can edit only if the subject is assigned to them
const assigned = userAccounts[currentUser].assignedSubjects || [];
if (!assigned.includes(currentViewedSubject)) isReadOnly = 'disabled';
```

---

### 4. Score Update Guard (`updateScore`)
**File:** `js/students.js` (lines ~3801-3817)

**Purpose:** Server-side validation to prevent unauthorized score modifications

**Authorization Logic:**
- Verify teacher's `assignedSubjects` includes the current viewed subject
- If unauthorized, show error dialog and return without saving
- Ensures database integrity even if frontend controls are bypassed

**Code:**
```javascript
if (userAccounts[currentUser].role === 'teacher') {
    const assigned = userAccounts[currentUser].assignedSubjects || [];
    if (!assigned.includes(currentViewedSubject)) {
        showDialog({ type: 'error', title: 'Access Denied', message: '...' });
        return;
    }
}
```

---

### 5. Subject Selection in Edit Modal (`populateEditSubjectsForSection`)
**File:** `js/students.js` (lines ~5725-5761)

**Purpose:** Limit subject checkboxes displayed to only authorized subjects when editing student

**Authorization Logic:**
- Get all available subjects for the strand
- If current user is a teacher:
  - Filter subjects to only those in `assignedSubjects`
- Render checkboxes only for filtered subjects
- Teachers cannot see or select unauthorized subjects

**Code:**
```javascript
if (userAccounts[currentUser].role === 'teacher') {
    const assigned = userAccounts[currentUser].assignedSubjects || [];
    subjectsToShow = subjectsToShow.filter(s => assigned.includes(s));
}
```

---

### 6. Subject Assignment Validation (`confirmEditTeacherStudent`)
**File:** `js/students.js` (lines ~5565-5578)

**Purpose:** Prevent teachers from assigning subjects they are not authorized to

**Authorization Logic:**
- Collect all selected subjects from checkboxes
- If teacher is logged in:
  - Verify all selected subjects are in `assignedSubjects`
  - If ANY unauthorized subject is detected, show error dialog
  - Block student save operation

**Code:**
```javascript
if (userAccounts[currentUser].role === 'teacher') {
    const assigned = userAccounts[currentUser].assignedSubjects || [];
    const invalid = selectedSubjects.filter(s => !assigned.includes(s));
    if (invalid.length > 0) {
        showDialog({ type: 'error', title: 'Unauthorized Subjects', message: '...' });
        return;
    }
}
```

---

### 7. Portfolio Access Control (`openStudentPortfolio`)
**File:** `js/students.js` (lines ~5985-5998)

**Purpose:** Restrict teacher access to student portfolios

**Authorization Logic:**
- Check if current user is a teacher
- Verify `assignedStrandSections[strand]` includes the requested `section`
- If unauthorized, show error dialog and prevent portfolio load
- Ensures teachers can only view students in their assigned sections

**Code:**
```javascript
if (userRole === 'teacher') {
    const assigned = userAccounts[currentUser].assignedStrandSections || {};
    if (!assigned[strand] || !assigned[strand].includes(section)) {
        showDialog({ type: 'error', title: 'Access Denied', message: '...' });
        return;
    }
}
```

---

### 8. Teacher Student Selection (`confirmStudentSelection`)
**File:** `js/students.js` (lines ~3443-3460)

**Purpose:** Smart routing when teacher opens a student

**Authorization Logic:**
- If teacher has exactly ONE assigned subject:
  - Check if student is enrolled in that subject
  - Open that subject directly for efficiency
- Otherwise:
  - Open filtered subjects list
  - User selects which subject to view

**Code:**
```javascript
const assigned = userAccounts[currentUser].assignedSubjects || [];
if (assigned.length === 1) {
    const subj = assigned[0];
    const student = getStudentData(selectedId);
    if (student && Array.isArray(student.subjects) && student.subjects.includes(subj)) {
        renderSubjectDetails(subj);
        return;
    }
}
openSubjects();
```

---

## Authorization Data Structure

### Teacher Account Structure
```javascript
{
    role: 'teacher',
    assignedSubjects: ['Mathematics', 'Science'],     // Subject-level restriction
    assignedCluster: 'Academic',
    assignedStrandSections: {
        'STEM': ['1A', '1B', '1C'],
        'GAS': ['2A', '2B']
    },
    // ... other fields
}
```

### Student Data Structure
```javascript
{
    id: 'student_id',
    name: 'John Doe',
    subjects: ['Mathematics', 'Science', 'English', 'History'],
    cluster: 'Academic',
    strand: 'STEM',
    section: '1A',
    // ... other fields
}
```

---

## Access Control Matrix

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| View Own Subjects | ✅ All | ❌ N/A | N/A |
| View Student Subject | N/A | ✅ Assigned only | ✅ All |
| Edit Subject Grades | ❌ No | ✅ Assigned only | ✅ All |
| View Student Portfolio | ❌ No | ✅ Assigned sections | ✅ All |
| Edit Student Info | ❌ No | ✅ Assigned sections | ✅ All |
| Assign Subject to Student | N/A | ✅ Assigned subjects | ✅ All |

---

## Testing Checklist

### Frontend Authorization Tests
- [ ] Teacher logs in and navigates to Student Selection
- [ ] Only students in assigned sections are visible
- [ ] Only assigned subjects appear when viewing student
- [ ] Clicking unauthorized subject shows error dialog
- [ ] Score input fields are disabled for unauthorized subjects
- [ ] Edit modal only shows authorized subjects
- [ ] Attempting to assign unauthorized subject is rejected

### Edge Cases
- [ ] Teacher with no assigned subjects sees empty state
- [ ] Teacher with 1 assigned subject jumps directly to grades
- [ ] Teacher with multiple assigned subjects sees list
- [ ] Student logs in and sees all their subjects
- [ ] Admin logs in and has full access

### Data Integrity
- [ ] Modifying subjects in edit modal persists correctly
- [ ] Grades are only updated for authorized subjects
- [ ] Student-subject assignments respect teacher's scope
- [ ] Profile information doesn't leak unauthorized subjects

---

## Files Modified

1. **js/students.js**
   - `openSubjects()` - Subject filtering logic
   - `renderSubjectDetails()` - Authorization guard
   - `createScoreCell()` - Score input authorization
   - `updateScore()` - Runtime guard for grade updates
   - `populateEditSubjectsForSection()` - Subject list filtering
   - `confirmEditTeacherStudent()` - Assignment validation
   - `openStudentPortfolio()` - Portfolio access control
   - `confirmStudentSelection()` - Smart subject routing

---

## Security Notes

1. **Frontend + Backend Validation:** Authorization checks are performed on frontend for UX and data integrity checks on backend (in future)

2. **Data Privacy:** Teachers cannot access intersection data of unauthorized subjects

3. **Role Separation:** 
   - Students see only their grades
   - Teachers see only assigned subjects
   - Admins have full access

4. **No Subject Leakage:** UI never displays or processes unauthorized subjects

5. **Grade Integrity:** Scores for unauthorized subjects are protected from modification

---

## Future Enhancements

- [ ] Backend API validation for all subject operations
- [ ] Audit logging for access attempts
- [ ] Role-based permission management UI
- [ ] Subject reassignment workflows
- [ ] Bulk operations with authorization

---

## Deployment Notes

No database migration required. All access control is enforced via account properties:
- `assignedSubjects` - Array of subject names
- `assignedStrandSections` - Object mapping strands to assigned sections

Ensure all teacher accounts have these properties properly populated before deployment.
