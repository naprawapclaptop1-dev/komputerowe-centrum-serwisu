import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const guard=read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.js');
const expansion=read('WEB_PUBLISH/assets/global-academy-expansion-fix73.js');
const photoRuntime=read('WEB_PUBLISH/assets/photo-uniqueness-fix77.js');
const lightbox=read('WEB_PUBLISH/assets/home-learning-fix75.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest=JSON.parse(read('WEB_PUBLISH/assets/homepage-tech-visuals-fix122.json'));
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log(`[PASS] ${name}`)};
const gridStart=html.indexOf('<div class="np640-module-grid np30-module-grid">');
const gridEnd=html.indexOf('</div>\n        </section>',gridStart);
assert.ok(gridStart>=0&&gridEnd>gridStart,'Nie znaleziono siatki modułów.');
const cards=[...html.slice(gridStart,gridEnd).matchAll(/<button\b[\s\S]*?<\/button>/g)].map(x=>x[0]);
const cardData=cards.map(x=>({src:x.match(/<img[^>]*\bsrc="([^"]+)"/)?.[1]||'',gax:x.match(/data-gax-open="([^"]+)"/)?.[1]||''}));
const homeImgPaths=manifest.images.map(x=>x.path);
check('pulpit A–Z zachowuje 19 modułów, w tym sześć nowych ćwiczeń i symulatorów',()=>{
 assert.equal(cards.length,19);
 assert.deepEqual(cardData.slice(13).map(x=>x.gax),['faultlab','electronics','boardview','compatibility','servicesim','cert']);
 assert.ok(cardData.every(x=>x.src));
});
check('36 slotów strony głównej korzysta wyłącznie z odrębnych lokalnych ilustracji SVG bez postaci',()=>{
 assert.equal(manifest.hotfix,'FIX122');assert.equal(manifest.productVersion,'6.8.0');
 assert.equal(manifest.totalImages,36);assert.equal(homeImgPaths.length,36);
 assert.equal(new Set(homeImgPaths).size,36);
 assert.ok(manifest.images.every(x=>x.kind==='local-svg-technical-illustration'&&x.humanSubjectsAllowed===false&&/\.svg$/i.test(x.path)));
 for(const rel of homeImgPaths){const p=path.join(WEB,rel);assert.ok(fs.existsSync(p),`Brak ${rel}`);assert.ok(fs.statSync(p).size>200,`Pusty plik ${rel}`);}
});
check('kafelki, hero, pokaz slajdów i specjalizacje korzystają z zatwierdzonych slotów SVG',()=>{
 assert.ok(cardData.every(x=>/^assets\/artwork-fix77\/[a-z0-9-]+\.svg$/i.test(x.src)));
 assert.equal(new Set(cardData.map(x=>x.src)).size,19);
 const slides=[...html.matchAll(/<article\b[^>]*class="[^"]*np640-slide[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(slides.length,6);assert.ok(slides.every(x=>/^assets\/artwork-fix77\/slide-\d{2}\.svg$/i.test(x)));
 assert.equal(new Set(slides).size,6);
 assert.ok(homeImgPaths.some(x=>x.endsWith('hero-main.svg')));
});
check('globalny FIX123 blokuje zewnętrzne fotografie, dostawców i dynamiczne podmiany obrazów',()=>{
 assert.equal(release.sitewideVisualPolicy?.hotfix,'FIX123');
 assert.equal(release.sitewideVisualPolicy?.peopleVisible,false);
 assert.equal(release.sitewideVisualPolicy?.handsVisible,false);
 assert.equal(release.sitewideVisualPolicy?.externalPhotoProvidersEnabled,false);
 for(const token of ['SITEWIDE_NO_VISIBLE_PEOPLE_OR_HANDS','api.openverse.org','commons.wikimedia.org','MutationObserver','photoEligible','photoIgnore'])assert.ok(guard.includes(token),`Brak ochrony: ${token}`);
 assert.ok(html.includes('sitewide-tech-visuals-fix123.js'));
});
check('203 ilustracje danych lekcji i zasoby offline pozostają kompletne',()=>{
 const academyData=read('WEB_PUBLISH/assets/academy-data.js');
 const paths=[...academyData.matchAll(/assets\/artwork-fix77\/academy-data-\d{3}\.svg/g)].map(x=>x[0]);
 assert.equal(paths.length,203);assert.equal(new Set(paths).size,203);
 for(const rel of [paths[0],paths[paths.length-1]])assert.ok(fs.existsSync(path.join(WEB,rel)),`Brak ${rel}`);
 assert.ok(sw.includes('length:203')&&sw.includes('artwork-fix77/academy-data-'));
 assert.ok(sw.includes('homepage-tech-only-fix122.js')&&sw.includes('homepage-tech-visuals-fix122.json'));
 assert.ok(expansion.includes('localVisuals'));
});
check('stary katalog zdjęć nie przejmuje kafelków, a wcześniejsze mechanizmy lightboxa zachowują obsługę klawiatury',()=>{
 assert.ok(html.includes('homepage-tech-only-fix122.js'));
 assert.ok(photoRuntime.includes('global-single-photo-assignment'));
 assert.ok(lightbox.includes('aria-modal')&&lightbox.includes('Escape')&&lightbox.includes('ArrowLeft')&&lightbox.includes('ArrowRight'));
 assert.equal(release.homepagePhotoFirstRenderFix?.homepageEnabled,false);
 assert.equal(release.homepagePhotoFirstRenderFix?.registeredAssignments,0);
});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');
 const full=path.resolve(WEB,rel);
 if(!full.startsWith(path.resolve(WEB)+path.sep)&&full!==path.resolve(WEB)){res.writeHead(403);return res.end('forbidden');}
 if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);return res.end('not found');}
 res.writeHead(200,{'content-type':mime[path.extname(full).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
 if(req.method==='HEAD')return res.end();fs.createReadStream(full).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const list=['/index.html','/assets/sitewide-tech-visuals-fix123.js','/assets/homepage-tech-only-fix122.js','/assets/homepage-tech-visuals-fix122.json','/assets/artwork-fix77/hero-main.svg','/assets/artwork-fix77/slide-01.svg','/assets/artwork-fix77/module-19.svg','/assets/artwork-fix77/academy-data-001.svg','/assets/artwork-fix77/academy-data-203.svg'];
 for(const url of list){const r=await fetch(base+url);assert.equal(r.status,200,`${url}: HTTP ${r.status}`);const b=await r.arrayBuffer();assert.ok(b.byteLength>200,`${url}: pusty zasób`);}
 const traversal=await fetch(base+'/%2e%2e/AUTO_PUBLISH_WATCHER.js');assert.ok([403,404].includes(traversal.status));
 check(`lokalny HTTP: ${list.length}/${list.length} zasobów technicznych dostępnych`,()=>{});
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(`GLOBAL ACADEMY / FIX122–FIX123 HOME-LEARNING REGRESSION: ${passed}/${passed} PASS`);
