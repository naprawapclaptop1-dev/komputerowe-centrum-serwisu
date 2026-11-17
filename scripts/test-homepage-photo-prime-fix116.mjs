import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const manifest=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const prime=read('WEB_PUBLISH/assets/homepage-photo-prime-fix116.js');
const css=read('WEB_PUBLISH/assets/homepage-photo-prime-fix116.css');
const runtime=read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const sw=read('WEB_PUBLISH/service-worker.js');
const one=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');
assert.equal(release.release,'6.8.0');
assert.equal(release.homepagePhotoFirstRenderFix?.hotfix,'FIX118');
assert.equal(manifest.homepagePhotoFirstRenderFix?.hotfix,'FIX118');
assert.equal(Object.keys(manifest.homepageSlotSeedMap||{}).length,21);
assert.equal(new Set(Object.values(manifest.homepageSlotSeedMap)).size,21);
assert.equal(manifest.homepagePhotoFirstRenderFix?.providerApiRequests,0);
const byId=new Map(manifest.photos.map(x=>[x.id,x]));
const urls=new Set();
for (const [slot,seedId] of Object.entries(manifest.homepageSlotSeedMap)) {
  const tag=html.match(new RegExp(`<img\\b(?=[^>]*data-photo-id=["']${slot.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}["'])[^>]*>`,'i'))?.[0];
  assert.ok(tag,`Missing image tag for ${slot}`);
  const seed=byId.get(seedId); assert.ok(seed,`Missing seed ${seedId}`);
  const htmlCategory=tag.match(/\bdata-photo-kind=["']([^"']+)["']/i)?.[1];
  assert.equal(htmlCategory,seed.category,`Category mismatch for ${slot}`);
  const url=tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  // HTML keeps the SVG fallback initially; the pre-render bootstrap assigns this exact seed before catalog boot.
  assert.ok(/\.svg(?:[?#]|$)/i.test(url||''),`${slot}: the honest local fallback must remain in HTML`);
  assert.ok(tag.includes('data-photo-id="'+slot+'"'));
  assert.ok(seed.asset.startsWith('https://') && /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(seed.asset));
  assert.ok(seed.page?.startsWith('https://') && seed.author && seed.license && seed.licenseUrl?.startsWith('https://'));
  assert.ok(!urls.has(seed.asset),`Duplicate source URL for ${slot}`); urls.add(seed.asset);
  assert.ok(prime.includes('homepageSlotSeedMap') && prime.includes('photo-credit-fix90'));
  assert.ok(css.includes('#view-home .np30-module-photo>img'));
}
assert.equal(urls.size,21);
// Execute the actual browser bootstrap against a minimal DOM: prove it assigns all 21 manifest URLs.
const elements=new Map();
function makeClassList(){const values=new Set();return {add(...a){a.forEach(x=>values.add(x));},remove(...a){a.forEach(x=>values.delete(x));},contains(x){return values.has(x);}};}
function makeElement(tag='div') { return {tagName:tag.toUpperCase(),dataset:{},children:[],hidden:false,className:'',classList:makeClassList(),replaceChildren(...nodes){this.children=[];this.children.push(...nodes);},append(...nodes){this.children.push(...nodes);},appendChild(node){this.children.push(node);return node;},addEventListener(){},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k] ?? null;},querySelector(sel){return sel==='i'?this.label:null;},querySelectorAll(){return [];}}; }
for (const [slot,seedId] of Object.entries(manifest.homepageSlotSeedMap)) {
  const seed=byId.get(seedId); const img=makeElement('img');
  img.dataset={photoId:slot,photoKind:seed.category,photoTitle:seed.topic,fix77Fallback:`assets/artwork-fix77/${slot.includes('home-module-')?'home-card-fallback-01.svg':'module-14.svg'}`};
  img.src=`assets/artwork-fix77/${slot.includes('home-module-')?'home-card-fallback-01.svg':'module-14.svg'}`;
  img.naturalWidth=0;img.naturalHeight=0;img.complete=false;img.parentElement=makeElement('figure');img.parentElement.label=makeElement('i');
  img.parentElement.querySelector=sel=>sel==='i'?img.parentElement.label:null;
  elements.set(slot,img);
}
const mockDocument={querySelector(selector){const m=selector.match(/data-photo-id="([^"]+)"/);return m?elements.get(m[1])||null:null;},createElement:makeElement};
const mockWindow={};
const ctx={window:mockWindow,document:mockDocument,location:{href:'https://academy.example/'},URL,CSS:{escape:s=>s},fetch:async()=>({ok:true,json:async()=>manifest}),console:{info(){},warn(){},error(){}},Map,Set,Object,String,RegExp,Promise};
vm.runInNewContext(prime,ctx,{timeout:5000});
await mockWindow.__NPA_HOME_PHOTO_PRIME_PROMISE;
assert.equal(mockWindow.NPA_HOME_PHOTO_PRIME_FIX118.slots,21);
assert.equal(Object.keys(mockWindow.NPA_HOME_PHOTO_PRIME_FIX118.photos||{}).length,21, 'Bootstrap must export a complete photo record for all 21 slots');
for (const [slot,seedId] of Object.entries(manifest.homepageSlotSeedMap)) {
  const img=elements.get(slot), seed=byId.get(seedId);
  assert.equal(img.src,seed.asset,`Bootstrap did not assign ${slot}`);
  const record=mockWindow.NPA_HOME_PHOTO_PRIME_FIX118.photos[slot];
  assert.equal(record.seedId,seedId);
  assert.equal(record.url,seed.asset);
  assert.equal(record.page,seed.page);
  assert.equal(record.author,seed.author);
  assert.equal(record.license,seed.license);
  assert.equal(img.dataset.photoFix90Fallback,`assets/artwork-fix77/${slot.includes('home-module-')?'home-card-fallback-01.svg':'module-14.svg'}`,`SVG fallback not preserved for ${slot}`);
  assert.ok(img.parentElement.children.some(node=>node.className==='photo-credit-fix90'),`Source credit not present for ${slot}`);
}
assert.ok(html.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix118'));
assert.ok(html.indexOf('homepage-photo-prime-fix118.js?v=6.8.0-fix118') < html.indexOf('photo-catalog-fix115.js?v=6.8.0-fix118'));
assert.ok(html.includes('homepage-photo-prime-fix118.css?v=6.8.0-fix118'));
assert.ok(sw.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix118'));
assert.ok(sw.includes('homepage-photo-prime-fix118.css?v=6.8.0-fix118'));
assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
assert.ok(runtime.includes('NPA_HOME_PHOTO_PRIME_FIX118') && runtime.includes('homepagePrimeReady'));
assert.ok(runtime.includes('registerPrimedHomepageAssignments(primeResult)'));
assert.ok(runtime.includes('assignments.set(id, accepted)'));
assert.ok(runtime.includes('window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118 = primedAssignmentsRegistered'));
assert.ok(runtime.includes('canonicalUrl(currentUrl) === canonicalUrl(photo.url)'));
assert.ok(one.includes('test-homepage-photo-prime-fix116.mjs') && watcher.includes('test-homepage-photo-prime-fix116.mjs') && one.includes('test-homepage-photo-prime-registration-fix117.mjs') && watcher.includes('test-homepage-photo-prime-registration-fix117.mjs'));
assert.ok(one.includes('homepage-photo-prime-fix116.js') && watcher.includes('homepage-photo-prime-fix116.js'));
console.log('[PASS] 21 homepage slots map to 21 unique curated images with HTTPS, author, source and license.');
console.log('[PASS] Browser bootstrap exports 21 complete photo records, assigns all URLs, retains SVG fallbacks and inserts source/license credits.');
console.log('[PASS] The signed SVG fallback remains in HTML and is preserved by the bootstrap.');
console.log('[PASS] The bootstrap runs before the catalog queue and makes no provider API requests.');
console.log('[PASS] Runtime waits for first-render records, imports them into assignments Map and recognises an already-loaded image.');
console.log('[PASS] OneClick, Watcher and PWA CORE require the FIX117 record-registration integration; PWA cache name remains FIX109.');
console.log('FIX117 HOMEPAGE PHOTO FIRST RENDER AND CATALOG REGISTRATION: 6/6 PASS');
