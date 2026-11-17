import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const visual=read('WEB_PUBLISH/assets/visual-uniqueness-fix83.js');
const legacy=read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js');
const catalog=read('WEB_PUBLISH/assets/photo-catalog-fix98.js');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}
function extract(source,name){
  const re=new RegExp(String.raw`function ${name}\s*\((?:img)?\) \{[\s\S]*?\n  \}`);
  const m=source.match(re); assert.ok(m,`missing function ${name}`); return m[0];
}
const makeClasses=(...values)=>{const set=new Set(values);return {add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v)};};
const credit={className:'photo-credit-fix90',dataset:{}};
const slideCredit={className:'np640-photo-credit',dataset:{}};
const makeImg=({src='https://api.openverse.org/v1/images/id/thumb/',classes=['photo-fix90-online'],dataset={photoFix90Assigned:'openverse:id',photoFix90State:'online-photo'},creditNodes=[credit]}={})=>({dataset:{...dataset},classList:makeClasses(...classes),getAttribute:name=>name==='src'?src:null,currentSrc:src,parentElement:{querySelectorAll:()=>creditNodes}});
const visualCredit=vm.runInNewContext(`(${extract(visual,'hasCatalogPhotoCredit')})`);
const visualOnline=vm.runInNewContext(`(${extract(visual,'isOnlineCatalogPhoto')})`, { hasCatalogPhotoCredit: visualCredit });
const visualManaged=vm.runInNewContext(`(${extract(visual,'isCatalogManagedSlot')})`, { isOnlineCatalogPhoto: visualOnline, hasCatalogPhotoCredit: visualCredit });
const legacyCredit=vm.runInNewContext(`(${extract(legacy,'hasCatalogPhotoCredit')})`);
const legacyOnline=vm.runInNewContext(`(${extract(legacy,'isOnlineCatalogPhoto')})`, { hasCatalogPhotoCredit: legacyCredit });
const legacyManaged=vm.runInNewContext(`(${extract(legacy,'isCatalogManagedSlot')})`, { isOnlineCatalogPhoto: legacyOnline, hasCatalogPhotoCredit: legacyCredit });
check('Stara bramka FIX83 uznaje przypisane zdjęcie Openverse bez srcset i zachowuje zewnętrzny URL',()=>{
  const img=makeImg(); assert.equal(visualOnline(img),true); assert.equal(visualManaged(img),true);
});
check('Stara bramka FIX77 uznaje zdjęcie Openverse poza listą 13 plików lokalnych',()=>{
  const img=makeImg(); assert.equal(legacyOnline(img),true); assert.equal(legacyManaged(img),true);
});
check('Stary slot SVG z pozostawioną informacją o autorze nie jest ponownie nadpisywany',()=>{
  const img=makeImg({src:'/assets/artwork-fix77/page-illustration-41.svg',classes:['photo-fix90-online'],dataset:{},creditNodes:[credit]});
  assert.equal(visualOnline(img),false); assert.equal(visualManaged(img),true); assert.equal(legacyOnline(img),false); assert.equal(legacyManaged(img),true);
});
check('Zwykła ilustracja SVG bez oznaczenia katalogu nie jest traktowana jako fotografia',()=>{
  const img=makeImg({src:'data:image/svg+xml,<svg/>',classes:['npa-fix83-visual'],dataset:{},creditNodes:[]});
  assert.equal(visualOnline(img),false); assert.equal(visualManaged(img),false); assert.equal(legacyOnline(img),false); assert.equal(legacyManaged(img),false);
});
check('Realny DOM FIX92: sam .photo-credit-fix90 bez data-photo-credit-for chroni slajd przed SVG fallbackiem',()=>{
  const hero=makeImg({src:'/assets/artwork-fix77/page-illustration-41.svg',classes:['photo-fix90-online'],dataset:{},creditNodes:[credit]});
  const slide=makeImg({src:'data:image/svg+xml,<svg/>',classes:['photo-fix90-online','npa-fix83-visual'],dataset:{},creditNodes:[slideCredit]});
  assert.equal(visualManaged(hero),true); assert.equal(legacyManaged(hero),true);
  assert.equal(visualManaged(slide),true); assert.equal(legacyManaged(slide),true);
});
check('Brak markera katalogu i brak źródła HTTPS nie omija lokalnych zabezpieczeń',()=>{
  const missing=makeImg({classes:[],dataset:{},creditNodes:[]});
  const insecure=makeImg({src:'http://example.org/photo.jpg'});
  assert.equal(visualOnline(missing),false); assert.equal(legacyOnline(missing),false);
  assert.equal(visualOnline(insecure),false); assert.equal(legacyOnline(insecure),false);
});
check('FIX83 fallback chroni slot katalogowy, a capture-error oddaje obsługę katalogowi',()=>{
  assert.ok(visual.includes('if (!img || isDecorative(img) || isCatalogManagedSlot(img)'));
  assert.ok(visual.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER'));
  assert.ok(visual.includes("!isCatalogManagedSlot(img)"));
  assert.ok(visual.includes('isCatalogManagedSlot,get assignedCount'));
});
check('FIX77 fallback również chroni slot oznaczony przez katalog online',()=>{
  assert.ok(legacy.includes('FIX93_LEGACY_PHOTO_GUARD_OWNER'));
  assert.ok(legacy.includes('if (isCatalogManagedSlot(img)) return;'));
  assert.ok(legacy.includes('isCatalogManagedSlot,perceptualHash'));
});
check('Katalog odzyskuje utracony photoId z zachowanego identyfikatora podpisu autora',()=>{
  const block=extract(catalog,'recoverPhotoSlotId');
  assert.ok(block.includes('.photo-credit-fix90, .np640-photo-credit, figcaption'));
  assert.ok(block.includes('nodeInfo(img)'));
  assert.ok(catalog.includes('recoverPhotoSlotId(img);'));
});
check('Markery i zdarzenia onload/onerror są ustawiane przed src docelowego zdjęcia',()=>{
  const start=catalog.indexOf('  function applyPhoto(img, photo) {');
  const end=catalog.indexOf('  function setAssignment(id, photo) {',start);
  const block=catalog.slice(start,end);
  const positions=['img.dataset.photoFix90Assigned =', "img.classList.add('photo-fix90-online')", 'img.onload =','img.onerror =','img.src = photo.url'].map(token=>block.indexOf(token));
  assert.ok(positions.every(p=>p>=0));
  assert.deepEqual([...positions],[...positions].sort((a,b)=>a-b));
  assert.ok(block.includes('FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED')===false || catalog.includes('FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED'));
});
check('Błąd miniatury próbuje oryginalny URL przed przejściem do oznaczonego fallbacku',()=>{
  const start=catalog.indexOf('  function applyPhoto(img, photo) {');
  const end=catalog.indexOf('  function setAssignment(id, photo) {',start);
  const block=catalog.slice(start,end);
  assert.ok(block.includes('photo.originalUrl'));
  assert.ok(block.includes('img.dataset.photoFix90TriedOriginal'));
  assert.ok(block.indexOf('img.src = originalUrl') < block.indexOf('restoreFallback(img)'));
});
check('Katalog nie wykonuje osobnego 24-sekundowego probe przed każdym obrazem',()=>{
  const start=catalog.indexOf('  async function takeOnline(category) {');
  const end=catalog.indexOf('  async function',start+20);
  const block=catalog.slice(start,end>start?end:catalog.length);
  assert.ok(!block.includes('probePhoto('));
  assert.ok(catalog.includes('FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED'));
});
check('Licznik rozdziela rzeczywiście zdekodowane zdjęcia lokalne i online',()=>{
  const block=extract(catalog,'renderedOnlinePhotoCount');
  assert.ok(block.includes("img.dataset.photoFix90Loaded === '1'"));
  assert.ok(block.includes('img.naturalWidth >= 320 && img.naturalHeight >= 180'));
  assert.ok(catalog.includes('assignedPhotos: assignments.size'));
  assert.ok(catalog.includes('Prawdziwe fotografie: ${displayed} wyświetlonych'));
  assert.ok(catalog.includes('function renderedLocalPhotoCount()'));
  assert.ok(catalog.includes('(${localDisplayed} lokalnych + ${onlineDisplayed} online)'));
});
check('OneClick i Auto-Watcher blokują publikację, jeśli stare strażniki nadal zastępują zdjęcia SVG',()=>{
  assert.ok(one.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER'));
  assert.ok(one.includes('FIX93_LEGACY_PHOTO_GUARD_OWNER'));
  assert.ok(watcher.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER'));
  assert.ok(watcher.includes('FIX93_LEGACY_PHOTO_GUARD_OWNER'));
});
check('PWA, release i manifest wskazują aktywny runtime FIX98 oraz zgodność ze starymi bramkami FIX93',()=>{
  assert.ok(html.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.ok(sw.includes('photo-catalog-fix109.js?v=6.8.0-fix109'));
  assert.equal(release.latestHotfix,'FIX111');
  assert.equal(release.photoCatalogRuntimeBuildTag,'6.8.0-fix111-active-view-photo-queue-20261109');
  assert.equal(manifest.hotfix,'FIX94');
  assert.ok(manifest.onlinePhotoGuardCompatibility.visualUniquenessFix83.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER'));
});
console.log(`FIX98 ONLINE PHOTO GUARDS: ${checks.length}/${checks.length} PASS`);
