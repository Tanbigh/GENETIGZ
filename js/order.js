/* ==============================================================
   GENETIGZ — LOGIN-GATED WHATSAPP ORDERING
   Purely additive on top of the existing product modal (#productModal,
   built by modal.js, which this file does not modify):

   1. Injects Size / Color / Quantity pickers into .modal-info, just
      above #modalWhatsapp, reading the available options straight out
      of #modalSizes / #modalColors (rebuilt every time the modal's
      product changes, via MutationObserver — no dependency on how
      modal.js internally opens/populates the modal).
   2. Intercepts the #modalWhatsapp click:
        - logged out  -> saves the pending order (product + picks) to
                         localStorage, redirects to login.html with a
                         ?redirect back to this page.
        - logged in   -> saves the order to MongoDB via POST /api/orders,
                         then opens WhatsApp with the order pre-filled.
   3. On page load, if a pending order is waiting AND the person is now
      logged in, finishes the flow automatically (saves the order,
      opens WhatsApp) instead of making them re-pick everything.

   Requires gz-config.js + auth.js loaded first.

   NOTE: modal.js / collections.js were not provided, so this file
   does not assume any internal function names from them — it only
   reads/writes the DOM ids that already exist in index.html's modal
   markup (#modalCode, #modalProductName, #modalSizes, #modalColors,
   #modalWhatsapp). If your real modal.js uses different ids, update
   the selectors below.
============================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '918145532620'; // matches the wa.me links already in index.html
  var PENDING_KEY = 'gz_pending_order';

  /* ----------------------------------------------------------------
     PICKER INJECTION
  ------------------------------------------------------------------- */
  function parseOptions(text) {
    return String(text || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function buildSelect(id, label, options) {
    var wrap = document.createElement('div');
    wrap.className = 'order-field';

    var labelEl = document.createElement('label');
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;

    var select = document.createElement('select');
    select.id = id;
    select.className = 'order-select';
    options.forEach(function (opt) {
      var optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt;
      select.appendChild(optionEl);
    });

    wrap.appendChild(labelEl);
    wrap.appendChild(select);
    return wrap;
  }

  function ensurePickers() {
    var modalInfo = document.querySelector('.modal-info');
    var whatsappBtn = document.getElementById('modalWhatsapp');
    if (!modalInfo || !whatsappBtn) return;

    var existing = document.getElementById('orderPickers');
    if (existing) existing.remove();

    var sizes = parseOptions(document.getElementById('modalSizes').textContent);
    var colors = parseOptions(document.getElementById('modalColors').textContent);
    if (!sizes.length) sizes = ['One Size'];
    if (!colors.length) colors = ['Default'];

    var container = document.createElement('div');
    container.id = 'orderPickers';
    container.className = 'order-pickers';

    container.appendChild(buildSelect('orderSize', 'Size', sizes));
    container.appendChild(buildSelect('orderColor', 'Color', colors));

    var qtyWrap = document.createElement('div');
    qtyWrap.className = 'order-field';
    var qtyLabel = document.createElement('label');
    qtyLabel.setAttribute('for', 'orderQty');
    qtyLabel.textContent = 'Quantity';
    var qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.id = 'orderQty';
    qtyInput.className = 'order-select';
    qtyInput.min = '1';
    qtyInput.value = '1';
    qtyWrap.appendChild(qtyLabel);
    qtyWrap.appendChild(qtyInput);
    container.appendChild(qtyWrap);

    modalInfo.insertBefore(container, whatsappBtn);
  }

  function watchModal() {
    var nameEl = document.getElementById('modalProductName');
    if (!nameEl) return;
    var observer = new MutationObserver(function () { ensurePickers(); });
    observer.observe(nameEl, { childList: true, characterData: true, subtree: true });
    // Also catch the very first product opened during this page view.
    ensurePickers();
  }

  /* ----------------------------------------------------------------
     GATHER CURRENT SELECTION
  ------------------------------------------------------------------- */
  function currentSelection() {
    var sizeEl = document.getElementById('orderSize');
    var colorEl = document.getElementById('orderColor');
    var qtyEl = document.getElementById('orderQty');

    return {
      productId: (document.getElementById('modalCode') || {}).textContent || '',
      productName: (document.getElementById('modalProductName') || {}).textContent || '',
      size: sizeEl ? sizeEl.value : '',
      color: colorEl ? colorEl.value : '',
      quantity: qtyEl ? Math.max(parseInt(qtyEl.value, 10) || 1, 1) : 1,
    };
  }

  function applySelection(selection) {
    var sizeEl = document.getElementById('orderSize');
    var colorEl = document.getElementById('orderColor');
    var qtyEl = document.getElementById('orderQty');
    if (sizeEl && selection.size) sizeEl.value = selection.size;
    if (colorEl && selection.color) colorEl.value = selection.color;
    if (qtyEl && selection.quantity) qtyEl.value = selection.quantity;
  }

  function buildWhatsappUrl(selection) {
    var message =
      'Hi GENETIGZ, I\'d like to order:\n' +
      'Product: ' + selection.productName + ' (' + selection.productId + ')\n' +
      'Size: ' + selection.size + '\n' +
      'Color: ' + selection.color + '\n' +
      'Quantity: ' + selection.quantity;
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  /* ----------------------------------------------------------------
     SAVE ORDER + OPEN WHATSAPP
  ------------------------------------------------------------------- */
  function saveOrderAndOpenWhatsapp(selection) {
    var whatsappUrl = buildWhatsappUrl(selection);

    return window.GZAuth.apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(selection),
    }).then(function (data) {
      var newWindow = window.open(whatsappUrl, '_blank', 'noopener');
      var status = newWindow ? 'opened' : 'failed';

      if (data.order && data.order._id) {
        window.GZAuth.apiFetch('/orders/' + data.order._id + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status: status }),
        }).catch(function () {});
      }

      if (!newWindow) {
        window.location.href = whatsappUrl; // popup blocked — fall back to a normal navigation
      }
    });
  }

  /* ----------------------------------------------------------------
     LOGIN GATE
  ------------------------------------------------------------------- */
  function handleWhatsappClick(e) {
    e.preventDefault();
    var selection = currentSelection();

    if (!selection.productId) {
      return; // modal isn't actually open / pickers didn't build — nothing to order
    }

    if (window.GZAuth && window.GZAuth.isLoggedIn()) {
      saveOrderAndOpenWhatsapp(selection);
      return;
    }

    try {
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(selection));
    } catch (err) {}

    var returnUrl = window.location.pathname + window.location.search + window.location.hash;
    window.location.href = 'login.html?redirect=' + encodeURIComponent(returnUrl);
  }

  /* ----------------------------------------------------------------
     RESUME AFTER LOGIN
  ------------------------------------------------------------------- */
  function resumePendingOrder() {
    var raw;
    try {
      raw = window.localStorage.getItem(PENDING_KEY);
    } catch (err) {
      return;
    }
    if (!raw) return;
    if (!window.GZAuth || !window.GZAuth.isLoggedIn()) return;

    var selection;
    try {
      selection = JSON.parse(raw);
    } catch (err) {
      window.localStorage.removeItem(PENDING_KEY);
      return;
    }

    window.localStorage.removeItem(PENDING_KEY);

    // Best effort: if the same product's modal is already open (e.g. the
    // page restored scroll position), reflect the saved picks in it.
    applySelection(selection);

    saveOrderAndOpenWhatsapp(selection);
  }

  function init() {
    var whatsappBtn = document.getElementById('modalWhatsapp');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', handleWhatsappClick);
    }
    watchModal();
    resumePendingOrder();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
