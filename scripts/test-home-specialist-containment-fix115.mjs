import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const css=read('WEB_PUBLISH/assets/home-specialist-photo-layout-fix115.css');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const photoSection=html.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0]||'';
const slots=[...photoSection.matchAll(/data-photo-id="(home-specialist-[^"]+)"/g)].map(m=>m[1]);
assert.equal(slots.length,6,'Specialist block must keep all six cards.');
assert.equal(new Set(slots).size,6,'Every specialist card must have its own photo slot.');
for(const token of [
  '#view-home .np75-specialist-grid>button',
  '#view-home .np75-specialist-photo>img',
  'width:100%!important','height:100%!important','max-width:100%!important','max-height:100%!important',
  'overflow:hidden!important','object-fit:cover!important','contain:layout paint!important',
  '@media(max-width:900px)','@media(max-width:620px)'
]) assert.ok(css.includes(token),`Missing containment rule: ${token}`);
assert.ok(html.includes('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115'));
assert.ok(html.indexOf('photo-catalog-fix109.css?v=6.8.0-fix109') < html.indexOf('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115'),'Override CSS must load after the photo catalog stylesheet.');
assert.ok(sw.includes('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115'),'Service Worker must cache the new containment CSS.');
assert.equal(release.photoCatalog.specialistLayoutStylesheet,'assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115');
assert.equal(release.photoCatalog.specialistCardContainment,true);
console.log('[PASS] All six specialist cards retain unique photo slots.');
console.log('[PASS] Image dimensions, max bounds, overflow crop and responsive breakpoints are enforced.');
console.log('[PASS] FIX115 layout override loads after catalog CSS and is included in PWA CORE.');
console.log('FIX115 SPECIALIST IMAGE CONTAINMENT: 3/3 PASS');
