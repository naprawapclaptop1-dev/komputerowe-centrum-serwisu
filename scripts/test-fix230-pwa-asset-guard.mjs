import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { verifyHtmlAssetsInServiceWorker } = require('./fix230-pwa-asset-guard.cjs');
const webRoot = path.resolve('WEB_PUBLISH');
const html = fs.readFileSync(path.join(webRoot, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(webRoot, 'service-worker.js'), 'utf8');
const assets = [
  'assets/academy-workshop-3d-fix199.js',
  'assets/academy-workshop-3d-fix199.css',
  'assets/academy-hardware-import-fix198.js',
  'assets/academy-hardware-import-fix198.css',
  'assets/academy-teacher-dashboard-fix201.css',
  'assets/cloud-academy.js',
  'assets/academy-admin-center-fix209.js',
  'assets/academy-admin-center-fix209.css'
];
const ok = verifyHtmlAssetsInServiceWorker({ html, serviceWorker, webRoot, assets });
assert.equal(ok.ok, true, ok.errors.join('; '));
assert.equal(ok.references['assets/academy-workshop-3d-fix199.js'].html, 'assets/academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import');
assert.equal(ok.references['assets/cloud-academy.js'].html, 'assets/cloud-academy.js?v=6.8.0-fix221-revision-sync');
console.log('[PASS] aktualne adresy HTML/PWA z FIX225 i FIX221 są zgodne');

const current3d = ok.references['assets/academy-workshop-3d-fix199.js'].html;
const wrongServiceWorker = serviceWorker.replace(`/${current3d}`, '/assets/academy-workshop-3d-fix199.js?v=6.8.0-old-fix206');
assert.equal(verifyHtmlAssetsInServiceWorker({ html, serviceWorker: wrongServiceWorker, webRoot, assets }).ok, false);
console.log('[PASS] rozbieżna wersja Service Worker jest odrzucana');

const missingHtml = html.replace(/<script[^>]+academy-workshop-3d-fix199\.js[^>]*><\/script>/, '');
assert.equal(verifyHtmlAssetsInServiceWorker({ html: missingHtml, serviceWorker, webRoot, assets }).ok, false);
console.log('[PASS] brak zasobu w HTML jest odrzucany');

const noVersion = html.replace('academy-workshop-3d-fix199.css?v=6.8.0-fix206', 'academy-workshop-3d-fix199.css');
assert.equal(verifyHtmlAssetsInServiceWorker({ html: noVersion, serviceWorker, webRoot, assets }).ok, false);
console.log('[PASS] brak parametru wersji ?v= jest odrzucany');

const missingLocal = verifyHtmlAssetsInServiceWorker({ html, serviceWorker, webRoot, assets: [...assets, 'assets/nonexistent-fix230.js'] });
assert.equal(missingLocal.ok, false);
assert.ok(missingLocal.errors.some(error => error.includes('nonexistent-fix230.js')));
console.log('[PASS] brakujący plik lokalny jest odrzucany');

console.log('FIX230 PWA ASSET PARITY: 5/5 PASS');
