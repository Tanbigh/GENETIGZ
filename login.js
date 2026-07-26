/* ==============================================================
   GENETIGZ — LOGIN PAGE SCRIPT
   Handles: footer year, show/hide password, client-side form
   validation, and a "remember me" convenience (email only — never
   the password) stored in localStorage.

   FUTURE BACKEND INTEGRATION
   This is frontend-only for now. The single place to wire up a real
   Node/Express + MongoDB + JWT auth API is marked below inside
   handleSubmit(). Swap the simulated block for a fetch() call to
   your endpoint (e.g. POST /api/auth/login), store the returned
   token, and redirect on success.
============================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'gz_remember_email';

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
    // Simple, permissive pattern — good enough for client-side UX;
    // the real source of truth should still validate server-side.
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
     REMEMBER ME (email only, never the password)
  ------------------------------------------------------------------- */
  function initRememberedEmail(emailInput, rememberInput) {
    if (!emailInput || !rememberInput) return;

    try {
      var savedEmail = window.localStorage.getItem(STORAGE_KEY);
      if (savedEmail) {
        emailInput.value = savedEmail;
        rememberInput.checked = true;
      }
    } catch (err) {
      // localStorage unavailable (privacy mode, etc.) — fail silently.
    }
  }

  function persistRememberedEmail(emailInput, rememberInput) {
    try {
      if (rememberInput.checked && emailInput.value.trim()) {
        window.localStorage.setItem(STORAGE_KEY, emailInput.value.trim());
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      // Ignore storage failures — this is a convenience, not critical.
    }
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

    // Clear a field's error state as soon as the person starts fixing it.
    [emailInput, passwordInput].forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.form-field');
        if (field) field.classList.remove('has-error');
      });
      input.addEventListener('blur', validate);
    });

    function handleSubmit(e) {
      e.preventDefault();
      setStatus(statusEl, '', null);

      if (!validate()) {
        setStatus(statusEl, 'Please fix the highlighted fields.', 'error');
        return;
      }

      persistRememberedEmail(emailInput, rememberInput);

      if (submitBtn) submitBtn.classList.add('is-loading');
      if (submitLabel) submitLabel.textContent = 'Signing In…';

      // --------------------------------------------------------
      // FUTURE BACKEND INTEGRATION POINT
      // Replace this simulated timeout with a real request once the
      // Node/Express + MongoDB + JWT API is live, e.g.:
      //
      // fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: emailInput.value.trim(),
      //     password: passwordInput.value,
      //     remember: rememberInput.checked
      //   })
      // })
      //   .then(function (res) { return res.json(); })
      //   .then(function (data) {
      //     // store data.token (JWT), then redirect:
      //     // window.location.href = 'index.html';
      //   })
      //   .catch(function () {
      //     setStatus(statusEl, 'Something went wrong. Try again.', 'error');
      //   })
      //   .finally(function () {
      //     if (submitBtn) submitBtn.classList.remove('is-loading');
      //     if (submitLabel) submitLabel.textContent = 'Sign In';
      //   });
      // --------------------------------------------------------
      window.setTimeout(function () {
        if (submitBtn) submitBtn.classList.remove('is-loading');
        if (submitLabel) submitLabel.textContent = 'Sign In';
        setStatus(statusEl, 'Demo mode — connect the auth API to enable real sign-in.', 'success');
      }, 1100);
    }

    form.addEventListener('submit', handleSubmit);
  }

  function init() {
    initFooterYear();
    initPasswordToggle();
    initFormValidation();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
