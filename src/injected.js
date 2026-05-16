// Runs in the PAGE's own JavaScript context (not the content-script sandbox).
// Wraps XHR and fetch to detect the Keycloak token endpoint response, then
// signals the content script via a CustomEvent on window.
(function () {
  'use strict';

  function dispatch(token) {
    window.dispatchEvent(new CustomEvent('__adtp_token__', { detail: token }));
  }

  // ── XHR wrapper ────────────────────────────────────────────────────
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === 'string' && url.indexOf('openid-connect/token') !== -1) {
      this._adtpCap = true;
    }
    return _xhrOpen.apply(this, arguments);
  };

  var _xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this._adtpCap) {
      var xhr = this;
      xhr.addEventListener('load', function () {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.access_token) dispatch(data.access_token);
        } catch (e) {}
      });
    }
    return _xhrSend.apply(this, arguments);
  };

  // ── fetch wrapper ──────────────────────────────────────────────────
  var _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function () {
      var args = Array.prototype.slice.call(arguments);
      var req  = args[0];
      var url  = typeof req === 'string' ? req
               : req instanceof URL      ? req.href
               : (req && req.url)        ? req.url : '';
      var p = _fetch.apply(this, args);
      if (url.indexOf('openid-connect/token') !== -1) {
        p.then(function (resp) {
          resp.clone().json().then(function (data) {
            if (data && data.access_token) dispatch(data.access_token);
          }).catch(function () {});
        }).catch(function () {});
      }
      return p;
    };
  }
})();
