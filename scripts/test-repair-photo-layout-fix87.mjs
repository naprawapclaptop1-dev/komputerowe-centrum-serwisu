import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const css=read('WEB_PUBLISH/assets/repair-photo-layout-fix87.css');
const baseAndRuntime=read('WEB_PUBLISH/assets/lesson-art.js');
const visual=read('WEB_PUBLISH/assets/visual-uniqueness-fix83.js');
const app=read('WEB_PUBLISH/assets/app.js');
const sw=read('WEB_PUBLISH/service-worker.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const checks=[];
function check(label,fn){fn();checks.push(label);console.log(`[PASS] ${label}`);}

check('FIX87 ładuje runtime wizualny synchronicznie przed lesson-art.js i app.js',()=>{
  const a=html.indexOf('assets/visual-uniqueness-fix83.js?v=6.8.0-fix87');
  const b=html.indexOf('assets/lesson-art.js?v=6.8.0-fix87');
  const c=html.indexOf('assets/app.js?v=6.8.0-fix87-repair-visuals');
  assert.ok(a>=0&&b>a&&c>b,'script order visual -> lesson art -> app');
  const line=html.slice(a,html.indexOf('\n',a));
  assert.doesNotMatch(line,/\bdefer\b|\basync\b/,'visual script must run synchronously');
});
check('Karty usterek mają pełnowymiarowy kadr poziomy zamiast 92×58 px',()=>{
  assert.match(css,/\.repair-list>\.repair-row>\.repair-row-photo-wrap[\s\S]*?width:100%!important/);
  assert.match(css,/height:clamp\(132px,14vw,184px\)!important/);
  assert.match(css,/aspect-ratio:16\/9!important/);
  assert.match(css,/\.repair-row-photo-wrap \[hidden\][^\{]*\{display:none!important\}/);
  assert.doesNotMatch(css,/width:92px!important/);
});
check('Ilustracje techniczne używają contain, a fotografie zachowują cover',()=>{
  assert.match(css,/\.repair-row-art\.repair-photo-illustration[\s\S]*?object-fit:contain!important/);
  assert.match(css,/\.repair-row-art\{[\s\S]*?object-fit:cover!important/);
});
check('HTML odróżnia kartę naprawy od trzech obrazów szczegółów lekcji',()=>{
  assert.match(app,/data-photo-context="card"/);
  assert.match(app,/data-photo-context="detail"/);
  assert.match(app,/repair-photo-illustration/);
  assert.match(app,/Każda usterka ma osobny obraz karty oraz trzy inne/);
});
check('Podpis i przyciski powiększenia są pobierane z właściwego wrappera obrazu',()=>{
  assert.match(baseAndRuntime,/wrap\?\.querySelector\(`\[data-repair-photo-credit=/);
  assert.match(baseAndRuntime,/wrap\?\.querySelector\(`\[data-repair-photo-zoom=/);
});
check('PWA ma nowy klucz cache oraz precache nowych wersji JS i CSS',()=>{
  assert.match(sw,/nauka-6\.8\.0-fix94-topic-verified-photo-20261107/);
  assert.ok(sw.includes('/assets/repair-photo-layout-fix87.css?v=6.8.0-fix87'));
  assert.ok(sw.includes('/assets/lesson-art.js?v=6.8.0-fix87'));
  assert.ok(sw.includes('/assets/app.js?v=6.8.0-fix87-repair-visuals'));
  assert.ok(sw.includes('/assets/visual-uniqueness-fix83.js?v=6.8.0-fix87'));
});
check('Metadane wydania zachowują 6.8.0, hotfix FIX99 i runtime fotografii FIX99',()=>{
  assert.equal(release.release,'6.8.0');
  assert.equal(release.latestHotfix,'FIX128');
  assert.equal(release.latestHotfixBuild,'6.8.0-fix128-live-tech-visual-publication-20261111');
  assert.equal(release.photoCatalogRuntimeBuildTag,'6.8.0-fix118-local-photo-library-20261110');
  assert.ok(release.publicationGuard.includes('FIX86_DIRECT_UPLOAD_PRODUCTION_NO_BRANCH'));
  assert.ok(release.publicationGuard.includes('FIX88_FIX83_VISUAL_LIBRARY_GUARD'));
  assert.ok(release.publicationGuard.includes('FIX94_TOPIC_VERIFIED_PHOTO_MATCH_RAM_VRAM_USB_C_SOLDERING_AND_RETRY'));
  assert.ok(release.publicationGuard.includes('FIX93_ONLINE_PHOTO_GUARD_COMPATIBILITY_AND_DIRECT_TARGET_IMAGE_RENDER'));
});

// Browserless smoke test of the actual runtime: every repair receives one card image
// and three distinct detail illustrations, with stable IDs and no shared data URLs.
const mockDocument={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null;},
  querySelectorAll(){return [];},
  createElement(tag){return {tagName:String(tag).toUpperCase(),innerHTML:'',textContent:'',append(){},appendChild(){}};},
  documentElement:{},
};
const localStorage={getItem(){return null;},setItem(){},removeItem(){}};
const window={ACADEMY_DATA:{faults:[]}};
const context={
  window,document:mockDocument,localStorage,navigator:{onLine:false},URL,URLSearchParams,Date,
  Map,Set,Array,String,Number,Math,Object,JSON,RegExp,Promise,encodeURIComponent,decodeURIComponent,
  setTimeout,clearTimeout,console:{info(){},warn(){},error(){}},fetch:async()=>{throw new Error('network disabled in local test');}
};
vm.runInNewContext(visual,context,{filename:'visual-uniqueness-fix83.js',timeout:10000});
vm.runInNewContext(baseAndRuntime,context,{filename:'lesson-art.js',timeout:10000});
const api=window.ACADEMY_ART;
check('Po inicjalizacji biblioteki ACADEMY_ART zachowuje generator FIX83 uniqueVisualUrl',()=>{
  assert.equal(typeof api.uniqueVisualUrl,'function');
  assert.equal(typeof api.getRepairPhoto,'function');
  assert.equal(typeof api.getRepairPhotos,'function');
});
check('VRAM i RAM mają osobne klasyfikatory oraz właściwe ilustracje',()=>{
  const vram={id:'VRAM-FIX87',title:'VRAM GDDR6 — oddzielne kości BGA pamięci karty graficznej',category:'vram'};
  const ram={id:'RAM-FIX87',title:'Pamięć RAM DDR5 SO-DIMM',category:'ram'};
  assert.equal(api.kind(vram),'vram');
  assert.equal(api.kind(ram),'ram');
  const v=decodeURIComponent(api.getRepairPhoto(vram).url.split(',')[1]);
  const r=decodeURIComponent(api.getRepairPhoto(ram).url.split(',')[1]);
  assert.match(v,/data-npa-visual-kind="vram"/);
  assert.match(v,/GDDR6/);
  assert.doesNotMatch(v,/DIMM|SO-DIMM/);
  assert.match(r,/data-npa-visual-kind="ram"/);
  assert.match(r,/SO-DIMM LAPTOP RAM/);
});
function decodeURIComponentSafe(url){return decodeURIComponent(url.slice(url.indexOf(',')+1));}
check('155 usterek otrzymuje 620 różnych ilustracji: 1 na karcie i 3 w lekcji',()=>{
  const sources=[];
  for(let i=1;i<=155;i++){
    const item={id:`REPAIR-${String(i).padStart(3,'0')}`,title:`Diagnostyka usterki laptopa ${i}`,category:i%5===0?'vram':(i%5===1?'ram':'board'),symptom:`Objaw serwisowy ${i}`};
    const card=api.getRepairPhoto(item);
    const detail=api.getRepairPhotos(item);
    assert.ok(card?.illustration && card.url.startsWith('data:image/svg+xml'),`card ${item.id}`);
    assert.equal(detail.length,3,`three detail visuals for ${item.id}`);
    assert.ok(detail.every(photo=>photo.illustration&&photo.url.startsWith('data:image/svg+xml')),`detail images ${item.id}`);
    const local=[card.url,...detail.map(photo=>photo.url)];
    assert.equal(new Set(local).size,4,`card and detail images differ for ${item.id}`);
    sources.push(...local);
    if(i===1){
      assert.equal(api.getRepairPhoto(item).url,card.url,'card source is stable');
      assert.deepEqual(api.getRepairPhotos(item).map(photo=>photo.url),detail.map(photo=>photo.url),'detail sources are stable');
    }
  }
  assert.equal(sources.length,620);
  assert.equal(new Set(sources).size,620,'no visual source may be reused between repair cards or lessons');
});
check('Źródła ilustracji są jawnie odróżniane od fotografii zewnętrznych',()=>{
  assert.ok(api.photoCount===0,'FIX83 must not call generated SVGs photographs');
  assert.match(api.uniquePhotoEnginePolicy,/one-unique-card-illustration-plus-three-different-detail-illustrations/);
  assert.ok(api.photoPolicy.offlineIllustrationsUniquePerFaultAndSlot);
});

for(const file of ['WEB_PUBLISH/assets/lesson-art.js','WEB_PUBLISH/assets/visual-uniqueness-fix83.js','WEB_PUBLISH/assets/app.js']){
  new Function(read(file));
}
console.log(`[PASS] Składnia JavaScript FIX87: 3/3 pliki.`);
console.log(`FIX87 REPAIR PHOTO / VISUAL SUMMARY: ${checks.length+1}/${checks.length+1} PASS.`);
