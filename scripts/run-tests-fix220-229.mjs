import { spawnSync } from 'node:child_process';
const run = (file, args = []) => { console.log(`\n===== ${file} =====`); const r = spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' }); if (r.error) throw r.error; if (r.status !== 0) process.exit(r.status ?? 1); };
run('scripts/run-tests-fix220-228.mjs');
run('scripts/test-fix229-certificate-cache.mjs');
run('scripts/test-fix229-publisher-guard.mjs');
const pyCandidates = process.platform === 'win32' ? [['py', ['-3', 'scripts/test-fix221-222-migrations.py']], ['python', ['scripts/test-fix221-222-migrations.py']]] : [['python3', ['scripts/test-fix221-222-migrations.py']], ['python', ['scripts/test-fix221-222-migrations.py']]];
let pyResult = null;
for (const [cmd, args] of pyCandidates) { const r = spawnSync(cmd, args, { stdio: 'inherit' }); if (r.error?.code === 'ENOENT') continue; pyResult = r; break; }
if (!pyResult) throw new Error('Python 3 jest wymagany do testu migracji SQLite FIX221/FIX222.');
if (pyResult.error) throw pyResult.error;
if (pyResult.status !== 0) process.exit(pyResult.status ?? 1);
for (const f of ['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']) { const r=spawnSync(process.execPath,['--check',f],{stdio:'inherit'}); if(r.error)throw r.error; if(r.status!==0)process.exit(r.status??1); }
console.log('FIX220–FIX229 FULL LOCAL TEST SUITE: PASS');
