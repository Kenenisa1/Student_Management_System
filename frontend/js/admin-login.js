/**
 * js/login.js — EduCore Authentication
 */

const _token = localStorage.getItem('educore_token') || sessionStorage.getItem('educore_token');
const _flagOk = localStorage.getItem('isAuthenticated') === 'true';
if (_token && _flagOk) {
  try {
    const u = JSON.parse(localStorage.getItem('educore_user') || sessionStorage.getItem('educore_user') || '{}');
    if (u.role === 'student') window.location.replace('../student-dashboard.html');
    else if (u.role === 'teacher') window.location.replace('../teacher-home.html');
    else if (u.role === 'admin' || u.role === 'superadmin') window.location.replace('dashboard.html');
  } catch (_) {}
}

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const submitBtn  = document.getElementById('submit-btn');
const formError  = document.getElementById('form-error');
const togglePw   = document.getElementById('toggle-pw');

togglePw.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  document.getElementById('eye-show').style.display = show ? 'none' : '';
  document.getElementById('eye-hide').style.display = show ? '' : 'none';
  togglePw.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

function setFieldError(input, errorId, msg) {
  document.getElementById(errorId).textContent = msg;
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

emailInput.addEventListener('blur', () => setFieldError(emailInput, 'email-error', validateEmail(emailInput.value)));
passInput.addEventListener('blur',  () => setFieldError(passInput,  'pass-error',  validatePassword(passInput.value)));
emailInput.addEventListener('input', () => { emailInput.classList.remove('is-error'); document.getElementById('email-error').textContent = ''; });
passInput.addEventListener('input',  () => { passInput.classList.remove('is-error');  document.getElementById('pass-error').textContent = ''; });

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
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passInput.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const store = document.getElementById('remember-me').checked ? localStorage : sessionStorage;
    
    // If we used sessionStorage previously, clear it when upgrading to localStorage
    if (store === localStorage) {
      sessionStorage.removeItem('educore_user');
      sessionStorage.removeItem('educore_token');
    }

    store.setItem('educore_user', JSON.stringify(data.user));
    store.setItem('educore_token', data.token);
    
    // Write auth flag
    localStorage.setItem('isAuthenticated', 'true');

    if (data.user.role === 'student') {
      window.location.href = '../student-dashboard.html';
    } else if (data.user.role === 'teacher') {
      window.location.href = '../teacher-home.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});
