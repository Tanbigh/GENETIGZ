/* ==============================================================
   GENETIGZ — PRODUCT TYPE FILTER (URL-driven)
   The category chips themselves now live as static links on the
   homepage (index.html), just below the hero — see that file. Each
   link points to collection.html?type=<slug>. This script's only
   job is to run on collection.html, read that `type` param, and
   apply the same filtering the old on-page chip row used to do
   directly, plus show a small "Showing: X — Clear" indicator so
   there's a way back to the full catalog without editing the URL.

   Filtering itself works exactly as before: it never re-renders
   cards, it only toggles `.is-filtered-out` on the `.product-card`
   elements collection.html's own script (or collections.js) already
   built, and re-applies whenever those cards change (switching the
   collection/drop tabs) via a MutationObserver.
============================================================== */

(function () {
  'use strict';

  var CATEGORY_LABELS = {
    'oversized': 'Oversized',
    'regular': 'Regular',
    'polo': 'Polo',
    'tank-top': 'Tank Top'
  };

  var state = { category: 'all' };
  var productsById = {};

  function slugify(str) {
    return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function getAllProducts() {
    var out = [];
    (window.GZ_COLLECTIONS || []).forEach(function (c) {
      (c.products || []).forEach(function (p) { out.push(p); });
    });
    return out;
  }

  function getProductById(id) {
    return productsById[id] || (window.GZ && window.GZ.getProductById ? window.GZ.getProductById(id) : null);
  }

  function collectionsReady() {
    var slugs = window.GZ_COLLECTIONS_INDEX || [];
    if (!slugs.length) return false;
    var loaded = {};
    (window.GZ_COLLECTIONS || []).forEach(function (c) { loaded[c.slug] = true; });
    return slugs.every(function (s) { return loaded[s]; });
  }

  function waitForCollections(cb) {
    if (collectionsReady()) { cb(); return; }
    var tries = 0;
    var timer = window.setInterval(function () {
      tries++;
      if (collectionsReady() || tries > 150) { // ~7.5s ceiling
        window.clearInterval(timer);
        cb();
      }
    }, 50);
  }

  function readTypeFromURL() {
    var params = new URLSearchParams(window.location.search);
    var type = params.get('type');
    return (type && CATEGORY_LABELS[type]) ? type : 'all';
  }

  function productMatches(product) {
    if (state.category === 'all') return true;
    return slugify(product.productType || '') === state.category;
  }

  function ensureEmptyMessage(container) {
    var msg = container.querySelector(':scope > .filters-empty-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'filters-empty-message';
      msg.textContent = 'No products found matching the selected filter.';
      container.appendChild(msg);
    }
  }

  function removeEmptyMessage(container) {
    var msg = container.querySelector(':scope > .filters-empty-message');
    if (msg) msg.remove();
  }

  function renderIndicator() {
    var head = document.querySelector('.collection-head');
    if (!head) return;
    var existing = document.getElementById('activeTypeFilter');

    if (state.category === 'all') {
      if (existing) existing.remove();
      return;
    }

    if (!existing) {
      existing = document.createElement('p');
      existing.id = 'activeTypeFilter';
      existing.className = 'active-type-filter';
      head.appendChild(existing);
    }
    existing.innerHTML = '';

    var label = document.createElement('span');
    label.textContent = 'Showing: ' + (CATEGORY_LABELS[state.category] || state.category);

    var clear = document.createElement('a');
    clear.href = 'collection.html';
    clear.className = 'active-type-filter-clear';
    clear.textContent = 'Clear filter';

    existing.appendChild(label);
    existing.appendChild(clear);
  }

  function applyFilter() {
    document.querySelectorAll('.product-card[data-id]').forEach(function (card) {
      var product = getProductById(card.getAttribute('data-id'));
      var visible = product ? productMatches(product) : true;
      card.classList.toggle('is-filtered-out', !visible);
    });

    var galleryGrid = document.getElementById('collectionsGalleryGrid');
    if (galleryGrid) {
      var hasCards = galleryGrid.querySelector('.product-card');
      var visibleInGallery = galleryGrid.querySelector('.product-card:not(.is-filtered-out)');
      if (hasCards && !visibleInGallery) ensureEmptyMessage(galleryGrid);
      else removeEmptyMessage(galleryGrid);
    }

    renderIndicator();
  }

  function initObserver() {
    var galleryGrid = document.getElementById('collectionsGalleryGrid');
    if (!galleryGrid) return;
    var pending = null;
    new MutationObserver(function () {
      if (pending) window.clearTimeout(pending);
      pending = window.setTimeout(applyFilter, 30);
    }).observe(galleryGrid, { childList: true, subtree: true });
  }

  function init() {
    if (!document.getElementById('collectionsGalleryGrid')) return; // collection.html only
    state.category = readTypeFromURL();
    if (state.category === 'all') return; // nothing to filter or show

    waitForCollections(function () {
      getAllProducts().forEach(function (p) { productsById[p.id] = p; });
      applyFilter();
      initObserver();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.GZ = window.GZ || {};
  window.GZ.reapplyProductTypeFilter = applyFilter;

})();