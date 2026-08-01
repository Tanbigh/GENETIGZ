/* ==============================================================
   GENETIGZ — PRODUCT MODAL
   Opens the shared #productModal for whichever card was activated,
   populates its spec sheet from the product data in js/products.js,
   and hydrates the front/back images through the same progressive
   placeholder system used everywhere else on the site.

   ADDED: Size Guide. The modal already shows "Available Sizes" as
   text — this adds a button that opens the correct chart IMAGE
   (Regular or Oversized) based on the open product's `fit` field.
   It's a second, lightweight overlay (.size-guide-overlay, styled
   in collections.css) rather than reusing #productModal itself, so
   it never interferes with the existing modal's own open/close
   state or focus handling.
============================================================== */

(function () {
  'use strict';

  var overlay, modal, closeBtn;
  var lastFocusedEl = null;
  var currentProduct = null;

  var sizeGuideOverlay, sizeGuideImg;

  function getProduct(id){
    return window.GZ && window.GZ.getProductById ? window.GZ.getProductById(id) : null;
  }

  function setImage(el, src, code, label){
    if (!el) return;
    // Reset hydration state so re-opening a different product re-resolves the image.
    delete el.dataset.hydrated;
    el.classList.remove('is-loaded', 'is-loading');
    el.style.removeProperty('--img');
    el.setAttribute('data-src', src);
    el.setAttribute('data-label', code);
    el.setAttribute('data-eager', 'true'); // modal images only render on demand, so resolve immediately
    var tag = el.querySelector('.ph-tag');
    if (tag) tag.textContent = label + ' — IMG PENDING';
  }

  function populate(product){
    currentProduct = product;

    document.getElementById('modalCode').textContent = product.code;
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalFabric').textContent = product.fabric;
    document.getElementById('modalSizes').textContent = product.sizes;
    document.getElementById('modalColors').textContent = product.colors;
    document.getElementById('modalPrintArea').textContent = product.printArea;
    document.getElementById('modalNotes').textContent = product.notes;

    setImage(document.getElementById('modalFrontImage'), product.images.front, product.code, 'FRONT');

    var backWrap = document.getElementById('modalBackImage') ? document.getElementById('modalBackImage').closest('.modal-image-wrap') : null;
    var visuals = modal ? modal.querySelector('.modal-visuals') : null;
    if (product.images.back) {
      setImage(document.getElementById('modalBackImage'), product.images.back, product.code, 'BACK');
      if (backWrap) backWrap.style.display = '';
      if (visuals) visuals.classList.remove('is-single');
    } else if (backWrap) {
      // Single-image product (e.g. no separate back photo yet) — hide the
      // second panel instead of showing a broken/placeholder back image.
      backWrap.style.display = 'none';
      // Layout fix: without this, .modal-visuals keeps its 2-column track
      // and the lone front image only fills half the column, leaving a
      // dead gap next to it instead of the image resizing to fit.
      if (visuals) visuals.classList.add('is-single');
    }

    var waLink = document.getElementById('modalWhatsapp');
    if (waLink){
      var msg = 'Hi Genetigz, I\'d like to order the ' + product.name + ' (' + product.code + ').';
      waLink.href = 'https://wa.me/918145532620?text=' + encodeURIComponent(msg);
    }

    // Resolve the two modal images now that data-src/data-eager are set.
    if (window.GZ && window.GZ.hydratePlaceholders){
      window.GZ.hydratePlaceholders(modal);
    }
  }

  function openModal(productId){
    var product = getProduct(productId);
    if (!product || !overlay) return;

    populate(product);
    lastFocusedEl = document.activeElement;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    window.requestAnimationFrame(function () {
      if (closeBtn) closeBtn.focus();
    });
  }

  function closeModal(){
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    closeSizeGuide();

    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function'){
      lastFocusedEl.focus();
    }
  }

  /* ---------------------- Size Guide overlay ---------------------- */

  function ensureSizeGuideOverlay(){
    if (sizeGuideOverlay) return sizeGuideOverlay;

    sizeGuideOverlay = document.createElement('div');
    sizeGuideOverlay.className = 'size-guide-overlay';
    sizeGuideOverlay.setAttribute('aria-hidden', 'true');

    var box = document.createElement('div');
    box.className = 'size-guide-box';

    var innerClose = document.createElement('button');
    innerClose.type = 'button';
    innerClose.className = 'size-guide-close';
    innerClose.setAttribute('aria-label', 'Close size guide');
    innerClose.innerHTML = '&times;';
    innerClose.addEventListener('click', closeSizeGuide);

    sizeGuideImg = document.createElement('img');
    sizeGuideImg.alt = 'Size chart';

    box.appendChild(innerClose);
    box.appendChild(sizeGuideImg);
    sizeGuideOverlay.appendChild(box);
    document.body.appendChild(sizeGuideOverlay);

    sizeGuideOverlay.addEventListener('click', function (e) {
      if (e.target === sizeGuideOverlay) closeSizeGuide();
    });

    return sizeGuideOverlay;
  }

  function openSizeGuide(fit){
    ensureSizeGuideOverlay();
    var isOversized = fit === 'oversized';
    sizeGuideImg.src = isOversized ? 'images/size-charts/oversized.jpeg' : 'images/size-charts/regular.jpeg';
    sizeGuideImg.alt = (isOversized ? 'Oversized fit' : 'Regular fit') + ' size chart';
    sizeGuideOverlay.classList.add('is-open');
    sizeGuideOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeSizeGuide(){
    if (!sizeGuideOverlay) return;
    sizeGuideOverlay.classList.remove('is-open');
    sizeGuideOverlay.setAttribute('aria-hidden', 'true');
  }

  function initSizeGuideTrigger(){
    var btn = document.getElementById('modalSizeGuideBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      // Falls back to the Regular chart if a product hasn't been given
      // a `fit` field yet (see data/lonewolf.js for the field), so the
      // button always does something useful rather than silently failing.
      openSizeGuide(currentProduct ? currentProduct.fit : 'regular');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sizeGuideOverlay && sizeGuideOverlay.classList.contains('is-open')){
        closeSizeGuide();
      }
    });
  }

  /* ---------------------- existing wiring ---------------------- */

  function initCardTriggers(){
    // Event delegation on the document: product cards are re-rendered
    // whenever the category changes (js/products.js) and collection
    // sections are rendered separately into their own grids
    // (collections.js), so we listen once at the document level rather
    // than binding to a single grid container. Behavior for the
    // existing #productGrid cards is unchanged — document-level
    // delegation still catches every click/keydown inside it.
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.product-card');
      if (!card) return;
      openModal(card.getAttribute('data-id'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.product-card');
      if (!card) return;
      e.preventDefault();
      openModal(card.getAttribute('data-id'));
    });
  }

  function initCloseTriggers(){
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (overlay){
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')){
        closeModal();
      }
    });
  }

  function init(){
    overlay = document.getElementById('productModal');
    modal = overlay ? overlay.querySelector('.modal') : null;
    closeBtn = document.getElementById('modalClose');

    initCardTriggers();
    initCloseTriggers();
    initSizeGuideTrigger();
  }

  document.addEventListener('DOMContentLoaded', init);

})();