#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX164_TESTY.log');
const suites=['scripts/run-tests-fix163.mjs','scripts/test-gemini-cmd-paste-fix164.mjs'];
let report=`NAUKA OD A DO Z — FIX164 — GEMINI CMD PASTE FIX\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed=0;
for(const relative of suites){
  const result=spawnSync(process.execPath,[path.join(ROOT,relative)],{cwd:ROOT,encoding:'utf8',timeout:900000,windowsHide:true,maxBuffer:48*1024*1024,env:{...process.env,CI:'1'}});
  report+=`===== ${relative} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
  if(result.error||result.status!==0)failed++;
}
for(const file of ['scripts/configure-gemini-secret.js','scripts/test-gemini-cmd-paste-fix164.mjs','scripts/run-tests-fix164.mjs','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js']){
  const result=spawnSync(process.execPath,['--check',path.join(ROOT,file)],{cwd:ROOT,encoding:'utf8',timeout:30000});
  report+=`===== SYNTAX ${file} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
  if(result.error||result.status!==0)failed++;
}
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');
process.stdout.write(report);
process.exitCode=failed===0?0:1;
