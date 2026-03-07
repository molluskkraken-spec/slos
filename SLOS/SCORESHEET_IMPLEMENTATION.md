# Scoresheet System Implementation Guide

## Overview
This document describes the comprehensive scoresheet system implementation for the S.L.O.S application, supporting both teacher and student views with automatic updates, category filtering, and status tracking.

## Features Implemented

### 1. **Automatic Teacher-to-Scoresheet Redirection**
**Location:** `js/students.js` - `confirmStudentSelection()` function

When a teacher clicks on a student in the student selection view:
- The system automatically redirects to the scoresheet page
- Students are taken to the Subjects view (existing behavior)
- No subject selection screen is shown to teachers
- Teachers are taken directly to their first available subject's scoresheet

**Code Path:**
```
Student Selection → Click Student → confirmStudentSelection()
→ For teacher: renderTeacherScoresheet()
→ For student: openSubjects()
```

### 2. **Student Scoresheet View (Read-Only)**
**Location:** `js/students.js` - `renderStudentScoresheet()` function

Features:
- Students can view their scoresheet for each subject
- **Read-only access** - students cannot edit scores, titles, or dates
- Displays all information entered by teachers
- Shows score status (Green/Red/Pending) with same logic as teacher view
- Two dropdown selectors:
  - **Quarter Dropdown:** Switch between 1st, 2nd, 3rd, 4th Quarter
  - **Category Dropdown:** Filter by assessment type

**Category Support:**
- Concept Notes (Max: 10 points)
- Activities (Max: 100 points)
- Quizzes (Max: 100 points)
- Preliminary Examination (Max: 50 points)
- Departmental Examination (Max: 50 points)

**Access Control:**
- Only students can access `renderStudentScoresheet()`
- Authorization check prevents unauthorized access
- Students can only view subjects they're enrolled in

### 3. **Enhanced Teacher Scoresheet**
**Location:** `js/students.js` - `renderTeacherScoresheet()` function

Improvements:
- Added **Category Dropdown** to switch between assessment types
- Only one category displayed at a time (cleaner UI)
- Category buttons dynamically generated from categories array

**Teacher Capabilities:**
- Add new assessment items per category
- Edit item titles
- Enter scores with proper max values per category
- Set date posted (when work was assigned)
- Set deadline for submission
- Delete items
- Automatic status updates based on deadline and score

### 4. **Status Color Logic**
**Location:** `js/students.js` - `getTeacherItemStatus()` function

**Status Indicators:**
- **Green (✓ Completed):** Score has been entered (regardless of deadline)
- **Red (✗ Overdue):** Deadline has passed and no score has been entered
- **Pending (○):** No deadline set OR still within deadline without score

**Logic:**
```javascript
if (score exists) → Green
else if (deadline passed) → Red
else → Pending
```

**Date Comparison:**
- Dates are normalized to start of day for accurate comparison
- Today is compared against deadline date

### 5. **Score Display with Max Scores**
**Location:** `js/students.js` - `renderTeacherCategorySection()` and `renderStudentCategorySection()`

**Score Formatting:**
- Scores display as: `5 / 10` (entered score / max score)
- Max score varies by category:
  - Concept Notes: 10 points
  - Activities: 100 points
  - Quizzes: 100 points
  - Preliminary Exam: 50 points
  - Departmental Exam: 50 points

**Category Max Scores:**
```javascript
const categories = [
    { id: 'concept-notes', name: 'Concept Notes', maxScore: 10 },
    { id: 'activities', name: 'Activities', maxScore: 100 },
    { id: 'quizzes', name: 'Quizzes', maxScore: 100 },
    { id: 'preliminary-exam', name: 'Preliminary Examination', maxScore: 50 },
    { id: 'departmental-exam', name: 'Departmental Examination', maxScore: 50 }
];
```

### 6. **Automatic Data Updates**
**Location:** `js/storage.js` - `saveGrades()` function

**How It Works:**
- Data is saved to localStorage after any changes
- Both teacher and student views pull fresh data on render
- Changes are immediately visible in the UI
- No real-time sync needed (localStorage updates on save)

**Update Triggers:**
- Teacher adds new item → saves → re-renders
- Teacher updates score/date/title → saves → re-renders
- Teacher deletes item → saves → re-renders
- Status automatically recalculates on render

### 7. **Table Layout Consistency**
**Location:** Both `renderTeacherCategorySection()` and `renderStudentCategorySection()`

**Table Structure (Teacher View):**
- Item # (e.g., C1, A2, Q3)
- Title (editable for teachers, read-only for students)
- Score (editable for teachers with max validation, read-only for students)
- Date Posted (editable for teachers, read-only for students)
- Deadline (editable for teachers, read-only for students)
- Status (automatically calculated, read-only)
- Actions (Delete button for teachers only)

**Table Structure (Student View):**
- Item # (same format)
- Title (read-only)
- Score (read-only, formatted as "X / Max")
- Date Posted (read-only, formatted as date)
- Deadline (read-only, formatted as date)
- Status (read-only, same color coding)

### 8. **Data Structure**
**Location:** `js/students.js` - `initTeacherGradesStructure()` function

**Grade Storage Format:**
```javascript
subjectGrades[studentId][subjectName] = {
    '1st': {
        'concept-notes': [
            { title: '...', score: 8, datePosted: '2026-02-05', deadline: '2026-02-10', status: 'green' },
            // ... more items
        ],
        'activities': [...],
        'quizzes': [...],
        'preliminary-exam': [...],
        'departmental-exam': [...]
    },
    '2nd': { ... },
    '3rd': { ... },
    '4th': { ... }
}
```

## Key Functions Reference

### Teacher Functions
| Function | Purpose |
|----------|---------|
| `renderTeacherScoresheet(subjectName, quarter, selectedCategory)` | Render teacher scoresheet with dropdowns |
| `renderTeacherCategorySection(subjectName, quarter, category)` | Render single category table (teacher) |
| `addTeacherScoreItem(subjectName, quarter, categoryId)` | Add new assessment item |
| `updateTeacherItem(subjectName, quarter, categoryId, itemIndex, field, value, maxScore)` | Update item field |
| `deleteTeacherScoreItem(subjectName, quarter, categoryId, itemIndex)` | Delete assessment item |
| `getTeacherItemStatus(item)` | Calculate status color/label |

### Student Functions
| Function | Purpose |
|----------|---------|
| `renderStudentScoresheet(subjectName, quarter, selectedCategory)` | Render student scoresheet (read-only) |
| `renderStudentCategorySection(subjectName, quarter, category)` | Render single category table (student) |

### Navigation
| Function | Purpose |
|----------|---------|
| `openScoresheet(selectedSubject)` | Entry point for opening scoresheet |
| `confirmStudentSelection()` | Handles student selection and redirection |
| `openSubjects(filteredSubject)` | Shows subject list (modified to route to scoresheet) |

## API Exports to Window

Added to `js/main.js`:
```javascript
window.renderStudentScoresheet = students.renderStudentScoresheet;
```

This allows student scoresheet to be called from HTML onclick handlers.

## Authorization Checks

### Teacher Scoresheet
- Only users with role 'teacher' can access
- Teachers can only view subjects they teach
- Teachers can only edit scores for their assigned subjects

### Student Scoresheet
- Only users with role 'student' can access
- Students can only view subjects they're enrolled in
- All fields are read-only

## CSS Classes

Existing CSS used:
- `.dropdown` - Container for dropdown menu
- `.dropdown-content` - Content container
- `.nav-pill` - Button styling
- `.score-sheet-top-layout` - Header layout
- `.grade-nav` - Navigation container
- `.shadow-card` - Card styling

## Testing Checklist

- [ ] Teacher selects student → redirects to scoresheet
- [ ] Student clicks subject → shows read-only scoresheet
- [ ] Quarter dropdown switches between 1st-4th
- [ ] Category dropdown filters assessed by type
- [ ] Teacher can add new items
- [ ] Teacher can edit item details
- [ ] Teacher can delete items
- [ ] Scores validate against max values
- [ ] Status shows Green for scored items
- [ ] Status shows Red for overdue unscored items
- [ ] Status shows Pending for items without deadline
- [ ] Student cannot edit any fields
- [ ] Data persists in localStorage
- [ ] Different students have different scoresheets

## Browser Compatibility

- Modern browsers with ES6 support
- localStorage support required
- CSS Grid and Flexbox support required

## Future Enhancements

- Real-time synchronization with server
- Performance task (PETA) scoring
- Weighted average calculations
- Export to PDF/Excel
- Email notifications for deadlines
- Comments on individual items

## Troubleshooting

### Scoresheet not loading
- Check browser console for errors
- Verify student ID is set in localStorage
- Ensure grades data structure is initialized

### Status not updating
- Clear browser cache
- Check date format (should be YYYY-MM-DD)
- Verify `saveGrades()` is being called

### Read-only fields in student view
- Verify user role is 'student'
- Check authorization checks in renderStudentScoresheet()

### Dropdown not appearing
- Verify CSS classes are applied
- Check for z-index issues with other elements
- Ensure dropdown-content display is not overridden
