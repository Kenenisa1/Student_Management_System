/**
 * js/teacher-home.js — JU Teacher Portal
 */

const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', async () => {
    EduAuth.guard(['teacher']);

    const user = EduAuth.getUser();
    if (!user) return;

    // ── Welcome ──────────────────────────────────────────────────
    const firstName = (user.name || 'Teacher').split(' ')[0];
    setEl('welcome-name', firstName);
    setEl('welcome-date', new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
    setEl('sb-avatar', initials(user.name));
    setEl('sb-name',   user.name);
    setEl('sb-email',  user.email);

    // ── Tab wiring ────────────────────────────────────────────────
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); switchTab(link.dataset.tab); });
    });

    // ── Fetch profile + courses from API ──────────────────────────
    try {
        const res  = await EduAuth.apiFetch(`${API_BASE}/api/profile/me`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const profile = data.profile;
        const courses = data.courses || [];

        renderStats(courses);
        renderOverview(courses);
        renderCourseAccordion(courses);
        renderProfile(profile);

    } catch (err) {
        console.error('[teacher-home]', err.message);
        setEl('stat-courses', '—');
        document.getElementById('overview-courses').innerHTML = errState('Could not load data. Ensure the backend is running.');
        document.getElementById('courses-accordion').innerHTML = errState('Could not load courses.');
    }
});

// ── Helpers ───────────────────────────────────────────────────

function setEl(id, val) { const e = document.getElementById(id); if (e) e.textContent = val || ''; }
function initials(n) { return (n||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(); }

function switchTab(tab) {
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
}

function escHtml(s) {
    return String(s||'')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function errState(msg) {
    return `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${msg}</p></div>`;
}
function emptyState(icon, msg) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

// ── Render stats ──────────────────────────────────────────────

function renderStats(courses) {
    const totalStudents = courses.reduce((s, c) => s + (c.students || []).length, 0);
    const totalGraded   = courses.reduce((s, c) => s + (c.students || []).filter(st => st.grade !== null).length, 0);
    setEl('stat-courses',  courses.length);
    setEl('stat-students', totalStudents);
    setEl('stat-graded',   totalGraded);
}

// ── Overview tab ──────────────────────────────────────────────

function renderOverview(courses) {
    const container = document.getElementById('overview-courses');
    if (!courses.length) {
        container.innerHTML = emptyState('📚', 'No courses assigned to you yet.');
        return;
    }
    container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
      ${courses.map(c => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;">
          <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#7c3aed;background:rgba(124,58,237,.09);padding:2px 8px;border-radius:6px;width:fit-content;margin-bottom:8px;">${escHtml(c.code)}</div>
          <div style="font-weight:700;font-size:.95rem;margin-bottom:4px;">${escHtml(c.name)}</div>
          <div style="font-size:.8rem;color:var(--text-secondary);">🎓 ${c.enrolled_count} student${c.enrolled_count !== 1 ? 's' : ''} enrolled</div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px;">${c.credits} credits · ${escHtml(c.department_name||'—')}</div>
        </div>`).join('')}
    </div>`;
}

// ── Course accordion with students ────────────────────────────

function renderCourseAccordion(courses) {
    const container = document.getElementById('courses-accordion');
    if (!courses.length) {
        container.innerHTML = emptyState('📚', 'No courses assigned to you yet.');
        return;
    }

    container.innerHTML = courses.map((c, idx) => {
        const students = c.students || [];
        const rows = students.length
            ? students.map(st => buildStudentRow(c.id, st)).join('')
            : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">No students enrolled yet.</td></tr>`;

        return `
          <div class="course-block" id="cb-${idx}">
            <div class="course-block-header" onclick="toggleAccordion('cb-${idx}')">
              <div class="cbh-left">
                <span class="cbh-code">${escHtml(c.code)}</span>
                <span class="cbh-name">${escHtml(c.name)}</span>
                <span class="cbh-meta">${c.credits} credits · ${escHtml(c.department_name||'—')}</span>
              </div>
              <div class="cbh-right">
                <span class="enrolled-pill">🎓 ${students.length} student${students.length !== 1 ? 's' : ''}</span>
                <span class="expand-icon">▼</span>
              </div>
            </div>
            <div class="students-panel">
              <h4>Enrolled Students &amp; Grades</h4>
              <table class="st-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th style="text-align:center">Current Grade</th>
                    <th style="text-align:center">Score (0–100)</th>
                    <th style="text-align:center">Action</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>`;
    }).join('');
}

function buildStudentRow(courseId, st) {
    const curLetter = st.letter_grade || '';
    const curScore  = st.grade !== null && st.grade !== undefined ? Number(st.grade).toFixed(1) : '';
    const gradeOptions = ['A','A-','B+','B','B-','C+','C','C-','D','F'].map(
        g => `<option value="${g}" ${curLetter===g?'selected':''}>${g}</option>`
    ).join('');
    const rowId = `row-${courseId}-${st.id}`;

    return `
      <tr id="${rowId}">
        <td><strong>${escHtml(st.name)}</strong></td>
        <td style="color:var(--text-secondary);font-size:.8rem;">${escHtml(st.email)}</td>
        <td style="text-align:center;">
          ${curLetter
            ? `<span style="padding:3px 10px;border-radius:6px;font-weight:700;font-size:.82rem;
               background:${gradeColor(curLetter)};color:#fff;">${curLetter}</span>`
            : `<span style="color:var(--text-muted);font-size:.8rem;">—</span>`}
        </td>
        <td style="text-align:center;">
          <input class="grade-num-input" type="number" min="0" max="100" step="0.5"
                 value="${curScore}" placeholder="0–100"
                 id="score-${courseId}-${st.id}" />
        </td>
        <td style="text-align:center;">
          <div class="grade-input-wrap" style="justify-content:center;flex-wrap:wrap;gap:4px;">
            <select class="grade-select" id="letter-${courseId}-${st.id}">
              <option value="">Letter</option>${gradeOptions}
            </select>
            <button class="save-grade-btn"
                    onclick="submitGrade(${courseId}, ${st.id}, '${rowId}')">
              Save
            </button>
          </div>
          <span class="grade-saved-msg" id="msg-${courseId}-${st.id}">✅ Saved</span>
        </td>
      </tr>`;
}

function gradeColor(letter) {
    const l = (letter||'').charAt(0).toUpperCase();
    return { A:'#059669', B:'#2563eb', C:'#d97706', D:'#dc2626', F:'#dc2626' }[l] || '#6b7280';
}

// ── Grade submission ──────────────────────────────────────────

async function submitGrade(courseId, studentId, rowId) {
    const scoreInput  = document.getElementById(`score-${courseId}-${studentId}`);
    const letterSelect = document.getElementById(`letter-${courseId}-${studentId}`);
    const msgEl       = document.getElementById(`msg-${courseId}-${studentId}`);

    const score  = parseFloat(scoreInput.value);
    const letter = letterSelect.value;

    if (isNaN(score) || score < 0 || score > 100) {
        scoreInput.style.borderColor = '#ef4444';
        setTimeout(() => { scoreInput.style.borderColor = ''; }, 2000);
        return;
    }

    try {
        const res  = await EduAuth.apiFetch(`${API_BASE}/api/profile/grades`, {
            method: 'POST',
            body: JSON.stringify({
                student_id:   studentId,
                course_id:    courseId,
                grade:        score,
                letter_grade: letter || null
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        msgEl.style.display = 'inline';
        setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
    } catch (err) {
        alert('Failed to save grade: ' + err.message);
    }
}

// Expose for onclick
window.submitGrade      = submitGrade;
window.toggleAccordion  = function(id) {
    document.getElementById(id).classList.toggle('open');
};

// ── Profile tab ───────────────────────────────────────────────

function renderProfile(profile) {
    setEl('profile-avatar',        initials(profile.name));
    setEl('profile-fullname',      profile.name);
    setEl('profile-email-display', profile.email);
    const nameEl  = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const deptEl  = document.getElementById('profile-dept');
    const sinceEl = document.getElementById('profile-since');
    if (nameEl)  nameEl.value  = profile.name  || '';
    if (emailEl) emailEl.value = profile.email || '';
    if (deptEl)  deptEl.value  = profile.department_id ? `Department #${profile.department_id}` : 'Not assigned';
    if (sinceEl) sinceEl.value = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' })
        : '—';
}
