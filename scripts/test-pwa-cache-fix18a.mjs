import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const sw = read('WEB_PUBLISH/service-worker.js');
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const cacheName = sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/i)?.[1] || '';
assert.equal(cacheName, 'nauka-od-a-do-z-6.8.0-fix79-pwa-cache-20261106', 'cache key must be short, unique and tied to the current PWA release');
assert.ok(sw.includes('real-workshop-fix42.js') && sw.includes('real-workshop-fix42.css'), 'FIX42 resources remain in precache');
assert.ok(sw.includes('akademia-serwisanta-fix41.js') && sw.includes('akademia-serwisanta-fix41.css'), 'FIX41 resources remain in precache');
assert.ok(sw.includes('nauka-centrum-fix40.js') && sw.includes('nauka-centrum-fix40.css'), 'FIX40 resources remain in precache');
assert.ok(sw.includes("'/media/video_posters/akademia-wsparcie-poster.jpg'"), 'support poster is included in the offline CORE cache');
for (const asset of [
  '/media/videos/akademia-dlaczego-warto-wspierac.mp4',
  '/media/video_posters/akademia-wsparcie-poster.jpg',
  '/media/videos/akademia-dlaczego-warto-wspierac.vtt'
]) assert.ok(sw.includes(`'${asset}'`), `Service Worker CORE must cache ${asset}`);
assert.ok(sw.includes("url.pathname.startsWith('/api/')"), 'API responses must remain outside the static PWA cache');
assert.ok(sw.includes("url.pathname.startsWith('/Biblioteka/')"), 'local PDF/DOCX library must support on-demand offline caching');
assert.ok(sw.includes("key !== CACHE_NAME"), 'activation must delete previous app cache namespaces');
assert.ok(publisher.includes("swCacheName.includes('fix79-pwa-cache-20261106')") && publisher.includes('hasSupportVideoInCore') && publisher.includes('hasSupportPosterInCore') && publisher.includes('hasSupportCaptionsInCore'), 'one-click publisher must validate current cache revision and all media assets');
assert.ok(watcher.includes("swCacheName.includes('fix79-pwa-cache-20261106')") && watcher.includes('Lokalny Service Worker ma nieaktualny cache PWA'), 'watcher must enforce the current PWA pre-deploy cache validation');
assert.ok(!publisher.includes('Service Worker nadal używa starej pamięci filmu FIX8.'), 'obsolete brittle FIX8-only error must be removed');
console.log('PASS: Service Worker uses the compact FIX79 cache namespace and preserves historical feature compatibility.');
console.log('PASS: MP4, poster and VTT are all in the offline CORE cache.');
console.log('PASS: API is not cached and old app cache namespaces are cleaned on activation.');
console.log('PASS: one-click publisher and watcher enforce the same semantic PWA cache guard before deployment.');
