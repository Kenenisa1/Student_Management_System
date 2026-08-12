/**
 * js/departments.js — EduCore Departments
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 */

'use strict';

// ── 1. Auth guard ─────────────────────────────────────────────
EduAuth.guard();

// ── 2. Topbar + sidebar init ──────────────────────────────────
EduAuth.initTopbar();
EduAuth.initSidebar();

// ── Seed data ─────────────────────────────────────────────────
const seedDepts = [
  { id:'DEPT-01', name:'Computer Science',        head:'Dr. Alan Turing',       students:412, color:'#4f46e5', courses:['CS101','CS201','CS301','CS401','AI101','WEB101'], desc:'Covers algorithms, software engineering, AI, and systems programming.' },
  { id:'DEPT-02', name:'Business Administration', head:'Prof. Peter Drucker',   students:380, color:'#7c3aed', courses:['BUS101','BUS201','BUS301','MKT101','ECON101'],   desc:'Prepares students for leadership in global business and management.' },
  { id:'DEPT-03', name:'Engineering',             head:'Dr. Nikola Tesla',      students:355, color:'#0891b2', courses:['ENG101','ENG201','ENG301','PHYS101','PHYS201'],  desc:'Applied sciences encompassing mechanical, civil, and electrical tracks.' },
  { id:'DEPT-04', name:'Natural Sciences',        head:'Dr. Marie Curie',       students:290, color:'#059669', courses:['BIO101','BIO201','CHEM101','CHEM201','CHEM301'], desc:'Explores biology, chemistry, physics, and environmental sciences.' },
  { id:'DEPT-05', name:'Arts & Humanities',       head:'Prof. Frida Kahlo',     students:240, color:'#d97706', courses:['ART101','LIT201','HIS101','PHI101'],             desc:'Develops critical thinking through literature, philosophy, and the arts.' },
  { id:'DEPT-06', name:'Mathematics',             head:'Dr. Katherine Johnson', students:195, color:'#dc2626', courses:['MATH101','MATH201','MATH301','MATH401','STAT101'], desc:'Pure and applied mathematics covering analysis, algebra, and statistics.' },
];

function loadDepts() {
  const raw = localStorage.getItem('educore_departments');
  return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seedDepts));
}
function saveDepts(data) {
  localStorage.setItem('educore_departments', JSON.stringify(data));
}

let departments = loadDepts();
if (!localStorage.getItem('educore_departments')) saveDepts(departments);

// ── Summary strip ─────────────────────────────────────────────
function renderSummary() {
  const summaryEl = document.getElementById('dept-summary');
  if (!summaryEl) return;
  const totalStudents = departments.reduce((a, d) => a + (d.students || 0), 0);
  const totalCourses  = departments.reduce((a, d) => a + (d.courses || []).length, 0);
  summaryEl.innerHTML = `
    <div class="summary-card">
      <div class="summary-icon" style="background:#eef2ff;color:#4f46e5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div class="summary-body"><div class="summary-val">${departments.length}</div><div class="summary-lbl">Total Departments</div></div>
    </div>
    <div class="summary-card">
      <div class="summary-icon" style="background:#ecfdf5;color:#059669">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
      <div class="summary-body"><div class="summary-val">${totalStudents.toLocaleString()}</div><div class="summary-lbl">Total Students</div></div>
    </div>
    <div class="summary-card">
      <div class="summary-icon" style="background:#ecfeff;color:#0891b2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </div>
      <div class="summary-body"><div class="summary-val">${totalCourses}</div><div class="summary-lbl">Total Courses</div></div>
    </div>`;
}

// ── Render cards ──────────────────────────────────────────────
function renderDepts() {
  renderSummary();
  const grid = document.getElementById('dept-grid');
  if (!grid) return;
  grid.innerHTML = '';

  departments.forEach(d => {
    const initials   = d.head.split(' ').filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join('').slice(0, 2);
    const courseTags = (d.courses || []).map(c => `<span class="course-tag">${c}</span>`).join('');
    const card       = document.createElement('div');
    card.className   = 'dept-card';
    card.innerHTML = `
      <div class="dept-card-accent" style="background:${d.color}"></div>
      <div class="dept-card-body">
        <div class="dept-card-header">
          <div>
            <div class="dept-name">${d.name}</div>
            <div class="dept-head-row">
              <div class="dept-head-avatar" style="background:${d.color}">${initials}</div>
              <span class="dept-head-name">${d.head}</span>
            </div>
          </div>
          <div class="dept-actions">
            <button class="btn-icon edit-dept" data-id="${d.id}" title="Edit" aria-label="Edit ${d.name}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon btn-delete delete-dept" data-id="${d.id}" title="Delete" aria-label="Delete ${d.name}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>
        <div class="dept-stats">
          <div class="dept-stat"><div class="dept-stat-val">${d.students.toLocaleString()}</div><div class="dept-stat-lbl">Students</div></div>
          <div class="dept-stat"><div class="dept-stat-val">${(d.courses || []).length}</div><div class="dept-stat-lbl">Courses</div></div>
        </div>
        ${courseTags ? `<div class="dept-courses-label">Courses offered</div><div class="course-tags">${courseTags}</div>` : ''}
        ${d.desc ? `<p class="dept-desc">${d.desc}</p>` : ''}
      </div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.edit-dept').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id)));
  grid.querySelectorAll('.delete-dept').forEach(btn => btn.addEventListener('click', () => deleteDept(btn.dataset.id)));
}

function deleteDept(id) {
  const dept = departments.find(d => d.id === id);
  if (!dept) return;
  if (!confirm(`Delete the "${dept.name}" department? This cannot be undone.`)) return;
  departments = departments.filter(d => d.id !== id);
  saveDepts(departments);
  renderDepts();
}

// ── Modal ─────────────────────────────────────────────────────
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle    = document.getElementById('modal-title');
const modalClose    = document.getElementById('modal-close');
const modalCancel   = document.getElementById('modal-cancel');
const deptForm      = document.getElementById('dept-form');
const addDeptBtn    = document.getElementById('add-dept-btn');

const F = {
  editId:   document.getElementById('dept-edit-id'),
  name:     document.getElementById('d-name'),
  head:     document.getElementById('d-head'),
  students: document.getElementById('d-students'),
  color:    document.getElementById('d-color'),
  courses:  document.getElementById('d-courses'),
  desc:     document.getElementById('d-desc'),
};

function openModal(editId = null) {
  if (!deptForm || !modalBackdrop) return;
  deptForm.reset();
  clearErrors();
  if (editId) {
    const d = departments.find(x => x.id === editId);
    if (!d) return;
    if (modalTitle) modalTitle.textContent = 'Edit Department';
    if (F.editId)   F.editId.value   = d.id;
    if (F.name)     F.name.value     = d.name;
    if (F.head)     F.head.value     = d.head;
    if (F.students) F.students.value = d.students;
    if (F.color)    F.color.value    = d.color;
    if (F.courses)  F.courses.value  = (d.courses || []).join(', ');
    if (F.desc)     F.desc.value     = d.desc || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Add New Department';
    if (F.editId)   F.editId.value = '';
    if (F.color)    F.color.value  = '#4f46e5';
  }
  modalBackdrop.hidden = false;
  if (F.name) F.name.focus();
}
function closeModal() { if (modalBackdrop) modalBackdrop.hidden = true; }

function setErr(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.toggle('is-error', !!msg);
  const el = document.getElementById(errId);
  if (el) el.textContent = msg;
}
function clearErrors() {
  setErr('d-name', 'err-d-name', '');
  setErr('d-head', 'err-d-head', '');
}

if (addDeptBtn)    addDeptBtn.addEventListener('click', () => openModal());
if (modalClose)    modalClose.addEventListener('click', closeModal);
if (modalCancel)   modalCancel.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

if (deptForm) {
  deptForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    let valid = true;
    if (!F.name?.value.trim()) { setErr('d-name', 'err-d-name', 'Department name is required.'); valid = false; }
    if (!F.head?.value.trim()) { setErr('d-head', 'err-d-head', 'Department head is required.'); valid = false; }
    if (!valid) return;

    const coursesArr = F.courses?.value
      ? F.courses.value.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    const editId = F.editId?.value;

    if (editId) {
      const idx = departments.findIndex(d => d.id === editId);
      if (idx !== -1) {
        departments[idx] = {
          ...departments[idx],
          name:     F.name.value.trim(),
          head:     F.head.value.trim(),
          students: parseInt(F.students?.value) || 0,
          color:    F.color?.value || '#4f46e5',
          courses:  coursesArr,
          desc:     F.desc?.value.trim() || '',
        };
      }
    } else {
      departments.push({
        id:       `DEPT-${String(departments.length + 1).padStart(2, '0')}`,
        name:     F.name.value.trim(),
        head:     F.head.value.trim(),
        students: parseInt(F.students?.value) || 0,
        color:    F.color?.value || '#4f46e5',
        courses:  coursesArr,
        desc:     F.desc?.value.trim() || '',
      });
    }

    saveDepts(departments);
    closeModal();
    renderDepts();
  });
}

// ── Init ──────────────────────────────────────────────────────
renderDepts();
