/* ==============================================================
   GENETIGZ — PRODUCT TYPE NAV (full-width bar, every page)
   The bar itself (All / Oversized / Regular / Polo / Tank Top) is
   static markup — see the .type-nav block right after <main> opens
   in both index.html and collection.html — since it's the same five
   links everywhere. This script has two jobs:

   1. On every page: read `type` from the current URL and underline
      the matching link (`.type-nav-link.is-active`), so landing on
      collection.html?type=oversized shows Oversized as active, and
      the homepage (no ?type=) shows All as active by default.

   2. Only where a product grid actually exists (collection.html's
      #collectionsGalleryGrid): apply that same category as a filter,
      toggling `.is-filtered-out` on the `.product-card` elements
      collection.html's own script already built — never re-rendering
      cards itself — and re-applying whenever those cards change (e.g.
      a fresh ?slug= collection loads) via a MutationObserver.
============================================================== */

(function () {
  'use strict';

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
    return params.get('type') || 'all';
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

  function syncActiveNav() {
    document.querySelectorAll('.type-nav-link[data-type]').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-type') === state.category);
    });
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
    state.category = readTypeFromURL();
    syncActiveNav();

    if (!document.getElementById('collectionsGalleryGrid')) return; // filtering only applies on collection.html
    if (state.category === 'all') return; // nothing to filter

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