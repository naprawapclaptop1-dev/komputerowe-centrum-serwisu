import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = p => fs.readFileSync(p, 'utf8');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const oldUrl = 'academy-master-curriculum-fix162.js?v=6.8.0-fix165-gemini-v1';
const newUrl = 'academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification';
const checks = [
  ['HTML uses FIX229 certificate asset', html.includes(newUrl)],
  ['Service Worker precaches same FIX229 asset', sw.includes('/assets/' + newUrl)],
  ['old certificate asset query removed from active HTML/PWA', !html.includes(oldUrl) && !sw.includes(oldUrl)],
  ['release metadata identifies FIX229 and version 6.8.0', release.academyFix229?.hotfix === 'FIX229' && release.academyFix229?.productVersion === '6.8.0'],
  ['OneClick publisher checks FIX229 URL and metadata', publisher.includes(newUrl) && publisher.includes('academyFix229')],
  ['Auto-Watcher checks FIX229 URL and metadata', watcher.includes(newUrl) && watcher.includes('academyFix229')],
  ['historic cache names remain unchanged', sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'") && sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")]
];
for (const [name, ok] of checks) { console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}`); assert.ok(ok, name); }
console.log(`FIX229 CERTIFICATE CACHE: ${checks.length}/${checks.length} PASS`);
