# SLOS User Guide & System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [System Flow](#system-flow)
5. [Module Architecture](#module-architecture)
6. [Scoresheet Features](#scoresheet-features)
7. [Functions Reference](#functions-reference)
8. [Data Structure](#data-structure)
9. [Operating the System](#operating-the-system)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

**SLOS** = Student Learning Objective Scoresheet

A complete web application for managing student assessments with:
- ✅ Multi-role authentication (Admin, Teacher, Student)
- ✅ Academic structure management (Clusters → Strands → Sections)
- ✅ Scoresheet system (6 assessment types × 4 quarters)
- ✅ Teacher-student messaging
- ✅ Notifications for pending tasks
- ✅ Per-student score isolation

---

## Getting Started

### Step 1: Login
Open `index.html` in a web browser

Default accounts:
```
Username: admin
Password: 123
```

### Step 2: Setup (Admin Only)
1. Click "Academic Setup"
2. Create Cluster (e.g., "Grade 12")
3. Create Strand (e.g., "ICT")
4. Create Section (e.g., "Section A")
5. Add Subjects (e.g., "Biology", "Chemistry")

### Step 3: Create Accounts (Admin)
Click "Create Account" → Choose role:
- **Teacher**: Select strand/section + subjects to teach
- **Student**: Assign to cluster/strand/section + subjects

### Step 4: Start Using
- **Teachers**: Login → Go to "Students" → Create scoresheets
- **Students**: Login → Click "Subjects" to view tasks

---

## User Roles & Permissions

### 👨‍💼 ADMIN
**Access:** Everything  
**Can:**
- Create clusters, strands, sections, subjects
- Create teacher accounts with assignments
- Create student accounts
- View all students and teachers
- Manage all data

**Buttons:** Academic Setup, Create Account, Students, Teachers

---

### 👨‍🏫 TEACHER
**Access:** Assigned subjects only  
**Can:**
- View students in assigned strand/section
- Create scoresheet entries
- Grade individual student scores
- Send messages to assigned students
- View submissions from students

**Buttons:** Students, Messages (Inbox)

---

### 👨‍🎓 STUDENT
**Access:** Enrolled subjects only  
**Can:**
- View assigned tasks by subject
- Mark submissions
- Send messages to teachers
- View pending notifications
- See personal scores only

**Buttons:** Subjects, Inbox, Notifications

---

## System Flow

### 1. SYSTEM INITIALIZATION FLOW
```
User Opens App
    ↓
Initialize Storage (localStorage)
    ↓
Load Accounts, Clusters, Scoresheets, Messages
    ↓
Check if User Logged In?
    ├─ YES → Show Dashboard with Role-Specific Buttons
    └─ NO → Show Login Screen
```

### 2. LOGIN FLOW
```
User Enters Credentials
    ↓
Validate Against Accounts Data
    ↓
Valid?
    ├─ YES → Store Session, Show Dashboard
    └─ NO → Show Error, Retry
```

### 3. SCORESHEET CREATION FLOW
```
Teacher Opens Subject
    ↓
Select Assessment Type & Quarter
    ↓
Create Task Entry (Title, Score Limit, Date)
    ↓
Save (Template stored under Teacher or Section key)
    ↓
All Students in Section See Task
    ├─ Each student can input own score
    └─ Each student can mark as submitted
```

### 4. STUDENT VIEWING FLOW
```
Student Logs In
    ↓
Click on Subject
    ↓
System Finds Teacher for That Subject
    ↓
Load Template Tasks from Teacher/Section
    ↓
Overlay Student's Personal Scores
    ↓
Display Table (Template tasks + Personal scores)
```

### 5. MESSAGE FLOW
```
User Opens Inbox/Messages
    ↓
Filter Contacts by Role:
    ├─ Student: Show Only Teachers Teaching Their Subjects
    └─ Teacher: Show Only Students in Assigned Strand/Section with Shared Subjects
    ↓
Click Contact → Load Conversation
    ↓
Type Message → Send
    ↓
Message Stored (sender, receiver, timestamp, content)
    ↓
Other User Sees Unread Badge
```

### 6. GRADING FLOW (Teacher)
```
Teacher Opens Subject → Click "Grade Students"
    ↓
Filter Students by:
    • Assigned Strand/Section
    • Have This Subject
    ↓
Click Student Name
    ↓
Enter/Update Score
    ↓
Save (Stored under Student's Username)
    ↓
Score Isolated (Only That Student Sees It)
```

### 7. DATA PERSISTENCE FLOW
```
Any Data Change (Create Account, Save Score, etc.)
    ↓
Update In-Memory Data
    ↓
Call Save Function
    ├─ saveAccounts()
    ├─ saveClusters()
    ├─ saveScoresheets()
    ├─ saveMessages()
    └─ saveNotifications()
    ↓
Write to localStorage
    ↓
Data Persists After Page Refresh
```

---

## Module Architecture

### File Organization
```
js/
├── main.js ..................... Entry point, exposes functions to HTML
├── global.js ................... Session management, navigation history
├── storage.js .................. LocalStorage management
├── config.js ................... Constants & default values
├── utils.js .................... Helper functions
│
├── app.js ...................... Router, dashboard, notifications
├── auth.js ..................... Login/logout, account creation
├── students.js ................. Account & scoresheet management
├── messaging.js ................ Inbox, contacts, messages
├── scoresheet.js ............... Scoresheet display & grading
│
└── (Optional) system-tests.js .. Automated system testing
```

### Module Dependencies
```
main.js
  ├─ imports from: global, app, auth, students, messaging, scoresheet
  └─ exposes to: window (HTML onclick handlers)

app.js
  ├─ imports from: global, auth, students, messaging
  └─ exports: renderApp(), openNotificationsView()

global.js
  ├─ imports from: storage, utils
  └─ manages: currentUser, currentStudentId, navigation history

storage.js
  ├─ imports from: config
  └─ manages: userAccounts, clusters, scoresheets, messages, notifications

auth.js
  └─ handles: login, logout, password validation

students.js
  ├─ imports from: global, storage, utils
  └─ handles: account creation, student management, scoresheet rendering

messaging.js
  ├─ imports from: global, storage, utils
  └─ handles: contacts, messages, inbox

scoresheet.js
  ├─ imports from: global, storage, students
  └─ handles: scoresheet display, grading, form submissions
```

---

## Scoresheet Features

### Overview
The scoresheet is the core assessment tool where teachers post assignments and students view their submissions.

### Assessment Types & Max Scores
The system supports 6 assessment types with different maximum scores:

| Assessment Type | Max Score | Purpose |
|---|---|---|
| **Concept Notes** | 10 points | Comprehension of concepts |
| **Activities** | 100 points | Practical exercises |
| **Quizzes** | 100 points | Knowledge checks |
| **Preliminary Examination** | 50 points | Mid-term assessment |
| **Departmental Examination** | 50 points | Final assessment |
| **Performance Task** | Configurable | Project-based assessment |

### Quarter System
Scoresheets are organized by academic quarters:
- **1st Quarter** - September - October/November
- **2nd Quarter** - November/December - January
- **3rd Quarter** - January - March
- **4th Quarter** - April - May/June

Each quarter maintains separate scoresheet data per subject.

### Score Display Format
Scores display with maximum in format: `Score / Max`
Examples:
- `8 / 10` (Concept Notes)
- `85 / 100` (Activities)
- `42 / 50` (Preliminary Examination)

### Teacher View Features
**Creating Scoresheets:**
- Teachers access scoresheet by clicking on a student or selecting a subject
- Select quarter using dropdown button
- Select assessment type using category dropdown
- Click "Edit" button to enter task creation mode
- Add tasks with: Title, Score Limit, Posted Date, Deadline
- Changes immediately appear in student scoresheets for same subject/quarter

**Grading:**
- Click "Grade Students" to open grading interface
- Select individual student
- Enter scores for each task (respects max scores per category)
- Scores saved and immediately visible to student
- Teachers can override student-entered scores

**Editing & Deletion:**
- Edit task details (deadlines, score limits)
- Delete tasks with confirmation
- Changes reflected immediately

### Student View Features
**Viewing Scoresheets:**
- Students click "Subjects" to access scoresheet
- Select quarter and assessment type using dropdowns
- View all posted tasks for that combination
- Table shows: Item #, Title, Teacher-Entered Score, Posted Date, Deadline, Status

**Submitting Work:**
- Students can input scores directly in the score field
- Check submission checkbox to mark as submitted
- Submission date auto-fills when checked
- Teachers can still override grades via "Grade Students" feature
- Score inputs have validation to enforce max scores

**Status Indicators:**
Students see color-coded status for each task:
- 🟢 **Green (✓ Completed):** Score entered before/on deadline
- 🔴 **Red (✗ Overdue):** Deadline passed without score entered
- ⚪ **Grey (Pending):** No deadline or still before deadline without score

---

## Functions Reference

### Authentication (auth.js)
| Function | Purpose | Parameters |
|----------|---------|-----------|
| `handleLogin()` | Validate & login user | none (reads from form) |
| `handleLogout()` | Logout current user | none |
| `validateAndChangePassword()` | Update user password | none (reads from form) |
| `renderProfileView()` | Show user profile | none |

### Global State (global.js)
| Function | Purpose |
|----------|---------|
| `getCurrentUser()` | Get logged-in username |
| `getCurrentStudentId()` | Get selected student ID |
| `setCurrentUser(user)` | Set logged-in user |
| `setCurrentStudentId(id)` | Set selected student |
| `goBack()` | Navigate to previous page |
| `pushNavigation(name, func)` | Add to navigation history |

### Storage (storage.js)
| Function | Purpose |
|----------|---------|
| `getUserAccounts()` | Get all user accounts |
| `getClusters()` | Get all clusters |
| `getScoresheets()` | Get all scoresheets |
| `saveAccounts()` | Save accounts to localStorage |
| `saveClusters()` | Save clusters to localStorage |
| `saveScoresheets()` | Save scoresheets to localStorage |

### Student Management (students.js)
| Function | Purpose |
|----------|---------|
| `openStudentsView()` | Show student list |
| `openTeacherStudentSelector()` | Show teacher's students |
| `saveStudentAccount()` | Create/update student |
| `saveTeacherAccount()` | Create/update teacher |
| `updateTeacherStudentList()` | Filter students display |

### Messaging (messaging.js)
| Function | Purpose |
|----------|---------|
| `openInboxView()` | Open messages screen |
| `renderContactList()` | Load contacts with filtering |
| `loadChat(partnerId)` | Open conversation |
| `sendChatMessage()` | Send message |
| `saveMessageToStorage()` | Save message to localStorage |

### Scoresheet (students.js & scoresheet.js)
| Function | Purpose |
|----------|---------|
| `confirmStudentSelection()` | Auto-redirect teacher to student's scoresheet |
| `renderTeacherScoresheet(subject, quarter, category)` | Display teacher's scoresheet view |
| `renderStudentScoresheet(subject, quarter, category)` | Display student's scoresheet view (read-only) |
| `renderTeacherCategorySection(subject, quarter, category)` | Render editable task list for teacher |
| `renderStudentCategorySection(subject, quarter, category)` | Render read-only task list for student |
| `addTeacherScoreItem(subject, quarter, category)` | Create new assessment task |
| `updateStudentScore(owner, subject, key, rowIndex, newValue)` | Save student-entered score |
| `updateTeacherItem(subject, quarter, categoryId, rowIndex, field, newValue)` | Edit task (teacher only) |
| `deleteTeacherScoreItem(subject, quarter, category, rowIndex)` | Remove assessment task (teacher only) |
| `getTeacherItemStatus(datePosted, deadline, score)` | Calculate status color (green/red/grey) |
| `openScoresheet(subject)` | Legacy function - open scoresheet view |

### UI/Notifications (students.js)
| Function | Purpose |
|----------|---------|
| `showSuccessToast(message)` | Show green notification |
| `showDialog(options)` | Show confirmation dialog |
| `showInputDialog(options)` | Show input dialog |

---

## Data Structure

### localStorage Keys

#### SLOS_ACCOUNTS
```javascript
{
  "username": {
    "password": "encrypted",
    "role": "teacher|student|admin",
    "name": "Full Name",
    "img": "base64_image_string",
    "assignedSubjects": ["English", "Math"],           // Teachers only
    "assignedStrandSections": {                         // Teachers only
      "Science": ["Section A", "Section B"]
    },
    "studentId": "STU001",                              // Students only
    "strand": "Grade 10",                               // Students only
    "section": "Section A",                             // Students only
    "subjects": ["English", "Math"],                    // Students only
    "lastLogin": "2026-02-06T10:30:00Z"                // All
  }
}
```

#### SLOS_CLUSTERS
```javascript
{
  "Grade 10": {
    "Science": {
      "subjects": ["Biology", "Chemistry"],
      "Section A": [
        { "id": "STU001", "name": "John Doe", ... },
        { "id": "STU002", "name": "Jane Doe", ... }
      ],
      "Section B": [ ... ]
    },
    "Math": { ... }
  }
}
```

#### SLOS_SCORESHEETS
```javascript
{
  "teacher_username": {
    "subject_name": {
      "1st": {                              // Quarter: "1st", "2nd", "3rd", "4th"
        "Concept_Notes": [                  // Category ID
          {
            "no": 1,
            "title": "Task 1",
            "scoreLimit": 10,               // Max score for this task
            "datePosted": "2026-02-05",
            "deadline": "2026-02-10",
            "score": null                   // Placeholder for individual student scores
          },
          { "no": 2, "title": "Task 2", ... }
        ],
        "Activities": [ ... ],              // Different category
        "Quizzes": [ ... ]
      },
      "2nd": { ... }                        // Next quarter has same structure
    }
  },
  "student_username": {
    "subject_name": {
      "1st": {                              // Same structure as teacher
        "Concept_Notes": [
          {
            "score": 9,                     // Student's actual score
            "submitted": true,              // Submission status
            "submittedDate": "2026-02-05"   // When submitted
          },
          { "score": 8, "submitted": true, ... }
        ],
        "Activities": [ ... ]
      }
    }
  }
}
```

**Structure Notes:**
- Teachers store task *templates* (title, scoreLimit, dates)
- Students store their *results* (score, submitted, submittedDate)
- Same subject/quarter may have multiple categories
- Each category is independent with separate task lists
- Scoresheets automatically organized by Quarter (1st, 2nd, 3rd, 4th)

#### slos_messages
```javascript
{
  "teacher_username_student_username": [
    {
      "sender": "teacher_username",
      "receiver": "student_username",
      "text": "Message content",
      "type": "text",
      "timestamp": 1675123456789,          // Unix timestamp
      "read": false
    },
    {
      "sender": "student_username",
      "receiver": "teacher_username",
      "text": "Reply message",
      "type": "text",
      "timestamp": 1675123456890,
      "read": true
    }
  ]
}
```

**Message Key Format:** `sender_receiver` (alphabetical for bidirectional conversations)

#### SLOS_NOTIFICATIONS
```javascript
{
  "student_username": [
    {
      "subject": "Biology",
      "quarter": "1st",
      "category": "Concept_Notes",
      "taskTitle": "Chapter 1",
      "deadline": "2026-02-10",
      "status": "pending",                 // "pending", "completed", "overdue"
      "timestamp": 1675123456789
    }
  ]
}
```

---

## Operating the System

### For ADMIN

#### 1. Setup Academic Structure
1. Login with admin credentials
2. Click **"Academic Setup"**
3. **Create Cluster**
   - Name: "Grade 10"
   - Click Create
4. **Create Strand**
   - Select Cluster: "Grade 10"
   - Name: "Science"
   - Click Create
5. **Create Section**
   - Select Cluster: "Grade 10"
   - Select Strand: "Science"
   - Name: "Section A"
   - Click Create
6. **Add Subjects**
   - Select Cluster: "Grade 10"
   - Select Strand: "Science"
   - Add: "Biology", "Chemistry"

#### 2. Create Teacher Account
1. Click **"Create Account"**
2. Select **Role: Teacher**
3. Enter username and password
4. **Select Strands & Sections**
   - Check: "Science" → "Section A", "Section B"
5. **Select Subjects**
   - Check: "Biology", "Chemistry"
6. Click **Save**

#### 3. Create Student Account
1. Click **"Create Account"**
2. Select **Role: Student**
3. Select Cluster: "Grade 10"
4. Select Strand: "Science"
5. Select Section: "Section A"
6. Select Subjects: "Biology"
7. Enter name, username, password
8. Click **Save**

#### 4. View All Users
1. Click **"Students"** → See all students
2. Click **"Teachers"** → See all teachers

---

### For TEACHER

#### 1. View Assigned Students
1. Login with teacher username
2. Click **"Students"**
3. View students in your assigned strand/section
4. Optional: Filter by strand and section

#### 2. Quick Access to Scoresheet
1. From student list, click on any student name
2. **Automatic redirect** to their scoresheet (no subject selection needed)
3. Scoresheet shows first available subject
4. Alternatively: Click **"Subjects"** → Select subject → Click student

#### 3. Create Scoresheet Entries (Tasks)
1. Click **"Students"** → Select a student → Click their name
2. OR Click **"Subjects"** → Select subject
3. Select **Quarter**: 1st, 2nd, 3rd, or 4th (dropdown)
4. Select **Assessment Type** (Category): 
   - Concept Notes (10 pts)
   - Activities (100 pts)
   - Quizzes (100 pts)
   - Preliminary Examination (50 pts)
   - Departmental Examination (50 pts)
   - Performance Task (configurable)
5. Click **"Edit"** button (purple) to enter edit mode
6. **Add Task**:
   - Title: Name of assessment (e.g., "Chapter 1 Notes")
   - Score Limit: Max points possible for this task
   - Date Posted: Date task was assigned
   - Deadline: Due date for submission
7. Click **Save** or **"+ Add Task"** for multiple entries
8. **Important:** All students in your strand/section see these tasks immediately
9. Changes save to localStorage automatically

#### 4. Grade Individual Students
1. From Subject Scoresheet → Click **"Grade Students"** button (color: purple/special)
2. Student list automatically filters to:
   - Only students in your assigned strand/section
   - Only students with your assigned subjects
3. Click student name to open grading interface
4. **Enter scores** for each task:
   - Scores must respect max score per category
   - Input validates against limits
5. Click **Save**
6. **Important:** Score stores under that specific student only
   - Only that student and you can see it
   - No other students see their classmate's scores

#### 5. Update & Delete Tasks
1. While in article mode, click **Edit** next to any task
2. Modify: Title, Score Limit, Posted Date, Deadline
3. Click **Save** OR click **Delete** to remove task
4. **Note:** Deleting a task removes it from all students' scoresheet
5. Changes take effect immediately

#### 6. Send Messages to Students
1. Click **"Messages"** or **"Inbox"**
2. Left sidebar shows filtered student list:
   - Only students in your assigned strand/section
   - Only students with your assigned subjects
3. Click student name to open conversation
4. Type message → Click send
5. Student gets unread message badge

---

### For STUDENT

#### 1. View Assigned Tasks
1. Login with student username
2. Click **"Subjects"**
3. Your enrolled subjects appear
4. Click subject
5. **Select Quarter & Assessment Type** (top dropdowns)
6. View all posted tasks

#### 2. Mark Submission & Enter Scores
1. In scoresheet table, locate the task
2. **Enter your score** directly in the score input field
   - Field appears as editable box
   - Respects maximum score for that category (e.g., max 10 for Concept Notes)
   - Score saves automatically on input change
3. Check ☑️ checkbox to mark task as "Submitted"
   - Submission date auto-fills immediately with current date
   - Status indicator updates (green if before deadline, red if overdue)
4. Teacher can still override your score via "Grade Students" feature
5. Your personal score is isolated - only you and teachers see your scores

#### 3. View Score History
1. Once marked submitted, your score displays as: `Score / MaxScore` (e.g., `8 / 10`)
2. Status color indicates timeliness:
   - 🟢 Green: Submitted on time
   - 🔴 Red: Deadline passed
   - ⚪ Grey: Still pending or no deadline

#### 4. View Notifications
1. Click **"Notifications"**
2. See pending tasks by subject with quick-access links
3. Notification shows last login time and pending count

#### 5. Send Messages to Teachers
1. Click **"Inbox"** or **"Messages"**
2. Left shows your assigned teachers
3. Click teacher name
4. Type message → Send
5. Conversation history displays

---

## Flowchart Diagram

```
┌─────────────────┐
│  Open App       │
│  index.html     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Initialize     │
│  Storage        │
└────────┬────────┘
         │
         ▼
    ┌────────────────┐
    │  User Logged?  │
    └────┬───────┬───┘
         │       │
        YES     NO
         │       │
         ▼       ▼
    ┌────────┐  ┌──────────┐
    │Dashboard│  │Login Page│
    └────┬───┘  └──────────┘
         │  
         ▼
    ┌──────────────┐
    │ Check Role   │
    └─┬──┬──────┬──┘
      │  │      │
    ADMIN TEACHER STUDENT
      │  │      │
      ▼  ▼      ▼
   ┌──┐┌────┐┌───────┐
   │AC││Stud││Subject│
   │ad││ent ││Inbox  │
   │em││sMsg││Notif  │
   └──┘└────┘└───────┘
      │  │      │
      └──┴──────┘
         │
         ▼
    ┌──────────────┐
   │ Data →       │
   │localStorage  │
   └──────────────┘
```

---

## Common Tasks

### Task: Create a New Scoresheet Task
1. Teacher logs in
2. Click "Students" → Select student → Click name (auto-redirects to scoresheet)
3. Select Quarter using top dropdown
4. Select Assessment Type using category dropdown
5. Click purple **"Edit"** button
6. Click **"+ Add Task"**
7. Fill form:
   - Title: "Chapter 1 Concept Notes"
   - Score Limit: 10 (or appropriate max)
   - Date Posted: (auto-filled with today)
   - Deadline: Select date
8. Click **Save** or **"+ Add Task"** for multiple entries
9. All students in strand/section see the new task immediately
10. No page reload required

### Task: Grade a Student
1. Teacher navigates to subject scoresheet
2. Click **"Grade Students"** button
3. Student list shows (filtered by strand/section/subject)
4. Click student name
5. For each task row, enter the score in input field
6. Click **Save**
7. **Result:** Score now visible to student in their scoresheet view
8. Only that specific student sees their score

### Task: Student Submits Work & Score
1. Student logs in
2. Click **"Subjects"**
3. Select subject
4. Choose Quarter and Assessment Type from dropdowns
5. Find the task in table
6. Enter score in "Score" input field (e.g., "8" for 8/10)
   - Field validates against max score
   - Score saves immediately on input change
7. Check ☑️ "Submitted" checkbox
   - Date auto-fills with today's date
   - Status automatically updates (green if on-time, red if late)
8. Task now shows your submission
9. Teacher can view and optionally override your score

### Task: Send Message Between Student & Teacher
1. Click **"Inbox"** or **"Messages"** button
2. Left sidebar shows contacts:
   - Students see: List of their teachers
   - Teachers see: List of students they teach (filtered)
3. Click contact name to open conversation
4. Type message in input field
5. Click **Send** button
6. Message appears in conversation
7. Recipient sees unread message badge on Inbox button

### Task: View Pending Notifications
1. Student logs in
2. Click **"Notifications"** button
3. See list of pending tasks by subject
4. Click on any pending task to jump directly to:
   - Correct subject scoresheet
   - Correct quarter
   - Correct assessment type
5. Notification shows task deadline and last login time

---

## Troubleshooting

### Task: Create a New Scoresheet
1. Teacher logs in
2. Clicks "Students" → Select student → Click name
3. View opens with subject list
4. Click subject
5. Choose Assessment Type (Concept Notes, etc.)
6. Choose Quarter (1st, 2nd, etc.)
7. Click purple **"Edit"** button
8. Click **"+ Add Task"**
9. Fill: Title, Score Limit
10. Click **Save**
11. All students in section see it

### Task: Grade a Student
1. Teacher goes to subject
2. Clicks **"Grade Students"** button
3. Student list filtered (only their subject)
4. Click student name
5. Enter score for each task
6. Click **Save** (stores under student's name only)

### Task: Student Submits Work
1. Student goes to Subjects
2. Selects subject
3. Finds task in table
4. Checks ☑️ "Submitted" checkbox
5. Date auto-fills
6. Teacher can see submission status

### Task: Message Between User & Teacher
1. Click Inbox/Messages
2. Click contact name
3. Type message
4. Send
5. Conversation saved
6. Other user sees unread badge

---

## Troubleshooting

### "I can't see the scoresheet table"
**Possible Causes:**
- Missing strand/section assignment for teacher
- Missing subject assignment
- Student not enrolled in that subject
- Database not initialized

**Solutions:**
1. For Teachers: Admin must assign you to strand/section AND subjects
2. For Students: Admin must assign you to subjects
3. Try: Logout and login again
4. Try: Hard refresh (Ctrl+F5 or Cmd+Shift+R)

### "No contacts in Messages"
**For Teachers:**
- Must be assigned to: Strand/Section + Subjects
- Students must be in your strand/section with shared subjects
- Check "Students" button to verify your student list

**For Students:**
- You must have subjects assigned
- Your teachers must be assigned to teach those subjects
- Check "Subjects" button to see your assigned subjects

**Solution:** Admin must properly configure assignments

### "Student doesn't see the task I created"
**Checklist:**
- ✓ Task created under correct subject
- ✓ Student enrolled in that subject
- ✓ Student in same strand/section
- ✓ You selected correct Quarter and Assessment Type
- ✓ You clicked Save (not just Edit)

**Solution:** Verify all above points, especially strand/section match

### "The score I entered isn't showing for the student"
**Possible Causes:**
1. Score not saved (click Save button!)
2. Viewing wrong quarter/category
3. Score entered in teacher view instead of "Grade Students"

**Solution:** 
- For Teachers: Use "Grade Students" button to enter scores
- Check that student appears in filtered list
- Confirm score was saved

### "Student score input field not saving"
**Solution:**
- Close edit mode (click Save or Cancel)
- Try entering score again
- If still not working: Logout and login
- Check browser console for errors (F12)

### "Date isn't showing as submitted"
**Possible Causes:**
- Checkbox wasn't actually checked (try clicking again)
- Browser cache issue
- Submission didn't save

**Solution:**
- Verify checkbox is checked (✓)
- Refresh page to confirm (Ctrl+F5)
- Re-check if needed

### "Can't find a student in the student list"
**Possible Causes:**
- Student not assigned to your strand/section
- Student assigned to wrong cluster/strand
- Student account disabled
- Typo in student name search

**Solution:**
- Ask Admin to verify student assignments
- Check "Students" button shows the student

### "Data disappeared after I refreshed the page"
**Possible Causes:**
- Browser's localStorage was cleared
- Using Private/Incognito mode (data not persisted)
- Browser storage disabled

**Solution:**
- Check if in Private/Incognito mode → Exit and retry
- Check browser storage settings (Allow localStorage)
- Try: Open browser DevTools (F12) → Console → Run:
  ```javascript
  localStorage.getItem('SLOS_ACCOUNTS')
  // Should return account data, not null
  ```

### "Scores show different max values"
**This is normal!** Different assessment types have different maximums:
- Concept Notes: max 10 points
- Activities: max 100 points
- Quizzes: max 100 points
- Preliminary Exam: max 50 points
- Departmental Exam: max 50 points
- Performance Task: configurable

Check you're entering scores within the correct range.

### System Performance Issues
**If the application is slow/laggy:**

1. **Check browser console** for errors:
   - Press F12 → Console tab
   - Look for red error messages
   - Report errors with context

2. **Clear localStorage** (careful - loses data!):
   ```javascript
   // In browser console only if desperate:
   localStorage.clear()
   // Then refresh and re-login
   ```

3. **Try different browser:**
   - Chrome, Firefox, Edge, Safari all supported
   - Some browsers may have performance differences

4. **Check available disk space:**
   - localStorage limited to ~10MB per domain
   - If many students/teachers, may approach limit

---

## System Limitations & Considerations

### Browser & Storage
- 🟡 **No backend sync** - Data stored in browser localStorage only
- 🟡 **Single device per account** - Account accessible from multiple devices but data isolated
- 🟡 **10MB localStorage limit** - Large student bases near browser limit
- 🟡 **No offline functionality** - Requires internet to access system
- 🟡 **Browser dependency** - Data lost if browser storage cleared
- 🟡 **Single session** - Only one account logged in per browser at a time

### Administrative
- 🟡 **One admin account** - System initializes with single admin
- 🟡 **No admin hierarchy** - All admins have equal permissions
- 🟡 **No backup/restore** - No automatic backup functionality
- 🟡 **No audit logs** - No history of who changed what data

### Messaging
- 🟡 **No message encryption** - Messages stored in plain localStorage
- 🟡 **No message deletion** - Sent messages cannot be unsent
- 🟡 **Local storage only** - Messages not synced to server

### Scoresheet
- 🟡 **No attachments** - Cannot upload files/images
- 🟡 **No rubrics** - Score input accepts numeric values only
- 🟡 **No late submission penalties** - Status shows but no automatic penalty
- 🟡 **Limited calculation** - No automatic grade calculations (manual entry only)

### Recommended Usage
1. **Regular backups** - Export localStorage data periodically
2. **Test thoroughly** - Verify all assignments before first use
3. **Limited users** - Works well for small to medium institutions (< 500 students)
4. **Daily access** - Check browser storage occasionally to monitor data size
5. **Standard browsers** - Use latest Chrome, Firefox, Edge, or Safari

---

## Quick Reference: Button Map

| Button | Role Access | Function |
|--------|-------------|----------|
| **Academic Setup** | Admin Only | Create clusters, strands, sections, subjects |
| **Create Account** | Admin Only | Add new users |
| **Students** | Admin, Teacher | View list, filter by role permissions |
| **Teachers** | Admin Only | View all teachers and assignments |
| **Subjects** | Teacher, Student | Access scoresheets by subject |
| **Inbox** / **Messages** | Teacher, Student | Open messaging interface |
| **Notifications** | Student Only | View pending task alerts |
| **Grade Students** | Teacher Only | Enter individual student scores |
| **Profile** | All Roles | View profile, change password |
| **Logout** | All Roles | End session |

---

## Version Information

**Version:** 7.0  
**Release Date:** February 27, 2026  
**System:** SLOS v7.0 (Student Learning Objective Scoresheet)  
**Status:** ✅ Production Ready

### Version History
- **v7.0** (Feb 27, 2026): Comprehensive guide update, student score input, full scoresheet feature documentation
- **v6.7** (Feb 7, 2026): Initial system implementation, core features
- **v6.0** (Earlier): System architecture and foundation

### Last Updated
February 27, 2026

---

## Support & Resources

### Additional Documentation
- `SCORESHEET_IMPLEMENTATION.md` - Technical scoresheet implementation details
- `REQUIREMENTS_VERIFICATION.md` - Requirements checklist and verification
- `SYSTEM_STATUS.md` - System health and test procedures
- `TROUBLESHOOTING_GUIDE.md` - Extended troubleshooting guide

### System Testing
Run automated tests to verify system health:
```javascript
// In browser console (F12)
new SLOSSystemTest().runAllTests()
```

### Developer Notes
- Written in vanilla JavaScript (ES6+ modules)
- No external frameworks or build tools required
- localStorage API for data persistence
- All functions exposed to window for HTML onclick handlers
- CSS modularized across multiple files