import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = process.cwd();
const tasks = [
  ['FIX176 pełny pakiet regresyjny', 'scripts/run-tests-fix176.mjs'],
  ['FIX177 naprawa przekazania biblioteki zdjęć', 'scripts/test-fix177-publisher-photo-library-wiring.mjs']
];
let failed = false;
for (const [label, file] of tasks) {
  console.log(`\\n===== ${label} =====`);
  const result = spawnSync(process.execPath, [path.join(root, file)], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log('\\nFIX177 RELEASE TOOLING: PASS');
