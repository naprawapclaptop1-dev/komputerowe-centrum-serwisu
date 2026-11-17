import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const wrapper = read('URUCHOM_NAUKE_OD_A_DO_Z.cmd');
const main = read('URUCHOM_AKADEMIE.cmd');
const resolverWrapper = read('RESOLVE_NODE_FIX102.cmd');
const diagnostic = read('SPRAWDZ_NODE_FIX102.cmd');
const diagnostics = read('DIAGNOSTYKA_STARTU_FIX102.cmd');
const testCmd = read('WYKONAJ_TESTY_FIX102.cmd');
const oneClick = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

check('Main double-click entrypoint uses a local setlocal scope and changes to the project folder', () => {
  assert.ok(wrapper.includes('setlocal EnableExtensions DisableDelayedExpansion'));
  assert.ok(wrapper.includes('cd /d "%~dp0"'));
});
check('Parent entrypoint verifies that the actual main CMD exists before calling it', () => {
  assert.ok(wrapper.includes('if not exist "%~dp0URUCHOM_AKADEMIE.cmd" goto missing_main'));
  assert.ok(wrapper.includes(':missing_main'));
});
check('Parent entrypoint keeps the console alive around the child launcher', () => {
  assert.ok(wrapper.includes('set "NPA_KEEP_CONSOLE=1"'));
  assert.ok(wrapper.includes('cmd.exe /d /c ""%~dp0URUCHOM_AKADEMIE.cmd" %*"'));
  assert.ok(wrapper.includes('set "NPA_KEEP_CONSOLE="'));
});
check('Parent captures the child CMD exit code immediately after it returns', () => {
  const callAt = wrapper.indexOf('cmd.exe /d /c ""%~dp0URUCHOM_AKADEMIE.cmd" %*"');
  const captureAt = wrapper.indexOf('set "START_RC=%ERRORLEVEL%"');
  assert.ok(callAt >= 0 && captureAt > callAt && captureAt - callAt < 100);
});
check('Parent writes a local startup log with start, finish and exit code, without dumping secrets', () => {
  assert.ok(wrapper.includes('LOGI\\START_FIX105.log'));
  assert.ok(wrapper.includes('START FIX105: %date% %time%'));
  assert.ok(wrapper.includes('KONIEC FIX105: %date% %time%'));
  assert.ok(wrapper.includes('Kod zakonczenia: %START_RC%'));
  assert.ok(!/OPENAI_API_KEY|CLOUDFLARE_API_TOKEN|wrangler secret/i.test(wrapper));
});
check('Parent prints final result and PAUSE occurs after the child returns on both success and failure', () => {
  const summaryAt = wrapper.indexOf(':summary');
  const pauseAt = wrapper.indexOf('pause', summaryAt);
  const exitAt = wrapper.indexOf('endlocal & exit /b %START_RC%');
  assert.ok(summaryAt >= 0 && pauseAt > summaryAt && exitAt > pauseAt);
});
check('Main launcher preserves PAUSE on direct launch but delegates pause to parent when nested', () => {
  assert.ok(main.includes('if not defined NPA_KEEP_CONSOLE pause >nul'));
  assert.ok(main.includes('call "%ROOT%\\RESOLVE_NODE_FIX105.cmd"'));
  assert.ok(main.includes(':finish'));
});
check('FIX102 resolver is a quoted CALL wrapper and returns its exact exit code', () => {
  assert.ok(resolverWrapper.includes('call "%~dp0RESOLVE_NODE_FIX101.cmd" %*'));
  assert.ok(resolverWrapper.includes('exit /b %ERRORLEVEL%'));
});
check('New diagnostic double-click entrypoint has visible success and failure pause paths', () => {
  assert.ok(diagnostic.includes('call "%~dp0RESOLVE_NODE_FIX105.cmd"'));
  assert.ok(diagnostic.includes('pause >nul'));
  assert.ok(diagnostic.includes(':no_node'));
  assert.ok(/(?:^|\r?\n)pause(?:\r?\n)/i.test(diagnostic));
});
check('Full startup diagnostic pauses regardless of resolver result and does not start publication', () => {
  assert.ok(diagnostics.includes('call "%~dp0RESOLVE_NODE_FIX105.cmd"'));
  assert.ok(diagnostics.includes('pause'));
  assert.ok(diagnostics.includes('Nie wykonano publikacji ani zmian D1.'));
  assert.ok(!diagnostics.includes('\"%NODE_EXE%\" \"%~dp0ONECLICK_AKADEMIA.js\"'));
});
check('Legacy test launcher delegates to the guarded current FIX105 test shortcut', () => {
  assert.ok(testCmd.includes('WYKONAJ_TESTY_FIX105.cmd'));
  assert.ok(testCmd.includes('exit /b %ERRORLEVEL%'));
});
check('OneClick and Watcher enforce the startup-window guard test before publication', () => {
  assert.ok(oneClick.includes("'scripts/test-startup-window-guard-fix102.mjs'"));
  assert.ok(watcher.includes("'scripts/test-startup-window-guard-fix102.mjs'"));
});

console.log(`FIX102 STARTUP WINDOW GUARD: ${checks.length}/${checks.length} PASS`);
