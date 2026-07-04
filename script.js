/* ==============================================================
   GENETIGZ — CORE SCRIPT
   Handles: loader, mobile sidebar, smooth scroll, reveal animations,
   review carousel (desktop marquee + mobile swipe/scroll-snap),
   PROGRESSIVE (lazy) placeholder image hydration, and footer year.
   Product rendering + modal logic live in js/products.js and js/modal.js.

   NOTE: unchanged from the previous version — none of the requested
   fixes (removing overlay text, wordmark font, navbar color, mobile
   logo clipping) touch behavior/JS, only markup and CSS.
============================================================== */

(function () {
  'use strict';

  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;

    var MIN_DISPLAY_MS = 2200;

    window.addEventListener('load', function () {
      window.setTimeout(function () {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
      }, MIN_DISPLAY_MS);
    });

    if (document.readyState === 'complete') {
      window.setTimeout(function () {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
      }, MIN_DISPLAY_MS);
    }
  }

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

    var sidebarLinks = sidebar.querySelectorAll('.sidebar-link, .sidebar-logo');
    sidebarLinks.forEach(function (link) {
      link.addEventListener('click', closeSidebar);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });
  }

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

  function initScrollCue() {
    var cue = document.getElementById('scrollCue');
    var collection = document.getElementById('collection');
    if (!cue || !collection) return;

    cue.addEventListener('click', function () {
      collection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

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
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal');
        revealTargets.push(el);
      });
    });

    if (!revealTargets.length) return;

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

  function initReviewsCarousel() {
    var track = document.getElementById('reviewsTrack');
    if (!track) return;
    if (track.dataset.duplicated === 'true') return;

    var originalCards = Array.prototype.slice.call(track.children);
    if (!originalCards.length) return;

    var fragment = document.createDocumentFragment();
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      fragment.appendChild(clone);
    });
    track.appendChild(fragment);
    track.dataset.duplicated = 'true';
  }

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

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopAuto();
    }
  }

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
      { rootMargin: '300px 0px', threshold: 0.01 }
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
        resolvePlaceholder(el);
      } else {
        observer.observe(el);
      }
    });
  }

  function initFooterYear() {
    var yearEl = document.getElementById('year');
    if (!yearEl) return;
    yearEl.textContent = new Date().getFullYear();
  }

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

  document.addEventListener('gz:productsRendered', function () {
    hydratePlaceholders(document.getElementById('productGrid'));
    initRevealAnimations();
  });

  window.GZ = window.GZ || {};
  window.GZ.hydratePlaceholders = hydratePlaceholders;

})();