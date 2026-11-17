import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = process.cwd();
const web = path.join(root, 'WEB_PUBLISH');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const require = createRequire(import.meta.url);
const evaluate = require('./photo-catalog-publication-contract-fix115.cjs').evaluatePhotoCatalogPublicationContract;

function check(name, fn) {
  try { fn(); console.log(`[PASS] ${name}`); }
  catch (error) { console.error(`[FAIL] ${name}: ${error.message}`); process.exitCode = 1; }
}

check('FIX177 przekazuje pobraną bibliotekę zdjęć do kontraktu FIX176', () => {
  const start = watcher.indexOf('const photoCatalogPublicationCheck = evaluatePhotoCatalogPublicationContractFix115({');
  assert.ok(start >= 0);
  const end = watcher.indexOf('\n      });', start);
  const call = watcher.slice(start, end);
  assert.match(call, /photoLibrary:\s*remoteHomePhotoLibrary/);
  assert.match(watcher, /const remotePhotoCatalogJs = remotePhotoPolicyRuntime;/);
  assert.match(watcher, /const \[remoteHomePrimeJsResponse, remoteHomePrimeCssResponse, remotePhotoCatalogCssResponse, remotePhotoLayoutCssResponse, remotePhotoSourcesResponse, remoteHomePhotoLibraryResponse\]/);
});

check('FIX177 utrzymuje jedno pobranie skryptu katalogu zdjęć w całym watcherze', () => {
  const matches = watcher.match(/fetch\(`\$\{STABLE_URL\}\/assets\/photo-catalog-fix115\.js\?v=6\.8\.0-fix136/g) || [];
  assert.equal(matches.length, 1);
});

check('rzeczywisty lokalny kontrakt FIX176 zdjęć przechodzi z przekazaną biblioteką 19 slotów', () => {
  const release = JSON.parse(fs.readFileSync(path.join(web, 'release.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(web, 'media/photo-sources-online.json'), 'utf8'));
  const photoLibrary = JSON.parse(fs.readFileSync(path.join(web, 'media/home-photo-library-fix118.json'), 'utf8'));
  const result = evaluate({
    jsOk: true, cssOk: true, manifestOk: true,
    manifest,
    js: fs.readFileSync(path.join(web, 'assets/photo-catalog-fix115.js'), 'utf8'),
    css: fs.readFileSync(path.join(web, 'assets/photo-catalog-fix109.css'), 'utf8'),
    layoutCss: fs.readFileSync(path.join(web, 'assets/home-specialist-photo-layout-fix115.css'), 'utf8'),
    html: fs.readFileSync(path.join(web, 'index.html'), 'utf8'),
    serviceWorker: fs.readFileSync(path.join(web, 'service-worker.js'), 'utf8'),
    remoteRelease: release,
    expectedPhotoCatalogBuild: release.photoCatalogRuntimeBuildTag,
    methodRenderer: fs.readFileSync(path.join(web, 'assets/service-workshop.js'), 'utf8'),
    visualPhotoGuard: fs.readFileSync(path.join(web, 'assets/visual-uniqueness-fix83.js'), 'utf8'),
    legacyPhotoGuard: '',
    photoLibrary
  });
  assert.equal(result.valid, true, result.missing.join(', '));
  assert.equal(result.modulePhotoSlots, 19);
  assert.equal(result.seedPhotoCount, 37);
});

check('FIX177 nie zmienia wersji produktu, konfiguracji D1 ani danych Gemini', () => {
  const release = JSON.parse(fs.readFileSync(path.join(web, 'release.json'), 'utf8'));
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX176');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix176-global-academy-rescue-and-master-launch-20261115');
  assert.match(watcher, /6ac0a922-639c-43ee-ba33-5da14c25a533/);
  assert.doesNotMatch(watcher, /DROP TABLE|DELETE FROM|wrangler d1 migrations apply/);
});

if (!process.exitCode) console.log('FIX177 PUBLISHER PHOTO-LIBRARY WIRING: 4/4 PASS');
