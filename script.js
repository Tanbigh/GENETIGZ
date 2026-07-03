/* ==============================================================
   GENETIGZ — CORE SCRIPT
   Handles: loader, mobile sidebar, smooth scroll, reveal animations,
   review carousel duplication, placeholder image hydration, footer year.
   Product rendering + modal logic live in js/products.js and js/modal.js.
============================================================== */

(function () {
  'use strict';

  /* ============================================
     1. LOADING SCREEN
     Hides the loader after a fixed delay with a
     fade transition (handled via .is-hidden in CSS).
  ============================================= */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;

    var MIN_DISPLAY_MS = 2200; // feels intentional, not sluggish

    window.addEventListener('load', function () {
      window.setTimeout(function () {
        loader.classList.add('is-hidden');
        // Prevent tab-focus / interaction with hidden loader
        loader.setAttribute('aria-hidden', 'true');
      }, MIN_DISPLAY_MS);
    });

    // Fallback: if 'load' already fired (cached assets), still hide it.
    if (document.readyState === 'complete') {
      window.setTimeout(function () {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
      }, MIN_DISPLAY_MS);
    }
  }

  /* ============================================
     2. MOBILE SIDEBAR TOGGLE + OVERLAY
  ============================================= */
  function initMobileSidebar() {
    var toggle = document.getElementById('navToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar || !overlay) return;

    function openSidebar() {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-visible');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('no-scroll');
    }

    function closeSidebar() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }

    function toggleSidebar() {
      var isOpen = sidebar.classList.contains('is-open');
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    toggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close when a nav link is tapped (mobile UX expectation)
    var sidebarLinks = sidebar.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(function (link) {
      link.addEventListener('click', closeSidebar);
    });

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });

    // Close on window resize back to desktop breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });
  }

  /* ============================================
     3. SMOOTH SCROLLING
     Handles any element with [data-scroll="#target"]
  ============================================= */
  function initSmoothScroll() {
    var scrollTriggers = document.querySelectorAll('[data-scroll]');

    scrollTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        var targetSelector = trigger.getAttribute('data-scroll');
        var targetEl = targetSelector ? document.querySelector(targetSelector) : null;
        if (!targetEl) return;

        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ============================================
     4. SCROLL CUE BUTTON
     Scrolls to the collection section from the hero.
  ============================================= */
  function initScrollCue() {
    var cue = document.getElementById('scrollCue');
    var collection = document.getElementById('collection');
    if (!cue || !collection) return;

    cue.addEventListener('click', function () {
      collection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ============================================
     5. REVEAL ANIMATIONS (Intersection Observer)
     Auto-tags key sections/elements with .reveal so
     the existing CSS transition kicks in on scroll,
     without needing to touch the HTML.
  ============================================= */
  function initRevealAnimations() {
    var revealSelectors = [
      '.quality-item',
      '.reviews-title',
      '.collection-head',
      '.product-card',
      '.footer-grid'
    ];

    var revealTargets = [];
    revealSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.classList.add('reveal');
        revealTargets.push(el);
      });
    });

    if (!revealTargets.length) return;

    // If IntersectionObserver isn't supported, just show everything.
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================================
     6. REVIEWS — INFINITE SCROLL DUPLICATION
     Duplicates the review cards once so the CSS
     keyframe (translateX -50%) loops seamlessly.
  ============================================= */
  function initReviewsCarousel() {
    var track = document.getElementById('reviewsTrack');
    if (!track) return;

    var originalCards = Array.prototype.slice.call(track.children);
    if (!originalCards.length) return;

    var fragment = document.createDocumentFragment();
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true'); // duplicates are decorative
      fragment.appendChild(clone);
    });
    track.appendChild(fragment);
  }

  /* ============================================
     7. PLACEHOLDER IMAGE HYDRATION
     Any element with class "ph-image" and a
     "data-src" attribute gets checked — if a real
     file exists at that path, it's swapped in via
     the --img CSS variable and .is-loaded is added.
     If not found, the placeholder styling stays.
  ============================================= */
  function hydratePlaceholders(root) {
    var scope = root || document;
    var placeholders = scope.querySelectorAll('.ph-image[data-src]');

    placeholders.forEach(function (el) {
      var src = el.getAttribute('data-src');
      if (!src || el.dataset.hydrated === 'true') return;

      var probe = new Image();

      probe.onload = function () {
        el.style.setProperty('--img', 'url("' + src + '")');
        el.classList.add('is-loaded');
        el.dataset.hydrated = 'true';
      };

      probe.onerror = function () {
        // No real file yet — keep placeholder as-is.
        el.dataset.hydrated = 'false';
      };

      probe.src = src;
    });
  }

  /* ============================================
     8. FOOTER YEAR
  ============================================= */
  function initFooterYear() {
    var yearEl = document.getElementById('year');
    if (!yearEl) return;
    yearEl.textContent = new Date().getFullYear();
  }

  /* ============================================
     INIT
     Product grid + modal are populated by
     js/products.js and js/modal.js respectively.
     This script listens for a custom event
     ("gz:productsRendered") so newly injected
     product cards get reveal + placeholder support
     without any manual re-wiring.
  ============================================= */
  function init() {
    initLoader();
    initMobileSidebar();
    initSmoothScroll();
    initScrollCue();
    initReviewsCarousel();
    initFooterYear();
    hydratePlaceholders(document);
    initRevealAnimations();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Re-run reveal + placeholder hydration whenever products.js
  // finishes injecting/re-filtering product cards.
  document.addEventListener('gz:productsRendered', function () {
    hydratePlaceholders(document.getElementById('productGrid'));
    initRevealAnimations();
  });

  // Expose hydratePlaceholders globally so modal.js can hydrate
  // the front/back images it injects into the modal.
  window.GZ = window.GZ || {};
  window.GZ.hydratePlaceholders = hydratePlaceholders;

})();