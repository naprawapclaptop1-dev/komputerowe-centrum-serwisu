import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, timeout = 600000) => spawnSync(process.execPath, [path.join(ROOT, script)], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout
});

console.log(`NAUKA OD A DO Z — FIX108 FULL TEST RUNNER · Node ${process.version}`);
const base = run('scripts/run-tests-fix106.mjs');
if (base.stdout) process.stdout.write(base.stdout);
if (base.stderr) process.stderr.write(base.stderr);
if (base.error || base.status !== 0) {
  console.error('[FAIL] FIX106 regression chain');
  process.exit(1);
}
const baseText = `${base.stdout || ''}\n${base.stderr || ''}`;
const baseMatch = baseText.match(/FIX106 FINAL SUMMARY:\s*(\d+)\/(\d+) regression PASS \+ (\d+)\/(\d+) syntax PASS/i);
if (!baseMatch || baseMatch[1] !== baseMatch[2] || baseMatch[3] !== baseMatch[4]) {
  console.error('[FAIL] Missing complete FIX106 regression summary');
  process.exit(1);
}

const focus = run('scripts/test-oneclick-release-scope-fix108.mjs', 60000);
if (focus.stdout) process.stdout.write(focus.stdout);
if (focus.stderr) process.stderr.write(focus.stderr);
if (focus.error || focus.status !== 0) {
  console.error('[FAIL] FIX108 OneClick release-scope regression');
  process.exit(1);
}
const focusText = `${focus.stdout || ''}\n${focus.stderr || ''}`;
const focusMatch = focusText.match(/FIX108 ONECLICK RELEASE SCOPE SUMMARY:\s*(\d+)\/(\d+) PASS/i);
if (!focusMatch || focusMatch[1] !== focusMatch[2]) {
  console.error('[FAIL] Missing complete FIX108 focused summary');
  process.exit(1);
}

const providerRecovery = run('scripts/test-photo-provider-recovery-fix108.mjs', 60000);
if (providerRecovery.stdout) process.stdout.write(providerRecovery.stdout);
if (providerRecovery.stderr) process.stderr.write(providerRecovery.stderr);
if (providerRecovery.error || providerRecovery.status !== 0) {
  console.error('[FAIL] FIX108 photo provider recovery regression');
  process.exit(1);
}
const providerText = `${providerRecovery.stdout || ''}\n${providerRecovery.stderr || ''}`;
const providerMatch = providerText.match(/FIX108 PHOTO PROVIDER RECOVERY SUMMARY:\s*(\d+)\/(\d+) PASS/i);
if (!providerMatch || providerMatch[1] !== providerMatch[2]) {
  console.error('[FAIL] Missing FIX108 provider-recovery summary');
  process.exit(1);
}

const syntaxFiles = [
  'ONECLICK_AKADEMIA.js',
  'AUTO_PUBLISH_WATCHER.js',
  'WEB_PUBLISH/service-worker.js',
  'scripts/photo-catalog-publication-contract-fix106.cjs',
  'scripts/test-oneclick-release-scope-fix108.mjs',
  'scripts/run-tests-fix108.mjs',
  'scripts/test-photo-provider-recovery-fix108.mjs'
];
for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000
  });
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(`[FAIL] node --check ${file}`);
    process.exit(1);
  }
  console.log(`[PASS] node --check ${file}`);
}

const baseRegression = Number(baseMatch[1]);
const focusedRegression = Number(focusMatch[1]) + Number(providerMatch[1]);
const baseSyntax = Number(baseMatch[3]);
const regressionTotal = baseRegression + focusedRegression;
const syntaxTotal = baseSyntax + syntaxFiles.length;
console.log(`FIX108 FINAL SUMMARY: ${regressionTotal}/${regressionTotal} regression PASS + ${syntaxTotal}/${syntaxTotal} syntax PASS (FIX106 ${baseRegression} + FIX108 focused ${focusedRegression}; inherited syntax ${baseSyntax} + FIX108 ${syntaxFiles.length}).`);
