#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX162_TESTY.log');
const scripts=[
 'scripts/run-tests-fix136.mjs',
 'scripts/test-publisher-photo-cache-guard-fix137.mjs',
 'scripts/test-fix144-hero-allowlist.mjs',
 'scripts/test-fix145-academy-hub.mjs',
 'scripts/test-view-count-fix61.mjs',
 'scripts/test-support-view-guard-fix35.js',
 'scripts/test-fix147-publisher-lesson-count.mjs',
 'scripts/test-fix148-master-technician-suite.mjs',
 'scripts/test-fix149-advanced-training.mjs',
 'scripts/test-fix150-publisher-release-scope.mjs',
 'scripts/test-fix155-practical-suite.mjs',
 'scripts/test-pages-function-residue-fix133.mjs',
 'scripts/test-fix162-master-technician-curriculum.mjs'
];
let report=`NAUKA OD A DO Z — REGRESJA BAZOWA FIX136–FIX162 (uruchamiana przez FIX163)\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed=0;
for(const script of scripts){
 const result=spawnSync(process.execPath,[path.join(ROOT,script)],{cwd:ROOT,encoding:'utf8',timeout:900000,windowsHide:true,maxBuffer:24*1024*1024,env:{...process.env,CI:'1'}});
 report+=`===== ${script} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
 if(result.error||result.status!==0)failed++;
}
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');process.stdout.write(report);process.exitCode=failed===0?0:1;
