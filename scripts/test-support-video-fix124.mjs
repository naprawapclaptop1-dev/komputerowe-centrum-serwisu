#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const rel = 'WEB_PUBLISH/media/videos/akademia-dlaczego-warto-wspierac.mp4';
const bytes = fs.readFileSync(path.join(ROOT, rel));
const sha = crypto.createHash('sha256').update(bytes).digest('hex');
const EXPECTED_SHA = 'cdf3f63405b388bb040619ecf42127e644280a88b30d0d961fd8a8fc8c0c8b2a';
const EXPECTED_BYTES = 1171095;
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const visualManifest = JSON.parse(read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.json'));
const visualVideo = visualManifest.videoAssets.find(item => item.path === 'media/videos/akademia-dlaczego-warto-wspierac.mp4');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const one = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const vtt = read('WEB_PUBLISH/media/videos/akademia-dlaczego-warto-wspierac.vtt');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }
check('FIX127 MP4 is the full 1280x720 render and exceeds the OneClick 1 MB threshold', () => {
  assert.equal(bytes.length, EXPECTED_BYTES);
  assert.ok(bytes.length >= 1_000_000);
  assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
  assert.equal(sha, EXPECTED_SHA);
});
check('release.json and HTML identify FIX127 without changing product name/version', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.productVersion, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX128');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix128-live-tech-visual-publication-20261111');
  assert.equal(release.supportVideoAssetFix124.sha256, EXPECTED_SHA);
  assert.equal(visualVideo.sha256, EXPECTED_SHA);
  assert.equal(visualVideo.bytes, EXPECTED_BYTES);
  assert.ok(html.includes('content="FIX127"'));
  assert.ok(html.includes('NAUKA OD A DO Z — DLA WSZYSTKICH | Wersja 6.8.0 FIX128'));
  assert.ok(!html.includes('Akademia Serwisu PRO'));
});
check('HTML requests the FIX127 MP4 URL and retains optional Polish captions', () => {
  assert.ok(html.includes('akademia-dlaczego-warto-wspierac.mp4?v=6.8.0-fix127-fix9-clean-video'));
  assert.ok(html.includes('akademia-dlaczego-warto-wspierac.vtt?v=6.8.0-fix127'));
  assert.ok(vtt.startsWith('WEBVTT'));
  assert.ok(vtt.includes('Każda wpłata jest dobrowolna'));
  assert.ok(vtt.includes('Dziękujemy'));
  assert.ok(!/<track\b[^>]*\bdefault(?:\s|>)/i.test(html));
});
check('PWA cache is bumped and contains the refreshed support video', () => {
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  assert.ok(sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.mp4'"));
  assert.ok(sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.mp4?v=6.8.0-fix127-fix9-clean-video'"));
});
check('OneClick rejects the wrong/undersized MP4 with a specific FIX127 diagnostic', () => {
  assert.ok(one.includes("releaseJson.latestHotfix !== 'FIX128'"));
  assert.ok(one.includes(EXPECTED_SHA));
  assert.ok(one.includes('supportVideoStat.size < 1000000'));
  assert.ok(one.includes('Zastosuj FIX127.'));
  assert.ok(one.includes('scripts/test-support-video-fix124.mjs'));
});
check('Watcher fetches the cache-busted FIX127 video and runs its regression test', () => {
  assert.ok(watcher.includes('akademia-dlaczego-warto-wspierac.mp4?v=6.8.0-fix127-fix9-clean-video&verify='));
  assert.ok(watcher.includes('scripts/test-support-video-fix124.mjs'));
  assert.ok(watcher.includes("remoteRelease?.latestHotfix === EXPECTED_HOTFIX"));
});
check('no D1 migrations, account or secret changes are introduced', () => {
  assert.equal(release.supportVideoAssetFix124.d1Migrations, 'none');
  assert.equal(release.supportVideoAssetFix124.dataMigrations, 'none');
  assert.equal(release.supportVideoAssetFix124.cloudflareSettingsChanged, false);
  assert.equal(release.supportVideoAssetFix124.secretsChanged, false);
});
console.log(`FIX127 SUPPORT VIDEO REGRESSION: ${checks.length}/${checks.length} PASS`);
