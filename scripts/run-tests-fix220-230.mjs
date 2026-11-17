import { spawnSync } from 'node:child_process';

// FIX230: run the focused contracts once. Do not nest the historical FIX176–FIX186
// regression repeatedly through FIX202 -> FIX197 -> FIX186 runners.
const nodeTests = [
  'scripts/test-fix202-publisher-guard.mjs',
  'scripts/test-fix198-windows-hardware.mjs',
  'scripts/test-fix199-real-3d-workshop.mjs',
  'scripts/test-fix200-hyperv-sandbox.mjs',
  'scripts/test-fix201-teacher-dashboard.mjs',
  'scripts/test-fix202-full-state-sync.mjs',
  'scripts/test-fix203-class-roster-attendance.mjs',
  'scripts/test-fix204-chunked-state-sync.mjs',
  'scripts/test-fix205-hardware-assessment.mjs',
  'scripts/test-fix206-webgl-workshop.mjs',
  'scripts/test-fix207-hyperv-hardening.mjs',
  'scripts/test-fix208-server-graded-exam.mjs',
  'scripts/test-fix209-admin-health.mjs',
  'scripts/test-fix203-209-publisher-guard.mjs',
  'scripts/fix210-release-preflight.mjs',
  'scripts/test-fix210-218-implementation.mjs',
  'scripts/test-fix210-218-publisher-guard.mjs',
  'scripts/test-fix219-publisher-preflight.mjs',
  'scripts/test-fix220-post-deploy-smoke.mjs',
  'scripts/test-fix220-228-implementation.mjs',
  'scripts/test-fix220-228-publisher-guard.mjs',
  'scripts/test-fix221-state-revision-contract.mjs',
  'scripts/test-fix222-exam-bank-contract.mjs',
  'scripts/test-fix223-security-report-contract.mjs',
  'scripts/test-fix224-226-local-tools-contract.mjs',
  'scripts/test-fix225-glb-import.mjs',
  'scripts/test-fix227-228-cert-admin-contract.mjs',
  'scripts/test-fix229-certificate-cache.mjs',
  'scripts/test-fix229-publisher-guard.mjs',
  'scripts/test-fix230-pwa-asset-guard.mjs',
  'scripts/test-fix230-publisher-guard.mjs'
];
for (const file of nodeTests) {
  console.log(`\n===== ${file} =====`);
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const pythonCandidates = process.platform === 'win32'
  ? [['py', ['-3', 'scripts/test-fix221-222-migrations.py']], ['python', ['scripts/test-fix221-222-migrations.py']]]
  : [['python3', ['scripts/test-fix221-222-migrations.py']], ['python', ['scripts/test-fix221-222-migrations.py']]];
let pythonResult = null;
for (const [command, args] of pythonCandidates) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true });
  if (result.error?.code === 'ENOENT') continue;
  pythonResult = result;
  break;
}
if (!pythonResult) throw new Error('Python 3 jest wymagany do testu migracji SQLite FIX221/FIX222.');
if (pythonResult.error) throw pythonResult.error;
if (pythonResult.status !== 0) process.exit(pythonResult.status ?? 1);

for (const file of ['ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js', 'scripts/fix230-pwa-asset-guard.cjs']) {
  console.log(`\n===== node --check ${file} =====`);
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nNAUKA OD A DO Z FIX198–FIX230 FOCUSED REGRESSION: PASS');
