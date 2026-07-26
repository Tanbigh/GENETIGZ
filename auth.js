/* ==============================================================
   GENETIGZ — SHARED AUTH / SESSION HELPER
   Wraps the JWT stored in localStorage so every page (login, signup,
   product pages via order.js, admin dashboard) reads/writes the
   session the same way. Load after gz-config.js, before any script
   that uses window.GZAuth.
============================================================== */
(function () {
  'use strict';

  var TOKEN_KEY = 'gz_auth_token';
  var USER_KEY = 'gz_auth_user';

  function apiBase() {
    return (window.GZ_CONFIG && window.GZ_CONFIG.API_BASE) || '';
  }

  function getToken() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (err) {
      return null;
    }
  }

  function getUser() {
    try {
      var raw = window.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function isLoggedIn() {
    // Presence check only (not signature/expiry — that's verified
    // server-side on every protected request). Good enough to decide
    // whether to show a login redirect on the client.
    return !!getToken();
  }

  function isAdmin() {
    var user = getUser();
    return !!(user && user.isAdmin);
  }

  function saveSession(token, user) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      // Storage unavailable (private browsing, quota, etc.) — the
      // session just won't persist across reloads.
    }
  }

  function logout() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch (err) {}
  }

  function authHeaders() {
    var token = getToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  // Thin fetch wrapper: prefixes API_BASE, attaches the bearer token,
  // and always sends/expects JSON. Throws on non-2xx so callers can
  // just .catch().
  function apiFetch(path, options) {
    options = options || {};
    var headers = Object.assign(
      { 'Content-Type': 'application/json' },
      authHeaders(),
      options.headers || {}
    );

    return fetch(apiBase() + path, Object.assign({}, options, { headers: headers }))
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var err = new Error(data.message || 'Request failed (' + res.status + ')');
            err.status = res.status;
            err.data = data;
            throw err;
          }
          return data;
        });
      });
  }

  window.GZAuth = {
    getToken: getToken,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    isAdmin: isAdmin,
    saveSession: saveSession,
    logout: logout,
    authHeaders: authHeaders,
    apiFetch: apiFetch,
  };
})();
