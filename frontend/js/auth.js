/**
 * js/auth.js — JU Student Management — Shared Auth Utility v2.5 (Enterprise)
 * ─────────────────────────────────────────────────────────────────────
 * Load on every protected page BEFORE other scripts:
 *   <script src="../js/auth.js"></script>   (from admin/ or any sub-dir)
 *   <script src="js/auth.js"></script>      (from frontend root)
 *
 * Public API (window.EduAuth):
 *   EduAuth.API_BASE              — centralized API endpoint base
 *   EduAuth.guard(allowedRoles?)  — redirect to login if not authenticated
 *   EduAuth.logout()              — clear session and go to login
 *   EduAuth.getUser()             — stored user object or null
 *   EduAuth.getToken()            — stored JWT or null
 *   EduAuth.getAuthHeaders()      — { Authorization: 'Bearer <token>' } object
 *   EduAuth.initTopbar()          — populate user chip + wire logout
 *   EduAuth.initSidebar()         — wire hamburger / overlay
 *   EduAuth.apiFetch(url, opts)   — fetch with auth header, cookies, & auto-token-refresh
 */

'use strict';

(function () {

    // ── Centralized API Base ─────────────────────────────────────────
    const isLocalCustomPort = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isUnderProxy = window.location.port === '80' || window.location.port === '' || window.location.port === '443';
    
    // When served via Nginx (port 80), use relative '/api/v1'. Otherwise fallback to port 5000 backend.
    const API_BASE = isUnderProxy && !isLocalCustomPort
        ? '/api/v1'
        : `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;

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

    /** Return headers object with Authorization header pre-filled. */
    function getAuthHeaders() {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    /** Normalize relative paths into absolute API URLs using API_BASE */
    function resolveUrl(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Normalize /api/ or /api/v1/ prefixes
        if (url.startsWith('/api/v1/')) {
            return `${API_BASE}${url.replace('/api/v1', '')}`;
        }
        if (url.startsWith('/api/')) {
            return `${API_BASE}${url.replace('/api', '')}`;
        }
        if (url.startsWith('/')) {
            return `${API_BASE}${url}`;
        }
        return `${API_BASE}/${url}`;
    }

    /** Attempt to refresh access token using the HttpOnly refresh token cookie */
    let isRefreshing = false;
    let refreshSubscribers = [];

    function subscribeTokenRefresh(cb) {
        refreshSubscribers.push(cb);
    }

    function onRefreshed(token) {
        refreshSubscribers.forEach(cb => cb(token));
        refreshSubscribers = [];
    }

    async function tryRefreshToken() {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.token) {
                const store = localStorage.getItem('educore_token') ? localStorage : sessionStorage;
                store.setItem('educore_token', data.token);
                return data.token;
            }
        } catch (e) {
            console.error('[EduAuth] Refresh token failed:', e);
        }
        return null;
    }

    /**
     * Wrapper around fetch() that automatically attaches auth headers, credentials,
     * and performs automatic token rotation on 401 Unauthorized responses.
     */
    async function apiFetch(url, options = {}) {
        const fullUrl = resolveUrl(url);
        const headers = Object.assign(getAuthHeaders(), options.headers || {});
        
        let res = await fetch(fullUrl, { credentials: 'include', ...options, headers });

        // Token expired or invalid — attempt refresh rotation
        if (res.status === 401 && !fullUrl.includes('/auth/login') && !fullUrl.includes('/auth/refresh')) {
            if (!isRefreshing) {
                isRefreshing = true;
                const newToken = await tryRefreshToken();
                isRefreshing = false;
                if (newToken) {
                    onRefreshed(newToken);
                    headers['Authorization'] = `Bearer ${newToken}`;
                    return fetch(fullUrl, { credentials: 'include', ...options, headers });
                } else {
                    logout();
                    throw new Error('Session expired. Redirecting to login.');
                }
            } else {
                // Wait for ongoing refresh
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        headers['Authorization'] = `Bearer ${token}`;
                        resolve(fetch(fullUrl, { credentials: 'include', ...options, headers }));
                    });
                });
            }
        }

        return res;
    }

    // ── Path helpers ─────────────────────────────────────────────────

    function getLoginUrl() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) return '../login.html';
        if (path.includes('/main-page/')) return '../login.html';
        return 'login.html';
    }

    // ── Logout ───────────────────────────────────────────────────────

    async function logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (e) {
            console.error('Logout error:', e);
        }

        const authKeys = ['educore_user', 'educore_token', 'isAuthenticated'];
        authKeys.forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        window.location.replace(getLoginUrl());
    }

    // ── Auth Guard ───────────────────────────────────────────────────

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

        if (allowedRoles && !allowedRoles.includes(user.role)) {
            _redirectToRoleHome(user.role);
            return;
        }

        document.documentElement.classList.add('role-' + user.role);
        document.documentElement.classList.add('auth-ready');
    }

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
        API_BASE,
        guard,
        logout,
        getUser,
        getToken,
        getAuthHeaders,
        apiFetch,
        initTopbar,
        initSidebar
    };

    // ── Site-header auto-init ─────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const hamburgerBtn = document.getElementById('landing-hamburger-btn');
        const navLinks     = document.getElementById('nav-links');
        if (hamburgerBtn && navLinks) {
            const openMenu  = () => { navLinks.classList.add('active');    hamburgerBtn.setAttribute('aria-expanded', 'true');  hamburgerBtn.textContent = '✕'; };
            const closeMenu = () => { navLinks.classList.remove('active'); hamburgerBtn.setAttribute('aria-expanded', 'false'); hamburgerBtn.textContent = '☰'; };

            hamburgerBtn.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.contains('active') ? closeMenu() : openMenu(); });
            navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeMenu));
            document.addEventListener('click', e => { const hdr = document.getElementById('site-header'); if (hdr && !hdr.contains(e.target)) closeMenu(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

            if (getToken() && !navLinks.querySelector('.nav-link--mobile-logout')) {
                const a = document.createElement('a');
                a.href = '#'; a.className = 'nav-link nav-link--mobile-logout';
                a.textContent = '🔐 Log Out';
                a.addEventListener('click', e => { e.preventDefault(); logout(); });
                navLinks.appendChild(a);
            }
        }

        const headerActions = document.getElementById('header-actions');
        if (headerActions && getToken() && !headerActions.querySelector('.btn-logout')) {
            const btn = document.createElement('button');
            btn.className   = 'btn btn-outline btn-logout';
            btn.textContent = 'Log Out';
            btn.onclick     = logout;
            headerActions.appendChild(btn);
        }

        const siteHeader = document.getElementById('site-header');
        if (siteHeader) {
            window.addEventListener('scroll', () => {
                siteHeader.classList.toggle('scrolled', window.scrollY > 10);
            }, { passive: true });
        }
    });

})();
