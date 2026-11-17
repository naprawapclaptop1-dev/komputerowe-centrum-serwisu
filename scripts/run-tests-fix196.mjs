import { spawnSync } from 'node:child_process';
const tests = [
  'scripts/test-fix196-3d-workshop.mjs',
  'scripts/test-fix195-interactive-labs.mjs',
  'scripts/test-fix197-five-oauth-providers.mjs',
  'scripts/run-tests-fix186.mjs'
];
for (const file of tests) {
  console.log(`\n===== ${file} =====`);
  const result = spawnSync(process.execPath, [file], {stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nFIX197 OAUTH + FIX196/FIX195/FIX186 REGRESSION: PASS');
