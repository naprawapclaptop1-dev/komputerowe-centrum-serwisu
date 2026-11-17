#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { verifyPhotoMetadataFilterRuntime } = require('./photo-publication-guard-fix130.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const catalog = read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const homepagePrime = read('WEB_PUBLISH/assets/homepage-photo-prime-fix118.js');
const policy = JSON.parse(read('WEB_PUBLISH/assets/equipment-photo-policy-fix129.json'));
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`[PASS] ${name}`); };

check('metadata filter is verified against the actual photo-catalog runtime', () => {
  const result = verifyPhotoMetadataFilterRuntime({ responseOk: true, source: catalog });
  assert.equal(result.valid, true);
  assert.deepEqual(result.missing, []);
  assert.ok(catalog.includes('function hasHumanSubjectMetadata') || catalog.includes('function hasHumanSubjectMetadata(') || catalog.includes('hasHumanSubjectMetadata'));
  assert.ok(catalog.includes('NO_HUMAN_SUBJECT_RE'));
});
check('homepage bootstrap is not mistaken for the owner of the catalog filter', () => {
  assert.ok(homepagePrime.includes('curated-equipment-photographs-with-local-svg-fallback'));
  assert.ok(!homepagePrime.includes('NO_HUMAN_SUBJECT_RE'));
  assert.ok(!homepagePrime.includes('hasHumanSubjectMetadata'));
  assert.equal(verifyPhotoMetadataFilterRuntime({ responseOk: true, source: homepagePrime }).valid, false);
});
check('remote watcher fetches the right runtime and uses the catalog-filter contract', () => {
  assert.ok(watcher.includes('/assets/photo-catalog-fix115.js?v=6.8.0-fix129&verify='));
  assert.ok(watcher.includes('verifyPhotoMetadataFilterRuntime({ responseOk: remotePhotoPolicyRuntimeResponse.ok, source: remotePhotoPolicyRuntime })'));
  assert.ok(watcher.includes('remotePhotoPolicyFilterContract.valid'));
  assert.ok(watcher.includes('photoPolicyFilterMissing='));
  assert.ok(!watcher.includes("every(token=>remoteHomepageGuard.includes(token) || remoteSitewideGuard.includes(token))"));
});
check('failed/missing runtime markers still block a deployment instead of bypassing photo safety', () => {
  const incomplete = verifyPhotoMetadataFilterRuntime({ responseOk: true, source: 'FIX129 hasHumanSubjectMetadata' });
  assert.equal(incomplete.valid, false);
  assert.deepEqual(incomplete.missing, ['NO_HUMAN_SUBJECT_RE']);
  assert.equal(verifyPhotoMetadataFilterRuntime({ responseOk: false, source: catalog }).valid, false);
  assert.equal(policy.peopleVisible, false);
  assert.equal(policy.handsVisible, false);
});
check('publisher preflight and release metadata identify FIX130 without changing product/photo runtime versions', () => {
  const release = JSON.parse(read('WEB_PUBLISH/release.json'));
  const html = read('WEB_PUBLISH/index.html');
  const one = read('ONECLICK_AKADEMIA.js');
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX130');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix130-photo-publication-guard-repair-20261113');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix129-equipment-only-photo-filter-20261113');
  assert.ok(html.includes('content="FIX130"'));
  assert.ok(one.includes("releaseJson.latestHotfix !== 'FIX130'"));
  assert.ok(one.includes('scripts/run-tests-fix130.mjs'));
});
console.log(`FIX130 PHOTO PUBLICATION GUARD: ${passed}/${passed} PASS`);
