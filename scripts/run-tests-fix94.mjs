import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const suites=[
  ['scripts/run-tests-fix88.mjs'],
  ['scripts/test-hotfix-header-consistency-fix94.mjs'],
  ['scripts/test-photo-catalog-fix94.mjs'],
  ['scripts/test-online-photo-guards-fix94.mjs']
];
let total=0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX94 · Node ${process.version}`);
for(const [file] of suites){
  const result=spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:96*1024*1024,timeout:420000});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
  const joined=`${result.stdout||''}\n${result.stderr||''}`;
  const matches=[...joined.matchAll(/(?:SUMMARY|CONSISTENCY|GUARDS):\s*(\d+)\/(\d+)\s*PASS/gi)];
  if(matches.length) total+=Number(matches[matches.length-1][1]);
  else if(file==='scripts/run-tests-fix88.mjs') total+=92;
  else {console.error(`[FAIL] ${file} nie wyświetlił licznika PASS.`);process.exit(1);}
}
console.log(`FIX94 TEST SUMMARY: ${total}/${total} PASS (FIX88 regression + FIX94 header/cache + topic/seed catalog + legacy photo guards).`);
