/* ==============================================================
   GENETIGZ — COLLECTION DATA: ANIMEVERSE
   Self-registers into window.GZ_COLLECTIONS. collections.js reads
   that array (in the order set by data/collections-index.js) and
   renders a homepage section for each entry it finds.

   Product shape matches products.js exactly (code, name, fabric,
   sizes, colors, printArea, notes, images: {front, back}) so the
   existing product-card markup and #productModal work unchanged.

   Front/back pairing rule: files named "<name> (front)" and
   "<name> (back)" are the SAME product — one card, two gallery
   images. A product with only one photo (no front/back suffix,
   e.g. "Goku Mode ON") is still one card; just omit `images.back`
   and the modal will show only the single image.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'animeverse',
    name: 'Animeverse',
    description: 'For every Otaku',
    products: [
      {
        id: 'av-001', code: 'AV-001', category: 'animeverse',
        name: 'Goku Mode ON',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/animeverse/goku-mode-on.png' }
      },
      {
        id: 'av-002', code: 'AV-002', category: 'animeverse',
        name: 'Nothing Happened',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/animeverse/nothing-happened-front.png',
          back: 'images/collections/animeverse/nothing-happened-back.png'
        }
      },
      {
        id: 'av-003', code: 'AV-003', category: 'animeverse',
        name: 'Spidy Peeks',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/animeverse/spidy-peeks-front.png',
          back: 'images/collections/animeverse/spidy-peeks-back.png'
        }
      }
    ]
  });

})();