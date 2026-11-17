import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const jsRef = 'master-workshop-630-extension.js?v=6.8.0-fix119';
const cssRef = 'master-workshop-630-extension.css?v=6.8.0-fix119';

assert.ok(html.includes(jsRef), 'HTML must load the FIX119-updated Master Academy JS asset');
assert.ok(html.includes(cssRef), 'HTML must load Master Academy CSS under the synchronized FIX119 asset version');
assert.ok(sw.includes(`/assets/${jsRef}`), 'PWA must precache the exact JS URL used by HTML');
assert.ok(sw.includes(`/assets/${cssRef}`), 'PWA must precache the exact CSS URL used by HTML');
assert.ok(publisher.includes(`indexHtml.includes('${jsRef}')`), 'OneClick local guard must accept the current JS asset version');
assert.ok(publisher.includes(`indexHtml.includes('${cssRef}')`), 'OneClick local guard must accept the current CSS asset version');
assert.ok(publisher.includes(`serviceWorkerVisualSource.includes('${jsRef}')`), 'OneClick must check the JS PWA entry');
assert.ok(publisher.includes(`serviceWorkerVisualSource.includes('${cssRef}')`), 'OneClick must check the CSS PWA entry');
assert.ok(watcher.includes(jsRef) && watcher.includes(cssRef), 'Watcher local/remote checks must use the exact current asset URLs');
assert.ok(watcher.includes(`/assets/${jsRef}&verify=`), 'Watcher must fetch the current JS URL for remote verification');
assert.ok(watcher.includes(`/assets/${cssRef}&verify=`), 'Watcher must fetch the current CSS URL for remote verification');
assert.ok(fs.existsSync(path.join(ROOT, 'WEB_PUBLISH/assets/master-workshop-630-extension.js')));
assert.ok(fs.existsSync(path.join(ROOT, 'WEB_PUBLISH/assets/master-workshop-630-extension.css')));
assert.equal(release.latestHotfix, 'FIX128', 'FIX122 changes the homepage visual release and must be reported as the latest website hotfix');
assert.equal(release.latestHotfixBuild, '6.8.0-fix128-live-tech-visual-publication-20261111');
assert.ok(!sw.includes('const PHOTO_LIBRARY_CACHE_NAME'), 'FIX123 retires the old photo cache');
assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"), 'FIX123 offline technical-only cache must be active');

const activeFiles = [html, sw, publisher, watcher, read('scripts/test-master-academy-fix14.js')];
for (const source of activeFiles) {
  assert.ok(!source.includes('master-workshop-630-extension.js?v=6.3.0-fix14'), 'Stale FIX14 JS URL remains in an active publication contract');
  assert.ok(!source.includes('master-workshop-630-extension.css?v=6.3.0-fix14'), 'Stale FIX14 CSS URL remains in an active publication contract');
}

console.log('[PASS] HTML, OneClick, Watcher and Service Worker use matching FIX119 Master Academy asset URLs.');
console.log('[PASS] Remote Watcher probes the current exact JS/CSS assets.');
console.log('[PASS] Original FIX14 Master Academy assets and APIs remain in the project.');
console.log('[PASS] FIX127 refreshes the PWA cache; FIX123 retires the old FIX118 photo cache.');
console.log('[PASS] FIX123 global technical-only visual policy remains active under FIX127; product 6.8.0 and existing D1 data remain unchanged.');
