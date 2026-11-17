import { spawnSync } from 'node:child_process';
const files=['scripts/test-fix219-publisher-preflight.mjs','scripts/run-tests-fix210-218.mjs'];
for(const file of files){
 console.log(`\n===== ${file} =====`);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit',encoding:'utf8'});
 if(result.error) throw result.error;
 if(result.status!==0) process.exit(result.status??1);
}
console.log('\nNAUKA OD A DO Z FIX219 + FIX210–FIX218 REGRESSION: PASS');
