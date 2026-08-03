/* ==============================================================
   GENETIGZ — REFERENCE MODALS
   Powers the four homepage buttons (Regular/Oversized Colour
   Palette, Regular/Oversized Size Chart) AND the product modal's
   "Size Guide" button (see modal.js) with ONE shared popup, so
   there's a single implementation instead of two.

   Deliberately reuses the exact .modal-overlay / .modal / .modal-close
   classes already defined in style.css for #productModal — that's
   where the fade/scale-in animation, backdrop blur, and close (×)
   button styling already live. This file only builds the markup
   dynamically (so nothing needs to be hand-added to every HTML page)
   and styles the two things that don't already exist anywhere:
   the colour-swatch grid and the size table (see collections.css).

   Colour values and size measurements below come directly from the
   two official reference charts supplied for the site — nothing is
   guessed. Sizes are rendered as real <table> markup, never as an
   embedded image.
============================================================== */

(function () {
  'use strict';

  var REGULAR_COLORS = [
    { name: 'Grey', hex: '#8C8C8C' },
    { name: 'Navy', hex: '#0B1F4D' },
    { name: 'Green', hex: '#3FA672' },
    { name: 'White', hex: '#F5F5F5' },
    { name: 'Bottle Green', hex: '#0E4536' },
    { name: 'Mustard', hex: '#F2A900' },
    { name: 'Black', hex: '#0A0A0A' },
    { name: 'Royal Blue', hex: '#2E3EA8' },
    { name: 'Red', hex: '#D3232A' },
    { name: 'Heather Grey', hex: '#9A9A9A' }
  ];

  var OVERSIZED_COLORS = [
    { name: 'Maroon', hex: '#7A1F2B' },
    { name: 'Teal', hex: '#1B7A94' },
    { name: 'Olive', hex: '#8FB239' },
    { name: 'Grey', hex: '#B5B5B5' },
    { name: 'Cream', hex: '#F4F1E6' },
    { name: 'Sage', hex: '#A9C48C' },
    { name: 'Navy', hex: '#242850' },
    { name: 'Lavender', hex: '#C9A8E0' },
    { name: 'Cobalt', hex: '#2A2E86' },
    { name: 'Black', hex: '#0A0A0A' }
  ];

  var REGULAR_SIZE_COLS = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  var REGULAR_SIZE_ROWS = [
    { label: 'Chest', values: { XS: 36, S: 38, M: 40, L: 42, XL: 44, '2XL': 46 } },
    { label: 'Length', values: { XS: 25, S: 26, M: 27, L: 28, XL: 29, '2XL': 30 } },
    { label: 'Sleeve Length', values: { XS: 6.5, S: 7, M: 7.5, L: 8, XL: 8.5, '2XL': 9 } },
    { label: 'Sleeve Open', values: { XS: 6, S: 6.25, M: 6.5, L: 6.75, XL: 7, '2XL': 7.25 } },
    { label: 'Shoulder', values: { XS: 15, S: 16, M: 17, L: 18, XL: 18.5, '2XL': 18.75 } }
  ];

  var OVERSIZED_SIZE_COLS = ['S', 'M', 'L', 'XL', '2XL'];
  var OVERSIZED_SIZE_ROWS = [
    { label: 'Chest', values: { S: 42, M: 44, L: 46, XL: 48, '2XL': 50 } },
    { label: 'Body Length (HPS)', values: { S: 27.5, M: 28, L: 28.5, XL: 29, '2XL': 29.5 } },
    { label: 'Shoulder', values: { S: 20, M: 21, L: 22, XL: 23, '2XL': 24 } },
    { label: 'Sleeve Length', values: { S: 8.5, M: 9, L: 9.5, XL: 10, '2XL': 10.5 } }
  ];

  var overlay, closeBtn, eyebrowEl, titleEl, contentEl;

  function ensureModal() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay reference-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var modal = document.createElement('div');
    modal.className = 'modal reference-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'referenceModalTitle');

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg>';
    closeBtn.addEventListener('click', closeReferenceModal);

    var body = document.createElement('div');
    body.className = 'reference-modal-body';

    eyebrowEl = document.createElement('p');
    eyebrowEl.className = 'eyebrow';

    titleEl = document.createElement('h3');
    titleEl.className = 'reference-modal-title';
    titleEl.id = 'referenceModalTitle';

    contentEl = document.createElement('div');
    contentEl.className = 'reference-modal-content';

    body.appendChild(eyebrowEl);
    body.appendChild(titleEl);
    body.appendChild(contentEl);
    modal.appendChild(closeBtn);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeReferenceModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeReferenceModal();
    });
  }

  function buildColorGrid(colors) {
    var grid = document.createElement('div');
    grid.className = 'color-palette-grid';

    colors.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'color-palette-item';

      var swatch = document.createElement('span');
      swatch.className = 'color-palette-swatch';
      swatch.style.background = c.hex;

      var label = document.createElement('span');
      label.className = 'color-palette-label';
      label.textContent = c.name;

      item.appendChild(swatch);
      item.appendChild(label);
      grid.appendChild(item);
    });

    return grid;
  }

  function buildSizeTable(rows, cols) {
    var wrap = document.createElement('div');
    wrap.className = 'size-table-wrap';

    var table = document.createElement('table');
    table.className = 'size-table';

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    var cornerTh = document.createElement('th');
    cornerTh.textContent = 'Measurement (in.)';
    headRow.appendChild(cornerTh);
    cols.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    var tbody = document.createElement('tbody');
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      var rowTh = document.createElement('th');
      rowTh.setAttribute('scope', 'row');
      rowTh.textContent = row.label;
      tr.appendChild(rowTh);

      cols.forEach(function (c) {
        var td = document.createElement('td');
        var v = row.values[c];
        td.textContent = (v === undefined || v === null) ? '—' : v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  var CONFIGS = {
    'regular-color': {
      eyebrow: 'COLOUR PALETTE',
      title: 'Regular Colour Palette',
      build: function () { return buildColorGrid(REGULAR_COLORS); }
    },
    'oversized-color': {
      eyebrow: 'COLOUR PALETTE',
      title: 'Oversized Colour Palette',
      build: function () { return buildColorGrid(OVERSIZED_COLORS); }
    },
    'regular-size': {
      eyebrow: 'SIZE GUIDE',
      title: 'Regular Fit Size Chart',
      build: function () { return buildSizeTable(REGULAR_SIZE_ROWS, REGULAR_SIZE_COLS); },
      note: true
    },
    'oversized-size': {
      eyebrow: 'SIZE GUIDE',
      title: 'Oversized Fit Size Chart',
      build: function () { return buildSizeTable(OVERSIZED_SIZE_ROWS, OVERSIZED_SIZE_COLS); },
      note: true
    }
  };

  // Used by the product modal (modal.js) to show BOTH fit charts inline,
  // always, for every product — reuses buildSizeTable()/the same chart
  // data as the popup version above instead of duplicating table markup.
  function renderInlineSizeCharts(container) {
    if (!container) return;
    container.innerHTML = '';

    var heading = document.createElement('p');
    heading.className = 'modal-size-chart-heading';
    heading.textContent = 'Size Chart';
    container.appendChild(heading);

    var regularBlock = document.createElement('div');
    regularBlock.className = 'modal-size-chart-block';
    var regularHeading = document.createElement('p');
    regularHeading.className = 'modal-size-chart-subheading';
    regularHeading.textContent = 'Regular Fit Size Chart';
    regularBlock.appendChild(regularHeading);
    regularBlock.appendChild(buildSizeTable(REGULAR_SIZE_ROWS, REGULAR_SIZE_COLS));
    container.appendChild(regularBlock);

    var oversizedBlock = document.createElement('div');
    oversizedBlock.className = 'modal-size-chart-block';
    var oversizedHeading = document.createElement('p');
    oversizedHeading.className = 'modal-size-chart-subheading';
    oversizedHeading.textContent = 'Oversized Fit Size Chart';
    oversizedBlock.appendChild(oversizedHeading);
    oversizedBlock.appendChild(buildSizeTable(OVERSIZED_SIZE_ROWS, OVERSIZED_SIZE_COLS));
    container.appendChild(oversizedBlock);

    var note = document.createElement('p');
    note.className = 'size-table-note';
    note.textContent = 'All measurements in inches, laid flat. A variance of up to \u00BD" may occur due to fabric and manual measuring.';
    container.appendChild(note);
  }

  function openReferenceModal(type) {
    var config = CONFIGS[type];
    if (!config) return;

    ensureModal();
    contentEl.innerHTML = '';
    eyebrowEl.textContent = config.eyebrow;
    titleEl.textContent = config.title;
    contentEl.appendChild(config.build());

    if (config.note) {
      var note = document.createElement('p');
      note.className = 'size-table-note';
      note.textContent = 'All measurements in inches, laid flat. A variance of up to \u00BD" may occur due to fabric and manual measuring.';
      contentEl.appendChild(note);
    }

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeReferenceModal() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');

    // Don't drop the scroll lock if the product modal is still open
    // underneath (e.g. this was opened via the modal's Size Guide button).
    var productModal = document.getElementById('productModal');
    var productModalOpen = productModal && productModal.classList.contains('is-open');
    if (!productModalOpen) document.body.classList.remove('no-scroll');
  }

  function initTriggers() {
    document.querySelectorAll('[data-reference-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openReferenceModal(btn.getAttribute('data-reference-modal'));
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initTriggers);

  window.GZ = window.GZ || {};
  window.GZ.openReferenceModal = openReferenceModal;
  window.GZ.closeReferenceModal = closeReferenceModal;
  window.GZ.renderInlineSizeCharts = renderInlineSizeCharts;

})();