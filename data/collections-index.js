/* ==============================================================
   GENETIGZ — COLLECTIONS REGISTRY
   The single list of which collections exist and in what order
   they appear on the homepage. collections.js reads this list,
   loads each collection's own data file (data/<slug>.js), and
   renders one homepage section per entry, in this order.

   TO ADD A FUTURE COLLECTION (e.g. "Lone Wolf"):
     1. Drop its images anywhere under images/collections/lonewolf/
     2. Create data/lonewolf.js (copy data/animeverse.js as a template)
     3. Add 'lonewolf' to the array below

   Nothing else needs to change — no edits to index.html, style.css,
   collections.js, modal.js, or any other core file.
============================================================== */

window.GZ_COLLECTIONS_INDEX = [
  'animeverse',
  'vagabond',
  'lonewolf',
  'bloomytales',
  'lostpalette',
  'typewriter',
  'adhyatma',
  'outliers'
];