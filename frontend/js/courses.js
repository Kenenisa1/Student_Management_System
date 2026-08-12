/**
 * js/courses.js — EduCore Course Catalogue
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 */

'use strict';

// ── 1. Auth guard ─────────────────────────────────────────────
EduAuth.guard();

// ── 2. Topbar + sidebar init ──────────────────────────────────
EduAuth.initTopbar();
EduAuth.initSidebar();

// ── Colour map ────────────────────────────────────────────────
const DEPT_COLORS = {
  'Computer Science':        { bg:'#eef2ff', color:'#4f46e5' },
  'Business Administration': { bg:'#f5f3ff', color:'#7c3aed' },
  'Engineering':             { bg:'#ecfeff', color:'#0891b2' },
  'Natural Sciences':        { bg:'#ecfdf5', color:'#059669' },
  'Arts & Humanities':       { bg:'#fffbeb', color:'#d97706' },
  'Mathematics':             { bg:'#fef2f2', color:'#dc2626' },
};

// ── Seed data ─────────────────────────────────────────────────
const seedCourses = [
  { id:'C001', code:'CS101',   name:'Introduction to Programming',  dept:'Computer Science',        instructor:'Prof. Alan Turing',       credits:3, enrolled:312, desc:'Fundamentals of programming using Python; control flow, functions, and data structures.' },
  { id:'C002', code:'MATH201', name:'Calculus I',                   dept:'Mathematics',             instructor:'Dr. Katherine Johnson',   credits:4, enrolled:289, desc:'Limits, derivatives, integrals, and the fundamental theorem of calculus.' },
  { id:'C003', code:'BUS101',  name:'Principles of Management',     dept:'Business Administration', instructor:'Prof. Peter Drucker',     credits:3, enrolled:271, desc:'Core management concepts: planning, organising, leading, and controlling.' },
  { id:'C004', code:'ENG101',  name:'Circuit Analysis',             dept:'Engineering',             instructor:'Dr. Nikola Tesla',        credits:4, enrolled:244, desc:'DC and AC circuit analysis, Kirchhoff\'s laws, and phasor techniques.' },
  { id:'C005', code:'STAT101', name:'Statistics',                   dept:'Mathematics',             instructor:'Dr. Florence Nightingale',credits:3, enrolled:238, desc:'Descriptive statistics, probability, hypothesis testing, and regression.' },
  { id:'C006', code:'WEB101',  name:'Web Development',              dept:'Computer Science',        instructor:'Prof. Tim Berners-Lee',   credits:3, enrolled:220, desc:'HTML5, CSS3, JavaScript ES6+ for building modern responsive web apps.' },
  { id:'C007', code:'CS201',   name:'Data Structures & Algorithms', dept:'Computer Science',        instructor:'Prof. Donald Knuth',      credits:4, enrolled:198, desc:'Arrays, linked lists, trees, graphs, sorting, and algorithm complexity.' },
  { id:'C008', code:'BIO101',  name:'Biology I',                    dept:'Natural Sciences',        instructor:'Dr. Charles Darwin',      credits:3, enrolled:186, desc:'Cell biology, genetics, evolution, and fundamental life processes.' },
  { id:'C009', code:'CHEM101', name:'General Chemistry',            dept:'Natural Sciences',        instructor:'Dr. Marie Curie',         credits:4, enrolled:175, desc:'Atomic structure, bonding, reactions, stoichiometry, and thermodynamics.' },
  { id:'C010', code:'ECON101', name:'Microeconomics',               dept:'Business Administration', instructor:'Prof. Adam Smith',        credits:3, enrolled:168, desc:'Supply and demand, market structures, consumer and producer theory.' },
  { id:'C011', code:'ART101',  name:'Introduction to Visual Arts',  dept:'Arts & Humanities',       instructor:'Prof. Frida Kahlo',       credits:2, enrolled:142, desc:'Exploration of drawing, painting, and digital media across art movements.' },
  { id:'C012', code:'AI101',   name:'Artificial Intelligence',      dept:'Computer Science',        instructor:'Prof. Geoffrey Hinton',   credits:4, enrolled:135, desc:'Search algorithms, knowledge representation, ML basics, and neural networks.' },
  { id:'C013', code:'PHYS101', name:'Physics I: Mechanics',         dept:'Engineering',             instructor:'Dr. Richard Feynman',     credits:4, enrolled:130, desc:'Kinematics, Newton\'s laws, work-energy theorem, and rotational motion.' },
  { id:'C014', code:'MKT101',  name:'Marketing Fundamentals',       dept:'Business Administration', instructor:'Prof. Philip Kotler',     credits:3, enrolled:124, desc:'Market research, consumer behaviour, branding, and digital marketing.' },
  { id:'C015', code:'LIT201',  name:'World Literature',             dept:'Arts & Humanities',       instructor:'Prof. Maya Angelou',      credits:3, enrolled:118, desc:'Survey of global literary traditions from ancient epics to modern novels.' },
  { id:'C016', code:'MATH301', name:'Linear Algebra',               dept:'Mathematics',             instructor:'Dr. Emmy Noether',        credits:3, enrolled:112, desc:'Vectors, matrices, eigenvalues, linear transformations, and applications.' },
  { id:'C017', code:'CS301',   name:'Operating Systems',            dept:'Computer Science',        instructor:'Prof. Linus Torvalds',    credits:4, enrolled:105, desc:'Process management, memory, file systems, concurrency, and OS design.' },
  { id:'C018', code:'ENG201',  name:'Thermodynamics',               dept:'Engineering',             instructor:'Dr. James Watt',          credits:4, enrolled:99,  desc:'Laws of thermodynamics, entropy, heat engines, and power cycles.' },
];

function loadCourses() {
  const raw = localStorage.getItem('educore_courses');
  return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seedCourses));
}
function saveCourses(data) { localStorage.setItem('educore_courses', JSON.stringify(data)); }

let courses = loadCourses();
if (!localStorage.getItem('educore_courses')) saveCourses(courses);

const maxEnrolled = Math.max(...seedCourses.map(c => c.enrolled));

// ── DOM refs ──────────────────────────────────────────────────
const grid         = document.getElementById('courses-grid');
const emptyCourses = document.getElementById('empty-courses');
const resultCount  = document.getElementById('result-count');
const searchInput  = document.getElementById('search-input');
const deptFilter   = document.getElementById('dept-filter');
const creditFilter = document.getElementById('credit-filter');

// ── Render ────────────────────────────────────────────────────
function renderCourses(list) {
  if (!grid) return;
  grid.innerHTML = '';

  if (list.length === 0) {
    if (emptyCourses) emptyCourses.classList.remove('hidden');
    if (resultCount)  resultCount.textContent = '0 courses';
    return;
  }
  if (emptyCourses) emptyCourses.classList.add('hidden');
  if (resultCount)  resultCount.textContent = `${list.length} course${list.length !== 1 ? 's' : ''}`;

  list.forEach(c => {
    const dc   = DEPT_COLORS[c.dept] || { bg:'#f1f5f9', color:'#475569' };
    const pct  = Math.round((c.enrolled / maxEnrolled) * 100);
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div class="course-card-top">
        <div class="course-card-header">
          <span class="course-code-badge" style="background:${dc.bg};color:${dc.color}">${c.code}</span>
          <div class="course-actions">
            <button class="btn-icon edit-course" data-id="${c.id}" title="Edit" aria-label="Edit ${c.name}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon btn-delete delete-course" data-id="${c.id}" title="Delete" aria-label="Delete ${c.name}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>
        <h3 class="course-name">${c.name}</h3>
        ${c.desc ? `<p class="course-desc">${c.desc}</p>` : ''}
        <div class="course-tags-row">
          <span class="tag tag-dept">${c.dept}</span>
          ${c.instructor ? `<span class="tag tag-instructor">${c.instructor}</span>` : ''}
          <span class="tag tag-credits">${c.credits} Credit${c.credits !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="course-card-footer">
        <span class="enrolled-label">Enrolled</span>
        <div class="enrolled-bar-wrap">
          <div class="enrolled-bar" data-w="${pct}" style="width:0%;background:${dc.color}"></div>
        </div>
        <span class="enrolled-val">${c.enrolled}</span>
      </div>`;
    grid.appendChild(card);
  });

  requestAnimationFrame(() => {
    grid.querySelectorAll('.enrolled-bar').forEach(b => { b.style.width = b.dataset.w + '%'; });
  });

  grid.querySelectorAll('.edit-course').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id)));
  grid.querySelectorAll('.delete-course').forEach(btn => btn.addEventListener('click', () => deleteCourse(btn.dataset.id)));
}

// ── Filter ────────────────────────────────────────────────────
function getFiltered() {
  const q       = searchInput   ? searchInput.value.trim().toLowerCase() : '';
  const dept    = deptFilter    ? deptFilter.value   : '';
  const credits = creditFilter  ? creditFilter.value : '';
  return courses.filter(c => {
    const matchQ  = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.instructor||'').toLowerCase().includes(q);
    const matchD  = !dept    || c.dept === dept;
    const matchCr = !credits || String(c.credits) === credits;
    return matchQ && matchD && matchCr;
  });
}

function refresh() { renderCourses(getFiltered()); }
if (searchInput)  searchInput.addEventListener('input', refresh);
if (deptFilter)   deptFilter.addEventListener('change', refresh);
if (creditFilter) creditFilter.addEventListener('change', refresh);

// ── Delete ────────────────────────────────────────────────────
function deleteCourse(id) {
  const c = courses.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Delete "${c.name}" (${c.code})? This cannot be undone.`)) return;
  courses = courses.filter(x => x.id !== id);
  saveCourses(courses);
  refresh();
}

// ── Modal ─────────────────────────────────────────────────────
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle    = document.getElementById('modal-title');
const modalClose    = document.getElementById('modal-close');
const modalCancel   = document.getElementById('modal-cancel');
const courseForm    = document.getElementById('course-form');
const addCourseBtn  = document.getElementById('add-course-btn');

const F = {
  editId:     document.getElementById('course-edit-id'),
  code:       document.getElementById('c-code'),
  credits:    document.getElementById('c-credits'),
  name:       document.getElementById('c-name'),
  dept:       document.getElementById('c-dept'),
  instructor: document.getElementById('c-instructor'),
  enrolled:   document.getElementById('c-enrolled'),
  desc:       document.getElementById('c-desc'),
};

function openModal(editId = null) {
  if (!courseForm || !modalBackdrop) return;
  courseForm.reset();
  clearErrors();
  if (editId) {
    const c = courses.find(x => x.id === editId);
    if (!c) return;
    if (modalTitle) modalTitle.textContent = 'Edit Course';
    if (F.editId)     F.editId.value     = c.id;
    if (F.code)       F.code.value       = c.code;
    if (F.credits)    F.credits.value    = c.credits;
    if (F.name)       F.name.value       = c.name;
    if (F.dept)       F.dept.value       = c.dept;
    if (F.instructor) F.instructor.value = c.instructor || '';
    if (F.enrolled)   F.enrolled.value   = c.enrolled || 0;
    if (F.desc)       F.desc.value       = c.desc || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'Add New Course';
    if (F.editId)   F.editId.value = '';
  }
  modalBackdrop.hidden = false;
  if (F.code) F.code.focus();
}
function closeModal() { if (modalBackdrop) modalBackdrop.hidden = true; }

function setErr(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.toggle('is-error', !!msg);
  const el = document.getElementById(errId);
  if (el) el.textContent = msg;
}
function clearErrors() {
  [['c-code','err-c-code'],['c-credits','err-c-credits'],['c-name','err-c-name'],['c-dept','err-c-dept']]
    .forEach(([i, e]) => setErr(i, e, ''));
}

if (addCourseBtn)  addCourseBtn.addEventListener('click', () => openModal());
if (modalClose)    modalClose.addEventListener('click', closeModal);
if (modalCancel)   modalCancel.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

if (courseForm) {
  courseForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    let valid = true;
    if (!F.code?.value.trim())  { setErr('c-code',    'err-c-code',    'Course code is required.'); valid = false; }
    if (!F.credits?.value)      { setErr('c-credits', 'err-c-credits', 'Select credit hours.');     valid = false; }
    if (!F.name?.value.trim())  { setErr('c-name',    'err-c-name',    'Course name is required.'); valid = false; }
    if (!F.dept?.value)         { setErr('c-dept',    'err-c-dept',    'Select a department.');     valid = false; }
    if (!valid) return;

    const editId = F.editId?.value;
    if (editId) {
      const idx = courses.findIndex(c => c.id === editId);
      if (idx !== -1) {
        courses[idx] = { ...courses[idx], code: F.code.value.trim().toUpperCase(), credits: parseInt(F.credits.value), name: F.name.value.trim(), dept: F.dept.value, instructor: F.instructor?.value.trim() || '', enrolled: parseInt(F.enrolled?.value) || 0, desc: F.desc?.value.trim() || '' };
      }
    } else {
      courses.push({ id: `C${String(courses.length + 1).padStart(3,'0')}`, code: F.code.value.trim().toUpperCase(), credits: parseInt(F.credits.value), name: F.name.value.trim(), dept: F.dept.value, instructor: F.instructor?.value.trim() || '', enrolled: parseInt(F.enrolled?.value) || 0, desc: F.desc?.value.trim() || '' });
    }
    saveCourses(courses);
    closeModal();
    refresh();
  });
}

// ── Init ──────────────────────────────────────────────────────
refresh();
