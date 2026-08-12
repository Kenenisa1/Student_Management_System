/**
 * theme-toggle.js — Light/Dark Mode Theme Switcher
 * Provides a toggle button to switch between light and dark themes
 * Persists user preference in localStorage and applies .dark-mode class to <body>
 */

(function() {
  'use strict';

  // Get saved theme or default to light
  function getSavedTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  // Apply theme to document and body element
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
    }
    localStorage.setItem('theme', theme);
    
    // Update button aria-label
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', 
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  // Toggle between light and dark
  function toggleTheme() {
    const currentTheme = getSavedTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  }

  // Immediate theme setup before DOM rendering if possible
  const savedTheme = getSavedTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (document.body) {
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  }

  // Initialize theme and toggle button when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const currentTheme = getSavedTheme();
    const isDark = currentTheme === 'dark';
    
    // Ensure body.dark-mode is applied on DOMContentLoaded to prevent flickering
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
    }

    let headerActions = document.getElementById('header-actions');
    
    // Fallback container if page lacks top header-actions
    if (!headerActions) {
      headerActions = document.createElement('div');
      headerActions.id = 'header-actions';
      headerActions.className = 'header-actions';
      document.body.appendChild(headerActions);
    }
    
    if (headerActions) {
      // Check if toggle button doesn't already exist
      let toggleBtn = document.getElementById('theme-toggle');
      if (!toggleBtn) {
        const toggleHTML = `
          <button 
            id="theme-toggle" 
            class="theme-toggle" 
            aria-label="${isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
            title="Toggle theme"
            type="button"
          >
            <span class="theme-toggle-slider">
              <span class="theme-toggle-icon theme-toggle-icon-sun">☀️</span>
              <span class="theme-toggle-icon theme-toggle-icon-moon">🌙</span>
            </span>
          </button>
        `;
        headerActions.insertAdjacentHTML('afterbegin', toggleHTML);
        toggleBtn = document.getElementById('theme-toggle');
      }
    }

    // Wire up event listeners
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
      toggleBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });
    }
  });

  // Expose toggle function globally for debugging or inline calls
  window.toggleTheme = toggleTheme;

})();

