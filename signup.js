/* ==============================================================
   GENETIGZ — SIGNUP PAGE SCRIPT
   Mirrors login.js: validation, show/hide password, then a real
   POST /api/auth/register call. On success behaves exactly like a
   login (session saved, returned to wherever they came from).
============================================================== */

(function () {
  'use strict';

  function initFooterYear() {
    var yearEl = document.getElementById('signupYear');
    if (!yearEl) return;
    yearEl.textContent = new Date().getFullYear();
  }

  function initPasswordToggle() {
    var toggle = document.getElementById('signupPasswordToggle');
    var input = document.getElementById('signupPassword');
    if (!toggle || !input) return;

    toggle.addEventListener('click', function () {
      var isCurrentlyHidden = input.type === 'password';
      input.type = isCurrentlyHidden ? 'text' : 'password';
      toggle.classList.toggle('is-visible', isCurrentlyHidden);
      toggle.setAttribute('aria-pressed', String(isCurrentlyHidden));
      toggle.setAttribute('aria-label', isCurrentlyHidden ? 'Hide password' : 'Show password');
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function setFieldError(fieldEl, errorEl, message) {
    if (!fieldEl) return;
    fieldEl.classList.toggle('has-error', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  function setStatus(statusEl, message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function getReturnUrl() {
    var params = new URLSearchParams(window.location.search);
    var redirect = params.get('redirect');
    if (redirect) {
      try { return decodeURIComponent(redirect); } catch (err) { return 'index.html'; }
    }
    return 'index.html';
  }

  function initForm() {
    var form = document.getElementById('signupForm');
    if (!form) return;

    var nameInput = document.getElementById('signupName');
    var emailInput = document.getElementById('signupEmail');
    var passwordInput = document.getElementById('signupPassword');
    var confirmInput = document.getElementById('signupConfirm');
    var submitBtn = document.getElementById('signupSubmit');
    var submitLabel = submitBtn ? submitBtn.querySelector('.btn-login-text') : null;
    var statusEl = document.getElementById('signupStatus');

    var fields = {
      name: { input: nameInput, field: nameInput.closest('.form-field'), error: document.getElementById('nameError') },
      email: { input: emailInput, field: emailInput.closest('.form-field'), error: document.getElementById('signupEmailError') },
      password: { input: passwordInput, field: passwordInput.closest('.form-field'), error: document.getElementById('signupPasswordError') },
      confirm: { input: confirmInput, field: confirmInput.closest('.form-field'), error: document.getElementById('confirmError') },
    };

    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener('input', function () {
        fields[key].field.classList.remove('has-error');
      });
    });

    function validate() {
      var isValid = true;

      if (!nameInput.value.trim()) {
        setFieldError(fields.name.field, fields.name.error, 'Name is required.');
        isValid = false;
      } else {
        setFieldError(fields.name.field, fields.name.error, '');
      }

      if (!emailInput.value.trim()) {
        setFieldError(fields.email.field, fields.email.error, 'Email is required.');
        isValid = false;
      } else if (!isValidEmail(emailInput.value)) {
        setFieldError(fields.email.field, fields.email.error, 'Enter a valid email address.');
        isValid = false;
      } else {
        setFieldError(fields.email.field, fields.email.error, '');
      }

      if (!passwordInput.value || passwordInput.value.length < 6) {
        setFieldError(fields.password.field, fields.password.error, 'Must be at least 6 characters.');
        isValid = false;
      } else {
        setFieldError(fields.password.field, fields.password.error, '');
      }

      if (confirmInput.value !== passwordInput.value || !confirmInput.value) {
        setFieldError(fields.confirm.field, fields.confirm.error, 'Passwords do not match.');
        isValid = false;
      } else {
        setFieldError(fields.confirm.field, fields.confirm.error, '');
      }

      return isValid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validate()) {
        setStatus(statusEl, 'Please fix the highlighted fields.', 'error');
        return;
      }
      if (!window.GZAuth) {
        setStatus(statusEl, 'Auth helper not loaded — check gz-config.js/auth.js are included.', 'error');
        return;
      }

      if (submitBtn) submitBtn.classList.add('is-loading');
      if (submitLabel) submitLabel.textContent = 'Creating…';
      setStatus(statusEl, '', null);

      window.GZAuth.apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      })
        .then(function (data) {
          window.GZAuth.saveSession(data.token, data.user);
          setStatus(statusEl, 'Account created — redirecting…', 'success');
          window.setTimeout(function () {
            window.location.href = getReturnUrl();
          }, 400);
        })
        .catch(function (err) {
          setStatus(statusEl, err.message || 'Could not create account.', 'error');
        })
        .finally(function () {
          if (submitBtn) submitBtn.classList.remove('is-loading');
          if (submitLabel) submitLabel.textContent = 'Create Account';
        });
    });
  }

  function init() {
    initFooterYear();
    initPasswordToggle();
    initForm();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
