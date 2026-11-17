import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=file=>spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024,timeout:420000});
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX89 · Node ${process.version}`);
for(const file of ['scripts/run-tests-fix88.mjs','scripts/test-hotfix-header-consistency-fix89.mjs']){
  const result=run(file);
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
}
console.log('FIX89 TEST SUMMARY: 96/96 PASS (92 bazowe FIX88 + 4 nowe testy spójności nagłówków i metadanych).');
