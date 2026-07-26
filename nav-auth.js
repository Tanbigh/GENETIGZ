/* ==============================================================
   GENETIGZ — NAVBAR AUTH WIDGET
   Injects a Login button (logged out) or a name + dropdown (logged
   in) into the existing .topbar-inner, on every page that includes
   this script — so the navbar doesn't need to be hand-edited per
   page. Skips itself on login.html/signup.html (body.login-page —
   those pages ARE the login flow) and admin/index.html
   (body.admin-page — already has its own logout button).

   Requires gz-config.js + auth.js loaded first.
============================================================== */

(function () {
  'use strict';

  function shouldSkip() {
    return document.body.classList.contains('login-page') ||
           document.body.classList.contains('admin-page');
  }

  function firstName(fullName) {
    return String(fullName || '').trim().split(/\s+/)[0] || 'Account';
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.gz-account-nav.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      var trigger = el.querySelector('.gz-account-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function renderLoggedOut(host) {
    host.innerHTML = '';
    var link = document.createElement('a');
    link.href = 'login.html';
    link.className = 'btn-customize gz-nav-login';
    link.textContent = 'Login';
    host.appendChild(link);
  }

  function renderLoggedIn(host, user) {
    host.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'gz-account-nav';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'gz-account-trigger';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML =
      '<span class="gz-account-name">' + escapeHtml(firstName(user.name)) + '</span>' +
      '<svg class="gz-account-chevron" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4">' +
      '<path d="M1 1l4 4 4-4"/></svg>';

    var dropdown = document.createElement('div');
    dropdown.className = 'gz-account-dropdown';
    dropdown.innerHTML =
      '<div class="gz-account-meta">' +
      '<span class="gz-account-meta-name">' + escapeHtml(user.name || '') + '</span>' +
      '<span class="gz-account-meta-email">' + escapeHtml(user.email || '') + '</span>' +
      '</div>' +
      '<a href="profile.html" class="gz-account-item">My Profile</a>' +
      (user.isAdmin ? '<a href="admin/index.html" class="gz-account-item">Admin Dashboard</a>' : '') +
      '<button type="button" class="gz-account-item is-danger" id="gzNavLogout">Logout</button>';

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = wrap.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);
    host.appendChild(wrap);

    dropdown.querySelector('#gzNavLogout').addEventListener('click', function () {
      window.GZAuth.logout();
      window.location.href = 'index.html';
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ensureHost() {
    var inner = document.querySelector('.topbar-inner');
    if (!inner) return null;
    var host = inner.querySelector('.gz-nav-auth-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'gz-nav-auth-host';
      inner.appendChild(host);
    }
    return host;
  }

  function render() {
    var host = ensureHost();
    if (!host) return;

    if (!window.GZAuth || !window.GZAuth.isLoggedIn()) {
      renderLoggedOut(host);
      return;
    }

    var cached = window.GZAuth.getUser();
    if (cached) renderLoggedIn(host, cached);

    // Confirm the session is still valid server-side; if the token
    // expired or was revoked, fall back to the Login button.
    window.GZAuth.apiFetch('/auth/me')
      .then(function (data) {
        window.GZAuth.saveSession(window.GZAuth.getToken(), data.user);
        renderLoggedIn(host, data.user);
      })
      .catch(function () {
        window.GZAuth.logout();
        renderLoggedOut(host);
      });
  }

  function init() {
    if (shouldSkip()) return;
    render();

    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
