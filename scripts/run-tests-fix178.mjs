import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = process.cwd();
const tasks = [
  ['FIX176/FIX177 pełny pakiet regresyjny', 'scripts/run-tests-fix177.mjs'],
  ['FIX178 naprawa odpowiedzi watchera', 'scripts/test-fix178-watcher-response-wiring.mjs']
];
let failed = false;
for (const [label, file] of tasks) {
  console.log(`\n===== ${label} =====`);
  const result = spawnSync(process.execPath, [path.join(root, file)], { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log('\nFIX178 RELEASE TOOLING: PASS');
