import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const oneclick = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const oneLine = oneclick.match(/for\s*\(const\s+script\s+of\s*\[([\s\S]*?)\]\)\s*\{/);
const watchLine = watcher.match(/const\s+scripts\s*=\s*\[([\s\S]*?)\];/);
if (!oneLine || !watchLine) throw new Error('Nie można odczytać listy testów OneClick/Watcher.');
const names = source => [...source.matchAll(/['"]([^'"]+\.(?:mjs|js))['"]/g)].map(match => match[1]);
const tests = [...new Set([...names(oneLine[1]), ...names(watchLine[1])])];
const syntax = [
  'ONECLICK_AKADEMIA.js', 'AUTO_PUBLISH_WATCHER.js', 'WEB_PUBLISH/service-worker.js',
  'WEB_PUBLISH/assets/photo-catalog-fix111.js', 'WEB_PUBLISH/assets/service-workshop.js',
  'scripts/photo-catalog-publication-contract-fix111.cjs', 'scripts/test-global-academy-http-port-fix112.mjs', 'scripts/test-global-academy-http-fix77.mjs', 'scripts/run-tests-fix112.mjs'
];
const log = [];
let failures = 0;
let checks = 0;
const started = new Date().toISOString();
console.log(`NAUKA OD A DO Z — FIX112 FULL PUBLISHER PREFLIGHT · Node ${process.version}`);
for (const [index, file] of tests.entries()) {
  const result = spawnSync(process.execPath, [path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024
  });
  checks++;
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const ok = !result.error && result.status === 0;
  if (!ok) failures++;
  const entry = `[${ok ? 'PASS' : 'FAIL'}] ${file}\n${output}${result.error ? `\n${result.error.stack || result.error}` : ''}`;
  log.push(entry);
  console.log(`[${index + 1}/${tests.length}] ${ok ? 'PASS' : 'FAIL'} ${file}`);
  if (!ok && output) console.error(output.slice(-5000));
}
let syntaxPass = 0;
for (const file of syntax) {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000
  });
  checks++;
  const ok = !result.error && result.status === 0;
  if (ok) syntaxPass++; else failures++;
  log.push(`[${ok ? 'PASS' : 'FAIL'}] node --check ${file}\n${result.stderr || ''}`);
  console.log(`[${ok ? 'PASS' : 'FAIL'}] node --check ${file}`);
  if (!ok && result.stderr) console.error(result.stderr);
}
const finished = new Date().toISOString();
const summary = `FIX112 FULL SUMMARY: ${tests.length - (failures - (syntax.length - syntaxPass))}/${tests.length} publisher regressions PASS + ${syntaxPass}/${syntax.length} syntax PASS. Started ${started}; finished ${finished}.`;
log.push(summary);
fs.writeFileSync(path.join(ROOT, 'RAPORT_FIX112_TESTY.log'), `${log.join('\n\n')}\n`, 'utf8');
console.log(summary);
if (failures) process.exit(1);
