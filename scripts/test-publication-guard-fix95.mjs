import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const require = createRequire(import.meta.url);
const { evaluatePhotoCatalogPublicationContract, RUNTIME_MARKERS } = require('./photo-catalog-publication-contract-fix98.cjs');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const js = read('WEB_PUBLISH/assets/photo-catalog-fix98.js');
const css = read('WEB_PUBLISH/assets/photo-catalog-fix98.css');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const oneClick = read('ONECLICK_AKADEMIA.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }
const base = {
  jsOk: true, cssOk: true, manifestOk: true, manifest, js, css, homeCss: read('WEB_PUBLISH/assets/home-learning-fix75.css'), html,
  serviceWorker: sw, remoteRelease: release,
  expectedPhotoCatalogBuild: release.photoCatalogRuntimeBuildTag
};

check('FIX98: pełny kontrakt katalogu przechodzi na lokalnych zasobach', () => {
  const result = evaluatePhotoCatalogPublicationContract(base);
  assert.equal(result.valid, true, result.missing.join(', '));
  assert.deepEqual(result.missing, []);
  assert.equal(result.moduleCards, 19);
  assert.equal(result.modulePhotoSlots, 15);
  assert.equal(result.specialistPhotoSlots, 6);
  assert.equal(result.seedPhotoCount, 37);
});
check('FIX98: opisowe reguły USB-C, VRAM, RAM i brak generycznego fallbacku są w manifeście', () => {
  assert.ok(manifest.dynamicProvider.strictPortEvidence.includes('USB-C'));
  assert.ok(manifest.dynamicProvider.strictVramEvidence.includes('GDDR'));
  assert.ok(manifest.dynamicProvider.strictRamEvidence.includes('DIMM'));
  assert.equal(manifest.dynamicProvider.noGenericTopicFallback, true);
  assert.match(manifest.dynamicProvider.searches, /category-specific/i);
  for (const token of ['strictPortEvidence', 'noGenericTopicFallback', 'category-specific']) assert.equal(RUNTIME_MARKERS.includes(token), false);
});
check('FIX98: wyłączenie zakazu generycznego fallbacku zatrzymuje publikację', () => {
  const mutated = structuredClone(manifest);
  mutated.dynamicProvider.noGenericTopicFallback = false;
  const result = evaluatePhotoCatalogPublicationContract({ ...base, manifest: mutated });
  assert.equal(result.valid, false);
  assert.ok(result.missing.includes('no_generic_topic_fallback'));
});
check('FIX98: brak dowodów USB-C, VRAM lub RAM nadal blokuje publikację', () => {
  for (const [field, label] of [['strictPortEvidence','strict_usb_c_evidence'],['strictVramEvidence','strict_vram_evidence'],['strictRamEvidence','strict_ram_evidence']]) {
    const mutated = structuredClone(manifest);
    mutated.dynamicProvider[field] = '';
    const result = evaluatePhotoCatalogPublicationContract({ ...base, manifest: mutated });
    assert.ok(result.missing.includes(label), `${field} must block publication`);
  }
});
check('FIX98: brak źródeł fotografii lub duplikat strony/URL blokuje publikację', () => {
  const tooFew = structuredClone(manifest); tooFew.photos = tooFew.photos.slice(0, 36);
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, manifest: tooFew }).missing.includes('verified_seed_photos_37'));
  const duplicate = structuredClone(manifest); duplicate.photos[34].page = duplicate.photos[0].page;
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, manifest: duplicate }).missing.includes('unique_seed_source_pages'));
});
check('FIX98: niekompletna siatka 19 modułów lub 6 specjalizacji blokuje publikację', () => {
  const missingSpecialist = html.replace('data-photo-id="home-specialist-cpu-ram"', 'data-photo-id="home-specialist-removed"');
  const result = evaluatePhotoCatalogPublicationContract({ ...base, html: missingSpecialist });
  assert.ok(result.missing.includes('specialist_photo_slots_6'));
  const missingModule = html.replace('data-photo-id="home-module-19"', 'data-photo-id="home-module-removed"');
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, html: missingModule }).missing.includes('homepage_module_photo_slots_15'));
});
check('FIX98: brak responsywnego CSS zdjęć ścieżek specjalistycznych blokuje publikację', () => {
  const result = evaluatePhotoCatalogPublicationContract({ ...base, homeCss: '' });
  assert.ok(result.missing.includes('specialist_photo_responsive_styles'));
});
check('FIX98: niezgodny runtime, CSS lub manifest HTTP nadal blokuje publikację', () => {
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, jsOk: false }).missing.includes('photo_catalog_js_http'));
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, cssOk: false }).missing.includes('photo_catalog_css_http'));
  assert.ok(evaluatePhotoCatalogPublicationContract({ ...base, manifestOk: false }).missing.includes('photo_sources_manifest_http'));
});
check('FIX98: niezgodny build runtime lub wersja produktu blokuje publikację', () => {
  const wrongBuild = evaluatePhotoCatalogPublicationContract({ ...base, remoteRelease: { ...release, photoCatalogRuntimeBuildTag: '6.8.0-fix97-old-runtime' } });
  assert.ok(wrongBuild.missing.includes('photo_catalog_runtime_build_tag'));
  const wrongVersion = evaluatePhotoCatalogPublicationContract({ ...base, remoteRelease: { ...release, release: '6.7.0' } });
  assert.ok(wrongVersion.missing.includes('remote_product_version_unchanged'));
});
check('FIX98: OneClick i Watcher używają nowej bramki i uruchamiają test zasięgu zdjęć przed publikacją', () => {
  assert.ok(watcher.includes("require('./scripts/photo-catalog-publication-contract-fix98.cjs')"));
  assert.ok(watcher.includes('evaluatePhotoCatalogPublicationContract({'));
  assert.ok(watcher.includes('EXPECTED_PHOTO_CATALOG_BUILD'));
  assert.ok(watcher.includes('photoCatalogMissingChecks='));
  assert.ok(watcher.includes('homeCss: remoteHomeFix75Css'));
  for (const source of [oneClick, watcher]) {
    assert.ok(source.includes("'scripts/test-home-module-photo-coverage-fix99.mjs'"));
    assert.ok(source.includes('FIX98'));
  }
});
console.log(`FIX98 PHOTO PUBLICATION CONTRACT SUMMARY: ${checks.length}/${checks.length} PASS`);
