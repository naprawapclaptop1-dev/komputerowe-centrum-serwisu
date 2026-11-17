import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  ['scripts/run-tests-fix100.mjs', 143, 'FIX99/FIX100 regresja poprzedniego wydania'],
  ['scripts/test-node-runtime-discovery-fix101.mjs', 13, 'FIX101 dodatkowa diagnostyka i awaryjny wybór Node.js']
];
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js',
  'AUTO_PUBLISH_WATCHER.js',
  'scripts/test-node-runtime-discovery-fix100.mjs',
  'scripts/test-node-runtime-discovery-fix101.mjs',
  'scripts/run-tests-fix100.mjs',
  'scripts/run-tests-fix101.mjs'
];
let total = 0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX101 · Node ${process.version}`);
for (const [file, expected, label] of suites) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 240000 });
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
console.log(`\nFIX101 FULL TEST SUMMARY: ${total}/${total} PASS + ${syntaxFiles.length}/${syntaxFiles.length} JavaScript syntax checks.`);
