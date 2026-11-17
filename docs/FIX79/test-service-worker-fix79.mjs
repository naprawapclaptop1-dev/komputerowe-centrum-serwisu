import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const cache=sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/i)?.[1]||'';
const required=[
  '/media/videos/akademia-dlaczego-warto-wspierac.mp4',
  '/media/video_posters/akademia-wsparcie-poster.jpg',
  '/media/videos/akademia-dlaczego-warto-wspierac.vtt',
  '/assets/support-community-fix36.css?v=6.8.0-fix36',
  '/assets/support-community-fix36.js?v=6.8.0-fix36',
  '/assets/master-control-fix47.css?v=6.8.0-fix47',
  '/assets/master-control-fix47.js?v=6.8.0-fix47',
  '/assets/nauka-centrum-fix40.css?v=6.8.0-fix40',
  '/assets/nauka-centrum-fix40.js?v=6.8.0-fix40',
  '/assets/akademia-serwisanta-fix41.css?v=6.8.0-fix41',
  '/assets/akademia-serwisanta-fix41.js?v=6.8.0-fix41',
  '/assets/real-workshop-fix42.css?v=6.8.0-fix42',
  '/assets/real-workshop-fix42.js?v=6.8.0-fix42',
  '/assets/knowledge-suite-fix43.css?v=6.8.0-fix43',
  '/assets/knowledge-suite-fix43.js?v=6.8.0-fix43'
];
const core=sw.match(/const\s+CORE\s*=\s*\[([\s\S]*?)\n\];/)?.[1]||'';
const coreEntries=vm.runInNewContext(`const CORE = [${core}]; CORE;`);
const checks=[];
function check(name,fn){fn();checks.push(name);console.log(`[PASS] ${name}`);}
check('Service Worker używa krótkiej, jednoznacznej nazwy cache FIX79',()=>{
  assert.equal(cache,'nauka-od-a-do-z-6.8.0-fix79-pwa-cache-20261106');
  assert.ok(cache.length<64,`CACHE_NAME ma ${cache.length} znaków`);
  assert.doesNotMatch(cache,/nauka-od-a-do-z.*nauka-od-a-do-z/);
});
check('film, plakat i napisy wsparcia są wszystkie w CORE',()=>{
  for(const item of required.slice(0,3)) assert.ok(core.includes(`'${item}'`),`brak ${item}`);
});
check('zasoby modułów i wsparcia są buforowane offline',()=>{
  for(const item of required.slice(3)) assert.ok(core.includes(item),`brak ${item}`);
});
check('CORE nie zawiera powtórzonych adresów powodujących błędy addAll',()=>{
  assert.equal(new Set(coreEntries).size,coreEntries.length,`duplikaty CORE: ${coreEntries.filter((x,i)=>coreEntries.indexOf(x)!==i).join(', ')}`);
});
check('każdy z 491 wpisów CORE wskazuje na istniejący plik lokalny',()=>{
  for(const entry of coreEntries){
    const pathname=new URL(entry,'https://local.invalid').pathname;
    const relative=pathname==='/'?'index.html':decodeURIComponent(pathname.replace(/^\//,''));
    assert.ok(fs.existsSync(path.join(ROOT,'WEB_PUBLISH',relative)),`brak zasobu ${entry}`);
  }
});
check('OneClick blokuje publikację, gdy cache FIX79 lub media wsparcia są niekompletne',()=>{
  assert.ok(one.includes("swCacheName.includes('fix79-pwa-cache-20261106')"));
  for(const token of ['hasSupportVideoInCore','hasSupportPosterInCore','hasSupportCaptionsInCore']) assert.ok(one.includes(token));
});
check('Watcher stosuje tę samą kontrolę dla lokalnego Service Workera',()=>{
  assert.ok(watcher.includes("swCacheName.includes('fix79-pwa-cache-20261106')"));
  assert.ok(watcher.includes('remoteCacheName.includes(\'fix79-pwa-cache-20261106\')'));
  assert.ok(watcher.includes('remoteSupportPosterValid') && watcher.includes('remoteSupportCaptionsValid'));
  for(const item of required.slice(0,3)) assert.ok(watcher.includes(item));
});
check('API pozostaje poza cache, a biblioteka dokumentów ma cache na żądanie',()=>{
  assert.ok(sw.includes("url.pathname.startsWith('/api/')"));
  assert.ok(sw.includes("url.pathname.startsWith('/Biblioteka/')"));
});
for(const item of required) assert.ok(fs.existsSync(path.join(ROOT,'WEB_PUBLISH',item.replace(/^\//,'').split('?')[0])),`brak pliku ${item}`);
console.log(`FIX79 SERVICE WORKER REGRESSION: ${checks.length}/${checks.length} PASS`);
