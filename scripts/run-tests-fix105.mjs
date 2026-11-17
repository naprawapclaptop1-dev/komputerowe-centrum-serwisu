import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
console.log(`NAUKA OD A DO Z — FIX105 FULL TEST RUNNER · Node ${process.version}`);
const previous = spawnSync(process.execPath, [path.join(ROOT, 'scripts/run-tests-fix104.mjs')], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96*1024*1024, timeout: 600000 });
if (previous.stdout) process.stdout.write(previous.stdout);
if (previous.stderr) process.stderr.write(previous.stderr);
if (previous.error || previous.status !== 0) { console.error('[FAIL] FIX104 regression chain'); process.exit(1); }
const prevText = `${previous.stdout||''}\n${previous.stderr||''}`;
const prevMatch = prevText.match(/FIX104 FINAL SUMMARY:\s*(\d+)\/(\d+) regression PASS \+ (\d+)\/(\d+) syntax PASS/i);
if (!prevMatch || prevMatch[1] !== prevMatch[2] || prevMatch[3] !== prevMatch[4]) { console.error('[FAIL] Missing FIX104 complete summary'); process.exit(1); }
const focused = spawnSync(process.execPath, [path.join(ROOT, 'scripts/test-node-resolver-fix105.mjs')], { cwd: ROOT, encoding:'utf8', maxBuffer: 4*1024*1024, timeout:30000 });
if (focused.stdout) process.stdout.write(focused.stdout);
if (focused.stderr) process.stderr.write(focused.stderr);
if (focused.error || focused.status !== 0) { console.error('[FAIL] FIX105 resolver contract'); process.exit(1); }
const focusedText = `${focused.stdout||''}\n${focused.stderr||''}`;
const focusMatch = focusedText.match(/FIX105 NODE RESOLVER REGRESSION:\s*(\d+)\/(\d+) PASS/i);
if (!focusMatch || focusMatch[1] !== focusMatch[2]) { console.error('[FAIL] Missing FIX105 complete summary'); process.exit(1); }
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js',
  'scripts/test-node-resolver-fix105.mjs','scripts/run-tests-fix105.mjs',
  'scripts/test-node-resolver-fix103.mjs','scripts/test-node-resolver-fix104.mjs',
  'scripts/run-tests-fix103.mjs','scripts/run-tests-fix104.mjs'
];
for (const file of syntaxFiles) {
  const r = spawnSync(process.execPath,['--check',path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',timeout:30000});
  if (r.status !== 0) { if (r.stderr) process.stderr.write(r.stderr); console.error(`[FAIL] node --check ${file}`); process.exit(1); }
}
const total = Number(prevMatch[1]) + Number(focusMatch[1]);
console.log(`[PASS] FIX105 JavaScript syntax checks: ${syntaxFiles.length}/${syntaxFiles.length}`);
console.log(`FIX105 FULL TEST SUMMARY: ${total}/${total} regression PASS + ${syntaxFiles.length}/${syntaxFiles.length} syntax PASS (previous ${prevMatch[1]} + focused ${focusMatch[1]}).`);
