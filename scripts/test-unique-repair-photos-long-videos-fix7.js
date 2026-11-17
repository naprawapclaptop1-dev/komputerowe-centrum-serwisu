'use strict';
// FIX50 catalog coverage: 155 repair records × 3 distinct local images per record = 465 ready slots.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const art=read('WEB_PUBLISH/assets/lesson-art.js');
const registry=JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const html=read('WEB_PUBLISH/index.html'),app=read('WEB_PUBLISH/assets/app.js'),sw=read('WEB_PUBLISH/service-worker.js');
const faults=Array.from({length:155},(_,i)=>({id:`FAULT-${String(i+1).padStart(3,'0')}`,title:`Diagnostyka laptopa ${i+1}`,category:i%5===0?'RAM':i%5===1?'Dyski':i%5===2?'Zasilanie':i%5===3?'Chłodzenie':'Płyta główna'}));
const ctx={window:{ACADEMY_DATA:{faults},ACADEMY_ART:{}},document:{addEventListener(){}},navigator:{onLine:false},localStorage:{getItem(){return null},setItem(){},removeItem(){}},URL,URLSearchParams,Date,Math,Number,String,JSON,Object,Array,Map,Set,RegExp,Error,Promise,setTimeout,clearTimeout,console:{info(){},warn(){}},fetch:async()=>{throw Error('offline fetch not expected')}};
vm.createContext(ctx);vm.runInContext(art,ctx,{timeout:5000});
const api=ctx.window.ACADEMY_ART;let slots=0;
for(const fault of faults){
 const photos=api.getRepairPhotos(fault);
 assert.equal(photos.length,3,`${fault.id} should have 3 photos`);
 assert.ok(photos.every(x=>x.local&&x.url.startsWith('media/')));
 assert.equal(new Set(photos.map(x=>x.url)).size,3,`${fault.id} repeated a local slot`);
 for(const photo of photos){assert.ok(fs.existsSync(path.join(root,'WEB_PUBLISH',photo.url)));slots++;}
}
assert.equal(slots,465);
assert.equal(registry.uniqueRepairPhotoPolicy.localFirst,true);
assert.equal(registry.uniqueRepairPhotoPolicy.offlineFallback,true);
assert.ok(app.includes('getRepairPhotos?.(f)')&&app.includes('data-photo-slot=')&&app.includes('data-repair-photo='));
assert.ok(html.includes('lesson-art.js?v=6.8.0-fix51-visual-assets-reuse'));
assert.ok(sw.includes('/media/laptop-board-inspection.jpg')&&sw.includes('/media/motherboard-multimeter-test.jpg'));
const videoRuntime=read('WEB_PUBLISH/assets/long-video-catalog-620.js');
const box={window:{}};vm.createContext(box);vm.runInContext(videoRuntime,box);
const videos=box.window.ACADEMY_LONG_VIDEOS;
assert(videos.length>=12);assert.equal(new Set(videos.map(v=>v.id)).size,videos.length);assert.equal(new Set(videos.map(v=>v.photoId)).size,videos.length);
console.log(`PASS FIX50: 155 repair cards × 3 different local photos = ${slots} existing image slots; ${videos.length} long lessons retain unique covers.`);
