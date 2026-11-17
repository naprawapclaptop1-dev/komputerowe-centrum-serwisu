'use strict';
const fs=require('node:fs');
const path=require('node:path');
const BUILD='6.8.0-fix51-visual-academy-pro-20261105';
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function verifyFix51Release(root){
  const manifest=readJson(path.join(root,'FIX51_RELEASE_MANIFEST.json'));
  const web=path.join(root,'WEB_PUBLISH');
  const release=readJson(path.join(web,'release.json'));
  const contract=readJson(path.join(web,'release-contract-fix51.json'));
  const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(web,'service-worker.js'),'utf8');
  const lessonArt=fs.readFileSync(path.join(web,'assets/lesson-art.js'),'utf8');
  const visualRuntime=fs.readFileSync(path.join(web,'assets/visual-assets-fix51.js'),'utf8');
  const visualUi=fs.readFileSync(path.join(web,'assets/visual-academy-fix51.js'),'utf8');
  const status=fs.readFileSync(path.join(root,'functions/api/auth/status.js'),'utf8');
  const failures=[];
  const meta=html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i)?.[1]||'';
  if(manifest.fix!=='FIX51'||manifest.build!==BUILD)failures.push('manifest FIX51 niezgodny z build ID');
  if(release.build!==BUILD||meta!==BUILD||!status.includes(BUILD))failures.push('build ID rozjechany w release/HTML/API status');
  if(contract.build!==BUILD||contract.fix!=='FIX51')failures.push('release-contract-fix51 niezgodny z manifestem');
  if(contract.localPhotos?.length!==12||contract.localPosters?.length!==3||contract.technicalIllustrations?.length!==18||contract.visualAssetCount!==33)failures.push('publiczny kontrakt FIX51 nie wylicza wszystkich 33 plików wizualnych');
  for(const token of [
    `assets/lesson-art.js?v=${manifest.photoEngineVersion}`,
    `assets/visual-assets-fix51.js?v=6.8.0-fix51`,
    `assets/visual-academy-fix51.js?v=6.8.0-fix51`,
    `assets/visual-academy-fix51.css?v=6.8.0-fix51`,
    `assets/app.js?v=${manifest.appAssetVersion}`
  ])if(!html.includes(token))failures.push(`HTML nie ładuje ${token}`);
  if(!sw.includes(manifest.cacheMarker))failures.push('Service Worker nie ma markera FIX51');
  for(const file of [...manifest.localPhotos,...manifest.localPosters,...manifest.technicalIllustrations]){
    const full=path.join(web,file);
    if(!fs.existsSync(full)||fs.statSync(full).size<1000)failures.push(`brak lub pusty zasób: ${file}`);
    const cachePath=`'/`+file;
    if(!sw.includes(cachePath+`'`)&&!sw.includes(cachePath+`?`))failures.push(`brak w precache Service Workera: ${file}`);
  }
  for(const file of manifest.requiredFiles)if(!fs.existsSync(path.join(root,file)))failures.push(`brak pliku wydania: ${file}`);
  for(const token of manifest.requiredRuntimeTokens){if(!lessonArt.includes(token)&&!visualRuntime.includes(token)&&!visualUi.includes(token))failures.push(`brak tokenu runtime: ${token}`);}
  if(manifest.localPhotos.length!==12||manifest.localPosters?.length!==3||manifest.technicalIllustrations.length!==18||manifest.visualAssetCount!==33)failures.push('nieoczekiwana liczba lokalnych plików wizualnych');
  if(!release.fix51_visual_academy||release.fix51_visual_academy.build!==BUILD)failures.push('release.json nie opisuje modułu FIX51');
  if(failures.length)throw new Error('Kontrakt FIX51 niekompletny:\n- '+failures.join('\n- '));
  return {build:BUILD,localPhotos:manifest.localPhotos.length,localPosters:manifest.localPosters.length,illustrations:manifest.technicalIllustrations.length,visualAssets:manifest.visualAssetCount,cacheMarker:manifest.cacheMarker};
}
module.exports={verifyFix51Release};
