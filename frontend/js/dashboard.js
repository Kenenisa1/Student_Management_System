/**
 * js/dashboard.js — EduCore Dashboard
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 */

'use strict';

// ── 1. Auth guard — admins and superadmins only ───────────────
EduAuth.guard(['admin', 'superadmin']);

// ── 2. Welcome message ─────────────────────────────────────────
const _dashUser = EduAuth.getUser();
const _welcomeEl = document.getElementById('admin-welcome');
if (_dashUser && _welcomeEl) {
  _welcomeEl.textContent = `Welcome back, ${_dashUser.name} — here's what's happening today.`;
}

// ── 3. Populate topbar date, user chip, and wire logout ────────
EduAuth.initTopbar();

// ── 4. Wire sidebar hamburger / overlay / close ────────────────
EduAuth.initSidebar();

// ── Helper to animate counter ──────────────────────────────────
function animateCounter(el, targetVal) {
  if (!el) return;
  const target = Number(targetVal) || 0;
  const dur    = 1000;
  const start  = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Main Dashboard Loader ─────────────────────────────────────
async function loadDashboardData() {
  let students = [];
  let departments = [];
  let courses = [];

  try {
    const [resS, resD, resC] = await Promise.all([
      fetch('http://localhost:5000/api/students', { headers: EduAuth.getAuthHeaders() }).catch(() => null),
      fetch('http://localhost:5000/api/departments', { headers: EduAuth.getAuthHeaders() }).catch(() => null),
      fetch('http://localhost:5000/api/courses', { headers: EduAuth.getAuthHeaders() }).catch(() => null)
    ]);

    if (resS && resS.ok) {
      const dataS = await resS.json();
      if (dataS.success) students = dataS.data || [];
    }

    if (resD && resD.ok) {
      const dataD = await resD.json();
      if (dataD.success) departments = dataD.data || [];
    }

    if (resC && resC.ok) {
      const dataC = await resC.json();
      if (dataC.success) courses = dataC.data || [];
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  // 1. Update Stat Counters (using IDs from the dashboard HTML)
  const totalStudents = students.filter(s => !s.is_deleted).length;
  const totalDepts    = departments.length;
  const totalCourses  = courses.length;

  animateCounter(document.getElementById('stat-students'), totalStudents);
  animateCounter(document.getElementById('stat-depts'),    totalDepts);
  animateCounter(document.getElementById('stat-courses'),  totalCourses);

  const sb = document.getElementById('stat-students-badge');
  if (sb) sb.textContent = totalStudents + ' active';
  const cb = document.getElementById('stat-courses-badge');
  if (cb) cb.textContent = totalCourses + ' courses';

  // 2. Department Enrollment Bars
  const deptBars = document.getElementById('dept-bars');
  if (deptBars) {
    deptBars.innerHTML = '';
    const deptColors = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    
    // Calculate student count per dept
    const deptStats = departments.map((d, i) => {
      const studentCount = Number(d.student_count || d.students) || 0;
      return { name: d.name, students: studentCount, color: deptColors[i % deptColors.length] };
    });

    const maxStudents = Math.max(...deptStats.map(d => d.students), 1);

    if (deptStats.length === 0) {
      deptBars.innerHTML = '<div style="padding:12px;color:var(--text-secondary);">No department data available.</div>';
    } else {
      deptStats.forEach(d => {
        const pct = Math.round((d.students / maxStudents) * 100);
        const row = document.createElement('div');
        row.className = 'dept-row';
        row.innerHTML = `
          <div class="dept-row-label">
            <span>${d.name}</span>
            <span>${d.students.toLocaleString()}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" data-w="${pct}"
                 style="width:0%;background:${d.color}"></div>
          </div>`;
        deptBars.appendChild(row);
      });

      setTimeout(() => {
        deptBars.querySelectorAll('.bar-fill').forEach(b => {
          b.style.width = b.dataset.w + '%';
        });
      }, 150);
    }
  }

  // 3. Top Courses List
  const courseList = document.getElementById('course-list');
  if (courseList) {
    courseList.innerHTML = '';
    const sortedCourses = [...courses].sort((a, b) => (Number(b.enrolled) || 0) - (Number(a.enrolled) || 0)).slice(0, 6);

    if (sortedCourses.length === 0) {
      courseList.innerHTML = '<div style="padding:12px;color:var(--text-secondary);">No course data available.</div>';
    } else {
      sortedCourses.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'course-item';
        item.innerHTML = `
          <div class="course-rank">${i + 1}</div>
          <div class="course-name">${c.name} (${c.code || ''})</div>
          <div class="course-count">${c.enrolled || 0} students</div>`;
        courseList.appendChild(item);
      });
    }
  }

  // 4. Recent Students Table
  const recentTbody = document.getElementById('recent-students');
  if (recentTbody) {
    recentTbody.innerHTML = '';
    const activeStudents = students.filter(s => !s.is_deleted).slice(0, 5);

    if (activeStudents.length === 0) {
      recentTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;">No recent students found.</td></tr>';
    } else {
      activeStudents.forEach(s => {
        const tr = document.createElement('tr');
        const enrolledDate = s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Active';
        const deptName = esc(s.department_name || s.dept || 'Unassigned');
        tr.innerHTML = `
          <td style="font-weight:600;color:var(--text-primary)">${esc(s.name)}</td>
          <td>${esc(s.email || '')}</td>
          <td>${deptName}</td>
          <td>${enrolledDate}</td>`;
        recentTbody.appendChild(tr);
      });
    }
  }
}

// Helper: basic HTML escape
function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Trigger load on startup
loadDashboardData();
