/**
 * js/student-dashboard.js — JU Student Portal
 */

const API_BASE = 'http://localhost:5000';

// ── Guard: only students allowed ──────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    EduAuth.guard(['student']);

    const user = EduAuth.getUser();
    if (!user) return;

    // ── Welcome header ─────────────────────────────────────────
    const firstName = (user.name || 'Student').split(' ')[0];
    setEl('welcome-name', firstName);
    setEl('welcome-date', new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' }));

    // ── Sidebar ────────────────────────────────────────────────
    setEl('sb-avatar', initials(user.name));
    setEl('sb-name',   user.name);
    setEl('sb-email',  user.email);

    // ── Tab navigation ─────────────────────────────────────────
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    // ── Load profile + courses from API ────────────────────────
    try {
        const res  = await EduAuth.apiFetch(`${API_BASE}/api/profile/me`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        const profile = data.profile;
        const courses = data.courses || [];

        populateSidebar(profile);
        populateOverview(profile, courses);
        populateCourses(courses);
        populateGrades(courses);
        populateProfile(profile);

    } catch (err) {
        console.error('[student-dashboard]', err.message);
        showError('Could not load your dashboard data. Make sure the backend is running.');
    }

    // ── Profile form save ──────────────────────────────────────
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name  = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        if (!name) return;

        try {
            const res  = await EduAuth.apiFetch(`${API_BASE}/api/profile/me`, {
                method:  'PUT',
                body:    JSON.stringify({ name, phone })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            // Update stored user
            const stored = EduAuth.getUser();
            stored.name = name;
            localStorage.setItem('educore_user', JSON.stringify(stored));

            setEl('sb-name', name);
            setEl('sb-avatar', initials(name));
            setEl('profile-fullname', name);
            setEl('profile-avatar', initials(name));

            const fb = document.getElementById('save-feedback');
            fb.style.display = 'inline';
            setTimeout(() => { fb.style.display = 'none'; }, 2500);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        }
    });
});

// ── Helpers ───────────────────────────────────────────────────

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
}

function initials(name) {
    return (name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
}

function switchTab(tab) {
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
}

function showError(msg) {
    ['overview-courses', 'all-courses', 'grades-table-wrap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${msg}</p></div>`;
    });
}

function gradeClass(letter) {
    if (!letter) return 'grade-pending';
    const l = letter.charAt(0).toUpperCase();
    return { A:'grade-A', B:'grade-B', C:'grade-C', D:'grade-D', F:'grade-D' }[l] || 'grade-pending';
}

// ── Populate functions ────────────────────────────────────────

function populateSidebar(profile) {
    setEl('sb-avatar', initials(profile.name));
    setEl('sb-name',   profile.name);
    setEl('sb-email',  profile.email);
}

function populateOverview(profile, courses) {
    // Stats
    const graded = courses.filter(c => c.grade !== null && c.grade !== undefined);
    const avg    = graded.length ? (graded.reduce((s, c) => s + Number(c.grade), 0) / graded.length).toFixed(1) : '—';
    setEl('stat-courses', courses.length);
    setEl('stat-graded',  graded.length);
    setEl('stat-gpa',     graded.length ? avg + '%' : '—');

    // Recent courses (max 3)
    const container = document.getElementById('overview-courses');
    const recent = courses.slice(0, 3);
    container.innerHTML = recent.length ? recent.map(buildCourseCard).join('') : emptyState('📚','No courses enrolled yet.');
}

function populateCourses(courses) {
    const container = document.getElementById('all-courses');
    container.innerHTML = courses.length ? courses.map(buildCourseCard).join('') : emptyState('📚','You have no enrolled courses.');
}

function populateGrades(courses) {
    const container = document.getElementById('grades-table-wrap');
    if (!courses.length) {
        container.innerHTML = emptyState('📊','No grades to display yet.');
        return;
    }

    const rows = courses.map(c => {
        const gradeDisp = c.letter_grade
            ? `<span class="grade-badge ${gradeClass(c.letter_grade)}">${c.letter_grade}</span>`
            : `<span class="grade-badge grade-pending">Pending</span>`;
        const score = c.grade !== null && c.grade !== undefined ? `${Number(c.grade).toFixed(1)}%` : '—';
        return `<tr>
          <td><strong>${escHtml(c.code)}</strong></td>
          <td>${escHtml(c.name)}</td>
          <td>${escHtml(c.department_name || '—')}</td>
          <td>${escHtml(c.instructor_name || 'TBA')}</td>
          <td style="text-align:center">${gradeDisp}</td>
          <td style="text-align:center; color:var(--text-secondary); font-weight:600">${score}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem;">
          <thead>
            <tr style="background:var(--surface-hover,var(--bg));border-bottom:2px solid var(--border);">
              <th style="padding:12px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Code</th>
              <th style="padding:12px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Course</th>
              <th style="padding:12px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Department</th>
              <th style="padding:12px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Instructor</th>
              <th style="padding:12px 14px;text-align:center;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Grade</th>
              <th style="padding:12px 14px;text-align:center;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Score</th>
            </tr>
          </thead>
          <tbody style="border:1px solid var(--border);background:var(--surface);">${rows}</tbody>
        </table>
      </div>`;
    // Style table rows
    container.querySelectorAll('tbody tr').forEach((tr, i) => {
        tr.style.borderBottom = '1px solid var(--border)';
        tr.querySelectorAll('td').forEach(td => { td.style.padding = '12px 14px'; });
    });
}

function populateProfile(profile) {
    const av = initials(profile.name);
    setEl('profile-avatar',       av);
    setEl('profile-fullname',     profile.name);
    setEl('profile-email-display', profile.email);
    const nameInput  = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const sinceInput = document.getElementById('profile-since');
    if (nameInput)  nameInput.value  = profile.name  || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
    if (sinceInput) sinceInput.value = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })
        : '—';
}

function buildCourseCard(c) {
    const letter = c.letter_grade;
    const score  = c.grade !== null && c.grade !== undefined ? `${Number(c.grade).toFixed(1)}%` : null;
    const gradeBadge = letter
        ? `<span class="grade-badge ${gradeClass(letter)}">${letter}</span>`
        : `<span class="grade-badge grade-pending">Pending</span>`;
    const enrolledDate = c.enrolled_at
        ? new Date(c.enrolled_at).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
        : '';
    return `
      <div class="course-card">
        <div class="course-header">
          <span class="course-code">${escHtml(c.code)}</span>
          <span class="course-credits">${c.credits} cr</span>
        </div>
        <div class="course-name">${escHtml(c.name)}</div>
        <div class="course-instructor">👤 ${escHtml(c.instructor_name || 'TBA')}</div>
        <div class="course-dept">🏫 ${escHtml(c.department_name || '—')}</div>
        <div class="course-grade-row">
          ${gradeBadge}
          <span class="grade-score">${score || ''}</span>
        </div>
        ${enrolledDate ? `<div class="enrolled-on">Enrolled: ${enrolledDate}</div>` : ''}
      </div>`;
}

function emptyState(icon, msg) {
    return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

/** Basic HTML escape to prevent XSS in rendered strings */
function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
