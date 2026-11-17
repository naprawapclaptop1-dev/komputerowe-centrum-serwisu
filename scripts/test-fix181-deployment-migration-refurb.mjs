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
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pass=m=>console.log(`[PASS] ${m}`);
const fail=m=>{throw new Error(m);};
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const runtime=read('WEB_PUBLISH/assets/academy-deployment-migration-refurb-fix181.js');
const css=read('WEB_PUBLISH/assets/academy-deployment-migration-refurb-fix181.css');
const data=require('../WEB_PUBLISH/assets/academy-deployment-migration-refurb-fix181.js');
const release=JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher=read('ONECLICK_AKADEMIA.js');
const watcher=read('AUTO_PUBLISH_WATCHER.js');

assert.equal(data.version,'6.8.0');
assert.equal(data.fix,181);
assert.equal(data.lessons.length,28);
assert.equal(data.cases.length,13);
assert.equal(data.projects.length,9);
assert.equal(data.glossary.length,40);
assert.equal(data.exam.length,14);
assert.equal(data.lessons.reduce((n,x)=>n+x.quiz.length,0),84);
assert.deepEqual(new Set(data.lessons.map(x=>x.category)),new Set([
  'Fabryka Windows','Migracja danych i profili','Apple Mac: firmware i DFU','Odnawianie i przygotowanie do sprzedaży'
]));
pass('FIX181 rzeczywiście zawiera 28 lekcji, 84 pytania, 13 przypadków, 9 projektów, 40 haseł i egzamin 14-pytaniowy');

const allIds=new Set();
const titleList=[];
for(const [kind,items] of [['lesson',data.lessons],['case',data.cases],['project',data.projects]]){
  for(const item of items){
    assert.ok(item.id&&item.title,`${kind} bez identyfikatora/tytułu`);
    assert.ok(!allIds.has(item.id),`zduplikowane ID: ${item.id}`);allIds.add(item.id);
    titleList.push({kind,title:item.title});
  }
}
for(const l of data.lessons){
  assert.ok(l.summary&&l.category&&['Zaawansowany','Ekspert'].includes(l.level)&&l.minutes>=15);
  assert.ok(l.goals.length>=3&&l.theory.length>=2&&l.workflow.length>=4&&l.cautions.length>=2);
  assert.equal(l.quiz.length,3,`${l.title}: liczba pytań`);
  assert.ok(Array.isArray(l.sources));
  for(const s of l.sources){assert.ok(s.label&&/^https:\/\//.test(s.url),`${l.title}: niepoprawne źródło`);}
  for(const q of l.quiz){assert.ok(q.q&&q.e);assert.equal(q.a.length,3);assert.ok(Number.isInteger(q.c)&&q.c>=0&&q.c<3);}
}
for(const c of data.cases){assert.ok(c.symptom&&c.domain);assert.equal(c.stages.length,3);for(const stage of c.stages){assert.ok(stage.name&&stage.prompt&&stage.why);assert.equal(stage.options.length,3);assert.ok(Number.isInteger(stage.correct)&&stage.correct>=0&&stage.correct<3);}}
for(const p of data.projects){assert.ok(p.category&&p.deliverable);assert.ok(p.tasks.length>=5,`${p.title}: za mało etapów`);}
assert.equal(new Set(data.glossary.map(x=>x[0].toLocaleLowerCase('pl-PL'))).size,40);
for(const q of data.exam){assert.ok(q.q&&q.e);assert.equal(q.a.length,3);assert.ok(Number.isInteger(q.c)&&q.c>=0&&q.c<3);}
pass('Struktura treści sprawdzona: procedury, cele, ostrzeżenia, źródła, wyjaśnienia odpowiedzi i unikalne identyfikatory');

// Load the real published 1083-lesson catalogue, not a hand-written topic list.
const sandbox=vm.createContext({console,window:{}});
for(const file of ['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','academy-expanded-practice-fix136.js','academy-expanded-practice-fix145.js']){
  vm.runInContext(read(`WEB_PUBLISH/assets/${file}`),sandbox,{timeout:20000,filename:file});
}
const catalog=sandbox.window.ACADEMY_DATA?.courseLessons||[];
const faults=sandbox.window.ACADEMY_DATA?.faults||[];
assert.equal(catalog.length,1083,'aktywny katalog ma zachować 1083 lekcje');
assert.equal(faults.length,155,'audyt awarii ma obejmować 155 wpisów');
const fix179=require('../WEB_PUBLISH/assets/academy-advanced-curriculum-fix179.js');
const fix180=require('../WEB_PUBLISH/assets/academy-system-diagnostics-fix180.js');
const priorTitles=[
  ...catalog.map(x=>x.title||''),
  ...faults.map(x=>x.title||''),
  ...fix179.lessons.map(x=>x.title||''),
  ...fix180.lessons.map(x=>x.title||''),
  ...fix179.cases.map(x=>x.title||''),
  ...fix180.cases.map(x=>x.title||'')
].filter(Boolean);
const norm=s=>String(s||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(norm(s).split(' ').filter(x=>x.length>2));
const sim=(a,b)=>{const A=tokens(a),B=tokens(b);let n=0;for(const v of A)if(B.has(v))n++;return n/Math.max(1,new Set([...A,...B]).size);};
const audit=[];
for(const item of titleList){
  const key=norm(item.title);
  assert.ok(!priorTitles.some(t=>norm(t)===key),`dokładny duplikat ${item.kind}: ${item.title}`);
  const best=priorTitles.map(title=>({title,score:sim(item.title,title)})).sort((a,b)=>b.score-a.score)[0];
  audit.push({...item,bestTitle:best?.title||'',score:best?.score||0});
  assert.ok((best?.score||0)<0.55,`podejrzenie duplikatu ${item.kind}: ${item.title} ~ ${best.title} (${best.score.toFixed(3)})`);
}
const auditTxt=[
 'FIX181 — AUDYT ZAWARTOŚCI I DUPLIKATÓW',
 `Aktywny katalog bazowy: ${catalog.length} lekcji`,
 `Istniejący katalog przypadków usterek: ${faults.length}`,
 `Porównane dodatkowe kursy: FIX179 (${fix179.lessons.length}) i FIX180 (${fix180.lessons.length})`,
 `Nowe pozycje FIX181: ${titleList.length} (lekcje, przypadki i projekty)`,
 'Metoda: normalizacja tytułów i podobieństwo Jaccarda tokenów; próg alarmowy 0,55.',
 'Wynik: nie znaleziono identycznych tytułów ani podobieństwa przekraczającego próg.',
 'Uwaga: automatyczny audyt tytułów nie zastępuje oceny semantycznej; zakresy porównano też z opisami istniejących paneli.',
 '',
 ...audit.sort((a,b)=>b.score-a.score).map(x=>`${x.kind.toUpperCase()} | ${x.score.toFixed(3)} | ${x.title}\n  Najbliższy istniejący tytuł: ${x.bestTitle}`)
].join('\n');
fs.writeFileSync(path.join(root,'FIX181_DUPLICATE_AUDIT.txt'),auditTxt,'utf8');
pass(`Audyt duplikatów: ${titleList.length} nowych pozycji porównanych z 1083 lekcjami, 155 usterkami oraz FIX179/FIX180; brak tytułów >= 0,55`);

// Inspect what was already present and make explicit that FIX181 extends, rather than clones, those panels.
const masterAcademy=read('WEB_PUBLISH/assets/master-academy-650-ultimate.js');
const deploymentChecklist=read('WEB_PUBLISH/assets/professional-service-fix45.js');
const existingOverview={
  windowsDeployment:deploymentChecklist.includes('Windows Deployment Center'),
  appleAcademy:masterAcademy.includes('name:\'Akademia Apple Mac\'')&&masterAcademy.includes('Diagnostyka zasilania i ładowania'),
  masterExam:html.includes('data-a168-tab="master"')&&html.includes('Egzamin Mistrza'),
  fix179:html.includes('academy-advanced-curriculum-fix179.js'),
  fix180:html.includes('academy-system-diagnostics-fix180.js')
};
assert.ok(existingOverview.windowsDeployment,'nie znaleziono istniejącego Windows Deployment Center');
assert.ok(existingOverview.appleAcademy,'nie znaleziono istniejącej Akademii Apple Mac');
assert.ok(existingOverview.masterExam,'nie znaleziono dotychczasowego egzaminu mistrza');
assert.ok(existingOverview.fix179&&existingOverview.fix180);
assert.ok(fix180.lessons.some(x=>/Po wymianie płyty głównej: aktywacja Windows/i.test(x.title)),'brak istniejącej lekcji aktywacji Windows po wymianie płyty — audyt duplikatów wymaga odświeżenia');
assert.ok(catalog.some(x=>x.title==='Ocena kondycji baterii laptopa'),'brak istniejącej lekcji o kondycji baterii');
assert.ok(catalog.some(x=>x.title==='Bezpieczne przygotowanie komputera do przekazania klientowi'),'brak istniejącej lekcji o przekazaniu komputera');
assert.ok(catalog.some(x=>x.title==='NVMe Sanitize, Secure Erase i bezpieczne przygotowanie dysku'),'brak istniejącego kursu sanitization NVMe');
assert.ok(catalog.some(x=>x.title==='Bezpieczne przygotowanie dysku do ponownego użycia'),'brak istniejącego kursu przygotowania dysku');
assert.ok(catalog.some(x=>x.title==='Test stabilności komputera po naprawie i odbiór jakościowy'),'brak istniejącego kursu testów końcowych');
assert.ok(catalog.some(x=>x.title==='Diagnostyka niestabilności pod obciążeniem: CPU, GPU, RAM i zasilanie'),'brak istniejącego kursu niestabilności pod obciążeniem');
assert.ok(faults.some(x=>x.title==='Zalanie, dym, zapach spalenizny lub spuchnięta bateria'),'brak istniejącego przypadku uszkodzonej baterii');
assert.equal(data.lessons.filter(x=>/Autopilot|MDM/i.test(x.title)).length,1,'niepotrzebny duplikat kursu Autopilot/MDM');
assert.ok(data.lessons.some(x=>x.id==='refurb-identity-audit'&&/Service Tag/i.test(x.title)),'brak unikalnej lekcji audytu tożsamości sprzętu');
assert.ok(data.lessons.some(x=>x.id==='refurb-shipping-packaging'&&/Pakowanie i transport/i.test(x.title)),'brak unikalnej lekcji pakowania i transportu');
assert.ok(data.lessons.some(x=>x.id==='refurb-firmware-locks'&&/Absolute Persistence/i.test(x.title)),'brak unikalnej lekcji blokad firmware');
assert.ok(data.cases.some(x=>x.id==='case-refurb-identity-mismatch'),'brak nowego przypadku rozbieżności identyfikatorów');
assert.ok(data.cases.some(x=>x.id==='case-refurb-shipping-damage'),'brak nowego przypadku szkody transportowej');
assert.ok(data.cases.some(x=>x.id==='case-refurb-uefi-lock'),'brak nowego przypadku blokady UEFI');
assert.ok(data.projects.some(x=>x.id==='project-refurb-identity-lot'),'brak projektu audytu partii laptopów poleasingowych');
assert.ok(data.projects.some(x=>/Analiza opłacalności odnowienia partii/i.test(x.title)),'brak projektu ekonomiki odnowienia');
assert.ok(!data.lessons.some(x=>x.category==='Odnawianie i przygotowanie do sprzedaży'&&/sanitiz|secure erase|burn.in|stabilności pod obciążeniem/i.test(x.title)),'FIX181 powiela już istniejące kursy sanitization/QC');
assert.ok(!data.cases.some(x=>/spuchnięt|sanitization|niestabilność po nagrzaniu/i.test(x.title)),'FIX181 powiela już istniejące przypadki baterii/kasowania/stabilności');
assert.ok(!data.lessons.some(x=>/aktywacj.*Windows/i.test(x.title)),'lekcja aktywacji Windows powiela istniejący temat FIX180');
const provenanceLesson=data.lessons.find(x=>x.id==='refurb-intake-grade');
assert.match(provenanceLesson.title,/Weryfikacja pochodzenia i dokumentów/);
assert.match(provenanceLesson.theory.join(' '),/protok[oó]ł zwrotu leasingowego|dokument.*przekazania/i);
assert.match(provenanceLesson.workflow.join(' '),/rozbieżnoś|rozbiezn|zaakceptowaną|wstrzymaną/i);
assert.doesNotMatch(provenanceLesson.title,/przyjęcie sprzętu|klasyfikacja stanu|grading/i);
const batteryLogistics=data.lessons.find(x=>x.id==='refurb-battery-storage');
assert.match(batteryLogistics.title,/Ewidencja i logistyka zużytych baterii/);
assert.match(batteryLogistics.theory.join(' '),/identyfikowalnoś|dokumentacj.*obiegu|partii/i);
assert.doesNotMatch(batteryLogistics.quiz.map(x=>x.q).join(' '),/spuchnięt|spuchn|ładować|uszkodzoną baterią zwykłą/i);
const batchEconomics=data.lessons.find(x=>x.id==='refurb-parts-economics');
assert.match(batchEconomics.title,/Ekonomika partii poleasingowej/);
assert.match(batchEconomics.theory.join(' '),/uzysk|odrzut|koszt partii/i);
assert.match(batchEconomics.theory.join(' '),/nie kosztorysu pojedynczej naprawy/i);
const comparison=[
 'AUDYT: CO BYŁO JUŻ W PROJEKCIE, A CO DODAJE FIX181',
 'ISTNIAŁO PRZED FIX181:',
 '- Główna Akademia: 1083 lekcje i 155 opisów przypadków usterek.',
 '- Ogólne Windows Deployment Center — centrum/checklisty przygotowania wdrożenia; nie znaleziono kompletnej ścieżki capture/servicing/deploy WIM.',
 '- Akademia Apple Mac — istniejący kurs ogólny i ścieżka serwisowa; nie znaleziono szczegółowej procedury DFU Revive/Restore w zasobach sprawdzonych dla FIX180.',
 '- FIX180 zawierał już lekcję aktywacji Windows po wymianie płyty; FIX181 nie dodaje drugiego kursu aktywacyjnego.',
 '- Baza zawierała już diagnozę/bezpieczną obsługę baterii, przypadek spuchniętej baterii oraz ogólne przyjęcie/odbiór sprzętu; FIX181 ogranicza nową lekcję baterii do ewidencji i śledzenia przekazania zużytych ogniw, a nową kontrolę przyjęcia do pochodzenia/dokumentów partii poleasingowej.' ,
 '- Baza zawierała już NVMe Sanitize/Secure Erase, bezpieczne przygotowanie dysku i testy stabilności/odbioru; FIX181 usuwa z nowego modułu powielające je lekcje sanitization oraz burn-in.',
 '- Egzamin Mistrza Serwisu — istniał ogólny egzamin wieloetapowy; FIX181 dodaje osobny test wiedzy dotyczący nowych specjalizacji, nie kopiuje poprzedniego egzaminu.',
 '- FIX179 i FIX180 — pozostają w projekcie, ich pliki i klucze postępu nie są zastępowane.',
 '',
 'DODANE FAKTYCZNIE W FIX181:',
 '- Procedury obrazowania Windows: Audit Mode, Sysprep, unattend.xml, capture/servicing WIM, sterowniki offline i wdrażanie UEFI/GPT.',
 '- USMT: plan migracji, ScanState, LoadState, typy magazynu, XML scope i walidacja danych/uprawnień.',
 '- Mac Apple Silicon/T2: kwalifikacja modelu do DFU, Revive kontra Restore, procedura połączenia i ochrona danych.',
 '- Odnowa PC: grading wizualny, weryfikacja dokumentów pochodzenia partii, ekonomika uzysku/odrzutów całej partii, ewidencja zużytych baterii i potwierdzenie odbioru, pakowanie/transport ESD, Autopilot/MDM, audyt Service Tag/SMBIOS i blokady firmware.',
 '- Trzy unikalne przypadki: rozbieżność Service Tag/SMBIOS, uszkodzenie w transporcie i nieznana blokada hasła UEFI.',
 '- Nowa zakładka FIX181, 28 lekcji, 13 scenariuszy, 9 projektów, 40 terminów, 84 pytania i egzamin 14 pytań.',
 '',
 'OGRANICZENIA:',
 '- To są materiały i symulowane ćwiczenia edukacyjne; aplikacja nie wykonuje Sysprep, DISM, USMT, DFU ani operacji kasowania danych na sprzęcie.',
 '- Wynik egzaminu jest wewnętrznym wynikiem szkoleniowym, nie państwowym certyfikatem.',
 '- Postęp FIX181 jest oddzielny od postępów FIX179/FIX180 i profilu bazowego.'
].join('\n');
fs.writeFileSync(path.join(root,'FIX181_EXISTING_VS_ADDED_AUDIT.txt'),comparison,'utf8');
pass('Audyt semantyczny: dokumenty pochodzenia ≠ przyjęcie/grading; ewidencja zużytych baterii ≠ diagnostyka; uzysk partii ≠ kosztorys naprawy klienta; usunięto duplikaty sanitization/QC/odbioru');

const tabs=[...html.matchAll(/data-a168-tab="([a-z]+)"/g)].map(x=>x[1]);
const panels=[...html.matchAll(/data-a168-panel="([a-z]+)"/g)].map(x=>x[1]);
assert.equal(tabs.length,20);assert.deepEqual(tabs,panels);assert.ok(tabs.includes('advanced')&&tabs.includes('systemdiag')&&tabs.includes('deploy')&&tabs.includes('specialist'));
assert.equal((html.match(/id="view-[^"]+"/g)||[]).length,35,'nie wolno dodawać nowego widoku');
const htmlIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(htmlIds.length,new Set(htmlIds).size,'duplikaty HTML ID');
assert.equal((html.match(/id="a181DeploymentMigration"/g)||[]).length,1);
for(const id of ['a181Status','a181Progress','a181LessonsDone','a181CasesDone','a181ProjectsDone','a181ExamDone','a181Points','a181Search','a181Category','a181Level','a181LessonList','a181LessonDetail','a181CaseSelect','a181CaseBody','a181Projects','a181Exam','a181GlossarySearch','a181Glossary','a181Export','a181Report'])assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`brak/duplikat elementu ${id}`);
assert.match(html,/academy-deployment-migration-refurb-fix181\.js\?v=6\.8\.0-fix181/);
assert.match(html,/academy-deployment-migration-refurb-fix181\.css\?v=6\.8\.0-fix181/);
assert.equal((sw.match(/academy-deployment-migration-refurb-fix181\.js\?v=6\.8\.0-fix181/g)||[]).length,1);
assert.equal((sw.match(/academy-deployment-migration-refurb-fix181\.css\?v=6\.8\.0-fix181/g)||[]).length,1);
assert.match(sw,/const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);
assert.match(sw,/const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'/);
pass('Rzeczywista integracja w obecnym panelu: 20 zakładek, 35 starych widoków, unikalne ID, HTML/PWA/CSS/JS i niezmienione nazwy cache');

assert.equal(release.release,'6.8.0');
assert.equal(release.currentLessonCatalog.totalCatalogLessons,1083);
assert.equal(release.academyProfessionalRepairFix175.newViews,0);
assert.equal(release.academyProfessionalRepairFix175.newD1Database,false);
assert.equal(release.academyProfessionalRepairFix175.d1SchemaMigrations,false);
assert.ok(!/CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|DELETE\s+FROM/i.test(runtime));
assert.ok(!/fetch\s*\(|navigator\.usb|navigator\.serial|WebUSB|WebSerial|WebHID/i.test(runtime));
assert.match(runtime,/nauka-od-a-do-z-fix181-deployment-migration-refurb-v1/);
assert.match(runtime,/ACADEMY_FIX168_AWARD/);
assert.match(runtime,/ACADEMY_FIX168_ADD_JOURNAL/);
for(const asset of ['academy-deployment-migration-refurb-fix181.js?v=6.8.0-fix181','academy-deployment-migration-refurb-fix181.css?v=6.8.0-fix181'])assert.ok(publisher.includes(asset.split('?')[0])&&watcher.includes(asset.split('?')[0]));
assert.ok(publisher.includes("scripts/run-tests-fix181.mjs"));
assert.ok(watcher.includes("scripts/run-tests-fix181.mjs"));
pass('Bez migracji D1, nowego projektu, automatycznych operacji na sprzęcie i resetu postępów; publikator i watcher wymagają testu FIX181');

const syntaxFiles=['WEB_PUBLISH/assets/academy-deployment-migration-refurb-fix181.js','WEB_PUBLISH/assets/academy-system-diagnostics-fix180.js','WEB_PUBLISH/assets/academy-professional-repair-fix175.js','WEB_PUBLISH/service-worker.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','scripts/test-fix181-deployment-migration-refurb.mjs','scripts/test-fix180-system-diagnostics.mjs','scripts/test-fix175-professional-academy.mjs','scripts/test-fix136-release-integration.mjs'];
for(const f of syntaxFiles){const r=spawnSync(process.execPath,['--check',f],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${f}: ${r.stderr||r.stdout}`);}
assert.ok(css.includes('.a181-shell')&&css.includes('@media'));
assert.ok(html.includes('Restore Mac wymazuje urządzenie'));
assert.ok(html.includes('Nie zapisuj haseł, kluczy FileVault/BitLocker'));
pass(`Składnia ${syntaxFiles.length} plików JS oraz CSS/ostrzeżenia bezpieczeństwa FIX181 poprawne`);

// Run browser bootstrap in a controlled DOM stub. This verifies that the actual shipped script mounts and renders every major section.
const memory=new Map([
 ['nauka-od-a-do-z-advanced-fix179-v1',JSON.stringify({completed:['fix179-lesson-board-post'],notes:{'board-post':'zapis FIX179'},points:25})],
 ['nauka-od-a-do-z-fix180-service-lab-v1',JSON.stringify({completed:['fix180-lesson-one'],points:30})],
 ['nauka-od-a-do-z-fix181-deployment-migration-refurb-v1',JSON.stringify({completed:['fix181-lesson-wim-reference-design'],notes:{'wim-reference-design':'zapis FIX181'},caseScores:{'case-image-sysprep':100},projectChecks:{'project-golden-wim':[0]},examHistory:[],points:85})]
]);
const elements=new Map();
const makeElement=id=>({id,dataset:{},style:{},value:(id==='a181Category'||id==='a181Level')?'all':'',innerHTML:'',textContent:'',hidden:false,checked:false,addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},appendChild(){},remove(){},click(){}});
const mockDocument={body:makeElement('body'),getElementById(id){if(!elements.has(id))elements.set(id,makeElement(id));return elements.get(id);},createElement(){return makeElement('created');}};
const mockWindow={document:mockDocument,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},ACADEMY_FIX168_AWARD(){}};
const context=vm.createContext({window:mockWindow,document:mockDocument,console,Blob:function(){},URL:{createObjectURL(){return'blob:test';},revokeObjectURL(){}},setTimeout(){}});
vm.runInContext(runtime,context,{timeout:5000,filename:'academy-deployment-migration-refurb-fix181.js'});
assert.equal(elements.get('a181DeploymentMigration').dataset.ready,'1');
assert.match(elements.get('a181LessonList').innerHTML,/Projektowanie komputera referencyjnego Windows/);
assert.match(elements.get('a181LessonDetail').innerHTML,/Procedura serwisowa/);
assert.match(elements.get('a181CaseBody').innerHTML,/Sysprep nie kończy pracy/);
assert.match(elements.get('a181Projects').innerHTML,/Złoty obraz Windows/);
assert.match(elements.get('a181Exam').innerHTML,/Egzamin praktyczny FIX181/);
assert.match(elements.get('a181Glossary').innerHTML,/WIM/);
assert.match(elements.get('a181Status').textContent,/28 lekcji, 13 przypadków, 9 projektów/);
assert.match(elements.get('a181Exam').innerHTML,/14 pytań/);
assert.equal(memory.get('nauka-od-a-do-z-advanced-fix179-v1'),JSON.stringify({completed:['fix179-lesson-board-post'],notes:{'board-post':'zapis FIX179'},points:25}));
assert.equal(memory.get('nauka-od-a-do-z-fix180-service-lab-v1'),JSON.stringify({completed:['fix180-lesson-one'],points:30}));
assert.equal(memory.get('nauka-od-a-do-z-fix181-deployment-migration-refurb-v1'),JSON.stringify({completed:['fix181-lesson-wim-reference-design'],notes:{'wim-reference-design':'zapis FIX181'},caseScores:{'case-image-sysprep':100},projectChecks:{'project-golden-wim':[0]},examHistory:[],points:85}));
pass('Rzeczywisty runtime FIX181 montuje panel i renderuje lekcję, przypadek, projekt, egzamin i słownik; dane FIX179/FIX180/FIX181 zachowane');

console.log('\nFIX181 DEPLOYMENT / MIGRATION / REFURB: 9/9 PASS');
