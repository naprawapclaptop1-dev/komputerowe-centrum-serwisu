#!/usr/bin/env node
'use strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const historical=['FIX185_FULL_TESTS.log'];
const saved=new Map(historical.map(f=>[f,fs.existsSync(path.join(root,f))?fs.readFileSync(path.join(root,f)):null]));
const tasks=[
  ['Pełna regresja bazowej Akademii FIX176–FIX185','scripts/run-tests-fix185.mjs'],
  ['FIX186 — testy funkcji, importu, AI, kolektora, zabezpieczeń i integracji','scripts/test-fix186-practical-lab.mjs'],
  ['FIX186 — backend analizy zdjęć PCB AI i zgody prywatności','scripts/test-fix186-pcb-analysis-api.mjs'],
  ['FIX197 — Google, Microsoft, Facebook, GitHub i Discord; X wyłączony','scripts/test-fix197-five-oauth-providers.mjs']
];
let failed=false;const log=[];
try {
  for(const [label,file] of tasks){
    const head=`\n===== ${label} =====\n`;process.stdout.write(head);log.push(head);
    const r=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:1200000,maxBuffer:96*1024*1024,env:{...process.env,CI:'1'}});
    const out=(r.stdout||'')+(r.stderr||'');process.stdout.write(out);log.push(out);
    if(r.error||r.status!==0){failed=true;const msg=`\n[FAIL] ${file}: ${r.error?.message||`exit ${r.status}`}\n`;process.stderr.write(msg);log.push(msg);}
  }
} finally {
  for(const [f,bytes] of saved){const target=path.join(root,f);if(bytes===null){if(fs.existsSync(target))fs.unlinkSync(target);}else fs.writeFileSync(target,bytes);}
}
const end=`\nNAUKA OD A DO Z 6.8.0 FIX186 + FIX197 REGRESSION: ${failed?'FAIL':'PASS'}\n`;
process.stdout.write(end);log.push(end);fs.writeFileSync(path.join(root,'FIX186_FULL_TESTS.log'),log.join(''),'utf8');
if(failed)process.exit(1);
