#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX130_TESTY.log');
const tests=[
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
 'scripts/test-photo-publication-guard-fix130.mjs',
 'scripts/test-photo-catalog-publication-contract-fix115.mjs'
];
let report=`NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX130 — TESTY PUBLIKACJI I ZDJĘĆ\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
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
