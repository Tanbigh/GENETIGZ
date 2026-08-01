/* ==============================================================
   GENETIGZ — COLLECTION DATA: LONE WOLF
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

   NEW FIELDS (additive, required for the category/color/size
   filtering + Size Guide feature — see product-filters.js):

   - productType: human-readable garment category shown directly
     in the sidebar's "Product Categories" list. This is the ONLY
     place a category label is ever written — product-filters.js
     never hardcodes a category list, it just reads this field off
     every product across every collection and de-duplicates. Add
     a new productType string here (or in a future collection file)
     and it appears in the sidebar automatically, no code changes.

   - fit: 'regular' | 'oversized'. Decides which of the two Size
     Guide charts opens from the product modal, and which official
     color chart a product's swatches are resolved against.

   `category` (below) is left exactly as it was — it's the
   collection/drop slug ('lonewolf'), unrelated to productType, and
   nothing else in the codebase reads it, so leaving it in place is
   harmless and avoids touching unrelated behavior.
============================================================== */

(function () {
  'use strict';

  window.GZ_COLLECTIONS = window.GZ_COLLECTIONS || [];

  window.GZ_COLLECTIONS.push({
    slug: 'lonewolf',
    name: 'Lone Wolf',
    description: 'Power. Pace. Passion',
    products: [
      {
        id: 'lw-001', code: 'LW-001', category: 'lonewolf',
        productType: 'Oversized T-Shirts', fit: 'oversized',
        name: 'Vintage',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/lonewolf/vintage-front.png',
          back: 'images/collections/lonewolf/vintage-back.png'
        }
      },
      {
        id: 'lw-002', code: 'LW-002', category: 'lonewolf',
        productType: 'Oversized T-Shirts', fit: 'oversized',
        name: 'Vintage Soul',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/lonewolf/vintage-soul-front.png',
          back: 'images/collections/lonewolf/vintage-soul-back.png'
        }
      },
      {
        id: 'lw-003', code: 'LW-003', category: 'lonewolf',
        productType: 'Oversized T-Shirts', fit: 'oversized',
        name: 'DND',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/lonewolf/dnd.png' }
      },
      {
        id: 'lw-004', code: 'LW-004', category: 'lonewolf',
        productType: 'Oversized T-Shirts', fit: 'oversized',
        name: 'Velocity 911',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Front chest + full back',
        notes: 'Oversized fit.',
        images: {
          front: 'images/collections/lonewolf/velocity-911-front.png',
          back: 'images/collections/lonewolf/velocity-911-back.png'
        }
      },
      {
        id: 'lw-005', code: 'LW-005', category: 'lonewolf',
        productType: 'Oversized T-Shirts', fit: 'oversized',
        name: 'Man With A Plan',
        fabric: '240GSM combed cotton, heavyweight',
        sizes: 'S · M · L · XL · XXL',
        colors: 'Off-Black',
        printArea: 'Full front graphic',
        notes: 'Oversized fit.',
        images: { front: 'images/collections/lonewolf/man-with-a-plan.png' }
      }
    ]
  });

})();