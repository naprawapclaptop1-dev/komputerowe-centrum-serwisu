import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  ['scripts/test-fix83-manifest-contract-fix86.mjs', 5, 'FIX83 / release history'],
  ['scripts/test-fix83-visual-library-guard-fix88.mjs', 8, 'FIX88 visual library guard'],
  ['scripts/test-repair-photo-layout-fix87.mjs', 12, 'FIX87 repair and illustration layout'],
  ['scripts/test-hotfix-header-consistency-fix94.mjs', 6, 'FIX99 publisher/runtime consistency'],
  ['scripts/test-photo-catalog-fix94.mjs', 25, 'photo source catalog legacy regression'],
  ['scripts/test-online-photo-guards-fix94.mjs', 15, 'photo guard compatibility'],
  ['scripts/test-homepage-photo-layout-fix96.mjs', 10, '13 local homepage photographs'],
  ['scripts/test-homepage-static-photo-publication-fix97.mjs', 12, 'static homepage photo publication guard'],
  ['scripts/test-home-module-photo-coverage-fix99.mjs', 16, '19 modules and 6 specialist paths'],
  ['scripts/test-home-photo-seed-queue-fix99.mjs', 3, '21 unique preferred topic seeds'],
  ['scripts/test-active-view-photo-queue-fix99.mjs', 8, 'active-view, hidden wrapper and 147 methods'],
  ['scripts/test-publication-guard-fix99.mjs', 12, 'FIX99 local/remote publication contract']
];
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js',
  'WEB_PUBLISH/assets/photo-catalog-fix99.js',
  'WEB_PUBLISH/service-worker.js',
  'scripts/photo-catalog-publication-contract-fix99.cjs',
  ...suites.map(([file]) => file)
];
let total = 0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX99 · Node ${process.version}`);
for (const [file, expected, label] of suites) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 120000
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${file}; wydanie pozostaje zablokowane.`);
    process.exit(1);
  }
  const joined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const summaries = [...joined.matchAll(/(?:^|\n)[^\n]*?(\d+)\/(\d+)\s*PASS\b/gi)];
  const actual = summaries.length ? Number(summaries[summaries.length - 1][1]) : null;
  if (actual !== expected) {
    console.error(`[FAIL] ${file}: oczekiwano ${expected}, otrzymano ${actual ?? 'brak podsumowania'}.`);
    process.exit(1);
  }
  total += actual;
  console.log(`[PASS] ${file}: ${actual}/${expected}`);
}
for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(`[FAIL] node --check ${file}`);
    process.exit(1);
  }
}
console.log(`[PASS] Składnia JavaScript: ${syntaxFiles.length}/${syntaxFiles.length}`);
console.log(`\nFIX99 FULL TEST SUMMARY: ${total}/${total} PASS + ${syntaxFiles.length}/${syntaxFiles.length} syntax checks.`);
