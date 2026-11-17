#!/usr/bin/env node
'use strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const root=process.cwd();
const tasks=[
  ['Regresja dotychczasowej Akademii i FIX176–FIX180','scripts/run-tests-fix180.mjs'],
  ['Audyt faktycznej integracji, duplikatów i działania FIX181','scripts/test-fix181-deployment-migration-refurb.mjs']
];
let failed=false;const log=[];
for(const [label,file] of tasks){
  const header=`\n===== ${label} =====\n`;process.stdout.write(header);log.push(header);
  const r=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:32*1024*1024});
  const output=(r.stdout||'')+(r.stderr||'');process.stdout.write(output);log.push(output);
  if(r.error||r.status!==0){failed=true;log.push(`\n[FAIL] ${file}: ${r.error?.message||`exit ${r.status}`}\n`);}
}
const status=failed?'FAIL':'PASS';
const ending=`\nNAUKA OD A DO Z 6.8.0 FIX181 FULL REGRESSION: ${status}\n`;
process.stdout.write(ending);log.push(ending);
fs.writeFileSync(path.join(root,'FIX181_FULL_TESTS.log'),log.join(''),'utf8');
if(failed)process.exit(1);
