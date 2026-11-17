import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=file=>spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:96*1024*1024,timeout:420000});
const suites=[
  ['scripts/run-tests-fix88.mjs',92],
  ['scripts/test-hotfix-header-consistency-fix93.mjs',5],
  ['scripts/test-photo-catalog-fix93.mjs',18],
  ['scripts/test-online-photo-guards-fix93.mjs',15]
];
let total=0;
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX93 · Node ${process.version}`);
for(const [file,count] of suites){
  const result=run(file);
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
  total+=count;
}
console.log(`FIX93 TEST SUMMARY: ${total}/${total} PASS (92 testy bazowe + 5 testów nagłówków/cache + 18 testów katalogu + 15 testów ochrony renderowania fotografii).`);
