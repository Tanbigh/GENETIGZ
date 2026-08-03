/* ==============================================================
   GENETIGZ — PRODUCT TYPE NAV
   Horizontal chip row at the very top of collection.html, above the
   product grid: All / Oversized / Regular / Polo / Tank Top.

   The four category labels are a fixed, explicitly requested set
   (unlike the earlier per-drop sidebar, which was fully dynamic) —
   but matching against products still reads live off each product's
   own `productType` field (see data/lonewolf.js), so adding more
   products under an existing category needs zero code changes.

   Filtering works the same way the earlier sidebar filter did: it
   never re-renders cards itself, it only toggles `.is-filtered-out`
   on the `.product-card` elements collection.html's own script (or
   collections.js) already built, and re-applies whenever those cards
   change (switching the collection/drop tabs) via a MutationObserver.
============================================================== */

(function () {
  'use strict';

  var CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'oversized', label: 'Oversized' },
    { key: 'regular', label: 'Regular' },
    { key: 'polo', label: 'Polo' },
    { key: 'tank-top', label: 'Tank Top' }
  ];

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

  function buildChip(category) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'type-chip';
    btn.textContent = category.label;
    btn.setAttribute('data-type', category.key);
    btn.classList.toggle('is-active', state.category === category.key);

    btn.addEventListener('click', function () {
      if (state.category === category.key) return;
      state.category = category.key;
      syncActive();
      applyFilter();
    });

    return btn;
  }

  function syncActive() {
    document.querySelectorAll('.type-chip').forEach(function (chip) {
      chip.classList.toggle('is-active', chip.getAttribute('data-type') === state.category);
    });
  }

  function render() {
    var host = document.getElementById('productTypeNav');
    if (!host) return;
    host.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'type-chip-row';
    CATEGORIES.forEach(function (c) { row.appendChild(buildChip(c)); });
    host.appendChild(row);
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
      msg.textContent = 'No products found matching the selected filters.';
      container.appendChild(msg);
    }
  }

  function removeEmptyMessage(container) {
    var msg = container.querySelector(':scope > .filters-empty-message');
    if (msg) msg.remove();
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
    if (!document.getElementById('productTypeNav')) return;
    render(); // chips appear immediately; filtering activates once data is ready

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