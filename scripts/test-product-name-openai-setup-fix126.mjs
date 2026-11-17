#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cmd = fs.readFileSync(path.join(root, 'USTAW_KLUCZ_OPENAI.cmd'), 'utf8');
const js = fs.readFileSync(path.join(root, 'scripts', 'configure-openai-secret.js'), 'utf8');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const checks = [
  ['CMD uses the official Nauka od A do Z product name', cmd.includes('NAUKA OD A DO Z - USTAW KLUCZ OPENAI') && cmd.includes('standardowy start platformy NAUKA OD A DO Z') && !/AKADEMIA SERWISU PRO/i.test(cmd)],
  ['OpenAI setup page title and visible brand use the official product name', js.includes('<title>NAUKA OD A DO Z — konfiguracja OpenAI</title>') && js.includes('<strong>NAUKA OD A DO Z — DLA WSZYSTKICH</strong>')],
  ['OpenAI setup page copy uses the platform name', js.includes('platforma NAUKA OD A DO Z') && js.includes('plikach platformy NAUKA OD A DO Z')],
  ['OpenAI setup terminal output uses the official product name', js.includes('NAUKA OD A DO Z — DLA WSZYSTKICH — BEZPIECZNE OKNO KONFIGURACJI OPENAI') && !/AKADEMIA SERWISU PRO/i.test(js)],
  ['Product identity in release remains unchanged', release.release === '6.8.0' && release.latestHotfix === 'FIX128' && String(release.latestHotfixBuild || '').includes('fix128')]
];
for (const [name, ok] of checks) console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}`);
console.log(`FIX128 PRODUCT BRAND IN OPENAI SETUP: ${checks.filter(x => x[1]).length}/${checks.length} PASS`);
if (checks.some(x => !x[1])) process.exitCode = 1;
