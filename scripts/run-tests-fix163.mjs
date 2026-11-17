#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LOG=path.join(ROOT,'RAPORT_FIX163_TESTY.log');
const scripts=[
  'scripts/run-tests-fix162.mjs',
  'scripts/test-gemini-cmd-setup-fix163.mjs',
  'scripts/test-gemini-chat-fix163.mjs',
  'scripts/test-node-resolver-fix105.mjs',
  'scripts/test-node-resolver-fix103.mjs',
  'scripts/test-node-runtime-discovery-fix100.mjs'
];
let report=`NAUKA OD A DO Z — FIX163 GEMINI ONLY / CMD KEY / COMPUTER-REPAIR SCOPE\nData: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
let failed=0;
for(const script of scripts){
  const result=spawnSync(process.execPath,[path.join(ROOT,script)],{cwd:ROOT,encoding:'utf8',timeout:900000,windowsHide:true,maxBuffer:32*1024*1024,env:{...process.env,CI:'1'}});
  report+=`===== ${script} =====\n${result.stdout||''}${result.stderr||''}\nKod: ${result.status??'brak'}\n\n`;
  if(result.error||result.status!==0)failed++;
}
report+=failed===0?'STATUS: PASS\n':'STATUS: FAIL\n';
fs.writeFileSync(LOG,report,'utf8');process.stdout.write(report);process.exitCode=failed===0?0:1;
