/* NAUKA OD A DO Z 6.8.0 FIX51 — lokalne fotografie od razu, online jako rozszerzenie. */
(() => {
  'use strict';

  // Zdjęcia Pexels są licencjonowane do bezpłatnego użycia także na stronach i w aplikacjach.
  // Linki prowadzą do oryginalnych stron autorów; atrybucja jest dodana informacyjnie.
  const ONLINE_PHOTOS = [];

  // Lokalna biblioteka służy wyłącznie jako fallback, gdy internet lub zewnętrzny host nie odpowiada.
  const PHOTO_POOLS = Object.fromEntries(['vram','ram','storage','gpu','cooling','display','port','network','audio','power','board','safety','software','meter','laptop'].map((key,i)=>[key,[`assets/artwork-fix77/lesson-${String(i+1).padStart(2,'0')}.svg`]]));

  const hash = value => { let h=2166136261; const s=String(value||''); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; };
  function kind(item={}) {
    // FIX87 delegates to the already-loaded FIX83 classifier first. This preserves
    // the specific VRAM/GDDR/BGA category before the broad RAM/memory matcher.
    const fix83Kind = window.NPA_UNIQUE_VISUALS_FIX83?.kind;
    if (typeof fix83Kind === 'function') return fix83Kind(item);
    const s=[item.title,item.titleEn,item.category,item.categoryEn,item.tags,item.name,item.purpose,item.devices].filter(Boolean).join(' ').toLowerCase();
    if(/\bvram\b|gddr[34567x]?|hbm[23e]?|video memory|pamięć graficzna|pamięć karty graficznej/.test(s)) return 'vram';
    if(/ram|pamięć|memory|ddr[345]|so-dimm/.test(s)) return 'ram';
    if(/ssd|nvme|hdd|dysk|storage|raid|nośnik/.test(s)) return 'storage';
    if(/gpu|grafik|graphics|vram|karta graficzna|karta wideo/.test(s)) return 'gpu';
    if(/chłod|temperatur|wentyl|fan|thermal|radiator|heat.?pipe/.test(s)) return 'cooling';
    if(/matryc|ekran|monitor|display|screen|zawias|eDP|taśma/.test(s)) return 'display';
    if(/usb.?c|usb4|thunderbolt|port|złącze|dock|hdmi/.test(s)) return 'port';
    if(/wi.?fi|wifi|bluetooth|ethernet|router|sieć|network|lan/.test(s)) return 'network';
    if(/audio|dźwięk|mikrofon|kamera|speaker|sound/.test(s)) return 'audio';
    if(/bater|akumulator|zasil|power|ładow|charger|mosfet|vrm|buck|dc.?in/.test(s)) return 'power';
    if(/bios|uefi|firmware|spi|ec\/|kbc|boot|rozruch|post|płyta|motherboard|boardview|socket|gniazdo|cpu|procesor|bga|smd|lutow/.test(s)) return 'board';
    if(/bezpieczeń|esd|obudow|zalani|koroz|bateria spuch|safety|shield/.test(s)) return 'safety';
    if(/windows|system|sterownik|driver|bsod|software|program/.test(s)) return 'software';
    if(/multimetr|oscyloskop|pomiar|test|diagnost|miernik|measurement|zasilacz laboratoryjny/.test(s)) return 'meter';
    return 'laptop';
  }
  function fallbackFor(item, category, identity) {
    const supplied = typeof item.image === 'string' ? item.image.trim() : '';
    if (supplied && !/^https?:\/\//i.test(supplied) && /\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(supplied) && !/^data:image\/svg/i.test(supplied)) return supplied;
    const pool = PHOTO_POOLS[category] || PHOTO_POOLS.laptop;
    return pool[hash(identity) % pool.length];
  }
  function dataUrl(item={}, scope='lesson') {
    const category = kind(item);
    const identity = [scope,item.id,item.title,item.titleEn,item.category,item.name].filter(Boolean).join('|');
    const fallback = fallbackFor(item, category, identity);
    const supplied = typeof item.image === 'string' ? item.image.trim() : '';
    const validRaster = /\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i;
    if (supplied && /^https?:\/\//i.test(supplied) && validRaster.test(supplied)) {
      return `${supplied}#np630-fallback=${encodeURIComponent(fallback)}`;
    }
    const pool = ONLINE_PHOTOS.filter(photo => photo.kind === category);
    const candidates = pool.length ? pool : ONLINE_PHOTOS.filter(photo => ['board','laptop','software'].includes(photo.kind));
    // FIX50: local raster is returned immediately; online-first remote loading was unreliable under CORS/offline use.
    return fallback;
  }
  function applyFallback(event) {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.npFallbackApplied === '1') return;
    const src = img.getAttribute('src') || '';
    const marker = src.match(/#np630-fallback=([^&]+)/);
    if (!marker) return;
    img.dataset.npFallbackApplied = '1';
    try { img.src = decodeURIComponent(marker[1]); }
    catch (_) { img.src = 'assets/artwork-fix77/lesson-01.svg'; }
  }
  // Capturing listener handles images produced by all catalog renderers, without modifying every module.
  document.addEventListener('error', applyFallback, true);
  window.ACADEMY_ART = {
    dataUrl, kind, uniqueVisualUrl: window.NPA_UNIQUE_VISUALS_FIX83?.uniqueVisualUrl, version: '6.8.0-fix51-visual-assets-reuse',
    photoCount: ONLINE_PHOTOS.length, onlineFirst: false, localFirst: true,
    photoPools: PHOTO_POOLS, onlinePhotos: ONLINE_PHOTOS,
    licenseUrl: 'https://www.pexels.com/license/'
  };
})();


/* FIX51 historyczny kontrakt API: api.uniquePhotoEngineVersion='6.8.0-fix51-visual-assets-reuse'.
   FIX87 aktywny runtime poniżej rozdziela ilustrację karty od trzech ilustracji lekcji. */
/* FIX7 — unikalna biblioteka zdjęć dla każdej naprawy, z kontrolą źródła, URL i podobieństwa obrazu.
   Ładowanie jest progresywne i respektuje anonimowy limit Openverse. Nie ma powtarzanych zdjęć zastępczych. */
(() => {
  'use strict';
  const api = window.ACADEMY_ART;
  if (!api) return;
  const ASSIGN_KEY = 'academyRepairPhotoAssignmentsFix7';
  const DAILY_KEY = 'academyOpenverseDailyFix7';
  const META_KEY = 'academyRepairPhotoMetaFix7';
  const PHOTO_SLOTS = 3;
  const OPENVERSE_GAP = 3300;
  const OPENVERSE_DAILY_BUDGET = 175;
  const COMMONS_GAP = 1250;
  const KIND_QUERY = {
    vram:'graphics card GDDR6 GDDR7 VRAM discrete BGA memory packages close up',
    ram:'computer RAM DIMM SO-DIMM memory module laptop repair',
    cpu:'CPU processor package silicon die socket diagnostics',
    storage:'SSD NVMe hard drive computer storage repair',
    gpu:'graphics card GPU board cooler diagnostics', cooling:'laptop cooling fan heatsink thermal repair',
    display:'laptop LCD screen display hinge cable repair', port:'USB C charging port connector laptop motherboard repair',
    network:'laptop WiFi wireless network card motherboard', audio:'laptop audio speaker microphone motherboard repair',
    power:'laptop motherboard power circuit charging MOSFET repair', board:'laptop motherboard PCB electronics repair',
    safety:'electronics PCB corrosion liquid damage ESD repair', software:'computer laptop diagnostic repair technician',
    meter:'multimeter oscilloscope electronic circuit measurement', laptop:'laptop computer motherboard repair workshop'
  };
  let assignments = new Map();
  let usedKeys = new Set();
  let usedHashes = [];
  let currentRepairs = [];
  let inFlight = null;
  let lastOpenverseAt = 0;
  let lastCommonsAt = 0;
  let openversePaused = false;
  let queueIndex = 0;
  let rescanNeeded = false;
  const failedKeys = new Set();
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clean = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,300);
  const safeHttps = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };
  const stripUrl = value => { try { const u = new URL(value); u.hash=''; u.search=''; return u.href.replace(/\/$/,'').toLowerCase(); } catch (_) { return ''; } };
  const readJson = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const saveJson = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch (_) { return false; } };
  const licenseAllowed = value => {
    const s=String(value||'').toLowerCase();
    if (/non.?commercial|\bnc\b/.test(s)) return false;
    const code=s.replace(/^cc-/,'').replace(/[^a-z0-9-]/g,'');
    return ['cc0','pdm','by','by-sa','by-nd'].includes(code) || /^cc[- ]?by(?:[- ]?(?:sa|nd))?(?:[- ]|$)/i.test(s) || /\bcc0(?:\s|[-/]|\b)/i.test(s) || /public.?domain|creative commons attribution/i.test(s);
  };
  const keysFor = photo => [
    photo.providerId ? `id:${photo.providerId}` : '',
    photo.page ? `page:${stripUrl(photo.page)}` : '',
    photo.url ? `url:${stripUrl(photo.url)}` : '',
    photo.originalUrl ? `origin:${stripUrl(photo.originalUrl)}` : ''
  ].filter(Boolean);
  function isUsed(photo) { return keysFor(photo).some(key=>usedKeys.has(key)) || (photo.hash && isSimilarHash(photo.hash)); }
  function reserve(photo) { keysFor(photo).forEach(key=>usedKeys.add(key)); if(photo.hash) usedHashes.push(photo.hash); }
  function hamming(a,b) { if(!a||!b||a.length!==b.length)return 64;let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n; }
  function isSimilarHash(hash) { return usedHashes.some(old=>hamming(hash,old)<=2); }
  function restore() {
    const saved=readJson(ASSIGN_KEY);
    if (saved && typeof saved==='object') {
      const knownIds=new Set((window.ACADEMY_DATA?.faults||[]).map(repair=>String(repair.id)));
      for (const [repairId,list] of Object.entries(saved)) {
        if (knownIds.size && !knownIds.has(repairId)) continue;
        if (!Array.isArray(list)) continue;
        const accepted=[];
        for (const photo of list) {
          if (!photo || !safeHttps(photo.url) || !safeHttps(photo.page) || !photo.license || !photo.author || (photo.hash && photo.hash.length!==64) || isUsed(photo)) continue;
          accepted.push(photo); reserve(photo);
          if (accepted.length>=PHOTO_SLOTS) break;
        }
        if (accepted.length) assignments.set(repairId,accepted);
      }
    }
    const meta=readJson(META_KEY); if(meta && Number.isInteger(meta.queueIndex)) queueIndex=Math.max(0,meta.queueIndex);
  }
  function persist() {
    saveJson(ASSIGN_KEY,Object.fromEntries(assignments.entries()));
    saveJson(META_KEY,{queueIndex,updatedAt:new Date().toISOString(),assignedRepairs:assignments.size,uniquePhotos:[...assignments.values()].reduce((n,a)=>n+a.length,0)});
  }
  function dailyOpenverseState() {
    const today=new Date().toISOString().slice(0,10);const old=readJson(DAILY_KEY);
    if(!old||old.day!==today)return {day:today,count:0};return old;
  }
  function setStatus(message,detail='') {
    const node=document.getElementById('repairPhotoStatus');
    if(node){node.textContent=message;node.title=detail||message;}
  }
  function repairQuery(item) {
    const title=clean(item.titleEn||item.title||item.name||'laptop repair');
    const category=clean(item.categoryEn||item.category||'electronics');
    const kind=api.kind(item);
    const symptom=clean(item.symptomEn||item.symptom||'');
    const query=`${title} ${category} ${KIND_QUERY[kind]||KIND_QUERY.laptop} ${symptom}`.replace(/\s+/g,' ').slice(0,190);
    return query;
  }
  // FIX50: CORS może blokować odczyt canvas, ale nie musi blokować samego wyświetlenia obrazu.
  // Nie ustawiamy crossOrigin. Wymagamy udanego ładowania i naturalWidth, a hash jest opcjonalny.
  function imageDHash(url) {
    return new Promise(resolve=>{
      if(typeof Image==='undefined'){resolve(null);return;}
      const img=new Image();
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),9000);
      img.onload=()=>{
        const naturalWidth=Number(img.naturalWidth||img.width||0);
        const naturalHeight=Number(img.naturalHeight||img.height||0);
        if(naturalWidth<64||naturalHeight<64){finish(null);return;}
        let bits='';
        try {
          const canvas=document.createElement('canvas');canvas.width=9;canvas.height=8;
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          if(ctx){
            ctx.drawImage(img,0,0,9,8);
            const data=ctx.getImageData(0,0,9,8).data;
            for(let y=0;y<8;y++)for(let x=0;x<8;x++){
              const i=(y*9+x)*4,j=(y*9+x+1)*4;
              const a=(data[i]*299+data[i+1]*587+data[i+2]*114)/1000;
              const b=(data[j]*299+data[j+1]*587+data[j+2]*114)/1000;
              bits+=a>b?'1':'0';
            }
          }
        } catch (_) {
          // Tainted canvas / brak CORS: obraz jest poprawnie załadowany; hash pozostaje opcjonalny.
          bits='';
        }
        finish({hash:bits,naturalWidth,naturalHeight});
      };
      img.onerror=()=>finish(null);
      img.src=url;
    });
  }
  function openverseBudgetAvailable() { return dailyOpenverseState().count < OPENVERSE_DAILY_BUDGET; }
  async function queryOpenverse(query,page=1) {
    if(!openverseBudgetAvailable()) { openversePaused=true;throw new Error('Dzisiejszy limit anonimowych zapytań Openverse został wykorzystany.'); }
    const waitFor=Math.max(0,OPENVERSE_GAP-(Date.now()-lastOpenverseAt));if(waitFor)await delay(waitFor);
    lastOpenverseAt=Date.now();const daily=dailyOpenverseState();daily.count++;saveJson(DAILY_KEY,daily);
    const params=new URLSearchParams({q:query,page:String(page),page_size:'20',license:'cc0,by,by-sa,by-nd,pdm',license_type:'commercial',mature:'false',filter_dead:'true',extension:'jpg,jpeg,png,webp'});
    const response=await fetch(`https://api.openverse.org/v1/images/?${params}`,{headers:{Accept:'application/json'}});
    if(response.status===429){openversePaused=true;throw new Error('Openverse ograniczył liczbę zapytań. Pobieranie zostanie wznowione po przerwie.');}
    if(!response.ok)throw new Error(`Openverse HTTP ${response.status}`);
    return await response.json();
  }
  function parseOpenverse(result,query) {
    const url=safeHttps(result.thumbnail||result.url),page=safeHttps(result.foreign_landing_url||result.url),license=String(result.license||'').toLowerCase();
    if(!url||!page||!licenseAllowed(license)||failedKeys.has(stripUrl(url)))return null;
    const author=clean(result.creator||result.attribution||'');if(!author)return null;
    return {url,page,originalUrl:safeHttps(result.url),providerId:`openverse:${result.id||stripUrl(page)}`,provider:clean(result.provider||result.source||'Openverse'),author,license:`CC ${license.toUpperCase()}${result.license_version?' '+result.license_version:''}`,licenseUrl:safeHttps(result.license_url),attribution:clean(result.attribution),title:clean(result.title),query,source:'Openverse'};
  }
  function htmlText(value) { const t=document.createElement('div');t.innerHTML=String(value||'');return clean(t.textContent||t.innerText||''); }
  async function queryCommons(query) {
    const waitFor=Math.max(0,COMMONS_GAP-(Date.now()-lastCommonsAt));if(waitFor)await delay(waitFor);
    lastCommonsAt=Date.now();
    const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:`${query} filetype:bitmap`,gsrnamespace:'6',gsrlimit:'30',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1100',iiextmetadatafilter:'LicenseShortName|Artist|LicenseUrl',format:'json',origin:'*'});
    const response=await fetch(`https://commons.wikimedia.org/w/api.php?${params}`,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`Wikimedia Commons HTTP ${response.status}`);
    const data=await response.json();
    return Object.values(data.query?.pages||{}).map(page=>{
      const info=page.imageinfo?.[0],meta=info?.extmetadata||{};if(!info)return null;
      const license=htmlText(meta.LicenseShortName?.value||'');
      const author=htmlText(meta.Artist?.value||'');const url=safeHttps(info.thumburl||info.url),landing=safeHttps(info.descriptionurl);
      if(!url||!landing||!author||!licenseAllowed(license))return null;
      return {url,page:landing,originalUrl:safeHttps(info.url),providerId:`commons:${page.pageid||page.title}`,provider:'Wikimedia Commons',author,license,licenseUrl:safeHttps(meta.LicenseUrl?.value),title:clean(page.title),query,source:'Wikimedia Commons'};
    }).filter(Boolean);
  }
  async function acceptCandidates(repair,photos,candidates,limit=PHOTO_SLOTS) {
    for(const candidate of candidates) {
      if(photos.length>=limit)break;
      if(!candidate||isUsed(candidate))continue;
      const verification=await imageDHash(candidate.url);
      if(!verification){failedKeys.add(stripUrl(candidate.url));continue;}
      // Gdy CORS nie pozwala odczytać canvas, unikalność nadal sprawdza providerId/URL/stronę źródłową.
      const item={...candidate,hash:verification.hash||'',imageWidth:verification.naturalWidth,imageHeight:verification.naturalHeight};
      if(isUsed(item))continue;
      photos.push(item);reserve(item);
    }
  }
  const allLocalPhotos=[...new Set(Object.values(api.photoPools||{}).flat())];
  const localPhotoCache=new Map();
  function localRepairPhotos(repair={},view='detail') {
    const id=String(repair.id||repair.title||'repair');
    const cacheKey=`${view}:${id}`;
    if(localPhotoCache.has(cacheKey))return localPhotoCache.get(cacheKey).slice();
    const category=api.kind(repair);
    const preferred=(api.photoPools?.[category]||api.photoPools?.laptop||[]).slice();
    const identity=`${id}|${repair.title||''}|${category}`;
    let seed=2166136261;for(let i=0;i<identity.length;i++){seed^=identity.charCodeAt(i);seed=Math.imul(seed,16777619);}
    const extras=allLocalPhotos.filter(url=>!preferred.includes(url));
    const rotate=(list,offset)=>list.slice(offset).concat(list.slice(0,offset));
    const ordered=[...preferred,...rotate(extras,Math.abs(seed>>>0)%Math.max(1,extras.length))];
    const selected=[...new Set(ordered)].slice(0,PHOTO_SLOTS);
    const photos=Array.from({length:view==='card'?1:PHOTO_SLOTS},(_,index)=>{
      const visualItem={...repair,id:`${id}-${view}-slot-${index+1}`,title:repair.title||repair.name||`Usterka ${id}`,category};
      const visualUrl=typeof api.uniqueVisualUrl==='function'
        ? api.uniqueVisualUrl(visualItem,`repair:${view}:${id}:slot:${index+1}`)
        : selected[index]||selected[0]||'';
      return {
        id:`visual:${id}:${index+1}`,url:visualUrl,provider:'Biblioteka ilustracji technicznych',author:'NAUKA OD A DO Z',
        page:'',license:'Autorska ilustracja SVG',licenseUrl:'',local:true,illustration:true,slot:index
      };
    }).filter(photo=>!!photo.url);
    localPhotoCache.set(cacheKey,photos);
    return photos.slice();
  }
  function displayPhotos(id,repair,view='detail') {
    const record=repair||currentRepairs.find(item=>String(item.id)===String(id))||{id};
    if(view==='card') return [localRepairPhotos(record,'card')[0]||null];
    const online=assignments.get(id)||[];
    const local=localRepairPhotos(record,'detail');
    return Array.from({length:PHOTO_SLOTS},(_,slot)=>online[slot]||local[slot]||null);
  }
  function writePhotoCredit(credit,photo) {
    if(!credit||!photo)return;
    credit.replaceChildren();
    if(photo.illustration){credit.textContent='Unikalna ilustracja techniczna · dostępna offline';}
    else if(photo.local){credit.textContent='Fotografia lokalna · dostępna również offline';}
    else {
      const a=document.createElement('a');a.href=photo.page;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${photo.author} · ${photo.provider}`;credit.append(a);
      const license=document.createElement(photo.licenseUrl?'a':'span');if(photo.licenseUrl){license.href=photo.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';}license.textContent=`Licencja: ${photo.license}`;credit.append(document.createTextNode(' · '),license);
    }
    credit.hidden=false;
  }
  function applyRepair(id) {
    const repair=currentRepairs.find(item=>String(item.id)===String(id))||{id};
    document.querySelectorAll(`[data-repair-photo="${CSS.escape(id)}"]`).forEach(img=>{
      const view=img.dataset.photoContext==='card'?'card':'detail';
      const viewPhotos=displayPhotos(id,repair,view);
      const slot=view==='card'?0:Math.max(0,Math.min(PHOTO_SLOTS-1,Number(img.dataset.photoSlot)||0));
      const photo=viewPhotos[slot];
      const wrap=img.closest('.repair-photo-wrap,.repair-row-photo-wrap,.repair-photo-stage');
      const pending=wrap?.querySelector('.repair-photo-pending');
      const credit=wrap?.querySelector(`[data-repair-photo-credit="${CSS.escape(id)}"][data-photo-slot="${slot}"]`) || document.querySelector(`[data-repair-photo-credit="${CSS.escape(id)}"][data-photo-slot="${slot}"]`);
      const zoom=wrap?.querySelector(`[data-repair-photo-zoom="${CSS.escape(id)}"][data-photo-slot="${slot}"]`) || document.querySelector(`[data-repair-photo-zoom="${CSS.escape(id)}"][data-photo-slot="${slot}"]`);
      if(!photo){img.hidden=true;wrap?.classList.add('photo-unavailable');if(pending){pending.hidden=false;pending.textContent='Brak dostępnego pliku zdjęcia — sprawdź pakiet instalacyjny.';}return;}
      wrap?.classList.remove('photo-unavailable');
      img.hidden=false;img.classList.toggle('repair-photo-illustration',!!photo.illustration);img.src=photo.url;img.alt=photo.illustration?`Unikalna ilustracja techniczna: ${repair.title||id}`:(img.dataset.photoAlt||`Zdjęcie edukacyjne ${id}`);
      img.title=photo.illustration?'Unikalna ilustracja techniczna — dostępna offline':(photo.local?'Lokalna fotografia edukacyjna — działa także offline':`${photo.author} · ${photo.license}`);
      if(pending){pending.hidden=true;pending.textContent='';}
      writePhotoCredit(credit,photo);
      if(zoom){zoom.dataset.openImage=photo.url;zoom.dataset.imageTitle=`${id} · ${photo.illustration?'ilustracja techniczna':(photo.local?'fotografia lokalna':photo.author)}`;zoom.disabled=false;}
      img.onerror=()=>{
        if(!photo.local){
          failedKeys.add(stripUrl(photo.url));
          const arr=assignments.get(id)||[];
          assignments.set(id,arr.filter(x=>stripUrl(x.url)!==stripUrl(photo.url)));
          persist();
          const local=localRepairPhotos(repair,view)[slot];
          if(local){img.onerror=null;img.hidden=false;img.classList.toggle('repair-photo-illustration',!!local.illustration);img.src=local.url;img.title=local.illustration?'Unikalna ilustracja techniczna — dostępna offline':'Lokalna fotografia edukacyjna — działa także offline';writePhotoCredit(credit,local);if(zoom){zoom.dataset.openImage=local.url;zoom.disabled=false;}if(pending)pending.hidden=true;}
          if(inFlight)rescanNeeded=true;else loadRepairPhotos(currentRepairs);
          return;
        }
        img.hidden=true;img.classList.remove('repair-photo-illustration');wrap?.classList.add('photo-unavailable');
        if(pending){pending.hidden=false;pending.textContent='Nie udało się odczytać lokalnego zdjęcia. Sprawdź kompletność folderu media.';}
      };
    });
  }
  function applyAll() {
    for(const repair of currentRepairs)applyRepair(repair.id);
    const total=currentRepairs.length,done=[...assignments.values()].filter(a=>a.length>0).length,photos=[...assignments.values()].reduce((n,a)=>n+a.length,0);
    const localReady=currentRepairs.filter(repair=>localRepairPhotos(repair,'detail').length===PHOTO_SLOTS && localRepairPhotos(repair,'card').length===1).length;
    setStatus(`Unikalne ilustracje gotowe: ${localReady}/${total} usterek · fotografie online: ${photos}/${total*PHOTO_SLOTS}`,`Każda usterka ma odrębną ilustrację na karcie oraz trzy inne ilustracje w lekcji. Fotografie online są dodatkiem; ich unikalność sprawdzamy po identyfikatorze, URL i stronie źródłowej.`);
  }
  async function processRepair(repair,index,total) {
    const existing=(assignments.get(repair.id)||[]).slice();if(existing.length>=PHOTO_SLOTS)return;
    const query=repairQuery(repair);let openversePages=0;
    if(!openversePaused && openverseBudgetAvailable()) {
      for(let page=1;page<=3 && existing.length<PHOTO_SLOTS && openverseBudgetAvailable();page++) {
        try {
          const data=await queryOpenverse(query,page);openversePages++;
          const candidates=(data.results||[]).map(result=>parseOpenverse(result,query)).filter(Boolean);
          // Rezerwujemy natychmiast po weryfikacji. Następna strona jest pobierana tylko,
          // gdy pierwsza zawierała duplikaty lub zdjęcia bez odczytywalnego skrótu obrazu.
          await acceptCandidates(repair,existing,candidates);
          if(existing.length>=PHOTO_SLOTS || page>=Number(data.page_count||1))break;
        } catch(error) {
          if(openversePaused)setStatus(`Openverse wstrzymał pobieranie po ${index}/${total} usterkach. Wznów po przerwie lub kontynuuj z Wikimedia Commons.`,error.message);
          else console.warn('[PHOTO FIX7] Openverse:',error.message);
          break;
        }
      }
    }
    if(existing.length<PHOTO_SLOTS) {
      try { const commons=await queryCommons(query);await acceptCandidates(repair,existing,commons); }
      catch(error){console.warn('[PHOTO FIX7] Commons:',error.message);}
    }
    if(existing.length)assignments.set(repair.id,existing);
    queueIndex=index+1;persist();applyRepair(repair.id);
    const photoTotal=[...assignments.values()].reduce((n,a)=>n+a.length,0);
    setStatus(`Fotografie online: ${index+1}/${total} usterek · ${photoTotal}/${total*PHOTO_SLOTS} zdjęć · ilustracje offline: ${total}/${total}`,`Karty i lekcje mają własne, niepowtarzalne ilustracje offline. Openverse: ${openversePages} stron; brakujące fotografie uzupełniamy Wikimedia Commons.`);
  }
  async function runQueue(repairs) {
    const total=repairs.length;
    for(let i=0;i<repairs.length;i++) {
      const repair=repairs[i];const saved=assignments.get(repair.id)||[];
      if(saved.length>=PHOTO_SLOTS)continue;
      if(!navigator.onLine){setStatus(`Tryb offline: unikalne ilustracje techniczne są widoczne dla ${total}/${total} usterek.`);return;}
      if(openversePaused && !openverseBudgetAvailable()) setStatus(`Dzienny limit Openverse osiągnięty. Kontynuujemy uzupełnianie z Wikimedia Commons; brakujące zdjęcia nie są powielane.`);
      await processRepair(repair,i,total);
    }
    applyAll();
    const count=[...assignments.values()].reduce((n,a)=>n+a.length,0);
    setStatus(`Zakończono: ${count}/${total*PHOTO_SLOTS} unikalnych fotografii online · ilustracje techniczne dostępne: ${total}/${total} usterek.`,count===total*PHOTO_SLOTS?'Każda usterka ma trzy unikalne fotografie online oraz własne ilustracje awaryjne.':'Ilustracje techniczne pozostają widoczne; brakujące fotografie online nie powodują pustych kart.');
    console.info(`[PHOTO FIX7] ${count}/${total*PHOTO_SLOTS} distinct photos for ${assignments.size}/${total} repairs.`);
    return count;
  }
  function loadRepairPhotos(repairs) {
    currentRepairs=Array.isArray(repairs)&&repairs.length?repairs:(window.ACADEMY_DATA?.faults||[]);
    // FIX50: render local photos synchronously before any network request or API limit check.
    applyAll();
    if(!navigator.onLine)setStatus(`Tryb offline: lokalne fotografie są dostępne dla ${currentRepairs.length}/${currentRepairs.length} usterek.`, 'Zdjęcia lokalne są częścią paczki i nie wymagają Openverse ani Wikimedia Commons.');
    if(inFlight)return inFlight;
    inFlight=runQueue(currentRepairs).catch(error=>{console.warn('[PHOTO FIX7] queue:',error);applyAll();return 0;}).finally(()=>{inFlight=null;if(rescanNeeded){rescanNeeded=false;loadRepairPhotos(currentRepairs);}});
    return inFlight;
  }
  function getRepairPhotos(item){return displayPhotos(item?.id,item||{},'detail').filter(Boolean);}
  function getRepairPhoto(item){return displayPhotos(item?.id,item||{},'card')[0]||null;}
  restore();
  api.loadRepairPhotos=loadRepairPhotos;
  api.getRepairPhoto=getRepairPhoto;
  api.getRepairPhotos=getRepairPhotos;
  api.repairPhotoAssignments=assignments;
  api.uniqueRepairPhotoCount=()=>[...assignments.values()].filter(a=>a.length>0).length;
  api.uniqueRepairImageCount=()=>[...assignments.values()].reduce((n,a)=>n+a.length,0);
  api.uniquePhotoEngineVersion='6.8.0-fix87-repair-card-detail-visuals';
  api.getLocalRepairPhotos=localRepairPhotos;
  api.probeOnlinePhoto=imageDHash;
  api.isAllowedPhotoLicense=licenseAllowed;
  api.uniquePhotoEnginePolicy='one-unique-card-illustration-plus-three-different-detail-illustrations-per-fault-plus-unique-topic-matched-online-photos';
  api.photoProvider='Openverse + Wikimedia Commons';
  api.photoPolicy={photosPerRepair:PHOTO_SLOTS,repairCardPhotos:1,noReuseAcrossRepairs:true,noReuseAcrossSlots:true,perceptualHashVerificationRequired:false,perceptualHashBestEffort:true,localFirst:true,offlineFallback:true,offlineIllustrationsUniquePerFaultAndSlot:true,onlinePhotosUniqueByProviderUrlAndPage:true};
  api.resumePhotoDownload=()=>{openversePaused=false;return loadRepairPhotos(currentRepairs);};
  api.photoQueueStarted=false;
  document.addEventListener('online',()=>{if(currentRepairs.length && [...assignments.values()].some(a=>a.length<PHOTO_SLOTS))api.resumePhotoDownload();});
  document.addEventListener('click',event=>{if(event.target.closest('#repairPhotoRetry')){openversePaused=false;api.resumePhotoDownload();}});
})();
