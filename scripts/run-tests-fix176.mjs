#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX176_TESTY.log');
const suites=['scripts/run-tests-fix167.mjs','scripts/test-fix175-professional-academy.mjs','scripts/test-fix176-global-academy-fallback.mjs','scripts/test-photo-publication-contract-fix131.mjs'];
const syntax=['WEB_PUBLISH/assets/academy-professional-repair-fix175.js','WEB_PUBLISH/assets/global-academy-suite-fix60.js','WEB_PUBLISH/assets/global-academy-expansion-fix73.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js','WEB_PUBLISH/service-worker.js','scripts/test-fix175-professional-academy.mjs','scripts/test-fix176-global-academy-fallback.mjs','scripts/test-photo-publication-contract-fix131.mjs','scripts/photo-catalog-publication-contract-fix115.cjs','scripts/run-tests-fix176.mjs'];
let report=`NAUKA OD A DO Z — FIX176 / GLOBAL ACADEMY RESCUE + FIX168–FIX175 PROFESSIONAL ACADEMY\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed=0;
for(const relative of suites){
 const result=spawnSync(process.execPath,[path.join(ROOT,relative)],{cwd:ROOT,encoding:'utf8',timeout:900000,windowsHide:true,maxBuffer:64*1024*1024,env:{...process.env,CI:'1'}});
 report+=`===== ${relative} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
 if(result.error||result.status!==0)failed++;
}
for(const relative of syntax){
 const result=spawnSync(process.execPath,['--check',path.join(ROOT,relative)],{cwd:ROOT,encoding:'utf8',timeout:30000});
 report+=`===== SYNTAX ${relative} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
 if(result.error||result.status!==0)failed++;
}
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');process.stdout.write(report);process.exitCode=failed===0?0:1;
