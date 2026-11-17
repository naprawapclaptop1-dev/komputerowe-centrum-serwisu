import { spawnSync } from 'node:child_process';
const run=(command,args)=>{const result=spawnSync(command,args,{stdio:'inherit',windowsHide:true});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);};
console.log('\n===== REGRESJA BAZOWA FIX220–FIX230 =====');
run(process.execPath,['scripts/run-tests-fix220-230.mjs']);
const tests=[
 'scripts/test-fix231-239-platform.mjs',
 'scripts/test-fix232-web-push.mjs',
 'scripts/test-fix239-post-deploy-smoke-contract.mjs',
 'scripts/test-fix231-239-pwa-assets.mjs',
 'scripts/test-fix231-239-publisher-guard.mjs'
];
for(const file of tests){console.log(`\n===== ${file} =====`);run(process.execPath,[file]);}
console.log('\n===== AUDYT JAKOŚCI MATERIAŁÓW =====');
run(process.execPath,['scripts/audit-content-quality-fix236.mjs']);
const py=process.platform==='win32'?[['py',['-3','scripts/test-fix231-239-migration.py']]]:[['python3',['scripts/test-fix231-239-migration.py']],['python',['scripts/test-fix231-239-migration.py']]];
let done=false;for(const [cmd,args]of py){const r=spawnSync(cmd,args,{stdio:'inherit',windowsHide:true});if(r.error?.code==='ENOENT')continue;if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);done=true;break;}if(!done)throw new Error('Python 3 jest wymagany do testu migracji 0023.');
const checkFiles=['ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','functions/_notifications.js','functions/_webpush.js','functions/api/notifications.js','functions/api/guardians.js','functions/api/content-reports.js','functions/api/admin/content-reports.js','functions/api/certificates.js','functions/api/export.js','functions/api/me.js','functions/api/classroom.js','functions/api/health.js','functions/api/admin/health.js','WEB_PUBLISH/assets/platform-enhancements-fix231-239.js','scripts/post-deploy-smoke-fix239.mjs','scripts/audit-content-quality-fix236.mjs','scripts/generate-vapid-keys-fix232.mjs'];
for(const file of checkFiles){console.log(`\n===== node --check ${file} =====`);run(process.execPath,['--check',file]);}
console.log('\nNAUKA OD A DO Z FIX220–FIX239 FOCUSED REGRESSION: PASS');
