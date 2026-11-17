import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = file => spawnSync(process.execPath, [path.join(ROOT, file)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 600000 });
console.log(`NAUKA OD A DO Z — TEST RUNNER FIX91 · Node ${process.version}`);
const results = [];
for (const file of ['scripts/run-tests-fix90.mjs', 'scripts/test-photo-catalog-fix91.mjs']) {
  const result = run(file);
  const stdout = result.stdout || '';
  results.push({ file, stdout });
  if (stdout) process.stdout.write(stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    console.error(`[FAIL] ${file} nie przeszedł; publikacja pozostaje zablokowana.`);
    process.exit(1);
  }
}
const base = results[0].stdout.match(/FIX90 TEST SUMMARY: (\d+)\/(\d+) PASS/);
const photos = results[1].stdout.match(/FIX91 PHOTO CATALOG SUMMARY: (\d+)\/(\d+) PASS/);
if (!base || !photos) {
  console.error('[FAIL] Nie udało się odczytać liczników testów podrzędnych.');
  process.exit(1);
}
const passed = Number(base[1]) + Number(photos[1]);
const total = Number(base[2]) + Number(photos[2]);
if (passed !== total) {
  console.error(`[FAIL] FIX91: ${passed}/${total} testów.`);
  process.exit(1);
}
console.log(`FIX91 TEST SUMMARY: ${passed}/${total} PASS (${base[1]} historycznych + ${photos[1]} nowych testów paginacji, zdjęć i klasyfikacji).`);
