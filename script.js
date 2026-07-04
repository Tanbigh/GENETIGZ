/* ==============================================================
   GENETIGZ — CORE SCRIPT
   Handles: loader, mobile sidebar, smooth scroll, reveal animations,
   review carousel (desktop marquee + mobile swipe/scroll-snap),
   PROGRESSIVE (lazy) placeholder image hydration, and footer year.
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
     6. REVIEWS — DESKTOP MARQUEE DUPLICATION
     Duplicates the review cards once so the CSS
     keyframe (translateX -50%) loops seamlessly.
     (Desktop/tablet only — see section 6b for the
     mobile swipe/scroll-snap behaviour, which hides
     these clones and uses the originals instead.)
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
     6b. REVIEWS — MOBILE SWIPE / SCROLL-SNAP CAROUSEL
     Below the 640px breakpoint, css/responsive.css turns the track
     into a native horizontally-scrolling, snap-aligned row (see
     .reviews-track-wrap overflow-x:auto + scroll-snap-type), which
     is what gives real touch/swipe support with momentum — rather
     than trying to reimplement dragging by hand. This block layers
     three small enhancements on top of that native behaviour:
       - a set of tappable progress dots (one per unique review)
       - a gentle auto-advance so the row still "does something" if
         the person never swipes, which pauses the moment they touch
         the track and resumes a few seconds after they let go
       - keeping the dots in sync with whatever card is centered,
         whether the person swiped, tapped a dot, or it auto-advanced
  ============================================= */
  function initReviewsMobileCarousel() {
    var wrap = document.querySelector('.reviews-track-wrap');
    var track = document.getElementById('reviewsTrack');
    var dotsHost = document.getElementById('reviewsDots');
    if (!wrap || !track || !dotsHost) return;
    if (wrap.dataset.mobileInit === 'true') return;
    wrap.dataset.mobileInit = 'true';

    var AUTO_ADVANCE_MS = 4200;
    var RESUME_AFTER_TOUCH_MS = 3200;
    var autoTimer = null;
    var resumeTimer = null;
    var isPointerDown = false;

    function getCards() {
      // Only the real cards — the desktop-marquee clones are
      // aria-hidden and display:none at this breakpoint.
      return Array.prototype.slice.call(track.children).filter(function (el) {
        return el.getAttribute('aria-hidden') !== 'true';
      });
    }

    function buildDots(cards) {
      dotsHost.innerHTML = '';
      cards.forEach(function (_, i) {
        var dot = document.createElement('span');
        if (i === 0) dot.classList.add('is-active');
        dotsHost.appendChild(dot);
      });
    }

    function setActiveDot(index) {
      var dots = dotsHost.children;
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === index);
      }
    }

    // Position of a card within the scrollable content, independent of
    // offsetParent quirks (offsetLeft can resolve against an ancestor
    // far above the scroll container if nothing in between is
    // position:relative, which would silently break this math).
    function cardStart(card) {
      var wrapRect = wrap.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      return (cardRect.left - wrapRect.left) + wrap.scrollLeft;
    }

    function nearestCardIndex(cards) {
      var wrapCenter = wrap.scrollLeft + wrap.clientWidth / 2;
      var closestIndex = 0;
      var closestDistance = Infinity;
      cards.forEach(function (card, i) {
        var cardCenter = cardStart(card) + card.offsetWidth / 2;
        var distance = Math.abs(cardCenter - wrapCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      return closestIndex;
    }

    function scrollToCard(card) {
      var target = cardStart(card) - (wrap.clientWidth - card.offsetWidth) / 2;
      wrap.scrollTo({ left: target, behavior: 'smooth' });
    }

    function stopAuto() {
      if (autoTimer) { window.clearInterval(autoTimer); autoTimer = null; }
    }

    function startAuto(cards) {
      stopAuto();
      autoTimer = window.setInterval(function () {
        if (isPointerDown) return;
        var current = nearestCardIndex(cards);
        var next = (current + 1) % cards.length;
        scrollToCard(cards[next]);
      }, AUTO_ADVANCE_MS);
    }

    function pauseForTouch(cards) {
      isPointerDown = true;
      stopAuto();
      if (resumeTimer) window.clearTimeout(resumeTimer);
    }

    function resumeAfterTouch(cards) {
      isPointerDown = false;
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(function () {
        startAuto(cards);
      }, RESUME_AFTER_TOUCH_MS);
    }

    function wire(cards) {
      buildDots(cards);

      dotsHost.querySelectorAll('span').forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          scrollToCard(cards[i]);
        });
      });

      var scrollRAF = null;
      wrap.addEventListener('scroll', function () {
        if (scrollRAF) window.cancelAnimationFrame(scrollRAF);
        scrollRAF = window.requestAnimationFrame(function () {
          setActiveDot(nearestCardIndex(cards));
        });
      }, { passive: true });

      wrap.addEventListener('touchstart', function () { pauseForTouch(cards); }, { passive: true });
      wrap.addEventListener('touchend', function () { resumeAfterTouch(cards); }, { passive: true });
      wrap.addEventListener('mousedown', function () { pauseForTouch(cards); });
      window.addEventListener('mouseup', function () { resumeAfterTouch(cards); });

      startAuto(cards);
    }

    var cards = getCards();
    if (!cards.length) return;
    wire(cards);

    // Respect reduced-motion preference: keep the swipe/dots UX but
    // skip the automatic advancing.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopAuto();
    }
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
    initReviewsMobileCarousel();
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