#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanupLegacyPhotoProxy } from './cleanup-pages-function-residue-fix133.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX135_TESTY.log');

// Safe preflight repair for upgrades extracted over an existing project folder.
// Preserve the obsolete helper outside functions/ before scanning Pages files.
let cleanupSummary='No legacy .mjs helper residue found.';
try {
 const cleanup=cleanupLegacyPhotoProxy(ROOT);
 if(cleanup.moved) cleanupSummary=`Legacy helper safely moved to ${cleanup.backup} (original bytes preserved).`;
} catch(error) {
 const report=`NAUKA OD A DO Z — 6.8.0 FIX135 — TESTY REGRESYJNE\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n[FAIL] FIX135 safe cleanup: ${error.stack||error.message}\nSTATUS: FAIL\n`;
 fs.writeFileSync(LOG,report,'utf8');
 process.stdout.write(report);
 process.exit(1);
}

const tests=[
 'scripts/test-pages-function-residue-fix133.mjs',
 'scripts/test-pages-function-extension-fix132.mjs',
 'scripts/test-support-page-contract-620.js',
 'scripts/test-support-video-fix9.js',
 'scripts/test-portable-sha256-fix127.mjs',
 'scripts/test-mp4-metadata-reader-fix126.mjs',
 'scripts/test-release-contract-fix51.mjs',
 'scripts/test-home-specialist-containment-fix115.mjs',
 'scripts/test-photo-method-renderer-fix106.mjs',
 'scripts/test-homepage-showcase-fix80.mjs',
 'scripts/test-watcher-homepage-showcase-fix32.mjs',
 'scripts/test-electronics-simulators-fix119.mjs',
 'scripts/test-photo-recovery-fix129.mjs',
 'scripts/test-photo-local-proxy-fix131.mjs',
 'scripts/test-photo-proxy-safe-redirects-fix134.mjs',
 'scripts/test-photo-publication-contract-fix131.mjs',
 'scripts/test-home-module-photo-coverage-fix135.mjs'
];
let report=`NAUKA OD A DO Z — 6.8.0 FIX135 — TESTY PUBLIKACJI I CZYSZCZENIA PO AKTUALIZACJI\nData: ${new Date().toISOString()}\nNode: ${process.version}\nPreflight cleanup: ${cleanupSummary}\n\n`;
let failed=0;
for(const rel of tests){
 const full=path.join(ROOT,rel);
 if(!fs.existsSync(full)){report+=`[FAIL] Brak pliku testu: ${rel}\n`;failed++;continue;}
 const r=spawnSync(process.execPath,[full],{cwd:ROOT,encoding:'utf8',timeout:120000,windowsHide:true,maxBuffer:8*1024*1024});
 report+=`===== ${rel} =====\n${r.stdout||''}${r.stderr||''}\nKod: ${r.status??'brak'}\n\n`;
 if(r.status!==0)failed++;
}
report+=`WYNIK: ${tests.length-failed}/${tests.length} skryptów zakończonych poprawnie.\n`;
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');
process.stdout.write(report);
process.exitCode=failed===0?0:1;
