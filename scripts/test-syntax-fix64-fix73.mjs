import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Every discovered script is checked. A small worker pool avoids launching 300+ Node processes serially.
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);
const ROOT = path.resolve(SCRIPT_DIR, '..');
const SKIP = new Set(['node_modules', 'TOOLS_CLOUDFLARE', 'BACKUPS_D1', '.git', '.wrangler']);
const js = [], css = [], json = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP.has(ent.name)) walk(full); continue; }
    if (!ent.isFile()) continue;
    const rel = path.relative(ROOT, full);
    if (/\.(?:js|mjs|cjs)$/i.test(ent.name)) js.push({ full, rel });
    else if (/\.css$/i.test(ent.name)) css.push({ full, rel });
    else if (/\.(?:json|webmanifest)$/i.test(ent.name)) json.push({ full, rel });
  }
}
walk(ROOT);
function checkScript(file) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['--check', file.full], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', finished = false;
    const timer = setTimeout(() => { if (!finished) { child.kill('SIGKILL'); finish(new Error('timeout 30s')); } }, 30000);
    function finish(error) {
      if (finished) return;
      finished = true; clearTimeout(timer);
      resolve({ file: file.rel, error: error || (child.exitCode === 0 ? null : new Error(stderr || stdout || `exit ${child.exitCode}`)) });
    }
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', finish);
    child.on('close', code => finish(code === 0 ? null : new Error(stderr || stdout || `exit ${code}`)));
  });
}
let cursor = 0;
const failures = [];
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= js.length) return;
    const result = await checkScript(js[index]);
    if (result.error) failures.push(`${result.file}: ${result.error.message}`);
  }
}
await Promise.all(Array.from({ length: Math.min(8, js.length) }, () => worker()));
for (const file of css) {
  const source = fs.readFileSync(file.full, 'utf8');
  const opens = (source.match(/\{/g) || []).length, closes = (source.match(/\}/g) || []).length;
  if (opens !== closes) failures.push(`${file.rel}: CSS brace count ${opens}/${closes}`);
}
for (const file of json) {
  try { JSON.parse(fs.readFileSync(file.full, 'utf8')); }
  catch (error) { failures.push(`${file.rel}: ${error.message}`); }
}
assert.deepEqual(failures, [], failures.join('\n'));
console.log(`[PASS] FIX64–FIX73 syntax: ${js.length} JS/MJS/CJS, ${css.length} CSS, ${json.length} JSON/webmanifest (8 równoległych kontroli).`);
