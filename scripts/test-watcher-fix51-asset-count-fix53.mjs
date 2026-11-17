import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const {
  FIX51_VISUAL_ASSET_EXPECTED,
  collectFix51VisualAssetPaths,
  verifyFix51VisualAssetProbes
} = require('./fix51-visual-asset-verification-fix53.cjs');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/release-contract-fix51.json'), 'utf8'));
const visual = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/assets/visual-asset-manifest-fix51.json'), 'utf8'));
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const oneclick = fs.readFileSync(path.join(root, 'ONECLICK_AKADEMIA.js'), 'utf8');

const set = collectFix51VisualAssetPaths(release, visual);
assert.equal(set.valid, true, `Manifest wizualny nie jest kompletny: ${set.errors.join('; ')}`);
assert.deepEqual(set.counts, { photos: 12, posters: 3, illustrations: 18, total: 33 });
assert.equal(set.paths.length, FIX51_VISUAL_ASSET_EXPECTED.total);
assert.equal(new Set(set.paths).size, 33, 'Wszystkie ścieżki wizualne muszą być unikalne.');

for (const asset of set.paths) {
  const full = path.join(root, 'WEB_PUBLISH', asset);
  assert.ok(fs.existsSync(full), `Brak lokalnego zasobu: ${asset}`);
  assert.ok(fs.statSync(full).size > 0, `Pusty lokalny zasób: ${asset}`);
}

assert.equal(verifyFix51VisualAssetProbes(set.paths, Array(33).fill(true)), true,
  '33 poprawne odpowiedzi HTTP muszą zaliczyć kontrolę.');
assert.equal(verifyFix51VisualAssetProbes(set.paths, Array(30).fill(true)), false,
  '30 wyników nie może zaliczyć kontroli listy 33 zasobów.');
const failed = Array(33).fill(true); failed[17] = false;
assert.equal(verifyFix51VisualAssetProbes(set.paths, failed), false,
  'Jeden niedostępny zasób musi blokować potwierdzenie publikacji.');
assert.equal(verifyFix51VisualAssetProbes(set.paths.slice(0, 32), Array(32).fill(true)), false,
  'Lista krótsza niż 33 zasoby musi zostać odrzucona.');

const invalidManifest = { ...release, localPosters: release.localPosters.slice(0, 2) };
const invalidSet = collectFix51VisualAssetPaths(invalidManifest, visual);
assert.equal(invalidSet.valid, false, 'Brak plakatu musi unieważnić kontrakt.');
assert.ok(invalidSet.errors.some(error => error.includes('posters=2')));

assert.ok(watcher.includes('collectFix51VisualAssetPaths'));
assert.ok(watcher.includes('verifyFix51VisualAssetProbes'));
assert.ok(watcher.includes('remoteVisualAssetCount=${remoteVisualAssetCount}'));
assert.ok(watcher.includes('remoteVisualAssetsMissing=${remoteVisualAssetsMissing.join'));
assert.ok(!/checks\.length\s*===\s*30/.test(watcher), 'Watcher nie może oczekiwać 30 wyników dla 33 ścieżek.');
assert.ok(oneclick.includes('scripts/test-watcher-fix51-asset-count-fix53.mjs'));

console.log('[PASS] FIX51: 12 zdjęć + 3 plakaty + 18 ilustracji = 33 zasoby.');
console.log('[PASS] 33/33 pozytywne odpowiedzi zaliczają kontrolę publikacji.');
console.log('[PASS] Wynik 30/33, brakujący zasób i niepełny manifest blokują publikację.');
console.log('[PASS] Każdy z 33 plików istnieje w lokalnym WEB_PUBLISH.');
console.log('[PASS] Watcher raportuje liczbę zasobów i listę braków; usunięto błędny limit 30.');
console.log('[PASS] ONECLICK uruchamia regresję FIX53 przed publikacją.');
console.log('FIX53 WATCHER ASSET COUNT: 6/6 PASS');
