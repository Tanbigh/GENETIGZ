/* ==============================================================
   GENETIGZ — PRODUCT DATA + CATALOG RENDERING
   Owns the product source-of-truth, renders cards into #productGrid,
   and keeps every "switch category" control in the DOM (sidebar nav,
   in-flow tabs, footer links) in sync with one another.

   To add real photography: drop files at the paths referenced in
   each product's `images.front` / `images.back` below (any images/
   subfolder works) — the placeholder system in script.js will pick
   them up automatically once they exist, with no other code changes.
============================================================== */

(function () {
  'use strict';

  var CATEGORY_META = {
    tshirt:  { label: 'T-Shirts',   title: 'T-Shirts',   sub: 'silhouettes currently in rotation.' },
    polo:    { label: 'Polos',      title: 'Polos',       sub: 'silhouettes currently in rotation.' },
    baggy:   { label: 'Baggy Tees', title: 'Baggy Tees',  sub: 'silhouettes currently in rotation.' },
    tanktop: { label: 'Tank Tops',  title: 'Tank Tops',   sub: 'silhouettes currently in rotation.' }
  };

  var PRODUCTS = [
    /* ---------------- T-SHIRT ---------------- */
    {
      id: 'gz-ts-001', code: 'GZ-TS-001', category: 'tshirt',
      name: 'Formula Oversized Tee',
      fabric: '240GSM combed cotton, heavyweight',
      sizes: 'S · M · L · XL · XXL',
      colors: 'Stone Beige, Espresso, Off-Black',
      printArea: 'Front chest + full back',
      notes: 'Dropped shoulder, boxy fit. Runs true to size.',
      images: { front: 'images/products/tshirt/gz-ts-001-front.jpg', back: 'images/products/tshirt/gz-ts-001-back.jpg' }
    },
    {
      id: 'gz-ts-002', code: 'GZ-TS-002', category: 'tshirt',
      name: 'Blueprint Graphic Tee',
      fabric: '220GSM combed cotton',
      sizes: 'S · M · L · XL',
      colors: 'Ivory, Sand, Black',
      printArea: 'Center front, high-density puff print',
      notes: 'Regular fit with a slightly cropped hem.',
      images: { front: 'images/products/tshirt/gz-ts-002-front.jpg', back: 'images/products/tshirt/gz-ts-002-back.jpg' }
    },
    {
      id: 'gz-ts-003', code: 'GZ-TS-003', category: 'tshirt',
      name: 'Spec Sheet Tee',
      fabric: '240GSM combed cotton, heavyweight',
      sizes: 'S · M · L · XL · XXL',
      colors: 'Off-Black, Olive',
      printArea: 'Front chest small hit + back placement print',
      notes: 'Oversized fit, reinforced double-needle collar.',
      images: { front: 'images/products/tshirt/gz-ts-003-front.jpg', back: 'images/products/tshirt/gz-ts-003-back.jpg' }
    },
    {
      id: 'gz-ts-004', code: 'GZ-TS-004', category: 'tshirt',
      name: 'Batch 01 Essential Tee',
      fabric: '220GSM combed cotton',
      sizes: 'S · M · L · XL',
      colors: 'Beige, White, Black',
      printArea: 'Left chest embroidery',
      notes: 'The house basic — clean face, engineered fabric.',
      images: { front: 'images/products/tshirt/gz-ts-004-front.jpg', back: 'images/products/tshirt/gz-ts-004-back.jpg' }
    },

    /* ---------------- POLO ---------------- */
    {
      id: 'gz-pl-001', code: 'GZ-PL-001', category: 'polo',
      name: 'Atelier Pique Polo',
      fabric: '210GSM cotton pique',
      sizes: 'S · M · L · XL',
      colors: 'Stone Beige, Espresso',
      printArea: 'Left chest embroidery',
      notes: 'Structured collar, mother-of-pearl buttons.',
      images: { front: 'images/products/polo/gz-pl-001-front.jpg', back: 'images/products/polo/gz-pl-001-back.jpg' }
    },
    {
      id: 'gz-pl-002', code: 'GZ-PL-002', category: 'polo',
      name: 'Technical Mesh Polo',
      fabric: '200GSM cotton-poly mesh',
      sizes: 'S · M · L · XL · XXL',
      colors: 'Black, Sand',
      printArea: 'Back yoke placement print',
      notes: 'Breathable weave, built for movement.',
      images: { front: 'images/products/polo/gz-pl-002-front.jpg', back: 'images/products/polo/gz-pl-002-back.jpg' }
    },
    {
      id: 'gz-pl-003', code: 'GZ-PL-003', category: 'polo',
      name: 'Long Line Polo',
      fabric: '220GSM cotton pique',
      sizes: 'M · L · XL',
      colors: 'Olive, Off-Black',
      printArea: 'Left chest woven patch',
      notes: 'Extended hem, side vents for drape.',
      images: { front: 'images/products/polo/gz-pl-003-front.jpg', back: 'images/products/polo/gz-pl-003-back.jpg' }
    },

    /* ---------------- BAGGY TEE ---------------- */
    {
      id: 'gz-bg-001', code: 'GZ-BG-001', category: 'baggy',
      name: 'Overspec Baggy Tee',
      fabric: '260GSM heavyweight cotton',
      sizes: 'M · L · XL · XXL',
      colors: 'Espresso, Off-Black',
      printArea: 'Full front graphic, back tag print',
      notes: 'Extreme drop shoulder, boxy silhouette.',
      images: { front: 'images/products/baggy/gz-bg-001-front.jpg', back: 'images/products/baggy/gz-bg-001-back.jpg' }
    },
    {
      id: 'gz-bg-002', code: 'GZ-BG-002', category: 'baggy',
      name: 'Archive Wash Baggy Tee',
      fabric: '240GSM cotton, garment-dyed',
      sizes: 'S · M · L · XL',
      colors: 'Stone Beige, Washed Black',
      printArea: 'Center chest distressed print',
      notes: 'Enzyme-washed for a broken-in hand-feel.',
      images: { front: 'images/products/baggy/gz-bg-002-front.jpg', back: 'images/products/baggy/gz-bg-002-back.jpg' }
    },
    {
      id: 'gz-bg-003', code: 'GZ-BG-003', category: 'baggy',
      name: 'Field Notes Baggy Tee',
      fabric: '260GSM heavyweight cotton',
      sizes: 'M · L · XL · XXL',
      colors: 'Sand, Black',
      printArea: 'Back full graphic + sleeve hit',
      notes: 'Dropped hem, side slits.',
      images: { front: 'images/products/baggy/gz-bg-003-front.jpg', back: 'images/products/baggy/gz-bg-003-back.jpg' }
    },

    /* ---------------- TANK TOP ---------------- */
    {
      id: 'gz-tk-001', code: 'GZ-TK-001', category: 'tanktop',
      name: 'Rib Frame Tank',
      fabric: '220GSM ribbed cotton',
      sizes: 'S · M · L · XL',
      colors: 'Ivory, Espresso',
      printArea: 'Front chest small hit',
      notes: 'Wide armhole, dropped shoulder tank.',
      images: { front: 'images/products/tanktop/gz-tk-001-front.jpg', back: 'images/products/tanktop/gz-tk-001-back.jpg' }
    },
    {
      id: 'gz-tk-002', code: 'GZ-TK-002', category: 'tanktop',
      name: 'Spec Line Tank',
      fabric: '240GSM heavyweight cotton',
      sizes: 'S · M · L · XL · XXL',
      colors: 'Off-Black, Olive',
      printArea: 'Back full placement print',
      notes: 'Boxy fit, raw-cut armhole finish.',
      images: { front: 'images/products/tanktop/gz-tk-002-front.jpg', back: 'images/products/tanktop/gz-tk-002-back.jpg' }
    }
  ];

  var state = { category: 'tshirt' };

  function whatsappLink(product){
    var msg = 'Hi Genetigz, I\'d like to order the ' + product.name + '.';
    return 'https://wa.me/917001494960?text=' + encodeURIComponent(msg);
  }

  function buildCard(product){
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
        '<a href="' + whatsappLink(product) + '" class="btn-primary btn-whatsapp product-card-whatsapp" target="_blank" rel="noopener" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()">Order on WhatsApp</a>' +
      '</div>';

    return card;
  }

  function renderGrid(category){
    var grid = document.getElementById('productGrid');
    var titleEl = document.getElementById('collectionTitle');
    var subEl = document.getElementById('collectionSub');
    if (!grid) return;

    var items = PRODUCTS.filter(function (p) { return p.category === category; });
    var meta = CATEGORY_META[category] || { title: 'Catalog', sub: 'silhouettes currently in rotation.' };

    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = String(items.length).padStart(2, '0') + ' ' + meta.sub;

    grid.innerHTML = '';

    if (!items.length){
      var empty = document.createElement('div');
      empty.className = 'product-empty';
      empty.textContent = 'NO SILHOUETTES LOGGED IN THIS CATEGORY YET.';
      grid.appendChild(empty);
    } else {
      items.forEach(function (product, i) {
        var card = buildCard(product);
        card.style.animationDelay = (i * 70) + 'ms';
        grid.appendChild(card);
      });
    }

    // Let script.js re-run reveal + lazy-image hydration on the fresh cards.
    document.dispatchEvent(new CustomEvent('gz:productsRendered'));
  }

  function setActiveCategory(category, opts){
    opts = opts || {};
    if (!CATEGORY_META[category]) return;
    state.category = category;

    // Sync every control that can trigger a category switch.
    var selector = '[data-category]';
    document.querySelectorAll(selector).forEach(function (el) {
      var isMatch = el.getAttribute('data-category') === category;
      if (el.classList.contains('sidebar-link') || el.classList.contains('tab')){
        el.classList.toggle('active', isMatch);
      }
    });

    renderGrid(category);

    if (opts.scroll){
      var collection = document.getElementById('collection');
      if (collection) collection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function initCategorySwitching(){
    document.querySelectorAll('[data-category]').forEach(function (el) {
      el.addEventListener('click', function () {
        var category = el.getAttribute('data-category');
        var fromFooterOrTab = el.classList.contains('tab') || el.closest('.footer-col');
        setActiveCategory(category, { scroll: !!fromFooterOrTab && el.closest('.footer-col') });
      });
    });
  }

  function init(){
    initCategorySwitching();
    renderGrid(state.category);
  }

  document.addEventListener('DOMContentLoaded', init);

  // Exposed in case modal.js or script.js need product lookups.
  window.GZ = window.GZ || {};
  window.GZ.products = PRODUCTS;
  window.GZ.getProductById = function (id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null;
  };

})();