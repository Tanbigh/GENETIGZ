/* ==============================================================
   GENETIGZ — ADMIN DASHBOARD SCRIPT
   Requires gz-config.js + auth.js loaded first. Gates access on
   GZAuth.isAdmin(); every API call also re-checks server-side via the
   requireAdmin middleware, so this client-side gate is a UX
   convenience only, not the real security boundary.
============================================================== */

(function () {
  'use strict';

  var state = {
    orders: { page: 1, limit: 25, total: 0 },
  };

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      window.clearTimeout(t);
      t = window.setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

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

  /* ----------------------------------------------------------------
     ACCESS GATE
  ------------------------------------------------------------------- */
  function checkAccess() {
    var gate = document.getElementById('adminGate');
    var gateText = document.getElementById('adminGateText');
    var loginBtn = document.getElementById('adminGateLoginBtn');
    var dashboard = document.getElementById('adminDashboard');

    if (!window.GZAuth || !window.GZAuth.isLoggedIn()) {
      gateText.textContent = 'Please sign in with an admin account to view this dashboard.';
      loginBtn.hidden = false;
      return;
    }

    if (!window.GZAuth.isAdmin()) {
      gateText.textContent = 'This account doesn\'t have admin access.';
      loginBtn.hidden = false;
      loginBtn.textContent = 'Switch Account';
      return;
    }

    // Confirm the token is still valid server-side before showing data.
    window.GZAuth.apiFetch('/auth/me')
      .then(function () {
        gate.hidden = true;
        dashboard.hidden = false;
        initDashboard();
      })
      .catch(function () {
        window.GZAuth.logout();
        gateText.textContent = 'Your session expired. Please sign in again.';
        loginBtn.hidden = false;
      });
  }

  /* ----------------------------------------------------------------
     STATS
  ------------------------------------------------------------------- */
  function loadStats() {
    window.GZAuth.apiFetch('/admin/stats')
      .then(function (data) {
        document.getElementById('statTotalUsers').textContent = data.totalUsers;
        document.getElementById('statTotalOrders').textContent = data.totalOrders;
        document.getElementById('statOrdersToday').textContent = data.ordersToday;
      })
      .catch(function () {});
  }

  /* ----------------------------------------------------------------
     ORDERS TABLE
  ------------------------------------------------------------------- */
  function statusBadge(status) {
    var label = status.charAt(0).toUpperCase() + status.slice(1);
    return '<span class="admin-badge admin-badge--' + status + '">' + label + '</span>';
  }

  function renderOrders(data) {
    var tbody = document.getElementById('ordersTableBody');
    var orders = data.orders || [];

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">No orders match your filters.</td></tr>';
    } else {
      tbody.innerHTML = orders.map(function (o) {
        return (
          '<tr>' +
          '<td>' + formatDate(o.createdAt) + '</td>' +
          '<td>' + escapeHtml(o.userName) + '<span class="admin-cell-sub">' + escapeHtml(o.userEmail) + '</span></td>' +
          '<td>' + escapeHtml(o.productName) + '<span class="admin-cell-sub">' + escapeHtml(o.productId) + '</span></td>' +
          '<td>' + escapeHtml(o.size) + '</td>' +
          '<td>' + escapeHtml(o.color) + '</td>' +
          '<td>' + escapeHtml(o.quantity) + '</td>' +
          '<td>' + statusBadge(o.whatsappStatus) + '</td>' +
          '</tr>'
        );
      }).join('');
    }

    renderOrdersPagination(data);
  }

  function renderOrdersPagination(data) {
    state.orders.total = data.total || 0;
    var totalPages = Math.max(Math.ceil(state.orders.total / state.orders.limit), 1);
    var pagination = document.getElementById('ordersPagination');

    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    var prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = state.orders.page <= 1;
    prevBtn.addEventListener('click', function () {
      state.orders.page -= 1;
      loadOrders();
    });

    var label = document.createElement('span');
    label.textContent = 'Page ' + state.orders.page + ' of ' + totalPages;

    var nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = state.orders.page >= totalPages;
    nextBtn.addEventListener('click', function () {
      state.orders.page += 1;
      loadOrders();
    });

    pagination.appendChild(prevBtn);
    pagination.appendChild(label);
    pagination.appendChild(nextBtn);
  }

  function loadOrders() {
    var search = document.getElementById('orderSearch').value.trim();
    var status = document.getElementById('orderStatusFilter').value;
    var from = document.getElementById('orderFrom').value;
    var to = document.getElementById('orderTo').value;

    var params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', state.orders.page);
    params.set('limit', state.orders.limit);

    var tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">Loading orders…</td></tr>';

    window.GZAuth.apiFetch('/admin/orders?' + params.toString())
      .then(renderOrders)
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">' + escapeHtml(err.message || 'Could not load orders.') + '</td></tr>';
      });
  }

  /* ----------------------------------------------------------------
     USERS TABLE
  ------------------------------------------------------------------- */
  var allUsers = [];

  function renderUsers(users) {
    var tbody = document.getElementById('usersTableBody');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-table-empty">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(function (u) {
      return (
        '<tr>' +
        '<td>' + escapeHtml(u.name) + '</td>' +
        '<td>' + escapeHtml(u.email) + '</td>' +
        '<td>' + (u.isAdmin
          ? '<span class="admin-badge admin-badge--admin">Admin</span>'
          : '<span class="admin-badge admin-badge--member">Member</span>') + '</td>' +
        '<td>' + formatDate(u.createdAt) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function loadUsers() {
    var tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="admin-table-empty">Loading users…</td></tr>';

    window.GZAuth.apiFetch('/admin/users')
      .then(function (data) {
        allUsers = data.users || [];
        renderUsers(allUsers);
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-table-empty">' + escapeHtml(err.message || 'Could not load users.') + '</td></tr>';
      });
  }

  function filterUsers() {
    var query = document.getElementById('userSearch').value.trim().toLowerCase();
    if (!query) return renderUsers(allUsers);
    renderUsers(allUsers.filter(function (u) {
      return u.name.toLowerCase().indexOf(query) !== -1 || u.email.toLowerCase().indexOf(query) !== -1;
    }));
  }

  /* ----------------------------------------------------------------
     TABS
  ------------------------------------------------------------------- */
  function initTabs() {
    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('is-active');
      });
    });
  }

  /* ----------------------------------------------------------------
     INIT
  ------------------------------------------------------------------- */
  function initDashboard() {
    loadStats();
    loadOrders();
    loadUsers();
    initTabs();

    document.getElementById('orderSearch').addEventListener('input', debounce(function () {
      state.orders.page = 1;
      loadOrders();
    }, 350));
    document.getElementById('orderStatusFilter').addEventListener('change', function () {
      state.orders.page = 1;
      loadOrders();
    });
    document.getElementById('orderFrom').addEventListener('change', function () {
      state.orders.page = 1;
      loadOrders();
    });
    document.getElementById('orderTo').addEventListener('change', function () {
      state.orders.page = 1;
      loadOrders();
    });

    document.getElementById('userSearch').addEventListener('input', debounce(filterUsers, 250));

    document.getElementById('adminLogoutBtn').addEventListener('click', function () {
      window.GZAuth.logout();
      window.location.href = '../login.html';
    });
  }

  document.addEventListener('DOMContentLoaded', checkAccess);
})();
