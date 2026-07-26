/* ==============================================================
   GENETIGZ — PROFILE PAGE SCRIPT
   Requires gz-config.js + auth.js loaded first.
============================================================== */

(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return iso;
    }
  }

  function statusBadge(status) {
    var label = status.charAt(0).toUpperCase() + status.slice(1);
    return '<span class="admin-badge admin-badge--' + status + '">' + label + '</span>';
  }

  function renderOrders(orders) {
    var tbody = document.getElementById('myOrdersBody');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty">You haven\'t placed any orders yet.</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(function (o) {
      return (
        '<tr>' +
        '<td>' + formatDate(o.createdAt) + '</td>' +
        '<td>' + escapeHtml(o.productName) + '<span class="admin-cell-sub">' + escapeHtml(o.productId) + '</span></td>' +
        '<td>' + escapeHtml(o.size) + '</td>' +
        '<td>' + escapeHtml(o.color) + '</td>' +
        '<td>' + escapeHtml(o.quantity) + '</td>' +
        '<td>' + statusBadge(o.whatsappStatus) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function init() {
    if (!window.GZAuth || !window.GZAuth.isLoggedIn()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    window.GZAuth.apiFetch('/auth/me')
      .then(function (data) {
        var user = data.user;
        window.GZAuth.saveSession(window.GZAuth.getToken(), user);

        document.getElementById('profileGate').hidden = true;
        document.getElementById('profileContent').hidden = false;

        document.getElementById('profileAvatar').textContent = (user.name || 'G').charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = user.name || '';
        document.getElementById('profileEmail').textContent = user.email || '';
        if (user.createdAt) {
          document.getElementById('profileJoined').textContent =
            'Member since ' + new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        }

        return window.GZAuth.apiFetch('/orders/mine');
      })
      .then(function (data) {
        renderOrders(data.orders || []);
      })
      .catch(function () {
        window.GZAuth.logout();
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      });

    document.getElementById('profileLogoutBtn').addEventListener('click', function () {
      window.GZAuth.logout();
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
