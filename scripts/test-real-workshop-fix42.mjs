import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/real-workshop-fix42.js');
const css = read('WEB_PUBLISH/assets/real-workshop-fix42.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const fix40 = read('WEB_PUBLISH/assets/nauka-centrum-fix40.js');
const fix41 = read('WEB_PUBLISH/assets/akademia-serwisanta-fix41.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const pub = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
let passed = 0;
function check(name, fn) { fn(); passed++; process.stdout.write(`[PASS] ${name}\n`); }

check('FIX42 release metadata, title and parent navigation are synchronized', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
  assert.match(html, new RegExp(`name="academy-build" content="${release.build}"`));
  assert.match(html, /id="view-fix43"/);
  assert.ok(html.includes('data-l40-tab="workshop42"'));
  assert.ok(html.includes('data-l40-pane="workshop42"'));
  assert.ok(fix40.includes("'workshop42'"));
  for (const pane of ['dashboard','search','bench','exams','atlas','offline','reports','academy41']) assert.ok(html.includes(`data-l40-pane="${pane}"`));
});

check('All six workshop domains are present in the UI and have separate renderers', () => {
  for (const [tab,template] of [['overview','overviewTemplate'],['boardview','boardTemplate'],['electronics','electronicsTemplate'],['diagnosis','diagnosisTemplate'],['orders','ordersTemplate'],['parts','partsTemplate'],['recovery','recoveryTemplate']]) {
    assert.ok(html.includes(`data-f42-tab="${tab}"`), `missing tab ${tab}`);
    assert.ok(runtime.includes(`function ${template}`), `missing template ${template}`);
  }
  for (const id of ['f42BoardUpload','f42MeasureForm','f42SupplyForm','f42WaveForm','f42DiagnosisForm','f42OrderForm','f42CompatForm','f42RecoveryForm','f42ExportBackup','f42ImportBackup']) assert.ok(runtime.includes(id), `missing form/control ${id}`);
});

check('FIX42 files and PWA cache are linked with a new cache namespace', () => {
  assert.ok(html.includes('real-workshop-fix42.js?v=6.8.0-fix42'));
  assert.ok(html.includes('real-workshop-fix42.css?v=6.8.0-fix42'));
  assert.ok(sw.includes('real-workshop-fix42.js?v=6.8.0-fix42'));
  assert.ok(sw.includes('real-workshop-fix42.css?v=6.8.0-fix42'));
  assert.match(sw, /CACHE_NAME[^\n]*fix79-pwa-cache-20261106/);
  assert.ok(css.includes('.f42-board-wrap') && css.includes('.f42-grid') && css.includes('@media'));
});

check('Publication guards require FIX42 assets and tests', () => {
  assert.ok(pub.includes('real-workshop-fix42.js'));
  assert.ok(pub.includes('test-real-workshop-fix42.mjs'));
  assert.ok(watcher.includes('real-workshop-fix42.js'));
  assert.ok(watcher.includes('remoteFix42Valid'));
});

check('FIX42 runtime avoids dynamic code execution and hardware APIs', () => {
  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime, /new\s+Function\s*\(/);
  assert.doesNotMatch(runtime, /navigator\.(?:serial|usb|hid)\b/);
  assert.ok(runtime.includes('No physical hardware control'));
  assert.ok(runtime.includes('CSV i JSON'));
  assert.ok(runtime.includes('localStorage'));
});

// Minimal host harness: initialize the exact browser runtime while keeping the DOM inert.
const rootNode = { innerHTML: '' };
const hostNode = { dataset: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
const store = new Map();
const documentMock = {
  getElementById: id => id === 'f42Stage' ? rootNode : null,
  querySelector: selector => selector === '[data-l40-pane="workshop42"]' ? hostNode : null
};
const windowMock = {};
const context = {
  window: windowMock,
  document: documentMock,
  localStorage: { getItem: key => store.has(key) ? store.get(key) : null, setItem: (key, value) => store.set(key, String(value)) },
  console, Intl, Date, Math, Number, String, JSON, Object, Array, Map, Set, RegExp, Error,
  Blob: class {}, URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
  setTimeout: () => 0
};
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'real-workshop-fix42.js', timeout: 2500 });
const api = windowMock.NP_NAUKA_FIX42;
assert.ok(api, 'FIX42 test API exported');

check('FIX42 state normalizer rejects hostile structures and clamps collections', () => {
  const result = api.normalizeState({ jobs: 'not-array', boards: Array.from({ length: 50 }, (_,i) => ({id:i})), measurements: [null, {}, []], version: 99 });
  assert.equal(result.version, 1);
  assert.equal(result.jobs.length, 0);
  assert.equal(result.boards.length, 30);
  assert.equal(result.measurements.length, 1);
});

check('Boardview CSV importer parses coordinates and component metadata', () => {
  const rows = api.parseBoardview('refdes,x,y,value,package,net,layer\nPU1,10,20,Controller,QFN-24,VSYS,TOP\nPQ1,15,25,MOSFET,SOT-23,DCIN,BOTTOM', 'map.csv');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].refdes, 'PU1');
  assert.equal(rows[1].layer, 'BOTTOM');
  assert.equal(rows[1].x, 15);
});

check('Boardview JSON importer accepts components array and drops invalid/duplicate rows', () => {
  const rows = api.parseBoardview(JSON.stringify({components:[{refdes:'R1',x:1,y:2,value:'10k'},{ref:'R1',x:3,y:4},{refdes:'C1',x:'x',y:3},{refdes:'U1',x:4,y:5}]}), 'board.json');
  assert.deepEqual(rows.map(x => x.refdes), ['R1','U1']);
});

check('Boardview importer refuses unsupported formats and malformed coordinates', () => {
  assert.throws(() => api.parseBoardview('binary data', 'board.fz'), /Obsługiwane formaty/);
  assert.throws(() => api.parseBoardview('refdes,x,y\nR1,not-a-number,5', 'board.csv'), /Nie znaleziono/);
});

check('DMM blocks resistance/continuity on energized circuits', () => {
  const resistance = api.evaluateInstrument({scenario:'resistance',mode:'resistance',value:14,powerState:'powered'});
  const continuity = api.evaluateInstrument({scenario:'continuity',mode:'continuity',value:.2,powerState:'powered'});
  assert.equal(resistance.safe, false);
  assert.equal(continuity.safe, false);
  assert.match(resistance.message, /STOP/);
});

check('DMM validates mode, circuit state and tolerance', () => {
  assert.equal(api.evaluateInstrument({scenario:'adapter',mode:'resistance',value:19.5,powerState:'powered'}).complete, false);
  assert.equal(api.evaluateInstrument({scenario:'adapter',mode:'voltage',value:19.5,powerState:'isolated'}).safe, false);
  assert.equal(api.evaluateInstrument({scenario:'adapter',mode:'voltage',value:19.5,powerState:'powered'}).passed, true);
  assert.equal(api.evaluateInstrument({scenario:'rail5',mode:'voltage',value:8,powerState:'powered'}).passed, false);
});

check('Bench supply obeys model bounds and current limiting', () => {
  const limited = api.evaluateSupply({voltage:10,currentLimit:1,resistance:2});
  assert.equal(limited.valid, true);
  assert.equal(limited.limited, true);
  assert.equal(limited.current, 1);
  assert.equal(limited.voltage, 2);
  assert.equal(api.evaluateSupply({voltage:25,currentLimit:1,resistance:2}).valid, false);
});

check('Oscilloscope waveform generator creates three valid shapes and rejects invalid ranges', () => {
  for (const shape of ['sine','square','triangle']) assert.ok(api.waveformPoints({shape,amplitude:2,frequency:1000}).startsWith('M 20.0 '));
  assert.throws(() => api.waveformPoints({amplitude:9}), /Nieprawidłowe parametry/);
});

check('Diagnostic copilot produces grounded local hypotheses for common symptoms', () => {
  const result = api.diagnose({device:'laptop',model:'EDU model',boardId:'EDU-1',symptom:'Laptop brak reakcji na przycisk Power',observations:'brak reakcji'});
  assert.equal(result.matched, true);
  assert.equal(result.caseId, 'no-power');
  assert.ok(result.hypotheses.length >= 3);
  assert.ok(result.steps.length >= 3);
  assert.ok(result.stop.length >= 1);
  assert.ok(result.disclaimer.includes('nie diagnoza'));
});

check('Diagnostic copilot returns no-match instead of inventing a diagnosis', () => {
  const result = api.diagnose({symptom:'nieznany objaw xyz 123'});
  assert.equal(result.matched, false);
  assert.equal(result.hypotheses[0].confidence, 0);
  assert.ok(result.steps.length >= 2);
});

check('Parts parametric filter checks voltage/current margins, package and polarity', () => {
  const compatible = api.checkCompatibility({partId:'EDU-NMOS-30V-S23',requiredVoltage:12,requiredCurrent:2,package:'SOT-23',polarity:'N'});
  assert.equal(compatible.compatible, true);
  const incompatible = api.checkCompatibility({partId:'EDU-NMOS-30V-S23',requiredVoltage:30,requiredCurrent:4,package:'QFN-8',polarity:'P'});
  assert.equal(incompatible.compatible, false);
  assert.ok(incompatible.issues.length >= 3);
  assert.ok(compatible.notice.includes('pinout'));
});

check('Service order validates required intake data and calculates totals', () => {
  assert.throws(() => api.makeJob({device:'Laptop',model:'Model'}), /objaw/);
  const job = api.makeJob({customerAlias:'SERWIS-001',device:'Laptop',model:'EDU-Book',symptom:'Brak startu',partsCost:'120',laborCost:'180'});
  assert.equal(job.total, 300);
  assert.equal(job.status, 'Przyjęte');
});

check('Local job status workflow and backup import/export work', () => {
  const job = api.makeJob({device:'PC',model:'EDU-Tower',symptom:'Restart'});
  api.importBackupObject({schema:'NAUKA_OD_A_DO_Z_FIX42',state:{version:1,jobs:[job]}});
  const updated = api.updateJobStatus(job.id,'Testy końcowe','Test POST i obciążeniowy EDU wykonany.');
  assert.equal(updated.status,'Testy końcowe');
  assert.ok(updated.finalTest.includes('POST'));
  const backup = JSON.parse(api.exportBackup());
  assert.equal(backup.schema,'NAUKA_OD_A_DO_Z_FIX42');
  assert.equal(backup.state.jobs[0].id,job.id);
  assert.throws(() => api.importBackupObject({schema:'wrong',state:{version:1}}), /Nieprawidłowy/);
});

check('Recovery checklist progress is stored locally with a reproducible percentage', () => {
  const run = api.recoveryProgress('bcd',[true,true,false,false,true]);
  assert.equal(run.completed,3);
  assert.equal(run.total,5);
  assert.equal(run.percent,60);
  assert.equal(api.getState().recoveryRuns[0].id,run.id);
});

check('Existing FIX40 and FIX41 remain linked and reachable', () => {
  for (const token of ['data-f42-open-f41','NP_NAUKA_FIX41','data-open-tab="exams"','data-open-tab="reports"']) assert.ok(runtime.includes(token));
  assert.ok(fix41.includes('function setTab'));
  for (const tab of ['dashboard','search','bench','exams','atlas','offline','reports','academy41']) assert.ok(html.includes(`data-l40-tab="${tab}"`));
});

check('FIX42 resources remain modest and documentation/test runner are present', () => {
  assert.ok(fs.statSync(path.join(ROOT,'WEB_PUBLISH/assets/real-workshop-fix42.js')).size < 500 * 1024);
  assert.ok(fs.statSync(path.join(ROOT,'WEB_PUBLISH/assets/real-workshop-fix42.css')).size < 100 * 1024);
  assert.ok(fs.existsSync(path.join(ROOT,'README_FIX42_REAL_WORKSHOP_PRO.txt')));
  assert.ok(fs.existsSync(path.join(ROOT,'CHANGELOG_6.8.0_FIX42.txt')));
  assert.ok(fs.existsSync(path.join(ROOT,'PUBLICATION_GUARD_FIX42.txt')));
});

process.stdout.write(`\nFIX42 REGRESSION: ${passed}/${passed} PASS\n`);
