(function () {
  'use strict';

  /* ── Variant config ──────────────────────────────────────────────── */

  const VARIANTS = [
    'X01', 'Cricket', 'ATC', 'Segment Training', "Bob's 27",
    'Bermuda', 'Gotcha', 'Shanghai', 'RTW', 'Random Checkout', 'CountUp',
  ];

  const VARIANT_LABELS = {
    'X01': 'X01',
    'Cricket': 'Cricket / Tactics',
    'ATC': 'Around the Clock',
    'Segment Training': 'Segment Training',
    "Bob's 27": "Bob's 27",
    'Bermuda': 'Bermuda',
    'Gotcha': 'Gotcha',
    'Shanghai': 'Shanghai',
    'RTW': 'Round the World',
    'Random Checkout': 'Random Checkout',
    'CountUp': 'Count Up',
  };

  const VARIANT_DEFAULTS = {
    'X01': { baseScore: 501, inMode: 'Straight', outMode: 'Double', bullMode: '25/50', maxRounds: 50 },
    'Cricket': { gameMode: 'Cricket', scoringMode: 'Standard', maxRounds: 50 },
    'ATC': { mode: 'Full', order: '1-20-Bull', hits: 1 },
    'Segment Training': { mode: 'Double', segment: '20', hits: 5 },
    "Bob's 27": { mode: 'Normal', order: '1-20-Bull' },
    'Bermuda': {},
    'Gotcha': { targetScore: 301, outMode: 'Straight', maxRounds: 50 },
    'Shanghai': { mode: '1-20' },
    'RTW': { order: '1-20-Bull' },
    'Random Checkout': { low: 61, high: 180, outMode: 'Double', maxRounds: 9 },
    'CountUp': { maxRounds: 8 },
  };

  /* ── Biceps icon (inline SVG, fill=currentColor to follow nav button colour) ── */

  var BICEPS_SVG = '<svg width="1em" height="1em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path fill="currentColor" d="M61.88 45.061c-.073-.799-.143-1.552-.092-2.121c.451-5.027-1.014-9.559-4.236-13.103c-3.655-4.021-9.417-6.422-15.412-6.422c-8.348 0-15.345 4.374-18.718 11.701c-.008.019-.018.038-.025.057c-.775-2.853-1.557-4.833-2.183-6.42c-1.058-2.684-1.626-4.123-1.171-7.279a3.841 3.841 0 0 0 2.207-1.012c.105.007.214.012.324.012c1.135 0 2.119-.43 2.83-1.196l.088.001c1.413 0 2.616-.611 3.417-1.689c1.954-.164 3.304-1.342 3.571-3.157c.36-2.436-.492-9.254-2.333-11.4C29.417 2.18 28.611 2 28.065 2c-3.115 0-7.987.719-12.123 1.788C8.404 5.736 7.226 7.703 7.039 9.2c-.765 6.177-1.899 11.687-2.901 16.549c-1.42 6.888-2.541 12.329-1.999 16.607c.211 1.669.632 3.101 1.038 4.484c.508 1.726 1.031 3.511 1.208 5.952c.243 3.393 3.907 5.339 10.053 5.339c2.409 0 4.866-.314 6.882-.873C23.792 58.442 31.949 62 40.661 62c2.996 0 5.787-.428 8.299-1.272c12.853-4.326 13.43-10.112 12.92-15.667M4.124 42.103C3.258 35.27 7.191 24.255 9.025 9.449c.311-2.505 11.713-5.127 17.985-5.41c-.255.205-.438.474-.462.76c.752-.341 1.875-.451 2.426.673c.029-.188.041-.355.041-.511c.288.564.551 1.333.773 2.209c.279 1.26.435 2.552.438 3.849c.002.901.198 4.113-1.285 3.695c-.914-.258-.937-1.101-1.198-1.969c-.402-1.357-1.11-2.921-1.024-4.363c-.349 1.415.066 3.113.22 4.544c.088.833.664 3.084-.356 3.391c-.564.173-1.218-.224-1.685-.515c-.178-.112-.311-.931-.376-1.161c-.402-1.406-1.122-3.023-1.03-4.5c-.352 1.332-.009 2.937.103 4.302c.069.846.496 2.68-.458 3.106c-1.08.565-1.246-.805-1.446-1.523c-.371-1.333-.974-2.791-.958-4.189c-.377 1.703.066 3.697.139 5.441c.039.866-1.776 1.648-2.453 1.104c-1.061-.853-1.24-2.85-1.36-4.141c.318.434.774.995 1.353.938c-.492-.561-.701-1.523-1.03-2.205c-.302-.56-.915-1.893-1.636-1.915c.111.239.719 1.886.625 2.06c-.293.545-.578 1.099-.904 1.621c-.277.439-1.081 1.838-1.73 1.415c-.701-.454-1.141-2.487-1.141-2.487s.026 2.535.932 3.122c.858.558 1.836-.322 2.404-.95c.113 1.205.439 2.618 1.168 3.55c-2.142 9.499 1.801 9.404 4.459 22.102c0 0 1.752-2.583 3.284-5.91c3.343-7.262 10.316-10.498 17.038-10.498c6.666 0 13.804 3.408 16.398 9.3c.857 1.946 1.07 4.272.838 6.834c-.379 4.173 3.739 10.962-11.622 16.063c-12.189 4.047-27.181-3.713-27.181-3.713c-4.112 1.344-13.728 1.931-13.931-.917c-.335-4.665-1.816-7.04-2.259-10.548"></path>'
    + '<path fill="currentColor" d="M34.245 53.57c2.677.982 5.586 1.249 8.392.915c2.808-.34 5.556-1.257 7.95-2.803c1.188-.778 2.293-1.714 3.182-2.837c.869-1.127 1.573-2.429 1.736-3.81c-1.728 2.114-3.926 3.278-6.191 4.203c-2.277.9-4.672 1.461-7.086 1.75c-2.416.279-4.855.282-7.271-.093a21.33 21.33 0 0 1-7.174-2.484c1.364 2.402 3.804 4.179 6.462 5.159"></path>'
    + '<path fill="currentColor" d="M25.566 6.85c.424-2.749-2.332-1.844-2.428-.672c.752-.342 1.877-.451 2.428.672"></path>'
    + '<path fill="currentColor" d="M22.841 8.37c.425-2.75-2.33-1.847-2.426-.671c.752-.345 1.876-.453 2.426.671"></path>'
    + '<path fill="currentColor" d="M19.694 9.957c.425-2.749-2.33-1.845-2.426-.671c.753-.345 1.875-.452 2.426.671"></path>'
    + '</svg>';

  /* ── State ───────────────────────────────────────────────────────── */

  let accessToken = null;
  let userId = null;
  let userName = null;

  /* ── Token capture ───────────────────────────────────────────────── */

  // In Chrome the content script's window object is the real page window, so
  // window.fetch is writable and can be overridden directly.
  //
  // In Firefox content scripts run in an isolated sandbox where window.fetch
  // is read-only. However Firefox exposes window.wrappedJSObject (the real
  // page window) and exportFunction(), which lets us safely install a wrapper
  // from the sandbox without injecting any <script> tag and without
  // broadcasting the token over a page-visible CustomEvent.
  //
  // exportFunction / wrappedJSObject are Firefox-only APIs; in Chrome we fall
  // back to the direct assignment that has always worked there.
  // Apply a captured Keycloak access token and refresh any open overlay.
  function applyToken(tokenStr) {
    accessToken = tokenStr;
    var payload = decodeJwt(tokenStr);
    if (payload) {
      userId = payload.sub;
      userName = payload.preferred_username;
      // Migrate plans stored under the anonymous key (used before auth resolves)
      // to the user-specific key if the user doesn't already have saved plans.
      var userKey = 'adtp-plans-' + userId;
      if (!localStorage.getItem(userKey)) {
        var anon = localStorage.getItem('adtp-plans');
        if (anon) {
          localStorage.setItem(userKey, anon);
          localStorage.removeItem('adtp-plans');
        }
      }
    }
    renderSidebarSection();
  }

  (function installFetchInterceptor() {
    function onToken(tokenStr) { applyToken(tokenStr); }

    // Firefox path: inject a web_accessible_resource script that runs in the
    // PAGE's own JS world (no sandbox, no cross-compartment issues) and wraps
    // both XHR and fetch directly.  It signals us via a CustomEvent on window,
    // which content scripts can receive via plain window.addEventListener.
    //
    // This avoids the exportFunction cross-compartment "Permission denied to
    // access property 'length'" crash that occurs when the page calls
    // .apply() on a wrapped XHR prototype method.
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
      try {
        window.addEventListener('__adtp_token__', function (e) {
          if (e && e.detail) onToken(e.detail);
        });
        var scriptUrl = browser.runtime.getURL('injected.js');
        // At document_start, document.documentElement is null — the HTML has
        // not been parsed yet.  document.write() inserts a synchronous
        // (parser-blocking) script into the HTML stream so it executes before
        // ANY page script, including the keycloak-js module.
        // moz-extension:// resources are always trusted and bypass page CSP.
        if (document.documentElement) {
          var _s = document.createElement('script');
          _s.src = scriptUrl;
          document.documentElement.appendChild(_s);
        } else {
          document.write('<script src="' + scriptUrl + '"><\/script>');
        }
        return; // Firefox interceptor installed; stop here.
      } catch (e) { /* fall through */ }
    }

    // Chrome (manifest "world": "MAIN"): the content script runs in the page's
    // own JavaScript context, so window.fetch and XMLHttpRequest.prototype are
    // the real page APIs.  Wrap both because keycloak-js uses XHR in many
    // versions and fetch in others.
    var _orig = window.fetch;
    window.fetch = function () {
      var args = Array.prototype.slice.call(arguments);
      var req = args[0];
      var url = typeof req === 'string' ? req
        : req instanceof URL ? req.href
          : (req && req.url) ? req.url : '';
      var p = _orig.apply(this, args);
      if (url.indexOf('openid-connect/token') !== -1) {
        p.then(function (resp) {
          resp.clone().json().then(function (data) {
            if (data && data.access_token) onToken(data.access_token);
          }).catch(function () { });
        }).catch(function () { });
      }
      return p;
    };

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
            if (data && data.access_token) onToken(data.access_token);
          } catch (e) { }
        });
      }
      return _xhrSend.apply(this, arguments);
    };
  })();

  /* ── Utils ───────────────────────────────────────────────────────── */

  function decodeJwt(token) {
    try {
      var b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch (e) { return null; }
  }

  function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Storage ─────────────────────────────────────────────────────── */

  function planKey() {
    return userId ? 'adtp-plans-' + userId : 'adtp-plans';
  }

  function getPlans() {
    try { return JSON.parse(localStorage.getItem(planKey())) || []; }
    catch (e) { return []; }
  }

  function savePlans(plans) {
    localStorage.setItem(planKey(), JSON.stringify(plans));
  }

  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem('adtp-session')) || null; }
    catch (e) { return null; }
  }

  function saveSession(s) {
    if (s) sessionStorage.setItem('adtp-session', JSON.stringify(s));
    else sessionStorage.removeItem('adtp-session');
  }

  /* ── API ─────────────────────────────────────────────────────────── */

  function apiFetch(method, path, body) {
    var opts = { method: method, headers: { 'Authorization': 'Bearer ' + accessToken } };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch('https://api.autodarts.io' + path, opts).then(function (res) {
      if (!res.ok) throw new Error('API ' + method + ' ' + path + ' \u2192 ' + res.status);
      return res.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }

  function getBoards() { return apiFetch('GET', '/bs/v0/boards'); }

  function createAndJoinLobby(step, boardId) {
    return apiFetch('POST', '/gs/v0/lobbies', {
      variant: step.variant,
      settings: step.settings,
      bullOffMode: step.bullOffMode || 'Off',
      isPrivate: true,
    }).then(function (lobby) {
      return apiFetch('POST', '/gs/v0/lobbies/' + lobby.id + '/players', {
        name: userName,
        userId: userId,
        boardId: boardId,
      }).then(function () { return lobby; });
    });
  }

  /* ── Plan execution ──────────────────────────────────────────────── */

  function startPlan(planId) {
    if (!accessToken) {
      alert('Not authenticated yet \u2014 wait for the page to finish loading.');
      return;
    }
    getBoards().then(function (boards) {
      if (!boards || !boards.length) { alert('No boards found on your account.'); return; }
      var connected = boards.filter(function (b) { return b.state && b.state.connected; });
      var boardId = (connected.length ? connected[0] : boards[0]).id;
      var session = { planId: planId, stepIndex: 0, boardId: boardId };
      saveSession(session);
      return startStep(session);
    }).catch(function (e) { alert('Could not fetch boards: ' + e.message); });
  }

  function startStep(session) {
    removeToast();
    var plans = getPlans();
    var plan = plans.find(function (p) { return p.id === session.planId; });
    if (!plan || session.stepIndex >= plan.steps.length) {
      saveSession(null);
      renderSidebarSection();
      return;
    }
    var step = plan.steps[session.stepIndex];
    renderSidebarSection();
    createAndJoinLobby(step, session.boardId).then(function (lobby) {
      window.location.href = '/lobbies/' + lobby.id;
    }).catch(function (e) {
      saveSession(null);
      alert('Failed to create lobby: ' + e.message);
      renderSidebarSection();
    });
  }

  /* ── Toast notification ──────────────────────────────────────────── */

  function removeToast() {
    var t = document.getElementById('adtp-toast');
    if (t) t.remove();
  }

  function showNextGameToast(session) {
    if (document.getElementById('adtp-toast')) return;
    var plans = getPlans();
    var plan = plans.find(function (p) { return p.id === session.planId; });
    if (!plan) { saveSession(null); return; }

    var total = plan.steps.length;
    var isLast = session.stepIndex + 1 >= total;
    var nextStep = isLast ? null : plan.steps[session.stepIndex + 1];

    var toast = document.createElement('div');
    toast.id = 'adtp-toast';

    var html = '<div class="adtp-toast-header">'
      + '<div>'
      + '<div class="adtp-toast-title">' + esc(plan.name) + '</div>'
      + '<div class="adtp-toast-sub">Step ' + (session.stepIndex + 1) + '\u00a0/\u00a0' + total + ' complete</div>'
      + '</div>'
      + '<button class="adtp-icon-btn adtp-toast-dismiss" title="Dismiss">\u2715</button>'
      + '</div>';

    if (isLast) {
      html += '<div class="adtp-toast-done">\u2713 Plan complete!</div>'
        + '<button class="adtp-btn-ghost adtp-toast-dismiss" style="width:100%;justify-content:center">Dismiss</button>';
    } else {
      html += '<div class="adtp-toast-step">Next: ' + esc(stepLabel(nextStep)) + '</div>'
        + '<button class="adtp-btn-primary" id="adtp-toast-next">\u25b6\u00a0Start next game</button>';
    }

    toast.innerHTML = html;
    document.body.appendChild(toast);

    toast.querySelectorAll('.adtp-toast-dismiss').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeToast();
        if (isLast) { saveSession(null); renderSidebarSection(); }
      });
    });

    var nextBtn = toast.querySelector('#adtp-toast-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        removeToast();
        var s = loadSession();
        if (!s) return;
        s.stepIndex += 1;
        saveSession(s);
        startStep(s);
      });
    }
  }

  /* ── URL / navigation ────────────────────────────────────────────── */

  var _origPush = history.pushState.bind(history);
  var _origReplace = history.replaceState.bind(history);

  history.pushState = function () {
    _origPush.apply(this, arguments);
    onNav();
  };
  history.replaceState = function () {
    _origReplace.apply(this, arguments);
    onNav();
  };
  window.addEventListener('popstate', onNav);

  function onNav() {
    if (!document.getElementById('adtp-section')) tryInject();
    else renderSidebarSection();
  }

  /* ── Sidebar rendering ───────────────────────────────────────────── */

  function getOrCreateSection() {
    var el = document.getElementById('adtp-section');
    if (el) return el;
    var nav = document.querySelector('.chakra-stack.navigation');
    if (!nav) return null;

    // Borrow the class list from My Boards <a> and its icon <span> so our
    // button looks identical to the existing nav items without hard-coding
    // any Chakra-generated class names.
    var boardsLink = nav.querySelector('a[href="/boards"]');
    var iconSpan = boardsLink && boardsLink.querySelector('.chakra-button__icon');

    el = document.createElement('button');
    el.id = 'adtp-section';
    el.type = 'button';
    if (boardsLink) el.className = boardsLink.className;

    var ic = document.createElement('span');
    if (iconSpan) ic.className = iconSpan.className;
    ic.innerHTML = BICEPS_SVG;
    el.appendChild(ic);

    var lb = document.createElement('span');
    lb.id = 'adtp-label';
    lb.textContent = 'Training Plans';
    el.appendChild(lb);

    el.addEventListener('click', openPlansOverlay);
    nav.appendChild(el);

    // Keep our button's class in sync with the reference nav item so the
    // Chakra-generated styles (expanded vs collapsed) are always correct.
    if (boardsLink && typeof MutationObserver !== 'undefined') {
      var _cmO = new MutationObserver(function () {
        var btn = document.getElementById('adtp-section');
        var bl = nav.querySelector('a[href="/boards"]');
        if (btn && bl) btn.className = bl.className;
      });
      _cmO.observe(boardsLink, { attributes: true, attributeFilter: ['class'] });
    }

    // Toggle data-collapsed on our button so CSS can hide the label text
    // when the sidebar is narrow (icon-only mode).
    function _syncCollapsed() {
      var btn = document.getElementById('adtp-section');
      var navEl = document.querySelector('.chakra-stack.navigation');
      if (!btn || !navEl) return;
      var collapsed = navEl.getBoundingClientRect().width < 90;
      btn.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
      if (collapsed) btn.setAttribute('aria-label', 'Training Plans');
      else btn.removeAttribute('aria-label');
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(_syncCollapsed).observe(nav);
    }
    _syncCollapsed();

    return el;
  }

  function stepLabel(step) {
    var v = step.variant, s = step.settings;
    if (v === 'X01') return s.baseScore + ' ' + s.outMode;
    if (v === 'Cricket') return s.gameMode || 'Cricket';
    if (v === 'Segment Training') return s.mode + ' ' + s.segment + '\xd7' + s.hits;
    if (v === 'ATC') return 'ATC ' + (s.mode || '');
    if (v === 'CountUp') return 'Count Up ' + s.maxRounds + 'r';
    return VARIANT_LABELS[v] || v;
  }

  function renderSidebarSection() {
    getOrCreateSection();
    var overlay = document.getElementById('adtp-plans-overlay');
    if (overlay) renderPlansOverlayContent(overlay);
    var session = loadSession();
    if (session && !/^\/(lobbies|matches)\//.test(location.pathname)) {
      showNextGameToast(session);
    }
  }

  function openPlansOverlay() {
    var existing = document.getElementById('adtp-plans-overlay');
    if (existing) { existing.remove(); return; }
    var overlay = document.createElement('div');
    overlay.id = 'adtp-plans-overlay';
    overlay.className = 'adtp-overlay';
    document.body.appendChild(overlay);
    renderPlansOverlayContent(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  }

  function renderPlansOverlayContent(overlay) {
    var plans = getPlans();
    var session = loadSession();
    var onGame = /^\/(lobbies|matches)\//.test(location.pathname);
    var activePlan = session && plans.find(function (p) { return p.id === session.planId; });

    var html = '<div class="adtp-modal">'
      + '<div class="adtp-modal-header">'
      + '<h2 class="adtp-modal-title">Training Plans</h2>'
      + '<button class="adtp-icon-btn" id="adtp-new-btn" title="New plan">+</button>'
      + '</div>'
      + '<div class="adtp-modal-body">';

    if (activePlan) {
      var step = activePlan.steps[session.stepIndex];
      var total = activePlan.steps.length;
      html += '<div class="adtp-active-plan">'
        + '<div class="adtp-active-name">' + esc(activePlan.name) + '</div>'
        + '<div class="adtp-active-sub">Step ' + (session.stepIndex + 1) + ' / ' + total + '</div>'
        + '<div class="adtp-active-step">' + esc(step ? stepLabel(step) : '\u2014') + '</div>';
      if (onGame) {
        html += '<div class="adtp-active-sub">Game in progress\u2026</div>';
      } else if (session.stepIndex + 1 < total) {
        html += '<button class="adtp-btn-primary" id="adtp-next-btn">\u25b6 Next game</button>';
      } else {
        html += '<div class="adtp-done">\u2713 Plan complete!</div>';
      }
      html += '<button class="adtp-btn-ghost" id="adtp-stop-btn">\u2715 Stop plan</button>'
        + '</div>';
    }

    if (!activePlan) {
      if (plans.length === 0) {
        html += '<p class="adtp-empty">No plans yet.<br>Tap \u201c+\u201d to create one.</p>';
      } else {
        plans.forEach(function (plan) {
          html += '<div class="adtp-plan-row">'
            + '<div class="adtp-plan-info">'
            + '<div class="adtp-plan-name">' + esc(plan.name) + '</div>'
            + '<div class="adtp-plan-meta">'
            + plan.steps.length + ' step' + (plan.steps.length !== 1 ? 's' : '')
            + '</div>'
            + '</div>'
            + '<div class="adtp-plan-btns">'
            + '<button class="adtp-btn-start" data-id="' + esc(plan.id) + '" title="Start">\u25b6</button>'
            + '<button class="adtp-btn-edit"  data-id="' + esc(plan.id) + '" title="Edit">\u270e</button>'
            + '<button class="adtp-btn-del"   data-id="' + esc(plan.id) + '" title="Delete">\u2715</button>'
            + '</div>'
            + '</div>';
        });
      }
    }

    html += '</div></div>';
    overlay.innerHTML = html;

    var newBtn = overlay.querySelector('#adtp-new-btn');
    var nextBtn = overlay.querySelector('#adtp-next-btn');
    var stopBtn = overlay.querySelector('#adtp-stop-btn');

    if (newBtn) newBtn.addEventListener('click', function () { openEditor(null); });
    if (stopBtn) stopBtn.addEventListener('click', function () { saveSession(null); removeToast(); renderSidebarSection(); });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var s = loadSession();
      if (!s) return;
      s.stepIndex += 1;
      saveSession(s);
      startStep(s);
    });

    overlay.querySelectorAll('.adtp-btn-start').forEach(function (btn) {
      btn.addEventListener('click', function () { startPlan(btn.dataset.id); });
    });
    overlay.querySelectorAll('.adtp-btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () { openEditor(btn.dataset.id); });
    });
    overlay.querySelectorAll('.adtp-btn-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var plan = getPlans().find(function (p) { return p.id === btn.dataset.id; });
        if (!confirm('Delete \u201c' + esc(plan ? plan.name : btn.dataset.id) + '\u201d?')) return;
        savePlans(getPlans().filter(function (p) { return p.id !== btn.dataset.id; }));
        renderPlansOverlayContent(overlay);
      });
    });
  }

  /* ── Plan editor modal ───────────────────────────────────────────── */

  function openEditor(planId) {
    var existing = planId ? getPlans().find(function (p) { return p.id === planId; }) : null;
    var plan = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: uid(), name: '', steps: [] };
    var overlay = document.createElement('div');
    overlay.id = 'adtp-overlay';
    overlay.className = 'adtp-overlay';
    document.body.appendChild(overlay);
    renderEditor(overlay, plan);
  }

  function closeEditor() {
    var el = document.getElementById('adtp-overlay');
    if (el) el.remove();
  }

  function renderEditor(overlay, plan) {
    var variantOpts = VARIANTS.map(function (v) {
      return '<option value="' + esc(v) + '">' + esc(VARIANT_LABELS[v] || v) + '</option>';
    }).join('');

    overlay.innerHTML = '<div class="adtp-modal">'
      + '<div class="adtp-modal-header">'
      + '<h2 class="adtp-modal-title">' + (plan.name ? esc(plan.name) : 'New Plan') + '</h2>'
      + '<button class="adtp-icon-btn" id="adtp-modal-close">\u2715</button>'
      + '</div>'
      + '<div class="adtp-modal-body">'
      + '<label class="adtp-label" for="adtp-plan-name">Plan name</label>'
      + '<input class="adtp-input" id="adtp-plan-name" type="text" value="' + esc(plan.name)
      + '" placeholder="e.g. Doubles Training" autocomplete="off" />'
      + '<div class="adtp-steps-label">'
      + '<span class="adtp-label">Steps</span>'
      + '<div class="adtp-add-row">'
      + '<select class="adtp-select" id="adtp-variant-pick">' + variantOpts + '</select>'
      + '<button class="adtp-btn-primary adtp-add-btn" id="adtp-add-step">+ Add</button>'
      + '</div>'
      + '</div>'
      + '<div id="adtp-steps-list"></div>'
      + '</div>'
      + '<div class="adtp-modal-footer">'
      + '<button class="adtp-btn-ghost" id="adtp-modal-cancel">Cancel</button>'
      + '<button class="adtp-btn-primary" id="adtp-modal-save">Save plan</button>'
      + '</div>'
      + '</div>';

    renderStepList(overlay, plan);

    overlay.querySelector('#adtp-modal-close').addEventListener('click', closeEditor);
    overlay.querySelector('#adtp-modal-cancel').addEventListener('click', closeEditor);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeEditor(); });

    overlay.querySelector('#adtp-add-step').addEventListener('click', function () {
      var v = overlay.querySelector('#adtp-variant-pick').value;
      plan.steps.push({
        variant: v,
        settings: Object.assign({}, VARIANT_DEFAULTS[v] || {}),
        bullOffMode: 'Off',
      });
      renderStepList(overlay, plan);
    });

    overlay.querySelector('#adtp-modal-save').addEventListener('click', function () {
      saveFromEditor(overlay, plan);
    });
  }

  function renderStepList(overlay, plan) {
    var list = overlay.querySelector('#adtp-steps-list');
    if (plan.steps.length === 0) {
      list.innerHTML = '<p class="adtp-empty-steps">No steps yet. Add one above.</p>';
      return;
    }
    list.innerHTML = plan.steps.map(function (step, i) {
      return '<div class="adtp-step-card" data-index="' + i + '">'
        + '<div class="adtp-step-hd">'
        + '<span class="adtp-step-num">' + (i + 1) + '</span>'
        + '<span class="adtp-step-var">' + esc(VARIANT_LABELS[step.variant] || step.variant) + '</span>'
        + '<div class="adtp-step-ctrl">'
        + (i > 0 ? '<button class="adtp-icon-btn adtp-up" data-i="' + i + '">\u2191</button>' : '')
        + (i < plan.steps.length - 1 ? '<button class="adtp-icon-btn adtp-dn" data-i="' + i + '">\u2193</button>' : '')
        + '<button class="adtp-icon-btn adtp-rm" data-i="' + i + '">\u2715</button>'
        + '</div>'
        + '</div>'
        + '<div class="adtp-step-settings">' + buildStepSettings(step) + '</div>'
        + '</div>';
    }).join('');

    list.querySelectorAll('.adtp-rm').forEach(function (btn) {
      btn.addEventListener('click', function () {
        plan.steps.splice(Number(btn.dataset.i), 1);
        renderStepList(overlay, plan);
      });
    });
    list.querySelectorAll('.adtp-up').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.dataset.i);
        var tmp = plan.steps[i - 1]; plan.steps[i - 1] = plan.steps[i]; plan.steps[i] = tmp;
        renderStepList(overlay, plan);
      });
    });
    list.querySelectorAll('.adtp-dn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.dataset.i);
        var tmp = plan.steps[i]; plan.steps[i] = plan.steps[i + 1]; plan.steps[i + 1] = tmp;
        renderStepList(overlay, plan);
      });
    });
  }

  /* ── Step settings HTML ──────────────────────────────────────────── */

  var BULL_OPTS = [['Off', 'Bull-off: Off'], ['Normal', 'Bull-off: Normal'], ['Official', 'Bull-off: Official']];

  function sel(name, current, options) {
    return '<select class="adtp-select adtp-s" data-k="' + esc(name) + '">'
      + options.map(function (o) {
        return '<option value="' + esc(o[0]) + '"'
          + (String(o[0]) === String(current) ? ' selected' : '')
          + '>' + esc(o[1]) + '</option>';
      }).join('')
      + '</select>';
  }

  function numIn(name, val, min, max) {
    return '<input class="adtp-input adtp-s" type="number" data-k="' + esc(name) + '"'
      + ' value="' + esc(String(val)) + '" min="' + min + '" max="' + max + '" />';
  }

  function buildStepSettings(step) {
    var v = step.variant;
    var s = step.settings;
    var bo = sel('_bullOff', step.bullOffMode || 'Off', BULL_OPTS);

    if (v === 'X01') return [
      sel('baseScore', s.baseScore, [[121, '121'], [170, '170'], [301, '301'], [501, '501'], [701, '701'], [901, '901']]),
      sel('inMode', s.inMode, [['Straight', 'In: Straight'], ['Double', 'In: Double'], ['Master', 'In: Master']]),
      sel('outMode', s.outMode, [['Straight', 'Out: Straight'], ['Double', 'Out: Double'], ['Master', 'Out: Master']]),
      sel('bullMode', s.bullMode, [['25/50', '25/50'], ['50/50', '50/50']]),
      sel('maxRounds', s.maxRounds, [[15, '15r'], [20, '20r'], [50, '50r'], [80, '80r']]),
      bo,
    ].join('');

    if (v === 'Cricket') return [
      sel('gameMode', s.gameMode, [['Cricket', 'Cricket'], ['Tactics', 'Tactics']]),
      sel('scoringMode', s.scoringMode, [['Standard', 'Standard'], ['CutThroat', 'Cut Throat'], ['NoScore', 'No Score']]),
      sel('maxRounds', s.maxRounds, [[15, '15r'], [20, '20r'], [50, '50r'], [80, '80r']]),
      bo,
    ].join('');

    if (v === 'ATC') return [
      sel('mode', s.mode, [['Full', 'Full'], ['OuterSingle', 'Outer Single'], ['Single', 'Single'], ['Double', 'Double'], ['Triple', 'Triple']]),
      sel('order', s.order, [['1-20-Bull', '1-20-Bull'], ['20-1-Bull', '20-1-Bull'], ['Random-Bull', 'Random-Bull']]),
      sel('hits', s.hits, [[1, '1 hit'], [2, '2 hits'], [3, '3 hits']]),
      bo,
    ].join('');

    if (v === 'Segment Training') return [
      sel('mode', s.mode, [['Single', 'Single'], ['OuterSingle', 'Outer Single'], ['Double', 'Double'], ['Triple', 'Triple'], ['Random', 'Random']]),
      sel('segment', s.segment, [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'], ['10', '10'], ['11', '11'], ['12', '12'], ['13', '13'], ['14', '14'], ['15', '15'], ['16', '16'], ['17', '17'], ['18', '18'], ['19', '19'], ['20', '20'], ['Bull', 'Bull']]),
      numIn('hits', s.hits, 1, 100),
      bo,
    ].join('');

    if (v === "Bob's 27") return [
      sel('mode', s.mode, [['Normal', 'Normal'], ['AllowNegativeScore', 'Allow Negative']]),
      sel('order', s.order, [['1-20-Bull', '1-20-Bull'], ['1-20', '1-20']]),
      bo,
    ].join('');

    if (v === 'Bermuda') return '<span class="adtp-no-settings">No settings</span>' + bo;

    if (v === 'Gotcha') return [
      sel('targetScore', s.targetScore, [[301, '301'], [401, '401'], [501, '501'], [601, '601'], [701, '701']]),
      sel('outMode', s.outMode, [['Straight', 'Straight'], ['Double', 'Double'], ['Master', 'Master']]),
      sel('maxRounds', s.maxRounds, [[15, '15r'], [20, '20r'], [50, '50r'], [80, '80r']]),
      bo,
    ].join('');

    if (v === 'Shanghai') return [
      sel('mode', s.mode, [['1-20', '1-20']]),
      bo,
    ].join('');

    if (v === 'RTW') return [
      sel('order', s.order, [['1-20-Bull', '1-20-Bull'], ['20-1-Bull', '20-1-Bull'], ['Random-Bull', 'Random-Bull']]),
      bo,
    ].join('');

    if (v === 'Random Checkout') return [
      numIn('low', s.low, 2, 170),
      numIn('high', s.high, 2, 180),
      sel('outMode', s.outMode, [['Double', 'Out: Double'], ['Master', 'Out: Master'], ['Straight', 'Out: Straight']]),
      sel('maxRounds', s.maxRounds, [[9, '9r'], [15, '15r'], [20, '20r'], [50, '50r']]),
      bo,
    ].join('');

    if (v === 'CountUp') return [
      sel('maxRounds', s.maxRounds, [[8, '8r'], [15, '15r'], [20, '20r'], [50, '50r']]),
      bo,
    ].join('');

    return bo;
  }

  function saveFromEditor(overlay, plan) {
    var nameEl = overlay.querySelector('#adtp-plan-name');
    plan.name = nameEl ? (nameEl.value || '').trim() || 'Unnamed Plan' : 'Unnamed Plan';

    overlay.querySelectorAll('.adtp-step-card').forEach(function (card, i) {
      if (!plan.steps[i]) return;
      var step = plan.steps[i];
      card.querySelectorAll('.adtp-s').forEach(function (input) {
        var key = input.dataset.k;
        var raw = input.value;
        if (key === '_bullOff') {
          step.bullOffMode = raw;
        } else {
          var defVal = (VARIANT_DEFAULTS[step.variant] || {})[key];
          step.settings[key] = (typeof defVal === 'number') ? Number(raw) : raw;
        }
      });
    });

    var plans = getPlans();
    var idx = plans.findIndex(function (p) { return p.id === plan.id; });
    if (idx >= 0) plans[idx] = plan; else plans.push(plan);
    savePlans(plans);
    closeEditor();
    renderSidebarSection();
  }

  /* ── Init ────────────────────────────────────────────────────────── */

  function tryInject() {
    if (document.getElementById('adtp-section')) return true;
    if (document.querySelector('.chakra-stack.navigation a[href="/boards"]')) {
      renderSidebarSection();
      return true;
    }
    return false;
  }

  // Keep the observer running indefinitely so we can re-inject if React's
  // reconciliation removes our element without a navigation event.
  var _mo = new MutationObserver(function () {
    if (!document.getElementById('adtp-section')) tryInject();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      tryInject();
      _mo.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    tryInject();
    _mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Test exports ────────────────────────────────────────────────── */
  /* istanbul ignore next */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { decodeJwt, uid, esc, planKey, getPlans, savePlans, loadSession, saveSession, VARIANT_DEFAULTS, VARIANTS, stepLabel, get accessToken() { return accessToken; } };
  }

})();
