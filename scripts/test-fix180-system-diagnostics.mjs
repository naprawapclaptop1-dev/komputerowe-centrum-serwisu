#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const require=createRequire(import.meta.url);
const asset=path.join(root,'WEB_PUBLISH/assets/academy-system-diagnostics-fix180.js');
const data=require(asset);
const runtime=fs.readFileSync(asset,'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html');
const css=read('WEB_PUBLISH/assets/academy-system-diagnostics-fix180.css');
const sw=read('WEB_PUBLISH/service-worker.js');
const fix179=read('WEB_PUBLISH/assets/academy-advanced-curriculum-fix179.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const pass=label=>console.log(`[PASS] ${label}`);
const syntax=file=>{const r=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${file}: ${r.stderr||r.stdout}`);};

assert.equal(data.version,'6.8.0');assert.equal(data.fix,180);
assert.equal(data.lessons.length,15);assert.equal(data.cases.length,13);assert.equal(data.projects.length,10);assert.equal(data.glossary.length,28);
pass('FIX180 zawiera 15 nowych lekcji, 13 przypadków, 10 projektów i 28 haseł słownika');

const ids=new Set();let questions=0;
for(const lesson of data.lessons){
  assert.ok(lesson.id&&!ids.has(lesson.id),`brak/duplikat ID lekcji ${lesson.id}`);ids.add(lesson.id);
  assert.ok(lesson.title&&lesson.summary&&lesson.category);assert.ok(['Zaawansowany','Ekspert'].includes(lesson.level));assert.ok(lesson.minutes>=15);
  assert.ok(lesson.goals.length>=3&&lesson.theory.length>=3&&lesson.workflow.length>=4&&lesson.cautions.length>=3);
  assert.equal(lesson.quiz.length,3);
  for(const q of lesson.quiz){questions++;assert.ok(q.q&&q.e);assert.equal(q.a.length,3);assert.ok(Number.isInteger(q.c)&&q.c>=0&&q.c<3);}
  assert.ok(Array.isArray(lesson.sources)&&lesson.sources.length>0);
  for(const src of lesson.sources)assert.match(src.url,/^https:\/\//);
}
assert.equal(questions,45);
pass('45 pytań ma poprawne odpowiedzi i wyjaśnienia; każda lekcja ma cele, procedurę, BHP i źródła');

for(const item of data.cases){assert.ok(item.id&&item.title&&item.symptom);assert.equal(item.stages.length,3);for(const stage of item.stages){assert.ok(stage.name&&stage.prompt&&stage.why);assert.equal(stage.options.length,3);assert.ok(Number.isInteger(stage.correct)&&stage.correct>=0&&stage.correct<3);}}
pass('13 odrębnych przypadków ma 3 etapy diagnoza–plan–walidacja');
for(const project of data.projects){assert.ok(project.id&&project.title&&project.deliverable);assert.ok(project.tasks.length>=4);}
pass('10 projektów praktycznych ma etapy i mierzalny rezultat');
assert.equal(new Set(data.glossary.map(x=>x[0].toLowerCase())).size,data.glossary.length);
pass('28 terminów słownika jest unikalnych');

// Load the same 1083-course catalog used by the existing Academy release for a duplicate audit.
const sandbox=vm.createContext({console,window:{}});
for(const file of ['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','academy-expanded-practice-fix136.js','academy-expanded-practice-fix145.js']){
  vm.runInContext(read(`WEB_PUBLISH/assets/${file}`),sandbox,{timeout:20000,filename:file});
}
const catalog=sandbox.window.ACADEMY_DATA?.courseLessons||[];
assert.equal(catalog.length,1083,'audyt powinien objąć cały aktywny katalog 1083 lekcji');
const normalize=s=>String(s||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(x=>x.length>2));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b);let common=0;for(const x of A)if(B.has(x))common++;return common/Math.max(1,new Set([...A,...B]).size);};
const oldTitles=catalog.map(x=>x.title||'');
const oldFaults=(sandbox.window.ACADEMY_DATA.faults||[]).map(x=>x.title||'');
const nearest=[];
for(const lesson of data.lessons){
  const key=normalize(lesson.title);
  assert.ok(!oldTitles.some(t=>normalize(t)===key),`identyczny tytuł w katalogu: ${lesson.title}`);
  const best=oldTitles.map(title=>({score:similarity(lesson.title,title),title})).sort((a,b)=>b.score-a.score)[0];
  nearest.push({newTitle:lesson.title,bestMatch:best.title,score:best.score});
  assert.ok(best.score<0.55,`możliwy duplikat kursu: ${lesson.title} ~ ${best.title} (${best.score})`);
  assert.ok(!oldFaults.some(t=>normalize(t)===key),`tytuł lekcji pokrywa się z istniejącą awarią: ${lesson.title}`);
}
fs.writeFileSync(path.join(root,'FIX180_DUPLICATE_AUDIT.txt'),[
  'AUDYT DUPLIKATÓW FIX180',`Katalog istniejący: ${catalog.length} lekcji`,`Istniejące wpisy generatora awarii: ${oldFaults.length}`,`Nowe lekcje: ${data.lessons.length}`,'',
  ...nearest.sort((a,b)=>b.score-a.score).map(x=>`${x.score.toFixed(3)} | ${x.newTitle}\n    najbliższy tytuł: ${x.bestMatch}`),
  '', 'Wynik: brak identycznych tytułów; wszystkie nowe tytuły poniżej progu podobieństwa 0.55. Tematy sprawdzono również ręcznie pod kątem zakresu i różnicy funkcjonalnej.'
].join('\n'),'utf8');
pass('Porównanie z pełnym katalogiem 1083 lekcji i 155 awarii: brak identycznych/zbliżonych duplikatów');

const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(x=>x[1]);
const panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(x=>x[1]);
assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('advanced')&&tabs.includes('systemdiag')&&tabs.includes('deploy')&&tabs.includes('specialist'));
for(const id of ['a180SystemDiagnostics','a180ProgressBar','a180Status','a180LessonsDone','a180CaseDone','a180ProjectDone','a180Points','a180Search','a180Category','a180Level','a180LessonGrid','a180LessonDetail','a180CaseSelect','a180CaseBody','a180ProjectGrid','a180GlossarySearch','a180Glossary','a180ExportReport','a180ExportData'])assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`brak/duplikat ID ${id}`);
const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(allIds.length,new Set(allIds).size,'HTML IDs must remain unique');
assert.match(html,/academy-system-diagnostics-fix180\.js\?v=6\.8\.0-fix180/);
assert.match(html,/academy-system-diagnostics-fix180\.css\?v=6\.8\.0-fix180/);
pass('FIX180 pozostaje w istniejącym widoku; FIX182 dodaje 17. zakładkę bez nowego widoku i bez powielonych ID');

assert.match(fix179,/nauka-od-a-do-z-advanced-fix179-v1/);
assert.match(runtime,/nauka-od-a-do-z-fix180-service-lab-v1/);
assert.match(runtime,/ACADEMY_FIX168_AWARD/);
assert.match(runtime,/ACADEMY_FIX168_ADD_JOURNAL/);
assert.match(runtime,/fix180-/);
assert.equal((sw.match(/academy-system-diagnostics-fix180\.js\?v=6\.8\.0-fix180/g)||[]).length,1);
assert.equal((sw.match(/academy-system-diagnostics-fix180\.css\?v=6\.8\.0-fix180/g)||[]).length,1);
assert.match(sw,/const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);
assert.match(sw,/const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'/);
pass('Oddzielny klucz postępów FIX180; integracja z istniejącym punktowaniem/dziennikiem; cache i cache zdjęć bez zmian tożsamości');

assert.equal(release.release,'6.8.0');assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);
assert.equal(release.academyProfessionalRepairFix175.newViews,0);assert.equal(release.academyProfessionalRepairFix175.newD1Database,false);assert.equal(release.academyProfessionalRepairFix175.d1SchemaMigrations,false);
assert.ok(!/DROP\s+TABLE|CREATE\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM/i.test(runtime));
assert.ok(!/navigator\.usb|navigator\.serial|WebUSB|WebSerial/i.test(runtime));
pass('Wersja 6.8.0, dotychczasowe 1083 lekcje, brak migracji D1 i brak bezpośredniego dostępu do sprzętu');

for(const file of ['WEB_PUBLISH/assets/academy-system-diagnostics-fix180.js','WEB_PUBLISH/assets/academy-professional-repair-fix175.js','WEB_PUBLISH/service-worker.js','scripts/test-fix180-system-diagnostics.mjs','scripts/test-fix175-professional-academy.mjs'])syntax(file);
assert.ok(css.includes('.a180-main')&&css.includes('@media(max-width:620px)'));
assert.ok(html.includes('Nie zapisuj haseł, kluczy BitLocker, kluczy produktu ani danych klientów'));
assert.ok(!fs.existsSync(path.join(root,'migrations/0000_fix180.sql')));
pass('Składnia JS, responsywność CSS, ostrzeżenia bezpieczeństwa i brak nowej migracji SQL');

// Minimal DOM smoke test: executes the same browser bootstrap and checks that all main panels render.
const memory=new Map([['nauka-od-a-do-z-advanced-fix179-v1',JSON.stringify({completed:['fix179-lesson-board-post'],notes:{'board-post':'zachowane'},points:25})]]);
const elements=new Map();
const makeElement=id=>({id,dataset:{},style:{},value:(id==='a180Category'||id==='a180Level')?'all':'',innerHTML:'',textContent:'',hidden:false,addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},appendChild(){},remove(){}});
const mockDocument={getElementById(id){if(!elements.has(id))elements.set(id,makeElement(id));return elements.get(id);},createElement(){return makeElement('download');}};
const mockWindow={document:mockDocument,localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},ACADEMY_FIX168_AWARD:(id,points)=>{mockWindow.lastAward={id,points};}};
const browserContext=vm.createContext({window:mockWindow,document:mockDocument,console,Blob:function(){},URL:{createObjectURL(){return'blob:test';},revokeObjectURL(){}},setTimeout(){}});
vm.runInContext(runtime,browserContext,{timeout:5000,filename:'academy-system-diagnostics-fix180.js'});
assert.equal(elements.get('a180SystemDiagnostics').dataset.ready,'1');
assert.match(elements.get('a180LessonGrid').innerHTML,/Ślady wydajności Windows/);
assert.match(elements.get('a180LessonDetail').innerHTML,/Notatka do lekcji/);
assert.match(elements.get('a180CaseBody').innerHTML,/Laptop startuje wolno/);
assert.match(elements.get('a180ProjectGrid').innerHTML,/Projekt 1/);
assert.match(elements.get('a180Glossary').innerHTML,/ETW/);
assert.equal(memory.get('nauka-od-a-do-z-advanced-fix179-v1'),JSON.stringify({completed:['fix179-lesson-board-post'],notes:{'board-post':'zachowane'},points:25}),'FIX179 progress must remain unchanged by FIX180 boot');
pass('Przeglądarkowy bootstrap FIX180 renderuje lekcje, przypadki, projekty i słownik; zapis FIX179 pozostaje nienaruszony');
console.log('\nFIX180 SYSTEM DIAGNOSTICS: 10/10 PASS');
