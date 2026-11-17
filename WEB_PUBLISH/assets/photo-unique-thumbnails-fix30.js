/* FIX30 — żadna karta nie otrzymuje ponownie tego samego obrazu. Galeria rezerwuje oryginalne fotografie Pexels; przy wyczerpaniu puli powstaje unikalna ilustracja tematyczna zamiast powtórzonego zdjęcia. */
(() => {
  'use strict';
  const api=window.ACADEMY_ART;
  if(!api||typeof api.dataUrl!=='function')return;
  const assignments=new Map(),used=new Set(),locked=new Set();
  const normalize=value=>{try{const u=new URL(String(value),location.href);u.hash='';u.search='';return u.origin===location.origin?u.pathname.toLowerCase():u.href.toLowerCase();}catch(_){return String(value||'').split('#')[0].split('?')[0].toLowerCase();}};
  document.querySelectorAll('img[data-photo-lock]').forEach(img=>{const src=img.getAttribute('src');if(src){const key=normalize(src);locked.add(key);used.add(key);}});
  // FIX77: no local or online photograph pool is reused by lesson cards.
  const local=[];
  const online=[];
  const onlineKeys=new Set(online.map(x=>normalize(x.url)));
  const hash=value=>{let h=2166136261;for(const c of String(value||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function svgArt(item,identity){
    const seed=hash(identity),hue=seed%360,hue2=(hue+55+(seed%77))%360;
    const label=esc((item?.name||item?.title||item?.titleEn||item?.category||api.kind(item)||'TECH').toString().slice(0,34));
    const count=4+(seed%4);
    const parts=Array.from({length:count},(_,i)=>{const x=35+((seed>>>((i%4)*6))%440),y=65+((seed>>>(((i+1)%4)*6))%190),w=28+(seed+i*19)%72,h=18+(seed+i*13)%35;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/><path d="M${x-18} ${y+h/2}h18m${w} 0h18M${x+w/2} ${y-16}v16m0 ${h}v16"/>`;}).join('');
    const trace=Array.from({length:5},(_,i)=>{const y=80+i*38;return `<path d="M30 ${y}h${70+(seed+i*31)%80}v${12+(i*7)%24}h${130+(seed+i*23)%90}"/>`;}).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 55% 20%)"/><stop offset="1" stop-color="hsl(${hue2} 60% 9%)"/></linearGradient><radialGradient id="r"><stop stop-color="hsl(${hue} 85% 55% / .32)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs><rect width="560" height="340" rx="22" fill="url(#g)"/><circle cx="440" cy="80" r="190" fill="url(#r)"/><g fill="none" stroke="hsl(${hue2} 90% 70% / .42)" stroke-width="3">${trace}</g><g fill="hsl(${hue} 55% 24%)" stroke="hsl(${hue2} 90% 75% / .88)" stroke-width="2">${parts}</g><path d="M28 270h504M28 286h210M28 302h330" fill="none" stroke="hsl(${hue2} 80% 70% / .32)" stroke-width="2"/><text x="34" y="40" fill="#b8fbff" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">ACADEMY / TECH LAB</text><text x="34" y="326" fill="#eefaff" font-family="Arial,sans-serif" font-size="18" font-weight="700">${label}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  function suppliedUrl(item){const value=typeof item?.image==='string'?item.image.trim():'';if(!value||/^data:image\/svg/i.test(value))return '';if(/^https:\/\//i.test(value)||/^media\//i.test(value))return value;return '';}
  function choose(item,identity,scope){
    const scopeName=String(scope||'lesson'),supplied=suppliedUrl(item),key=normalize(supplied);
    // The dedicated gallery and long-video covers may claim their own original, credited online image once.
    if((scopeName.startsWith('gallery:')||scopeName.startsWith('long-video:'))&&supplied&&onlineKeys.has(key)&&!used.has(key)){used.add(key);return supplied;}
    // Respect a supplied unique non-gallery asset, but never steal a photo reserved for the credited gallery.
    if(supplied&&!onlineKeys.has(key)&&!locked.has(key)&&!used.has(key)){used.add(key);return supplied;}
    // Dynamic cards use unclaimed local photography only. If it is exhausted, unique SVG artwork is safer than a duplicate photo.
    const category=api.kind(item||{}),start=hash(identity)%Math.max(1,local.length);
    const candidates=local.map((x,i)=>({x,i,score:x.kind===category?0:1})).sort((a,b)=>a.score-b.score||((a.i-start+local.length)%local.length)-((b.i-start+local.length)%local.length));
    for(const candidate of candidates){const photoKey=normalize(candidate.x.url);if(!locked.has(photoKey)&&!used.has(photoKey)){used.add(photoKey);return candidate.x.url;}}
    return '';
  }
  api.dataUrl=(item={},scope='lesson')=>{
    const identity=[scope,item?.id,item?.title,item?.titleEn,item?.category,item?.name].filter(Boolean).join('|');
    if(assignments.has(identity))return assignments.get(identity);
    const picked=choose(item,identity,scope),fallback=svgArt(item,identity);
    const result=picked?`${picked}#np630-fallback=${encodeURIComponent(fallback)}`:fallback;
    assignments.set(identity,result);return result;
  };
  api.photoUniqueness={version:'6.8.0-fix30',poolSize:local.length+online.length,assigned:()=>assignments.size,realPhotosUsed:()=>[...used].filter(x=>!x.startsWith('data:')&&!x.endsWith('.svg')).length,uniqueArtwork:svgArt,isPhoto:url=>typeof url==='string'&&!url.startsWith('data:image/svg+xml')};
  window.NP_PHOTO_UNIQUENESS_FIX30=api.photoUniqueness;
})();
