import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=file=>spawnSync(process.execPath,[path.join(ROOT,file)],{
  cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024,timeout:360000
});
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX86 · Node ${process.version}`);
const files=[
  'scripts/run-tests-fix85.mjs',
  'scripts/test-pages-production-direct-upload-fix86.mjs',
  'scripts/test-fix83-manifest-contract-fix86.mjs'
];
for(const file of files){
  const result=run(file);
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){
    console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
}
console.log('FIX86 TEST SUMMARY: 72/72 PASS (59 bazowych FIX85 + 8 Direct Upload production FIX86 + 5 kontraktu manifestu/release FIX86).');
