/**
 * js/login.js — JU Student Management Login v2.5 (Enterprise)
 * ─────────────────────────────────────────────────────────────────────
 * Role-based redirect after successful login:
 *   student      → student-dashboard.html
 *   teacher      → teacher-home.html
 *   admin        → admin/dashboard.html
 *   superadmin   → admin/dashboard.html
 */

'use strict';

const API_BASE = window.EduAuth ? window.EduAuth.API_BASE : 'http://localhost:5000/api/v1';

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
const form       = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const submitBtn  = document.getElementById('submit-btn');
const formError  = document.getElementById('form-error');
const togglePw   = document.getElementById('toggle-pw');
const totpGroup  = document.getElementById('totp-group');
const totpInput  = document.getElementById('totp');

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

// ── Inline validation helpers ─────────────────────────────────
function setFieldError(input, errorId, msg) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    if (input) input.classList.toggle('is-error', !!msg);
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

if (totpInput) {
    totpInput.addEventListener('input', () => {
        totpInput.classList.remove('is-error');
        const err = document.getElementById('totp-error');
        if (err) err.textContent = '';
    });
}

// ── Form submit ───────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const eErr = validateEmail(emailInput.value);
    const pErr = validatePassword(passInput.value);
    if (eErr) { setFieldError(emailInput, 'email-error', eErr); return; }
    if (pErr) { setFieldError(passInput,  'pass-error',  pErr); return; }

    if (totpGroup && totpGroup.style.display !== 'none') {
        if (!totpInput || !totpInput.value.trim() || totpInput.value.trim().length !== 6) {
            setFieldError(totpInput, 'totp-error', 'Please enter your 6-digit authenticator code.');
            return;
        }
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const body = {
            email:    emailInput.value.trim().toLowerCase(),
            password: passInput.value
        };

        if (totpInput && totpInput.value.trim()) {
            body.totpToken = totpInput.value.trim();
        }

        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        const data = await res.json();

        // Check if 2FA is required
        if (data.requireTotp) {
            if (totpGroup) {
                totpGroup.style.display = 'block';
                if (totpInput) totpInput.focus();
            }
            formError.textContent = '🔒 Two-Factor Authentication required. Enter the 6-digit code from your authenticator app.';
            formError.style.background = 'rgba(59, 130, 246, 0.1)';
            formError.style.color = '#3b82f6';
            formError.style.border = '1px solid rgba(59, 130, 246, 0.3)';
            formError.hidden = false;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }

        if (!res.ok) {
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }

        const rememberMe = document.getElementById('remember-me');
        const store = rememberMe && rememberMe.checked ? localStorage : sessionStorage;

        // Clear out opposing storage to avoid sync issues
        if (store === localStorage) {
            sessionStorage.removeItem('educore_user');
            sessionStorage.removeItem('educore_token');
        } else {
            localStorage.removeItem('educore_user');
            localStorage.removeItem('educore_token');
        }

        store.setItem('educore_user', JSON.stringify(data.user));
        store.setItem('educore_token', data.token);
        localStorage.setItem('isAuthenticated', 'true');

        redirectByRole(data.user.role);

    } catch (err) {
        formError.textContent = err.message;
        formError.style.background = '';
        formError.style.color = '';
        formError.style.border = '';
        formError.hidden = false;
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
