/* FIX96 — globalna ochrona unikalności zdjęć. 13 różnych fotografii jest przypisanych do hero, sześciu slajdów i czterech kafelków. */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix77-global-single-photo-assignment';
  const ALLOWED = new Set([
    'media/motherboard-multimeter-test.jpg','media/ram-ssd-installation.jpg','media/laptop-board-inspection.jpg',
    'media/master-workshop-hotair-fix75.jpg','media/laptop-screen-hinge.jpg','media/cooling-cleaning.jpg',
    'media/workbench-motherboard-inspection.jpg','media/usb-c-power-delivery-diagnostic.jpg','media/gpu-cpu-cooling.jpg',
    'media/laptop-cooling-fan-cleaning.jpg','media/ram-m2-installation-detail.jpg','media/laptop-hinge-display-repair.jpg',
    'media/motherboard-multimeter-probing.jpg','media/hero-usbc-power-delivery-fix142.jpg'
  ]);
  const normalize = value => {
    try { const u = new URL(value, location.href); return `${u.origin === location.origin ? '' : u.origin}${u.pathname}`.replace(/^\//, '').toLowerCase(); }
    catch { return String(value || '').split(/[?#]/)[0].replace(/^\//,'').toLowerCase(); }
  };
  const hashText = value => {
    let h = 2166136261;
    for (const c of String(value || '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function illustration(item = {}, scope = 'lesson') {
    const seed = hashText([scope,item.id,item.title,item.name,item.category].filter(Boolean).join('|'));
    const hue = seed % 360, hue2 = (hue + 58 + (seed % 41)) % 360;
    const title = escapeText(String(item.title || item.name || item.category || scope || 'TECH LAB').slice(0,34));
    const blocks = Array.from({length:4 + (seed % 4)},(_,i)=>{
      const x=42+((seed >>> ((i%4)*5))%410), y=80+((seed >>> (((i+1)%4)*5))%160), w=42+(seed+i*13)%70, h=24+(seed+i*7)%34;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><path d="M${x-20} ${y+h/2}h20m${w} 0h20M${x+w/2} ${y-18}v18m0 ${h}v18"/>`;
    }).join('');
    const traces=Array.from({length:5},(_,i)=>`<path d="M24 ${92+i*34}h${70+(seed+i*31)%95}v${12+(i%3)*9}h${130+(seed+i*17)%100}"/>`).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 60% 20%)"/><stop offset="1" stop-color="hsl(${hue2} 64% 8%)"/></linearGradient><radialGradient id="r"><stop stop-color="hsl(${hue2} 85% 58% / .35)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs><rect width="560" height="340" rx="22" fill="url(#g)"/><circle cx="440" cy="80" r="190" fill="url(#r)"/><g fill="none" stroke="hsl(${hue2} 90% 72% / .44)" stroke-width="3">${traces}</g><g fill="hsl(${hue} 54% 23%)" stroke="hsl(${hue2} 90% 78% / .92)" stroke-width="2">${blocks}</g><path d="M28 275h504M28 291h220M28 307h340" stroke="hsl(${hue2} 85% 72% / .35)" stroke-width="2" fill="none"/><text x="32" y="43" fill="#b5faff" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">GLOBAL ACADEMY / FIX77</text><text x="32" y="330" fill="#f0fbff" font-family="Arial,sans-serif" font-size="17" font-weight="700">${title}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  // The platform's dynamic lesson cards must never borrow one of the 13 home photographs.
  if (window.ACADEMY_ART) {
    window.ACADEMY_ART.dataUrl = illustration;
    window.ACADEMY_ART.onlinePhotos = [];
    window.ACADEMY_ART.photoCount = 0;
    window.ACADEMY_ART.onlineFirst = false;
    window.ACADEMY_ART.localFirst = true;
    window.ACADEMY_ART.uniquePhotoEngineVersion = VERSION;
    window.ACADEMY_ART.uniquePhotoEnginePolicy = {globalSingleAssignment:true,photosAcrossHomeHeroSlidesAndCards:true,duplicateAcrossDifferentSections:false,perceptualHashRequired:true,perceptualHashThreshold:10,hotfix:"FIX96_HOME_LOCAL_PHOTOGRAPHY"};
  }
  function fallback(img) {
    // FIX93_LEGACY_PHOTO_GUARD_OWNER: online catalog slots are not part of the 13-file local allowlist.
    if (isCatalogManagedSlot(img)) return;
    const source = img.dataset.fix77Fallback || '/assets/artwork-fix77/page-illustration-41.svg';
    if (img.dataset.fix77Replaced === '1') { img.hidden = true; return; }
    img.dataset.fix77Replaced = '1';
    img.src = source;
    img.alt = `Unikalna ilustracja edukacyjna — ${img.alt || 'schemat techniczny'}`;
    img.dataset.photoDuplicate = 'replaced-with-vector';
    img.removeAttribute('data-photo-unique');
  }
  async function digestSha(bytes) {
    if (!crypto?.subtle) return '';
    const raw = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function perceptualHash(bitmap) {
    const canvas=document.createElement('canvas'); canvas.width=32; canvas.height=32;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}); if(!ctx) throw new Error('Canvas niedostępny');
    ctx.drawImage(bitmap,0,0,32,32); const data=ctx.getImageData(0,0,32,32).data; const gray=new Float64Array(1024);
    for(let i=0;i<1024;i++) gray[i]=(data[i*4]*0.299+data[i*4+1]*0.587+data[i*4+2]*0.114);
    const coeff=[]; const cos=Array.from({length:8},(_,u)=>Array.from({length:32},(_,x)=>Math.cos(((2*x+1)*u*Math.PI)/64)));
    for(let v=0;v<8;v++) for(let u=0;u<8;u++){let sum=0;for(let y=0;y<32;y++)for(let x=0;x<32;x++)sum+=gray[y*32+x]*cos[u][x]*cos[v][y];coeff.push(sum);}
    const values=coeff.slice(1).sort((a,b)=>a-b),median=values[Math.floor(values.length/2)];
    return coeff.slice(1).map(v=>v>median?'1':'0').join('');
  }
  const hamming=(a,b)=>{let n=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])n++;return n;};
  async function auditManifest() {
    const response=await fetch('/assets/photo-uniqueness-manifest-fix77.json',{cache:'no-store',credentials:'same-origin'});
    if(!response.ok) throw new Error(`Manifest zdjęć: HTTP ${response.status}`);
    const manifest=await response.json();
    if(!Array.isArray(manifest.photos)||manifest.photos.length!==13) throw new Error('Manifest musi zawierać dokładnie 13 zdjęć głównych.');
    if(manifest.layoutHotfix!=='FIX96_HOME_LOCAL_PHOTOGRAPHY') throw new Error('Manifest nie opisuje poprawnego rozkładu zdjęć FIX96.');
    const records=[];
    for(const item of manifest.photos){
      const path=normalize(item.path); if(!ALLOWED.has(path)) throw new Error(`Niedozwolony przydział zdjęcia: ${path}`);
      const res=await fetch('/'+path,{cache:'no-store',credentials:'same-origin'}); if(!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      const buffer=await res.arrayBuffer(),sha=await digestSha(buffer),blob=new Blob([buffer],{type:res.headers.get('content-type')||'image/jpeg'});
      const bitmap=await createImageBitmap(blob); let phash; try{phash=perceptualHash(bitmap);}finally{bitmap.close?.();}
      records.push({id:item.id,path,sha256:sha,phash});
    }
    const duplicates=[];
    for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
      const exact=records[i].sha256 && records[i].sha256===records[j].sha256;
      const distance=hamming(records[i].phash,records[j].phash);
      if(exact||distance<10)duplicates.push({a:records[i].path,b:records[j].path,exact,distance});
    }
    return {schema:manifest.schema,photoCount:records.length,uniqueHashes:new Set(records.map(x=>x.sha256)).size,minimumPerceptualDistance:Math.min(...records.flatMap((a,i)=>records.slice(i+1).map(b=>hamming(a.phash,b.phash)))),duplicates,passed:duplicates.length===0};
  }
  // FIX93: catalog-owned online photos are validated by the photo catalog itself.
  // Do not require photoId to be present: legacy SVG replacement could erase/lose it
  // while leaving the photo credit and online-photo marker on the same card.
  function hasCatalogPhotoCredit(img) {
    const slot = String(img?.dataset?.photoId || '');
    const scope = img?.parentElement;
    // The real homepage DOM uses class-only credits: .photo-credit-fix90,
    // .np640-photo-credit or figcaption; data-photo-credit-for is not guaranteed.
    const nodes = scope?.querySelectorAll?.('.photo-credit-fix90, .np640-photo-credit, figcaption') || [];
    return Array.from(nodes).some(node => {
      const nodeSlot = String(node.dataset?.photoCreditFor || '');
      return !slot || !nodeSlot || nodeSlot === slot;
    });
  }
  function isOnlineCatalogPhoto(img) {
    if (!img || !img.dataset || typeof img.classList?.contains !== 'function' || !img.classList.contains('photo-fix90-online')) return false;
    const src = String(img.getAttribute?.('src') || img.currentSrc || '');
    const remoteRaster = /^https:\/\//i.test(src) && !/\.svg(?:[?#]|$)/i.test(src);
    const assigned = Boolean(img.dataset.photoFix90Assigned || img.dataset.photoFix90State === 'online-photo' || img.dataset.photoFix90Loaded === '1');
    return remoteRaster && (assigned || hasCatalogPhotoCredit(img));
  }
  function isCatalogManagedSlot(img) {
    return Boolean(img && typeof img.classList?.contains === 'function' && img.classList.contains('photo-fix90-online') && (isOnlineCatalogPhoto(img) || hasCatalogPhotoCredit(img)));
  }
  function auditDom() {
    const primary=[...document.querySelectorAll('img[data-photo-unique]')];
    const seen=new Set();
    for(const img of document.querySelectorAll('img')){
      const src=normalize(img.currentSrc||img.getAttribute('src')||'');
      const isRaster=/\.(?:jpe?g|png|webp|avif)(?:$|[?#])/i.test(src);
      if(!isRaster||src.endsWith('sumup-support-qr.png'))continue;
      // Online catalog images are globally assigned and license-checked by FIX93.
      // Preserve them instead of treating every external URL as an unauthorized duplicate.
      if (isOnlineCatalogPhoto(img)) {
        if (seen.has(src)) console.warn('[FIX77/FIX93] Repeated online photo URL; catalog guard should reassign it:', src);
        seen.add(src);
        continue;
      }
      if(!ALLOWED.has(src)){fallback(img);continue;}
      if(!img.dataset.photoUnique){fallback(img);continue;}
      if(seen.has(src)){fallback(img);continue;}
      seen.add(src);
    }
    const ids=primary.map(x=>x.dataset.photoUnique);
    return {photoSlots:seen.size,uniqueSlotIds:new Set(ids).size,expectedSlots:13};
  }
  function setStatus(text,ok){const el=document.getElementById('np77PhotoAudit');if(el){el.textContent=text;el.dataset.state=ok?'ok':'error';}}
  async function run() {
    const technicalHomeImages = [...document.querySelectorAll('#view-home img[data-tech-visual-id]')];
    if (technicalHomeImages.length) {
      const valid = technicalHomeImages.every(img => img.dataset.photoIgnore === 'true'
        && img.dataset.photoEligible === 'false'
        && /^assets\/artwork-fix(?:77|51)\/[a-z0-9-]+\.svg$/i.test(String(img.getAttribute('src') || ''))
        && img.getAttribute('src') === img.dataset.techVisualSrc);
      const result = { version: '6.8.0-fix122-tech-only', policy: 'FIX122_HOME_TECH_ONLY_NO_PEOPLE', passed: valid, total: technicalHomeImages.length, localSvg: valid ? technicalHomeImages.length : 0, peoplePhotosAllowed: false };
      window.NPA_PHOTO_UNIQUENESS_FIX77 = result;
      setStatus(valid ? `FIX122: ${technicalHomeImages.length}/${technicalHomeImages.length} lokalnych ilustracji SVG · bez postaci` : 'FIX122: niezgodny obraz na stronie głównej — kontrola wymaga naprawy.', valid);
      if (!valid) console.error('[FIX122] Homepage technical visual guard detected a source mismatch.', result);
      return result;
    }
    try {
      const [result,dom]=await Promise.all([auditManifest(),Promise.resolve(auditDom())]);
      const ok=result.passed&&dom.uniqueSlotIds===13&&dom.expectedSlots===13;
      window.NPA_PHOTO_UNIQUENESS_FIX77={version:VERSION,...result,...dom,threshold:10};
      setStatus(ok?`Zdjęcia: ${result.photoCount}/${result.photoCount} unikalne · SHA-256 + pHash OK`:`Kontrola zdjęć wykryła problem — sprawdź konsolę.`,ok);
      if(!ok)console.error('[FIX77] Duplikaty fotografii lub niezgodne sloty:',result,dom);
      else console.info('[FIX77] Globalny audyt zdjęć zaliczony:',window.NPA_PHOTO_UNIQUENESS_FIX77);
    } catch(error) {
      window.NPA_PHOTO_UNIQUENESS_FIX77={version:VERSION,passed:false,error:String(error.message||error)};
      setStatus(`Nie ukończono kontroli zdjęć: ${error.message||error}`,false);
      console.error('[FIX77] Nie udało się wykonać audytu fotografii:',error);
    }
  }
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;auditDom();});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','style']});
  window.NPA_PHOTO_UNIQUENESS_FIX77={version:VERSION,run,auditDom,isOnlineCatalogPhoto,isCatalogManagedSlot,perceptualHash,hamming,threshold:10};
})();
