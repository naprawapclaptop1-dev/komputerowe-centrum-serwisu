#!/usr/bin/env node
'use strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const root=process.cwd();
// Preserve historical FIX179–FIX181 audit artifacts; the latest regression must not rewrite old release evidence.
const historical=[
 'FIX180_DUPLICATE_AUDIT.txt','FIX180_FULL_TESTS.log',
 'FIX181_DUPLICATE_AUDIT.txt','FIX181_EXISTING_VS_ADDED_AUDIT.txt','FIX181_FULL_TESTS.log'
];
const saved=new Map(historical.map(f=>[f,fs.existsSync(path.join(root,f))?fs.readFileSync(path.join(root,f)):null]));
const tasks=[
 ['Pełna regresja poprzedniej Akademii FIX176–FIX181','scripts/run-tests-fix181.mjs'],
 ['Audyt i testy rzeczywistego panelu FIX182','scripts/test-fix182-specialist-systems.mjs']
];
let failed=false;const log=[];
try{
 for(const [label,file] of tasks){
  const head=`\n===== ${label} =====\n`;process.stdout.write(head);log.push(head);
  const r=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:240000,maxBuffer:48*1024*1024});
  const out=(r.stdout||'')+(r.stderr||'');process.stdout.write(out);log.push(out);
  if(r.error||r.status!==0){failed=true;const msg=`\n[FAIL] ${file}: ${r.error?.message||`exit ${r.status}`}\n`;log.push(msg);}
 }
} finally {
 for(const [f,bytes] of saved){const target=path.join(root,f);if(bytes===null){if(fs.existsSync(target))fs.unlinkSync(target);}else fs.writeFileSync(target,bytes);}
}
const end=`\nNAUKA OD A DO Z 6.8.0 FIX182 FULL REGRESSION: ${failed?'FAIL':'PASS'}\n`;
process.stdout.write(end);log.push(end);fs.writeFileSync(path.join(root,'FIX182_FULL_TESTS.log'),log.join(''),'utf8');
if(failed)process.exit(1);
