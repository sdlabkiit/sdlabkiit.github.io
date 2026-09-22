/* ============================================
   SDlab — Sumit Dass Laboratory
   main.js — All interactive functionality
   ============================================ */

'use strict';

/* ==========================================
   1. NAVBAR — sticky highlight + hamburger
   ========================================== */
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('nav-links');
const allNl      = document.querySelectorAll('.nl');

// Hamburger toggle
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav when a link is clicked
navLinks.addEventListener('click', e => {
  if (e.target.classList.contains('nl')) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  }
});

// Close on outside click
document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  }
});

// Active nav link on scroll using IntersectionObserver
const sectionIds = ['research','publications','team','projects','news','contact'];
const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      allNl.forEach(link => {
        const href = link.getAttribute('href');
        link.style.fontWeight = href === `#${id}` ? '600' : '400';
        link.style.color      = href === `#${id}` ? 'var(--color-text-primary)' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sectionEls.forEach(s => navObserver.observe(s));


/* ==========================================
   2. GALLERY SLIDER
   ========================================== */
let currentSlide = 0;
const totalSlides = 4;
let autoplayTimer  = null;
let isPaused       = false;

function goSlide(n) {
  currentSlide = ((n % totalSlides) + totalSlides) % totalSlides;
  document.getElementById('slides').style.transform = `translateX(-${currentSlide * 100}%)`;

  document.querySelectorAll('.gc-dots .dot').forEach((dot, i) => {
    const active = i === currentSlide;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-selected', active);
  });

  // Update aria-hidden on slides
  document.querySelectorAll('.slide').forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== currentSlide);
  });
}

function changeSlide(dir) {
  goSlide(currentSlide + dir);
  resetAutoplay();
}

function resetAutoplay() {
  clearInterval(autoplayTimer);
  if (!isPaused) {
    autoplayTimer = setInterval(() => goSlide(currentSlide + 1), 5000);
  }
}

// Pause on hover/focus
const galleryEl = document.getElementById('gallery');
if (galleryEl) {
  galleryEl.addEventListener('mouseenter', () => { isPaused = true; clearInterval(autoplayTimer); });
  galleryEl.addEventListener('mouseleave', () => { isPaused = false; resetAutoplay(); });
  galleryEl.addEventListener('focusin',    () => { isPaused = true; clearInterval(autoplayTimer); });
  galleryEl.addEventListener('focusout',   e => {
    if (!galleryEl.contains(e.relatedTarget)) { isPaused = false; resetAutoplay(); }
  });
}

// Keyboard navigation for slider
document.addEventListener('keydown', e => {
  if (e.target.closest('#gallery') || e.target.closest('.gallery-ctrl')) {
    if (e.key === 'ArrowLeft')  changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
  }
});

// Touch swipe support
let touchStartX = 0;
let touchEndX   = 0;
if (galleryEl) {
  galleryEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  galleryEl.addEventListener('touchend',   e => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) changeSlide(diff > 0 ? 1 : -1);
  });
}

// Init autoplay
resetAutoplay();
// Init aria-hidden on slides
document.querySelectorAll('.slide').forEach((slide, i) => {
  slide.setAttribute('aria-hidden', i !== 0);
});


/* ==========================================
   3. PUBLICATIONS FILTER
   ========================================== */
function filterPubs(btn, filter) {
  // Update button state
  document.querySelectorAll('.pf-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
  });

  // Show / hide publications
  document.querySelectorAll('.pub').forEach(pub => {
    const type = pub.getAttribute('data-type');
    const show = filter === 'all' || type === filter;
    pub.style.display = show ? '' : 'none';
    pub.setAttribute('aria-hidden', !show);
  });
}

// Make filterPubs accessible globally
window.filterPubs = filterPubs;


/* ==========================================
   4. BIBTEX COPY
   ========================================== */
function copyBibtex(btn, textareaId) {
  const ta = document.getElementById(textareaId);
  if (!ta) return;

  // Toggle bibtex box visibility
  const isVisible = ta.classList.toggle('visible');
  if (!isVisible) {
    btn.classList.remove('copied');
    btn.innerHTML = '<i class="ti ti-copy" aria-hidden="true"></i> BibTeX';
    return;
  }

  // Auto-height textarea
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';

  // Copy to clipboard
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(ta.value).then(() => {
      showCopied(btn);
    }).catch(() => {
      fallbackCopy(ta, btn);
    });
  } else {
    fallbackCopy(ta, btn);
  }
}

function fallbackCopy(ta, btn) {
  ta.select();
  try {
    document.execCommand('copy');
    showCopied(btn);
  } catch (e) {
    console.warn('Copy failed:', e);
  }
}

function showCopied(btn) {
  btn.classList.add('copied');
  btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Copied!';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = '<i class="ti ti-copy" aria-hidden="true"></i> BibTeX';
  }, 2200);
}

window.copyBibtex = copyBibtex;


/* ==========================================
   5. MODALS
   ========================================== */
let lastFocused = null;

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;

  lastFocused = document.activeElement;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Focus first focusable element in modal
  const focusable = overlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) focusable[0].focus();

  // Trap focus
  overlay.addEventListener('keydown', trapFocus);
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;

  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  overlay.removeEventListener('keydown', trapFocus);

  if (lastFocused) lastFocused.focus();
}

function closeModalOutside(e) {
  if (e.target === e.currentTarget) {
    closeModal(e.currentTarget.id);
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = e.currentTarget.querySelector('.modal');
  const focusable = Array.from(modal.querySelectorAll(
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ));
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}

// Global Escape key to close any open modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not([hidden])').forEach(overlay => {
      closeModal(overlay.id);
    });
  }
});

// Keyboard activation for cards (Enter / Space)
document.querySelectorAll('[role="button"]').forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
});

window.openModal         = openModal;
window.closeModal        = closeModal;
window.closeModalOutside = closeModalOutside;




/* ==========================================
   7. BACK TO TOP
   ========================================== */
const bttBtn = document.getElementById('back-to-top');
if (bttBtn) {
  window.addEventListener('scroll', () => {
    bttBtn.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });
}


/* ==========================================
   8. SCROLL-TRIGGERED FADE ANIMATIONS
   ========================================== */
const fadeTargets = [
  '.rcard', '.pub', '.tcard', '.pcard',
  '.comm', '.news', '.cblock', '.hero-cta',
  '.hero-pills', '.hero-desc'
];
fadeTargets.forEach(sel => {
  document.querySelectorAll(sel).forEach(el => el.classList.add('fade-in'));
});

const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));


/* ==========================================
   9. ACTIVE SECTION PROGRESS IN NAV
      (thin underline grows on scroll)
   ========================================== */
const progressObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id   = entry.target.id;
    const link = document.querySelector(`.nl[href="#${id}"]`);
    if (link) link.style.opacity = entry.isIntersecting ? '1' : '0.6';
  });
}, { threshold: 0.2 });

sectionEls.forEach(s => progressObserver.observe(s));


/* ==========================================
   10. SMOOTH SCROLL POLYFILL
       (for browsers that don't support CSS scroll-behavior)
   ========================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ==========================================
   11. REDUCED MOTION RESPECT
   ========================================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (prefersReducedMotion.matches) {
  // Disable autoplay
  clearInterval(autoplayTimer);
  // Remove all fade-in classes so content shows immediately
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  // Disable slider transition
  const slidesEl = document.getElementById('slides');
  if (slidesEl) slidesEl.style.transition = 'none';
}


/* ==========================================
   12. RESEARCH CARD KEYBOARD EXPAND HINT
   ========================================== */
document.querySelectorAll('.rcard').forEach(card => {
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
});


/* ==========================================
   13. FOOTER YEAR AUTO-UPDATE
   ========================================== */
const footerYear = document.querySelector('.footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();


/* ==========================================
   14. INIT LOG (development only — remove in prod)
   ========================================== */
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  console.log('%cSDlab site loaded ✓', 'color:#7F77DD;font-weight:600;font-size:13px');
}

/* ==========================================
   15. DYNAMIC DATA LOADING & DARK MODE
   ========================================== */

// Theme toggle logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sdlab-theme', theme);
  if (theme === 'dark') {
    themeIcon.classList.remove('ti-moon');
    themeIcon.classList.add('ti-sun');
  } else {
    themeIcon.classList.remove('ti-sun');
    themeIcon.classList.add('ti-moon');
  }
}

const savedTheme = localStorage.getItem('sdlab-theme') || 'light';
setTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}

// Data loading
async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.items !== undefined ? json.items : json;
  } catch (e) {
    console.error("Could not load " + url, e);
    if (window.location.protocol === 'file:') {
      console.warn("Notice: Local file:// fetch is blocked by browser CORS policy. Please use a local server or deploy to GitHub Pages.");
    }
    return null;
  }
}

async function renderGallery() {
  const data = await loadJSON('data/gallery/gallery.json');
  if (!data || !data.length) return;
  const slidesContainer = document.getElementById('slides');
  const dotsContainer = document.getElementById('dots');
  if (!slidesContainer || !dotsContainer) return;

  slidesContainer.innerHTML = '';
  dotsContainer.innerHTML = '';

  data.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-label', `Slide ${index + 1} of ${data.length}`);
    slide.setAttribute('aria-hidden', index !== 0);

    const imgStyle = item.image ? `background-image: url('data/gallery/${item.image}'); background-size: cover; background-position: center;` : 'background:var(--color-bg)';
    const iconHtml = item.image ? '' : `<i class="ti ti-photo" style="font-size:48px;color:var(--color-border-mid);" aria-hidden="true"></i>`;

    slide.innerHTML = `
      <div class="slide-img" style="${imgStyle}">
        ${iconHtml}
      </div>
      <div class="slide-caption">
        <p class="slide-caption-text">${item.title}</p>
        ${item.link ? `<a href="${item.link}" class="slide-caption-link"><i class="ti ti-external-link" style="font-size:11px;vertical-align:-1px" aria-hidden="true"></i> ${item.linkText}</a>` : '<span class="slide-caption-link"></span>'}
      </div>
    `;
    slidesContainer.appendChild(slide);

    const dot = document.createElement('button');
    dot.className = index === 0 ? 'dot active' : 'dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', index === 0);
    dot.setAttribute('aria-label', `Slide ${index + 1}`);
    dot.onclick = () => goSlide(index);
    dotsContainer.appendChild(dot);
  });
}

async function renderResearch() {
  const data = await loadJSON('data/research/research.json');
  if (!data || !data.length) return;
  const container = document.getElementById('research-grid');
  const modalsContainer = document.getElementById('dynamic-modals-container');
  if (!container) return;

  container.innerHTML = '';
  data.forEach(item => {
    container.innerHTML += `
      <div class="rcard" style="border-top-color:${item.color}" tabindex="0" role="button" aria-expanded="false" aria-controls="${item.id}" onclick="openModal('${item.id}')">
        <div class="rcard-icon"><i class="ti ${item.icon}" style="color:${item.color}" aria-hidden="true"></i></div>
        <div class="rcard-title">${item.title}</div>
        <p class="rcard-desc">${item.description}</p>
        <span class="rcard-more">Learn more <i class="ti ti-arrow-right" aria-hidden="true"></i></span>
      </div>
    `;

    modalsContainer.innerHTML += `
      <div class="modal-overlay" id="${item.id}" role="dialog" aria-modal="true" aria-labelledby="${item.id}-title" hidden onclick="closeModalOutside(event)">
        <div class="modal">
          <button class="modal-close" onclick="closeModal('${item.id}')" aria-label="Close modal"><i class="ti ti-x" aria-hidden="true"></i></button>
          <div class="modal-icon" style="color:${item.color}"><i class="ti ${item.icon}" aria-hidden="true"></i></div>
          <h3 class="modal-title" id="${item.id}-title">${item.title}</h3>
          <p class="modal-body">${item.modalDescription}</p>
          <div class="modal-tags">
            ${item.tags.map(tag => `<span class="ptag">${tag}</span>`).join('')}
          </div>
          ${item.link ? `<a href="${item.link}" class="btn-outline modal-btn" onclick="closeModal('${item.id}')">${item.linkText}</a>` : ''}
        </div>
      </div>
    `;
  });
}

async function renderPublications() {
  const data = await loadJSON('data/publications/publications.json');
  if (!data || !data.length) return;
  const container = document.getElementById('pub-list');
  if (!container) return;

  container.innerHTML = '';
  data.forEach((item, index) => {
    const bibtexId = `bibtex-dynamic-${index}`;
    container.innerHTML += `
      <article class="pub" style="border-left-color:${item.color}" data-type="${item.type}" tabindex="0">
        <div class="pub-header">
          <div class="pub-title">
            ${item.title}
            <span class="badge" style="background:${item.color}22;color:${item.color}">${item.badgeType}</span>
            <span class="badge" style="background:#EAF3DE;color:#27500A">${item.badgeStatus}</span>
          </div>
          <button class="pub-copy-btn" onclick="copyBibtex(this, '${bibtexId}')" aria-label="Copy BibTeX citation">
            <i class="ti ti-copy" aria-hidden="true"></i> BibTeX
          </button>
        </div>
        <p class="pub-meta">${item.authors} · ${item.venue} · ${item.year}</p>
        <p class="pub-impact">${item.impact}</p>
        <div class="pub-links">
          ${item.links.map(link => `<a href="${link.url}" class="pub-link" target="_blank" rel="noopener noreferrer" aria-label="View ${link.text}"><i class="ti ${link.icon}" aria-hidden="true"></i> ${link.text}</a>`).join('')}
        </div>
        <textarea class="bibtex-box" id="${bibtexId}" readonly aria-label="BibTeX citation">${item.bibtex}</textarea>
      </article>
    `;
  });
}

async function renderTeam() {
  const data = await loadJSON('data/team/team.json');
  if (!data || !data.length) return;

  const container = document.getElementById('team-grid');
  const modalsContainer = document.getElementById('dynamic-modals-container');

  if (!container || !modalsContainer) return;

  container.innerHTML = '';
  modalsContainer.innerHTML = '';

  data.forEach((item, index) => {

    /* ---------- OPEN POSITION ---------- */
    if (item.isOpenPosition) {

      container.innerHTML += `
        <div class="tcard tcard-open"
             tabindex="0"
             style="border-style:dashed"
             role="link"
             aria-label="${item.name}"
             onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">

          <div class="tav"
               style="background:var(--color-bg);color:var(--color-text-sec)">
            <i class="ti ${item.icon}"
               style="font-size:14px"
               aria-hidden="true"></i>
          </div>

          <div class="tname"
               style="color:var(--color-text-sec)">
            ${item.name}
          </div>

          <div class="trole">
            ${item.role}
          </div>

        </div>
      `;

      return;
    }

    /* ---------- PERSON ---------- */

    const modalId = item.id || `modal-team-${index}`;

    const avatar = item.photo
      ? `<img src="${item.photo}"
              alt="${item.name}"
              class="team-photo">`
      : `${item.initials || ''}`;

    container.innerHTML += `
      <div class="tcard"
           tabindex="0"
           role="button"
           aria-label="${item.name}"
           onclick="openModal('${modalId}')">

        <div class="tav"
             style="background:${item.color};color:${item.textColor}">
          ${avatar}
        </div>

        <div class="tname">
          ${item.name}
        </div>

        <div class="trole">
          ${item.role}
        </div>

        ${item.association ? `
          <div class="tassociation">
            ${item.association}
          </div>
        ` : ''}

        <div class="tlinks">

          ${item.email ? `
            <a href="mailto:${item.email}"
               class="tlink"
               aria-label="Email"
               onclick="event.stopPropagation()">
              <i class="ti ti-mail" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.googleScholar ? `
            <a href="${item.googleScholar}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Google Scholar"
               onclick="event.stopPropagation()">
              <i class="ti ti-school" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.linkedin ? `
            <a href="${item.linkedin}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="LinkedIn"
               onclick="event.stopPropagation()">
              <i class="ti ti-brand-linkedin" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.orcid ? `
            <a href="${item.orcid}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="ORCID"
               onclick="event.stopPropagation()">
              <i class="ti ti-id-badge" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.twitter ? `
            <a href="${item.twitter}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="X"
               onclick="event.stopPropagation()">
              <i class="ti ti-brand-x" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.instagram ? `
            <a href="${item.instagram}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Instagram"
               onclick="event.stopPropagation()">
              <i class="ti ti-brand-instagram" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.facebook ? `
            <a href="${item.facebook}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Facebook"
               onclick="event.stopPropagation()">
              <i class="ti ti-brand-facebook" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.scopus ? `
            <a href="${item.scopus}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Scopus"
               onclick="event.stopPropagation()">
              <i class="ti ti-book" aria-hidden="true"></i>
            </a>
          ` : ''}

          ${item.webOfScience ? `
            <a href="${item.webOfScience}"
               class="tlink"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Web of Science"
               onclick="event.stopPropagation()">
              <i class="ti ti-world"
                 aria-hidden="true"></i>
            </a>
          ` : ''}

        </div>
      </div>
    `;


    /* ---------- PROFILE MODAL ---------- */

    modalsContainer.innerHTML += `
      <div class="modal-overlay"
           id="${modalId}"
           role="dialog"
           aria-modal="true"
           aria-labelledby="${modalId}-title"
           hidden
           onclick="closeModalOutside(event)">

        <div class="modal">

          <button class="modal-close"
                  onclick="closeModal('${modalId}')"
                  aria-label="Close modal">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>

          <div class="tav modal-avatar"
               style="background:${item.color};color:${item.textColor}">
            ${avatar}
          </div>

          <h3 class="modal-title"
              id="${modalId}-title">
            ${item.name}
          </h3>

          <p class="modal-subtitle">
            ${item.modalSubtitle || item.role}
          </p>

          ${item.association ? `
            <p class="modal-meta">
              <strong>Association:</strong> ${item.association}
            </p>
          ` : ''}

          ${item.modalDescription ? `
            <p class="modal-body">
              ${item.modalDescription}
            </p>
          ` : ''}

          ${item.education ? `
            <p class="modal-body">
              <strong>Education:</strong> ${item.education}
            </p>
          ` : ''}

          ${item.currentPosition ? `
            <p class="modal-body">
              <strong>Current position:</strong> ${item.currentPosition}
            </p>
          ` : ''}

          <div class="modal-links">

            ${item.email ? `
              <a href="mailto:${item.email}"
                 class="btn-outline modal-btn">
                <i class="ti ti-mail" aria-hidden="true"></i>
                Email
              </a>
            ` : ''}

            ${item.googleScholar ? `
              <a href="${item.googleScholar}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-school" aria-hidden="true"></i>
                Google Scholar
              </a>
            ` : ''}

            ${item.linkedin ? `
              <a href="${item.linkedin}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-brand-linkedin" aria-hidden="true"></i>
                LinkedIn
              </a>
            ` : ''}

            ${item.orcid ? `
              <a href="${item.orcid}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-id-badge" aria-hidden="true"></i>
                ORCID
              </a>
            ` : ''}

            ${item.twitter ? `
              <a href="${item.twitter}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-brand-x" aria-hidden="true"></i>
                X
              </a>
            ` : ''}

            ${item.instagram ? `
              <a href="${item.instagram}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-brand-instagram" aria-hidden="true"></i>
                Instagram
              </a>
            ` : ''}

            ${item.facebook ? `
              <a href="${item.facebook}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-brand-facebook" aria-hidden="true"></i>
                Facebook
              </a>
            ` : ''}

            ${item.scopus ? `
              <a href="${item.scopus}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-book" aria-hidden="true"></i>
                Scopus
              </a>
            ` : ''}

            ${item.webOfScience ? `
              <a href="${item.webOfScience}"
                 class="btn-outline modal-btn"
                 target="_blank"
                 rel="noopener noreferrer">
                <i class="ti ti-world" aria-hidden="true"></i>
                Web of Science
              </a>
            ` : ''}

          </div>

        </div>
      </div>
    `;
  });
}
async function renderProjects() {
  const data = await loadJSON('data/projects/projects.json');
  if (!data || !data.length) return;
  const container = document.getElementById('proj-grid');
  const modalsContainer = document.getElementById('dynamic-modals-container');
  if (!container) return;

  container.innerHTML = '';
  data.forEach(item => {
    if (item.isPlaceholder) {
      container.innerHTML += `
        <div class="pcard pcard-placeholder" style="border-style:dashed;opacity:0.55" aria-hidden="true">
          <div class="pcard-head">
            <div class="pcard-title" style="color:var(--color-text-sec)">${item.title}</div>
          </div>
          <p class="pcard-desc">${item.description}</p>
        </div>
      `;
    } else {
      container.innerHTML += `
        <div class="pcard" tabindex="0" role="button" aria-label="${item.title}" onclick="openModal('${item.id}')">
          <div class="pcard-head">
            <div class="pcard-title">${item.title}</div>
            <span class="pstatus" style="background:${item.statusBg};color:${item.statusColor}">${item.status}</span>
          </div>
          <p class="pcard-desc">${item.description}</p>
          <div class="pcard-tags">
            ${item.tags.map(tag => `<span class="ptag">${tag}</span>`).join('')}
          </div>
        </div>
      `;

      modalsContainer.innerHTML += `
        <div class="modal-overlay" id="${item.id}" role="dialog" aria-modal="true" aria-labelledby="${item.id}-title" hidden onclick="closeModalOutside(event)">
          <div class="modal">
            <button class="modal-close" onclick="closeModal('${item.id}')" aria-label="Close modal"><i class="ti ti-x" aria-hidden="true"></i></button>
            <span class="pstatus" style="background:${item.statusBg};color:${item.statusColor};margin-bottom:12px;display:inline-block">${item.status}</span>
            <h3 class="modal-title" id="${item.id}-title">${item.title}</h3>
            <p class="modal-body">${item.modalDescription}</p>

            ${item.role || item.fundingAgency || item.identification || item.cost ? `
              <div class="project-details">

                <h4>Project Details</h4>

                ${item.role ? `
                  <div class="project-detail">
                    <strong>Role:</strong>
                    <span>${item.role}</span>
                  </div>
                ` : ''}

                ${item.timeline ? `
                  <div class="project-detail">
                    <strong>Timeline:</strong>
                    <span>${item.timeline}</span>
                  </div>
                ` : ''}

                ${item.fundingAgency ? `
                  <div class="project-detail">
                    <strong>Funding Agency:</strong>
                    <span>${item.fundingAgency}</span>
                  </div>
                ` : ''}

                ${item.identification ? `
                  <div class="project-detail">
                    <strong>Identification:</strong>
                    <span>${item.identification}</span>
                  </div>
                ` : ''}

                ${item.cost ? `
                  <div class="project-detail">
                    <strong>Project Cost:</strong>
                    <span>${item.cost}</span>
                  </div>
                ` : ''}

              </div>
            ` : ''}
            <div class="modal-tags">
              ${item.tags.map(tag => `<span class="ptag">${tag}</span>`).join('')}
            </div>
            ${item.link ? `<a href="${item.link}" class="btn-outline modal-btn" onclick="closeModal('${item.id}')">${item.linkText}</a>` : ''}
          </div>
        </div>
      `;
    }
  });
}

// async function renderCommunity() {
//   const data = await loadJSON('data/community/community.json');
//   if (!data || !data.length) return;
//   const container = document.getElementById('comm-list');
//   if (!container) return;

//   container.innerHTML = '';
//   data.forEach(item => {
//     container.innerHTML += `
//       <div class="comm" tabindex="0">
//         <div class="comm-title">${item.title}</div>
//         <p class="comm-desc">${item.description}</p>
//       </div>
//     `;
//   });
// }

async function renderNews() {
  const data = await loadJSON('data/news/news.json');
  if (!data || !data.length) return;

  const container = document.getElementById('news-list');
  if (!container) return;

  container.innerHTML = '';

  data.forEach((item, index) => {
    const newsId = `news-details-${index}`;

    container.innerHTML += `
      <article class="news-item" tabindex="0">

        <button
          class="news-highlight"
          type="button"
          aria-expanded="false"
          aria-controls="${newsId}"
          onclick="toggleNews('${newsId}', this)"
        >
          <span class="news-highlight-text">${item.highlight}</span>
          <i class="ti ti-chevron-down" aria-hidden="true"></i>
        </button>

        <div
          class="news-details"
          id="${newsId}"
          hidden
        >
          <p>${item.details}</p>

          ${item.links && item.links.length ? `
            <div class="news-links">
              ${item.links.map(link => `
                <a
                  href="${link.url}"
                  class="news-link"
                  target="_blank"
                  rel="noopener"
                  onclick="event.stopPropagation()"
                >
                  <i class="ti ${link.icon}" aria-hidden="true"></i>
                  ${link.text}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>

      </article>
    `;
  });
}

function toggleNews(id, button) {
  const details = document.getElementById(id);
  if (!details) return;

  const isOpen = !details.hidden;

  details.hidden = isOpen;
  button.setAttribute('aria-expanded', String(!isOpen));

  button.classList.toggle('expanded', !isOpen);
}

async function renderProfile() {
  const data = await loadJSON('data/profile/profile.json');
  if (!data) return;

  const container = document.getElementById('footer-profile-links');
  const legacyContainer = document.getElementById('footer-legacy-link');

  if (!container || !legacyContainer) return;

  container.innerHTML = '';
  legacyContainer.innerHTML = '';

  if (data.email)
    container.innerHTML += `<a href="mailto:${data.email}" class="fl fl-link" aria-label="Email"><i class="ti ti-mail" aria-hidden="true"></i></a>`;

  if (data.linkedin)
    container.innerHTML += `<a href="${data.linkedin}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ti ti-brand-linkedin" aria-hidden="true"></i></a>`;

  if (data.googleScholar)
    container.innerHTML += `<a href="${data.googleScholar}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar"><i class="ti ti-school" aria-hidden="true"></i></a>`;

  if (data.orcid)
    container.innerHTML += `<a href="${data.orcid}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="ORCID"><i class="ti ti-id-badge" aria-hidden="true"></i></a>`;

  if (data.twitter)
    container.innerHTML += `<a href="${data.twitter}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="ti ti-brand-x" aria-hidden="true"></i></a>`;

  if (data.instagram)
    container.innerHTML += `<a href="${data.instagram}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="ti ti-brand-instagram" aria-hidden="true"></i></a>`;

  if (data.facebook)
    container.innerHTML += `<a href="${data.facebook}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="ti ti-brand-facebook" aria-hidden="true"></i></a>`;

  if (data.scopus)
    container.innerHTML += `<a href="${data.scopus}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="Scopus"><i class="ti ti-book" aria-hidden="true"></i></a>`;

  if (data.webOfScience)
    container.innerHTML += `<a href="${data.webOfScience}" class="fl fl-link" target="_blank" rel="noopener noreferrer" aria-label="Web of Science"><i class="ti ti-world" aria-hidden="true"></i></a>`;
}
// Initializer
async function initDynamicContent() {
  await Promise.all([
    renderGallery(),
    renderResearch(),
    renderPublications(),
    renderTeam(),
    renderProjects(),
    // renderCommunity(),
    renderNews(),
    renderProfile()
  ]);

  // Re-run fade-in observer for newly added elements
  document.querySelectorAll('.rcard, .pub, .tcard, .pcard, .comm, .news').forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
  });
}

// Start loading
initDynamicContent();
