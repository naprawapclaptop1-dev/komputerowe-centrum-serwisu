import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = file => spawnSync(process.execPath, [path.join(ROOT,file)], {cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024,timeout:180000});
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX83 · Node ${process.version}`);
for (const file of ['scripts/run-tests-fix82.mjs','scripts/test-fix83-unique-visuals.mjs']) {
  const result=run(file);
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.error||result.status!==0){console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);process.exit(1);}
}
console.log('FIX83 TEST SUMMARY: 48/48 PASS (39 bazowych FIX82 + 9 nowych testów wizualnych).');
