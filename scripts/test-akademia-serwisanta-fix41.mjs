import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/akademia-serwisanta-fix41.js');
const css = read('WEB_PUBLISH/assets/akademia-serwisanta-fix41.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const fix40 = read('WEB_PUBLISH/assets/nauka-centrum-fix40.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  process.stdout.write(`[PASS] ${name}\n`);
}

check('FIX41 metadata and release build are synchronized', () => {
  const match = html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i);
  assert.equal(release.release, '6.8.0');
  assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
  assert.equal(match?.[1], release.build);
  assert.ok(release.features.includes('fix41-service-academy-unified-learning-hub'));
});

check('FIX41 tab is integrated into existing FIX40 navigation', () => {
  assert.match(html, /data-l40-tab="academy41"/);
  assert.match(html, /data-l40-pane="academy41"/);
  assert.ok(fix40.includes("'academy41'"));
  for (const oldPane of ['dashboard','search','bench','exams','atlas','offline','reports']) {
    assert.ok(html.includes(`data-l40-pane="${oldPane}"`), `missing old pane ${oldPane}`);
  }
  for (const oldView of ['view-ultimate3d','view-practicepro','view-labplus','view-masterworkshop','view-components','view-learnpro']) {
    assert.ok(html.includes(`id="${oldView}"`), `missing legacy module ${oldView}`);
  }
});

check('FIX41 includes all practical academy workspaces and student progress tabs', () => {
  for (const tab of ['overview','assembly','faults','board','lab','challenge','bios','solder','knowledge','teacher','progress']) {
    assert.ok(html.includes(`data-f41-tab=\"${tab}\"`), `missing FIX41 tab ${tab}`);
    assert.ok(runtime.includes(`activeTab === '${tab}'`) || tab === 'overview', `missing render handler for ${tab}`);
  }
  for (const feature of ['boardTemplate','labTemplate','challengeTemplate','biosChecklistTemplate','solderChecklistTemplate','progressTemplate']) assert.ok(runtime.includes(`function ${feature}`));
});

check('FIX41 runtime and stylesheet are linked and cached by the PWA', () => {
  assert.ok(html.includes('assets/akademia-serwisanta-fix41.js?v=6.8.0-fix41'));
  assert.ok(html.includes('assets/akademia-serwisanta-fix41.css?v=6.8.0-fix41'));
  assert.ok(sw.includes('akademia-serwisanta-fix41.js?v=6.8.0-fix41'));
  assert.ok(sw.includes('akademia-serwisanta-fix41.css?v=6.8.0-fix41'));
  assert.match(sw, /CACHE_NAME[^\n]*fix79-pwa-cache-20261106/);
  assert.ok(sw.includes('akademia-serwisanta-fix41.js') && sw.includes('real-workshop-fix42.js'));
  assert.ok(css.includes('.f41-overview-grid'));
  assert.ok(css.includes('@media'));
});

check('FIX41 publication guards require files and regression test', () => {
  const oneclick = read('ONECLICK_AKADEMIA.js');
  const watcher = read('AUTO_PUBLISH_WATCHER.js');
  assert.ok(oneclick.includes('test-akademia-serwisanta-fix41.mjs'));
  assert.ok(oneclick.includes('akademia-serwisanta-fix41.js'));
  assert.ok(oneclick.includes('akademia-serwisanta-fix41.js') && oneclick.includes("swCacheName.includes('fix79-pwa-cache-20261106')"));
  assert.ok(watcher.includes('test-akademia-serwisanta-fix41.mjs'));
  assert.ok(watcher.includes('remoteFix41Valid'));
  assert.ok(watcher.includes('serviceAcademyFix41'));
});

check('FIX41 runtime syntax and safety boundaries', () => {
  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime, /new\s+Function\s*\(/);
  assert.doesNotMatch(runtime, /navigator\.(?:serial|usb|hid)\b/);
  assert.ok(runtime.includes('symulacja'));
  assert.ok(runtime.includes('nie wykonuje programowania'));
  assert.ok(runtime.includes('localStorage'));
});

// Minimal DOM/localStorage harness: production initialization is deferred until DOMContentLoaded,
// so this evaluates the same pure domain functions without simulating the full application UI.
const rootNode = { dataset: {}, querySelector: () => null };
const hostNode = { dataset: {}, querySelector: () => null, addEventListener: () => {} };
const store = new Map();
const documentMock = {
  readyState: 'loading',
  getElementById(id) { return id === 'f41Stage' ? rootNode : null; },
  querySelector(selector) { return selector === '[data-l40-pane="academy41"]' ? hostNode : null; },
  addEventListener() {}
};
const windowMock = {
  ACADEMY_DATA: {
    courseLessons: [{ id: 'LESSON-MOSFET', title: 'Diagnostyka MOSFET', description: 'Pomiar tranzystora MOSFET i analiza sekcji zasilania.' }],
    beginnerLessons: [{ id: 'BEGINNER-ESD', title: 'Bezpieczeństwo ESD', text: 'Ochrona przed wyładowaniami elektrostatycznymi.' }],
    faults: [{ id: 'CASE-USB', title: 'Port USB nie działa', solution: 'Diagnostyka zabezpieczenia portu.' }]
  },
  ACADEMY_REPAIR_METHODS: [{ id: 'METHOD-POWER', title: 'Diagnostyka zasilania', procedure: 'Sprawdź dokumentację i bezpieczne punkty pomiarowe.' }],
  ACADEMY_COMPONENTS: { components: [{ id: 'MOSFET-01', title: 'MOSFET N-channel', description: 'Tranzystor w przetwornicy.' }] },
  ACADEMY_DEVICE_CATALOG: { brands: [{ brand: 'EDU', models: [['Notebook','NB-01','Laptop']] }] }
};
const context = {
  window: windowMock,
  document: documentMock,
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value))
  },
  console,
  Intl,
  Date,
  Math,
  Number,
  String,
  JSON,
  Object,
  Array,
  Map,
  Set,
  RegExp,
  Error,
  FormData: class {},
  MouseEvent: class {}
};
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'akademia-serwisanta-fix41.js', timeout: 2000 });
const api = windowMock.NP_NAUKA_FIX41;
assert.ok(api, 'FIX41 exports a testable API');

check('FIX41 API and complete randomized fault catalog are exposed', () => {
  assert.equal(api.schema, 'NAUKA_OD_A_DO_Z_FIX41');
  assert.ok(api.faultIds().length >= 8);
  assert.ok(api.componentIds().length >= 8);
});

check('Progress normalization clamps hostile and oversized data', () => {
  const normalized = api.normalizeState({ xp: -5, builds: 'not-an-array', faultRuns: Array.from({ length: 300 }, (_, i) => ({ id: i })), savedBoard: { boardId: '  EDU-BOARD  ', revision: 'B2' } });
  assert.equal(normalized.xp, 0);
  assert.equal(normalized.builds.length, 0);
  assert.equal(normalized.faultRuns.length, 250);
  assert.equal(normalized.savedBoard.boardId, 'EDU-BOARD');
  assert.equal(normalized.savedBoard.revision, 'B2');
  assert.equal(api.normalizeState({ xp: 999999999 }).xp, 10000000);
});

check('PC Assembly Simulator accepts a matching training configuration', () => {
  const result = api.calculateAssembly({ cpu: 'i5_12400', board: 'b660_d4', ram: 'ddr4_32', gpu: 'rtx4060', psu: 'p650', storage: 'nvme1' });
  assert.equal(result.compatible, true);
  assert.equal(result.issues.length, 0);
  assert.ok(result.recommended <= 650);
  assert.ok(result.warnings.length >= 3);
});

check('PC Assembly Simulator detects socket, RAM and PSU conflicts', () => {
  const result = api.calculateAssembly({ cpu: 'r7_7800x3d', board: 'b550', ram: 'ddr5_32', gpu: 'rx7900xtx', psu: 'p450', storage: 'sata' });
  assert.equal(result.compatible, false);
  assert.ok(result.issues.some(x => x.includes('Niezgodne gniazdo')));
  assert.ok(result.issues.some(x => x.includes('Niezgodna generacja RAM')));
  assert.ok(result.issues.some(x => x.includes('PSU')));
  assert.throws(() => api.calculateAssembly({ cpu: 'unknown' }), /poprawne pozycje/);
});

check('Fault Generator refuses missing and invalid answers', () => {
  const missing = api.evaluateFault('no-post-ram', undefined);
  assert.equal(missing.complete, false);
  assert.equal(missing.correct, false);
  const invalid = api.evaluateFault('no-post-ram', 99);
  assert.equal(invalid.complete, false);
  assert.throws(() => api.evaluateFault('unknown-case', 0), /Nieznany scenariusz/);
});

check('Fault Generator scores correct and incorrect answers and provides procedures', () => {
  const correct = api.evaluateFault('no-post-ram', 1);
  const wrong = api.evaluateFault('no-post-ram', 0);
  assert.equal(correct.complete, true);
  assert.equal(correct.correct, true);
  assert.equal(correct.score, 100);
  assert.ok(correct.steps.length >= 3);
  assert.equal(wrong.complete, true);
  assert.equal(wrong.correct, false);
  assert.ok(correct.explanation.length > 20);
});

check('Measurement simulator blocks resistance tests on powered circuits', () => {
  const unsafe = api.evaluateMeasurement({ scenario: 'resistance', mode: 'resistance', value: 14, powerState: 'powered' });
  assert.equal(unsafe.complete, false);
  assert.equal(unsafe.safe, false);
  assert.match(unsafe.message, /STOP/);
  const safe = api.evaluateMeasurement({ scenario: 'resistance', mode: 'resistance', value: 14, powerState: 'isolated' });
  assert.equal(safe.complete, true);
  assert.equal(safe.passed, true);
  assert.equal(safe.unit, 'Ω');
});

check('Measurement simulator validates mode, power state and tolerance', () => {
  assert.equal(api.evaluateMeasurement({ scenario: 'adapter', mode: 'resistance', value: 19.5, powerState: 'powered' }).complete, false);
  assert.equal(api.evaluateMeasurement({ scenario: 'adapter', mode: 'voltage', value: 19.5, powerState: 'isolated' }).safe, false);
  assert.equal(api.evaluateMeasurement({ scenario: 'adapter', mode: 'voltage', value: 19.5, powerState: 'powered' }).passed, true);
  assert.equal(api.evaluateMeasurement({ scenario: 'adapter', mode: 'voltage', value: 29, powerState: 'powered' }).passed, false);
  assert.equal(api.evaluateMeasurement({ scenario: 'adapter', mode: 'voltage', value: -1, powerState: 'powered' }).complete, false);
});

check('Practical challenge applies the 75 percent pass threshold', () => {
  const pass = api.evaluateChallenge([1, 1, 1, 0], [1, 1, 1, 1]);
  const fail = api.evaluateChallenge([1, 1, 0, 0], [1, 1, 1, 1]);
  const incomplete = api.evaluateChallenge([1], [1, 0]);
  assert.equal(pass.percent, 75);
  assert.equal(pass.passed, true);
  assert.equal(fail.percent, 50);
  assert.equal(fail.passed, false);
  assert.equal(incomplete.complete, false);
});

check('Knowledge Center searches lessons, methods and component catalog locally', () => {
  const result = api.searchKnowledge('mosfet');
  assert.ok(result.some(item => item.group === 'courseLessons'));
  assert.ok(result.some(item => item.group === 'components'));
  assert.deepEqual(api.searchKnowledge('x').length, 0);
  assert.ok(api.searchKnowledge('bezpieczenstwo esd').some(item => item.group === 'beginnerLessons'));
});

check('Existing knowledge remains accessible through integration routes', () => {
  for (const route of ['pcb','schematic','electronics','bios','challenge','solder','exams','courses','repairAi','components','reports']) {
    assert.ok(runtime.includes(`${route}:`), `missing route mapping: ${route}`);
  }
  assert.ok(runtime.includes('data-m64-tab="bios"') || runtime.includes("m64-tab"));
  assert.ok(runtime.includes('data-f41-tab-go'));
});

check('New bundle remains within deployment limits', () => {
  for (const file of ['WEB_PUBLISH/assets/akademia-serwisanta-fix41.js','WEB_PUBLISH/assets/akademia-serwisanta-fix41.css']) {
    assert.ok(fs.statSync(path.join(ROOT, file)).size < 25 * 1024 * 1024, `${file} exceeds deployment limit`);
  }
});

process.stdout.write(`\nFIX41 REGRESSION: ${passed}/${passed} PASS\n`);
