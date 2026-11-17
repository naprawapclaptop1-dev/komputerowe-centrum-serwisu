/* NAUKA OD A DO Z — FIX123: globalna polityka wyłącznie lokalnych ilustracji technicznych. */
(() => {
  'use strict';
  const BUILD='6.8.0-fix123-sitewide-tech-only-no-people-20261111';
  const POLICY='SITEWIDE_NO_VISIBLE_PEOPLE_OR_HANDS';
  const blockedProviders=new Set(['api.openverse.org','commons.wikimedia.org']);
  const localOrigin=location.origin;
  const fallbackFiles={
    board:'assets/artwork-fix77/lesson-01.svg',motherboard:'assets/artwork-fix77/lesson-01.svg',cpu:'assets/artwork-fix77/lesson-01.svg',bios:'assets/artwork-fix77/lesson-09.svg',uefi:'assets/artwork-fix77/lesson-09.svg',
    ram:'assets/artwork-fix77/lesson-02.svg',memory:'assets/artwork-fix77/lesson-02.svg',ddr:'assets/artwork-fix77/lesson-02.svg',ssd:'assets/artwork-fix77/lesson-03.svg',nvme:'assets/artwork-fix77/lesson-03.svg',disk:'assets/artwork-fix77/lesson-03.svg',storage:'assets/artwork-fix77/lesson-03.svg',
    gpu:'assets/artwork-fix77/lesson-08.svg',graphics:'assets/artwork-fix77/lesson-08.svg',cooling:'assets/artwork-fix77/lesson-06.svg',fan:'assets/artwork-fix77/lesson-06.svg',thermal:'assets/artwork-fix77/lesson-06.svg',
    display:'assets/artwork-fix77/lesson-07.svg',screen:'assets/artwork-fix77/lesson-07.svg',monitor:'assets/artwork-fix77/lesson-07.svg',network:'assets/artwork-fix77/lesson-10.svg',wifi:'assets/artwork-fix77/lesson-10.svg',router:'assets/artwork-fix77/lesson-10.svg',
    power:'assets/artwork-fix77/lesson-11.svg',usb:'assets/artwork-fix77/lesson-05.svg',meter:'assets/artwork-fix77/lesson-04.svg',scope:'assets/artwork-fix77/lesson-14.svg',laptop:'assets/artwork-fix77/lesson-13.svg',windows:'assets/artwork-fix77/lesson-12.svg'
  };
  const fallbackFor=img=>{
    const context=[img?.alt,img?.title,img?.dataset?.category,img?.dataset?.photoId,img?.dataset?.visualId,img?.closest?.('[data-photo-id]')?.dataset?.photoId,img?.closest?.('[class]')?.className,img?.parentElement?.textContent?.slice(0,180)].filter(Boolean).join(' ').toLowerCase();
    for(const [key,path] of Object.entries(fallbackFiles))if(context.includes(key))return path;
    return 'assets/artwork-fix77/lesson-01.svg';
  };
  const urlOf=value=>{try{return new URL(String(value),document.baseURI);}catch{return null;}};
  const isForbiddenImage=value=>{
    const raw=String(value||'').trim();if(!raw)return false;
    if(/^data:image\/svg\+xml/i.test(raw))return false;
    if(/^data:image\/(?:png|jpe?g|webp|gif|avif)/i.test(raw))return true;
    const u=urlOf(raw);if(!u)return true;
    if(u.protocol==='blob:'||u.protocol==='data:')return false;
    return u.origin!==localOrigin;
  };
  const nativeSetAttribute=Element.prototype.setAttribute;
  const nativeRemoveAttribute=Element.prototype.removeAttribute;
  const originalSetAttribute=Element.prototype.setAttribute;
  const nativeFetch=window.fetch.bind(window);
  const apply=img=>{
    if(!(img instanceof HTMLImageElement))return false;
    const source=img.getAttribute('src')||img.src||'';
    if(!isForbiddenImage(source))return false;
    img.removeAttribute('srcset');img.removeAttribute('sizes');
    img.dataset.fix123TechOnly='1';img.dataset.photoEligible='false';img.dataset.photoIgnore='true';
    img.alt='Ilustracja techniczna komputera, podzespołów i elektroniki';img.removeAttribute('title');
    nativeSetAttribute.call(img,'src',fallbackFor(img));return true;
  };
  const srcDescriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  if(srcDescriptor?.set&&srcDescriptor?.get)Object.defineProperty(HTMLImageElement.prototype,'src',{
    configurable:true,enumerable:srcDescriptor.enumerable,get:srcDescriptor.get,
    set(value){if(isForbiddenImage(value)){nativeSetAttribute.call(this,'src',fallbackFor(this));this.dataset.fix123TechOnly='1';this.dataset.photoEligible='false';this.dataset.photoIgnore='true';this.alt='Ilustracja techniczna komputera, podzespołów i elektroniki';}else srcDescriptor.set.call(this,value);}
  });
  Element.prototype.setAttribute=function(name,value){
    const key=String(name).toLowerCase();
    if(this instanceof HTMLImageElement&&key==='src'&&isForbiddenImage(value)){
      this.dataset.fix123TechOnly='1';this.dataset.photoEligible='false';this.dataset.photoIgnore='true';
      return originalSetAttribute.call(this,'src',fallbackFor(this));
    }
    if(this instanceof HTMLImageElement&&key==='srcset'&&/https?:/i.test(String(value)))return nativeRemoveAttribute.call(this,'srcset');
    if(key==='style'&&/url\(\s*['"]?https?:/i.test(String(value)))return originalSetAttribute.call(this,'style','');
    return originalSetAttribute.call(this,name,value);
  };
  window.fetch=function(input,init){
    let u=null;try{u=urlOf(typeof input==='string'||input instanceof URL?input:input.url);}catch{}
    if(u&&blockedProviders.has(u.hostname)){
      const body=u.hostname==='api.openverse.org'?{results:[],result_count:0}:{query:{pages:{}}};
      return Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json','X-NPA-FIX123':'provider-disabled'}}));
    }
    return nativeFetch(input,init);
  };
  function scan(root){
    if(root?.nodeType===1&&root.matches?.('img'))apply(root);
    root?.querySelectorAll?.('img').forEach(apply);
    root?.querySelectorAll?.('picture source[srcset]').forEach(el=>{if(/https?:/i.test(el.getAttribute('srcset')||''))el.removeAttribute('srcset');});
    root?.querySelectorAll?.('[style*="url("]').forEach(el=>{if(/url\(\s*['"]?https?:/i.test(el.getAttribute('style')||''))el.style.backgroundImage='none';});
  }
  scan(document);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='attributes'){
        if(record.target instanceof HTMLImageElement)apply(record.target);
        else if(record.attributeName==='style'&&/url\(\s*['"]?https?:/i.test(record.target.getAttribute('style')||''))record.target.style.backgroundImage='none';
      }
      for(const node of record.addedNodes||[])scan(node);
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset','sizes','style']});
  window.NPA_SITEWIDE_TECH_VISUALS_FIX123=Object.freeze({build:BUILD,policy:POLICY,productName:'NAUKA OD A DO Z — DLA WSZYSTKICH',externalPhotoProvidersEnabled:false,externalImageSourcesEnabled:false,photoCatalogDisplayEnabled:false,peopleVisible:false,scan,stats:()=>({policy:POLICY,externalPhotoProvidersEnabled:false,externalImageSourcesEnabled:false,images:[...document.images].length,blocked:[...document.images].filter(i=>i.dataset.fix123TechOnly==='1').length})});
  document.documentElement.dataset.npaVisualPolicy='FIX123-TECHNICAL-ONLY';
})();
