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
First Name,Middle Name,Last Name,Birthday,Age,Gender,LRN,Student Number,Cluster,Strand,Section,Subjects
```

**Column Descriptions:**
- **First Name** (Required): Student's first name
- **Middle Name** (Optional): Student's middle name (can be left empty)
- **Last Name** (Required): Student's last name
- **Birthday** (Required): Date in format YYYY-MM-DD or DD/MM/YYYY
- **Age** (Optional): Student's age (can be left empty)
- **Gender** (Required): Male, Female, or other valid gender option
- **LRN** (Required, IMPORTANT): Learner Reference Number - This will be used as the student's username automatically
- **Student Number** (Optional): School-assigned student number
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
- The system will automatically generate passwords for each student
- Username will be set to the LRN provided in the CSV
- A success message will confirm the import is complete

## CSV File Format Example

```csv
First Name,Middle Name,Last Name,Birthday,Age,Gender,LRN,Student Number,Cluster,Strand,Section,Subjects
John,,Smith,1995-05-15,19,Male,123456789,SN001,Senior High School,STEM,11-A,Math;Science;English
Maria,Grace,Johnson,1996-03-20,18,Female,987654321,SN002,Senior High School,HUMANITIES,11-B,History;Literature;Philosophy
Carlos,,De La Cruz,1995-08-10,19,Male,456789123,SN003,Senior High School,STEM,11-A,Math;Physics;Chemistry
Ana,Patricia,Gonzalez,1996-01-25,18,Female,789123456,SN004,Senior High School,BUSINESS,11-C,Business Ethics;Economics;Accounting
```

## Important Notes

1. **LRN is Username**: The LRN field becomes the student's login username
   - Example: If LRN = "123456789", username = "123456789"
   - LRN must be unique in the system
   - LRN cannot contain spaces (no validation enforcing this yet, but recommended)

2. **Middle Name is Optional**: Leave it blank or empty if not needed

3. **Age is Optional**: Can be left blank if not available

4. **Student Number is Optional**: School-assigned number, can be left blank

5. **Subjects Format**: Use semicolons (;) to separate multiple subjects
   - Example: "Math;Science;English" 
   - NOT "Math; Science; English" (no spaces after semicolons)

6. **Date Format**: Use YYYY-MM-DD format for consistency (e.g., 1995-05-15)

7. **Cluster/Strand/Section**: These must exist in your system first
   - Go to Academic Structure Setup to create them before importing

8. **Automatic Credentials**: 
   - Usernames: Auto-set to the LRN value provided
   - Passwords: Auto-generated (8 characters with mixed case, numbers, and symbols)
   - Share these credentials with students or have them reset on first login

9. **Duplicate Prevention**: 
   - The system checks for duplicate LRNs in the CSV and in the system
   - Invalid rows (missing required fields, non-existent cluster/strand/section) will be skipped

10. **No Bulk Delete**: This import feature only creates accounts. To remove imported students, use the individual delete function in the student list.

## Troubleshooting

### "Missing columns" error
- Make sure your CSV has all required columns in the exact format
- Required columns: First Name, Last Name, Birthday, Gender, LRN, Cluster, Strand, Section, Subjects
- Column names are case-insensitive in the CSV header
- Check the **exact order** shown in the template

### "No valid student records found"
- Check that all required fields are filled in
- Verify that clusters, strands, and sections exist in your system
- Ensure no rows are completely empty
- Make sure LRN has no duplicate values

### "LRN already exists in system"
- The LRN is already used as a username for another student
- Use a different LRN for the new student

### Subjects not recognized
- Make sure subjects are separated by semicolons (;) without spaces before semicolons
- Example: "Math;Science;English" NOT "Math; Science; English"

---

**Updated**: March 2026  
**Feature**: Bulk Student Import via CSV  
**Admin Feature Only**: This feature is only available to administrators  
**Username Field**: Uses LRN as automatic username