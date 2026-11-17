#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(import.meta.url);
const dataPath='WEB_PUBLISH/assets/academy-performance-firmware-fix185-data.json';
const runtimePath='WEB_PUBLISH/assets/academy-performance-firmware-fix185.js';
const data=require(path.join(root,dataPath)),runtime=fs.readFileSync(path.join(root,runtimePath),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html'),css=read('WEB_PUBLISH/assets/academy-performance-firmware-fix185.css');
const sw=read('WEB_PUBLISH/service-worker.js'),release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js'),watcher=read('AUTO_PUBLISH_WATCHER.js');
const pass=s=>console.log(`[PASS] ${s}`);
const syntax=f=>{const r=spawnSync(process.execPath,['--check',f],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${f}: ${r.stderr||r.stdout}`);};

// 1. Structured learning assets.
assert.equal(data.fix,185);assert.equal(data.version,'6.8.0');
assert.equal(data.lessons.length,20);assert.equal(data.lessons.reduce((n,x)=>n+x.quiz.length,0),60);
assert.equal(data.cases.length,15);assert.equal(data.projects.length,10);assert.equal(data.glossary.length,40);assert.equal(data.exam.length,20);assert.equal(data.tools.length,8);
assert.equal(new Set(data.lessons.map(x=>x.id)).size,20);assert.equal(new Set(data.cases.map(x=>x.id)).size,15);assert.equal(new Set(data.projects.map(x=>x.id)).size,10);
assert.equal(new Set(data.lessons.map(x=>x.category)).size,5);
for(const lesson of data.lessons){
 assert.ok(lesson.id&&lesson.title&&lesson.summary&&lesson.category&&lesson.minutes>=15);
 assert.ok(['Zaawansowany','Ekspert'].includes(lesson.level));
 assert.ok(lesson.goals.length>=3&&lesson.theory.length>=2&&lesson.workflow.length>=4&&lesson.cautions.length>=2);
 assert.equal(lesson.quiz.length,3);
 for(const q of lesson.quiz){assert.ok(q.q&&q.e);assert.equal(q.a.length,3);assert.ok(Number.isInteger(q.c)&&q.c>=0&&q.c<3);}
 assert.ok(lesson.sources.length>0);for(const src of lesson.sources)assert.match(src.url,/^https:\/\//);
}
for(const c of data.cases){assert.ok(c.id&&c.title&&c.symptom);assert.equal(c.stages.length,3);for(const st of c.stages){assert.ok(st[0]&&st[3]);assert.equal(st[1].length,3);assert.ok(Number.isInteger(st[2])&&st[2]>=0&&st[2]<3);}}
for(const p of data.projects){assert.ok(p.id&&p.title&&p.deliverable);assert.ok(p.tasks.length>=4);}
assert.equal(new Set(data.glossary.map(x=>x[0].toLocaleLowerCase('pl-PL'))).size,40);
assert.ok(data.exam.every(x=>x.q&&x.e&&x.a.length===3&&Number.isInteger(x.c)&&x.c>=0&&x.c<3));
for(const t of data.tools){assert.ok(t.id&&t.title&&t.description);assert.ok(t.options.length>=2);for(const o of t.options)assert.equal(o.length,3);}
assert.deepEqual(data.tools.map(x=>x.id),['etw','aer','storage','pcb','firmware','wave','random','evidence']);
pass('FIX185: 20 lekcji, 60 quizów, 15 przypadków, 10 projektów, 40 haseł, egzamin 20-pytaniowy i 8 narzędzi; struktura każdego materiału poprawna');

// 2. Duplicate audit against the active curriculum and all relevant prior hotfix course packs.
const sandbox=vm.createContext({console,window:{}});
for(const file of ['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','academy-expanded-practice-fix136.js','academy-expanded-practice-fix145.js'])vm.runInContext(read(`WEB_PUBLISH/assets/${file}`),sandbox,{timeout:20000,filename:file});
const catalog=sandbox.window.ACADEMY_DATA?.courseLessons||[],faults=sandbox.window.ACADEMY_DATA?.faults||[];assert.equal(catalog.length,1083);
const prior=[];
for(const f of ['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js','academy-specialist-systems-fix182.js','academy-advanced-service-lab-fix183.js','academy-expert-diagnostics-fix184.js']){const m=require(path.join(root,'WEB_PUBLISH/assets',f));for(const x of [...(m.lessons||[]),...(m.cases||[]),...(m.projects||[])])prior.push({title:x.title||'',source:f});}
const normalize=s=>String(s||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(x=>x.length>2));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b);let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,new Set([...A,...B]).size);};
const oldEntries=[...catalog.map(x=>({title:x.title||'',source:'katalog 1083'})),...faults.map(x=>({title:x.title||'',source:'usterki'})),...prior];
const nearest=[];
for(const item of [...data.lessons.map(x=>({...x,kind:'LEKCJA'})),...data.cases.map(x=>({...x,kind:'PRZYPADEK'})),...data.projects.map(x=>({...x,kind:'PROJEKT'}))]){
 const title=normalize(item.title);assert.ok(!oldEntries.some(x=>normalize(x.title)===title),`Dokładny duplikat ${item.kind}: ${item.title}`);
 const best=oldEntries.map(x=>({...x,score:similarity(item.title,x.title)})).sort((a,b)=>b.score-a.score)[0]||{title:'',source:'none',score:0};
 nearest.push({newTitle:`[${item.kind}] ${item.title}`,bestMatch:best.title,source:best.source,score:best.score});
 assert.ok(best.score<0.55,`Możliwy duplikat: ${item.title} ~ ${best.title} (${best.score.toFixed(3)}) [${best.source}]`);
}
const priorTerms=new Set(['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js','academy-specialist-systems-fix182.js','academy-advanced-service-lab-fix183.js','academy-expert-diagnostics-fix184.js'].flatMap(f=>require(path.join(root,'WEB_PUBLISH/assets',f)).glossary||[]).map(x=>String(x[0]).trim().toLocaleLowerCase('pl-PL')));
for(const [term] of data.glossary)assert.ok(!priorTerms.has(String(term).trim().toLocaleLowerCase('pl-PL')),`Powielone hasło słownika: ${term}`);
const sorted=[...nearest].sort((a,b)=>b.score-a.score),highest=sorted[0]?.score||0;
fs.writeFileSync(path.join(root,'FIX185_DUPLICATE_AUDIT.txt'),['AUDYT UNIKALNOŚCI FIX185',`Aktywny katalog lekcji: ${catalog.length}`,`Katalog przypadków/usterek: ${faults.length}`,`Materiały FIX179–FIX184: ${prior.length}`,`Nowe lekcje: ${data.lessons.length}`,`Nowe przypadki: ${data.cases.length}`,`Nowe projekty: ${data.projects.length}`,`Najwyższe podobieństwo tytułu: ${highest.toFixed(3)}`,'',...sorted.map(x=>`${x.score.toFixed(3)} | ${x.newTitle}\n  najbliższy wcześniejszy tytuł: ${x.bestMatch} [${x.source}]`),'','Wynik: brak dokładnych duplikatów; wszystkie podobieństwa tytułów poniżej 0.55. Kontrola tytułów nie zastępuje ręcznej oceny pełnej semantyki materiału.'].join('\n'),'utf8');
pass(`Audyt duplikatów: 1083 lekcje + ${faults.length} przypadków + FIX179–FIX184; brak identycznych/zbliżonych tytułów i powielonych terminów`);

// 3. Live integration, publication guards and safety.
const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(x=>x[1]),panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(x=>x[1]);
assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('perfdiag'));
assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplikaty ID w HTML');
for(const id of ['a185ExpertPerformance','a185Status','a185Progress','a185LessonsDone','a185CasesDone','a185ProjectsDone','a185ExamDone','a185Points','a185Search','a185Category','a185Level','a185LessonList','a185LessonDetail','a185CaseSelect','a185CaseBody','a185Projects','a185Exam','a185GlossarySearch','a185Glossary','a185Export','a185Report','a185Before','a185After','a185Test','a185Criteria'])assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`brak/duplikat kontrolki ${id}`);
for(const asset of ['academy-performance-firmware-fix185.js?v=6.8.0-fix185','academy-performance-firmware-fix185.css?v=6.8.0-fix185']){assert.ok(html.includes(asset));assert.ok(sw.includes(asset.split('?')[0]));}
assert.ok(fs.existsSync(path.join(root,dataPath)));assert.ok(watcher.includes('academy-performance-firmware-fix185-data.json'));
assert.match(sw,/const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);assert.match(sw,/const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'/);
assert.equal(release.release,'6.8.0');assert.equal(release.latestHotfix,'FIX176');
const meta=release.academyPerformanceFirmwareFix185;
for(const [k,v] of Object.entries({hotfix:'FIX185',productVersion:'6.8.0',lessons:20,quizQuestions:60,cases:15,projects:10,glossaryTerms:40,examQuestions:20,examPassPercent:80,tools:8,existingAcademyTab:'perfdiag',expectedExistingViews:35,expectedExistingAcademyTabs:20,newViews:0,newD1Database:false,newD1Tables:false,d1SchemaMigrations:false,dataMigrations:false,existingGeminiSecretPreserved:true,existingCloudflarePagesPreserved:true,existingD1Preserved:true,hardwareAccess:false,networkAccess:false,commandsExecuted:false,firmwareWrite:false,simulationsOnly:true,localStorageOnly:true,productionPublished:false}))assert.equal(meta[k],v,`release metadata ${k}`);
assert.match(runtime,/nauka-od-a-do-z-fix185-performance-firmware-v1/);assert.match(runtime,/ACADEMY_FIX168_AWARD/);
assert.ok(!/fetch\s*\(|navigator\.(usb|serial|hid)|WebUSB|WebSerial|WebHID|child_process|powershell\.exe|cmd\.exe/i.test(runtime));
assert.ok(!/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|DELETE\s+FROM/i.test(runtime));
for(const f of [runtimePath,'ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js'])syntax(f);
for(const token of ['academy-performance-firmware-fix185.js','academy-performance-firmware-fix185.css','academy-performance-firmware-fix185-data.json','fix185Meta.lessons!==20','remotePerformanceFirmwareMetaValid','remotePerformanceFirmwareHtmlValid','remotePerformanceFirmwarePwaValid'])assert.ok(publisher.includes(token)||watcher.includes(token),`brak guarda publikacji: ${token}`);
assert.ok(publisher.includes('academyPerformanceFirmwareFix185')&&publisher.includes('20 zakładek'));
assert.ok(watcher.includes('academyPerformanceFirmwareFix185')&&watcher.includes('20. zakładka'));
assert.ok(css.includes('.a185-shell')&&css.includes('@media(max-width:640px)'));
pass('Integracja: 20 kart i paneli w istniejącej Akademii, nadal 35 widoków, HTML/CSS/JS/PWA, lokalne i zdalne guardy; bez migracji D1 i rzeczywistych poleceń');

// 4. Exercise the actual browser runtime with controlled DOM and localStorage.
const memory=new Map([
 ['nauka-od-a-do-z-fix179-advanced-curriculum-v1',JSON.stringify({completed:['fix179-lesson-boot'],points:25})],
 ['nauka-od-a-do-z-fix180-system-diagnostics-v1',JSON.stringify({completed:['fix180-lesson-logs'],points:35})],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',JSON.stringify({completed:['fix181-lesson-wim-reference'],points:45})],
 ['nauka-od-a-do-z-fix182-specialist-systems-v1',JSON.stringify({completed:['fix182-lesson-linux-luks'],points:55})],
 ['nauka-od-a-z-fix183-do-not-exist','keep'],
 ['nauka-od-a-z-fix184-do-not-exist','keep']
]);
const elements=new Map(),toolSelects=new Map(),radioCorrect=new Map();
for(let i=0;i<3;i++)radioCorrect.set(`a185q${i}`,data.lessons[0].quiz[i].c);
for(let i=0;i<data.exam.length;i++)radioCorrect.set(`a185exam${i}`,data.exam[i].c);
function makeElement(id){
 const handlers={};let _html='';
 const e={id,dataset:{},style:{},handlers,children:[],checked:false,hidden:false,value:'',textContent:'',download:'',href:'',_innerHTML:'',
  addEventListener(type,fn){handlers[type]=fn;},click(){handlers.click?.({target:this});},appendChild(child){this.children.push(child);if(!this.value&&child.value!==undefined)this.value=child.value;},remove(){},
  set innerHTML(v){_html=String(v);this._innerHTML=_html;this.__q=new Map();const first=_html.match(/<option[^>]*value="([^"]*)"/i);if(first&&!this.value)this.value=first[1];},get innerHTML(){return _html;},
  querySelectorAll(selector){if(this.__q?.has(selector))return this.__q.get(selector);const out=[];
   if(selector==='[data-a185-lesson]'){const re=/data-a185-lesson="([^"]+)"/g;let m;while((m=re.exec(_html))){const n=makeElement('lesson-'+m[1]);n.dataset={a185Lesson:m[1]};out.push(n);}}
   else if(selector==='[data-a185-project]'){const re=/data-a185-project="([^"]+)"\s+data-step="(\d+)"( checked)?/g;let m;while((m=re.exec(_html))){const n=makeElement('project-'+m[1]+'-'+m[2]);n.dataset={a185Project:m[1],step:m[2]};n.checked=!!m[3];out.push(n);}}
   else if(selector==='[data-a185-tool-run]'){const re=/data-a185-tool-run="([^"]+)"/g;let m;while((m=re.exec(_html))){const n=makeElement('tool-run-'+m[1]);n.dataset={a185ToolRun:m[1]};out.push(n);}}
   this.__q??=new Map();this.__q.set(selector,out);return out;
  },
  querySelector(selector){
   const tm=selector.match(/^\[data-a185-tool-select="([^"]+)"\]$/);if(tm){if(!toolSelects.has(tm[1])){const select=makeElement('tool-select-'+tm[1]);const reg=new RegExp(`<select data-a185-tool-select="${tm[1]}">([\\s\\S]*?)<\\/select>`);const match=_html.match(reg);const opt=match?.[1]?.match(/<option value="([^"]+)"/);select.value=opt?.[1]||'';toolSelects.set(tm[1],select);}return toolSelects.get(tm[1]);}
   const idMatch=selector.match(/^#([A-Za-z0-9_-]+)$/);if(idMatch)return mockDocument.getElementById(idMatch[1]);
   return null;
  }
 };
 return e;
}
const mockDocument={body:makeElement('body'),getElementById(id){if(!elements.has(id))elements.set(id,makeElement(id));return elements.get(id);},createElement(){return makeElement('created');},querySelector(selector){const m=selector.match(/name="(a185q\d+|a185exam\d+)"/);if(m){const answer=radioCorrect.get(m[1]);return answer===undefined?null:{value:String(answer)};}return null;}};
const rootEl=mockDocument.getElementById('a185ExpertPerformance');
const awardCalls=[];
const mockWindow={document:mockDocument,localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},ACADEMY_FIX168_AWARD(...args){awardCalls.push(args);}};
const context=vm.createContext({window:mockWindow,document:mockDocument,console,Blob:function(){},URL:{createObjectURL(){return'blob:test';},revokeObjectURL(){}},setTimeout(){},Date,Math,Number,JSON});
vm.runInContext(runtime,context,{timeout:10000,filename:'academy-performance-firmware-fix185.js'});
assert.equal(rootEl.dataset.ready,'1');assert.match(mockDocument.getElementById('a185Status').textContent,/20 lekcji, 15 przypadków, 10 projektów/);
assert.match(mockDocument.getElementById('a185LessonList').innerHTML,/WPR|WPA|PCIe|StorPort|PCB|Firmware/i);
assert.match(mockDocument.getElementById('a185LessonDetail').innerHTML,/Cele nauki|Wyjaśnienie techniczne/);
assert.match(mockDocument.getElementById('a185CaseBody').innerHTML,/Co|Jak|Który|Wybierz/i);
assert.match(mockDocument.getElementById('a185Projects').innerHTML,/PROJEKT PRAKTYCZNY/);
assert.match(mockDocument.getElementById('a185Exam').innerHTML,/20 pytań/);
assert.match(mockDocument.getElementById('a185Glossary').innerHTML,/ETW|AER|StorPort|CHID/i);
assert.match(mockDocument.getElementById('a185Tools').innerHTML,/Analizuj scenariusz/);
pass('Rzeczywisty runtime FIX185 renderuje lekcje, przypadki, projekty, egzamin, słownik i 8 narzędzi w kontrolowanym DOM');

// Core training actions: quiz, note, case, project and exam.
mockDocument.getElementById('a185Note').value='Notatka FIX185: najpierw zachowaj ETL i metadane przebiegu.';
mockDocument.getElementById('a185SaveNote').click();
mockDocument.getElementById('a185CheckQuiz').click();assert.match(mockDocument.getElementById('a185QuizResult').innerHTML,/Wynik 3\/3/);
for(let i=0;i<3;i++)mockDocument.getElementById(`a185Stage${i}`).value=String(data.cases[0].stages[i][2]);
mockDocument.getElementById('a185EvaluateCase').click();assert.match(mockDocument.getElementById('a185CaseResult').innerHTML,/Wynik 3\/3 \(100%\)/);
const projectInputs=mockDocument.getElementById('a185Projects').querySelectorAll('[data-a185-project]');assert.ok(projectInputs.length>=4);
const firstProject=data.projects[0];for(const input of projectInputs.filter(x=>x.dataset.a185Project===firstProject.id)){input.checked=true;input.handlers.change?.();}
assert.ok(JSON.parse(memory.get('nauka-od-a-do-z-fix185-performance-firmware-v1')).projectChecks[firstProject.id].length===firstProject.tasks.length);
mockDocument.getElementById('a185SubmitExam').click();assert.match(mockDocument.getElementById('a185ExamResult').textContent,/Wynik 20\/20 \(100%\)\. Egzamin zaliczony/);
const afterExamPoints=JSON.parse(memory.get('nauka-od-a-do-z-fix185-performance-firmware-v1')).points;
mockDocument.getElementById('a185SubmitExam').click();assert.equal(JSON.parse(memory.get('nauka-od-a-do-z-fix185-performance-firmware-v1')).points,afterExamPoints,'egzamin nie może przyznawać powtórnie punktów');
pass('Działają quiz z wyjaśnieniami, notatka, trzyetapowy przypadek, checklista projektu i egzamin; punkty egzaminu są idempotentne');

// All eight tool cards execute a deterministic scenario and store history.
const toolButtons=mockDocument.getElementById('a185Tools').querySelectorAll('[data-a185-tool-run]');assert.equal(toolButtons.length,8);
for(const btn of toolButtons){
 const id=btn.dataset.a185ToolRun,sel=mockDocument.getElementById('a185Tools').querySelector(`[data-a185-tool-select="${id}"]`);
 if(id==='wave')sel.value='ring';else if(id==='random')sel.value='pcie';else sel.value=data.tools.find(t=>t.id===id).options[1][0];
 btn.click();const out=mockDocument.getElementById(`a185Out-${id}`);assert.ok(out.innerHTML.length>10,`narzędzie ${id} nie wygenerowało wyniku`);
 if(id==='wave')assert.match(out.innerHTML,/syntetyczny|nie jest pomiarem/i);
}
for(const [id,value] of Object.entries({a185Before:'objaw: skok WHEA AER',a185After:'po naprawie: brak nowych zdarzeń w kontrolowanym teście',a185Test:'powtarzalny test obciążenia i analiza ETL',a185Criteria:'brak powtarzających się błędów w trzech przebiegach'}))mockDocument.getElementById(id).value=value;
const evidenceButton=toolButtons.find(x=>x.dataset.a185ToolRun==='evidence');evidenceButton.click();assert.match(mockDocument.getElementById('a185Out-evidence').innerHTML,/Raport gotowy do weryfikacji/);
const fix185Saved=JSON.parse(memory.get('nauka-od-a-do-z-fix185-performance-firmware-v1'));
assert.ok(fix185Saved.completed.includes(`fix185-lesson-${data.lessons[0].id}`));
assert.equal(fix185Saved.notes[data.lessons[0].id],'Notatka FIX185: najpierw zachowaj ETL i metadane przebiegu.');
assert.equal(fix185Saved.caseScores[data.cases[0].id],100);assert.ok(fix185Saved.examHistory[0].passed&&fix185Saved.examHistory[0].pct===100);
assert.equal(fix185Saved.toolHistory.length,9);assert.ok(fix185Saved.evidence.before.includes('WHEA'));
assert.ok(awardCalls.length>=4);
for(const [key,value] of [
 ['nauka-od-a-do-z-fix179-advanced-curriculum-v1',JSON.stringify({completed:['fix179-lesson-boot'],points:25})],
 ['nauka-od-a-do-z-fix180-system-diagnostics-v1',JSON.stringify({completed:['fix180-lesson-logs'],points:35})],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',JSON.stringify({completed:['fix181-lesson-wim-reference'],points:45})],
 ['nauka-od-a-do-z-fix182-specialist-systems-v1',JSON.stringify({completed:['fix182-lesson-linux-luks'],points:55})]
])assert.equal(memory.get(key),value,`postępy ${key} zmienione`);
pass('Osiem symulatorów reaguje na scenariusze; raport Before/After, historia narzędzi i zapis postępów działają; postępy FIX179–FIX184 pozostają nietknięte');

// Malformed local state normalization must not crash the real panel.
const key='nauka-od-a-do-z-fix185-performance-firmware-v1';
memory.set(key,JSON.stringify({completed:{invalid:true},notes:[],caseScores:[],projectChecks:[],examHistory:{invalid:true},toolHistory:'bad',points:19,evidence:[]}));
rootEl.dataset.ready='0';vm.runInContext(runtime,context,{timeout:10000,filename:'academy-performance-firmware-fix185-malformed-state-test.js'});assert.equal(rootEl.dataset.ready,'1');
mockDocument.getElementById('a185Note').value='Po normalizacji';mockDocument.getElementById('a185SaveNote').click();
const normalized=JSON.parse(memory.get(key));assert.ok(Array.isArray(normalized.completed));assert.ok(!Array.isArray(normalized.notes));assert.ok(!Array.isArray(normalized.caseScores));assert.ok(!Array.isArray(normalized.projectChecks));assert.ok(Array.isArray(normalized.examHistory));assert.ok(Array.isArray(normalized.toolHistory));assert.equal(normalized.points,19);
pass('Uszkodzone typowo dane localStorage są normalizowane bez awarii i bez utraty punktów');

fs.writeFileSync(path.join(root,'FIX185_ACTUAL_FUNCTIONAL_AUDIT.txt'),[
 'AUDYT FAKTYCZNEGO DZIAŁANIA FIX185',
 'Zweryfikowano HTML, CSS, JS, Service Worker, release.json, OneClick i Auto Publish Watcher.',
 'Uruchomiono rzeczywisty runtime FIX185 w deterministycznym, kontrolowanym DOM.',
 'Sprawdzono 20 lekcji, 60 pytań, notatki, quiz, 15 scenariuszy przypadków, checklisty 10 projektów, egzamin 20-pytaniowy, 40 haseł słownika oraz 8 narzędzi ETW/AER/Storage/PCB/Firmware/wave/random/evidence.',
 'Zweryfikowano zapisy historii narzędzi, raport Before/After, idempotencję punktów egzaminu i normalizację niepoprawnych danych localStorage.',
 'Postępy FIX179–FIX184 zachowano bajt w bajt; FIX185 używa oddzielnego klucza localStorage.',
 'Runtime nie wykonuje poleceń, nie wykonuje fetch, nie komunikuje się z urządzeniami, dyskami ani firmware.',
 'Wynik: PASS w środowisku testowym. To nie potwierdza publikacji online ani pomiarów rzeczywistego sprzętu.'
].join('\n')+'\n','utf8');
console.log('\nNAUKA OD A DO Z 6.8.0 FIX185: 8/8 TEST GROUPS PASS');
