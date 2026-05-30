// Client-side enhancement only. Static HTML works without this file.
// Adds: US/metric unit toggle, persisted in localStorage.
//
// The static HTML includes both measurements as separate <span>s. CSS hides
// the inactive one based on `<body data-units="metric|us">`. We flip the
// attribute; CSS does the rest.

(function () {
  'use strict';

  var STORAGE_KEY = 'mi.units';

  function getStoredUnits() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredUnits(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) { /* ignore */ }
  }

  function localeDefault() {
    // Default North America locales to US measurements; everyone else metric.
    var loc = (navigator.language || '').toLowerCase();
    if (loc.startsWith('en-us') || loc.startsWith('en-ca')) return 'us';
    return 'metric';
  }

  function applyUnits(units) {
    document.body.setAttribute('data-units', units);
    var buttons = document.querySelectorAll('.unit-toggle__btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var isActive = btn.getAttribute('data-units') === units;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  function init() {
    var initial = getStoredUnits() || localeDefault();
    applyUnits(initial);

    var toggles = document.querySelectorAll('.unit-toggle__btn');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', function (e) {
        var u = e.currentTarget.getAttribute('data-units');
        if (!u) return;
        applyUnits(u);
        setStoredUnits(u);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
