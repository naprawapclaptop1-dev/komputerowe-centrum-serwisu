import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  { file: 'scripts/run-tests-fix94.mjs', expected: 138, label: 'pełna regresja FIX94 i wcześniejszych wydań' },
  { file: 'scripts/test-homepage-photo-layout-fix96.mjs', expected: 10, label: 'lokalne fotografie strony głównej FIX96' }
];
let total = 0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX96 · Node ${process.version}`);
for (const suite of suites) {
  console.log(`\n=== ${suite.label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, suite.file)], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 96 * 1024 * 1024,
    timeout: 480000
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${suite.file} nie przeszedł; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const matches = [...joined.matchAll(/(?:SUMMARY|CONSISTENCY|GUARDS):\s*(\d+)\/(\d+)\s*PASS/gi)];
  const summary = matches.length ? Number(matches[matches.length - 1][1]) : null;
  if (summary !== suite.expected) {
    console.error(`[FAIL] ${suite.file}: oczekiwano ${suite.expected} testów PASS, otrzymano ${summary ?? 'brak licznika'}.`);
    process.exit(1);
  }
  total += summary;
  console.log(`[PASS] ${suite.file}: ${summary}/${suite.expected}`);
}
console.log(`\nFIX96 FULL TEST SUMMARY: ${total}/${total} PASS.`);
