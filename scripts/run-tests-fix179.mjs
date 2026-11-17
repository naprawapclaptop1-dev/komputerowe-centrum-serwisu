import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = process.cwd();
const tasks = [
  ['Regresja publikatora FIX176–FIX178', 'scripts/run-tests-fix178.mjs'],
  ['Nowy program ekspercki FIX179', 'scripts/test-fix179-advanced-curriculum.mjs']
];
let failed = false;
for (const [label, file] of tasks) {
  console.log(`\n===== ${label} =====`);
  const result = spawnSync(process.execPath, [path.join(root, file)], { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log('\nFIX179 FULL REGRESSION: PASS');
