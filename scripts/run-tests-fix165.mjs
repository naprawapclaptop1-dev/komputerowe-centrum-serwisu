#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX166_TESTY.log');
const suites=['scripts/run-tests-fix164.mjs','scripts/test-gemini-fast-key-check-fix165.mjs','scripts/test-gemini-publisher-guard-fix166.mjs'];
const syntax=['scripts/configure-gemini-secret.js','scripts/test-gemini-fast-key-check-fix165.mjs','scripts/test-gemini-publisher-guard-fix166.mjs','scripts/run-tests-fix165.mjs','functions/api/chat.js','ONECLICK_AKADEMIA.js','AUTO_PUBLISH_WATCHER.js'];
let report=`NAUKA OD A DO Z — PUBLISHER FIX166 / WEBSITE RUNTIME FIX165 — GEMINI GUARD REGRESSION\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
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
fs.writeFileSync(LOG,report,'utf8');
process.stdout.write(report);
process.exitCode=failed===0?0:1;
