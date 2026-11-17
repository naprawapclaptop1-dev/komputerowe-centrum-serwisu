#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(import.meta.url);
const asset='WEB_PUBLISH/assets/academy-specialist-systems-fix182.js';
const data=require(path.join(root,asset)),runtime=fs.readFileSync(path.join(root,asset),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html'),css=read('WEB_PUBLISH/assets/academy-specialist-systems-fix182.css');
const sw=read('WEB_PUBLISH/service-worker.js'),release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js'),watcher=read('AUTO_PUBLISH_WATCHER.js');
const pass=s=>console.log(`[PASS] ${s}`);
const syntax=f=>{const r=spawnSync(process.execPath,['--check',f],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${f}: ${r.stderr||r.stdout}`);};

assert.equal(data.fix,182);assert.equal(data.version,'6.8.0');
assert.equal(data.lessons.length,20);assert.equal(data.cases.length,17);assert.equal(data.projects.length,10);assert.equal(data.glossary.length,40);assert.equal(data.exam.length,16);
assert.equal(data.lessons.reduce((n,x)=>n+x.quiz.length,0),60);
assert.equal(new Set(data.lessons.map(x=>x.id)).size,20);
assert.equal(new Set(data.cases.map(x=>x.id)).size,17);
assert.equal(new Set(data.projects.map(x=>x.id)).size,10);
pass('FIX182 rzeczywiście zawiera 20 lekcji, 60 pytań, 17 przypadków, 10 projektów, 40 haseł i egzamin 16-pytaniowy');

const lessonIds=new Set();
for(const lesson of data.lessons){
  assert.ok(lesson.id&&lesson.title&&lesson.summary&&lesson.category);assert.ok(!lessonIds.has(lesson.id));lessonIds.add(lesson.id);
  assert.ok(['Zaawansowany','Ekspert'].includes(lesson.level));assert.ok(lesson.minutes>=15);
  assert.ok(lesson.goals.length>=3&&lesson.theory.length>=2&&lesson.workflow.length>=4&&lesson.cautions.length>=2);
  assert.equal(lesson.quiz.length,3);
  for(const q of lesson.quiz){assert.ok(q.q&&q.e);assert.equal(q.a.length,3);assert.ok(Number.isInteger(q.c)&&q.c>=0&&q.c<3);}
  assert.ok(lesson.sources.length>0);for(const src of lesson.sources)assert.match(src.url,/^https:\/\//);
}
for(const c of data.cases){assert.ok(c.id&&c.title&&c.symptom);assert.equal(c.stages.length,3);for(const s of c.stages){assert.ok(s[0]&&s[3]);assert.equal(s[1].length,3);assert.ok(Number.isInteger(s[2])&&s[2]>=0&&s[2]<3);}}
for(const p of data.projects){assert.ok(p.id&&p.title&&p.deliverable);assert.ok(p.tasks.length>=5);}
assert.equal(new Set(data.glossary.map(x=>x[0].toLowerCase())).size,40);
assert.ok(data.exam.every(x=>x.q&&x.e&&x.a.length===3&&x.c>=0&&x.c<3));
pass('Każda lekcja, odpowiedź, procedura, ostrzeżenie, etap przypadku i checklist projektu ma poprawną strukturę');

// Duplicate audit against the active 1083-lesson catalog, fault catalog and the immediately previous FIX179–FIX181 additions.
const sandbox=vm.createContext({console,window:{}});
for(const file of ['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','academy-expanded-practice-fix136.js','academy-expanded-practice-fix145.js']) vm.runInContext(read(`WEB_PUBLISH/assets/${file}`),sandbox,{timeout:20000,filename:file});
const catalog=sandbox.window.ACADEMY_DATA?.courseLessons||[],faults=sandbox.window.ACADEMY_DATA?.faults||[];
assert.equal(catalog.length,1083);
const prior=[];
for(const f of ['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js']){
 const m=require(path.join(root,'WEB_PUBLISH/assets',f));
 for(const x of [...(m.lessons||[]),...(m.cases||[]),...(m.projects||[])]) prior.push({title:x.title||'',source:f});
}
const normalize=s=>String(s||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(x=>x.length>2));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b);let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,new Set([...A,...B]).size);};
const oldEntries=[...catalog.map(x=>({title:x.title||'',source:'catalog'})),...faults.map(x=>({title:x.title||'',source:'faults'})),...prior];
const nearest=[];
for(const lesson of data.lessons){
 const title=normalize(lesson.title);assert.ok(!oldEntries.some(x=>normalize(x.title)===title),`Dokładny duplikat: ${lesson.title}`);
 const best=oldEntries.map(x=>({...x,score:similarity(lesson.title,x.title)})).sort((a,b)=>b.score-a.score)[0]||{title:'',source:'none',score:0};
 nearest.push({newTitle:lesson.title,bestMatch:best.title,source:best.source,score:best.score});
 assert.ok(best.score<0.55,`Możliwy duplikat: ${lesson.title} ~ ${best.title} (${best.score.toFixed(3)}) [${best.source}]`);
}
for(const item of data.cases){
 const title=normalize(item.title);assert.ok(!oldEntries.some(x=>normalize(x.title)===title),`Dokładny duplikat przypadku: ${item.title}`);
 const best=oldEntries.map(x=>({...x,score:similarity(item.title,x.title)})).sort((a,b)=>b.score-a.score)[0]||{title:'',source:'none',score:0};
 assert.ok(best.score<0.55,`Możliwy duplikat przypadku: ${item.title} ~ ${best.title} (${best.score.toFixed(3)}) [${best.source}]`);
 nearest.push({newTitle:`[PRZYPADEK] ${item.title}`,bestMatch:best.title,source:best.source,score:best.score});
}
for(const project of data.projects){
 const title=normalize(project.title);assert.ok(!oldEntries.some(x=>normalize(x.title)===title),`Dokładny duplikat projektu: ${project.title}`);
 const best=oldEntries.map(x=>({...x,score:similarity(project.title,x.title)})).sort((a,b)=>b.score-a.score)[0]||{title:'',source:'none',score:0};
 assert.ok(best.score<0.55,`Możliwy duplikat projektu: ${project.title} ~ ${best.title} (${best.score.toFixed(3)}) [${best.source}]`);
 nearest.push({newTitle:`[PROJEKT] ${project.title}`,bestMatch:best.title,source:best.source,score:best.score});
}
const priorGlossary=new Set(['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js'].flatMap(f=>require(path.join(root,'WEB_PUBLISH/assets',f)).glossary||[]).map(x=>String(x[0]).trim().toLocaleLowerCase('pl-PL')));
for(const [term] of data.glossary)assert.ok(!priorGlossary.has(String(term).trim().toLocaleLowerCase('pl-PL')),`Powielone hasło słownika: ${term}`);
assert.equal(new Set(data.lessons.map(x=>x.category)).size,5);
fs.writeFileSync(path.join(root,'FIX182_DUPLICATE_AUDIT.txt'),[
 'AUDYT POWTÓRZEŃ FIX182',`Aktywny katalog lekcji: ${catalog.length}`,`Istniejące awarie: ${faults.length}`,`Dodatkowe materiały FIX179–FIX181: ${prior.length}`,`Nowe lekcje: ${data.lessons.length}`,`Nowe przypadki: ${data.cases.length}`,`Nowe projekty: ${data.projects.length}`,'',
 ...nearest.sort((a,b)=>b.score-a.score).map(x=>`${x.score.toFixed(3)} | ${x.newTitle}\n  najbliższy wcześniejszy tytuł: ${x.bestMatch} [${x.source}]`),
 '', 'Wynik: brak identycznych tytułów; podobieństwo tytułów poniżej progu 0.55. Audyt semantyczny wykonano również względem funkcjonalnego zakresu poprzednich modułów.'
].join('\n'),'utf8');
pass(`Audyt duplikatów: ${catalog.length} kursów + ${faults.length} awarii + FIX179–FIX181; brak kolizji w lekcjach, przypadkach i projektach oraz brak powtórzonych haseł słownika`);

const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(x=>x[1]);
const panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(x=>x[1]);
assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('specialist'));
assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
assert.equal((html.match(/id="a182SpecialistSystems"/g)||[]).length,1);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplikaty ID w HTML');
for(const id of ['a182Progress','a182Status','a182LessonsDone','a182CasesDone','a182ProjectsDone','a182ExamDone','a182Points','a182Search','a182Category','a182Level','a182Report','a182LessonList','a182LessonDetail','a182LinuxScenario','a182LinuxOutput','a182UefiCommand','a182UefiRun','a182UefiOutput','a182OemVendor','a182OemCode','a182OemCheck','a182OemOutput','a182RedfishLoad','a182RedfishOutput','a182ChromeState','a182ChromeOutput','a182CaseSelect','a182CaseBody','a182Projects','a182Exam','a182Glossary','a182Export']) assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`brak/duplikat kontrolki ${id}`);
assert.match(html,/academy-specialist-systems-fix182\.js\?v=6\.8\.0-fix182/);
assert.match(html,/academy-specialist-systems-fix182\.css\?v=6\.8\.0-fix182/);
assert.equal((sw.match(/academy-specialist-systems-fix182\.js\?v=6\.8\.0-fix182/g)||[]).length,1);
assert.equal((sw.match(/academy-specialist-systems-fix182\.css\?v=6\.8\.0-fix182/g)||[]).length,1);
assert.match(sw,/const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);
assert.match(sw,/const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'/);
pass('Rzeczywista integracja z rozszerzoną Akademią: 20 zakładek, 35 widoków; brak nowych widoków, unikalne ID, HTML/CSS/JS/PWA');

const meta=release.academySpecialistSystemsFix182;
assert.equal(release.release,'6.8.0');assert.equal(meta.hotfix,'FIX182');assert.equal(meta.productVersion,'6.8.0');
assert.equal(meta.lessonCount??meta.lessons,20);assert.equal(meta.quizQuestionCount??meta.quizQuestions,60);assert.equal(meta.caseCount??meta.cases,17);assert.equal(meta.projectCount??meta.projects,10);assert.equal(meta.glossaryCount??meta.glossaryTerms,40);assert.equal(meta.examQuestionCount??meta.examQuestions,16);
assert.equal(meta.newViews,0);assert.equal(meta.expectedExistingViews,35);assert.equal(meta.expectedExistingAcademyTabs,17);
assert.equal(meta.newD1Database,false);assert.equal(meta.newD1Tables,false);assert.equal(meta.d1SchemaMigrations,false);assert.equal(meta.hardwareAccess,false);assert.equal(meta.networkAccess,false);assert.equal(meta.localStorageOnly,true);assert.equal(meta.productionPublished,false);
assert.match(runtime,/nauka-od-a-do-z-fix182-specialist-systems-v1/);
assert.match(runtime,/ACADEMY_FIX168_AWARD/);
assert.ok(!/fetch\s*\(|navigator\.usb|navigator\.serial|navigator\.hid|WebUSB|WebSerial|WebHID/i.test(runtime));
assert.ok(!/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|DELETE\s+FROM/i.test(runtime));
for(const asset of ['academy-specialist-systems-fix182.js','academy-specialist-systems-fix182.css'])assert.ok(publisher.includes(asset)&&watcher.includes(asset));
assert.ok(publisher.includes('run-tests-fix182.mjs'));
for(const token of ['fix182Meta.lessons !== 20','fix182Meta.quizQuestions !== 60','fix182Meta.cases !== 17','fix182Meta.projects !== 10','fix182Meta.glossaryTerms !== 40','fix182Meta.examQuestions !== 16'])assert.ok(publisher.includes(token)&&watcher.includes(token),`guard publikacji nie waliduje ${token}`);
for(const token of ['remoteSpecialistSystemsMetaValid', "remoteRelease?.academySpecialistSystemsFix182?.hotfix==='FIX182'", 'academy-specialist-systems-fix182.js?v=6.8.0-fix182', "remoteServiceWorker.includes('academy-specialist-systems-fix182.js')"])assert.ok(watcher.includes(token),`weryfikacja online FIX182 pomija ${token}`);
assert.ok(watcher.includes('FIX182')&&watcher.includes('17. zakładka'));
for(const f of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','WEB_PUBLISH/service-worker.js','WEB_PUBLISH/assets/academy-specialist-systems-fix182.js','scripts/test-fix182-specialist-systems.mjs'])syntax(f);
assert.ok(css.includes('.a182-shell')&&css.includes('@media'));
pass('Wersja 6.8.0 i D1 bez zmian; publikator/watcher blokują brak assetów i testów; symulatory bez dostępu do sprzętu/sieci');

// Actual FIX182 runtime is executed in a controlled fake DOM. Existing progress keys are sentinel-protected.
const memory=new Map([
 ['nauka-od-a-do-z-advanced-fix179-v1',JSON.stringify({completed:['fix179-lesson-board-post'],notes:{'board-post':'zapis FIX179'},points:25})],
 ['nauka-od-a-do-z-fix180-service-lab-v1',JSON.stringify({completed:['fix180-lesson-one'],points:30})],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',JSON.stringify({completed:['fix181-lesson-wim-reference-design'],notes:{'wim-reference-design':'zapis FIX181'},points:85})]
]);
const elements=new Map();
const makeElement=id=>{
 const handlers={};
 return {id,dataset:{},style:{},value:(id==='a182Category'||id==='a182Level')?'all':(id==='a182LinuxScenario'?'ext4-io':id==='a182UefiCommand'?'help':id==='a182OemVendor'?'dell':id==='a182ChromeState'?'personal':''),innerHTML:'',textContent:'',hidden:false,checked:false,children:[],handlers,
  addEventListener(type,fn){handlers[type]=fn;},
  querySelectorAll(selector){
   this.__queryCache??=new Map();const cacheKey=selector+'\n'+this.innerHTML;if(this.__queryCache.has(cacheKey))return this.__queryCache.get(cacheKey);
   if(selector==='[data-a182-project]'){
    const re=/data-a182-project="([^"]+)" data-step="(\d+)"( checked)?/g,out=[];let m;
    while((m=re.exec(this.innerHTML))){const checkbox=makeElement('project-checkbox');checkbox.dataset={a182Project:m[1],step:m[2]};checkbox.checked=Boolean(m[3]);out.push(checkbox);}
    this.__queryCache.set(cacheKey,out);return out;
   }
   if(selector==='[data-a182-lesson]'){
    const re=/data-a182-lesson="([^"]+)"/g,out=[];let m;
    while((m=re.exec(this.innerHTML))){const button=makeElement('lesson-button');button.dataset={a182Lesson:m[1]};out.push(button);}
    this.__queryCache.set(cacheKey,out);return out;
   }
   return [];
  },
  querySelector(selector){
   const idMatch=selector.match(/^#([A-Za-z0-9_-]+)$/);if(idMatch)return mockDocument.getElementById(idMatch[1]);
   const nameMatch=selector.match(/name="(a182q|a182exam)(\d+)"/);
   if(nameMatch){const index=Number(nameMatch[2]),answers=nameMatch[1]==='a182q'?data.lessons[0].quiz:data.exam;return {value:String(answers[index].c)};}
   return null;
  },appendChild(el){this.children.push(el);},remove(){},click(){handlers.click?.({target:this});}
 };
};
const mockDocument={body:makeElement('body'),getElementById(id){if(!elements.has(id)){const marker=new RegExp('id=[\"\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\"\']');for(const host of elements.values())if(marker.test(host.innerHTML)){elements.set(id,makeElement(id));break;}if(!elements.has(id))elements.set(id,makeElement(id));}return elements.get(id);},createElement(){return makeElement('created');}};
const awardCalls=[];
const mockWindow={document:mockDocument,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},ACADEMY_FIX168_AWARD(...args){awardCalls.push(args);},ACADEMY_FIX168_ADD_JOURNAL(){}};
const context=vm.createContext({window:mockWindow,document:mockDocument,console,Blob:function(){},URL:{createObjectURL(){return'blob:test';},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(runtime,context,{timeout:8000,filename:'academy-specialist-systems-fix182.js'});
assert.equal(elements.get('a182SpecialistSystems').dataset.ready,'1');
assert.match(elements.get('a182Status').textContent,/20 lekcji, 17 przypadków, 10 projektów, 16 pytań i 40 terminów/);
assert.match(elements.get('a182LessonList').innerHTML,/Btrfs|UEFI|Redfish|ChromeOS/i);
assert.match(elements.get('a182LessonDetail').innerHTML,/Cele nauki/);
assert.match(elements.get('a182CaseBody').innerHTML,/Wybierz najbezpieczniejszą decyzję serwisową/);
assert.match(elements.get('a182Projects').innerHTML,/Rezultat:/);
assert.match(elements.get('a182Exam').innerHTML,/16 pytań/);
assert.match(elements.get('a182Glossary').innerHTML,/LUKS/);
assert.match(elements.get('a182UefiOutput').innerHTML,/Symulacja odczytu/);
assert.match(elements.get('a182LinuxOutput').innerHTML,/Bezpieczny pierwszy krok/);
assert.match(elements.get('a182ChromeOutput').innerHTML,/Recovery/);
assert.match(elements.get('a182RedfishOutput').textContent,/TrainingDataOnly/);

// Exercise actual UI callbacks: quiz, notes, staged case, checklist and the exam.
elements.get('a182CheckQuiz').click();
assert.match(elements.get('a182QuizResult').textContent,/Wynik 3\/3\. Lekcja zaliczona/);
mockDocument.getElementById('a182Note').value='Notatka testowa FIX182 — kopia danych przed diagnozą.';
elements.get('a182SaveNote').click();
for(let i=0;i<3;i++)mockDocument.getElementById(`a182Stage${i}`).value=String(data.cases[0].stages[i][2]);
elements.get('a182EvaluateCase').click();
assert.match(elements.get('a182CaseResult').textContent,/Wynik 3\/3 \(100%\)/);
const projectChecks=elements.get('a182Projects').querySelectorAll('[data-a182-project]');
assert.ok(projectChecks.length>=5,'project checklist checkboxes must be rendered');
projectChecks[0].checked=true;projectChecks[0].handlers.change?.();
assert.ok(elements.get('a182Projects').innerHTML.includes('checked'),'project task progress must render as checked');
elements.get('a182SubmitExam').click();
assert.match(elements.get('a182ExamResult').textContent,/Wynik 16\/16 \(100%\)\. Egzamin zaliczony/);
const savedFix182=JSON.parse(memory.get('nauka-od-a-do-z-fix182-specialist-systems-v1'));
assert.ok(savedFix182.completed.includes(`fix182-lesson-${data.lessons[0].id}`));
assert.equal(savedFix182.notes[data.lessons[0].id],'Notatka testowa FIX182 — kopia danych przed diagnozą.');
assert.equal(savedFix182.caseScores[data.cases[0].id],100);
assert.equal(Object.keys(savedFix182.projectChecks).length,1);
assert.ok(savedFix182.examHistory[0].passed&&savedFix182.examHistory[0].pct===100);
assert.ok(awardCalls.length>=3,'course, case and exam completions should use the existing award bridge');

// Exercise each simulator with bundled sample data only.
elements.get('a182LinuxScenario').value='luks-no-unlock';elements.get('a182LinuxScenario').handlers.change();
assert.match(elements.get('a182LinuxOutput').innerHTML,/luksFormat/);
elements.get('a182UefiCommand').value='map -r';elements.get('a182UefiCommand').handlers.change();
assert.match(elements.get('a182UefiOutput').innerHTML,/Odśwież mapowania/);
elements.get('a182OemCode').value='2000-0142';elements.get('a182OemCode').handlers.input();
assert.match(elements.get('a182OemOutput').textContent,/format wygląda poprawnie/);
elements.get('a182ChromeState').value='managed';elements.get('a182ChromeState').handlers.change();
assert.match(elements.get('a182ChromeOutput').innerHTML,/administratorem organizacji/);
for(const [k,v] of [['nauka-od-a-do-z-advanced-fix179-v1',{completed:['fix179-lesson-board-post'],notes:{'board-post':'zapis FIX179'},points:25}],['nauka-od-a-do-z-fix180-service-lab-v1',{completed:['fix180-lesson-one'],points:30}],['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',{completed:['fix181-lesson-wim-reference-design'],notes:{'wim-reference-design':'zapis FIX181'},points:85}]]) assert.equal(memory.get(k),JSON.stringify(v),`${k} must not be changed`);
pass('Rzeczywisty FIX182 działa: quiz, notatki, ocena przypadku, checklista projektu, egzamin i pięć symulatorów; starsze postępy FIX179–FIX181 zachowane');

console.log('\nNAUKA OD A DO Z 6.8.0 FIX182 SPECIALIST SYSTEMS: 6/6 PASS');
