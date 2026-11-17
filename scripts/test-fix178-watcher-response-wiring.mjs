import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/release.json'), 'utf8'));
function check(name, fn) {
  try { fn(); console.log(`[PASS] ${name}`); }
  catch (error) { console.error(`[FAIL] ${name}: ${error.message}`); process.exitCode = 1; }
}
check('FIX178 dopasowuje dziewięć zmiennych odpowiedzi do dziewięciu zapytań Promise.all', () => {
  const start = watcher.indexOf('const [remoteFix77PhotoRuntimeResponse');
  const end = watcher.indexOf(']);', start);
  assert.ok(start >= 0 && end > start, 'Nie znaleziono grupy odpowiedzi FIX77/FIX129');
  const block = watcher.slice(start, end);
  const declared = block.match(/remotePhotoPolicyRuntimeResponse\] = await Promise\.all\(\[/);
  const requests = block.match(/\bfetch\s*\(/g) || [];
  assert.ok(declared, 'Brak dziewiątej zmiennej remotePhotoPolicyRuntimeResponse');
  assert.equal(requests.length, 9, `Oczekiwano 9 fetch(), znaleziono ${requests.length}`);
});
check('FIX178 odczytuje kopię odpowiedzi, zachowując oryginał do kontraktu FIX115', () => {
  assert.match(watcher, /remotePhotoPolicyRuntimeResponse\.clone\(\)\.text\(\)/);
  assert.match(watcher, /const remotePhotoCatalogJsResponse = remotePhotoPolicyRuntimeResponse;/);
  assert.match(watcher, /const remotePhotoCatalogJs = remotePhotoPolicyRuntime;/);
});
check('FIX178 używa jednego pobrania photo-catalog-fix115.js bez drugiego żądania', () => {
  const requests = watcher.match(/fetch\(`\$\{STABLE_URL\}\/assets\/photo-catalog-fix115\.js\?v=6\.8\.0-fix136/g) || [];
  assert.equal(requests.length, 1, `Wykryto ${requests.length} pobrania katalogu zdjęć`);
  const laterStart = watcher.indexOf('const [remoteHomePrimeJsResponse');
  const laterEnd = watcher.indexOf('const remotePhotoCatalogJsResponse = remotePhotoPolicyRuntimeResponse;', laterStart);
  assert.ok(laterStart >= 0 && laterEnd > laterStart);
  assert.doesNotMatch(watcher.slice(laterStart, laterEnd), /photo-catalog-fix115\.js/);
});
check('FIX178 zachowuje wersję produktu i historyczne metadane FIX176', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX176');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
  assert.match(watcher, /photoLibrary:\s*remoteHomePhotoLibrary/);
});
if (!process.exitCode) console.log('FIX178 WATCHER RESPONSE WIRING: 4/4 PASS');
