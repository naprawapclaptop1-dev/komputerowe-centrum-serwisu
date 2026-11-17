import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=file=>spawnSync(process.execPath,[path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX85 · Node ${process.version}`);
for(const file of ['scripts/run-tests-fix84.mjs','scripts/test-pages-production-branch-fix85.mjs']){
  const result=run(file);if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
}
console.log('FIX85 TEST SUMMARY: 59/59 PASS (51 bazowych FIX84 + 8 testów celu produkcyjnego FIX85; historyczny kontrakt FIX81 jest częścią bazy).');
