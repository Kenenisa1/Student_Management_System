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
function animateCounter(el, overrideTarget) {
  const target   = overrideTarget !== undefined ? Number(overrideTarget) : parseInt(el.dataset.target, 10);
  if (isNaN(target)) return;
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

// ── Live Homepage Database Status Loader ──────────────────────
async function loadHomePageDBStatus() {
  try {
    const [resS, resD, resC] = await Promise.all([
      fetch('http://localhost:5000/api/students').catch(() => null),
      fetch('http://localhost:5000/api/departments').catch(() => null),
      fetch('http://localhost:5000/api/courses').catch(() => null)
    ]);

    let students = [];
    let departments = [];
    let courses = [];

    if (resS && resS.ok) {
      const dataS = await resS.json();
      if (dataS.success) students = (dataS.data || []).filter(s => !s.is_deleted);
    }
    if (resD && resD.ok) {
      const dataD = await resD.json();
      if (dataD.success) departments = dataD.data || [];
    }
    if (resC && resC.ok) {
      const dataC = await resC.json();
      if (dataC.success) courses = dataC.data || [];
    }

    const sCount = students.length;
    const dCount = departments.length;
    const cCount = courses.length;

    // Update Hero elements
    const hStudents = document.getElementById('hp-hero-students');
    const hDepts = document.getElementById('hp-hero-depts');
    const hCourses = document.getElementById('hp-hero-courses');
    const proofStudents = document.getElementById('hp-proof-students');

    if (hStudents) animateCounter(hStudents, sCount);
    if (hDepts) animateCounter(hDepts, dCount);
    if (hCourses) animateCounter(hCourses, cCount);
    if (proofStudents) proofStudents.textContent = `${sCount.toLocaleString()}`;

    // Update Hero Live Dashboard Bars
    const heroBars = document.getElementById('hp-hero-bars');
    if (heroBars) {
      heroBars.innerHTML = '';
      const deptColors = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
      const maxStudents = Math.max(...departments.map(d => Number(d.student_count || d.students) || 0), 1);

      if (departments.length === 0) {
        heroBars.innerHTML = '<div class="hc-bar-row"><span>No Data</span><div class="hc-bar"><div style="width:0%"></div></div><span>0%</span></div>';
      } else {
        departments.slice(0, 3).forEach((d, i) => {
          const stCount = Number(d.student_count || d.students) || 0;
          const pct = Math.round((stCount / maxStudents) * 100);
          const color = deptColors[i % deptColors.length];
          const row = document.createElement('div');
          row.className = 'hc-bar-row';
          row.innerHTML = `<span>${d.name}</span><div class="hc-bar"><div style="width:${pct}%;background:${color}"></div></div><span>${pct}%</span>`;
          heroBars.appendChild(row);
        });
      }
    }

    // Update Ticker data targets
    const tickerS = document.getElementById('ticker-students');
    const tickerC = document.getElementById('ticker-courses');
    const tickerD = document.getElementById('ticker-depts');

    if (tickerS) { tickerS.dataset.target = sCount; animateCounter(tickerS); }
    if (tickerC) { tickerC.dataset.target = cCount; animateCounter(tickerC); }
    if (tickerD) { tickerD.dataset.target = dCount; animateCounter(tickerD); }

    // Update About section graphics
    const aboutS = document.getElementById('about-students');
    const aboutC = document.getElementById('about-courses');
    if (aboutS) aboutS.textContent = sCount.toLocaleString();
    if (aboutC) aboutC.textContent = cCount.toLocaleString();

  } catch (error) {
    console.error('Error loading homepage DB status:', error);
  }
}

// Trigger DB load on startup
loadHomePageDBStatus();

// Trigger when stats section enters viewport
const statSection = document.querySelector('.stats-ticker');
let statsAnimated = false;

const statsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !statsAnimated) {
    statsAnimated = true;
    document.querySelectorAll('[data-target]').forEach(el => animateCounter(el));
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

