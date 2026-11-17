import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const resolver = read('RESOLVE_NODE_FIX105.cmd');
const ps = read('scripts/resolve-node-fix105.ps1');
const compat = read('RESOLVE_NODE_FIX103.cmd');
const compatPs = read('scripts/resolve-node-fix103.ps1');
const launcher = read('URUCHOM_AKADEMIE.cmd');
const wrapper = read('URUCHOM_NAUKE_OD_A_DO_Z.cmd');
const diagnostics = read('SPRAWDZ_NODE_FIX105.cmd');
const wrangler = read('PRZYGOTUJ_WRANGLER_FIX18.cmd');
const openAi = read('USTAW_KLUCZ_OPENAI.cmd');
const tests = read('WYKONAJ_TESTY_FIX105.cmd');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

check('FIX105 PowerShell parameters require explicit non-empty paths', () => {
  const block = ps.slice(0, ps.indexOf('$ErrorActionPreference'));
  assert.ok(block.includes('[Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Root'));
  assert.ok(block.includes('[Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$NodePathFile'));
  assert.ok(block.includes('[Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$VersionFile'));
});
check('FIX105 validates explicit full output paths before discovery', () => {
  assert.ok(ps.includes('nie przekazano pelnych sciezek plikow wynikowych'));
  assert.ok(ps.includes('[IO.Path]::GetFullPath($NodePathFile)'));
  assert.ok(ps.includes('[IO.Path]::GetFullPath($VersionFile)'));
});
check('FIX105 CMD passes canonical root and explicit result paths without trailing slash', () => {
  assert.ok(resolver.includes('for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"'));
  assert.ok(resolver.includes('-Root "%NPA_ROOT%" -NodePathFile "%NODE_PATH_FILE%" -VersionFile "%NODE_VERSION_FILE%"'));
  assert.ok(!resolver.includes('-Root "%~dp0"'));
});
check('FIX105 CMD reads identical project-local result paths written and re-read by PowerShell', () => {
  assert.ok(resolver.includes('NODE_PATH_FILE=%NPA_ROOT%\\NODE_EXE.path'));
  assert.ok(resolver.includes('NODE_VERSION_FILE=%NPA_ROOT%\\NODE_EXE.version'));
  assert.ok(resolver.includes('for /f "usebackq delims=" %%A in ("%NODE_PATH_FILE%")'));
  assert.ok(resolver.includes('for /f "usebackq delims=" %%A in ("%NODE_VERSION_FILE%")'));
  assert.ok(ps.includes("WriteAllText($NodePathFile, $selectedPath"));
  assert.ok(ps.includes("WriteAllText($VersionFile, $selected.Version"));
  assert.ok(ps.includes('ReadAllText($NodePathFile).Trim()'));
  assert.ok(ps.includes('ReadAllText($VersionFile).Trim()'));
});
check('FIX105 resolver has no temp-folder variable expansion or giant inline PowerShell command', () => {
  assert.ok(!resolver.includes('NPA_RESOLVE_TMP'));
  assert.ok(!resolver.includes('-Command'));
  assert.ok(!/set\s+"PATH=.*%PATH%/i.test(resolver));
});
check('FIX105 keeps Node candidate discovery and execution validation', () => {
  assert.ok(ps.includes('function Add-NodeCandidate'));
  assert.ok(ps.includes('function Test-NodeCandidate'));
  assert.ok(ps.includes('& $Candidate --version'));
  assert.ok(ps.includes("[version]'20.0.0'"));
});
check('FIX105 validates the explicit canonical Root directory', () => {
  assert.ok(ps.includes("[IO.Path]::GetFullPath($Root.Trim().Trim('\\'))"));
  assert.ok(ps.includes('katalog projektu nie istnieje'));
});
check('FIX105 keeps manual Windows file picker and console fallback', () => {
  assert.ok(ps.includes('System.Windows.Forms.OpenFileDialog'));
  assert.ok(ps.includes('$dialog.ShowDialog()'));
  assert.ok(ps.includes('Read-Host'));
});
check('FIX105 validates the selected executable again in CMD and compares versions', () => {
  assert.ok(resolver.includes('"%NODE_EXE%" --version'));
  assert.ok(resolver.includes('if not "%NPA_NODE_VERIFY%"=="%NODE_VERSION%"'));
});
check('FIX103 command remains backward compatible by delegating to FIX105', () => {
  assert.ok(compat.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(compat.includes('exit /b %ERRORLEVEL%'));
  assert.ok(compatPs.includes('[AllowEmptyString()][string]$NodePathFile'));
});
check('Main publication launcher calls FIX105 before Gemini and OneClick', () => {
  const at = launcher.indexOf('RESOLVE_NODE_FIX105.cmd');
  assert.ok(at >= 0);
  assert.ok(at < launcher.indexOf('configure-gemini-secret.js'));
  assert.ok(at < launcher.indexOf('ONECLICK_AKADEMIA.js'));
  assert.ok(launcher.includes('"%NODE_EXE%" "%ROOT%\\ONECLICK_AKADEMIA.js"'));
});
check('Wrangler and Gemini tools share the same FIX105 resolver', () => {
  assert.ok(wrangler.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(openAi.includes('USTAW_KLUCZ_GEMINI.cmd'));
  assert.ok(read('USTAW_KLUCZ_GEMINI.cmd').includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(diagnostics.includes('RESOLVE_NODE_FIX105.cmd'));
  assert.ok(tests.includes('RESOLVE_NODE_FIX105.cmd'));
});
check('Parent startup wrapper remains guarded and waits for a key after child process exits', () => {
  assert.ok(wrapper.includes('pause'));
  assert.ok(wrapper.includes('START_FIX105.log'));
});
check('FIX105 does not modify PATH or registry and stores only project-local selection', () => {
  assert.ok(ps.includes("Join-Path $Root 'NODE_EXE.path'") || ps.includes('WriteAllText($NodePathFile'));
  assert.ok(!ps.includes('SetEnvironmentVariable'));
  assert.ok(!ps.includes('Set-ItemProperty'));
  assert.ok(!resolver.includes('set "PATH='));
});
check('FIX105 errors return a nonzero code and distinguish both output files', () => {
  assert.ok(resolver.includes('exit /b 10'));
  assert.ok(resolver.includes('FIX105_MISSING_PATH'));
  assert.ok(resolver.includes('FIX105_MISSING_VERSION'));
  assert.ok(ps.includes('exit 10'));
});
check('New diagnostic and test shortcuts identify FIX105 and call the current resolver', () => {
  assert.ok(diagnostics.includes('DIAGNOSTYKA NODE.JS FIX105'));
  assert.ok(tests.includes('run-tests-fix105.mjs'));
});

console.log(`FIX105 NODE RESOLVER REGRESSION: ${checks.length}/${checks.length} PASS`);
