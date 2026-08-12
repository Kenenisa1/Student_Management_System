/**
 * js/auth.js — EduCore Shared Authentication Utility
 * ─────────────────────────────────────────────────────────────
 * Load this script FIRST on every guarded page via:
 *   <script src="js/auth.js"></script>
 *
 * Exports (as window globals, no module bundler required):
 *   EduAuth.guard()          — redirect to login if not authenticated
 *   EduAuth.logout()         — clear session and redirect to login
 *   EduAuth.initTopbar()     — populate topbar date, user chip, logout btn
 *   EduAuth.initSidebar()    — wire hamburger / overlay / close button
 *   EduAuth.getUser()        — returns the stored user object or null
 */

'use strict';

(function () {
  // ── Helpers ──────────────────────────────────────────────────

  /** Retrieve the stored user from localStorage or sessionStorage. */
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

  /** Helper to get relative login page path based on current location */
  function getLoginUrl() {
    const isMainPage = window.location.pathname.includes('/main-page/') || window.location.href.includes('/main-page/');
    return isMainPage ? '../login.html' : 'login.html';
  }

  /** Clear all auth tokens and user data, then redirect to login. */
  function logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('educore_user');
    sessionStorage.removeItem('educore_user');
    window.location.href = getLoginUrl();
  }

  // ── Auth guard ───────────────────────────────────────────────
  /**
   * Call guard() at the top of every protected page script.
   * If the session flag is absent the user is sent to login.html
   * immediately — no further JS on the page runs.
   *
   * For index.html, also adds `auth-ready` to <html> so the
   * flash-of-content prevention style is lifted.
   */
  function guard() {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      window.location.href = getLoginUrl();
      return; // halt remaining script execution in the caller
    }
    // Lift the visibility:hidden gate used on index.html
    document.documentElement.classList.add('auth-ready');
  }

  // ── Topbar initialisation ────────────────────────────────────
  /**
   * Populates:
   *  - #topbar-date     — formatted date string
   *  - #user-name       — name from stored user
   *  - #user-avatar     — two-letter initials
   *  - #user-role       — role label
   *  - .logout-btn / .btn-topbar — wired to EduAuth.logout()
   *
   * All selectors are null-checked so this is safe to call on
   * any page regardless of its exact DOM structure.
   */
  function initTopbar() {
    // Date
    const dateEl = document.getElementById('topbar-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      });
    }

    // User info
    const user = getUser();
    if (user) {
      const nameEl = document.getElementById('user-name');
      const avEl   = document.getElementById('user-avatar');
      const roleEl = document.getElementById('user-role');

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role || 'Administrator';
      if (avEl) {
        avEl.textContent = user.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
      }
    }

    // Wire ALL logout triggers on the page
    _wireLogoutTriggers();
  }

  /**
   * Wire every element that should trigger logout.
   * Covers: <a class="logout-btn">, .btn-topbar[href="login.html"],
   * and any element with data-action="logout".
   * Converts <a> logout links to buttons (prevents plain navigation
   * that skips session cleanup).
   */
  function _wireLogoutTriggers() {
    // Sidebar logout icon link
    document.querySelectorAll('.logout-btn').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    });

    // Topbar "Logout" button/link
    document.querySelectorAll('.btn-topbar').forEach(el => {
      // Only intercept if it points to login (i.e. it IS the logout button)
      const href = el.getAttribute('href') || '';
      if (href.includes('login')) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          logout();
        });
      }
    });

    // Generic escape hatch: data-action="logout"
    document.querySelectorAll('[data-action="logout"]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    });
  }

  // ── Sidebar initialisation ───────────────────────────────────
  /**
   * Wires the mobile sidebar hamburger, close button, and overlay.
   * All selectors are null-checked — safe to call on every app page.
   */
  function initSidebar() {
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger');
    const closeBtn  = document.getElementById('sidebar-close');

    if (!sidebar) return;

    function openSidebar()  {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('show');
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    }

    if (hamburger) hamburger.addEventListener('click', openSidebar);
    if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
    if (overlay)   overlay.addEventListener('click', closeSidebar);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSidebar();
    });
  }

  // ── Public API ───────────────────────────────────────────────
  window.EduAuth = {
    guard,
    logout,
    initTopbar,
    initSidebar,
    getUser,
  };

  // ── Site-header auto-init (runs on every page) ───────────────
  // Wires the landing hamburger and populates #header-actions
  // with a Log Out button whenever the site-header is present.
  document.addEventListener('DOMContentLoaded', function initSiteHeader() {

    // Hamburger ↔ nav-links toggle
    const hamburgerBtn = document.getElementById('landing-hamburger-btn');
    const navLinks     = document.getElementById('nav-links');

    if (hamburgerBtn && navLinks) {
      function openMenu()  { navLinks.classList.add('active'); hamburgerBtn.setAttribute('aria-expanded','true');  hamburgerBtn.textContent = '✕'; }
      function closeMenu() { navLinks.classList.remove('active'); hamburgerBtn.setAttribute('aria-expanded','false'); hamburgerBtn.textContent = '☰'; }

      hamburgerBtn.addEventListener('click', e => {
        e.stopPropagation();
        navLinks.classList.contains('active') ? closeMenu() : openMenu();
      });
      navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeMenu));
      document.addEventListener('click', e => {
        const hdr = document.getElementById('site-header');
        if (hdr && !hdr.contains(e.target)) closeMenu();
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

      // Inject mobile Log Out link
     
    }

    // Header-actions: injec Log Out buttons
    const headerActions = document.getElementById('header-actions');
    if (headerActions && !headerActions.querySelector('.btn-logout')) {
      headerActions.innerHTML = `
        
        <button class="btn btn-primary" data-action="logout" type="button">Log Out</button>`;
    }

    // Scroll shadow on site-header
    const siteHeader = document.getElementById('site-header');
    if (siteHeader) {
      window.addEventListener('scroll', () => {
        siteHeader.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }
  });

})();
