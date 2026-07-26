/* ==============================================================
   GENETIGZ — LOGIN PAGE SCRIPT
   Handles: footer year, show/hide password, client-side form
   validation, real login against the backend API (see
   backend/README.md), and returning the person to whatever they were
   doing before they were asked to log in.

   Requires gz-config.js + auth.js loaded first (see login.html).
============================================================== */

(function () {
  'use strict';

  function initFooterYear() {
    var yearEl = document.getElementById('loginYear');
    if (!yearEl) return;
    yearEl.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------------
     SHOW / HIDE PASSWORD
  ------------------------------------------------------------------- */
  function initPasswordToggle() {
    var toggle = document.getElementById('passwordToggle');
    var input = document.getElementById('loginPassword');
    if (!toggle || !input) return;

    toggle.addEventListener('click', function () {
      var isCurrentlyHidden = input.type === 'password';
      input.type = isCurrentlyHidden ? 'text' : 'password';
      toggle.classList.toggle('is-visible', isCurrentlyHidden);
      toggle.setAttribute('aria-pressed', String(isCurrentlyHidden));
      toggle.setAttribute('aria-label', isCurrentlyHidden ? 'Hide password' : 'Show password');
    });
  }

  /* ----------------------------------------------------------------
     VALIDATION HELPERS
  ------------------------------------------------------------------- */
  function isValidEmail(value) {
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
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

  /* ----------------------------------------------------------------
     RETURN-TO-CHECKOUT
     If the person landed here because order.js redirected them mid-
     order, ?redirect=<url they came from> is present. We send them
     straight back there after login; order.js (already loaded on
     that page) takes it from there using the pending order it saved
     in localStorage before the redirect.
  ------------------------------------------------------------------- */
  function getReturnUrl() {
    var params = new URLSearchParams(window.location.search);
    var redirect = params.get('redirect');
    if (redirect) {
      try {
        return decodeURIComponent(redirect);
      } catch (err) {
        return 'index.html';
      }
    }
    return 'index.html';
  }

  /* ----------------------------------------------------------------
     REMEMBER ME (email only, never the password)
  ------------------------------------------------------------------- */
  var REMEMBER_KEY = 'gz_remember_email';

  function initRememberedEmail(emailInput, rememberInput) {
    if (!emailInput || !rememberInput) return;
    try {
      var savedEmail = window.localStorage.getItem(REMEMBER_KEY);
      if (savedEmail) {
        emailInput.value = savedEmail;
        rememberInput.checked = true;
      }
    } catch (err) {}
  }

  function persistRememberedEmail(emailInput, rememberInput) {
    try {
      if (rememberInput.checked && emailInput.value.trim()) {
        window.localStorage.setItem(REMEMBER_KEY, emailInput.value.trim());
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (err) {}
  }

  /* ----------------------------------------------------------------
     FORM VALIDATION + SUBMIT
  ------------------------------------------------------------------- */
  function initFormValidation() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');
    var rememberInput = document.getElementById('rememberMe');
    var submitBtn = document.getElementById('loginSubmit');
    var submitLabel = submitBtn ? submitBtn.querySelector('.btn-login-text') : null;
    var statusEl = document.getElementById('formStatus');

    var emailField = emailInput.closest('.form-field');
    var passwordField = passwordInput.closest('.form-field');
    var emailError = document.getElementById('emailError');
    var passwordError = document.getElementById('passwordError');

    initRememberedEmail(emailInput, rememberInput);

    // If a redirect target exists, let the person know why they're here.
    var params = new URLSearchParams(window.location.search);
    if (params.get('redirect') && statusEl) {
      setStatus(statusEl, 'Sign in to continue your order.', null);
    }

    function validate() {
      var isValid = true;

      if (!emailInput.value.trim()) {
        setFieldError(emailField, emailError, 'Email is required.');
        isValid = false;
      } else if (!isValidEmail(emailInput.value)) {
        setFieldError(emailField, emailError, 'Enter a valid email address.');
        isValid = false;
      } else {
        setFieldError(emailField, emailError, '');
      }

      if (!passwordInput.value) {
        setFieldError(passwordField, passwordError, 'Password is required.');
        isValid = false;
      } else if (passwordInput.value.length < 6) {
        setFieldError(passwordField, passwordError, 'Must be at least 6 characters.');
        isValid = false;
      } else {
        setFieldError(passwordField, passwordError, '');
      }

      return isValid;
    }

    [emailInput, passwordInput].forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.form-field');
        if (field) field.classList.remove('has-error');
      });
      input.addEventListener('blur', validate);
    });

    function handleSubmit(e) {
      e.preventDefault();

      if (!validate()) {
        setStatus(statusEl, 'Please fix the highlighted fields.', 'error');
        return;
      }

      if (!window.GZAuth) {
        setStatus(statusEl, 'Auth helper not loaded — check gz-config.js/auth.js are included.', 'error');
        return;
      }

      persistRememberedEmail(emailInput, rememberInput);

      if (submitBtn) submitBtn.classList.add('is-loading');
      if (submitLabel) submitLabel.textContent = 'Signing In…';
      setStatus(statusEl, '', null);

      window.GZAuth.apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      })
        .then(function (data) {
          window.GZAuth.saveSession(data.token, data.user);
          setStatus(statusEl, 'Signed in — redirecting…', 'success');
          window.setTimeout(function () {
            window.location.href = getReturnUrl();
          }, 400);
        })
        .catch(function (err) {
          setStatus(statusEl, err.message || 'Login failed. Please try again.', 'error');
        })
        .finally(function () {
          if (submitBtn) submitBtn.classList.remove('is-loading');
          if (submitLabel) submitLabel.textContent = 'Sign In';
        });
    }

    form.addEventListener('submit', handleSubmit);
  }

  function init() {
    // Already logged in and just browsing to login.html directly?
    // Send them straight through instead of showing the form again.
    if (window.GZAuth && window.GZAuth.isLoggedIn()) {
      var params = new URLSearchParams(window.location.search);
      if (params.get('redirect')) {
        window.location.href = getReturnUrl();
        return;
      }
    }
    initFooterYear();
    initPasswordToggle();
    initFormValidation();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
