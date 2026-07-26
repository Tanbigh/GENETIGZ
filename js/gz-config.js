/* ==============================================================
   GENETIGZ — RUNTIME CONFIG
   Single source of truth for the backend's base URL. auth.js reads
   window.GZ_CONFIG.API_BASE for every request (login, signup, order
   saving, admin dashboard).

   ROOT CAUSE OF "Failed to fetch":
   This file is loaded first on every page (login.html, signup.html,
   index.html) but did not exist anywhere in the project. Without it,
   window.GZ_CONFIG was undefined, so auth.js's apiBase() fell back
   to '' — every request then resolved as a *relative* path against
   whatever origin served the HTML (e.g. a static file server on
   :5500), not the Express API. No server was listening on that path,
   so the browser reported "Failed to fetch" before any HTTP response
   ever came back — not a CORS error, not a 404, just a dead socket.

   Update API_BASE below to match wherever your Express server
   actually runs (see backend/server.js — defaults to port 5000).
============================================================== */
window.GZ_CONFIG = {
  API_BASE: (function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'http://localhost:5000/api';
    }
    // Production: same origin, reverse-proxied /api -> the Express app.
    return '/api';
  })(),
};
