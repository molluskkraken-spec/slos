// Helper function to populate sections for selected strand in edit modal
function populateEditSectionsForStrand(cluster, selectedStrand) {
    const c = getClusters();
    const sectionSelect = document.getElementById('edit-section');
    if (!sectionSelect) return;
    sectionSelect.innerHTML = '<option value="">--Select Section--</option>';
    
    const strandData = c[cluster] && c[cluster][selectedStrand];
    if (strandData) {
        Object.keys(strandData).forEach(sectionName => {
            if (!['subjects'].includes(sectionName)) {
                const opt = document.createElement('option');
                opt.value = sectionName;
                opt.textContent = sectionName;
                sectionSelect.appendChild(opt);
            }
        });
    }
}

// Helper function to populate subjects for selected section in edit modal
function populateEditSubjectsForSection(cluster, strand, section) {
    const c = getClusters();
    const container = document.getElementById('edit-subjects-container');
    if (!container) return;
    container.innerHTML = '';
    
    const strandData = c[cluster] && c[cluster][strand];
    if (strandData && strandData.subjects && Array.isArray(strandData.subjects)) {
        if (strandData.subjects.length === 0) {
            container.innerHTML = '<p style="color: #999; padding: 10px;">No subjects available</p>';
            return;
        }
        
        strandData.subjects.forEach(subject => {
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 5px; cursor: pointer;';
            label.innerHTML = `
                <input type="checkbox" value="${subject}" style="cursor: pointer;">
                <span>${subject}</span>
            `;
            container.appendChild(label);
        });
    } else {
        container.innerHTML = '<p style="color: #999; padding: 10px;">No subjects available</p>';
    }
}

// Update sections when strand is changed in edit modal
function updateEditSectionAndSubjects(studentId, cluster, oldStrand, oldSection) {
    const strandSelect = document.getElementById('edit-strand');
    const sectionSelect = document.getElementById('edit-section');
    if (!strandSelect || !sectionSelect) return;
    
    const selectedStrand = strandSelect.value;
    
    if (selectedStrand) {
        populateEditSectionsForStrand(cluster, selectedStrand);
        // Auto-select first section for subjects to load
        setTimeout(() => {
            const firstSection = sectionSelect.options[1]?.value || '';
            if (firstSection) {
                sectionSelect.value = firstSection;
                updateEditSubjects(studentId, cluster, oldStrand, oldSection);
            } else {
                populateEditSubjectsForSection(cluster, selectedStrand, '');
            }
        }, 50);
    }
}

// Update subjects when section is changed in edit modal
function updateEditSubjects(studentId, cluster, oldStrand, oldSection) {
    const strandSelect = document.getElementById('edit-strand');
    const sectionSelect = document.getElementById('edit-section');
    if (!strandSelect || !sectionSelect) return;
    
    const selectedStrand = strandSelect.value;
    const selectedSection = sectionSelect.value;
    
    if (selectedStrand && selectedSection) {
        populateEditSubjectsForSection(cluster, selectedStrand, selectedSection);
    }
}

export function editTeacherStudent(studentId, cluster, strand, section) {
    const c = getClusters();
    const students = c[cluster][strand][section];
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showSuccessToast("⚠️ Student not found.");
        return;
    }
    
    // Create edit modal with student data pre-filled
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; overflow-y: auto; padding: 20px;" id="edit-student-dialog">
            <div style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-top: 0;">Edit Student Information</h3>
                
                <!-- Profile Section -->
                <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #333; font-size: 0.95rem;">Profile Information</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">First Name</label>
                            <input type="text" id="edit-fname" value="${student.firstName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Middle Name</label>
                            <input type="text" id="edit-mname" value="${student.middleName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Last Name</label>
                        <input type="text" id="edit-lname" value="${student.lastName || ''}" class="au-input" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Birthday</label>
                            <input type="date" id="edit-bday" value="${student.birthday || ''}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Gender</label>
                            <select id="edit-gender" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                                <option value="">--Select Gender--</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Section Assignment Section -->
                <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #333; font-size: 0.95rem;">Section Assignment</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Strand</label>
                            <select id="edit-strand" onchange="updateEditSectionAndSubjects('${studentId}', '${cluster}', '${strand}', '${section}')" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                                <option value="">--Select Strand--</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Section</label>\n                            <select id="edit-section" onchange="updateEditSubjects('${studentId}', '${cluster}', '${strand}', '${section}')" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                                <option value="">--Select Section--</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Subjects</label>
                        <div id="edit-subjects-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 150px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="confirmEditTeacherStudent('${studentId}', '${cluster}', '${strand}', '${section}')" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-check"></i> Save Changes
                    </button>
                    <button onclick="cancelEditTeacherStudent()" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Populate dropdowns and checkboxes
    setTimeout(() => {
        const genderSelect = document.getElementById('edit-gender');
        const strandSelect = document.getElementById('edit-strand');
        const sectionSelect = document.getElementById('edit-section');
        
        if (!genderSelect || !strandSelect || !sectionSelect) return;
        
        // Populate gender dropdown
        const genders = getAvailableGenders();
        genders.forEach(gender => {
            const opt = document.createElement('option');
            opt.value = gender;
            opt.textContent = gender;
            if (gender === student.gender) {
                opt.selected = true;
            }
            genderSelect.appendChild(opt);
        });
        
        // Populate strand dropdown - all strands in the cluster
        const clusterData = c[cluster];
        Object.keys(clusterData).forEach(strandName => {
            const opt = document.createElement('option');
            opt.value = strandName;
            opt.textContent = strandName;
            if (strandName === strand) {
                opt.selected = true;
            }
            strandSelect.appendChild(opt);
        });
        
        // Populate sections for current strand
        populateEditSectionsForStrand(cluster, strand);
        sectionSelect.value = section;
        
        // Populate subjects for current strand and section
        populateEditSubjectsForSection(cluster, strand, section);
        
        // Set current student's subjects as checked
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('#edit-subjects-container input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (student.subjects && student.subjects.includes(cb.value)) {
                    cb.checked = true;
                }
            });
        }, 100);
    }, 50);
}

export function confirmEditTeacherStudent(studentId, cluster, oldStrand, oldSection) {
    const fname = document.getElementById('edit-fname').value.trim();
    const mname = document.getElementById('edit-mname').value.trim();
    const lname = document.getElementById('edit-lname').value.trim();
    const bday = document.getElementById('edit-bday').value;
    const gender = document.getElementById('edit-gender').value;
    const newStrand = document.getElementById('edit-strand').value;
    const newSection = document.getElementById('edit-section').value;
    
    if (!fname || !lname) {
        showSuccessToast("⚠️ Please fill in first name and last name.");
        return;
    }
    
    if (!newStrand || !newSection) {
        showSuccessToast("⚠️ Please select a strand and section.");
        return;
    }
    
    // Get selected subjects
    const subjectCheckboxes = document.querySelectorAll('#edit-subjects-container input[type="checkbox"]:checked');
    const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    
    if (selectedSubjects.length === 0) {
        showSuccessToast("⚠️ Please select at least one subject.");
        return;
    }
    
    const c = getClusters();
    const fullName = `${fname} ${mname ? mname + ' ' : ''}${lname}`;
    
    // Get the student from old location
    const oldStudents = c[cluster][oldStrand][oldSection];
    const studentIndex = oldStudents.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        showSuccessToast("⚠️ Student not found.");
        return;
    }
    
    // Get the student object
    const student = oldStudents[studentIndex];
    
    // Update student profile information
    const updatedStudent = {
        ...student,
        firstName: fname,
        middleName: mname,
        lastName: lname,
        name: fullName,
        birthday: bday,
        gender: gender,
        subjects: selectedSubjects
    };
    
    // If student is moving to a different strand/section, remove from old location and add to new
    if (newStrand !== oldStrand || newSection !== oldSection) {
        // Remove student from old section
        oldStudents.splice(studentIndex, 1);
        
        // Ensure new section exists in clusters
        if (!c[cluster][newStrand]) {
            c[cluster][newStrand] = { subjects: [] };
        }
        if (!c[cluster][newStrand][newSection]) {
            c[cluster][newStrand][newSection] = [];
        }
        
        // Add student to new section
        c[cluster][newStrand][newSection].push(updatedStudent);
        
        // Update account's section info if it exists
        for (const username in userAccounts) {
            if (userAccounts[username].studentId === studentId) {
                userAccounts[username].strand = newStrand;
                userAccounts[username].section = newSection;
                userAccounts[username].subjects = selectedSubjects;
                userAccounts[username].name = fullName;
                userAccounts[username].firstName = fname;
                userAccounts[username].middleName = mname;
                userAccounts[username].lastName = lname;
                break;
            }
        }
    } else {
        // Same section, just update the student in place
        oldStudents[studentIndex] = updatedStudent;
        
        // Update account info
        for (const username in userAccounts) {
            if (userAccounts[username].studentId === studentId) {
                userAccounts[username].name = fullName;
                userAccounts[username].firstName = fname;
                userAccounts[username].middleName = mname;
                userAccounts[username].lastName = lname;
                userAccounts[username].subjects = selectedSubjects;
                break;
            }
        }
    }
    
    // Save all changes
    saveClusters();
    saveAccounts();
    
    showSuccessToast(`✅ Student "${fullName}" has been updated.`);
    cancelEditTeacherStudent();
    updateTeacherStudentList();
}

export function cancelEditTeacherStudent() {
    const dialog = document.getElementById('edit-student-dialog');
    if (dialog) {
        dialog.remove();
    }
}
