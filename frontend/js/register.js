/**
 * js/register.js — JU Student Management Registration v2.5 (Enterprise)
 */

'use strict';

const API_BASE = window.EduAuth ? window.EduAuth.API_BASE : 'http://localhost:5000/api/v1';

// ── Auto-redirect if already logged in ────────────────────────
(function checkAlreadyLoggedIn() {
    const token  = localStorage.getItem('educore_token') || sessionStorage.getItem('educore_token');
    const flagOk = localStorage.getItem('isAuthenticated') === 'true';
    if (!token || !flagOk) return;
    try {
        const user = JSON.parse(localStorage.getItem('educore_user') || sessionStorage.getItem('educore_user') || '{}');
        if (user.role === 'student')      window.location.replace('student-dashboard.html');
        else if (user.role === 'teacher') window.location.replace('teacher-home.html');
        else                              window.location.replace('admin/dashboard.html');
    } catch (_) {}
})();

// ── DOM refs ──────────────────────────────────────────────────
const form        = document.getElementById('register-form');
const nameInput   = document.getElementById('name');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const submitBtn   = document.getElementById('submit-btn');
const formError   = document.getElementById('form-error');
const formSuccess = document.getElementById('form-success');
const togglePw    = document.getElementById('toggle-pw');
const pwFill      = document.getElementById('pw-fill');
const pwLabel     = document.getElementById('pw-label');

// ── Password visibility toggle ────────────────────────────────
if (togglePw) {
    togglePw.addEventListener('click', () => {
        const show = passInput.type === 'password';
        passInput.type = show ? 'text' : 'password';
        const showIcon = document.getElementById('eye-show');
        const hideIcon = document.getElementById('eye-hide');
        if (showIcon) showIcon.style.display = show ? 'none' : '';
        if (hideIcon) hideIcon.style.display = show ? '' : 'none';
        togglePw.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
}

// ── Password strength meter (12+ chars required by enterprise policy) ─────────
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
    return score;
}

if (passInput && pwFill && pwLabel) {
    passInput.addEventListener('input', () => {
        const pw = passInput.value;
        const score = pw ? getPasswordStrength(pw) : 0;

        const levels = [
            { pct: '0%',   bg: 'transparent', text: '' },
            { pct: '20%',  bg: '#ef4444',     text: '🔴 Very weak (needs 12+ chars)' },
            { pct: '40%',  bg: '#f97316',     text: '🟠 Weak' },
            { pct: '60%',  bg: '#eab308',     text: '🟡 Fair' },
            { pct: '80%',  bg: '#22c55e',     text: '🟢 Strong' },
            { pct: '100%', bg: '#059669',     text: '✅ Enterprise Compliant (12+ chars)' }
        ];
        const lvl = levels[score] || levels[0];
        pwFill.style.width      = lvl.pct;
        pwFill.style.background = lvl.bg;
        pwLabel.textContent     = lvl.text;
    });
}

// ── Validation ────────────────────────────────────────────────
function setFieldError(input, errorId, msg) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    if (input) input.classList.toggle('is-error', !!msg);
}

function validateName(v) {
    if (!v.trim()) return 'Name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
}

function validateEmail(v) {
    if (!v.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
}

function validatePassword(v) {
    if (!v) return 'Password is required.';
    if (v.length < 12) return 'Password must be at least 12 characters (Enterprise Policy).';
    if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(v)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(v)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) return 'Password must contain at least one special character.';
    return '';
}

nameInput.addEventListener('blur',  () => setFieldError(nameInput,  'name-error',  validateName(nameInput.value)));
emailInput.addEventListener('blur', () => setFieldError(emailInput, 'email-error', validateEmail(emailInput.value)));
passInput.addEventListener('blur',  () => setFieldError(passInput,  'pass-error',  validatePassword(passInput.value)));
nameInput.addEventListener('input',  () => { nameInput.classList.remove('is-error');  document.getElementById('name-error').textContent  = ''; });
emailInput.addEventListener('input', () => { emailInput.classList.remove('is-error'); document.getElementById('email-error').textContent = ''; });
passInput.addEventListener('input',  () => { passInput.classList.remove('is-error');  document.getElementById('pass-error').textContent  = ''; });

// ── Form submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = formSuccess.hidden = true;

    const nErr = validateName(nameInput.value);
    const eErr = validateEmail(emailInput.value);
    const pErr = validatePassword(passInput.value);
    if (nErr) { setFieldError(nameInput,  'name-error',  nErr); return; }
    if (eErr) { setFieldError(emailInput, 'email-error', eErr); return; }
    if (pErr) { setFieldError(passInput,  'pass-error',  pErr); return; }

    const roleRadio = document.querySelector('input[name="role"]:checked');
    const role = roleRadio ? roleRadio.value : 'student';

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                role,
                name:     nameInput.value.trim(),
                email:    emailInput.value.trim().toLowerCase(),
                password: passInput.value
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed.');

        formSuccess.textContent = `✅ Account created successfully! Please log in.`;
        formSuccess.hidden = false;

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);

    } catch (err) {
        formError.textContent = err.message;
        formError.hidden = false;
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
