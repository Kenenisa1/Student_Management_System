/**
 * js/students.js — EduCore Students Directory
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 *
 * State controller: setUIState(state, errorMessage)
 * States: 'loading' | 'error' | 'empty' | 'success'
 */

'use strict';

// ── 1. Auth guard ─────────────────────────────────────────────
EduAuth.guard();

// ── 2. Topbar + sidebar init ──────────────────────────────────
EduAuth.initTopbar();
EduAuth.initSidebar();

// ── State containers ──────────────────────────────────────────
const STATE_IDS = ['loading', 'error', 'empty', 'success'];

/**
 * setUIState — show exactly one state container, hide the rest.
 * @param {'loading'|'error'|'empty'|'success'} state
 * @param {string} [errorMessage]
 */
function setUIState(state, errorMessage = '') {
  STATE_IDS.forEach(s => {
    const el = document.getElementById(`${s}-state`);
    if (el) el.classList.toggle('hidden', s !== state);
  });
  if (state === 'error' && errorMessage) {
    const errEl = document.getElementById('error-message');
    if (errEl) errEl.textContent = errorMessage;
  }
}

// ── Seed data ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#4f46e5','#7c3aed','#0891b2','#059669',
  '#d97706','#dc2626','#0284c7','#7c3aed',
];

const seedStudents = [
  { id:'STU-001', first:'Emma',     last:'Johnson',  email:'emma.j@student.edu',    phone:'+1 555 101 2020', dept:'Computer Science',        courses:['CS101','CS201','MATH201'],    enrolled:'Aug 2024' },
  { id:'STU-002', first:'Liam',     last:'Williams', email:'liam.w@student.edu',     phone:'+1 555 202 3030', dept:'Engineering',             courses:['ENG101','PHYS101','MATH101'], enrolled:'Aug 2024' },
  { id:'STU-003', first:'Olivia',   last:'Brown',    email:'olivia.b@student.edu',   phone:'+1 555 303 4040', dept:'Business Administration', courses:['BUS101','ECON101'],           enrolled:'Jul 2024' },
  { id:'STU-004', first:'Noah',     last:'Garcia',   email:'noah.g@student.edu',     phone:'+1 555 404 5050', dept:'Mathematics',             courses:['MATH301','MATH401','CS102'],  enrolled:'Jul 2024' },
  { id:'STU-005', first:'Ava',      last:'Martinez', email:'ava.m@student.edu',      phone:'+1 555 505 6060', dept:'Natural Sciences',        courses:['BIO101','CHEM101'],           enrolled:'Jun 2024' },
  { id:'STU-006', first:'William',  last:'Davis',    email:'will.d@student.edu',     phone:'+1 555 606 7070', dept:'Computer Science',        courses:['CS101','CS301','WEB101'],     enrolled:'Aug 2024' },
  { id:'STU-007', first:'Sophia',   last:'Wilson',   email:'sophia.w@student.edu',   phone:'+1 555 707 8080', dept:'Arts & Humanities',       courses:['ART101','LIT201'],            enrolled:'Sep 2024' },
  { id:'STU-008', first:'James',    last:'Anderson', email:'james.a@student.edu',    phone:'+1 555 808 9090', dept:'Engineering',             courses:['ENG201','ENG301','PHYS201'],  enrolled:'Aug 2024' },
  { id:'STU-009', first:'Isabella', last:'Thomas',   email:'bella.t@student.edu',    phone:'+1 555 909 0101', dept:'Business Administration', courses:['BUS201','MKT101','BUS301'],   enrolled:'Jun 2024' },
  { id:'STU-010', first:'Oliver',   last:'Jackson',  email:'oliver.j@student.edu',   phone:'+1 555 010 1212', dept:'Natural Sciences',        courses:['CHEM201','BIO201','CHEM301'], enrolled:'Sep 2024' },
  { id:'STU-011', first:'Mia',      last:'White',    email:'mia.w@student.edu',      phone:'+1 555 111 2323', dept:'Mathematics',             courses:['MATH101','STAT101'],          enrolled:'Aug 2024' },
  { id:'STU-012', first:'Ethan',    last:'Harris',   email:'ethan.h@student.edu',    phone:'+1 555 212 3434', dept:'Computer Science',        courses:['CS201','CS401','AI101'],      enrolled:'Jul 2024' },
];

function loadStudents() {
  const raw = localStorage.getItem('educore_students');
  return raw
    ? JSON.parse(raw)
    : seedStudents.map((s, i) => ({ ...s, deleted: false, colorIdx: i % AVATAR_COLORS.length }));
}
function saveStudents(data) {
  localStorage.setItem('educore_students', JSON.stringify(data));
}

let students = loadStudents();
if (!localStorage.getItem('educore_students')) saveStudents(students);

// ── DOM refs (null-checked before use) ────────────────────────
const tbody       = document.getElementById('studentRows');
const resultCount = document.getElementById('result-count');
const searchInput = document.getElementById('search-input');
const deptFilter  = document.getElementById('dept-filter');

// ── Render ────────────────────────────────────────────────────
function renderStudents(list) {
  if (!tbody) return;
  tbody.innerHTML = '';

  const active = list.filter(s => !s.deleted);

  if (active.length === 0) {
    setUIState('empty');
    return;
  }

  setUIState('success');
  if (resultCount) {
    resultCount.textContent = `${active.length} student${active.length !== 1 ? 's' : ''}`;
  }

  active.forEach((s, i) => {
    const initials = `${s.first[0]}${s.last[0]}`.toUpperCase();
    const color    = AVATAR_COLORS[s.colorIdx ?? i % AVATAR_COLORS.length];
    const courseTags = (s.courses || [])
      .map(c => `<span class="course-tag">${c}</span>`)
      .join('');

    const tr = document.createElement('tr');
    tr.dataset.id = s.id;
    tr.innerHTML = `
      <td>
        <span style="font-size:.8125rem;font-weight:700;color:var(--text-m)">${s.id}</span>
      </td>
      <td>
        <div class="student-info">
          <div class="student-avatar" style="background:${color}">${initials}</div>
          <div>
            <div class="student-fullname">${s.first} ${s.last}</div>
            <div class="student-id-sub">${s.email}</div>
          </div>
        </div>
      </td>
      <td style="font-size:.8125rem;color:var(--text-m)">${s.phone || '—'}</td>
      <td><span class="dept-badge">${s.dept}</span></td>
      <td><div class="course-tags">${courseTags}</div></td>
      <td>
        <div class="action-cell">
          <button class="btn-icon edit-btn" data-id="${s.id}"
            title="Edit student" aria-label="Edit ${s.first} ${s.last}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon btn-delete delete-btn" data-id="${s.id}"
            title="Remove student" aria-label="Remove ${s.first} ${s.last}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  // Bind row action buttons
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => softDelete(btn.dataset.id));
  });
}

// ── Filter ────────────────────────────────────────────────────
function getFiltered() {
  const q    = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const dept = deptFilter  ? deptFilter.value : '';
  return students.filter(s => {
    if (s.deleted) return false;
    const matchQ = !q ||
      `${s.first} ${s.last}`.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchD = !dept || s.dept === dept;
    return matchQ && matchD;
  });
}

function refresh() { renderStudents(getFiltered()); }

if (searchInput) searchInput.addEventListener('input', refresh);
if (deptFilter)  deptFilter.addEventListener('change', refresh);

// ── Soft delete ───────────────────────────────────────────────
function softDelete(id) {
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return;
  if (!confirm(`Remove ${students[idx].first} ${students[idx].last} from the directory?`)) return;
  students[idx].deleted = true;
  saveStudents(students);
  refresh();
}

// ── Modal ─────────────────────────────────────────────────────
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle    = document.getElementById('modal-title');
const modalClose    = document.getElementById('modal-close');
const modalCancel   = document.getElementById('modal-cancel');
const modalSubmit   = document.getElementById('modal-submit');
const studentForm   = document.getElementById('student-form');
const addStudentBtn = document.getElementById('add-student-btn');

const fields = {
  id:      document.getElementById('student-id'),
  first:   document.getElementById('s-first'),
  last:    document.getElementById('s-last'),
  email:   document.getElementById('s-email'),
  dept:    document.getElementById('s-dept'),
  phone:   document.getElementById('s-phone'),
  courses: document.getElementById('s-courses'),
};

function openModal(editId = null) {
  if (!studentForm || !modalBackdrop) return;
  studentForm.reset();
  clearFormErrors();

  if (editId) {
    const s = students.find(x => x.id === editId);
    if (!s) return;
    if (modalTitle)  modalTitle.textContent  = 'Edit Student';
    if (modalSubmit) modalSubmit.textContent = 'Save Changes';
    if (fields.id)      fields.id.value      = s.id;
    if (fields.first)   fields.first.value   = s.first;
    if (fields.last)    fields.last.value    = s.last;
    if (fields.email)   fields.email.value   = s.email;
    if (fields.dept)    fields.dept.value    = s.dept;
    if (fields.phone)   fields.phone.value   = s.phone || '';
    if (fields.courses) fields.courses.value = (s.courses || []).join(', ');
  } else {
    if (modalTitle)  modalTitle.textContent  = 'Add New Student';
    if (modalSubmit) modalSubmit.textContent = 'Save Student';
    if (fields.id)   fields.id.value = '';
  }

  modalBackdrop.hidden = false;
  if (fields.first) fields.first.focus();
}

function closeModal() {
  if (modalBackdrop) modalBackdrop.hidden = true;
}

if (addStudentBtn) addStudentBtn.addEventListener('click', () => openModal());
if (modalClose)    modalClose.addEventListener('click', closeModal);
if (modalCancel)   modalCancel.addEventListener('click', closeModal);
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Form validation ───────────────────────────────────────────
function setFieldError(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const span  = document.getElementById(errorId);
  if (input) input.classList.toggle('is-error', !!msg);
  if (span)  span.textContent = msg;
}
function clearFormErrors() {
  [
    ['s-first', 'err-first'],
    ['s-last',  'err-last'],
    ['s-email', 'err-email'],
    ['s-dept',  'err-dept'],
  ].forEach(([i, e]) => setFieldError(i, e, ''));
}

if (studentForm) {
  studentForm.addEventListener('submit', e => {
    e.preventDefault();
    clearFormErrors();
    let valid = true;

    if (!fields.first?.value.trim()) {
      setFieldError('s-first', 'err-first', 'First name is required.'); valid = false;
    }
    if (!fields.last?.value.trim()) {
      setFieldError('s-last', 'err-last', 'Last name is required.'); valid = false;
    }
    if (!fields.email?.value.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value)) {
      setFieldError('s-email', 'err-email', 'Valid email is required.'); valid = false;
    }
    if (!fields.dept?.value) {
      setFieldError('s-dept', 'err-dept', 'Please select a department.'); valid = false;
    }
    if (!valid) return;

    const coursesRaw = fields.courses?.value.trim() || '';
    const coursesArr = coursesRaw
      ? coursesRaw.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    const editId = fields.id?.value;

    if (editId) {
      const idx = students.findIndex(s => s.id === editId);
      if (idx !== -1) {
        students[idx] = {
          ...students[idx],
          first:   fields.first.value.trim(),
          last:    fields.last.value.trim(),
          email:   fields.email.value.trim(),
          phone:   fields.phone?.value.trim() || '',
          dept:    fields.dept.value,
          courses: coursesArr,
        };
      }
    } else {
      const newId = `STU-${String(students.length + 1).padStart(3, '0')}`;
      students.push({
        id:       newId,
        first:    fields.first.value.trim(),
        last:     fields.last.value.trim(),
        email:    fields.email.value.trim(),
        phone:    fields.phone?.value.trim() || '',
        dept:     fields.dept.value,
        courses:  coursesArr,
        enrolled: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        deleted:  false,
        colorIdx: students.length % AVATAR_COLORS.length,
      });
    }

    saveStudents(students);
    closeModal();
    refresh();
  });
}

// ── Initial render (with brief loading state) ─────────────────
setUIState('loading');
setTimeout(() => {
  students = loadStudents();
  refresh();
}, 600);
