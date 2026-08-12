/**
 * js/index.js — EduCore Landing Page
 * Depends on: js/auth.js (must be loaded first via <script> in HTML)
 */

// ── 1. Auth guard + body reveal ───────────────────────────────
// EduAuth.guard() checks isAuthenticated and adds .auth-ready to <html>,
// lifting the visibility:hidden gate declared in index.html <head>.
EduAuth.guard();


// ── 3. Inject "Log Out" link into mobile nav menu ─────────────


// ── Footer year ──────────────────────────────────────────────
document.getElementById('footer-year').textContent = new Date().getFullYear();

// ── Header scroll shadow ─────────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ── Mobile hamburger (landing-hamburger-btn → #nav-links.active) ─────
const landingHamburger = document.getElementById('landing-hamburger-btn');
const navLinks         = document.getElementById('nav-links');

function openMobileMenu() {
  navLinks.classList.add('active');
  landingHamburger.setAttribute('aria-expanded', 'true');
  landingHamburger.textContent = '✕';
}

function closeMobileMenu() {
  navLinks.classList.remove('active');
  landingHamburger.setAttribute('aria-expanded', 'false');
  landingHamburger.textContent = '☰';
}

landingHamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  navLinks.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
});

// Close when a nav link is clicked
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => closeMobileMenu());
});

// Close when clicking anywhere outside the header
document.addEventListener('click', (e) => {
  const header = document.getElementById('site-header');
  if (!header.contains(e.target)) {
    closeMobileMenu();
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileMenu();
});

// ── Animated stat counters ────────────────────────────────────
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Trigger when stats section enters viewport
const statSection = document.querySelector('.stats-ticker');
let statsAnimated = false;

const statsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !statsAnimated) {
    statsAnimated = true;
    document.querySelectorAll('[data-target]').forEach(animateCounter);
    statsObserver.disconnect();
  }
}, { threshold: 0.4 });

if (statSection) statsObserver.observe(statSection);

// ── Feature card reveal on scroll ────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-animate]').forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
  revealObserver.observe(el);
});

// ── Smooth scroll for anchor links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
