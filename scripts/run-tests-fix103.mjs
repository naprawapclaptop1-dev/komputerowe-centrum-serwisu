import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  ['scripts/run-tests-fix102.mjs', 168, 'FIX102 pełna regresja poprzedniego wydania'],
  ['scripts/test-node-resolver-fix103.mjs', 16, 'FIX104 opcjonalne parametry PowerShell i stabilne pliki wynikowe']
];
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js',
  'AUTO_PUBLISH_WATCHER.js',
  'scripts/test-node-resolver-fix103.mjs',
  'scripts/run-tests-fix103.mjs',
  'scripts/run-tests-fix104.mjs',
  'scripts/test-node-resolver-fix104.mjs',
  'scripts/run-tests-fix102.mjs',
  'scripts/test-startup-window-guard-fix102.mjs'
];
let total = 0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX104 · Node ${process.version}`);
for (const [file, expected, label] of suites) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 420000 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) { console.error(`[FAIL] ${file}; wydanie pozostaje zablokowane.`); process.exit(1); }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const summaries = [...joined.matchAll(/(?:^|\n)[^\n]*?(\d+)\/(\d+)\s*PASS\b/gi)];
  const actual = summaries.length ? Number(summaries[summaries.length - 1][1]) : null;
  if (actual !== expected) { console.error(`[FAIL] ${file}: oczekiwano ${expected}, otrzymano ${actual ?? 'brak podsumowania'}.`); process.exit(1); }
  total += actual;
  console.log(`[PASS] ${file}: ${actual}/${expected}`);
}
for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) { if (result.stderr) process.stderr.write(result.stderr); console.error(`[FAIL] node --check ${file}`); process.exit(1); }
}
console.log(`[PASS] Składnia JavaScript: ${syntaxFiles.length}/${syntaxFiles.length}`);
console.log(`\nFIX104 FULL TEST SUMMARY: ${total}/${total} PASS + ${syntaxFiles.length}/${syntaxFiles.length} JavaScript syntax checks.`);
