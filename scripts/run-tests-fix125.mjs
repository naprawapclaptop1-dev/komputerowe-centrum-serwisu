#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'LOGI');
const LOG_FILE = path.join(ROOT, 'RAPORT_FIX127_TESTY.log');
const tests = [
  'scripts/test-support-video-fix124.mjs',
  'scripts/test-support-video-fix126-contract.mjs',
  'scripts/test-support-page-contract-620.js',
  'scripts/test-support-video-fix9.js',
  'scripts/test-sitewide-tech-visuals-fix123.mjs',
  'scripts/test-homepage-tech-only-fix122.mjs',
  'scripts/test-homepage-showcase-fix80.mjs',
  'scripts/test-watcher-homepage-showcase-fix32.mjs',
  'scripts/test-photo-uniqueness-fix77.mjs',
  'scripts/test-homepage-photo-library-fix118.mjs',
  'scripts/test-homepage-photo-prime-registration-fix117.mjs',
  'scripts/test-photo-catalog-publication-contract-fix115.mjs',
  'scripts/test-electronics-simulators-fix119.mjs',
  'scripts/test-service-worker-fix79.mjs',
  'scripts/test-oneclick-release-scope-fix115.mjs',
  'scripts/test-release-contract-fix51.mjs',
  'scripts/test-home-specialist-containment-fix115.mjs',
  'scripts/test-photo-topic-quality-fix115.mjs',
  'scripts/test-photo-provider-recovery-fix111.mjs',
  'scripts/test-active-view-photo-queue-fix111.mjs',
  'scripts/test-node-runtime-discovery-fix101.mjs',
  'scripts/test-repair-photo-layout-fix87.mjs',
  'scripts/test-photo-method-renderer-fix106.mjs',
  'scripts/test-fix110-service-worker-publication-guard.mjs',
  'scripts/test-master-academy-asset-version-fix121.mjs',
  'scripts/test-product-name-openai-setup-fix126.mjs'
];
let report = `NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX127 — TESTY REGRESYJNE\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed = 0;
for (const test of tests) {
  const full = path.join(ROOT, test);
  if (!fs.existsSync(full)) {
    report += `[FAIL] Brak pliku testu: ${test}\n`;
    failed++;
    continue;
  }
  const result = spawnSync(process.execPath, [full], { cwd: ROOT, encoding: 'utf8', timeout: 120000, windowsHide: true });
  report += `===== ${test} =====\n${result.stdout || ''}${result.stderr || ''}\nKod: ${result.status ?? 'brak'}\n\n`;
  if (result.status !== 0) failed++;
}
report += `WYNIK: ${tests.length - failed}/${tests.length} skryptów zakończonych poprawnie.\n`;
report += failed === 0 ? 'STATUS: PASS\n' : 'STATUS: FAIL\n';
fs.mkdirSync(LOG_DIR, { recursive: true });
fs.writeFileSync(LOG_FILE, report, 'utf8');
process.stdout.write(report);
process.exitCode = failed === 0 ? 0 : 1;
