import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const runtime=read('WEB_PUBLISH/assets/photo-catalog-fix90.js');
const css=read('WEB_PUBLISH/assets/photo-catalog-fix90.css');
const manifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online-fix90.json'));
const activeManifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const app=read('WEB_PUBLISH/assets/app.js');
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
check('Manifest FIX90 włącza prawdziwe fotografie online i zachowuje 12 źródeł Pexels',()=>{
  assert.equal(manifest.hotfix,'FIX90');
  assert.equal(manifest.dynamicProvider.enabled,true);
  assert.equal(manifest.photos.length,12);
  assert.ok(manifest.dynamicProvider.primaryEndpoint.includes('openverse.org/v1/images'));
  assert.ok(manifest.dynamicProvider.fallbackEndpoint.includes('commons.wikimedia.org/w/api.php'));
  assert.equal(manifest.onlinePhotoRuntime,'assets/photo-catalog-fix90.js?v=6.8.0-fix90');
  assert.ok(manifest.photos.every(p=>p.provider==='Pexels'&&p.asset.startsWith('https://images.pexels.com/')&&p.page.startsWith('https://www.pexels.com/')&&p.author&&p.licenseUrl));
});
check('Polityka FIX90 wymaga trzech różnych materiałów na naprawę i globalnego zakazu powtórek',()=>{
  assert.equal(manifest.uniqueRepairPhotoPolicy.photosPerRepair,3);
  assert.equal(manifest.uniqueRepairPhotoPolicy.repairCardPhotos,1);
  assert.equal(manifest.uniqueRepairPhotoPolicy.duplicateAcrossDifferentRepairs,false);
  assert.equal(manifest.uniqueRepairPhotoPolicy.duplicateAcrossSlotsForSameRepair,false);
  assert.equal(manifest.uniqueRepairPhotoPolicy.globalSingleAssignment,true);
  assert.equal(manifest.uniqueRepairPhotoPolicy.commercialUseOnly,true);
  assert.equal(manifest.uniqueRepairPhotoPolicy.visualFallbackType,'topic-specific SVG illustration, visibly labelled as illustration, never counted as a photograph');
});
check('Kolejność HTML uruchamia foto-katalog po silnikach zastępczych, ale przed pierwszym renderem app.js',()=>{
  const visual=html.indexOf('assets/visual-assets-fix51.js?v=6.8.0-fix51');
  const unique=html.indexOf('assets/photo-uniqueness-fix77.js?v=6.8.0-fix77');
  const photos=html.indexOf('assets/photo-catalog-fix91.js?v=6.8.0-fix91');
  const appIndex=html.indexOf('assets/app.js?v=6.8.0-fix87-repair-visuals');
  assert.ok(visual>=0&&unique>visual&&photos>unique&&appIndex>photos);
  assert.ok(html.includes('assets/photo-catalog-fix91.css?v=6.8.0-fix91'));
  assert.ok(fs.existsSync(path.join(ROOT,'WEB_PUBLISH/assets/photo-catalog-fix90.js')));
});
check('Service Worker cache zawiera runtime, CSS i manifest źródeł FIX90',()=>{
  assert.ok(sw.includes('nauka-6.8.0-fix93-online-photo-guard-render-20261107'));
  assert.ok(sw.includes("'/assets/photo-catalog-fix91.js?v=6.8.0-fix91'"));
  assert.ok(sw.includes("'/assets/photo-catalog-fix91.css?v=6.8.0-fix91'"));
  assert.ok(sw.includes("'/media/photo-sources-online.json'"));
});
check('OneClick i Auto-Watcher wymagają aktywnego katalogu i nie pozwalają publikować z wyłączonym źródłem',()=>{
  assert.ok(one.includes('photoRegistry.dynamicProvider?.enabled !== true'));
  assert.ok(one.includes('photoRegistry.uniqueRepairPhotoPolicy?.photosPerRepair !== 3'));
  assert.ok(one.includes("'scripts/test-photo-catalog-fix90.mjs'"));
  assert.ok(one.includes("'scripts/test-photo-catalog-fix91.mjs'"));
  assert.ok(watcher.includes('photoSourceManifest.dynamicProvider?.enabled !== true'));
  assert.ok(watcher.includes("'scripts/test-photo-catalog-fix90.mjs'"));
  assert.ok(watcher.includes("'scripts/test-photo-catalog-fix91.mjs'"));
  assert.ok(watcher.includes('remotePhotoCatalogValid'));
});
check('Silnik obsługuje Openverse, Wikimedia, licencje, autora i źródło bez scrapowania stron',()=>{
  for(const token of ['https://api.openverse.org/v1/images/','https://commons.wikimedia.org/w/api.php','license_type','foreign_landing_url','creator','license_url','origin: \'*\'','mode: \'cors\'']) assert.ok(runtime.includes(token),`missing ${token}`);
});
check('Silnik wykrywa VRAM GDDR/HBM/BGA i bezwzględnie odrzuca DIMM/SO-DIMM',()=>{
  assert.ok(runtime.includes("vram: { query: 'VRAM GDDR6 GDDR7 BGA graphics card memory chips close up'"));
  assert.ok(runtime.includes('function isVramPhotoRelevant(photo)'));
  assert.ok(runtime.includes('dimm|so-dimm|sodimm|udimm|desktop ram|system ram|memory module'));
  assert.ok(runtime.includes('gddr[3-7x]?|hbm[23e]?|graphics memory|video memory|gpu memory|memory chip|bga package'));
});
check('Prawdziwe zdjęcia mają podpis autora, źródła i licencji; fallback jest jawnie podpisany ilustracją',()=>{
  assert.ok(runtime.includes('function addCredit(img, photo)'));
  assert.ok(runtime.includes('function addFallbackLabel(img)'));
  assert.ok(runtime.includes('ILUSTRACJA TECHNICZNA OFFLINE'));
  assert.ok(runtime.includes('photo.author'));
  assert.ok(runtime.includes('photo.license'));
  assert.ok(css.includes('.photo-fallback-label-fix90'));
});
check('Katalog wykrywa nowe karty, ładuje obrazy leniwie i wznawia po odzyskaniu sieci',()=>{
  for(const token of ['img[data-photo-id]','IntersectionObserver','MutationObserver','window.addEventListener?.(\'online\'','function resume()','function scan(root = document)']) assert.ok(runtime.includes(token),`missing ${token}`);
  assert.ok(runtime.includes('failedUrls.add(canonicalUrl(photo.url))'));
  assert.ok(runtime.includes('scheduled.delete(img); processed.delete(img)'));
});
check('Ochrona przed powtórkami sprawdza ID, URL, stronę źródłową i pHash',()=>{
  for(const token of ['function photoIdentity(photo)','function perceptualHash(image)','function hamming(a, b)','hamming(old, photo.hash) < 10','photo-uniqueness-manifest-fix77.json']) assert.ok(runtime.includes(token),`missing ${token}`);
});
check('Karty kursów i narzędzi są podłączone do tego samego katalogu',()=>{
  assert.ok(app.includes('class="course-card-image" data-photo-id='));
  assert.ok(app.includes('class="diagnostic-photo-fix90" data-photo-id='));
  assert.ok(read('WEB_PUBLISH/assets/service-workshop.js').includes('class="catalog-card-art" data-photo-id='));
  assert.ok(runtime.includes("'.course-card-image'")&&runtime.includes("'.catalog-card-art'"));
});
check('Wersja produktu pozostaje 6.8.0, a katalog FIX90 ma własny build tag',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(release.latestHotfix,'FIX111');
  assert.ok(release.photoCatalogRuntimeBuildTag.startsWith('6.8.0-fix99-'));
  assert.equal(activeManifest.hotfix,'FIX94');
  assert.ok(release.photoCatalog.requiresBrowserOnline);
});

// Smoke-test the exported classification and license logic using a minimal browser shim.
class FakeElement {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.classList={add(){},remove(){},contains(){return false;}};this.hidden=false;this.textContent='';this.style={};}
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.children.push(node);return node;}
  prepend(...nodes){this.children.unshift(...nodes);}
  querySelector(){return this.children.find(x=>x?.dataset?.fix90StatusText)||null;}
  querySelectorAll(){return this.children;}
  setAttribute(){}
  addEventListener(){}
  remove(){}
}
const domEvents={};
const body=new FakeElement('body');
const document={readyState:'loading',body,documentElement:new FakeElement('html'),addEventListener(name,fn){domEvents[name]=fn;},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},createElement(tag){return new FakeElement(tag);}};
const localStore=new Map();
const localStorage={getItem:k=>localStore.get(k)||null,setItem:(k,v)=>localStore.set(k,v),removeItem:k=>localStore.delete(k)};
const fakeResponse=(data)=>({ok:true,status:200,json:async()=>data,text:async()=>JSON.stringify(data)});
const context={
  window:{ACADEMY_ART:{},addEventListener(){},setInterval(){},},document,HTMLImageElement:class HTMLImageElement{},localStorage,
  navigator:{onLine:false},location:{href:'https://academy.example/'},URL,URLSearchParams,Date,Map,Set,Array,String,Number,Math,Object,JSON,RegExp,Promise,Float64Array,encodeURIComponent,decodeURIComponent,
  setTimeout,clearTimeout,console:{info(){},warn(){},error(){}},fetch:async url=>String(url).includes('photo-sources-online.json')?fakeResponse(manifest):fakeResponse({photos:[]})
};
vm.runInNewContext(runtime,context,{filename:'photo-catalog-fix90.js',timeout:10000});
domEvents.DOMContentLoaded?.();
await new Promise(resolve=>setTimeout(resolve,0));
const api=context.window.NPA_PHOTO_CATALOG_FIX90;
check('Runtime FIX90 eksponuje klasyfikator, parser Openverse i walidator licencji',()=>{
  assert.equal(api.version,'6.8.0-fix90-online-photo-catalog-20261106');
  assert.equal(api.categoryFor('VRAM GDDR6 BGA memory chip'),'vram');
  assert.equal(api.categoryFor('RAM DDR5 SO-DIMM'),'ram');
  assert.equal(api.licenseAllowed('CC BY 4.0'),true);
  assert.equal(api.licenseAllowed('CC BY-NC 4.0'),false);
  assert.equal(api.isVramPhotoRelevant({title:'GDDR6 graphics memory BGA packages'}),true);
  assert.equal(api.isVramPhotoRelevant({title:'DDR5 SO-DIMM memory module'}),false);
});
check('Parser Openverse odrzuca NC i zwykłe DIMM jako VRAM, ale akceptuje BGA/GDDR',()=>{
  const good=api.parseOpenverse({id:'gddr-demo',title:'GDDR6 graphics memory BGA packages',creator:'Author A',license:'by',license_url:'https://creativecommons.org/licenses/by/4.0/',foreign_landing_url:'https://example.org/gddr',url:'https://images.example.org/gddr.jpg',thumbnail:'https://images.example.org/gddr-thumb.jpg',width:1600,height:900,tags:[{name:'GDDR6'},{name:'BGA package'}]},'vram');
  const dimm=api.parseOpenverse({id:'dimm-demo',title:'DDR5 SO-DIMM memory module',creator:'Author B',license:'by',foreign_landing_url:'https://example.org/dimm',url:'https://images.example.org/dimm.jpg',thumbnail:'https://images.example.org/dimm-thumb.jpg',width:1600,height:900,tags:[{name:'DDR5'},{name:'SO-DIMM'}]},'vram');
  const nc=api.parseOpenverse({id:'nc-demo',title:'Computer repair board',creator:'Author C',license:'by-nc',foreign_landing_url:'https://example.org/nc',url:'https://images.example.org/nc.jpg',thumbnail:'https://images.example.org/nc-thumb.jpg',width:1600,height:900},'board');
  assert.ok(good);assert.equal(good.category,'vram');assert.equal(dimm,null);assert.equal(nc,null);
});
for(const [file,source] of [['WEB_PUBLISH/assets/photo-catalog-fix90.js',runtime],['WEB_PUBLISH/assets/app.js',app],['ONECLICK_AKADEMIA.js',one],['AUTO_PUBLISH_WATCHER.js',watcher]]) new Function(source);
console.log(`FIX90 PHOTO CATALOG SUMMARY: ${checks.length}/${checks.length} PASS.`);
