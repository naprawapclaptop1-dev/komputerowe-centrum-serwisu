import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePhotoCatalogPublicationContract } from './photo-catalog-publication-contract-fix115.cjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const result=evaluatePhotoCatalogPublicationContract({
  jsOk:true,cssOk:true,manifestOk:true,manifest,
  js:read('WEB_PUBLISH/assets/photo-catalog-fix115.js'),
  css:read('WEB_PUBLISH/assets/photo-catalog-fix109.css'),
  layoutCss:read('WEB_PUBLISH/assets/home-specialist-photo-layout-fix115.css'),
  html:read('WEB_PUBLISH/index.html'),serviceWorker:read('WEB_PUBLISH/service-worker.js'),remoteRelease:release,
  expectedPhotoCatalogBuild:release.photoCatalogRuntimeBuildTag,
  methodRenderer:read('WEB_PUBLISH/assets/service-workshop.js'),
  visualPhotoGuard:read('WEB_PUBLISH/assets/visual-uniqueness-fix83.js'),
  legacyPhotoGuard:read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js')
});
assert.equal(result.valid,true,`FIX115 publication contract failed: ${result.missing.join(', ')}`);
assert.equal(result.modulePhotoSlots,19);
assert.equal(result.specialistPhotoSlots,6);
assert.equal(result.seedPhotoCount,37);
console.log('[PASS] FIX115 runtime, HTML, manifest, PWA cache and release metadata agree.');
console.log('[PASS] 19 module photo slots and six specialist slots are covered by the curated catalog.');
console.log('[PASS] Strict photo policy and specialist containment are part of the production publication contract.');
console.log('FIX129 PHOTO PUBLICATION CONTRACT: 3/3 PASS');
