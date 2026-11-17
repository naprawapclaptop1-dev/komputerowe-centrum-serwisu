#!/usr/bin/env node
'use strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const tasks = [
  ['FIX197 — kontrakt pięciu OAuth, bez X', 'scripts/test-fix197-five-oauth-providers.mjs'],
  ['FIX197 — integracyjny przepływ OAuth: GitHub i Discord', 'scripts/test-social-login-fix18.mjs'],
  ['FIX197 — konfigurator sekretów', 'scripts/test-configure-oauth-wizard-fix18.mjs'],
  ['FIX197 — diagnostyka statusu i schematu OAuth', 'scripts/test-oauth-diagnostics-fix18b.mjs'],
  ['FIX197 — zabezpieczenia kont, TOTP, e-mail i sesje', 'scripts/test-account-security-fix19.js'],
  ['FIX196 — warsztat przestrzenny', 'scripts/test-fix196-3d-workshop.mjs'],
  ['FIX195 — laboratorium interaktywne', 'scripts/test-fix195-interactive-labs.mjs'],
  ['FIX186 — pełna regresja wcześniejszych modułów', 'scripts/run-tests-fix186.mjs']
];
const log = [];
let failed = false;
for (const [label, file] of tasks) {
  const header = `\n===== ${label} =====\n`;
  process.stdout.write(header); log.push(header);
  const result = spawnSync(process.execPath, [path.join(root, file)], { cwd: root, encoding: 'utf8', timeout: 1200000, maxBuffer: 96 * 1024 * 1024, env: { ...process.env, CI: '1' } });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output); log.push(output);
  if (result.error || result.status !== 0) {
    failed = true;
    const error = `[FAIL] ${file}: ${result.error?.message || `exit ${result.status}`}\n`;
    process.stderr.write(error); log.push(error);
    break;
  }
}
const summary = `\nNAUKA OD A DO Z 6.8.0 FIX197 FULL TESTS: ${failed ? 'FAIL' : 'PASS'}\n`;
process.stdout.write(summary); log.push(summary);
fs.writeFileSync(path.join(root, 'FIX197_FULL_TESTS.log'), log.join(''), 'utf8');
if (failed) process.exit(1);
