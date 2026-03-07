# CSV Student Import Guide

## Overview
The CSV import feature allows administrators to bulk import student accounts by uploading a CSV (Comma-Separated Values) file. This is much faster than manually entering each student one at a time.

## How to Use

### Step 1: Navigate to Student Registration
1. Click on the "Register New Student" option in the Admin Dashboard
2. You'll see an "Upload CSV" button on the right side of the account type selector

### Step 2: Prepare Your CSV File
Create a CSV file with the following columns (in this exact order):

```
First Name,Middle Name,Last Name,Birthday,Gender,Cluster,Strand,Section,Subjects
```

**Column Descriptions:**
- **First Name** (Required): Student's first name
- **Middle Name** (Optional): Student's middle name (can be left empty)
- **Last Name** (Required): Student's last name
- **Birthday** (Required): Date in format YYYY-MM-DD or DD/MM/YYYY
- **Gender** (Required): Male, Female, or other valid gender option
- **Cluster** (Required): Must match an existing cluster in your system
- **Strand** (Required): Must match an existing strand in the selected cluster
- **Section** (Required): Must match an existing section in the strand
- **Subjects** (Required): Semicolon-separated list of subjects (e.g., "Math;Science;English")

### Step 3: Upload the CSV File
1. Click the "Upload CSV" button
2. Select your CSV file from your computer
3. A preview modal will appear showing all the records to be imported

### Step 4: Review and Edit (Optional)
- The preview table shows all students to be imported
- You can click on any cell to edit the data before confirming
- Review carefully to ensure all information is correct

### Step 5: Confirm Import
- Click the "Import [X] Students" button to create all accounts
- The system will automatically generate usernames and passwords for each student
- A success message will confirm the import is complete

## CSV File Format Example

```csv
First Name,Middle Name,Last Name,Birthday,Gender,Cluster,Strand,Section,Subjects
John,,Smith,1995-05-15,Male,Senior High School,STEM,11-A,Math;Science;English
Maria,Grace,Johnson,1996-03-20,Female,Senior High School,HUMANITIES,11-B,History;Literature;Philosophy
Carlos,,De La Cruz,1995-08-10,Male,Senior High School,STEM,11-A,Math;Physics;Chemistry
Ana,Patricia,Gonzalez,1996-01-25,Female,Senior High School,BUSINESS,11-C,Business Ethics;Economics;Accounting
```

## Important Notes

1. **Middle Name is Optional**: Leave it blank or empty if not needed
2. **Subjects Format**: Use semicolons (;) to separate multiple subjects
3. **Date Format**: Use YYYY-MM-DD format for consistency (e.g., 1995-05-15)
4. **Cluster/Strand/Section**: These must exist in your system first
   - Go to Academic Structure Setup to create them before importing
5. **Automatic Credentials**: 
   - Usernames are auto-generated as: firstname.lastname (or firstname.lastname# if duplicate)
   - Passwords are auto-generated (8 characters with mixed case, numbers, and symbols)
   - Share these credentials with students or have them reset on first login

6. **Duplicate Prevention**: 
   - The system checks for duplicate usernames and will skip invalid rows
   - Invalid rows (missing required fields, non-existent cluster/strand/section) will be skipped

7. **No Bulk Delete**: This import feature only creates accounts. To remove imported students, use the individual delete function in the student list.

## Troubleshooting

### "Missing required column" error
- Make sure your CSV has all required columns in the exact format
- Column names are case-sensitive, use the format provided above

### "No valid student records found"
- Check that all required fields are filled in
- Verify that clusters, strands, and sections exist in your system
- Ensure no rows are completely empty

### "Failed to import. All records had errors."
- Check the preview to see which rows had issues
- Fix the data and try uploading again

### Subjects not recognized
- Make sure subjects are separated by semicolons (;) without spaces before semicolons
- Example: "Math;Science;English" NOT "Math; Science; English"

## Template File

A template CSV file is included: `CSV_TEMPLATE_STUDENTS.csv`
You can use this as a starting point for your bulk imports.

---

**Created**: February 2026
**Feature**: Bulk Student Import via CSV
**Admin Feature Only**: This feature is only available to administrators