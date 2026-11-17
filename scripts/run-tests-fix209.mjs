import { spawnSync } from 'node:child_process';
const tests=[
'scripts/test-fix203-class-roster-attendance.mjs',
'scripts/test-fix204-chunked-state-sync.mjs',
'scripts/test-fix205-hardware-assessment.mjs',
'scripts/test-fix206-webgl-workshop.mjs',
'scripts/test-fix207-hyperv-hardening.mjs',
'scripts/test-fix208-server-graded-exam.mjs',
'scripts/test-fix209-admin-health.mjs',
'scripts/test-fix203-209-publisher-guard.mjs',
'scripts/run-tests-fix202.mjs'
];
for(const file of tests){
  console.log(`\n===== ${file} =====`);
  const result=spawnSync(process.execPath,[file],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
console.log('\nNAUKA OD A DO Z 6.8.0 FIX203–FIX209 + FIX202/FIX197 REGRESSION: PASS');
