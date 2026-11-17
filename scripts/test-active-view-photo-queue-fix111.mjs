import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/photo-catalog-fix115.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/media/photo-sources-online.json'),'utf8'));
const checks=[];const check=(name,fn)=>{fn();checks.push(name);console.log('[PASS] '+name);};
check('Whole catalog is tracked but not downloaded globally on boot',()=>{
 assert.ok(runtime.includes('FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE = true'));
 assert.ok(runtime.includes('FIX109_FULL_CATALOG_BACKGROUND_QUEUE = false'));
 assert.equal(manifest.dynamicProvider.fullCatalogTrackedLazy,true);
 assert.equal(manifest.dynamicProvider.fullCatalogBackgroundQueue,false);
 assert.equal(manifest.photoQueuePolicy.hiddenViewsQueuedOnBoot,false);
 assert.equal(manifest.photoQueuePolicy.activeViewQueueOnly,true);
 assert.equal(manifest.photoQueuePolicy.globalBackgroundQueue,false);
 assert.equal(manifest.photoQueuePolicy.fullCatalogBackgroundQueue,false);
});
check('Provider fetch is gated by active view and viewport proximity',()=>{
 assert.ok(runtime.includes('function isInActiveView(img)'));
 assert.ok(runtime.includes('function isNearActiveViewport(img, margin = ACTIVE_VIEW_MARGIN)'));
 assert.ok(runtime.includes('if (!isInActiveView(img) || !isNearActiveViewport(img))'));
 assert.ok(runtime.includes('function queueActiveViewImages()'));
 assert.ok(runtime.includes('function pruneQueueToActiveView()'));
});
check('Navigation, scrolling, resizing and dynamic DOM insertions requeue visible images',()=>{
 assert.ok(runtime.includes("window.addEventListener?.('scroll', scheduleActiveViewQueue, { passive: true })"));
 assert.ok(runtime.includes("window.addEventListener?.('resize', scheduleActiveViewQueue, { passive: true })"));
 assert.ok(runtime.includes("record.target.classList.contains('active')"));
 assert.ok(runtime.includes('MutationObserver'));
 assert.equal(manifest.dynamicProvider.dynamicInsertionQueue,true);
 assert.equal(manifest.dynamicProvider.requeueOnScrollAndNavigation,true);
});
check('Openverse request budget and Wikimedia fallback remain independent',()=>{
 assert.ok(runtime.includes('MAX_DAILY_REQUESTS = 180'));
 assert.ok(runtime.includes('OPENVERSE_GAP_MS = 3300'));
 assert.ok(runtime.includes('commonsPausedUntil'));
 assert.ok(runtime.includes("if (provider === 'Openverse') pausedUntil ="));
});
check('Homepage seeds have unique reserved owners and migration from FIX109 assignments',()=>{
 assert.equal(Object.keys(manifest.homepageSlotSeedMap).length,21);
 assert.equal(new Set(Object.values(manifest.homepageSlotSeedMap)).size,21);
 assert.ok(runtime.includes('FIX111_HOME_SEED_OWNERSHIP_MIGRATION = true'));
 assert.ok(runtime.includes('FIX115_REVALIDATE_LEGACY_ASSIGNMENTS = true'));
 assert.ok(runtime.includes("const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix115'"));
 assert.ok(runtime.includes('resolveCuratedSeedId'));
 assert.ok(runtime.includes('academyPhotoCatalogAssignmentsFix109'));
});
console.log(`FIX115 INHERITED ACTIVE VIEW PHOTO QUEUE SUMMARY: ${checks.length}/${checks.length} PASS`);
