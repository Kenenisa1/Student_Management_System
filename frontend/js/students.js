/**
 * js/students.js
 * Students Directory
 * Frontend ↔ Backend integration
 *
 * API:
 * GET    /api/students
 * POST   /api/students
 * PUT    /api/students/:id
 * DELETE /api/students/:id
 */

'use strict';

console.log("STUDENTS.JS LOADED");

// ============================================================
// API
// ============================================================

const API_URL = `${EduAuth.API_BASE}/students`;

// ============================================================
// AUTH
// ============================================================

EduAuth.guard();
EduAuth.initTopbar();
EduAuth.initSidebar();

// ============================================================
// UI STATE
// ============================================================

const STATE_IDS = ['loading', 'error', 'empty', 'success'];

function setUIState(state, errorMessage = '') {
    STATE_IDS.forEach((name) => {
        const element = document.getElementById(`${name}-state`);

        if (element) {
            element.classList.toggle('hidden', name !== state);
        }
    });

    if (state === 'error') {
        const errorElement = document.getElementById('error-message');

        if (errorElement) {
            errorElement.textContent =
                errorMessage || 'Something went wrong.';
        }
    }
}

// ============================================================
// AVATAR COLORS
// ============================================================

const AVATAR_COLORS = [
    '#4f46e5',
    '#7c3aed',
    '#0891b2',
    '#059669',
    '#d97706',
    '#dc2626',
    '#0284c7',
    '#7c3aed'
];

// ============================================================
// DATA
// ============================================================

let students = [];
let loadedDepartments = [];

async function loadDepartmentsOptions() {
    try {
        const res = await EduAuth.apiFetch('/departments');
        if (!res.ok) return;
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            loadedDepartments = result.data;
            populateDeptDropdowns();
        }
    } catch (e) {
        console.error('Failed to load departments options:', e);
    }
}

function populateDeptDropdowns() {
    const sDept = document.getElementById('s-dept');
    const dFilter = document.getElementById('dept-filter');

    if (sDept) {
        const currentVal = sDept.value;
        sDept.innerHTML = '<option value="">Select department…</option>' +
            loadedDepartments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (currentVal) sDept.value = currentVal;
    }

    if (dFilter) {
        const currentVal = dFilter.value;
        dFilter.innerHTML = '<option value="">All Departments</option>' +
            loadedDepartments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (currentVal) dFilter.value = currentVal;
    }
}

// ============================================================
// DOM
// ============================================================

const tbody = document.getElementById('studentRows');
const resultCount = document.getElementById('result-count');
const searchInput = document.getElementById('search-input');
const deptFilter = document.getElementById('dept-filter');

// ============================================================
// CONVERT BACKEND DATA TO FRONTEND FORMAT
// ============================================================

function normalizeStudent(student, index) {
    const fullName = student.name || '';

    const parts = fullName.trim().split(/\s+/);

    const first = parts.shift() || '';
    const last = parts.join(' ') || '';

    let deptName = student.department_name || student.dept;
    if (!deptName && student.department_id && loadedDepartments.length > 0) {
        const found = loadedDepartments.find(d => String(d.id) === String(student.department_id));
        if (found) deptName = found.name;
    }

    return {
        id: student.id,
        first: first,
        last: last,
        email: student.email || '',
        phone: student.phone || '',
        department_id: student.department_id,
        dept: deptName || String(student.department_id || '—'),
        courses: Array.isArray(student.courses) ? student.courses : (student.courses ? String(student.courses).split(',') : []),
        deleted: Boolean(student.is_deleted),
        colorIdx: index % AVATAR_COLORS.length
    };
}

// ============================================================
// GET STUDENTS
// ============================================================

async function loadStudents() {
    setUIState('loading');

    try {
        await loadDepartmentsOptions();
        const response = await fetch(API_URL, { headers: EduAuth.getAuthHeaders() });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log('GET /api/students:', result);

        if (!result.success) {
            throw new Error(
                result.message || 'Failed to load students.'
            );
        }

        students = (result.data || []).map(
            normalizeStudent
        );

        refresh();

    } catch (error) {
        console.error('GET students error:', error);

        setUIState(
            'error',
            `Could not load students: ${error.message}`
        );
    }
}

// ============================================================
// RENDER
// ============================================================

function renderStudents(list) {
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    const active = list.filter(
        (student) => !student.deleted
    );

    if (active.length === 0) {
        if (resultCount) {
            resultCount.textContent = '0 students';
        }

        setUIState('empty');
        return;
    }

    setUIState('success');

    if (resultCount) {
        resultCount.textContent =
            `${active.length} student${active.length !== 1 ? 's' : ''}`;
    }

    active.forEach((student, index) => {

        const firstInitial =
            student.first.charAt(0).toUpperCase();

        const lastInitial =
            student.last.charAt(0).toUpperCase();

        const initials =
            `${firstInitial}${lastInitial}`;

        const color =
            AVATAR_COLORS[
                student.colorIdx ??
                index % AVATAR_COLORS.length
            ];

        const courseTags =
            (student.courses || [])
                .map(
                    (course) =>
                        `<span class="course-tag">${course}</span>`
                )
                .join('');

        const row = document.createElement('tr');

        row.dataset.id = student.id;

        row.innerHTML = `
            <td>
                <span
                    style="
                        font-size:.8125rem;
                        font-weight:700;
                        color:var(--text-m)
                    "
                >
                    ${student.id}
                </span>
            </td>

            <td>
                <div class="student-info">

                    <div
                        class="student-avatar"
                        style="background:${color}"
                    >
                        ${initials}
                    </div>

                    <div>
                        <div class="student-fullname">
                            ${student.first} ${student.last}
                        </div>

                        <div class="student-id-sub">
                            ${student.email}
                        </div>
                    </div>

                </div>
            </td>

            <td
                style="
                    font-size:.8125rem;
                    color:var(--text-m)
                "
            >
                ${student.phone || '—'}
            </td>

            <td>
                <span class="dept-badge">
                    ${student.dept || '—'}
                </span>
            </td>

            <td>
                <div class="course-tags">
                    ${courseTags || '—'}
                </div>
            </td>

            <td>
                <div class="action-cell">

                    <button
                        class="btn-icon edit-btn"
                        data-id="${student.id}"
                        title="Edit student"
                        aria-label="Edit student"
                    >
                        ✏️
                    </button>

                    <button
                        class="btn-icon btn-delete delete-btn"
                        data-id="${student.id}"
                        title="Remove student"
                        aria-label="Remove student"
                    >
                        🗑️
                    </button>

                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    // EDIT BUTTONS
    tbody
        .querySelectorAll('.edit-btn')
        .forEach((button) => {
            button.addEventListener('click', () => {
                openModal(button.dataset.id);
            });
        });

    // DELETE BUTTONS
    tbody
        .querySelectorAll('.delete-btn')
        .forEach((button) => {
            button.addEventListener('click', () => {
                deleteStudent(button.dataset.id);
            });
        });
}

// ============================================================
// SEARCH / FILTER
// ============================================================

function getFilteredStudents() {

    const query = searchInput
        ? searchInput.value.trim().toLowerCase()
        : '';

    const department = deptFilter
        ? deptFilter.value
        : '';

    return students.filter((student) => {

        if (student.deleted) {
            return false;
        }

        const fullName =
            `${student.first} ${student.last}`
                .toLowerCase();

        const matchesSearch =
            !query ||
            fullName.includes(query) ||
            String(student.id).includes(query) ||
            student.email.toLowerCase().includes(query);

        const matchesDepartment =
            !department ||
            String(student.department_id) ===
                String(department);

        return matchesSearch && matchesDepartment;
    });
}

function refresh() {
    renderStudents(getFilteredStudents());
}

if (searchInput) {
    searchInput.addEventListener(
        'input',
        refresh
    );
}

if (deptFilter) {
    deptFilter.addEventListener(
        'change',
        refresh
    );
}

// ============================================================
// MODAL
// ============================================================

const modalBackdrop =
    document.getElementById('modal-backdrop');

const modalTitle =
    document.getElementById('modal-title');

const modalClose =
    document.getElementById('modal-close');

const modalCancel =
    document.getElementById('modal-cancel');

const modalSubmit =
    document.getElementById('modal-submit');

const studentForm =
    document.getElementById('student-form');

const addStudentBtn =
    document.getElementById('add-student-btn');

const fields = {
    id: document.getElementById('student-id'),
    first: document.getElementById('s-first'),
    last: document.getElementById('s-last'),
    email: document.getElementById('s-email'),
    dept: document.getElementById('s-dept'),
    phone: document.getElementById('s-phone'),
    courses: document.getElementById('s-courses')
};

// ============================================================
// OPEN MODAL
// ============================================================

function openModal(editId = null) {

    if (!studentForm || !modalBackdrop) {
        return;
    }

    studentForm.reset();
    clearFormErrors();

    if (editId !== null) {

        const student = students.find(
            (item) =>
                String(item.id) === String(editId)
        );

        if (!student) {
            return;
        }

        modalTitle.textContent = 'Edit Student';
        modalSubmit.textContent = 'Save Changes';

        fields.id.value = student.id;
        fields.first.value = student.first;
        fields.last.value = student.last;
        fields.email.value = student.email;
        fields.phone.value = student.phone || '';

        fields.dept.value =
            student.department_id || '';

        fields.courses.value =
            (student.courses || []).join(', ');

    } else {

        modalTitle.textContent = 'Add New Student';
        modalSubmit.textContent = 'Save Student';

        fields.id.value = '';
    }

    modalBackdrop.hidden = false;

    if (fields.first) {
        fields.first.focus();
    }
}

// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    if (modalBackdrop) {
        modalBackdrop.hidden = true;
    }
}

if (addStudentBtn) {
    addStudentBtn.addEventListener(
        'click',
        () => openModal()
    );
}

if (modalClose) {
    modalClose.addEventListener(
        'click',
        closeModal
    );
}

if (modalCancel) {
    modalCancel.addEventListener(
        'click',
        closeModal
    );
}

if (modalBackdrop) {

    modalBackdrop.addEventListener(
        'click',
        (event) => {

            if (event.target === modalBackdrop) {
                closeModal();
            }

        }
    );
}

document.addEventListener(
    'keydown',
    (event) => {

        if (event.key === 'Escape') {
            closeModal();
        }

    }
);

// ============================================================
// VALIDATION
// ============================================================

function setFieldError(
    inputId,
    errorId,
    message
) {

    const input =
        document.getElementById(inputId);

    const error =
        document.getElementById(errorId);

    if (input) {
        input.classList.toggle(
            'is-error',
            Boolean(message)
        );
    }

    if (error) {
        error.textContent = message;
    }
}

function clearFormErrors() {

    const errors = [
        ['s-first', 'err-first'],
        ['s-last', 'err-last'],
        ['s-email', 'err-email'],
        ['s-dept', 'err-dept']
    ];

    errors.forEach(
        ([inputId, errorId]) => {

            setFieldError(
                inputId,
                errorId,
                ''
            );

        }
    );
}

// ============================================================
// CREATE / UPDATE
// ============================================================

if (studentForm) {

    studentForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            clearFormErrors();

            let valid = true;

            // FIRST NAME
            if (!fields.first.value.trim()) {

                setFieldError(
                    's-first',
                    'err-first',
                    'First name is required.'
                );

                valid = false;
            }

            // LAST NAME
            if (!fields.last.value.trim()) {

                setFieldError(
                    's-last',
                    'err-last',
                    'Last name is required.'
                );

                valid = false;
            }

            // EMAIL
            if (
                !fields.email.value.trim() ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(fields.email.value)
            ) {

                setFieldError(
                    's-email',
                    'err-email',
                    'Valid email is required.'
                );

                valid = false;
            }

            // DEPARTMENT
            if (!fields.dept.value) {

                setFieldError(
                    's-dept',
                    'err-dept',
                    'Please select a department.'
                );

                valid = false;
            }

            if (!valid) {
                return;
            }

            // =================================================
            // IMPORTANT:
            // Backend expects:
            //
            // {
            //   name,
            //   email,
            //   phone,
            //   department_id
            // }
            // =================================================

            const name =
                `${fields.first.value.trim()} ${fields.last.value.trim()}`;

            const departmentId =
                Number(fields.dept.value);

            const studentData = {
                name: name,
                email: fields.email.value.trim(),
                phone: fields.phone.value.trim(),
                department_id: departmentId
            };

            console.log(
                'SENDING STUDENT DATA:',
                studentData
            );

            const editId =
                fields.id.value;

            try {

                let response;

                // UPDATE
                if (editId) {

                    response = await fetch(
                        `${API_URL}/${editId}`,
                        {
                            method: 'PUT',

                            headers: EduAuth.getAuthHeaders(),

                            body:
                                JSON.stringify(
                                    studentData
                                )
                        }
                    );

                }

                // CREATE
                else {

                    response = await fetch(
                        API_URL,
                        {
                            method: 'POST',

                            headers: EduAuth.getAuthHeaders(),

                            body:
                                JSON.stringify(
                                    studentData
                                )
                        }
                    );

                }

                const result =
                    await response.json();

                console.log(
                    'BACKEND SAVE RESPONSE:',
                    result
                );

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        `HTTP ${response.status}`
                    );

                }

                alert(
                    result.message ||
                    'Student saved successfully.'
                );

                closeModal();

                // Reload students directly from MySQL
                await loadStudents();

            } catch (error) {

                console.error(
                    'Save student error:',
                    error
                );

                alert(
                    `Could not save student: ${error.message}`
                );
            }
        }
    );
}

// ============================================================
// DELETE
// ============================================================

async function deleteStudent(id) {

    const student = students.find(
        (item) =>
            String(item.id) === String(id)
    );

    if (!student) {
        return;
    }

    const confirmed = confirm(
        `Remove ${student.first} ${student.last} from the directory?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: 'DELETE',
                                headers: EduAuth.getAuthHeaders()
            }
        );

        const result =
            await response.json();

        console.log(
            'BACKEND DELETE RESPONSE:',
            result
        );

        if (!response.ok) {

            throw new Error(
                result.message ||
                `HTTP ${response.status}`
            );
        }

        alert(
            result.message ||
            'Student deleted successfully.'
        );

        // Reload from backend
        await loadStudents();

    } catch (error) {

        console.error(
            'Delete student error:',
            error
        );

        alert(
            `Could not delete student: ${error.message}`
        );
    }
}

// ============================================================
// INITIAL LOAD
// ============================================================

loadStudents();