/* ==============================================================
   GENETIGZ — COLLECTION DATA: TYPE WRITER
   Self-registers into window.GZ_COLLECTIONS. collections.js reads
   that array (in the order set by data/collections-index.js) and
   renders a homepage section for each entry it finds.

   Product shape matches products.js exactly (code, name, fabric,
   sizes, colors, printArea, notes, images: {front, back}) so the
   existing product-card markup and #productModal work unchanged.

   Every design supplied for this collection is a single photo (no
   separate back shot), so the product only sets `images.front` —
   same single-image pattern already used elsewhere in the site.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'typewriter',
    name: 'Type Writer',
    description: 'Typography-led statements, straight off the page and onto the fabric.',
    products: [
      {
        id: 'tw-001', code: 'TW-001', category: 'typewriter',
        name: 'Need Cash. Not Chaos.',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/typewriter/need-cash-not-chaos.png' }
      }
    ]
  });

})();
