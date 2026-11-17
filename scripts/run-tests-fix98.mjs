import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  { file: 'scripts/run-tests-fix97.mjs', expected: 170, label: 'pełna regresja FIX97 i wcześniejszych wydań' },
  { file: 'scripts/test-home-module-photo-coverage-fix98.mjs', expected: 15, label: 'zdjęcia 15 dodatkowych kafelków i sześciu specjalizacji' },
  { file: 'scripts/test-home-photo-seed-queue-fix98.mjs', expected: 3, label: 'integracyjny dobór 21 unikalnych źródeł zdjęć' }
];
let total = 0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX98 · Node ${process.version}`);
for (const suite of suites) {
  console.log(`\n=== ${suite.label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, suite.file)], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 480000
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${suite.file}; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const summaries = [...joined.matchAll(/(?:SUMMARY|CONSISTENCY|GUARDS|GUARD):\s*(\d+)\/(\d+)\s*PASS/gi)];
  const actual = summaries.length ? Number(summaries[summaries.length - 1][1]) : null;
  if (actual !== suite.expected) {
    console.error(`[FAIL] ${suite.file}: oczekiwano ${suite.expected}, otrzymano ${actual ?? 'brak podsumowania'}.`);
    process.exit(1);
  }
  total += actual;
  console.log(`[PASS] ${suite.file}: ${actual}/${suite.expected}`);
}
console.log(`\nFIX98 FULL TEST SUMMARY: ${total}/${total} PASS.`);
