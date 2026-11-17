#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const prime = read('WEB_PUBLISH/assets/homepage-photo-prime-fix118.js');
const catalog = read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const route = read('functions/media/photos/[id].js');
const helperText = read('functions/_photo-proxy-fix131.js');
const helperSource = read('functions/_photo-proxy-fix131.js');
const helperDataUrl = `data:text/javascript;base64,${Buffer.from(helperSource, 'utf8').toString('base64')}`;
const helper = await import(helperDataUrl);
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log(`[PASS] ${name}`); };
await check('19 curated image slots now use same-origin raster URLs instead of direct CDN URLs', () => {
  const byId = new Map(manifest.photos.map(item => [item.id, item]));
  const values = Object.values(manifest.homepageSlotSeedMap || {});
  assert.equal(values.length, 19);
  assert.equal(new Set(values).size, 19);
  for (const id of values) {
    const item = byId.get(id);
    assert.ok(item, `missing photo ${id}`);
    assert.equal(item.asset, `/media/photos/${id}.jpg`);
    assert.ok(item.sourceAsset.startsWith('https://'));
  }
});
await check('Pages Function exposes only fixed allowlisted Pexels/Wikimedia IDs and is not an open proxy', () => {
  assert.ok(route.includes('serveCuratedPhotoFix131'));
  assert.ok(helperText.includes('ALLOWED_HOSTS'));
  assert.ok(helperText.includes('PHOTO_SOURCES_FIX131'));
  assert.ok(!helperText.includes('new URL(requestUrl.searchParams.get'));
  assert.equal(Object.keys(helper.PHOTO_SOURCES_FIX131).length, 19);
});
await check('all 19 manifest source URLs exactly match the fixed server-side allowlist', () => {
  const byId = new Map(manifest.photos.map(item => [item.id, item]));
  for (const id of Object.values(manifest.homepageSlotSeedMap || {})) {
    const item = byId.get(id);
    assert.ok(item, `manifest photo missing: ${id}`);
    assert.equal(helper.PHOTO_SOURCES_FIX131[id], item.sourceAsset, `proxy source mismatch: ${id}`);
  }
});
await check('unknown photo IDs and disallowed HTTP methods are rejected before any upstream fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('must not call'); };
  const unknown = await helper.serveCuratedPhotoFix131({ request: new Request('https://example.test/media/photos/nope.jpg'), id: 'nope.jpg', fetchImpl });
  const method = await helper.serveCuratedPhotoFix131({ request: new Request('https://example.test/media/photos/ram-modules.jpg', { method: 'POST' }), id: 'ram-modules.jpg', fetchImpl });
  assert.equal(unknown.status, 404);
  assert.equal(method.status, 405);
  assert.equal(calls, 0);
});
await check('successful proxy response validates raster MIME and adds cache/diagnostic headers', async () => {
  const fetchImpl = async () => new Response(new Uint8Array([0xff,0xd8,0xff,0xd9]), { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': '4' } });
  const response = await helper.serveCuratedPhotoFix131({ request: new Request('https://example.test/media/photos/ram-modules.jpg'), id: 'ram-modules.jpg', fetchImpl, cacheApi: null });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/jpeg');
  assert.equal(response.headers.get('x-photo-delivery'), 'FIX131-SAME-ORIGIN');
  assert.match(response.headers.get('cache-control') || '', /s-maxage/);
});
await check('non-image upstream responses fail safely and cannot be counted as photos', async () => {
  const fetchImpl = async () => new Response('<html>blocked</html>', { status: 200, headers: { 'content-type': 'text/html' } });
  const response = await helper.serveCuratedPhotoFix131({ request: new Request('https://example.test/media/photos/ram-modules.jpg'), id: 'ram-modules.jpg', fetchImpl, cacheApi: null });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-photo-delivery'), 'FIX134-NON-IMAGE');
});
await check('Service Worker caches same-origin image route for offline use in a separate cache', () => {
  assert.ok(sw.includes("url.pathname.startsWith('/media/photos/')"));
  assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'"));
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix135-home-module-photo-coverage-20261113'"));
});
await check('homepage pending/failure captions no longer falsely claim a photo is online', () => {
  assert.ok(prime.includes('ZDJĘCIE SPRZĘTU · ŁADOWANIE'));
  assert.ok(prime.includes('ILUSTRACJA TECHNICZNA · ZDJĘCIE NIEDOSTĘPNE'));
  assert.ok(prime.includes('FOTOGRAFIA SPRZĘTU ·'));
  assert.ok(catalog.includes('hasHumanSubjectMetadata'));
});
await check('FIX131 photo proxy and FIX134 redirect implementation remain active under FIX135 module coverage release', () => {
  assert.equal(release.productVersion, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX135');
  assert.equal(release.fix134_photo_proxy_safe_redirects.hotfix, 'FIX134');
  assert.ok(html.includes('content="FIX135"'));
  assert.ok(release.fix131_same_origin_photo_proxy);
});
console.log(`FIX131 PHOTO PROXY / FIX134 RELEASE: ${passed}/${passed} PASS`);
