import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import migrationCore from './migration-audit-core-fix49.cjs';
import securityCore from './security-audit-core-fix49.cjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const runtime = read('WEB_PUBLISH/assets/ultimate-quality-fix49.js');
const html = read('WEB_PUBLISH/index.html');
const css = read('WEB_PUBLISH/assets/ultimate-quality-fix49.css');
const sw = read('WEB_PUBLISH/service-worker.js');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }

check('FIX49 markup, tabs and assets are linked into the app', () => {
  assert.ok(html.includes('id="view-fix49"'));
  assert.ok(html.includes('data-view="fix49"'));
  for (const tab of ['overview','browser','errors','release','staging','rollback','migrations','security','bundle','practice']) assert.ok(html.includes(`data-f49-tab="${tab}"`));
  assert.ok(html.includes('ultimate-quality-fix49.js?v=6.8.0-fix49'));
  assert.ok(html.includes('ultimate-quality-fix49.css?v=6.8.0-fix49'));
  for (const selector of ['.f49-page-head','.f49-tabs','.f49-grid','.f49-status','.f49-check']) assert.ok(css.includes(selector));
  assert.ok(sw.includes('fix49-ultimate-quality-20261104') && sw.includes('release-contract-fix49.json'));
});

const listeners = {};
const stage = { innerHTML: '' };
const status = { textContent: '', classList: { toggle() {} } };
const pageListeners = {};
const page = { addEventListener(type, cb) { pageListeners[type] = cb; }, querySelectorAll() { return []; }, querySelector() { return null; } };
const elements = new Map([['view-fix49', page], ['f49Stage', stage], ['f49Status', status]]);
const storage = new Map();
const doc = {
  getElementById(id) { return elements.get(id) || null; },
  querySelector() { return { content: '6.8.0-fix51-visual-academy-pro-20261105' }; },
  querySelectorAll() { return []; },
  get documentElement() { return { outerHTML: '<html><meta name="academy-build" content="6.8.0-fix51-visual-academy-pro-20261105"></html>' }; },
  createElement() { return { click() {}, remove() {}, set href(v) {}, set download(v) {} }; },
  body: { appendChild() {} }
};
const context = {
  window: { addEventListener(type, cb) { listeners[type] = cb; } },
  document: doc,
  localStorage: { getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, String(value)); }, removeItem(key) { storage.delete(key); } },
  navigator: { onLine: true, userAgent: 'FIX49 test browser', language: 'pl-PL', clipboard: { writeText: async () => {} } },
  location: { pathname: '/', origin: 'https://example.test', href: 'https://example.test/' },
  fetch: async url => ({ ok: true, status: 200, json: async () => ({ release: '6.8.0', build: '6.8.0-fix51-visual-academy-pro-20261105' }), text: async () => read('WEB_PUBLISH/service-worker.js') }),
  Blob, URL, FormData: class {}, Intl, Date, Math, Number, String, JSON, Object, Array, Map, Set, RegExp, Error, Promise, Uint8Array, ArrayBuffer, DataView, AbortController, setTimeout, clearTimeout, console
};
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'ultimate-quality-fix49.js', timeout: 5000 });
const api = context.window.NP_NAUKA_FIX49;
check('Runtime initializes the ten quality workspaces', () => { assert.ok(api); assert.equal(api.build, '6.8.0-fix49'); assert.equal(api.tabs.length, 10); assert.ok(stage.innerHTML.includes('Jedna kontrola')); });
check('Browser smoke test detects duplicate IDs and missing navigation targets', () => {
  const sample = { querySelectorAll(selector) {
    if (selector === '[id]') return [{ id:'dup' }, { id:'dup' }];
    if (selector === '.view-section[id]') return [{ id:'view-home' }];
    if (selector === '.nav-item[data-view]') return [{ dataset:{ view:'missing' } }];
    if (selector === 'button') return [{ textContent:'', getAttribute(){ return null; } }];
    if (selector.includes('input') || selector.includes('select') || selector.includes('textarea') || selector === 'a[target="_blank"]' || selector === 'a[href]') return [];
    return [];
  }, getElementById(){ return null; }, querySelector(){ return null; }};
  const checks = api.runBrowserSmoke(sample);
  assert.ok(checks.some(x => x.name.includes('powtórzonych') && !x.ok));
  assert.ok(checks.some(x => x.name.includes('nawigacji') && !x.ok));
});
check('Migration simulator marks destructive SQL and never executes it', () => {
  const result = api.analyzeMigrationSql('CREATE TABLE x(id INTEGER); DELETE FROM users;');
  assert.equal(result.executed, false); assert.equal(result.safeForAutomaticApply, false); assert.ok(result.findings.some(x => x.severity === 'critical'));
  const safe = api.analyzeMigrationSql('ALTER TABLE users ADD COLUMN note TEXT DEFAULT \'\';');
  assert.equal(safe.safeForAutomaticApply, true); assert.equal(safe.executed, false);
  const upsert = migrationCore.analyzeMigrationSql('INSERT INTO visits(day,visits) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET visits=visits+1;');
  assert.equal(upsert.safeForAutomaticApply, true, 'UPSERT DO UPDATE nie jest UPDATE bez WHERE.');
});
check('Migration core catches critical and high-risk patterns', () => {
  const result = migrationCore.analyzeMigrationSql('DROP TABLE users; UPDATE accounts SET active=0; DELETE FROM logs WHERE created_at < 1;');
  assert.equal(result.safeForAutomaticApply, false);
  assert.ok(result.findings.some(x => x.rule === 'DROP_TABLE'));
  assert.ok(result.findings.some(x => x.rule === 'UPDATE_WITHOUT_WHERE'));
});
check('Staging plan blocks production branch and requires isolated D1 plus preview secrets', () => {
  assert.throws(() => api.createStagingPlan({ branch:'main', isolatedD1:true, previewSecrets:true }), /bezpieczną nazwę/);
  const blocked = api.createStagingPlan({ branch:'preview-qa' });
  assert.equal(blocked.ready, false);
  const ready = api.createStagingPlan({ branch:'preview-fix49', isolatedD1:true, previewSecrets:true });
  assert.equal(ready.ready, true);
});
check('Rollback is a plan only and code-only by default', () => {
  assert.throws(() => api.createRollbackPlan({ deployment:'' }), /Podaj identyfikator/);
  const plan = api.createRollbackPlan({ deployment:'https://example.pages.dev' });
  assert.equal(plan.executed, false); assert.equal(plan.scope, 'code-only');
});
check('Security core flags secret literals without returning secret values', () => {
  const findings = securityCore.scanText('test.js', 'const OPENAI_API_KEY = "' + 'sk-' + 'abcdefghijklmnopqrstuvwxyz0123456789' + '";');
  assert.equal(findings.length, 1); assert.equal(findings[0].rule, 'OPENAI_SECRET_VALUE');
  assert.equal(JSON.stringify(findings).includes('sk-abcdefghijklmnopqrstuvwxyz'), false);
});
check('Security source scanner ignores docs and dependency directories', () => {
  assert.equal(securityCore.isExcluded('node_modules/pkg/a.js'), true);
  assert.equal(securityCore.isExcluded('README_TEST.txt'), true);
  assert.equal(securityCore.isExcluded('functions/api/health.js'), false);
});
check('Error center redacts secrets and stores only bounded messages', () => {
  listeners.error({ message:'Token sk-abcdefghijklmnopqrstuvwxyz0123456789 leaked', filename:'https://example.test/app.js?token=secret' });
  const errors = api.getErrorLog();
  assert.ok(errors.length >= 1); assert.ok(!JSON.stringify(errors).includes('sk-abcdefghijklmnopqrstuvwxyz')); assert.ok(!JSON.stringify(errors).includes('token=secret'));
});
check('Diagnostic bundle excludes auth data and free-form form content', () => {
  const bundle = api.buildDiagnosticBundle();
  assert.equal(bundle.fix, 'FIX49'); assert.ok(bundle.scope.includes('Bez haseł'));
  assert.ok(!JSON.stringify(bundle).includes('OPENAI_API_KEY'));
});
check('Practice room creates a local code and discloses lack of live sync', () => {
  assert.throws(() => api.createPracticeRoom({ topic:' ' }), /Wpisz temat/);
  const room = api.createPracticeRoom({ topic:'Diagnoza laptopa' });
  assert.match(room.code, /^[A-Z0-9]{6}$/); assert.match(room.note, /wymaga osobnego backendu/);
});
check('Shared release gate stays blocked until all required audits pass', () => {
  const gate = api.runReleaseGateSummary([{ ok:true }], { failed:0 }, { failed:0 }, { safeForAutomaticApply:false });
  assert.equal(gate.ready, false);
});
check('API exposes required operations and does not execute production actions', () => {
  for (const key of ['runBrowserSmoke','getErrorLog','analyzeMigrationSql','runSecurityAudit','buildDiagnosticBundle','createStagingPlan','createRollbackPlan','runReleaseGate','createPracticeRoom']) assert.equal(typeof api[key], 'function');
  assert.ok(!runtime.includes('wrangler d1 execute')); assert.ok(!runtime.includes('pages deploy'));
});

console.log(`\nFIX49 ULTIMATE QUALITY CENTER: ${passed}/${passed} PASS`);
