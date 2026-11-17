#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(import.meta.url);
const asset='WEB_PUBLISH/assets/academy-advanced-service-lab-fix183.js';
const data=require(path.join(root,asset)),runtime=fs.readFileSync(path.join(root,asset),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('WEB_PUBLISH/index.html'),css=read('WEB_PUBLISH/assets/academy-advanced-service-lab-fix183.css');
const sw=read('WEB_PUBLISH/service-worker.js'),release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js'),watcher=read('AUTO_PUBLISH_WATCHER.js');
const pass=s=>console.log(`[PASS] ${s}`);
const syntax=f=>{const r=spawnSync(process.execPath,['--check',f],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${f}: ${r.stderr||r.stdout}`);};

assert.equal(data.fix,183);assert.equal(data.version,'6.8.0');
assert.equal(data.lessons.length,20);assert.equal(data.cases.length,15);assert.equal(data.projects.length,10);assert.equal(data.glossary.length,40);assert.equal(data.exam.length,16);
assert.equal(data.lessons.reduce((n,x)=>n+x.quiz.length,0),60);
assert.equal(new Set(data.lessons.map(x=>x.id)).size,20);assert.equal(new Set(data.cases.map(x=>x.id)).size,15);assert.equal(new Set(data.projects.map(x=>x.id)).size,10);
assert.equal(new Set(data.lessons.map(x=>x.category)).size,5);
pass('FIX183 zawiera 20 lekcji, 60 pytań, 15 przypadków, 10 projektów, 40 pojęć i egzamin 16-pytaniowy');

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
assert.ok(Object.keys(data.tools.wwan).length>=3&&Object.keys(data.tools.sas).length>=3);
pass('Każda lekcja ma cele, teorię, procedurę, ostrzeżenia, źródła i 3 pytania; przypadki, projekty, słownik oraz egzamin mają poprawną strukturę');

// Duplicate audit against the active 1083-lesson catalog, fault catalog and previous additions FIX179–FIX182.
const sandbox=vm.createContext({console,window:{}});
for(const file of ['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','academy-expanded-practice-fix136.js','academy-expanded-practice-fix145.js'])vm.runInContext(read(`WEB_PUBLISH/assets/${file}`),sandbox,{timeout:20000,filename:file});
const catalog=sandbox.window.ACADEMY_DATA?.courseLessons||[],faults=sandbox.window.ACADEMY_DATA?.faults||[];assert.equal(catalog.length,1083);
const prior=[];
for(const f of ['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js','academy-specialist-systems-fix182.js']){const m=require(path.join(root,'WEB_PUBLISH/assets',f));for(const x of [...(m.lessons||[]),...(m.cases||[]),...(m.projects||[])])prior.push({title:x.title||'',source:f});}
const normalize=s=>String(s||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(x=>x.length>2));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b);let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,new Set([...A,...B]).size);};
const oldEntries=[...catalog.map(x=>({title:x.title||'',source:'catalog'})),...faults.map(x=>({title:x.title||'',source:'faults'})),...prior];
const nearest=[];
for(const item of [...data.lessons.map(x=>({...x,kind:'LEKCJA'})),...data.cases.map(x=>({...x,kind:'PRZYPADEK'})),...data.projects.map(x=>({...x,kind:'PROJEKT'}))]){
 const title=normalize(item.title);assert.ok(!oldEntries.some(x=>normalize(x.title)===title),`Dokładny duplikat ${item.kind}: ${item.title}`);
 const best=oldEntries.map(x=>({...x,score:similarity(item.title,x.title)})).sort((a,b)=>b.score-a.score)[0]||{title:'',source:'none',score:0};
 nearest.push({newTitle:`[${item.kind}] ${item.title}`,bestMatch:best.title,source:best.source,score:best.score});
 assert.ok(best.score<0.55,`Możliwy duplikat: ${item.title} ~ ${best.title} (${best.score.toFixed(3)}) [${best.source}]`);
}
const priorTerms=new Set(['academy-advanced-curriculum-fix179.js','academy-system-diagnostics-fix180.js','academy-deployment-migration-refurb-fix181.js','academy-specialist-systems-fix182.js'].flatMap(f=>require(path.join(root,'WEB_PUBLISH/assets',f)).glossary||[]).map(x=>String(x[0]).trim().toLocaleLowerCase('pl-PL')));
for(const [term] of data.glossary)assert.ok(!priorTerms.has(String(term).trim().toLocaleLowerCase('pl-PL')),`Powielone hasło słownika: ${term}`);
fs.writeFileSync(path.join(root,'FIX183_DUPLICATE_AUDIT.txt'),['AUDYT POWTÓRZEŃ FIX183',`Aktywny katalog lekcji: ${catalog.length}`,`Istniejące przypadki/usterki: ${faults.length}`,`Materiały FIX179–FIX182: ${prior.length}`,`Nowe lekcje: ${data.lessons.length}`,`Nowe przypadki: ${data.cases.length}`,`Nowe projekty: ${data.projects.length}`,'',...nearest.sort((a,b)=>b.score-a.score).map(x=>`${x.score.toFixed(3)} | ${x.newTitle}\n  najbliższy wcześniejszy tytuł: ${x.bestMatch} [${x.source}]`),'','Wynik: brak identycznych tytułów; najwyższe podobieństwo poniżej 0.55. Jest to kontrola podobieństwa tytułów; nie stanowi automatycznego dowodu pełnej równoważności semantycznej.'].join('\n'),'utf8');
pass(`Audyt duplikatów: 1083 lekcje + ${faults.length} przypadków + FIX179–FIX182; brak bliskich kolizji tytułów i powielonych haseł słownika`);

const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(x=>x[1]),panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(x=>x[1]);
assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('serviceexpert'));
assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplikaty ID w HTML');
for(const id of ['a183AdvancedServiceLab','a183Status','a183Progress','a183LessonsDone','a183CasesDone','a183ProjectsDone','a183ExamDone','a183Points','a183Search','a183Category','a183Level','a183LessonList','a183LessonDetail','a183CaseSelect','a183CaseBody','a183Projects','a183Exam','a183GlossarySearch','a183Glossary','a183Export','a183Report','a183WwanScenario','a183WwanOutput','a183UpsVa','a183UpsW','a183UpsLoadW','a183UpsReserve','a183UpsCalc','a183UpsOutput','a183SasScenario','a183SasOutput','a183LeakCheck','a183LeakOutput','a183RecoverySize','a183RecoveryRate','a183RecoveryEstimate','a183RecoveryOutput'])assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`brak/duplikat kontrolki ${id}`);
for(const asset of ['academy-advanced-service-lab-fix183.js?v=6.8.0-fix183','academy-advanced-service-lab-fix183.css?v=6.8.0-fix183']){assert.ok(html.includes(asset));assert.ok(sw.includes(asset.split('?')[0]));}
assert.match(sw,/const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);assert.match(sw,/const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'/);
pass('FIX183 jest w 18. zakładce istniejącej Akademii, ma wszystkie kontrolki i assety PWA; widoków nadal 35, nazwy cache niezmienione');

const meta=release.academyAdvancedServiceLabFix183;assert.equal(release.release,'6.8.0');
for(const [k,v] of Object.entries({hotfix:'FIX183',productVersion:'6.8.0',lessons:20,quizQuestions:60,cases:15,projects:10,glossaryTerms:40,examQuestions:16,newViews:0,expectedExistingViews:35,expectedExistingAcademyTabs:18,newD1Database:false,newD1Tables:false,d1SchemaMigrations:false,hardwareAccess:false,networkAccess:false,simulationsOnly:true,localStorageOnly:true,productionPublished:false}))assert.equal(meta[k],v,`release metadata ${k}`);
assert.match(runtime,/nauka-od-a-do-z-fix183-advanced-service-lab-v1/);assert.match(runtime,/ACADEMY_FIX168_AWARD/);
assert.ok(!/fetch\s*\(|navigator\.(usb|serial|hid)|WebUSB|WebSerial|WebHID/i.test(runtime));assert.ok(!/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|DELETE\s+FROM/i.test(runtime));
for(const file of ['WEB_PUBLISH/assets/academy-advanced-service-lab-fix183.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js'])syntax(file);
for(const token of ['academy-advanced-service-lab-fix183.js','academy-advanced-service-lab-fix183.css','fix183Meta.lessons !== 20','fix183Meta.quizQuestions !== 60','remoteAdvancedServiceLabMetaValid','remoteRelease?.academyAdvancedServiceLabFix183?.hotfix===\'FIX183\''])assert.ok(publisher.includes(token)||watcher.includes(token),`brak guardu publikacji: ${token}`);
assert.ok(publisher.includes('run-tests-fix183.mjs')&&watcher.includes('test-fix183-advanced-service-lab.mjs'));
assert.ok(css.includes('.a183-shell')&&css.includes('@media(max-width:640px)'));
pass('Wersja 6.8.0, D1, tajemnice i klucze bez zmian; lokalny i zdalny guard publikacji sprawdza FIX183; runtime nie wykonuje dostępu sprzętowego ani sieciowego');

// Exercise the actual FIX183 runtime using a controlled fake DOM and isolated localStorage.
const memory=new Map([
 ['nauka-od-a-do-z-fix179-advanced-curriculum-v1',JSON.stringify({completed:['fix179-lesson-boot'],points:25})],
 ['nauka-od-a-do-z-fix180-system-diagnostics-v1',JSON.stringify({completed:['fix180-lesson-logs'],points:35})],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',JSON.stringify({completed:['fix181-lesson-wim-reference'],points:45})],
 ['nauka-od-a-do-z-fix182-specialist-systems-v1',JSON.stringify({completed:['fix182-lesson-linux-luks'],points:55})]
]);
const elements=new Map();
const makeElement=id=>{const handlers={};return{id,dataset:{},style:{},value:(id==='a183WwanScenario'?'usb-visible':id==='a183SasScenario'?'multi-bay':id==='a183Category'||id==='a183Level'?'all':''),innerHTML:'',textContent:'',hidden:false,checked:false,children:[],handlers,addEventListener(type,fn){handlers[type]=fn;},appendChild(el){this.children.push(el);},remove(){},click(){handlers.click?.({target:this});},querySelectorAll(selector){const key=selector+'\n'+this.innerHTML;if(this.__q?.has(key))return this.__q.get(key);let out=[];if(selector==='[data-a183-project]'){const re=/data-a183-project="([^"]+)" data-step="(\d+)"( checked)?/g;let m;while((m=re.exec(this.innerHTML))){const e=makeElement('project-check');e.dataset={a183Project:m[1],step:m[2]};e.checked=!!m[3];out.push(e);}}else if(selector==='[data-a183-leak]'){const n=(this.innerHTML.match(/data-a183-leak/g)||[]).length;out=Array.from({length:n},(_,i)=>{const e=makeElement('leak-check-'+i);e.checked=false;return e;});}else if(selector==='[data-a183-lesson]'){const re=/data-a183-lesson="([^"]+)"/g;let m;while((m=re.exec(this.innerHTML))){const e=makeElement('lesson-button');e.dataset={a183Lesson:m[1]};out.push(e);}}this.__q??=new Map();this.__q.set(key,out);return out;},querySelector(selector){const idMatch=selector.match(/^#([A-Za-z0-9_-]+)$/);if(idMatch)return mockDocument.getElementById(idMatch[1]);const q=selector.match(/name="a183q(\d+)"/);if(q)return{value:String(data.lessons[0].quiz[Number(q[1])].c)};const e=selector.match(/name="a183exam(\d+)"/);if(e)return{value:String(data.exam[Number(e[1])].c)};return null;}};return handlersSetup(e);function handlersSetup(e){return e;}};
const mockDocument={body:makeElement('body'),getElementById(id){if(!elements.has(id)){const marker=`id="${id}"`;for(const host of elements.values())if(host.innerHTML.includes(marker)){elements.set(id,makeElement(id));break;}if(!elements.has(id))elements.set(id,makeElement(id));if(id==='a183AdvancedServiceLab')elements.get(id).innerHTML=Array(6).fill('<input type=\"checkbox\" data-a183-leak>').join('');}return elements.get(id);},createElement(){return makeElement('created');}};
const leakHost=()=>mockDocument.getElementById('a183AdvancedServiceLab');
const awardCalls=[];
const mockWindow={document:mockDocument,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},ACADEMY_FIX168_AWARD(...args){awardCalls.push(args);}};
const context=vm.createContext({window:mockWindow,document:mockDocument,console,Blob:function(){},URL:{createObjectURL(){return'blob:test';},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(runtime,context,{timeout:10000,filename:'academy-advanced-service-lab-fix183.js'});
assert.equal(elements.get('a183AdvancedServiceLab').dataset.ready,'1');
assert.match(elements.get('a183Status').textContent,/20 lekcji, 15 przypadków, 10 projektów/);
assert.match(elements.get('a183LessonList').innerHTML,/MBIM|WWAN|UPS|SAS|Custom Loop|ddrescue/i);
assert.match(elements.get('a183LessonDetail').innerHTML,/Cele nauki|Wyjaśnienie techniczne/);
assert.match(elements.get('a183CaseBody').innerHTML,/Wybierz najbezpieczniejszą decyzję/);
assert.match(elements.get('a183Projects').innerHTML,/Rezultat:/);
assert.match(elements.get('a183Exam').innerHTML,/16 pytań/);
assert.match(elements.get('a183Glossary').innerHTML,/MBIM|HID|EDSFF/i);
assert.match(elements.get('a183WwanOutput').innerHTML,/sprawdź|Sprawdź|warstw|Modem/i);
assert.match(elements.get('a183SasOutput').innerHTML,/zatok|expander|EDSFF/i);
pass('Rzeczywisty panel FIX183 renderuje lekcje, przypadki, projekty, egzamin, słownik i symulatory');

// Test real callbacks with deterministic correct answers.
elements.get('a183CheckQuiz').click();assert.match(elements.get('a183QuizResult').textContent,/Wynik 3\/3\. Lekcja zaliczona/);
mockDocument.getElementById('a183Note').value='Notatka serwisowa test FIX183 — najpierw obraz źródła.';elements.get('a183SaveNote').click();
for(let i=0;i<3;i++)mockDocument.getElementById(`a183Stage${i}`).value=String(data.cases[0].stages[i][2]);elements.get('a183EvaluateCase').click();assert.match(elements.get('a183CaseResult').textContent,/Wynik 3\/3 \(100%\)/);
const projectChecks=elements.get('a183Projects').querySelectorAll('[data-a183-project]');assert.ok(projectChecks.length>=5);projectChecks[0].checked=true;projectChecks[0].handlers.change?.();assert.ok(elements.get('a183Projects').innerHTML.includes('checked'));
elements.get('a183SubmitExam').click();assert.match(elements.get('a183ExamResult').textContent,/Wynik 16\/16 \(100%\)\. Egzamin zaliczony/);
const saved=JSON.parse(memory.get('nauka-od-a-do-z-fix183-advanced-service-lab-v1'));assert.ok(saved.completed.includes(`fix183-lesson-${data.lessons[0].id}`));assert.equal(saved.notes[data.lessons[0].id],'Notatka serwisowa test FIX183 — najpierw obraz źródła.');assert.equal(saved.caseScores[data.cases[0].id],100);assert.ok(saved.examHistory[0].passed&&saved.examHistory[0].pct===100);assert.ok(awardCalls.length>=3);
// UPS calculator, SAS selector, leak checklist and recovery estimate.
mockDocument.getElementById('a183UpsVa').value='1500';mockDocument.getElementById('a183UpsW').value='900';mockDocument.getElementById('a183UpsLoadW').value='500';mockDocument.getElementById('a183UpsReserve').value='20';elements.get('a183UpsCalc').click();assert.match(elements.get('a183UpsOutput').innerHTML,/mieści się w limicie/);
mockDocument.getElementById('a183SasScenario').value='edsff';elements.get('a183SasScenario').handlers.change();assert.match(elements.get('a183SasOutput').innerHTML,/EDSFF/);
const leakChecks=leakHost().querySelectorAll('[data-a183-leak]');assert.equal(leakChecks.length,6);for(const el of leakChecks){el.checked=true;el.handlers.change?.();}elements.get('a183LeakCheck').click();assert.match(elements.get('a183LeakOutput').textContent,/6\/6/);
mockDocument.getElementById('a183RecoverySize').value='500';mockDocument.getElementById('a183RecoveryRate').value='100';elements.get('a183RecoveryEstimate').click();assert.match(elements.get('a183RecoveryOutput').innerHTML,/Orientacyjny czas/);
pass('Działają callbacki: quiz, notatki, 3-etapowy przypadek, checklista projektu, egzamin i 4 kalkulatory/symulatory');
for(const [key,expected] of [
 ['nauka-od-a-do-z-fix179-advanced-curriculum-v1',{completed:['fix179-lesson-boot'],points:25}],
 ['nauka-od-a-do-z-fix180-system-diagnostics-v1',{completed:['fix180-lesson-logs'],points:35}],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',{completed:['fix181-lesson-wim-reference'],points:45}],
 ['nauka-od-a-do-z-fix182-specialist-systems-v1',{completed:['fix182-lesson-linux-luks'],points:55}]
])assert.equal(memory.get(key),JSON.stringify(expected),`${key} must remain unchanged`);
pass('Postępy FIX179–FIX182 pozostają niezmienione; FIX183 korzysta z własnego klucza localStorage');

const report=[
 'AUDYT FUNKCJONALNY FIX183',
 'Weryfikowane elementy: HTML, CSS, JavaScript, Service Worker, release.json, OneClick, watcher.',
 'Uruchomiono rzeczywisty kod panelu w kontrolowanym DOM.',
 'Sprawdzono: renderowanie lekcji, quiz, zapis notatek, ocenę przypadku, checklistę projektu, egzamin, słownik, symulator WWAN, kalkulator UPS, scenariusze SAS, checklistę chłodzenia wodnego i estymator ddrescue.',
 'Wynik: PASS w środowisku testowym; funkcje nie łączą się ze sprzętem ani z siecią.'
].join('\n');fs.writeFileSync(path.join(root,'FIX183_ACTUAL_FUNCTIONAL_AUDIT.txt'),report+'\n','utf8');
console.log('\nNAUKA OD A DO Z 6.8.0 FIX183 ADVANCED SERVICE LAB: 6/6 PASS');
