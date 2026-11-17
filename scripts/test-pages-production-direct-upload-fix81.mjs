import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { buildProductionDirectUploadArgs, assertProductionDirectUploadArgs } = require('./pages-production-direct-upload-fix81.cjs');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const oneclick = read('ONECLICK_AKADEMIA.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

const legacyArgs = buildProductionDirectUploadArgs({
  directory: path.join(ROOT, 'WEB_PUBLISH'),
  projectName: 'naprawa-pc-akademia-serwisu-pro',
  commitMessage: 'Archiwalny kontrakt FIX81 — bez zmian w zachowaniu historycznym'
});

check('FIX81 historyczny helper pozostaje zachowany jako nieaktywny kontrakt archiwalny', () => {
  assert.equal(legacyArgs[0], 'pages');
  assert.equal(legacyArgs[1], 'deploy');
  assert.equal(legacyArgs[legacyArgs.indexOf('--project-name') + 1], 'naprawa-pc-akademia-serwisu-pro');
  assert.ok(!legacyArgs.includes('--branch'));
  assertProductionDirectUploadArgs(legacyArgs);
});
check('Archiwalna blokada FIX81 nadal odrzuca flagę preview i env preview', () => {
  assert.throws(() => assertProductionDirectUploadArgs([...legacyArgs, '--branch', 'preview']), /preview/);
  assert.throws(() => assertProductionDirectUploadArgs([...legacyArgs, '--branch=preview']), /preview/);
  assert.throws(() => assertProductionDirectUploadArgs([...legacyArgs, '--env', 'preview']), /preview/);
});
check('Aktywny watcher nie korzysta już z historycznego helpera FIX81', () => {
  assert.ok(!watcher.includes("require('./scripts/pages-production-direct-upload-fix81.cjs')"));
  assert.ok(watcher.includes("require('./scripts/pages-production-branch-fix85.cjs')"));
});
check('OneClick i watcher uruchamiają nowy test kierowania na Production Branch FIX85', () => {
  assert.ok(oneclick.includes("'scripts/test-pages-production-branch-fix85.mjs'"));
  assert.ok(watcher.includes("'scripts/test-pages-production-branch-fix85.mjs'"));
});
check('Kontrakt wykrywania projektu Direct Upload zachowuje kontrolę Git Provider', () => {
  assert.ok(watcher.includes("const gitProvider = rowValue(found, ['git_provider', 'gitProvider', 'Git Provider'])"));
  assert.ok(watcher.includes("PAGES_PROJECT_MODE = 'DIRECT_UPLOAD'"));
  assert.ok(watcher.includes('await verifyProjectBranch(found)'));
});
console.log(`FIX81 LEGACY CONTRACT: ${checks.length}/${checks.length} PASS`);
