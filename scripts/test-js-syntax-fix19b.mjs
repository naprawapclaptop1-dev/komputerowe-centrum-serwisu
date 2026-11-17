import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['functions', 'WEB_PUBLISH', 'scripts'];
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full);
    } else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) files.push(full);
  }
}
for (const root of roots) walk(root);
for (const name of fs.readdirSync('.')) if (/\.(?:js|mjs|cjs)$/.test(name) && fs.statSync(name).isFile()) files.push(name);
const unique = [...new Set(files)].sort();
const failures = [];
for (const file of unique) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file, error: (result.stderr || result.stdout || 'syntax check failed').trim() });
}
if (failures.length) {
  for (const item of failures) console.error(`FAIL ${item.file}\n${item.error}`);
  console.error(`JS/MJS/CJS syntax: ${unique.length - failures.length}/${unique.length} PASS; ${failures.length} FAIL`);
  process.exit(1);
}
console.log(`PASS: składnia JavaScript/MJS/CJS poprawna (${unique.length} plików).`);
