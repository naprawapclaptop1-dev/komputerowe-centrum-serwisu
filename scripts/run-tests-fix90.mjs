import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=file=>spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:96*1024*1024,timeout:540000});
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX90 · Node ${process.version}`);
const results=[];
for(const file of ['scripts/run-tests-fix88.mjs','scripts/test-hotfix-header-consistency-fix90.mjs','scripts/test-photo-catalog-fix90.mjs']){
  const result=run(file);
  results.push({file,stdout:result.stdout||''});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
}
const base=results[0].stdout.match(/FIX88 TEST SUMMARY: (\d+)\/(\d+) PASS/);
const headers=results[1].stdout.match(/FIX91 HOTFIX HEADER CONSISTENCY: (\d+)\/(\d+) PASS/) || results[1].stdout.match(/FIX90 HOTFIX HEADER CONSISTENCY: (\d+)\/(\d+) PASS/);
const photos=results[2].stdout.match(/FIX90 PHOTO CATALOG SUMMARY: (\d+)\/(\d+) PASS/);
if(!base||!headers||!photos){console.error('[FAIL] Nie udało się odczytać liczników testów podrzędnych.');process.exit(1);}
const passed=[base,headers,photos].reduce((sum,item)=>sum+Number(item[1]),0);
const total=[base,headers,photos].reduce((sum,item)=>sum+Number(item[2]),0);
if(passed!==total){console.error(`[FAIL] FIX90: ${passed}/${total} testów.`);process.exit(1);}
console.log(`FIX90 TEST SUMMARY: ${passed}/${total} PASS (${base[1]} bazowych + ${headers[1]} spójności wydania + ${photos[1]} katalogu fotografii online).`);
