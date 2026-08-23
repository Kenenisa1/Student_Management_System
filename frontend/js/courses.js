/**
 * js/courses.js
 * EduCore Course Catalogue
 * Frontend ↔ Backend integration
 *
 * API:
 * GET    /api/courses
 * POST   /api/courses
 * PUT    /api/courses/:id
 * DELETE /api/courses/:id
 */

'use strict';

console.log("COURSES.JS LOADED");

// ============================================================
// API
// ============================================================

const API_URL = `${EduAuth.API_BASE}/courses`;

// ============================================================
// AUTH
// ============================================================

EduAuth.guard();
EduAuth.initTopbar();
EduAuth.initSidebar();

// ============================================================
// DEPARTMENT COLORS
// ============================================================

const DEPT_COLORS = {
    'Computer Science': {
        bg: '#eef2ff',
        color: '#4f46e5'
    },
    'Business Administration': {
        bg: '#f5f3ff',
        color: '#7c3aed'
    },
    'Engineering': {
        bg: '#ecfeff',
        color: '#0891b2'
    },
    'Natural Sciences': {
        bg: '#ecfdf5',
        color: '#059669'
    },
    'Arts & Humanities': {
        bg: '#fffbeb',
        color: '#d97706'
    },
    'Mathematics': {
        bg: '#fef2f2',
        color: '#dc2626'
    }
};

// ============================================================
// DATA
// ============================================================

let courses = [];
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
    const cDept = document.getElementById('c-dept');
    const dFilter = document.getElementById('dept-filter');

    if (cDept) {
        const currentVal = cDept.value;
        cDept.innerHTML = '<option value="">Select department…</option>' +
            loadedDepartments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (currentVal) cDept.value = currentVal;
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

const grid = document.getElementById('courses-grid');
const emptyCourses = document.getElementById('empty-courses');
const resultCount = document.getElementById('result-count');
const searchInput = document.getElementById('search-input');
const deptFilter = document.getElementById('dept-filter');
const creditFilter = document.getElementById('credit-filter');

// ============================================================
// CONVERT BACKEND DATA
// ============================================================

function normalizeCourse(course) {
    let deptName = course.department_name || course.dept;
    if (!deptName && course.department_id && loadedDepartments.length > 0) {
        const found = loadedDepartments.find(d => String(d.id) === String(course.department_id));
        if (found) deptName = found.name;
    }

    return {
        id: course.id,
        code: course.code || '',
        name: course.name || '',
        department_id: course.department_id,
        dept: deptName || String(course.department_id || '—'),
        instructor: course.instructor || '',
        credits: Number(course.credits || 3),
        enrolled: Number(course.enrolled || 0),
        desc: course.description || course.desc || ''
    };
}

// ============================================================
// GET COURSES
// ============================================================

async function loadCourses() {

    try {
        await loadDepartmentsOptions();
        const response = await fetch(API_URL, { headers: EduAuth.getAuthHeaders() });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log("COURSES BACKEND RESPONSE:", result);

        if (!result.success) {
            throw new Error(
                result.message || 'Failed to load courses.'
            );
        }

        courses = (result.data || []).map(normalizeCourse);

        refresh();

    } catch (error) {

        console.error(
            "GET courses error:",
            error
        );

        if (resultCount) {
            resultCount.textContent =
                'Could not load courses';
        }

        alert(
            `Could not load courses: ${error.message}`
        );
    }
}

// ============================================================
// RENDER
// ============================================================

function renderCourses(list) {

    if (!grid) {
        return;
    }

    grid.innerHTML = '';

    if (list.length === 0) {

        if (emptyCourses) {
            emptyCourses.classList.remove('hidden');
        }

        if (resultCount) {
            resultCount.textContent = '0 courses';
        }

        return;
    }

    if (emptyCourses) {
        emptyCourses.classList.add('hidden');
    }

    if (resultCount) {
        resultCount.textContent =
            `${list.length} course${list.length !== 1 ? 's' : ''}`;
    }

    const maxEnrolled = Math.max(
        ...courses.map(c => c.enrolled),
        1
    );

    list.forEach((course) => {

        const dc =
            DEPT_COLORS[course.dept] || {
                bg: '#f1f5f9',
                color: '#475569'
            };

        const pct =
            Math.round(
                (course.enrolled / maxEnrolled) * 100
            );

        const card =
            document.createElement('div');

        card.className = 'course-card';

        card.innerHTML = `
            <div class="course-card-top">

                <div class="course-card-header">

                    <span
                        class="course-code-badge"
                        style="
                            background:${dc.bg};
                            color:${dc.color}
                        "
                    >
                        ${course.code}
                    </span>

                    <div class="course-actions">

                        <button
                            class="btn-icon edit-course"
                            data-id="${course.id}"
                            title="Edit"
                            aria-label="Edit ${course.name}"
                        >
                            ✏️
                        </button>

                        <button
                            class="btn-icon btn-delete delete-course"
                            data-id="${course.id}"
                            title="Delete"
                            aria-label="Delete ${course.name}"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

                <h3 class="course-name">
                    ${course.name}
                </h3>

                ${
                    course.desc
                        ? `<p class="course-desc">${course.desc}</p>`
                        : ''
                }

                <div class="course-tags-row">

                    <span class="tag tag-dept">
                        ${course.dept}
                    </span>

                    ${
                        course.instructor
                            ? `<span class="tag tag-instructor">
                                ${course.instructor}
                               </span>`
                            : ''
                    }

                    <span class="tag tag-credits">
                        ${course.credits}
                        Credit${course.credits !== 1 ? 's' : ''}
                    </span>

                </div>

            </div>

            <div class="course-card-footer">

                <span class="enrolled-label">
                    Enrolled
                </span>

                <div class="enrolled-bar-wrap">

                    <div
                        class="enrolled-bar"
                        data-w="${pct}"
                        style="
                            width:0%;
                            background:${dc.color}
                        "
                    ></div>

                </div>

                <span class="enrolled-val">
                    ${course.enrolled}
                </span>

            </div>
        `;

        grid.appendChild(card);
    });

    requestAnimationFrame(() => {

        grid
            .querySelectorAll('.enrolled-bar')
            .forEach(bar => {

                bar.style.width =
                    `${bar.dataset.w}%`;
            });
    });

    grid
        .querySelectorAll('.edit-course')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => openModal(button.dataset.id)
            );
        });

    grid
        .querySelectorAll('.delete-course')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => deleteCourse(button.dataset.id)
            );
        });
}

// ============================================================
// FILTER
// ============================================================

function getFiltered() {

    const query =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : '';

    const department =
        deptFilter
            ? deptFilter.value
            : '';

    const credits =
        creditFilter
            ? creditFilter.value
            : '';

    return courses.filter(course => {

        const matchesSearch =
            !query ||
            course.name
                .toLowerCase()
                .includes(query) ||

            course.code
                .toLowerCase()
                .includes(query) ||

            course.instructor
                .toLowerCase()
                .includes(query);

        const matchesDepartment =
            !department ||
            String(course.department_id) ===
                String(department) ||
            course.dept === department;

        const matchesCredits =
            !credits ||
            String(course.credits) ===
                String(credits);

        return (
            matchesSearch &&
            matchesDepartment &&
            matchesCredits
        );
    });
}

function refresh() {
    renderCourses(getFiltered());
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

if (creditFilter) {
    creditFilter.addEventListener(
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

const courseForm =
    document.getElementById('course-form');

const addCourseBtn =
    document.getElementById('add-course-btn');

const F = {

    editId:
        document.getElementById('course-edit-id'),

    code:
        document.getElementById('c-code'),

    credits:
        document.getElementById('c-credits'),

    name:
        document.getElementById('c-name'),

    dept:
        document.getElementById('c-dept'),

    instructor:
        document.getElementById('c-instructor'),

    enrolled:
        document.getElementById('c-enrolled'),

    desc:
        document.getElementById('c-desc')
};

// ============================================================
// OPEN MODAL
// ============================================================

function openModal(editId = null) {

    if (!courseForm || !modalBackdrop) {
        return;
    }

    courseForm.reset();

    clearErrors();

    if (editId !== null) {

        const course =
            courses.find(
                item =>
                    String(item.id) ===
                    String(editId)
            );

        if (!course) {
            return;
        }

        if (modalTitle) {
            modalTitle.textContent =
                'Edit Course';
        }

        if (F.editId) {
            F.editId.value =
                course.id;
        }

        if (F.code) {
            F.code.value =
                course.code;
        }

        if (F.credits) {
            F.credits.value =
                course.credits;
        }

        if (F.name) {
            F.name.value =
                course.name;
        }

        if (F.dept) {
            F.dept.value =
                course.department_id;
        }

        if (F.instructor) {
            F.instructor.value =
                course.instructor || '';
        }

        if (F.enrolled) {
            F.enrolled.value =
                course.enrolled || 0;
        }

        if (F.desc) {
            F.desc.value =
                course.desc || '';
        }

    } else {

        if (modalTitle) {
            modalTitle.textContent =
                'Add New Course';
        }

        if (F.editId) {
            F.editId.value = '';
        }
    }

    modalBackdrop.hidden = false;

    if (F.code) {
        F.code.focus();
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

// ============================================================
// VALIDATION
// ============================================================

function setErr(
    inputId,
    errId,
    message
) {

    const input =
        document.getElementById(inputId);

    const error =
        document.getElementById(errId);

    if (input) {

        input.classList.toggle(
            'is-error',
            Boolean(message)
        );
    }

    if (error) {
        error.textContent =
            message;
    }
}

function clearErrors() {

    [
        ['c-code', 'err-c-code'],
        ['c-credits', 'err-c-credits'],
        ['c-name', 'err-c-name'],
        ['c-dept', 'err-c-dept']
    ].forEach(
        ([inputId, errorId]) => {

            setErr(
                inputId,
                errorId,
                ''
            );
        }
    );
}

// ============================================================
// MODAL EVENTS
// ============================================================

if (addCourseBtn) {

    addCourseBtn.addEventListener(
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
        event => {

            if (
                event.target ===
                modalBackdrop
            ) {
                closeModal();
            }
        }
    );
}

document.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Escape') {
            closeModal();
        }
    }
);

// ============================================================
// CREATE / UPDATE COURSE
// ============================================================

if (courseForm) {

    courseForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            clearErrors();

            let valid = true;

            if (!F.code?.value.trim()) {

                setErr(
                    'c-code',
                    'err-c-code',
                    'Course code is required.'
                );

                valid = false;
            }

            if (!F.credits?.value) {

                setErr(
                    'c-credits',
                    'err-c-credits',
                    'Select credit hours.'
                );

                valid = false;
            }

            if (!F.name?.value.trim()) {

                setErr(
                    'c-name',
                    'err-c-name',
                    'Course name is required.'
                );

                valid = false;
            }

            if (!F.dept?.value) {

                setErr(
                    'c-dept',
                    'err-c-dept',
                    'Select a department.'
                );

                valid = false;
            }

            if (!valid) {
                return;
            }

            // ------------------------------------------------
            // FRONTEND → BACKEND FORMAT
            // ------------------------------------------------

            const courseData = {
                name: F.name.value.trim(),
                code: F.code.value.trim().toUpperCase(),
                department_id: Number(F.dept.value) || null,
                instructor: F.instructor ? F.instructor.value.trim() : '',
                credits: F.credits ? Number(F.credits.value) : 3,
                description: F.desc ? F.desc.value.trim() : ''
            };

            console.log(
                "SENDING COURSE TO BACKEND:",
                courseData
            );

            const editId =
                F.editId?.value;

            try {

                let response;

                // ------------------------------------------------
                // UPDATE
                // ------------------------------------------------

                if (editId) {

                    response =
                        await fetch(
                            `${API_URL}/${editId}`,
                            {
                                method: 'PUT',

                                headers: EduAuth.getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        courseData
                                    )
                            }
                        );

                }

                // ------------------------------------------------
                // CREATE
                // ------------------------------------------------

                else {

                    response =
                        await fetch(
                            API_URL,
                            {
                                method: 'POST',

                                headers: EduAuth.getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        courseData
                                    )
                            }
                        );
                }

                const result =
                    await response.json();

                console.log(
                    "COURSE SAVE RESPONSE:",
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
                    'Course saved successfully.'
                );

                closeModal();

                // Get fresh data from database
                await loadCourses();

            } catch (error) {

                console.error(
                    "SAVE COURSE ERROR:",
                    error
                );

                alert(
                    `Could not save course: ${error.message}`
                );
            }
        }
    );
}

// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

    const course =
        courses.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!course) {
        return;
    }

    const confirmed =
        confirm(
            `Delete "${course.name}" (${course.code})?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: 'DELETE',
                                headers: EduAuth.getAuthHeaders()
                }
            );

        const result =
            await response.json();

        console.log(
            "COURSE DELETE RESPONSE:",
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
            'Course deleted successfully.'
        );

        // Reload directly from database
        await loadCourses();

    } catch (error) {

        console.error(
            "DELETE COURSE ERROR:",
            error
        );

        alert(
            `Could not delete course: ${error.message}`
        );
    }
}

// ============================================================
// INITIAL LOAD
// ============================================================

loadCourses();