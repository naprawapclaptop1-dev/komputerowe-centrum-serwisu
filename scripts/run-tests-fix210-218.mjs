import { spawnSync } from 'node:child_process';
const tests=['scripts/fix210-release-preflight.mjs','scripts/test-fix210-218-implementation.mjs','scripts/test-fix210-218-publisher-guard.mjs','scripts/run-tests-fix209.mjs'];
for(const file of tests){console.log(`\n===== ${file} =====`);const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
console.log('\nNAUKA OD A DO Z 6.8.0 FIX210–FIX218 + FIX209 REGRESSION: PASS');
