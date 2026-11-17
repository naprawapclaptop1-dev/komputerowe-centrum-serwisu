import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const cacheExpected='nauka-6.8.0-fix127-portable-sha256-20261111';
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const coreText=sw.match(/const\s+CORE\s*=\s*\[([\s\S]*?)\n\];/)?.[1]||'';
const core=Function(`return [${coreText}]`)();
const required=[
  '/media/videos/akademia-dlaczego-warto-wspierac.mp4',
  '/media/video_posters/akademia-wsparcie-poster.jpg',
  '/media/videos/akademia-dlaczego-warto-wspierac.vtt'
];
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
check('Service Worker zachowuje aktualny cache FIX109',()=>{
 const found=[...sw.matchAll(/\bconst\s+CACHE_NAME\s*=\s*(['"])([^'"]+)\1\s*;/g)];
 assert.equal(found.length,1); assert.equal(found[0][2],cacheExpected); assert.ok(found[0][2].length<64);
});
check('Film, plakat i napisy są osobnymi wpisami CORE i plikami lokalnymi',()=>{
 for(const item of required){
  assert.ok(core.includes(item),`brak CORE: ${item}`);
  const local=path.join(ROOT,'WEB_PUBLISH',item.replace(/^\//,''));
  assert.ok(fs.existsSync(local),`brak pliku: ${item}`);
  assert.ok(fs.statSync(local).size>100,`plik pusty: ${item}`);
 }
});
check('CORE nie ma duplikatów powodujących odrzucenie cache.addAll()',()=>{
 assert.equal(new Set(core).size,core.length);
});
check('OneClick wymaga dokładnego aktualnego cache przed migracjami',()=>{
 assert.ok(one.includes(`const expectedServiceWorkerCache = '${cacheExpected}'`));
 assert.ok(one.includes('swCacheName !== expectedServiceWorkerCache'));
 assert.ok(one.includes('await verifyWeb();')&&one.includes('await verifyPendingMigrations(dbName);'));
 assert.ok(one.indexOf('await verifyWeb();')<one.indexOf('await verifyPendingMigrations(dbName);'));
 assert.ok(one.includes("'scripts/test-fix110-service-worker-publication-guard.mjs'"));
});
check('Watcher sprawdza lokalny i zdalny cache FIX109',()=>{
 assert.ok(watcher.includes(`swCacheName !== '${cacheExpected}'`));
 assert.ok(watcher.includes(`remoteCacheName === '${cacheExpected}'`));
 assert.ok(watcher.includes('photo-catalog-fix115.js'));
 assert.ok(watcher.includes('home-specialist-photo-layout-fix115.css'));
});
check('release.json zachowuje starszy publikator; FIX127 odświeża film; polityka wizualna FIX123 blokuje zdjęcia zewnętrzne',()=>{
 assert.equal(release.publicationPipelineHotfix,'FIX110');
 assert.equal(release.publicationPipelineBuildTag,'6.8.0-fix110-pwa-cache-guard-20261109');
 assert.equal(release.latestHotfix,'FIX128');
 assert.ok(core.includes('/assets/photo-catalog-fix115.js?v=6.8.0-fix118'));
 assert.ok(core.includes('/assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115'));
 assert.equal(release.photoCatalog.runtime,'assets/photo-catalog-fix115.js?v=6.8.0-fix118');
 assert.equal(release.photoCatalogRuntimeBuildTag,'6.8.0-fix118-local-photo-library-20261110');
 assert.equal(release.fix110_service_worker_cache_guard.serviceWorkerCacheName,cacheExpected);
});
console.log(`FIX115 SERVICE WORKER PUBLICATION GUARD SUMMARY: ${checks.length}/${checks.length} PASS`);
