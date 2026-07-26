/* ==============================================================
   GENETIGZ — NAVBAR AUTH CONTROL
   Purely additive: injects a Sign In link (logged out) or a
   name + Logout control (logged in) into the existing
   .topbar-inner, right after .btn-customize. Nothing in
   index.html/style.css needs to change for this to work.
   Requires gz-config.js + auth.js loaded first.
============================================== */
(function () {
  'use strict';

  function render() {
    var host = document.getElementById('gzNavAuth');
    if (!host) return;

    if (!window.GZAuth || !window.GZAuth.isLoggedIn()) {
      host.innerHTML = '<a href="login.html" class="btn-customize gz-nav-auth-link">Sign In</a>';
      return;
    }

    var user = window.GZAuth.getUser();
    var firstName = (user && user.name ? user.name.split(' ')[0] : 'Account');

    host.innerHTML =
      '<span class="gz-nav-auth-name">' + escapeHtml(firstName) + '</span>' +
      '<button type="button" class="btn-customize gz-nav-auth-logout" id="gzNavLogout">Logout</button>';

    var logoutBtn = document.getElementById('gzNavLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.GZAuth.logout();
        window.location.href = 'index.html';
      });
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init() {
    var topbarInner = document.querySelector('.topbar-inner');
    if (!topbarInner) return;

    var host = document.createElement('div');
    host.id = 'gzNavAuth';
    host.className = 'gz-nav-auth';
    topbarInner.appendChild(host);

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
