import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const publisher = read('ONECLICK_AKADEMIA.js');
const runtime = read('WEB_PUBLISH/assets/master-service-center-fix44.js');
const css = read('WEB_PUBLISH/assets/master-service-center-fix44.css');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');

const requiredTokens = [
  'Laptop Identification PRO', 'BIOS Database 360', 'Thermal Diagnostic PRO',
  'CPU GPU Architecture Academy', 'Battery & Charging Lab', 'Data Recovery Academy',
  'Network & Router Academy', '3D Electronics Explorer', 'Repair Case Marketplace',
  'Service Manager', 'AI Learning Coach', 'Quality Center', 'Repair Simulator WORLD',
  'Universal Technical Library', 'Global Knowledge Update', 'NP_NAUKA_FIX44'
];
const runtimeLower = runtime.toLowerCase();
for (const token of requiredTokens) {
  assert.ok(runtimeLower.includes(token.toLowerCase()), `FIX44 runtime missing ${token}`);
}
for (const selector of ['.f44-page-head', '.f44-tabs', '.f44-grid', '.f44-board-wrap', '.f44-qa-results']) {
  assert.ok(css.includes(selector), `FIX44 CSS missing ${selector}`);
}
assert.ok(html.includes('id="view-fix44"') && html.includes('data-view="fix44"'));
assert.match(watcher, /const\s+fix44RuntimeLower\s*=\s*fix44Runtime\.toLowerCase\(\)/);
assert.match(watcher, /fix44RequiredTokens\.every\(token\s*=>\s*fix44RuntimeLower\.includes\(token\.toLowerCase\(\)\)\)/);
assert.match(watcher, /remoteFix44Tokens\.every\(token=>remoteFix44Js\.toLowerCase\(\)\.includes\(token\.toLowerCase\(\)\)\)/);
assert.match(publisher, /fix44Runtime\.toLowerCase\(\)\.includes\(token\.toLowerCase\(\)\)/);
assert.ok(watcher.includes('test-watcher-fix44-case-contract-fix46.mjs'));
assert.ok(publisher.includes('test-watcher-fix44-case-contract-fix46.mjs'));
assert.match(sw, /CACHE_NAME[^\n]*fix79-pwa-cache-20261106/, 'PWA cache name must use current FIX79 namespace');
assert.ok(watcher.includes("swCacheName.includes('fix79-pwa-cache-20261106')"), 'local watcher must require the current FIX79 PWA cache marker');
assert.ok(watcher.includes("remoteServiceWorker.includes('fix46-publication-guard-20261104')"), 'remote watcher must require the FIX46 PWA cache marker');
assert.ok(publisher.includes("swCacheName.includes('fix79-pwa-cache-20261106')"), 'OneClick must require the current FIX79 PWA cache marker');
console.log('PASS FIX46: FIX44 required runtime labels are checked case-insensitively.');
console.log('PASS FIX46: FIX44 CSS, HTML navigation, publisher and remote guard checks remain enforced.');
console.log('PASS FIX46: the regression test is mandatory in watcher and OneClick preflight.');
