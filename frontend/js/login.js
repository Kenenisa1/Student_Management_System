/**
 * js/login.js — EduCore Authentication
 */

// ── If already authenticated, skip straight to the app ────────
if (localStorage.getItem('isAuthenticated') === 'true') {
  window.location.replace('main-page/index.html');
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
  if (v.length < 6) return 'Password must be at least 6 characters.';
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

  await new Promise(r => setTimeout(r, 1100));

  const user = {
    name: emailInput.value.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    email: emailInput.value.trim(),
    role: 'Administrator',
  };
  const store = document.getElementById('remember-me').checked ? localStorage : sessionStorage;
  store.setItem('educore_user', JSON.stringify(user));

  // ── Write auth flag so all guarded pages can verify session ──
  localStorage.setItem('isAuthenticated', 'true');

  window.location.href = 'main-page/index.html';
});
