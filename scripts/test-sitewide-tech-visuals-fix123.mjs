#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readMp4MetadataTag } from './mp4-metadata-reader-fix126.mjs';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const app = read('WEB_PUBLISH/assets/app.js');
const certificate = read('WEB_PUBLISH/assets/master-workshop-630-extension.js');
const vtt = read('WEB_PUBLISH/media/videos/akademia-dlaczego-warto-wspierac.vtt');
const policy = read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.js');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.json'));
const posterSvg = read('WEB_PUBLISH/assets/sitewide-tech-support-poster-fix123.svg');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log(`[PASS] ${name}`);};
check('nazwa produktu jest wszędzie zgodna: NAUKA OD A DO Z — DLA WSZYSTKICH',()=>{
  assert.match(html,/<title>NAUKA OD A DO Z — DLA WSZYSTKICH \| Wersja 6\.8\.0 FIX128<\/title>/);
  assert.ok(!/Akademia Serwisu PRO|GLOBAL ACADEMY PRO|Akademia Serwisanta PRO|NAUKA OD A DO Z SERWISU PRO/i.test(html));
  assert.ok(html.includes('Platforma Nauka od A do Z · Wersja 6.8.0 FIX128'));
  assert.ok(app.includes("openModal('Nauka od A do Z — Dla Wszystkich'"));
  assert.ok(!app.includes("openModal('Akademia Serwisu PRO'"));
  assert.ok(certificate.includes('NAUKA OD A DO Z · DLA WSZYSTKICH'));
  assert.ok(!vtt.includes('Akademia Serwisu PRO'));
});
check('FIX127 jest najnowszą poprawką materiału wideo; polityka wizualna FIX123 pozostaje aktywna, produkt pozostaje 6.8.0',()=>{
  assert.equal(release.productVersion,'6.8.0');
  assert.equal(release.latestHotfix,'FIX128');
  assert.equal(release.latestHotfixBuild,'6.8.0-fix128-live-tech-visual-publication-20261111');
  assert.equal(manifest.pwaCache,'nauka-6.8.0-fix127-portable-sha256-20261111');
  assert.equal(release.sitewideVisualPolicy.productName,'NAUKA OD A DO Z — DLA WSZYSTKICH');
  assert.equal(release.sitewideVisualPolicy.peopleVisible,false);
  assert.equal(release.sitewideVisualPolicy.handsVisible,false);
  assert.equal(release.sitewideVisualPolicy.externalPhotoProvidersEnabled,false);
  assert.equal(release.sitewideVisualPolicy.d1Migrations,'none');
});
check('globalny strażnik ładuje się przed lesson-art i katalogiem zdjęć',()=>{
  const guard=html.indexOf('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123');
  const lesson=html.indexOf('assets/lesson-art.js?v=6.8.0-fix87');
  const catalog=html.indexOf('assets/photo-catalog-fix115.js?v=6.8.0-fix118');
  assert.ok(guard>=0 && lesson>guard && catalog>guard);
});
check('strażnik blokuje zewnętrzne IMG, srcset, tła oraz API fotografii',()=>{
  for(const token of ['SITEWIDE_NO_VISIBLE_PEOPLE_OR_HANDS','blockedProviders','api.openverse.org','commons.wikimedia.org','Object.defineProperty(HTMLImageElement.prototype,\'src\'','Element.prototype.setAttribute','MutationObserver','externalPhotoProvidersEnabled:false','externalImageSourcesEnabled:false']) assert.ok(policy.includes(token),`Missing ${token}`);
  assert.ok(policy.includes("return u.origin!==localOrigin"));
  assert.ok(policy.includes("img.dataset.photoEligible='false'"));
  assert.ok(policy.includes("img.dataset.photoIgnore='true'"));
});
check('Service Worker nie cache’uje zdjęć zewnętrznych i usuwa stare cache zdjęć',()=>{
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
  assert.ok(sw.includes("request.destination === 'image' && url.origin !== self.location.origin"));
  assert.ok(sw.includes('FIX123_LOCAL_IMAGE_FALLBACK'));
  assert.ok(sw.includes("key.startsWith('academy-photo-library-')"));
  assert.ok(!sw.includes('PHOTO_LIBRARY_CACHE_NAME'));
  assert.ok(!sw.includes('PHOTO_LIBRARY_HOSTS.has(url.hostname)'));
  assert.ok(sw.includes('/assets/sitewide-tech-visuals-fix123.js?v=6.8.0-fix123'));
  assert.ok(sw.includes('/assets/sitewide-tech-visuals-fix123.json'));
});
check('plakat i plansze filmu wsparcia pokazują właściwą nazwę projektu',()=>{
  assert.ok(posterSvg.includes('NAUKA OD A DO Z'));
  assert.ok(posterSvg.includes('DLA WSZYSTKICH'));
  const p=path.join(WEB,'media','video_posters','akademia-wsparcie-poster.jpg');
  assert.ok(fs.statSync(p).size>20000);
  const mp4Bytes=fs.readFileSync(path.join(WEB,'media/videos/akademia-dlaczego-warto-wspierac.mp4'));
  assert.equal(readMp4MetadataTag(mp4Bytes,'©nam'),'NAUKA OD A DO Z — DLA WSZYSTKICH');
});
check('manifest zawiera SHA-256 dla 30 lokalnych grafik i 11 filmów',()=>{
  assert.equal(manifest.hotfix,'FIX123');
  assert.equal(manifest.visualAssets.length,30);
  assert.equal(manifest.videoAssets.length,11);
  for(const item of manifest.visualAssets){
    const p=path.join(WEB,item.path);
    assert.ok(fs.existsSync(p),`Missing ${item.path}`);
    assert.equal(fs.statSync(p).size>0,true);
    // Windows does not ship sha256sum by default. Use Node's built-in crypto on every OS.
    const actualHash = createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(actualHash,item.sha256,`SHA-256 mismatch ${item.path}`);
  }
  for(const v of manifest.videoAssets){assert.ok(fs.existsSync(path.join(WEB,v.path)));assert.ok(v.title);assert.equal(v.hasAudio,true);}
});
check('poprawione lokalne media zachowują istniejące nazwy i lokalizacje',()=>{
  for(const f of ['cooling-cleaning.jpg','gpu-cpu-cooling.jpg','laptop-board-inspection.jpg','laptop-cooling-fan-cleaning.jpg','laptop-hinge-display-repair.jpg','laptop-screen-hinge.jpg','master-workshop-hotair-fix75.jpg','motherboard-multimeter-probing.jpg','motherboard-multimeter-test.jpg','ram-m2-installation-detail.jpg','ram-ssd-installation.jpg','usb-c-power-delivery-diagnostic.jpg','workbench-motherboard-inspection.jpg']) assert.ok(fs.existsSync(path.join(WEB,'media',f)));
  for(let i=1;i<=6;i++)assert.ok(fs.existsSync(path.join(WEB,'media','video_slides_fix9',`scene-${String(i).padStart(2,'0')}.png`)));
});
check('składnia JavaScript FIX123 i Service Workera jest poprawna',()=>{
  for(const f of ['WEB_PUBLISH/assets/sitewide-tech-visuals-fix123.js','WEB_PUBLISH/service-worker.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']){
    const r=spawnSync(process.execPath,['--check',path.join(ROOT,f)],{encoding:'utf8'});
    assert.equal(r.status,0,`${f}: ${r.stderr||r.stdout}`);
  }
});
check('OneClick i Watcher wymagają globalnego testu FIX123 przed publikacją',()=>{
  const one=read('ONECLICK_AKADEMIA.js'); const watcher=read('AUTO_PUBLISH_WATCHER.js');
  assert.ok(one.includes("releaseJson.latestHotfix !== 'FIX128'"));
  assert.ok(one.includes('scripts/test-sitewide-tech-visuals-fix123.mjs'));
  assert.ok(watcher.includes('scripts/test-sitewide-tech-visuals-fix123.mjs'));
});
console.log(`FIX127 SITEWIDE NO-PEOPLE / BRAND / PWA: ${passed}/${passed} PASS`);
