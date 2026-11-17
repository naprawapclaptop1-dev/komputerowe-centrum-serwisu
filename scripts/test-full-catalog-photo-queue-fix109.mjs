import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix109.js');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[]; function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
check('All pre-rendered views are queued on startup, not only the active view',()=>{
 assert.ok(runtime.includes('scan(document);\n    // FIX109 enqueues all pre-rendered views'));
 assert.ok(runtime.includes('queueCatalogImages(document);'));
 assert.ok(runtime.includes('FIX109_FULL_CATALOG_BACKGROUND_QUEUE = true'));
});
check('The global queue accepts every connected eligible image, including hidden/off-screen slots',()=>{
 const start=runtime.indexOf('function queueCatalogImages(root = document)');
 const end=runtime.indexOf('function pruneQueueToActiveView()',start); const body=runtime.slice(start,end);
 assert.ok(body.includes('eligible(img) && !processed.has(img) && img.isConnected'));
 assert.ok(!body.includes('isNearActiveViewport(img)'));
 assert.ok(body.includes('queue every eligible image in every view'));
});
check('Changing views does not discard queued hidden images',()=>{
 const start=runtime.indexOf('function pruneQueueToActiveView()'); const end=runtime.indexOf('function activatePendingImages',start);
 const body=runtime.slice(start,end); assert.ok(body.includes('if (img?.isConnected) keep.push(img)'));
 assert.ok(!body.includes('isInActiveView(img)'));
});
check('Retries and queue processing do not require an image to be in the active view',()=>{
 const start=runtime.indexOf('function scheduleQueueRetry(img)'); const end=runtime.indexOf('function queueCatalogImages',start);
 const retry=runtime.slice(start,end); assert.ok(retry.includes('every connected catalog slot')); assert.ok(!retry.includes('isNearActiveViewport(target)'));
 const q=runtime.slice(runtime.indexOf('async function processQueue()'),runtime.indexOf('function installObservers()'));
 assert.ok(q.includes('if (!img?.isConnected || img.dataset.photoFix90Assigned) continue;')); assert.ok(!q.includes('if (!isInActiveView(img)'));
});
check('Newly inserted cards are enqueued and all slots are retried after startup scans',()=>{
 assert.ok(runtime.includes('queueCatalogImages(node);'));
 assert.ok(runtime.includes('queueCatalogImages(document);\n      queueActiveViewImages();\n      processQueue();'));
});
check('Active view keeps first priority without blocking the remaining views',()=>{
 const body=runtime.slice(runtime.indexOf('function queueCatalogImages(root = document)'),runtime.indexOf('function pruneQueueToActiveView()'));
 assert.ok(body.includes("if (view?.classList?.contains?.('active')) return 0;"));
 assert.ok(body.includes("if (view?.id === 'view-home') return 1;"));
 assert.ok(body.includes('return 2;'));
});
check('FIX109 metadata and PWA point to the global catalog runtime',()=>{
 assert.equal(manifest.runtimeHotfix,'FIX109'); assert.equal(manifest.dynamicProvider.hiddenViewsQueuedOnBoot,true); assert.equal(manifest.dynamicProvider.activeViewLazyQueue,false);
 assert.equal(manifest.photoQueuePolicy.allViewsQueuedOnBoot,true); assert.equal(release.latestHotfix,'FIX111');
 assert.ok(html.includes('photo-catalog-fix109.js?v=6.8.0-fix109')); assert.ok(sw.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
});
check('Previously omitted visual galleries and workshop photo slots are part of the catalog selector',()=>{
 const start=runtime.indexOf('  const SELECTOR = ['); const end=runtime.indexOf('].join(',');',start); const selector=runtime.slice(start,end);
 for (const token of ['.np30-hero-photo-main img','.np30-hero-photo-stack img','.diagnostic-photo-fix90','.academy-video-cover img','.video-card img','.video-cover img','.long-video-cover img','.fix51-photo-grid img','.nwm-related-media img']) assert.ok(selector.includes(token),`Missing selector: ${token}`);
 assert.ok(manifest.photoQueuePolicy.imageSlotCoverage.includes('video and long-video thumbnails'));
 assert.ok(manifest.photoQueuePolicy.imageSlotCoverage.includes('master workshop related media'));
});
check('Global uniqueness, topic validation and source limits remain enforced',()=>{
 assert.ok(runtime.includes('function alreadyUsed(photo)')); assert.ok(runtime.includes('hamming(old, photo.hash) < 10'));
 assert.ok(runtime.includes('MAX_DAILY_REQUESTS = 180')); assert.ok(runtime.includes('OPENVERSE_GAP_MS = 3300'));
 assert.ok(runtime.includes('function isPhotoRelevant(photo, category = photo?.category)'));
});
console.log(`FIX109 FULL CATALOG PHOTO QUEUE SUMMARY: ${checks.length}/${checks.length} PASS`);
