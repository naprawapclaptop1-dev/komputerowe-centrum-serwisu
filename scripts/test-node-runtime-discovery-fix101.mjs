import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const resolver = read('RESOLVE_NODE_FIX101.cmd');
const diagnostic = read('SPRAWDZ_NODE_FIX101.cmd');
const tests = read('WYKONAJ_TESTY_FIX101.cmd');
const one = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const psMinVersionToken = () => read('scripts/resolve-node-fix101.ps1').includes("[version]'20.0.0'");
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

check('Automatic resolution first loads remembered project-local NODE_EXE.path', () => {
  assert.ok(resolver.includes('NODE_EXE.path'));
  assert.ok(resolver.indexOf('NODE_EXE.path') < resolver.indexOf('Native CMD PATH resolution'));
});
check('Explicit NODE_EXE/NODE_HOME/NODEJS_HOME overrides survive resolver initialization', () => {
  assert.ok(resolver.includes('set "_NODE_ENV_OVERRIDE=%NODE_EXE%"'));
  assert.ok(resolver.includes('if defined _NODE_ENV_OVERRIDE call :TRY_NODE'));
  assert.ok(resolver.includes('if defined NODE_HOME call :TRY_NODE'));
  assert.ok(resolver.includes('if defined NODEJS_HOME call :TRY_NODE'));
});
check('When automatic search fails, an actual Windows file picker selects node.exe', () => {
  assert.ok(resolver.includes('System.Windows.Forms.OpenFileDialog'));
  assert.ok(resolver.includes('Node.js runtime (node.exe)|node.exe'));
  assert.ok(resolver.includes('ShowDialog()'));
});
check('Manual drag-and-drop or pasted full path remains available if the dialog is cancelled', () => {
  assert.ok(resolver.includes('Przeciagnij plik node.exe'));
  assert.ok(resolver.includes('set /p "_NODE_CANDIDATE='));
});
check('Chosen path is remembered and verified before it is reused', () => {
  assert.ok(resolver.includes('NODE_EXE.path'));
  assert.ok(resolver.includes(':REMEMBER'));
  assert.ok(resolver.includes('"%_TRY_NODE%" --version'));
});
check('Node path persistence is project-local; system PATH is not modified', () => {
  assert.ok(resolver.includes('"%~dp0NODE_EXE.path"'));
  assert.ok(resolver.includes('set "PATH=%NODE_DIR%;%PATH%"'));
  assert.ok(resolver.includes('Nie zmieniono systemowego PATH'));
});
check('Invalid executable, failed exit code and malformed version cannot be accepted', () => {
  assert.ok(resolver.includes('if not exist "%_TRY_NODE%" exit /b 1'));
  assert.ok(resolver.includes('if errorlevel 1 goto :TRY_NODE_FAILED'));
  assert.ok(resolver.includes('findstr /r /c:"^v[0-9]'));
  assert.ok(resolver.includes('if %_TRY_MAJOR% LSS 20 exit /b 1'));
  assert.ok(psMinVersionToken());
});
check('Remembered path and file-picker output are read after IF blocks, avoiding CMD early expansion', () => {
  assert.ok(resolver.includes('if exist "%~dp0NODE_EXE.path" set /p "_NODE_CANDIDATE="<"%~dp0NODE_EXE.path"\nif defined _NODE_CANDIDATE call :TRY_NODE'));
  assert.ok(resolver.includes('if exist "%_NODE_PICK_FILE%" set /p "_NODE_CANDIDATE="<"%_NODE_PICK_FILE%"\nif defined _NODE_CANDIDATE call :TRY_NODE'));
});
check('Main launcher and diagnostic tool use the same FIX101 resolver and print the resolved path/version', () => {
  assert.ok(read('URUCHOM_AKADEMIE.cmd').includes('RESOLVE_NODE_FIX101.cmd'));
  assert.ok(diagnostic.includes('RESOLVE_NODE_FIX101.cmd'));
  assert.ok(diagnostic.includes('%NODE_EXE%'));
  assert.ok(diagnostic.includes('%NODE_VERSION%'));
});
check('Test entrypoint also resolves Node.js before starting the test runner', () => {
  assert.ok(tests.includes('RESOLVE_NODE_FIX101.cmd'));
  assert.ok(tests.includes('scripts\\run-tests-fix101.mjs'));
});
check('OneClick refuses stale FIX100 metadata and runs FIX101 discovery preflight', () => {
  assert.ok(one.includes("releaseJson.latestHotfix !== 'FIX128'"));
  assert.ok(one.includes("'scripts/test-node-runtime-discovery-fix101.mjs'"));
});
check('Watcher includes FIX101 discovery regression in its pre-publication tests', () => {
  assert.ok(watcher.includes("'scripts/test-node-runtime-discovery-fix101.mjs'"));
});
check('Release metadata, HTML title and PWA cache retain FIX101 resolver while photo runtime uses FIX115 and active cache is FIX127', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX128');
  assert.equal(release.latestHotfixBuild, '6.8.0-fix128-live-tech-visual-publication-20261111');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix118-local-photo-library-20261110');
  assert.ok(html.includes('content="FIX122"'));
  assert.ok(html.includes('NAUKA OD A DO Z — DLA WSZYSTKICH | Wersja 6.8.0 FIX128')); 
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix127-portable-sha256-20261111'"));
});

console.log(`FIX101 NODE RESOLUTION FALLBACK: ${checks.length}/${checks.length} PASS`);
