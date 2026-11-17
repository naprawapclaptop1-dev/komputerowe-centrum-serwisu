import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  'scripts/run-tests-fix94.mjs',
  'scripts/test-publication-guard-fix95.mjs'
];
let total = 0;
console.log(`NAUKA OD A DO Z — PEŁNA REGRESJA FIX95 · Node ${process.version}`);
for (const file of suites) {
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 600000
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${file}; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const matches = [...joined.matchAll(/(?:SUMMARY|CONSISTENCY|GUARDS|CONTRACT):\s*(\d+)\/(\d+)\s*PASS/gi)];
  if (matches.length) {
    const last = matches.at(-1);
    total += Number(last[1]);
  } else {
    console.error(`[FAIL] ${file} nie wyświetlił licznika PASS.`);
    process.exit(1);
  }
}
console.log(`FIX95 FULL TEST SUMMARY: ${total}/${total} PASS`);
