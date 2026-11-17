import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const cmd = read('RESOLVE_NODE_FIX105.cmd');
const ps = read('scripts/resolve-node-fix105.ps1');
const main = read('URUCHOM_AKADEMIE.cmd');
const wrapper = read('URUCHOM_NAUKE_OD_A_DO_Z.cmd');
const diagnostic = read('SPRAWDZ_NODE_FIX105.cmd');
const wrangler = read('PRZYGOTUJ_WRANGLER_FIX18.cmd');
const tests = read('WYKONAJ_TESTY_FIX105.cmd');
const cases = [];
function check(name, fn) { fn(); cases.push(name); console.log(`[PASS] ${name}`); }
check('FIX105 canonicalizes the project root without a trailing slash', () => {
  assert.ok(cmd.includes('for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"'));
  assert.ok(!cmd.includes('-Root "%~dp0"'));
});
check('FIX105 passes three explicit, non-empty absolute PowerShell paths', () => {
  assert.ok(cmd.includes('-Root "%NPA_ROOT%" -NodePathFile "%NODE_PATH_FILE%" -VersionFile "%NODE_VERSION_FILE%"'));
  assert.ok(cmd.includes('NODE_PATH_FILE=%NPA_ROOT%\\NODE_EXE.path'));
  assert.ok(cmd.includes('NODE_VERSION_FILE=%NPA_ROOT%\\NODE_EXE.version'));
});
check('FIX105 PowerShell requires and validates all explicit path arguments', () => {
  const header = ps.slice(0, ps.indexOf('$ErrorActionPreference'));
  assert.match(header, /Parameter\(Mandatory=\$true\).*?\$Root/s);
  assert.match(header, /Parameter\(Mandatory=\$true\).*?\$NodePathFile/s);
  assert.match(header, /Parameter\(Mandatory=\$true\).*?\$VersionFile/s);
  assert.ok(ps.includes('nie przekazano pelnych sciezek plikow wynikowych'));
});
check('FIX105 PowerShell writes files to explicit output targets and verifies read-back', () => {
  assert.ok(ps.includes('WriteAllText($NodePathFile, $selectedPath'));
  assert.ok(ps.includes('WriteAllText($VersionFile, $selected.Version'));
  assert.ok(ps.includes('ReadAllText($NodePathFile).Trim()'));
  assert.ok(ps.includes('ReadAllText($VersionFile).Trim()'));
  assert.ok(ps.includes('kontrola odczytu NODE_EXE.path'));
  assert.ok(ps.includes('kontrola odczytu NODE_EXE.version'));
});
check('FIX105 CMD verifies exact output files before loading them', () => {
  assert.ok(cmd.includes('if not exist "%NODE_PATH_FILE%" goto :FIX105_MISSING_PATH'));
  assert.ok(cmd.includes('if not exist "%NODE_VERSION_FILE%" goto :FIX105_MISSING_VERSION'));
  assert.ok(cmd.includes('for /f "usebackq delims=" %%A in ("%NODE_PATH_FILE%")'));
  assert.ok(cmd.includes('for /f "usebackq delims=" %%A in ("%NODE_VERSION_FILE%")'));
});
check('FIX105 emits distinct failure reasons for missing files, blank contents and invalid node.exe', () => {
  for (const marker of [':FIX105_MISSING_PATH', ':FIX105_MISSING_VERSION', ':FIX105_EMPTY_PATH', ':FIX105_EMPTY_VERSION', ':FIX105_BAD_NODE', ':FIX105_VERIFY_FAIL', ':FIX105_VERSION_MISMATCH']) assert.ok(cmd.includes(marker));
});
check('FIX105 re-runs node.exe --version and compares the version file', () => {
  assert.ok(cmd.includes('"%NODE_EXE%" --version'));
  assert.ok(cmd.includes('if not "%NPA_NODE_VERIFY%"=="%NODE_VERSION%"'));
});
check('FIX105 main publication launcher calls resolver before Gemini setup and OneClick', () => {
  const at = main.indexOf('RESOLVE_NODE_FIX105.cmd');
  assert.ok(at >= 0 && at < main.indexOf('configure-gemini-secret.js') && at < main.indexOf('ONECLICK_AKADEMIA.js'));
});
check('FIX105 Wrangler helper shares the canonical resolver', () => assert.ok(wrangler.includes('RESOLVE_NODE_FIX105.cmd')));
check('FIX105 diagnostics and test shortcut share the canonical resolver', () => {
  assert.ok(diagnostic.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(tests.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(tests.includes('run-tests-fix105.mjs'));
});
check('FIX105 startup wrapper persists a FIX105 log and always pauses', () => {
  assert.ok(wrapper.includes('START_FIX105.log'));
  assert.ok(wrapper.includes('pause'));
});
check('FIX105 keeps system PATH and registry unchanged', () => {
  assert.ok(!cmd.includes('set "PATH='));
  assert.ok(!ps.includes('SetEnvironmentVariable'));
  assert.ok(!ps.includes('Set-ItemProperty'));
});
check('FIX104 and FIX103 compatibility entrypoints route to FIX105', () => {
  assert.ok(read('RESOLVE_NODE_FIX104.cmd').includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(read('RESOLVE_NODE_FIX103.cmd').includes('RESOLVE_NODE_FIX105.cmd'));
});
console.log(`FIX105 NODE RESOLVER REGRESSION: ${cases.length}/${cases.length} PASS`);
