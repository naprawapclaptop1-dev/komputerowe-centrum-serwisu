import { spawnSync } from 'node:child_process';
const run=(args)=>{const r=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,timeout:1200000});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);};
console.log('===== REGRESJA FIX220–FIX239 =====');
run(['scripts/run-tests-fix220-239.mjs']);
console.log('===== POPRAWKA FIX240 =====');
run(['scripts/test-fix240-publisher-scope.mjs']);
console.log('NAUKA OD A DO Z FIX220–FIX240: PASS');
