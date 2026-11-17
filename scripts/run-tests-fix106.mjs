import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, timeout = 600000) => spawnSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout });
console.log(`NAUKA OD A DO Z — FIX106 FULL TEST RUNNER · Node ${process.version}`);
const previous = run('scripts/run-tests-fix105.mjs');
if (previous.stdout) process.stdout.write(previous.stdout);
if (previous.stderr) process.stderr.write(previous.stderr);
if (previous.error || previous.status !== 0) { console.error('[FAIL] FIX105 regression chain'); process.exit(1); }
const previousText = `${previous.stdout || ''}\n${previous.stderr || ''}`;
const previousMatch = previousText.match(/FIX105 FULL TEST SUMMARY:\s*(\d+)\/(\d+) regression PASS \+ (\d+)\/(\d+) syntax PASS/i);
if (!previousMatch || previousMatch[1] !== previousMatch[2] || previousMatch[3] !== previousMatch[4]) { console.error('[FAIL] Missing complete FIX105 regression summary'); process.exit(1); }
const focusedTests = [
  ['scripts/test-photo-method-renderer-fix106.mjs', /FIX106 METHOD PHOTO RENDERER SUMMARY:\s*(\d+)\/(\d+) PASS/i],
  ['scripts/test-photo-catalog-publication-contract-fix106.mjs', /FIX106 PHOTO PUBLICATION CONTRACT SUMMARY:\s*(\d+)\/(\d+) PASS/i]
];
let focusedPassed = 0;
for (const [script, pattern] of focusedTests) {
  const result = run(script, 60000);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) { console.error(`[FAIL] ${script}`); process.exit(1); }
  const match = `${result.stdout || ''}\n${result.stderr || ''}`.match(pattern);
  if (!match || match[1] !== match[2]) { console.error(`[FAIL] Missing complete summary from ${script}`); process.exit(1); }
  focusedPassed += Number(match[1]);
}
const syntaxFiles = [
  'ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js',
  'WEB_PUBLISH/assets/photo-catalog-fix109.js', 'WEB_PUBLISH/assets/service-workshop.js',
  'scripts/test-photo-method-renderer-fix106.mjs', 'scripts/test-photo-catalog-publication-contract-fix106.mjs',
  'scripts/photo-catalog-publication-contract-fix106.cjs', 'scripts/run-tests-fix106.mjs'
];
for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) { if (result.stderr) process.stderr.write(result.stderr); console.error(`[FAIL] node --check ${file}`); process.exit(1); }
}
const previousPassed = Number(previousMatch[1]);
const previousSyntax = Number(previousMatch[3]);
const totalRegression = previousPassed + focusedPassed;
console.log(`[PASS] FIX106 syntax checks: ${syntaxFiles.length}/${syntaxFiles.length}`);
console.log(`FIX106 FINAL SUMMARY: ${totalRegression}/${totalRegression} regression PASS + ${syntaxFiles.length}/${syntaxFiles.length} syntax PASS (FIX105 ${previousPassed} + focused FIX106 ${focusedPassed}; previous syntax ${previousSyntax}).`);
