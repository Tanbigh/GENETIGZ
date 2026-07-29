/* ==============================================================
   GENETIGZ — COLLECTION DATA: OUTLIERS
   Self-registers into window.GZ_COLLECTIONS. collections.js reads
   that array (in the order set by data/collections-index.js) and
   renders a homepage section for each entry it finds.

   Product shape matches products.js exactly (code, name, fabric,
   sizes, colors, printArea, notes, images: {front, back}) so the
   existing product-card markup and #productModal work unchanged.

   Front/back pairing rule: files named "<name> (front)" and
   "<name> (back)" are the SAME product — one card, two gallery
   images. A product with only one photo (no front/back suffix)
   is still one card; just omit `images.back`.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'outliers',
    name: 'Outliers',
    description: 'Stories beyond categories',
    products: [
      {
        id: 'ol-001', code: 'OL-001', category: 'outliers',
        name: 'Sacred Stillness',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/outliers/sacred-stillness-front.png',
          back: 'images/collections/outliers/sacred-stillness-back.png'
        }
      },
      {
        id: 'ol-002', code: 'OL-002', category: 'outliers',
        name: 'Floral Optimist',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/outliers/floral-optimist.png' }
      },
      {
        id: 'ol-003', code: 'OL-003', category: 'outliers',
        name: 'Breathe Easy',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/outliers/breathe-easy.png' }
      },
      {
        id: 'ol-004', code: 'OL-004', category: 'outliers',
        name: 'Har Har Legacy',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/outliers/har-har-legacy-front.png',
          back: 'images/collections/outliers/har-har-legacy-back.png'
        }
      }
    ]
  });

})();