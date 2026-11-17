#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupLegacyPhotoProxy } from './cleanup-pages-function-residue-fix133.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const publisher = fs.readFileSync(path.join(ROOT, 'ONECLICK_AKADEMIA.js'), 'utf8');
const watcher = fs.readFileSync(path.join(ROOT, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
assert.equal(release.latestHotfix, 'FIX176');
assert.equal(release.fix133_stale_pages_function_residue_cleanup?.hotfix, 'FIX133');
assert.ok(publisher.includes('scripts/run-tests-fix176.mjs'));
assert.ok(watcher.includes('scripts/run-tests-fix176.mjs'));
console.log('[PASS] OneClick and Watcher use the FIX165 regression preflight; website runtime remains preserved beneath active FIX176 release; FIX133 residue cleanup remains preserved.');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'nauka-fix133-'));
try {
  const fn = path.join(temp, 'functions');
  const routeDir = path.join(fn, 'media', 'photos');
  fs.mkdirSync(routeDir, { recursive: true });
  const oldPath = path.join(fn, '_photo-proxy-fix131.mjs');
  const currentPath = path.join(fn, '_photo-proxy-fix131.js');
  const routePath = path.join(routeDir, '[id].js');
  fs.writeFileSync(oldPath, 'legacy helper bytes\n');
  fs.writeFileSync(currentPath, 'export function serveCuratedPhotoFix131() {}\n');
  fs.writeFileSync(routePath, "import { serveCuratedPhotoFix131 } from '../../_photo-proxy-fix131.js';\n");

  const result = cleanupLegacyPhotoProxy(temp);
  assert.equal(result.status, 'quarantined');
  assert.equal(result.moved, true);
  assert.equal(fs.existsSync(oldPath), false);
  assert.equal(fs.readFileSync(path.join(temp, result.backup), 'utf8'), 'legacy helper bytes\n');
  console.log('[PASS] obsolete .mjs helper is quarantined outside functions/ without losing its bytes.');

  const second = cleanupLegacyPhotoProxy(temp);
  assert.equal(second.status, 'clean');
  console.log('[PASS] cleanup is idempotent and does not create duplicate backups.');

  const unsafe = fs.mkdtempSync(path.join(os.tmpdir(), 'nauka-fix133-unsafe-'));
  try {
    const unsafeFn = path.join(unsafe, 'functions');
    fs.mkdirSync(unsafeFn, { recursive: true });
    fs.writeFileSync(path.join(unsafeFn, '_photo-proxy-fix131.mjs'), 'must stay');
    assert.throws(() => cleanupLegacyPhotoProxy(unsafe), /supported \.js photo helper is missing/);
    assert.equal(fs.readFileSync(path.join(unsafeFn, '_photo-proxy-fix131.mjs'), 'utf8'), 'must stay');
    console.log('[PASS] cleanup refuses to move a legacy file when the supported .js helper is missing.');
  } finally {
    fs.rmSync(unsafe, { recursive: true, force: true });
  }

  const unsafeRoute = fs.mkdtempSync(path.join(os.tmpdir(), 'nauka-fix133-route-'));
  try {
    const unsafeFn = path.join(unsafeRoute, 'functions');
    const unsafeRouteDir = path.join(unsafeFn, 'media', 'photos');
    fs.mkdirSync(unsafeRouteDir, { recursive: true });
    fs.writeFileSync(path.join(unsafeFn, '_photo-proxy-fix131.mjs'), 'must stay');
    fs.writeFileSync(path.join(unsafeFn, '_photo-proxy-fix131.js'), 'active helper');
    fs.writeFileSync(path.join(unsafeRouteDir, '[id].js'), 'import from old helper');
    assert.throws(() => cleanupLegacyPhotoProxy(unsafeRoute), /does not import the supported \.js helper/);
    assert.equal(fs.existsSync(path.join(unsafeFn, '_photo-proxy-fix131.mjs')), true);
    console.log('[PASS] cleanup refuses to move the file when the active route is not verified.');
  } finally {
    fs.rmSync(unsafeRoute, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('FIX133 LEGACY PAGES FUNCTION CLEANUP: 5/5 PASS');
