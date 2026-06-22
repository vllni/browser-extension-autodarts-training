#!/usr/bin/env node
'use strict';

/**
 * Zero-dependency sanity check for the extension manifests.
 *
 * There is no official Chrome CLI linter (the Web Store validates server-side),
 * and web-ext/addons-linter is Firefox-only. Our JS is validated by the Firefox
 * web-ext lint; this script covers the one Chrome-unique artifact it can't —
 * the manifest — plus shared invariants for both targets.
 *
 * Exits non-zero and prints every problem found.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'));
  } catch (e) {
    fail(file, `not valid JSON (${e.message})`);
    return null;
  }
}

function getContentScript(m) {
  return (Array.isArray(m.content_scripts) && m.content_scripts[0]) || null;
}

// Shared checks applied to every manifest.
function checkCommon(file, m) {
  ['name', 'description', 'version', 'icons', 'content_scripts'].forEach((k) => {
    if (!(k in m)) fail(file, `missing required key "${k}"`);
  });

  // Referenced icon files must exist on disk.
  Object.entries(m.icons || {}).forEach(([size, rel]) => {
    if (!fs.existsSync(path.join(SRC, rel))) {
      fail(file, `icons[${size}] points to missing file "${rel}"`);
    }
  });

  const cs = getContentScript(m);
  if (!cs) {
    fail(file, 'content_scripts[0] is missing');
    return;
  }
  if (!(cs.matches || []).includes('https://play.autodarts.io/*')) {
    fail(file, 'content_scripts[0].matches must include "https://play.autodarts.io/*"');
  }
  if (cs.run_at !== 'document_start') {
    fail(file, `content_scripts[0].run_at must be "document_start" (got "${cs.run_at}")`);
  }
  ['content.js', 'content.css'].forEach((asset) => {
    const list = asset.endsWith('.css') ? cs.css : cs.js;
    if (!(list || []).includes(asset)) fail(file, `content_scripts[0] must load "${asset}"`);
    if (!fs.existsSync(path.join(SRC, asset))) fail(file, `referenced asset "${asset}" does not exist`);
  });
}

function checkChrome(file, m) {
  if (m.manifest_version !== 3) fail(file, `manifest_version must be 3 (got ${m.manifest_version})`);
  if ('browser_specific_settings' in m) {
    fail(file, 'must NOT contain Firefox-only "browser_specific_settings"');
  }
  const cs = getContentScript(m);
  // MAIN world is load-bearing: the token capture relies on running in the
  // page's own JS context. Guard against an accidental removal.
  if (cs && cs.world !== 'MAIN') {
    fail(file, `content_scripts[0].world must be "MAIN" for Chrome (got "${cs.world}")`);
  }
}

function checkFirefox(file, m) {
  if (m.manifest_version !== 2) fail(file, `manifest_version must be 2 (got ${m.manifest_version})`);

  const gecko = (m.browser_specific_settings && m.browser_specific_settings.gecko) || null;
  if (!gecko || !gecko.id) {
    fail(file, 'browser_specific_settings.gecko.id is required for AMO');
  }
  if (!gecko || !gecko.data_collection_permissions) {
    fail(file, 'browser_specific_settings.gecko.data_collection_permissions is required by AMO');
  }

  // injected.js runs in the page world to capture the token; it must be exposed.
  if (!(m.web_accessible_resources || []).includes('injected.js')) {
    fail(file, 'web_accessible_resources must include "injected.js"');
  }
  if (!fs.existsSync(path.join(SRC, 'injected.js'))) {
    fail(file, 'referenced asset "injected.js" does not exist');
  }
  if (!(m.permissions || []).includes('https://api.autodarts.io/*')) {
    fail(file, 'permissions must include "https://api.autodarts.io/*"');
  }
}

const chrome = readJson('manifest.chrome.json');
const firefox = readJson('manifest.firefox.json');

if (chrome) { checkCommon('manifest.chrome.json', chrome); checkChrome('manifest.chrome.json', chrome); }
if (firefox) { checkCommon('manifest.firefox.json', firefox); checkFirefox('manifest.firefox.json', firefox); }

// Versions must stay in lockstep across package.json and both manifests.
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const versions = {
  'package.json': pkg.version,
  'manifest.chrome.json': chrome && chrome.version,
  'manifest.firefox.json': firefox && firefox.version,
};
const distinct = [...new Set(Object.values(versions).filter(Boolean))];
if (distinct.length > 1) {
  problems.push(`version mismatch: ${JSON.stringify(versions)}`);
}

if (problems.length) {
  console.error(`✗ Manifest validation failed (${problems.length} problem${problems.length > 1 ? 's' : ''}):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('✓ Manifests valid (chrome + firefox), versions in sync at ' + distinct[0]);
