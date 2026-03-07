/* =========================================
   INBOX & CHAT SYSTEM
   ========================================= */

import { getCurrentUser, getCurrentStudentId, appContainer } from './global.js';
import { getUserAccounts, getClusters, getMessages, saveMessages } from './storage.js';
import { getStudentData } from './utils.js';
import { renderApp } from './app.js';

// Variables for Chat
let currentChatPartner = null;
let searchFilter = '';

// Get teacher's cluster for filtering students to same cluster
function getTeacherCluster() {
    const currentUser = getCurrentUser();
    const accounts = getUserAccounts();
    const teacherAccount = accounts[currentUser];
    
    console.log('🔍 getTeacherCluster - Current user:', currentUser);
    console.log('🔍 Teacher account:', teacherAccount);
    
    // Teachers should have assignedCluster field directly
    if (teacherAccount && teacherAccount.assignedCluster) {
        console.log('✅ Found teacher cluster:', teacherAccount.assignedCluster);
        return teacherAccount.assignedCluster;
    }
    
    // Fallback: if no assignedCluster, try to infer from assignedStrandSections
    if (teacherAccount && teacherAccount.assignedStrandSections) {
        const c = getClusters();
        for (const clusterName in c) {
            for (const strandName in c[clusterName]) {
                if (teacherAccount.assignedStrandSections[strandName]) {
                    console.log('✅ Found teacher cluster (via strand):', clusterName);
                    return clusterName;
                }
            }
        }
    }
    
    console.log('❌ No cluster found for teacher. Teacher may not have assignedCluster or assignedStrandSections.');
    return null;
}

// Get teachers who have existing conversations or are explicitly assigned to this student
function getTeacherContactsForStudent() {
    const currentUser = getCurrentUser();
    const currentStudentId = getCurrentStudentId();
    const accounts = getUserAccounts();
    const myRole = accounts[currentUser].role;
    
    // If user is a teacher or admin, they see all students
    if (myRole === 'teacher' || myRole === 'admin') {
        return null; // Will be handled by student list logic
    }
    
    // For students: only show teachers who have already messaged them or are explicitly assigned
    if (myRole === 'student') {
        const teacherContacts = [];
        const addedTeachers = new Set(); // To avoid duplicates
        const allMessages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
        
        // 1. Find teachers who have existing conversations with this student
        Object.keys(allMessages).forEach(chatID => {
            const messages = allMessages[chatID] || [];
            
            messages.forEach(msg => {
                // Find messages where a teacher sent to this student (using username)
                if (msg.receiver === currentUser && accounts[msg.sender]?.role === 'teacher') {
                    if (!addedTeachers.has(msg.sender)) {
                        addedTeachers.add(msg.sender);
                        const teacherAccount = accounts[msg.sender];
                        const subjects = teacherAccount.assignedSubjects ? teacherAccount.assignedSubjects.join(', ') : 'Teacher Feedback';
                        teacherContacts.push({
                            name: teacherAccount.name || msg.sender,
                            subtitle: subjects,
                            id: msg.sender,
                            img: teacherAccount.img || 'images/default.svg',
                            isTeacherInitiated: true
                        });
                    }
                }
            });
        });
        
        // 2. Also include teachers who have explicitly assigned this student
        Object.entries(accounts).forEach(([username, account]) => {
            if (account.role === 'teacher' && 
                account.assignedStudents && 
                Array.isArray(account.assignedStudents) &&
                account.assignedStudents.includes(currentStudentId) &&
                !addedTeachers.has(username)) {
                
                addedTeachers.add(username);
                const assignedSubjects = account.assignedSubjects ? account.assignedSubjects.join(', ') : 'Assigned Teacher';
                teacherContacts.push({
                    name: account.name || username,
                    subtitle: assignedSubjects,
                    id: username,
                    img: account.img || 'images/default.svg',
                    isTeacherInitiated: true
                });
            }
        });
        
        return teacherContacts;
    }
    
    return [];
}

// Get student contacts for teacher (only students in same cluster and strand/section)
function getStudentContactsForTeacher() {
    const currentUser = getCurrentUser();
    const accounts = getUserAccounts();
    const myRole = accounts[currentUser].role;
    
    if (myRole !== 'teacher') {
        return [];
    }
    
    const c = getClusters();
    const teacherAccount = accounts[currentUser];
    const teacherSubjects = teacherAccount.assignedSubjects || [];
    const teacherCluster = getTeacherCluster();
    const assignedStrandSections = teacherAccount.assignedStrandSections || {};
    
    console.log('👨‍🏫 getStudentContactsForTeacher:');
    console.log('  Teacher:', currentUser);
    console.log('  Assigned Subjects:', teacherSubjects);
    console.log('  Teacher Cluster:', teacherCluster);
    console.log('  Assigned Strand Sections:', assignedStrandSections);
    
    if (!teacherCluster || teacherSubjects.length === 0) {
        console.log('❌ No cluster or subjects found. Early return with empty list.');
        return [];
    }
    
    const studentContacts = [];
    const addedStudents = new Set();
    const clusterStrands = c[teacherCluster] || {};
    
    // Search through ONLY the strands the teacher is assigned to
    Object.entries(assignedStrandSections).forEach(([assignedStrandName, assignedSections]) => {
        const strandData = clusterStrands[assignedStrandName];
        if (!strandData) {
            console.log(`  ⚠️  Strand ${assignedStrandName} not found in cluster ${teacherCluster}`);
            return;
        }
        
        console.log(`  📚 Processing strand: ${assignedStrandName}, sections: ${assignedSections.join(', ')}`);
        
        // Check if any of the strand's subjects match teacher's subjects
        const matchingSubjects = strandData.subjects && 
            strandData.subjects.filter(s => teacherSubjects.includes(s)) || [];
        
        console.log(`    Matching subjects in ${assignedStrandName}:`, matchingSubjects);
        
        if (matchingSubjects.length > 0) {
            // Iterate through the ASSIGNED SECTIONS ONLY in this strand
            assignedSections.forEach(assignedSection => {
                const sectionValue = strandData[assignedSection];
                if (Array.isArray(sectionValue)) {
                    console.log(`    📍 Section: ${assignedSection}, Students: ${sectionValue.length}`);
                    // Get students from this section
                    sectionValue.forEach(student => {
                        const studentHasSharedSubject = student.subjects && 
                            student.subjects.some(s => matchingSubjects.includes(s));
                        
                        if (studentHasSharedSubject && !addedStudents.has(student.id)) {
                            addedStudents.add(student.id);
                            
                            // Find student's username account (to use for messaging instead of student.id)
                            let studentUsername = null;
                            for (const [username, acct] of Object.entries(accounts)) {
                                if (acct.role === 'student' && acct.studentId === student.id) {
                                    studentUsername = username;
                                    break;
                                }
                            }
                            
                            const sharedSubjects = student.subjects.filter(s => 
                                matchingSubjects.includes(s)
                            ).join(', ');
                            
                            studentContacts.push({
                                name: student.name || student.id,
                                subtitle: sharedSubjects || 'Student',
                                id: studentUsername || student.id, // Use username for messaging if available
                                img: student.img || 'images/default.svg',
                                strand: assignedStrandName,
                                section: assignedSection,
                                cluster: teacherCluster,
                                subjects: student.subjects,
                                isTeacherInitiated: false // Teachers can initiate
                            });
                        }
                    });
                }
            });
        }
    });
    
    console.log(`✅ Found ${studentContacts.length} student contacts for teacher`);
    return studentContacts;
}

// Get unread message count
export function getUnreadMessageCount() {
    const currentUser = getCurrentUser();
    const allMessages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
    let unreadCount = 0;

    Object.keys(allMessages).forEach(chatID => {
        const messages = allMessages[chatID] || [];
        messages.forEach(msg => {
            if (msg.receiver === currentUser && !msg.read) {
                unreadCount++;
            }
        });
    });

    return unreadCount;
}

// Update dashboard message button with unread count
export function updateMessageNotification() {
    // notifications have been disabled for inbox/messages per request
    // this function intentionally does nothing so no badges or counts appear
    return;
}

// Contact list logic
export function renderContactList() {
    const currentUser = getCurrentUser();
    const accounts = getUserAccounts();
    const listContainer = document.getElementById('contacts-list');
    listContainer.innerHTML = '';

    const myRole = accounts[currentUser].role;
    let contacts = [];
    let contactMetadata = {}; // Store metadata for search filtering

    // --- SCENARIO A: I am a STUDENT (See only assigned teachers) ---
    if (myRole === 'student') {
        contacts = getTeacherContactsForStudent();
        if (contacts && contacts.length > 0) {
            contacts.forEach(c => {
                contactMetadata[c.id] = {
                    name: c.name,
                    subject: c.subtitle,
                    strand: '',
                    cluster: ''
                };
            });
        }
    } 
    
    // --- SCENARIO B: I am a TEACHER (See only Students in same cluster and subjects) ---
    else if (myRole === 'teacher') {
        const teacherStudents = getStudentContactsForTeacher();
        contacts = teacherStudents;
        
        teacherStudents.forEach(c => {
            contactMetadata[c.id] = {
                name: c.name,
                subjects: c.subjects || [],
                strand: c.strand || '',
                cluster: c.cluster || ''
            };
        });
    } 
    
    // --- SCENARIO C: I am ADMIN (Should not have access to messaging, but just in case) ---
    else if (myRole === 'admin') {
        // Admin has no messaging capability
        listContainer.innerHTML = '<div style="padding:15px; color:#999; text-align: center;">Messaging not available for Admin</div>';
        return;
    }

    // Filter contacts based on search (by name, subject, or strand)
    let filteredContacts = contacts;
    if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        filteredContacts = contacts.filter(c => {
            const meta = contactMetadata[c.id] || {};
            
            // Search by name
            if (c.name && c.name.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search by username/id
            if (c.id && c.id.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search by subject (for teachers seeing students)
            if (meta.subjects && Array.isArray(meta.subjects)) {
                if (meta.subjects.some(s => s.toLowerCase().includes(searchLower))) {
                    return true;
                }
            } else if (meta.subject && meta.subject.toLowerCase().includes(searchLower)) {
                // For students seeing teachers (subject in subtitle)
                return true;
            }
            
            // Search by strand
            if (meta.strand && meta.strand.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            return false;
        });
    }

    if (filteredContacts.length === 0) {
        listContainer.innerHTML = '<div style="padding:15px; color:#999; text-align: center;">No contacts found</div>';
        return;
    }

    filteredContacts.forEach(contact => {
        // Pass isTeacherInitiated flag (true for students viewing teachers, false for teachers viewing students)
        const isTeacherInitiated = contact.isTeacherInitiated || false;
        createContactItem(listContainer, contact.name, contact.subtitle, contact.id, contact.img, isTeacherInitiated);
    });
}

export function createContactItem(container, name, subtitle, idToChat, imgUrl, isTeacherInitiated = false) {
    const currentUser = getCurrentUser();
    const accounts = getUserAccounts();
    const myRole = accounts[currentUser].role;
    const div = document.createElement('div');
    div.className = 'contact-item';
    div.style.padding = '12px 15px';
    div.style.borderBottom = '1px solid #eee';
    div.style.cursor = 'pointer';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '12px';
    div.style.transition = 'all 0.2s ease';
    div.style.backgroundColor = '#fff';
    
    // Hover effect
    div.onmouseover = () => {
        div.style.backgroundColor = '#f0f8ff';
        div.style.borderLeft = '4px solid #f43f5e';
    };
    div.onmouseout = () => {
        div.style.backgroundColor = '#fff';
        div.style.borderLeft = 'none';
    };

    // Get conversation data (needed for message handling even though we don't display badges)
    const chatID = [currentUser, idToChat].sort().join('_');
    const allMessages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
    const conversation = allMessages[chatID] || [];
    
    // unread notifications disabled
    const unreadCount = 0;

    const displayImage = imgUrl || 'images/default.svg';
    
    // For students, show "Teacher Feedback" badge
    const feedbackBadge = myRole === 'student' && isTeacherInitiated ? '<span style="display: inline-block; background: #4f46e5; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; margin-left: 6px; font-weight: 600;">FEEDBACK</span>' : '';

    div.innerHTML = `
        <div style="position: relative;">
            <img src="${displayImage}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 2px solid #ddd;">
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight:600; font-size:0.95rem; color: #333; display: flex; align-items: center;">${name}${feedbackBadge}</div>
            <div style="font-size:0.8rem; color:#888;">${subtitle}</div>
        </div>
    `;
    
    div.onclick = () => {
        loadChat(idToChat, name);
        // Mark messages as read
        conversation.forEach(msg => {
            if (msg.receiver === currentUser) {
                msg.read = true;
            }
        });
        localStorage.setItem('slos_messages', JSON.stringify(allMessages));
        updateMessageNotification();
    };
    container.appendChild(div);
}

// Format timestamp to readable format
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

export function openInboxView() {
    appContainer.innerHTML = '';
    const template = document.getElementById('inbox-view');
    if (!template) {
        alert("Error: inbox-view template missing in HTML");
        return;
    }
    appContainer.appendChild(template.content.cloneNode(true));
    
    document.querySelector('.view-title').textContent = "Messages";
    
    // Setup search functionality
    const searchInput = document.getElementById('contact-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchFilter = e.target.value;
            renderContactList();
        });
    }
    
    renderContactList();

    document.getElementById('message-input-area').style.display = 'none';
    if(window.innerWidth <= 768) {
        document.querySelector('.contacts-sidebar').style.display = 'flex';
        document.querySelector('.chat-area').style.display = 'none';
    }
}

export function loadChat(partnerId, partnerName) {
    currentChatPartner = partnerId;
    
    document.getElementById('chat-with-name').textContent = partnerName;
    
    const inputArea = document.getElementById('message-input-area');
    const accounts = getUserAccounts();
    const currentUser = getCurrentUser();
    const role = accounts[currentUser].role;
    if (inputArea) {
        // only teachers may send messages or images
        inputArea.style.display = (role === 'teacher' ? 'flex' : 'none');
    }

    if (window.innerWidth <= 768) {
        document.querySelector('.contacts-sidebar').style.display = 'none';
        const chatArea = document.querySelector('.chat-area');
        chatArea.style.display = 'flex';
        chatArea.style.width = '100%'; 

        const headerTitle = document.getElementById('chat-with-name');
        if(!document.getElementById('mobile-back-btn')) {
            const btn = document.createElement('button');
            btn.id = 'mobile-back-btn';
            btn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            btn.style.marginRight = '10px';
            btn.style.border = 'none';
            btn.style.background = 'none';
            btn.style.fontSize = '1.2rem';
            btn.style.color = '#f43f5e';
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                document.querySelector('.contacts-sidebar').style.display = 'flex';
                document.querySelector('.contacts-sidebar').style.width = '100%';
                document.querySelector('.chat-area').style.display = 'none';
            };
            headerTitle.parentElement.prepend(btn);
        }
    }

    renderMessages();
}

export function renderMessages() {
    const currentUser = getCurrentUser();
    const feed = document.getElementById('messages-feed');
    if(!feed) return;
    feed.innerHTML = '';

    const chatID = [currentUser, currentChatPartner].sort().join('_');
    const allMessages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
    const conversation = allMessages[chatID] || [];

    if (conversation.length === 0) {
        feed.innerHTML = '<div style="text-align:center; color:#ccc; margin-top:20px; font-style: italic;">No messages yet. Say hello!</div>';
        return;
    }

    conversation.forEach((msg, index) => {
        const isMe = msg.sender === currentUser;
        const msgDiv = document.createElement('div');
        
        msgDiv.style.display = 'flex';
        msgDiv.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
        msgDiv.style.marginBottom = '12px';
        msgDiv.style.alignItems = 'flex-end';
        msgDiv.style.gap = '8px';

        const contentWrapper = document.createElement('div');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.alignItems = isMe ? 'flex-end' : 'flex-start';
        contentWrapper.style.maxWidth = '70%';

        if (msg.type === 'image') {
            const imgElement = document.createElement('img');
            imgElement.src = msg.text;
            imgElement.style.maxWidth = '100%';
            imgElement.style.borderRadius = '10px';
            imgElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            contentWrapper.appendChild(imgElement);
        } else {
            const textDiv = document.createElement('div');
            textDiv.style.background = isMe ? 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' : '#e8ecf1';
            textDiv.style.color = isMe ? 'white' : '#333';
            textDiv.style.padding = '10px 15px';
            textDiv.style.borderRadius = isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
            textDiv.style.wordWrap = 'break-word';
            textDiv.style.fontSize = '0.95rem';
            textDiv.textContent = msg.text;
            contentWrapper.appendChild(textDiv);
        }

        // Add timestamp and read status
        const infoDiv = document.createElement('div');
        infoDiv.style.fontSize = '0.75rem';
        infoDiv.style.color = '#999';
        infoDiv.style.marginTop = '4px';
        infoDiv.style.display = 'flex';
        infoDiv.style.alignItems = 'center';
        infoDiv.style.gap = '4px';
        infoDiv.style.justifyContent = isMe ? 'flex-end' : 'flex-start';

        let statusHtml = '';
        if (isMe) {
            statusHtml = msg.read ? 
                '<i class="fas fa-check-double" style="color: #4a9eff;"></i>' : 
                '<i class="fas fa-times-circle" style="color: #999;"></i>';
        }

        infoDiv.innerHTML = `${statusHtml} ${formatTimestamp(msg.timestamp)}`;
        contentWrapper.appendChild(infoDiv);

        msgDiv.appendChild(contentWrapper);
        feed.appendChild(msgDiv);
    });

    feed.scrollTop = feed.scrollHeight;
}

export function sendChatMessage() {
    const accounts = getUserAccounts();
    const currentUser = getCurrentUser();
    if (accounts[currentUser].role !== 'teacher') return; // students cannot send

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    saveMessageToStorage(text, 'text');
    input.value = '';
    input.focus();
}

export function handleChatImage(event) {
    const accounts = getUserAccounts();
    const currentUser = getCurrentUser();
    if (accounts[currentUser].role !== 'teacher') return; // only teachers may send images

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        saveMessageToStorage(e.target.result, 'image');
    };
    reader.readAsDataURL(file);
}

export function saveMessageToStorage(content, type) {
    const currentUser = getCurrentUser();
    const chatID = [currentUser, currentChatPartner].sort().join('_');
    const allMessages = JSON.parse(localStorage.getItem('slos_messages') || '{}');
    if (!allMessages[chatID]) allMessages[chatID] = [];

    allMessages[chatID].push({
        sender: currentUser,
        receiver: currentChatPartner,
        text: content,
        type: type,
        timestamp: Date.now(),
        read: false
    });

    localStorage.setItem('slos_messages', JSON.stringify(allMessages));
    renderMessages();
    renderContactList(); // Update unread badges
    updateMessageNotification();
}

export function toggleNotifications() {
    // notification toggle was removed; no action required
}