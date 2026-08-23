/**
 * js/admin-login.js — JU Student Management Admin Login v2.5 (Enterprise)
 * Served from /admin/ subfolder — paths are relative to that level.
 */

'use strict';

// API_BASE from auth.js (loaded first), fallback for safety
const _API_BASE = (window.EduAuth && window.EduAuth.API_BASE) || 'http://localhost:5000/api/v1';

// ── Auto-redirect if already logged in ──────────────────────────
const _token = localStorage.getItem('educore_token') || sessionStorage.getItem('educore_token');
const _flagOk = localStorage.getItem('isAuthenticated') === 'true';
if (_token && _flagOk) {
  try {
    const u = JSON.parse(localStorage.getItem('educore_user') || sessionStorage.getItem('educore_user') || '{}');
    if (u.role === 'student')      window.location.replace('../student-dashboard.html');
    else if (u.role === 'teacher') window.location.replace('../teacher-home.html');
    else if (u.role === 'admin' || u.role === 'superadmin') window.location.replace('dashboard.html');
  } catch (_) {}
}

// ── DOM refs ──────────────────────────────────────────────────────
const form      = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const submitBtn  = document.getElementById('submit-btn');
const formError  = document.getElementById('form-error');
const togglePw   = document.getElementById('toggle-pw');
const totpGroup  = document.getElementById('totp-group');
const totpInput  = document.getElementById('totp');

// ── Password visibility toggle ─────────────────────────────────────
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

// ── Validation ─────────────────────────────────────────────────────
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
  totpInput.addEventListener('input', () => { totpInput.classList.remove('is-error'); const e = document.getElementById('totp-error'); if (e) e.textContent = ''; });
}

// ── Form submit ─────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const eErr = validateEmail(emailInput.value);
  const pErr = validatePassword(passInput.value);
  if (eErr) { setFieldError(emailInput, 'email-error', eErr); return; }
  if (pErr) { setFieldError(passInput,  'pass-error',  pErr); return; }

  // If TOTP step is visible, validate code
  if (totpGroup && totpGroup.style.display !== 'none') {
    if (!totpInput || !totpInput.value.trim() || totpInput.value.trim().length !== 6) {
      setFieldError(totpInput, 'totp-error', 'Enter the 6-digit code from your authenticator app.');
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

    const res = await fetch(`${_API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await res.json();

    // TOTP challenge returned
    if (data.requireTotp) {
      if (totpGroup) {
        totpGroup.style.display = 'block';
        if (totpInput) totpInput.focus();
      }
      formError.textContent = '🔒 Two-Factor Authentication required. Enter the 6-digit code from your authenticator app.';
      formError.style.background = 'rgba(59,130,246,0.1)';
      formError.style.color = '#3b82f6';
      formError.style.border = '1px solid rgba(59,130,246,0.3)';
      formError.hidden = false;
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      return;
    }

    if (!res.ok) {
      throw new Error(data.message || 'Login failed. Check your credentials.');
    }

    // Enforce admin-only access on this login page
    if (!['admin', 'superadmin'].includes(data.user.role)) {
      throw new Error('Access denied. This portal is for administrators only.');
    }

    const store = document.getElementById('remember-me')?.checked ? localStorage : sessionStorage;
    if (store === localStorage) {
      sessionStorage.removeItem('educore_user');
      sessionStorage.removeItem('educore_token');
    }

    store.setItem('educore_user', JSON.stringify(data.user));
    store.setItem('educore_token', data.token);
    localStorage.setItem('isAuthenticated', 'true');

    window.location.href = 'dashboard.html';

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
