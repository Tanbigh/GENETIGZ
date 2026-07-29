/* ==============================================================
   GENETIGZ — COLLECTION DATA: ADHYATMA
   Self-registers into window.GZ_COLLECTIONS. collections.js reads
   that array (in the order set by data/collections-index.js) and
   renders a homepage section for each entry it finds.

   Product shape matches products.js exactly (code, name, fabric,
   sizes, colors, printArea, notes, images: {front, back}) so the
   existing product-card markup and #productModal work unchanged.

   NOTE: no product photos/specs were supplied for this collection
   yet, so `products` is intentionally left empty below rather than
   inventing placeholder designs. The section will still render on
   the homepage (eyebrow, title, subtitle, "View Collection" CTA) —
   it just won't show any product cards until real products are
   added here, following the exact same object shape used in
   data/animeverse.js, data/lonewolf.js, etc.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'adhyatma',
    name: 'Adhyatma',
    description: 'Inspired by the divine',
    products: [
      // TODO: add real products here, e.g.
      // {
      //   id: 'ad-001', code: 'AD-001', category: 'adhyatma',
      //   name: 'Product Name',
      //   fabric: '240GSM combed cotton, heavyweight',
      //   sizes: 'S · M · L · XL · XXL',
      //   colors: 'Off-Black',
      //   printArea: 'Full front graphic',
      //   notes: 'Oversized fit.',
      //   images: { front: 'images/collections/adhyatma/product-name.png' }
      // }
    ]
  });

})();