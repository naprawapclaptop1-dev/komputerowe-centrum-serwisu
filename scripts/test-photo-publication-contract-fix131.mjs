#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { evaluatePhotoCatalogPublicationContract } from './photo-catalog-publication-contract-fix115.cjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const release=json('WEB_PUBLISH/release.json');
const manifest=json('WEB_PUBLISH/media/photo-sources-online.json');
const library=json('WEB_PUBLISH/media/home-photo-library-fix118.json');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const runtime=read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const r=evaluatePhotoCatalogPublicationContract({
  jsOk:true,cssOk:true,manifestOk:true,manifest,
  js:runtime,
  css:read('WEB_PUBLISH/assets/photo-catalog-fix109.css'),
  layoutCss:read('WEB_PUBLISH/assets/home-specialist-photo-layout-fix115.css'),
  html,serviceWorker:sw,remoteRelease:release,
  expectedPhotoCatalogBuild:release.photoCatalogRuntimeBuildTag,
  methodRenderer:read('WEB_PUBLISH/assets/service-workshop.js'),
  visualPhotoGuard:read('WEB_PUBLISH/assets/visual-uniqueness-fix83.js'),
  legacyPhotoGuard:read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js'),
  photoLibrary:library
});
assert.equal(r.valid,true,`FIX176 same-origin photo publication contract failed: ${r.missing.join(', ')}`);
assert.equal(Object.keys(manifest.homepageSlotSeedMap).length,19);
assert.equal(new Set(Object.values(manifest.homepageSlotSeedMap)).size,19);
assert.equal(library.entries.length,19);
assert.equal(new Set(library.entries.map(entry=>entry.assetUrl)).size,19);
assert.ok(library.entries.every(entry=>manifest.homepageSlotSeedMap[entry.slotId]===entry.seedId));
assert.ok(library.entries.every(entry=>entry.assetUrl===`/media/photos/${entry.seedId}.jpg` && entry.sourceAsset.startsWith('https://') && entry.sourcePage.startsWith('https://') && entry.creator && entry.license && entry.licenseUrl.startsWith('https://')));
assert.equal(library.hotfix,'FIX135');
assert.equal(library.cacheName,'academy-photo-library-fix135');
assert.equal(release.latestHotfix,'FIX176');
assert.equal(release.latestHotfixBuild,'6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
assert.equal(release.photoCatalogRuntimeBuildTag,'6.8.0-fix136-top-photo-priority-practice-lessons-20261114');
assert.equal(release.fix118_local_photo_library.d1Migrations,'none');
assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
assert.ok(sw.includes(`const CACHE_NAME = 'nauka-${release.latestHotfixBuild}'`));
assert.ok(html.includes('assets/homepage-photo-prime-fix118.js?v=6.8.0-fix136'));
assert.ok(html.includes('assets/photo-catalog-fix115.js?v=6.8.0-fix136'));
console.log('[PASS] FIX176 zachowuje 19 unikalnych zdjęć z przypisaniem do wszystkich 19 właściwych slotów.');
console.log('[PASS] Metadane autora, licencji, kategorii i oryginalnego źródła są kompletne.');
console.log('[PASS] Aktywny runtime zdjęć FIX136 i osobny cache zdjęć FIX135 są zachowane pod nowym cache aplikacji FIX176.');
console.log('[PASS] PWA korzysta z proxy same-origin; obrazy mają bezpieczny fallback SVG.');
console.log('[PASS] Brak migracji D1 i resetu biblioteki zdjęć.');
console.log('FIX176 PHOTO PUBLICATION CONTRACT: 5/5 PASS');
