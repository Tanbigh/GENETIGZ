/* ==============================================================
   GENETIGZ — COLLECTION DATA: BLOOMY TALES
   Self-registers into window.GZ_COLLECTIONS. collections.js reads
   that array (in the order set by data/collections-index.js) and
   renders a homepage section for each entry it finds.

   Product shape matches products.js exactly (code, name, fabric,
   sizes, colors, printArea, notes, images: {front, back}) so the
   existing product-card markup and #productModal work unchanged.

   Every design supplied for this collection is a single photo (no
   separate back shot), so each product only sets `images.front` —
   same single-image pattern already used by "Goku Mode ON" in
   data/animeverse.js. The modal hides the back panel automatically
   when images.back is absent.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'bloomytales',
    name: 'Bloomy Tales',
    description: 'Cute, Cozy, and Aesthetic by heart',
    products: [
      {
        id: 'bt-001', code: 'BT-001', category: 'bloomytales',
        name: 'Butterfly Reverie',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/butterfly-reverie.png' }
      },
      {
        id: 'bt-002', code: 'BT-002', category: 'bloomytales',
        name: 'Delicate Yet Unbreakable',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/delicate-yet-unbreakable.png' }
      },
      {
        id: 'bt-003', code: 'BT-003', category: 'bloomytales',
        name: 'Glitch Within',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/glitch-within.png' }
      },
      {
        id: 'bt-004', code: 'BT-004', category: 'bloomytales',
        name: 'Mohan Pyare',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/mohan-pyare.png' }
      },
      {
        id: 'bt-005', code: 'BT-005', category: 'bloomytales',
        name: 'Mrinalini',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/mrinalini.png' }
      },
      {
        id: 'bt-006', code: 'BT-006', category: 'bloomytales',
        name: 'Nrityanjali',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/nrityanjali.png' }
      },
      {
        id: 'bt-007', code: 'BT-007', category: 'bloomytales',
        name: 'Preety Little Baby',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/preety-little-baby.png' }
      },
      {
        id: 'bt-008', code: 'BT-008', category: 'bloomytales',
        name: 'Too Glam To Give A Damn',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/bloomytales/too-glam-to-give-a-damn.png' }
      }
    ]
  });

})();