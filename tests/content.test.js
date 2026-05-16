'use strict';

/**
 * Tests for content.js
 *
 * Strategy: mock global.fetch before each require() so the IIFE's fetch
 * interceptor wraps the mock. jest.resetModules() in beforeEach ensures
 * a fresh IIFE execution per test block.
 */

/* ── helpers ──────────────────────────────────────────────────────── */

function makeFetchMock(overrides) {
  return jest.fn().mockResolvedValue(Object.assign({
    ok: true,
    clone: function () {
      return { json: function () { return Promise.resolve({}); } };
    },
    text: function () { return Promise.resolve(''); },
    json: function () { return Promise.resolve({}); },
  }, overrides || {}));
}

function requireFresh() {
  jest.resetModules();
  global.fetch = makeFetchMock();
  // history stubs (jsdom supports pushState but we override to be safe)
  global.history = { pushState: jest.fn(), replaceState: jest.fn() };
  return require('../src/content.js');
}

/* ── decodeJwt ────────────────────────────────────────────────────── */

describe('decodeJwt', function () {
  var mod;
  beforeEach(function () { mod = requireFresh(); });

  function makeJwt(payload) {
    var b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return 'header.' + b64 + '.signature';
  }

  test('decodes sub and preferred_username', function () {
    var token = makeJwt({ sub: 'user-abc', preferred_username: 'alice' });
    var payload = mod.decodeJwt(token);
    expect(payload.sub).toBe('user-abc');
    expect(payload.preferred_username).toBe('alice');
  });

  test('returns null for a malformed token', function () {
    expect(mod.decodeJwt('not.valid')).toBeNull();
    expect(mod.decodeJwt('')).toBeNull();
    expect(mod.decodeJwt('a.!!!.c')).toBeNull();
  });
});

/* ── esc (XSS escaping) ───────────────────────────────────────────── */

describe('esc', function () {
  var mod;
  beforeEach(function () { mod = requireFresh(); });

  test('escapes <, >, &, "', function () {
    expect(mod.esc('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(mod.esc('a & b')).toBe('a &amp; b');
  });

  test('passes through safe strings unchanged', function () {
    expect(mod.esc('hello world')).toBe('hello world');
    expect(mod.esc('501 Double')).toBe('501 Double');
  });

  test('coerces non-string values', function () {
    expect(mod.esc(42)).toBe('42');
    expect(mod.esc(null)).toBe('null');
    expect(mod.esc(true)).toBe('true');
  });
});

/* ── uid ──────────────────────────────────────────────────────────── */

describe('uid', function () {
  var mod;
  beforeEach(function () { mod = requireFresh(); });

  test('returns a non-empty string', function () {
    expect(typeof mod.uid()).toBe('string');
    expect(mod.uid().length).toBeGreaterThan(0);
  });

  test('generates unique values', function () {
    expect(mod.uid()).not.toBe(mod.uid());
  });
});

/* ── VARIANT_DEFAULTS ─────────────────────────────────────────────── */

describe('VARIANT_DEFAULTS', function () {
  var mod;
  beforeEach(function () { mod = requireFresh(); });

  test('every variant in VARIANTS has a defaults entry', function () {
    mod.VARIANTS.forEach(function (v) {
      expect(mod.VARIANT_DEFAULTS).toHaveProperty(v);
    });
  });

  test('X01 defaults are correct', function () {
    var d = mod.VARIANT_DEFAULTS['X01'];
    expect(d.baseScore).toBe(501);
    expect(d.outMode).toBe('Double');
    expect(d.inMode).toBe('Straight');
    expect(d.bullMode).toBe('25/50');
  });

  test('Segment Training defaults are correct', function () {
    var d = mod.VARIANT_DEFAULTS['Segment Training'];
    expect(d.segment).toBe('20');
    expect(typeof d.hits).toBe('number');
    expect(d.hits).toBeGreaterThan(0);
  });

  test('Bermuda has empty settings object', function () {
    expect(mod.VARIANT_DEFAULTS['Bermuda']).toEqual({});
  });

  test('Random Checkout low < high', function () {
    var d = mod.VARIANT_DEFAULTS['Random Checkout'];
    expect(d.low).toBeLessThan(d.high);
  });
});

/* ── session storage helpers ──────────────────────────────────────── */

describe('session storage helpers', function () {
  var mod;
  beforeEach(function () {
    sessionStorage.clear();
    mod = requireFresh();
  });

  test('loadSession returns null when nothing stored', function () {
    expect(mod.loadSession()).toBeNull();
  });

  test('saveSession + loadSession round-trip', function () {
    var s = { planId: 'plan-1', stepIndex: 2, boardId: 'board-1' };
    mod.saveSession(s);
    expect(mod.loadSession()).toEqual(s);
  });

  test('saveSession(null) clears the session', function () {
    mod.saveSession({ planId: 'x', stepIndex: 0, boardId: 'y' });
    mod.saveSession(null);
    expect(mod.loadSession()).toBeNull();
  });
});

/* ── plan storage helpers ─────────────────────────────────────────── */

describe('plan storage helpers', function () {
  var mod;
  beforeEach(function () {
    localStorage.clear();
    sessionStorage.clear();
    mod = requireFresh();
  });

  test('getPlans returns [] when nothing stored', function () {
    expect(mod.getPlans()).toEqual([]);
  });

  test('savePlans persists and getPlans retrieves plans', function () {
    var plans = [{ id: '1', name: 'Test', steps: [] }];
    mod.savePlans(plans);
    expect(mod.getPlans()).toEqual(plans);
  });

  test('planKey uses anonymous key before auth', function () {
    expect(mod.planKey()).toBe('adtp-plans');
  });

  test('planKey uses userId-scoped key after auth', function () {
    function makeJwt(payload) {
      var b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return 'header.' + b64 + '.sig';
    }
    // Simulate content.js receiving a token by re-requiring with fetch patched.
    jest.resetModules();
    localStorage.clear();
    var token = makeJwt({ sub: 'user-abc', preferred_username: 'alice' });
    var cloneJson = jest.fn().mockResolvedValue({ access_token: token });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      clone: function () { return { json: cloneJson }; },
      text: function () { return Promise.resolve(''); },
    });
    global.history = { pushState: jest.fn(), replaceState: jest.fn() };
    var m = require('../src/content.js');
    return window.fetch('https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token')
      .then(function () { return new Promise(function (r) { setTimeout(r, 10); }); })
      .then(function () {
        expect(m.planKey()).toBe('adtp-plans-user-abc');
      });
  });

  test('migration moves anonymous plans to user-scoped key on first auth', function () {
    function makeJwt(payload) {
      var b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return 'header.' + b64 + '.sig';
    }
    jest.resetModules();
    localStorage.clear();
    var existing = [{ id: '9', name: 'Old Plan', steps: [] }];
    localStorage.setItem('adtp-plans', JSON.stringify(existing));
    var token = makeJwt({ sub: 'user-abc', preferred_username: 'alice' });
    var cloneJson = jest.fn().mockResolvedValue({ access_token: token });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      clone: function () { return { json: cloneJson }; },
      text: function () { return Promise.resolve(''); },
    });
    global.history = { pushState: jest.fn(), replaceState: jest.fn() };
    var m = require('../src/content.js');
    return window.fetch('https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token')
      .then(function () { return new Promise(function (r) { setTimeout(r, 10); }); })
      .then(function () {
        expect(m.getPlans()).toEqual(existing);
        expect(localStorage.getItem('adtp-plans')).toBeNull();
      });
  });
});

/* ── stepLabel ────────────────────────────────────────────────────── */

describe('stepLabel', function () {
  var mod;
  beforeEach(function () { mod = requireFresh(); });

  test('X01 label includes base score and out mode', function () {
    var label = mod.stepLabel({ variant: 'X01', settings: { baseScore: 501, outMode: 'Double' } });
    expect(label).toContain('501');
    expect(label).toContain('Double');
  });

  test('Cricket label is the game mode', function () {
    var label = mod.stepLabel({ variant: 'Cricket', settings: { gameMode: 'Tactics' } });
    expect(label).toBe('Tactics');
  });

  test('Segment Training label includes mode, segment and hits', function () {
    var label = mod.stepLabel({ variant: 'Segment Training', settings: { mode: 'Double', segment: '20', hits: 5 } });
    expect(label).toContain('20');
    expect(label).toContain('5');
  });

  test('CountUp label includes round count', function () {
    var label = mod.stepLabel({ variant: 'CountUp', settings: { maxRounds: 8 } });
    expect(label).toContain('8');
  });
});

/* ── fetch interceptor token capture ─────────────────────────────── */

describe('fetch interceptor', function () {
  function makeJwt(payload) {
    var b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return 'header.' + b64 + '.sig';
  }

  test('captures accessToken and userId from token endpoint response', async function () {
    jest.resetModules();
    var token = makeJwt({ sub: 'user-xyz', preferred_username: 'tester' });

    var cloneJson = jest.fn().mockResolvedValue({ access_token: token });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      clone: function () { return { json: cloneJson }; },
      text: function () { return Promise.resolve(''); },
    });
    global.history = { pushState: jest.fn(), replaceState: jest.fn() };

    require('../src/content.js');

    // Simulate the page calling the Keycloak token endpoint.
    await window.fetch('https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token');
    await new Promise(function (r) { setTimeout(r, 10); });

    expect(cloneJson).toHaveBeenCalledTimes(1);
  });
});
