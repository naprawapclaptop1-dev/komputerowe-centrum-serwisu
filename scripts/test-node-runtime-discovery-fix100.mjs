import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ps = read('scripts/resolve-node-fix101.ps1');
const resolver = read('RESOLVE_NODE_FIX101.cmd');
const legacyResolver = read('RESOLVE_NODE_FIX100.cmd');
const launcher = read('URUCHOM_AKADEMIE.cmd');
const test99 = read('WYKONAJ_TESTY_FIX99.cmd');
const test100 = read('WYKONAJ_TESTY_FIX100.cmd');
const openAi = read('USTAW_KLUCZ_OPENAI.cmd');
const gemini = read('USTAW_KLUCZ_GEMINI.cmd');
const wrangler = read('PRZYGOTUJ_WRANGLER_FIX18.cmd');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

check('FIX101 PowerShell secondary resolver searches persisted PATH and verifies real node.exe', () => {
  assert.ok(ps.includes("$env:Path"));
  assert.ok(ps.includes('HKCU:\\Environment'));
  assert.ok(ps.includes('App Paths\\node.exe'));
  assert.ok(ps.includes('& $candidate --version'));
  assert.ok(ps.includes('$LASTEXITCODE'));
});
check('Primary resolver is CMD-first and does not require PowerShell for PATH detection', () => {
  assert.ok(resolver.includes('%%~$PATH:I'));
  assert.ok(resolver.includes('where.exe" node.exe'));
  assert.ok(resolver.indexOf('Native CMD PATH resolution') < resolver.indexOf('PowerShell as a secondary resolver'));
});
check('Project-local remembered path and environment overrides are checked first', () => {
  assert.ok(resolver.includes('NODE_EXE.path'));
  assert.ok(resolver.includes('_NODE_ENV_OVERRIDE'));
  assert.ok(resolver.includes('NODE_HOME'));
  assert.ok(resolver.includes('NODEJS_HOME'));
});
check('Known Program Files, AppData, WinGet, Volta and custom folders are searched', () => {
  for (const token of ['%ProgramFiles%\\nodejs', '%ProgramFiles(x86)%\\nodejs', '%LOCALAPPDATA%\\Programs\\nodejs', 'Microsoft\\WinGet\\Links', 'C:\\tools\\nodejs', 'D:\\nodejs', '.volta\\bin']) assert.ok(resolver.includes(token));
});
check('NVM, FNM, NVS, Scoop and WinGet version directories are searched', () => {
  for (const token of ['NVM_HOME', 'FNM_DIR', 'node-versions', 'LOCALAPPDATA%\\nvs', 'scoop\\apps\\nodejs', 'OpenJS.NodeJS']) assert.ok(resolver.includes(token));
});
check('Candidate validation executes node.exe --version and accepts only semantic vX.Y.Z output', () => {
  assert.ok(resolver.includes('"%_TRY_NODE%" --version'));
  assert.ok(resolver.includes('findstr /r'));
  assert.ok(resolver.includes('^v[0-9]'));
});
check('Selected Node directory is exported to child PATH without a persistent system PATH edit', () => {
  assert.ok(resolver.includes('set "PATH=%NODE_DIR%;%PATH%"'));
  assert.ok(resolver.includes('endlocal & set "NODE_EXE=%NODE_EXE%"'));
  assert.ok(resolver.includes('systemowego PATH'));
});
check('Main publication launcher resolves Node through FIX101 before Gemini setup and OneClick', () => {
  const resolveIndex = launcher.indexOf('RESOLVE_NODE_FIX101.cmd');
  const configureIndex = launcher.indexOf('configure-gemini-secret.js');
  const publishIndex = launcher.indexOf('ONECLICK_AKADEMIA.js');
  assert.ok(resolveIndex >= 0 && resolveIndex < configureIndex && resolveIndex < publishIndex);
  assert.ok(launcher.includes('"%NODE_EXE%" "%ROOT%\\ONECLICK_AKADEMIA.js"'));
});
check('FIX99/FIX100 legacy test entrypoints forward to the FIX101 resolver and runner', () => {
  assert.ok(test99.includes('RESOLVE_NODE_FIX101.cmd'));
  assert.ok(test100.includes('WYKONAJ_TESTY_FIX101.cmd'));
  assert.ok(legacyResolver.includes('RESOLVE_NODE_FIX101.cmd'));
});
check('Gemini and Wrangler setup use the current FIX105 runtime resolver', () => {
  assert.ok(openAi.includes('USTAW_KLUCZ_GEMINI.cmd'));
  assert.ok(gemini.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(gemini.includes('configure-gemini-secret.js')); 
  assert.ok(wrangler.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(wrangler.includes('"%NODE_EXE%" "%WRANGLER_JS%" --version'));
});
check('Legacy FIX100 diagnostic shortcut forwards to the new FIX101 diagnostic', () => {
  assert.ok(read('SPRAWDZ_NODE_FIX100.cmd').includes('SPRAWDZ_NODE_FIX101.cmd'));
  assert.ok(read('SPRAWDZ_NODE_FIX101.cmd').includes('NODE_VERSION'));
});

console.log(`FIX100 NODE RUNTIME DISCOVERY COMPATIBILITY: ${checks.length}/${checks.length} PASS`);
