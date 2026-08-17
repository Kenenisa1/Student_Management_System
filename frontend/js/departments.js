/**
 * js/departments.js
 * Departments — Frontend ↔ Backend integration
 *
 * Backend API:
 * GET    /api/departments
 * GET    /api/departments/:id
 * POST   /api/departments
 * PUT    /api/departments/:id
 * DELETE /api/departments/:id
 */

'use strict';

// ============================================================
// AUTH
// ============================================================

EduAuth.guard();
EduAuth.initTopbar();
EduAuth.initSidebar();

// ============================================================
// API
// ============================================================

const API_URL = 'http://localhost:5000/api/departments';

// ============================================================
// DATA
// ============================================================

let departments = [];

// ============================================================
// DOM
// ============================================================

const grid = document.getElementById('dept-grid');
const summary = document.getElementById('dept-summary');

const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');

const deptForm = document.getElementById('dept-form');
const addDeptBtn = document.getElementById('add-dept-btn');

const F = {
    editId: document.getElementById('dept-edit-id'),
    name: document.getElementById('d-name'),
    head: document.getElementById('d-head'),
    students: document.getElementById('d-students'),
    color: document.getElementById('d-color'),
    courses: document.getElementById('d-courses'),
    desc: document.getElementById('d-desc')
};

// ============================================================
// LOAD DEPARTMENTS FROM BACKEND
// ============================================================

async function loadDepartments() {

    try {

        console.log('Loading departments from backend...');

        const response = await fetch(API_URL, { headers: EduAuth.getAuthHeaders() });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log('DEPARTMENTS BACKEND RESPONSE:', result);

        if (!result.success) {
            throw new Error(
                result.message || 'Failed to load departments.'
            );
        }

        departments = result.data || [];

        renderDepartments();

    } catch (error) {

        console.error(
            'GET departments error:',
            error
        );

        if (grid) {
            grid.innerHTML = `
                <div style="padding:20px;color:#dc2626;">
                    Could not load departments:
                    ${error.message}
                </div>
            `;
        }
    }
}

// ============================================================
// SUMMARY
// ============================================================

function renderSummary() {

    if (!summary) {
        return;
    }

    summary.innerHTML = `
        <div class="summary-card">

            <div class="summary-icon"
                 style="background:#eef2ff;color:#4f46e5">

                🏫

            </div>

            <div class="summary-body">

                <div class="summary-val">
                    ${departments.length}
                </div>

                <div class="summary-lbl">
                    Total Departments
                </div>

            </div>

        </div>
    `;
}

// ============================================================
// RENDER DEPARTMENTS
// ============================================================

function renderDepartments() {

    renderSummary();

    if (!grid) {
        return;
    }

    grid.innerHTML = '';

    if (departments.length === 0) {

        grid.innerHTML = `
            <div style="padding:20px;">
                No departments found in the database.
            </div>
        `;

        return;
    }

    departments.forEach((department, index) => {

        const color =
            ['#4f46e5',
             '#7c3aed',
             '#0891b2',
             '#059669',
             '#d97706',
             '#dc2626'][index % 6];

        const name =
            department.name || 'Unnamed Department';

        const initials =
            name
                .split(' ')
                .filter(Boolean)
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

        const card =
            document.createElement('div');

        card.className = 'dept-card';

        card.innerHTML = `

            <div
                class="dept-card-accent"
                style="background:${color}">
            </div>

            <div class="dept-card-body">

                <div class="dept-card-header">

                    <div>

                        <div class="dept-name">
                            ${name}
                        </div>

                        <div class="dept-head-row">

                            <div
                                class="dept-head-avatar"
                                style="background:${color}">
                                ${initials}
                            </div>

                            <span class="dept-head-name">
                                Department ID: ${department.id}
                            </span>

                        </div>

                    </div>

                    <div class="dept-actions">

                        <button
                            class="btn-icon edit-dept"
                            data-id="${department.id}"
                            title="Edit"
                            aria-label="Edit department">

                            ✏️

                        </button>

                        <button
                            class="btn-icon btn-delete delete-dept"
                            data-id="${department.id}"
                            title="Delete"
                            aria-label="Delete department">

                            🗑️

                        </button>

                    </div>

                </div>

                <div class="dept-stats">

                    <div class="dept-stat">

                        <div class="dept-stat-val">
                            ${department.id}
                        </div>

                        <div class="dept-stat-lbl">
                            Department ID
                        </div>

                    </div>

                </div>

            </div>
        `;

        grid.appendChild(card);
    });

    // EDIT BUTTONS

    grid
        .querySelectorAll('.edit-dept')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => openModal(button.dataset.id)
            );

        });

    // DELETE BUTTONS

    grid
        .querySelectorAll('.delete-dept')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => deleteDepartment(button.dataset.id)
            );

        });
}

// ============================================================
// MODAL
// ============================================================

function openModal(editId = null) {

    if (!deptForm || !modalBackdrop) {
        return;
    }

    deptForm.reset();
    clearErrors();

    if (editId !== null) {

        const department =
            departments.find(
                item =>
                    String(item.id) === String(editId)
            );

        if (!department) {
            return;
        }

        modalTitle.textContent =
            'Edit Department';

        F.editId.value =
            department.id;

        F.name.value =
            department.name || '';

        // These fields are NOT stored by the backend.
        if (F.head) F.head.value = '';
        if (F.students) F.students.value = '';
        if (F.courses) F.courses.value = '';
        if (F.desc) F.desc.value = '';

    } else {

        modalTitle.textContent =
            'Add New Department';

        F.editId.value = '';

    }

    modalBackdrop.hidden = false;

    if (F.name) {
        F.name.focus();
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

if (addDeptBtn) {

    addDeptBtn.addEventListener(
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

            if (event.target === modalBackdrop) {
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
// VALIDATION
// ============================================================

function setError(
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

function clearErrors() {

    setError(
        'd-name',
        'err-d-name',
        ''
    );

    setError(
        'd-head',
        'err-d-head',
        ''
    );
}

// ============================================================
// CREATE / UPDATE
// ============================================================

if (deptForm) {

    deptForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            clearErrors();

            if (!F.name.value.trim()) {

                setError(
                    'd-name',
                    'err-d-name',
                    'Department name is required.'
                );

                return;
            }

            const departmentData = {

                name:
                    F.name.value.trim()

            };

            const editId =
                F.editId.value;

            try {

                let response;

                // UPDATE

                if (editId) {

                    response =
                        await fetch(
                            `${API_URL}/${editId}`,
                            {
                                method: 'PUT',

                                headers: EduAuth.getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        departmentData
                                    )
                            }
                        );

                }

                // CREATE

                else {

                    response =
                        await fetch(
                            API_URL,
                            {
                                method: 'POST',

                                headers: EduAuth.getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        departmentData
                                    )
                            }
                        );

                }

                const result =
                    await response.json();

                console.log(
                    'DEPARTMENT SAVE RESPONSE:',
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
                    'Department saved successfully.'
                );

                closeModal();

                // Reload directly from MySQL

                await loadDepartments();

            } catch (error) {

                console.error(
                    'Save department error:',
                    error
                );

                alert(
                    `Could not save department: ${error.message}`
                );

            }

        }
    );

}

// ============================================================
// DELETE
// ============================================================

async function deleteDepartment(id) {

    const department =
        departments.find(
            item =>
                String(item.id) === String(id)
        );

    if (!department) {
        return;
    }

    const confirmed =
        confirm(
            `Delete the "${department.name}" department?`
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
            'DEPARTMENT DELETE RESPONSE:',
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
            'Department deleted successfully.'
        );

        await loadDepartments();

    } catch (error) {

        console.error(
            'Delete department error:',
            error
        );

        alert(
            `Could not delete department: ${error.message}`
        );

    }
}

// ============================================================
// INITIAL LOAD
// ============================================================

loadDepartments();