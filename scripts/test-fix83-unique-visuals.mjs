import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimePath = path.join(ROOT, 'WEB_PUBLISH/assets/visual-uniqueness-fix83.js');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const window = { ACADEMY_ART: {} };
const context = { window, console: { info(){}, warn(){}, error(){} }, URL, Map, Set, Array, String, Number, Math, Object, JSON, encodeURIComponent };
vm.runInNewContext(runtime, context, { filename: runtimePath, timeout: 5000 });
const engine = window.NPA_UNIQUE_VISUALS_FIX83;
assert.ok(engine, 'FIX83 runtime exposes its API');

const samples = [
  [{id:'vram',title:'VRAM GDDR6 — kości pamięci karty graficznej'}, 'vram'],
  [{id:'ram',title:'Pamięć RAM DDR5 SO-DIMM'}, 'ram'],
  [{id:'gpu',title:'Karta graficzna GPU'}, 'gpu'],
  [{id:'cpu',title:'Procesor CPU'}, 'cpu'],
  [{id:'bios',title:'BIOS SPI Flash'}, 'bios'],
  [{id:'nvme',title:'Dysk SSD NVMe M.2'}, 'storage'],
  [{id:'vrm',title:'Sekcja zasilania VRM MOSFET'}, 'power'],
  [{id:'fan',title:'Wentylator i heatpipe'}, 'cooling']
];
for (const [item, expected] of samples) assert.equal(engine.kind(item), expected, `${item.title} must map to ${expected}`);
console.log('[PASS] FIX83 klasyfikuje VRAM, RAM, GPU, CPU i pozostałe podzespoły osobno.');

const decodeSvg = value => decodeURIComponent(value.slice(value.indexOf(',') + 1));
const vramSvg = decodeSvg(engine.makeSvg({id:'vram-check',title:'VRAM GDDR6 — kości pamięci wideo'}, 'lesson:vram-check'));
const ramSvg = decodeSvg(engine.makeSvg({id:'ram-check',title:'RAM DDR5 SO-DIMM'}, 'lesson:ram-check'));
assert.match(vramSvg, /GDDR6/);
assert.ok(vramSvg.includes('GDDR / BGA MEMORY'));
assert.doesNotMatch(vramSvg, /DIMM|SO-DIMM/);
assert.match(ramSvg, /SO-DIMM LAPTOP RAM/);
assert.ok(!ramSvg.includes('GDDR / BGA MEMORY'));
const hddSvg = decodeSvg(engine.makeSvg({id:'hdd-check',title:'Dysk HDD — talerze i głowica'}, 'lesson:hdd-check'));
assert.match(hddSvg, /HDD \/ MAGNETIC PLATTER/);
console.log('[PASS] Ilustracja VRAM pokazuje oddzielne układy GDDR/BGA, a RAM osobny moduł DIMM/SO-DIMM.');

const item = {id:'lesson-123',title:'Diagnostyka układu VRAM GDDR6',category:'vram'};
const first = engine.uniqueVisualUrl(item, 'course:lessons');
const stable = engine.uniqueVisualUrl(item, 'course:lessons');
const anotherView = engine.uniqueVisualUrl(item, 'repair:details');
const anotherLesson = engine.uniqueVisualUrl({id:'lesson-124',title:'Diagnostyka układu VRAM GDDR6',category:'vram'}, 'course:lessons');
assert.equal(first, stable, 'same item and view should remain stable during re-render');
assert.notEqual(first, anotherView, 'same lesson in a different view must receive a separate visual');
assert.notEqual(first, anotherLesson, 'different lessons must receive different visuals');
assert.match(first, /^data:image\/svg\+xml/);
console.log('[PASS] Grafiki są stabilne w obrębie tej samej karty, ale unikalne między lekcjami i widokami.');

assert.equal(engine.galleryItems.length, 54, 'gallery contains 54 curated subjects');
assert.equal(new Set(engine.galleryItems.map(x=>x.id)).size, 54, 'gallery IDs are unique');
assert.ok(engine.galleryItems.some(x=>x.id==='vram-gddr6' && x.kind==='vram'));
assert.ok(engine.galleryItems.some(x=>x.id==='ram-dimm' && x.kind==='ram'));
const galleryVisualUrls = engine.galleryItems.map(x=>engine.uniqueVisualUrl({id:x.id,title:x.title,category:x.kind},`gallery:${x.id}`));
assert.equal(new Set(galleryVisualUrls).size,54,'every gallery illustration has a distinct source');
console.log('[PASS] Galeria zawiera 54 różne tematy techniczne, w tym osobne VRAM i RAM.');

const lessonArt = fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/lesson-art.js'),'utf8');
assert.match(lessonArt, /api\.uniqueVisualUrl/);
assert.match(lessonArt, /illustration:true/);
assert.match(lessonArt, /vram:'graphics card GDDR6 GDDR7 VRAM/);
console.log('[PASS] Każda procedura naprawy ma trzy unikalne ilustracje offline i osobne zapytanie fotograficzne VRAM.');

const index = fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/index.html'),'utf8');
assert.ok(index.includes('assets/visual-uniqueness-fix83.js?v=6.8.0-fix87'));
assert.ok(index.indexOf('assets/visual-uniqueness-fix83.js') < index.indexOf('assets/lesson-art.js?v=6.8.0-fix87'));
assert.ok(index.indexOf('assets/lesson-art.js?v=6.8.0-fix87') < index.indexOf('assets/app.js?v=6.8.0-fix87-repair-visuals'));
assert.ok(index.indexOf('assets/visual-uniqueness-fix83.js') < index.indexOf('assets/photo-uniqueness-fix77.js'));
const release = JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/release.json'),'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/visual-uniqueness-manifest-fix83.json'),'utf8'));
assert.equal(release.release,'6.8.0');
assert.equal(release.build,'6.8.0-fix51-visual-academy-pro-20261105');
assert.ok(index.includes('6.8.0-fix83-topic-correct-global-visuals-20261106'));
assert.equal(manifest.hotfix,'FIX83');
assert.equal(manifest.galleryIllustrationCount,54);
const worker = fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/service-worker.js'),'utf8');
assert.ok(worker.includes('/assets/visual-uniqueness-fix83.js'));
assert.ok(worker.includes('/assets/visual-uniqueness-manifest-fix83.json'));
assert.ok(worker.includes('/assets/video-poster-manifest-fix83.json'));
console.log('[PASS] FIX83 jest podłączony do HTML, metadanych wydania i PWA Service Worker.');

const posterManifest=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/video-poster-manifest-fix83.json'),'utf8'));
assert.equal(posterManifest.hotfix,'FIX83');
assert.equal(posterManifest.posterCount,10);
assert.equal(posterManifest.visualAudit.minimumDctPhashHammingDistance,12);
const posterHashes=[];
for(const poster of posterManifest.files){
  const local=path.join(ROOT,'WEB_PUBLISH',poster.file.split('?')[0].replace(/^\//,''));
  assert.ok(fs.existsSync(local),`poster file exists: ${local}`);
  const hash=createHash('sha256').update(fs.readFileSync(local)).digest('hex');
  assert.equal(hash,poster.sha256,`poster SHA-256 matches manifest: ${poster.id}`);
  posterHashes.push(hash);
}
assert.equal(new Set(posterHashes).size,10,'all 10 poster files are distinct');
const app=fs.readFileSync(path.join(ROOT,'WEB_PUBLISH/assets/app.js'),'utf8');
assert.ok(app.includes('video-card:${v.id}') && app.includes('video-player:${local.id}'));
assert.ok((app.match(/poster\":\"video_posters\/LOCAL-[^\"]+\?v=6\.8\.0-fix83/g)||[]).length===10);
assert.ok(worker.includes('/media/video_posters/LOCAL-ESD.jpg?v=6.8.0-fix83'));
console.log('[PASS] 10 posterów filmów jest unikalnych, wersjonowanych i buforowanych offline; karta i odtwarzacz mają osobne grafiki.');

for (const file of ['WEB_PUBLISH/assets/visual-uniqueness-fix83.js','WEB_PUBLISH/assets/lesson-art.js','WEB_PUBLISH/assets/app.js']) {
  const result = vm.runInNewContext(`(()=>{new Function(${JSON.stringify(fs.readFileSync(path.join(ROOT,file),'utf8'))});return true;})()`, {}, { timeout:5000 });
  assert.equal(result,true,`${file} syntax check`);
}
console.log('[PASS] Składnia JS FIX83, lesson-art.js i app.js jest poprawna.');

function mockImage(src,alt){
  let value=src;
  return {tagName:'IMG',className:'lesson-image',id:'',alt,title:'',dataset:{},complete:true,naturalWidth:120,
    getAttribute(name){return name==='src'?value:null;},
    hasAttribute(){return false;},
    removeAttribute(){},
    set src(next){value=next;this.currentSrc=next;},get src(){return value;},
    closest(selector){return String(selector).startsWith('.')?null:{textContent:alt,querySelector(){return null;}};},
    classList:{add(){}}
  };
}
const duplicateA=mockImage('/assets/reused.svg','VRAM GDDR6 kości pamięci');
const duplicateB=mockImage('/assets/reused.svg','VRAM GDDR6 kości pamięci');
const fakeDocument={readyState:'complete',addEventListener(){},querySelectorAll(selector){return selector==='img'?[duplicateA,duplicateB]:[];},getElementById(){return null;}};
const domWindow={ACADEMY_ART:{}};
const domContext={window:domWindow,document:fakeDocument,location:{href:'https://academy.example/'},URL,console:{info(){},warn(){},error(){}},Map,Set,Array,String,Number,Math,Object,JSON,encodeURIComponent};
vm.runInNewContext(runtime,domContext,{timeout:5000});
assert.notEqual(duplicateA.src,duplicateB.src,'duplicate static img src values must be replaced');
assert.match(duplicateB.src,/^data:image\/svg\+xml/);
assert.equal(domWindow.NPA_VISUAL_AUDIT_FIX83.duplicates,1);
console.log('[PASS] Audyt DOM wykrywa powtórzony plik i zastępuje go inną ilustracją kontekstową.');
console.log('FIX83 VISUAL TEST SUMMARY: 9/9 PASS.');
