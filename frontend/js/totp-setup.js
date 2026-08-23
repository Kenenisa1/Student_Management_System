/**
 * js/totp-setup.js — 2FA Enrollment Controller
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // Guard: Must be authenticated to setup 2FA
    EduAuth.guard();

    const loadingEl   = document.getElementById('setup-loading');
    const contentEl   = document.getElementById('setup-content');
    const qrImg       = document.getElementById('qr-image');
    const secretKeyEl = document.getElementById('secret-key');
    const form        = document.getElementById('verify-form');
    const codeInput   = document.getElementById('verify-code');
    const submitBtn   = document.getElementById('submit-btn');
    const formError   = document.getElementById('form-error');
    const formSuccess = document.getElementById('form-success');

    try {
        const res = await EduAuth.apiFetch('/auth/totp/setup');
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to initialize 2FA setup.');
        }

        qrImg.src = data.qrCodeUrl;
        secretKeyEl.textContent = data.secret;

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    } catch (err) {
        loadingEl.innerHTML = `<p style="color:#ef4444;">⚠️ ${err.message}</p><br><a href="login.html" class="btn btn-outline" style="padding:8px 16px;">Back to Login</a>`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formError.hidden = formSuccess.hidden = true;

        const token = codeInput.value.trim();
        if (!token || token.length !== 6) {
            document.getElementById('code-error').textContent = 'Please enter the 6-digit code from your app.';
            codeInput.classList.add('is-error');
            return;
        }

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const res = await EduAuth.apiFetch('/auth/totp/verify', {
                method: 'POST',
                body: JSON.stringify({ token })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Verification failed.');
            }

            formSuccess.textContent = '🎉 Two-Factor Authentication is now ENABLED on your account!';
            formSuccess.hidden = false;
            form.style.display = 'none';

            // Update user in local storage to record TOTP enabled
            const user = EduAuth.getUser();
            if (user) {
                user.totp_enabled = true;
                const store = localStorage.getItem('educore_user') ? localStorage : sessionStorage;
                store.setItem('educore_user', JSON.stringify(user));
            }

            setTimeout(() => {
                if (user.role === 'student') window.location.href = 'student-dashboard.html';
                else if (user.role === 'teacher') window.location.href = 'teacher-home.html';
                else window.location.href = 'admin/dashboard.html';
            }, 2000);

        } catch (err) {
            formError.textContent = err.message;
            formError.hidden = false;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
