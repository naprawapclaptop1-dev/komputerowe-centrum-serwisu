import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/practice-academy-fix27.js');
const css = read('WEB_PUBLISH/assets/practice-academy-fix27.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const statusApi = read('functions/api/auth/status.js');

assert.equal(release.release, '6.8.0');
assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
assert.match(html, /name=["']academy-build["']\s+content=["']6\.8\.0-fix51-visual-academy-pro-20261105/);
assert.ok(html.includes('data-view="practicepro"'));
assert.ok(html.includes('id="view-practicepro"'));
assert.ok(html.includes('assets/practice-academy-fix27.js?v=6.8.0-fix28'));
assert.ok(html.includes('assets/practice-academy-fix27.css?v=6.8.0-fix28'));
for (const tab of ['pcb','challenge','schematic','bench','mentor','academies','exams','portfolio','instructor','search']) {
  assert.ok(html.includes(`data-p27-tab="${tab}"`), `missing tab ${tab}`);
  assert.ok(html.includes(`data-p27-pane="${tab}"`), `missing pane ${tab}`);
}
for (const id of ['p27ProgressSummary','p27BoardParts','p27PartDetail','p27MeasurementForm','p27ChallengePicker','p27ChallengeStage','p27DocInput','p27DocList','p27DocViewer','p27DocNotes','p27BenchMode','p27BenchCalculate','p27Wave','p27MentorSend','p27AcademyGrid','p27ExamPicker','p27ExamStage','p27ExamHistory','p27PortfolioExport','p27ProgressMap','p27InstructorForm','p27AssignmentList','p27KnowledgeSearch','p27ExportAll','p27ImportAll']) {
  assert.ok(html.includes(`id="${id}"`), `missing UI control ${id}`);
}
for (const token of ['indexedDB.open','npa-practice-academy-fix27','MAX_DOC = 20 * 1024 * 1024','function addMeasurement','function startChallenge','function calculateBench','function buildMentorContext','function renderAcademies','function startExam','function makePortfolio','function addAssignment','function searchKnowledge','function exportAll','function importAll']) {
  assert.ok(runtime.includes(token), `missing runtime feature ${token}`);
}
assert.ok(runtime.includes("condition!=='isolated'"), 'resistance/continuity measurement must require isolated state');
assert.ok(runtime.includes("mime==='application/pdf'"), 'PDF viewer must be present');
assert.ok(runtime.includes("['image/png','image/jpeg','image/webp']"), 'image allowlist must remain narrow');
assert.ok(runtime.includes('Przeczytaj go i naciśnij „Wyślij pytanie”'), 'AI mentor must not auto-submit the chat prompt');
assert.ok(runtime.includes('npa-instructor-fix27') && runtime.includes('npa-practice-academy-fix27'), 'local export formats must be versioned');
assert.ok(!/graph\.microsoft\.com|googleapis\.com|dropbox\.com|drive\.google\.com/i.test(runtime), 'external cloud providers must not be integrated');
assert.ok(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(runtime), 'practice module must not upload local documents or progress automatically');
for (const cls of ['.p27-hero','.p27-tabs','.p27-board-layout','.p27-case-grid','.p27-doc-layout','.p27-bench-layout','.p27-academy-grid','.p27-progress-map']) assert.ok(css.includes(cls), `missing style ${cls}`);
assert.ok(sw.includes('practice-academy-fix27.js') && sw.includes('practice-academy-fix27.css'));
assert.ok(sw.includes('fix28-practice-academy-pwa'));
assert.ok(publisher.includes('practice-academy-fix27.js') && publisher.includes('Centrum Praktyki FIX27'));
assert.ok(watcher.includes('remotePracticeAcademyValid') && watcher.includes('practiceAcademyFix27'));
assert.ok(statusApi.includes('6.8.0-fix51-visual-academy-pro-20261105'));

// Execute pure public calculation API without browser globals or network access.
const localStorage = { getItem(){ return '{}'; }, setItem(){ return true; } };
const document = { readyState: 'loading', addEventListener(){} };
const window = {};
vm.runInNewContext(runtime, { window, document, localStorage, console, Date, Math, Number, String, Array, Object, JSON, RegExp, Set, Map, Promise }, { filename: 'practice-academy-fix27.js' });
const api = window.ACADEMY_PRACTICE_FIX27_API;
assert.ok(api, 'public test API missing');
assert.equal(api.boardParts.length, 8);
assert.equal(api.challenges.length, 5);
assert.equal(api.academies.length, 6);
assert.equal(api.academies.reduce((n,a)=>n+a.lessons.length,0), 36);
const ohm = api.calculations.ohms(12, 1000);
assert.ok(Math.abs(ohm.current - 0.012) < 1e-12);
assert.ok(Math.abs(ohm.power - 0.144) < 1e-12);
const divider = api.calculations.divider(12, 10000, 10000);
assert.equal(divider.output, 6);
const rc = api.calculations.rc(1000, 0.001);
assert.equal(rc.tau, 1);
assert.equal(rc.at993, 5);
assert.throws(() => api.calculations.ohms(5, 0), /rezystancja dodatnia/);
assert.throws(() => api.calculations.divider(5, -1, 100), /Rezystory muszą być dodatnie/);
assert.throws(() => api.calculations.rc(1000, 0), /R i C muszą być dodatnie/);

// Regression audit: duplicate catalogue entries, malformed local JSON and unsafe legacy records.
const unique = values => new Set(values).size === values.length;
assert.ok(unique(api.boardParts.map(x=>x.id)) && unique(api.boardParts.map(x=>x.name)), 'PCB parts must not repeat IDs or names');
assert.ok(unique(api.challenges.map(x=>x.id)) && unique(api.challenges.map(x=>x.title)), 'repair scenarios must not repeat IDs or titles');
const challengeQuestions = api.challenges.flatMap(x=>x.steps.map(s=>s.q));
assert.ok(unique(challengeQuestions), 'diagnostic questions must not be duplicated');
assert.ok(unique(api.academies.map(x=>x.id)) && unique(api.academies.map(x=>x.title)), 'specialist academies must not repeat');
const allLessons = api.academies.flatMap(x=>x.lessons);
assert.ok(unique(allLessons), 'specialist lesson titles must be unique');
assert.equal(Object.keys(api.exams).length, api.academies.length + 1, 'six specialist exams and the base PCB exam must be present');
for (const a of api.academies) {
  assert.equal(api.exams[a.id]?.length, 4, `exam ${a.id} must contain four questions`);
  for (const q of api.exams[a.id]) assert.ok(Array.isArray(q[1]) && q[1].length>=3 && Number.isInteger(q[2]) && q[2]>=0 && q[2]<q[1].length, `exam ${a.id} has a malformed question`);
}
assert.equal(api.exams.pcb?.length, 4, 'base PCB exam must remain available');
const examPrompts=Object.values(api.exams).flat().map(q=>q[0]);
assert.ok(unique(examPrompts), 'exam question prompts must not be duplicated');
const sanitized = JSON.parse(JSON.stringify(api.normalizeState({
  measurements:[
    {id:'m-good',at:'2026-11-03T10:00:00Z',point:'TP1',kind:'resistance',value:10,unit:'Ω',condition:'isolated'},
    {id:'m-live',point:'TP2',kind:'resistance',value:2,unit:'Ω',condition:'powered'},
    {id:'m-bad',point:'TP3',kind:'script',value:2,unit:'',condition:'isolated'}
  ],
  challengeRuns:[{id:'c-good',caseId:'no-power',score:2,total:999,pct:999,at:'2026-11-03T10:00:00Z'},{id:'c-bad',caseId:'unknown',score:9}],
  examRuns:[{id:'e-good',academy:'mac',score:3,total:99,pct:1,passed:false},{id:'e-pcb',academy:'pcb',score:4,total:4,pct:0,passed:false},{id:'e-bad',academy:'unknown',score:9}],
  assignments:[{id:'<img src=x onerror=alert(1)>',title:'Bezpieczne zadanie',instructions:'Sprawdź zachowanie sekcji zasilania.',rubric:{'Diagnoza':8,'Bezpieczeństwo':4,'Dokumentacja':3,'Test końcowy':2},feedback:'Ocena kompletna',reviewed:true},{id:'bad',title:'x',instructions:'krótko'}],
  paths:{mac:[true,1,false,true,true,true,true],unknown:[true],__proto__:{evil:true}},
  lastTab:'not-a-tab',unknownKey:'should be discarded'
})));
assert.equal(sanitized.measurements.length,1,'unsafe powered resistance and unknown kinds must be discarded');
assert.equal(sanitized.challengeRuns.length,1);assert.equal(sanitized.challengeRuns[0].pct,67,'imported challenge percentage must be recomputed');
assert.equal(sanitized.examRuns.length,2);assert.equal(sanitized.examRuns[0].pct,75);assert.equal(sanitized.examRuns[0].passed,true,'exam result must not trust imported passed flag');assert.equal(sanitized.examRuns[1].academy,'pcb','base PCB exam history must survive import');
assert.equal(sanitized.assignments.length,1);assert.equal(sanitized.assignments[0].id.startsWith('import-'),true,'HTML-like record IDs must be replaced');
assert.equal(sanitized.assignments[0].rubric['Diagnoza'],5,'rubric scores must be bounded');assert.equal(sanitized.assignments[0].feedback,'Ocena kompletna');
assert.deepEqual(sanitized.paths.mac,[true,false,false,true,true,true]);assert.deepEqual(Object.keys(sanitized.paths).sort(),['atx','gpu','mac','monitor','server','usbc'].sort());
assert.equal(sanitized.lastTab,'pcb');assert.equal(Object.hasOwn(sanitized,'unknownKey'),false);
const preserved = api.normalizeState({assignments:[{id:'task-1',title:'Zadanie instruktora',instructions:'Sprawdź komplet dokumentacji.',rubric:{'Diagnoza':5,'Bezpieczeństwo':4,'Dokumentacja':3,'Test końcowy':5},feedback:'Dobra dokumentacja.',reviewed:true}]});
assert.deepEqual(JSON.parse(JSON.stringify(preserved.assignments[0].rubric)),{'Diagnoza':5,'Bezpieczeństwo':4,'Dokumentacja':3,'Test końcowy':5});
assert.equal(preserved.assignments[0].feedback,'Dobra dokumentacja.');assert.equal(preserved.assignments[0].reviewed,true);
const unreviewed=api.normalizeState({assignments:[{id:'task-2',title:'Drugie zadanie',instructions:'Sprawdź schemat i wyniki pomiarów.',reviewed:'false'}]});assert.equal(unreviewed.assignments[0].reviewed,false,'string false must not become a reviewed assignment');
assert.ok(runtime.includes("if(!PRACTICE_TABS.has(tab)) tab='pcb'"),'invalid saved tabs must fall back to the first tab');
assert.ok(runtime.indexOf("ACADEMY_PRACTICE_FIX27_READY||!$('view-practicepro')") < runtime.indexOf('bind();'),'init idempotence guard must run before event binding');
assert.ok(runtime.includes("file.size<=0") && runtime.includes("rec.blob instanceof Blob"),'document imports must reject empty or malformed IndexedDB records');
assert.ok(runtime.includes("/^[\\s]*[=+@]/"),'CSV text fields must be protected against spreadsheet formula injection');
assert.ok(runtime.includes("state.assignments.push(a)"),'instructor JSON import must preserve validated scores and feedback');

console.log('PASS: wszystkie 10 kart Centrum Praktyki ma osobne panele i kontrolki.');
console.log('PASS: 8 elementów PCB, 5 przypadków napraw i 6 ścieżek / 36 lekcji.');
console.log('PASS: kalkulatory Ohma, dzielnika i RC z walidacją danych.');
console.log('PASS: pomiary rezystancji/ciągłości są blokowane bez odłączenia zasilania.');
console.log('PASS: schematy PDF/obrazy są lokalne, z ograniczeniem typu i rozmiaru.');
console.log('PASS: AI Mentor przygotowuje kontekst do ręcznego wysłania — bez auto-submit.');
console.log('PASS: portfolio, egzaminy, zadania instruktora i postęp są eksportowalne lokalnie.');
console.log('PASS: brak integracji Google Drive / OneDrive / Dropbox i automatycznego uploadu.');
console.log('PASS: PWA, publikator i watcher wymagają bieżącego wydania FIX28 i zachowują moduł FIX27.');
