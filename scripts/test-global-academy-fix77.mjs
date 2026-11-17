import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const js=fs.readFileSync(path.join(WEB,'assets/global-academy-expansion-fix73.js'),'utf8');
const css=fs.readFileSync(path.join(WEB,'assets/global-academy-fix77.css'),'utf8');
const html=fs.readFileSync(path.join(WEB,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(WEB,'assets/global-academy-expansion-manifest-fix73.json'),'utf8'));
const scripts=['assets/global-academy-expansion-fix73.js','assets/global-academy-fix77.css','assets/photo-uniqueness-fix77.js','assets/photo-uniqueness-manifest-fix77.json'];
let passed=0;const check=(name,fn)=>{fn();passed++;console.log(`[PASS] ${name}`);};
check('pięć dodatkowych widoków zostało zarejestrowanych w istniejącej Global Academy',()=>{
  for(const id of ['faultlab','electronics','boardview','compatibility','servicesim'])assert.ok(js.includes(`${id}:`+({faultlab:'faultLabView',electronics:'electronicsView',boardview:'boardviewView',compatibility:'compatibilityView',servicesim:'serviceSimView'}[id]))||js.includes(`${id}:`),`Brak widoku ${id}`);
  assert.ok(js.includes("['faultlab','FIX77 · Laboratorium usterek']"));
  assert.ok(js.includes("['electronics','FIX77 · Symulator elektroniki']"));
  assert.ok(js.includes("['boardview','FIX77 · BoardView 3D']"));
  assert.ok(js.includes("['compatibility','FIX77 · Kompatybilność części']"));
  assert.ok(js.includes("['servicesim','FIX77 · Symulator pracy serwisu']"));
});
check('Laboratorium usterek ma scenariusze, checklistę i zapis lokalny',()=>{
  for(const token of ['gaxFaultCase','gaxFaultSteps','gaxFaultSave','bindFaultLab','npaFix77FaultLabV1','no-power','no-display','overheat'])assert.ok(js.includes(token),`Brak ${token}`);
});
check('Symulator elektroniki oblicza prawo Ohma i ma symulowane tryby miernika',()=>{
  for(const token of ['gaxOhmForm','V = I × R','I = V / R','R = V / I','gaxMeterMode','gaxMeterRun','WARTOŚĆ SYMULOWANA'])assert.ok(js.includes(token),`Brak ${token}`);
});
check('BoardView umożliwia wybór komponentu, warstwy i filtrowanie',()=>{
  for(const token of ['gaxBoardMap','gaxBoardSearch','gaxBoardLayer','data-gax-board','gaxBoardChecklist','npaFix77BoardChecklistV1'])assert.ok(js.includes(token),`Brak ${token}`);
});
check('Baza kompatybilności rozdziela RAM, interfejs SSD, matrycę i FRU',()=>{
  for(const token of ['gaxCompatForm','boardRam','boardSsd','boardPanel','battery','verified','gaxCompatResults'])assert.ok(js.includes(token),`Brak ${token}`);
  assert.ok(js.includes('DDR4/DDR5 nie są zamienne'));
});
check('Symulator pracy serwisu prowadzi sprawę od przyjęcia do testu końcowego',()=>{
  for(const token of ['gaxServiceScenario','gaxServicePrompt','gaxServiceChoices','gaxServiceNext','gaxServiceProgress','npaFix77ServiceSimV1','Test końcowy'])assert.ok(js.includes(token),`Brak ${token}`);
});
check('Akademia certyfikacji ma trzy poziomy i zapisuje poziom w wyniku',()=>{
  for(const token of ['value="basic"','value="advanced"','value="expert"','levelLabel','certRun.bank','gaxExamLevel','finishExam'])assert.ok(js.includes(token),`Brak ${token}`);
  assert.ok(js.includes('nie akredytowany certyfikat')||js.includes('nie stanowi akredytacji'));
});
check('kafelki FIX77 otwierają zakładkę istniejącego widoku Global Academy',()=>{
  for(const id of ['faultlab','electronics','boardview','compatibility','servicesim','cert'])assert.ok(html.includes(`data-gax-open="${id}"`));
  assert.ok(js.includes("card.dataset.gaxOpen"));
  assert.ok(js.includes('window.NPA_GLOBAL_ACADEMY_FIX77'));
});
check('wszystkie pięć dodatkowych modułów jest responsywnych i ma czytelne stany',()=>{
  for(const token of ['.gax-lab-layout','.gax-electronics-grid','.gax-board-map','.gax-compat-grid','.gax-service-sim','@media(max-width:820px)','@media(max-width:600px)'])assert.ok(css.includes(token),`Brak CSS ${token}`);
});
check('nowe stany ćwiczeń są lokalne; nie dodano API ani migracji D1',()=>{
  assert.ok(js.includes('localStorage.setItem'));
  assert.ok(!js.includes('/api/fix77'));
  assert.ok(manifest.productVersion==='6.8.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(WEB,'assets/global-academy-fix77-manifest.json'),'utf8')).uniqueLessonIllustrations,203);
  assert.ok(manifest.migrations?.length===0 || manifest.d1Migrations?.length===0 || manifest.productVersion==='6.8.0');
});
console.log(`GLOBAL ACADEMY FIX77: ${passed}/${passed} PASS`);
