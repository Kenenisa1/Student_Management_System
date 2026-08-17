/**
 * js/login.js — JU Student Management Login v2.0
 * ─────────────────────────────────────────────────────────────────────
 * Role-based redirect after successful login:
 *   student      → student-dashboard.html
 *   teacher      → teacher-home.html
 *   admin        → admin/dashboard.html
 *   superadmin   → admin/dashboard.html
 */

const API_BASE = 'http://localhost:5000';

// ── Auto-redirect if already logged in ───────────────────────
(function checkAlreadyLoggedIn() {
    const token  = localStorage.getItem('educore_token') || sessionStorage.getItem('educore_token');
    const flagOk = localStorage.getItem('isAuthenticated') === 'true';
    if (!token || !flagOk) return;

    try {
        const user = JSON.parse(
            localStorage.getItem('educore_user') ||
            sessionStorage.getItem('educore_user') ||
            '{}'
        );
        redirectByRole(user.role);
    } catch (_) { /* ignore parse errors */ }
})();

function redirectByRole(role) {
    if (role === 'student')     { window.location.replace('student-dashboard.html'); return; }
    if (role === 'teacher')     { window.location.replace('teacher-home.html');      return; }
    if (role === 'admin' || role === 'superadmin') {
        window.location.replace('admin/dashboard.html');
        return;
    }
}

// ── DOM refs ──────────────────────────────────────────────────
const form      = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const submitBtn  = document.getElementById('submit-btn');
const formError  = document.getElementById('form-error');
const togglePw   = document.getElementById('toggle-pw');

// ── Password visibility toggle ────────────────────────────────
togglePw.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    document.getElementById('eye-show').style.display = show ? 'none' : '';
    document.getElementById('eye-hide').style.display = show ? '' : 'none';
    togglePw.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

// ── Inline validation helpers ─────────────────────────────────
function setFieldError(input, errorId, msg) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    input.classList.toggle('is-error', !!msg);
}
function validateEmail(v) {
    if (!v.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
}
function validatePassword(v) {
    if (!v) return 'Password is required.';
    return '';
}

emailInput.addEventListener('blur',  () => setFieldError(emailInput, 'email-error', validateEmail(emailInput.value)));
passInput.addEventListener('blur',   () => setFieldError(passInput,  'pass-error',  validatePassword(passInput.value)));
emailInput.addEventListener('input', () => { emailInput.classList.remove('is-error'); document.getElementById('email-error').textContent = ''; });
passInput.addEventListener('input',  () => { passInput.classList.remove('is-error');  document.getElementById('pass-error').textContent  = ''; });

// ── Form submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const eErr = validateEmail(emailInput.value);
    const pErr = validatePassword(passInput.value);
    if (eErr) { setFieldError(emailInput, 'email-error', eErr); return; }
    if (pErr) { setFieldError(passInput,  'pass-error',  pErr); return; }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const res  = await fetch(`${API_BASE}/api/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                email:    emailInput.value.trim().toLowerCase(),
                password: passInput.value
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }

        // Store session in the chosen storage
        const store = document.getElementById('remember-me').checked ? localStorage : sessionStorage;

        // Clear other storage to avoid stale data
        ['educore_user', 'educore_token'].forEach(k => {
            (store === localStorage ? sessionStorage : localStorage).removeItem(k);
        });

        store.setItem('educore_user',  JSON.stringify(data.user));
        store.setItem('educore_token', data.token);
        localStorage.setItem('isAuthenticated', 'true');  // flag always in localStorage

        redirectByRole(data.user.role);

    } catch (err) {
        formError.textContent = err.message;
        formError.hidden = false;
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
