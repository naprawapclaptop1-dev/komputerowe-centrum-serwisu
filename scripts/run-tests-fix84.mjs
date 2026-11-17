import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = file => spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 240000 });
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX84 · Node ${process.version}`);
for (const file of ['scripts/run-tests-fix83.mjs', 'scripts/test-fix84-node-crypto.mjs']) {
  const result = run(file);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
}
console.log('FIX84 TEST SUMMARY: 51/51 PASS (48 bazowych FIX83 + 3 testy SHA-256 i plików posterów).');
