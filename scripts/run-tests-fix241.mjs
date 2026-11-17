import { spawnSync } from 'node:child_process';
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true, timeout: 180000 });
  if (result.error?.code === 'ENOENT') return false;
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return true;
};
console.log('===== FIX240 publisher scope regression =====');
if (!run(process.execPath, ['scripts/test-fix240-publisher-scope.mjs'])) throw new Error('Nie można uruchomić Node.js.');
console.log('===== FIX241 all Pages Functions syntax preflight =====');
run(process.execPath, ['scripts/test-fix241-functions-syntax.mjs']);
console.log('===== FIX241 guardian SQL integration =====');
const pythonCandidates = process.platform === 'win32'
  ? [['py', ['-3', 'scripts/test-fix241-guardian-sql.py']], ['python', ['scripts/test-fix241-guardian-sql.py']]]
  : [['python3', ['scripts/test-fix241-guardian-sql.py']], ['python', ['scripts/test-fix241-guardian-sql.py']]];
let pythonDone = false;
for (const [command, args] of pythonCandidates) {
  if (run(command, args)) { pythonDone = true; break; }
  if (process.platform === 'win32' && command === 'py') continue;
}
if (!pythonDone) throw new Error('Python 3 jest wymagany do testu SQL FIX241.');
console.log('NAUKA OD A DO Z FIX241: PASS');
