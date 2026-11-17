import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const one=read('ONECLICK_AKADEMIA.js'),watcher=read('AUTO_PUBLISH_WATCHER.js');
const guard=read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.js');
const manifest=JSON.parse(read('WEB_PUBLISH/assets/global-academy-fix77-manifest.json'));
const home=JSON.parse(read('WEB_PUBLISH/assets/homepage-tech-visuals-fix122.json'));
const cmd=read('WYKONAJ_TESTY_FIX127.cmd');
let passed=0;const check=(name,fn)=>{fn();passed++;console.log(`[PASS] ${name}`);};
check('OneClick wymaga globalnej polityki FIX123 oraz 36 lokalnych grafik FIX122',()=>{
 assert.ok(one.includes('sitewide-tech-visuals-fix123.js'));
 assert.ok(one.includes('homepage-tech-only-fix122.js'));
 assert.ok(one.includes('homepageTechManifest.totalImages !== 36'));
 assert.ok(one.includes('homepage-local-svg-only-no-people'));
 assert.ok(one.includes('scripts/test-homepage-tech-only-fix122.mjs'));
});
check('Watcher wymaga tego samego globalnego filtra i pełnego manifestu ilustracji',()=>{
 assert.ok(watcher.includes('sitewide-tech-visuals-fix123.js'));
 assert.ok(watcher.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123'));
 assert.ok(watcher.includes("!remoteServiceWorker.includes('PHOTO_LIBRARY_CACHE_NAME')"));
 assert.ok(watcher.includes('remoteSupportPwaValid'));
 assert.ok(watcher.includes('scripts/test-sitewide-tech-visuals-fix123.mjs'));
});
check('historyczne 203 ilustracje lekcji pozostają unikalne i bezpieczne',()=>{
 assert.equal(manifest.productVersion,'6.8.0');
 assert.equal(manifest.uniqueLessonIllustrations,203);
 assert.ok(home.images.every(x=>x.humanSubjectsAllowed===false));
 assert.ok(guard.includes('MutationObserver'));
});
check('runtime zachowuje globalną blokadę fotografii i zastępowanie źródeł zewnętrznych',()=>{
 for(const token of ['global-single-photo-assignment','MutationObserver','fallback(img)','perceptualHash'])assert.ok(read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js').includes(token));
 for(const token of ['api.openverse.org','commons.wikimedia.org','SITEWIDE_NO_VISIBLE_PEOPLE_OR_HANDS'])assert.ok(guard.includes(token));
});
check('Windowsowy runner uruchamia testy FIX127 i używa lokalnego Node.js',()=>{
 assert.ok(cmd.includes('run-tests-fix127.mjs'));
 assert.ok(cmd.includes('run-tests-fix127.mjs')&&cmd.includes('node'));
});
check('brak migracji D1 i zmian sekretów pozostaje warunkiem wydania',()=>{
 assert.equal(manifest.offline?.newD1Migrations,false);
 assert.equal(manifest.offline?.newOpenAISecret,false);
 assert.equal(manifest.productVersion,'6.8.0');
});
console.log(`ONECLICK / WATCHER FIX77 LEGACY COMPATIBILITY: ${passed}/${passed} PASS`);
