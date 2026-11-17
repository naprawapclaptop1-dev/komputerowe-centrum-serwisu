import fs from 'node:fs';
import assert from 'node:assert/strict';
const oneClick = fs.readFileSync('ONECLICK_AKADEMIA.js', 'utf8');
const watcher = fs.readFileSync('AUTO_PUBLISH_WATCHER.js', 'utf8');
const release = JSON.parse(fs.readFileSync('WEB_PUBLISH/release.json', 'utf8'));
const required = [
  'scripts/fix230-pwa-asset-guard.cjs',
  'scripts/test-fix230-pwa-asset-guard.mjs',
  'scripts/test-fix230-publisher-guard.mjs',
  'scripts/run-tests-fix220-230.mjs',
  'TESTY_FIX220_FIX230.cmd',
  'README_FIX230_PUBLISHER_ASSET_PARITY.md',
  'CHANGELOG_6.8.0_FIX230.txt',
  'FIX230_IMPLEMENTATION_AUDIT.txt'
];
for (const file of required) assert.ok(fs.existsSync(file), `brak ${file}`);
for (const [name, source] of [['OneClick', oneClick], ['Auto Publisher Watcher', watcher]]) {
  assert.ok(source.includes("require('./scripts/fix230-pwa-asset-guard.cjs')"), `${name} importuje wspólny walidator`);
  assert.ok(source.includes('verifyHtmlAssetsInServiceWorker'), `${name} używa walidatora HTML/PWA`);
  assert.ok(source.includes('fix202AssetAudit') && source.includes('fix203AssetAudit'), `${name} kontroluje FIX198–FIX209`);
  assert.ok(source.includes('scripts/run-tests-fix220-230.mjs'), `${name} uruchamia test regresyjny FIX230`);
  assert.ok(source.includes('academyFix230'), `${name} sprawdza metadane FIX230`);
}
assert.equal(release.academyFix230?.hotfix, 'FIX230');
assert.equal(release.academyFix230?.productVersion, '6.8.0');
assert.equal(release.academyFix230?.productionDeployPerformed, false);
console.log('[PASS] pliki FIX230 i metadane wydania istnieją');
console.log('[PASS] OneClick i watcher używają wspólnego walidatora');
console.log('[PASS] oba publishery sprawdzają assety FIX198–FIX209');
console.log('[PASS] oba publishery uruchamiają regresję FIX230');
console.log('[PASS] wersja produktu i status wdrożenia są poprawne');
console.log('FIX230 PUBLISHER GUARD: 5/5 PASS');
