/**
 * js/reports.js — EduCore Analytics & Reports
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 * Includes a working CSV export routine for multiple datasets.
 */

'use strict';

// ── 1. Auth guard ─────────────────────────────────────────────
EduAuth.guard();

// ── 2. Topbar + sidebar init ──────────────────────────────────
EduAuth.initTopbar();
EduAuth.initSidebar();

// ── Live Dataset Storage ──────────────────────────────────────
let students = [];
let departments = [];
let courses = [];

async function loadReportsData() {
  try {
    const [resS, resD, resC] = await Promise.all([
      fetch('http://localhost:5000/api/students', { headers: EduAuth.getAuthHeaders() }).catch(() => null),
      fetch('http://localhost:5000/api/departments', { headers: EduAuth.getAuthHeaders() }).catch(() => null),
      fetch('http://localhost:5000/api/courses', { headers: EduAuth.getAuthHeaders() }).catch(() => null)
    ]);

    if (resS && resS.ok) {
      const dataS = await resS.json();
      if (dataS.success) students = (dataS.data || []).filter(s => !s.is_deleted);
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
    console.error('Error fetching reports data:', error);
  }

  renderKPIs();
  renderDeptChart();
  renderCourseRankings();
  renderRowCounts();
}

// ── KPI cards ─────────────────────────────────────────────────
function renderKPIs() {
  const kpiGrid = document.getElementById('kpi-grid');
  if (!kpiGrid) return;
  kpiGrid.innerHTML = '';

  const totalStudents = students.length;
  const totalDepts = departments.length;
  const totalCourses = courses.length;
  const totalEnrolledSum = courses.reduce((acc, c) => acc + (Number(c.enrolled) || 0), 0);
  const avgCourses = totalStudents ? (totalEnrolledSum / totalStudents).toFixed(1) : '0';

  const kpiData = [
    { label:'Total Students',    value: totalStudents.toLocaleString(),   accent:'#4f46e5', bg:'#eef2ff', badge:'Live', badgeClass:'up',
      icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { label:'Departments',       value: totalDepts,                        accent:'#7c3aed', bg:'#f5f3ff', badge:'Active', badgeClass:'neutral',
      icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { label:'Active Courses',    value: totalCourses,                      accent:'#0891b2', bg:'#ecfeff', badge:'Catalog', badgeClass:'up',
      icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
    { label:'Avg Courses/Student', value: avgCourses,                      accent:'#059669', bg:'#ecfdf5', badge:'Metric', badgeClass:'up',
      icon:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
  ];

  kpiData.forEach(k => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.style.cssText = `--accent:${k.accent};--accent-bg:${k.bg}`;
    card.innerHTML = `
      <div class="kpi-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
      </div>
      <span class="kpi-badge ${k.badgeClass}">${k.badge}</span>`;
    kpiGrid.appendChild(card);
  });
}

// ── Department bar chart ──────────────────────────────────────
function renderDeptChart() {
  const deptChart = document.getElementById('dept-chart');
  if (!deptChart) return;
  deptChart.innerHTML = '';

  const maxStudents = Math.max(...departments.map(d => Number(d.student_count || d.students) || 0), 1);
  const deptColors  = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];

  if (departments.length === 0) {
    deptChart.innerHTML = '<div style="padding:16px;color:var(--text-secondary);">No department data found.</div>';
    return;
  }

  departments.forEach((d, i) => {
    const count = Number(d.student_count || d.students) || 0;
    const pct = Math.round((count / maxStudents) * 100);
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <div class="chart-row-label"><span>${d.name}</span><span>${count.toLocaleString()}</span></div>
      <div class="bar-track"><div class="bar-fill" data-w="${pct}" style="width:0%;background:${deptColors[i % deptColors.length]}"></div></div>`;
    deptChart.appendChild(row);
  });

  setTimeout(() => {
    deptChart.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 200);
}

// ── Top courses rank list ─────────────────────────────────────
function renderCourseRankings() {
  const courseRankList = document.getElementById('course-rank-list');
  if (!courseRankList) return;
  courseRankList.innerHTML = '';

  const sortedCourses = [...courses].sort((a, b) => (Number(b.enrolled) || 0) - (Number(a.enrolled) || 0)).slice(0, 8);
  const maxEnrolled   = Number(sortedCourses[0]?.enrolled) || 1;

  if (sortedCourses.length === 0) {
    courseRankList.innerHTML = '<div style="padding:16px;color:var(--text-secondary);">No course data found.</div>';
    return;
  }

  sortedCourses.forEach((c, i) => {
    const enrolled = Number(c.enrolled) || 0;
    const pct  = Math.round((enrolled / maxEnrolled) * 100);
    const item = document.createElement('div');
    item.className = 'rank-item';
    item.innerHTML = `
      <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
      <div class="rank-name">${c.name} (${c.code || ''})</div>
      <div class="rank-bar-wrap"><div class="rank-bar" data-w="${pct}" style="width:0%"></div></div>
      <div class="rank-count">${enrolled}</div>`;
    courseRankList.appendChild(item);
  });

  setTimeout(() => {
    courseRankList.querySelectorAll('.rank-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 250);
}

// ── Row counts ────────────────────────────────────────────────
function renderRowCounts() {
  const sEl = document.getElementById('student-rows-count');
  const dEl = document.getElementById('dept-rows-count');
  const cEl = document.getElementById('course-rows-count');

  if (sEl) sEl.textContent = `${students.length} rows`;
  if (dEl) dEl.textContent = `${departments.length} rows`;
  if (cEl) cEl.textContent = `${courses.length} rows`;
}

// ── CSV Export engine ─────────────────────────────────────────
function csvEscape(val) {
  const str = String(val === null || val === undefined ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers, rows) {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines  = rows.map(row => row.map(csvEscape).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Dataset builders ──────────────────────────────────────────
const exportBuilders = {
  students() {
    const headers = ['Student ID','Name','Email','Phone','Department','Enrolled Courses'];
    const rows    = students.map(s => [
      s.id,
      s.name || `${s.first || ''} ${s.last || ''}`.trim(),
      s.email || '',
      s.phone || '',
      s.department_name || s.dept || '',
      Array.isArray(s.courses) ? s.courses.join('; ') : (s.courses || '')
    ]);
    return { csv: buildCSV(headers, rows), filename: `students_export_${timestamp()}.csv`, title: 'Student Records' };
  },
  departments() {
    const headers = ['Department ID','Department Name','Student Count','Course Count'];
    const rows    = departments.map(d => [
      d.id,
      d.name,
      d.student_count || d.students || 0,
      d.course_count || d.courses_count || 0
    ]);
    return { csv: buildCSV(headers, rows), filename: `departments_export_${timestamp()}.csv`, title: 'Department Summary' };
  },
  courses() {
    const headers = ['Course ID','Course Code','Course Name','Department','Instructor','Credits','Enrolled Students'];
    const rows    = courses.map(c => [
      c.id,
      c.code || '',
      c.name,
      c.department_name || c.dept || '',
      c.instructor || '',
      c.credits || 3,
      c.enrolled || 0
    ]);
    return { csv: buildCSV(headers, rows), filename: `courses_export_${timestamp()}.csv`, title: 'Course Catalogue' };
  },
  analytics() {
    const headers = ['Department','Students','Course Count','Avg Students/Course'];
    const rows = departments.map(d => {
      const sCount = Number(d.student_count || d.students) || 0;
      const cCount = Number(d.course_count || d.courses_count) || 0;
      const avgPerCourse = cCount ? (sCount / cCount).toFixed(1) : '0';
      return [d.name, sCount, cCount, avgPerCourse];
    });
    return { csv: buildCSV(headers, rows), filename: `analytics_export_${timestamp()}.csv`, title: 'Enrollment Analytics' };
  },
};

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

// ── Export log ─────────────────────────────────────────────────
let exportLog = [];

function addLogEntry(title, filename, bytes) {
  exportLog.unshift({ title, filename, bytes, time: new Date().toLocaleTimeString() });
  renderLog();
}

function renderLog() {
  const logEl = document.getElementById('export-log');
  if (!logEl) return;
  if (exportLog.length === 0) {
    logEl.innerHTML = '<p class="log-empty">No exports yet. Use the workspace above to generate your first report.</p>';
    return;
  }
  logEl.innerHTML = exportLog.map(e => `
    <div class="log-entry">
      <div class="log-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="log-info">
        <div class="log-title">${e.title} — <code style="font-size:.75rem">${e.filename}</code></div>
        <div class="log-time">Downloaded at ${e.time}</div>
      </div>
      <span class="log-size">${formatBytes(e.bytes)}</span>
    </div>`).join('');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ── Toast ─────────────────────────────────────────────────────
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Wire up export buttons ────────────────────────────────────
function triggerExport(type) {
  const builder = exportBuilders[type];
  if (!builder) return;
  const { csv, filename, title } = builder();
  downloadCSV(csv, filename);
  const bytes = new Blob([csv]).size;
  addLogEntry(title, filename, bytes);
  showToast(`✓ ${title} exported as ${filename}`);
}

document.querySelectorAll('.btn-export').forEach(btn => {
  btn.addEventListener('click', () => triggerExport(btn.dataset.type));
});

const exportDeptBtn = document.getElementById('export-dept-btn');
if (exportDeptBtn) exportDeptBtn.addEventListener('click', () => triggerExport('departments'));

const exportCoursesBtn = document.getElementById('export-courses-btn');
if (exportCoursesBtn) exportCoursesBtn.addEventListener('click', () => triggerExport('courses'));

const exportAllBtn = document.getElementById('export-all-btn');
if (exportAllBtn) {
  exportAllBtn.addEventListener('click', () => {
    ['students','departments','courses','analytics'].forEach((type, i) => {
      setTimeout(() => triggerExport(type), i * 300);
    });
  });
}

const clearLogBtn = document.getElementById('clear-log-btn');
if (clearLogBtn) {
  clearLogBtn.addEventListener('click', () => {
    exportLog = [];
    renderLog();
  });
}

// ── Init ──────────────────────────────────────────────────────
loadReportsData();
renderLog();

