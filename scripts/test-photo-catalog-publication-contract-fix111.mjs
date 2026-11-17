import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const require = createRequire(import.meta.url);
const { evaluatePhotoCatalogPublicationContract } = require('./photo-catalog-publication-contract-fix111.cjs');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix111.js');
const css = read('WEB_PUBLISH/assets/photo-catalog-fix109.css');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const renderer = read('WEB_PUBLISH/assets/service-workshop.js');
const visual = read('WEB_PUBLISH/assets/visual-uniqueness-fix83.js');
const legacy = read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js');
const result = evaluatePhotoCatalogPublicationContract({
  jsOk:true, cssOk:true, manifestOk:true, manifest, js:runtime, css, html,
  serviceWorker:sw, remoteRelease:release,
  expectedPhotoCatalogBuild:release.photoCatalogRuntimeBuildTag,
  methodRenderer:renderer, visualPhotoGuard:visual, legacyPhotoGuard:legacy
});
assert.equal(result.valid, true, `Kontrakt FIX111 nie przechodzi: ${result.missing.join(', ')}`);
assert.equal(result.moduleCards, 19);
assert.equal(result.modulePhotoSlots, 15);
assert.equal(result.specialistPhotoSlots, 6);
assert.equal(result.seedPhotoCount, 37);
assert.equal(result.methodPhotoSlots, 147);
for (const [slot, seedId] of Object.entries(manifest.homepageSlotSeedMap)) {
  const seed = manifest.photos.find(photo => photo.id === seedId);
  assert.ok(seed, `Brak zdjęcia ${seedId} dla ${slot}`);
  assert.equal(seed.category, require('./photo-catalog-publication-contract-fix111.cjs').EXPECTED_SLOT_CATEGORIES[slot], `Nieprawidłowa kategoria dla ${slot}`);
}
console.log('[PASS] 21 homepage slots resolve to unique real curated seed photos with matching categories.');
console.log('[PASS] 19 module cards, 15 module photo slots, 6 specialist photo slots and 147 method slots are covered.');
console.log('[PASS] FIX111 runtime, HTML, manifest, release metadata and PWA cache agree.');
console.log('FIX111 PHOTO CATALOG PUBLICATION CONTRACT SUMMARY: 3/3 PASS');
