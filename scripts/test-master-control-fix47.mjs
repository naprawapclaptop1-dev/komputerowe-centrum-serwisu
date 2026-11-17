import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const runtime = read('WEB_PUBLISH/assets/master-control-fix47.js');
const css = read('WEB_PUBLISH/assets/master-control-fix47.css');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const sw = read('WEB_PUBLISH/service-worker.js');
const build = '6.8.0-fix51-visual-academy-pro-20261105';
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }

const storage = new Map();
const page = { dataset: {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
const stage = { innerHTML: '', addEventListener() {}, querySelectorAll() { return []; } };
const status = { textContent: '', classList: { toggle() {} } };
const viewIds = ['home','courses','diagnostics','repairs','tools','methods','components','labplus','media','library','checklists','pdfsearch','online','cloudchat','community','account','support','legal','repairmaster','ultimate3d','admin','knowledge','measurementpro','modelcenter','masterworkshop','practicepro','learnpro','fix43','feedback','fix44','fix45','fix47'];
const views = viewIds.map(id => ({ id, dataset: { sectionLabel: `Widok ${id}` } }));
const nav = viewIds.map(view => ({ dataset: { view }, getAttribute() { return null; }, closest() { return null; } }));
const meta = { content: build };
const documentMock = {
  getElementById(id) { if (id === 'view-fix47') return page; if (id === 'f47Stage') return stage; if (id === 'f47Status') return status; return views.find(x => `view-${x.id}` === id) || null; },
  querySelector(selector) { return selector === 'meta[name="academy-build"]' ? meta : null; },
  querySelectorAll(selector) { if (selector === '.view-section') return views; if (selector === '.nav-item[data-view], [data-nav]') return nav; return []; },
  createElement() { return { click() {}, remove() {}, set href(value) {}, set download(value) {} }; },
  body: { appendChild() {} }
};
const context = {
  window: {}, document: documentMock,
  localStorage: { getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
  navigator: { onLine: true, userAgent: 'FIX47 Test', storage: { estimate: async () => ({ usage: 1024, quota: 1048576 }) } },
  location: { href: 'https://academy.example/', origin: 'https://academy.example' },
  fetch: async () => ({ ok: true, status: 200, json: async () => ({ build }) }),
  Blob, URL, Intl, Date, Math, Number, String, JSON, Object, Array, Map, Set, RegExp, Error, Promise, Uint8Array, ArrayBuffer, DataView, FormData: class {}, AbortController, setTimeout, clearTimeout, console
};
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'master-control-fix47.js', timeout: 5000 });
const api = context.window.NP_NAUKA_FIX47;

await check('FIX47 runtime initializes and exposes the public API', () => { assert.ok(api); assert.equal(api.build, '6.8.0-fix47'); assert.ok(stage.innerHTML.includes('Wszystko pod kontrolą')); });
await check('All ten workspaces are registered', () => { assert.equal(api.tabs.length, 10); for (const tab of ['overview','quality','inbox','projects','compatibility','mentor','service','courses','updates','guardian']) assert.ok(api.tabs.includes(tab)); });
await check('Release metadata and HTML identify the same FIX47 build', () => { assert.equal(release.release, '6.8.0'); assert.equal(release.build, build); assert.ok(html.includes(`academy-build" content="${build}`)); });
await check('New FIX47 navigation and view are separate from previous panels', () => { assert.ok(html.includes('id="view-fix47"')); assert.ok(html.includes('data-view="fix47"')); assert.ok(html.includes("'fix47'")); for (const key of ['fix43','feedback','fix44','fix45']) assert.ok(html.includes(`id="view-${key}"`)); });
await check('FIX47 JavaScript and CSS are included by HTML', () => { assert.ok(html.includes('master-control-fix47.js?v=6.8.0-fix47')); assert.ok(html.includes('master-control-fix47.css?v=6.8.0-fix47')); for (const token of ['.f47-page-head','.f47-tabs','.f47-grid','.f47-check-list','.f47-project-list','@media']) assert.ok(css.includes(token)); });
await check('PWA cache includes FIX47 assets and a unique build marker', () => { assert.ok(sw.includes('master-control-fix47.js')); assert.ok(sw.includes('master-control-fix47.css')); assert.ok(sw.includes('fix47-master-control-center-20261104')); });
await check('Compatibility evaluator accepts matching socket and memory with PSU headroom', () => { const result = api.compatibility({ cpuSocket:'AM5', boardSocket:'am5', ramType:'DDR5', boardRamType:'ddr5', estimatedW:400, psuW:750 }); assert.equal(result.knownFailures, 0); assert.equal(result.compatible, true); assert.ok(result.items.every(x => x.status === 'pass')); });
await check('Compatibility evaluator catches socket and RAM-generation conflicts', () => { const result = api.compatibility({ cpuSocket:'AM4', boardSocket:'AM5', ramType:'DDR4', boardRamType:'DDR5', estimatedW:600, psuW:650 }); assert.equal(result.knownFailures, 2); assert.equal(result.compatible, false); assert.ok(result.items.some(x => x.status === 'fail')); });
await check('Unknown compatibility data is not falsely certified', () => { const result = api.compatibility({}); assert.equal(result.compatible, false); assert.ok(result.items.every(x => x.status === 'unknown')); });
await check('Compatibility power margin is calculated with 25 percent reserve', () => { const low = api.compatibility({ cpuSocket:'LGA1700', boardSocket:'LGA1700', ramType:'DDR5', boardRamType:'DDR5', estimatedW:500, psuW:550 }); assert.equal(low.items.find(x => x.key === 'psu').status, 'warn'); });
await check('Learning coach returns a topic-matched training path', () => { const plan = api.mentorPlan({ topic:'Laptop nie uruchamia się / zasilanie', level:'Średni' }); assert.equal(plan.title, 'Diagnostyka zasilania'); assert.equal(plan.nav, 'fix43'); assert.ok(plan.steps.length >= 3); });
await check('Learning coach rejects empty topics and discloses rule-based behavior', () => { assert.throws(() => api.mentorPlan({ topic:' ' }), /Wpisz temat/); assert.match(api.mentorPlan({ topic:'nowy temat' }).disclaimer, /lokalnych reguł/); });
await check('Local service order validates required device and symptom fields', () => { assert.throws(() => api.addOrder({ issue:'brak obrazu' }), /Podaj model/); assert.throws(() => api.addOrder({ device:'Laptop' }), /Opisz zgłoszony objaw/); });
await check('Local service order persists a minimal, non-personal record', () => { const row = api.addOrder({ ref:'SRV-TEST', device:'ThinkPad EDU', issue:'brak obrazu', estimate:250, customerName:'Nie powinno być przechowane' }); assert.equal(row.ref, 'SRV-TEST'); assert.equal(row.estimate, 250); assert.equal(api.getState().orders.length, 1); assert.equal(JSON.stringify(api.getState()).includes('customerName'), false); });
await check('Order workflow accepts known statuses and rejects unknown statuses', () => { const row = api.getState().orders[0]; assert.equal(api.updateOrder(row.id, 'W diagnozie').status, 'W diagnozie'); assert.throws(() => api.updateOrder(row.id, 'Wysłane do klienta'), /Nieprawidłowy status/); });
await check('Practical project completion stores a bounded result', () => { const row = api.completeProject('no-power', 140); assert.equal(row.done, true); assert.equal(row.score, 100); assert.throws(() => api.completeProject('missing', 100), /Nieznany projekt/); });
await check('Practical project catalog contains complete training scenarios', () => { const projects = api.projectCatalog(); assert.ok(projects.length >= 8); assert.ok(projects.every(p => p.title && p.steps.length >= 3)); });
await check('Learning plan requires a title and persists locally', () => { assert.throws(() => api.addCoursePlan({}), /Podaj nazwę planu lub grupy/); const row = api.addCoursePlan({ title:'Podstawy diagnostyki', target:'Odczyt schematów', level:'Średni' }); assert.equal(row.kind, 'plan'); assert.equal(row.level, 'Średni'); assert.equal(api.getState().coursePlans.length, 1); });
await check('Training groups store a bounded headcount without student personal data', () => { const row = api.addCoursePlan({ kind:'group', title:'Grupa elektroniki A', target:'Diagnostyka zasilania', level:'Zaawansowany', participants:700, studentNames:['Anna'] }); assert.equal(row.kind, 'group'); assert.equal(row.participants, 500); assert.equal(JSON.stringify(row).includes('studentNames'), false); assert.equal(api.getState().coursePlans.length, 2); });
await check('Static quality checks inspect navigation and core views', () => { const rows = api.runStaticChecks(documentMock); assert.ok(rows.some(x => /unikalne identyfikatory/i.test(x.name))); assert.ok(rows.some(x => /nawigacja/i.test(x.name))); assert.ok(rows.every(x => x.ok), JSON.stringify(rows.filter(x => !x.ok))); });
await check('Backup export includes local records but never auth tokens', () => { const backup = api.exportBackupObject(); assert.equal(backup.build, '6.8.0-fix47'); assert.equal(backup.data.orders.length, 1); const tokenKeys = value => value && typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => (/token|secret|password|authorization/i.test(key) ? [key] : tokenKeys(child))) : []; assert.deepEqual(tokenKeys(backup), []); });
await check('Runtime does not implement production deploy, D1 mutation or hardware output', () => { assert.ok(runtime.includes('/api/admin/site-feedback')); assert.ok(runtime.includes('credentials: \'same-origin\'')); assert.ok(!runtime.includes('navigator.serial.getWriter')); assert.ok(!runtime.includes('pages deploy')); assert.ok(!runtime.includes('wrangler d1')); });
await check('Existing admin feedback API is reused and does not create an extra D1 route', () => { const apiSource = read('functions/api/admin/site-feedback.js'); assert.ok(apiSource.includes('checkAdmin')); assert.ok(apiSource.includes('sameOrigin')); assert.ok(apiSource.includes('in_review')); assert.ok(!fs.existsSync(path.join(ROOT, 'migrations/0018_fix47.sql'))); });
await check('Runtime remains usable when browser storage is blocked', () => { const blockedContext = { window:{}, document:documentMock, localStorage:{ getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); }, removeItem(){ throw new Error('blocked'); } }, navigator:{ onLine:true, userAgent:'blocked-storage-test', storage:{ estimate:async()=>({usage:0,quota:0}) } }, location:{ href:'https://academy.example/', origin:'https://academy.example' }, fetch:async()=>({ ok:true, status:200, json:async()=>({ build }) }), Blob, URL, Intl, Date, Math, Number, String, JSON, Object, Array, Map, Set, RegExp, Error, Promise, Uint8Array, ArrayBuffer, DataView, FormData:class {}, AbortController, setTimeout, clearTimeout, console }; vm.createContext(blockedContext); assert.doesNotThrow(() => vm.runInContext(runtime, blockedContext, { filename:'master-control-fix47-blocked-storage.js', timeout:5000 })); assert.ok(blockedContext.window.NP_NAUKA_FIX47); });

console.log(`\nFIX47 MASTER CONTROL CENTER: ${passed}/${passed} PASS`);
