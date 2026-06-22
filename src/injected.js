// Runs in the PAGE's own JavaScript context (not the content-script sandbox).
// Wraps XHR and fetch to detect the Keycloak token endpoint response, then
// signals the content script via a CustomEvent on window.
(function () {
  'use strict';

  var lastToken = null;
  function dispatch(token) {
    if (!token || token === lastToken) return;
    lastToken = token;
    window.dispatchEvent(new CustomEvent('__adtp_token__', { detail: token }));
  }
  function dispatchFinish() {
    window.dispatchEvent(new CustomEvent('__adtp_finish__'));
  }

  // Autodarts mints tokens via POST /auth/v1/refresh (not openid-connect/token).
  function isTokenResponseUrl(url) {
    return url.indexOf('openid-connect/token') !== -1 || url.indexOf('/auth/v1/refresh') !== -1;
  }
  // The page POSTs /gs/v0/matches/<id>/finish when a match ends.
  function isFinishUrl(url) {
    return /\/gs\/v0\/matches\/[^/]+\/finish(?:[/?#]|$)/.test(url);
  }

  // Pull a Keycloak access token out of an "Authorization: Bearer …" header on
  // any request the page makes to the autodarts API. This works even when the
  // user is already authenticated and the token endpoint is never re-hit (the
  // silent SSO refresh runs in a hidden iframe we don't wrap, or not at all).
  function bearerFromHeaderValue(value) {
    if (typeof value !== 'string') return null;
    var m = /^\s*Bearer\s+(.+)\s*$/i.exec(value);
    return m ? m[1].trim() : null;
  }

  function captureAuthHeader(url, headers) {
    if (typeof url !== 'string' || url.indexOf('api.autodarts.io') === -1) return;
    if (!headers) return;
    try {
      var val = null;
      if (typeof Headers !== 'undefined' && headers instanceof Headers) {
        val = headers.get('authorization');
      } else if (Array.isArray(headers)) {
        for (var i = 0; i < headers.length; i++) {
          if (headers[i] && String(headers[i][0]).toLowerCase() === 'authorization') { val = headers[i][1]; break; }
        }
      } else if (typeof headers === 'object') {
        for (var k in headers) {
          if (k.toLowerCase() === 'authorization') { val = headers[k]; break; }
        }
      }
      var tok = bearerFromHeaderValue(val);
      if (tok) dispatch(tok);
    } catch (e) {}
  }

  // ── XHR wrapper ────────────────────────────────────────────────────
  var _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === 'string') {
      if (isTokenResponseUrl(url)) this._adtpCap = true;
      if (isFinishUrl(url)) this._adtpFinish = true;
      this._adtpUrl = url;
    }
    return _xhrOpen.apply(this, arguments);
  };

  var _xhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this._adtpUrl && String(name).toLowerCase() === 'authorization') {
      captureAuthHeader(this._adtpUrl, { authorization: value });
    }
    return _xhrSetHeader.apply(this, arguments);
  };

  var _xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this._adtpCap || this._adtpFinish) {
      var xhr = this;
      xhr.addEventListener('load', function () {
        if (xhr._adtpFinish) { if (xhr.status >= 200 && xhr.status < 300) dispatchFinish(); return; }
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
      try {
        if (typeof Request !== 'undefined' && req instanceof Request) captureAuthHeader(url, req.headers);
        if (args[1] && args[1].headers) captureAuthHeader(url, args[1].headers);
      } catch (e) {}
      var p = _fetch.apply(this, args);
      if (isTokenResponseUrl(url)) {
        p.then(function (resp) {
          resp.clone().json().then(function (data) {
            if (data && data.access_token) dispatch(data.access_token);
          }).catch(function () {});
        }).catch(function () {});
      } else if (isFinishUrl(url)) {
        p.then(function (resp) { if (resp && resp.ok) dispatchFinish(); }).catch(function () {});
      }
      return p;
    };
  }
})();
