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

// ── Load datasets from localStorage (or seed) ─────────────────
const seedStudents = [
  { id:'STU-001', first:'Emma',    last:'Johnson',  email:'emma.j@student.edu',    phone:'+1 555 101 2020', dept:'Computer Science',        courses:['CS101','CS201','MATH201'], enrolled:'Aug 2024' },
  { id:'STU-002', first:'Liam',    last:'Williams', email:'liam.w@student.edu',     phone:'+1 555 202 3030', dept:'Engineering',             courses:['ENG101','PHYS101','MATH101'], enrolled:'Aug 2024' },
  { id:'STU-003', first:'Olivia',  last:'Brown',    email:'olivia.b@student.edu',   phone:'+1 555 303 4040', dept:'Business Administration', courses:['BUS101','ECON101'], enrolled:'Jul 2024' },
  { id:'STU-004', first:'Noah',    last:'Garcia',   email:'noah.g@student.edu',     phone:'+1 555 404 5050', dept:'Mathematics',             courses:['MATH301','MATH401','CS102'], enrolled:'Jul 2024' },
  { id:'STU-005', first:'Ava',     last:'Martinez', email:'ava.m@student.edu',      phone:'+1 555 505 6060', dept:'Natural Sciences',        courses:['BIO101','CHEM101'], enrolled:'Jun 2024' },
  { id:'STU-006', first:'William', last:'Davis',    email:'will.d@student.edu',     phone:'+1 555 606 7070', dept:'Computer Science',        courses:['CS101','CS301','WEB101'], enrolled:'Aug 2024' },
  { id:'STU-007', first:'Sophia',  last:'Wilson',   email:'sophia.w@student.edu',   phone:'+1 555 707 8080', dept:'Arts & Humanities',       courses:['ART101','LIT201'], enrolled:'Sep 2024' },
  { id:'STU-008', first:'James',   last:'Anderson', email:'james.a@student.edu',    phone:'+1 555 808 9090', dept:'Engineering',             courses:['ENG201','ENG301','PHYS201'], enrolled:'Aug 2024' },
  { id:'STU-009', first:'Isabella',last:'Thomas',   email:'bella.t@student.edu',    phone:'+1 555 909 0101', dept:'Business Administration', courses:['BUS201','MKT101','BUS301'], enrolled:'Jun 2024' },
  { id:'STU-010', first:'Oliver',  last:'Jackson',  email:'oliver.j@student.edu',   phone:'+1 555 010 1212', dept:'Natural Sciences',        courses:['CHEM201','BIO201','CHEM301'], enrolled:'Sep 2024' },
  { id:'STU-011', first:'Mia',     last:'White',    email:'mia.w@student.edu',      phone:'+1 555 111 2323', dept:'Mathematics',             courses:['MATH101','STAT101'], enrolled:'Aug 2024' },
  { id:'STU-012', first:'Ethan',   last:'Harris',   email:'ethan.h@student.edu',    phone:'+1 555 212 3434', dept:'Computer Science',        courses:['CS201','CS401','AI101'], enrolled:'Jul 2024' },
];
const seedDepts = [
  { id:'DEPT-01', name:'Computer Science',        head:'Dr. Alan Turing',       students:412, courses:['CS101','CS201','CS301','CS401','AI101','WEB101'] },
  { id:'DEPT-02', name:'Business Administration', head:'Prof. Peter Drucker',   students:380, courses:['BUS101','BUS201','BUS301','MKT101','ECON101'] },
  { id:'DEPT-03', name:'Engineering',             head:'Dr. Nikola Tesla',      students:355, courses:['ENG101','ENG201','ENG301','PHYS101','PHYS201'] },
  { id:'DEPT-04', name:'Natural Sciences',        head:'Dr. Marie Curie',       students:290, courses:['BIO101','BIO201','CHEM101','CHEM201','CHEM301'] },
  { id:'DEPT-05', name:'Arts & Humanities',       head:'Prof. Frida Kahlo',     students:240, courses:['ART101','LIT201','HIS101','PHI101'] },
  { id:'DEPT-06', name:'Mathematics',             head:'Dr. Katherine Johnson', students:195, courses:['MATH101','MATH201','MATH301','MATH401','STAT101'] },
];
const seedCourses = [
  { id:'C001', code:'CS101',   name:'Introduction to Programming',  dept:'Computer Science',        instructor:'Prof. Alan Turing',      credits:3, enrolled:312 },
  { id:'C002', code:'MATH201', name:'Calculus I',                   dept:'Mathematics',             instructor:'Dr. Katherine Johnson',  credits:4, enrolled:289 },
  { id:'C003', code:'BUS101',  name:'Principles of Management',     dept:'Business Administration', instructor:'Prof. Peter Drucker',    credits:3, enrolled:271 },
  { id:'C004', code:'ENG101',  name:'Circuit Analysis',             dept:'Engineering',             instructor:'Dr. Nikola Tesla',       credits:4, enrolled:244 },
  { id:'C005', code:'STAT101', name:'Statistics',                   dept:'Mathematics',             instructor:'Dr. Florence Nightingale', credits:3, enrolled:238 },
  { id:'C006', code:'WEB101',  name:'Web Development',              dept:'Computer Science',        instructor:'Prof. Tim Berners-Lee',  credits:3, enrolled:220 },
  { id:'C007', code:'CS201',   name:'Data Structures & Algorithms', dept:'Computer Science',        instructor:'Prof. Donald Knuth',     credits:4, enrolled:198 },
  { id:'C008', code:'BIO101',  name:'Biology I',                    dept:'Natural Sciences',        instructor:'Dr. Charles Darwin',     credits:3, enrolled:186 },
  { id:'C009', code:'CHEM101', name:'General Chemistry',            dept:'Natural Sciences',        instructor:'Dr. Marie Curie',        credits:4, enrolled:175 },
  { id:'C010', code:'ECON101', name:'Microeconomics',               dept:'Business Administration', instructor:'Prof. Adam Smith',       credits:3, enrolled:168 },
];

function getData(key, seed) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seed));
}

const students   = getData('educore_students', seedStudents).filter(s => !s.deleted);
const departments = getData('educore_departments', seedDepts);
const courses     = getData('educore_courses', seedCourses);

// ── KPI cards ─────────────────────────────────────────────────
const kpiData = [
  { label:'Total Students',    value: students.length.toLocaleString(),   accent:'#4f46e5', bg:'#eef2ff', badge:'+12%',  badgeClass:'up',
    icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { label:'Departments',       value: departments.length,                  accent:'#7c3aed', bg:'#f5f3ff', badge:'Stable', badgeClass:'neutral',
    icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { label:'Active Courses',    value: courses.length,                      accent:'#0891b2', bg:'#ecfeff', badge:'+5 new', badgeClass:'up',
    icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
  { label:'Avg Courses/Student', value: students.length ? (students.reduce((a, s) => a + (s.courses || []).length, 0) / students.length).toFixed(1) : '0', accent:'#059669', bg:'#ecfdf5', badge:'+0.3', badgeClass:'up',
    icon:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
];

const kpiGrid = document.getElementById('kpi-grid');
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
      <div class="kpi-value" data-target="${k.value}">${k.value}</div>
    </div>
    <span class="kpi-badge ${k.badgeClass}">${k.badge}</span>`;
  kpiGrid.appendChild(card);
});

// ── Department bar chart ──────────────────────────────────────
const deptChart  = document.getElementById('dept-chart');
const maxStudents = Math.max(...departments.map(d => d.students));
const deptColors  = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];

departments.forEach((d, i) => {
  const pct = Math.round((d.students / maxStudents) * 100);
  const row = document.createElement('div');
  row.className = 'chart-row';
  row.innerHTML = `
    <div class="chart-row-label"><span>${d.name}</span><span>${d.students.toLocaleString()}</span></div>
    <div class="bar-track"><div class="bar-fill" data-w="${pct}" style="width:0%;background:${deptColors[i % deptColors.length]}"></div></div>`;
  deptChart.appendChild(row);
});
setTimeout(() => {
  deptChart.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
}, 200);

// ── Top courses rank list ─────────────────────────────────────
const sortedCourses = [...courses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 8);
const maxEnrolled   = sortedCourses[0]?.enrolled || 1;
const courseRankList = document.getElementById('course-rank-list');

sortedCourses.forEach((c, i) => {
  const pct  = Math.round((c.enrolled / maxEnrolled) * 100);
  const item = document.createElement('div');
  item.className = 'rank-item';
  item.innerHTML = `
    <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
    <div class="rank-name">${c.name}</div>
    <div class="rank-bar-wrap"><div class="rank-bar" data-w="${pct}" style="width:0%"></div></div>
    <div class="rank-count">${c.enrolled}</div>`;
  courseRankList.appendChild(item);
});
setTimeout(() => {
  courseRankList.querySelectorAll('.rank-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
}, 250);

// ── Row counts ────────────────────────────────────────────────
document.getElementById('student-rows-count').textContent = `${students.length} rows`;
document.getElementById('dept-rows-count').textContent    = `${departments.length} rows`;
document.getElementById('course-rows-count').textContent  = `${courses.length} rows`;

// ── CSV Export engine ─────────────────────────────────────────
/**
 * csvEscape — wraps a value in quotes if it contains commas, quotes, or newlines.
 * @param {*} val
 * @returns {string}
 */
function csvEscape(val) {
  const str = String(val === null || val === undefined ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * buildCSV — converts an array of objects to a CSV string.
 * @param {string[]} headers - Column header labels
 * @param {Array<Array<*>>} rows - Array of value arrays
 * @returns {string}
 */
function buildCSV(headers, rows) {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines  = rows.map(row => row.map(csvEscape).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * downloadCSV — triggers a browser download for a CSV string.
 * @param {string} csv - The CSV content
 * @param {string} filename - Download file name
 */
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
    const headers = ['Student ID','First Name','Last Name','Email','Phone','Department','Enrolled Courses','Enrollment Date'];
    const rows    = students.map(s => [s.id, s.first, s.last, s.email, s.phone || '', s.dept, (s.courses || []).join('; '), s.enrolled || '']);
    return { csv: buildCSV(headers, rows), filename: `educore_students_${timestamp()}.csv`, title: 'Student Records' };
  },
  departments() {
    const headers = ['Department ID','Department Name','Department Head','Student Count','Course Count','Courses'];
    const rows    = departments.map(d => [d.id, d.name, d.head, d.students, (d.courses || []).length, (d.courses || []).join('; ')]);
    return { csv: buildCSV(headers, rows), filename: `educore_departments_${timestamp()}.csv`, title: 'Department Summary' };
  },
  courses() {
    const headers = ['Course ID','Course Code','Course Name','Department','Instructor','Credits','Enrolled Students'];
    const rows    = courses.map(c => [c.id, c.code, c.name, c.dept, c.instructor || '', c.credits, c.enrolled]);
    return { csv: buildCSV(headers, rows), filename: `educore_courses_${timestamp()}.csv`, title: 'Course Catalogue' };
  },
  analytics() {
    const headers = ['Department','Students','Growth %','Course Count','Avg Students/Course'];
    const growthMap = { 'Computer Science':'12.4','Business Administration':'8.7','Engineering':'10.2','Natural Sciences':'6.5','Arts & Humanities':'4.1','Mathematics':'9.8' };
    const rows = departments.map(d => {
      const courseCount = (d.courses || []).length;
      const avgPerCourse = courseCount ? (d.students / courseCount).toFixed(1) : '0';
      return [d.name, d.students, growthMap[d.name] || '5.0', courseCount, avgPerCourse];
    });
    return { csv: buildCSV(headers, rows), filename: `educore_analytics_${timestamp()}.csv`, title: 'Enrollment Analytics' };
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

// Individual chart export buttons
document.getElementById('export-dept-btn').addEventListener('click',    () => triggerExport('departments'));
document.getElementById('export-courses-btn').addEventListener('click', () => triggerExport('courses'));

// Export all
document.getElementById('export-all-btn').addEventListener('click', () => {
  ['students','departments','courses','analytics'].forEach((type, i) => {
    setTimeout(() => triggerExport(type), i * 300);
  });
});

// Clear log
document.getElementById('clear-log-btn').addEventListener('click', () => {
  exportLog = [];
  renderLog();
});

// ── Init log ──────────────────────────────────────────────────
renderLog();
