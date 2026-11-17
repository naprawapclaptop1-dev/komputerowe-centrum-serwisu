import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  ['scripts/run-tests-fix103.mjs', 'FIX104 pełna regresja projektu']
];
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js',
  'AUTO_PUBLISH_WATCHER.js',
  'scripts/test-node-resolver-fix103.mjs',
  'scripts/run-tests-fix103.mjs',
  'scripts/run-tests-fix104.mjs',
  'scripts/test-node-resolver-fix104.mjs'
];
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX104 · Node ${process.version}`);
let total = 0;
for (const [file, label] of suites) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 480000 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) { console.error(`[FAIL] ${file}`); process.exit(1); }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = joined.match(/FIX104 FULL TEST SUMMARY:\s*(\d+)\/(\d+) PASS/i);
  if (!match || match[1] !== match[2]) { console.error('[FAIL] Missing or incomplete FIX104 summary'); process.exit(1); }
  total = Number(match[1]);
}
for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) { if (result.stderr) process.stderr.write(result.stderr); console.error(`[FAIL] node --check ${file}`); process.exit(1); }
}
console.log(`[PASS] JavaScript syntax checks: ${syntaxFiles.length}/${syntaxFiles.length}`);
console.log(`\nFIX104 FINAL SUMMARY: ${total}/${total} regression PASS + ${syntaxFiles.length}/${syntaxFiles.length} syntax PASS.`);
