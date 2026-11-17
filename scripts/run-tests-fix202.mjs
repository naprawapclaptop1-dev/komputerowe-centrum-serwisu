import { spawnSync } from 'node:child_process';
const tests=[
'scripts/test-fix202-publisher-guard.mjs',
'scripts/test-fix198-windows-hardware.mjs',
'scripts/test-fix199-real-3d-workshop.mjs',
'scripts/test-fix200-hyperv-sandbox.mjs',
'scripts/test-fix201-teacher-dashboard.mjs',
'scripts/test-fix202-full-state-sync.mjs',
'scripts/run-tests-fix197.mjs'
];
for(const file of tests){console.log(`\n===== ${file} =====`);const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
console.log('\nNAUKA OD A DO Z 6.8.0 FIX198–FIX202 + FIX197 REGRESSION: PASS');
