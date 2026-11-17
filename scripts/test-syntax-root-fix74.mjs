import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const syntaxScriptUrl = new URL('./test-syntax-fix64-fix73.mjs', import.meta.url);
const syntaxScriptPath = fileURLToPath(syntaxScriptUrl);
const syntaxScriptDir = path.dirname(syntaxScriptPath);
const projectRoot = path.resolve(syntaxScriptDir, '..');

assert.equal(path.basename(syntaxScriptPath), 'test-syntax-fix64-fix73.mjs');
assert.equal(path.basename(syntaxScriptDir), 'scripts');
assert.ok(fs.existsSync(path.join(projectRoot, 'WEB_PUBLISH', 'index.html')), 'project root must contain WEB_PUBLISH/index.html');
assert.ok(fs.existsSync(path.join(projectRoot, 'migrations')), 'project root must contain migrations');

const source = fs.readFileSync(syntaxScriptPath, 'utf8');
assert.match(source, /fileURLToPath\(import\.meta\.url\)/, 'syntax checker must convert import.meta.url to a native path');
assert.doesNotMatch(source, /new URL\(import\.meta\.url\)\.pathname/, 'syntax checker must not use URL.pathname as a filesystem path');

const run = spawnSync(process.execPath, [syntaxScriptPath], { cwd: projectRoot, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
assert.equal(run.status, 0, `syntax checker must execute from its own file URL root.
${run.stdout || ''}
${run.stderr || ''}`);
assert.match(run.stdout, /FIX64–FIX73 syntax:/);
console.log('[PASS] FIX74 native file URL root: project path resolves once; syntax test runs from file location.');
