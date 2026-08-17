/**
 * js/auth.js — JU Student Management — Shared Auth Utility  v2.0
 * ─────────────────────────────────────────────────────────────────────
 * Load on every protected page BEFORE other scripts:
 *   <script src="../js/auth.js"></script>   (from admin/ or any sub-dir)
 *   <script src="js/auth.js"></script>      (from frontend root)
 *
 * Public API (window.EduAuth):
 *   EduAuth.guard(allowedRoles?)  — redirect to login if not authenticated
 *   EduAuth.logout()              — clear session and go to login
 *   EduAuth.getUser()             — stored user object or null
 *   EduAuth.getToken()            — stored JWT or null
 *   EduAuth.getAuthHeaders()      — { Authorization: 'Bearer <token>' } object
 *   EduAuth.initTopbar()          — populate user chip + wire logout
 *   EduAuth.initSidebar()         — wire hamburger / overlay
 *   EduAuth.apiFetch(url, opts)   — fetch with auth header pre-attached
 */

'use strict';

(function () {

    // ── Helpers ──────────────────────────────────────────────────────

    /** Return the stored user object (checks localStorage then sessionStorage). */
    function getUser() {
        try {
            return (
                JSON.parse(localStorage.getItem('educore_user')) ||
                JSON.parse(sessionStorage.getItem('educore_user')) ||
                null
            );
        } catch (_) {
            return null;
        }
    }

    /** Return the stored JWT token. */
    function getToken() {
        return (
            localStorage.getItem('educore_token') ||
            sessionStorage.getItem('educore_token') ||
            null
        );
    }

    /**
     * Return headers object with Authorization header pre-filled.
     * This was missing before and caused ReferenceError on every page.
     */
    function getAuthHeaders() {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    /**
     * Wrapper around fetch() that automatically attaches the auth header.
     * Usage: const data = await EduAuth.apiFetch('/api/students');
     */
    async function apiFetch(url, options = {}) {
        const headers = Object.assign(getAuthHeaders(), options.headers || {});
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            logout();
            throw new Error('Session expired. Redirecting to login.');
        }
        return res;
    }

    // ── Path helpers ─────────────────────────────────────────────────

    /** Compute the relative path to login.html from the current page. */
    function getLoginUrl() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) return '../login.html';
        if (path.includes('/main-page/')) return '../login.html';
        return 'login.html';
    }

    // ── Logout ───────────────────────────────────────────────────────

    /**
     * Clear ONLY auth-related keys (not theme/preferences),
     * then redirect to login.
     */
    function logout() {
        const authKeys = ['educore_user', 'educore_token', 'isAuthenticated'];
        authKeys.forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        window.location.replace(getLoginUrl());
    }

    // ── Auth Guard ───────────────────────────────────────────────────

    /**
     * Call at the TOP of every protected page script.
     * @param {string[]} [allowedRoles]  — optional array of permitted roles.
     *   If omitted, any authenticated user passes.
     *   If provided, users with wrong roles are redirected appropriately.
     *
     * Role redirect logic:
     *   student      → student-dashboard.html  (or ../student-dashboard.html from admin/)
     *   teacher      → teacher-home.html
     *   admin/superadmin → admin/dashboard.html
     */
    function guard(allowedRoles) {
        const token  = getToken();
        const flagOk = localStorage.getItem('isAuthenticated') === 'true';

        if (!token || !flagOk) {
            window.location.replace(getLoginUrl());
            return;
        }

        const user = getUser();
        if (!user || !user.role) {
            window.location.replace(getLoginUrl());
            return;
        }

        // Role-specific redirect when the current page is off-limits
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            _redirectToRoleHome(user.role);
            return;
        }

        // Role CSS classes for conditional styling
        document.documentElement.classList.add('role-' + user.role);
        // Lift visibility:hidden gate (used on guarded pages)
        document.documentElement.classList.add('auth-ready');
    }

    /** Send the user to their default home page based on role. */
    function _redirectToRoleHome(role) {
        const path = window.location.pathname;
        const isInAdmin   = path.includes('/admin/');
        const isInSubdir  = isInAdmin || path.includes('/main-page/');
        const prefix      = isInSubdir ? '../' : '';

        if (role === 'student') {
            window.location.replace(prefix + 'student-dashboard.html');
        } else if (role === 'teacher') {
            window.location.replace(prefix + 'teacher-home.html');
        } else {
            // admin / superadmin
            window.location.replace(isInAdmin ? 'dashboard.html' : 'admin/dashboard.html');
        }
    }

    // ── Topbar ───────────────────────────────────────────────────────

    function initTopbar() {
        const dateEl = document.getElementById('topbar-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
        }

        const user = getUser();
        if (user) {
            const nameEl = document.getElementById('user-name');
            const avEl   = document.getElementById('user-avatar');
            const roleEl = document.getElementById('user-role');

            const displayName = user.name || 'User';
            const roleLabel   = { student: 'Student', teacher: 'Teacher', admin: 'Admin', superadmin: 'Super Admin' }[user.role] || user.role;

            if (nameEl) nameEl.textContent = displayName;
            if (roleEl) roleEl.textContent = roleLabel;
            if (avEl) {
                avEl.textContent = displayName
                    .split(' ')
                    .map(w => w[0] || '')
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
            }
        }
        _wireLogoutTriggers();
    }

    function _wireLogoutTriggers() {
        document.querySelectorAll('.logout-btn, [data-action="logout"]').forEach(el => {
            el.addEventListener('click', e => { e.preventDefault(); logout(); });
        });
        document.querySelectorAll('.btn-topbar').forEach(el => {
            if ((el.getAttribute('href') || '').includes('login')) {
                el.addEventListener('click', e => { e.preventDefault(); logout(); });
            }
        });
    }

    // ── Sidebar ──────────────────────────────────────────────────────

    function initSidebar() {
        const sidebar   = document.getElementById('sidebar');
        const overlay   = document.getElementById('sidebar-overlay');
        const hamburger = document.getElementById('hamburger');
        const closeBtn  = document.getElementById('sidebar-close');

        if (!sidebar) return;

        const open  = () => { sidebar.classList.add('open');    if (overlay) overlay.classList.add('show'); };
        const close = () => { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('show'); };

        if (hamburger) hamburger.addEventListener('click', open);
        if (closeBtn)  closeBtn.addEventListener('click', close);
        if (overlay)   overlay.addEventListener('click', close);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    // ── Public API ───────────────────────────────────────────────────

    window.EduAuth = {
        guard,
        logout,
        getUser,
        getToken,
        getAuthHeaders,   // ← was missing, caused ReferenceError
        apiFetch,
        initTopbar,
        initSidebar
    };

    // ── Site-header auto-init ─────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Mobile hamburger for landing nav
        const hamburgerBtn = document.getElementById('landing-hamburger-btn');
        const navLinks     = document.getElementById('nav-links');
        if (hamburgerBtn && navLinks) {
            const openMenu  = () => { navLinks.classList.add('active');    hamburgerBtn.setAttribute('aria-expanded', 'true');  hamburgerBtn.textContent = '✕'; };
            const closeMenu = () => { navLinks.classList.remove('active'); hamburgerBtn.setAttribute('aria-expanded', 'false'); hamburgerBtn.textContent = '☰'; };

            hamburgerBtn.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.contains('active') ? closeMenu() : openMenu(); });
            navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeMenu));
            document.addEventListener('click', e => { const hdr = document.getElementById('site-header'); if (hdr && !hdr.contains(e.target)) closeMenu(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

            // Inject mobile logout link if logged in
            if (getToken() && !navLinks.querySelector('.nav-link--mobile-logout')) {
                const a = document.createElement('a');
                a.href = '#'; a.className = 'nav-link nav-link--mobile-logout';
                a.textContent = '🔐 Log Out';
                a.addEventListener('click', e => { e.preventDefault(); logout(); });
                navLinks.appendChild(a);
            }
        }

        // Inject "Log Out" button into header-actions when logged in
        const headerActions = document.getElementById('header-actions');
        if (headerActions && getToken() && !headerActions.querySelector('.btn-logout')) {
            const btn = document.createElement('button');
            btn.className   = 'btn btn-outline btn-logout';
            btn.textContent = 'Log Out';
            btn.onclick     = logout;
            headerActions.appendChild(btn);
        }

        // Scroll shadow on header
        const siteHeader = document.getElementById('site-header');
        if (siteHeader) {
            window.addEventListener('scroll', () => {
                siteHeader.classList.toggle('scrolled', window.scrollY > 10);
            }, { passive: true });
        }
    });

})();
