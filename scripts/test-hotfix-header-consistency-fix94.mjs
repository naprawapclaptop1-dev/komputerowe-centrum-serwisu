import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const checks=[];function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
check('Produkt 6.8.0 i runtime zdjęć FIX109 wskazują ten sam zweryfikowany build',()=>{
  assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX111');assert.equal(manifest.hotfix,'FIX94');
  assert.equal(release.latestHotfixBuild,'6.8.0-fix111-active-view-photo-queue-20261109');
  assert.equal(release.photoCatalogRuntimeBuildTag,'6.8.0-fix111-active-view-photo-queue-20261109');
  assert.equal(release.photoCatalogRuntimeBuildTag,release.latestHotfixBuild);
  assert.equal(manifest.onlinePhotoRuntime,'assets/photo-catalog-fix109.js?v=6.8.0-fix109');
  assert.equal(manifest.onlinePhotoStylesheet,'assets/photo-catalog-fix109.css?v=6.8.0-fix109');
});
check('HTML, OneClick i Watcher deklarują FIX101; zasoby zdjęć i PWA pozostają na runtime FIX99',()=>{
  assert.ok(html.includes('<meta name="academy-hotfix" content="FIX94">'));
  assert.ok(html.includes('<meta name="academy-hotfix" content="FIX95">'));assert.ok(html.includes('<meta name="academy-hotfix" content="FIX96">'));assert.ok(html.includes('<meta name="academy-hotfix" content="FIX97">'));assert.ok(html.includes('<meta name="academy-hotfix" content="FIX98">'));assert.ok(html.includes('<meta name="academy-hotfix" content="FIX106">'));assert.ok(html.includes('<meta name="academy-hotfix" content="FIX107">'));
  assert.ok(html.includes('NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX109 | GLOBAL ACADEMY PRO'));
  assert.ok(html.includes('assets/photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.ok(html.includes('assets/photo-catalog-fix109.css?v=6.8.0-fix109'));
  assert.ok(one.startsWith('// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX109'));
  assert.ok(watcher.startsWith('// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX109'));
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  assert.ok(sw.includes("'/media/photo-sources-online.json'"));
});
check('37 ręcznie sprawdzonych źródeł oraz dowody dla USB-C, RAM, VRAM, GPU i lutowania są w manifeście',()=>{
  assert.equal(manifest.photos.length,37);
  const ids=new Set(manifest.photos.map(p=>p.id));
  for(const id of ['usb-c-laptop-port','ram-modules','ram-desktop-dimm-corsair','vram-qimonda-gddr3-chip','vram-samsung-gddr3-chip','solder-nasa-circuit-board','gpu-msi-geforce-rtx3070','gpu-cooling-heatsink-fans']) assert.ok(ids.has(id),`Missing ${id}`);
  assert.equal(manifest.dynamicProvider.topicRelevanceFilter,true);
  assert.equal(manifest.dynamicProvider.noGenericTopicFallback,true);
  assert.ok(manifest.dynamicProvider.strictPortEvidence.includes('USB-C'));
  assert.ok(manifest.dynamicProvider.strictRamEvidence.includes('SO-DIMM'));
  assert.ok(manifest.dynamicProvider.strictVramEvidence.includes('GDDR'));
});
check('FIX99 korzysta z osobnego namespace stanu zdjęć; stary klucz FIX91 jest tylko odzyskiwany',()=>{
  const runtime=read('WEB_PUBLISH/assets/photo-catalog-fix98.js');
  assert.ok(runtime.includes("const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix98'"));
  assert.ok(runtime.includes("const DAILY_KEY = 'academyPhotoCatalogDailyFix98'"));
  assert.ok(runtime.includes("const PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix98'"));
  assert.ok(runtime.includes("const CANDIDATE_POOL_KEY = 'academyPhotoCatalogCandidatePoolsFix98'"));
});
check('OneClick i Watcher uruchamiają trzy testy regresji przed publikacją',()=>{
  for(const f of ['scripts/test-hotfix-header-consistency-fix94.mjs','scripts/test-photo-catalog-fix94.mjs','scripts/test-online-photo-guards-fix94.mjs','scripts/test-homepage-photo-layout-fix96.mjs','scripts/test-homepage-static-photo-publication-fix97.mjs']){
    assert.ok(one.includes(`'${f}'`),`OneClick missing ${f}`);
    assert.ok(watcher.includes(`'${f}'`),`Watcher missing ${f}`);
  }
  assert.ok(one.includes("photoRegistry.hotfix !== 'FIX94'"));
  assert.ok(watcher.includes("photoSourceManifest.hotfix !== 'FIX94'"));
});
check('Service Worker zachowuje film, plakat, napisy, runtime FIX99 i nowy cache',()=>{
  for(const asset of ['/media/videos/akademia-dlaczego-warto-wspierac.mp4','/media/video_posters/akademia-wsparcie-poster.jpg','/media/videos/akademia-dlaczego-warto-wspierac.vtt','photo-catalog-fix98.js','photo-catalog-fix98.css']) assert.ok(sw.includes(asset),`SW missing ${asset}`);
  assert.ok(one.includes("swCacheName.includes('fix94-topic-verified-photo-20261107')"));
  assert.ok(watcher.includes("remoteCacheName.includes('fix94-topic-verified-photo-20261107')"));
});
console.log(`FIX99 PUBLICATION / PHOTO RUNTIME CONSISTENCY: ${checks.length}/${checks.length} PASS`);
