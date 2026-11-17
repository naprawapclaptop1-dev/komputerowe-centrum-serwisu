#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX136_TESTY.log');
const tests=[
 'scripts/test-pages-function-extension-fix132.mjs',
 'scripts/test-pages-function-residue-fix133.mjs',
 'scripts/test-support-page-contract-620.js',
 'scripts/test-support-video-fix9.js',
 'scripts/test-portable-sha256-fix127.mjs',
 'scripts/test-mp4-metadata-reader-fix126.mjs',
 'scripts/test-release-contract-fix51.mjs',
 'scripts/test-home-specialist-containment-fix115.mjs',
 'scripts/test-homepage-showcase-fix80.mjs',
 'scripts/test-watcher-homepage-showcase-fix32.mjs',
 'scripts/test-photo-publication-contract-fix131.mjs',
 'scripts/test-fix136-top-photo-priority-and-home-preservation.mjs',
 'scripts/test-fix136-practice-lessons.mjs',
 'scripts/test-fix136-release-integration.mjs'
];
let report=`NAUKA OD A DO Z — 6.8.0 FIX136 — TESTY REGRESYJNE I ZAKRES ZMIAN\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed=0;
for(const rel of tests){
 const full=path.join(ROOT,rel);
 if(!fs.existsSync(full)){report+=`===== ${rel} =====\n[FAIL] Brak pliku testu.\n\n`;failed++;continue;}
 const result=spawnSync(process.execPath,[full],{cwd:ROOT,encoding:'utf8',timeout:120000,windowsHide:true,maxBuffer:8*1024*1024});
 report+=`===== ${rel} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
 if(result.status!==0)failed++;
}
report+=`WYNIK: ${tests.length-failed}/${tests.length} testów zakończonych poprawnie.\n`;
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');
process.stdout.write(report);
process.exitCode=failed===0?0:1;
