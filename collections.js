/* ==============================================================
   GENETIGZ — COLLECTIONS ENGINE
   Reads data/collections-index.js (the ordered list of slugs),
   loads each collection's own data/<slug>.js, then renders one
   homepage section per collection into #collectionsHost — after
   the existing Catalog section, before the Footer.

   Reuses, unmodified:
   - the same product-card markup/classes as products.js
   - the shared #productModal via window.GZ.getProductById
   - the shared lazy-image hydration via window.GZ.hydratePlaceholders
   - the shared .reveal/.is-visible scroll-in animation classes

   This file is generic — it never needs to change when a new
   collection is added. Only data/collections-index.js (one line)
   and a new data/<slug>.js need to be touched.
============================================================== */

(function () {
  'use strict';

  // Homepage previews only ever show a taste of each collection — the
  // full set lives one click away on collection.html (which now renders
  // every collection via its own sidebar + gallery browser). Keeps the
  // homepage from growing a new full-length section per drop.
  var HOME_PREVIEW_LIMIT = 4;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        console.warn('[collections] Could not load', src);
        resolve(); // don't block the rest of the site over one missing collection file
      };
      document.head.appendChild(s);
    });
  }

  function whatsappLink(product) {
    var msg = 'Hi Genetigz, I\'d like to order the ' + product.name + ' (' + product.code + ').';
    return 'https://wa.me/917001494960?text=' + encodeURIComponent(msg);
  }

  // Identical markup to products.js's buildCard, so .product-card CSS/behavior
  // (hover, reveal, lazy image) is shared with zero duplication of styles.
  function buildCard(product) {
    var card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'View details for ' + product.name);

    card.innerHTML =
      '<div class="product-card-image">' +
        '<div class="ph-image" data-src="' + product.images.front + '" data-label="' + product.code + '">' +
          '<span class="ph-tag">IMG // PENDING UPLOAD</span>' +
        '</div>' +
      '</div>' +
      '<div class="product-card-body">' +
        '<div class="product-card-code">' + product.code + '</div>' +
        '<h3 class="product-card-name">' + product.name + '</h3>' +
        '<p class="product-card-fabric">' + product.fabric + '</p>' +
        '<div class="product-card-foot">' +
          '<span>' + product.colors.split(',')[0] + '</span>' +
          '<span class="view-details">View Details →</span>' +
        '</div>' +
      '</div>';

    return card;
  }

  function buildSection(collection) {
    var section = document.createElement('section');
    section.className = 'collection collection-section';
    section.id = 'collection-' + collection.slug;

    var head = document.createElement('div');
    head.className = 'collection-head';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'COLLECTION';
    head.appendChild(eyebrow);

    var title = document.createElement('h2');
    title.className = 'collection-title';
    title.textContent = collection.name;
    head.appendChild(title);

    if (collection.description) {
      var sub = document.createElement('p');
      sub.className = 'collection-sub';
      sub.textContent = collection.description;
      head.appendChild(sub);
    }

    var total = collection.products.length;
    var shown = Math.min(total, HOME_PREVIEW_LIMIT);
    if (total > shown) {
      var count = document.createElement('p');
      count.className = 'collection-count';
      count.textContent = 'Showing ' + shown + ' of ' + String(total).padStart(2, '0') + ' pieces.';
      head.appendChild(count);
    }

    section.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'product-grid';
    grid.id = 'grid-' + collection.slug;

    var previewProducts = collection.products.slice(0, HOME_PREVIEW_LIMIT);
    previewProducts.forEach(function (product, i) {
      var card = buildCard(product);
      card.style.animationDelay = (i * 70) + 'ms';
      grid.appendChild(card);
    });

    section.appendChild(grid);

    var cta = document.createElement('div');
    cta.className = 'collection-cta';
    var link = document.createElement('a');
    link.className = 'btn-primary btn-collection';
    link.href = 'collection.html?slug=' + encodeURIComponent(collection.slug);
    link.textContent = 'View Collection';
    cta.appendChild(link);
    section.appendChild(cta);

    return section;
  }

  // Same lightweight scroll-reveal pattern script.js already uses for
  // .product-card / .collection-head, applied here without touching
  // script.js — just reusing the same .reveal/.is-visible CSS classes.
  function applyReveal(root) {
    var targets = root.querySelectorAll('.collection-head, .product-card');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('reveal', 'is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------
     PERSISTENT LEFT SIDEBAR — dynamic collection nav
     Populates the site's persistent #sidebar (id="sidebarList") with
     one entry per real collection, in the same order as everywhere
     else (data/collections-index.js). Two modes:

       'scroll' — used on index.html. Clicking a link smooth-scrolls
                  to that collection's <section id="collection-<slug>">
                  on the same page; an IntersectionObserver keeps the
                  active item (and its left indicator bar) in sync
                  while the user scrolls manually.

       'link'   — used on collection.html, which has no per-collection
                  sections of its own (it renders one selected
                  collection into a single gallery pane). Here each
                  entry is a plain link to collection.html?slug=<slug>,
                  reusing that page's existing ?slug= handling.

     Reuses the exact .sidebar-link / .sb-code / .sb-label / .active
     markup and CSS already defined in style.css for the old hardcoded
     category buttons — nothing about that styling changes.
  ---------------------------------------------------------------- */

  function closeMobileSidebarIfOpen() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var toggle = document.getElementById('navToggle');
    if (!sidebar || !sidebar.classList.contains('is-open')) return;
    sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    if (toggle) {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('no-scroll');
  }

  function buildSidebarNavItem(collection, index, mode) {
    var li = document.createElement('li');
    var el = document.createElement(mode === 'scroll' ? 'button' : 'a');

    el.className = 'sidebar-link';
    el.setAttribute('data-slug', collection.slug);

    if (mode === 'scroll') {
      el.type = 'button';
    } else {
      el.href = 'collection.html?slug=' + encodeURIComponent(collection.slug);
    }

    var code = document.createElement('span');
    code.className = 'sb-code';
    code.textContent = String(index + 1).padStart(2, '0');

    var label = document.createElement('span');
    label.className = 'sb-label';
    label.textContent = collection.name;

    el.appendChild(code);
    el.appendChild(label);
    li.appendChild(el);
    return li;
  }

  function wireSidebarScrollSpy(collections) {
    var links = document.querySelectorAll('#sidebarList .sidebar-link');
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var slug = link.getAttribute('data-slug');
        var section = document.getElementById('collection-' + slug);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileSidebarIfOpen();
      });
    });

    function setActive(slug) {
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('data-slug') === slug);
      });
    }

    var sections = collections
      .map(function (c) { return document.getElementById('collection-' + c.slug); })
      .filter(Boolean);

    if (collections[0]) setActive(collections[0].slug);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(visible[0].target.id.replace('collection-', ''));
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  function wireSidebarStaticLinks() {
    var links = document.querySelectorAll('#sidebarList .sidebar-link');
    var params = new URLSearchParams(window.location.search);
    var activeSlug = params.get('slug');

    links.forEach(function (link) {
      link.classList.toggle('active', activeSlug ? link.getAttribute('data-slug') === activeSlug : false);
      link.addEventListener('click', closeMobileSidebarIfOpen);
    });
  }

  function renderPersistentSidebar(collections, mode) {
    var list = document.getElementById('sidebarList');
    if (!list || !collections || !collections.length) return;

    list.innerHTML = '';
    collections.forEach(function (collection, i) {
      list.appendChild(buildSidebarNavItem(collection, i, mode));
    });

    if (mode === 'scroll') {
      wireSidebarScrollSpy(collections);
    } else {
      wireSidebarStaticLinks();
    }
  }

  function registerProductLookup(collections) {
    var byId = {};
    collections.forEach(function (c) {
      c.products.forEach(function (p) { byId[p.id] = p; });
    });

    window.GZ = window.GZ || {};
    var existingGetById = window.GZ.getProductById;

    window.GZ.getProductById = function (id) {
      if (byId[id]) return byId[id];
      return existingGetById ? existingGetById(id) : null;
    };
  }

  function render() {
    var host = document.getElementById('collectionsHost');
    var slugs = window.GZ_COLLECTIONS_INDEX || [];
    var available = window.GZ_COLLECTIONS || [];
    if (!host || !slugs.length) return;

    var bySlug = {};
    available.forEach(function (c) { bySlug[c.slug] = c; });

    var orderedCollections = [];

    slugs.forEach(function (slug) {
      var collection = bySlug[slug];
      if (!collection) {
        console.warn('[collections] No data loaded for slug:', slug);
        return;
      }
      orderedCollections.push(collection);
      host.appendChild(buildSection(collection));
    });

    if (!orderedCollections.length) return;

    registerProductLookup(orderedCollections);

    if (window.GZ && window.GZ.hydratePlaceholders) {
      window.GZ.hydratePlaceholders(host);
    }

    applyReveal(host);

    // Sections now exist in the DOM (id="collection-<slug>"), so the
    // persistent left sidebar can scroll-spy against them.
    renderPersistentSidebar(orderedCollections, 'scroll');
  }

  function init() {
    // Only the homepage has #collectionsHost. The single collection
    // page (collection.html) reuses this file's helper functions
    // (exposed below) but loads just the one collection it needs, so
    // this batch-load-everything path only runs where it's needed.
    if (!document.getElementById('collectionsHost')) return;

    var slugs = window.GZ_COLLECTIONS_INDEX || [];
    if (!slugs.length) return;

    Promise.all(slugs.map(function (slug) {
      return loadScript('data/' + slug + '.js');
    })).then(render);
  }

  document.addEventListener('DOMContentLoaded', init);

  // Small reusable helpers so collection.html (the single generic
  // full-collection page) can build identical cards / reveal
  // animations without duplicating this logic.
  window.GZ = window.GZ || {};
  window.GZ.buildCollectionCard = buildCard;
  window.GZ.applyCollectionsReveal = applyReveal;
  window.GZ.loadCollectionScript = loadScript;
  window.GZ.registerCollectionProducts = registerProductLookup;
  window.GZ.renderPersistentSidebar = renderPersistentSidebar;

})();