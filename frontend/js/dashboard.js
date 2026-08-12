/**
 * js/dashboard.js — EduCore Dashboard
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 */

'use strict';

// ── 1. Auth guard — redirect immediately if not authenticated ──
EduAuth.guard();

// ── 2. Populate topbar date, user chip, and wire logout ────────
EduAuth.initTopbar();

// ── 3. Wire sidebar hamburger / overlay / close ────────────────
EduAuth.initSidebar();

// ── 4. Counter animation ──────────────────────────────────────
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  const dur    = 1200;
  const start  = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
});

// ── 5. Department enrollment bars ─────────────────────────────
const deptBars = document.getElementById('dept-bars');
if (deptBars) {
  const departments = [
    { name: 'Computer Science',        students: 412, color: '#4f46e5' },
    { name: 'Business Administration', students: 380, color: '#7c3aed' },
    { name: 'Engineering',             students: 355, color: '#0891b2' },
    { name: 'Natural Sciences',        students: 290, color: '#059669' },
    { name: 'Arts & Humanities',       students: 240, color: '#d97706' },
    { name: 'Mathematics',             students: 195, color: '#dc2626' },
  ];
  const maxStudents = Math.max(...departments.map(d => d.students));

  departments.forEach(d => {
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

  // Animate bars after paint
  setTimeout(() => {
    deptBars.querySelectorAll('.bar-fill').forEach(b => {
      b.style.width = b.dataset.w + '%';
    });
  }, 150);
}

// ── 6. Top courses list ───────────────────────────────────────
const courseList = document.getElementById('course-list');
if (courseList) {
  const courses = [
    { name: 'Introduction to Programming', count: 312 },
    { name: 'Calculus I',                  count: 289 },
    { name: 'Principles of Management',    count: 271 },
    { name: 'Circuit Analysis',            count: 244 },
    { name: 'Statistics',                  count: 238 },
    { name: 'Web Development',             count: 220 },
  ];
  courses.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'course-item';
    item.innerHTML = `
      <div class="course-rank">${i + 1}</div>
      <div class="course-name">${c.name}</div>
      <div class="course-count">${c.count}</div>`;
    courseList.appendChild(item);
  });
}

// ── 7. Recent students table ──────────────────────────────────
const recentTbody = document.getElementById('recent-students');
if (recentTbody) {
  const recentStudents = [
    { name: 'Emma Johnson',  dept: 'Computer Science', status: 'active',   enrolled: 'Aug 2024' },
    { name: 'Liam Williams', dept: 'Engineering',       status: 'active',   enrolled: 'Aug 2024' },
    { name: 'Olivia Brown',  dept: 'Business Admin.',  status: 'active',   enrolled: 'Jul 2024' },
    { name: 'Noah Garcia',   dept: 'Mathematics',       status: 'inactive', enrolled: 'Jul 2024' },
    { name: 'Ava Martinez',  dept: 'Natural Sciences',  status: 'active',   enrolled: 'Jun 2024' },
  ];
  recentStudents.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;color:var(--text-primary)">${s.name}</td>
      <td>${s.dept}</td>
      <td><span class="status-badge status-${s.status}">
        ${s.status.charAt(0).toUpperCase() + s.status.slice(1)}
      </span></td>
      <td>${s.enrolled}</td>`;
    recentTbody.appendChild(tr);
  });
}
