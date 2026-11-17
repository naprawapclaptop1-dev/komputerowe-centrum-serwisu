import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const build = '6.8.0-fix51-visual-academy-pro-20261105';
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/nauka-centrum-fix40.js');
const css = read('WEB_PUBLISH/assets/nauka-centrum-fix40.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));

assert.equal(release.release, '6.8.0');
assert.equal(release.build, build);

// Check the actual 30 source files included in the offline document library.
const academyDataContext = vm.createContext({ window: {} });
for (const dataFile of [
  'academy-data.js', 'academy-expansion.js', 'academy-ultra-lessons.js',
  'academy-ultra-lessons-2.js', 'academy-ultra-lessons-3.js',
  'academy-ultimate-lessons-600.js', 'academy-master-lessons-610.js',
  'service-workshop-data.js', 'component-encyclopedia.js', 'device-model-catalog.js'
]) vm.runInContext(read(`WEB_PUBLISH/assets/${dataFile}`), academyDataContext, { filename: dataFile });
const libraryCatalog = academyDataContext.window.ACADEMY_DATA?.library;
assert.ok(Array.isArray(libraryCatalog), 'FIX40 offline document cache needs the source library catalog');
assert.equal(libraryCatalog.length, 30, 'FIX40 should offer all 30 documented library files');
for (const document of libraryCatalog) {
  assert.ok(typeof document.path === 'string' && document.path.startsWith('Biblioteka/'), `invalid offline document path: ${document.id}`);
  const resolved = path.resolve(root, 'WEB_PUBLISH', document.path);
  assert.ok(resolved.startsWith(path.resolve(root, 'WEB_PUBLISH', 'Biblioteka') + path.sep), `offline document path escapes Biblioteka: ${document.path}`);
  assert.ok(fs.existsSync(resolved), `offline document source is missing: ${document.path}`);
}
assert.match(html, new RegExp(build));
assert.ok(html.includes('assets/nauka-centrum-fix40.js?v=6.8.0-fix40'));
assert.ok(html.includes('assets/nauka-centrum-fix40.css?v=6.8.0-fix40'));
assert.ok(html.includes("'learnpro'") || html.includes('learnpro'));

const panes = ['dashboard', 'search', 'bench', 'exams', 'atlas', 'offline', 'reports'];
for (const pane of panes) assert.ok(html.includes(`data-l40-pane="${pane}"`), `missing pane ${pane}`);
for (const id of [
  'view-learnpro', 'l40ContinueCard', 'l40BookmarkList', 'l40SearchForm', 'l40BenchCase',
  'l40ExamPicker', 'l40CertificateList', 'l40AtlasResults', 'l40BoardForm',
  'l40ExportOfflineHtml', 'l40OfflineImport', 'l40CacheDocuments', 'l40OfflineDocsStatus', 'l40ReportForm', 'l40ReportFromPractice',
  'l40ReportHistory'
]) assert.ok(html.includes(`id="${id}"`), `missing UI element ${id}`);
for (const marker of [
  'makeOfflinePackage', 'validateOfflinePackage', 'qrSvg', 'evaluateExam', 'cacheLibraryForOffline', 'fillReportFromLastPractice',
  'runBenchCheck', 'ACADEMY_FREE_CHAT?.search', 'ACADEMY_OPEN_SOURCE', 'educationalOnly'
]) assert.ok(runtime.includes(marker), `runtime marker missing ${marker}`);
for (const marker of ['.l40-hero', '.l40-tabs', '.l40-pane', '.l40-atlas-grid', '.l40-report-form', '@media']) {
  assert.ok(css.includes(marker), `CSS marker missing ${marker}`);
}
assert.ok(sw.includes('nauka-centrum-fix40.js'));
assert.ok(sw.includes('nauka-centrum-fix40.css'));
assert.ok(sw.includes("url.pathname.startsWith('/Biblioteka/')"), 'PWA must cache the local document library after the user requests offline download');
assert.ok(sw.includes('fix40-learning-center-20261104'));
assert.ok(sw.includes('fix39-support-community-guard-20261104'), 'FIX39 PWA compatibility marker must remain');

// Execute the production module without running DOM initialization. This exercises its real exports.
const rootElement = { dataset: {} };
const store = new Map([
  ['academyBookmarks', JSON.stringify(['LESSON-OLD'])],
  ['npNaukaCentrumFix40', JSON.stringify({ version:1, bookmarks:['LESSON-SAVED'], boards:[{ id:'B-LOCAL', brand:'Example', model:'Model X1', boardId:'NM-A123', revision:'REV 1.2', source:'OEM document page 4', verified:false }] })]
]);
const mockDocument = {
  readyState: 'loading',
  getElementById(id) { return id === 'view-learnpro' ? rootElement : null; },
  addEventListener() {}
};
const mockWindow = {};
const mockLocalStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};
const context = vm.createContext({
  document: mockDocument,
  window: mockWindow,
  localStorage: mockLocalStorage,
  TextEncoder,
  console,
  URL,
  Blob,
  StorageEvent: class StorageEvent {}
});
vm.runInContext(runtime, context, { filename: 'nauka-centrum-fix40.js' });
const api = mockWindow.NP_NAUKA_FIX40;
assert.ok(api, 'FIX40 runtime must expose its integration API');
assert.equal(api.schema, 'NAUKA_OD_A_DO_Z_FIX40_OFFLINE');

// Exercise the offline export against the real, fully assembled source catalogs.
mockWindow.ACADEMY_DATA = academyDataContext.window.ACADEMY_DATA;
mockWindow.ACADEMY_REPAIR_METHODS = academyDataContext.window.ACADEMY_REPAIR_METHODS;
mockWindow.ACADEMY_COMPONENTS = academyDataContext.window.ACADEMY_COMPONENTS;
mockWindow.ACADEMY_DEVICE_CATALOG = academyDataContext.window.ACADEMY_DEVICE_CATALOG;
const realOfflinePack = api.makeOfflinePackage();
assert.equal(realOfflinePack.lessons.length, 1060, 'OFFLINE PRO must contain the full 1060-lesson course catalog');
assert.equal(realOfflinePack.faults.length, 155, 'OFFLINE PRO must contain the existing fault cases');
assert.equal(realOfflinePack.methods.length, 147, 'OFFLINE PRO must contain the existing repair procedure catalog');
assert.equal(realOfflinePack.components.length, 292, 'OFFLINE PRO must contain the existing component catalog');
assert.equal(realOfflinePack.documents.length, 30, 'OFFLINE PRO must contain all library document metadata');
const realOfflinePackBytes = Buffer.byteLength(JSON.stringify(realOfflinePack));
assert.ok(realOfflinePackBytes < 25 * 1024 * 1024, 'full offline JSON package must remain below the 25 MB import guard');

api.mergeLegacyBookmarks();
assert.deepEqual(Array.from(api.getState().bookmarks).sort(), ['LESSON-OLD','LESSON-SAVED'].sort(), 'FIX40 must merge old synced bookmarks without dropping local bookmarks');

mockWindow.ACADEMY_DATA = {
  courseLessons: [{ id: 'LESSON-1', title: 'Test lesson', steps: ['step-a', 'step-b'] }],
  faults: [{ id: 'FAULT-1', title: 'No POST', steps: ['inspect LED', 'check RAM'], refs: ['OEM manual'] }]
};
mockWindow.ACADEMY_REPAIR_METHODS = [{ id: 'METHOD-1', name: 'Safe check', procedure: ['step 1', 'step 2'] }];
mockWindow.ACADEMY_COMPONENTS = { components: [{ id: 'COMP-1', name: 'MOSFET', symptoms: ['short', 'overheat'] }] };
mockWindow.ACADEMY_DEVICE_CATALOG = { brands: [{ brand: 'Example', models: [['Series X', 'Model X1', 'laptop']], families: [] }] };
mockWindow.ACADEMY_DATA.library = [{ id:'DOC-1', title:'OEM PDF', category:'Manual', type:'PDF', path:'Biblioteka/oem.pdf', bytes:1024, description:'Source manual' }];

const pack = api.makeOfflinePackage();
assert.equal(pack.schema, api.schema);
assert.equal(pack.lessons.length, 1);
assert.equal(pack.faults.length, 1);
assert.equal(pack.methods.length, 1);
assert.equal(pack.components.length, 1);
assert.equal(pack.boards.length, 2, "OFFLINE PRO must include both model catalog entries and the user saved Board ID records");
assert.equal(pack.documents.length, 1);
assert.ok(pack.boards.some(x => x.boardId === 'NM-A123' && x.recordType === 'local-board'));
assert.deepEqual(Array.from(pack.faults[0].steps), ['inspect LED', 'check RAM']);

const serialized = JSON.stringify(pack);
const imported = api.validateOfflinePackage(serialized);
assert.equal(imported.lessons.length, 1);
assert.deepEqual(Array.from(imported.faults[0].steps), ['inspect LED', 'check RAM'], 'nested procedure arrays must survive OFFLINE PRO import');
assert.deepEqual(Array.from(imported.methods[0].procedure), ['step 1', 'step 2']);
assert.equal(imported.documents[0].path, 'Biblioteka/oem.pdf');
assert.ok(imported.boards.some(x => x.boardId === 'NM-A123'), 'private atlas Board ID must survive import/export');
assert.throws(() => api.validateOfflinePackage('{broken'), /poprawnym JSON/i);
assert.throws(() => api.validateOfflinePackage({ schema: 'other', schemaVersion: 1, lessons: [{ id: 1 }] }), /Nieobsługiwany format/i);
assert.throws(() => api.validateOfflinePackage({ schema: api.schema, schemaVersion: 1, lessons: [] }), /liczbę rekordów|nie zawiera poprawnych rekordów/i);
const hostile = api.validateOfflinePackage({
  schema: api.schema, schemaVersion: 1,
  lessons: [{ id: 'safe', steps: ['one'], nested: { ok: true, constructor: 'blocked', '__proto__': 'blocked' } }]
});
assert.deepEqual(Array.from(hostile.lessons[0].steps), ['one']);
assert.equal(Object.hasOwn(hostile.lessons[0].nested, 'constructor'), false);
assert.equal(Object.hasOwn(hostile.lessons[0].nested, '__proto__'), false);

const qr = api.qrSvg('AZ40ABCDEF012345');
assert.ok(qr.startsWith('<svg'));
assert.ok(qr.includes('viewBox="0 0 29 29"'));
assert.ok((qr.match(/<rect x=/g) || []).length > 100, 'QR output must contain a populated matrix');
assert.ok(api.qrSvg('A'.repeat(18)).includes('kod za długi'), 'QR must reject text over the version 1-L byte capacity');
const qrRects = new Set(Array.from(qr.matchAll(/<rect x="(\d+)" y="(\d+)" width="1" height="1"\/>/g), m => `${Number(m[1])-4},${Number(m[2])-4}`));
const formatA = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
const expectedFormatBits = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
formatA.forEach(([r,c], i) => assert.equal(qrRects.has(`${c},${r}`), expectedFormatBits[i] === 1, `QR format bit ${i} must follow the QR specification`));
const exam75 = api.evaluateExam('safe-service', {0:1,1:0,2:2,3:1,4:2,5:0,6:0,7:1});
assert.equal(exam75.complete, true);
assert.equal(exam75.percent, 75);
assert.equal(exam75.passed, true, 'exam threshold is inclusive at 75%');
assert.equal(api.evaluateExam('safe-service', {0:1}).complete, false, 'exam cannot be submitted with unanswered questions');

// The training simulator must explicitly reject a missing answer (empty string must not coerce to option 0).
assert.ok(runtime.includes("if (selectedRaw === null)"));
assert.ok(runtime.includes("return selected ? selected.dataset.benchOption : null"));
assert.ok(runtime.includes('Najpierw wybierz odpowiedź'));
assert.ok(runtime.includes('Wstaw ostatnie zapisane ćwiczenie') || runtime.includes('fillReportFromLastPractice'));
assert.ok(runtime.includes('Wybierz „Zapisz jako PDF”') || runtime.includes('Zapisz jako PDF'));

for (const file of ['ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js']) {
  const source = read(file);
  assert.ok(source.includes('nauka-centrum-fix40.js'), `${file} must guard FIX40 script publication`);
  assert.ok(source.includes('nauka-centrum-fix40.css'), `${file} must guard FIX40 style publication`);
  assert.ok(source.includes('test-nauka-centrum-fix40.mjs'), `${file} must require FIX40 regression tests`);
  assert.ok(source.includes('cacheLibraryForOffline') && source.includes('l40CacheDocuments'), `${file} must guard offline document caching`);
}

console.log(`PASS FIX40: seven modules; offline package ${realOfflinePack.lessons.length} lessons/${realOfflinePack.faults.length} cases/${realOfflinePack.methods.length} procedures/${realOfflinePack.components.length} components/${realOfflinePack.documents.length} docs (${realOfflinePackBytes} B); 30 source files; legacy bookmarks; atlas round-trip; simulator input; 75% exam; QR; and publication guards.`);
