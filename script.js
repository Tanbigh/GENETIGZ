/* ==============================================================
   GENETIGZ — CORE SCRIPT
   Handles: loader, mobile sidebar, smooth scroll, reveal animations,
   review carousel duplication, PROGRESSIVE (lazy) placeholder image
   hydration, and footer year.
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
    var sidebarLinks = sidebar.querySelectorAll('.sidebar-link, .sidebar-logo');
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
        if (el.classList.contains('reveal')) return; // already tagged, avoid re-observing
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
    if (track.dataset.duplicated === 'true') return; // guard against double-init

    var originalCards = Array.prototype.slice.call(track.children);
    if (!originalCards.length) return;

    var fragment = document.createDocumentFragment();
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true'); // duplicates are decorative
      fragment.appendChild(clone);
    });
    track.appendChild(fragment);
    track.dataset.duplicated = 'true';
  }

  /* ============================================
     7. PROGRESSIVE (LAZY) PLACEHOLDER IMAGE
        HYDRATION
     Any element with class "ph-image" and a
     "data-src" attribute is only resolved once it's
     about to enter the viewport (IntersectionObserver,
     generous rootMargin so it's ready just before the
     user scrolls to it) — this is what makes images
     load progressively instead of all at once on
     page load.

     Elements marked [data-eager="true"] (the hero, or
     anything already visible above the fold) skip the
     viewport gate and resolve immediately, since
     waiting for those would just delay the first paint
     of content the user already sees.

     If a real file exists at data-src, it's swapped in
     via the --img CSS variable and .is-loaded is added
     (triggering the crossfade in CSS). If not found,
     the placeholder styling stays as-is.
  ============================================= */
  var lazyImageObserver = null;

  function resolvePlaceholder(el) {
    var src = el.getAttribute('data-src');
    if (!src || el.dataset.hydrated === 'true' || el.dataset.hydrated === 'pending') return;

    el.dataset.hydrated = 'pending';
    el.classList.add('is-loading');

    var probe = new Image();

    probe.onload = function () {
      el.style.setProperty('--img', 'url("' + src + '")');
      el.classList.remove('is-loading');
      el.classList.add('is-loaded');
      el.dataset.hydrated = 'true';
    };

    probe.onerror = function () {
      // No real file yet — keep placeholder as-is.
      el.classList.remove('is-loading');
      el.dataset.hydrated = 'false';
    };

    probe.src = src;
  }

  function getLazyImageObserver() {
    if (lazyImageObserver || !('IntersectionObserver' in window)) return lazyImageObserver;

    lazyImageObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            resolvePlaceholder(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '300px 0px', threshold: 0.01 } // start loading well before it's on-screen
    );

    return lazyImageObserver;
  }

  function hydratePlaceholders(root) {
    var scope = root || document;
    var placeholders = scope.querySelectorAll('.ph-image[data-src]');

    placeholders.forEach(function (el) {
      if (el.dataset.hydrated === 'true' || el.dataset.hydrated === 'pending') return;

      var isEager = el.getAttribute('data-eager') === 'true';
      var observer = getLazyImageObserver();

      if (isEager || !observer) {
        // Above-the-fold content, or no IO support — resolve right away.
        resolvePlaceholder(el);
      } else {
        observer.observe(el);
      }
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
     product cards get reveal + lazy-image support
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

  // Re-run reveal + lazy-image hydration whenever products.js
  // finishes injecting/re-filtering product cards.
  document.addEventListener('gz:productsRendered', function () {
    hydratePlaceholders(document.getElementById('productGrid'));
    initRevealAnimations();
  });

  // Expose hydratePlaceholders globally so modal.js can hydrate
  // the front/back images it injects into the modal. Modal images
  // are treated as eager (data-eager="true" is set by modal.js on
  // the elements directly) since they only ever render after the
  // user has already asked to see them.
  window.GZ = window.GZ || {};
  window.GZ.hydratePlaceholders = hydratePlaceholders;

})();