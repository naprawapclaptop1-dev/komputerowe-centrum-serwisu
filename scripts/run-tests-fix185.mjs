#!/usr/bin/env node
'use strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const root=process.cwd();
const historical=[
 'FIX179_FULL_TESTS.log','FIX179_FILE_CHANGE_REPORT.txt',
 'FIX180_DUPLICATE_AUDIT.txt','FIX180_FULL_TESTS.log',
 'FIX181_DUPLICATE_AUDIT.txt','FIX181_EXISTING_VS_ADDED_AUDIT.txt','FIX181_FULL_TESTS.log',
 'FIX182_DUPLICATE_AUDIT.txt','FIX182_EXISTING_VS_ADDED_AUDIT.txt','FIX182_FULL_TESTS.log',
 'FIX183_DUPLICATE_AUDIT.txt','FIX183_EXISTING_VS_ADDED_AUDIT.txt','FIX183_ACTUAL_FUNCTIONAL_AUDIT.txt','FIX183_FULL_TESTS.log',
 'FIX184_DUPLICATE_AUDIT.txt','FIX184_ACTUAL_FUNCTIONAL_AUDIT.txt','FIX184_FULL_TESTS.log',
 'RAPORT_FIX136_TESTY.log','RAPORT_FIX162_TESTY.log','RAPORT_FIX163_TESTY.log','RAPORT_FIX164_TESTY.log','RAPORT_FIX166_TESTY.log','RAPORT_FIX167_TESTY.log','RAPORT_FIX176_TESTY.log'
];
const saved=new Map(historical.map(f=>[f,fs.existsSync(path.join(root,f))?fs.readFileSync(path.join(root,f)):null]));
const tasks=[
 ['Pełna regresja poprzednich wydań FIX176–FIX184','scripts/run-tests-fix184.mjs'],
 ['FIX185 — audyt duplikatów, integracji i rzeczywistego działania','scripts/test-fix185-performance-firmware.mjs']
];
let failed=false;const log=[];
try{
 for(const [label,file] of tasks){
  const head=`\n===== ${label} =====\n`;process.stdout.write(head);log.push(head);
  const r=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:64*1024*1024,env:{...process.env,CI:'1'}});
  const out=(r.stdout||'')+(r.stderr||'');process.stdout.write(out);log.push(out);
  if(r.error||r.status!==0){failed=true;const msg=`\n[FAIL] ${file}: ${r.error?.message||`exit ${r.status}`}\n`;process.stderr.write(msg);log.push(msg);}
 }
}finally{
 for(const [f,bytes] of saved){const target=path.join(root,f);if(bytes===null){if(fs.existsSync(target))fs.unlinkSync(target);}else fs.writeFileSync(target,bytes);}
}
const end=`\nNAUKA OD A DO Z 6.8.0 FIX185 FULL REGRESSION: ${failed?'FAIL':'PASS'}\n`;
process.stdout.write(end);log.push(end);fs.writeFileSync(path.join(root,'FIX185_FULL_TESTS.log'),log.join(''),'utf8');
if(failed)process.exit(1);
