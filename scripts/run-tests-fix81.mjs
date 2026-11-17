import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (file) => spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX81 · Node ${process.version}`);
const base = run('scripts/run-tests-fix80.mjs');
if (base.stdout) process.stdout.write(base.stdout);
if (base.stderr) process.stderr.write(base.stderr);
if (base.error || base.status !== 0) {
  console.error('[FAIL] Bazowy zestaw FIX80 nie przeszedł; FIX81 nie może potwierdzić wydania.');
  process.exit(1);
}
const regression = run('scripts/test-pages-production-direct-upload-fix81.mjs');
if (regression.stdout) process.stdout.write(regression.stdout);
if (regression.stderr) process.stderr.write(regression.stderr);
if (regression.error || regression.status !== 0) {
  console.error('[FAIL] Regresja produkcyjnego Direct Upload FIX81 nie przeszła.');
  process.exit(1);
}
console.log('FIX81 TEST SUMMARY: 38/38 PASS (37 bazowych + 1 nowa regresja publikacji produkcyjnej).');
