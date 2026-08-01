/* ==============================================================
   GENETIGZ — PRODUCT CATEGORY + COLOR + SIZE FILTERS
   Turns the persistent left #sidebar's #sidebarList (previously a
   list of collection/drop names, rendered by collections.js) into a
   dynamic "Product Categories" list, and adds a Filters block
   (#sidebarFilters — Color swatches + Size chips) directly below it.

   Nothing here is hardcoded:
   - Categories come from each product's own `productType` field
     (see data/lonewolf.js for the field's meaning). Add a new
     productType anywhere in any collection file and it appears here
     automatically, with zero code changes.
   - Colors come from each product's existing `colors` field.
   - Sizes come from each product's existing `sizes` field.

   This file never re-renders product cards itself — collections.js
   and collection.html's own inline script keep doing that exactly
   as before. This file only ever toggles a `.is-filtered-out` class
   on the `.product-card` elements they already built, and reads
   product data via a local id→product map (so it never has to touch
   or depend on the timing of collections.js's own render pipeline).
============================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     COLOR CHARTS — the two swatch references supplied for the site.
     These are the single source of truth for hex values; a product's
     `colors` text is matched against these (case-insensitively, with
     a small alias table for common synonyms actually seen in product
     data, e.g. "Off-Black"). Anything that still can't be resolved
     falls back to a real CSS color keyword if the browser recognizes
     the word, and finally to a hatched "no reference" swatch — it
     never silently guesses a wrong color.
  ---------------------------------------------------------------- */
  var REGULAR_COLOR_HEX = {
    'Grey': '#8C8C8C',
    'Navy': '#0B1F4D',
    'Green': '#3FA672',
    'White': '#F5F5F5',
    'Bottle Green': '#0E4536',
    'Mustard': '#F2A900',
    'Black': '#0A0A0A',
    'Royal Blue': '#2E3EA8',
    'Red': '#D3232A',
    'Heather Grey': '#9A9A9A'
  };

  var OVERSIZED_COLOR_HEX = {
    'Maroon': '#7A1F2B',
    'Teal': '#1B7A94',
    'Olive': '#8FB239',
    'Grey': '#B5B5B5',
    'Cream': '#F4F1E6',
    'Sage': '#A9C48C',
    'Navy': '#242850',
    'Lavender': '#C9A8E0',
    'Cobalt': '#2A2E86',
    'Black': '#0A0A0A'
  };

  // Synonyms actually seen in product `colors` text that map onto one
  // of the two official charts above. Extend this list as new color
  // names show up in future products — it never invents a new hex,
  // it only points an alternate spelling at an existing chart entry.
  var COLOR_ALIASES = {
    'off-black': 'Black',
    'jet black': 'Black',
    'ebony': 'Black',
    'washed black': 'Black',
    'ivory': 'White',
    'off-white': 'White',
    'pearl white': 'White',
    'forest green': 'Bottle Green',
    'bottle-green': 'Bottle Green',
    'royal-blue': 'Royal Blue',
    'heather-grey': 'Heather Grey',
    'heather gray': 'Heather Grey',
    'gray': 'Grey'
  };

  var CANONICAL_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

  var state = {
    category: 'all',
    colors: new Set(),
    sizes: new Set()
  };

  var productsById = {};

  /* ---------------------- data helpers ---------------------- */

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

  function getProductColors(product) {
    return String(product.colors || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function getProductSizes(product) {
    return String(product.sizes || '').split('·').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function getProductById(id) {
    return productsById[id] || (window.GZ && window.GZ.getProductById ? window.GZ.getProductById(id) : null);
  }

  function resolveColorHex(name, fit) {
    var primaryChart = fit === 'regular' ? REGULAR_COLOR_HEX : (fit === 'oversized' ? OVERSIZED_COLOR_HEX : null);
    var normalized = name.trim().toLowerCase();
    var canonicalAlias = COLOR_ALIASES[normalized];

    function lookupIn(map) {
      if (!map) return null;
      var keys = Object.keys(map);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === normalized) return map[keys[i]];
      }
      if (canonicalAlias && map[canonicalAlias]) return map[canonicalAlias];
      return null;
    }

    var hex = lookupIn(primaryChart) || lookupIn(REGULAR_COLOR_HEX) || lookupIn(OVERSIZED_COLOR_HEX);
    if (hex) return { hex: hex, exact: true };

    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', name)) {
      return { hex: name, exact: false };
    }
    return { hex: null, exact: false };
  }

  /* ---------------------- data loading ---------------------- */

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

  /* ---------------------- categories ---------------------- */

  function computeCategories(products) {
    var order = [];
    var counts = {};
    var labelByKey = {};

    products.forEach(function (p) {
      var label = p.productType || 'Uncategorized';
      var key = slugify(label);
      if (order.indexOf(key) === -1) order.push(key);
      counts[key] = (counts[key] || 0) + 1;
      labelByKey[key] = label;
    });

    var categories = [{ key: 'all', label: 'All Products', count: products.length }];
    order.forEach(function (key) {
      categories.push({ key: key, label: labelByKey[key], count: counts[key] });
    });
    return categories;
  }

  function buildCategoryItem(category, index) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sidebar-link';
    btn.setAttribute('data-category', category.key);

    var code = document.createElement('span');
    code.className = 'sb-code';
    code.textContent = index === 0 ? 'ALL' : String(index).padStart(2, '0');

    var label = document.createElement('span');
    label.className = 'sb-label';
    label.textContent = category.label;

    btn.appendChild(code);
    btn.appendChild(label);
    li.appendChild(btn);

    btn.addEventListener('click', function () {
      if (state.category === category.key) return;
      state.category = category.key;
      state.colors.clear();
      state.sizes.clear();
      syncCategoryActive();
      renderFilterOptions();
      applyFilters();
      closeMobileSidebarIfOpen();
    });

    return li;
  }

  function syncCategoryActive() {
    document.querySelectorAll('#sidebarList .sidebar-link[data-category]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-category') === state.category);
    });
  }

  function renderCategories(categories) {
    var list = document.getElementById('sidebarList');
    if (!list) return;
    list.innerHTML = '';
    categories.forEach(function (cat, i) { list.appendChild(buildCategoryItem(cat, i)); });
    syncCategoryActive();
  }

  /* ---------------------- color + size filters ---------------------- */

  function scopedProducts() {
    var products = getAllProducts();
    if (state.category === 'all') return products;
    return products.filter(function (p) {
      return slugify(p.productType || 'Uncategorized') === state.category;
    });
  }

  function renderFilterOptions() {
    var scoped = scopedProducts();

    // --- Colors ---
    var colorNames = [];
    scoped.forEach(function (p) {
      getProductColors(p).forEach(function (c) {
        if (colorNames.indexOf(c) === -1) colorNames.push(c);
      });
    });

    var swatchHost = document.getElementById('sidebarColorSwatches');
    if (swatchHost) {
      swatchHost.innerHTML = '';
      colorNames.forEach(function (name) {
        var owner = scoped.filter(function (p) { return getProductColors(p).indexOf(name) > -1; })[0] || {};
        var resolved = resolveColorHex(name, owner.fit);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-swatch' + (resolved.hex ? '' : ' no-ref');
        if (resolved.hex) btn.style.background = resolved.hex;
        btn.title = name;
        btn.setAttribute('aria-label', 'Filter by color: ' + name);
        btn.setAttribute('data-color', name);
        btn.classList.toggle('is-active', state.colors.has(name));

        btn.addEventListener('click', function () {
          if (state.colors.has(name)) state.colors.delete(name); else state.colors.add(name);
          btn.classList.toggle('is-active');
          applyFilters();
          syncClearButton();
        });

        swatchHost.appendChild(btn);
      });
    }

    // --- Sizes ---
    var sizeNames = [];
    scoped.forEach(function (p) {
      getProductSizes(p).forEach(function (s) {
        if (sizeNames.indexOf(s) === -1) sizeNames.push(s);
      });
    });
    sizeNames.sort(function (a, b) {
      var ia = CANONICAL_SIZE_ORDER.indexOf(a.toUpperCase());
      var ib = CANONICAL_SIZE_ORDER.indexOf(b.toUpperCase());
      if (ia === -1) ia = 999;
      if (ib === -1) ib = 999;
      return ia - ib;
    });

    var sizeHost = document.getElementById('sidebarSizeChips');
    if (sizeHost) {
      sizeHost.innerHTML = '';
      sizeNames.forEach(function (size) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'size-chip';
        btn.textContent = size;
        btn.setAttribute('data-size', size);
        btn.setAttribute('aria-label', 'Filter by size: ' + size);
        btn.classList.toggle('is-active', state.sizes.has(size));

        btn.addEventListener('click', function () {
          if (state.sizes.has(size)) state.sizes.delete(size); else state.sizes.add(size);
          btn.classList.toggle('is-active');
          applyFilters();
          syncClearButton();
        });

        sizeHost.appendChild(btn);
      });
    }

    syncClearButton();
  }

  function syncClearButton() {
    var clearBtn = document.getElementById('sidebarFilterClear');
    if (!clearBtn) return;
    var anyActive = state.category !== 'all' || state.colors.size > 0 || state.sizes.size > 0;
    clearBtn.hidden = !anyActive;
  }

  /* ---------------------- applying filters to the DOM ---------------------- */

  function productMatches(product) {
    if (state.category !== 'all') {
      if (slugify(product.productType || 'Uncategorized') !== state.category) return false;
    }
    if (state.colors.size) {
      var colors = getProductColors(product);
      var matchColor = colors.some(function (c) { return state.colors.has(c); });
      if (!matchColor) return false;
    }
    if (state.sizes.size) {
      var sizes = getProductSizes(product);
      var matchSize = sizes.some(function (s) { return state.sizes.has(s); });
      if (!matchSize) return false;
    }
    return true;
  }

  function ensureEmptyMessage(container) {
    var msg = container.querySelector(':scope > .filters-empty-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'filters-empty-message';
      msg.textContent = 'No products found matching the selected filters.';
      container.appendChild(msg);
    }
    return msg;
  }

  function removeEmptyMessage(container) {
    var msg = container.querySelector(':scope > .filters-empty-message');
    if (msg) msg.remove();
  }

  function applyFilters() {
    var anyFilterActive = state.category !== 'all' || state.colors.size > 0 || state.sizes.size > 0;

    document.querySelectorAll('.product-card[data-id]').forEach(function (card) {
      var product = getProductById(card.getAttribute('data-id'));
      var visible = product ? productMatches(product) : true;
      card.classList.toggle('is-filtered-out', !visible);
    });

    // Collapse now-empty per-collection preview sections (index.html)
    document.querySelectorAll('.collection-section').forEach(function (section) {
      var anyVisible = section.querySelector('.product-card:not(.is-filtered-out)');
      section.classList.toggle('is-filtered-empty', !anyVisible);
    });

    // "No products found" inside the single gallery grid (collection.html)
    var galleryGrid = document.getElementById('collectionsGalleryGrid');
    if (galleryGrid) {
      var hasCards = galleryGrid.querySelector('.product-card');
      var visibleInGallery = galleryGrid.querySelector('.product-card:not(.is-filtered-out)');
      if (hasCards && !visibleInGallery) ensureEmptyMessage(galleryGrid);
      else removeEmptyMessage(galleryGrid);
    }

    // "No products found" below the stacked homepage sections (index.html)
    var host = document.getElementById('collectionsHost');
    if (host) {
      var sections = document.querySelectorAll('.collection-section');
      var anySectionVisible = Array.prototype.some.call(sections, function (s) {
        return !s.classList.contains('is-filtered-empty');
      });
      if (sections.length && anyFilterActive && !anySectionVisible) ensureEmptyMessage(host);
      else removeEmptyMessage(host);
    }

    syncClearButton();
  }

  /* ---------------------- keep filters applied as cards re-render ---------------------- */

  function initObservers() {
    var host = document.getElementById('collectionsHost');
    var galleryGrid = document.getElementById('collectionsGalleryGrid');
    var pending = null;

    function reapply() {
      if (pending) window.clearTimeout(pending);
      pending = window.setTimeout(applyFilters, 30);
    }

    if (host) new MutationObserver(reapply).observe(host, { childList: true, subtree: true });
    if (galleryGrid) new MutationObserver(reapply).observe(galleryGrid, { childList: true, subtree: true });
  }

  /* ---------------------- mobile drawer close (mirrors collections.js) ---------------------- */

  function closeMobileSidebarIfOpen() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var toggle = document.getElementById('navToggle');
    if (!sidebar || !sidebar.classList.contains('is-open')) return;
    sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    if (toggle) { toggle.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
    document.body.classList.remove('no-scroll');
  }

  /* ---------------------- init ---------------------- */

  function init() {
    if (!document.getElementById('sidebarList')) return;

    waitForCollections(function () {
      var products = getAllProducts();
      if (!products.length) return;

      products.forEach(function (p) { productsById[p.id] = p; });

      renderCategories(computeCategories(products));
      renderFilterOptions();
      applyFilters();
      initObservers();

      var clearBtn = document.getElementById('sidebarFilterClear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          state.category = 'all';
          state.colors.clear();
          state.sizes.clear();
          syncCategoryActive();
          renderFilterOptions();
          applyFilters();
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.GZ = window.GZ || {};
  window.GZ.reapplyProductFilters = applyFilters;

})();