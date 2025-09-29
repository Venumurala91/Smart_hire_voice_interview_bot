// full-path: /frontend/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & HELPERS ---
    // The state object holds the current status of the application, like which page is active.
    let state = { currentPage: 1, currentSearch: '', currentStatus: 'all', activeInterviewId: null, talentPoolPage: 1 };
    // These variables will hold our chart instance and the interval for auto-refreshing data.
    let pollingInterval = null, pipelineChart = null;
    
    // NEW: Array to hold files selected by the user before final upload.
    let stagedFiles = []; 

    // Extends the Day.js library to format dates like "5 minutes ago".
    dayjs.extend(dayjs_plugin_relativeTime);

    // Helper functions for common tasks to keep the code clean (DRY principle).
    const getInitials = (name) => { if (!name) return '?'; const parts = name.trim().split(' '); let initials = parts[0].substring(0, 1).toUpperCase(); if (parts.length > 1) initials += parts[parts.length - 1].substring(0, 1).toUpperCase(); return initials; };
    const nameToColor = (name) => { if (!name) return '#cccccc'; let hash = 0; for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; } const color = (hash & 0x00FFFFFF).toString(16).toUpperCase(); return "#" + "00000".substring(0, 6 - color.length) + color; };
    const showToast = (message, type = 'success') => { const toastContainer = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; toastContainer.appendChild(toast); setTimeout(() => toast.remove(), 4000); };
    const setLoading = (isLoading, formType) => { const btn = formType === 'manual' ? DOMElements.submitBtn : DOMElements.screenBtn; const loaderEl = formType === 'manual' ? DOMElements.loader : DOMElements.screenLoader; const text = formType === 'manual' ? DOMElements.btnText : DOMElements.screenBtnText; const error = formType === 'manual' ? DOMElements.errorMessage : DOMElements.screenMessage; btn.disabled = isLoading; loaderEl.classList.toggle('hidden', !isLoading); text.classList.toggle('hidden', isLoading); if (isLoading) error.classList.add('hidden'); };

    // --- DOM ELEMENTS ---
    // Caching all necessary DOM elements in one place for performance and easy access.
    const DOMElements = {
        appContainer: document.querySelector('.app-container'), allViews: document.querySelectorAll('.view-container'), navLinks: document.querySelectorAll('.main-nav a'),
        statTotal: document.getElementById('stat-total'), statCompleted: document.getElementById('stat-completed'), statAwaitingCall: document.getElementById('stat-awaiting-call'), navBadgePending: document.getElementById('nav-badge-pending'),
        upNextList: document.getElementById('up-next-list'), chartCanvas: document.getElementById('pipeline-chart'), notificationBtn: document.getElementById('notification-btn'), notificationDropdown: document.getElementById('notification-dropdown'),
        interviewListBody: document.getElementById('interview-list-body'), emptyState: document.getElementById('empty-state'), searchInput: document.getElementById('search-input'), filterBtns: document.querySelectorAll('.filter-btn'), paginationControls: document.getElementById('pagination-controls'),
        talentPoolList: document.getElementById('talent-pool-list'), talentPoolPagination: document.getElementById('talent-pool-pagination'),
        newInterviewBtn: document.getElementById('new-interview-btn'), createModal: document.getElementById('create-modal'), selectAllCheckbox: document.getElementById('select-all-checkbox'), deleteSelectedBtn: document.getElementById('delete-selected-btn'),
        detailsPanel: document.getElementById('details-panel'), detailsPlaceholder: document.getElementById('details-panel-placeholder'), detailsContent: document.getElementById('details-panel-content'),
        createModalCloseBtn: document.getElementById('create-modal-close-btn'), modalTabs: document.querySelectorAll('.tab-link'), tabContents: document.querySelectorAll('.tab-content'),
        manualForm: document.getElementById('create-interview-form'), submitBtn: document.getElementById('submit-btn'), btnText: document.getElementById('btn-text'), loader: document.getElementById('loader'), errorMessage: document.getElementById('error-message'),
        screenResumesForm: document.getElementById('screen-resumes-form'), screenBtn: document.getElementById('screen-btn'), screenBtnText: document.getElementById('screen-btn-text'), screenLoader: document.getElementById('screen-loader'), screenMessage: document.getElementById('screen-message'),
        resumeResultsContainer: document.getElementById('resume-results-container'), resumeResultsList: document.getElementById('resume-results-list'), screenAgainBtn: document.getElementById('screen-again-btn'),
        savedJdSelect: document.getElementById('saved-jd-select'), jdText: document.getElementById('jd_text'), saveJdCheckbox: document.getElementById('save-jd-checkbox'), jdTitleInput: document.getElementById('jd-title-input'),
        // NEW: Elements for the file staging UI
        addResumesBtn: document.getElementById('add-resumes-btn'),
        resumeFilesInput: document.getElementById('resume-files-input'),
        stagedFilesList: document.getElementById('staged-files-list'),
    };
    const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;

    // --- ROUTING & POLLING ---
    // Handles changing views based on the URL hash (e.g., #dashboard, #interviews).
    const handleRouting = () => {
        let hash = window.location.hash || '#dashboard';
        DOMElements.allViews.forEach(view => view.classList.add('hidden'));
        DOMElements.navLinks.forEach(link => link.parentElement.classList.remove('active'));
        DOMElements.appContainer.classList.remove('talent-pool-active');
        DOMElements.detailsPanel.classList.remove('hidden');
        
        stopPolling(); // Stop any existing auto-refresh timers.

        const viewId = hash.substring(1) + '-view';
        const targetView = document.getElementById(viewId);
        const targetLink = document.querySelector(`a[data-view="${viewId}"]`);

        if (targetView && targetLink) {
            targetView.classList.remove('hidden');
            targetLink.parentElement.classList.add('active');
            if (hash === '#dashboard') { fetchDashboardData(); }
            else if (hash === '#interviews') { fetchAndRenderInterviews(); startPolling(); } // Start auto-refresh for interviews page
            else if (hash === '#talent-pool') { DOMElements.appContainer.classList.add('talent-pool-active'); DOMElements.detailsPanel.classList.add('hidden'); fetchTalentPool(); }
        }
    };
    
    // Function to refresh the data on the currently active page.
    const refreshActiveData = async () => {
        const hash = window.location.hash || '#dashboard';
        if (hash === '#interviews') { await fetchAndRenderInterviews(); if (state.activeInterviewId) { openDetailsPanel(state.activeInterviewId, false); } }
        if (hash === '#dashboard') { await fetchDashboardData(); }
        if (hash === '#talent-pool') { await fetchTalentPool(); }
    };

    // Functions to control the auto-refresh interval.
    const stopPolling = () => { if (pollingInterval) clearInterval(pollingInterval); pollingInterval = null; };
    const startPolling = () => { stopPolling(); pollingInterval = setInterval(refreshActiveData, 15000); };
    
    // --- DATA FETCHING ---
    // All functions that communicate with the backend API start with 'fetch'.
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard-data'); if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const data = await response.json();
            DOMElements.statTotal.textContent = data.stats.total_shortlisted || 0;
            DOMElements.statCompleted.textContent = data.stats.completed_count || 0;
            DOMElements.statAwaitingCall.textContent = data.stats.awaiting_call_count || 0;
            DOMElements.navBadgePending.textContent = data.stats.awaiting_call_count || 0;
            DOMElements.upNextList.innerHTML = data.up_next.map(item => `<div class="up-next-item" data-interview-id="${item.id}"> <div class="card-avatar" style="background-color: ${nameToColor(item.candidate_name)};">${getInitials(item.candidate_name)}</div> <div> <p><strong>${item.candidate_name}</strong></p> <p class="text-secondary">AI Score: ${item.score || '--'}/100</p> </div> <button class="action-btn primary" style="margin-left:auto; padding: 6px 12px;">View Report</button> </div>`).join('') || '<p class="text-secondary">No reports ready for review.</p>';
            const activityIcons = { 'created': '➕', 'started': '📞', 'complete': '✔', 'Deleted': '🗑️', 'Analyzed': '🧠', 'failed': '❌', 'timed out': '⏳', 'uploaded': '📄' };
            const getIcon = (msg) => { for (const key in activityIcons) { if (msg.toLowerCase().includes(key)) return activityIcons[key]; } return '🔔'; };
            DOMElements.notificationDropdown.innerHTML = data.activities.map(act => `<div class="activity-item"> <div class="icon">${getIcon(act.message)}</div> <div> <p>${act.message}</p> <p class="time">${dayjs(act.timestamp).fromNow()}</p> </div> </div>`).join('') || '<p class="text-secondary" style="padding: 1rem;">No recent activity.</p>';
            const chartData = { labels: ['Awaiting Call', 'Active Calls', 'Completed'], datasets: [{ data: [data.stats.awaiting_call_count, data.stats.in_progress_count, data.stats.completed_count], backgroundColor: ['#EAB308', '#3B82F6', '#22C55E'], borderWidth: 0 }] };
            if (pipelineChart) { pipelineChart.destroy(); }
            pipelineChart = new Chart(DOMElements.chartCanvas, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } } });
        } catch (error) { showToast(error.message, 'error'); }
    };
    const fetchAndRenderInterviews = async () => { try { const response = await fetch(`/api/interviews?page=${state.currentPage}&search=${encodeURIComponent(state.currentSearch)}&status=${state.currentStatus}`); if (!response.ok) throw new Error('Failed to fetch interviews'); const data = await response.json(); renderInterviewList(data.interviews); renderPagination(data.total_pages, data.current_page, DOMElements.paginationControls, 'interviewPage'); } catch (error) { showToast(error.message, 'error'); DOMElements.interviewListBody.innerHTML = `<p class="error-text">${error.message}</p>`; } };
    const fetchTalentPool = async () => { try { const response = await fetch(`/api/talent-pool?page=${state.talentPoolPage}&search=${encodeURIComponent(state.currentSearch)}`); if (!response.ok) throw new Error('Failed to fetch talent pool'); const data = await response.json(); renderTalentPoolList(data.candidates); renderPagination(data.total_pages, state.talentPoolPage, DOMElements.talentPoolPagination, 'talentPage'); } catch(error) { showToast(error.message, 'error'); } };
    const fetchJds = async () => { try { const response = await fetch('/api/jds'); const jds = await response.json(); DOMElements.savedJdSelect.innerHTML = '<option value="">-- Select a saved JD --</option>'; jds.forEach(jd => { const option = new Option(jd.title, jd.id); option.dataset.description = jd.description; DOMElements.savedJdSelect.appendChild(option); }); } catch (error) { console.error("Failed to fetch JDs:", error); } };

    // --- RENDERING ---
    // Functions that take data and create HTML to display it on the page.
    const renderInterviewList = (interviews) => { DOMElements.interviewListBody.innerHTML = ''; if (!interviews || interviews.length === 0) { DOMElements.emptyState.classList.remove('hidden'); } else { DOMElements.emptyState.classList.add('hidden'); interviews.forEach(interview => DOMElements.interviewListBody.appendChild(createInterviewItem(interview))); } if (state.activeInterviewId) { const card = document.querySelector(`.interview-card[data-interview-id='${state.activeInterviewId}']`); if (card) card.classList.add('active'); } };
    const renderTalentPoolList = (candidates) => { const tbody = DOMElements.talentPoolList; tbody.innerHTML = ''; if (!candidates || candidates.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No candidates found.</td></tr>`; } else { candidates.forEach(c => tbody.appendChild(createTalentPoolItem(c))); } };
    const renderPagination = (totalPages, activePage, container, pageType) => { container.innerHTML = ''; if (totalPages <= 1) return; container.innerHTML = `<button class="nav-btn prev-btn" data-page-type="${pageType}" ${activePage === 1 ? 'disabled' : ''}>&lt;</button> <span class="page-info">Page ${activePage} of ${totalPages}</span> <button class="nav-btn next-btn" data-page-type="${pageType}" ${activePage === totalPages ? 'disabled' : ''}>&gt;</button>`; };
    
    // These functions act like templates to create individual HTML elements.
    const createInterviewItem = (interview) => { const item = document.createElement('div'); item.className = 'interview-card'; item.dataset.interviewId = interview.id; const initials = getInitials(interview.candidate_name), bgColor = nameToColor(interview.candidate_name); item.innerHTML = `<div><input type="checkbox" class="interview-checkbox" data-id="${interview.id}"></div><div class="card-info"><div class="card-avatar" style="background-color: ${bgColor};">${initials}</div><div><div class="candidate-name">${interview.candidate_name}</div><div class="job-position">${interview.job_position}</div></div></div><div class="status-badge ${interview.status}">${interview.status}</div><div class="card-actions">${interview.status === 'pending' ? `<button class="icon-btn call-btn" title="Start AI Call">${phoneIcon}</button>` : ''}</div>`; return item; };
    
    const createTalentPoolItem = (candidate) => {
        const item = document.createElement('tr');
        const initials = getInitials(candidate.candidate_name), bgColor = nameToColor(candidate.candidate_name);
        
        // Check if a resume exists. If so, create a "View" link. Otherwise, create an "Upload" button.
        let resumeCellHtml;
        if (candidate.resume_filename) {
            resumeCellHtml = `<a href="/api/resumes/${candidate.resume_filename}" target="_blank" class="text-btn">View</a>`;
        } else {
            resumeCellHtml = `
                <label for="upload-${candidate.id}" class="upload-resume-label">Upload</label>
                <input type="file" id="upload-${candidate.id}" class="upload-resume-input" data-interview-id="${candidate.id}" accept=".pdf">
            `;
        }
        item.innerHTML = `<td class="candidate-cell"><div class="card-avatar" style="background-color: ${bgColor};">${initials}</div><span>${candidate.candidate_name}</span></td><td>${candidate.phone_number || '--'}</td><td>${candidate.skills_to_assess || '--'}</td><td>${candidate.score !== null ? `${candidate.score}/100` : '--'}</td><td>${resumeCellHtml}</td>`;
        return item;
    };

    const createResumeResultItem = (result, jd) => {
        const item = document.createElement('div');
        item.className = 'resume-result-item';
        // Store all necessary data in the element's dataset for easy access later.
        item.dataset.name = result.candidate_name;
        item.dataset.phone = result.phone_number;
        item.dataset.email = result.email_address;
        item.dataset.skills = result.skills_to_assess;
        item.dataset.resumeFilename = result.resume_filename;
        item.dataset.jd = jd;

        const initials = getInitials(result.candidate_name), bgColor = nameToColor(result.candidate_name);
        const score = parseInt(result.match_score, 10);
        let scoreClass = 'low';
        if (score >= 75) scoreClass = 'high';
        else if (score >= 50) scoreClass = 'medium';
        const canTakeAction = result.phone_number && result.phone_number.toLowerCase() !== 'n/a';
        
        item.innerHTML = `
            <div class="card-avatar" style="background-color: ${bgColor};">${initials}</div>
            <div class="resume-result-item-content">
                <div class="result-candidate-name">${result.candidate_name}</div>
                <div class="result-candidate-contact">
                    <span>${result.phone_number || 'No phone'}</span> | <span>${result.email_address || 'No email'}</span>
                </div>
                <div class="ats-score-wrapper">
                    <div class="ats-score-label"><span>ATS Match Score</span><strong>${score}%</strong></div>
                    <div class="score-bar"><div class="score-bar-inner ${scoreClass}" style="width: ${score}%;"></div></div>
                </div>
                <p class="match-reason">${result.match_reason}</p>
                <div class="result-actions">
                    <button class="screening-action-btn schedule" data-action="schedule" ${!canTakeAction ? 'disabled' : ''}>Schedule for Later</button>
                    <button class="screening-action-btn call" data-action="call" ${!canTakeAction ? 'disabled' : ''}>Initiate Call</button>
                </div>
            </div>`;
        return item;
    };

    const openDetailsPanel = async (interviewId, showLoading = true) => { document.querySelectorAll('.interview-card').forEach(c => c.classList.remove('active')); const card = document.querySelector(`.interview-card[data-interview-id='${interviewId}']`); if (card) card.classList.add('active'); state.activeInterviewId = interviewId; DOMElements.detailsPlaceholder.classList.add('hidden'); DOMElements.detailsContent.classList.remove('hidden'); if(showLoading) DOMElements.detailsContent.innerHTML = '<div class="loader" style="margin: 4rem auto; border-top-color: var(--accent-indigo);"></div>'; try { const response = await fetch(`/api/interviews/${interviewId}`); if (!response.ok) throw new Error('Failed to load details'); renderDetails(await response.json()); } catch (error) { showToast(error.message, 'error'); DOMElements.detailsContent.innerHTML = `<p class="error-text">${error.message}</p>`; } };
    const renderDetails = (data) => {
        const skills = data.skills_to_assess || '';
        const skillTagsHtml = skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        const recordingHtml = data.recording_url ? `<div class="details-section"><h4>Recording</h4><audio controls src="${data.recording_url}"></audio></div>` : '';
        const getRecommendationClass = (rec) => { if (!rec) return ''; const recLower = rec.toLowerCase(); if (recLower.includes('strong hire') || recLower.includes('hire')) return 'completed'; if (recLower.includes('no hire')) return 'error'; return 'pending'; };
        const initials = getInitials(data.candidate_name), bgColor = nameToColor(data.candidate_name);
        DOMElements.detailsContent.innerHTML = `<div class="details-header"><div class="avatar" style="background-color: ${bgColor};">${initials}</div><div><h2>${data.candidate_name}</h2><p>${data.job_position}</p></div></div><div class="details-section"><h4>Key Skills</h4><div class="skill-tags-container">${skillTagsHtml || '<p class="text-secondary">No specific skills listed.</p>'}</div></div><div class="details-summary-grid"><div class="summary-card"><div class="title">Overall AI Score</div><div class="value">${data.score !== null ? `${data.score}/100` : 'N/A'}</div></div><div class="summary-card"><div class="title">AI Recommendation</div><div class="value recommendation status-badge ${getRecommendationClass(data.recommendation)}">${data.recommendation || 'N/A'}</div></div></div><div class="details-section"><h4>Detailed Analysis</h4><div class="detailed-score-grid"><div class="summary-card"><div class="title">Communication</div><div class="value">${data.comm_score !== null ? `${data.comm_score}/10` : 'N/A'}</div></div><div class="summary-card"><div class="title">Technical Knowledge</div><div class="value">${data.tech_score !== null ? `${data.tech_score}/10` : 'N/A'}</div></div><div class="summary-card"><div class="title">Job Relevance</div><div class="value">${data.relevance_score !== null ? `${data.relevance_score}/10` : 'N/A'}</div></div></div></div>${recordingHtml}<div class="details-section"><h4>AI Assessment</h4><p>${data.assessment || 'N/A'}</p></div>`;
    };

    // Function to render the list of files in the staging area.
    const renderStagedFiles = () => {
        DOMElements.stagedFilesList.innerHTML = ''; // Clear the current list
        if (stagedFiles.length === 0) {
            DOMElements.stagedFilesList.innerHTML = '<p class="text-secondary" style="text-align:center; padding: 0.5rem;">Click below to add resumes.</p>';
        } else {
            stagedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'staged-file-item';
                item.innerHTML = `
                    <span>${file.name}</span>
                    <button type="button" class="remove-file-btn" data-index="${index}" title="Remove file">&times;</button>
                `;
                DOMElements.stagedFilesList.appendChild(item);
            });
        }
    };


    // --- ACTION HANDLERS ---
    // Functions that respond to user events like form submissions and button clicks.
    const handleManualFormSubmit = async (e) => { e.preventDefault(); setLoading(true, 'manual'); const data = { candidate_name: DOMElements.manualForm.candidate_name.value, phone_number: DOMElements.manualForm.phone_number.value, job_position: DOMElements.manualForm.job_position.value, job_description: DOMElements.manualForm.job_description.value, skills_to_assess: DOMElements.manualForm.skills_to_assess.value }; try { const response = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!response.ok) throw new Error((await response.json()).error || 'Failed to create.'); showToast('Interview created successfully!'); await refreshActiveData(); DOMElements.createModal.classList.add('hidden'); DOMElements.manualForm.reset(); } catch (error) { DOMElements.errorMessage.textContent = error.message; DOMElements.errorMessage.classList.remove('hidden'); } finally { setLoading(false, 'manual'); } };
    
    // This handler now constructs FormData from our `stagedFiles` array.
    const handleScreenResumesSubmit = async (e) => {
        e.preventDefault();
        
        if (stagedFiles.length === 0) {
            showToast('Please add at least one resume file.', 'error');
            return;
        }
        
        setLoading(true, 'screen');
        
        const formData = new FormData();
        // Append other form fields
        formData.append('job_description', DOMElements.jdText.value);
        if (DOMElements.saveJdCheckbox.checked) {
            formData.append('save_jd', 'true');
            formData.append('jd_title', DOMElements.jdTitleInput.value);
        }

        // Append all staged files to the FormData object
        stagedFiles.forEach(file => {
            formData.append('resumes', file);
        });

        try {
            const response = await fetch('/api/analyze-resumes', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An error occurred.');
            
            DOMElements.screenResumesForm.classList.add('hidden');
            DOMElements.resumeResultsContainer.classList.remove('hidden');
            DOMElements.resumeResultsList.innerHTML = '';
            
            if (data.results && data.results.length > 0) {
                const jd = formData.get('job_description');
                data.results.forEach(result => DOMElements.resumeResultsList.appendChild(createResumeResultItem(result, jd)));
            } else {
                DOMElements.resumeResultsList.innerHTML = `<p class="text-secondary" style="padding: 2rem;">No candidates could be parsed.</p>`;
            }
        } catch (error) {
            DOMElements.screenMessage.textContent = error.message;
            DOMElements.screenMessage.className = 'message-text error';
            DOMElements.screenMessage.classList.remove('hidden');
        } finally {
            setLoading(false, 'screen');
        }
    };

    // Handler for screening results actions ("Initiate Call" and "Schedule for Later")
    const handleScreeningAction = async (button) => {
        const action = button.dataset.action;
        const item = button.closest('.resume-result-item');
        const callButton = item.querySelector('.call');
        const scheduleButton = item.querySelector('.schedule');

        // Disable both buttons to prevent double clicks
        callButton.disabled = true;
        scheduleButton.disabled = true;

        button.innerHTML = `<div class="loader" style="width:16px; height:16px; border-color: #fff; border-top-color: transparent; margin: auto;"></div>`;

        const interviewData = {
            candidate_name: item.dataset.name,
            phone_number: item.dataset.phone,
            skills_to_assess: item.dataset.skills,
            job_description: item.dataset.jd,
            job_position: DOMElements.jdText.value.substring(0, 50) + "...",
            resume_filename: item.dataset.resumeFilename
        };

        try {
            // Step 1: Always create the interview record first.
            const createResponse = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(interviewData) });
            if (!createResponse.ok) throw new Error('Failed to schedule interview');
            const newInterview = await createResponse.json();

            // Step 2: If the action is "call", initiate the call immediately.
            if (action === 'call') {
                const callResponse = await fetch(`/api/interviews/${newInterview.id}/start-call`, { method: 'POST' });
                if (!callResponse.ok) throw new Error('Scheduled, but failed to start call.');
                showToast(`Calling ${interviewData.candidate_name}...`, 'info');
            } else {
                showToast(`Interview for ${interviewData.candidate_name} scheduled!`, 'success');
            }
            
            // Mark both buttons as success
            callButton.textContent = 'Done ✔';
            scheduleButton.textContent = 'Done ✔';
            callButton.classList.add('success');
            scheduleButton.classList.add('success');
            refreshActiveData();

        } catch (error) {
            showToast(error.message, 'error');
            // Re-enable buttons on failure
            callButton.textContent = 'Initiate Call';
            scheduleButton.textContent = 'Schedule for Later';
            callButton.disabled = false;
            scheduleButton.disabled = false;
        }
    };

    // Handler for uploading a resume from the Talent Pool
    const handleTalentPoolResumeUpload = async (e) => {
        const input = e.target;
        if (!input.classList.contains('upload-resume-input')) return;

        const file = input.files[0];
        if (!file) return;

        const interviewId = input.dataset.interviewId;
        const formData = new FormData();
        formData.append('resume', file);

        const label = document.querySelector(`label[for="upload-${interviewId}"]`);
        label.textContent = 'Uploading...';

        try {
            const response = await fetch(`/api/interviews/${interviewId}/upload-resume`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            showToast('Resume uploaded successfully!', 'success');
            fetchTalentPool(); // Refresh the list to show the "View" link
        } catch (error) {
            showToast(error.message, 'error');
            label.textContent = 'Upload'; // Reset on failure
        }
    };

    const handleListClick = async (e) => { const card = e.target.closest('.interview-card'); if (!card) return; const id = card.dataset.interviewId; if (e.target.closest('.call-btn')) { e.stopPropagation(); const callBtn = e.target.closest('.call-btn'); callBtn.disabled = true; callBtn.innerHTML = '<div class="loader" style="border-top-color: var(--accent-indigo);"></div>'; try { const response = await fetch(`/api/interviews/${id}/start-call`, { method: 'POST' }); if (!response.ok) throw new Error('Failed to start call'); const data = await response.json(); showToast(`Calling ${data.candidate_name}...`, 'info'); refreshActiveData(); } catch (error) { showToast(error.message, 'error'); refreshActiveData(); } } else { openDetailsPanel(id); } };
    const handleDeleteClick = async () => { const ids = Array.from(document.querySelectorAll('#interview-list-body .interview-checkbox:checked')).map(cb => cb.dataset.id); if (ids.length === 0) return; if (confirm(`Are you sure you want to delete ${ids.length} interview(s)?`)) { try { const response = await fetch('/api/interviews/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); if (!response.ok) throw new Error('Deletion failed'); showToast('Interviews deleted successfully!'); refreshActiveData(); } catch (error) { showToast(error.message, 'error'); } } };
    
    // --- EVENT LISTENERS ---
    // This is where the application comes to life, connecting user actions to the handler functions.
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);

    // Listeners for the file staging UI
    DOMElements.addResumesBtn.addEventListener('click', () => {
        DOMElements.resumeFilesInput.click(); // Open file browser
    });

    DOMElements.resumeFilesInput.addEventListener('change', (e) => {
        // Add newly selected files to our `stagedFiles` array
        if (e.target.files.length > 0) {
            stagedFiles.push(...e.target.files);
            renderStagedFiles(); // Update the UI
        }
        // Clear the input so the user can select the same file again if they remove it
        e.target.value = ''; 
    });

    DOMElements.stagedFilesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-file-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index, 10);
            stagedFiles.splice(indexToRemove, 1); // Remove file from the array
            renderStagedFiles(); // Re-render the list
        }
    });

    DOMElements.searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter' || DOMElements.searchInput.value === '') { state.currentSearch = DOMElements.searchInput.value; state.currentPage = 1; state.talentPoolPage = 1; refreshActiveData(); } });
    
    DOMElements.newInterviewBtn.addEventListener('click', () => { 
        DOMElements.createModal.classList.remove('hidden');
        fetchJds();
        // Reset the staging area when the modal is opened
        stagedFiles = [];
        renderStagedFiles();
    });

    DOMElements.createModalCloseBtn.addEventListener('click', () => { DOMElements.createModal.classList.add('hidden'); DOMElements.screenResumesForm.classList.remove('hidden'); DOMElements.resumeResultsContainer.classList.add('hidden'); });
    DOMElements.modalTabs.forEach(tab => tab.addEventListener('click', () => { DOMElements.modalTabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); DOMElements.tabContents.forEach(c => c.classList.add('hidden')); document.getElementById(tab.dataset.tab).classList.remove('hidden'); }));
    DOMElements.manualForm.addEventListener('submit', handleManualFormSubmit);
    DOMElements.screenResumesForm.addEventListener('submit', handleScreenResumesSubmit);
    DOMElements.interviewListBody.addEventListener('click', handleListClick);
    
    DOMElements.talentPoolList.addEventListener('change', handleTalentPoolResumeUpload);

    DOMElements.upNextList.addEventListener('click', (e) => { const item = e.target.closest('.up-next-item'); if (item) { openDetailsPanel(item.dataset.interviewId); } });
    
    DOMElements.resumeResultsList.addEventListener('click', (e) => {
        const button = e.target.closest('.screening-action-btn');
        if (button) {
            handleScreeningAction(button);
        }
    });

    DOMElements.screenAgainBtn.addEventListener('click', () => { 
        DOMElements.screenResumesForm.classList.remove('hidden');
        DOMElements.resumeResultsContainer.classList.add('hidden');
        DOMElements.screenResumesForm.reset();
        DOMElements.jdText.value = '';
        // Reset the staging area
        stagedFiles = [];
        renderStagedFiles();
    });

    DOMElements.saveJdCheckbox.addEventListener('change', () => DOMElements.jdTitleInput.classList.toggle('hidden', !DOMElements.saveJdCheckbox.checked));
    DOMElements.savedJdSelect.addEventListener('change', () => { const option = DOMElements.savedJdSelect.options[DOMElements.savedJdSelect.selectedIndex]; if (option.value) DOMElements.jdText.value = option.dataset.description; });
    DOMElements.filterBtns.forEach(btn => btn.addEventListener('click', () => { DOMElements.filterBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); state.currentStatus = btn.dataset.status; state.currentPage = 1; fetchAndRenderInterviews(); }));
    document.body.addEventListener('click', (e) => {
        if(e.target.closest('.pagination-controls')) {
            const btn = e.target.closest('.nav-btn, .page-btn');
            if(!btn) return;
            const isInterview = btn.dataset.pageType === 'interviewPage';
            let currentPage = isInterview ? state.currentPage : state.talentPoolPage;
            if(btn.classList.contains('prev-btn')) currentPage--;
            else if(btn.classList.contains('next-btn')) currentPage++;
            else currentPage = parseInt(btn.dataset.page);
            if(isInterview) { state.currentPage = currentPage; fetchAndRenderInterviews(); }
            else { state.talentPoolPage = currentPage; fetchTalentPool(); }
        }
        if (e.target.closest('#notification-btn')) { DOMElements.notificationDropdown.classList.toggle('hidden'); } 
        else if (!e.target.closest('.notification-wrapper')) { DOMElements.notificationDropdown.classList.add('hidden'); }
    });
    DOMElements.selectAllCheckbox.addEventListener('change', () => { document.querySelectorAll('#interview-list-body .interview-checkbox').forEach(cb => cb.checked = DOMElements.selectAllCheckbox.checked); DOMElements.deleteSelectedBtn.classList.toggle('hidden', !DOMElements.selectAllCheckbox.checked); });
    DOMElements.interviewListBody.addEventListener('change', (e) => { if(e.target.classList.contains('interview-checkbox')) { const anyChecked = document.querySelectorAll('#interview-list-body .interview-checkbox:checked').length > 0; DOMElements.deleteSelectedBtn.classList.toggle('hidden', !anyChecked); } });
    DOMElements.deleteSelectedBtn.addEventListener('click', handleDeleteClick);

    // Initial load: This kicks everything off when the page is first visited.
    handleRouting();
    renderStagedFiles(); // Initial render of the (empty) staging area
});