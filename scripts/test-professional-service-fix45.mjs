import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const runtime = read('WEB_PUBLISH/assets/professional-service-fix45.js');
const css = read('WEB_PUBLISH/assets/professional-service-fix45.css');
const build = '6.8.0-fix51-visual-academy-pro-20261105';

let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }

const page = { dataset: {}, addEventListener() {}, querySelectorAll: () => [], querySelector: () => null };
const stage = { innerHTML: '', addEventListener() {}, querySelectorAll: () => [] };
const status = { textContent: '', classList: { toggle() {} } };
const store = new Map();
const documentMock = {
  getElementById: id => ({ 'view-fix45': page, f45Stage: stage, f45Status: status }[id] || null),
  createElement: () => ({ click() {}, remove() {}, set href(v) {}, set download(v) {} }),
  body: { appendChild() {} }
};
const context = {
  window: {}, document: documentMock,
  localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  navigator: { userAgent: 'FIX45 Test Browser', platform: 'Test', hardwareConcurrency: 8, deviceMemory: 8, language: 'pl', onLine: true },
  performance, setTimeout, clearTimeout, Blob, URL, Intl, Date, Math, Number, String, JSON, Object, Array, Map, Set, RegExp, Error, Promise, Uint8Array, ArrayBuffer, DataView, console,
  FormData: class {}, HTMLFormElement: class {}, fetch: async () => ({ ok: true })
};
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'professional-service-fix45.js', timeout: 5000 });
const api = context.window.NP_NAUKA_FIX45;

await check('Runtime initializes and exposes a stable FIX45 API', () => {
  assert.ok(api);
  assert.equal(api.build, '6.8.0-fix45');
  assert.ok(stage.innerHTML.includes('Professional Repair & Quality Center'));
  assert.equal(status.classList.toggle instanceof Function, true);
});
await check('FIX45 view is separate and assets are linked from HTML', () => {
  assert.ok(html.includes('id="view-fix45"'));
  assert.ok(html.includes('data-view="fix45"'));
  assert.ok(html.includes('professional-service-fix45.js?v=6.8.0-fix45'));
  assert.ok(html.includes('professional-service-fix45.css?v=6.8.0-fix45'));
});
await check('Release id is aligned across metadata, HTML and authentication API', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.build, build);
  assert.ok(html.includes(`academy-build" content="${build}`));
  assert.ok(read('functions/api/auth/status.js').includes(build));
});
await check('PWA cache includes FIX45 scripts and CSS without dropping FIX44', () => {
  for (const token of ['professional-service-fix45.js', 'professional-service-fix45.css', 'fix45-professional-service-20261104', 'master-service-center-fix44.js', 'fix44-master-service-center-20261104']) assert.ok(sw.includes(token), `missing ${token}`);
});
await check('Browser inventory reports only browser-exposed capabilities', () => {
  const r = api.browserInventory();
  assert.equal(r.cores, 8);
  assert.equal(r.memoryGB, 8);
  assert.equal(r.online, true);
  assert.match(r.note, /nie pełna identyfikacja/);
  assert.equal(typeof r.serialApi, 'boolean');
  assert.equal(typeof r.usbApi, 'boolean');
});
await check('PCI hardware ID parser extracts VEN and DEV', () => {
  const r = api.parseHardwareId('PCI\\VEN_8086&DEV_1234&SUBSYS_00000000');
  assert.equal(r.bus, 'PCI');
  assert.equal(r.vendor, '8086');
  assert.equal(r.device, '1234');
});
await check('USB hardware ID parser extracts VID and PID', () => {
  const r = api.parseHardwareId('USB\\VID_046D&PID_C52B');
  assert.equal(r.bus, 'USB');
  assert.equal(r.vendor, '046D');
  assert.equal(r.device, 'C52B');
});
await check('Malformed hardware IDs are rejected', () => {
  assert.throws(() => api.parseHardwareId('xyz'), /Nie rozpoznano/);
});
await check('PSU rail evaluator accepts nominal values within educational tolerance', () => {
  assert.ok(api.evaluatePsuRails({ '12': 12, '5': 5, '3.3': 3.3 }).every(x => x.within));
});
await check('PSU rail evaluator flags out-of-range values and missing readings', () => {
  const r = api.evaluatePsuRails({ '12': 10, '5': '', '3.3': 3.3 });
  assert.equal(r[0].within, false);
  assert.equal(r[1].within, false);
  assert.equal(r[1].measured, null);
});
await check('Quality evaluator distinguishes complete and incomplete checklists', () => {
  assert.equal(api.evaluateQuality([{ name: 'A', ok: true }, { name: 'B', ok: true }]).complete, true);
  assert.equal(api.evaluateQuality([{ name: 'A', ok: true }, { name: 'B', ok: false }]).complete, false);
  assert.equal(api.evaluateQuality([]).complete, false);
});
await check('Diagnostic investigator returns hypotheses for power and display symptoms', () => {
  assert.ok(api.diagnose('Laptop nie uruchamia się').hypotheses.length >= 2);
  assert.ok(api.diagnose('Laptop ma czarny ekran').hypotheses.length >= 2);
});
await check('Diagnostic investigator labels conclusions as unconfirmed hypotheses', () => {
  assert.match(api.diagnose('brak obrazu').disclaimer, /nie automatyczna diagnoza/);
});
await check('Device passport persists a model or board identity locally', () => {
  const row = api.addDevice({ manufacturer: 'EDU', model: 'ThinkPad EDU', board: 'NM-EDU-1' });
  assert.equal(row.model, 'ThinkPad EDU');
  assert.equal(api.getState().devices.length, 1);
  assert.equal(JSON.parse(store.get('npNaukaProfessionalServiceFix45')).devices.length, 1);
});
await check('Device passport rejects an empty identity without changing state', () => {
  const before = api.getState().devices.length;
  assert.throws(() => api.addDevice({}), /Podaj model/);
  assert.equal(api.getState().devices.length, before);
});
await check('Workflow tasks require a title and default to a new state', () => {
  assert.throws(() => api.addTask({}), /nazwę zadania/);
  const row = api.addTask({ title: 'Test naprawy', device: 'EDU PC' });
  assert.equal(row.status, 'Nowe');
  assert.equal(api.getState().tasks.length, 1);
});
await check('Course creator stores a course and parses lesson lines', () => {
  const row = api.addCourse({ title: 'Kurs FIX45', lessons: 'Diagnoza\nPomiary\nRaport' });
  assert.deepEqual(Array.from(row.lessons), ['Diagnoza', 'Pomiary', 'Raport']);
});
await check('Quality, thermal and investigation records are validated and stored', () => {
  const qa = api.addQuality('EDU PC', [{ name: 'Obraz', ok: true }, { name: 'SMART', ok: false }]);
  assert.equal(qa.passed, 1);
  assert.equal(qa.total, 2);
  assert.throws(() => api.addQuality('EDU PC', []));
  const thermal = api.addThermal({ device: 'EDU PC', cpu: 55, gpu: 60, ambient: 22, source: 'odczyt ręczny' });
  assert.equal(thermal.cpu, 55);
  assert.throws(() => api.addThermal({ device: 'EDU PC', cpu: 151 }));
  const investigation = api.addInvestigation('Laptop się nie uruchamia', 'dioda ładowania świeci');
  assert.ok(investigation.hypotheses.length >= 2);
  assert.equal(api.getState().investigations.length, 1);
});
await check('Normalization bounds records and text fields', () => {
  const normalized = api.normalize({ devices: [{ model: 'X'.repeat(300) }], tasks: Array.from({ length: 600 }, () => ({ title: 'T' })) });
  assert.ok(normalized.devices[0].model.length <= 160);
  assert.equal(normalized.tasks.length, 500);
});
await check('Built-in self-checks all pass, including invalid empty passport rejection', () => {
  const result = api.runSelfChecks();
  assert.equal(result.length, 13);
  assert.ok(result.every(x => x.ok), JSON.stringify(result.filter(x => !x.ok)));
});
await check('Safe browser benchmark is bounded and writes a local result', async () => {
  const r = await api.runSafeBenchmark(100);
  assert.ok(r.durationMs >= 100 && r.durationMs <= 1000);
  assert.ok(r.loops > 0 && r.score >= 0);
  assert.equal(api.getState().benchmarks.length, 1);
});
await check('No physical hardware write or destructive command is embedded in browser module', () => {
  assert.ok(runtime.includes('firmware flashing'));
  assert.ok(runtime.includes('nie wysyła komend') || runtime.includes('bez automatycznego sterowania'));
  assert.ok(!runtime.includes('navigator.serial.getWriter'));
});
await check('All 18 tabs and the two operating modes are registered', () => {
  const match = runtime.match(/const tabs=\[([\s\S]*?)\n  \];/);
  assert.ok(match);
  assert.equal((match[1].match(/\['[a-z]+','[^']+'/g) || []).length, 18);
  assert.ok(match[1].includes("['admin','Admin QA','service']"));
  assert.ok(match[1].includes("['backup','Backup','both']"));
});
await check('CSS contains responsive and usable module layout', () => {
  for (const token of ['.f45-page-head', '.f45-tabs', '.f45-grid', '.f45-form', '.f45-qa', '@media']) assert.ok(css.includes(token), `missing ${token}`);
});

console.log(`\nFIX45 PROFESSIONAL SERVICE: ${passed}/${passed} PASS`);
