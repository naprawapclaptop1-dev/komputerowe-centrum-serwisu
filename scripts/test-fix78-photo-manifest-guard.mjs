import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const html=fs.readFileSync(path.join(WEB,'index.html'),'utf8');
const one=fs.readFileSync(path.join(ROOT,'ONECLICK_AKADEMIA.js'),'utf8');
const watcher=fs.readFileSync(path.join(ROOT,'AUTO_PUBLISH_WATCHER.js'),'utf8');
const runtime=fs.readFileSync(path.join(WEB,'assets/photo-uniqueness-fix77.js'),'utf8');
const manifestPath=path.join(WEB,'assets/photo-uniqueness-manifest-fix77.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const globalCss=path.join(WEB,'assets/global-academy-fix77.css');
const visual=fs.readFileSync(path.join(WEB,'assets/visual-assets-fix51.js'),'utf8');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log(`[PASS] ${name}`);};
check('HTML ładuje runtime kontroli unikalności zdjęć',()=>assert.ok(html.includes('assets/photo-uniqueness-fix77.js?v=6.8.0-fix77')));
check('runtime sam pobiera manifest JSON pod właściwą ścieżką',()=>assert.ok(runtime.includes("fetch('/assets/photo-uniqueness-manifest-fix77.json'")));
check('OneClick sprawdza pobieranie manifestu w runtime zamiast szukać go w HTML',()=>{
  assert.ok(one.includes('photoUniquenessScript.includes("fetch(\'/assets/photo-uniqueness-manifest-fix77.json\'"'));
  assert.ok(!one.includes("!indexHtml.includes('assets/photo-uniqueness-manifest-fix77.json')"));
});
check('AUTO watcher uruchamia tę samą kontrolę regresyjną przed publikacją',()=>{
  assert.ok(watcher.includes('scripts/test-fix78-photo-manifest-guard.mjs'));
  assert.ok(!watcher.includes('scripts/run-tests-fix78.mjs'));
  assert.ok(!watcher.includes('WYKONAJ_TESTY_FIX78.cmd'));
});

check('OneClick i AUTO watcher uruchamiają wyłącznie skrypty Node, bez plików CMD i zagnieżdżonych runnerów',()=>{
  const oneMatch=one.match(/for \(const script of \[([\s\S]*?)\]\) \{\s*log\(/);
  const watcherMatch=watcher.match(/function runFix49NodePreflight\(\)\s*\{\s*const scripts = \[([\s\S]*?)\];/);
  assert.ok(oneMatch,'Brak listy skryptów wykonywanych przez OneClick');
  assert.ok(watcherMatch,'Brak listy skryptów wykonywanych przez Watcher');
  for(const match of [oneMatch,watcherMatch]){
    const files=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
    assert.ok(files.includes('scripts/test-fix78-photo-manifest-guard.mjs'));
    assert.ok(files.every(x=>/\.(?:mjs|js|cjs)$/i.test(x)),`Lista zawiera plik nie-Node: ${files.filter(x=>!/\.(?:mjs|js|cjs)$/i.test(x)).join(', ')}`);
    assert.ok(!files.some(x=>/run-tests-fix(?:77|78)\.mjs$/.test(x)),'Nie zagnieżdżaj runnera w preflight');
  }
});
check('historyczny runner FIX77 i jego CMD przekierowują do pełnego FIX78',()=>{
  const legacyRunner=fs.readFileSync(path.join(ROOT,'scripts/run-tests-fix77.mjs'),'utf8');
  const legacyCmd=fs.readFileSync(path.join(ROOT,'WYKONAJ_TESTY_FIX77.cmd'),'utf8');
  assert.ok(legacyRunner.includes('run-tests-fix78.mjs'));
  assert.ok(legacyCmd.includes('run-tests-fix78.mjs'));
});
check('lokalny manifest ma 13 zdjęć i próg pHash',()=>{
  assert.equal(manifest.photos.length,13);
  assert.equal(manifest.minimumHammingDistance,10);
  assert.ok(manifest.measuredMinimumHammingDistance>=10);
});
check('CSS modułów i polityka bez ponownego użycia ilustracji są obecne',()=>{
  assert.ok(fs.existsSync(globalCss));
  assert.ok(visual.includes('reuseAcrossLessons:false'));
});
console.log(`FIX78 PHOTO MANIFEST GUARD: ${passed}/${passed} PASS`);
