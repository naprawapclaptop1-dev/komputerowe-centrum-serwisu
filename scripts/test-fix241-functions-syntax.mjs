import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = process.cwd();
const functionsRoot = path.join(root, 'functions');
const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return collect(full);
  return entry.isFile() && entry.name.endsWith('.js') ? [full] : [];
});
const files = collect(functionsRoot).sort();
assert.ok(files.length >= 50, `Oczekiwano co najmniej 50 funkcji Pages, wykryto ${files.length}`);
let checked = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.error || result.status !== 0) {
    throw new Error(`Niepoprawna składnia ${path.relative(root, file)}:\n${result.stderr || result.stdout || result.error?.message || `kod ${result.status}`}`);
  }
  checked++;
}

const guardianPath = path.join(functionsRoot, 'api', 'guardians.js');
const guardian = fs.readFileSync(guardianPath, 'utf8');
assert.ok(guardian.includes('status=\'completed\' THEN 1 ELSE 0 END'), 'brak bezpiecznie cytowanego statusu completed');
assert.ok(guardian.includes('VALUES(?,?,?,\'pending\',?,NULL)'), 'brak poprawnie cytowanego statusu pending w INSERT');
assert.ok(guardian.includes('status=\'pending\'`') || guardian.includes("status='pending'\")"), 'brak poprawnie cytowanego statusu pending w UPDATE');
assert.ok(guardian.includes("status='revoked'"), 'brak poprawnie cytowanego statusu revoked');

for (const publisher of ['ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js']) {
  const source = fs.readFileSync(path.join(root, publisher), 'utf8');
  assert.ok(source.includes('scripts/test-fix241-functions-syntax.mjs'), `${publisher} nie wymaga testu składni funkcji Pages`);
  assert.ok(source.includes('academyFix241'), `${publisher} nie weryfikuje metadanych FIX241`);
  const check = spawnSync(process.execPath, ['--check', path.join(root, publisher)], { encoding: 'utf8', windowsHide: true });
  assert.equal(check.status, 0, `${publisher}: ${check.stderr}`);
}
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
assert.equal(release.academyFix241?.hotfix, 'FIX241');
assert.equal(release.academyFix241?.productVersion, '6.8.0');
assert.equal(release.academyFix241?.pagesDeployPerformed, false);

console.log(`[PASS] Node --check wszystkich ${checked} plików JavaScript Cloudflare Pages`);
console.log('[PASS] SQL w guardians.js ma poprawne literały statusów i składnię JavaScript');
console.log('[PASS] OneClick wymaga testu składni funkcji przed publikacją');
console.log('[PASS] Auto Publisher Watcher wymaga testu składni funkcji przed publikacją');
console.log('[PASS] metadane FIX241 zachowują produkt 6.8.0 i nie deklarują publikacji');
console.log('FIX241 PAGES FUNCTIONS SYNTAX PREFLIGHT: 5/5 PASS');
