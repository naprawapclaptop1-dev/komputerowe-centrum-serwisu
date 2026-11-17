import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/test-photo-catalog-publication-contract-fix111.mjs')], {
  cwd: ROOT, encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error('FIX111 photo publication contract failed through compatibility runner.');
console.log('FIX106 PHOTO PUBLICATION CONTRACT SUMMARY: 3/3 PASS (current contract FIX111)');
