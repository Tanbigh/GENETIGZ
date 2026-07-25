/* ==============================================================
   GENETIGZ — COLLECTION DATA: VAGABOND
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
    slug: 'vagabond',
    name: 'Vagabond',
    description: 'Wanderer graphics for the ones always chasing the next stamp in the passport.',
    products: [
      {
        id: 'vg-001', code: 'VG-001', category: 'vagabond',
        name: 'Nepal Chronicles',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/vagabond/nepal-chronicles.png' }
      }
    ]
  });

})();
