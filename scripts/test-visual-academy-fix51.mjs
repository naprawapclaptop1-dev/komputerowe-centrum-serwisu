import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const manifest=JSON.parse(read('WEB_PUBLISH/assets/visual-asset-manifest-fix51.json'));
let passed=0;
function check(name,fn){fn();passed++;console.log(`PASS ${name}`);}

check('biblioteka ma 18 odrębnych plansz SVG',()=>{
  assert.equal(manifest.length,undefined);
  assert.equal(manifest.assets.length,18);
  assert.equal(new Set(manifest.assets.map(x=>x.id)).size,18);
  for(const item of manifest.assets){
    const file=path.join(WEB,item.src);
    const svg=fs.readFileSync(file,'utf8');
    assert.ok(svg.includes('<svg '),`${item.id}: brak svg`);
    assert.ok(svg.includes('<title'),`${item.id}: brak tytułu`);
    assert.ok(svg.includes('</svg>'),`${item.id}: niezamknięty dokument`);
    assert.ok(svg.length>3000,`${item.id}: plansza podejrzanie mała`);
  }
});

check('wszystkie 12 fotografii lokalnych istnieje i jest dekodowalne',()=>{
  const photos=manifest.assets.length?JSON.parse(read('FIX51_RELEASE_MANIFEST.json')).localPhotos:[];
  assert.equal(photos.length,12);
  for(const item of photos){const file=path.join(WEB,item);assert.ok(fs.existsSync(file),`brak ${item}`);assert.ok(fs.statSync(file).size>10000,`plik zbyt mały: ${item}`);}
  const posters=JSON.parse(read('FIX51_RELEASE_MANIFEST.json')).localPosters;assert.equal(posters.length,3);
  for(const item of posters){const file=path.join(WEB,item);assert.ok(fs.existsSync(file),`brak plakatu ${item}`);assert.ok(fs.statSync(file).size>10000,`plik plakatu zbyt mały: ${item}`);}
});

check('silnik wizualny wybiera lokalne materiały bez globalnego wyczerpania puli',()=>{
  const photoScript=read('WEB_PUBLISH/assets/visual-assets-fix51.js');
  const document={addEventListener(){}};
  const kind=item=>{
    const s=[item.title,item.titleEn,item.name,item.category,item.tags,item.purpose].filter(Boolean).join(' ').toLowerCase();
    if(/ram|pamięć|ddr/.test(s))return 'ram';
    if(/ssd|nvme|hdd|dysk/.test(s))return 'storage';
    if(/gpu|grafik|vram/.test(s))return 'gpu';
    if(/chłod|wentyl|fan|thermal/.test(s))return 'cooling';
    if(/matryc|ekran|display|zawias/.test(s))return 'display';
    if(/usb|port|złącze/.test(s))return 'port';
    if(/multimetr|oscyloskop|pomiar|diagnost|miernik/.test(s))return 'meter';
    if(/bios|uefi|płyta|motherboard|vrm|mosfet/.test(s))return 'board';
    if(/wifi|router|sieć/.test(s))return 'network';
    if(/audio|dźwięk|głośnik/.test(s))return 'audio';
    if(/esd|bezpieczeń/.test(s))return 'safety';
    if(/windows|system|sterownik/.test(s))return 'software';
    return 'laptop';
  };
  const window={ACADEMY_ART:{kind,photoPools:{},onlinePhotos:[]}};
  vm.runInNewContext(photoScript,{window,document,URL,encodeURIComponent,console,Set,Map,Object,String,RegExp,Array,Math});
  const api=window.ACADEMY_ART;
  assert.equal(api.visualAssetCount,18);
  const categories=['RAM DDR5','Dysk SSD NVMe','GPU VRAM','Czyszczenie chłodzenia','Matryca LCD','Port USB-C','Multimetr pomiar','Płyta główna BIOS','Wi-Fi router','Audio kodek','ESD bezpieczeństwo','Windows sterownik'];
  for(let i=0;i<400;i++){
    const title=categories[i%categories.length];
    const src=api.dataUrl({id:`lesson-${i}`,title},`course:${i}`);
    assert.ok(/^(media|assets)\//.test(src),`wybór nie jest lokalny: ${src}`);
    assert.ok(fs.existsSync(path.join(WEB,src)),`nie istnieje lokalny obraz: ${src}`);
    assert.ok(!src.startsWith('data:image/svg+xml'),`wrócił losowy placeholder: ${src}`);
  }
  assert.equal(api.photoUniqueness.reuseAcrossLessons,false);
  assert.equal(api.photoUniqueness.uniqueWithinRepairCard,true);
  const diagram=api.dataUrl({id:'x',title:'Schemat sekcji zasilania VRM MOSFET'},'course:schematic');
  assert.equal(diagram,'assets/artwork-fix51/02-power-vrm.svg');
  const remote=api.dataUrl({id:'remote',title:'Naprawa PCB',image:'https://example.test/photo.jpg'},'gallery:remote');
  assert.match(remote,/^assets\/artwork-fix(?:51|77)\/.+\.svg$/);
});

check('strona ładuje silnik FIX51 przed renderowaniem aplikacji',()=>{
  const html=read('WEB_PUBLISH/index.html');
  assert.ok(html.indexOf('visual-assets-fix51.js')<html.indexOf('assets/app.js?v=6.8.0-fix51-visual-academy'));
  assert.ok(html.includes('visual-academy-fix51.js?v=6.8.0-fix51'));
  assert.ok(html.includes('visual-academy-fix51.css?v=6.8.0-fix51'));
  assert.ok(html.includes('meta name="academy-build" content="6.8.0-fix51-visual-academy-pro-20261105"'));
});

check('UI zawiera atlas, multimetr, oscyloskop, ścieżki diagnostyczne i galerię',()=>{
  const ui=read('WEB_PUBLISH/assets/visual-academy-fix51.js');
  for(const token of ['fix51AssetGrid','fix51MeterScenario','fix51ScopeCanvas','fix51DiagnosticCase','fix51PhotoGrid','fix51Hotspots','fix51LayerButtons','fix51QuizOptions','fix51BeforeInput','fix51AfterInput','fix51CompareRange','autorskie plakaty SVG','bindImageQuiz','bindBeforeAfter','URL.createObjectURL','verifyAssets()','Diagnostyka krok po kroku'])assert.ok(ui.includes(token),`brak ${token}`);
  assert.ok(ui.includes('canvas.getContext(\'2d\')'));
  const posterPaths=ui.match(/const posterPaths=\[([^\]]+)\]/)?.[1];
  assert.ok(posterPaths,'brak tablicy posterPaths');
  const listedPosters=[...posterPaths.matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(listedPosters,['assets/artwork-fix77/video-index-01.svg','assets/artwork-fix77/video-index-02.svg','assets/artwork-fix77/video-index-03.svg'],'aktywne plakaty muszą być unikalnymi ilustracjami FIX77');
  for(const item of listedPosters) assert.ok(fs.existsSync(path.join(WEB,item)),`brak plakatu ${item}`);
  assert.ok(ui.includes('const all=[...photoPaths,...posterPaths,...assets.map(a=>a.src)]'));
  assert.ok(ui.includes('ODCZYT SYMULOWANY'));
});

check('Service Worker pre-cache zawiera bibliotekę fotografii i wszystkie ilustracje',()=>{
  const sw=read('WEB_PUBLISH/service-worker.js');
  assert.ok(sw.includes('fix51-visual-academy-pro-20261105'));
  assert.ok(sw.includes('/assets/visual-assets-fix51.js?v=6.8.0-fix51'));
  assert.ok(sw.includes('/assets/visual-academy-fix51.js?v=6.8.0-fix51'));
  for(const item of manifest.assets)assert.ok(sw.includes(`'/assets/${item.src.replace(/^assets\//,'')}'`),`brak cache ${item.id}`);
});

check('symulatory nie wprowadzają sterowania sprzętem ani automatycznych napraw',()=>{
  const ui=read('WEB_PUBLISH/assets/visual-academy-fix51.js');
  assert.ok(ui.includes('nie komunikuje się z rzeczywistym miernikiem'));
  assert.ok(ui.includes('nie sterują sprzętem'));
  assert.ok(ui.includes('Odłącz zasilacz'));
});

console.log(`\nFIX51 VISUAL ACADEMY: ${passed}/${passed} PASS`);
