#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const one = read('ONECLICK_AKADEMIA.js');
const siteManifest = JSON.parse(read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.json'));
const homeManifest = JSON.parse(read('WEB_PUBLISH/assets/homepage-tech-visuals-fix122.json'));
const tags = [...html.matchAll(/<img\b[^>]*data-tech-visual-id="([^"]+)"[^>]*>/gi)].map(m=>m[0]);
const check = (name, fn) => { fn(); console.log(`[PASS] ${name}`); };
check('FIX128 metadata keeps product version 6.8.0 and marks FIX128 current', () => {
  assert.equal(release.productVersion, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX128');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix128-live-tech-visual-publication-20261111');
  assert.ok(html.includes('content="FIX128"'));
  assert.ok(html.includes('Wersja 6.8.0 FIX128'));
});
check('FIX77 academy module checks still validate the 19 dashboard modules and 203 lesson SVGs, not photographs', () => {
  assert.match(watcher, /remoteFix77Manifest\?\.mainDashboardModules\s*===\s*19/);
  assert.match(watcher, /remoteFix77LessonPaths\.length\s*===\s*203/);
  assert.match(watcher, /remoteFix77NewModuleHtml\.length\s*===\s*6/);
  assert.ok(!watcher.includes('remoteFix77PhotoLayoutValid'));
  assert.ok(!watcher.includes('remoteFix77PhotoManifest?.photos?.length===13'));
  assert.ok(!watcher.includes('remoteHomeHeroPhotoIds.length === 3'));
});
check('Watcher remotely fetches and verifies FIX122/FIX123 manifests and runtimes', () => {
  for (const token of ['sitewide-tech-visuals-fix123.js','sitewide-tech-visuals-fix123.json','homepage-tech-only-fix122.js','homepage-tech-visuals-fix122.json','remoteSitewideTechVisualsValid','remoteHomepageAssetChecks.every(Boolean)']) assert.ok(watcher.includes(token), `Missing ${token}`);
  assert.ok(watcher.includes('remoteGlobalAcademyFix77Valid && remoteSitewideTechVisualsValid && remoteGlobalAcademyFix83Valid'));
  assert.ok(watcher.includes('sitewideNoPeopleVisuals: remoteSitewideTechVisualsValid'));
});
check('Remote no-people policy enforces zero people/hands and disabled photo sources', () => {
  assert.equal(siteManifest.peopleVisible, false);
  assert.equal(siteManifest.handsVisible, false);
  assert.equal(siteManifest.externalPhotoProvidersEnabled, false);
  assert.equal(siteManifest.externalImageSourcesEnabled, false);
  assert.equal(siteManifest.externalPhotoCacheEnabled, false);
  assert.ok(watcher.includes("remoteSitewideManifest?.peopleVisible === false"));
  assert.ok(watcher.includes("remoteSitewideManifest?.handsVisible === false"));
  assert.ok(watcher.includes("remoteSitewideManifest?.externalPhotoProvidersEnabled === false"));
});
check('36 homepage SVGs are unique, local, technical-only and blocked from photo assignment', () => {
  assert.equal(homeManifest.totalImages, 36);
  assert.equal(homeManifest.images.length, 36);
  assert.equal(tags.length, 36);
  assert.equal(new Set(homeManifest.images.map(x=>x.id)).size, 36);
  assert.equal(new Set(homeManifest.images.map(x=>x.path)).size, 36);
  assert.ok(homeManifest.images.every(x=>x.humanSubjectsAllowed === false && x.kind === 'local-svg-technical-illustration'));
  for (const tag of tags) {
    assert.match(tag, /data-photo-ignore="true"/);
    assert.match(tag, /data-photo-eligible="false"/);
    assert.match(tag, /src="assets\/artwork-fix(?:77|51)\/[^"]+\.svg"/);
  }
});
check('Service Worker keeps FIX127 cache because FIX128 changes publisher-only code, not browser assets', () => {
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  assert.equal(release.serviceWorkerCacheName, 'nauka-6.8.0-fix127-portable-sha256-20261111');
  assert.equal(release.fix128_live_technical_visual_publication.serviceWorkerCacheChanged, false);
  assert.ok(sw.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123'));
  assert.ok(!sw.includes('PHOTO_LIBRARY_CACHE_NAME'));
});
check('OneClick and Watcher require the FIX128 remote visual regression before deploy', () => {
  assert.ok(one.includes("releaseJson.latestHotfix !== 'FIX128'"));
  assert.ok(one.includes('scripts/test-watcher-live-tech-visual-contract-fix128.mjs'));
  assert.ok(watcher.includes('scripts/test-watcher-live-tech-visual-contract-fix128.mjs'));
  assert.ok(watcher.includes('FIX128: LIVE NO-PEOPLE VISUAL CONTRACT'));
});
check('Both publisher scripts have valid JavaScript syntax', () => {
  for (const rel of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']) {
    const r = spawnSync(process.execPath, ['--check', path.join(ROOT, rel)], {encoding:'utf8'});
    assert.equal(r.status, 0, `${rel}: ${r.stderr || r.stdout}`);
  }
});
console.log('FIX128 LIVE NO-PEOPLE / TECHNICAL VISUAL PUBLICATION CONTRACT: 8/8 PASS');
