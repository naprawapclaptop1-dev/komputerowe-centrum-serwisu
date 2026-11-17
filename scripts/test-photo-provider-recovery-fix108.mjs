import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix109.js');
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const one = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }
function exportedFunction(name, signature) {
  const match = runtime.match(signature);
  assert.ok(match, `Brak funkcji ${name} w aktywnym runtime.`);
  return vm.runInNewContext(`(${match[0]})`);
}

const retryAfterDelayMs = exportedFunction('retryAfterDelayMs', /function retryAfterDelayMs\(value, now = Date\.now\(\), fallbackMs = 60000\) \{[\s\S]*?\n  \}/);
const commonsBackoffMs = exportedFunction('commonsBackoffMs', /function commonsBackoffMs\(failures\) \{[\s\S]*?\n  \}/);

check('Retry-After parses seconds and HTTP-date without NaN', () => {
  assert.equal(retryAfterDelayMs('60', 0), 60000);
  assert.equal(retryAfterDelayMs('Thu, 01 Jan 1970 00:02:00 GMT', 0), 120000);
  assert.equal(retryAfterDelayMs('', 0, 45000), 45000);
  assert.equal(retryAfterDelayMs('not-a-date', 0, 45000), 45000);
  assert.equal(retryAfterDelayMs('100000', 0), 24 * 60 * 60 * 1000);
});
check('Wikimedia transient retry uses bounded exponential backoff', () => {
  assert.equal(commonsBackoffMs(1), 30000);
  assert.equal(commonsBackoffMs(2), 60000);
  assert.equal(commonsBackoffMs(3), 120000);
  assert.equal(commonsBackoffMs(100), 900000);
});
check('Openverse and Commons keep separate cooldown state', () => {
  assert.ok(runtime.includes('let pausedUntil = 0;'));
  assert.ok(runtime.includes('let commonsPausedUntil = 0;'));
  assert.ok(runtime.includes("if (provider === 'Openverse') pausedUntil ="));
  assert.ok(runtime.includes('else commonsPausedUntil ='));
  assert.ok(runtime.includes("if (provider === 'Commons') headers['Api-User-Agent']"));
});
check('Temporary Commons failures do not permanently exhaust a photo category', () => {
  assert.ok(runtime.includes('const transient = !navigator.onLine || !status || status === 408 || status === 429 || status === 503 || status >= 500;'));
  assert.ok(runtime.includes('state.commonsFailures = Number(state.commonsFailures || 0) + 1;'));
  assert.ok(runtime.includes('state.commonsRetryAt = Date.now() + delay;'));
  assert.ok(runtime.includes('state.commonsTried = false; // Never discard the remaining queries after a transient provider failure.'));
});
check('Openverse daily quota does not block the independent Wikimedia retry', () => {
  const start = runtime.indexOf('function scheduleQueueRetry(img)');
  const end = runtime.indexOf('\n  function ', start + 10);
  const schedule = runtime.slice(start, end > start ? end : start + 3000);
  assert.ok(schedule.includes('if (!navigator.onLine) { setStatus(); return; }'));
  assert.ok(!schedule.includes('dailyState().requests >= MAX_DAILY_REQUESTS'));
  assert.ok(runtime.includes('if (!state.commonsTried || state.commonsHasMore)'));
});
check('Verified FIX106 and FIX108 method assignments survive a runtime restart', () => {
  assert.ok(runtime.includes("const trustedMethodAssignments = new Set([...Object.keys(safeJson(LEGACY_ASSIGN_KEY) || {}), ...Object.keys(assignmentState)]);"));
  assert.ok(runtime.includes("!trustedMethodAssignments.has(id)"));
  assert.ok(runtime.includes('academyPhotoCatalogAssignmentsFix108'));
  assert.ok(runtime.includes('academyPhotoCatalogAssignmentsFix106'));
});
check('Global photo uniqueness remains enforced by identity and perceptual hash', () => {
  assert.ok(runtime.includes('FIX109_FULL_CATALOG_BACKGROUND_QUEUE'));
  assert.ok(runtime.includes('function queueCatalogImages(root = document)'));
  assert.ok(runtime.includes('queueCatalogImages(document);'));
  assert.ok(runtime.includes('function photoIdentity(photo)'));
  assert.ok(runtime.includes('function alreadyUsed(photo)'));
  assert.ok(runtime.includes('hamming(old, photo.hash) < 10'));
});
check('Runtime, manifest, release metadata, HTML and PWA all reference FIX108', () => {
  assert.equal(manifest.runtimeHotfix, 'FIX109');
  assert.equal(manifest.runtimeBuildTag, release.photoCatalogRuntimeBuildTag);
  assert.equal(manifest.dynamicProvider?.retryAfterHttpDateSupported, true);
  assert.equal(manifest.dynamicProvider?.openverseDailyBudgetScope, 'Openverse only; does not block Wikimedia Commons fallback retries');
  assert.equal(manifest.photoQueuePolicy?.openverseBudgetDoesNotBlockCommonsRetry, true);
  assert.equal(release.latestHotfix, 'FIX111');
  assert.equal(release.photoCatalog?.runtimeHotfix, 'FIX109');
  assert.equal(release.photoCatalog?.methodAssignmentNamespace, 'academyPhotoCatalogAssignmentsFix108');
  assert.ok(html.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.ok(html.includes('photo-catalog-fix109.css?v=6.8.0-fix109'));
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  assert.ok(sw.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.ok(sw.includes('photo-catalog-fix109.css?v=6.8.0-fix109'));
  assert.ok(one.includes('photo-catalog-fix109.js'));
  assert.ok(watcher.includes('photo-catalog-fix109.js'));
  assert.ok(one.includes("'scripts/test-photo-provider-recovery-fix108.mjs'"));
  assert.ok(watcher.includes("'scripts/test-photo-provider-recovery-fix108.mjs'"));
});

console.log(`FIX109 PHOTO PROVIDER RECOVERY SUMMARY: ${checks.length}/${checks.length} PASS`);
